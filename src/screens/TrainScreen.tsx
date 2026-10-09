import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { FadeIn, Pressy, T } from "../ui/components";
import { Icon, IconName } from "../ui/Icon";
import { TAB_SPACE } from "../ui/TabBar";
import { useTheme } from "../ui/theme";

function Tile(p: { icon: IconName; title: string; sub: string; desc?: string; hero?: boolean; onPress: () => void }) {
  const t = useTheme();
  const fg = p.hero ? t.inkText : t.text;
  return (
    <Pressy onPress={p.onPress} accessibilityRole="button" accessibilityLabel={p.title} scaleTo={0.98}
      style={[styles.tile, p.hero ? { backgroundColor: t.ink, borderColor: t.ink, width: "100%", minHeight: 150 } : { borderColor: t.border }]}>
      <Icon name={p.icon} size={24} color={fg} />
      <View style={{ flex: 1 }} />
      <T v="h2" color={fg} style={{ fontSize: p.hero ? 24 : 19 }}>{p.title}</T>
      <T v="small" color={p.hero ? (t.dark ? "#5C5C61" : "#A1A1A6") : t.textDim} style={{ marginTop: 4 }}>{p.sub}</T>
      {p.desc ? <T v="small" color={p.hero ? (t.dark ? "#5C5C61" : "#A1A1A6") : t.textDim} style={{ marginTop: 2 }}>{p.desc}</T> : null}
    </Pressy>
  );
}

export function TrainScreen(p: { articleBest: number; speedBest: number; onOpen: (s: "article" | "speed" | "typing") => void }) {
  return (
    <FadeIn>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: TAB_SPACE + 20 }}>
        <T v="h1">Тренировки</T>
        <T v="bodyM" dim style={{ marginTop: 6 }}>По 1–2 минуты. Ошибки попадают в повторение.</T>
        <View style={styles.grid}>
          <Tile hero icon="target" title="der · die · das" sub={`Артикли · рекорд ${p.articleBest}`} desc="Свайп влево / вверх / вправо" onPress={() => p.onOpen("article")} />
          <Tile icon="bolt" title="Скорость" sub={`рекорд ${p.speedBest}`} desc="4 варианта на время" onPress={() => p.onOpen("speed")} />
          <Tile icon="pen" title="Письмо" sub="10 за раунд" desc="Набери слово с артиклем" onPress={() => p.onOpen("typing")} />
        </View>
      </ScrollView>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  tile: { width: "48%", flexGrow: 1, minHeight: 170, borderWidth: 1, borderRadius: 24, padding: 18 },
});
