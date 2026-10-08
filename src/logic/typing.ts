/** Tolerant answer checking for the typing mode. Pure. */
import { Word } from "../data/types";

export type TypingStatus = "correct" | "article" | "typo" | "wrong";

export interface TypingResult {
  status: TypingStatus;
  /** What we expected, in display form (with umlauts), e.g. "der Paradeiser". */
  expected: string;
  /** Char diff of the user's answer against `expected`. */
  diff: DiffPart[];
}

export interface DiffPart {
  type: "same" | "missing" | "extra";
  text: string;
}

/** Lowercase, ä→ae ö→oe ü→ue ß→ss, strip punctuation, collapse spaces. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[’'`´]/g, "")
    .replace(/[.,!?…;:"„“«»()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Display form of the expected answer. */
export function expectedAnswer(w: Word): string {
  return w.kind === "noun" && w.article ? `${w.article} ${w.de}` : w.de;
}

function variants(w: Word): string[] {
  const out = [expectedAnswer(w)];
  if (w.kind === "verb" && w.de.startsWith("sich ")) out.push(w.de.slice(5));
  // "Das geht sich (nicht) aus." -> with and without the bracketed part
  if (/\(.+\)/.test(w.de)) {
    out.push(w.de.replace(/\s*\(.+?\)\s*/g, " "));
    out.push(w.de.replace(/[()]/g, ""));
  }
  return out.map(normalize);
}

const ARTICLE_RE = /^(der|die|das|den|dem|des)\s+/;

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export function checkTyping(input: string, w: Word): TypingResult {
  const expected = expectedAnswer(w);
  const typed = normalize(input);
  const vs = variants(w);
  const diff = diffChars(input.trim(), expected);
  if (vs.includes(typed)) return { status: "correct", expected, diff };

  if (w.kind === "noun") {
    const bare = typed.replace(ARTICLE_RE, "");
    if (bare === normalize(w.de)) return { status: "article", expected, diff };
  }
  // one typo allowed for longer answers (not for the article itself)
  const target = vs[0];
  if (target.length >= 6 && levenshtein(typed, target) === 1) {
    const typedArt = typed.match(ARTICLE_RE)?.[1];
    if (!w.article || typedArt === w.article) return { status: "typo", expected, diff };
  }
  return { status: "wrong", expected, diff };
}

/** Character-level LCS diff (case-insensitive). `missing` = in expected only, `extra` = typed only. */
export function diffChars(typed: string, expected: string): DiffPart[] {
  const a = [...typed], b = [...expected];
  const m = a.length, n = b.length;
  const eq = (x: string, y: string) => x.toLowerCase() === y.toLowerCase();
  const L: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--) L[i][j] = eq(a[i], b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const parts: DiffPart[] = [];
  const push = (type: DiffPart["type"], ch: string) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += ch;
    else parts.push({ type, text: ch });
  };
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (eq(a[i], b[j])) {
      push("same", b[j]);
      i++; j++;
    } else if (L[i + 1][j] >= L[i][j + 1]) push("extra", a[i++]);
    else push("missing", b[j++]);
  }
  while (i < m) push("extra", a[i++]);
  while (j < n) push("missing", b[j++]);
  return parts;
}
