import React, { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Direction } from "../logic/data";
import { CardState } from "../logic/srs";
import { makeSpeedQuestion, optionLabel, shuffle, SpeedQuestion, speedPool, speedPoints } from "../logic/games";
import { AtBadge, Btn, GermanWord, ScreenHeader, Segmented, TimerBar, useCountdown } from "../ui/components";
import { hapticBad, hapticOk } from "../ui/haptics";
import { useTheme } from "../ui/theme";
import { useDeck } from "../ui/deck";

export const SPEED_SECONDS = 60;

export interface SpeedResult {
  score: number;
  correct: number;
  wrong: number;
  maxCombo: number;
}

export function SpeedScreen(p: {
  best: number;
  cards: Record<string, CardState>;
  direction: Direction;
  onMistake: (id: string) => void;
  onRoundEnd: (r: SpeedResult) => void;
  onBack: () => void;
}) {
  const t = useTheme();
  const { words } = useDeck();
  const pool = useMemo(() => speedPool(words, p.cards), [words]); // eslint-disable-line react-hooks/exhaustive-deps
  const [dir, setDir] = useState<Direction>(p.direction);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [q, setQ] = useState<SpeedQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [result, setResult] = useState<SpeedResult | null>(null);
  const [prevBest, setPrevBest] = useState(p.best);
  const st = useRef({ score: 0, combo: 0, correct: 0, wrong: 0, maxCombo: 0, order: [] as string[], i: 0, busy: false });

  const next = () => {
    const s = st.current;
    if (s.i >= s.order.length) {
      s.order = shuffle(pool.map((w) => w.id));
      s.i = 0;
    }
    const id = s.order[s.i++];
    const w = pool.find((x) => x.id === id)!;
    const d = dir === "mixed" ? (Math.random() < 0.5 ? "de-ru" : "ru-de") : dir;
    setQ(makeSpeedQuestion(w, pool, d));
    setPicked(null);
  };

  const finish = () => {
    if (phase !== "play") return;
    const s = st.current;
    const r = { score: s.score, correct: s.correct, wrong: s.wrong, maxCombo: s.maxCombo };
    setPrevBest(p.best);
    setResult(r);
    setPhase("done");
    p.onRoundEnd(r);
  };
  const left = useCountdown(phase === "play", SPEED_SECONDS, finish);

  const start = () => {
    st.current = { score: 0, combo: 0, correct: 0, wrong: 0, maxCombo: 0, order: [], i: 0, busy: false };
    setScore(0);
    setCombo(0);
    setPhase("play");
    next();
  };

  const pick = (id: string) => {
    const s = st.current;
    if (!q || s.busy || phase !== "play") return;
    s.busy = true;
    setPicked(id);
    const ok = id === q.word.id;
    if (ok) {
      s.score += speedPoints(s.combo);
      s.combo++;
      s.correct++;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      hapticOk();
    } else {
      s.combo = 0;
      s.wrong++;
      p.onMistake(q.word.id);
      hapticBad();
    }
    setScore(s.score);
    setCombo(s.combo);
    setTimeout(() => {
      s.busy = false;
      next();
    }, ok ? 250 : 800);
  };

  if (phase === "intro" || (phase === "done" && result)) {
    const record = result ? result.score > prevBest : false;
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Скорость" onBack={p.onBack} />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {phase === "done" && result ? (
            <>
              <Text style={{ fontSize: 56, textAlign: "center" }}>{record ? "🏆" : "⚡"}</Text>
              <Text style={[styles.big, { color: t.text }]}>{result.score} очк.</Text>
              <Text style={[styles.p, { color: t.textDim, textAlign: "center" }]}>
                {record ? "Новый рекорд! " : `Рекорд: ${Math.max(prevBest, result.score)} · `}верно {result.correct} · ошибок{" "}
                {result.wrong} · лучшее комбо ×{result.maxCombo}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.big, { color: t.text }]}>⚡ 60 секунд</Text>
              <Text style={[styles.p, { color: t.textDim }]}>
                Выбери правильный перевод из четырёх. Каждый правильный ответ — 10 очков, а каждые 5 ответов подряд
                увеличивают множитель (×2, ×3…). Ошибка сбрасывает комбо и отправляет слово в повторение.
              </Text>
              <Text style={[styles.p, { color: t.text, fontWeight: "700" }]}>🏆 Рекорд: {p.best}</Text>
            </>
          )}
          <View style={{ marginTop: 18 }}>
            <Segmented
              value={dir}
              options={[
                { value: "de-ru", label: "DE → RU" },
                { value: "ru-de", label: "RU → DE" },
                { value: "mixed", label: "Вперемешку" },
              ]}
              onChange={setDir}
            />
          </View>
          <Btn title={phase === "done" ? "Ещё раз" : "Старт"} onPress={start} style={{ marginTop: 20 }} />
          {phase === "done" ? <Btn title="Назад" outline onPress={p.onBack} style={{ marginTop: 12 }} /> : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title={`${score} очк.`}
        onBack={p.onBack}
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            {combo >= 5 ? <Text style={{ color: t.hard, fontWeight: "800", fontSize: 18 }}>×{1 + Math.floor(combo / 5)}</Text> : null}
            <Pressable onPress={finish} hitSlop={10}>
              <Text style={{ color: t.accent, fontWeight: "700", fontSize: 16 }}>Стоп</Text>
            </Pressable>
          </View>
        }
      />
      <TimerBar left={left} total={SPEED_SECONDS} />
      {q ? (
        <View style={{ flex: 1, padding: 20 }}>
          <View style={[styles.prompt, { backgroundColor: t.card, borderColor: t.border }]}>
            {q.word.at ? <AtBadge /> : null}
            {q.dir === "de-ru" ? (
              <GermanWord w={q.word} size={32} />
            ) : (
              <Text style={{ fontSize: 28, fontWeight: "700", color: t.text, textAlign: "center" }}>{q.word.ru}</Text>
            )}
            <Text style={{ color: t.textDim, marginTop: 8 }}>{combo > 0 ? `комбо ${combo} 🔥` : " "}</Text>
          </View>
          <View style={{ gap: 10, marginTop: 16 }}>
            {q.options.map((o) => {
              const isAnswer = o.id === q.word.id;
              const bg = picked ? (isAnswer ? t.good : o.id === picked ? t.again : t.card) : t.card;
              const fg = picked && (isAnswer || o.id === picked) ? "#FFFFFF" : t.text;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => pick(o.id)}
                  style={({ pressed }) => [styles.opt, { backgroundColor: bg, borderColor: t.border }, pressed && { opacity: 0.8 }]}
                >
                  <Text style={{ fontSize: 19, fontWeight: "600", color: fg, textAlign: "center" }}>{optionLabel(o, q.dir)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 34, fontWeight: "800", textAlign: "center", marginVertical: 12 },
  p: { fontSize: 17, lineHeight: 25, marginTop: 8 },
  prompt: { borderWidth: 1, borderRadius: 20, padding: 22, alignItems: "center", minHeight: 140, justifyContent: "center" },
  opt: { borderWidth: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12 },
});
