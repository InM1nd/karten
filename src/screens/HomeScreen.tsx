import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TOPICS, TopicId, Word } from "../data/types";
import { Direction, Settings } from "../logic/data";
import { DeckStats } from "../logic/srs";
import { Btn, Chip, FadeIn, GermanWord, Pressy, SectionTitle, Segmented, T } from "../ui/components";
import { AtFlag, Icon, IconName } from "../ui/Icon";
import { dateLabel, greeting, weekDots } from "../ui/format";
import { germanText, speakGerman } from "../ui/speech";
import { TAB_SPACE } from "../ui/TabBar";
import { font, useTheme } from "../ui/theme";
import { Example } from "./SessionScreen";
import { ReleaseInfo } from "../logic/update";
import { tr, pl } from "../i18n";

export interface TopicProgress { id: TopicId; de: string; learned: number; total: number }

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
  firstWord?: Word;
  wordOfDay?: Word;
  topicProgress: TopicProgress[];
  onStart: (extraNew: boolean) => void;
  onSettings: (patch: Partial<Settings>) => void;
  onOpen: (screen: "article" | "speed" | "typing") => void;
  articleBest: number;
  speedBest: number;
  customCount: number;
  onEnableReminder: () => void;
  update?: ReleaseInfo | null;
  onOpenUpdate?: () => void;
  onDismissUpdate?: () => void;
  now?: Date;
}

export const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: "de-ru", label: "DE → RU" },
  { value: "ru-de", label: "RU → DE" },
  { value: "mixed", label: "Вперемешку" },
];

function QuickTile(p: { icon: IconName; title: string; sub: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressy onPress={p.onPress} accessibilityRole="button" scaleTo={0.97} style={[styles.qt, { borderColor: t.border, backgroundColor: t.bg }]}>
      <Icon name={p.icon} size={22} color={t.text} />
      <T v="label" style={{ marginTop: 12 }}>{p.title}</T>
      <T v="small" dim style={{ marginTop: 2 }} numberOfLines={1}>{p.sub}</T>
    </Pressy>
  );
}

export function HomeScreen(p: HomeProps) {
  const t = useTheme();
  const [setup, setSetup] = useState(false);
  const now = p.now ?? new Date();
  const g = greeting(now);
  const minutes = Math.max(1, Math.ceil((p.queueSize * 15) / 60));
  const week = weekDots(p.today, p.lastStudyDay, p.streak);
  const hh = String(p.settings.reminderHour).padStart(2, "0"), mm = String(p.settings.reminderMinute).padStart(2, "0");
  const toggleTopic = (id: TopicId) => {
    const set = new Set(p.settings.topics);
    set.has(id) ? set.delete(id) : set.add(id);
    p.onSettings({ topics: TOPICS.map((x) => x.id).filter((x) => set.has(x)) });
  };
  const dirLabel = tr(DIRECTION_OPTIONS.find((d) => d.value === p.settings.direction)?.label ?? "");
  const topicLabel = p.settings.topics.length === 0 ? tr("все темы")
    : p.settings.topics.length <= 2 ? p.settings.topics.map((id) => TOPICS.find((x) => x.id === id)?.de ?? id).join(", ")
    : `${p.settings.topics.length} ${pl(p.settings.topics.length, "тема", "темы", "тем")}`;
  const has = p.queueSize > 0;
  const surface = t.dark ? t.card : "#FFFFFF";
  const wd = p.wordOfDay;

  return (
    <FadeIn>
      <ScrollView contentContainerStyle={[styles.wrap, { paddingBottom: TAB_SPACE + 96 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <T v="bodyM" dim>{dateLabel(now)}</T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <View style={[styles.dot, { backgroundColor: p.streak > 0 ? t.accent : t.faint }]} />
            <T v="bodyM">{p.streak > 0 ? `${p.streak} ${pl(p.streak, "день", "дня", "дней")}` : tr("серия 0")}</T>
            {p.bestStreak > 0 ? <T v="bodyM" dim>{"· " + tr("рекорд {n}", { n: p.bestStreak })}</T> : null}
          </View>
        </View>
        <Text style={[styles.hello, { color: t.text }]}>{g.de}</Text>

        {p.update ? (
          <Pressy onPress={p.onOpenUpdate} accessibilityRole="button" scaleTo={0.99} style={[styles.upd, { backgroundColor: t.card }]}>
            <View style={[styles.dot, { backgroundColor: t.accent }]} />
            <T v="bodyM" style={{ flex: 1 }} numberOfLines={1}>{tr("Доступна версия {v}", { v: p.update.version })}</T>
            <T v="bodyM" color={t.accent}>{tr("Обновить")}</T>
            <Pressable onPress={p.onDismissUpdate} hitSlop={10} accessibilityLabel={tr("Скрыть")}>
              <Icon name="x" size={16} color={t.textDim} />
            </Pressable>
          </Pressy>
        ) : null}

        {/* card stack hero */}
        <View style={styles.stack}>
          <View style={[styles.sheet, { borderColor: t.border, backgroundColor: surface, transform: [{ rotate: "-4deg" }], left: 26, right: 26 }]} />
          <View style={[styles.sheet, { borderColor: t.border, backgroundColor: surface, transform: [{ rotate: "3deg" }], left: 14, right: 14, top: 6 }]} />
          <View style={[styles.sheet, styles.front, { borderColor: t.border, backgroundColor: surface }]}>
            {has ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
                  <Text style={[styles.bigNum, { color: t.text }]} accessibilityLabel={tr("{n} карточек на сегодня", { n: p.queueSize })}>{p.queueSize}</Text>
                  <T v="body" dim style={{ paddingBottom: 6, fontSize: 15, lineHeight: 19 }}>
                    {pl(p.queueSize, "карточка", "карточки", "карточек")}{"\n"}≈ {tr("{n} мин", { n: minutes })}
                  </T>
                </View>
                <T v="bodyM" style={{ marginTop: 16 }}>{tr("{a} повторить · {b} новых", { a: p.queueDue, b: p.queueNew })}</T>
                {p.firstWord ? (
                  <T v="small" dim style={{ marginTop: 4 }} numberOfLines={1}>
                    {tr("Первая:")} {p.firstWord.article ? <Text style={{ color: t.article[p.firstWord.article] }}>{p.firstWord.article} </Text> : null}{p.firstWord.de}
                  </T>
                ) : null}
              </>
            ) : (
              <>
                <T v="h2">{tr("На сегодня всё.")}</T>
                <T v="bodyM" dim style={{ marginTop: 8 }}>
                  {p.reviewsToday > 0 ? tr("Сегодня повторено: {n}.", { n: p.reviewsToday }) + " " : ""}{tr("Возвращайся завтра — или выучи ещё несколько слов.")}
                </T>
                {p.unseenInFilter === 0 ? <T v="small" dim style={{ marginTop: 8 }}>{tr("В выбранных темах новых слов больше нет.")}</T> : null}
              </>
            )}
          </View>
        </View>

        {/* what we study */}
        <Pressy onPress={() => setSetup((x) => !x)} accessibilityRole="button" accessibilityLabel={tr("Что учим")} scaleTo={0.99}
          style={[styles.setup, { borderColor: t.border, backgroundColor: surface }]}>
          <Icon name="sliders" size={18} color={t.text} />
          <T v="bodyM" style={{ flex: 1 }} numberOfLines={1}>{dirLabel} · {topicLabel}</T>
          <T v="bodyM" color={t.accent}>{setup ? tr("Готово") : tr("Изменить")}</T>
        </Pressy>
        {setup ? (
          <View style={{ marginTop: 14 }}>
            <Segmented value={p.settings.direction} options={DIRECTION_OPTIONS.map((o) => ({ ...o, label: tr(o.label) }))} onChange={(v) => p.onSettings({ direction: v })} />
            <View style={[styles.chips, { marginTop: 12 }]}>
              <Chip label={tr("Все темы")} active={p.settings.topics.length === 0} onPress={() => p.onSettings({ topics: [] })} />
              {TOPICS.filter((tp) => tp.id !== "custom" || p.customCount > 0).map((tp) => (
                <Chip key={tp.id} label={tp.de} active={p.settings.topics.includes(tp.id)} onPress={() => toggleTopic(tp.id)} />
              ))}
            </View>
          </View>
        ) : null}

        {wd ? (
          <>
            <SectionTitle style={{ marginTop: 26 }}>{tr("Слово дня")}</SectionTitle>
            <Pressable onPress={() => speakGerman(germanText(wd))} accessibilityHint={tr("Произнести")}
              style={[styles.wod, { borderColor: t.border, backgroundColor: surface }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1 }}><GermanWord w={wd} size={22} center={false} /></View>
                {wd.at ? <AtFlag width={18} /> : null}
                <Icon name="volume" size={18} color={t.textDim} />
              </View>
              <T v="bodyM" dim style={{ marginTop: 4 }}>{wd.ru}</T>
              {wd.ex ? <View style={{ marginTop: 10 }}><Example w={wd} size={15} /></View> : null}
              {wd.exRu ? <T v="small" dim style={{ marginTop: 4, lineHeight: 18 }}>{wd.exRu}</T> : null}
            </Pressable>
          </>
        ) : null}

        <SectionTitle style={{ marginTop: 26 }}>{tr("Быстрая тренировка")}</SectionTitle>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <QuickTile icon="target" title={tr("Артикли")} sub={tr("рекорд {n}", { n: p.articleBest })} onPress={() => p.onOpen("article")} />
          <QuickTile icon="bolt" title={tr("Скорость")} sub={tr("рекорд {n}", { n: p.speedBest })} onPress={() => p.onOpen("speed")} />
          <QuickTile icon="pen" title={tr("Письмо")} sub={tr("10 за раунд")} onPress={() => p.onOpen("typing")} />
        </View>

        {p.topicProgress.length ? (
          <>
            <SectionTitle style={{ marginTop: 26 }}>{tr("Темы")}</SectionTitle>
            {p.topicProgress.map((tp) => (
              <View key={tp.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <T v="bodyM">{tp.de}</T>
                  <T v="small" dim style={{ fontVariant: ["tabular-nums"] }}>{tp.learned}/{tp.total}</T>
                </View>
                <View style={[styles.track, { backgroundColor: t.border }]}>
                  <View style={{ height: "100%", borderRadius: 2, width: `${Math.round((tp.learned / Math.max(1, tp.total)) * 100)}%`, backgroundColor: tp.learned / tp.total < 0.25 ? t.accent : t.text }} />
                </View>
              </View>
            ))}
          </>
        ) : null}

        <SectionTitle style={{ marginTop: 16 }}>{tr("Неделя")}</SectionTitle>
        <View style={styles.week}>
          {week.map((d) => (
            <View key={d.day} style={styles.wd}>
              <T v="small" color={d.today ? t.accent : d.done ? t.text : t.faint} style={{ fontSize: 12 }}>{d.label}</T>
              <View style={[styles.wdot, { backgroundColor: d.done ? t.text : t.border },
                d.today && !d.done && { backgroundColor: t.bg, borderWidth: 2, borderColor: t.accent, width: 10, height: 10 },
                d.today && d.done && { backgroundColor: t.accent }]} />
            </View>
          ))}
        </View>

        {!p.settings.reminderEnabled && !p.settings.reminderPromptDismissed ? (
          <View style={[styles.banner, { borderColor: t.border }]}>
            <Icon name="bell" size={20} color={t.text} />
            <T v="bodyM" style={{ flex: 1 }}>{tr("Напоминать каждый день в {t}?", { t: `${hh}:${mm}` })}</T>
            <Pressable onPress={p.onEnableReminder} hitSlop={8} accessibilityRole="button">
              <Text style={[font.semibold, { color: t.accent, fontSize: 15 }]}>{tr("Включить")}</Text>
            </Pressable>
            <Pressable onPress={() => p.onSettings({ reminderPromptDismissed: true })} hitSlop={10} accessibilityLabel={tr("Скрыть")}>
              <Icon name="x" size={18} color={t.textDim} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* soft backdrop so scrolled content does not fight with the sticky CTA + tab bar */}
      <View pointerEvents="none" style={[styles.scrim, { height: TAB_SPACE + 44, backgroundColor: t.bg }]} />
      {/* sticky CTA above the tab bar */}
      <View pointerEvents="box-none" style={[styles.cta, { bottom: TAB_SPACE }]}>
        {has ? (
          <Btn title={tr("Начать")} arrow onPress={() => p.onStart(false)} style={styles.ctaShadow} />
        ) : (
          <Btn title={tr("Ещё 10 новых слов")} disabled={p.unseenInFilter === 0} onPress={() => p.onStart(true)}
            style={[styles.ctaShadow, p.unseenInFilter === 0 && { opacity: 0.4 }]} />
        )}
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 12 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { ...font.semibold, fontSize: 30, lineHeight: 34, letterSpacing: -1, marginTop: 14 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  stack: { height: 220, marginTop: 18 },
  sheet: { position: "absolute", left: 6, right: 6, top: 0, height: 196, borderRadius: 26, borderWidth: 1 },
  front: { top: 14, left: 4, right: 4, padding: 22, justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  bigNum: { ...font.semibold, fontSize: 84, lineHeight: 84, letterSpacing: -5, includeFontPadding: false },
  upd: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginTop: 14 },
  setup: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  wod: { borderWidth: 1, borderRadius: 20, padding: 16 },
  qt: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 14 },
  track: { height: 4, borderRadius: 2, marginTop: 7, overflow: "hidden" },
  week: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  wd: { alignItems: "center", gap: 9, width: 30 },
  wdot: { width: 8, height: 8, borderRadius: 5 },
  banner: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, marginTop: 26 },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, opacity: 0.94 },
  cta: { position: "absolute", left: 22, right: 22 },
  ctaShadow: { minHeight: 60, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
});
