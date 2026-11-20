// website-playbook funnel v1 (20 Nov 2026): receives the events from funnel.js at POST /api/t.
// Storage: Netlify Blobs store "funnel", one record per browser session per day (key s/YYYY-MM-DD/<session id>)
// holding that session's events in order, plus one empty record per visitor (key v/<visitor id>).
// Nothing about the person is kept: no address, no user agent, no cookie. Copy into netlify/functions/.
import { getStore } from "@netlify/blobs";

const ok = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
const TYPES = new Set(["view", "sec", "depth", "engaged", "cta", "signup", "goal", "leave"]);
const clean = (v, n = 40) => String(v ?? "").toLowerCase().replace(/[^a-z0-9._\/-]/g, "-").slice(0, n);

export default async (req) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });
  let b = {};
  try { b = JSON.parse(await req.text()); } catch { return ok(); }
  const vid = String(b.v || ""), sid = String(b.s || ""), t = String(b.t || "");
  if (!/^[a-f0-9]{16,40}$/.test(vid) || !/^[a-f0-9]{16,40}$/.test(sid) || !TYPES.has(t)) return ok();
  let p = String(b.p || "/");
  if (!/^\/[a-z0-9\/._-]{0,80}$/i.test(p)) p = "/other";
  if (!p.endsWith("/") && !p.includes(".")) p += "/";

  const ev = { t, p: p.toLowerCase(), at: Date.now() };
  if (t === "view") Object.assign(ev, { n: b.n ? 1 : 0, d: clean(b.d, 8), ref: clean(b.ref, 60), src: clean(b.src),
    med: clean(b.med), cmp: clean(b.cmp), cnt: clean(b.cnt) });
  if (t === "sec") Object.assign(ev, { sec: clean(b.sec), i: Math.max(0, Math.min(99, Number(b.i) || 0)) });
  if (t === "depth") ev.dp = [25, 50, 75, 100].includes(Number(b.dp)) ? Number(b.dp) : 0;
  if (t === "cta" || t === "signup" || t === "goal") ev.g = clean(b.g);
  if (t === "leave") Object.assign(ev, { ms: Math.max(0, Math.min(3600000, Number(b.ms) || 0)), last: clean(b.last) });

  const day = new Date().toISOString().slice(0, 10);
  const store = getStore("funnel");
  const key = `s/${day}/${sid}`;
  const rec = (await store.get(key, { type: "json" })) || { v: vid, e: [] };
  if (rec.e.length < 400) rec.e.push(ev);
  await store.setJSON(key, rec);
  if (t === "view" && (await store.get("v/" + vid)) === null) await store.set("v/" + vid, day);
  return ok();
};

export const config = { path: "/api/t" };
