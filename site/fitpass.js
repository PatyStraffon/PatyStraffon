/* FitPass classes on /clases-virtuales (the only page with videos): the form sends the code
   from the FitPass booking to /api/clases. Only a correct code returns the unlisted videos,
   drawn in rows of 3, grouped by language (Spanish first, then English).
   The first time, members also give their name and email (and may tick the email box).
   This browser remembers them ("cv-me" in localStorage), so next time only the code is asked.
   Each member is recorded once in the Netlify form "fitpass-miembros"; if she ticks the box,
   /api/clases also adds her to the Flodesk segment "FitPass". */
(function () {
  var form = document.querySelector("form[data-fitpass]");
  if (!form) return;
  var input = form.querySelector("#cv-code"), msg = form.querySelector("[role=status]"),
      box = document.getElementById(form.dataset.fitpass),
      meBox = form.querySelector(".cv-me"), nameIn = form.querySelector("#cv-name"),
      emailIn = form.querySelector("#cv-email"), optin = form.querySelector("#cv-optin"),
      optinRow = form.querySelector(".cv-check"), hello = form.querySelector(".cv-hello");
  var KEY = "cv-me", me = null;
  try { me = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}

  function showMe() {
    var known = !!(me && me.name && me.email);
    meBox.hidden = known;
    hello.hidden = !known;
    if (known) hello.querySelector("b").textContent = me.name.split(" ")[0];
    // Once she has said yes to emails, don't ask again.
    optinRow.hidden = !!(known && me.optin);
  }
  hello.querySelector(".cv-notme").addEventListener("click", function () {
    me = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
    nameIn.value = ""; emailIn.value = ""; optin.checked = false;
    showMe(); nameIn.focus();
  });
  showMe();

  function record(d) {
    // One entry per member in Netlify Forms (Paty's list of FitPass members).
    var body = new URLSearchParams({ "form-name": "fitpass-miembros", nombre: d.name, correo: d.email,
      acepta_correos: d.optin ? "sí" : "no" });
    return fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() })
      .catch(function () {});
  }

  function card(v) {
    var lang = v.lang || "es";
    var fig = document.createElement("figure"); fig.className = "vcard"; fig.lang = lang;
    var b = document.createElement("button"); b.type = "button"; b.className = "vplay";
    b.setAttribute("aria-label", (lang === "en" ? "Ver la clase en inglés: " : "Ver la clase: ") + v.title);
    var img = document.createElement("img"); img.alt = ""; img.width = 960; img.height = 540; img.loading = "lazy";
    img.src = "/images/videos/" + (v.thumb || "fp1") + ".jpg";
    var ic = document.createElement("span"); ic.className = "vicon"; ic.setAttribute("aria-hidden", "true");
    b.appendChild(img); b.appendChild(ic);
    b.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(v.youtube) + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
      f.title = v.title; f.allowFullscreen = true;
      f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      b.replaceWith(f);
    });
    fig.appendChild(b);
    var cap = document.createElement("figcaption");
    var h = document.createElement("h3"); h.textContent = v.title;
    var m = document.createElement("p"); m.className = "vmeta";
    m.textContent = v.minutes + " min · " + (lang === "en" ? "en inglés" : "en español");
    cap.appendChild(h); cap.appendChild(m); fig.appendChild(cap);
    return fig;
  }

  // `fresh` = details to save: a new member, or a known one who just ticked the email box.
  function unlock(code, quiet, fresh) {
    if (!quiet) msg.textContent = "Revisando…";
    var payload = { code: code };
    if (fresh) { payload.name = fresh.name; payload.email = fresh.email; payload.optin = !!fresh.optin; }
    return fetch("/api/clases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error("no");
        try { sessionStorage.setItem("cv-code", code); } catch (e) {}
        if (fresh) {
          if (fresh.isNew || fresh.optin) record(fresh);
          me = { name: fresh.name, email: fresh.email, optin: !!fresh.optin };
          try { localStorage.setItem(KEY, JSON.stringify(me)); } catch (e) {}
          showMe();
        }
        msg.textContent = "";
        box.querySelectorAll(".vidgrid").forEach(function (g) { g.innerHTML = ""; });
        d.videos.forEach(function (v) {
          var g = box.querySelector('.vidgrid[data-lang="' + (v.lang || "es") + '"]') || box.querySelector(".vidgrid");
          g.appendChild(card(v));
        });
        box.querySelectorAll(".cv-group").forEach(function (grp) { grp.hidden = !grp.querySelector(".vcard"); });
        document.body.classList.add("cv-open");
        box.hidden = false;
        if (!quiet) box.scrollIntoView({ behavior: "smooth" });
      })
      .catch(function () {
        try { sessionStorage.removeItem("cv-code"); } catch (e) {}
        if (!quiet) msg.textContent = "Ese código no es. Revisa las instrucciones de tu reserva en Fitpass o escríbeme a paty@patystraffon.com.";
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fresh = null;
    if (!me) {
      var name = nameIn.value.trim().replace(/\s+/g, " "), email = emailIn.value.trim().toLowerCase();
      if (!name) { msg.textContent = "Escribe tu nombre."; nameIn.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = "Revisa tu correo."; emailIn.focus(); return; }
      fresh = { name: name, email: email, optin: optin.checked, isNew: true };
    } else if (!me.optin && optin.checked) {
      fresh = { name: me.name, email: me.email, optin: true, isNew: false };
    }
    if (!input.value.trim()) { msg.textContent = "Escribe tu código de Fitpass."; input.focus(); return; }
    unlock(input.value, false, fresh);
  });
  try { var saved = sessionStorage.getItem("cv-code"); if (saved) unlock(saved, true, null); } catch (e) {}
})();
