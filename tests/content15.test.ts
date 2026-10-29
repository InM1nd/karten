/** Karten 1.5 content completeness + quality checks for the whole deck (old + new). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DECK15, NEW_IDS, parseNew } from "../src/data/deck15";
import { PACKS, TOPICS } from "../src/data/types";

const LANGS = ["ru", "uk", "en"] as const;

test("deck size ~1000 and every topic populated", () => {
  assert.ok(DECK15.length >= 950, `only ${DECK15.length}`);
  assert.ok(NEW_IDS.size >= 550, `only ${NEW_IDS.size} new`);
  for (const t of TOPICS.filter((x) => x.id !== "custom")) {
    const n = DECK15.filter((w) => w.topic === t.id).length;
    assert.ok(n >= 25, `topic ${t.id} has ${n}`);
  }
});

test("ids unique", () => {
  const ids = DECK15.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every entry has meaning, example and note in RU/UK/EN and a level", () => {
  for (const w of DECK15) {
    assert.ok(w.level && ["A1", "A2", "B1"].includes(w.level), `level ${w.id}`);
    for (const l of LANGS) {
      assert.ok(w.tr?.[l]?.trim(), `tr.${l} ${w.id}`);
      assert.ok(w.exTr?.[l]?.trim(), `exTr.${l} ${w.id}`);
      if (w.note) assert.ok(w.noteTr?.[l]?.trim(), `noteTr.${l} ${w.id}`);
    }
    assert.equal(w.tr!.ru, w.ru);
    assert.ok(w.ex.trim() && /[.!?…]$/.test(w.ex), `example ${w.id}`);
  }
});

test("languages are not mixed up", () => {
  for (const w of DECK15) {
    for (const o of [w.tr!, w.exTr!, w.noteTr, w.ex2?.tr]) {
      if (!o) continue;
      assert.ok(!/[ыэъё]/i.test(o.uk), `RU letters in UK: ${w.id}: ${o.uk}`);
      assert.ok(!/[іїєґ]/i.test(o.ru), `UK letters in RU: ${w.id}: ${o.ru}`);
      assert.ok(!/[а-яёіїєґ]/i.test(o.en), `Cyrillic in EN: ${w.id}: ${o.en}`);
    }
    for (const o of [w.tr!, w.exTr!]) assert.ok(/[а-яё]/i.test(o.ru) && /[а-яіїєґ']/i.test(o.uk), `cyrillic RU/UK: ${w.id}`);
  }
});

test("translated examples end with punctuation like the German one", () => {
  for (const w of DECK15) for (const l of LANGS) assert.ok(/[.!?…»")]$/.test(w.exTr![l].trim()), `ex ${l} ${w.id}: ${w.exTr![l]}`);
});

test("nouns, verbs well-formed", () => {
  for (const w of DECK15) {
    if (w.kind === "noun") {
      assert.ok(w.article && ["der", "die", "das"].includes(w.article), `article ${w.id}`);
      assert.ok(w.plural !== undefined, `plural ${w.id}`);
      if (w.pluralOnly) assert.equal(w.article, "die");
    } else assert.equal(w.article, undefined, w.id);
    if (w.kind === "verb") assert.equal(w.forms?.split(",").length, 3, `verb forms ${w.id}`);
  }
});

test("levels spread", () => {
  for (const lv of ["A1", "A2", "B1"]) assert.ok(DECK15.filter((w) => w.level === lv).length >= 150, lv);
});

test("situation packs have ~15 phrases each", () => {
  for (const p of PACKS) {
    const n = DECK15.filter((w) => w.packs?.includes(p.id)).length;
    assert.ok(n >= 12, `pack ${p.id}: ${n}`);
  }
});

test("phrases: at least 100", () => {
  assert.ok(DECK15.filter((w) => w.kind === "phrase").length >= 100);
});

test("ex2 for core verbs", () => {
  assert.ok(DECK15.filter((w) => w.ex2).length >= 30);
});

test("parser rejects malformed lines", () => {
  assert.throws(() => parseNew("@alltag\nn|der|Tisch|Tische|A1|стол"));
  assert.throws(() => parseNew("@alltag\nn|der|Tisch|Tische|C2|стол|стіл|table|Ex.|Пр.|Пр.|Ex."));
  assert.throws(() => parseNew("@alltag\nf|-|Hallo!||A1|п|п|h|Hallo!|П.|П.|H.|только ru"));
});
