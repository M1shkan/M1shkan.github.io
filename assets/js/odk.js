/* «Один день карьеры»: голографический наклон карточек и архив воспоминаний */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Пружинный 3D-наклон с бликом ---------- */
  function tilt(area, targets, amp) {
    if (!fine || reduce) return;
    var tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, raf = 0;
    function step() {
      vx = (vx + (tx - x) * 0.03) * 0.84; vy = (vy + (ty - y) * 0.03) * 0.84; x += vx; y += vy;
      targets.forEach(function (h) {
        h.style.setProperty("--tx", (-y * amp).toFixed(2) + "deg");
        h.style.setProperty("--ty", (x * amp * 1.3).toFixed(2) + "deg");
        h.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(1) + "%");
        h.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(1) + "%");
      });
      raf = (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.0005) ? requestAnimationFrame(step) : 0;
    }
    area.addEventListener("pointermove", function (e) {
      var r = area.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(step);
    });
    area.addEventListener("pointerleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step); });
  }
  /* ---------- Веер из шести карточек: наведённая вылетает, соседи разъезжаются ---------- */
  document.querySelectorAll(".fan6").forEach(function (fan) {
    var cards = [].slice.call(fan.querySelectorAll(".fc")), active = -1;
    function set(k) {
      active = k;
      fan.classList.toggle("has-active", k > -1);
      cards.forEach(function (c, i) {
        c.classList.toggle("on", i === k);
        c.style.setProperty("--push", k < 0 || i === k ? "0deg" : (i < k ? "-6deg" : "6deg"));
        if (i !== k) { c.style.setProperty("--tx", "0deg"); c.style.setProperty("--ty", "0deg"); }
      });
    }
    cards.forEach(function (c, i) {
      c.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        set(i); delete c.dataset.settled; fan.classList.remove("tilting");
        clearTimeout(c._t); c._t = setTimeout(function () { if (active === i) { c.dataset.settled = 1; fan.classList.add("tilting"); } }, 650);
      });
      c.addEventListener("pointermove", function (e) {
        if (i !== active || reduce) return;
        if (!c.dataset.settled) return;                      // пока карточка вылетает — не дёргаем наклон
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty("--tx", (-y * 16).toFixed(2) + "deg"); c.style.setProperty("--ty", (x * 20).toFixed(2) + "deg");
        c.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(1) + "%"); c.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(1) + "%");
      });
      c.addEventListener("click", function () { set(active === i ? -1 : i); });   // на телефоне — по нажатию
    });
    fan.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { fan.classList.remove("tilting"); set(-1); } });
    cards.forEach(function (c) { c.addEventListener("animationend", function () { c.style.animation = "none"; }); });
    set(-1);
  });

  /* ---------- Архив воспоминаний ---------- */
  var P = [
    { id: "ozhiganov", name: "Игорь Ожиганов", no: 92, pos: "Защитник", date: "06.04.2025", game: "СКА — Дин (1:6)", mem: "Дорога до дома после победы", run: "1 из 18" },
    { id: "adamchuk", name: "Кирилл Адамчук", no: 44, pos: "Защитник", date: "20.03.2026", game: "Дин — АКБ (5:7)", mem: "Капитан команды", run: "1 из 18" },
    { id: "podyapolsky", name: "Владислав Подъяпольский", no: 59, pos: "Вратарь", date: "22.04.2025", game: "АКБ — Дин (1:6)", mem: "Проход в полуфинал", run: "1 из 18" },
    { id: "pylenkov", name: "Даниил Пыленков", no: 45, pos: "Защитник", date: "18.03.2026", game: "Дин — АДМ (1:2)", mem: "Мой лучший сезон", run: "1 из 18" },
    { id: "shvets", name: "Артём Швец-Роговой", no: 57, pos: "Нападающий", date: "26.11.2024", game: "Дин — ЛОК (3:0)", mem: "Гол и оооочень необычное празднование", run: "1 из 18" },
    { id: "kokarev", name: "Денис Кокарев", no: 19, pos: "Нападающий", date: "Сезон 2014–2015", game: "Информация утеряна", mem: "Двукратный обладатель Кубка Гагарина", run: "1 из 1", secret: true }
  ];
  var box = document.getElementById("memp");
  if (!box) return;
  var base = document.body.dataset.base || "";
  var card = box.querySelector(".card3d"), front = card.querySelector(".front img"), back = card.querySelector(".back img");
  var roster = box.querySelector(".roster"), bar = box.querySelector(".bar"), pct = box.querySelector(".pct");
  var out = { who: box.querySelector("[data-o=who]"), run: box.querySelector("[data-o=run]"), date: box.querySelector("[data-o=date]"), game: box.querySelector("[data-o=game]"), mem: box.querySelector("[data-o=mem]") };
  var cur = 0, timers = [];

  roster.innerHTML = P.map(function (p, i) {
    return '<li' + (p.secret ? ' class="sec-li"' : "") + '><button type="button" data-i="' + i + '" aria-pressed="' + (i === 0) + '"><b>' + p.no + "</b><span>" + (p.secret ? "Секретная 1/1" : p.name.split(" ")[1]) + "</span></button></li>";
  }).join("");
  var cells = ""; for (var k = 0; k < 10; k++) cells += "<i></i>"; bar.innerHTML = cells;
  var leds = bar.querySelectorAll("i");

  // заранее грузим все карточки, чтобы смена была мгновенной
  P.forEach(function (p) { var im = new Image(); im.src = base + "assets/img/odk/card-" + p.id + ".webp"; });

  function clear() { timers.forEach(clearTimeout); timers = []; }
  function type(el, text, delay) {
    if (reduce) { el.textContent = text; return; }
    el.textContent = "";
    for (var j = 0; j <= text.length; j++) (function (j) { timers.push(setTimeout(function () { el.textContent = text.slice(0, j); }, delay + j * 22)); })(j);
  }
  function show(i, first) {
    clear(); cur = i; var p = P[i];
    roster.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.i === i)); });
    function swap() {
      front.src = base + "assets/img/odk/card-" + p.id + ".webp";
      front.alt = "Карточка «" + p.name + ", " + p.no + "»: иллюстрация воспоминания игрока";
      back.src = base + "assets/img/odk/" + (p.secret ? "back-secret" : "back") + ".webp";
      card.classList.toggle("secret", !!p.secret);
    }
    card.classList.remove("flip");
    if (reduce || first) swap();
    else { card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap"); timers.push(setTimeout(swap, 250)); }
    out.who.textContent = p.name + " · " + p.no; out.run.textContent = p.run + " · " + p.pos;
    out.date.textContent = out.game.textContent = out.mem.textContent = "";
    leds.forEach(function (l, n) {
      if (reduce) l.classList.add("on");
      else { l.classList.remove("on"); timers.push(setTimeout(function () { l.classList.add("on"); pct.textContent = (n + 1) * 10 + "%"; }, 60 + n * 55)); }
    });
    if (reduce) pct.textContent = "100%"; else pct.textContent = "0%";
    var d0 = reduce ? 0 : 640;
    type(out.date, p.date, d0); type(out.game, p.game, d0 + p.date.length * 22 + 80); type(out.mem, p.mem, d0 + (p.date.length + p.game.length) * 22 + 160);
  }
  roster.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && +b.dataset.i !== cur) show(+b.dataset.i); });
  box.querySelector("[data-step=prev]").addEventListener("click", function () { show((cur + P.length - 1) % P.length); });
  box.querySelector("[data-step=next]").addEventListener("click", function () { show((cur + 1) % P.length); });
  card.addEventListener("click", function () { card.classList.toggle("flip"); card.setAttribute("aria-pressed", String(card.classList.contains("flip"))); });
  card.addEventListener("animationend", function () { card.classList.remove("swap"); });
  tilt(box.querySelector(".stage"), [card], 16);

  // первая запись — когда блок появится на экране
  if ("IntersectionObserver" in window && !reduce) {
    show(0, true); out.date.textContent = out.game.textContent = out.mem.textContent = ""; leds.forEach(function (l) { l.classList.remove("on"); }); pct.textContent = "0%";
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { show(0, true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(box);
  } else show(0, true);

  /* ---------- Открой пак: случайная карточка по настоящему тиражу ---------- */
  (function () {
    var up = document.getElementById("unpack"); if (!up) return;
    var base = document.body.dataset.base || "";
    var pool = [
      { id: "ozhiganov", name: "Игорь Ожиганов · 92", n: 18 }, { id: "adamchuk", name: "Кирилл Адамчук · 44", n: 18 },
      { id: "podyapolsky", name: "Владислав Подъяпольский · 59", n: 18 }, { id: "pylenkov", name: "Даниил Пыленков · 45", n: 18 },
      { id: "shvets", name: "Артём Швец-Роговой · 57", n: 18 }, { id: "kokarev", name: "Денис Кокарев · 19", n: 1, secret: true }
    ];
    var total = 91, opened = 0, busy = false, t = [];
    var btn = document.getElementById("upBtn"), log = document.getElementById("upLog"), who = document.getElementById("upWho"),
        run = document.getElementById("upRun"), odds = document.getElementById("upOdds"), cnt = document.getElementById("upCount");
    var front = up.querySelector(".uc-front img"), back = up.querySelector(".uc-back img");
    pool.forEach(function (p) { var i = new Image(); i.src = base + "assets/img/odk/card-" + p.id + ".webp"; });
    up.querySelector(".up-stage").addEventListener("click", function () { if (up.classList.contains("open")) btn.click(); });   // после вскрытия нажатие кладёт новый пак
    function draw() { var r = Math.random() * total; for (var i = 0; i < pool.length; i++) { if (r < pool[i].n) return pool[i]; r -= pool[i].n; } return pool[0]; }
    function later(fn, ms) { t.push(setTimeout(fn, reduce ? 0 : ms)); }
    /* лента: срываем, проводя курсором (или пальцем) слева направо */
    var strip = up.querySelector(".pk-strip"), packEl = up.querySelector(".pack"), prog = 0, down = false, lastX = null;
    function setP(v) { prog = Math.max(0, Math.min(1, v)); strip.style.setProperty("--p", prog.toFixed(3)); }
    function trackX(e) {
      if (up.classList.contains("open") || busy) return;
      var r = strip.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      if (lastX === null) { lastX = x; return; }
      if (x > lastX && x > prog - 0.08) { setP(Math.max(prog, x)); up.classList.add("pulling"); }
      lastX = x;
      if (prog >= 0.92) { setP(1); lastX = null; down = false; openPack(); }
    }
    strip.addEventListener("pointerdown", function (e) { down = true; lastX = null; strip.setPointerCapture(e.pointerId); trackX(e); e.stopPropagation(); });
    strip.addEventListener("pointermove", function (e) { if (down || e.pointerType === "mouse") trackX(e); });
    strip.addEventListener("pointerup", function () { down = false; lastX = null; });
    strip.addEventListener("pointerleave", function () { if (!down) lastX = null; });
    strip.addEventListener("click", function (e) { e.stopPropagation(); });
    btn.addEventListener("click", function () { openPack(); });
    function openPack() {
      if (busy) return; busy = true; t.forEach(clearTimeout); t = [];
      var card = draw(), wasOpen = up.classList.contains("open");
      function go() {
        front.src = base + "assets/img/odk/card-" + card.id + ".webp"; front.alt = "Карточка: " + card.name;
        back.src = base + "assets/img/odk/" + (card.secret ? "back-secret" : "back") + ".webp";
        up.classList.toggle("secret", !!card.secret);
        log.textContent = "Вскрываю пак…"; who.textContent = "…"; run.textContent = "…"; odds.textContent = "…";
        up.classList.add("open");
        later(function () {
          up.classList.add("revealed");
          log.textContent = card.secret ? "Невероятно: секретная карточка! Такая в тираже одна." : "Карточка на месте, брелок тоже. Можно открыть ещё один.";
          who.textContent = card.name; run.textContent = card.secret ? "1 из 1" : "1 из 18";
          odds.textContent = card.n + " из " + total;
          opened++; cnt.textContent = "Открыто паков: " + opened;
          btn.textContent = "Взять новый пак"; busy = false;
        }, 1100);
      }
      if (wasOpen) {                                        // новый пак: свежая лента, ждём, пока её сорвут
        up.classList.remove("revealed", "open", "pulling", "secret"); setP(0);
        log.textContent = "Новый пак на столе. Сорвите ленту."; who.textContent = run.textContent = odds.textContent = "—";
        btn.textContent = "Открыть без ленты"; busy = false; return;
      }
      go();
    }
  })();

  /* ---------- Базовая карточка как устройство ---------- */
  (function () {
    var dv = document.getElementById("device"); if (!dv) return;
    var rules = [
      { t: 20, h: 10, txt: "Хорошие воспоминания должны оставаться у нас, а плохие мы подарим соперникам." },
      { t: 31.5, h: 18, txt: "У вас в руках секретное устройство, которое записывает и сохраняет любимое воспоминание хоккеиста нашего с вами клуба «Динамо Москва»." },
      { t: 50.5, h: 9.5, txt: "Специальный секретный брелок позволяет носить энергию воспоминания с собой." },
      { t: 61, h: 7.5, txt: "Разблокировать воспоминание может лишь динамовец!" }
    ];
    var hl = dv.querySelector(".dv-hl"), text = document.getElementById("dvText"), step = document.getElementById("dvStep"), k = 0, tm = [];
    function show(i, msg) {
      k = (i + rules.length) % rules.length;
      hl.style.setProperty("--t", rules[k].t + "%"); hl.style.setProperty("--h", rules[k].h + "%");
      step.textContent = msg || ("Правило " + (k + 1) + " из " + rules.length); text.textContent = rules[k].txt;
    }
    function clear() { tm.forEach(clearTimeout); tm = []; }
    dv.addEventListener("click", function (e) {
      var b = e.target.closest(".dv-b"); if (!b) return;
      var a = b.dataset.act;
      if (a === "next") show(k + 1);
      else if (a === "prev") show(k - 1);
      else if (a === "scan") {
        clear(); dv.classList.remove("granted"); dv.classList.add("scanning");
        step.textContent = "Сканирую отпечаток…"; text.textContent = "Приложите палец и не двигайтесь.";
        tm.push(setTimeout(function () {
          dv.classList.remove("scanning"); dv.classList.add("granted"); show(3, "Доступ разрешён");
          text.textContent = "Отпечаток принят: вы динамовец. Воспоминание разблокировано.";
          tm.push(setTimeout(function () { dv.classList.remove("granted"); }, 2600));
        }, reduce ? 300 : 1800));
      } else if (a === "rec") {
        var on = !dv.classList.contains("recording"); dv.classList.toggle("recording", on);
        b.setAttribute("aria-pressed", String(on));
        step.textContent = on ? "● Идёт запись" : "Запись сохранена";
        text.textContent = on ? "Устройство записывает этот момент. Нажмите REC ещё раз, чтобы сохранить." : "Воспоминание сохранено в карточке. Носите его с собой вместе с брелоком.";
      }
    });
    show(0);
  })();
})();
