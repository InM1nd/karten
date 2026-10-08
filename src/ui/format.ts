export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

const WEEKDAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
export const WEEK_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/** "Четверг, 8 октября" */
export function dateLabel(d: Date = new Date()): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Russian greeting + German counterpart by hour. */
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
  return WEEK_SHORT.map((label, i) => {
    const d = monday + i;
    const done = lastDay !== null && streak > 0 && d <= lastDay && d > lastDay - streak;
    return { label, day: d, done, today: d === today, future: d > today };
  });
}
