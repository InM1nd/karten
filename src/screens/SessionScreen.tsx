import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TOPICS, Word } from "../data/types";
import { useDeck } from "../ui/deck";
import { CardState, Grade, nextQueue, previewLabel } from "../logic/srs";
import { Btn, FadeIn, GermanWord, grammarLine, Hairline, IconBtn, ProgressLine, Pressy, ResultHero, StatSplit, T } from "../ui/components";
import { AtFlag } from "../ui/Icon";
import { plural } from "../ui/format";
import { germanText, speakGerman } from "../ui/speech";
import { font, useTheme } from "../ui/theme";

export interface SessionItem {
  id: string;
  dir: "de-ru" | "ru-de";
}

export interface SessionProps {
  items: SessionItem[];
  cards: Record<string, CardState>;
  today: number;
  autoSpeak: boolean;
  streak: number;
  canLearnMore: boolean;
  onAnswer: (id: string, grade: Grade) => void;
  onExit: () => void;
  onLearnMore: () => void;
  /** called once when the queue is finished */
  onComplete?: () => void;
}

const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

/** Example sentence with the headword in semibold. */
export function Example({ w, size = 20 }: { w: Word; size?: number }) {
  const t = useTheme();
  const base = w.de.replace(/[()…]/g, "").split(/[\s/]/)[0];
  const parts = base.length >= 3 ? w.ex.split(new RegExp(`(${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i")) : [w.ex];
  return (
    <Text style={[font.regular, { fontSize: size, lineHeight: Math.round(size * 1.38), letterSpacing: -0.3, color: t.text }]}>
      {parts.map((s, i) => (i % 2 ? <Text key={i} style={font.semibold}>{s}</Text> : s))}
    </Text>
  );
}

function GradeBtn(p: { title: string; sub: string; onPress: () => void; filled?: boolean }) {
  const t = useTheme();
  return (
    <Pressy
      onPress={p.onPress}
      accessibilityRole="button"
      style={[styles.grade, { borderColor: p.filled ? t.ink : t.border, backgroundColor: p.filled ? t.ink : "transparent" }]}
    >
      <Text style={[font.semibold, { fontSize: 15, letterSpacing: -0.1, color: p.filled ? t.inkText : t.text }]}>{p.title}</Text>
      <Text style={[font.medium, { fontSize: 12.5, marginTop: 5, color: p.filled ? (t.dark ? "#5C5C61" : "#A1A1A6") : t.textDim }]}>{p.sub}</Text>
    </Pressy>
  );
}

export function SessionScreen(p: SessionProps) {
  const t = useTheme();
  const [queue, setQueue] = useState<SessionItem[]>(p.items);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [tally, setTally] = useState({ again: 0, hard: 0, good: 0 });
  const rot = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(1)).current;
  const busy = useRef(false);
  const { byId } = useDeck();
  const completed = useRef(false);

  const total = p.items.length;
  const current = queue[0];
  const word: Word | undefined = current ? byId[current.id] : undefined;

  useEffect(() => {
    if (word && p.autoSpeak && current?.dir === "de-ru" && !flipped) speakGerman(germanText(word));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, queue.length]);

  // card flip: rotate to 90°, swap faces, rotate back (subtle, ~300 ms)
  const flip = () => {
    if (flipped || !word || busy.current) return;
    busy.current = true;
    Animated.timing(rot, { toValue: 1, duration: 130, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setFlipped(true);
      if (p.autoSpeak && current?.dir === "ru-de") speakGerman(germanText(word));
      rot.setValue(-1);
      Animated.timing(rot, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
        busy.current = false;
      });
    });
  };

  const answer = (g: Grade) => {
    if (!current) return;
    p.onAnswer(current.id, g);
    setTally((x) => ({ ...x, [g]: x[g] + 1 }));
    if (g !== "again") setDone((s) => new Set(s).add(current.id));
    const ids = nextQueue(queue.map((q) => q.id), g);
    const map = new Map(queue.map((q) => [q.id, q]));
    setQueue(ids.map((id) => map.get(id)!));
    setFlipped(false);
    busy.current = false;
    rot.setValue(0);
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  useEffect(() => {
    if (!current && !completed.current && p.items.length > 0) {
      completed.current = true;
      p.onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const labels = useMemo(() => {
    if (!current) return null;
    const s = p.cards[current.id];
    return {
      again: previewLabel(s, "again", p.today),
      hard: previewLabel(s, "hard", p.today),
      good: previewLabel(s, "good", p.today),
    };
  }, [current, p.cards, p.today]);

  if (!current || !word) {
    return (
      <FadeIn>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40, flexGrow: 1 }}>
          <T v="caps" dim>Занятие завершено</T>
          <T v="h1" style={{ marginTop: 14 }}>Готово!</T>
          <ResultHero
            value={total}
            label={`${plural(total, "карточка", "карточки", "карточек")}\nза сегодня`}
            note={p.streak > 0 ? `Серия: ${p.streak} ${plural(p.streak, "день", "дня", "дней")} подряд` : undefined}
            accentNote
          />
          <View style={{ marginTop: 26 }}>
            <StatSplit items={[{ value: tally.good, label: "помню" }, { value: tally.hard, label: "трудно" }, { value: tally.again, label: "не помню" }]} />
          </View>
          <View style={{ flex: 1, minHeight: 30 }} />
          <Btn title="На главную" onPress={p.onExit} />
          {p.canLearnMore ? <Btn title="Ещё 10 новых слов" variant="outline" onPress={p.onLearnMore} style={{ marginTop: 10 }} /> : null}
        </ScrollView>
      </FadeIn>
    );
  }

  const topic = TOPIC_BY_ID[word.topic];
  const grammar = grammarLine(word);
  const frontIsGerman = current.dir === "de-ru";
  const progress = total ? done.size / total : 0;
  const showGerman = frontIsGerman || flipped;
  const isNew = !p.cards[current.id];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <IconBtn name="x" label="Закрыть" onPress={p.onExit} />
        <T v="bodyM" dim style={{ fontVariant: ["tabular-nums"] }}>
          {done.size} из {total}
        </T>
        <IconBtn name="volume" label="Произнести" onPress={() => speakGerman(germanText(word))} />
      </View>
      <ProgressLine progress={progress} style={{ marginHorizontal: 24, marginTop: 14 }} />

      <Animated.View
        style={{
          flex: 1,
          opacity: enter,
          transform: [
            { perspective: 1200 },
            { rotateY: rot.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-90deg", "0deg", "90deg"] }) },
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        }}
      >
        <Pressable onPress={flip} style={{ flex: 1 }} accessibilityHint="Нажмите, чтобы перевернуть карточку">
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.meta}>
              <T v="caps" dim>{topic ? topic.ru : ""}{isNew ? " · новое" : ""}</T>
              {word.at ? <AtFlag width={18} /> : null}
            </View>

            {showGerman ? (
              <View style={{ marginTop: 30 }}>
                <GermanWord w={word} size={word.de.length > 16 ? 40 : 50} center={false} stack />
                {grammar ? <T v="bodyM" dim style={{ marginTop: 14 }}>{grammar}</T> : null}
              </View>
            ) : (
              <T v="h1" style={{ marginTop: 34, fontSize: 40, lineHeight: 46, letterSpacing: -1.4 }}>{word.ru}</T>
            )}

            {flipped ? (
              <>
                <Hairline style={{ marginTop: 28 }} />
                <Text style={[font.regular, styles.ru, { color: t.text }]}>{word.ru}</Text>
                {word.note ? (
                  <View style={styles.note}>
                    {word.at ? <AtFlag width={20} /> : null}
                    <T v="bodyM" dim style={{ flex: 1 }}>{word.note}</T>
                  </View>
                ) : null}
                {word.ex ? (
                  <View style={[styles.ex, { borderLeftColor: t.text }]}>
                    <Example w={word} />
                    {word.exRu ? <T v="body" dim style={{ marginTop: 8, fontSize: 15, lineHeight: 21 }}>{word.exRu}</T> : null}
                  </View>
                ) : null}
              </>
            ) : (
              <T v="bodyM" faint style={{ marginTop: 40 }}>Нажми на карточку, чтобы перевернуть</T>
            )}
          </ScrollView>
        </Pressable>
      </Animated.View>

      <View style={styles.actions}>
        {flipped && labels ? (
          <>
            <View style={styles.legend}>
              {(["der", "die", "das"] as const).map((a) => (
                <View key={a} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.article[a] }} />
                  <T v="small" dim>{a}</T>
                </View>
              ))}
              <T v="small" dim style={{ marginLeft: "auto" }}>Как хорошо помнишь?</T>
            </View>
            <View style={styles.row}>
              <GradeBtn title="Не помню" sub={labels.again} onPress={() => answer("again")} />
              <GradeBtn title="Трудно" sub={labels.hard} onPress={() => answer("hard")} />
              <GradeBtn title="Помню" sub={labels.good} onPress={() => answer("good")} filled />
            </View>
          </>
        ) : (
          <Btn title="Показать ответ" onPress={flip} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 12 },
  body: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 40, paddingBottom: 24 },
  meta: { flexDirection: "row", alignItems: "center", gap: 10 },
  ru: { fontSize: 34, lineHeight: 40, letterSpacing: -1, marginTop: 26 },
  note: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  ex: { borderLeftWidth: 2, paddingLeft: 16, marginTop: 30 },
  actions: { paddingHorizontal: 20, paddingBottom: 18, paddingTop: 8 },
  legend: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 6, marginBottom: 14 },
  row: { flexDirection: "row", gap: 8 },
  grade: { flex: 1, height: 66, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
