/* Ленты постов на телефоне: точки-счётчик под лентой, нажатие на точку листает */
(function () {
  "use strict";
  document.querySelectorAll(".wear, .phones").forEach(function (row) {
    var items = [].slice.call(row.children); if (items.length < 2) return;
    var dots = document.createElement("div"); dots.className = "sw-dots"; dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = items.map(function () { return "<i></i>"; }).join("");
    row.parentNode.insertBefore(dots, row.nextSibling);
    var ds = [].slice.call(dots.children), raf = 0;
    function mark() {
      raf = 0; var r = row.getBoundingClientRect(), best = 0, bd = 1e9;
      items.forEach(function (it, i) { var d = Math.abs(it.getBoundingClientRect().left - r.left - parseFloat(getComputedStyle(row).paddingLeft)); if (d < bd) { bd = d; best = i; } });
      if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 4) best = items.length - 1;
      ds.forEach(function (d, i) { d.classList.toggle("on", i === best); });
    }
    row.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(mark); }, { passive: true });
    ds.forEach(function (d, i) { d.addEventListener("click", function () { row.scrollTo({ left: items[i].offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior: "smooth" }); }); });
    mark();
  });
})();
