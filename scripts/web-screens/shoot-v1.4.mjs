// Karten 1.4 screenshots (react-native-web + headless Chrome). See README.md in this folder.
import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync } from "node:fs";
const seeds = JSON.parse(readFileSync("/workspace/tools/seeds.json", "utf8"));
const OUT = "/workspace/apps/german-cards/design/v1.4-screens";
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
  let p = await open(null);
  await shot(p, "01-onboarding-level");
  await tap(p, "B1 · уверенный");
  await tap(p, "Дальше");
  await tap(p, "Alltag"); await tap(p, "Wohnung"); await tap(p, "Behörden / Amt");
  await shot(p, "02-onboarding-topics");
  await tap(p, "Дальше");
  await shot(p, "03-onboarding-per-day");
  await p.close();

  // Android-style launch check finds a newer release -> banner on Today
  p = await open("main", { release: true });
  await sleep(600);
  await shot(p, "04-today-update-banner");
  await tap(p, "Обновить", { wait: 700 });
  await p.evaluate(() => { const els = [...document.querySelectorAll("div")].filter((d) => d.textContent.trim() === "Обновления"); els[0]?.scrollIntoView({ block: "start" }); });
  await sleep(400);
  await shot(p, "05-settings-update-available");
  await p.close();

  p = await open("main", { touch: true });
  await tap(p, "Начать", { wait: 700 });
  await tap(p, "Показать ответ", { wait: 800 });
  await shot(p, "06-card-back");
  // half-way swipe to the right (touch events): card tilts, "ПОМНЮ" stamp appears
  const c = await find(p, "Перевод");
  const touch = await p.touchscreen.touchStart(c.x, c.y);
  for (let i = 1; i <= 12; i++) { await touch.move(c.x + i * 10, c.y + i * 1.5); await sleep(16); }
  await sleep(200);
  await shot(p, "07-card-swipe-right");
  await touch.end();
  await sleep(500);
  await p.evaluate(() => window.getSelection()?.removeAllRanges());
  await p.close();

  p = await open("main");
  await tap(p, "Тренировки", { label: true, wait: 600 });
  await shot(p, "08-train-mistakes");
  await tap(p, "Ошибки недели", { label: true, wait: 700 });
  await tap(p, "Показать ответ", { wait: 800 });
  await shot(p, "09-mistakes-card-back");
  await p.close();

  p = await open("toast");
  await sleep(400);
  await shot(p, "10-achievement-toast");
  await p.close();

  p = await open("main");
  await tap(p, "Профиль", { label: true, wait: 600 });
  await tap(p, "Настройки", { label: true, wait: 600 });
  await shot(p, "11-settings-language");
  await p.close();

  p = await open("main", { lang: "en" });
  await shot(p, "12-today-en");
  await tap(p, "Start", { wait: 700 });
  await tap(p, "Show answer", { wait: 800 });
  await shot(p, "13-card-back-en");
  await p.close();

  p = await open("main", { lang: "uk" });
  await shot(p, "14-today-uk");
  await tap(p, "Профіль", { label: true, wait: 600 });
  await shot(p, "15-profile-uk");
  await p.close();

  p = await open("dark", { dark: true, lang: "en" });
  await tap(p, "Practice", { label: true, wait: 600 });
  await shot(p, "16-train-en-dark");
  await p.close();
} catch (e) {
  console.error("ERR", e.message);
} finally {
  await browser.close();
}
