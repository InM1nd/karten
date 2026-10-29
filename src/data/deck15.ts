/**
 * Karten 1.5 deck builder: merges the 1.0–1.4 deck (words.ts, Russian) with
 * UK/EN translations (tr/existing*.ts), CEFR levels, second examples and
 * the new 1.5 entries (new/*.ts, all three languages).
 * Pure module — used by the app and by tests.
 */
import { Article, CefrLevel, Kind, PackId, TopicId, Tr, Word } from "./types";
import { WORDS as OLD } from "./words";
import { TR_X1 } from "./tr/existing1";
import { TR_X2 } from "./tr/existing2";
import { TR_X3 } from "./tr/existing3";
import { A1_IDS, B1_IDS } from "./levels";
import { EX2 } from "./ex2";
import { NEW_ARBEIT } from "./new/arbeit";
import { NEW_AMT_WOHNUNG } from "./new/amt_wohnung";
import { NEW_GESUNDHEIT } from "./new/gesundheit";
import { NEW_EINKAUFEN_VERKEHR } from "./new/einkaufen_verkehr";
import { NEW_ESSEN_ZEIT_ALLTAG } from "./new/essen_zeit_alltag";
import { NEW_VERBEN_ADJ } from "./new/verben_adj";
import { NEW_BANK_BILDUNG } from "./new/bank_bildung";
import { NEW_FREIZEIT_GEFUEHLE } from "./new/freizeit_gefuehle";
import { NEW_SITUATIONEN } from "./new/situationen";
import { NEW_EXTRA } from "./new/extra";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

export interface TrRow { uk: string; en: string; exUk: string; exEn: string; noteUk?: string; noteEn?: string }

export function parseExistingTr(src: string): Record<string, TrRow> {
  const out: Record<string, TrRow> = {};
  for (const l of lines(src)) {
    const p = l.split("|");
    if (p.length !== 5 && p.length !== 7) throw new Error(`bad tr line: ${l}`);
    if (out[p[0]]) throw new Error(`duplicate tr id: ${p[0]}`);
    out[p[0]] = { uk: p[1], en: p[2], exUk: p[3], exEn: p[4], ...(p.length === 7 ? { noteUk: p[5], noteEn: p[6] } : {}) };
  }
  return out;
}

const KINDS: Record<string, Kind> = { n: "noun", v: "verb", a: "adj", f: "phrase" };
const LEVELS: CefrLevel[] = ["A1", "A2", "B1"];
const PACK_IDS: PackId[] = ["amt", "arzt", "vermieter"];
/** New nouns that only exist in the plural. */
const PLURAL_ONLY = new Set(["die Zinsen", "die Schulden", "die Fisolen", "die Ferien", "die Eltern", "die Großeltern"]);

/** Parses the 1.5 entry format (see new/*.ts). */
export function parseNew(src: string): Word[] {
  let topic: TopicId | null = null;
  const out: Word[] = [];
  for (const l of lines(src)) {
    if (l.startsWith("@")) {
      topic = l.slice(1) as TopicId;
      continue;
    }
    const p = l.split("|");
    if (p.length < 12 || p.length > 14) throw new Error(`bad entry (${p.length} cols): ${l}`);
    // 13 columns: the last one is either a note (has "~") or flags
    if (p.length === 13 && !p[12].includes("~") && /^(at|pl|pack:\w+)( (at|pl|pack:\w+))*$/.test(p[12])) p.splice(12, 0, "");
    const [k, art, de, pf, level, ru, uk, en, ex, exRu, exUk, exEn, note = "", flags = ""] = p;
    const kind = KINDS[k];
    if (!kind || !topic) throw new Error(`bad kind/topic: ${l}`);
    if (!LEVELS.includes(level as CefrLevel)) throw new Error(`bad level: ${l}`);
    const fl = flags.split(/\s+/).filter(Boolean);
    const w: Word = {
      id: kind === "noun" ? `${art} ${de}` : de,
      topic, kind, de, ru, ex, exRu,
      tr: { ru, uk, en },
      exTr: { ru: exRu, uk: exUk, en: exEn },
      level: level as CefrLevel,
    };
    if (kind === "noun") {
      if (!["der", "die", "das"].includes(art)) throw new Error(`bad article: ${l}`);
      w.article = art as Article;
      w.plural = pf && pf !== "-" ? pf : null;
      if (PLURAL_ONLY.has(w.id) || fl.includes("pl")) w.pluralOnly = true;
    } else if (pf && pf !== "-") {
      w.forms = pf;
    }
    if (note) {
      const [nr, nu, ne] = note.split("~");
      if (!nr || !nu || !ne) throw new Error(`note needs 3 languages: ${l}`);
      w.note = nr;
      w.noteTr = { ru: nr, uk: nu, en: ne };
    }
    if (fl.includes("at")) w.at = true;
    const packs = fl.filter((f) => f.startsWith("pack:")).map((f) => f.slice(5) as PackId);
    for (const pk of packs) if (!PACK_IDS.includes(pk)) throw new Error(`bad pack: ${l}`);
    if (packs.length) w.packs = packs;
    out.push(w);
  }
  return out;
}

function parseEx2(src: string): Record<string, { de: string; tr: Tr }> {
  const out: Record<string, { de: string; tr: Tr }> = {};
  for (const l of lines(src)) {
    const [id, de, ru, uk, en] = l.split("|");
    if (!en) throw new Error(`bad ex2: ${l}`);
    out[id] = { de, tr: { ru, uk, en } };
  }
  return out;
}

export function buildDeck(): Word[] {
  const trx = { ...parseExistingTr(TR_X1), ...parseExistingTr(TR_X2), ...parseExistingTr(TR_X3) };
  const ex2 = parseEx2(EX2);
  const old: Word[] = OLD.map((w) => {
    const t = trx[w.id];
    if (!t) throw new Error(`missing UK/EN translation for ${w.id}`);
    const out: Word = {
      ...w,
      tr: { ru: w.ru, uk: t.uk, en: t.en },
      exTr: { ru: w.exRu ?? "", uk: t.exUk, en: t.exEn },
      level: A1_IDS.has(w.id) ? "A1" : B1_IDS.has(w.id) ? "B1" : "A2",
    };
    if (w.note) {
      if (!t.noteUk || !t.noteEn) throw new Error(`missing note translation for ${w.id}`);
      out.noteTr = { ru: w.note, uk: t.noteUk, en: t.noteEn };
    }
    if (ex2[w.id]) out.ex2 = ex2[w.id];
    return out;
  });
  const fresh = [
    NEW_ARBEIT, NEW_AMT_WOHNUNG, NEW_GESUNDHEIT, NEW_EINKAUFEN_VERKEHR, NEW_ESSEN_ZEIT_ALLTAG,
    NEW_VERBEN_ADJ, NEW_BANK_BILDUNG, NEW_FREIZEIT_GEFUEHLE, NEW_SITUATIONEN, NEW_EXTRA,
  ].flatMap(parseNew);
  for (const w of fresh) if (ex2[w.id]) w.ex2 = ex2[w.id];
  const all = [...old, ...fresh];
  const seen = new Set<string>();
  for (const w of all) {
    if (seen.has(w.id)) throw new Error(`duplicate id ${w.id}`);
    seen.add(w.id);
  }
  return all;
}

export const DECK15: Word[] = buildDeck();
/** Ids of words added in 1.5 (for the "new words" badge and the sample file). */
export const NEW_IDS = new Set(DECK15.slice(OLD.length).map((w) => w.id));

/** Meaning in the chosen translation language (custom words fall back to their own text). */
export const meaning = (w: Word, l: keyof Tr) => w.tr?.[l] || w.ru;
export const exMeaning = (w: Word, l: keyof Tr) => w.exTr?.[l] || w.exRu || "";
export const noteText = (w: Word, l: keyof Tr) => w.noteTr?.[l] || w.note || "";
