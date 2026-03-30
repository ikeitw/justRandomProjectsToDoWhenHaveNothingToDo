// history.js
// Session history browser
// Uses REST API endpoints from run.py to fetch data

const API = `http://${location.hostname}:8080`;

// utility functions

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

function msToTime(ms) {
  if (!ms || ms <= 0) return '—';
  const totalS  = Math.floor(ms / 1000);
  const msPart  = ms % 1000;
  const minutes = Math.floor(totalS / 60);
  const seconds = totalS % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(msPart).padStart(3, '0')}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function sessionTypeClass(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('race'))     return 'race';
  if (t.includes('quali'))    return 'quali';
  if (t.includes('practice')) return 'practice';
  if (t.includes('sprint'))   return 'sprint';
  return '';
}

function tyreClass(compound) {
  const c = (compound || '').replace(/\s.*/, ''); // first word
  return ['Soft','Medium','Hard','Inter','Wet'].includes(c) ? c : 'unknown';
}

// session list state and rendering

let _activeSessionId = null;

async function loadSessionList() {
  const [sessions, records] = await Promise.all([
    apiFetch('/api/sessions'),
    apiFetch('/api/records').catch(() => []),
  ]);

  // Update count
  document.getElementById('session-count').textContent =
    `${sessions.length} session${sessions.length !== 1 ? 's' : ''} stored`;

  // All-time records strip
  renderRecords(records);

  // Session cards
  const list = document.getElementById('session-list');
  if (sessions.length === 0) {
    list.innerHTML = '<div class="empty-state">No sessions recorded yet.<br>Start F1 25 with telemetry on.</div>';
    return;
  }

  list.innerHTML = sessions.map(s => {
    const typeClass = sessionTypeClass(s.session_type);
    const bestTime  = msToTime(s.best_lap_ms);
    return `
      <div class="session-card" data-id="${s.id}">
        <div class="sc-top">
          <div class="sc-track">${s.track}</div>
          <div class="sc-type ${typeClass}">${s.session_type}</div>
        </div>
        <div class="sc-meta">
          <span>📅 ${fmtDate(s.started_at)}</span>
          <span>🔄 ${s.lap_count} laps</span>
        </div>
        ${s.best_lap_ms ? `<div class="sc-best">⚡ ${bestTime}</div>` : ''}
      </div>
    `;
  }).join('');

  list.querySelectorAll('.session-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.session-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      loadSessionDetail(Number(card.dataset.id));
    });
  });

  // Auto-select most recent
  if (sessions.length > 0) {
    const first = list.querySelector('.session-card');
    first?.click();
  }
}

function renderRecords(records) {
  const strip = document.getElementById('records-strip');
  const list  = document.getElementById('records-list');
  if (!records || records.length === 0) return;

  list.innerHTML = records.slice(0, 5).map(r => `
    <div class="record-row">
      <div>
        <div class="record-track">${r.track}</div>
        <div class="record-type">${r.session_type}</div>
      </div>
      <div class="record-time">${msToTime(r.lap_time_ms)}</div>
    </div>
  `).join('');

  strip.classList.remove('hidden');
}

// load and render session details

async function loadSessionDetail(sessionId) {
  if (_activeSessionId === sessionId) return;
  _activeSessionId = sessionId;

  const detail = document.getElementById('session-detail');
  detail.innerHTML = '<div class="empty-state">Loading…</div>';

  const [session, laps, sectors] = await Promise.all([
    apiFetch(`/api/sessions/${sessionId}`),
    apiFetch(`/api/sessions/${sessionId}/laps`),
    apiFetch(`/api/sessions/${sessionId}/best-sectors`),
  ]);

  if (!session) {
    detail.innerHTML = '<div class="empty-state">Session not found.</div>';
    return;
  }

  const fastestLap   = laps.find(l => l.is_fastest && l.is_valid);
  const validLaps    = laps.filter(l => l.is_valid && l.lap_time_ms);
  const avgLapMs     = validLaps.length
    ? Math.round(validLaps.reduce((a, l) => a + l.lap_time_ms, 0) / validLaps.length)
    : null;

  detail.innerHTML = `
    <!-- Summary cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="sc-label">Track</div>
        <div class="sc-value" style="font-size:16px">${session.track}</div>
        <div class="sc-sub">${session.session_type}</div>
      </div>
      <div class="summary-card">
        <div class="sc-label">Best Lap</div>
        <div class="sc-value purple">${fastestLap ? msToTime(fastestLap.lap_time_ms) : '—'}</div>
        <div class="sc-sub">Lap ${fastestLap ? fastestLap.lap_number : '—'} · ${fastestLap ? (fastestLap.tyre_compound || '—') : '—'}</div>
      </div>
      <div class="summary-card">
        <div class="sc-label">Laps Completed</div>
        <div class="sc-value yellow">${laps.length}</div>
        <div class="sc-sub">${validLaps.length} valid</div>
      </div>
      <div class="summary-card">
        <div class="sc-label">Average Lap</div>
        <div class="sc-value">${msToTime(avgLapMs)}</div>
        <div class="sc-sub">valid laps only</div>
      </div>
      <div class="summary-card">
        <div class="sc-label">Weather</div>
        <div class="sc-value" style="font-size:14px">${session.weather || '—'}</div>
        <div class="sc-sub">${session.track_length_m ? session.track_length_m + ' m' : ''}</div>
      </div>
      <div class="summary-card">
        <div class="sc-label">Date</div>
        <div class="sc-value" style="font-size:12px;font-family:var(--font-main)">${fmtDate(session.started_at)}</div>
        <div class="sc-sub">${session.ended_at ? 'Ended ' + fmtDate(session.ended_at) : 'No end recorded'}</div>
      </div>
    </div>

    <!-- Sector bests -->
    ${renderSectorBests(sectors)}

    <!-- Lap time chart -->
    ${renderChart(laps, fastestLap)}

    <!-- Lap table -->
    ${renderLapTable(laps, fastestLap)}
  `;
}

function renderSectorBests(sectors) {
  if (!sectors || (!sectors.sector1_ms && !sectors.sector2_ms && !sectors.sector3_ms)) return '';
  return `
    <div class="section-title"><span>◈</span> BEST SECTORS (theoretical: ${msToTime(sectors.theoretical_ms)})</div>
    <div class="sector-bests">
      <div class="sector-best-card">
        <div class="sb-label">SECTOR 1</div>
        <div class="sb-time">${msToTime(sectors.sector1_ms)}</div>
        <div class="sb-note">personal best</div>
      </div>
      <div class="sector-best-card">
        <div class="sb-label">SECTOR 2</div>
        <div class="sb-time">${msToTime(sectors.sector2_ms)}</div>
        <div class="sb-note">personal best</div>
      </div>
      <div class="sector-best-card">
        <div class="sb-label">SECTOR 3</div>
        <div class="sb-time">${msToTime(sectors.sector3_ms)}</div>
        <div class="sb-note">personal best</div>
      </div>
    </div>
  `;
}

function renderChart(laps, fastestLap) {
  const withTime = laps.filter(l => l.lap_time_ms > 0);
  if (withTime.length < 2) return '';

  const min = Math.min(...withTime.map(l => l.lap_time_ms));
  const max = Math.max(...withTime.map(l => l.lap_time_ms));
  const range = max - min || 1;

  const bars = withTime.map(lap => {
    const heightPct = 20 + ((lap.lap_time_ms - min) / range) * 80;
    const isFastest = fastestLap && lap.id === fastestLap.id;
    const isInvalid = !lap.is_valid;
    const cls = isFastest ? 'fastest-bar' : isInvalid ? 'invalid-bar' : '';
    return `
      <div class="chart-bar ${cls}" style="height:${heightPct}%">
        <div class="bar-tip">L${lap.lap_number} ${msToTime(lap.lap_time_ms)}${isInvalid ? ' ✗' : ''}</div>
      </div>`;
  }).join('');

  return `
    <div class="section-title"><span>◈</span> LAP TIME CHART</div>
    <div class="lap-chart panel" style="padding:12px">
      <div class="chart-bars">${bars}</div>
    </div>
  `;
}

function renderLapTable(laps, fastestLap) {
  if (laps.length === 0) {
    return '<div class="empty-state">No laps recorded for this session.</div>';
  }

  const fastestMs = fastestLap?.lap_time_ms;

  // Compute best (lowest) time per sector across all laps that have the value
  const _best = arr => { const v = Math.min(...arr.filter(v => v > 0)); return isFinite(v) ? v : null; };
  const bestS1 = _best(laps.map(l => l.sector1_ms));
  const bestS2 = _best(laps.map(l => l.sector2_ms));
  const bestS3 = _best(laps.map(l => l.sector3_ms));

  const rows = laps.map(lap => {
    const isFastest = fastestLap && lap.id === fastestLap.id;
    const isInvalid = !lap.is_valid;
    const rowClass  = isFastest ? 'fastest' : isInvalid ? 'invalid' : '';

    const deltaMs = (lap.lap_time_ms && fastestMs && !isFastest)
      ? lap.lap_time_ms - fastestMs : null;
    const deltaStr = deltaMs !== null
      ? (deltaMs > 0 ? `+${msToTime(deltaMs)}` : msToTime(-deltaMs))
      : (isFastest ? '🏆' : '—');
    const deltaCls = deltaMs !== null ? (deltaMs > 0 ? 'positive' : 'negative') : '';

    const tClass = tyreClass(lap.tyre_compound);
    const tyreName = (lap.tyre_compound || '').replace('Dry ', '').replace(' (', ' ').replace(')', '') || '—';

    const flags = [
      !lap.is_valid ? '✗ INVALID' : '',
      lap.pit_stop_after ? '🔧 PIT' : '',
    ].filter(Boolean).join(' ');

    const s1Class = (lap.sector1_ms > 0 && lap.sector1_ms === bestS1) ? 'sector best-sector' : 'sector';
    const s2Class = (lap.sector2_ms > 0 && lap.sector2_ms === bestS2) ? 'sector best-sector' : 'sector';
    const s3Class = (lap.sector3_ms > 0 && lap.sector3_ms === bestS3) ? 'sector best-sector' : 'sector';

    return `
      <tr class="${rowClass}">
        <td class="lap-num">${lap.lap_number}</td>
        <td class="lap-time ${isFastest ? 'fastest-cell' : ''}">${msToTime(lap.lap_time_ms)}</td>
        <td class="${s1Class}">${msToTime(lap.sector1_ms)}</td>
        <td class="${s2Class}">${msToTime(lap.sector2_ms)}</td>
        <td class="${s3Class}">${msToTime(lap.sector3_ms)}</td>
        <td><span class="tyre-badge ${tClass}">${tyreName}</span> <span style="color:var(--muted);font-size:10px">+${lap.tyre_age_laps ?? 0}</span></td>
        <td>${lap.fuel_kg ? lap.fuel_kg.toFixed(1) + ' kg' : '—'}</td>
        <td class="delta ${deltaCls}">${deltaStr}</td>
        <td class="flags">${flags}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="section-title"><span>◈</span> LAP BREAKDOWN</div>
    <div class="panel" style="padding:0;overflow:hidden">
      <table class="lap-table">
        <thead>
          <tr>
            <th>Lap</th>
            <th>Time</th>
            <th>S1</th>
            <th>S2</th>
            <th>S3</th>
            <th>Tyre</th>
            <th>Fuel</th>
            <th>Δ Best</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// load sessions on page load

loadSessionList().catch(err => {
  document.getElementById('session-list').innerHTML =
    `<div class="empty-state" style="color:var(--accent)">
      Could not reach server.<br>
      Make sure run.py is running.
      <br><br><small>${err.message}</small>
    </div>`;
});