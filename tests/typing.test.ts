import assert from "node:assert/strict";
import { test } from "node:test";
import { checkTyping, diffChars, normalize, levenshtein } from "../src/logic/typing";
import { WORDS_BY_ID } from "../src/data/words";
import { Word } from "../src/data/types";

const W = (id: string): Word => {
  const w = WORDS_BY_ID[id];
  assert.ok(w, id);
  return w;
};

test("normalize: case, umlauts, ß, punctuation, spaces", () => {
  assert.equal(normalize("  Der  KÜHLSCHRANK! "), "der kuehlschrank");
  assert.equal(normalize("Straße"), "strasse");
  assert.equal(normalize("Grüß Gott!"), "gruess gott");
  assert.equal(normalize("U-Bahn"), "u bahn");
});

test("nouns need the article; umlaut substitutes and case are accepted", () => {
  const w = W("der Kühlschrank");
  assert.equal(checkTyping("der Kühlschrank", w).status, "correct");
  assert.equal(checkTyping("DER kuehlschrank", w).status, "correct");
  assert.equal(checkTyping("Kühlschrank", w).status, "article");
  assert.equal(checkTyping("das Kühlschrank", w).status, "article");
  assert.equal(checkTyping("der Kühlschrnk", w).status, "typo");
  assert.equal(checkTyping("die Kühlschrnk", w).status, "wrong");
  assert.equal(checkTyping("der Herd", w).status, "wrong");
  assert.equal(checkTyping("", w).status, "wrong");
});

test("ß / ss and Austrian words", () => {
  assert.equal(checkTyping("die Strassenbahn", W("die Straßenbahn")).status, "correct");
  assert.equal(checkTyping("der Erdapfel", W("der Erdapfel")).status, "correct");
  assert.equal(checkTyping("das Sackerl", W("das Sackerl")).status, "correct");
  assert.equal(checkTyping("der Jaenner", W("der Jänner")).status, "correct");
});

test("verbs: optional 'sich', adjectives plain", () => {
  assert.equal(checkTyping("sich bewerben", W("sich bewerben")).status, "correct");
  assert.equal(checkTyping("bewerben", W("sich bewerben")).status, "correct");
  assert.equal(checkTyping("umziehen", W("umziehen")).status, "correct");
  assert.equal(checkTyping("muede", W("müde")).status, "correct");
  assert.equal(checkTyping("gross", W("groß")).status, "correct");
  // short words: no typo tolerance
  assert.equal(checkTyping("gruß", W("groß")).status, "wrong");
});

test("diffChars marks missing and extra characters", () => {
  const d = diffChars("der Kulschrank", "der Kühlschrank");
  // same + missing reconstructs the expected word, same + extra reconstructs the input
  assert.equal(d.filter((x) => x.type !== "extra").map((x) => x.text).join(""), "der Kühlschrank");
  assert.equal(d.filter((x) => x.type !== "missing").map((x) => x.text).join("").toLowerCase(), "der kulschrank");
  assert.ok(d.some((x) => x.type === "missing" && x.text.includes("ü")));
  assert.ok(d.some((x) => x.type === "extra" && x.text.includes("u")));
  const same = diffChars("Haus", "haus");
  assert.deepEqual(same, [{ type: "same", text: "haus" }]);
  assert.deepEqual(diffChars("", "der"), [{ type: "missing", text: "der" }]);
});

test("levenshtein", () => {
  assert.equal(levenshtein("kitten", "sitting"), 3);
  assert.equal(levenshtein("", "abc"), 3);
  assert.equal(levenshtein("abc", "abc"), 0);
});
