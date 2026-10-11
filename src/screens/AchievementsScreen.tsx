import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Achievement, AchievementCtx, ACHIEVEMENTS } from "../logic/achievements";
import { FadeIn, ProgressLine, ScreenHeader, SectionTitle, T } from "../ui/components";
import { Icon, Ring } from "../ui/Icon";
import { useTheme } from "../ui/theme";
import { tr, pl, locale } from "../i18n";

const DATE = (ms: number) => new Date(ms).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });

function Badge({ done, progress }: { done: boolean; progress: number }) {
  const t = useTheme();
  return (
    <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
      <View style={StyleSheet.absoluteFill}>
        <Ring size={44} progress={done ? 1 : progress} color={done ? t.accent : t.text} track={t.border} stroke={done ? 2 : 1.6} />
      </View>
      {done ? <Icon name="check" size={18} color={t.text} stroke={2} /> : null}
    </View>
  );
}

function Row({ a, at, prog, first }: { a: Achievement; at?: number; prog: number; first: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { borderColor: t.border }, first && { borderTopWidth: 1 }]}>
      <Badge done={!!at} progress={prog / a.goal} />
      <View style={{ flex: 1 }}>
        <T v="h3" color={at ? t.text : t.text}>{tr(a.title)}</T>
        <T v="small" dim style={{ marginTop: 3 }}>{tr(a.desc)}</T>
        {at ? <T v="small" faint style={{ marginTop: 6 }}>{tr("получено {d}", { d: DATE(at) })}</T> : null}
      </View>
      {!at ? <T v="small" dim>{`${prog}/${a.goal}`}</T> : null}
    </View>
  );
}

export function AchievementsScreen(p: { unlocked: Record<string, number>; ctx: AchievementCtx; onBack: () => void }) {
  const t = useTheme();
  const done = ACHIEVEMENTS.filter((a) => p.unlocked[a.id]);
  const todo = ACHIEVEMENTS.filter((a) => !p.unlocked[a.id]);
  return (
    <FadeIn>
      <ScreenHeader title={tr("Достижения")} onBack={p.onBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 20 }}>
          <T v="h1" style={{ fontSize: 44, lineHeight: 46, letterSpacing: -1.8 }}>{`${done.length}/${ACHIEVEMENTS.length}`}</T>
          <T v="body" dim style={{ paddingBottom: 4 }}>{tr("получено")}</T>
        </View>
        <ProgressLine progress={done.length / ACHIEVEMENTS.length} color={t.accent} style={{ marginTop: 14 }} />
        {done.length ? (
          <>
            <SectionTitle>{tr("Получено")}</SectionTitle>
            {done.map((a, i) => (
              <Row key={a.id} a={a} at={p.unlocked[a.id]} prog={a.goal} first={i === 0} />
            ))}
          </>
        ) : null}
        {todo.length ? (
          <>
            <SectionTitle>{tr("Впереди")}</SectionTitle>
            {todo.map((a, i) => (
              <Row key={a.id} a={a} prog={Math.min(a.goal, a.progress(p.ctx))} first={i === 0} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: 1 },
});
