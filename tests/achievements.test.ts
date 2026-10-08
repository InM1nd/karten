import assert from "node:assert/strict";
import { test } from "node:test";
import { ACHIEVEMENTS, AchievementCtx, newlyUnlocked } from "../src/logic/achievements";

const zero: AchievementCtx = {
  bestStreak: 0, learned: 0, mature: 0, austrianLearned: 0, sessionsDone: 0, articleBest: 0,
  articlePerfectRounds: 0, speedBest: 0, typingCorrect: 0, customWords: 0,
};

test("12–15 unique achievements", () => {
  assert.ok(ACHIEVEMENTS.length >= 12 && ACHIEVEMENTS.length <= 15);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
});

test("nothing unlocked at start", () => {
  assert.deepEqual(newlyUnlocked({}, zero), []);
});

test("thresholds unlock exactly the right badges", () => {
  assert.deepEqual(newlyUnlocked({}, { ...zero, bestStreak: 3 }), ["streak_3"]);
  assert.deepEqual(newlyUnlocked({}, { ...zero, bestStreak: 7 }).sort(), ["streak_3", "streak_7"]);
  assert.deepEqual(newlyUnlocked({}, { ...zero, learned: 100 }).sort(), ["learned_100", "learned_50"]);
  assert.deepEqual(newlyUnlocked({}, { ...zero, speedBest: 199 }), []);
  assert.deepEqual(newlyUnlocked({}, { ...zero, speedBest: 500 }).sort(), ["speed_200", "speed_500"]);
  assert.deepEqual(newlyUnlocked({}, { ...zero, articlePerfectRounds: 1 }), ["article_perfect"]);
  assert.deepEqual(newlyUnlocked({}, { ...zero, customWords: 1 }), ["custom_first"]);
  assert.deepEqual(newlyUnlocked({}, { ...zero, sessionsDone: 1 }), ["first_session"]);
  assert.deepEqual(newlyUnlocked({}, { ...zero, typingCorrect: 50 }), ["typing_50"]);
  assert.deepEqual(newlyUnlocked({}, { ...zero, austrianLearned: 20 }), ["austria_20"]);
});

test("already unlocked badges are not reported again", () => {
  assert.deepEqual(newlyUnlocked({ streak_3: 1 }, { ...zero, bestStreak: 5 }), []);
});
