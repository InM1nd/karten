import { getLang } from "../i18n";

export { pl as plural } from "../i18n";

const WD: Record<string, string[]> = {
  ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  uk: ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "Пʼятниця", "Субота"],
};
const MON: Record<string, string[]> = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  uk: ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"],
};
const SHORT: Record<string, string[]> = {
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  uk: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
};
export const WEEK_SHORT = SHORT.ru;

/** "Четверг, 8 октября" / "Thursday, 8 October" */
export function dateLabel(d: Date = new Date()): string {
  const l = getLang();
  return `${WD[l][d.getDay()]}, ${d.getDate()} ${MON[l][d.getMonth()]}`;
}

/** German greeting by hour (the Russian part is kept for compatibility). */
export function greeting(d: Date = new Date()): { ru: string; de: string } {
  const h = d.getHours();
  if (h < 5) return { ru: "Доброй ночи,", de: "Gute Nacht." };
  if (h < 11) return { ru: "Доброе утро,", de: "Guten Morgen." };
  if (h < 18) return { ru: "Добрый день,", de: "Guten Tag." };
  return { ru: "Добрый вечер,", de: "Guten Abend." };
}

/** Monday-based weekday index (0 = Monday) of a day number from srs.dayNumber (day 0 = Thu 1970-01-01). */
export const weekdayOf = (day: number) => (((day + 3) % 7) + 7) % 7;

/** Days of the current week (Mon..Sun) with study state derived from the streak. */
export function weekDots(today: number, lastDay: number | null, streak: number) {
  const monday = today - weekdayOf(today);
  return SHORT[getLang()].map((label, i) => {
    const d = monday + i;
    const done = lastDay !== null && streak > 0 && d <= lastDay && d > lastDay - streak;
    return { label, day: d, done, today: d === today, future: d > today };
  });
}
