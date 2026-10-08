import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Word } from "../data/types";
import { useTheme } from "./theme";

export function Btn(props: {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  outline?: boolean;
  sub?: string;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const t = useTheme();
  const bg = props.outline ? "transparent" : props.color ?? t.accent;
  const fg = props.outline ? props.color ?? t.accent : props.textColor ?? (props.color ? "#FFFFFF" : t.accentText);
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: props.color ?? t.accent, borderWidth: props.outline ? 2 : 0 },
        props.disabled && { opacity: 0.4 },
        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
        props.style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{props.title}</Text>
      {props.sub ? <Text style={[styles.btnSub, { color: fg }]}>{props.sub}</Text> : null}
    </Pressable>
  );
}

export function Chip(props: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.chip,
        { backgroundColor: props.active ? t.accent : t.card, borderColor: props.active ? t.accent : t.border },
      ]}
    >
      <Text style={{ color: props.active ? t.accentText : t.text, fontSize: 15, fontWeight: "600" }}>{props.label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string | number>(props: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: t.cardAlt }]}>
      {props.options.map((o) => {
        const active = o.value === props.value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => props.onChange(o.value)}
            style={[styles.segItem, active && { backgroundColor: t.card, elevation: 2 }]}
          >
            <Text style={{ color: active ? t.text : t.textDim, fontWeight: active ? "700" : "500", fontSize: 15 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AtBadge() {
  const t = useTheme();
  return (
    <View style={[styles.atBadge, { borderColor: t.at }]}>
      <Text style={{ color: t.at, fontSize: 12, fontWeight: "800" }}>🇦🇹 AT</Text>
    </View>
  );
}

/** German headword with coloured article. */
export function GermanWord({ w, size = 34, center = true }: { w: Word; size?: number; center?: boolean }) {
  const t = useTheme();
  return (
    <Text style={{ fontSize: size, fontWeight: "700", color: t.text, textAlign: center ? "center" : "left" }}>
      {w.article ? <Text style={{ color: t.article[w.article] }}>{w.article} </Text> : null}
      {w.de}
    </Text>
  );
}

/** "мн. ч.: die Tische" / verb forms line. */
export function grammarLine(w: Word): string | null {
  if (w.kind === "noun") {
    if (w.pluralOnly) return "только мн. ч.";
    if (w.plural === null || w.plural === undefined) return "мн. ч. нет";
    return `мн. ч.: die ${w.plural}`;
  }
  if (w.forms) return w.forms;
  return null;
}

export function StatTile(props: { value: string | number; label: string; icon: string }) {
  const t = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={{ fontSize: 22 }}>{props.icon}</Text>
      <Text style={{ fontSize: 26, fontWeight: "800", color: t.text, marginTop: 2 }}>{props.value}</Text>
      <Text style={{ fontSize: 13, color: t.textDim, textAlign: "center" }}>{props.label}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  const t = useTheme();
  return <Text style={[styles.section, { color: t.textDim }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  btn: { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 18, fontWeight: "700" },
  btnSub: { fontSize: 13, opacity: 0.85, marginTop: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  seg: { flexDirection: "row", borderRadius: 12, padding: 4 },
  segItem: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 9 },
  atBadge: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "center" },
  tile: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 6, alignItems: "center", marginHorizontal: 4 },
  section: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 22, marginBottom: 10 },
});

export function ScreenHeader(props: { title: string; onBack: () => void; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
      <Pressable onPress={props.onBack} hitSlop={14} accessibilityLabel="Назад">
        <Text style={{ fontSize: 26, color: t.text }}>←</Text>
      </Pressable>
      <Text style={{ fontSize: 24, fontWeight: "800", color: t.text, flex: 1 }} numberOfLines={1}>
        {props.title}
      </Text>
      {props.right}
    </View>
  );
}

/** Countdown bar + seconds for timed games. */
export function TimerBar({ left, total }: { left: number; total: number }) {
  const t = useTheme();
  const frac = Math.max(0, Math.min(1, left / total));
  const color = left <= 10 ? t.again : left <= 20 ? t.hard : t.good;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20 }}>
      <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: t.cardAlt, overflow: "hidden" }}>
        <View style={{ width: `${frac * 100}%`, height: 10, backgroundColor: color }} />
      </View>
      <Text style={{ color: t.text, fontWeight: "800", fontSize: 18, minWidth: 34, textAlign: "right" }}>{Math.ceil(left)}</Text>
    </View>
  );
}

export function useCountdown(running: boolean, seconds: number, onEnd: () => void) {
  const [left, setLeft] = React.useState(seconds);
  const endRef = React.useRef(0);
  const cb = React.useRef(onEnd);
  cb.current = onEnd;
  React.useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + seconds * 1000;
    setLeft(seconds);
    const id = setInterval(() => {
      const l = (endRef.current - Date.now()) / 1000;
      if (l <= 0) {
        clearInterval(id);
        setLeft(0);
        cb.current();
      } else setLeft(l);
    }, 200);
    return () => clearInterval(id);
  }, [running, seconds]);
  return left;
}
