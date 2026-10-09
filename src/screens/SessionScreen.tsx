import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TOPICS, Word } from "../data/types";
import { useDeck } from "../ui/deck";
import { CardState, Grade, nextQueue, previewLabel } from "../logic/srs";
import { Btn, FadeIn, GermanWord, grammarLine, IconBtn, ProgressLine, Pressy, ResultHero, StatSplit, T } from "../ui/components";
import { AtFlag, Icon } from "../ui/Icon";
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
  /** revert the last onAnswer (App restores the previous card / daily / streak state) */
  onUndo?: () => void;
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

type Tone = "again" | "hard" | "good";
function GradeBtn(p: { title: string; sub: string; onPress: () => void; tone: Tone }) {
  const t = useTheme();
  const bg = p.tone === "good" ? t.ink : p.tone === "again" ? (t.dark ? "#3A1517" : "#FDECEC") : t.card;
  const fg = p.tone === "good" ? t.inkText : p.tone === "again" ? (t.dark ? "#FF8A8D" : "#B4232A") : t.text;
  return (
    <Pressy onPress={p.onPress} accessibilityRole="button" style={[styles.grade, { backgroundColor: bg }]}>
      <Text style={[font.semibold, { fontSize: 16, letterSpacing: -0.1, color: fg }]}>{p.title}</Text>
      <Text style={[font.medium, { fontSize: 12.5, marginTop: 4, color: fg, opacity: 0.6 }]}>{p.sub}</Text>
    </Pressy>
  );
}

function DetailRow(p: { label: string; children: React.ReactNode; inline?: boolean; icon?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.drow, { borderBottomColor: t.border }, p.inline && { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {p.icon}
        <T v={p.inline ? "bodyM" : "small"} dim>{p.label}</T>
      </View>
      <View style={p.inline ? { flexShrink: 1, alignItems: "flex-end" } : { marginTop: 6 }}>{p.children}</View>
    </View>
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
  const history = useRef<{ queue: SessionItem[]; done: Set<string>; tally: typeof tally }[]>([]);
  const [canUndo, setCanUndo] = useState(false);

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
    history.current.push({ queue, done, tally });
    setCanUndo(true);
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

  const undo = () => {
    const h = history.current.pop();
    if (!h) return;
    p.onUndo?.();
    setQueue(h.queue);
    setDone(h.done);
    setTally(h.tally);
    setFlipped(true);
    rot.setValue(0);
    busy.current = false;
    setCanUndo(history.current.length > 0);
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
      <View style={styles.progress}>
        <ProgressLine progress={progress} style={{ flex: 1, height: 4 }} />
      </View>
      <View style={styles.topBar}>
        <Pressy onPress={p.onExit} hitSlop={12} accessibilityRole="button" accessibilityLabel="Закрыть" style={styles.topBtn}>
          <Icon name="x" size={18} color={t.textDim} />
          <T v="bodyM" dim>Выйти</T>
        </Pressy>
        <T v="bodyM" dim style={{ fontVariant: ["tabular-nums"] }}>
          {done.size} из {total}
        </T>
        <Pressy onPress={undo} disabled={!canUndo} hitSlop={12} accessibilityRole="button" accessibilityLabel="Отменить"
          style={[styles.topBtn, { opacity: canUndo ? 1 : 0.35 }]}>
          <Icon name="undo" size={18} color={t.textDim} />
          <T v="bodyM" dim>Отменить</T>
        </Pressy>
      </View>

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
              <View style={{ marginTop: 18, flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <GermanWord w={word} size={word.de.length > 16 ? 34 : 42} center={false} />
                </View>
                <IconBtn name="volume" label="Произнести" onPress={() => speakGerman(germanText(word))} />
              </View>
            ) : (
              <T v="h1" style={{ marginTop: 22, fontSize: 40, lineHeight: 46, letterSpacing: -1.4 }}>{word.ru}</T>
            )}

            {flipped ? (
              <View style={{ marginTop: 14 }}>
                <DetailRow label="Перевод" inline>
                  <Text style={[font.semibold, { fontSize: 20, color: t.text, textAlign: "right" }]}>{word.ru}</Text>
                </DetailRow>
                {grammar ? (
                  <DetailRow label={word.kind === "noun" ? "Мн. ч." : "Формы"} inline>
                    <T v="bodyM" style={{ textAlign: "right" }}>{word.kind === "noun" ? grammar.replace(/^мн\. ч\. /, "") : grammar}</T>
                  </DetailRow>
                ) : null}
                {word.ex ? (
                  <DetailRow label="Пример">
                    <Example w={word} size={17} />
                    {word.exRu ? <T v="body" dim style={{ marginTop: 6, fontSize: 15, lineHeight: 21 }}>{word.exRu}</T> : null}
                  </DetailRow>
                ) : null}
                {word.note ? (
                  <DetailRow label={word.at ? "В Австрии" : "Заметка"} icon={word.at ? <AtFlag width={16} /> : undefined}>
                    <T v="bodyM">{word.note}</T>
                  </DetailRow>
                ) : null}
              </View>
            ) : (
              <T v="bodyM" faint style={{ marginTop: 40 }}>Нажми на карточку, чтобы перевернуть</T>
            )}
          </ScrollView>
        </Pressable>
      </Animated.View>

      <View style={styles.actions}>
        {flipped && labels ? (
          <View style={styles.row}>
            <GradeBtn title="Не помню" sub={labels.again} tone="again" onPress={() => answer("again")} />
            <GradeBtn title="Трудно" sub={labels.hard} tone="hard" onPress={() => answer("hard")} />
            <GradeBtn title="Помню" sub={labels.good} tone="good" onPress={() => answer("good")} />
          </View>
        ) : (
          <Btn title="Показать ответ" onPress={flip} style={{ minHeight: 72, borderRadius: 22 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", paddingHorizontal: 24, paddingTop: 14 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 14 },
  topBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  meta: { flexDirection: "row", alignItems: "center", gap: 10 },
  drow: { paddingVertical: 14, borderBottomWidth: 1 },
  actions: { paddingHorizontal: 20, paddingBottom: 18, paddingTop: 8 },
  row: { flexDirection: "row", gap: 10 },
  grade: { flex: 1, height: 74, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
