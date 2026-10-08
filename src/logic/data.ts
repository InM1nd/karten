/**
 * App data model + migrations. Pure (no React Native imports) so it can be unit-tested.
 * v1 (Karten 1.0.x): { version: 1, cards, streak, daily, settings }
 * v2 (Karten 1.1.0): + customWords, achievements, records, counters, reminder settings
 */
import { Article, TopicId, Word } from "../data/types";
import { CardState, StreakState } from "./srs";

export type Direction = "de-ru" | "ru-de" | "mixed";
export type ThemePref = "system" | "light" | "dark";

export interface Settings {
  direction: Direction;
  newPerDay: number;
  sessionSize: number;
  topics: TopicId[];
  theme: ThemePref;
  autoSpeak: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  reminderPromptDismissed: boolean;
}

export interface Daily {
  day: number;
  newCount: number;
  reviewCount: number;
}

export interface Records {
  articleBest: number;
  speedBest: number;
}

export interface Counters {
  sessionsDone: number;
  typingCorrect: number;
  articleRounds: number;
  articlePerfectRounds: number;
  speedRounds: number;
}

export interface AppData {
  version: 2;
  cards: Record<string, CardState>;
  streak: StreakState;
  daily: Daily;
  settings: Settings;
  customWords: Word[];
  /** achievement id -> unlock timestamp (ms) */
  achievements: Record<string, number>;
  records: Records;
  counters: Counters;
}

export const DATA_VERSION = 2 as const;
/** AsyncStorage key — unchanged since 1.0 so existing progress is picked up on update. */
export const KEY = "karten:data:v1";

export const DEFAULT_SETTINGS: Settings = {
  direction: "de-ru",
  newPerDay: 10,
  sessionSize: 20,
  topics: [],
  theme: "system",
  autoSpeak: false,
  reminderEnabled: false,
  reminderHour: 19,
  reminderMinute: 0,
  reminderPromptDismissed: false,
};

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    cards: {},
    streak: { lastDay: null, streak: 0, best: 0 },
    daily: { day: 0, newCount: 0, reviewCount: 0 },
    settings: { ...DEFAULT_SETTINGS },
    customWords: [],
    achievements: {},
    records: { articleBest: 0, speedBest: 0 },
    counters: { sessionsDone: 0, typingCorrect: 0, articleRounds: 0, articlePerfectRounds: 0, speedRounds: 0 },
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const num = (x: unknown, d: number) => (typeof x === "number" && Number.isFinite(x) ? x : d);
const str = (x: unknown) => (typeof x === "string" ? x : "");

function cleanCard(x: unknown): CardState | null {
  if (!isObj(x)) return null;
  const due = num(x.due, NaN);
  if (!Number.isFinite(due)) return null;
  return {
    ease: Math.max(1.3, num(x.ease, 2.5)),
    interval: Math.max(0, num(x.interval, 0)),
    reps: Math.max(0, num(x.reps, 0)),
    lapses: Math.max(0, num(x.lapses, 0)),
    due,
    last: num(x.last, due),
  };
}

const ARTICLES: Article[] = ["der", "die", "das"];

export function cleanCustomWord(x: unknown): Word | null {
  if (!isObj(x)) return null;
  const id = str(x.id), de = str(x.de).trim(), ru = str(x.ru).trim();
  if (!id.startsWith("custom:") || !de || !ru) return null;
  const article = ARTICLES.includes(x.article as Article) ? (x.article as Article) : undefined;
  const w: Word = {
    id,
    topic: "custom",
    kind: article ? "noun" : x.kind === "verb" || x.kind === "adj" || x.kind === "phrase" ? x.kind : "phrase",
    de,
    ru,
    ex: str(x.ex).trim(),
    custom: true,
  };
  if (article) {
    w.article = article;
    w.plural = typeof x.plural === "string" && x.plural.trim() ? x.plural.trim() : null;
  }
  const exRu = str(x.exRu).trim();
  if (exRu) w.exRu = exRu;
  return w;
}

/**
 * Turns whatever is stored (null, v1, v2, garbage) into valid v2 data.
 * Never throws; unknown/invalid parts fall back to defaults, valid progress is kept.
 */
export function migrate(raw: unknown): AppData {
  const base = emptyData();
  if (!isObj(raw)) return base;

  const cards: Record<string, CardState> = {};
  if (isObj(raw.cards)) {
    for (const [id, c] of Object.entries(raw.cards)) {
      const ok = cleanCard(c);
      if (ok) cards[id] = ok;
    }
  }
  const st = isObj(raw.streak) ? raw.streak : {};
  const streak: StreakState = {
    lastDay: typeof st.lastDay === "number" ? st.lastDay : null,
    streak: Math.max(0, num(st.streak, 0)),
    best: Math.max(0, num(st.best, 0), num(st.streak, 0)),
  };
  const dl = isObj(raw.daily) ? raw.daily : {};
  const daily: Daily = { day: num(dl.day, 0), newCount: num(dl.newCount, 0), reviewCount: num(dl.reviewCount, 0) };

  const s = isObj(raw.settings) ? raw.settings : {};
  const settings: Settings = { ...base.settings };
  for (const k of Object.keys(base.settings) as (keyof Settings)[]) {
    const v = s[k];
    if (v !== undefined && typeof v === typeof base.settings[k] && Array.isArray(v) === Array.isArray(base.settings[k])) {
      (settings as unknown as Record<string, unknown>)[k] = v;
    }
  }
  settings.reminderHour = Math.min(23, Math.max(0, Math.round(settings.reminderHour)));
  settings.reminderMinute = Math.min(59, Math.max(0, Math.round(settings.reminderMinute)));

  const customWords = Array.isArray(raw.customWords)
    ? (raw.customWords.map(cleanCustomWord).filter(Boolean) as Word[])
    : [];

  const achievements: Record<string, number> = {};
  if (isObj(raw.achievements)) {
    for (const [k, v] of Object.entries(raw.achievements)) if (typeof v === "number") achievements[k] = v;
  }
  const r = isObj(raw.records) ? raw.records : {};
  const c = isObj(raw.counters) ? raw.counters : {};
  return {
    version: DATA_VERSION,
    cards,
    streak,
    daily,
    settings,
    customWords,
    achievements,
    records: { articleBest: num(r.articleBest, 0), speedBest: num(r.speedBest, 0) },
    counters: {
      sessionsDone: num(c.sessionsDone, 0),
      typingCorrect: num(c.typingCorrect, 0),
      articleRounds: num(c.articleRounds, 0),
      articlePerfectRounds: num(c.articlePerfectRounds, 0),
      speedRounds: num(c.speedRounds, 0),
    },
  };
}

/** Daily counters for `today` (resets when the day changes). */
export function dailyFor(d: Daily, today: number): Daily {
  return d.day === today ? d : { day: today, newCount: 0, reviewCount: 0 };
}
