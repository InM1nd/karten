import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TOPICS, Word } from "../data/types";
import { useDeck } from "../ui/deck";
import { CardState, formatDays, Grade, nextQueue, previewLabel } from "../logic/srs";
import { Btn, FadeIn, GermanWord, grammarLine, IconBtn, ProgressLine, Pressy, ResultHero, StatSplit, T } from "../ui/components";
import { AtFlag, Icon } from "../ui/Icon";
import { plural } from "../ui/format";
import { germanText, speakGerman } from "../ui/speech";
import { font, useTheme } from "../ui/theme";
import { tr, pl } from "../i18n";

export interface SessionItem {
  id: string;
  dir: "de-ru" | "ru-de";
}

export interface SessionProps {
  items: SessionItem[];
  cards: Record<string, CardState>;
  today: number;
  autoSpeak: boolean;
  streak: number;
  canLearnMore: boolean;
  onAnswer: (id: string, grade: Grade) => void;
  /** revert the last onAnswer (App restores the previous card / daily / streak state) */
  onUndo?: () => void;
  onExit: () => void;
  onLearnMore: () => void;
  /** practice mode (Mistakes of the week): different finish texts, no "learn more" */
  practice?: boolean;
  title?: string;
  /** called once when the queue is finished */
  onComplete?: () => void;
}

const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

/** Example sentence with the headword in semibold. */
export function Example({ w, size = 20 }: { w: Word; size?: number }) {
  const t = useTheme();
  const base = w.de.replace(/[()…]/g, "").split(/[\s/]/)[0];
  const parts = base.length >= 3 ? w.ex.split(new RegExp(`(${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i")) : [w.ex];
  return (
    <Text style={[font.regular, { fontSize: size, lineHeight: Math.round(size * 1.38), letterSpacing: -0.3, color: t.text }]}>
      {parts.map((s, i) => (i % 2 ? <Text key={i} style={font.semibold}>{s}</Text> : s))}
    </Text>
  );
}

type Tone = "again" | "hard" | "good";
function GradeBtn(p: { title: string; sub: string; onPress: () => void; tone: Tone }) {
  const t = useTheme();
  const bg = p.tone === "good" ? t.ink : p.tone === "again" ? (t.dark ? "#3A1517" : "#FDECEC") : t.card;
  const fg = p.tone === "good" ? t.inkText : p.tone === "again" ? (t.dark ? "#FF8A8D" : "#B4232A") : t.text;
  return (
    <Pressy onPress={p.onPress} accessibilityRole="button" style={[styles.grade, { backgroundColor: bg }]}>
      <Text style={[font.semibold, { fontSize: 16, letterSpacing: -0.1, color: fg }]}>{p.title}</Text>
      <Text style={[font.medium, { fontSize: 12.5, marginTop: 4, color: fg, opacity: 0.6 }]}>{p.sub}</Text>
    </Pressy>
  );
}

function DetailRow(p: { label: string; children: React.ReactNode; inline?: boolean; icon?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.drow, { borderBottomColor: t.border }, p.inline && { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {p.icon}
        <T v={p.inline ? "bodyM" : "small"} dim>{p.label}</T>
      </View>
      <View style={p.inline ? { flexShrink: 1, alignItems: "flex-end" } : { marginTop: 6 }}>{p.children}</View>
    </View>
  );
}

export function SessionScreen(p: SessionProps) {
  const t = useTheme();
  const [queue, setQueue] = useState<SessionItem[]>(p.items);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [tally, setTally] = useState({ again: 0, hard: 0, good: 0 });
  const rot = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(1)).current;
  const busy = useRef(false);
  const { byId } = useDeck();
  const completed = useRef(false);
  const history = useRef<{ queue: SessionItem[]; done: Set<string>; tally: typeof tally }[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  // swipe grading: left = again, up = hard, right = good
  const pan = useRef(new Animated.ValueXY()).current;
  const answerRef = useRef<(g: Grade) => void>(() => {});
  const flippedRef = useRef(false);
  flippedRef.current = flipped;
  const [scrollable, setScrollable] = useState(false);
  const boxH = useRef(0);
  const SWIPE = 90;
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => flippedRef.current && (Math.abs(g.dx) > 14 || g.dy < -14) && Math.abs(g.dx) + Math.abs(g.dy) > 14,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_e, g) => {
          const grade: Grade | null = g.dx > SWIPE ? "good" : g.dx < -SWIPE ? "again" : g.dy < -SWIPE && Math.abs(g.dx) < SWIPE ? "hard" : null;
          if (!grade) {
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
            return;
          }
          const to = grade === "good" ? { x: 500, y: g.dy } : grade === "again" ? { x: -500, y: g.dy } : { x: g.dx, y: -700 };
          Animated.timing(pan, { toValue: to, duration: 160, useNativeDriver: false }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            answerRef.current(grade);
          });
        },
        onPanResponderTerminate: () => Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(),
      }),
    [pan],
  );

  const total = p.items.length;
  const current = queue[0];
  const word: Word | undefined = current ? byId[current.id] : undefined;

  useEffect(() => {
    if (word && p.autoSpeak && current?.dir === "de-ru" && !flipped) speakGerman(germanText(word));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, queue.length]);

  // card flip: rotate to 90°, swap faces, rotate back (subtle, ~300 ms)
  const flip = () => {
    if (flipped || !word || busy.current) return;
    busy.current = true;
    Animated.timing(rot, { toValue: 1, duration: 130, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setFlipped(true);
      if (p.autoSpeak && current?.dir === "ru-de") speakGerman(germanText(word));
      rot.setValue(-1);
      Animated.timing(rot, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
        busy.current = false;
      });
    });
  };

  const answer = (g: Grade) => {
    if (!current) return;
    history.current.push({ queue, done, tally });
    setCanUndo(true);
    p.onAnswer(current.id, g);
    setTally((x) => ({ ...x, [g]: x[g] + 1 }));
    if (g !== "again") setDone((s) => new Set(s).add(current.id));
    const ids = nextQueue(queue.map((q) => q.id), g);
    const map = new Map(queue.map((q) => [q.id, q]));
    setQueue(ids.map((id) => map.get(id)!));
    setFlipped(false);
    busy.current = false;
    rot.setValue(0);
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  answerRef.current = answer;

  const undo = () => {
    const h = history.current.pop();
    if (!h) return;
    p.onUndo?.();
    setQueue(h.queue);
    setDone(h.done);
    setTally(h.tally);
    setFlipped(true);
    rot.setValue(0);
    busy.current = false;
    setCanUndo(history.current.length > 0);
  };

  useEffect(() => {
    if (!current && !completed.current && p.items.length > 0) {
      completed.current = true;
      p.onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const labels = useMemo(() => {
    if (!current) return null;
    const s = p.cards[current.id];
    return {
      again: previewLabel(s, "again", p.today),
      hard: previewLabel(s, "hard", p.today),
      good: previewLabel(s, "good", p.today),
    };
  }, [current, p.cards, p.today]);

  if (!current || !word) {
    return (
      <FadeIn>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40, flexGrow: 1 }}>
          <T v="caps" dim>{p.practice ? tr("Ошибки недели") : tr("Занятие завершено")}</T>
          <T v="h1" style={{ marginTop: 14 }}>{tr("Готово!")}</T>
          <ResultHero
            value={total}
            label={p.practice ? tr("слов из ошибок\nпройдено") : `${pl(total, "карточка", "карточки", "карточек")}\n${tr("за сегодня")}`}
            note={p.streak > 0 ? tr("Серия: {n} {w} подряд", { n: p.streak, w: pl(p.streak, "день", "дня", "дней") }) : undefined}
            accentNote
          />
          <View style={{ marginTop: 26 }}>
            <StatSplit items={[{ value: tally.good, label: tr("помню") }, { value: tally.hard, label: tr("трудно") }, { value: tally.again, label: tr("не помню") }]} />
          </View>
          <View style={{ flex: 1, minHeight: 30 }} />
          <Btn title={tr("На главную")} onPress={p.onExit} />
          {p.canLearnMore ? <Btn title={tr("Ещё 10 новых слов")} variant="outline" onPress={p.onLearnMore} style={{ marginTop: 10 }} /> : null}
        </ScrollView>
      </FadeIn>
    );
  }

  const topic = TOPIC_BY_ID[word.topic];
  const grammar = grammarLine(word);
  const frontIsGerman = current.dir === "de-ru";
  const progress = total ? done.size / total : 0;
  const showGerman = frontIsGerman || flipped;
  const card = p.cards[current.id];
  const isNew = !card;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.progress}>
        <ProgressLine progress={progress} style={{ flex: 1, height: 4 }} />
      </View>
      <View style={styles.topBar}>
        <Pressy onPress={p.onExit} hitSlop={12} accessibilityRole="button" accessibilityLabel={tr("Закрыть")} style={styles.topBtn}>
          <Icon name="x" size={18} color={t.textDim} />
          <T v="bodyM" dim>{tr("Выйти")}</T>
        </Pressy>
        <T v="bodyM" dim style={{ fontVariant: ["tabular-nums"] }}>
          {tr("{a} из {b}", { a: done.size, b: total })}
        </T>
        <Pressy onPress={undo} disabled={!canUndo} hitSlop={12} accessibilityRole="button" accessibilityLabel={tr("Отменить")}
          style={[styles.topBtn, { opacity: canUndo ? 1 : 0.35 }]}>
          <Icon name="undo" size={18} color={t.textDim} />
          <T v="bodyM" dim>{tr("Отменить")}</T>
        </Pressy>
      </View>

      <Animated.View
        {...responder.panHandlers}
        style={{
          flex: 1,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y.interpolate({ inputRange: [-1000, 0, 1000], outputRange: [-1000, 0, 0], extrapolate: "clamp" }) },
            { rotate: pan.x.interpolate({ inputRange: [-300, 0, 300], outputRange: ["-8deg", "0deg", "8deg"] }) },
          ],
        }}
      >
      <Animated.View
        style={{
          flex: 1,
          opacity: enter,
          transform: [
            { perspective: 1200 },
            { rotateY: rot.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-90deg", "0deg", "90deg"] }) },
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        }}
      >
        <Pressable onPress={flip} style={{ flex: 1 }} accessibilityHint={tr("Нажмите, чтобы перевернуть карточку")}>
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollable}
            onLayout={(e: LayoutChangeEvent) => { boxH.current = e.nativeEvent.layout.height; }}
            onContentSizeChange={(_w, h) => setScrollable(h > boxH.current + 4)}
          >
            <View style={styles.meta}>
              <T v="caps" dim>{topic ? tr(topic.ru) : ""}{isNew ? tr(" · новое") : ""}</T>
              {word.at ? <AtFlag width={18} /> : null}
            </View>

            {showGerman ? (
              <View style={{ marginTop: 18, flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <GermanWord w={word} size={word.de.length > 16 ? 34 : 42} center={false} />
                </View>
                <IconBtn name="volume" label={tr("Произнести")} onPress={() => speakGerman(germanText(word))} />
              </View>
            ) : (
              <T v="h1" style={{ marginTop: 22, fontSize: 40, lineHeight: 46, letterSpacing: -1.4 }}>{word.ru}</T>
            )}

            {flipped ? (
              <View style={{ marginTop: 14 }}>
                <DetailRow label={tr("Перевод")} inline>
                  <Text style={[font.semibold, { fontSize: 20, color: t.text, textAlign: "right" }]}>{word.ru}</Text>
                </DetailRow>
                {grammar ? (
                  <DetailRow label={word.kind === "noun" ? tr("Мн. ч.") : tr("Формы")} inline>
                    <T v="bodyM" style={{ textAlign: "right" }}>{word.kind === "noun" ? (grammar === tr("мн. ч. нет") ? tr("нет") : grammar.replace(tr("мн. ч. die {p}", { p: "" }), "die ")) : grammar}</T>
                  </DetailRow>
                ) : null}
                {word.ex ? (
                  <DetailRow label={tr("Пример")}>
                    <Example w={word} size={17} />
                    {word.exRu ? <T v="body" dim style={{ marginTop: 6, fontSize: 15, lineHeight: 21 }}>{word.exRu}</T> : null}
                  </DetailRow>
                ) : null}
                {word.note ? (
                  <DetailRow label={word.at ? tr("В Австрии") : tr("Заметка")} icon={word.at ? <AtFlag width={16} /> : undefined}>
                    <T v="bodyM">{word.note}</T>
                  </DetailRow>
                ) : null}
                {/* real per-card data instead of empty space: review history of this word */}
                <DetailRow label={tr("Твой прогресс")}>
                  <T v="bodyM">
                    {card
                      ? tr("повторений: {r} · ошибок: {l} · интервал: {i}", { r: card.reps, l: card.lapses, i: card.interval > 0 ? formatDays(card.interval) : tr("сегодня") })
                      : tr("Новое слово — первый показ")}
                  </T>
                </DetailRow>
                <T v="small" faint style={{ marginTop: 16, textAlign: "center" }}>{tr("Свайп: ← не помню · ↑ трудно · → помню")}</T>
              </View>
            ) : (
              <T v="bodyM" faint style={{ marginTop: 40 }}>{tr("Нажми на карточку, чтобы перевернуть")}</T>
            )}
          </ScrollView>
        </Pressable>
      </Animated.View>
      {flipped ? (
        <>
          <Animated.View pointerEvents="none" style={[styles.stamp, { right: 22, backgroundColor: t.bg, borderColor: t.again, opacity: pan.x.interpolate({ inputRange: [-SWIPE, -20, 0], outputRange: [1, 0, 0], extrapolate: "clamp" }) }]}>
            <Text style={[font.semibold, { color: t.again, fontSize: 15 }]}>{tr("НЕ ПОМНЮ")}</Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.stamp, { left: 22, backgroundColor: t.bg, borderColor: t.good, opacity: pan.x.interpolate({ inputRange: [0, 20, SWIPE], outputRange: [0, 0, 1], extrapolate: "clamp" }) }]}>
            <Text style={[font.semibold, { color: t.good, fontSize: 15 }]}>{tr("ПОМНЮ")}</Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.stamp, { alignSelf: "center", left: "35%", backgroundColor: t.bg, borderColor: t.hard, opacity: pan.y.interpolate({ inputRange: [-SWIPE, -20, 0], outputRange: [1, 0, 0], extrapolate: "clamp" }) }]}>
            <Text style={[font.semibold, { color: t.hard, fontSize: 15 }]}>{tr("ТРУДНО")}</Text>
          </Animated.View>
        </>
      ) : null}
      </Animated.View>

      <View style={styles.actions}>
        {flipped && labels ? (
          <View style={styles.row}>
            <GradeBtn title={tr("Не помню")} sub={p.practice ? tr("ещё раз") : labels.again} tone="again" onPress={() => answer("again")} />
            <GradeBtn title={tr("Трудно")} sub={p.practice ? tr("оставить в списке") : labels.hard} tone="hard" onPress={() => answer("hard")} />
            <GradeBtn title={tr("Помню")} sub={p.practice ? tr("убрать из списка") : labels.good} tone="good" onPress={() => answer("good")} />
          </View>
        ) : (
          <Btn title={tr("Показать ответ")} onPress={flip} style={{ minHeight: 72, borderRadius: 22 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", paddingHorizontal: 24, paddingTop: 14 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 14 },
  topBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  meta: { flexDirection: "row", alignItems: "center", gap: 10 },
  drow: { paddingVertical: 14, borderBottomWidth: 1 },
  actions: { paddingHorizontal: 20, paddingBottom: 18, paddingTop: 8 },
  row: { flexDirection: "row", gap: 10 },
  stamp: { position: "absolute", top: 22, zIndex: 10, borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  grade: { flex: 1, height: 74, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
