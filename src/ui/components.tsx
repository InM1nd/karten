import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from "react-native";
import { Word } from "../data/types";
import { font, useTheme } from "./theme";
import { AtFlag, Icon, IconName } from "./Icon";
import { tr, pl } from "../i18n";

// ---------- typography ----------
type Variant = "display" | "h1" | "h2" | "h3" | "body" | "bodyM" | "label" | "small" | "caps" | "num";
const V: Record<Variant, TextStyle> = {
  display: { ...font.semibold, fontSize: 52, lineHeight: 56, letterSpacing: -2.3 },
  h1: { ...font.semibold, fontSize: 34, lineHeight: 37, letterSpacing: -1.2 },
  h2: { ...font.semibold, fontSize: 24, lineHeight: 28, letterSpacing: -0.6 },
  h3: { ...font.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { ...font.regular, fontSize: 17, lineHeight: 24, letterSpacing: -0.15 },
  bodyM: { ...font.medium, fontSize: 15, lineHeight: 20 },
  label: { ...font.semibold, fontSize: 15, lineHeight: 19, letterSpacing: -0.1 },
  small: { ...font.medium, fontSize: 13, lineHeight: 17 },
  caps: { ...font.medium, fontSize: 12, lineHeight: 15, letterSpacing: 1.6, textTransform: "uppercase" },
  num: { ...font.semibold, fontSize: 112, lineHeight: 104, letterSpacing: -6.5 },
};

export function T({ v = "body", dim, faint, color, style, ...rest }: TextProps & { v?: Variant; dim?: boolean; faint?: boolean; color?: string }) {
  const t = useTheme();
  const c = color ?? (dim ? t.textDim : faint ? t.faint : t.text);
  return <Text {...rest} style={[V[v], { color: c }, style]} />;
}

// ---------- press feedback ----------
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable with a subtle scale-down on press (native driver). Layout styles apply to the pressable itself. */
export function Pressy({
  style, children, onPress, disabled, scaleTo = 0.97, ...rest
}: Omit<React.ComponentProps<typeof Pressable>, "style"> & { style?: StyleProp<ViewStyle>; scaleTo?: number; children?: React.ReactNode }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  return (
    <AnimatedPressable
      {...rest}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      style={[style, { transform: [{ scale: s }] }, disabled && { opacity: 0.35 }]}
    >
      {children}
    </AnimatedPressable>
  );
}

// ---------- buttons ----------
export type BtnVariant = "primary" | "outline" | "ghost" | "danger";
export function Btn(props: {
  title: string;
  onPress: () => void;
  variant?: BtnVariant;
  /** legacy: outline=true → variant "outline" */
  outline?: boolean;
  sub?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** orange round arrow at the end (primary CTA, as in the mockup) */
  arrow?: boolean;
  icon?: IconName;
}) {
  const t = useTheme();
  const v: BtnVariant = props.variant ?? (props.outline ? "outline" : "primary");
  const bg = v === "primary" ? t.ink : "transparent";
  const fg = v === "primary" ? t.inkText : v === "danger" ? t.again : t.text;
  const border = v === "outline" || v === "danger" ? t.border : "transparent";
  return (
    <Pressy
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: border, borderWidth: v === "outline" || v === "danger" ? 1 : 0 },
        props.arrow && { justifyContent: "space-between", paddingLeft: 26, paddingRight: 8 },
        props.style,
      ]}
    >
      <View style={{ alignItems: props.arrow ? "flex-start" : "center", flexDirection: props.icon ? "row" : "column", gap: 8 }}>
        {props.icon ? <Icon name={props.icon} size={19} color={fg} /> : null}
        <Text style={[V.label, { color: fg, fontSize: 16 }]}>{props.title}</Text>
        {props.sub ? <Text style={[V.small, { color: v === "primary" ? (t.dark ? "#5C5C61" : "#A1A1A6") : t.textDim, marginTop: 3 }]}>{props.sub}</Text> : null}
      </View>
      {props.arrow ? (
        <View style={[styles.arrow, { backgroundColor: t.accent }]}>
          <Icon name="arrowRight" size={20} color="#FFFFFF" stroke={2.2} />
        </View>
      ) : null}
    </Pressy>
  );
}

export function IconBtn(p: { name: IconName; onPress: () => void; label: string; color?: string; size?: number }) {
  const t = useTheme();
  return (
    <Pressy onPress={p.onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel={p.label} scaleTo={0.9} style={{ padding: 2 }}>
      <Icon name={p.name} size={p.size ?? 22} color={p.color ?? t.text} />
    </Pressy>
  );
}

export function Chip(props: { label: string; active: boolean; onPress: () => void; dot?: string }) {
  const t = useTheme();
  return (
    <Pressy
      onPress={props.onPress}
      scaleTo={0.95}
      accessibilityRole="button"
      accessibilityState={{ selected: props.active }}
      style={[styles.chip, { backgroundColor: props.active ? t.ink : "transparent", borderColor: props.active ? t.ink : t.border }]}
    >
      {props.dot ? <View style={[styles.dot, { backgroundColor: props.dot }]} /> : null}
      <Text style={[V.bodyM, { color: props.active ? t.inkText : t.text }]}>{props.label}</Text>
    </Pressy>
  );
}

export function Segmented<T extends string | number>(props: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: t.card }]}>
      {props.options.map((o) => {
        const active = o.value === props.value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => props.onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segItem, active && { backgroundColor: t.bg, borderColor: t.border, borderWidth: StyleSheet.hairlineWidth * 2 }]}
          >
            <Text style={[active ? V.label : V.bodyM, { color: active ? t.text : t.textDim, fontSize: 15 }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AtBadge({ label = "AT" }: { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <AtFlag width={18} />
      <Text style={[V.small, { color: t.textDim }]}>{label}</Text>
    </View>
  );
}

/** Small coloured dot + coloured article, then the noun in the normal text colour. */
export function GermanWord({ w, size = 34, center = true, stack = false }: { w: Word; size?: number; center?: boolean; stack?: boolean }) {
  const t = useTheme();
  const wordStyle: TextStyle = { ...font.semibold, fontSize: size, lineHeight: Math.round(size * 1.12), letterSpacing: -size * 0.04, color: t.text };
  const artSize = stack ? Math.max(16, Math.round(size * 0.4)) : size;
  const dotSize = Math.max(6, Math.round(Math.min(size, 40) * 0.24));
  const art = w.article ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: Math.max(5, size * 0.16) }}>
      <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize, backgroundColor: t.article[w.article] }} />
      <Text style={[wordStyle, { fontSize: artSize, lineHeight: Math.round(artSize * 1.15), letterSpacing: -artSize * 0.02, color: t.article[w.article] }]}>
        {w.article}
      </Text>
    </View>
  ) : null;
  if (stack) {
    return (
      <View style={{ alignItems: center ? "center" : "flex-start" }}>
        {art}
        <Text style={[wordStyle, { textAlign: center ? "center" : "left", marginTop: art ? 6 : 0 }]}>{w.de}</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: center ? "center" : "flex-start", columnGap: size * 0.26 }}>
      {art}
      <Text style={[wordStyle, { textAlign: center ? "center" : "left", flexShrink: 1 }]}>{w.de}</Text>
    </View>
  );
}

/** "мн. ч. die Tische" / verb forms line. */
export function grammarLine(w: Word): string | null {
  if (w.kind === "noun") {
    if (w.pluralOnly) return tr("только мн. ч.");
    if (w.plural === null || w.plural === undefined) return tr("мн. ч. нет");
    return tr("мн. ч. die {p}", { p: w.plural });
  }
  if (w.forms) return w.forms;
  return null;
}

export function SectionTitle({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[V.caps, { color: t.textDim, marginTop: 30, marginBottom: 12 }, style]}>{children}</Text>;
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ height: 1, backgroundColor: t.border }, style]} />;
}

export function ScreenHeader(props: { title: string; onBack?: () => void; right?: React.ReactNode; compact?: boolean; subtitle?: string }) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: props.compact ? 6 : 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 36 }}>
        {props.onBack ? (
          <Pressy onPress={props.onBack} hitSlop={14} accessibilityRole="button" accessibilityLabel={tr("Назад")} scaleTo={0.9} style={{ marginLeft: -4 }}>
            <Icon name="back" size={26} color={t.text} />
          </Pressy>
        ) : <View />}
        {props.compact ? (
          <Text style={[V.label, { color: t.text, flex: 1, textAlign: "center" }]} numberOfLines={1}>
            {props.title}
          </Text>
        ) : null}
        <View style={{ minWidth: 26, alignItems: "flex-end" }}>{props.right}</View>
      </View>
      {!props.compact ? (
        <>
          <Text style={[V.h1, { color: t.text, marginTop: 14 }]} numberOfLines={1}>
            {props.title}
          </Text>
          {props.subtitle ? <Text style={[V.bodyM, { color: t.textDim, marginTop: 6 }]}>{props.subtitle}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

/** Thin progress line with a smooth width animation. */
export function ProgressLine({ progress, color, style, duration = 320 }: { progress: number; color?: string; style?: StyleProp<ViewStyle>; duration?: number }) {
  const t = useTheme();
  const a = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: Math.max(0, Math.min(1, progress)), duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress, a, duration]);
  return (
    <View style={[{ height: 2, borderRadius: 2, backgroundColor: t.border, overflow: "hidden" }, style]}>
      <Animated.View style={{ height: "100%", borderRadius: 2, backgroundColor: color ?? t.text, width: a.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} />
    </View>
  );
}

/** Countdown line + seconds for timed games; turns orange for the last 10 s. */
export function TimerBar({ left, total }: { left: number; total: number }) {
  const t = useTheme();
  const urgent = left <= 10;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, marginTop: 4 }}>
      <ProgressLine progress={left / total} color={urgent ? t.accent : t.text} duration={200} style={{ flex: 1 }} />
      <Text style={[V.label, { color: urgent ? t.accent : t.text, minWidth: 28, textAlign: "right", fontVariant: ["tabular-nums"] }]}>{Math.ceil(left)}</Text>
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

/** Subtle fade + rise on mount (screen transitions). */
export function FadeIn({ children, style, delay = 0 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; delay?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 220, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a, delay]);
  return (
    <Animated.View style={[{ flex: 1, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

/** Big result block used by finished states (games, session). */
export function ResultHero(p: { value: string | number; label: string; note?: string; accentNote?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ paddingTop: 30 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
        <Text style={[V.num, { color: t.text }]}>{p.value}</Text>
        <Text style={[V.body, { color: t.textDim, paddingBottom: 6, flexShrink: 1 }]}>{p.label}</Text>
      </View>
      {p.note ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18 }}>
          {p.accentNote ? <View style={[styles.dot, { backgroundColor: t.accent, width: 7, height: 7 }]} /> : null}
          <Text style={[V.bodyM, { color: p.accentNote ? t.text : t.textDim }]}>{p.note}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Row of 3 hairline-separated stats. */
export function StatSplit({ items }: { items: { value: string | number; label: string }[] }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.border }}>
      {items.map((it, i) => (
        <View key={i} style={{ flex: 1, paddingVertical: 14, paddingLeft: i ? 16 : 0, borderLeftWidth: i ? 1 : 0, borderColor: t.border }}>
          <Text style={[V.h3, { color: t.text, fontSize: 20, lineHeight: 24 }]}>{it.value}</Text>
          <Text style={[V.small, { color: t.textDim, marginTop: 4 }]}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 56, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  arrow: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  seg: { flexDirection: "row", borderRadius: 14, padding: 3 },
  segItem: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 11 },
});
