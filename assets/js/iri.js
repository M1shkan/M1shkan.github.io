/* MAXLAW для ИРИ: вопросы эксперту (вкладки) и путь претензии, который переключает экран ноутбука */
(function () {
  "use strict";
  function tabs(list, onPick) {
    var btns = [].slice.call(list.querySelectorAll('[role="tab"]'));
    function pick(i, focus) {
      btns.forEach(function (b, k) { var on = k === i; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
      if (focus) btns[i].focus();
      onPick(btns[i], i);
    }
    btns.forEach(function (b, i) { b.addEventListener("click", function () { pick(i); }); });
    list.addEventListener("keydown", function (e) {
      var i = btns.indexOf(document.activeElement); if (i < 0) return;
      var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); pick((i + k + btns.length) % btns.length, true); }
    });
  }
  var qa = document.querySelector(".qa-list");
  if (qa) tabs(qa, function (b) {
    document.querySelectorAll('.qa-sheet [role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== b.getAttribute("aria-controls"); });
  });
  var fl = document.querySelector(".flow-steps");
  if (fl) tabs(fl, function (b) {
    document.querySelectorAll(".flow-lap img").forEach(function (im) { im.classList.toggle("on", im.dataset.scr === b.dataset.scr); });
  });

  /* Презентация: кнопки, клавиши, свайп и миниатюры */
  var dk = document.getElementById("deck");
  if (dk) {
    var sl = [].slice.call(dk.querySelectorAll(".sd-stage img")), th = [].slice.call(dk.querySelectorAll(".sd-thumbs button")), n = dk.querySelector(".sd-n"), cur = 0;
    function go(k) {
      cur = (k + sl.length) % sl.length;
      sl.forEach(function (im, i) { im.classList.toggle("on", i === cur); if (Math.abs(i - cur) <= 1) im.loading = "eager"; });
      th.forEach(function (b, i) { if (i === cur) { b.setAttribute("aria-current", "true"); var w = b.parentNode; w.scrollTo({ left: b.offsetLeft - w.clientWidth / 2 + b.clientWidth / 2, behavior: "smooth" }); } else b.removeAttribute("aria-current"); });
      n.textContent = (cur + 1) + " / " + sl.length;
    }
    dk.querySelectorAll("[data-step]").forEach(function (b) { b.addEventListener("click", function () { go(cur + +b.dataset.step); }); });
    th.forEach(function (b, i) { b.addEventListener("click", function () { go(i); }); });
    var inView = false;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }, { threshold: .5 }).observe(dk.querySelector(".sd-stage"));
    document.addEventListener("keydown", function (e) {
      var lb = document.querySelector("dialog.lb[open]"); if (lb || !inView) return;
      if (e.key === "ArrowRight") { go(cur + 1); e.preventDefault(); } else if (e.key === "ArrowLeft") { go(cur - 1); e.preventDefault(); }
    });
    var x0 = null, st = dk.querySelector(".sd-stage");
    st.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    st.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); x0 = null; });
  }
})();
