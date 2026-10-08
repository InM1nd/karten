/** Pure helpers for the article trainer, speed mode and typing mode. */
import { Article, Word } from "../data/types";
import { CardState, MATURE_INTERVAL } from "./srs";

export type Rng = () => number;

export function shuffle<T>(arr: T[], rnd: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Nouns usable in the article trainer (singular nouns with an article). */
export function articlePool(words: Word[]): Word[] {
  return words.filter((w) => w.kind === "noun" && !!w.article && !w.pluralOnly);
}

export const SWIPE_ARTICLE: Record<"left" | "up" | "right", Article> = { left: "der", up: "die", right: "das" };

/** Speed mode scoring: 10 points × multiplier; multiplier grows every 5 correct answers in a row. */
export function speedPoints(comboBefore: number): number {
  return 10 * (1 + Math.floor(comboBefore / 5));
}

export interface SpeedQuestion {
  word: Word;
  dir: "de-ru" | "ru-de";
  options: Word[]; // 4 words, one of them is `word`
}

function label(w: Word, dir: "de-ru" | "ru-de") {
  return dir === "de-ru" ? w.ru : w.kind === "noun" ? `${w.article} ${w.de}` : w.de;
}

/** Builds a question with 3 distractors of the same kind (distinct option labels). */
export function makeSpeedQuestion(word: Word, pool: Word[], dir: "de-ru" | "ru-de", rnd: Rng = Math.random): SpeedQuestion {
  const target = label(word, dir);
  const seen = new Set([target]);
  const same = shuffle(pool.filter((w) => w.id !== word.id && w.kind === word.kind), rnd);
  const other = shuffle(pool.filter((w) => w.id !== word.id && w.kind !== word.kind), rnd);
  const opts: Word[] = [];
  for (const w of [...same, ...other]) {
    const l = label(w, dir);
    if (seen.has(l)) continue;
    seen.add(l);
    opts.push(w);
    if (opts.length === 3) break;
  }
  return { word, dir, options: shuffle([word, ...opts], rnd) };
}

/** Text shown on an answer button. */
export const optionLabel = label;

/** Words for speed mode: words already being learned if there are enough, else the whole deck. */
export function speedPool(words: Word[], cards: Record<string, CardState>): Word[] {
  const seen = words.filter((w) => cards[w.id]);
  return seen.length >= 20 ? seen : words;
}

/** Typing round: due cards first, then weakest seen cards, then new; no phrases. */
export function typingSelection(words: Word[], cards: Record<string, CardState>, today: number, n = 10): Word[] {
  const pool = words.filter((w) => w.kind !== "phrase");
  const due = pool.filter((w) => cards[w.id] && cards[w.id].due <= today).sort((a, b) => cards[a.id].due - cards[b.id].due);
  const weak = pool
    .filter((w) => cards[w.id] && cards[w.id].due > today && cards[w.id].interval < MATURE_INTERVAL)
    .sort((a, b) => cards[a.id].interval - cards[b.id].interval);
  const fresh = pool.filter((w) => !cards[w.id]);
  const out: Word[] = [];
  for (const w of [...due, ...weak, ...fresh]) {
    if (out.length >= n) break;
    out.push(w);
  }
  return out;
}

/** Deterministic "word of the day": prefers words not yet well known. */
export function wordOfDay(words: Word[], cards: Record<string, CardState>, day: number): Word | undefined {
  const notMature = words.filter((w) => !(cards[w.id]?.interval >= MATURE_INTERVAL));
  const pool = notMature.length ? notMature : words;
  if (!pool.length) return undefined;
  // simple integer hash so consecutive days don't give neighbouring words
  let h = Math.imul(day, 2654435761) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return pool[h % pool.length];
}
