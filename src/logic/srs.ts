import { tr, pl } from "../i18n";
/**
 * Pure spaced-repetition logic (simplified SM-2). No React Native imports,
 * so it can be unit-tested with plain Node.
 */
export type Grade = "again" | "hard" | "good";

export interface CardState {
  /** Ease factor (SM-2), min 1.3. */
  ease: number;
  /** Current interval in days (0 = relearning today). */
  interval: number;
  /** Successful reviews in a row. */
  reps: number;
  lapses: number;
  /** Day number when the card is due. */
  due: number;
  /** Day number of the last review. */
  last: number;
}

export const START_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_INTERVAL = 365;
/** Interval (days) from which a card counts as "well known". */
export const MATURE_INTERVAL = 21;
/** After "again", the card comes back this many positions later in the session. */
export const AGAIN_REINSERT = 3;

/** Local calendar day as an integer (days since 1970-01-01 in local time). */
export function dayNumber(d: Date = new Date()): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

export function schedule(prev: CardState | undefined, grade: Grade, today: number): CardState {
  const ease0 = prev?.ease ?? START_EASE;
  const interval0 = prev?.interval ?? 0;
  const reps0 = prev?.reps ?? 0;
  const lapses0 = prev?.lapses ?? 0;

  if (grade === "again") {
    return {
      ease: Math.max(MIN_EASE, round2(ease0 - 0.2)),
      interval: 0,
      reps: 0,
      lapses: reps0 > 0 ? lapses0 + 1 : lapses0,
      due: today,
      last: today,
    };
  }

  let ease = ease0;
  let interval: number;
  if (grade === "hard") {
    ease = Math.max(MIN_EASE, round2(ease0 - 0.15));
    interval = reps0 === 0 ? 1 : Math.max(interval0 + 1, Math.round(interval0 * 1.2));
  } else {
    interval = reps0 === 0 ? 1 : reps0 === 1 ? 3 : Math.max(interval0 + 1, Math.round(interval0 * ease0));
  }
  interval = Math.min(MAX_INTERVAL, interval);
  return { ease, interval, reps: reps0 + 1, lapses: lapses0, due: today + interval, last: today };
}

/**
 * A mistake made in a game (articles / speed): the card becomes due today,
 * its interval is halved and ease slightly lowered. Unseen cards start learning.
 */
export function markMistake(prev: CardState | undefined, today: number): CardState {
  if (!prev) return schedule(undefined, "again", today);
  return {
    ...prev,
    ease: Math.max(MIN_EASE, round2(prev.ease - 0.15)),
    interval: prev.interval > 0 ? Math.max(1, Math.round(prev.interval / 2)) : 0,
    due: Math.min(prev.due, today),
  };
}

/** Short human-readable label for the next interval a grade would produce. */
export function previewLabel(prev: CardState | undefined, grade: Grade, today: number): string {
  const next = schedule(prev, grade, today);
  if (next.interval === 0) return tr("сейчас");
  return formatDays(next.interval);
}

export function formatDays(n: number): string {
  if (n < 31) return tr("{n} дн.", { n });
  if (n < 365) return tr("{n} мес.", { n: Math.round(n / 30) });
  return tr("{n} г.", { n: Math.round((n / 365) * 10) / 10 });
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

// ---------- Session building ----------

export interface QueueWord {
  id: string;
  topic: string;
}

export interface QueueOptions {
  today: number;
  /** Max cards in the session. */
  maxCards: number;
  /** New cards allowed per day. */
  newPerDay: number;
  /** New cards already introduced today. */
  newDoneToday: number;
  /** Topic filter; empty = all topics. */
  topics: string[];
}

export interface SessionQueue {
  due: string[];
  fresh: string[];
}

export function isDue(s: CardState | undefined, today: number): boolean {
  return !!s && s.due <= today;
}

export function buildQueue(
  words: QueueWord[],
  cards: Record<string, CardState>,
  o: QueueOptions,
): SessionQueue {
  const pool = o.topics.length ? words.filter((w) => o.topics.includes(w.topic)) : words;

  const due = pool
    .filter((w) => isDue(cards[w.id], o.today))
    .sort((a, b) => {
      const sa = cards[a.id], sb = cards[b.id];
      return sa.due - sb.due || sa.interval - sb.interval || sa.ease - sb.ease;
    })
    .slice(0, o.maxCards)
    .map((w) => w.id);

  const slots = Math.max(0, Math.min(o.maxCards - due.length, o.newPerDay - o.newDoneToday));
  const fresh = roundRobinNew(pool.filter((w) => !cards[w.id]), slots);
  return { due, fresh };
}

/** Take new cards alternating between topics (in deck order) for variety. */
function roundRobinNew(unseen: QueueWord[], n: number): string[] {
  if (n <= 0) return [];
  const byTopic = new Map<string, QueueWord[]>();
  for (const w of unseen) {
    const list = byTopic.get(w.topic) ?? [];
    list.push(w);
    byTopic.set(w.topic, list);
  }
  const lists = [...byTopic.values()];
  const out: string[] = [];
  for (let i = 0; out.length < n; i++) {
    let added = false;
    for (const l of lists) {
      if (i < l.length && out.length < n) {
        out.push(l[i].id);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

/** Re-queue after an answer: "again" puts the card back a few positions later. */
export function nextQueue(queue: string[], grade: Grade): string[] {
  const [head, ...rest] = queue;
  if (head === undefined) return [];
  if (grade !== "again") return rest;
  const pos = Math.min(AGAIN_REINSERT, rest.length);
  return [...rest.slice(0, pos), head, ...rest.slice(pos)];
}

// ---------- Streak ----------

export interface StreakState {
  lastDay: number | null;
  streak: number;
  best: number;
  /** 1.5: week number in which the weekly streak freeze was used. */
  freezeWeek?: number;
}

/** Week number (Monday-based) of a day number (day 0 = Thu 1970-01-01). */
export const weekOf = (day: number) => Math.floor((day + 3) / 7);

/** True if one missed day (yesterday) can be covered by this week's freeze. */
export function freezeAvailable(s: StreakState, today: number): boolean {
  return s.lastDay === today - 2 && s.streak > 0 && s.freezeWeek !== weekOf(today - 1);
}

export function recordStudy(s: StreakState, today: number): StreakState {
  if (s.lastDay === today) return s;
  if (s.lastDay === today - 1) {
    const streak = s.streak + 1;
    return { ...s, lastDay: today, streak, best: Math.max(s.best, streak) };
  }
  if (freezeAvailable(s, today)) {
    // one missed day per week is forgiven: the freeze covers yesterday
    const streak = s.streak + 1;
    return { ...s, lastDay: today, streak, best: Math.max(s.best, streak), freezeWeek: weekOf(today - 1) };
  }
  return { ...s, lastDay: today, streak: 1, best: Math.max(s.best, 1) };
}

export function currentStreak(s: StreakState, today: number): number {
  if (s.lastDay === null) return 0;
  if (s.lastDay === today || s.lastDay === today - 1) return s.streak;
  return freezeAvailable(s, today) ? s.streak : 0;
}

/** Is this week's freeze still unused? */
export function freezeLeft(s: StreakState, today: number): boolean {
  return s.freezeWeek !== weekOf(today);
}

// ---------- Stats ----------

export interface DeckStats {
  total: number;
  seen: number;
  learned: number;
  mature: number;
  dueToday: number;
}

export function deckStats(words: QueueWord[], cards: Record<string, CardState>, today: number): DeckStats {
  let seen = 0, learned = 0, mature = 0, dueToday = 0;
  for (const w of words) {
    const s = cards[w.id];
    if (!s) continue;
    seen++;
    if (s.interval >= 1) learned++;
    if (s.interval >= MATURE_INTERVAL) mature++;
    if (s.due <= today) dueToday++;
  }
  return { total: words.length, seen, learned, mature, dueToday };
}
