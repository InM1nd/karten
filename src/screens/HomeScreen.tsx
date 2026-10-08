import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TOPICS, TopicId } from "../data/types";
import { Direction, Settings } from "../logic/data";
import { DeckStats } from "../logic/srs";
import { Btn, Chip, FadeIn, Pressy, SectionTitle, Segmented, StatSplit, T } from "../ui/components";
import { Icon, IconName } from "../ui/Icon";
import { dateLabel, greeting, plural, weekDots } from "../ui/format";
import { font, useTheme } from "../ui/theme";

export interface HomeProps {
  stats: DeckStats;
  streak: number;
  bestStreak: number;
  lastStudyDay: number | null;
  today: number;
  newToday: number;
  reviewsToday: number;
  queueSize: number;
  queueDue: number;
  queueNew: number;
  unseenInFilter: number;
  settings: Settings;
  onStart: (extraNew: boolean) => void;
  onSettings: (patch: Partial<Settings>) => void;
  onOpenBrowse: () => void;
  onOpenSettings: () => void;
  onOpen: (screen: "article" | "speed" | "typing" | "custom" | "achievements") => void;
  articleBest: number;
  speedBest: number;
  customCount: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
  onEnableReminder: () => void;
  now?: Date;
}

export const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: "de-ru", label: "DE → RU" },
  { value: "ru-de", label: "RU → DE" },
  { value: "mixed", label: "Вперемешку" },
];

function ModeTile(p: { icon: IconName; title: string; sub: string; onPress: () => void; right: boolean; last: boolean }) {
  const t = useTheme();
  return (
    <Pressy
      onPress={p.onPress}
      accessibilityRole="button"
      scaleTo={0.98}
      style={[
        styles.tile,
        { borderBottomColor: t.border },
        !p.right && { borderRightWidth: 1, borderRightColor: t.border, paddingRight: 12 },
        p.right && { paddingLeft: 16 },
      ]}
    >
      <Icon name={p.icon} size={22} color={t.text} />
      <View style={{ flex: 1 }}>
        <T v="h3" style={{ fontSize: 16 }}>{p.title}</T>
        <T v="small" dim style={{ marginTop: 3 }} numberOfLines={1}>{p.sub}</T>
      </View>
    </Pressy>
  );
}

export function HomeScreen(p: HomeProps) {
  const t = useTheme();
  const now = p.now ?? new Date();
  const g = greeting(now);
  const minutes = Math.max(1, Math.ceil((p.queueSize * 15) / 60));
  const week = weekDots(p.today, p.lastStudyDay, p.streak);
  const toggleTopic = (id: TopicId) => {
    const set = new Set(p.settings.topics);
    set.has(id) ? set.delete(id) : set.add(id);
    p.onSettings({ topics: TOPICS.map((x) => x.id).filter((x) => set.has(x)) });
  };
  const hh = String(p.settings.reminderHour).padStart(2, "0"), mm = String(p.settings.reminderMinute).padStart(2, "0");

  const tiles: { icon: IconName; title: string; sub: string; go: () => void }[] = [
    { icon: "target", title: "Артикли", sub: `рекорд ${p.articleBest}`, go: () => p.onOpen("article") },
    { icon: "bolt", title: "Скорость", sub: `рекорд ${p.speedBest}`, go: () => p.onOpen("speed") },
    { icon: "pen", title: "Письмо", sub: "10 за раунд", go: () => p.onOpen("typing") },
    { icon: "star", title: "Мои слова", sub: p.customCount ? `${p.customCount} ${plural(p.customCount, "слово", "слова", "слов")}` : "добавь свои", go: () => p.onOpen("custom") },
    { icon: "book", title: "Словарь", sub: `${p.stats.total} ${plural(p.stats.total, "слово", "слова", "слов")}`, go: p.onOpenBrowse },
    { icon: "trophy", title: "Достижения", sub: `${p.achievementsUnlocked}/${p.achievementsTotal}`, go: () => p.onOpen("achievements") },
  ];

  return (
    <FadeIn>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <T v="bodyM" dim>{dateLabel(now)}</T>
          <Pressy onPress={p.onOpenSettings} hitSlop={14} accessibilityRole="button" accessibilityLabel="Настройки" scaleTo={0.9}>
            <Icon name="sliders" size={21} color={t.text} />
          </Pressy>
        </View>

        <Text style={[styles.hello, { color: t.text }]}>
          {g.ru}
          {"\n"}
          <Text style={{ color: t.faint }}>{g.de}</Text>
        </Text>

        <View style={styles.streak}>
          <View style={[styles.dot, { backgroundColor: p.streak > 0 ? t.accent : t.faint }]} />
          <T v="bodyM">
            {p.streak > 0 ? `${p.streak} ${plural(p.streak, "день", "дня", "дней")} подряд` : "Начни серию сегодня"}
          </T>
          {p.bestStreak > 0 ? <T v="bodyM" dim> · рекорд {p.bestStreak}</T> : null}
        </View>

        {p.queueSize > 0 ? (
          <>
            <View style={styles.big}>
              <Text style={[styles.bigNum, { color: t.text }]} accessibilityLabel={`${p.queueSize} карточек на сегодня`}>{p.queueSize}</Text>
              <T v="body" dim style={{ paddingBottom: 8, fontSize: 17 }}>
                {plural(p.queueSize, "карточка", "карточки", "карточек")}
                {"\n"}на сегодня
              </T>
            </View>
            <View style={{ marginTop: 24 }}>
              <StatSplit
                items={[
                  { value: p.queueDue, label: "повторить" },
                  { value: p.queueNew, label: "новых" },
                  { value: `${minutes} мин`, label: "примерно" },
                ]}
              />
            </View>
            <Btn title="Начать" arrow onPress={() => p.onStart(false)} style={{ marginTop: 22 }} />
          </>
        ) : (
          <View style={{ marginTop: 34 }}>
            <T v="h1">На сегодня всё.</T>
            <T v="body" dim style={{ marginTop: 10 }}>
              {p.reviewsToday > 0 ? `Сегодня повторено: ${p.reviewsToday}. ` : ""}Возвращайся завтра — или выучи ещё несколько слов.
            </T>
            <Btn title="Ещё 10 новых слов" variant="outline" disabled={p.unseenInFilter === 0} onPress={() => p.onStart(true)} style={{ marginTop: 22 }} />
            {p.unseenInFilter === 0 ? (
              <T v="small" dim style={{ marginTop: 10, textAlign: "center" }}>В выбранных темах новых слов больше нет.</T>
            ) : null}
          </View>
        )}

        <View style={styles.week}>
          {week.map((d) => (
            <View key={d.day} style={styles.wd}>
              <T v="small" color={d.today ? t.accent : d.done ? t.text : t.faint} style={{ fontSize: 12 }}>{d.label}</T>
              <View
                style={[
                  styles.wdot,
                  { backgroundColor: d.done ? t.text : t.border },
                  d.today && !d.done && { backgroundColor: t.bg, borderWidth: 2, borderColor: t.accent, width: 10, height: 10 },
                  d.today && d.done && { backgroundColor: t.accent },
                ]}
              />
            </View>
          ))}
        </View>

        {!p.settings.reminderEnabled && !p.settings.reminderPromptDismissed ? (
          <View style={[styles.banner, { borderColor: t.border }]}>
            <Icon name="bell" size={20} color={t.text} />
            <T v="bodyM" style={{ flex: 1 }}>Напоминать каждый день в {hh}:{mm}?</T>
            <Pressable onPress={p.onEnableReminder} hitSlop={8} accessibilityRole="button">
              <Text style={[font.semibold, { color: t.accent, fontSize: 15 }]}>Включить</Text>
            </Pressable>
            <Pressable onPress={() => p.onSettings({ reminderPromptDismissed: true })} hitSlop={10} accessibilityLabel="Скрыть">
              <Icon name="x" size={18} color={t.textDim} />
            </Pressable>
          </View>
        ) : null}

        <SectionTitle>Режимы</SectionTitle>
        <View style={[styles.grid, { borderTopColor: t.border }]}>
          {tiles.map((x, i) => (
            <ModeTile key={x.title} icon={x.icon} title={x.title} sub={x.sub} onPress={x.go} right={i % 2 === 1} last={i >= 4} />
          ))}
        </View>

        <SectionTitle>Направление</SectionTitle>
        <Segmented value={p.settings.direction} options={DIRECTION_OPTIONS} onChange={(v) => p.onSettings({ direction: v })} />

        <SectionTitle>Темы</SectionTitle>
        <View style={styles.chips}>
          <Chip label="Все темы" active={p.settings.topics.length === 0} onPress={() => p.onSettings({ topics: [] })} />
          {TOPICS.filter((tp) => tp.id !== "custom" || p.customCount > 0).map((tp) => (
            <Chip key={tp.id} label={tp.de} active={p.settings.topics.includes(tp.id)} onPress={() => toggleTopic(tp.id)} />
          ))}
        </View>

        <View style={{ marginTop: 26 }}>
          <StatSplit
            items={[
              { value: p.stats.learned, label: `выучено из ${p.stats.total}` },
              { value: p.stats.mature, label: "знаю хорошо" },
              { value: p.stats.dueToday, label: "к повторению" },
            ]}
          />
        </View>
      </ScrollView>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { ...font.semibold, fontSize: 34, lineHeight: 37, letterSpacing: -1.2, marginTop: 22 },
  streak: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  big: { flexDirection: "row", alignItems: "flex-end", gap: 14, marginTop: 30 },
  bigNum: { ...font.semibold, fontSize: 112, lineHeight: 108, letterSpacing: -6.5, includeFontPadding: false },
  week: { flexDirection: "row", justifyContent: "space-between", marginTop: 28, paddingHorizontal: 4 },
  wd: { alignItems: "center", gap: 9, width: 30 },
  wdot: { width: 8, height: 8, borderRadius: 5 },
  banner: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, marginTop: 26 },
  grid: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1 },
  tile: { width: "50%", flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, borderBottomWidth: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
});
