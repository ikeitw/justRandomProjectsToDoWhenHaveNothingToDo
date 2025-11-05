// ===== helpers =====
function fmtbps(bps){
  const units = ["b/s","Kb/s","Mb/s","Gb/s","Tb/s"];
  let v = bps, i=0;
  while (v>=1000 && i<units.length-1){ v/=1000; i++; }
  const d = v>=100 ? 0 : v>=10 ? 1 : 2;
  return `${v.toFixed(d)} ${units[i]}`;
}
function fmtbytes(b){
  const u = ["B","KB","MB","GB","TB"]; let v=b, i=0;
  while (v>=1024 && i<u.length-1){ v/=1024; i++; }
  const d = v>=100 ? 0 : v>=10 ? 1 : 2;
  return `${v.toFixed(d)} ${u[i]}`;
}

// ===== state =====
let WINDOW = 60;
const BUFFER_MAX = 86400;
const buf = [];

const rateUp   = document.getElementById("rateUp");
const rateDown = document.getElementById("rateDown");
const winBytes = document.getElementById("winBytes");
const appsList = document.getElementById("appsList");
const appsTotals = document.getElementById("appsTotals");
const windowPills = document.getElementById("windowPills");

// ===== chart setup =====
const svg = d3.select("#chart");
const root = svg.append("g");
const gridG = root.append("g");
const axesG = root.append("g");
const plotG = root.append("g");
const areaDown = plotG.append("path").attr("fill","#48b8ff33");
const lineUp   = plotG.append("path").attr("fill","none").attr("stroke","#a98bff").attr("stroke-width",2);
const lineDown = plotG.append("path").attr("fill","none").attr("stroke","#6fbfff").attr("stroke-width",2);
const labelsG  = root.append("g");

let W=0,H=0;
const M = {top:28, right:28, bottom:44, left:72};

function resize(){
  const n = svg.node();
  W = n.clientWidth; H = n.clientHeight;
  svg.attr("viewBox",`0 0 ${W} ${H}`);
  root.attr("transform",`translate(0,0)`);
  draw();
}
window.addEventListener("resize", resize); resize();

function windowSlice(){
  const cutoff = Date.now() - WINDOW*1000;
  return buf.filter(p => p.ts >= cutoff);
}

function draw(){
  const data = windowSlice();
  if (data.length < 2) return;

  const innerW = Math.max(100, W - M.left - M.right);
  const innerH = Math.max(80, H - M.top - M.bottom);

  const now = new Date();
  const start = new Date(now.getTime() - WINDOW*1000);

  const x = d3.scaleTime()
    .domain([start, now])
    .range([M.left, M.left + innerW]);

  const maxY = Math.max(1, d3.max(data, d => Math.max(d.up_bps, d.down_bps)));
  const y = d3.scaleLinear()
    .domain([0, maxY * 1.20])
    .nice(6)
    .range([M.top + innerH, M.top]);

  const area = d3.area()
    .x(d => x(d.ts))
    .y0(M.top + innerH)
    .y1(d => y(d.down_bps))
    .curve(d3.curveMonotoneX);

  const lineGen = d3.line()
    .x(d => x(d.ts))
    .y(d => y(d.v))
    .curve(d3.curveMonotoneX);

  areaDown.attr("d", area(data));
  lineUp.attr("d", lineGen(data.map(d => ({ts:d.ts, v:d.up_bps}))));
  lineDown.attr("d", lineGen(data.map(d => ({ts:d.ts, v:d.down_bps}))));

  gridG.selectAll("*").remove();
  gridG.append("g")
    .attr("transform",`translate(0,${M.top + innerH})`)
    .call(
      d3.axisBottom(x)
        .ticks(6)
        .tickSize(-innerH)
        .tickFormat("")
    );

  gridG.append("g")
    .attr("transform",`translate(${M.left},0)`)
    .call(
      d3.axisLeft(y)
        .ticks(6)
        .tickSize(-innerW)
        .tickFormat("")
    );

  gridG.selectAll("line").attr("stroke","#18202c");
  gridG.selectAll("path").attr("stroke","#18202c");

  axesG.selectAll("*").remove();

  axesG.append("g")
    .attr("transform",`translate(${M.left},0)`)
    .call(
      d3.axisLeft(y)
        .ticks(6)
        .tickFormat(v => fmtbps(v))
    )
    .selectAll("text").attr("fill","#cfe1ff");

  function tickSpec(winSec){
    if (winSec <= 30)    return {unit:"second", every:5,    fmt:d3.timeFormat("%H:%M:%S")};
    if (winSec <= 60)    return {unit:"second", every:10,   fmt:d3.timeFormat("%H:%M:%S")};
    if (winSec <= 300)   return {unit:"minute", every:1,    fmt:d3.timeFormat("%H:%M")};
    if (winSec <= 1800)  return {unit:"minute", every:5,    fmt:d3.timeFormat("%H:%M")};
    if (winSec <= 3600)  return {unit:"minute", every:10,   fmt:d3.timeFormat("%H:%M")};
    if (winSec <= 21600) return {unit:"hour",   every:1,    fmt:d3.timeFormat("%H:%M")};
    return                {unit:"hour",   every:4,    fmt:d3.timeFormat("%H:%M")};
  }

  const spec = tickSpec(WINDOW);

  let tickTimes;
  if (spec.unit === "second") {
    tickTimes = d3.timeSecond.every(spec.every).range(start, now);
  } else if (spec.unit === "minute") {
    tickTimes = d3.timeMinute.every(spec.every).range(start, now);
  } else {
    tickTimes = d3.timeHour.every(spec.every).range(start, now);
  }

  if (tickTimes.length === 0 || +tickTimes[tickTimes.length - 1] !== +now) {
    tickTimes.push(now);
  }

  const gx = axesG.append("g")
    .attr("transform",`translate(0,${M.top + innerH})`)
    .call(
      d3.axisBottom(x)
        .tickValues(tickTimes)
        .tickFormat(t => spec.fmt(t))
    );

  gx.selectAll("text").attr("fill","#cfe1ff");

  gx.selectAll(".tick:last-child text")
    .text(spec.fmt(now) + " now")
    .attr("fill", "#9fb0d4");

  // --- LABELS ---
  labelsG.selectAll("*").remove();

  labelsG.append("text")
    .attr("x", M.left - 50).attr("y", M.top)
    .attr("transform",`rotate(-90 ${M.left - 50},${M.top})`)
    .attr("fill","#9fb0d4")
    .attr("font-size","12px");

  labelsG.append("text")
    .attr("x", M.left + innerW - 30)
    .attr("y", M.top + innerH + 30)
    .attr("fill","#9fb0d4")
    .attr("font-size","12px");
}

// ===== window buttons (unchanged logic) =====
for (const btn of windowPills.querySelectorAll("button.pill")){
  btn.onclick = async (e)=>{
    for (const b of windowPills.querySelectorAll("button.pill")) b.classList.remove("active");
    e.currentTarget.classList.add("active");
    WINDOW = parseInt(e.currentTarget.dataset.w, 10);

    const r = await fetch(`/series?window=${WINDOW}`);
    const s = await r.json();
    const seen = new Set(buf.map(p=>p.ts.valueOf()));
    for (const p of s){
      if (!seen.has(p.ts)){
        buf.push({ ts:new Date(p.ts), up_bps:p.up_bps, down_bps:p.down_bps });
      }
    }
    while (buf.length > BUFFER_MAX) buf.shift();

    await updateSummary();
    draw();
  };
}

// ===== panels =====
async function updateSummary(){
  const r = await fetch(`/summary?window=${WINDOW}&top=50`);
  const { totals, apps } = await r.json();

  winBytes.textContent = `Window: ↑ ${fmtbytes(totals.up_bytes)} · ↓ ${fmtbytes(totals.down_bytes)}`;

  appsList.innerHTML = "";
  const max = Math.max(1, ...apps.map(a => a.total || 0));
  apps.forEach(a=>{
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div>
        ${a.name || "unknown"} <span class="muted">· PID ${a.pid}</span>
        <div class="bar"><i style="width:${(100*(a.total||0)/max).toFixed(1)}%"></i></div>
      </div>
      <div class="muted" style="text-align:right">
        ↑ ${fmtbytes(a.up||0)}<br/>↓ ${fmtbytes(a.down||0)}
      </div>`;
    appsList.appendChild(el);
  });

  const totalsBox = document.getElementById("appsTotals");
  totalsBox.innerHTML = "";
  apps.forEach(a=>{
    const row = document.createElement("div");
    row.className = "total-row";
    row.innerHTML = `<div class="name">${a.name || "unknown"} <span class="muted">· PID ${a.pid}</span></div>
                     <div class="val">${fmtbytes((a.total||0))}</div>`;
    totalsBox.appendChild(row);
  });
}

// ===== live ticks =====
(function(){
  const proto = (location.protocol === "https:") ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/ws/ticks`);

  ws.onmessage = (ev)=>{
    const { ts, up_bps, down_bps } = JSON.parse(ev.data);
    buf.push({ ts:new Date(ts), up_bps, down_bps });
    while (buf.length > BUFFER_MAX) buf.shift();

    rateUp.textContent   = `↑ ${fmtbps(up_bps)}`;
    rateDown.textContent = `↓ ${fmtbps(down_bps)}`;

    draw();
  };

  ws.onopen = async ()=>{
    try{
      const r = await fetch(`/series?window=${WINDOW}`);
      const s = await r.json();
      s.forEach(p => buf.push({ ts:new Date(p.ts), up_bps:p.up_bps, down_bps:p.down_bps }));
      await updateSummary();
      draw();
    }catch(_){}
  };

  setInterval(updateSummary, 3000);
})();
