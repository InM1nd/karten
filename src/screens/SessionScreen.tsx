import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TOPICS, Word } from "../data/types";
import { useDeck } from "../ui/deck";
import { CardState, Grade, nextQueue, previewLabel } from "../logic/srs";
import { AtBadge, Btn, GermanWord, grammarLine } from "../ui/components";
import { germanText, speakGerman } from "../ui/speech";
import { useTheme } from "../ui/theme";

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

export function SessionScreen(p: SessionProps) {
  const t = useTheme();
  const [queue, setQueue] = useState<SessionItem[]>(p.items);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [tally, setTally] = useState({ again: 0, hard: 0, good: 0 });
  const scale = useRef(new Animated.Value(1)).current;
  const { byId } = useDeck();
  const completed = useRef(false);

  const total = p.items.length;
  const current = queue[0];
  const word: Word | undefined = current ? byId[current.id] : undefined;

  useEffect(() => {
    if (word && p.autoSpeak && current?.dir === "de-ru" && !flipped) speakGerman(germanText(word));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, queue.length]);

  const flip = () => {
    if (flipped || !word) return;
    Animated.timing(scale, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setFlipped(true);
      if (p.autoSpeak && current?.dir === "ru-de") speakGerman(germanText(word));
      Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    });
  };

  const answer = (g: Grade) => {
    if (!current) return;
    p.onAnswer(current.id, g);
    setTally((x) => ({ ...x, [g]: x[g] + 1 }));
    if (g !== "again") setDone((s) => new Set(s).add(current.id));
    const ids = nextQueue(queue.map((q) => q.id), g);
    const byId = new Map(queue.map((q) => [q.id, q]));
    setQueue(ids.map((id) => byId.get(id)!));
    setFlipped(false);
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
      <View style={[styles.doneWrap]}>
        <Text style={{ fontSize: 64, textAlign: "center" }}>🎉</Text>
        <Text style={[styles.doneTitle, { color: t.text }]}>Готово!</Text>
        <Text style={[styles.doneText, { color: t.textDim }]}>
          Карточек: {total} · помню {tally.good} · трудно {tally.hard} · не помню {tally.again}
        </Text>
        <Text style={[styles.doneText, { color: t.text, fontWeight: "700" }]}>🔥 Серия: {p.streak} дн.</Text>
        <Btn title="На главную" onPress={p.onExit} style={{ marginTop: 24, alignSelf: "stretch" }} />
        {p.canLearnMore ? (
          <Btn title="Ещё 10 новых слов" outline onPress={p.onLearnMore} style={{ marginTop: 12, alignSelf: "stretch" }} />
        ) : null}
      </View>
    );
  }

  const topic = TOPIC_BY_ID[word.topic];
  const grammar = grammarLine(word);
  const frontIsGerman = current.dir === "de-ru";
  const progress = total ? done.size / total : 0;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <Pressable onPress={p.onExit} hitSlop={14}>
          <Text style={{ fontSize: 26, color: t.textDim }}>✕</Text>
        </Pressable>
        <View style={[styles.progressTrack, { backgroundColor: t.cardAlt }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: t.good }]} />
        </View>
        <Text style={{ color: t.textDim, fontSize: 15, fontWeight: "700" }}>
          {done.size}/{total}
        </Text>
      </View>

      <Animated.View style={[styles.cardOuter, { transform: [{ scaleX: scale }] }]}>
        <Pressable
          onPress={flip}
          style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}
          accessibilityHint="Нажмите, чтобы перевернуть карточку"
        >
          <View style={styles.cardHead}>
            <Text style={{ color: t.textDim, fontSize: 14 }}>
              {topic?.emoji} {topic?.de}
            </Text>
            {!p.cards[current.id] ? <Text style={{ color: t.accent, fontSize: 13, fontWeight: "800" }}>НОВОЕ</Text> : null}
          </View>

          <ScrollView contentContainerStyle={styles.cardBody}>
            {word.at ? <AtBadge /> : null}

            {frontIsGerman || flipped ? (
              <View style={{ alignItems: "center", marginTop: 10 }}>
                <GermanWord w={word} size={flipped && frontIsGerman ? 28 : 36} />
                {grammar && (flipped || frontIsGerman) ? (
                  <Text style={[styles.grammar, { color: t.textDim }]}>{grammar}</Text>
                ) : null}
                <Pressable
                  onPress={() => speakGerman(germanText(word))}
                  hitSlop={10}
                  style={[styles.speak, { backgroundColor: t.cardAlt }]}
                >
                  <Text style={{ fontSize: 20 }}>🔊</Text>
                </Pressable>
              </View>
            ) : null}

            {!frontIsGerman || flipped ? (
              <Text
                style={[
                  styles.ru,
                  { color: t.text, fontSize: !frontIsGerman && !flipped ? 32 : 26 },
                  flipped && !frontIsGerman && { color: t.textDim, fontSize: 20 },
                ]}
              >
                {word.ru}
              </Text>
            ) : null}

            {flipped ? (
              <>
                {word.ex ? (
                  <View style={[styles.exBox, { backgroundColor: t.cardAlt }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ex, { color: t.text }]}>{word.ex}</Text>
                      {word.exRu ? <Text style={[styles.exRu, { color: t.textDim }]}>{word.exRu}</Text> : null}
                    </View>
                    <Pressable onPress={() => speakGerman(word.ex)} hitSlop={10}>
                      <Text style={{ fontSize: 18, marginLeft: 8 }}>🔊</Text>
                    </Pressable>
                  </View>
                ) : null}
                {word.note ? <Text style={[styles.note, { color: t.textDim }]}>💡 {word.note}</Text> : null}
              </>
            ) : (
              <Text style={[styles.hint, { color: t.textDim }]}>Нажми на карточку, чтобы перевернуть</Text>
            )}
          </ScrollView>
        </Pressable>
      </Animated.View>

      <View style={styles.actions}>
        {flipped && labels ? (
          <View style={styles.row}>
            <Btn title="Не помню" sub={labels.again} color={t.again} onPress={() => answer("again")} style={styles.gradeBtn} />
            <Btn title="Трудно" sub={labels.hard} color={t.hard} onPress={() => answer("hard")} style={styles.gradeBtn} />
            <Btn title="Помню" sub={labels.good} color={t.good} onPress={() => answer("good")} style={styles.gradeBtn} />
          </View>
        ) : (
          <Btn title="Показать ответ" onPress={flip} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
  progressTrack: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden" },
  progressFill: { height: 10, borderRadius: 5 },
  cardOuter: { flex: 1, paddingHorizontal: 20, paddingVertical: 8 },
  card: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 20, elevation: 3 },
  cardHead: { flexDirection: "row", justifyContent: "space-between" },
  cardBody: { flexGrow: 1, justifyContent: "center", paddingVertical: 16 },
  grammar: { fontSize: 17, marginTop: 8, textAlign: "center" },
  speak: { marginTop: 14, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  ru: { fontWeight: "700", textAlign: "center", marginTop: 22 },
  exBox: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, marginTop: 22 },
  ex: { fontSize: 18, fontStyle: "italic", lineHeight: 26 },
  exRu: { fontSize: 15, lineHeight: 21, marginTop: 6 },
  note: { fontSize: 15, marginTop: 14, textAlign: "center" },
  hint: { textAlign: "center", marginTop: 40, fontSize: 15 },
  actions: { padding: 20, paddingTop: 8 },
  row: { flexDirection: "row", gap: 10 },
  gradeBtn: { flex: 1, paddingHorizontal: 6 },
  doneWrap: { flex: 1, padding: 28, justifyContent: "center", alignItems: "center" },
  doneTitle: { fontSize: 34, fontWeight: "800", marginTop: 8 },
  doneText: { fontSize: 17, textAlign: "center", marginTop: 10 },
});
