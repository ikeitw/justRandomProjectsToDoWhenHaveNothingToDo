const $ = (s)=>document.querySelector(s);
const out = $("#output");
const statusEl = $("#status");

function setStatus(msg){ statusEl.textContent = msg; }
function clear(){ out.innerHTML = ""; }
function card(title, html){
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `<h2>${title}</h2>${html}`;
  out.appendChild(el);
  return el;
}
function kv(obj){
  const rows = Object.entries(obj||{}).map(([k,v])=>{
    const val = typeof v === "object" ? `<pre>${JSON.stringify(v,null,2)}</pre>` : `${v}`;
    return `<div><strong>${k}</strong></div><div>${val}</div>`;
  }).join("");
  return `<div class="kv">${rows}</div>`;
}

let currentPath = null;

async function uploadAndAnalyze(){
  const f = $("#file").files[0];
  if(!f){ setStatus("Choose a file first."); return; }
  setStatus("Uploading...");
  const fd = new FormData();
  fd.append("file", f, f.name);
  const r = await fetch("/api/upload", { method:"POST", body: fd });
  if(!r.ok){ return alert(await r.text()); }
  const j = await r.json();
  currentPath = j.path;
  setStatus("Analyzing...");
  const a = await fetchJSON(`/api/analyze?path=${encodeURIComponent(currentPath)}`);
  renderAnalysis(a);
  window.__lastReport = a;
  setStatus("Done.");
}

async function fetchJSON(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

function entropyBar(v){
  const pct = Math.min(100, Math.max(0, (v/8)*100));
  return `<div class="entropy-bar"><div style="width:${pct}%; background:${v>=7.2?'#ef4444':v>=6.5?'#f59e0b':'#22c55e'}"></div></div>`;
}

async function renderHexPager(path, size){
  const PAGE = 4096;
  let offset = 0;
  const wrap = document.createElement("div");
  const hdr = document.createElement("div");
  const pre = document.createElement("pre");
  const btnPrev = document.createElement("button");
  const btnNext = document.createElement("button");
  btnPrev.textContent = "◀ Prev 4KB";
  btnNext.textContent = "Next 4KB ▶";
  btnPrev.className = "ghost";
  btnNext.className = "ghost";
  hdr.appendChild(btnPrev); hdr.appendChild(btnNext);
  wrap.appendChild(hdr); wrap.appendChild(pre);

  async function load(){
    const j = await fetchJSON(`/api/hex?path=${encodeURIComponent(path)}&offset=${offset}&length=${PAGE}`);
    pre.textContent = (j.lines||[]).join("\n");
    btnPrev.disabled = offset<=0;
    btnNext.disabled = (offset + j.length) >= size;
  }
  btnPrev.onclick = ()=>{ offset = Math.max(0, offset- PAGE); load(); };
  btnNext.onclick = ()=>{ offset = Math.min(size, offset+ PAGE); load(); };
  await load();
  return wrap;
}

function renderAnalysis(a){
  clear();

  // Summary / hashes
  const meta = {
    filename: a.filename,
    size: `${a.size} bytes`,
    created: a.metadata.created,
    modified: a.metadata.modified,
    mime: a.metadata.mime_detected || "",
    type_desc: a.metadata.type_desc || "",
    extension: a.metadata.extension || "",
  };
  card("Summary", kv(meta));
  card("Hashes", kv(a.hashes));

  const ecard = card("Entropy", `
    <div>Overall: ${a.entropy.overall} / 8.0</div>
    ${entropyBar(a.entropy.overall)}
    <p class="hint">High entropy (> 7.2) can suggest packing/obfuscation.</p>
  `);

  if(a.pe){
    card("PE Header (best-effort)", `<pre>${JSON.stringify(a.pe, null, 2)}</pre>`);
  }

  card("Strings Preview", `
    <div class="kv">
      <div><strong>ASCII count</strong></div><div>${a.strings_sample.ascii_count}</div>
      <div><strong>Unicode count</strong></div><div>${a.strings_sample.unicode_count}</div>
    </div>
    <h3>ASCII (first ${a.strings_sample.ascii_preview.length})</h3>
    <pre>${a.strings_sample.ascii_preview.map(x=>`[${x.offset}] ${x.s}`).join("\n")}</pre>
    <h3>Unicode (first ${a.strings_sample.unicode_preview.length})</h3>
    <pre>${a.strings_sample.unicode_preview.map(x=>`[${x.offset}] ${x.s}`).join("\n")}</pre>
  `);

  const sev = a.iocs.severity;
  card(`IOC Heuristics <span class="${sev==='high'?'bad':sev==='medium'?'warn':'ok'}">(${sev.toUpperCase()})</span>`,
       `<pre>${JSON.stringify(a.iocs.flags, null, 2)}</pre>`);

  const hex = card("Hex Viewer (paged 4KB)", `<div id="hexwrap"></div>`);
  renderHexPager(a.path, a.size).then(w => hex.querySelector("#hexwrap").replaceWith(w));
}

async function loadFullStrings(){
  if(!currentPath){ return alert("Analyze a file first."); }
  const minlen = parseInt($("#minlen").value||"4",10);
  const maxres = parseInt($("#maxres").value||"5000",10);
  setStatus("Loading full ASCII strings...");
  const ascii = await fetchJSON(`/api/strings?path=${encodeURIComponent(currentPath)}&kind=ascii&min_len=${minlen}&max_results=${maxres}`);
  const asc = card(`Full ASCII Strings (${ascii.count} total; showing ${ascii.items.length})`,
                   `<pre>${ascii.items.map(x=>`[${x.offset}] ${x.s}`).join("\n")}</pre>`);
  setStatus("Loading full Unicode strings...");
  const uni = await fetchJSON(`/api/strings?path=${encodeURIComponent(currentPath)}&kind=unicode&min_len=${minlen}&max_results=${Math.max(1000,Math.floor(maxres/2))}`);
  const uniC = card(`Full Unicode Strings (${uni.count} total; showing ${uni.items.length})`,
                   `<pre>${uni.items.map(x=>`[${x.offset}] ${x.s}`).join("\n")}</pre>`);
  setStatus("Done.");
}

async function exportReport(){
  const payload = window.__lastReport || { note:"No report yet." };
  const r = await fetch("/api/export", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  if(!r.ok){ return alert(await r.text()); }
  const j = await r.json();
  if(j.download){ window.open(j.download, "_blank"); }
}

$("#btn-upload").addEventListener("click", uploadAndAnalyze);
$("#btn-strings").addEventListener("click", loadFullStrings);
$("#btn-export").addEventListener("click", exportReport);

fetch("/api/").then(()=>setStatus("Ready.")).catch(()=>setStatus("Backend not responding."));
