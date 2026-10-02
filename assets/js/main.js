(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var base = document.body.dataset.base || "";

  /* Страница проекта всегда открывается с начала — даже в превью, где сайт живёт во встроенном окне */
  if (base && !location.hash) {
    try { history.scrollRestoration = "manual"; } catch (e) {}
    var toTop = function () {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      var h = document.documentElement, sp = h.style.scrollPaddingTop;
      h.style.scrollPaddingTop = "0px";
      try { h.scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) {}
      h.style.scrollPaddingTop = sp;
    };
    toTop(); addEventListener("load", toTop); addEventListener("pageshow", toTop);
  }
  /* Главная: при уходе в проект запоминаем, где были, а по кнопке «назад» возвращаемся ровно туда */
  if (!base) {
    addEventListener("pagehide", function () { try { sessionStorage.setItem("homeY", String(scrollY)); } catch (e) {} });
    var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    var homeY = null; try { homeY = sessionStorage.getItem("homeY"); } catch (e) {}
    if (nav && nav.type === "back_forward" && homeY !== null && !location.hash) {
      try { history.scrollRestoration = "manual"; } catch (e) {}
      var back = function () { window.scrollTo({ top: +homeY, left: 0, behavior: "instant" }); };
      back(); addEventListener("load", function () { back(); setTimeout(back, 120); });
    }
  }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); }

  /* ---------- Тема: системная по умолчанию, выбор запоминаем ---------- */
  var themeBtn = $("themeBtn");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var cur = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var next = cur === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  /* ---------- Появление при прокрутке ---------- */
  var io = ("IntersectionObserver" in window && !reduce) ? new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }) : null;
  document.querySelectorAll(".rv").forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });

  /* ---------- Наклейки: перетаскивание с наклоном по скорости ---------- */
  var zTop = 10;
  document.querySelectorAll("#stickers .st, .st[data-drag]").forEach(function (el) {
    var sx = 0, sy = 0, ox = 0, oy = 0, lastX = 0, dragging = false;
    var baseR = parseFloat(el.style.getPropertyValue("--r")) || 0;
    el.addEventListener("animationend", function () { el.style.animation = "none"; });
    el.addEventListener("pointerdown", function (e) {
      dragging = true; el.setPointerCapture(e.pointerId); el.classList.add("drag");
      sx = e.clientX - ox; sy = e.clientY - oy; lastX = e.clientX; el.style.zIndex = ++zTop;
    });
    el.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      ox = e.clientX - sx; oy = e.clientY - sy;
      var tilt = Math.max(-14, Math.min(14, (e.clientX - lastX) * 1.2)); lastX = e.clientX;
      el.style.setProperty("--x", ox + "px"); el.style.setProperty("--y", oy + "px");
      el.style.setProperty("--r", (baseR + tilt) + "deg"); el.style.setProperty("--s", "1.06");
    });
    function drop() { if (!dragging) return; dragging = false; el.classList.remove("drag"); el.style.setProperty("--r", baseR + "deg"); el.style.setProperty("--s", "1"); }
    el.addEventListener("pointerup", drop); el.addEventListener("pointercancel", drop);
  });

  /* ---------- Календарь: при наведении месяцы листаются сами, без анимации ---------- */
  var calT = $("calTile");
  if (calT && fine && !reduce) {
    var cImg = calT.querySelector(".cal-desk img"), cB = calT.querySelector(".cal-tag b"), cS = calT.querySelector(".cal-tag").lastChild;
    var CM = [["Январь","Комтуа · 10"],["Февраль","Джиошвили · 7"],["Март","Швец-Роговой · 57"],["Апрель","Сергеев · 93"],["Май","Сикьюра · 90"],["Июнь","Подъяпольский · 59"],["Июль","Михеев · 13"],["Август","Пакетт · 18"],["Сентябрь","Пыленков · 45"],["Октябрь","Ожиганов · 92"],["Ноябрь","Классон · 33"],["Декабрь","Ильенко · 34"]];
    var ci = 8, cTimer = 0, cPre = false;
    function cShow(i) { ci = i; cImg.src = "assets/img/cal/mk" + String(i + 1).padStart(2, "0") + ".webp"; cB.textContent = CM[i][0]; cS.textContent = CM[i][1]; }
    calT.addEventListener("pointerenter", function () {
      if (!cPre) { cPre = true; CM.forEach(function (_, i) { var im = new Image(); im.src = "assets/img/cal/mk" + String(i + 1).padStart(2, "0") + ".webp"; }); }
      clearInterval(cTimer); cTimer = setInterval(function () { cShow((ci + 1) % 12); }, 900);
    });
    calT.addEventListener("pointerleave", function () { clearInterval(cTimer); });
  }

  /* ---------- ОДК: 3D-наклон и голографический блик за курсором (мягкая пружина) ---------- */
  var odk = $("odkTile");
  if (odk && fine && !reduce) {
    var holos = odk.querySelectorAll(".holo"), tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, raf = 0;
    function step() {
      vx = (vx + (tx - x) * 0.02) * 0.86; vy = (vy + (ty - y) * 0.02) * 0.86; x += vx; y += vy;
      holos.forEach(function (h) {
        h.style.setProperty("--tx", (-y * 14).toFixed(2) + "deg"); h.style.setProperty("--ty", (x * 18).toFixed(2) + "deg");
        h.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(1) + "%"); h.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(1) + "%");
      });
      if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.0005) raf = requestAnimationFrame(step); else raf = 0;
    }
    odk.addEventListener("pointermove", function (e) {
      var r = odk.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(step);
    });
    odk.addEventListener("pointerleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step); });
  }

  /* ---------- Обо мне: «Подробнее» ---------- */
  var ex = $("expandBtn"), long = $("long");
  if (ex && long) ex.addEventListener("click", function () {
    var open = ex.getAttribute("aria-expanded") !== "true";
    ex.setAttribute("aria-expanded", String(open));
    long.classList.toggle("open", open);
    ex.querySelector("span").textContent = open ? "Свернуть" : "Подробнее";
  });

  /* ---------- Вся коллекция: ячейки альбома с фильтром ---------- */
  var cats = window.CATEGORIES || [], list = window.PROJECTS || [], labelOf = {};
  cats.forEach(function (c) { labelOf[c.id] = c.label; });
  var filters = $("filters"), slots = $("slots"), active = "all";
  function renderF() {
    var h = '<button class="pill" type="button" data-f="all" aria-pressed="' + (active === "all") + '">Все <span>' + list.length + "</span></button>";
    cats.forEach(function (c) {
      var n = list.filter(function (p) { return p.cats.indexOf(c.id) > -1; }).length;
      if (n) h += '<button class="pill" type="button" data-f="' + c.id + '" aria-pressed="' + (active === c.id) + '">' + esc(c.label) + " <span>" + n + "</span></button>";
    });
    filters.innerHTML = h;
  }
  function renderS() {
    var items = list.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return active === "all" || x.p.cats.indexOf(active) > -1; });
    if (!items.length) { slots.innerHTML = '<p class="empty">Тут пока пусто. Скоро вклею, обещаю.</p>'; return; }
    slots.innerHTML = items.map(function (x) {
      var p = x.p, n = String(x.i + 1).padStart(2, "0"), tag = p.featured ? "a" : "div";
      var href = p.featured ? ' href="projects/' + esc(p.slug) + '.html"' : "";
      return "<" + tag + ' class="slot' + (p.featured ? " filled" : "") + '"' + href + ">" +
        '<span class="n" aria-hidden="true">' + n + "</span>" +
        (p.cover ? '<span class="thumb" aria-hidden="true"><img src="' + esc(p.thumb || p.cover) + '" alt="" loading="lazy"></span>' : "") +
        "<div><h3>" + esc(p.title) + "</h3><p>" + esc(p.desc) + "</p></div>" +
        '<div class="meta"><span>' + esc(labelOf[p.cats[0]] || "") + "</span><span>" + (p.featured ? "В альбоме" : (p.year || "Наклейка скоро")) + "</span></div></" + tag + ">";
    }).join("");
  }
  if (filters && slots) {
    renderF(); renderS();
    filters.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || b.dataset.f === active) return;
      active = b.dataset.f; renderF();
      if (reduce) { renderS(); return; }
      slots.classList.add("swap");
      setTimeout(function () { renderS(); requestAnimationFrame(function () { requestAnimationFrame(function () { slots.classList.remove("swap"); }); }); }, 220);
    });
  }

  /* ---------- Лента наклеек ---------- */
  // Отдельные картинки — строкой ["файл","подпись"]; посты-карусели — объектом {t: заголовок, s: [[файл, подпись], …]}
  var feed = [
    ["kokarev-dr","Поздравление Дениса Кокарева с днём рождения"],
    {id:"m8", t:"Матч 8 февраля", s:[["afisha-match","Афиша матча 8 февраля"],["m8-gavrilov","Матч 8 февраля: Святослав Гаврилов"],["m8-safronenko","Матч 8 февраля: Никита Сафроненко"],["m8-tazutdinov","Матч 8 февраля: Равиль Тазутдинов"],["trener","Тренер на матч 8 февраля"],["m8-story","Матч 8 февраля: сториз с составом"],["m8-trener-story","Матч 8 февраля: сториз с тренером"]]},
    ["pobeda","Победа над «Спартаком»"],
    {id:"mhk", t:"Плей-офф МХК", s:[["mhl-preview","Плей-офф Кубка Харламова 2025–2026"],["mhk-anons","Плей-офф МХК «Динамо»: анонс матча"],["podsuha","Плей-офф МХК: карточка Ильи Подсухи"],["bond","Плей-офф МХК: карточка Артёма Бондаря"],["talipov","Плей-офф МХК: карточка тренера Артура Талипова"],["mhk-veduschiy","Плей-офф МХК: вставка «Ведущий» для ролика"],["mhk-vopros","Плей-офф МХК: вставка с вопросом для ролика"]]},
    ["dynamo-103","«Динамо» 103 года"],
    {id:"yashkin", t:"Розыгрыш шайбы Яшкина", s:[["yashkin-obi","Розыгрыш шайбы Яшкина"],["yashkin-chui","Розыгрыш шайбы Яшкина, вторая версия"]]},
    ["miska-dr","Поздравление Хантера Миски"],
    ["afisha-spartak","Афиша «Спартак» — «Динамо»"],
    ["auction","Аукцион джерси Матча звёзд"],
    {id:"piter", t:"Выезд в Питер", s:[["nikonov","Выезд в Питер"],["bot-piter","Бот для выезда в Питер: приветствие"]]},
    ["mishechkin-dr","Поздравление Евгения Мишечкина в стиле газеты"],
    ["tablica","Турнирная таблица"],
    {id:"regbi", t:"Все на регби", s:[["regbi-cover","Обложка «Все на регби»"],["regbi-bot","Бот для билетов на регби"],["regbi-zayavka","Бот для билетов на регби: «Заявка принята»"]]},
    ["8-marta","Поздравление с 8 Марта"],
    {id:"ipod", t:"Превью в стиле iPod", s:[["ipod","Превью в стиле iPod"],["ipod-2","Превью в стиле iPod, второй слайд"]]},
    ["basket","Баскетбол «Динамо»"],
    {id:"itogi", t:"Итоги года «Улиток»", s:[["itogi-goda","Итоги года «Улиток»: весь пост целиком"],
["itogi-1","Итоги года «Улиток», слайд 1 из 9"],
["itogi-2","Итоги года «Улиток», слайд 2 из 9"],
["itogi-3","Итоги года «Улиток», слайд 3 из 9"],
["itogi-4","Итоги года «Улиток», слайд 4 из 9"],
["itogi-5","Итоги года «Улиток», слайд 5 из 9"],
["itogi-6","Итоги года «Улиток», слайд 6 из 9"],
["itogi-7","Итоги года «Улиток», слайд 7 из 9"],
["itogi-8","Итоги года «Улиток», слайд 8 из 9"],
["itogi-9","Итоги года «Улиток», слайд 9 из 9"]]},
    ["pasha","Пасха"]
  ];
  var dims = {"8-marta":744,"afisha-match":1250,"afisha-spartak":827,"auction":1123,"basket":1250,"bond":1000,"dynamo-103":1250,"ipod":1000,"itogi-goda":1186,"itogi-1":1185,"itogi-2":1185,"itogi-3":1185,"itogi-4":1185,"itogi-5":1185,"itogi-6":1185,"itogi-7":1185,"itogi-8":1185,"itogi-9":1185,"kokarev-dr":1211,"mhl-preview":1242,"miska-dr":1211,"nikonov":1260,"pasha":1250,"pobeda":827,"regbi-bot":586,"tablica":1000,"talipov":1000,"trener":1250,"yashkin-chui":1250,"yashkin-obi":1250,"mhk-anons":1000,"podsuha":1000,"regbi-cover":1211,"mishechkin-dr":1211,"m8-gavrilov":1000,"m8-tazutdinov":1000,"m8-story":1700,"m8-safronenko":1000,"m8-trener-story":1778,"mhk-veduschiy":1778,"mhk-vopros":1778,"ipod-2":1000,"regbi-zayavka":586,"bot-piter":559};
  function slides(n) { var m = n % 10, h = n % 100; return n + " " + (m === 1 && h !== 11 ? "слайд" : m >= 2 && m <= 4 && (h < 12 || h > 14) ? "слайда" : "слайдов"); }
  function feedImg(f, zoom, i, extra) { return '<img src="assets/img/feed/' + f[0] + '.webp" alt="' + esc(f[1]) + '" width="1000" height="' + (dims[f[0]] || 1000) + '" loading="lazy" data-zoom="' + zoom + '" data-i="' + i + '"' + (extra || "") + ">"; }
  var wall = $("wall");
  var wallCols = 0;
  function layoutWall() {
    if (!wall) return;
    var w = wall.clientWidth, n = w > 1100 ? 5 : w > 820 ? 4 : w > 560 ? 3 : 2;
    if (n === wallCols) return; wallCols = n;
    var cols = [], hs = [];
    for (var c = 0; c < n; c++) { cols.push([]); hs.push(0); }
    feed.forEach(function (f, i) {                       // кладём в самую короткую колонку
      var k = hs.indexOf(Math.min.apply(null, hs)), cover = Array.isArray(f) ? f : f.s[0], h = (dims[cover[0]] || 1000) / 1000;
      var r = (((i * 53) % 9) - 4) * 0.9, html;
      if (Array.isArray(f)) html = '<figure style="--r:' + r + 'deg">' + feedImg(f, "feed", i) + "</figure>";
      else {
        var g = "post-" + f.id, back = f.s.slice(1, 3).map(function (x, j) { return '<span class="pk-b b' + (j + 1) + '"><img src="assets/img/feed/' + x[0] + '.webp" alt="" loading="lazy"></span>'; }).reverse().join("");
        html = '<figure class="pk" style="--r:' + r + 'deg"><div class="pk-st">' + back + feedImg(cover, g, 0, ' class="pk-c"') +
          '<span class="pk-n" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="3" width="13" height="16" rx="2"/><path d="M4 7v12a2 2 0 0 0 2 2h10"/></svg>' + slides(f.s.length) + "</span></div>" +
          '<figcaption><b>' + esc(f.t) + "</b><span>Нажмите, чтобы полистать</span></figcaption>" +
          f.s.slice(1).map(function (x, j) { return feedImg(x, g, j + 1, " hidden"); }).join("") + "</figure>";
        h += 0.16;
      }
      cols[k].push(html);
      hs[k] += h + 0.12;
    });
    wall.innerHTML = cols.map(function (c) { return '<div class="col">' + c.join("") + "</div>"; }).join("");
    clipWall();
  }
  // Длинную ленту сворачиваем, чтобы до игры и контактов не приходилось листать вечность
  var more = $("wallMore"), wallOpen = false;
  function clipWall() {
    if (!more || wallOpen) return;
    var limit = Math.max(900, innerHeight * 1.6);
    var need = wall.scrollHeight > limit * 1.25;
    wall.classList.toggle("clip", need); wall.style.maxHeight = need ? limit + "px" : "";
    more.parentNode.hidden = !need;
  }
  if (more) {
    more.querySelector("span").textContent = feed.reduce(function (n, f) { return n + (Array.isArray(f) ? 1 : f.s.length); }, 0);
    more.addEventListener("click", function () {
      wallOpen = true; more.setAttribute("aria-expanded", "true");
      wall.style.maxHeight = wall.scrollHeight + "px"; wall.classList.remove("clip");
      more.parentNode.hidden = true;
      setTimeout(function () { wall.style.maxHeight = ""; }, reduce ? 0 : 900);
    });
  }
  if (wall) { layoutWall(); var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { layoutWall(); clipWall(); }, 150); }); }

  /* ---------- Видео: играют только на экране; при «меньше движения» — по кнопке ---------- */
  var vids = document.querySelectorAll("video[data-loop]");
  if (vids.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      vids.forEach(function (v) { v.removeAttribute("autoplay"); v.pause(); v.controls = true; });
    } else {
      var vio = new IntersectionObserver(function (en) {
        en.forEach(function (x) { var v = x.target; if (x.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
      }, { threshold: 0.15 });
      vids.forEach(function (v) { vio.observe(v); });
    }
  }

  /* ---------- Переключатели (дом/гости, варианты, месяцы, развороты) ---------- */
  document.querySelectorAll("[data-switch]").forEach(function (box) {
    var groups = [].slice.call(box.querySelectorAll("[data-dim]"));
    var panels = [].slice.call(box.querySelectorAll("[data-key]"));
    var state = groups.map(function (g) { var b = g.querySelector('[aria-pressed="true"]') || g.querySelector("[data-val]"); return b.dataset.val; });
    function render() {
      var key = state.join("-");
      groups.forEach(function (g, i) { g.querySelectorAll("[data-val]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.val === state[i])); }); });
      panels.forEach(function (p) { var on = p.dataset.key === key; p.classList.toggle("on", on); p.setAttribute("aria-hidden", String(!on)); });
      var live = box.querySelector("[data-live]"); if (live) { var b = groups[0].querySelector('[aria-pressed="true"]'); live.textContent = b ? (b.dataset.label || b.textContent) : ""; }
    }
    groups.forEach(function (g, i) {
      g.addEventListener("click", function (e) { var b = e.target.closest("[data-val]"); if (!b) return; state[i] = b.dataset.val; render(); });
    });
    box.querySelectorAll("[data-step]").forEach(function (b) {
      b.addEventListener("click", function () {
        var vals = [].slice.call(groups[0].querySelectorAll("[data-val]")).map(function (x) { return x.dataset.val; });
        var k = vals.indexOf(state[0]) + (b.dataset.step === "next" ? 1 : -1);
        state[0] = vals[(k + vals.length) % vals.length]; render();
        var cur = groups[0].querySelector('[data-val="' + state[0] + '"]'); if (cur && cur.scrollIntoView && groups[0].scrollWidth > groups[0].clientWidth) cur.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
      });
    });
    if (box.dataset.switch === "month") { var m = new Date(); if (m.getFullYear() === 2026) state[0] = String(m.getMonth() + 1).padStart(2, "0"); }
    render();
  });

  /* ---------- Увеличение картинок (с листанием внутри группы) ---------- */
  if (window.HTMLDialogElement && document.querySelector("img[data-zoom]")) {
    var dlg = document.createElement("dialog"); dlg.className = "lb"; dlg.setAttribute("aria-label", "Просмотр картинки");
    dlg.innerHTML = '<figure><img alt=""><figcaption><span class="lb-cap"></span><span class="lb-n"></span></figcaption></figure>' +
      '<button type="button" class="pill pill--white lb-x">Закрыть</button>' +
      '<button type="button" class="pill round pill--white lb-prev" aria-label="Предыдущая">‹</button><button type="button" class="pill round pill--white lb-next" aria-label="Следующая">›</button>';
    document.body.appendChild(dlg);
    var big = dlg.querySelector("img"), cap = dlg.querySelector(".lb-cap"), num = dlg.querySelector(".lb-n"), group = [], gi = 0;
    function prep(im) { if (im.dataset.zr) return; im.dataset.zr = 1; im.tabIndex = 0; im.setAttribute("role", "button"); im.setAttribute("aria-label", "Увеличить: " + im.alt); }
    function show(k) {
      gi = (k + group.length) % group.length; var im = group[gi];
      big.src = im.currentSrc || im.src; big.alt = im.alt; cap.textContent = im.alt;
      num.textContent = group.length > 1 ? (gi + 1) + " / " + group.length : "";
      dlg.classList.toggle("multi", group.length > 1);
    }
    function open(im) {
      var g = im.dataset.zoom; group = g ? [].slice.call(document.querySelectorAll('img[data-zoom="' + g + '"]')) : [im];
      if (group[0] && group[0].dataset.i) group.sort(function (a, b) { return a.dataset.i - b.dataset.i; });
      show(group.indexOf(im)); if (!dlg.open) dlg.showModal();
    }
    document.querySelectorAll("img[data-zoom]").forEach(prep);
    new MutationObserver(function () { document.querySelectorAll("img[data-zoom]").forEach(prep); }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", function (e) { var im = e.target.closest && e.target.closest("img[data-zoom]"); if (im && !dlg.contains(im)) open(im); });
    document.addEventListener("keydown", function (e) {
      if (dlg.open) { if (e.key === "ArrowRight") show(gi + 1); else if (e.key === "ArrowLeft") show(gi - 1); return; }
      var im = e.target.matches && e.target.matches("img[data-zoom]") ? e.target : null;
      if (im && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(im); }
    });
    dlg.addEventListener("click", function (e) {
      var nav = e.target.closest && e.target.closest(".lb-prev, .lb-next");
      if (nav) { e.preventDefault(); show(gi + (nav.classList.contains("lb-next") ? 1 : -1)); return; }
      if (e.target === big && group.length > 1) {           // нажатие на правую/левую половину картинки тоже листает
        var r = big.getBoundingClientRect(); show(gi + (e.clientX > r.left + r.width / 2 ? 1 : -1)); return;
      }
      if (e.target === dlg || e.target.classList.contains("lb-x") || e.target.tagName === "FIGURE") dlg.close();
    });
    var tx0 = null;
    dlg.addEventListener("touchstart", function (e) { tx0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", function (e) { if (tx0 === null || group.length < 2) return; var dx = e.changedTouches[0].clientX - tx0; if (Math.abs(dx) > 50) show(gi + (dx < 0 ? 1 : -1)); tx0 = null; });
  }

  /* ---------- Гараж мечты: свет загорается, ворота поднимаются ---------- */
  var bays = document.querySelectorAll("#bays .bay"), gBtn = $("garageBtn");
  if (bays.length) {
    bays.forEach(function (b) {
      var src = b.dataset.photo; if (!src) return;
      var im = new Image(); im.decoding = "async";
      im.onload = function () {
        var car = document.createElement("span"); car.className = "car";
        im.alt = b.querySelector("h3").textContent;
        car.innerHTML = '<span class="c-pool" aria-hidden="true"></span><span class="c-shadow" aria-hidden="true"><i></i></span><span class="c-touch w1" aria-hidden="true"></span><span class="c-touch w2" aria-hidden="true"></span>';
        car.appendChild(im);
        b.querySelector(".shot").appendChild(car); b.classList.add("has-photo");
      };
      im.src = src;                                      // файла ещё нет — просто останется «Фото скоро заедет»
    });
    function setGarage(open) {
      bays.forEach(function (b) { b.classList.toggle("open", open); b.classList.toggle("lit", open); });
      if (gBtn) { gBtn.textContent = open ? "Опустить ворота" : "Поднять ворота"; gBtn.setAttribute("aria-pressed", String(!open)); }
    }
    if (reduce || !("IntersectionObserver" in window)) setGarage(true);
    else {
      setGarage(false);
      var gio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { setGarage(true); gio.disconnect(); } }, { threshold: 0.35 });
      gio.observe($("bays"));
    }
    if (gBtn) gBtn.addEventListener("click", function () { setGarage(!bays[0].classList.contains("open")); });
  }

  /* ---------- Скопировать почту ---------- */
  var cp = $("copyMail"), mt = $("mailText");
  if (cp && mt) cp.addEventListener("click", function () {
    function done() { cp.textContent = "Скопировано"; setTimeout(function () { cp.textContent = "Скопировать"; }, 1600); }
    function sel() { var r = document.createRange(); r.selectNodeContents(mt); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    try { navigator.clipboard.writeText(mt.textContent).then(done, sel); } catch (e) { sel(); }
  });
})();
