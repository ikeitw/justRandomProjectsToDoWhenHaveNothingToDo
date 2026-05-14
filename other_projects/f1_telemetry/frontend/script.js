// ════════════════════════════════════════════════════════════════════════════
//  F1 Live Dashboard — Client Logic
// ════════════════════════════════════════════════════════════════════════════

// ── Config ────────────────────────────────────────────────────────────────────
const WS_URL   = `ws://${location.host}/ws`;
const LERP     = 0.13;      // smoothing factor per frame
const FPS      = 60;
const FRAME_MS = 1000 / FPS;

// ── State ─────────────────────────────────────────────────────────────────────
let state   = null;      // latest snapshot from server
let drivers = {};        // { num: { cur_x, cur_y, tgt_x, tgt_y, ...} }
let trackPts = [];       // [[x,y], ...] normalised to canvas space
let trackBBox = null;    // transform params: { meanX, meanY, cosA, sinA, minX, minY, rangeX, rangeY, scale, pad }

// ── Canvas setup ──────────────────────────────────────────────────────────────
const canvas = document.getElementById('track-canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  const pane = document.getElementById('track-pane');
  const w = pane.clientWidth;
  const h = pane.clientHeight;
  canvas.width  = w;
  canvas.height = h;
  trackPts = [];     // force recomputation
  trackBBox = null;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Coordinate transform ──────────────────────────────────────────────────────
function computeTrackPoints(rawPts) {
  if (!rawPts || rawPts.length < 10) return [];

  const n = rawPts.length;

  // 1. Centroid
  const meanX = rawPts.reduce((s, p) => s + p[0], 0) / n;
  const meanY = rawPts.reduce((s, p) => s + p[1], 0) / n;

  // 2. PCA — find the principal axis of the point cloud
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of rawPts) {
    const dx = p[0] - meanX, dy = p[1] - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);

  // 3. Try 0° and 90° offset — pick whichever fills the canvas better
  const pad = 60;
  const W = canvas.width  - pad * 2;
  const H = canvas.height - pad * 2;

  function tryAngle(a) {
    const ca = Math.cos(-a), sa = Math.sin(-a);
    const rot = rawPts.map(p => {
      const dx = p[0] - meanX, dy = p[1] - meanY;
      return [dx * ca - dy * sa, dx * sa + dy * ca];
    });
    const xs = rot.map(p => p[0]), ys = rot.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rX = maxX - minX || 1, rY = maxY - minY || 1;
    const scale = Math.min(W / rX, H / rY);
    return { ca, sa, minX, minY, rX, rY, scale };
  }

  const t0  = tryAngle(angle);
  const t90 = tryAngle(angle + Math.PI / 2);
  const t   = t90.scale > t0.scale ? t90 : t0;

  trackBBox = { meanX, meanY, ...t, pad, W, H };

  return rawPts.map(p => worldToCanvas(p[0], p[1]));
}

function worldToCanvas(wx, wy) {
  if (!trackBBox) return [canvas.width / 2, canvas.height / 2];
  const { meanX, meanY, ca, sa, minX, minY, rX, rY, scale, pad, W, H } = trackBBox;
  const dx = wx - meanX, dy = wy - meanY;
  // Rotate into principal-axis space
  const rx =  dx * ca - dy * sa;
  const ry =  dx * sa + dy * ca;
  // Centre the track inside the padded box
  const extraX = (W - rX * scale) / 2;
  const extraY = (H - rY * scale) / 2;
  return [
    pad + extraX + (rx - minX) * scale,
    // Flip Y: F1 coords are math-space (Y up), canvas is Y down
    canvas.height - pad - extraY - (ry - minY) * scale,
  ];
}

// ── Draw the track ────────────────────────────────────────────────────────────
function drawTrack() {
  if (trackPts.length < 5) return;

  // Sort points into a continuous path using nearest-neighbour (done once on load)
  // Here we draw the accumulated path directly
  ctx.save();
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';

  // Outer glow
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth   = 18;
  _drawSmoothPath(trackPts);
  ctx.stroke();

  // Kerb stripe
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth   = 12;
  _drawSmoothPath(trackPts);
  ctx.stroke();

  // Tarmac
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth   = 3;
  _drawSmoothPath(trackPts);
  ctx.stroke();

  ctx.restore();
}

function _drawSmoothPath(pts) {
  if (pts.length < 3) return;
  // Start at the midpoint between last and first point for a seamless loop
  const start = [
    (pts[pts.length - 1][0] + pts[0][0]) / 2,
    (pts[pts.length - 1][1] + pts[0][1]) / 2,
  ];
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    ctx.quadraticCurveTo(p0[0], p0[1], mid[0], mid[1]);
  }
  ctx.closePath();
}

// ── Draw all cars ─────────────────────────────────────────────────────────────
const COMPOUND_COLOURS = {
  SOFT: '#e8002d', MEDIUM: '#e8b300', HARD: '#c8c8c8',
  INTERMEDIATE: '#39b54a', WET: '#0067ff', UNKNOWN: '#666666',
};

function drawCars(snap) {
  if (!snap || !trackBBox) return;

  // Sort by position for z-order (leader on top)
  const sorted = Object.entries(drivers)
    .sort((a, b) => {
      const ta = snap.timing[a[0]], tb = snap.timing[b[0]];
      const pa = ta ? ta.position : 99;
      const pb = tb ? tb.position : 99;
      return pb - pa;   // draw leader last (on top)
    });

  for (const [num, dState] of sorted) {
    const dInfo   = snap.drivers[num];
    const dTiming = snap.timing[num];
    if (!dInfo || !dTiming) continue;

    const color  = dInfo.team_colour || '#fff';
    const abbr   = dInfo.abbreviation || num;
    const [cx, cy] = [dState.cur_x, dState.cur_y];

    const isLeader = dTiming.position === 1;

    ctx.save();

    // Outer halo for leader
    if (isLeader) {
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Car dot
    ctx.beginPath();
    ctx.arc(cx, cy, isLeader ? 8 : 6, 0, Math.PI * 2);
    ctx.fillStyle   = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 10;
    ctx.fill();
    ctx.shadowBlur  = 0;

    // Tyre compound dot (small)
    const compound = dTiming.compound || 'UNKNOWN';
    const tc = COMPOUND_COLOURS[compound] || '#666';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = tc;
    ctx.fill();

    // Label
    ctx.font         = `bold 9px 'IBM Plex Mono', monospace`;
    ctx.fillStyle    = '#fff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';

    // Label background pill
    const lw = ctx.measureText(abbr).width + 6;
    const lh = 12;
    const lx = cx - lw / 2;
    const ly = cy - 14;

    ctx.fillStyle    = color + 'cc';
    _roundRect(ctx, lx, ly, lw, lh, 2);
    ctx.fill();

    ctx.fillStyle    = '#fff';
    ctx.fillText(abbr, cx, cy - 5);

    ctx.restore();
  }
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── LERP / animation loop ─────────────────────────────────────────────────────
let lastFrame = 0;

function animationLoop(ts) {
  requestAnimationFrame(animationLoop);

  if (ts - lastFrame < FRAME_MS - 1) return;
  lastFrame = ts;

  if (!state) return;

  // Rebuild track points if needed
  if (state.track_loaded && state.track_points.length > 0 && trackPts.length === 0) {
    trackPts = computeTrackPoints(state.track_points);
  }

  // Smooth car positions
  for (const [num, pos] of Object.entries(state.positions || {})) {
    if (!trackBBox) continue;
    const [tx, ty] = worldToCanvas(pos.x, pos.y);
    if (!drivers[num]) {
      drivers[num] = { cur_x: tx, cur_y: ty, tgt_x: tx, tgt_y: ty };
    } else {
      drivers[num].tgt_x = tx;
      drivers[num].tgt_y = ty;
      drivers[num].cur_x += (tx - drivers[num].cur_x) * LERP;
      drivers[num].cur_y += (ty - drivers[num].cur_y) * LERP;
    }
  }

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw
  drawTrack();
  drawCars(state);
}

requestAnimationFrame(animationLoop);

// ── Leaderboard rendering ─────────────────────────────────────────────────────
const lb = document.getElementById('lb-body');
let rowCache = {};   // num → <div>

function renderLeaderboard(snap) {
  if (!snap) return;

  const drivers_data = snap.drivers || {};
  const timing_data  = snap.timing  || {};

  // Sort by position
  const order = Object.keys(timing_data).sort((a, b) => {
    return (timing_data[a]?.position ?? 99) - (timing_data[b]?.position ?? 99);
  });

  for (const num of order) {
    const d  = drivers_data[num];
    const t  = timing_data[num];
    if (!d || !t) continue;

    let row = rowCache[num];
    if (!row) {
      row = document.createElement('div');
      row.className = 'lb-row';
      row.dataset.num = num;
      lb.appendChild(row);
      rowCache[num] = row;
    }

    // Sort DOM order
    const expectedIndex = order.indexOf(num);
    const currentIndex  = Array.from(lb.children).indexOf(row);
    if (currentIndex !== expectedIndex) {
      lb.insertBefore(row, lb.children[expectedIndex] || null);
    }

    const color   = d.team_colour || '#888';
    const abbr    = d.abbreviation || num;
    const pos     = t.position ?? '--';
    const drs     = t.drs;
    const compound = t.compound || 'UNKNOWN';
    const tc       = COMPOUND_COLOURS[compound] || '#666';
    const cmpLetter = compound === 'INTERMEDIATE' ? 'I' : compound === 'UNKNOWN' ? '?' : compound[0];
    const delta    = t.position_change ?? 0;
    const gap      = t.gap_to_leader || (pos === 1 ? 'LEADER' : '--');
    const lastLap  = t.last_lap_time  || '--';
    const bestLap  = t.best_lap_time  || '--';
    const laps     = t.laps_completed ?? '--';
    const age      = t.tyre_age ?? 0;
    const inPit    = t.in_pit;
    const pitOut   = t.pit_out;
    const stopped  = t.stopped;
    const retired  = t.retired;
    const speed    = t.speed ?? 0;

    const [s1, s2, s3] = (t.sectors || [{},{},{}]).map(s => s || {});
    const sStatus = (s) => {
      if (s.status === 'OverallFastest')  return 'overall';
      if (s.status === 'PersonalFastest') return 'personal';
      return s.value ? 'slower' : '';
    };

    const pitTag   = inPit   ? '<span class="stint-sub" style="color:#ffaa00">PIT</span>'
                   : pitOut  ? '<span class="stint-sub" style="color:#00ccff">OUT</span>'
                   : stopped ? '<span class="stint-sub" style="color:#ff4444">STP</span>'
                   : retired ? '<span class="stint-sub" style="color:#ff4444">RTD</span>'
                   : '';

    const deltaSign = delta > 0 ? '+' : '';
    const deltaClass = delta > 0 ? 'pos' : delta < 0 ? 'neg' : '';
    const deltaStr = delta !== 0 ? `${deltaSign}${delta}` : '–';

    const lpBest = t.last_lap_personal_best;
    const lapCls = lpBest ? 'personal' : '';

    row.innerHTML = `
      <div class="pos-cell">
        <div class="pos-num" style="background:${color}">${pos}</div>
      </div>
      <div class="drv-cell">
        <span class="drv-abbr" style="color:${color}">${abbr}</span>
        <span class="drs-dot ${drs ? 'active' : ''}"></span>
      </div>
      <div class="tyre-cell">
        <div class="tyre-compound" style="background:${tc};color:${compound === 'HARD' ? '#111' : '#fff'}">${cmpLetter}</div>
        <div class="tyre-age">${age}L</div>
      </div>
      <div class="stint-cell">
        <div class="stint-laps">L ${laps}</div>
        ${pitTag}
      </div>
      <div class="delta-cell ${deltaClass}">${deltaStr}</div>
      <div class="gap-cell">${gap}</div>
      <div class="time-cell">
        <span class="time-main ${lapCls}">${lastLap}</span>
        <span class="time-sub">${bestLap}</span>
      </div>
      <div class="time-cell">
        <span class="time-main">${bestLap}</span>
      </div>
      <div class="sector-cell">
        <span class="sector-time ${sStatus(s1)}">${s1.value || '--'}</span>
        <div class="sector-bar"><div class="sector-bar-fill ${sStatus(s1)}" style="width:${s1.value ? 80 : 0}%"></div></div>
      </div>
      <div class="sector-cell">
        <span class="sector-time ${sStatus(s2)}">${s2.value || '--'}</span>
        <div class="sector-bar"><div class="sector-bar-fill ${sStatus(s2)}" style="width:${s2.value ? 80 : 0}%"></div></div>
      </div>
      <div class="sector-cell">
        <span class="sector-time ${sStatus(s3)}">${s3.value || '--'}</span>
        <div class="sector-bar"><div class="sector-bar-fill ${sStatus(s3)}" style="width:${s3.value ? 80 : 0}%"></div></div>
      </div>
    `;

    row.classList.toggle('in-pit',    inPit);
    row.classList.toggle('retired',   retired);
    row.classList.toggle('fastest-lap', lpBest);
    row.style.setProperty('--team-color', color);
  }
}

// ── Header updates ────────────────────────────────────────────────────────────
function updateHeader(snap) {
  if (!snap) return;

  document.getElementById('session-name').textContent = snap.session_name || 'F1 Live';
  document.getElementById('session-type').textContent = snap.session_type || '';

  const lapCur = snap.lap_count  || '--';
  const lapTot = snap.total_laps || '--';
  document.getElementById('lap-cur').textContent = lapCur;
  document.getElementById('lap-tot').textContent = lapTot;

  const badge = document.getElementById('track-status-badge');
  badge.textContent   = snap.track_status_label || '';
  badge.style.background = (snap.track_status_colour || '#39b54a') + '33';
  badge.style.color      = snap.track_status_colour || '#39b54a';
  badge.style.border     = `1px solid ${snap.track_status_colour || '#39b54a'}`;

  document.getElementById('demo-badge').style.display =
    snap.demo_mode ? 'flex' : 'none';

  const w = snap.weather || {};
  document.getElementById('trc-val').textContent  = w.TrackTemp  || '--';
  document.getElementById('air-val').textContent  = w.AirTemp    || '--';
  document.getElementById('hum-val').textContent  = w.Humidity   || '--';
  document.getElementById('wind-val').textContent = w.WindSpeed  || '--';
  document.getElementById('weather-icon').textContent = w.Rainfall ? '🌧' : '🌤';

  // Update ring offsets
  function setRing(id, val, max) {
    const ring = document.getElementById(id);
    if (!ring) return;
    const v = parseFloat(val) || 0;
    const pct = Math.min(1, v / max);
    const circ = 100.5;
    ring.style.strokeDashoffset = circ * (1 - pct);
  }
  setRing('ring-trc', w.TrackTemp, 60);
  setRing('ring-air', w.AirTemp,   40);
  setRing('ring-hum', w.Humidity, 100);
}

// ── Clock ─────────────────────────────────────────────────────────────────────
let sessionStart = null;

function tickClock() {
  if (!sessionStart) { sessionStart = Date.now(); }
  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  document.getElementById('timer').textContent = `${h}:${m}:${s}`;
}
setInterval(tickClock, 1000);

// ── WebSocket ─────────────────────────────────────────────────────────────────
const wsStatus  = document.getElementById('ws-status');
const overlay   = document.getElementById('connecting-overlay');
let ws          = null;
let reconnTimer = null;
let updateCount = 0;

function connect() {
  clearTimeout(reconnTimer);
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    wsStatus.className = 'connected';
    overlay.classList.add('hidden');
  };

  ws.onmessage = (ev) => {
    try {
      const snap = JSON.parse(ev.data);
      state = snap;

      // Throttle heavy DOM work: every 3rd message (~3 Hz) for leaderboard
      updateCount++;
      if (updateCount % 3 === 0) {
        renderLeaderboard(snap);
        updateHeader(snap);
      }
    } catch (e) { /* ignore malformed */ }
  };

  ws.onclose = ws.onerror = () => {
    wsStatus.className = '';
    overlay.classList.remove('hidden');
    reconnTimer = setTimeout(connect, 3000);
  };
}

connect();

