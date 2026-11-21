// website-playbook funnel v1: turns stored sessions into the measures in references/07-measurement-and-funnel.md.
// Pure function, no storage: report(sessions, opts) where sessions = [{ v, e: [events] }].
// Definitions:
//   session      one browser tab's visit (ends when the tab closes); split at midnight UTC
//   bounce       a session with one page view and no engaged, cta, signup or goal event
//   engaged      a session with 10 s of visible time on any page, or 2+ page views, or any cta/signup/goal
//   section reach  sessions that saw the section / sessions that viewed the page
//   drop-off     1 - reach(section n+1) / reach(section n), in the page's own order
//   exit section the last section seen on the page where a session ended
//   conversion   sessions with a signup (or a goal such as purchase) / sessions, by source and campaign
export function report(sessions, opts = {}) {
  const goals = opts.goals || ["signup", "purchase"];
  const out = { sessions: 0, visitors: new Set(), views: 0, bounces: 0, engaged: 0, engagedMs: 0,
    pages: {}, entries: {}, sources: {}, devices: {}, ctas: {}, conversions: {} };
  const pct = (a, b) => (b ? Math.round((a * 1000) / b) / 10 : 0);

  for (const s of sessions) {
    const ev = (s.e || []).slice().sort((a, b) => a.at - b.at);
    const views = ev.filter((x) => x.t === "view");
    if (!views.length) continue;
    out.sessions++; out.visitors.add(s.v); out.views += views.length;
    const first = views[0];
    const source = first.src ? `${first.src}/${first.med || "-"}` : first.ref ? `${first.ref}/referral` : "(direct)/none";
    const campaign = first.cmp || "-";
    const has = (t) => ev.some((x) => x.t === t);
    // patystraffon.com: a sign-up counts as "signup" and also under its own form name (course, waitlist ...)
    const goalHit = new Set(ev.filter((x) => x.t === "signup").flatMap((x) => ["signup", x.g])
      .concat(ev.filter((x) => x.t === "goal").map((x) => x.g)));
    const engaged = has("engaged") || views.length > 1 || has("cta") || goalHit.size > 0;
    if (views.length === 1 && !engaged) out.bounces++;
    if (engaged) out.engaged++;
    out.engagedMs += ev.filter((x) => x.t === "leave").reduce((a, x) => a + (x.ms || 0), 0);

    out.entries[first.p] = (out.entries[first.p] || 0) + 1;
    const src = (out.sources[source] ||= { sessions: 0, bounces: 0, conv: {} });
    src.sessions++; if (views.length === 1 && !engaged) src.bounces++;
    const cmpKey = `${source} | ${campaign}`;
    const cmp = (out.conversions[cmpKey] ||= { sessions: 0, conv: {} });
    cmp.sessions++;
    for (const g of goals) if (goalHit.has(g)) { src.conv[g] = (src.conv[g] || 0) + 1; cmp.conv[g] = (cmp.conv[g] || 0) + 1; }
    out.devices[first.d || "?"] = (out.devices[first.d || "?"] || 0) + 1;
    for (const c of ev.filter((x) => x.t === "cta")) out.ctas[c.g] = (out.ctas[c.g] || 0) + 1;

    // per page: sessions that viewed it, sections seen, depth, exits
    const lastPage = views[views.length - 1].p;
    for (const p of new Set(views.map((x) => x.p))) {
      const pg = (out.pages[p] ||= { sessions: 0, views: 0, exits: 0, sec: {}, order: {}, depth: { 25: 0, 50: 0, 75: 0, 100: 0 }, exitSec: {} });
      pg.sessions++;
      pg.views += views.filter((x) => x.p === p).length;
      const secs = ev.filter((x) => x.t === "sec" && x.p === p);
      for (const x of new Set(secs.map((y) => y.sec))) pg.sec[x] = (pg.sec[x] || 0) + 1;
      for (const x of secs) pg.order[x.sec] = Math.min(pg.order[x.sec] ?? 99, x.i);
      const dmax = Math.max(0, ...ev.filter((x) => x.t === "depth" && x.p === p).map((x) => x.dp));
      for (const m of [25, 50, 75, 100]) if (dmax >= m) pg.depth[m]++;
      if (p === lastPage) {
        pg.exits++;
        const lastSec = secs.length ? secs[secs.length - 1].sec : "(top)";
        pg.exitSec[lastSec] = (pg.exitSec[lastSec] || 0) + 1;
      }
    }
  }

  const pages = Object.entries(out.pages).sort((a, b) => b[1].sessions - a[1].sessions).map(([p, pg]) => {
    const order = Object.keys(pg.sec).sort((a, b) => pg.order[a] - pg.order[b]);
    let prev = null;
    const sections = order.map((name) => {
      const reach = pct(pg.sec[name], pg.sessions);
      const drop = prev === null ? null : Math.round((100 - (prev ? (reach * 100) / prev : 0)) * 10) / 10;
      prev = reach;
      return { name, sessions: pg.sec[name], reach, dropFromPrevious: drop };
    });
    return { page: p, sessions: pg.sessions, views: pg.views, entries: out.entries[p] || 0, exits: pg.exits,
      exitRate: pct(pg.exits, pg.sessions), depth: Object.fromEntries(Object.entries(pg.depth).map(([k, n]) => [k, pct(n, pg.sessions)])),
      sections, exitSection: pg.exitSec };
  });

  const bySource = Object.entries(out.sources).sort((a, b) => b[1].sessions - a[1].sessions).map(([k, s]) => ({
    source: k, sessions: s.sessions, bounceRate: pct(s.bounces, s.sessions),
    ...Object.fromEntries(goals.map((g) => [`${g}Rate`, pct(s.conv[g] || 0, s.sessions)])),
    ...Object.fromEntries(goals.map((g) => [g, s.conv[g] || 0])) }));
  const byCampaign = Object.entries(out.conversions).sort((a, b) => b[1].sessions - a[1].sessions).map(([k, s]) => ({
    sourceCampaign: k, sessions: s.sessions, ...Object.fromEntries(goals.map((g) => [g, s.conv[g] || 0])) }));
  const totalConv = Object.fromEntries(goals.map((g) => [g, bySource.reduce((a, s) => a + s[g], 0)]));

  return {
    summary: { sessions: out.sessions, uniqueVisitors: out.visitors.size, pageViews: out.views,
      pagesPerSession: out.sessions ? Math.round((out.views / out.sessions) * 100) / 100 : 0,
      bounceRate: pct(out.bounces, out.sessions), engagedRate: pct(out.engaged, out.sessions),
      avgVisibleSeconds: out.sessions ? Math.round(out.engagedMs / out.sessions / 1000) : 0,
      ...Object.fromEntries(goals.map((g) => [`${g}s`, totalConv[g]])),
      ...Object.fromEntries(goals.map((g) => [`${g}Rate`, pct(totalConv[g], out.sessions)])) },
    devices: out.devices, ctas: out.ctas, pages, bySource, byCampaign,
  };
}
