import React, { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Direction } from "../logic/data";
import { CardState } from "../logic/srs";
import { makeSpeedQuestion, optionLabel, shuffle, SpeedQuestion, speedPool, speedPoints } from "../logic/games";
import { Btn, FadeIn, GermanWord, Pressy, ResultHero, ScreenHeader, SectionTitle, Segmented, T, TimerBar, useCountdown } from "../ui/components";
import { AtFlag } from "../ui/Icon";
import { hapticBad, hapticOk } from "../ui/haptics";
import { font, useTheme } from "../ui/theme";
import { useDeck } from "../ui/deck";
import { tr, pl } from "../i18n";

export const SPEED_SECONDS = 60;

export interface SpeedResult {
  score: number;
  correct: number;
  wrong: number;
  maxCombo: number;
}

const DIRS: { value: Direction; label: string }[] = [
  { value: "de-ru", label: "DE → RU" },
  { value: "ru-de", label: "RU → DE" },
  { value: "mixed", label: "Вперемешку" },
];

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
      <FadeIn>
        {phase === "done" && result ? (
          <ScreenHeader title={tr("Скорость")} onBack={p.onBack} compact />
        ) : (
          <ScreenHeader title={tr("Скорость")} onBack={p.onBack} subtitle={tr("{n} секунд · 4 варианта", { n: SPEED_SECONDS })} />
        )}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 }}>
          {phase === "done" && result ? (
            <>
              <ResultHero value={result.score} label={tr("очк.")} note={record ? tr("Новый рекорд!") : tr("Рекорд: {n}", { n: Math.max(prevBest, result.score) })} accentNote={record} />
              <T v="bodyM" dim style={{ marginTop: 10 }}>
                {tr("верно {a} · ошибок {b} · лучшее комбо ×{c}", { a: result.correct, b: result.wrong, c: result.maxCombo })}
              </T>
            </>
          ) : (
            <>
              <T v="body" dim style={{ marginTop: 18 }}>
                {tr("Выбери правильный перевод из четырёх. Каждый ответ — 10 очков, каждые 5 подряд увеличивают множитель (×2, ×3…). Ошибка сбрасывает комбо и отправляет слово в повторение.")}
              </T>
              <T v="bodyM" style={{ marginTop: 22 }}>{tr("Рекорд: {n}", { n: p.best })}</T>
            </>
          )}
          <SectionTitle>{tr("Направление")}</SectionTitle>
          <Segmented value={dir} options={DIRS.map((o) => ({ ...o, label: tr(o.label) }))} onChange={setDir} />
          <View style={{ flex: 1, minHeight: 30 }} />
          <Btn title={phase === "done" ? tr("Ещё раз") : tr("Старт")} arrow={phase !== "done"} onPress={start} />
          {phase === "done" ? <Btn title={tr("Назад")} variant="outline" onPress={p.onBack} style={{ marginTop: 10 }} /> : null}
        </ScrollView>
      </FadeIn>
    );
  }

  const mult = 1 + Math.floor(combo / 5);
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title={tr("{n} очк.", { n: score })}
        compact
        onBack={p.onBack}
        right={
          <Pressable onPress={finish} hitSlop={10} accessibilityRole="button">
            <Text style={[font.semibold, { color: t.accent, fontSize: 15 }]}>{tr("Стоп")}</Text>
          </Pressable>
        }
      />
      <TimerBar left={left} total={SPEED_SECONDS} />
      {q ? (
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <View style={styles.prompt}>
            {q.word.at ? <AtFlag width={18} /> : null}
            <View style={{ marginTop: 12 }}>
              {q.dir === "de-ru" ? (
                <GermanWord w={q.word} size={36} />
              ) : (
                <Text style={[font.semibold, { fontSize: 32, lineHeight: 38, letterSpacing: -1, color: t.text, textAlign: "center" }]}>{q.word.ru}</Text>
              )}
            </View>
            <T v="bodyM" color={combo > 0 ? t.accent : "transparent"} style={{ marginTop: 14 }}>
              {combo > 0 ? tr("комбо {n}", { n: combo }) + (mult > 1 ? ` · ×${mult}` : "") : " "}
            </T>
          </View>
          <View style={{ gap: 8 }}>
            {q.options.map((o) => {
              const isAnswer = o.id === q.word.id;
              const good = picked && isAnswer;
              const bad = picked === o.id && !isAnswer;
              return (
                <Pressy
                  key={o.id}
                  onPress={() => pick(o.id)}
                  accessibilityRole="button"
                  style={[styles.opt, { borderColor: bad ? t.again : good ? t.ink : t.border, backgroundColor: good ? t.ink : "transparent" }]}
                >
                  <Text style={[font.medium, { fontSize: 18, letterSpacing: -0.2, color: good ? t.inkText : bad ? t.again : t.text, textAlign: "center" }]}>
                    {optionLabel(o, q.dir)}
                  </Text>
                </Pressy>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { alignItems: "center", justifyContent: "center", minHeight: 220, paddingVertical: 20 },
  opt: { borderWidth: 1, borderRadius: 18, minHeight: 58, paddingVertical: 14, paddingHorizontal: 14, justifyContent: "center" },
});
