import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { FadeIn, Pressy, T } from "../ui/components";
import { Icon, IconName } from "../ui/Icon";
import { TAB_SPACE } from "../ui/TabBar";
import { useTheme } from "../ui/theme";
import { tr, pl } from "../i18n";

function Tile(p: { icon: IconName; title: string; sub: string; desc?: string; hero?: boolean; wide?: boolean; disabled?: boolean; onPress: () => void }) {
  const t = useTheme();
  const fg = p.hero ? t.inkText : t.text;
  return (
    <Pressy onPress={p.onPress} disabled={p.disabled} accessibilityRole="button" accessibilityLabel={p.title} scaleTo={0.98}
      style={[styles.tile, p.wide && { width: "100%", minHeight: 120 }, p.disabled && { opacity: 0.5 }, p.hero ? { backgroundColor: t.ink, borderColor: t.ink, width: "100%", minHeight: 150 } : { borderColor: t.border }]}>
      <Icon name={p.icon} size={24} color={fg} />
      <View style={{ flex: 1 }} />
      <T v="h2" color={fg} style={{ fontSize: p.hero ? 24 : 19 }}>{p.title}</T>
      <T v="small" color={p.hero ? (t.dark ? "#5C5C61" : "#A1A1A6") : t.textDim} style={{ marginTop: 4 }}>{p.sub}</T>
      {p.desc ? <T v="small" color={p.hero ? (t.dark ? "#5C5C61" : "#A1A1A6") : t.textDim} style={{ marginTop: 2 }}>{p.desc}</T> : null}
    </Pressy>
  );
}

export function TrainScreen(p: { articleBest: number; speedBest: number; listenBest?: number; mistakes: number; onOpen: (s: "article" | "speed" | "typing" | "listen" | "packs") => void; onMistakes: () => void }) {
  return (
    <FadeIn>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: TAB_SPACE + 20 }}>
        <T v="h1">{tr("Тренировки")}</T>
        <T v="bodyM" dim style={{ marginTop: 6 }}>{tr("По 1–2 минуты. Ошибки попадают в повторение.")}</T>
        <View style={styles.grid}>
          <Tile hero icon="target" title="der · die · das" sub={`${tr("Артикли")} · ${tr("рекорд {n}", { n: p.articleBest })}`} desc={tr("Свайп влево / вверх / вправо")} onPress={() => p.onOpen("article")} />
          <Tile icon="bolt" title={tr("Скорость")} sub={tr("рекорд {n}", { n: p.speedBest })} desc={tr("4 варианта на время")} onPress={() => p.onOpen("speed")} />
          <Tile icon="pen" title={tr("Письмо")} sub={tr("10 за раунд")} desc={tr("Набери слово с артиклем")} onPress={() => p.onOpen("typing")} />
          <Tile icon="volume" title={tr("На слух")} sub={tr("рекорд {n}", { n: p.listenBest ?? 0 })} desc={tr("Услышь слово — выбери перевод")} onPress={() => p.onOpen("listen")} />
          <Tile icon="book" title={tr("Ситуации")} sub="Amt · Arzt · Vermieter" desc={tr("Фразы для жизни в Австрии")} onPress={() => p.onOpen("packs")} />
          <Tile icon="undo" title={tr("Ошибки недели")} wide disabled={!p.mistakes}
            sub={p.mistakes ? `${p.mistakes} ${pl(p.mistakes, "слово", "слова", "слов")}` : tr("Пока нет ошибок — так держать")}
            desc={tr("Слова, в которых ты ошибся за 7 дней")} onPress={p.onMistakes} />
        </View>
      </ScrollView>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  tile: { width: "48%", flexGrow: 1, minHeight: 170, borderWidth: 1, borderRadius: 24, padding: 18 },
});
