export type TopicId =
  | "alltag"
  | "arbeit"
  | "wohnung"
  | "amt"
  | "einkaufen"
  | "gesundheit"
  | "verkehr"
  | "essen"
  | "zeit"
  | "verben"
  | "adjektive"
  | "custom";

export type Article = "der" | "die" | "das";
export type Kind = "noun" | "verb" | "adj" | "phrase";

export interface Word {
  /** Stable id used as the key for SRS progress. */
  id: string;
  topic: TopicId;
  kind: Kind;
  /** Lemma without article, e.g. "Paradeiser" or "umsteigen". */
  de: string;
  article?: Article;
  /** Full plural form without article. null = no plural / not used in plural. */
  plural?: string | null;
  /** Noun used only in plural (die Möbel, die Kenntnisse). */
  pluralOnly?: boolean;
  /** Verb principal parts or adjective comparison, e.g. "fährt, fuhr, ist gefahren". */
  forms?: string;
  ru: string;
  ex: string;
  /** Russian translation of the example sentence. */
  exRu?: string;
  /** User-created word ("Мои слова"). */
  custom?: boolean;
  /** Austrian-specific word/usage. */
  at?: boolean;
  note?: string;
}

export interface Topic {
  id: TopicId;
  de: string;
  ru: string;
  emoji: string;
}

export const TOPICS: Topic[] = [
  { id: "alltag", de: "Alltag", ru: "Повседневное", emoji: "☕" },
  { id: "arbeit", de: "Arbeit / Büro", ru: "Работа и офис", emoji: "💼" },
  { id: "wohnung", de: "Wohnung", ru: "Жильё", emoji: "🏠" },
  { id: "amt", de: "Behörden / Amt", ru: "Учреждения", emoji: "🏛️" },
  { id: "einkaufen", de: "Einkaufen", ru: "Покупки", emoji: "🛒" },
  { id: "gesundheit", de: "Gesundheit", ru: "Здоровье", emoji: "🩺" },
  { id: "verkehr", de: "Verkehr", ru: "Транспорт", emoji: "🚋" },
  { id: "essen", de: "Essen", ru: "Еда", emoji: "🥨" },
  { id: "zeit", de: "Zeit", ru: "Время", emoji: "⏰" },
  { id: "verben", de: "Verben", ru: "Глаголы", emoji: "🏃" },
  { id: "adjektive", de: "Adjektive", ru: "Прилагательные и наречия", emoji: "✨" },
  { id: "custom", de: "Meine Wörter", ru: "Мои слова", emoji: "⭐" },
];
