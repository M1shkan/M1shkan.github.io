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
})();
