import React, { useState } from "react";
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Article, Kind, Word } from "../data/types";
import { CardState, MATURE_INTERVAL } from "../logic/srs";
import { normalize } from "../logic/typing";
import { Btn, FadeIn, GermanWord, Pressy, ScreenHeader, SectionTitle, Segmented, T } from "../ui/components";
import { Icon } from "../ui/Icon";
import { font, useTheme } from "../ui/theme";
import { useDeck } from "../ui/deck";

type ArtChoice = "none" | Article;

interface Form {
  article: ArtChoice;
  kind: Exclude<Kind, "noun">;
  de: string;
  plural: string;
  ru: string;
  ex: string;
  exRu: string;
}

const emptyForm: Form = { article: "none", kind: "phrase", de: "", plural: "", ru: "", ex: "", exRu: "" };

export function newCustomId(): string {
  return `custom:${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Builds a Word from the form; returns an error message if invalid. Exported for tests. */
export function formToWord(f: Form, id: string): Word | string {
  const de = f.de.trim().replace(/^(der|die|das)\s+/i, "");
  const ru = f.ru.trim();
  if (!de) return "Введите немецкое слово";
  if (!ru) return "Введите перевод";
  const base = { id, topic: "custom" as const, de, ru, ex: f.ex.trim(), custom: true };
  const exRu = f.exRu.trim();
  if (f.article !== "none") {
    return { ...base, kind: "noun", article: f.article, plural: f.plural.trim() || null, ...(exRu ? { exRu } : {}) };
  }
  return { ...base, kind: f.kind, ...(exRu ? { exRu } : {}) };
}

function wordToForm(w: Word): Form {
  return {
    article: w.article ?? "none",
    kind: w.kind === "noun" ? "phrase" : w.kind,
    de: w.de,
    plural: w.plural ?? "",
    ru: w.ru,
    ex: w.ex,
    exRu: w.exRu ?? "",
  };
}

export function CustomWordsScreen(p: {
  custom: Word[];
  cards: Record<string, CardState>;
  onSave: (w: Word) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const t = useTheme();
  const { words } = useDeck();
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  if (editing) {
    const f = editing.form;
    const set = (patch: Partial<Form>) => setEditing({ ...editing, form: { ...f, ...patch } });
    const dup = f.de.trim()
      ? words.find((w) => w.id !== editing.id && normalize(w.de) === normalize(f.de.replace(/^(der|die|das)\s+/i, "")))
      : undefined;
    const save = () => {
      const r = formToWord(f, editing.id ?? newCustomId());
      if (typeof r === "string") return setError(r);
      p.onSave(r);
      setEditing(null);
      setError(null);
    };
    const del = () =>
      Alert.alert("Удалить слово?", `«${f.de}» и его прогресс будут удалены.`, [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            p.onDelete(editing.id!);
            setEditing(null);
          },
        },
      ]);
    const input = (label: string, value: string, onChange: (v: string) => void, placeholder: string, multiline = false, big = false) => (
      <View style={{ marginTop: 22 }}>
        <T v="caps" dim>{label}</T>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={t.faint}
          autoCorrect={false}
          multiline={multiline}
          accessibilityLabel={label}
          selectionColor={t.accent}
          cursorColor={t.accent}
          onFocus={() => setFocus(label)}
          onBlur={() => setFocus((x) => (x === label ? null : x))}
          style={[
            big ? font.semibold : font.regular,
            styles.input,
            { outlineWidth: 0, fontSize: big ? 26 : 18, letterSpacing: big ? -0.6 : -0.1, color: t.text, borderColor: focus === label ? t.text : t.border },
          ]}
        />
      </View>
    );
    return (
      <FadeIn key={editing.id ?? "new"}>
        <ScreenHeader title={editing.id ? "Изменить слово" : "Новое слово"} onBack={() => setEditing(null)} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <SectionTitle>Артикль</SectionTitle>
          <Segmented<ArtChoice>
            value={f.article}
            options={[
              { value: "none", label: "нет" },
              { value: "der", label: "der" },
              { value: "die", label: "die" },
              { value: "das", label: "das" },
            ]}
            onChange={(v) => set({ article: v })}
          />
          {f.article === "none" ? (
            <View style={{ marginTop: 10 }}>
              <Segmented<Form["kind"]>
                value={f.kind}
                options={[
                  { value: "verb", label: "Глагол" },
                  { value: "adj", label: "Прил./нар." },
                  { value: "phrase", label: "Фраза" },
                ]}
                onChange={(v) => set({ kind: v })}
              />
            </View>
          ) : null}
          {input("По-немецки *", f.de, (v) => set({ de: v }), f.article === "none" ? "z. B. sich beeilen" : "z. B. Kaffeehaus", false, true)}
          {dup ? (
            <T v="small" color={t.hard} style={{ marginTop: 8 }}>
              Похожее слово уже есть: {dup.article ? dup.article + " " : ""}{dup.de} — {dup.ru}
            </T>
          ) : null}
          {f.article !== "none" ? input("Множественное число", f.plural, (v) => set({ plural: v }), "z. B. Kaffeehäuser (пусто — нет)") : null}
          {input("Перевод *", f.ru, (v) => set({ ru: v }), "по-русски")}
          {input("Пример (по-немецки)", f.ex, (v) => set({ ex: v }), "необязательно", true)}
          {input("Перевод примера", f.exRu, (v) => set({ exRu: v }), "необязательно", true)}
          {error ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 }}>
              <View style={[styles.dot, { backgroundColor: t.again }]} />
              <T v="bodyM" color={t.again}>{error}</T>
            </View>
          ) : null}
          <Btn title="Сохранить" onPress={save} style={{ marginTop: 28 }} />
          {editing.id ? <Btn title="Удалить" variant="danger" icon="trash" onPress={del} style={{ marginTop: 10 }} /> : null}
        </ScrollView>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <ScreenHeader title="Мои слова" onBack={p.onBack} subtitle={p.custom.length ? `${p.custom.length} в словаре` : undefined} />
      <FlatList
        data={p.custom}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ marginTop: 18, marginBottom: 14 }}>
            <Btn title="Добавить слово" icon="plus" onPress={() => setEditing({ id: null, form: emptyForm })} />
            <T v="bodyM" dim style={{ marginTop: 14 }}>
              Свои слова попадают в ежедневные занятия и повторения так же, как встроенные (тема «Мои слова»).
            </T>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Icon name="pen" size={28} color={t.faint} />
            <T v="body" dim style={{ textAlign: "center", marginTop: 12 }}>Пока нет своих слов.</T>
          </View>
        }
        renderItem={({ item: w, index }) => {
          const c = p.cards[w.id];
          const status = !c ? "новое" : c.interval >= MATURE_INTERVAL ? "знаю" : "учу";
          return (
            <Pressy
              scaleTo={0.99}
              onPress={() => setEditing({ id: w.id, form: wordToForm(w) })}
              accessibilityRole="button"
              style={[styles.row, { borderColor: t.border }, index === 0 && { borderTopWidth: 1 }]}
            >
              <View style={{ flex: 1 }}>
                <GermanWord w={w} size={19} center={false} />
                <T v="bodyM" dim style={{ marginTop: 3 }}>{w.ru}</T>
              </View>
              <Text style={[font.medium, { color: status === "знаю" ? t.text : t.textDim, fontSize: 13 }]}>{status}</Text>
              <Icon name="chevron" size={16} color={t.faint} />
            </Pressy>
          );
        }}
      />
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  input: { borderBottomWidth: 1, paddingHorizontal: 0, paddingVertical: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, paddingVertical: 14 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
