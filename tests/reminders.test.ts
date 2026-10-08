import assert from "node:assert/strict";
import { test } from "node:test";
import { planReminders, planSignature, cardsWord } from "../src/logic/reminders";
import { CardState } from "../src/logic/srs";

const T = 20369;
const card = (due: number): CardState => ({ ease: 2.5, interval: 2, reps: 1, lapses: 0, due, last: due - 2 });
const ids = Array.from({ length: 30 }, (_, i) => `w${i}`);
const base = {
  enabled: true, hour: 19, minute: 0, today: T, todayDone: false, newPerDay: 10, streak: 3,
  wordIds: ids, cards: { w0: card(T), w1: card(T - 1), w2: card(T + 2) } as Record<string, CardState>,
};

test("disabled -> nothing scheduled", () => {
  assert.deepEqual(planReminders({ ...base, enabled: false, now: new Date(2026, 9, 8, 10, 0) }), []);
});

test("schedules 7 days at the chosen local time, today included when still ahead", () => {
  const plan = planReminders({ ...base, now: new Date(2026, 9, 8, 10, 0) });
  assert.equal(plan.length, 7);
  // 27 unseen words: days 0-1 get 10 new, day 2 gets 7, later days none
  assert.match(plan[2].body, /7 новых слов/);
  assert.ok(!plan[3].body.includes("нов"));
  assert.equal(plan[0].date.getHours(), 19);
  assert.equal(plan[0].date.getMinutes(), 0);
  assert.equal(plan[0].date.getDate(), 8);
  assert.match(plan[0].body, /2 карточки к повторению и 10 новых слов/);
  assert.match(plan[0].body, /серию: 🔥 3 дня/);
  assert.equal(plan[1].date.getDate(), 9);
});

test("counts due cards per future day and stops when nothing is left", () => {
  const few = { ...base, wordIds: ["w0", "w1", "w2"] }; // no unseen words
  const plan = planReminders({ ...few, now: new Date(2026, 9, 8, 10, 0) });
  // day 0: 2 due; day 1: 2 due; day 2..6: 3 due
  assert.equal(plan.length, 7);
  assert.match(plan[0].body, /^2 карточки к повторению/);
  assert.match(plan[2].body, /^3 карточки к повторению/);
  assert.ok(!plan[2].body.includes("новых"));
});

test("skips today if the session is done or the time has passed", () => {
  const done = planReminders({ ...base, todayDone: true, now: new Date(2026, 9, 8, 10, 0) });
  assert.equal(done[0].date.getDate(), 9);
  const late = planReminders({ ...base, now: new Date(2026, 9, 8, 19, 30) });
  assert.equal(late[0].date.getDate(), 9);
  const almost = planReminders({ ...base, now: new Date(2026, 9, 8, 18, 59, 30) }); // < 1 min ahead -> skip
  assert.equal(almost[0].date.getDate(), 9);
});

test("custom time and month rollover", () => {
  const plan = planReminders({ ...base, hour: 7, minute: 45, now: new Date(2026, 9, 31, 8, 0) });
  assert.equal(plan[0].date.getMonth(), 10);
  assert.equal(plan[0].date.getDate(), 1);
  assert.equal(plan[0].date.getHours(), 7);
  assert.equal(plan[0].date.getMinutes(), 45);
});

test("signature changes with content", () => {
  const a = planReminders({ ...base, now: new Date(2026, 9, 8, 10, 0) });
  const b = planReminders({ ...base, hour: 20, now: new Date(2026, 9, 8, 10, 0) });
  assert.notEqual(planSignature(a), planSignature(b));
  assert.equal(planSignature(a), planSignature(planReminders({ ...base, now: new Date(2026, 9, 8, 10, 0) })));
});

test("russian plural forms", () => {
  assert.equal(cardsWord(1), "карточка");
  assert.equal(cardsWord(3), "карточки");
  assert.equal(cardsWord(5), "карточек");
  assert.equal(cardsWord(11), "карточек");
  assert.equal(cardsWord(22), "карточки");
});
