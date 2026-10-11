import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { EN, EN_PLURAL } from "../src/i18n/en";
import { UK, UK_PLURAL } from "../src/i18n/uk";
import { pl, setLang, tr } from "../src/i18n";
import { ACHIEVEMENTS } from "../src/logic/achievements";
import { TOPICS } from "../src/data/types";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? (f === "i18n" ? [] : files(p)) : /\.tsx?$/.test(f) ? [p] : [];
  });
}

test("every tr() string and plural form has EN and UK translations", () => {
  const src = [join(__dirname, "../App.tsx"), ...files(join(__dirname, "../src"))].map((f) => readFileSync(f, "utf8")).join("\n");
  const keys = new Set([...src.matchAll(/\btr\(\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`)));
  for (const a of ACHIEVEMENTS) keys.add(a.title), keys.add(a.desc);
  for (const t of TOPICS) keys.add(t.ru);
  const missEn = [...keys].filter((k) => !(k in EN));
  const missUk = [...keys].filter((k) => !(k in UK));
  assert.deepEqual(missEn, []);
  assert.deepEqual(missUk, []);
  for (const m of src.matchAll(/\bpl(?:ural)?\([^,]+,\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)"\)/g)) {
    const k = `${m[1]}|${m[2]}|${m[3]}`;
    assert.ok(EN_PLURAL[k] && UK_PLURAL[k], k);
  }
});

test("placeholders survive translation; plurals per language", () => {
  setLang("en");
  assert.equal(tr("Доступна версия {v}", { v: "1.5.0" }), "Version 1.5.0 is available");
  assert.equal(pl(1, "карточка", "карточки", "карточек"), "card");
  assert.equal(pl(5, "карточка", "карточки", "карточек"), "cards");
  setLang("uk");
  assert.equal(pl(3, "день", "дня", "дней"), "дні");
  assert.equal(pl(11, "день", "дня", "дней"), "днів");
  setLang("ru");
  assert.equal(tr("Сегодня"), "Сегодня");
  for (const [k, v] of Object.entries(EN)) {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    assert.equal(ph(v), ph(k), `EN ${k}`);
    assert.equal(ph(UK[k] ?? k), ph(k), `UK ${k}`);
  }
});
