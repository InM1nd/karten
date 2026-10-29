import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import { font, useTheme } from "./theme";
import { tr } from "../i18n";

const COLORS = ["#E4002B", "#FFFFFF", "#F2B705", "#2F9E6A", "#3B82F6", "#111111"];
const N = 42;

/** One-shot confetti burst + "goal reached" banner; calls onDone after ~2.6 s. Never blocks touches. */
export function Confetti({ onDone, goal }: { onDone: () => void; goal: number }) {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const a = useRef(new Animated.Value(0)).current;
  const done = useRef(onDone);
  done.current = onDone;
  const pieces = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 140,
        delay: Math.random() * 0.25,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
      })),
    [width],
  );
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => done.current());
  }, [a]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityLiveRegion="polite">
      {pieces.map((p, i) => {
        const prog = a.interpolate({ inputRange: [0, p.delay, 1], outputRange: [0, 0, 1], extrapolate: "clamp" });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute", left: p.x, top: -20, width: p.w, height: p.h, borderRadius: 2, backgroundColor: p.color,
              borderWidth: p.color === "#FFFFFF" ? StyleSheet.hairlineWidth : 0, borderColor: "#00000022",
              opacity: a.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateY: prog.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.9] }) },
                { translateX: prog.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                { rotate: prog.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin}deg`] }) },
              ],
            }}
          />
        );
      })}
      <Animated.View style={[styles.banner, { backgroundColor: t.ink, opacity: a.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }) }]}>
        <Animated.Text style={[font.semibold, { color: t.inkText, fontSize: 17 }]}>
          {tr("Цель дня выполнена: {n} карточек!", { n: goal })}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { position: "absolute", top: "38%", alignSelf: "center", borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14 },
});
