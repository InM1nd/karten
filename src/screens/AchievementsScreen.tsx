import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AchievementCtx, ACHIEVEMENTS } from "../logic/achievements";
import { ScreenHeader } from "../ui/components";
import { useTheme } from "../ui/theme";

export function AchievementsScreen(p: { unlocked: Record<string, number>; ctx: AchievementCtx; onBack: () => void }) {
  const t = useTheme();
  const count = ACHIEVEMENTS.filter((a) => p.unlocked[a.id]).length;
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Достижения" onBack={p.onBack} right={<Text style={{ color: t.textDim, fontSize: 16 }}>{count}/{ACHIEVEMENTS.length}</Text>} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
        {ACHIEVEMENTS.map((a) => {
          const at = p.unlocked[a.id];
          const prog = Math.min(a.goal, a.progress(p.ctx));
          return (
            <View
              key={a.id}
              style={[styles.row, { backgroundColor: t.card, borderColor: at ? t.good : t.border, opacity: at ? 1 : 0.85 }]}
            >
              <Text style={[styles.emoji, !at && { opacity: 0.35 }]}>{a.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 17, fontWeight: "800" }}>{a.title}</Text>
                <Text style={{ color: t.textDim, fontSize: 14, marginTop: 2 }}>{a.desc}</Text>
                {at ? (
                  <Text style={{ color: t.good, fontSize: 13, marginTop: 6, fontWeight: "700" }}>
                    ✓ получено {new Date(at).toLocaleDateString("ru-RU")}
                  </Text>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <View style={[styles.track, { backgroundColor: t.cardAlt }]}>
                      <View style={{ width: `${(prog / a.goal) * 100}%`, height: 8, backgroundColor: t.accent, borderRadius: 4 }} />
                    </View>
                    <Text style={{ color: t.textDim, fontSize: 12 }}>
                      {prog}/{a.goal}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, alignItems: "center", borderWidth: 1.5, borderRadius: 16, padding: 14, marginBottom: 10 },
  emoji: { fontSize: 36 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
});
