import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressy } from "./components";
import { Icon, IconName } from "./Icon";
import { font, useTheme } from "./theme";

export type Tab = "home" | "train" | "browse" | "profile";
export const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Сегодня", icon: "home" },
  { id: "train", label: "Тренировки", icon: "bolt" },
  { id: "browse", label: "Словарь", icon: "book" },
  { id: "profile", label: "Профиль", icon: "user" },
];
/** Height reserved at the bottom of tab screens (capsule + margin). */
export const TAB_SPACE = 92;

/** Floating dark capsule; the active tab expands into a light pill with its label. */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const t = useTheme();
  const bar = t.dark ? "#1C1C1F" : "#111111";
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: bar }]} accessibilityRole="tablist">
        {TABS.map((x) => {
          const on = x.id === active;
          return (
            <Pressy
              key={x.id}
              onPress={() => onChange(x.id)}
              accessibilityRole="tab"
              accessibilityLabel={x.label}
              accessibilityState={{ selected: on }}
              scaleTo={0.94}
              style={[styles.item, on && { flex: 1.9, backgroundColor: t.dark ? "#F5F5F5" : "#FFFFFF" }]}
            >
              <Icon name={x.icon} size={22} color={on ? "#111111" : "#8E8E93"} stroke={on ? 2.2 : 1.6} />
              {on ? <Text style={[font.semibold, { fontSize: 14, color: "#111111" }]} numberOfLines={1}>{x.label}</Text> : null}
            </Pressy>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, bottom: 14 },
  bar: {
    height: 64, borderRadius: 32, flexDirection: "row", alignItems: "center", paddingHorizontal: 8,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  item: { flex: 1, height: 48, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
});
