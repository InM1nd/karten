// Builds realistic AppData states for the screenshots (v1.2+, updated for the 1.5 deck), using the app's own logic.
import { writeFileSync } from "node:fs";
import { emptyData, AppData } from "../../src/logic/data";
import { DECK15 as WORDS } from "../../src/data/deck15";
import { dayNumber, deckStats, schedule } from "../../src/logic/srs";
import { ACHIEVEMENTS } from "../../src/logic/achievements";

const today = dayNumber(new Date(2026, 9, 8, 8, 40));
const custom = [
  { id: "custom:kaffeehaus", topic: "custom", kind: "noun", article: "das", de: "Kaffeehaus", plural: "Kaffeehäuser", ru: "венское кафе", ex: "Wir treffen uns im Kaffeehaus.", exRu: "Встречаемся в кафе.", custom: true },
  { id: "custom:bim", topic: "custom", kind: "noun", article: "die", de: "Bim", plural: "Bims", ru: "трамвай (вен.)", ex: "Ich fahre mit der Bim.", custom: true },
  { id: "custom:ausgehen", topic: "custom", kind: "phrase", de: "sich ausgehen", ru: "успеть, уложиться", ex: "Das geht sich nicht aus.", custom: true },
] as any[];

function base(): AppData {
  const d = emptyData();
  d.customWords = custom;
  d.settings = { ...d.settings, onboarded: true, level: "B1" };
  const words = [...WORDS, ...custom];
  // 150 words seen: mix of mature, young and due today
  words.slice(0, 150).forEach((w, i) => {
    let c = schedule(undefined, "good", today - 40 + (i % 30));
    if (i % 3 === 0) for (let k = 0; k < 4; k++) c = schedule(c, "good", c.due);
    c = { ...c, due: i % 17 === 0 ? today : Math.max(today + 1, c.due) };
    d.cards[w.id] = c;
  });
  d.streak = { lastDay: today - 1, streak: 6, best: 12 };
  d.daily = { day: today, newCount: 0, reviewCount: 0 };
  d.records = { articleBest: 31, speedBest: 260, listenBest: 84 };
  d.counters = { sessionsDone: 34, typingCorrect: 21, articleRounds: 9, articlePerfectRounds: 1, speedRounds: 6, listenRounds: 3 };
  const stats = deckStats(words as any, d.cards, today);
  const ctx = {
    bestStreak: 12, learned: stats.learned, mature: stats.mature,
    austrianLearned: words.filter((w: any) => w.at && (d.cards[w.id]?.interval ?? 0) >= 1).length,
    sessionsDone: 34, articleBest: 31, articlePerfectRounds: 1, speedBest: 260, typingCorrect: 21, customWords: custom.length,
  };
  const t0 = new Date(2026, 8, 1).getTime();
  ACHIEVEMENTS.forEach((a: (typeof ACHIEVEMENTS)[number], i: number) => { if (a.progress(ctx) >= a.goal) d.achievements[a.id] = t0 + i * 2 * 86400000; });
  return d;
}

const main = base();
const dark = { ...base(), settings: { ...base().settings, theme: "dark" as const } };
const finished = base();
Object.keys(finished.cards).forEach((k) => { if (finished.cards[k].due <= today) finished.cards[k] = { ...finished.cards[k], due: today + 3 }; });
finished.daily = { day: today, newCount: 10, reviewCount: 18 };
finished.streak = { lastDay: today, streak: 7, best: 12 };
const short = base();
let n = 0;
Object.keys(short.cards).forEach((k) => { if (short.cards[k].due <= today && n++ >= 2) short.cards[k] = { ...short.cards[k], due: today + 2 }; });
short.daily = { day: today, newCount: 9, reviewCount: 0 };
const toast = base();
delete toast.achievements["custom_first"];
const fresh = emptyData();
const en = { ...base(), settings: { ...base().settings, trLang: "en" as const } };
const uk = { ...base(), settings: { ...base().settings, trLang: "uk" as const, lang: "uk" as const } };
// one card short of the daily goal (20): finishing a card fires the confetti
const nearGoal = base();
nearGoal.daily = { day: today, newCount: 8, reviewCount: 11 };
// missed yesterday, streak kept by this week's freeze
const frozen = base();
frozen.streak = { lastDay: today - 2, streak: 6, best: 12 };
writeFileSync("/workspace/tools/seeds.json", JSON.stringify({ main, dark, finished, short, toast, fresh, en, uk, nearGoal, frozen }));
console.log("today", today, "cards", Object.keys(main.cards).length, "ach", Object.keys(main.achievements).length);
