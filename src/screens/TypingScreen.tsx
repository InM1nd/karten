import React, { useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { TOPICS, Word } from "../data/types";
import { CardState, Grade } from "../logic/srs";
import { typingSelection } from "../logic/games";
import { checkTyping, TypingResult } from "../logic/typing";
import { AtBadge, Btn, GermanWord, grammarLine, ScreenHeader } from "../ui/components";
import { hapticBad, hapticOk, hapticTap } from "../ui/haptics";
import { germanText, speakGerman } from "../ui/speech";
import { useTheme } from "../ui/theme";
import { useDeck } from "../ui/deck";

const KIND_HINT: Record<Word["kind"], string> = {
  noun: "существительное — напиши с артиклем",
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
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Письмо" onBack={p.onBack} />
        <View style={{ padding: 24, flex: 1, justifyContent: "center" }}>
          <Text style={{ fontSize: 56, textAlign: "center" }}>⌨️</Text>
          <Text style={[styles.big, { color: t.text }]}>{list.length ? "Раунд окончен" : "Нет слов"}</Text>
          {list.length ? (
            <Text style={{ color: t.textDim, fontSize: 17, textAlign: "center" }}>
              Верно: {stats.correct} · почти: {stats.almost} · ошибок: {stats.wrong}
            </Text>
          ) : null}
          <Btn title="Ещё 10 слов" onPress={restart} style={{ marginTop: 24 }} />
          <Btn title="Назад" outline onPress={p.onBack} style={{ marginTop: 12 }} />
        </View>
      </View>
    );
  }

  const topic = TOPICS.find((x) => x.id === w.topic);
  const verdict =
    res?.status === "correct"
      ? { text: "✅ Верно!", color: t.good }
      : res?.status === "article"
        ? { text: "🟡 Почти: проверь артикль", color: t.hard }
        : res?.status === "typo"
          ? { text: "🟡 Почти: одна опечатка", color: t.hard }
          : { text: "❌ Неверно", color: t.again };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
      <ScreenHeader title={`Письмо · ${i + 1}/${list.length}`} onBack={p.onBack} />
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.prompt, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={{ color: t.textDim, fontSize: 14 }}>
            {topic?.emoji} {topic?.de} · {KIND_HINT[w.kind]}
          </Text>
          {w.at ? <View style={{ marginTop: 8 }}><AtBadge /></View> : null}
          <Text style={{ fontSize: 28, fontWeight: "700", color: t.text, textAlign: "center", marginTop: 10 }}>{w.ru}</Text>
        </View>

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
          editable={!res}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
          placeholder={w.kind === "noun" ? "der / die / das …" : "по-немецки…"}
          placeholderTextColor={t.textDim}
          onSubmitEditing={() => (res ? next() : check())}
          returnKeyType="done"
          style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: res ? verdict.color : t.border }]}
        />
        {!res ? (
          <View style={styles.umlauts}>
            {UMLAUTS.map((u) => (
              <Pressable key={u} onPress={() => insert(u)} style={[styles.uml, { backgroundColor: t.cardAlt }]}>
                <Text style={{ fontSize: 22, color: t.text, fontWeight: "700" }}>{u}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {res ? (
          <View style={[styles.result, { backgroundColor: t.card, borderColor: verdict.color }]}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: verdict.color }}>{verdict.text}</Text>
            {res.status !== "correct" && text.trim() ? (
              <Text style={{ fontSize: 22, marginTop: 10, color: t.text }}>
                {res.diff.map((d, k) => (
                  <Text
                    key={k}
                    style={
                      d.type === "extra"
                        ? { color: t.again, textDecorationLine: "line-through" }
                        : d.type === "missing"
                          ? { color: t.good, textDecorationLine: "underline", fontWeight: "800" }
                          : undefined
                    }
                  >
                    {d.text}
                  </Text>
                ))}
              </Text>
            ) : null}
            {res.status !== "correct" && text.trim() ? (
              <Text style={{ color: t.textDim, fontSize: 13, marginTop: 4 }}>
                красным — лишнее, зелёным — пропущенное
              </Text>
            ) : null}
            <View style={{ marginTop: 14, alignItems: "flex-start" }}>
              <GermanWord w={w} size={26} center={false} />
              {grammarLine(w) ? <Text style={{ color: t.textDim, fontSize: 15, marginTop: 4 }}>{grammarLine(w)}</Text> : null}
            </View>
            {w.ex ? <Text style={{ color: t.text, fontStyle: "italic", fontSize: 16, marginTop: 10 }}>{w.ex}</Text> : null}
            {w.exRu ? <Text style={{ color: t.textDim, fontSize: 15, marginTop: 4 }}>{w.exRu}</Text> : null}
            <Pressable onPress={() => speakGerman(germanText(w))} style={{ marginTop: 10 }}>
              <Text style={{ color: t.accent, fontWeight: "700", fontSize: 15 }}>🔊 Прослушать</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          {res ? (
            <Btn title="Дальше" onPress={next} style={{ flex: 1 }} />
          ) : (
            <>
              <Btn title="Не знаю" outline onPress={() => check(true)} style={{ flex: 1 }} />
              <Btn title="Проверить" onPress={() => check()} disabled={!text.trim()} style={{ flex: 1.4 }} />
            </>
          )}
        </View>
        <Text style={{ color: t.textDim, textAlign: "center", marginTop: 14, fontSize: 13 }}>
          Регистр не важен. Можно писать ae / oe / ue / ss вместо ä / ö / ü / ß.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 30, fontWeight: "800", textAlign: "center", marginVertical: 12 },
  prompt: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: "center" },
  input: { borderWidth: 2, borderRadius: 16, fontSize: 22, paddingHorizontal: 16, paddingVertical: 14, marginTop: 16 },
  umlauts: { flexDirection: "row", gap: 10, marginTop: 10 },
  uml: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  result: { borderWidth: 2, borderRadius: 16, padding: 16, marginTop: 16 },
});
