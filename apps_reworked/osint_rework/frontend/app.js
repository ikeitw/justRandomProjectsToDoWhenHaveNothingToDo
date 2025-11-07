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

function escapeHtml(s){
  if(!s) return "";
  return s.replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
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
      const who = await fetchJSON(`/api/dns_records?domain=${encodeURIComponent(domainCandidate)}`);
      section("WHOIS (domain - minimal)", `<pre>${JSON.stringify(who.records?.NS ? { domain: domainCandidate, name_servers: who.records.NS } : { domain: domainCandidate }, null, 2)}</pre>`);
    }

    if(run.sub){
      const r = await fetchJSON(`/api/subdomains?domain=${encodeURIComponent(domainCandidate)}&limit=200&sources=brute,crtsh`);
      report.results.subdomains = r;
      const rows = r.subdomains.map(s=>`<tr><td>${s.subdomain}</td><td>${s.ip4||""}</td><td>${s.ip6||""}</td><td>${s.source||""}</td></tr>`).join("");
      section("Subdomains", `<table class="table"><thead><tr><th>Subdomain</th><th>IPv4</th><th>IPv6</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table>`);
    }

    if(run.ports){
      const host = report?.results?.ipinfo?.ip || domainCandidate;
      const r = await fetchJSON(`/api/scan_ports?host=${encodeURIComponent(host)}&mode=common&banner=false`);
      report.results.ports = r;
      section("Port Scan (common)", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(run.http){
      const q = `/api/http_headers?url=${encodeURIComponent(target)}&method=HEAD&fetch_html=false&robots=false&sitemap=false`;
      const r = await fetchJSON(q);
      report.results.http_headers = r;
      const rows = Object.entries(r.headers||{}).map(([k,v])=>`<tr><th>${k}</th><td>${escapeHtml(String(v))}</td></tr>`).join("");
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


async function runPentestSuite(quick=false){
  out.innerHTML = "";
  const target = $("#pt-target").value.trim();
  if(!target){ setStatus("Enter a target for pentest."); return; }
  setStatus("Running pentest probes...");

  const modules = {
    param: $("#pt-param").checked,
    js: $("#pt-js").checked,
    dir: $("#pt-dir").checked,
    waf: $("#pt-waf").checked,
    cors: $("#pt-cors").checked,
    redirect: $("#pt-redirect").checked,
    xss: $("#pt-xss").checked,
    sqli: $("#pt-sqli").checked,
    ssrf: $("#pt-ssrf").checked,
    auth: $("#pt-auth").checked,
    api: $("#pt-api").checked,
    robots: $("#pt-robots").checked,
    favicon: $("#pt-favicon").checked,
    tls: $("#pt-tls").checked,
    errors: $("#pt-errors").checked,
    session: $("#pt-session").checked,
    upload: $("#pt-upload").checked,
    csp: $("#pt-csp").checked,
    summary: $("#pt-summary").checked
  };

  const report = { target, timestamp: new Date().toISOString(), results: {} };

  try{
    if(quick){
      const res = await fetchJSON(`/api/pentest/summary?target=${encodeURIComponent(target)}`);
      report.results.summary = res;
      section("Pentest — Quick Summary", `<pre>${JSON.stringify(res, null, 2)}</pre>`);
      setStatus("Pentest quick done.");
      window.__lastPentest = report;
      return;
    }

    if(modules.param){
      const r = await fetchJSON(`/api/pentest/param_probe?target=${encodeURIComponent(target)}`);
      report.results.param = r;
      section("Parameter Discovery", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.js){
      const r = await fetchJSON(`/api/pentest/js_scan?target=${encodeURIComponent(target)}`);
      report.results.js = r;
      section("JavaScript Scanner", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.dir){
      const r = await fetchJSON(`/api/pentest/dir_brute?target=${encodeURIComponent(target)}`);
      report.results.dir = r;
      section("Directory Bruteforce (safe)", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.waf){
      const r = await fetchJSON(`/api/pentest/waf_detect?target=${encodeURIComponent(target)}`);
      report.results.waf = r;
      section("WAF Detection", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.cors){
      const r = await fetchJSON(`/api/pentest/cors?target=${encodeURIComponent(target)}`);
      report.results.cors = r;
      section("CORS Checks", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.redirect){
      const r = await fetchJSON(`/api/pentest/open_redirect?target=${encodeURIComponent(target)}`);
      report.results.redirects = r;
      section("Open Redirect Checks", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.xss){
      const r = await fetchJSON(`/api/pentest/xss_probe?target=${encodeURIComponent(target)}`);
      report.results.xss = r;
      section("XSS Probe (safe reflections)", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.sqli){
      const r = await fetchJSON(`/api/pentest/sqli_probe?target=${encodeURIComponent(target)}`);
      report.results.sqli = r;
      section("SQLi Probe (safe)", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.ssrf){
      const r = await fetchJSON(`/api/pentest/ssrf_probe?target=${encodeURIComponent(target)}`);
      report.results.ssrf = r;
      section("SSRF Probe (safe)", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.auth){
      const r = await fetchJSON(`/api/pentest/auth_find?target=${encodeURIComponent(target)}`);
      report.results.auth = r;
      section("Auth Discovery", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.api){
      const r = await fetchJSON(`/api/pentest/api_discover?target=${encodeURIComponent(target)}`);
      report.results.api = r;
      section("API Discovery (Swagger/GraphQL)", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.robots){
      const r = await fetchJSON(`/api/pentest/robots_analysis?target=${encodeURIComponent(target)}`);
      report.results.robots = r;
      section("Robots Analysis", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.favicon){
      const r = await fetchJSON(`/api/pentest/favicon?target=${encodeURIComponent(target)}`);
      report.results.favicon = r;
      section("Favicon Hash", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.tls){
      const r = await fetchJSON(`/api/pentest/tls_info?target=${encodeURIComponent(target)}`);
      report.results.tls = r;
      section("TLS Info", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.errors){
      const r = await fetchJSON(`/api/pentest/error_analysis?target=${encodeURIComponent(target)}`);
      report.results.errors = r;
      section("Error Page Analysis", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.session){
      const r = await fetchJSON(`/api/pentest/session?target=${encodeURIComponent(target)}`);
      report.results.session = r;
      section("Session / Cookie Analysis", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.upload){
      const r = await fetchJSON(`/api/pentest/upload_forms?target=${encodeURIComponent(target)}`);
      report.results.uploads = r;
      section("Upload Forms Detection", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.csp){
      const r = await fetchJSON(`/api/pentest/csp?target=${encodeURIComponent(target)}`);
      report.results.csp = r;
      section("CSP Analysis", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    if(modules.summary){
      const r = await fetchJSON(`/api/pentest/summary?target=${encodeURIComponent(target)}`);
      report.results.summary = r;
      section("Pentest Summary", `<pre>${JSON.stringify(r, null, 2)}</pre>`);
    }

    window.__lastPentest = report;
    setStatus("Pentest probes finished.");
  }catch(e){
    console.error(e);
    setStatus("Error during pentest. Check console.");
    section("Error", `<pre class="bad">${String(e)}</pre>`);
  }
}

document.querySelectorAll(".tabbtn").forEach(b=>{
  b.addEventListener("click", ()=>{
    document.querySelectorAll(".tabbtn").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    const t = b.dataset.tab;
    if(t === "osint"){
      $("#osint-controls").classList.remove("hidden");
      $("#pentest-controls").classList.add("hidden");
    }else{
      $("#osint-controls").classList.add("hidden");
      $("#pentest-controls").classList.remove("hidden");
    }
  });
});

$("#btn-run").addEventListener("click", runRecon);
$("#btn-export").addEventListener("click", async ()=>{
  const payload = window.__lastReport || window.__lastPentest || { note:"No report yet." };
  const fmt = $("#export-format").value;
  const include_html = fmt === "zip";
  const project = $("#export-project").value.trim();
  const redact = $("#export-redact").checked ? "true" : "false";
  const url = `/api/export?format=${encodeURIComponent(fmt)}&include_html=${include_html}&redact=${redact}` + (project?`&project=${encodeURIComponent(project)}`:"");
  const r = await fetch(url, { method:"POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
  if(!r.ok){ alert("Export failed: " + await r.text()); return; }
  const j = await r.json();
  if(j.download){ window.open(j.download, "_blank"); setStatus("Export ready."); }
});

$("#btn-pt-run").addEventListener("click", ()=>runPentestSuite(false));
$("#btn-pt-run-quick").addEventListener("click", ()=>runPentestSuite(true));

$("#target").addEventListener("keydown", (e)=>{ if(e.key === "Enter") runRecon(); });
$("#pt-target").addEventListener("keydown", (e)=>{ if(e.key === "Enter") runPentestSuite(); });

fetch("/api/ping").then(()=>setStatus("Ready.")).catch(()=>setStatus("Backend not responding."));
