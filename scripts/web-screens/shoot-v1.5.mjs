// Karten 1.5 screenshots (react-native-web + headless Chrome). See README.md in this folder.
import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync } from "node:fs";
const seeds = JSON.parse(readFileSync("/workspace/tools/seeds.json", "utf8"));
const OUT = "/workspace/apps/german-cards/design/v1.5-screens";
mkdirSync(OUT, { recursive: true });
const URL = process.env.KARTEN_URL ?? "http://127.0.0.1:8131/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--force-color-profile=srgb", "--font-render-hinting=none"] });
const FAKE_RELEASE = {
  tag_name: "v1.5.0", name: "Karten 1.5.0", html_url: "https://github.com/InM1nd/karten/releases/tag/v1.5.0",
  body: "• 800+ слов до B1\n• Новые темы: Arbeit & AMS, Wohnung & Mietvertrag, Arzt\n• Больше австрийских вариантов",
  assets: [{ name: "Karten-v1.5.0.apk", browser_download_url: "https://github.com/InM1nd/karten/releases/download/v1.5.0/Karten-v1.5.0.apk", size: 23100000 }],
};

async function open(seed, { dark = false, lang = null, release = false, touch = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 892, deviceScaleFactor: 3, hasTouch: touch });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }]);
  let data = seed ? structuredClone(seeds[seed]) : null;
  if (data && lang) data.settings = { ...data.settings, lang };
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().startsWith("https://api.github.com/")) {
      return release
        ? req.respond({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, body: JSON.stringify(FAKE_RELEASE) })
        : req.respond({ status: 404, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, body: "{}" });
    }
    req.continue();
  });
  await page.evaluateOnNewDocument((data) => {
    const target = new Date(2026, 9, 8, 8, 40, 0).getTime();
    const shift = target - Date.now();
    const RealDate = Date;
    class FakeDate extends RealDate {
      constructor(...a) { if (a.length === 0) super(RealDate.now() + shift); else super(...a); }
      static now() { return RealDate.now() + shift; }
    }
    window.Date = FakeDate;
    window.__kartenShots = true;
    localStorage.clear();
    if (data) localStorage.setItem("karten:data:v1", data);
  }, data ? JSON.stringify(data) : null);
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.goto(URL, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await sleep(900);
  return page;
}
async function find(page, text, { label = false, nth = 0 } = {}) {
  const box = await page.evaluate(({ text, label, nth }) => {
    const all = [...document.querySelectorAll(label ? `[aria-label="${text}"]` : "div,span")];
    const hits = label ? all : all.filter((el) => el.textContent.trim() === text && [...el.children].every((c) => c.textContent.trim() !== text));
    const el = hits[nth];
    if (!el) return null;
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, { text, label, nth });
  if (!box) throw new Error("not found: " + text);
  return box;
}
async function tap(page, text, opts) {
  const b = await find(page, text, opts);
  await page.mouse.click(b.x, b.y);
  await sleep(opts?.wait ?? 450);
}
async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("saved", name);
}

try {
  let p = await open("main");
  await shot(p, "01-today-goal");
  // tab switch caught mid-animation: stretched capsule + label crossfade
  const b = await find(p, "Словарь", { label: true });
  await p.mouse.click(b.x, b.y); await sleep(110);
  await shot(p, "02-tabbar-transition");
  await sleep(700);
  await p.evaluate(() => {
    const i = document.querySelector('input[placeholder]');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    set.call(i, "Termin"); i.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await sleep(500);
  await shot(p, "03-browse-levels");
  await tap(p, "Тренировки", { label: true, wait: 700 });
  await shot(p, "04-train");
  await tap(p, "Ситуации", { wait: 700 });
  await shot(p, "05-packs");
  await tap(p, "Am Amt", { wait: 600 });
  await shot(p, "06-packs-open");
  await p.close();

  p = await open("main");
  await tap(p, "На слух", { wait: 700 });
  await shot(p, "07-listen-intro");
  await tap(p, "Старт", { wait: 700 });
  await shot(p, "08-listen-question");
  await p.close();

  p = await open("en");
  await tap(p, "Начать", { wait: 700 });
  await tap(p, "Показать ответ", { wait: 800 });
  await shot(p, "09-card-back-en");
  await p.close();

  p = await open("uk");
  await tap(p, "Почати", { wait: 700 });
  await tap(p, "Показати відповідь", { wait: 800 });
  await shot(p, "10-card-back-uk");
  await p.close();

  p = await open("main");
  await tap(p, "Профиль", { label: true, wait: 600 });
  await tap(p, "Настройки", { label: true, wait: 700 });
  await p.evaluate(() => { const els = [...document.querySelectorAll("div")].filter((d) => d.textContent.trim() === "Язык перевода карточек"); els[0]?.scrollIntoView({ block: "start" }); window.scrollBy(0, -80); });
  await sleep(400);
  await shot(p, "11-settings-translation-goal");
  await p.close();

  p = await open("nearGoal");
  await tap(p, "Начать", { wait: 700 });
  await tap(p, "Показать ответ", { wait: 800 });
  await tap(p, "Помню", { wait: 900 });
  await shot(p, "12-goal-confetti");
  await p.close();

  p = await open("frozen");
  await shot(p, "13-today-freeze");
  await p.close();

  p = await open("dark", { dark: true });
  await tap(p, "Тренировки", { label: true, wait: 700 });
  await tap(p, "Ситуации", { wait: 700 });
  await shot(p, "14-packs-dark");
  await p.close();
} finally {
  await browser.close();
}
