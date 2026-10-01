/* Календарь «Динамо» 2026: настольный календарик, листается по нажатию */
(function () {
  "use strict";
  var box = document.getElementById("desk2"), data = window.CAL_PAGES || [];
  if (!box || !data.length) return;
  var pages = box.querySelectorAll(".cp"), cur = 0, n = pages.length;
  var M = document.getElementById("dkM"), Pn = document.getElementById("dkP"), N = document.getElementById("dkN"), T = document.getElementById("dkT"), C = document.getElementById("dkC");
  function render() {
    pages.forEach(function (p, i) { p.classList.toggle("on", i === cur); });
    var d = data[cur]; M.textContent = d.m; Pn.textContent = d.p; N.textContent = d.n ? "№ " + d.n : ""; N.hidden = !d.n; T.textContent = d.t;
    C.textContent = (cur + 1) + " / " + n;
    box.querySelector('[data-dk="-1"]').disabled = cur === 0;
  }
  function go(k) { cur = (cur + k + n) % n; render(); }
  box.querySelector(".dk-cal").addEventListener("click", function () { go(1); });
  box.querySelectorAll("[data-dk]").forEach(function (b) { b.addEventListener("click", function () { go(+b.dataset.dk); }); });
  box.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { go(1); e.preventDefault(); } if (e.key === "ArrowLeft" && cur) { go(-1); e.preventDefault(); } });
  render();
})();
