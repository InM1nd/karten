import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync } from "node:fs";
const seeds = JSON.parse(readFileSync("/workspace/tools/seeds.json", "utf8"));
const OUT = "/workspace/apps/german-cards/design/v1.3-screens";
mkdirSync(OUT, { recursive: true });
const URL = "http://127.0.0.1:8131/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--force-color-profile=srgb", "--font-render-hinting=none"] });

async function open(seed, { dark = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 892, deviceScaleFactor: 3 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }]);
  const data = seed ? JSON.stringify(seeds[seed]) : null;
  await page.evaluateOnNewDocument((data) => {
    const target = new Date(2026, 9, 8, 8, 40, 0).getTime();
    const shift = target - Date.now();
    const RealDate = Date;
    class FakeDate extends RealDate {
      constructor(...a) { if (a.length === 0) super(RealDate.now() + shift); else super(...a); }
      static now() { return RealDate.now() + shift; }
    }
    // eslint-disable-next-line no-global-assign
    window.Date = FakeDate;
    localStorage.clear();
    if (data) localStorage.setItem("karten:data:v1", data);
  }, data);
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.goto(URL, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await sleep(700);
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
  await shot(p, "01-today");
  await p.mouse.move(206, 500); await p.mouse.wheel({ deltaY: 600 }); await sleep(500);
  await shot(p, "02-today-scrolled");
  await p.close();

  p = await open("dark", { dark: true });
  await shot(p, "03-today-dark");
  await p.close();

  p = await open("main");
  await tap(p, "Что учим", { label: true, wait: 500 });
  await shot(p, "04-today-setup");
  await p.close();

  p = await open("main");
  await tap(p, "Начать", { wait: 700 });
  await shot(p, "05-card-front");
  await tap(p, "Показать ответ", { wait: 800 });
  await shot(p, "06-card-back");
  await p.close();

  p = await open("dark", { dark: true });
  await tap(p, "Начать", { wait: 700 });
  await tap(p, "Показать ответ", { wait: 800 });
  await shot(p, "07-card-back-dark");
  await p.close();

  // austrian word with note: walk the queue until one shows "В Австрии"
  p = await open("main");
  await tap(p, "Начать", { wait: 700 });
  for (let i = 0; i < 25; i++) {
    await tap(p, "Показать ответ", { wait: 700 });
    const at = await p.evaluate(() => [...document.querySelectorAll("div")].some((d) => d.textContent.trim() === "В Австрии"));
    if (at) { await shot(p, "08-card-back-austria"); break; }
    await tap(p, "Помню", { wait: 500 });
  }
  await p.close();

  p = await open("main");
  await tap(p, "Начать", { wait: 700 });
  await tap(p, "Показать ответ", { wait: 700 });
  await tap(p, "Помню", { wait: 500 });
  await tap(p, "Отменить", { label: true, wait: 600 });
  await shot(p, "09-card-after-undo");
  await p.close();

  p = await open("finished");
  await shot(p, "10-today-finished");
  await p.close();

  p = await open("main");
  await tap(p, "Тренировки", { label: true, wait: 600 });
  await shot(p, "11-train");
  await tap(p, "Словарь", { label: true, wait: 700 });
  await shot(p, "12-dictionary");
  await tap(p, "Мои слова", { label: true, wait: 600 });
  await shot(p, "13-custom-words");
  await p.close();

  p = await open("main");
  await tap(p, "Профиль", { label: true, wait: 600 });
  await shot(p, "14-profile");
  await tap(p, "Настройки", { label: true, wait: 600 });
  await shot(p, "15-settings");
  await p.close();

  p = await open("dark", { dark: true });
  await tap(p, "Профиль", { label: true, wait: 600 });
  await shot(p, "16-profile-dark");
  await p.close();

  p = await open(null);
  await shot(p, "17-today-first-launch");
  await p.close();
} catch (e) {
  console.error("ERR", e.message);
} finally {
  await browser.close();
}
