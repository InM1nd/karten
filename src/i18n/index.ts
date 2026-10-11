/**
 * Tiny i18n: the Russian UI string is the key; EN / UK dictionaries map it to translations.
 * Pure (no React Native imports) so logic modules and tests can use it.
 * German words are never translated; card meanings (word.ru / exRu) stay Russian.
 */
import { EN, EN_PLURAL } from "./en";
import { UK, UK_PLURAL } from "./uk";

export type Lang = "ru" | "en" | "uk";
export const LANGS: { value: Lang; label: string }[] = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "uk", label: "Українська" },
];

let LANG: Lang = "ru";
export const setLang = (l: Lang) => {
  LANG = l === "en" || l === "uk" ? l : "ru";
};
export const getLang = () => LANG;

const fill = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;

/** Translate a Russian UI string (optionally with {placeholders}). */
export function tr(ru: string, vars?: Record<string, string | number>): string {
  const d = LANG === "en" ? EN : LANG === "uk" ? UK : null;
  return fill((d && d[ru]) || ru, vars);
}

function slavic(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

/** Plural form; arguments are the Russian one/few/many forms (also the lookup key). */
export function pl(n: number, one: string, few: string, many: string): string {
  const key = `${one}|${few}|${many}`;
  if (LANG === "en") {
    const e = EN_PLURAL[key];
    if (e) return Math.abs(n) === 1 ? e[0] : e[1];
  } else if (LANG === "uk") {
    const u = UK_PLURAL[key];
    if (u) return slavic(n, u[0], u[1], u[2]);
  }
  return slavic(n, one, few, many);
}

/** Locale tag for Intl / dates. */
export const locale = () => (LANG === "en" ? "en-GB" : LANG === "uk" ? "uk-UA" : "ru-RU");
