import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring,
} from "react-native-reanimated";
import { Icon, IconName } from "./Icon";
import { font, useTheme } from "./theme";
import { tr } from "../i18n";
import { hapticTap } from "./haptics";

export type Tab = "home" | "train" | "browse" | "profile";
export const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Сегодня", icon: "home" },
  { id: "train", label: "Тренировки", icon: "bolt" },
  { id: "browse", label: "Словарь", icon: "book" },
  { id: "profile", label: "Профиль", icon: "user" },
];
/** Height reserved at the bottom of tab screens (capsule + margin). */
export const TAB_SPACE = 92;

const PAD = 8;
const GROW = 0.9; // active item is (1 + GROW) units wide
const N = TABS.length;
/** Leading edge: fast and snappy; trailing edge: softer, so the capsule stretches, then catches up. */
const LEAD = { damping: 18, stiffness: 320, mass: 0.7 };
const TRAIL = { damping: 15, stiffness: 150, mass: 0.9 };

/** Weight of item i given the capsule centre c (float index): 1 when the capsule sits on it. */
function weight(i: number, c: number) {
  "worklet";
  return Math.max(0, 1 - Math.abs(c - i));
}

/** Left/right x of the item at float index x, under the current (animated) item widths. */
function edge(x: number, c: number, width: number, right: boolean) {
  "worklet";
  let units = 0;
  for (let i = 0; i < N; i++) units += 1 + GROW * weight(i, c);
  const unit = (width - PAD * 2) / units;
  const at = (k: number) => {
    let s = PAD;
    for (let i = 0; i < k; i++) s += unit * (1 + GROW * weight(i, c));
    return right ? s + unit * (1 + GROW * weight(k, c)) : s;
  };
  const lo = Math.max(0, Math.min(N - 1, Math.floor(x)));
  const hi = Math.min(N - 1, lo + 1);
  const f = Math.max(0, Math.min(1, x - lo));
  return at(lo) + (at(hi) - at(lo)) * f;
}

/**
 * Floating dark capsule (variant B): the light pill springs to the selected tab with a stretchy
 * leading edge, tabs breathe wider/narrower with it, and labels crossfade in and out.
 */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const t = useTheme();
  const bar = t.dark ? "#1C1C1F" : "#111111";
  const pill = t.dark ? "#F5F5F5" : "#FFFFFF";
  const idx = Math.max(0, TABS.findIndex((x) => x.id === active));
  const left = useSharedValue(idx);
  const right = useSharedValue(idx);
  const width = useSharedValue(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const goingRight = idx > (left.value + right.value) / 2;
    left.value = withSpring(idx, goingRight ? TRAIL : LEAD);
    right.value = withSpring(idx, goingRight ? LEAD : TRAIL);
  }, [idx, left, right]);

  const centre = useDerivedValue(() => (left.value + right.value) / 2);

  const pillStyle = useAnimatedStyle(() => {
    const w = width.value;
    if (!w) return { opacity: 0 };
    const c = centre.value;
    const l = edge(left.value, c, w, false);
    const r = edge(right.value, c, w, true);
    return { opacity: 1, left: l, width: Math.max(48, r - l) };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width;
    setReady(true);
  };

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: bar }]} accessibilityRole="tablist" onLayout={onLayout}>
        {ready ? <Animated.View pointerEvents="none" style={[styles.pill, { backgroundColor: pill }, pillStyle]} /> : null}
        {TABS.map((x, i) => (
          <TabItem
            key={x.id}
            i={i}
            on={i === idx}
            centre={centre}
            label={tr(x.label)}
            icon={x.icon}
            fallbackBg={ready ? undefined : pill}
            onPress={() => {
              if (i !== idx) hapticTap();
              onChange(x.id);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function TabItem({ i, on, centre, label, icon, fallbackBg, onPress }: {
  i: number; on: boolean; centre: SharedValue<number>; label: string; icon: IconName; fallbackBg?: string; onPress: () => void;
}) {
  const press = useSharedValue(0);
  const itemStyle = useAnimatedStyle(() => ({
    flex: 1 + GROW * weight(i, centre.value),
    transform: [{ scale: 1 - press.value * 0.06 }],
  }));
  const labelStyle = useAnimatedStyle(() => {
    const p = weight(i, centre.value);
    return { opacity: p * p, maxWidth: 110 * p, marginLeft: 7 * p, transform: [{ translateX: (1 - p) * -6 }] };
  });
  const darkIcon = useAnimatedStyle(() => ({ opacity: weight(i, centre.value) }));
  const greyIcon = useAnimatedStyle(() => ({ opacity: 1 - weight(i, centre.value) }));
  return (
    <Animated.View style={[styles.itemWrap, itemStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (press.value = withSpring(1, LEAD))}
        onPressOut={() => (press.value = withSpring(0, TRAIL))}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: on }}
        style={[styles.item, fallbackBg && on ? { backgroundColor: fallbackBg } : null]}
      >
        <View style={styles.icon}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.center, greyIcon]}>
            <Icon name={icon} size={22} color="#8E8E93" stroke={1.6} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.center, darkIcon]}>
            <Icon name={icon} size={22} color="#111111" stroke={2.2} />
          </Animated.View>
        </View>
        <Animated.Text style={[font.semibold, styles.label, labelStyle]} numberOfLines={1}>{label}</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, bottom: 14 },
  bar: {
    height: 64, borderRadius: 32, flexDirection: "row", alignItems: "center", paddingHorizontal: PAD,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  pill: { position: "absolute", top: 8, height: 48, borderRadius: 24 },
  itemWrap: { height: 48 },
  item: { flex: 1, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  icon: { width: 24, height: 24 },
  center: { alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, color: "#111111" },
});
