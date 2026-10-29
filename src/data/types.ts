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
  | "bank"
  | "bildung"
  | "freizeit"
  | "gefuehle"
  | "situationen"
  | "custom";

/** Language of card translations (meaning, example, note). */
export type TrLang = "ru" | "uk" | "en";
export type Tr = Record<TrLang, string>;
export type CefrLevel = "A1" | "A2" | "B1";
/** Situation packs (phrase sets for one real-life situation). */
export type PackId = "amt" | "arzt" | "vermieter";

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
  /** 1.5: meaning in every translation language (tr.ru === ru). Custom words may only have ru. */
  tr?: Tr;
  /** 1.5: translation of `ex` in every language. */
  exTr?: Tr;
  /** 1.5: note in every language. */
  noteTr?: Tr;
  /** 1.5: CEFR level (built-in words only). */
  level?: CefrLevel;
  /** 1.5: second example for core verbs. */
  ex2?: { de: string; tr: Tr };
  /** 1.5: situation pack membership. */
  packs?: PackId[];
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
  { id: "bank", de: "Bank / Geld", ru: "Банк и деньги", emoji: "🏦" },
  { id: "bildung", de: "Schule / Kurs", ru: "Учёба и курсы", emoji: "🎓" },
  { id: "freizeit", de: "Freizeit", ru: "Досуг", emoji: "🎭" },
  { id: "gefuehle", de: "Menschen / Gefühle", ru: "Люди и чувства", emoji: "💬" },
  { id: "situationen", de: "Situationen", ru: "Ситуации", emoji: "🗣️" },
  { id: "custom", de: "Meine Wörter", ru: "Мои слова", emoji: "⭐" },
];

export interface Pack {
  id: PackId;
  de: string;
  title: Tr;
  emoji: string;
}

export const PACKS: Pack[] = [
  { id: "amt", de: "Am Amt", title: { ru: "В учреждении", uk: "В установі", en: "At the office" }, emoji: "🏛️" },
  { id: "arzt", de: "Beim Arzt", title: { ru: "У врача", uk: "У лікаря", en: "At the doctor's" }, emoji: "🩺" },
  { id: "vermieter", de: "Mit dem Vermieter", title: { ru: "С арендодателем", uk: "З орендодавцем", en: "With the landlord" }, emoji: "🔑" },
];
