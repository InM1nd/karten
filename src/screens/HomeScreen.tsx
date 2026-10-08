import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TOPICS, TopicId } from "../data/types";
import { Direction, Settings } from "../logic/data";
import { DeckStats } from "../logic/srs";
import { Btn, Chip, SectionTitle, Segmented, StatTile } from "../ui/components";
import { useTheme } from "../ui/theme";

export interface HomeProps {
  stats: DeckStats;
  streak: number;
  bestStreak: number;
  newToday: number;
  reviewsToday: number;
  queueSize: number;
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
}

function ModeTile(p: { emoji: string; title: string; sub: string; onPress: () => void; color: string }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={p.onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.mode,
        { backgroundColor: t.card, borderColor: t.border, borderLeftColor: p.color },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
      <Text style={{ color: t.text, fontSize: 17, fontWeight: "800", marginTop: 6 }}>{p.title}</Text>
      <Text style={{ color: t.textDim, fontSize: 13, marginTop: 2 }}>{p.sub}</Text>
    </Pressable>
  );
}

export const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: "de-ru", label: "DE → RU" },
  { value: "ru-de", label: "RU → DE" },
  { value: "mixed", label: "Вперемешку" },
];

export function HomeScreen(p: HomeProps) {
  const t = useTheme();
  const minutes = Math.max(1, Math.ceil((p.queueSize * 15) / 60));
  const toggleTopic = (id: TopicId) => {
    const set = new Set(p.settings.topics);
    set.has(id) ? set.delete(id) : set.add(id);
    p.onSettings({ topics: TOPICS.map((x) => x.id).filter((x) => set.has(x)) });
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: t.text }]}>Karten</Text>
          <Text style={{ color: t.textDim, fontSize: 16 }}>Немецкий A2–B1 · 5 минут в день</Text>
        </View>
        <Pressable onPress={p.onOpenSettings} hitSlop={12} style={[styles.iconBtn, { backgroundColor: t.card }]}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </Pressable>
      </View>

      <View style={styles.tiles}>
        <StatTile icon="🔥" value={p.streak} label={`дней подряд\nрекорд ${p.bestStreak}`} />
        <StatTile icon="🧠" value={`${p.stats.learned}`} label={`выучено из ${p.stats.total}`} />
        <StatTile icon="⏳" value={p.stats.dueToday} label="повторить сегодня" />
      </View>

      <View style={[styles.startCard, { backgroundColor: t.card, borderColor: t.border }]}>
        {p.queueSize > 0 ? (
          <>
            <Text style={[styles.startTitle, { color: t.text }]}>Занятие на сегодня</Text>
            <Text style={{ color: t.textDim, fontSize: 16, marginBottom: 14 }}>
              {p.queueSize} карточек · ~{minutes} мин · новых сегодня {p.newToday}/{p.settings.newPerDay}
            </Text>
            <Btn title="Начать" onPress={() => p.onStart(false)} />
          </>
        ) : (
          <>
            <Text style={[styles.startTitle, { color: t.text }]}>На сегодня всё! 🎉</Text>
            <Text style={{ color: t.textDim, fontSize: 16, marginBottom: 14 }}>
              {p.reviewsToday > 0 ? `Сегодня повторено: ${p.reviewsToday}. ` : ""}
              Возвращайся завтра — или выучи ещё несколько слов.
            </Text>
            <Btn
              title="Ещё 10 новых слов"
              outline
              disabled={p.unseenInFilter === 0}
              onPress={() => p.onStart(true)}
            />
            {p.unseenInFilter === 0 ? (
              <Text style={{ color: t.textDim, marginTop: 8, textAlign: "center" }}>
                В выбранных темах новых слов больше нет.
              </Text>
            ) : null}
          </>
        )}
      </View>

      {!p.settings.reminderEnabled && !p.settings.reminderPromptDismissed ? (
        <View style={[styles.banner, { backgroundColor: t.cardAlt }]}>
          <Text style={{ fontSize: 24 }}>🔔</Text>
          <Text style={{ flex: 1, color: t.text, fontSize: 15 }}>
            Напоминать каждый день в {String(p.settings.reminderHour).padStart(2, "0")}:
            {String(p.settings.reminderMinute).padStart(2, "0")}?
          </Text>
          <Pressable onPress={p.onEnableReminder} hitSlop={8}>
            <Text style={{ color: t.accent, fontWeight: "800", fontSize: 15 }}>Включить</Text>
          </Pressable>
          <Pressable onPress={() => p.onSettings({ reminderPromptDismissed: true })} hitSlop={10} accessibilityLabel="Скрыть">
            <Text style={{ color: t.textDim, fontSize: 18, marginLeft: 6 }}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      <SectionTitle>Тренировки</SectionTitle>
      <View style={styles.grid}>
        <ModeTile emoji="🎯" title="Артикли" sub={`der/die/das · рекорд ${p.articleBest}`} color={t.article.der} onPress={() => p.onOpen("article")} />
        <ModeTile emoji="⚡" title="Скорость" sub={`60 сек · рекорд ${p.speedBest}`} color={t.hard} onPress={() => p.onOpen("speed")} />
      </View>
      <View style={styles.grid}>
        <ModeTile emoji="⌨️" title="Письмо" sub="напиши слово по-немецки" color={t.article.das} onPress={() => p.onOpen("typing")} />
        <ModeTile emoji="⭐" title="Мои слова" sub={p.customCount ? `слов: ${p.customCount}` : "добавь свои"} color={t.article.die} onPress={() => p.onOpen("custom")} />
      </View>
      <View style={styles.grid}>
        <ModeTile emoji="📖" title="Словарь" sub="поиск и примеры" color={t.accent} onPress={p.onOpenBrowse} />
        <ModeTile
          emoji="🏆"
          title="Достижения"
          sub={`${p.achievementsUnlocked} из ${p.achievementsTotal}`}
          color={t.good}
          onPress={() => p.onOpen("achievements")}
        />
      </View>

      <SectionTitle>Направление</SectionTitle>
      <Segmented value={p.settings.direction} options={DIRECTION_OPTIONS} onChange={(v) => p.onSettings({ direction: v })} />

      <SectionTitle>Темы</SectionTitle>
      <View style={styles.chips}>
        <Chip label="Все темы" active={p.settings.topics.length === 0} onPress={() => p.onSettings({ topics: [] })} />
        {TOPICS.filter((tp) => tp.id !== "custom" || p.customCount > 0).map((tp) => (
          <Chip
            key={tp.id}
            label={`${tp.emoji} ${tp.de}`}
            active={p.settings.topics.includes(tp.id)}
            onPress={() => toggleTopic(tp.id)}
          />
        ))}
      </View>

      <Text style={{ color: t.textDim, textAlign: "center", marginTop: 16, fontSize: 13 }}>
        Знаю хорошо (интервал ≥ 21 дн.): {p.stats.mature} · начато: {p.stats.seen}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 36, fontWeight: "800" },
  iconBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  tiles: { flexDirection: "row", marginHorizontal: -4 },
  startCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginTop: 16 },
  startTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  grid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  mode: { flex: 1, borderWidth: 1, borderLeftWidth: 5, borderRadius: 16, padding: 14 },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, padding: 14, marginTop: 14 },
});
