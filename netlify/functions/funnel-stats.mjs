// website-playbook funnel v1: the owner's private report. GET /api/funnel?key=...&days=7[&from=YYYY-MM-DD&to=YYYY-MM-DD][&format=json|csv]
// Answers only with the secret key in the environment variable STATS_KEY (Netlify, scoped to Functions); 404 otherwise.
// Copy into netlify/functions/ next to track.mjs and report.mjs.
import { getStore } from "@netlify/blobs";
import { report } from "./report.mjs";

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
const SITE_NAME = "patystraffon.com";
// All sign-ups, then each form: the free 5 Levers course, the M Program waitlist, the course offer,
// the retreat list, the THRIVE mentorship, the book list; and purchases (the /thank-you page).
const GOALS = ["signup", "course", "waitlist", "offer", "retreat-list", "mentorship", "book-list", "purchase"];

function days(from, to) {
  const out = [], d = new Date(from + "T00:00:00Z"), end = new Date(to + "T00:00:00Z");
  while (d <= end && out.length < 120) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}

export default async (req) => {
  const u = new URL(req.url), key = u.searchParams.get("key") || "";
  const secret = Netlify.env.get("STATS_KEY") || "";
  if (!secret || key !== secret) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const today = new Date().toISOString().slice(0, 10);
  const n = Math.max(1, Math.min(120, Number(u.searchParams.get("days")) || 7));
  const to = /^\d{4}-\d{2}-\d{2}$/.test(u.searchParams.get("to") || "") ? u.searchParams.get("to") : today;
  const fromDefault = new Date(Date.parse(to + "T00:00:00Z") - (n - 1) * 86400000).toISOString().slice(0, 10);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(u.searchParams.get("from") || "") ? u.searchParams.get("from") : fromDefault;

  const store = getStore("funnel");
  const sessions = [];
  for (const day of days(from, to)) {
    for await (const page of store.list({ prefix: `s/${day}/`, paginate: true })) {
      const recs = await Promise.all(page.blobs.map((b) => store.get(b.key, { type: "json" })));
      for (const r of recs) if (r) sessions.push(r);
    }
  }
  const r = report(sessions, { goals: GOALS });
  const fmt = u.searchParams.get("format");
  const hdr = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  if (fmt === "json") return new Response(JSON.stringify({ from, to, ...r }, null, 1), { headers: { ...hdr, "Content-Type": "application/json" } });
  if (fmt === "csv") {
    const rows = [["section", "key", "measure", "value"]];
    for (const [k, v] of Object.entries(r.summary)) rows.push(["summary", "", k, v]);
    for (const s of r.bySource) for (const [k, v] of Object.entries(s)) if (k !== "source") rows.push(["source", s.source, k, v]);
    for (const c of r.byCampaign) for (const [k, v] of Object.entries(c)) if (k !== "sourceCampaign") rows.push(["campaign", c.sourceCampaign, k, v]);
    for (const p of r.pages) {
      rows.push(["page", p.page, "sessions", p.sessions], ["page", p.page, "exitRate", p.exitRate]);
      for (const [d, v] of Object.entries(p.depth)) rows.push(["page", p.page, `depth${d}`, v]);
      for (const s of p.sections) rows.push(["section", `${p.page}#${s.name}`, "reach", s.reach], ["section", `${p.page}#${s.name}`, "dropFromPrevious", s.dropFromPrevious ?? ""]);
    }
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new Response(csv, { headers: { ...hdr, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="funnel ${from} to ${to}.csv"` } });
  }

  const s = r.summary;
  const dl = (o) => Object.entries(o).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
  const pageHtml = r.pages.map((p) => `<h3>${esc(p.page)}</h3><dl><dt>Sessions</dt><dd>${p.sessions}</dd><dt>Entries</dt><dd>${p.entries}</dd><dt>Exit rate</dt><dd>${p.exitRate}%</dd><dt>Read to 50% / 100%</dt><dd>${p.depth[50]}% / ${p.depth[100]}%</dd></dl>`
    + (p.sections.length ? `<table><tr><th>Section</th><th>Reach</th><th>Drop</th></tr>${p.sections.map((x) => `<tr><td>${esc(x.name)}</td><td>${x.reach}%</td><td>${x.dropFromPrevious === null ? "" : x.dropFromPrevious + "%"}</td></tr>`).join("")}</table>` : "")).join("");
  const srcHtml = `<table><tr><th>Source / medium</th><th>Sessions</th><th>Bounce</th>${GOALS.map((g) => `<th>${esc(g)}</th>`).join("")}</tr>${r.bySource.map((x) => `<tr><td>${esc(x.source)}</td><td>${x.sessions}</td><td>${x.bounceRate}%</td>${GOALS.map((g) => `<td>${x[g]} (${x[g + "Rate"]}%)</td>`).join("")}</tr>`).join("")}</table>`;
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>Funnel: ${esc(SITE_NAME)}</title><style>body{margin:0;background:#f7f5f0;color:#1b1b1b;font-family:Georgia,serif;padding:2rem 16px}main{max-width:44rem;margin:0 auto}
h1{font-size:1.4rem}h2{font-size:1.1rem;margin-top:2rem;border-top:1px solid #ccc;padding-top:1rem}h3{font-size:1rem;margin:1.4rem 0 .4rem}dl{display:grid;grid-template-columns:1fr auto;gap:.3rem 1rem}dd{margin:0;font-weight:700;text-align:right}
table{border-collapse:collapse;width:100%;font-size:.92rem;display:block;overflow-x:auto}th,td{border-bottom:1px solid #ddd;padding:.3rem .5rem;text-align:left}p{color:#555;font-size:.85rem}</style></head><body><main>
<h1>${esc(SITE_NAME)}: reading and conversion, ${from} to ${to}</h1>
<dl><dt>Sessions</dt><dd>${s.sessions}</dd><dt>Unique visitors (browsers)</dt><dd>${s.uniqueVisitors}</dd><dt>Page views</dt><dd>${s.pageViews}</dd><dt>Pages per session</dt><dd>${s.pagesPerSession}</dd>
<dt>Bounce rate</dt><dd>${s.bounceRate}%</dd><dt>Engaged sessions</dt><dd>${s.engagedRate}%</dd><dt>Average visible time per session</dt><dd>${s.avgVisibleSeconds} s</dd>
${GOALS.map((g) => `<dt>${esc(g)} (rate)</dt><dd>${s[g + "s"]} (${s[g + "Rate"]}%)</dd>`).join("")}</dl>
<h2>Where visitors came from</h2>${srcHtml}
<h2>Pages and sections (where readers drop off)</h2>${pageHtml || "<p>No page views yet.</p>"}
<h2>Devices</h2><dl>${dl(r.devices)}</dl><h2>Calls to action clicked</h2><dl>${dl(r.ctas) || "<dt>None yet</dt><dd></dd>"}</dl>
<p>Add &amp;days=30, or &amp;from=YYYY-MM-DD&amp;to=YYYY-MM-DD; &amp;format=csv downloads the numbers. A visitor is one browser; robots, previews and local copies are not counted. Bounce = one page and under 10 s visible with no click on a call to action.</p>
</main></body></html>`;
  return new Response(body, { headers: { ...hdr, "Content-Type": "text/html; charset=utf-8" } });
};

export const config = { path: "/api/funnel" };
