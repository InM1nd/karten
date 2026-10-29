import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CardState } from "../logic/srs";
import { LISTEN_ROUND, listenScore, listenSelection, makeSpeedQuestion, optionLabel, SpeedQuestion, speedPool } from "../logic/games";
import { Btn, FadeIn, GermanWord, Pressy, ProgressLine, ResultHero, ScreenHeader, T } from "../ui/components";
import { AtFlag, Icon } from "../ui/Icon";
import { hapticBad, hapticOk } from "../ui/haptics";
import { germanText, speakGerman } from "../ui/speech";
import { font, useTheme } from "../ui/theme";
import { useDeck } from "../ui/deck";
import { tr } from "../i18n";

export interface ListenResult { score: number; correct: number; wrong: number }

/** Listening mode: hear a German word or phrase (TTS), pick its meaning from four. */
export function ListenScreen(p: {
  best: number;
  cards: Record<string, CardState>;
  onMistake: (id: string) => void;
  onRoundEnd: (r: ListenResult) => void;
  onBack: () => void;
}) {
  const t = useTheme();
  const { words } = useDeck();
  const pool = useMemo(() => speedPool(words, p.cards), [words]); // eslint-disable-line react-hooks/exhaustive-deps
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [i, setI] = useState(0);
  const [qs, setQs] = useState<SpeedQuestion[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<ListenResult | null>(null);
  const st = useRef({ correct: 0, wrong: 0, replays: 0 });
  const q = qs[i];

  const say = (slow = false) => {
    if (!q) return;
    speakGerman(germanText(q.word), slow ? 0.6 : 0.9);
  };

  useEffect(() => {
    if (phase === "play" && q && !picked) say();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, i, qs]);

  const start = () => {
    st.current = { correct: 0, wrong: 0, replays: 0 };
    const sel = listenSelection(pool, p.cards, LISTEN_ROUND);
    setQs(sel.map((w) => makeSpeedQuestion(w, pool, "de-ru")));
    setI(0);
    setPicked(null);
    setPhase("play");
  };

  const pick = (id: string) => {
    if (!q || picked) return;
    setPicked(id);
    if (id === q.word.id) {
      st.current.correct++;
      hapticOk();
    } else {
      st.current.wrong++;
      p.onMistake(q.word.id);
      hapticBad();
    }
  };

  const next = () => {
    if (i + 1 < qs.length) {
      setI(i + 1);
      setPicked(null);
      return;
    }
    const s = st.current;
    const r = { score: listenScore(s.correct, s.replays), correct: s.correct, wrong: s.wrong };
    setResult(r);
    setPhase("done");
    p.onRoundEnd(r);
  };

  if (phase !== "play" || !q) {
    const record = result ? result.score > p.best && result.score > 0 : false;
    return (
      <FadeIn>
        <ScreenHeader title={tr("На слух")} onBack={p.onBack} compact={phase === "done"}
          subtitle={phase === "done" ? undefined : tr("{n} слов · 4 варианта", { n: LISTEN_ROUND })} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 }}>
          {phase === "done" && result ? (
            <>
              <ResultHero value={result.score} label={tr("очк.")} note={record ? tr("Новый рекорд!") : tr("Рекорд: {n}", { n: Math.max(p.best, result.score) })} accentNote={record} />
              <T v="bodyM" dim style={{ marginTop: 10 }}>{tr("верно {a} · ошибок {b}", { a: result.correct, b: result.wrong })}</T>
            </>
          ) : (
            <>
              <T v="body" dim style={{ marginTop: 18 }}>
                {tr("Слушай немецкое слово или фразу и выбери перевод. Повтор и медленный повтор стоят по 2 очка. Ошибки попадают в повторение.")}
              </T>
              <T v="bodyM" style={{ marginTop: 22 }}>{tr("Рекорд: {n}", { n: p.best })}</T>
            </>
          )}
          <View style={{ flex: 1, minHeight: 30 }} />
          <Btn title={phase === "done" ? tr("Ещё раз") : tr("Старт")} arrow={phase !== "done"} onPress={start} />
          {phase === "done" ? <Btn title={tr("Назад")} variant="outline" onPress={p.onBack} style={{ marginTop: 10 }} /> : null}
        </ScrollView>
      </FadeIn>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={`${i + 1} / ${qs.length}`} compact onBack={p.onBack} />
      <ProgressLine progress={(i + (picked ? 1 : 0)) / qs.length} style={{ marginHorizontal: 24, height: 4 }} />
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={styles.prompt}>
          <Pressy onPress={() => { st.current.replays++; say(); }} accessibilityRole="button" accessibilityLabel={tr("Повторить")}
            style={[styles.play, { backgroundColor: t.ink }]}>
            <Icon name="volume" size={38} color={t.inkText} />
          </Pressy>
          <Pressy onPress={() => { st.current.replays++; say(true); }} accessibilityRole="button" style={{ marginTop: 14, padding: 6 }}>
            <T v="bodyM" color={t.accent}>{tr("Медленнее")}</T>
          </Pressy>
          <View style={{ minHeight: 64, marginTop: 10, alignItems: "center" }}>
            {picked ? (
              <>
                <GermanWord w={q.word} size={26} />
                {q.word.at ? <View style={{ marginTop: 6 }}><AtFlag width={16} /></View> : null}
              </>
            ) : null}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          {q.options.map((o) => {
            const isAnswer = o.id === q.word.id;
            const good = picked && isAnswer;
            const bad = picked === o.id && !isAnswer;
            return (
              <Pressy key={o.id} onPress={() => pick(o.id)} accessibilityRole="button"
                style={[styles.opt, { borderColor: bad ? t.again : good ? t.ink : t.border, backgroundColor: good ? t.ink : "transparent" }]}>
                <Text style={[font.medium, { fontSize: 17, color: good ? t.inkText : bad ? t.again : t.text, textAlign: "center" }]}>
                  {optionLabel(o, "de-ru")}
                </Text>
              </Pressy>
            );
          })}
        </View>
        {picked ? <Btn title={i + 1 < qs.length ? tr("Дальше") : tr("Готово")} arrow onPress={next} style={{ marginTop: 14 }} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { alignItems: "center", justifyContent: "center", minHeight: 250, paddingVertical: 16 },
  play: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  opt: { borderWidth: 1, borderRadius: 18, minHeight: 56, paddingVertical: 13, paddingHorizontal: 14, justifyContent: "center" },
});
