import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { TOPICS, TopicId, Word } from "../data/types";
import { useDeck } from "../ui/deck";
import { CardState, MATURE_INTERVAL } from "../logic/srs";
import { Chip, FadeIn, Pressy, GermanWord, grammarLine, IconBtn, ScreenHeader, T } from "../ui/components";
import { AtFlag, Icon } from "../ui/Icon";
import { germanText, speakGerman } from "../ui/speech";
import { font, useTheme } from "../ui/theme";
import { plural } from "../ui/format";
import { Example } from "./SessionScreen";

export function BrowseScreen(p: { cards: Record<string, CardState>; onBack?: () => void; onCustom?: () => void; customCount?: number; bottomInset?: number }) {
  const t = useTheme();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<TopicId | null>(null);
  const [atOnly, setAtOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const { words: WORDS } = useDeck();

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return WORDS.filter(
      (w) =>
        (!topic || w.topic === topic) &&
        (!atOnly || w.at) &&
        (!s || w.de.toLowerCase().includes(s) || w.ru.toLowerCase().includes(s)),
    );
  }, [q, topic, atOnly, WORDS]);

  const status = (w: Word) => {
    const c = p.cards[w.id];
    if (!c) return { label: "новое", color: t.faint };
    if (c.interval >= MATURE_INTERVAL) return { label: "знаю", color: t.good };
    return { label: "учу", color: t.hard };
  };

  return (
    <FadeIn>
      <ScreenHeader
        title="Словарь"
        onBack={p.onBack}
        right={p.onCustom ? (
          <Pressy onPress={p.onCustom} accessibilityRole="button" accessibilityLabel="Мои слова" scaleTo={0.95}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: t.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Icon name="star" size={16} color={t.text} />
            <T v="label">Мои слова{p.customCount ? ` · ${p.customCount}` : ""}</T>
          </Pressy>
        ) : undefined}
        subtitle={`${list.length} ${plural(list.length, "слово", "слова", "слов")}`}
      />
      <View style={[styles.search, { backgroundColor: t.card }]}>
        <Icon name="search" size={18} color={t.textDim} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Поиск по-немецки или по-русски"
          placeholderTextColor={t.textDim}
          selectionColor={t.accent}
          cursorColor={t.accent}
          style={[font.regular, { flex: 1, outlineWidth: 0, color: t.text, fontSize: 16, paddingVertical: 12 }]}
        />
        {q ? <IconBtn name="x" label="Очистить" size={16} onPress={() => setQ("")} /> : null}
      </View>
      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 }}
          data={[null, ...TOPICS.filter((x) => x.id !== "custom" || WORDS.some((w) => w.custom)).map((x) => x.id)] as (TopicId | null)[]}
          keyExtractor={(x) => x ?? "all"}
          ListFooterComponent={<Chip label="Австрийские" active={atOnly} onPress={() => setAtOnly(!atOnly)} />}
          renderItem={({ item }) => {
            const tp = TOPICS.find((x) => x.id === item);
            return <Chip label={tp ? tp.de : "Все"} active={topic === item} onPress={() => setTopic(item)} />;
          }}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: p.bottomInset ?? 40 }}
        initialNumToRender={20}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<T v="body" dim style={{ textAlign: "center", marginTop: 40 }}>Ничего не найдено.</T>}
        renderItem={({ item: w }) => {
          const st = status(w);
          const g = grammarLine(w);
          const isOpen = open === w.id;
          return (
            <Pressable onPress={() => setOpen(isOpen ? null : w.id)} style={[styles.row, { borderColor: t.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <GermanWord w={w} size={19} center={false} />
                  <T v="bodyM" dim style={{ marginTop: 3 }}>{w.ru}</T>
                </View>
                {w.at ? <AtFlag width={16} /> : null}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: 54, justifyContent: "flex-end" }}>
                  <View style={[styles.dot, { backgroundColor: st.color }]} />
                  <T v="small" dim>{st.label}</T>
                </View>
              </View>
              {isOpen ? (
                <View style={{ marginTop: 12, paddingBottom: 2 }}>
                  {g ? <T v="bodyM" dim>{g}</T> : null}
                  {w.ex ? (
                    <View style={[styles.ex, { borderColor: t.border }]}>
                      <Example w={w} size={16} />
                      {w.exRu ? <T v="bodyM" dim style={{ marginTop: 3 }}>{w.exRu}</T> : null}
                    </View>
                  ) : null}
                  {w.note ? <T v="small" dim style={{ marginTop: 10 }}>{w.note}</T> : null}
                  <Pressable
                    onPress={() => speakGerman(germanText(w) + ". " + w.ex)}
                    hitSlop={8}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}
                  >
                    <Icon name="volume" size={16} color={t.text} />
                    <T v="label">Прослушать</T>
                  </Pressable>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  search: { marginHorizontal: 24, marginTop: 18, borderRadius: 14, paddingLeft: 14, paddingRight: 6, flexDirection: "row", alignItems: "center", gap: 10 },
  row: { borderBottomWidth: 1, paddingVertical: 14 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  ex: { borderLeftWidth: 2, paddingLeft: 12, marginTop: 10 },
});
