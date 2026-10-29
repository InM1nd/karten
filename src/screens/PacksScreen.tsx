import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { PackId, PACKS } from "../data/types";
import { CardState } from "../logic/srs";
import { packWords } from "../logic/games";
import { Btn, FadeIn, ScreenHeader, T } from "../ui/components";
import { AtFlag, Icon } from "../ui/Icon";
import { speakGerman } from "../ui/speech";
import { useTheme } from "../ui/theme";
import { useDeck } from "../ui/deck";
import { tr, pl } from "../i18n";

/** Situation phrase packs (Amt, Arzt, Vermieter): browse, listen, start a session. */
export function PacksScreen(p: { cards: Record<string, CardState>; today: number; onStart: (pack: PackId) => void; onBack: () => void }) {
  const t = useTheme();
  const { words, trLang } = useDeck();
  const [open, setOpen] = useState<PackId | null>(null);
  return (
    <FadeIn>
      <ScreenHeader title={tr("Ситуации")} onBack={p.onBack} subtitle={tr("Готовые фразы для жизни в Австрии")} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        {PACKS.map((pk) => {
          const ws = packWords(words, pk.id);
          const learned = ws.filter((w) => (p.cards[w.id]?.interval ?? 0) >= 1).length;
          const todo = ws.filter((w) => !p.cards[w.id] || p.cards[w.id].due <= p.today).length;
          const isOpen = open === pk.id;
          return (
            <View key={pk.id} style={[styles.card, { borderColor: t.border }]}>
              <Pressable onPress={() => setOpen(isOpen ? null : pk.id)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <T v="h2" style={{ fontSize: 30 }}>{pk.emoji}</T>
                <View style={{ flex: 1 }}>
                  <T v="h2" style={{ fontSize: 19 }}>{pk.de}</T>
                  <T v="small" dim style={{ marginTop: 2 }}>
                    {pk.title[trLang]} · {ws.length} {pl(ws.length, "фраза", "фразы", "фраз")} · {tr("выучено {n}", { n: learned })}
                  </T>
                </View>
                <Icon name={isOpen ? "x" : "chevron"} size={18} color={t.textDim} />
              </Pressable>
              <View style={[styles.track, { backgroundColor: t.border }]}>
                <View style={{ height: "100%", width: `${Math.round((learned / Math.max(1, ws.length)) * 100)}%`, backgroundColor: t.text }} />
              </View>
              {isOpen
                ? ws.map((w) => (
                    <Pressable key={w.id} onPress={() => speakGerman(w.de.replace("…", ""))} style={[styles.row, { borderColor: t.border }]}>
                      <View style={{ flex: 1 }}>
                        <T v="bodyM">{w.de}</T>
                        <T v="small" dim style={{ marginTop: 2 }}>{w.ru}</T>
                      </View>
                      {w.at ? <AtFlag width={14} /> : null}
                      <Icon name="volume" size={16} color={t.textDim} />
                    </Pressable>
                  ))
                : null}
              <Btn title={todo ? tr("Учить · {n}", { n: todo }) : tr("Повторить все")} variant={todo ? "primary" : "outline"}
                onPress={() => p.onStart(pk.id)} style={{ marginTop: 14 }} />
            </View>
          );
        })}
        <T v="small" faint style={{ marginTop: 6 }}>
          {tr("Названия учреждений и правила могут отличаться в разных федеральных землях — уточняйте на месте.")}
        </T>
      </ScrollView>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 24, padding: 18, marginTop: 14 },
  track: { height: 4, borderRadius: 2, marginTop: 14, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, paddingVertical: 11, marginTop: 4 },
});
