/* Платёжка 2.0: карточки «80 лет» наклоняются за курсором, по бумаге бежит блик */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll(".cd").forEach(function (cd) {
    var inn = cd.querySelector(".cd-in"), raf = 0, ev = null;
    function apply() {
      raf = 0; var r = inn.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      inn.style.setProperty("--rx", ((x - 0.5) * 16).toFixed(2) + "deg");
      inn.style.setProperty("--ry", ((0.5 - y) * 12).toFixed(2) + "deg");
      inn.style.setProperty("--gx", (x * 100).toFixed(1) + "%"); inn.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    }
    cd.addEventListener("pointerenter", function () { cd.classList.add("live"); });
    cd.addEventListener("pointermove", function (e) { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
    cd.addEventListener("pointerleave", function () { cd.classList.remove("live"); inn.style.setProperty("--rx", "0deg"); inn.style.setProperty("--ry", "0deg"); });
  });
})();
