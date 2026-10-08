/** Achievement definitions and evaluation. Pure. */

export interface AchievementCtx {
  bestStreak: number;
  learned: number;
  mature: number;
  austrianLearned: number;
  sessionsDone: number;
  articleBest: number;
  articlePerfectRounds: number;
  speedBest: number;
  typingCorrect: number;
  customWords: number;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  /** current progress value and goal, for the progress bar */
  progress: (c: AchievementCtx) => number;
  goal: number;
}

const A = (id: string, emoji: string, title: string, desc: string, goal: number, progress: (c: AchievementCtx) => number): Achievement =>
  ({ id, emoji, title, desc, goal, progress });

export const ACHIEVEMENTS: Achievement[] = [
  A("first_session", "🌱", "Первый шаг", "Завершить первое занятие", 1, (c) => c.sessionsDone),
  A("streak_3", "🔥", "Три дня подряд", "Заниматься 3 дня без пропусков", 3, (c) => c.bestStreak),
  A("streak_7", "📅", "Неделя без пропусков", "Серия 7 дней", 7, (c) => c.bestStreak),
  A("streak_30", "🏔️", "Месяц силы", "Серия 30 дней", 30, (c) => c.bestStreak),
  A("learned_50", "📗", "50 слов", "Выучить 50 слов", 50, (c) => c.learned),
  A("learned_100", "📘", "Сотня", "Выучить 100 слов", 100, (c) => c.learned),
  A("learned_300", "📚", "Словарный запас", "Выучить 300 слов", 300, (c) => c.learned),
  A("mature_50", "🧠", "Крепкая память", "50 слов с интервалом от 21 дня", 50, (c) => c.mature),
  A("austria_20", "🇦🇹", "Echt Wienerisch", "Выучить 20 австрийских слов", 20, (c) => c.austrianLearned),
  A("article_perfect", "🎯", "Ни одной ошибки", "Раунд артиклей без ошибок (от 10 ответов)", 1, (c) => c.articlePerfectRounds),
  A("article_25", "🏅", "Мастер артиклей", "25 очков в тренажёре артиклей", 25, (c) => c.articleBest),
  A("speed_200", "⚡", "Быстрый старт", "200 очков в режиме «Скорость»", 200, (c) => c.speedBest),
  A("speed_500", "🌩️", "Молния", "500 очков в режиме «Скорость»", 500, (c) => c.speedBest),
  A("typing_50", "⌨️", "Писарь", "Правильно написать 50 слов", 50, (c) => c.typingCorrect),
  A("custom_first", "⭐", "Свой словарь", "Добавить первое своё слово", 1, (c) => c.customWords),
];

export const ACHIEVEMENTS_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export function isUnlocked(a: Achievement, c: AchievementCtx): boolean {
  return a.progress(c) >= a.goal;
}

/** Ids that are reached now but not yet recorded as unlocked. */
export function newlyUnlocked(unlocked: Record<string, number>, c: AchievementCtx): string[] {
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && isUnlocked(a, c)).map((a) => a.id);
}
