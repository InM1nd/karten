import assert from "node:assert/strict";
import { test } from "node:test";
import { WORDS } from "../src/data/words";
import { TOPICS } from "../src/data/types";

test("deck size and topics", () => {
  assert.ok(WORDS.length >= 280, `only ${WORDS.length} words`);
  // 1.5 topics live only in the new content (see content15.test.ts)
  const NEW15 = ["bank", "bildung", "freizeit", "gefuehle", "situationen"];
  for (const t of TOPICS.filter((x) => x.id !== "custom" && !NEW15.includes(x.id))) {
    const n = WORDS.filter((w) => w.topic === t.id).length;
    assert.ok(n >= 20, `topic ${t.id} has ${n}`);
  }
});

test("ids unique", () => {
  const seen = new Map<string, number>();
  for (const w of WORDS) seen.set(w.id, (seen.get(w.id) ?? 0) + 1);
  const dups = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
  assert.deepEqual(dups, []);
});

test("entries well-formed", () => {
  for (const w of WORDS) {
    assert.ok(w.de.trim() && w.ru.trim() && w.ex.trim(), w.id);
    assert.ok(/[.!?…]$/.test(w.ex), `example punctuation: ${w.id}`);
    if (w.kind === "noun") {
      assert.ok(w.article && ["der", "die", "das"].includes(w.article), `article ${w.id}`);
      assert.ok(w.plural !== undefined, `plural defined ${w.id}`);
      assert.ok(/^[A-ZÄÖÜa-z]/.test(w.de), w.id);
      if (w.pluralOnly) assert.equal(w.article, "die");
    } else {
      assert.equal(w.article, undefined, w.id);
    }
    if (w.kind === "verb") assert.ok(w.forms && w.forms.split(",").length === 3, `verb forms ${w.id}`);
  }
});

test("Austrian words present", () => {
  const at = WORDS.filter((w) => w.at).map((w) => w.de);
  for (const must of ["Jänner", "Paradeiser", "Erdapfel", "Sackerl"]) assert.ok(at.includes(must), must);
});

test("every built-in example has a Russian translation", () => {
  const missing = WORDS.filter((w) => !w.exRu || !w.exRu.trim()).map((w) => w.id);
  assert.deepEqual(missing, []);
  for (const w of WORDS) assert.ok(/[.!?…]$/.test(w.exRu!), `exRu punctuation: ${w.id}`);
  for (const w of WORDS) assert.ok(/[а-яё]/i.test(w.exRu!), `exRu is Russian: ${w.id}`);
});

test("no orphan translations", async () => {
  const { EX_RU } = await import("../src/data/exRu");
  const ids = new Set(WORDS.map((w) => w.id));
  assert.deepEqual(Object.keys(EX_RU).filter((k) => !ids.has(k)), []);
});
