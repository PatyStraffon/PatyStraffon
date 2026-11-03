// The free 5 Levers course. On the homepage, the sign-up forms (pop-up and the
// "Free guide" section) start the course inside the pop-up. On /my-levers the
// same results are drawn from the link, so she can come back to them.
import { STAGES, GOALS, LEVERS, encode, decode, results } from "/levers-data.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const store = {
  get(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

// ---------- the course (homepage) ----------
const pop = document.getElementById("pop");
if (pop) {
  const card = pop.querySelector(".pop-card");
  const intro = card.innerHTML;
  let who = null, answers = null, step = 0;

  // Screens: 0 = stage, 1-5 = the levers, 6 = goal.
  const screens = [
    {
      label: "Before we begin", title: `Hi ${"{name}"}, five levers, <em class="b">about four minutes</em>`,
      lesson: ["For each lever you'll read a short note from me, then answer one question about your week as it really is. There are no right answers.", "At the end you'll see where to start, and I'll email you a copy."],
      q: "First, where are you right now?", options: STAGES.map((s) => [s]), key: "stage",
    },
    ...LEVERS.map((l, i) => ({ label: `Lever ${l.n} of V`, title: l.name, lesson: l.lesson, q: l.q, options: l.options, key: i })),
    { label: "Last question", title: `Looking <em class="b">ahead</em>`, lesson: [], q: "What would you most like to feel different in eight weeks?", options: GOALS.map((g) => [g.label]), key: "goal" },
  ];

  function draw() {
    const s = screens[step];
    const picked = s.key === "stage" ? answers.stage : s.key === "goal" ? answers.goal : answers.scores[s.key];
    const pick = s.key === "stage" || s.key === "goal" ? picked : answers.pick[s.key];
    card.innerHTML = `
      <button class="pop-x" type="button" aria-label="Close">&times;</button>
      <div class="lv-bar" aria-hidden="true"><span style="width:${((step + 1) / screens.length) * 100}%"></span></div>
      <span class="label">${s.label}</span>
      <h2 id="pop-h" tabindex="-1">${s.title.replace("{name}", esc(who.first_name))}</h2>
      ${s.lesson.map((p, i) => `<p class="${i === 0 && s.key !== "stage" ? "lv-lead" : ""}">${p}</p>`).join("")}
      <fieldset class="lv-q"><legend>${s.q}</legend>
        ${s.options.map((o, i) => `<label class="lv-opt"><input type="radio" name="lv" value="${i}"${pick === i ? " checked" : ""}><span>${esc(o[0])}</span></label>`).join("")}
      </fieldset>
      <div class="lv-nav">
        ${step ? '<button type="button" class="pop-no lv-back">Back</button>' : "<span></span>"}
        <button type="button" class="btn btn-bronze lv-next"${pick == null ? " disabled" : ""}>${step === screens.length - 1 ? "See my results" : step === 0 ? "Begin" : "Next lever"}</button>
      </div>`;
    card.scrollTop = 0;
    card.querySelector(".pop-x").onclick = closePop;
    card.querySelectorAll("input[name=lv]").forEach((r) => r.addEventListener("change", () => {
      const i = +r.value;
      if (s.key === "stage") answers.stage = i;
      else if (s.key === "goal") answers.goal = i;
      else { answers.pick[s.key] = i; answers.scores[s.key] = s.options[i][1]; }
      card.querySelector(".lv-next").disabled = false;
    }));
    const back = card.querySelector(".lv-back");
    if (back) back.onclick = () => { step--; draw(); };
    card.querySelector(".lv-next").onclick = () => { if (step < screens.length - 1) { step++; draw(); } else finish(); };
    card.querySelector("h2").focus({ preventScroll: true });
  }

  function finish() {
    const code = encode(answers);
    store.set("lvName", who.first_name);
    card.innerHTML = '<div class="lv-wait"><span class="label">One moment</span><h2 id="pop-h">Preparing your <em class="b">results</em></h2></div>';
    const go = (sent) => { location.href = `/my-levers#r=${code}${sent ? "&sent=1" : ""}`; };
    const timer = setTimeout(() => go(false), 8000);
    fetch("/api/levers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name: who.first_name, email: who.email, company: who.company, code }),
    }).then((r) => r.json()).then((d) => { clearTimeout(timer); go(!!(d && d.ok)); })
      .catch(() => { clearTimeout(timer); go(false); });
  }

  function closePop() {
    pop.hidden = true;
    card.innerHTML = intro;
    bindStart(card.querySelector("form.lv-start"));
    card.querySelector(".pop-x").onclick = closePop;
    card.querySelector(".pop-no").onclick = closePop;
  }

  function begin(f) {
    const d = new FormData(f);
    who = { first_name: String(d.get("first_name") || "").trim(), email: String(d.get("email") || "").trim(), company: String(d.get("company") || "") };
    answers = { stage: null, goal: null, scores: [null, null, null, null, null], pick: [null, null, null, null, null] };
    step = 0;
    store.set("popSeenUntil", Date.now() + 14 * 864e5);
    // Keep a copy of every sign-up in Netlify Forms, even if she stops halfway.
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ "form-name": "levers-course", first_name: who.first_name, email: who.email, company: who.company }).toString() }).catch(() => {});
    pop.hidden = false;
    draw();
  }

  function bindStart(f) {
    if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      begin(f);
    });
  }
  document.querySelectorAll("form.lv-start").forEach(bindStart);
}

// ---------- the results page (/my-levers) ----------
const out = document.getElementById("lv-results");
if (out) {
  const h = new URLSearchParams(location.hash.slice(1));
  const r = decode(h.get("r"));
  if (!r) {
    out.innerHTML = `<div class="lv-empty"><span class="label">Your 5 Levers results</span><h1>Take the free <em class="b">5 Levers course</em></h1><p class="lede">This link doesn't hold any results yet. The course takes about four minutes, and your results appear right here.</p><div><a class="btn btn-bronze" href="/#guide">Start the free course</a></div></div>`;
  } else {
    const res = results(r);
    const name = store.get("lvName");
    out.innerHTML = `
      <div class="lv-head">
        <span class="label">Your 5 Levers results</span>
        <h1>${name ? esc(name) + ", your" : "Your"} lever to start with is <em class="b">${res.top.name.toLowerCase()}</em></h1>
        <p class="lede">${res.band}</p>
        ${h.get("sent") ? '<p class="lv-sent">A copy is on its way to your inbox. If you don\'t see it in a few minutes, check your promotions or spam folder.</p>' : ""}
      </div>
      <div class="lv-first"><span class="label">Your first small step</span><p>${res.top.step}</p></div>
      <ol class="lv-list">
        ${res.levers.map((l) => `<li class="${l.id === res.top.id ? "top" : ""}">
          <div class="lv-row"><span class="n">${l.n}</span><h3>${l.name}</h3><span class="lv-lvl" data-s="${l.score}">${l.level}</span></div>
          <div class="lv-meter" aria-hidden="true"><span style="width:${(l.score / 3) * 100}%"></span></div>
          <p>${l.note}</p></li>`).join("")}
      </ol>
      <div class="lv-sign">
        <p>${res.closing}</p>
        <p class="lv-name">Paty</p>
        <p class="lv-role">Founder of Paty Straffon</p>
      </div>
      <div class="lv-next-step">
        <span class="label">When you're ready for more</span>
        <h2>All five levers, <em class="b">with me</em></h2>
        <p>The M Program works on every lever over eight weeks, coached by me, with a small group of women. Next group: January 2027.</p>
        <div class="ctas"><a class="btn btn-bronze" href="/m-program#waitlist">Join the waitlist</a><button type="button" class="btn btn-line lv-print">Save or print</button></div>
      </div>
      <p class="lv-fine">This check-in is for education, not a diagnosis. Please talk to your doctor about any health concerns.</p>`;
    out.querySelector(".lv-print").onclick = () => window.print();
  }
}
