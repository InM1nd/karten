import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, BackHandler, Linking, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Word } from "./src/data/types";
import {
  buildQueue, currentStreak, dayNumber, deckStats, Grade, markMistake, recordStudy, schedule,
} from "./src/logic/srs";
import { AppData, dailyFor, emptyData, Settings } from "./src/logic/data";
import { loadData, saveData } from "./src/logic/store";
import { AchievementCtx, ACHIEVEMENTS, ACHIEVEMENTS_BY_ID, newlyUnlocked } from "./src/logic/achievements";
import { planReminders, planSignature } from "./src/logic/reminders";
import { dark, light, ThemeContext } from "./src/ui/theme";
import { DeckContext, makeDeck } from "./src/ui/deck";
import { applyPlan, cancelAll, ensureChannel, getPermission, PermState, requestPermission, testNotification } from "./src/ui/notifications";
import { hapticOk } from "./src/ui/haptics";
import { AchievementToast } from "./src/ui/Toast";
import { updateWidgets } from "./src/widget/update";
import { HomeScreen } from "./src/screens/HomeScreen";
import { SessionItem, SessionScreen } from "./src/screens/SessionScreen";
import { BrowseScreen } from "./src/screens/BrowseScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { ArticleRoundResult, ArticleScreen } from "./src/screens/ArticleScreen";
import { SpeedResult, SpeedScreen } from "./src/screens/SpeedScreen";
import { TypingScreen } from "./src/screens/TypingScreen";
import { CustomWordsScreen } from "./src/screens/CustomWordsScreen";
import { AchievementsScreen } from "./src/screens/AchievementsScreen";

type Screen = "home" | "session" | "browse" | "settings" | "article" | "speed" | "typing" | "custom" | "achievements";
const EXTRA_NEW = 10;

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [writable, setWritable] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [today, setToday] = useState(dayNumber());
  const [session, setSession] = useState<{ key: number; items: SessionItem[] }>({ key: 0, items: [] });
  const [toasts, setToasts] = useState<string[]>([]);
  const [permission, setPermission] = useState<PermState | null>(null);
  const scheme = useColorScheme();
  const dataRef = useRef<AppData | null>(null);
  dataRef.current = data;

  useEffect(() => {
    loadData().then((l) => {
      setData(l.data);
      setWritable(l.writable);
    });
    ensureChannel().catch(() => {});
    getPermission().then(setPermission).catch(() => {});
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        setToday(dayNumber());
        getPermission().then(setPermission).catch(() => {});
      } else if (s === "background" && dataRef.current) {
        refreshExternal(dataRef.current);
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist (never overwrite storage we failed to read)
  useEffect(() => {
    if (data && writable) saveData(data);
  }, [data, writable]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen !== "home") {
        setScreen("home");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen]);

  const deck = useMemo(() => makeDeck(data?.customWords ?? []), [data?.customWords]);

  const derived = useMemo(() => {
    if (!data) return null;
    const s = data.settings;
    const daily = dailyFor(data.daily, today);
    const pool = s.topics.length ? deck.words.filter((w) => s.topics.includes(w.topic)) : deck.words;
    const q = buildQueue(deck.words, data.cards, {
      today, maxCards: s.sessionSize, newPerDay: s.newPerDay, newDoneToday: daily.newCount, topics: s.topics,
    });
    const stats = deckStats(deck.words, data.cards, today);
    const ctx: AchievementCtx = {
      bestStreak: Math.max(data.streak.best, data.streak.streak),
      learned: stats.learned,
      mature: stats.mature,
      austrianLearned: deck.words.filter((w) => w.at && (data.cards[w.id]?.interval ?? 0) >= 1).length,
      sessionsDone: data.counters.sessionsDone,
      articleBest: data.records.articleBest,
      articlePerfectRounds: data.counters.articlePerfectRounds,
      speedBest: data.records.speedBest,
      typingCorrect: data.counters.typingCorrect,
      customWords: data.customWords.length,
    };
    return {
      daily,
      pool,
      queueSize: q.due.length + q.fresh.length,
      unseen: pool.filter((w) => !data.cards[w.id]).length,
      stats,
      streak: currentStreak(data.streak, today),
      ctx,
    };
  }, [data, today, deck]);

  // ---- achievements ----
  useEffect(() => {
    if (!data || !derived) return;
    const fresh = newlyUnlocked(data.achievements, derived.ctx);
    if (!fresh.length) return;
    const now = Date.now();
    setData((d) => (d ? { ...d, achievements: { ...d.achievements, ...Object.fromEntries(fresh.map((id) => [id, now])) } } : d));
    setToasts((q) => [...q, ...fresh]);
    hapticOk();
  }, [data, derived]);

  // ---- reminders + widget ----
  const lastPlan = useRef<string | null>(null);
  const refreshExternal = useCallback((d: AppData) => {
    const now = new Date();
    const t0 = dayNumber(now);
    const s = d.settings;
    const words = makeDeck(d.customWords).words;
    const pool = s.topics.length ? words.filter((w) => s.topics.includes(w.topic)) : words;
    const daily = dailyFor(d.daily, t0);
    const q = buildQueue(words, d.cards, { today: t0, maxCards: s.sessionSize, newPerDay: s.newPerDay, newDoneToday: daily.newCount, topics: s.topics });
    const plan = planReminders({
      enabled: s.reminderEnabled, hour: s.reminderHour, minute: s.reminderMinute, now, today: t0,
      todayDone: q.due.length + q.fresh.length === 0, cards: d.cards, wordIds: pool.map((w) => w.id),
      newPerDay: s.newPerDay, streak: currentStreak(d.streak, t0),
    });
    const sig = planSignature(plan);
    if (sig !== lastPlan.current) {
      lastPlan.current = sig;
      (plan.length ? applyPlan(plan) : cancelAll()).catch(() => {
        lastPlan.current = null;
      });
    }
    updateWidgets(d);
  }, []);

  const s = data?.settings;
  useEffect(() => {
    if (data && screen === "home") refreshExternal(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, !!data, s?.reminderEnabled, s?.reminderHour, s?.reminderMinute, s?.topics, s?.newPerDay, data?.customWords]);

  // ---- mutations ----
  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => (d ? fn(d) : d)), []);

  const updateSettings = useCallback((patch: Partial<Settings>) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })), [update]);

  const onAnswer = useCallback((id: string, grade: Grade) => {
    const now = dayNumber();
    update((d) => {
      const prev = d.cards[id];
      const daily = dailyFor(d.daily, now);
      return {
        ...d,
        cards: { ...d.cards, [id]: schedule(prev, grade, now) },
        daily: { ...daily, newCount: daily.newCount + (prev ? 0 : 1), reviewCount: daily.reviewCount + 1 },
        streak: recordStudy(d.streak, now),
      };
    });
  }, [update]);

  const onMistake = useCallback((id: string) => {
    const now = dayNumber();
    update((d) => ({ ...d, cards: { ...d.cards, [id]: markMistake(d.cards[id], now) } }));
  }, [update]);

  const onArticleEnd = useCallback((r: ArticleRoundResult) => {
    update((d) => ({
      ...d,
      records: { ...d.records, articleBest: Math.max(d.records.articleBest, r.score) },
      counters: {
        ...d.counters,
        articleRounds: d.counters.articleRounds + 1,
        articlePerfectRounds: d.counters.articlePerfectRounds + (r.answered >= 10 && r.mistakes.length === 0 ? 1 : 0),
      },
      streak: r.answered > 0 ? recordStudy(d.streak, dayNumber()) : d.streak,
    }));
  }, [update]);

  const onSpeedEnd = useCallback((r: SpeedResult) => {
    update((d) => ({
      ...d,
      records: { ...d.records, speedBest: Math.max(d.records.speedBest, r.score) },
      counters: { ...d.counters, speedRounds: d.counters.speedRounds + 1 },
      streak: r.correct + r.wrong > 0 ? recordStudy(d.streak, dayNumber()) : d.streak,
    }));
  }, [update]);

  const onSaveCustom = useCallback((w: Word) => {
    update((d) => {
      const exists = d.customWords.some((x) => x.id === w.id);
      return { ...d, customWords: exists ? d.customWords.map((x) => (x.id === w.id ? w : x)) : [...d.customWords, w] };
    });
  }, [update]);

  const onDeleteCustom = useCallback((id: string) => {
    update((d) => {
      const cards = { ...d.cards };
      delete cards[id];
      return { ...d, cards, customWords: d.customWords.filter((x) => x.id !== id) };
    });
  }, [update]);

  const toggleReminder = async (on: boolean) => {
    if (!on) return updateSettings({ reminderEnabled: false });
    const perm = await requestPermission().catch(() => "denied" as PermState);
    setPermission(perm);
    if (perm === "granted") {
      updateSettings({ reminderEnabled: true, reminderPromptDismissed: true });
    } else {
      Alert.alert(
        "Нет разрешения на уведомления",
        "Чтобы получать напоминания, разрешите уведомления для Karten в настройках Android.",
        [
          { text: "Не сейчас", style: "cancel" },
          { text: "Открыть настройки", onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  const startSession = (extra: boolean) => {
    if (!data) return;
    const now = dayNumber();
    setToday(now);
    const st = data.settings;
    const daily = dailyFor(data.daily, now);
    const q = buildQueue(deck.words, data.cards, {
      today: now,
      maxCards: extra ? EXTRA_NEW : st.sessionSize,
      newPerDay: extra ? daily.newCount + EXTRA_NEW : st.newPerDay,
      newDoneToday: daily.newCount,
      topics: st.topics,
    });
    const items: SessionItem[] = [...q.due, ...q.fresh].map((id) => ({
      id,
      dir: st.direction === "mixed" ? (Math.random() < 0.5 ? "de-ru" : "ru-de") : st.direction,
    }));
    if (!items.length) return;
    setSession((x) => ({ key: x.key + 1, items }));
    setScreen("session");
  };

  const pref = data?.settings.theme ?? "system";
  const isDark = pref === "dark" || (pref === "system" && scheme === "dark");
  const theme = isDark ? dark : light;
  const home = () => setScreen("home");
  const toast = toasts[0] ? ACHIEVEMENTS_BY_ID[toasts[0]] : undefined;

  const body = () => {
    if (!data || !derived) return <View style={{ flex: 1 }} />;
    switch (screen) {
      case "session":
        return (
          <SessionScreen
            key={session.key}
            items={session.items}
            cards={data.cards}
            today={today}
            autoSpeak={data.settings.autoSpeak}
            streak={derived.streak}
            canLearnMore={derived.unseen > 0}
            onAnswer={onAnswer}
            onExit={home}
            onLearnMore={() => startSession(true)}
            onComplete={() => update((d) => ({ ...d, counters: { ...d.counters, sessionsDone: d.counters.sessionsDone + 1 } }))}
          />
        );
      case "browse":
        return <BrowseScreen cards={data.cards} onBack={home} />;
      case "settings":
        return (
          <SettingsScreen
            settings={data.settings}
            onChange={updateSettings}
            onReset={() => {
              setData({ ...emptyData(), settings: data.settings, customWords: data.customWords });
              home();
            }}
            onBack={home}
            onToggleReminder={toggleReminder}
            onTestReminder={() =>
              testNotification(`К повторению сегодня: ${derived.stats.dueToday}. Так будет выглядеть напоминание.`).catch(() => {})
            }
            permission={permission}
          />
        );
      case "article":
        return <ArticleScreen best={data.records.articleBest} onMistake={onMistake} onRoundEnd={onArticleEnd} onBack={home} />;
      case "speed":
        return (
          <SpeedScreen
            best={data.records.speedBest}
            cards={data.cards}
            direction={data.settings.direction}
            onMistake={onMistake}
            onRoundEnd={onSpeedEnd}
            onBack={home}
          />
        );
      case "typing":
        return (
          <TypingScreen
            cards={data.cards}
            today={today}
            onAnswer={onAnswer}
            onCorrect={() => update((d) => ({ ...d, counters: { ...d.counters, typingCorrect: d.counters.typingCorrect + 1 } }))}
            onBack={home}
          />
        );
      case "custom":
        return <CustomWordsScreen custom={data.customWords} cards={data.cards} onSave={onSaveCustom} onDelete={onDeleteCustom} onBack={home} />;
      case "achievements":
        return <AchievementsScreen unlocked={data.achievements} ctx={derived.ctx} onBack={home} />;
      default:
        return (
          <HomeScreen
            stats={derived.stats}
            streak={derived.streak}
            bestStreak={data.streak.best}
            newToday={derived.daily.newCount}
            reviewsToday={derived.daily.reviewCount}
            queueSize={derived.queueSize}
            unseenInFilter={derived.unseen}
            settings={data.settings}
            onStart={startSession}
            onSettings={updateSettings}
            onOpenBrowse={() => setScreen("browse")}
            onOpenSettings={() => setScreen("settings")}
            onOpen={setScreen}
            articleBest={data.records.articleBest}
            speedBest={data.records.speedBest}
            customCount={data.customWords.length}
            achievementsUnlocked={ACHIEVEMENTS.filter((a) => data.achievements[a.id]).length}
            achievementsTotal={ACHIEVEMENTS.length}
            onEnableReminder={() => toggleReminder(true)}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <DeckContext.Provider value={deck}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
            {body()}
            {toast ? (
              <AchievementToast
                key={toast.id}
                emoji={toast.emoji}
                title={toast.title}
                desc={toast.desc}
                onDone={() => setToasts((q) => q.slice(1))}
              />
            ) : null}
          </SafeAreaView>
        </DeckContext.Provider>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
