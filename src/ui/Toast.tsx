import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { font, useTheme } from "./theme";
import { Icon } from "./Icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tr, pl } from "../i18n";

/** Achievement unlock toast: a quiet card that slides down from the top, then away. */
export function AchievementToast(p: { emoji?: string; title: string; desc: string; onDone: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const a = useRef(new Animated.Value(0)).current;
  const done = useRef(p.onDone);
  done.current = p.onDone;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const id = setTimeout(() => {
      Animated.timing(a, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => done.current());
    }, 3200);
    return () => clearTimeout(id);
  }, [a]);
  return (
    <Animated.View
      style={{
        position: "absolute",
        // the toast lives inside the SafeAreaView, but absolute children ignore its padding:
        // offset by the status-bar inset and sit below the screen header instead of over it
        top: insets.top + 60,
        left: 16,
        right: 16,
        zIndex: 100,
        elevation: 8,
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
      }}
    >
      <Pressable onPress={() => done.current()} accessibilityRole="alert">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: t.dark ? t.card : "#FFFFFF",
            borderWidth: 1,
            borderColor: t.border,
            shadowColor: "#000",
            shadowOpacity: t.dark ? 0 : 0.08,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={20} color="#FFFFFF" stroke={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[font.medium, { color: t.textDim, fontSize: 11.5, letterSpacing: 1.4, textTransform: "uppercase" }]}>{tr("Достижение получено")}</Text>
            <Text style={[font.semibold, { color: t.text, fontSize: 17, letterSpacing: -0.2, marginTop: 2 }]}>{p.title}</Text>
            <Text style={[font.regular, { color: t.textDim, fontSize: 14, marginTop: 1 }]}>{p.desc}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
