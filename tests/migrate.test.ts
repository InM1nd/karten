import assert from "node:assert/strict";
import { test } from "node:test";
import { migrate, emptyData, DATA_VERSION, DEFAULT_SETTINGS } from "../src/logic/data";

const V1 = {
  version: 1,
  cards: {
    "der Paradeiser": { ease: 2.36, interval: 3, reps: 2, lapses: 0, due: 20372, last: 20369 },
    "gehen": { ease: 2.5, interval: 1, reps: 1, lapses: 0, due: 20370, last: 20369 },
  },
  streak: { lastDay: 20369, streak: 4, best: 6 },
  daily: { day: 20369, newCount: 10, reviewCount: 14 },
  settings: { direction: "ru-de", newPerDay: 15, sessionSize: 30, topics: ["essen", "verkehr"], theme: "dark", autoSpeak: true },
};

test("v1 data migrates to v2 without losing progress", () => {
  const d = migrate(JSON.parse(JSON.stringify(V1)));
  assert.equal(d.version, DATA_VERSION);
  assert.deepEqual(d.cards, V1.cards);
  assert.deepEqual(d.streak, V1.streak);
  assert.deepEqual(d.daily, V1.daily);
  assert.equal(d.settings.direction, "ru-de");
  assert.equal(d.settings.newPerDay, 15);
  assert.equal(d.settings.sessionSize, 30);
  assert.deepEqual(d.settings.topics, ["essen", "verkehr"]);
  assert.equal(d.settings.theme, "dark");
  assert.equal(d.settings.autoSpeak, true);
  // new fields get defaults
  assert.equal(d.settings.reminderEnabled, false);
  assert.equal(d.settings.reminderHour, 19);
  assert.equal(d.settings.reminderMinute, 0);
  assert.deepEqual(d.customWords, []);
  assert.deepEqual(d.achievements, {});
  assert.deepEqual(d.records, { articleBest: 0, speedBest: 0, listenBest: 0 });
  assert.equal(d.settings.trLang, "ru");
  assert.equal(d.settings.dailyGoal, 20);
  assert.equal(d.counters.sessionsDone, 0);
});

test("migration is idempotent on v2 data and keeps v2 fields", () => {
  const once = migrate(V1);
  once.customWords.push({ id: "custom:abc", topic: "custom", kind: "noun", article: "das", de: "Kaffeehaus", plural: "Kaffeehäuser", ru: "кафе", ex: "", custom: true });
  once.achievements.first_session = 123;
  once.records.speedBest = 420;
  once.settings.reminderEnabled = true;
  const twice = migrate(JSON.parse(JSON.stringify(once)));
  assert.deepEqual(twice, once);
});

test("garbage input never throws and falls back to defaults", () => {
  for (const g of [null, undefined, 42, "x", [], { cards: "nope" }, { cards: { a: { due: "x" } }, settings: { newPerDay: "10" } }]) {
    const d = migrate(g);
    assert.equal(d.version, DATA_VERSION);
    assert.deepEqual(d.settings.newPerDay, DEFAULT_SETTINGS.newPerDay);
    assert.deepEqual(d.cards, {});
  }
  assert.deepEqual(migrate(null), emptyData());
});

test("invalid cards are dropped, valid ones kept; bad custom words dropped; reminder time clamped", () => {
  const d = migrate({
    cards: { ok: { ease: 2.5, interval: 2, reps: 1, lapses: 0, due: 5, last: 3 }, bad: { ease: 2 }, worse: null },
    customWords: [{ id: "custom:1", de: "Kaffeehaus", ru: "кафе", article: "das" }, { id: "x", de: "a", ru: "b" }, { id: "custom:2", de: "", ru: "b" }],
    settings: { reminderHour: 30, reminderMinute: -5 },
  });
  assert.deepEqual(Object.keys(d.cards), ["ok"]);
  assert.equal(d.customWords.length, 1);
  assert.equal(d.customWords[0].kind, "noun");
  assert.equal(d.customWords[0].topic, "custom");
  assert.equal(d.settings.reminderHour, 23);
  assert.equal(d.settings.reminderMinute, 0);
});

test("1.4 data migrates to 1.5 keeping progress, custom words and streak", () => {
  const v14 = {
    version: 2,
    cards: { "der Tisch": { ease: 2.4, interval: 6, reps: 3, lapses: 1, due: 20100, last: 20094 } },
    customWords: [{ id: "custom:k1", topic: "custom", kind: "noun", article: "das", de: "Beisl", plural: "Beisln", ru: "пивная", ex: "Wir gehen ins Beisl.", exRu: "Мы идём в пивную.", custom: true }],
    streak: { lastDay: 20099, streak: 12, best: 30 },
    settings: { lang: "uk", level: "B1", onboarded: true, newPerDay: 15 },
    records: { articleBest: 18, speedBest: 2400 },
    counters: { sessionsDone: 40 },
  };
  const d = migrate(v14);
  assert.deepEqual(d.cards["der Tisch"], v14.cards["der Tisch"]);
  assert.equal(d.customWords.length, 1);
  assert.equal(d.customWords[0].de, "Beisl");
  assert.equal(d.customWords[0].exRu, "Мы идём в пивную.");
  assert.equal(d.streak.streak, 12);
  assert.equal(d.streak.freezeWeek, undefined);
  assert.equal(d.settings.trLang, "ru", "existing users keep RU translations");
  assert.equal(d.settings.lang, "uk");
  assert.equal(d.settings.newPerDay, 15);
  assert.equal(d.settings.dailyGoal, 20);
  assert.equal(d.records.articleBest, 18);
  assert.equal(d.records.listenBest, 0);
  assert.equal(d.counters.listenRounds, 0);
  const again = migrate(JSON.parse(JSON.stringify({ ...d, settings: { ...d.settings, trLang: "en", dailyGoal: 30 }, streak: { ...d.streak, freezeWeek: 2871 } })));
  assert.equal(again.settings.trLang, "en");
  assert.equal(again.settings.dailyGoal, 30);
  assert.equal(again.streak.freezeWeek, 2871);
  assert.equal(migrate({ settings: { trLang: "de", dailyGoal: 7 } }).settings.trLang, "ru");
  assert.equal(migrate({ settings: { trLang: "de", dailyGoal: 7 } }).settings.dailyGoal, 20);
});
