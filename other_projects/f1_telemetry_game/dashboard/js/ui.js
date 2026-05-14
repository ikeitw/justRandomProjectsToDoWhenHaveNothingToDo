// ui.js
// DOM update functions - called whenever telemetry snapshot arrives

const MAX_RPM = 12000;

// dom helpers

const $ = (id) => document.getElementById(id);

function setText(id, val) {
  const e = $(id);
  if (e) e.textContent = val;
}

function setWidth(id, pct) {
  const e = $(id);
  if (e) e.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

// connection status and loading overlay

// toggle LIVE / OFFLINE indicator
export function setOnline(online) {
  const badge = $('status-badge');
  const text  = $('status-text');
  badge.classList.toggle('live', online);
  text.textContent = online ? 'LIVE' : 'OFFLINE';
}

// show or hide loading overlay
export function showWaiting(show) {
  $('waiting').classList.toggle('hidden', !show);
}

// temperature color indicators

function tyreTempClass(t) {
  if (t < 70)  return 'temp-cold';
  if (t < 100) return 'temp-ok';
  if (t < 120) return 'temp-warm';
  return 'temp-hot';
}

function brakeTempClass(t) {
  if (t < 200) return 'temp-cold';
  if (t < 500) return 'temp-ok';
  if (t < 800) return 'temp-warm';
  return 'temp-hot';
}

function setTyreTemp(suffix, temp) {
  const e = $(`tt-${suffix}`);
  if (!e) return;
  e.textContent = `${temp}°`;
  e.className = `tyre-temp ${tyreTempClass(temp)}`;
}

function setBrakeTemp(suffix, temp) {
  const e = $(`bt-${suffix}`);
  if (!e) return;
  e.textContent = `${temp}°`;
  e.className = `tyre-temp ${brakeTempClass(temp)}`;
}

// rev light indicators

const revLights = document.querySelectorAll('.rev-light');

function updateRevLights(pct) {
  const on = Math.round((pct / 100) * revLights.length);
  revLights.forEach((light, i) => {
    light.className = 'rev-light';
    if (i >= on) return;
    if (i < 5)        light.classList.add('active-g');
    else if (i < 8)   light.classList.add('active-y');
    else if (pct >= 100) light.classList.add('blink-r');
    else              light.classList.add('active-r');
  });
}

// gear display formatting

function gearLabel(g) {
  if (g === 0)  return 'N';
  if (g === -1) return 'R';
  return String(g);
}

// highlight current sector

function highlightSector(sector) {
  [1, 2, 3].forEach((n) => {
    const b = $(`s-block-${n}`);
    if (b) b.classList.toggle('active', n === sector + 1);
  });
}

// tyre compound handling

const COMPOUND_CLASSES = {
  Soft:   'comp-soft',
  Medium: 'comp-medium',
  Hard:   'comp-hard',
  Inter:  'comp-inter',
  Wet:    'comp-wet',
};

function updateCompound(name, age) {
  const circle = $('compound-circle');
  if (!circle) return;

  circle.className = '';
  circle.textContent = name[0] ?? '?';

  const cls = Object.entries(COMPOUND_CLASSES).find(([k]) => name.includes(k))?.[1];
  if (cls) circle.classList.add(cls);

  setText('compound-name', name);
  setText('compound-age', `${age} laps old`);
}

// flag indicators

const FLAG_MAP = {
  1: ['flag-green',  '🟢 GREEN'],
  2: ['flag-blue',   '🔵 BLUE'],
  3: ['flag-yellow', '🟡 YELLOW'],
  4: ['flag-red',    '🔴 RED FLAG'],
};

function updateFlag(fiaFlag) {
  const badge = $('flag-indicator');
  badge.className = 'flag-indicator';

  const info = FLAG_MAP[fiaFlag];
  if (info) {
    badge.classList.add(info[0]);
    badge.textContent = info[1];
  } else {
    badge.textContent = '⬤ NO FLAG';
  }
}

// damage display

function setDamage(id, pct) {
  const fill = $(id);
  const val  = $(`${id}-v`);
  if (!fill || !val) return;

  const p = Math.min(100, Math.max(0, pct));
  fill.style.width = `${p}%`;
  val.textContent  = `${p}%`;
  fill.style.background =
    p < 30 ? 'var(--green)' :
    p < 60 ? 'var(--yellow)' : 'var(--accent)';
}

// telemetry packet handler

function applyTelemetry(t) {
  setText('speed-display', t.speed);
  setText('gear-display', gearLabel(t.gear));
  setText('rpm-value', `${t.rpm.toLocaleString()} RPM`);
  setWidth('rpm-bar-fill', (t.rpm / MAX_RPM) * 100);
  updateRevLights(t.revLightsPercent);

  // Pedals
  $('p-throttle').style.height = `${t.throttle}%`;
  $('p-brake').style.height    = `${t.brake}%`;
  $('p-clutch').style.height   = `${t.clutch}%`;
  setText('v-throttle', `${Math.round(t.throttle)}%`);
  setText('v-brake',    `${Math.round(t.brake)}%`);
  setText('v-clutch',   `${Math.round(t.clutch)}%`);

  // Steering — value is -100..100, map to 0..100% cursor position
  const steerNorm = (t.steer + 100) / 200;
  $('steer-cursor').style.left = `${steerNorm * 100}%`;
  setText('v-steer', `${Math.round(t.steer)}°`);

  // DRS
  $('drs-badge').classList.toggle('active', t.drs > 0);

  // Tyre surface temps [RL, RR, FL, FR]
  if (t.tyreSurfaceTemp?.length >= 4) {
    setTyreTemp('rl', t.tyreSurfaceTemp[0]);
    setTyreTemp('rr', t.tyreSurfaceTemp[1]);
    setTyreTemp('fl', t.tyreSurfaceTemp[2]);
    setTyreTemp('fr', t.tyreSurfaceTemp[3]);
  }

  // Brake temps [RL, RR, FL, FR]
  if (t.brakesTemp?.length >= 4) {
    setBrakeTemp('rl', t.brakesTemp[0]);
    setBrakeTemp('rr', t.brakesTemp[1]);
    setBrakeTemp('fl', t.brakesTemp[2]);
    setBrakeTemp('fr', t.brakesTemp[3]);
  }

  setText('engine-temp', `${t.engineTemp ?? '—'}°C`);
}

// lap data packet handler

function applyLap(l) {
  const curEl = $('t-current');
  curEl.textContent = l.currentLapTime;
  curEl.classList.toggle('invalid', l.lapInvalid);

  setText('t-last', l.lastLapTime);
  setText('t-s1',   l.sector1Time);
  setText('t-s2',   l.sector2Time);
  setText('s-t1',   l.sector1Time);
  setText('s-t2',   l.sector2Time);

  setText('pos-val', l.carPosition || '—');
  setText('lap-val', l.currentLap  || '—');

  setText('b-pits', l.pitStatus > 0 ? 'IN PIT' : `${l.numPitStops ?? 0} stops`);
  setText('b-pen',  `${l.penalties || 0}s`);
  setText('b-trap', l.speedTrapFastest > 0 ? `${l.speedTrapFastest} km/h` : '—');

  highlightSector(l.sector);
  $('pit-badge').classList.toggle('active', l.pitStatus === 1);
  updateFlag(l.driverStatus);
}

// car status packet handler

function applyStatus(s) {
  updateCompound(s.tyreCompound, s.tyresAgeLaps);

  // ERS
  setText('ers-pct-val', `${s.ersPct}%`);
  setWidth('ers-bar', s.ersPct);
  setText('ers-mode', s.ersDeployMode);

  // Fuel
  setText('fuel-value', s.fuelInTank);
  setText('fuel-laps',  `${s.fuelRemainingLaps} laps`);
  const fuelPct = s.fuelCapacity > 0 ? (s.fuelInTank / s.fuelCapacity) * 100 : 0;
  setWidth('fuel-bar', fuelPct);

  // Flags & accessories
  updateFlag(s.fiaFlags);
  if (s.pitLimiter !== undefined) {
    $('pit-badge').classList.toggle('active', s.pitLimiter);
  }
  setText('b-bias', `${s.frontBrakeBias}%`);
}

// damage packet handler

function applyDamage(d) {
  setDamage('d-flw', d.frontLeftWing);
  setDamage('d-frw', d.frontRightWing);
  setDamage('d-rw',  d.rearWing);
  setDamage('d-eng', d.engineDamage);
  setDamage('d-gbx', d.gearboxDamage);

  // Tyre wear [RL, RR, FL, FR]
  if (d.tyresWear?.length >= 4) {
    setText('tw-rl', `${d.tyresWear[0]}%`);
    setText('tw-rr', `${d.tyresWear[1]}%`);
    setText('tw-fl', `${d.tyresWear[2]}%`);
    setText('tw-fr', `${d.tyresWear[3]}%`);
  }
}

// session packet handler

function applySession(ss) {
  setText('track-name',        ss.trackId);
  setText('weather-badge',     ss.weather);
  setText('session-type-badge', ss.sessionType);
  setText('b-track',   ss.trackId);
  setText('b-weather', ss.weather);
  setText('b-ttemp',   `${ss.trackTemp}°C`);
  setText('b-atemp',   `${ss.airTemp}°C`);
  setText('total-laps-val', ss.totalLaps || '—');
}

// main state dispatcher - apply all telemetry data to the DOM
export function applyState(state) {
  if (state.telemetry) applyTelemetry(state.telemetry);
  if (state.lap)       applyLap(state.lap);
  if (state.status)    applyStatus(state.status);
  if (state.damage)    applyDamage(state.damage);
  if (state.session)   applySession(state.session);
}