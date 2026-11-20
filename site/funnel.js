/* website-playbook funnel v1 (20 Nov 2026): a cookieless, first-party reading and conversion counter.
   One file on every page, no outside service. It sends small events to /api/t on the same site:
   view (page, entry source, campaign tags, device class), sec (a marked section seen for 1 s),
   depth (25/50/75/100 % scrolled), engaged (10 s of visible time), cta (a click on [data-goal]),
   signup (a submit of a form marked [data-goal-form]), goal (a page marked <body data-goal-page="...">),
   leave (visible time and the last section seen). Kept in the browser: one random visitor id
   (localStorage) and one random session id (sessionStorage, ends with the tab). No cookie, no address,
   no name, no browser fingerprint. Set HOST below to the live host so previews and local copies add nothing. */
(function () {
  var HOST = /(^|\.)patystraffon\.com$/;
  var ENDPOINT = "/api/t";
  var VKEY = "fn-visitor", SKEY = "fn-session", TKEY = "fn-touch";
  if (navigator.webdriver || /bot|crawl|spider|headless|preview|lighthouse/i.test(navigator.userAgent || "")) return;
  if (!HOST.test(location.hostname)) return;
  // patystraffon.com: the FitPass members page and the reset page are not counted.
  if (/^\/(clases-virtuales|reset)(\/|\.html)?$/.test(location.pathname)) return;

  function rid() {
    var a = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function store(kind, key, make) {
    var s = null; try { s = window[kind]; } catch (e) { s = null; }
    var v = null; try { v = s && s.getItem(key); } catch (e) { v = null; }
    if (!v) { v = make(); try { s && s.setItem(key, v); } catch (e) { /* still counted */ } }
    return v;
  }
  var vid = store("localStorage", VKEY, rid);
  var newSession = false;
  var sid = store("sessionStorage", SKEY, function () { newSession = true; return rid(); });

  // first touch of this session: referrer host and campaign tags, kept for every later event of the session
  var touch = store("sessionStorage", TKEY, function () {
    var q = new URLSearchParams(location.search), ref = "";
    try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) { ref = ""; }
    if (HOST.test(ref)) ref = "";
    var t = { ref: ref.slice(0, 60) };
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (k) {
      var v = q.get(k); if (v) t[k.slice(4)] = v.toLowerCase().replace(/[^a-z0-9._-]/g, "-").slice(0, 40);
    });
    return JSON.stringify(t);
  });
  var tch = {}; try { tch = JSON.parse(touch) || {}; } catch (e) { tch = {}; }
  var w = window.innerWidth || 1024;
  var dev = w < 700 ? "phone" : w < 1100 ? "tablet" : "desktop";
  var path = location.pathname;

  function send(ev) {
    ev.v = vid; ev.s = sid; ev.p = path;
    var body = JSON.stringify(ev);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () {});
    } catch (e) { /* the page reads the same without it */ }
  }

  send({ t: "view", n: newSession ? 1 : 0, d: dev, ref: tch.ref || "", src: tch.source || "", med: tch.medium || "",
         cmp: tch.campaign || "", cnt: tch.content || "" });

  // visible time
  var visibleMs = 0, since = document.visibilityState === "visible" ? Date.now() : 0, engagedSent = false;
  function tick() { if (since) { visibleMs += Date.now() - since; since = Date.now(); } }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") since = Date.now(); else { tick(); since = 0; }
  });
  var eng = setInterval(function () {
    tick();
    if (!engagedSent && visibleMs >= 10000) { engagedSent = true; send({ t: "engaged" }); clearInterval(eng); }
  }, 1000);

  // sections: any element with data-section="name" (order on the page = funnel order)
  var lastSection = "", seen = {};
  var secs = Array.prototype.slice.call(document.querySelectorAll("[data-section]"));
  if ("IntersectionObserver" in window && secs.length) {
    var timers = {};
    // v1.1: "in view" = 40% of the section on screen, OR the section fills 40% of the screen (tall bands on a phone
    // can never show 40% of themselves at once); one timer per section, so a section is sent once.
    var io = new IntersectionObserver(function (entries) {
      var vh = window.innerHeight || document.documentElement.clientHeight || 1;
      entries.forEach(function (en) {
        var el = en.target, name = (el.getAttribute("data-section") || "").slice(0, 40), idx = secs.indexOf(el);
        if (!name || seen[name]) return;
        var inView = en.isIntersecting && (en.intersectionRatio >= 0.4 || en.intersectionRect.height >= 0.4 * vh);
        if (inView) {
          if (!timers[name]) timers[name] = setTimeout(function () {
            if (seen[name]) return;
            seen[name] = 1; lastSection = name; send({ t: "sec", sec: name, i: idx }); io.unobserve(el);
          }, 1000);
        } else if (timers[name]) { clearTimeout(timers[name]); timers[name] = 0; }
      });
    }, { threshold: [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.6, 0.8, 1] });
    secs.forEach(function (el) { io.observe(el); });
  }

  // scroll depth
  var marks = [25, 50, 75, 100], hit = {};
  function depth() {
    var h = document.documentElement, max = (h.scrollHeight - h.clientHeight) || 1;
    var pct = Math.round(((window.scrollY || h.scrollTop) / max) * 100);
    marks.forEach(function (m) { if (pct >= m - 2 && !hit[m]) { hit[m] = 1; send({ t: "depth", dp: m }); } });
  }
  window.addEventListener("scroll", function () { window.requestAnimationFrame(depth); }, { passive: true });

  // calls to action and conversions
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-goal]");
    if (a) send({ t: "cta", g: (a.getAttribute("data-goal") || "cta").slice(0, 40) });
  }, true);
  document.addEventListener("submit", function (e) {
    var f = e.target.closest && e.target.closest("[data-goal-form]");
    // v1.1: only a form that would really go through (valid fields), so a mistyped address is not a sign-up
    if (f && (!f.checkValidity || f.checkValidity())) send({ t: "signup", g: (f.getAttribute("data-goal-form") || "signup").slice(0, 40) });
  }, true);
  var gp = document.body && document.body.getAttribute("data-goal-page");
  if (gp) send({ t: "goal", g: gp.slice(0, 40) });

  // leaving the page
  var left = false;
  window.addEventListener("pagehide", function () {
    if (left) return; left = true; tick();
    send({ t: "leave", ms: Math.min(visibleMs, 3600000), last: lastSection });
  });
})();
