import assert from "node:assert/strict";
import { test } from "node:test";
import { dirLabel, ex2Text, localizeWord, makeDeck, matchesQuery, orderByLevel } from "../src/ui/deck";
import { DECK15 } from "../src/data/deck15";
import { listenScore, listenSelection, makeSpeedQuestion, optionLabel, packWords } from "../src/logic/games";
import { buildQueue } from "../src/logic/srs";
import { Word } from "../src/data/types";

const rnd = () => 0.42;

test("deck in EN/UK shows the chosen language everywhere (meaning, example, note)", () => {
  for (const l of ["en", "uk"] as const) {
    const d = makeDeck([], l);
    assert.equal(d.words.length, DECK15.length);
    for (const w of d.words) {
      const src = DECK15.find((x) => x.id === w.id)!;
      assert.equal(w.ru, src.tr![l]);
      assert.equal(w.exRu, src.exTr![l]);
      if (src.note) assert.equal(w.note, src.noteTr![l]);
      assert.equal(w.de, src.de);
    }
  }
  const ru = makeDeck([], "ru");
  assert.equal(ru.words[0], DECK15[0], "RU keeps the original objects");
});

test("custom words are never altered by the translation language", () => {
  const c: Word = { id: "custom:1", topic: "custom", kind: "noun", article: "das", de: "Beisl", plural: "Beisln", ru: "пивная", ex: "", custom: true };
  const d = makeDeck([c], "en");
  assert.equal(d.byId["custom:1"], c);
  assert.equal(localizeWord(c, "uk"), c);
});

test("speed/listen options use the display language", () => {
  const d = makeDeck([], "en");
  const w = d.words.find((x) => x.id === DECK15[0].id)!;
  const q = makeSpeedQuestion(w, d.words.slice(0, 50), "de-ru", rnd);
  for (const o of q.options) assert.ok(!/[а-яё]/i.test(optionLabel(o, "de-ru")), optionLabel(o, "de-ru"));
});

test("level ordering: words above the learner's level come last, order otherwise kept", () => {
  const a1 = orderByLevel(DECK15, "A1");
  const firstB1 = a1.findIndex((w) => w.level !== "A1");
  assert.ok(a1.slice(firstB1).every((w) => w.level !== "A1"));
  assert.equal(a1.length, DECK15.length);
  const b1 = orderByLevel(DECK15, "B1");
  assert.deepEqual(b1.map((w) => w.id), DECK15.map((w) => w.id));
  const q = buildQueue(makeDeck([], "ru", "A1").words, {}, { today: 100, maxCards: 20, newPerDay: 20, newDoneToday: 0, topics: [] });
  const by = Object.fromEntries(DECK15.map((w) => [w.id, w]));
  assert.ok(q.fresh.every((id) => by[id].level === "A1"), "A1 learner gets A1 new cards first");
});

test("search finds words by German and any translation", () => {
  const w = DECK15.find((x) => x.tr && x.tr.en.length > 4)!;
  assert.ok(matchesQuery(w, w.tr!.en.toLowerCase()));
  assert.ok(matchesQuery(w, w.tr!.uk.toLowerCase()));
  assert.ok(matchesQuery(w, w.de.toLowerCase()));
  assert.ok(!matchesQuery(w, "zzzqqq"));
});

test("direction labels follow the translation language", () => {
  assert.equal(dirLabel("DE → RU", "en"), "DE → EN");
  assert.equal(dirLabel("RU → DE", "uk"), "UK → DE");
  assert.equal(dirLabel("Вперемешку", "en"), "Вперемешку");
});

test("ex2 text per language", () => {
  const w = DECK15.find((x) => x.ex2)!;
  assert.equal(ex2Text(w, "en"), w.ex2!.tr.en);
  assert.equal(ex2Text(DECK15.find((x) => !x.ex2)!, "en"), undefined);
});

test("listening round: n distinct words, weak cards included; score", () => {
  const words = DECK15.slice(0, 100);
  const cards = { [words[5].id]: { ease: 2, interval: 0, reps: 1, lapses: 1, due: 1, last: 1 } };
  const sel = listenSelection(words, cards, 10, rnd);
  assert.equal(sel.length, 10);
  assert.equal(new Set(sel.map((w) => w.id)).size, 10);
  assert.ok(sel.some((w) => w.id === words[5].id));
  assert.equal(listenScore(8, 3), 74);
  assert.equal(listenScore(0, 5), 0);
});

test("situation packs resolve in the localized deck", () => {
  const d = makeDeck([], "uk");
  for (const p of ["amt", "arzt", "vermieter"]) {
    const ws = packWords(d.words, p);
    assert.ok(ws.length >= 12, p);
    assert.ok(ws.every((w) => w.ru === w.tr!.uk));
  }
});
