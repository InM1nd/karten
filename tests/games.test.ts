import assert from "node:assert/strict";
import { test } from "node:test";
import { WORDS } from "../src/data/words";
import { articlePool, makeSpeedQuestion, optionLabel, speedPoints, typingSelection, wordOfDay } from "../src/logic/games";
import { markMistake, schedule } from "../src/logic/srs";

let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

test("article pool: singular nouns with article only", () => {
  const pool = articlePool(WORDS);
  assert.ok(pool.length > 150);
  assert.ok(pool.every((w) => w.kind === "noun" && w.article && !w.pluralOnly));
});

test("speed questions: 4 distinct options incl. the answer", () => {
  for (let i = 0; i < 200; i++) {
    const w = WORDS[Math.floor(rnd() * WORDS.length)];
    const dir = i % 2 ? "de-ru" : "ru-de";
    const q = makeSpeedQuestion(w, WORDS, dir, rnd);
    assert.equal(q.options.length, 4);
    assert.ok(q.options.some((o) => o.id === w.id));
    assert.equal(new Set(q.options.map((o) => optionLabel(o, dir))).size, 4);
  }
});

test("speed scoring multiplier", () => {
  assert.equal(speedPoints(0), 10);
  assert.equal(speedPoints(4), 10);
  assert.equal(speedPoints(5), 20);
  assert.equal(speedPoints(10), 30);
});

test("typing selection: due first, no phrases", () => {
  const T = 100;
  const due = WORDS.find((w) => w.kind === "verb")!;
  const cards = { [due.id]: { ...schedule(undefined, "good", T - 5), due: T - 1 } };
  const sel = typingSelection(WORDS, cards, T, 10);
  assert.equal(sel.length, 10);
  assert.equal(sel[0].id, due.id);
  assert.ok(sel.every((w) => w.kind !== "phrase"));
});

test("markMistake: unseen -> learning today; learned -> due today, interval halved", () => {
  const a = markMistake(undefined, 50);
  assert.equal(a.due, 50);
  assert.equal(a.reps, 0);
  const learned = { ease: 2.5, interval: 10, reps: 3, lapses: 0, due: 60, last: 50 };
  const b = markMistake(learned, 52);
  assert.equal(b.due, 52);
  assert.equal(b.interval, 5);
  assert.equal(b.ease, 2.35);
  assert.equal(b.reps, 3);
});

test("word of the day is deterministic and varies", () => {
  const a = wordOfDay(WORDS, {}, 20000)!;
  assert.equal(wordOfDay(WORDS, {}, 20000)!.id, a.id);
  const ids = new Set(Array.from({ length: 10 }, (_, i) => wordOfDay(WORDS, {}, 20000 + i)!.id));
  assert.ok(ids.size >= 8);
  assert.equal(wordOfDay([], {}, 1), undefined);
});
