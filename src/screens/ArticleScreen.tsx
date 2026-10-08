import React, { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Article, Word } from "../data/types";
import { articlePool, shuffle, SWIPE_ARTICLE } from "../logic/games";
import { Btn, FadeIn, GermanWord, Hairline, Pressy, ResultHero, ScreenHeader, T, TimerBar, useCountdown } from "../ui/components";
import { Icon } from "../ui/Icon";
import { hapticBad, hapticOk } from "../ui/haptics";
import { font, useTheme } from "../ui/theme";
import { useDeck } from "../ui/deck";

export const ARTICLE_ROUND_SECONDS = 60;

export interface ArticleRoundResult {
  score: number;
  answered: number;
  mistakes: string[];
}

const LABELS: Record<Article, string> = { der: "← der", die: "↑ die", das: "das →" };

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
    Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
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
      <FadeIn>
        <ScreenHeader title="Артикли" onBack={p.onBack} subtitle={`${ARTICLE_ROUND_SECONDS} секунд на раунд`} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 }}>
          <T v="body" dim style={{ marginTop: 18 }}>
            Определи артикль как можно большего числа существительных. Свайпни карточку или нажми кнопку. Ошибки попадут в повторение.
          </T>
          <View style={{ marginTop: 28 }}>
            {(["der", "die", "das"] as Article[]).map((a, i) => (
              <View key={a} style={[styles.introRow, { borderColor: t.border }, i === 0 && { borderTopWidth: 1 }]}>
                <Icon name={a === "der" ? "arrowLeft" : a === "die" ? "arrowUp" : "arrowRight"} size={20} color={t.text} />
                <T v="body" dim style={{ flex: 1 }}>{a === "der" ? "свайп влево" : a === "die" ? "свайп вверх" : "свайп вправо"}</T>
                <View style={[styles.dot, { backgroundColor: t.article[a] }]} />
                <T v="h3" color={t.article[a]}>{a}</T>
              </View>
            ))}
          </View>
          <T v="bodyM" style={{ marginTop: 24 }}>Рекорд: {p.best}</T>
          <View style={{ flex: 1, minHeight: 30 }} />
          <Btn title="Старт" arrow onPress={start} />
        </ScrollView>
      </FadeIn>
    );
  }

  if (phase === "done" && result) {
    const record = result.score > prevBest;
    return (
      <FadeIn>
        <ScreenHeader title="Артикли" onBack={p.onBack} compact />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }}>
          <ResultHero
            value={result.score}
            label="очк."
            note={record ? "Новый рекорд!" : `Рекорд: ${Math.max(prevBest, result.score)}`}
            accentNote={record}
          />
          <T v="bodyM" dim style={{ marginTop: 10 }}>
            ответов: {result.answered} · ошибок: {result.mistakes.length}
          </T>
          {result.mistakes.length ? (
            <View style={{ marginTop: 28 }}>
              <T v="caps" dim style={{ marginBottom: 6 }}>Добавлено в повторение</T>
              {[...new Set(result.mistakes)].map((id) => {
                const w = words.find((x) => x.id === id);
                if (!w || !w.article) return null;
                return (
                  <View key={id} style={[styles.mRow, { borderColor: t.border }]}>
                    <GermanWord w={w} size={18} center={false} />
                    <T v="bodyM" dim style={{ flexShrink: 1, textAlign: "right" }}>{w.ru}</T>
                  </View>
                );
              })}
            </View>
          ) : null}
          <Btn title="Ещё раз" onPress={start} style={{ marginTop: 28 }} />
          <Btn title="Назад" variant="outline" onPress={p.onBack} style={{ marginTop: 10 }} />
        </ScrollView>
      </FadeIn>
    );
  }

  const border = feedback ? (feedback.ok ? t.good : t.again) : t.border;
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title={`Очки: ${score}`}
        compact
        onBack={p.onBack}
        right={
          <Pressable onPress={finish} hitSlop={10} accessibilityRole="button">
            <Text style={[font.semibold, { color: t.accent, fontSize: 15 }]}>Стоп</Text>
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
              {
                backgroundColor: t.bg,
                borderColor: border,
                transform: [...pan.getTranslateTransform(), { rotate: pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ["-8deg", "0deg", "8deg"] }) }],
              },
            ]}
          >
            {feedback ? (
              <GermanWord w={word} size={40} stack />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Text style={[font.semibold, { fontSize: 18, color: t.faint, letterSpacing: 2 }]}>— — —</Text>
                <Text style={[font.semibold, { fontSize: 40, lineHeight: 46, letterSpacing: -1.6, color: t.text, marginTop: 8, textAlign: "center" }]}>{word.de}</Text>
              </View>
            )}
            <T v="body" dim style={{ marginTop: 12, textAlign: "center" }}>{word.ru}</T>
            <Text style={[font.semibold, { fontSize: 16, marginTop: 18, minHeight: 22, color: feedback ? (feedback.ok ? t.good : t.again) : "transparent" }]}>
              {feedback ? (feedback.ok ? "✓ Верно" : `✗ Не ${feedback.chosen}`) : " "}
            </Text>
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.row}>
        {(["der", "die", "das"] as Article[]).map((a) => (
          <Pressy
            key={a}
            onPress={() => answer(a)}
            accessibilityRole="button"
            style={[
              styles.artBtn,
              { borderColor: t.border },
              feedback && word?.article === a && { borderColor: t.article[a] },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: t.article[a] }]} />
            <Text style={[font.semibold, { fontSize: 17, color: t.text, letterSpacing: -0.2 }]}>{LABELS[a]}</Text>
          </Pressy>
        ))}
      </View>
      <Hairline style={{ marginHorizontal: 24, marginTop: 6 }} />
      <T v="small" dim style={{ textAlign: "center", marginVertical: 12 }}>ошибок: {mistakes.length}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  introRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  mRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  cardArea: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  card: { borderRadius: 28, borderWidth: 1, padding: 28, minHeight: 280, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 10 },
  artBtn: { flex: 1, height: 64, borderRadius: 18, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
});
