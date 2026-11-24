// The free 5 Levers course. On the homepage, the sign-up forms (pop-up and the
// "Free guide" section) start the course inside the pop-up. On /my-levers the
// same results are drawn from the link, so she can come back to them.
import { STAGES, GOALS, LEVERS, OFFER, FOUNDING, START, CHECKOUT, encode, decode, results } from "/levers-data.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const store = {
  get(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

// ---------- Flodesk sign-up ----------
// The free Flodesk plan has no API, so finished courses are signed up through
// Paty's own Flodesk form ("Ribbon banner", adds to the "5 Levers free course"
// segment). The form is drawn off-screen and filled in for her.
const FD_FORM = "6ae545c53752434004b02998";
function flodeskForm() {
  if (flodeskForm.box) return flodeskForm.box;
  (function (w, d, t, h, s, n) {
    w.FlodeskObject = n;
    const fn = function () { (w[n].q = w[n].q || []).push(arguments); };
    w[n] = w[n] || fn;
    const f = d.getElementsByTagName(t)[0];
    const v = "?v=" + Math.floor(new Date().getTime() / (120 * 1000)) * 60;
    const sm = d.createElement(t); sm.async = true; sm.type = "module"; sm.src = h + s + ".mjs" + v; f.parentNode.insertBefore(sm, f);
  })(window, document, "script", "https://assets.flodesk.com", "/universal", "fd");
  const box = document.createElement("div");
  box.id = "fd-form-" + FD_FORM + "-course";
  box.setAttribute("aria-hidden", "true");
  box.style.cssText = "position:fixed;left:-10000px;top:0;width:420px";
  document.body.appendChild(box);
  window.fd("form", { formId: FD_FORM, containerEl: "#" + box.id });
  return (flodeskForm.box = box);
}
// Resolves true once Flodesk shows its "thank you" state, false after 7 seconds.
function flodeskSignup(email) {
  const box = flodeskForm();
  return new Promise((done) => {
    const until = Date.now() + 7000;
    let sent = false;
    (function tick() {
      const input = [...box.querySelectorAll("input")].find((i) => i.type !== "hidden" && i.offsetWidth > 0 && getComputedStyle(i).visibility !== "hidden");
      const ok = box.querySelector(".fd-form-success");
      if (sent && ok && getComputedStyle(ok).display !== "none") return done(true);
      if (!sent && input) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, email);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        const btn = box.querySelector("button[type=submit],button");
        if (btn) { btn.click(); sent = true; }
      }
      if (Date.now() > until) return done(false);
      setTimeout(tick, 200);
    })();
  });
}

// ---------- the course (homepage) ----------
const pop = document.getElementById("pop");
if (pop) {
  const card = pop.querySelector(".pop-card");
  const intro = card.innerHTML;
  let who = null, answers = null, step = 0;

  // Screens: 0 = welcome (no question), 1 = stage, 2-6 = the levers, 7 = goal.
  const screens = [
    {
      label: "Welcome", title: `Hi {name}, this is where <em class="b">strong</em> begins`,
      lesson: ["The 5 Levers are the heart of The M Program, the eight-week method I coach women through in a small group."],
      extra: `<ul class="lv-gains">
        <li><strong>Strength that protects you.</strong> Muscle and bone, in 25 to 35 minutes a session.</li>
        <li><strong>Steadier energy.</strong> Protein and carbs that work for your body now.</li>
        <li><strong>Better sleep, calmer days.</strong> A routine built around your real life.</li>
        <li><strong>A coach beside you.</strong> Weekly check-ins with me and a small group of women.</li>
      </ul>
      <p>In the next four minutes you'll get a taste of the program: a short note from me on each lever, and one honest question about your week. At the end you'll see your results and your first small step, and I'll email you a thank-you gift.</p>`,
      key: "intro",
    },
    { label: "Before we begin", title: `First, where are <em class="b">you</em> right now?`, lesson: [], q: "Choose the one that fits best.", options: STAGES.map((s) => [s]), key: "stage" },
    ...LEVERS.map((l, i) => ({ label: `Lever ${l.n} of V`, title: l.name, lesson: l.lesson, q: l.q, options: l.options, key: i })),
    { label: "Last question", title: `Looking <em class="b">ahead</em>`, lesson: [], q: "What would you most like to feel different in eight weeks?", options: GOALS.map((g) => [g.label]), key: "goal" },
  ];

  function draw() {
    const s = screens[step];
    const picked = s.key === "stage" ? answers.stage : s.key === "goal" ? answers.goal : answers.scores[s.key];
    const pick = s.key === "intro" ? 0 : s.key === "stage" || s.key === "goal" ? picked : answers.pick[s.key];
    card.innerHTML = `
      <button class="pop-x" type="button" aria-label="Close">&times;</button>
      <div class="lv-bar" aria-hidden="true"><span style="width:${((step + 1) / screens.length) * 100}%"></span></div>
      <span class="label">${s.label}</span>
      <h2 id="pop-h" tabindex="-1">${s.title.replace("{name}", esc(who.first_name))}</h2>
      ${s.lesson.map((p, i) => `<p class="${i === 0 ? "lv-lead" : ""}">${p}</p>`).join("")}
      ${s.extra || ""}
      ${s.q ? `<fieldset class="lv-q"><legend>${s.q}</legend>
        ${s.options.map((o, i) => `<label class="lv-opt"><input type="radio" name="lv" value="${i}"${pick === i ? " checked" : ""}><span>${esc(o[0])}</span></label>`).join("")}
      </fieldset>` : ""}
      <div class="lv-nav">
        ${step ? '<button type="button" class="pop-no lv-back">Back</button>' : "<span></span>"}
        <button type="button" class="btn btn-bronze lv-next"${pick == null ? " disabled" : ""}>${step === screens.length - 1 ? "See my results" : step === 0 ? "Begin the course" : step === 1 ? "Next" : "Next lever"}</button>
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
    store.set("lvEmail", who.email);
    store.set("lvCode", code);
    card.innerHTML = '<div class="lv-wait"><span class="label">One moment</span><h2 id="pop-h">Preparing your <em class="b">results</em></h2></div>';
    const go = (sent) => { location.href = `/my-levers#r=${code}${sent ? "&sent=1" : ""}`; };
    if (who.company) return go(false); // honeypot: a bot filled the hidden field
    flodeskSignup(who.email).then(go);
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
    flodeskForm(); // load it now so it's ready when she finishes
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
  // The results email links to /my-levers with no answers in it, so fall back
  // to the last results saved on this device.
  const r = decode(h.get("r") || store.get("lvCode"));
  if (!r) {
    out.innerHTML = `<div class="lv-empty"><span class="label">Your 5 Levers results</span><h1>Take the free <em class="b">5 Levers course</em></h1><p class="lede">This link doesn't hold any results yet. The course takes about four minutes, and your results appear right here.</p><div><a class="btn btn-bronze" href="/#guide">Start the free course</a></div></div>`;
  } else {
    const res = results(r);
    const name = store.get("lvName");
    const founding = Date.now() < Date.parse(FOUNDING.until);
    const deposit = Date.now() < Date.parse(FOUNDING.depositUntil);
    // Each button opens a Stripe Payment Link (see CHECKOUT in levers-data.js).
    const offer = founding ? {
      code: FOUNDING.code, plan: "founding", head: "Founding price: " + FOUNDING.price,
      body: "The next group starts " + START + ". The founding price is for the first 10 women, until " + FOUNDING.ends + ".",
      button: "Join at the founding price",
      alt: deposit
        ? { plan: "deposit", text: "Not ready to pay it all today?", button: "Hold your founding spot with a CAD $250 deposit", after: "(the rest is due January 15)." }
        : { plan: "plan3", text: "Prefer to spread it out?", button: "Pay in 3 monthly payments of CAD $525", after: "(the regular price, in three parts)." } } : {
      code: OFFER.code, plan: "regular", promo: OFFER.code, head: OFFER.percent + "% off The M Program",
      body: "The next group starts " + START + ". Spots are limited so the group stays small. Join within " + OFFER.days + " days and your " + OFFER.percent + "% is yours: your code <strong>" + OFFER.code + "</strong> is already filled in at checkout.",
      button: "Join with " + OFFER.percent + "% off",
      alt: { plan: "plan3", text: "Prefer to spread it out?", button: "Pay in 3 monthly payments of CAD $525", after: "(without the " + OFFER.percent + "%)." } };
    out.innerHTML = `
      <div class="lv-head">
        <span class="label">Your 5 Levers results</span>
        <h1>${name ? esc(name) + ", your" : "Your"} lever to start with is <em class="b">${res.top.name.toLowerCase()}</em></h1>
        <p class="lede">${res.band}</p>
        ${h.get("sent") ? '<p class="lv-sent">Check your inbox: your thank-you gift is on its way, with a link back to these results. If you don\'t see it in a few minutes, check your promotions or spam folder.</p>' : ""}
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
      <div class="lv-next-step" id="offer">
        <span class="label">Your next step</span>
        <h2>Now let's work on all five, <em class="b">together</em></h2>
        <p>Your results show you where to start. The M Program shows you how, week by week, with me as your coach. Over eight weeks we build each lever into your real life, so the changes last after the program ends.</p>
        <ul class="lv-gains">
          <li><strong>Extra attention on ${res.top.name.toLowerCase()}</strong>, your lever to start with, from the first week.</li>
          <li><strong>Eight weeks coached by me</strong>, with a small group of women in the same season of life.</li>
          <li><strong>Guided 25 to 35 minute workouts</strong> and high-protein recipes, in your own app.</li>
          <li><strong>Weekly check-ins</strong>, so you're never figuring it out alone.</li>
        </ul>
        <blockquote class="lv-quote"><p>“Paty customized the program around my busy work travel schedule, and shared so much knowledge in a simple way. It was great to be part of a group, in a very fun and supportive environment. I feel much better prepared for the perimenopause and menopause journey ahead.”</p><span>Agi · The M Program</span></blockquote>
        <div class="lv-offer">
          <span class="label">A thank-you for taking the course</span>
          <p class="lv-offer-h">${offer.head}</p>
          <p>${offer.body}</p>
          <form class="lv-claim" data-goal-form="offer" novalidate>
            <label for="lvce" class="sr">Email</label><input id="lvce" name="email" type="email" placeholder="Your email" required autocomplete="email" value="${esc(store.get("lvEmail"))}">
            <p hidden><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></p>
            <button class="btn btn-bronze" type="submit" name="plan" value="${offer.plan}">${offer.button}</button>
            <p class="lv-alt">${offer.alt.text} <button type="submit" name="plan" value="${offer.alt.plan}">${offer.alt.button}</button> ${offer.alt.after}</p>
          </form>
          <p class="lv-small">Secure checkout with Stripe. You'll get a receipt right away, and a welcome email from me within 24 hours.</p>
        </div>
        <div class="ctas"><a data-goal="see-program" class="btn btn-line" href="/m-program">See the full program</a><button type="button" class="btn btn-line lv-print">Save or print my results</button></div>
      </div>
      <p class="lv-fine">This check-in is for education, not a diagnosis. Please talk to your doctor about any health concerns.</p>`;
    out.querySelector(".lv-print").onclick = () => window.print();
    // Joining opens Stripe checkout with her email filled in. On the way, her
    // email, results and choice are noted in Netlify Forms ("levers-offer"), so
    // Paty can follow up if she doesn't finish paying. That note never holds up
    // the checkout for more than 1.5 seconds.
    const claim = out.querySelector(".lv-claim");
    const buttons = [...claim.querySelectorAll("button")];
    claim.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!claim.checkValidity()) { claim.reportValidity(); return; }
      const d = new FormData(claim);
      const plan = (e.submitter && e.submitter.value) || offer.plan;
      const email = String(d.get("email") || "").trim();
      buttons.forEach((b) => (b.disabled = true));
      store.set("lvEmail", email);
      const url = new URL(CHECKOUT[plan] || CHECKOUT[offer.plan]);
      url.searchParams.set("client_reference_id", plan);
      url.searchParams.set("prefilled_email", email);
      if (plan === offer.plan && offer.promo) url.searchParams.set("prefilled_promo_code", offer.promo);
      const noted = fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ "form-name": "levers-offer", first_name: name, email, company: String(d.get("company") || ""),
          code: offer.code, plan, lever: res.top.name, results: location.origin + "/my-levers#r=" + encode(r) }).toString() }).catch(() => {});
      Promise.race([noted, new Promise((ok) => setTimeout(ok, 1500))]).then(() => { location.href = url.toString(); });
    });
    // Coming back from checkout with the Back button: make the buttons work again.
    addEventListener("pageshow", () => buttons.forEach((b) => (b.disabled = false)));
    if (h.get("o")) setTimeout(() => document.getElementById("offer").scrollIntoView(), 50);
  }
}
