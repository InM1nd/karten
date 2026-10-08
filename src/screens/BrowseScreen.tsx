import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { TOPICS, TopicId, Word } from "../data/types";
import { useDeck } from "../ui/deck";
import { CardState, MATURE_INTERVAL } from "../logic/srs";
import { AtBadge, Chip, GermanWord, grammarLine } from "../ui/components";
import { germanText, speakGerman } from "../ui/speech";
import { useTheme } from "../ui/theme";

export function BrowseScreen(p: { cards: Record<string, CardState>; onBack: () => void }) {
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
    if (!c) return { label: "новое", color: t.textDim };
    if (c.interval >= MATURE_INTERVAL) return { label: "знаю", color: t.good };
    return { label: "учу", color: t.hard };
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Pressable onPress={p.onBack} hitSlop={14} accessibilityLabel="Назад">
          <Text style={{ fontSize: 26, color: t.text }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: t.text }]}>Словарь</Text>
        <Text style={{ color: t.textDim, fontSize: 15 }}>{list.length}</Text>
      </View>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Поиск по-немецки или по-русски"
        placeholderTextColor={t.textDim}
        style={[styles.search, { backgroundColor: t.card, color: t.text, borderColor: t.border }]}
      />
      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}
          data={[null, ...TOPICS.filter((x) => x.id !== "custom" || WORDS.some((w) => w.custom)).map((x) => x.id)] as (TopicId | null)[]}
          keyExtractor={(x) => x ?? "all"}
          ListFooterComponent={<Chip label="🇦🇹 Австрийские" active={atOnly} onPress={() => setAtOnly(!atOnly)} />}
          renderItem={({ item }) => {
            const tp = TOPICS.find((x) => x.id === item);
            return (
              <Chip
                label={tp ? `${tp.emoji} ${tp.de}` : "Все"}
                active={topic === item}
                onPress={() => setTopic(item)}
              />
            );
          }}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: 20, paddingTop: 6 }}
        initialNumToRender={20}
        renderItem={({ item: w }) => {
          const st = status(w);
          const g = grammarLine(w);
          const isOpen = open === w.id;
          return (
            <Pressable
              onPress={() => setOpen(isOpen ? null : w.id)}
              style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <GermanWord w={w} size={20} center={false} />
                  <Text style={{ color: t.textDim, fontSize: 16, marginTop: 2 }}>{w.ru}</Text>
                </View>
                {w.at ? <AtBadge /> : null}
                <Text style={{ color: st.color, fontSize: 12, fontWeight: "700", marginLeft: 8 }}>{st.label}</Text>
              </View>
              {isOpen ? (
                <View style={{ marginTop: 10 }}>
                  {g ? <Text style={{ color: t.textDim, fontSize: 15 }}>{g}</Text> : null}
                  {w.ex ? <Text style={{ color: t.text, fontSize: 16, fontStyle: "italic", marginTop: 6 }}>{w.ex}</Text> : null}
                  {w.exRu ? <Text style={{ color: t.textDim, fontSize: 15, marginTop: 3 }}>{w.exRu}</Text> : null}
                  {w.note ? <Text style={{ color: t.textDim, fontSize: 14, marginTop: 6 }}>💡 {w.note}</Text> : null}
                  <Pressable onPress={() => speakGerman(germanText(w) + ". " + w.ex)} style={{ marginTop: 8 }}>
                    <Text style={{ color: t.accent, fontSize: 15, fontWeight: "700" }}>🔊 Прослушать</Text>
                  </Pressable>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", flex: 1 },
  search: { marginHorizontal: 20, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17 },
  row: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
});
