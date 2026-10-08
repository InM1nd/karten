import React, { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Article, Word } from "../data/types";
import { articlePool, shuffle, SWIPE_ARTICLE } from "../logic/games";
import { Btn, ScreenHeader, TimerBar, useCountdown } from "../ui/components";
import { hapticBad, hapticOk } from "../ui/haptics";
import { useTheme } from "../ui/theme";
import { useDeck } from "../ui/deck";

export const ARTICLE_ROUND_SECONDS = 60;

export interface ArticleRoundResult {
  score: number;
  answered: number;
  mistakes: string[];
}

export function ArticleScreen(p: {
  best: number;
  onMistake: (id: string) => void;
  onRoundEnd: (r: ArticleRoundResult) => void;
  onBack: () => void;
}) {
  const t = useTheme();
  const { words } = useDeck();
  const pool = useMemo(() => articlePool(words), [words]);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [queue, setQueue] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ chosen: Article; ok: boolean } | null>(null);
  const [result, setResult] = useState<ArticleRoundResult | null>(null);
  const [prevBest, setPrevBest] = useState(p.best);
  const pan = useRef(new Animated.ValueXY()).current;
  const state = useRef({ score: 0, answered: 0, mistakes: [] as string[], busy: false });

  const finish = () => {
    if (phase !== "play") return;
    const r = { score: state.current.score, answered: state.current.answered, mistakes: state.current.mistakes };
    setPrevBest(p.best);
    setResult(r);
    setPhase("done");
    p.onRoundEnd(r);
  };
  const left = useCountdown(phase === "play", ARTICLE_ROUND_SECONDS, finish);

  const start = () => {
    state.current = { score: 0, answered: 0, mistakes: [], busy: false };
    setQueue(shuffle(pool));
    setIdx(0);
    setScore(0);
    setMistakes([]);
    setFeedback(null);
    pan.setValue({ x: 0, y: 0 });
    setPhase("play");
  };

  const word = queue.length ? queue[idx % queue.length] : undefined;

  const answer = (a: Article) => {
    if (!word || state.current.busy || phase !== "play") return;
    state.current.busy = true;
    const ok = word.article === a;
    state.current.answered++;
    if (ok) {
      state.current.score++;
      setScore(state.current.score);
      hapticOk();
    } else {
      state.current.mistakes = [...state.current.mistakes, word.id];
      setMistakes(state.current.mistakes);
      p.onMistake(word.id);
      hapticBad();
    }
    setFeedback({ chosen: a, ok });
    setTimeout(() => {
      setFeedback(null);
      pan.setValue({ x: 0, y: 0 });
      setIdx((i) => i + 1);
      state.current.busy = false;
    }, ok ? 350 : 1100);
  };
  const answerRef = useRef(answer);
  answerRef.current = answer;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_e, g) => {
          const dir = g.dy < -70 && Math.abs(g.dy) > Math.abs(g.dx) ? "up" : g.dx < -70 ? "left" : g.dx > 70 ? "right" : null;
          if (dir) answerRef.current(SWIPE_ARTICLE[dir]);
          else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        },
      }),
    [pan],
  );

  if (phase === "intro") {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Артикли" onBack={p.onBack} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={[styles.big, { color: t.text }]}>der · die · das</Text>
          <Text style={[styles.p, { color: t.textDim }]}>
            {ARTICLE_ROUND_SECONDS} секунд. Определи артикль как можно большего числа существительных.{"\n\n"}
            Свайп карточки: ← <Text style={{ color: t.article.der, fontWeight: "800" }}>der</Text>, ↑{" "}
            <Text style={{ color: t.article.die, fontWeight: "800" }}>die</Text>, →{" "}
            <Text style={{ color: t.article.das, fontWeight: "800" }}>das</Text> — или нажимай на кнопки.{"\n\n"}
            Ошибки попадут в повторение.
          </Text>
          <Text style={[styles.p, { color: t.text, fontWeight: "700" }]}>🏆 Рекорд: {p.best}</Text>
          <Btn title="Старт" onPress={start} style={{ marginTop: 20 }} />
        </ScrollView>
      </View>
    );
  }

  if (phase === "done" && result) {
    const record = result.score > prevBest;
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Артикли" onBack={p.onBack} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 56, textAlign: "center" }}>{record ? "🏆" : result.mistakes.length === 0 ? "🎯" : "👏"}</Text>
          <Text style={[styles.big, { color: t.text }]}>{result.score} очк.</Text>
          <Text style={[styles.p, { color: t.textDim, textAlign: "center" }]}>
            {record ? "Новый рекорд!" : `Рекорд: ${Math.max(prevBest, result.score)}`} · ответов: {result.answered} · ошибок:{" "}
            {result.mistakes.length}
          </Text>
          {result.mistakes.length ? (
            <View style={[styles.box, { backgroundColor: t.card, borderColor: t.border }]}>
              <Text style={{ color: t.textDim, marginBottom: 8 }}>Добавлено в повторение:</Text>
              {[...new Set(result.mistakes)].map((id) => {
                const w = words.find((x) => x.id === id);
                if (!w || !w.article) return null;
                return (
                  <Text key={id} style={{ fontSize: 18, color: t.text, marginVertical: 3 }}>
                    <Text style={{ color: t.article[w.article], fontWeight: "800" }}>{w.article}</Text> {w.de}
                    <Text style={{ color: t.textDim, fontSize: 15 }}> — {w.ru}</Text>
                  </Text>
                );
              })}
            </View>
          ) : null}
          <Btn title="Ещё раз" onPress={start} style={{ marginTop: 20 }} />
          <Btn title="Назад" outline onPress={p.onBack} style={{ marginTop: 12 }} />
        </ScrollView>
      </View>
    );
  }

  const border = feedback ? (feedback.ok ? t.good : t.again) : t.border;
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title={`Очки: ${score}`}
        onBack={p.onBack}
        right={
          <Pressable onPress={finish} hitSlop={10}>
            <Text style={{ color: t.accent, fontWeight: "700", fontSize: 16 }}>Стоп</Text>
          </Pressable>
        }
      />
      <TimerBar left={left} total={ARTICLE_ROUND_SECONDS} />
      <View style={styles.cardArea}>
        {word ? (
          <Animated.View
            {...responder.panHandlers}
            style={[
              styles.card,
              { backgroundColor: t.card, borderColor: border, transform: [...pan.getTranslateTransform(), { rotate: pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ["-12deg", "0deg", "12deg"] }) }] },
            ]}
          >
            {feedback && !feedback.ok ? (
              <Text style={{ fontSize: 40, fontWeight: "800", color: t.article[word.article!], textAlign: "center" }}>
                {word.article} {word.de}
              </Text>
            ) : (
              <Text style={{ fontSize: 40, fontWeight: "800", color: t.text, textAlign: "center" }}>
                {feedback?.ok ? <Text style={{ color: t.article[word.article!] }}>{word.article} </Text> : "___ "}
                {word.de}
              </Text>
            )}
            <Text style={{ fontSize: 18, color: t.textDim, marginTop: 12, textAlign: "center" }}>{word.ru}</Text>
            {feedback ? (
              <Text style={{ fontSize: 22, marginTop: 16, color: feedback.ok ? t.good : t.again, fontWeight: "800" }}>
                {feedback.ok ? "✓ Верно" : `✗ Не ${feedback.chosen}`}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.row}>
        {(["der", "die", "das"] as Article[]).map((a, i) => (
          <Btn
            key={a}
            title={["← der", "↑ die", "das →"][i]}
            color={t.article[a]}
            textColor={t.dark ? "#0F1117" : "#FFFFFF"}
            onPress={() => answer(a)}
            style={{ flex: 1, paddingVertical: 22 }}
          />
        ))}
      </View>
      <Text style={{ textAlign: "center", color: t.textDim, marginBottom: 12 }}>ошибок: {mistakes.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 34, fontWeight: "800", textAlign: "center", marginVertical: 12 },
  p: { fontSize: 17, lineHeight: 25, marginTop: 8 },
  box: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 18 },
  cardArea: { flex: 1, justifyContent: "center", padding: 20 },
  card: { borderRadius: 24, borderWidth: 3, padding: 28, minHeight: 240, alignItems: "center", justifyContent: "center", elevation: 3 },
  row: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 10 },
});
