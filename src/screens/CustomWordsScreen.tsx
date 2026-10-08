import React, { useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Article, Kind, Word } from "../data/types";
import { CardState, MATURE_INTERVAL } from "../logic/srs";
import { normalize } from "../logic/typing";
import { Btn, GermanWord, ScreenHeader, SectionTitle, Segmented } from "../ui/components";
import { useTheme } from "../ui/theme";
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
    const input = (label: string, value: string, onChange: (v: string) => void, placeholder: string, multiline = false) => (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: t.textDim, fontSize: 14, marginBottom: 6 }}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={t.textDim}
          autoCorrect={false}
          multiline={multiline}
          accessibilityLabel={label}
          style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.border }]}
        />
      </View>
    );
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title={editing.id ? "Изменить слово" : "Новое слово"} onBack={() => setEditing(null)} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
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
          {input("По-немецки *", f.de, (v) => set({ de: v }), f.article === "none" ? "z. B. sich beeilen" : "z. B. Kaffeehaus")}
          {dup ? <Text style={{ color: t.hard, marginTop: 6 }}>Похожее слово уже есть: {dup.article ? dup.article + " " : ""}{dup.de} — {dup.ru}</Text> : null}
          {f.article !== "none" ? input("Множественное число", f.plural, (v) => set({ plural: v }), "z. B. Kaffeehäuser (пусто — нет)") : null}
          {input("Перевод *", f.ru, (v) => set({ ru: v }), "по-русски")}
          {input("Пример (по-немецки)", f.ex, (v) => set({ ex: v }), "необязательно", true)}
          {input("Перевод примера", f.exRu, (v) => set({ exRu: v }), "необязательно", true)}
          {error ? <Text style={{ color: t.again, marginTop: 12, fontSize: 16 }}>{error}</Text> : null}
          <Btn title="Сохранить" onPress={save} style={{ marginTop: 20 }} />
          {editing.id ? <Btn title="Удалить" color={t.again} outline onPress={del} style={{ marginTop: 12 }} /> : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Мои слова" onBack={p.onBack} />
      <FlatList
        data={p.custom}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          <View>
            <Btn title="＋ Добавить слово" onPress={() => setEditing({ id: null, form: emptyForm })} />
            <Text style={{ color: t.textDim, marginTop: 12, marginBottom: 8, fontSize: 15 }}>
              Свои слова попадают в ежедневные занятия и повторения так же, как встроенные (тема «⭐ Мои слова»).
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: t.textDim, textAlign: "center", marginTop: 30, fontSize: 16 }}>Пока нет своих слов.</Text>
        }
        renderItem={({ item: w }) => {
          const c = p.cards[w.id];
          const status = !c ? "новое" : c.interval >= MATURE_INTERVAL ? "знаю" : "учу";
          return (
            <Pressable
              onPress={() => setEditing({ id: w.id, form: wordToForm(w) })}
              style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}
            >
              <View style={{ flex: 1 }}>
                <GermanWord w={w} size={20} center={false} />
                <Text style={{ color: t.textDim, fontSize: 16, marginTop: 2 }}>{w.ru}</Text>
              </View>
              <Text style={{ color: t.textDim, fontSize: 12, fontWeight: "700" }}>{status} ✎</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
});
