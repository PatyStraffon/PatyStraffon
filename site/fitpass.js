/* FitPass classes: a form with data-fitpass sends the code from the FitPass booking to
   /api/clases. Only a correct code returns the unlisted videos, which are drawn in rows
   of 3 like the rest of /videos. Used on /videos and /clases-virtuales. */
(function () {
  var form = document.querySelector("form[data-fitpass]");
  if (!form) return;
  var input = form.querySelector("input"), msg = form.querySelector("[role=status]"),
      box = document.getElementById(form.dataset.fitpass), grid = box.querySelector(".vidgrid");
  function card(v) {
    var fig = document.createElement("figure"); fig.className = "vcard"; fig.lang = "es";
    if (v.youtube) {
      var b = document.createElement("button"); b.type = "button"; b.className = "vplay";
      b.setAttribute("aria-label", "Ver la clase: " + v.title);
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
    } else {
      var s = document.createElement("div"); s.className = "vsoon"; s.textContent = "Próximamente"; fig.appendChild(s);
    }
    var cap = document.createElement("figcaption");
    var h = document.createElement("h3"); h.textContent = v.title;
    var m = document.createElement("p"); m.className = "vmeta"; m.textContent = v.minutes + " min · en español";
    cap.appendChild(h); cap.appendChild(m); fig.appendChild(cap);
    return fig;
  }
  function unlock(code, quiet) {
    if (!quiet) msg.textContent = "Revisando…";
    return fetch("/api/clases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error("no");
        try { sessionStorage.setItem("cv-code", code); } catch (e) {}
        msg.textContent = ""; form.hidden = true;
        grid.innerHTML = ""; d.videos.forEach(function (v) { grid.appendChild(card(v)); });
        box.hidden = false;
        if (!quiet) box.scrollIntoView({ behavior: "smooth" });
      })
      .catch(function () {
        try { sessionStorage.removeItem("cv-code"); } catch (e) {}
        if (!quiet) msg.textContent = "Ese código no es. Revisa las instrucciones de tu reserva en Fitpass o escríbeme a paty@patystraffon.com.";
      });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); unlock(input.value, false); });
  try { var saved = sessionStorage.getItem("cv-code"); if (saved) unlock(saved, true); } catch (e) {}
})();
