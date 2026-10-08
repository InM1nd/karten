import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync } from "node:fs";
const seeds = JSON.parse(readFileSync("/workspace/tools/seeds.json", "utf8"));
const OUT = "/workspace/apps/german-cards/design/v1.2-screens";
mkdirSync(OUT, { recursive: true });
const URL = "http://127.0.0.1:8099/";
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
  // Home
  let p = await open("main");
  await shot(p, "01-home-light");
  await p.mouse.move(206, 600); await p.mouse.wheel({ deltaY: 640 }); await sleep(500);
  await shot(p, "02-home-modes-light");
  await p.close();

  p = await open("dark", { dark: true });
  await shot(p, "03-home-dark");
  await p.close();

  // Session: front, back
  p = await open("main");
  await tap(p, "Начать", { wait: 700 });
  await shot(p, "04-card-front");
  await tap(p, "Показать ответ", { wait: 800 });
  await shot(p, "05-card-back");
  await p.close();

  p = await open("dark", { dark: true });
  await tap(p, "Начать", { wait: 700 });
  await tap(p, "Показать ответ", { wait: 800 });
  await shot(p, "06-card-back-dark");
  await p.close();

  // Session finished
  p = await open("short");
  await tap(p, "Начать", { wait: 600 });
  for (let i = 0; i < 6; i++) {
    const done = await p.evaluate(() => [...document.querySelectorAll("div")].some((d) => d.textContent.trim() === "Готово!"));
    if (done) break;
    await tap(p, "Показать ответ", { wait: 700 });
    await tap(p, "Помню", { wait: 600 });
  }
  await sleep(3800); // let the toast (if any) go
  await shot(p, "07-session-done");
  await p.close();

  // Finished home
  p = await open("finished");
  await shot(p, "08-home-finished");
  await p.close();

  // Article trainer
  p = await open("main");
  await tap(p, "Артикли", { wait: 600 });
  await shot(p, "09-article-intro");
  await tap(p, "Старт", { wait: 1500 });
  await shot(p, "10-article-play");
  await tap(p, "das →", { wait: 120 });
  await shot(p, "11-article-feedback");
  await p.close();

  // Speed
  p = await open("main");
  await tap(p, "Скорость", { wait: 600 });
  await tap(p, "Старт", { wait: 1500 });
  await shot(p, "12-speed-play");
  await p.close();

  // Typing
  p = await open("main");
  await tap(p, "Письмо", { wait: 700 });
  await p.keyboard.type("die Alltak", { delay: 10 });
  await sleep(300);
  await shot(p, "13-typing");
  await tap(p, "Проверить", { wait: 600 });
  await shot(p, "14-typing-result");
  await p.close();

  // Custom words
  p = await open("main");
  await tap(p, "Мои слова", { wait: 600 });
  await shot(p, "15-custom-list");
  await tap(p, "Kaffeehaus", { wait: 600 });
  await shot(p, "16-custom-editor");
  await p.close();

  // Dictionary
  p = await open("main");
  await tap(p, "Словарь", { wait: 700 });
  await p.mouse.click(150, 395); await sleep(500);
  await shot(p, "17-dictionary");
  await p.close();

  // Achievements
  p = await open("main");
  await tap(p, "Достижения", { wait: 700 });
  await shot(p, "18-achievements");
  await p.close();

  // Toast
  p = await open("toast");
  await sleep(500);
  await shot(p, "19-achievement-toast");
  await p.close();

  // Settings
  p = await open("main");
  await tap(p, "Настройки", { label: true, wait: 600 });
  await shot(p, "20-settings");
  await p.close();
  p = await open("dark", { dark: true });
  await tap(p, "Настройки", { label: true, wait: 600 });
  await shot(p, "21-settings-dark");
  await p.close();

  p = await open("dark", { dark: true });
  await tap(p, "Артикли", { wait: 600 });
  await tap(p, "Старт", { wait: 1500 });
  await shot(p, "23-article-play-dark");
  await p.close();

  // First launch (empty data)
  p = await open(null);
  await shot(p, "22-home-first-launch");
  await p.close();
} catch (e) {
  console.error("ERR", e.message);
} finally {
  await browser.close();
}
