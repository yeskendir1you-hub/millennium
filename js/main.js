/* Millennium — сайт. Всё, что стоит поменять, лежит в CONFIG. */
const CONFIG = {
  instagram: "millennium_barr",
  // Номер WhatsApp только цифрами, например "77011234567". Пока пусто, бронь уходит в Instagram Direct.
  whatsapp: "",
  // Цена Апероля по акции, например "2 490". Пока пусто, на сайте написано «уточняйте».
  aperolPrice: "",
  // Часы работы, время Алматы (UTC+5). Ключ: день начала смены (0 — вс).
  hours: { 0: [15, 28], 1: [15, 28], 2: [15, 28], 3: [15, 28], 4: [15, 28], 5: [15, 30], 6: [15, 30] },
  tzOffset: 5,
};

document.documentElement.classList.add("js");
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- время Алматы ---------- */
function almatyNow() {
  const d = new Date();
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000 + CONFIG.tzOffset * 3600000);
}
function pad(n) { return String(n).padStart(2, "0"); }
function fmtHour(h) { return pad(h % 24) + ":00"; }

/* ---------- открыто сейчас ---------- */
(function status() {
  const el = $("#status"); if (!el) return;
  const t = $(".status__text", el);
  const update = () => {
    const now = almatyNow();
    const h = now.getHours() + now.getMinutes() / 60;
    const today = now.getDay();
    const yest = (today + 6) % 7;
    const [yo, yc] = CONFIG.hours[yest];
    const [to, tc] = CONFIG.hours[today];
    let open = false, closeAt;
    if (h + 24 < yc) { open = true; closeAt = yc; }
    else if (h >= to) { open = true; closeAt = tc; }
    el.classList.toggle("is-open", open);
    t.textContent = open ? `Открыто до ${fmtHour(closeAt)}` : `Откроемся в ${fmtHour(to)}`;
  };
  update(); setInterval(update, 60000);
})();

/* ---------- акционная цена Апероля ---------- */
if (CONFIG.aperolPrice) {
  $$('[data-price="aperol"]').forEach((el) => {
    if (el.classList.contains("price")) { el.textContent = CONFIG.aperolPrice; el.classList.remove("price--ask"); }
    else { el.innerHTML = `${CONFIG.aperolPrice} <span>₸</span>`; el.classList.remove("deal__price--ask"); }
  });
}

/* ---------- WhatsApp в контактах ---------- */
if (CONFIG.whatsapp) {
  const line = $("#phone-line"), a = $("#phone-link");
  const d = CONFIG.whatsapp;
  a.href = `https://wa.me/${d}`;
  a.textContent = `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
  line.hidden = false;
  $("#f-submit span").textContent = "Отправить в WhatsApp";
}

/* ---------- шапка и бургер ---------- */
const header = $("#top"), nav = $("#nav"), burger = $("#burger");
const onScroll = () => header.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
function setNav(open) {
  nav.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  document.body.classList.toggle("nav-open", open);
}
burger.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
$$("a", nav).forEach((a) => a.addEventListener("click", () => setNav(false)));
addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });

/* ---------- вкладки меню ---------- */
(function tabs() {
  const tabs = $$('[role="tab"]'), img = $("#menu-img");
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    const src = $("#" + tab.getAttribute("aria-controls")).dataset.img;
    if (src && !img.src.endsWith(src)) {
      img.classList.add("is-swap");
      setTimeout(() => { img.src = src; img.onload = () => img.classList.remove("is-swap"); }, 250);
    }
    if (focus) tab.focus();
    tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
    });
  });
})();

/* ---------- стрелки вверх / вниз по разделам ---------- */
(function jump() {
  const sections = $$("main > section");
  const up = $("#jump-up"), down = $("#jump-down");
  const current = () => {
    const y = scrollY + innerHeight * 0.35;
    let idx = 0;
    sections.forEach((s, i) => { if (s.offsetTop <= y) idx = i; });
    return idx;
  };
  const go = (dir) => {
    const i = current();
    const target = sections[Math.max(0, Math.min(sections.length - 1, i + dir))];
    if (dir < 0 && scrollY > sections[i].offsetTop + 80) { sections[i].scrollIntoView(); return; }
    target.scrollIntoView();
  };
  up.addEventListener("click", () => go(-1));
  down.addEventListener("click", () => go(1));
  const dockArrows = $$("[data-jump]");
  dockArrows.forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.jump))));
  const navLinks = $$('a[href^="#"]', nav);
  const update = () => {
    const i = current();
    const atTop = scrollY < 200;
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 40;
    up.classList.toggle("is-off", atTop);
    down.classList.toggle("is-off", atEnd);
    dockArrows.forEach((b) => b.classList.toggle("is-off", b.dataset.jump === "-1" ? atTop : atEnd));
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + sections[i].id));
  };
  addEventListener("scroll", update, { passive: true }); addEventListener("resize", update); update();
})();

/* ---------- появление блоков ---------- */
(function reveal() {
  const els = $$(".head, .deal, .menu__grid, .zone, .ev__item, .book__intro, .form, .contacts__info, .map");
  if (!("IntersectionObserver" in window)) return;
  els.forEach((el) => el.classList.add("rv"));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((el) => io.observe(el));
})();

/* ---------- бронь ---------- */
(function booking() {
  const form = $("#book-form"); if (!form) return;
  const date = $("#f-date"), time = $("#f-time"), guests = $("#f-guests"), phone = $("#f-phone");

  const now = almatyNow();
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  date.min = iso(now);
  const max = new Date(now); max.setDate(max.getDate() + 60); date.max = iso(max);
  date.value = iso(now);

  const fillTimes = () => {
    const d = date.value ? new Date(date.value + "T12:00") : now;
    const [o, c] = CONFIG.hours[d.getDay()];
    const prev = time.value;
    time.innerHTML = "";
    const isToday = date.value === iso(now);
    const nowH = now.getHours() + now.getMinutes() / 60;
    for (let h = o; h <= c - 1; h += 0.5) {
      if (isToday && h < nowH + 0.5 && nowH >= o) continue;
      const label = `${pad(Math.floor(h) % 24)}:${h % 1 ? "30" : "00"}`;
      time.add(new Option(label + (h >= 24 ? " (ночь)" : ""), label));
    }
    if (!time.options.length) time.add(new Option("Выберите другую дату", ""));
    const def = [...time.options].find((o) => o.value === prev) || [...time.options].find((o) => o.value === "20:00");
    if (def) time.value = def.value;
  };
  date.addEventListener("change", fillTimes); fillTimes();

  let n = 4;
  $$("[data-step]", form).forEach((b) => b.addEventListener("click", () => {
    n = Math.max(1, Math.min(40, n + Number(b.dataset.step)));
    guests.textContent = n;
  }));

  phone.addEventListener("input", () => {
    let d = phone.value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (d && !d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    const p = [d.slice(0, 1), d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean);
    phone.value = p.length ? "+" + p.join(" ") : "";
    phone.closest(".field").classList.remove("is-bad");
  });

  $$("[data-occasion]").forEach((a) => a.addEventListener("click", () => {
    const note = $("#f-note");
    if (!note.value.includes(a.dataset.occasion)) note.value = (a.dataset.occasion + ". " + note.value).trim();
  }));

  $$("input", form).forEach((i) => i.addEventListener("input", () => i.closest(".field")?.classList.remove("is-bad")));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#f-name");
    const checks = [
      [name, name.value.trim().length > 1],
      [phone, phone.value.replace(/\D/g, "").length === 11],
      [date, !!date.value],
    ];
    let first = null;
    checks.forEach(([el, ok]) => { el.closest(".field").classList.toggle("is-bad", !ok); if (!ok && !first) first = el; });
    if (!time.value) first = first || time;
    if (first) { first.focus(); return; }

    const [y, m, d] = date.value.split("-");
    const zone = form.zone.value;
    const note = $("#f-note").value.trim();
    const msg = [
      "Здравствуйте! Хочу забронировать стол в Millennium.",
      `Имя: ${name.value.trim()}`,
      `Телефон: ${phone.value}`,
      `Дата: ${d}.${m}.${y}, ${time.value}`,
      `Гостей: ${n}`,
      `Зона: ${zone}`,
      note && `Пожелания: ${note}`,
    ].filter(Boolean).join("\n");

    const done = $("#f-done");
    if (CONFIG.whatsapp) {
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      done.textContent = "Открыли WhatsApp с готовым сообщением. Нажмите «Отправить», и мы подтвердим бронь.";
    } else {
      const copying = navigator.clipboard ? navigator.clipboard.writeText(msg).then(() => true, () => false) : Promise.resolve(false);
      window.open(`https://ig.me/m/${CONFIG.instagram}`, "_blank", "noopener");
      const copied = await copying;
      done.textContent = copied
        ? "Текст брони скопирован. В открывшемся Direct вставьте его и нажмите «Отправить»."
        : "Откройте Direct @" + CONFIG.instagram + " и отправьте детали брони: " + msg.replace(/\n/g, "; ");
      if (copied) toast("Текст брони скопирован, вставьте его в Direct");
    }
    done.hidden = false;
  });
})();

function toast(text) {
  const t = $("#toast"); t.textContent = text; t.classList.add("is-on");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("is-on"), 3200);
}
