import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildQueue, CardState, freezeLeft, weekOf, currentStreak, dayNumber, deckStats, nextQueue, recordStudy, schedule, MIN_EASE, MAX_INTERVAL,
} from "../src/logic/srs";
import { WORDS } from "../src/data/words";

const T = 20000;

test("new card: good -> 1 day, then 3 days, then interval*ease", () => {
  let s = schedule(undefined, "good", T);
  assert.equal(s.interval, 1); assert.equal(s.due, T + 1); assert.equal(s.reps, 1); assert.equal(s.ease, 2.5);
  s = schedule(s, "good", T + 1);
  assert.equal(s.interval, 3); assert.equal(s.due, T + 4);
  s = schedule(s, "good", T + 4);
  assert.equal(s.interval, 8); // round(3*2.5)=8
  s = schedule(s, "good", T + 12);
  assert.equal(s.interval, 20);
});

test("again resets reps, keeps card due today, lowers ease, counts lapse only for learned cards", () => {
  const fresh = schedule(undefined, "again", T);
  assert.equal(fresh.interval, 0); assert.equal(fresh.due, T); assert.equal(fresh.lapses, 0); assert.equal(fresh.ease, 2.3);
  const learned: CardState = { ease: 2.5, interval: 10, reps: 3, lapses: 0, due: T, last: T - 10 };
  const s = schedule(learned, "again", T);
  assert.equal(s.reps, 0); assert.equal(s.lapses, 1); assert.equal(s.due, T);
  const after = schedule(s, "good", T);
  assert.equal(after.interval, 1);
});

test("hard grows slowly and lowers ease, never below minimum", () => {
  const c: CardState = { ease: 1.35, interval: 10, reps: 3, lapses: 0, due: T, last: T - 10 };
  const s = schedule(c, "hard", T);
  assert.equal(s.interval, 12); assert.equal(s.ease, MIN_EASE);
  assert.equal(schedule(undefined, "hard", T).interval, 1);
  const s2 = schedule({ ...c, interval: 1, reps: 1 }, "hard", T);
  assert.equal(s2.interval, 2);
});

test("interval is capped", () => {
  const c: CardState = { ease: 3, interval: 300, reps: 8, lapses: 0, due: T, last: T - 300 };
  assert.equal(schedule(c, "good", T).interval, MAX_INTERVAL);
});

test("buildQueue: due first (oldest first), then new up to daily limit, max session size", () => {
  const words = WORDS.map((w) => ({ id: w.id, topic: w.topic }));
  const cards: Record<string, CardState> = {};
  for (let i = 0; i < 5; i++) cards[words[i].id] = { ease: 2.5, interval: 3, reps: 2, lapses: 0, due: T - i, last: T - 4 };
  cards[words[5].id] = { ease: 2.5, interval: 3, reps: 2, lapses: 0, due: T + 2, last: T - 1 }; // not due
  const q = buildQueue(words, cards, { today: T, maxCards: 20, newPerDay: 10, newDoneToday: 0, topics: [] });
  assert.equal(q.due.length, 5);
  assert.equal(q.due[0], words[4].id); // most overdue first
  assert.equal(q.fresh.length, 10);
  assert.ok(q.fresh.every((id) => !cards[id]));
  // new cards are interleaved across topics
  const topics = new Set(q.fresh.map((id) => WORDS.find((w) => w.id === id)!.topic));
  assert.ok(topics.size >= 8, `expected variety, got ${topics.size}`);

  const q2 = buildQueue(words, cards, { today: T, maxCards: 20, newPerDay: 10, newDoneToday: 7, topics: [] });
  assert.equal(q2.fresh.length, 3);
  const q3 = buildQueue(words, cards, { today: T, maxCards: 8, newPerDay: 10, newDoneToday: 0, topics: [] });
  assert.equal(q3.due.length + q3.fresh.length, 8);
  const q4 = buildQueue(words, cards, { today: T, maxCards: 20, newPerDay: 10, newDoneToday: 0, topics: ["essen"] });
  assert.ok([...q4.due, ...q4.fresh].every((id) => WORDS.find((w) => w.id === id)!.topic === "essen"));
  assert.equal(q4.due.length, 0);
});

test("nextQueue re-inserts 'again' cards 3 positions later", () => {
  assert.deepEqual(nextQueue(["a", "b", "c", "d", "e"], "again"), ["b", "c", "d", "a", "e"]);
  assert.deepEqual(nextQueue(["a", "b"], "again"), ["b", "a"]);
  assert.deepEqual(nextQueue(["a"], "again"), ["a"]);
  assert.deepEqual(nextQueue(["a", "b"], "good"), ["b"]);
  assert.deepEqual(nextQueue([], "good"), []);
});

test("streak logic", () => {
  let s = { lastDay: null as number | null, streak: 0, best: 0 };
  assert.equal(currentStreak(s, T), 0);
  s = recordStudy(s, T); assert.equal(s.streak, 1);
  s = recordStudy(s, T); assert.equal(s.streak, 1);
  s = recordStudy(s, T + 1); assert.equal(s.streak, 2);
  assert.equal(currentStreak(s, T + 2), 2); // still alive the next day
  assert.equal(currentStreak(s, T + 3), 2); // one missed day: weekly freeze keeps it
  assert.equal(currentStreak(s, T + 4), 0); // broken
  s = recordStudy(s, T + 5); assert.equal(s.streak, 1); assert.equal(s.best, 2);
});

test("dayNumber uses local calendar day", () => {
  const a = dayNumber(new Date(2026, 9, 8, 0, 5));
  const b = dayNumber(new Date(2026, 9, 8, 23, 55));
  const c = dayNumber(new Date(2026, 9, 9, 0, 1));
  assert.equal(a, b); assert.equal(c, a + 1);
});

test("deckStats", () => {
  const words = [{ id: "a", topic: "x" }, { id: "b", topic: "x" }, { id: "c", topic: "x" }];
  const st = deckStats(words, {
    a: { ease: 2.5, interval: 25, reps: 5, lapses: 0, due: T + 3, last: T },
    b: { ease: 2.5, interval: 0, reps: 0, lapses: 1, due: T, last: T },
  }, T);
  assert.deepEqual(st, { total: 3, seen: 2, learned: 1, mature: 1, dueToday: 1 });
});

test("full simulated month of daily sessions stays sane", () => {
  const words = WORDS.map((w) => ({ id: w.id, topic: w.topic }));
  const cards: Record<string, CardState> = {};
  let rng = 42;
  const rand = () => ((rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let day = T; day < T + 30; day++) {
    const q = buildQueue(words, cards, { today: day, maxCards: 20, newPerDay: 10, newDoneToday: 0, topics: [] });
    let queue = [...q.due, ...q.fresh];
    let guard = 0;
    while (queue.length && guard++ < 200) {
      const r = rand();
      const g = r < 0.15 ? "again" : r < 0.35 ? "hard" : "good";
      cards[queue[0]] = schedule(cards[queue[0]], g, day);
      queue = nextQueue(queue, g);
    }
    assert.ok(guard < 200, "session terminated");
  }
  const st = deckStats(words, cards, T + 30);
  assert.ok(st.seen > 100 && st.seen <= 300, `seen ${st.seen}`);
  assert.ok(Object.values(cards).every((c) => c.ease >= MIN_EASE && c.interval >= 0));
});

test("weekly streak freeze covers one missed day per week", () => {
  const mon = 20_000 - ((20_000 + 3) % 7); // a Monday
  assert.equal(weekOf(mon), weekOf(mon + 6));
  assert.notEqual(weekOf(mon), weekOf(mon + 7));
  let s = { lastDay: null as number | null, streak: 0, best: 0 } as Parameters<typeof recordStudy>[0];
  s = recordStudy(s, mon);
  s = recordStudy(s, mon + 1); // Tue
  assert.equal(freezeLeft(s, mon + 2), true);
  s = recordStudy(s, mon + 3); // skipped Wed -> freeze used
  assert.equal(s.streak, 3);
  assert.equal(s.freezeWeek, weekOf(mon + 2));
  assert.equal(freezeLeft(s, mon + 3), false);
  s = recordStudy(s, mon + 5); // skipped Fri, freeze already used this week
  assert.equal(s.streak, 1);
  assert.equal(s.best, 3);
  s = recordStudy(s, mon + 6);
  s = recordStudy(s, mon + 8); // skipped next Monday -> new week, fresh freeze
  assert.equal(s.streak, 3);
  assert.equal(currentStreak({ lastDay: mon, streak: 4, best: 4, freezeWeek: weekOf(mon + 1) }, mon + 2), 0);
});
