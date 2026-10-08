/** Daily reminder planning. Pure: produces the list of notifications to schedule. */
import { CardState } from "./srs";

export interface ReminderInput {
  enabled: boolean;
  hour: number;
  minute: number;
  now: Date;
  /** Today's session is finished (nothing due, daily new limit reached or nothing new left). */
  todayDone: boolean;
  cards: Record<string, CardState>;
  /** ids of words in the active topic filter */
  wordIds: string[];
  /** day number of `now` (local) */
  today: number;
  newPerDay: number;
  streak: number;
  /** how many days ahead to schedule */
  days?: number;
}

export interface ReminderItem {
  date: Date;
  title: string;
  body: string;
}

export const REMINDER_DAYS = 7;

export function minutesFor(cards: number) {
  return Math.max(1, Math.ceil((cards * 15) / 60));
}

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};
export const cardsWord = (n: number) => plural(n, "карточка", "карточки", "карточек");
export const newWordsWord = (n: number) => plural(n, "новое слово", "новых слова", "новых слов");
export const daysWord = (n: number) => plural(n, "день", "дня", "дней");

export function planReminders(i: ReminderInput): ReminderItem[] {
  if (!i.enabled) return [];
  const days = i.days ?? REMINDER_DAYS;
  const out: ReminderItem[] = [];
  const unseen = i.wordIds.filter((id) => !i.cards[id]).length;
  for (let off = 0; off < days; off++) {
    if (off === 0 && i.todayDone) continue;
    const date = new Date(i.now.getFullYear(), i.now.getMonth(), i.now.getDate() + off, i.hour, i.minute, 0, 0);
    if (date.getTime() <= i.now.getTime() + 60_000) continue;
    const day = i.today + off;
    const due = i.wordIds.filter((id) => i.cards[id] && i.cards[id].due <= day).length;
    // new words: the full daily portion on future days (assuming earlier days' portions were learned)
    const fresh = Math.max(0, Math.min(i.newPerDay, unseen - off * i.newPerDay));
    const total = due + fresh;
    if (total === 0) continue;
    const parts: string[] = [];
    if (due > 0) parts.push(`${due} ${cardsWord(due)} к повторению`);
    if (fresh > 0) parts.push(`${fresh} ${newWordsWord(fresh)}`);
    let body = `${parts.join(" и ")} · ~${minutesFor(Math.min(total, 30))} мин.`;
    if (off === 0 && i.streak > 0) body += ` Не прерывай серию: 🔥 ${i.streak} ${daysWord(i.streak)}!`;
    out.push({ date, title: off === 0 ? "Пора повторить немецкий 🇦🇹" : "Karten: 5 минут немецкого", body });
  }
  return out;
}

/** Stable signature to avoid rescheduling when nothing changed. */
export function planSignature(items: ReminderItem[]): string {
  return items.map((x) => `${x.date.getTime()}|${x.body}`).join(";");
}
