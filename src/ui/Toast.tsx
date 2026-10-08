import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useTheme } from "./theme";

export function AchievementToast(p: { emoji: string; title: string; desc: string; onDone: () => void }) {
  const t = useTheme();
  const y = useRef(new Animated.Value(-160)).current;
  const done = useRef(p.onDone);
  done.current = p.onDone;
  useEffect(() => {
    Animated.spring(y, { toValue: 0, useNativeDriver: true }).start();
    const id = setTimeout(() => {
      Animated.timing(y, { toValue: -160, duration: 250, useNativeDriver: true }).start(() => done.current());
    }, 3200);
    return () => clearTimeout(id);
  }, [y]);
  return (
    <Animated.View
      style={{ position: "absolute", top: 12, left: 16, right: 16, transform: [{ translateY: y }], zIndex: 100, elevation: 12 }}
    >
      <Pressable onPress={() => done.current()} accessibilityRole="alert">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            padding: 16,
            borderRadius: 18,
            backgroundColor: t.card,
            borderWidth: 2,
            borderColor: t.hard,
          }}
        >
          <Text style={{ fontSize: 38 }}>{p.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.hard, fontSize: 13, fontWeight: "800" }}>🏆 НОВОЕ ДОСТИЖЕНИЕ</Text>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: "800" }}>{p.title}</Text>
            <Text style={{ color: t.textDim, fontSize: 14 }}>{p.desc}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
