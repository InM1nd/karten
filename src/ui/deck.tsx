import { createContext, useContext } from "react";
import { CefrLevel, TrLang, Word } from "../data/types";
import { DECK15, exMeaning, meaning, noteText } from "../data/deck15";

export interface Deck {
  words: Word[];
  byId: Record<string, Word>;
  trLang: TrLang;
}

const RANK: Record<CefrLevel, number> = { A1: 0, A2: 1, B1: 2 };

/**
 * Project a word into the chosen translation language. After this, `ru` / `exRu` / `note`
 * hold the display-language texts (historical field names), so every screen, game and widget
 * shows the selected language without knowing about it. Custom words keep what the user typed.
 */
export function localizeWord(w: Word, l: TrLang): Word {
  if (l === "ru" || !w.tr) return w;
  const out: Word = { ...w, ru: meaning(w, l) };
  if (w.exTr) out.exRu = exMeaning(w, l);
  if (w.note) out.note = noteText(w, l);
  return out;
}

/**
 * Deck order decides which new cards come first. Words above the learner's level go last;
 * inside each group the original (topic) order is kept.
 */
export function orderByLevel(words: Word[], level: CefrLevel): Word[] {
  const cap = RANK[level];
  return words
    .map((w, i) => ({ w, i, late: w.level && RANK[w.level] > cap ? 1 : 0 }))
    .sort((a, b) => a.late - b.late || a.i - b.i)
    .map((x) => x.w);
}

export function makeDeck(custom: Word[], trLang: TrLang = "ru", level: CefrLevel = "B1"): Deck {
  const words = [...orderByLevel(DECK15, level).map((w) => localizeWord(w, trLang)), ...custom];
  return { words, byId: Object.fromEntries(words.map((w) => [w.id, w])), trLang };
}

/** "DE → RU" → "DE → EN" etc. for the selected translation language. */
export function dirLabel(label: string, l: TrLang): string {
  return label.replace(/\bRU\b/g, l.toUpperCase());
}

/** The second example's translation in the display language (built-in core verbs). */
export function ex2Text(w: Word, l: TrLang): string | undefined {
  return w.ex2 ? w.ex2.tr[l] || w.ex2.tr.ru : undefined;
}

/** Search needle against German and all three translations. */
export function matchesQuery(w: Word, s: string): boolean {
  if (!s) return true;
  const hay = [w.de, w.ru, w.tr?.ru, w.tr?.uk, w.tr?.en, w.plural].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(s);
}

export const DeckContext = createContext<Deck>(makeDeck([]));
export const useDeck = () => useContext(DeckContext);
