import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { DeckStats } from "../logic/srs";
import { FadeIn, Pressy, ProgressLine, SectionTitle, StatSplit, T } from "../ui/components";
import { Icon, IconName } from "../ui/Icon";
import { plural } from "../ui/format";
import { TAB_SPACE } from "../ui/TabBar";
import { useTheme } from "../ui/theme";
import { tr, pl } from "../i18n";

function Row(p: { icon: IconName; title: string; value?: string; onPress: () => void; label?: string }) {
  const t = useTheme();
  return (
    <Pressy onPress={p.onPress} accessibilityRole="button" accessibilityLabel={p.label} scaleTo={0.99} style={[styles.row, { borderBottomColor: t.border }]}>
      <Icon name={p.icon} size={22} color={t.text} />
      <T v="body" style={{ flex: 1 }}>{p.title}</T>
      {p.value ? <T v="bodyM" dim>{p.value}</T> : null}
      <Icon name="chevron" size={18} color={t.faint} />
    </Pressy>
  );
}

export function ProfileScreen(p: {
  stats: DeckStats; streak: number; bestStreak: number; sessionsDone: number;
  achievementsUnlocked: number; achievementsTotal: number;
  onAchievements: () => void; onSettings: () => void;
}) {
  const t = useTheme();
  return (
    <FadeIn>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: TAB_SPACE + 20 }}>
        <T v="h1">{tr("Профиль")}</T>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12, marginTop: 26 }}>
          <T v="h1" style={{ fontSize: 64, lineHeight: 64, letterSpacing: -3 }}>{p.stats.learned}</T>
          <T v="body" dim style={{ paddingBottom: 6 }}>{tr("из {n}", { n: p.stats.total })}{"\n"}{tr("выучено")}</T>
        </View>
        <ProgressLine progress={p.stats.total ? p.stats.learned / p.stats.total : 0} color={t.accent} style={{ marginTop: 16, height: 4 }} />
        <View style={{ marginTop: 22 }}>
          <StatSplit items={[
            { value: p.stats.mature, label: tr("знаю хорошо") },
            { value: p.stats.dueToday, label: tr("к повторению") },
            { value: p.sessionsDone, label: pl(p.sessionsDone, "занятие", "занятия", "занятий") },
          ]} />
        </View>
        <View style={{ marginTop: 0 }}>
          <StatSplit items={[
            { value: p.streak, label: tr("дней подряд") },
            { value: p.bestStreak, label: tr("рекорд серии") },
            { value: `${p.achievementsUnlocked}/${p.achievementsTotal}`, label: tr("достижений") },
          ]} />
        </View>
        <SectionTitle>{tr("Разделы")}</SectionTitle>
        <View style={{ borderTopWidth: 1, borderTopColor: t.border }}>
          <Row icon="trophy" title={tr("Достижения")} value={`${p.achievementsUnlocked}/${p.achievementsTotal}`} onPress={p.onAchievements} />
          <Row icon="sliders" title={tr("Настройки")} label={tr("Настройки")} onPress={p.onSettings} />
        </View>
      </ScrollView>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1 },
});
