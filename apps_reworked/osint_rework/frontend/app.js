const $ = (s) => document.querySelector(s);
const out = $("#output");
const statusEl = $("#status");

function setStatus(msg){ statusEl.textContent = msg; }

function section(title, innerHTML){
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `<h2>${title}</h2>${innerHTML}`;
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

async function fetchJSON(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

async function runRecon(){
  out.innerHTML = "";
  const target = $("#target").value.trim();
  if(!target){ setStatus("Enter a target first."); return; }
  setStatus("Running recon...");

  const run = {
    ip: $("#m-ip").checked,
    dns: $("#m-dns").checked,
    whois: $("#m-whois").checked,
    sub: $("#m-sub").checked,
    ports: $("#m-ports").checked,
    http: $("#m-http").checked,
  };

  const report = { target, timestamp: new Date().toISOString(), results: {} };

  try{
    if(run.ip){
      const r = await fetchJSON(`/api/ipinfo?target=${encodeURIComponent(target)}`);
      report.results.ipinfo = r;
      section("IP Info", kv(r));
    }

    const domainCandidate = (target || "").replace(/^https?:\/\//,"").split("/")[0];

    if(run.dns){
      const r = await fetchJSON(`/api/dns_records?domain=${encodeURIComponent(domainCandidate)}`);
      report.results.dns = r;
      section("DNS Records", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(run.whois){
      const whoisResp = await fetchJSON(`/api/dns_records?domain=${encodeURIComponent(domainCandidate)}`);
      section("WHOIS (domain - minimal)", `<pre>${JSON.stringify(whoisResp.records?.NS ? { domain: domainCandidate, name_servers: whoisResp.records.NS } : { domain: domainCandidate }, null, 2)}</pre>`);
    }

    if(run.sub){
      const r = await fetchJSON(`/api/subdomains?domain=${encodeURIComponent(domainCandidate)}&limit=100`);
      report.results.subdomains = r;
      section("Subdomain Brute", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(run.ports){
      const host = report?.results?.ipinfo?.ip || domainCandidate;
      const r = await fetchJSON(`/api/scan_ports?host=${encodeURIComponent(host)}&mode=common`);
      report.results.ports = r;
      section("Port Scan (common)", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(run.http){
      const r = await fetchJSON(`/api/http_headers?url=${encodeURIComponent(target)}&method=HEAD`);
      report.results.http_headers = r;
      const rows = Object.entries(r.headers||{}).map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join("");
      section("HTTP Headers", `<table class="table"><tbody>${rows}</tbody></table>`);
    }

    window.__lastReport = report;
    setStatus("Done.");
  }catch(e){
    console.error(e);
    setStatus("Error while running recon. Check console.");
    section("Error", `<pre class="bad">${String(e)}</pre>`);
  }
}

async function exportReport(){
  const payload = window.__lastReport || { note:"No report yet." };
  const r = await fetch("/api/export", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  if(!r.ok){
    const t = await r.text();
    return alert("Export failed: " + t);
  }
  const j = await r.json();
  if(j.download){
    setStatus("Exported JSON. Opening...");
    window.open(j.download, "_blank");
  }else{
    alert("Export ok but no file path returned.");
  }
}

$("#btn-run").addEventListener("click", runRecon);
$("#btn-export").addEventListener("click", exportReport);

$("#target").addEventListener("keydown", (e)=>{
  if(e.key === "Enter"){ runRecon(); }
});

fetch("/api/ping").then(()=>setStatus("Ready.")).catch(()=>setStatus("Backend not responding."));
