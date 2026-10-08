import React, { useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { TOPICS, Word } from "../data/types";
import { CardState, Grade } from "../logic/srs";
import { typingSelection } from "../logic/games";
import { checkTyping, TypingResult } from "../logic/typing";
import { Btn, FadeIn, GermanWord, grammarLine, IconBtn, Pressy, ProgressLine, ResultHero, ScreenHeader, StatSplit, T } from "../ui/components";
import { AtFlag, Icon } from "../ui/Icon";
import { hapticBad, hapticOk, hapticTap } from "../ui/haptics";
import { germanText, speakGerman } from "../ui/speech";
import { font, useTheme } from "../ui/theme";
import { useDeck } from "../ui/deck";
import { Example } from "./SessionScreen";

const KIND_HINT: Record<Word["kind"], string> = {
  noun: "существительное",
  verb: "глагол (инфинитив)",
  adj: "прилагательное / наречие",
  phrase: "фраза",
};
const UMLAUTS = ["ä", "ö", "ü", "ß"];
const GRADE: Record<TypingResult["status"], Grade> = { correct: "good", article: "hard", typo: "hard", wrong: "again" };

export function TypingScreen(p: {
  cards: Record<string, CardState>;
  today: number;
  onAnswer: (id: string, grade: Grade) => void;
  onCorrect: () => void;
  onBack: () => void;
}) {
  const t = useTheme();
  const { words } = useDeck();
  const [round, setRound] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = useMemo(() => typingSelection(words, p.cards, p.today, 10), [round]);
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  // track the cursor; only force it right after inserting an umlaut (a permanently
  // controlled `selection` makes the Android cursor jump while typing)
  const [sel, setSel] = useState({ start: 0, end: 0 });
  const [forceSel, setForceSel] = useState<{ start: number; end: number } | undefined>(undefined);
  const [res, setRes] = useState<TypingResult | null>(null);
  const [stats, setStats] = useState({ correct: 0, almost: 0, wrong: 0 });
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const w = list[i];

  const insert = (ch: string) => {
    hapticTap();
    const s = Math.min(sel.start, text.length), e = Math.min(sel.end, text.length);
    const next = text.slice(0, s) + ch + text.slice(e);
    setText(next);
    setSel({ start: s + ch.length, end: s + ch.length });
    setForceSel({ start: s + ch.length, end: s + ch.length });
    input.current?.focus();
  };

  const check = (giveUp = false) => {
    if (!w || res) return;
    const r = giveUp ? { ...checkTyping("", w), status: "wrong" as const } : checkTyping(text, w);
    setRes(r);
    p.onAnswer(w.id, GRADE[r.status]);
    if (r.status === "correct") {
      p.onCorrect();
      hapticOk();
      setStats((s) => ({ ...s, correct: s.correct + 1 }));
    } else if (r.status === "wrong") {
      hapticBad();
      setStats((s) => ({ ...s, wrong: s.wrong + 1 }));
    } else {
      hapticTap();
      setStats((s) => ({ ...s, almost: s.almost + 1 }));
    }
  };

  const next = () => {
    setRes(null);
    setText("");
    setSel({ start: 0, end: 0 });
    setForceSel(undefined);
    setI((x) => x + 1);
    setTimeout(() => input.current?.focus(), 50);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setI(0);
    setRes(null);
    setText("");
    setStats({ correct: 0, almost: 0, wrong: 0 });
  };

  if (!w) {
    return (
      <FadeIn>
        <ScreenHeader title="Письмо" onBack={p.onBack} compact />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30, flexGrow: 1 }}>
          {list.length ? (
            <>
              <T v="caps" dim style={{ marginTop: 12 }}>Раунд окончен</T>
              <ResultHero value={stats.correct} label={`из ${list.length} верно`} />
              <View style={{ marginTop: 24 }}>
                <StatSplit
                  items={[
                    { value: stats.correct, label: "верно" },
                    { value: stats.almost, label: "почти" },
                    { value: stats.wrong, label: "ошибок" },
                  ]}
                />
              </View>
            </>
          ) : (
            <>
              <T v="h1" style={{ marginTop: 40 }}>Нет слов</T>
              <T v="body" dim style={{ marginTop: 10 }}>Выбери темы на главном экране или добавь свои слова.</T>
            </>
          )}
          <View style={{ flex: 1, minHeight: 30 }} />
          <Btn title="Ещё 10 слов" onPress={restart} />
          <Btn title="Назад" variant="outline" onPress={p.onBack} style={{ marginTop: 10 }} />
        </ScrollView>
      </FadeIn>
    );
  }

  const topic = TOPICS.find((x) => x.id === w.topic);
  const verdict =
    res?.status === "correct"
      ? { text: "Верно!", color: t.good }
      : res?.status === "article"
        ? { text: "Почти: проверь артикль", color: t.hard }
        : res?.status === "typo"
          ? { text: "Почти: одна опечатка", color: t.hard }
          : { text: "Неверно", color: t.again };
  const grammar = grammarLine(w);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
      <View style={styles.top}>
        <IconBtn name="x" label="Закрыть" onPress={p.onBack} />
        <T v="label" dim>Письмо · {i + 1} из {list.length}</T>
        <View style={{ width: 40 }} />
      </View>
      <ProgressLine progress={(i + (res ? 1 : 0)) / list.length} style={{ marginHorizontal: 24 }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 26 }}>
          <T v="caps" dim>{topic?.ru} · {KIND_HINT[w.kind]}</T>
          {w.at ? <AtFlag width={16} /> : null}
        </View>
        <Text style={[font.semibold, { fontSize: 34, lineHeight: 40, letterSpacing: -1.2, color: t.text, marginTop: 12 }]}>{w.ru}</Text>

        <TextInput
          ref={input}
          value={text}
          onChangeText={(v) => {
            setText(v);
            setForceSel(undefined);
          }}
          selection={forceSel}
          onSelectionChange={(e) => {
            setSel(e.nativeEvent.selection);
            if (forceSel) setForceSel(undefined);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!res}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
          placeholder={w.kind === "noun" ? "der / die / das …" : "по-немецки…"}
          placeholderTextColor={t.faint}
          onSubmitEditing={() => (res ? next() : check())}
          returnKeyType="done"
          selectionColor={t.accent}
          cursorColor={t.accent}
          style={[
            font.medium,
            styles.input,
            { outlineWidth: 0, color: t.text, borderColor: res ? verdict.color : focused ? t.text : t.border },
          ]}
        />
        {!res ? (
          <View style={styles.umlauts}>
            {UMLAUTS.map((u) => (
              <Pressy key={u} onPress={() => insert(u)} accessibilityRole="button" style={[styles.uml, { borderColor: t.border }]}>
                <Text style={[font.medium, { fontSize: 20, color: t.text }]}>{u}</Text>
              </Pressy>
            ))}
          </View>
        ) : null}

        {res ? (
          <FadeIn style={{ flexGrow: 0, flexShrink: 0, flexBasis: "auto", marginTop: 22 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.vdot, { backgroundColor: verdict.color }]} />
              <T v="h3" color={verdict.color}>{verdict.text}</T>
            </View>
            {res.status !== "correct" && text.trim() ? (
              <>
                <Text style={[font.medium, { fontSize: 22, marginTop: 12, color: t.text }]}>
                  {res.diff.map((d, k) => (
                    <Text
                      key={k}
                      style={
                        d.type === "extra"
                          ? { color: t.again, textDecorationLine: "line-through" }
                          : d.type === "missing"
                            ? { color: t.good, textDecorationLine: "underline" }
                            : undefined
                      }
                    >
                      {d.text}
                    </Text>
                  ))}
                </Text>
                <T v="small" dim style={{ marginTop: 4 }}>красным — лишнее, зелёным — пропущенное</T>
              </>
            ) : null}
            <View style={[styles.answer, { borderColor: t.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexShrink: 1 }}>
                  <GermanWord w={w} size={26} center={false} />
                </View>
                <IconBtn name="volume" label="Прослушать" onPress={() => speakGerman(germanText(w))} />
              </View>
              {grammar ? <T v="bodyM" dim style={{ marginTop: 6 }}>{grammar}</T> : null}
              {w.ex ? (
                <View style={[styles.ex, { borderColor: t.border }]}>
                  <Example w={w} size={16} />
                  {w.exRu ? <T v="bodyM" dim style={{ marginTop: 4 }}>{w.exRu}</T> : null}
                </View>
              ) : null}
            </View>
          </FadeIn>
        ) : null}

        <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
          {res ? (
            <Btn title="Дальше" arrow onPress={next} style={{ flex: 1 }} />
          ) : (
            <>
              <Btn title="Не знаю" variant="outline" onPress={() => check(true)} style={{ flex: 1 }} />
              <Btn title="Проверить" onPress={() => check()} disabled={!text.trim()} style={{ flex: 1.4 }} />
            </>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}>
          <Icon name="keyboard" size={14} color={t.faint} />
          <T v="small" faint style={{ textAlign: "center" }}>Регистр не важен · ae / oe / ue / ss = ä / ö / ü / ß</T>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8 },
  input: { borderBottomWidth: 1.5, fontSize: 24, paddingHorizontal: 2, paddingVertical: 12, marginTop: 26 },
  umlauts: { flexDirection: "row", gap: 8, marginTop: 14 },
  uml: { flex: 1, borderRadius: 14, borderWidth: 1, height: 46, alignItems: "center", justifyContent: "center" },
  vdot: { width: 8, height: 8, borderRadius: 4 },
  answer: { borderTopWidth: 1, marginTop: 18, paddingTop: 14 },
  ex: { borderLeftWidth: 2, paddingLeft: 12, marginTop: 14 },
});
