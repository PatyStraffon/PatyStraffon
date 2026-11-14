/* Click-to-play YouTube cards: a .vplay button with data-yt loads the player only when tapped. */
document.querySelectorAll(".vplay[data-yt]").forEach(function (b) {
  b.addEventListener("click", function () {
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(b.dataset.yt) + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
    f.title = b.dataset.title || "Video";
    f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    b.replaceWith(f);
  });
});
