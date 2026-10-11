import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { TOPICS, TopicId } from "../data/types";
import { Level, Settings } from "../logic/data";
import { Btn, Chip, FadeIn, Pressy, Segmented, T } from "../ui/components";
import { useTheme } from "../ui/theme";
import { LANGS, Lang, tr } from "../i18n";

const LEVELS: { value: Level; title: string; sub: string; perDay: number }[] = [
  { value: "A1", title: "A1 · начинаю", sub: "Знаю совсем немного слов", perDay: 5 },
  { value: "A2", title: "A2 · базовый", sub: "Понимаю простые фразы и бытовые темы", perDay: 10 },
  { value: "B1", title: "B1 · уверенный", sub: "Говорю на бытовые и рабочие темы", perDay: 15 },
];

/** First launch: language + level, topics, new words per day. Everything can be changed later in Settings. */
export function OnboardingScreen(p: { settings: Settings; onLang: (l: Lang) => void; onDone: (patch: Partial<Settings>) => void }) {
  const t = useTheme();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level>(p.settings.level);
  const [topics, setTopics] = useState<TopicId[]>(p.settings.topics);
  const [perDay, setPerDay] = useState(p.settings.newPerDay);
  const finish = () => p.onDone({ level, topics, newPerDay: perDay, onboarded: true });
  const skip = () => p.onDone({ onboarded: true });
  const toggle = (id: TopicId) => setTopics((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const titles = [tr("Какой у тебя уровень?"), tr("Что хочешь учить?"), tr("Сколько новых слов в день?")];

  return (
    <FadeIn>
      <View style={styles.top}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i <= step ? t.accent : t.border }} />
          ))}
        </View>
        <Pressable onPress={skip} hitSlop={12} accessibilityRole="button">
          <T v="bodyM" dim>{tr("Пропустить")}</T>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }}>
        {step === 0 ? <T v="caps" dim style={{ marginTop: 26 }}>{tr("Willkommen bei Karten")}</T> : null}
        <T v="h1" style={{ marginTop: step === 0 ? 10 : 26 }}>{titles[step]}</T>

        {step === 0 ? (
          <>
            <View style={{ marginTop: 22, gap: 10 }}>
              {LEVELS.map((l) => {
                const on = l.value === level;
                return (
                  <Pressy key={l.value} onPress={() => { setLevel(l.value); setPerDay(l.perDay); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                    scaleTo={0.99} style={[styles.opt, { borderColor: on ? t.text : t.border, backgroundColor: on ? t.card : "transparent" }]}>
                    <T v="h3">{tr(l.title)}</T>
                    <T v="small" dim style={{ marginTop: 3 }}>{tr(l.sub)}</T>
                  </Pressy>
                );
              })}
            </View>
            <T v="small" dim style={{ marginTop: 12 }}>{tr("От уровня зависит темп новых слов. Словарь рассчитан на A2–B1.")}</T>
            <T v="caps" dim style={{ marginTop: 26, marginBottom: 10 }}>{tr("Язык интерфейса")}</T>
            <Segmented<Lang> value={p.settings.lang} options={LANGS} onChange={p.onLang} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <T v="bodyM" dim style={{ marginTop: 10 }}>{tr("Можно выбрать несколько. Ничего не выбрано — все темы.")}</T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 18 }}>
              <Chip label={tr("Все темы")} active={topics.length === 0} onPress={() => setTopics([])} />
              {TOPICS.filter((x) => x.id !== "custom").map((x) => (
                <Chip key={x.id} label={x.de} active={topics.includes(x.id)} onPress={() => toggle(x.id)} />
              ))}
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <T v="bodyM" dim style={{ marginTop: 10 }}>{tr("Повторения добавляются сами. 10 новых слов — примерно 5 минут в день.")}</T>
            <View style={{ marginTop: 22 }}>
              <Segmented value={perDay} options={[5, 10, 15, 20].map((n) => ({ value: n, label: String(n) }))} onChange={setPerDay} />
            </View>
          </>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 22, paddingBottom: 18, flexDirection: "row", gap: 10 }}>
        {step > 0 ? <Btn title={tr("Назад")} variant="outline" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
        <Btn title={step < 2 ? tr("Дальше") : tr("Начать учить")} arrow={step === 2} onPress={() => (step < 2 ? setStep(step + 1) : finish())} style={{ flex: 2 }} />
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 16 },
  opt: { borderWidth: 1, borderRadius: 18, padding: 16 },
});
