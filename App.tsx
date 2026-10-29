import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, BackHandler, Linking, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PackId, PACKS, Word } from "./src/data/types";
import {
  buildQueue, currentStreak, dayNumber, deckStats, freezeLeft, Grade, markMistake, recordStudy, schedule,
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
import { TrainScreen } from "./src/screens/TrainScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { Tab, TAB_SPACE, TabBar } from "./src/ui/TabBar";
import { wordOfDay } from "./src/logic/games";
import { TOPICS } from "./src/data/types";
import { CardState, StreakState } from "./src/logic/srs";
import { addMistake, Daily, weekMistakes } from "./src/logic/data";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { setLang } from "./src/i18n";
import { ReleaseInfo } from "./src/logic/update";
import { canSelfUpdate, checkForUpdate } from "./src/ui/updater";
import { ArticleRoundResult, ArticleScreen } from "./src/screens/ArticleScreen";
import { SpeedResult, SpeedScreen } from "./src/screens/SpeedScreen";
import { TypingScreen } from "./src/screens/TypingScreen";
import { CustomWordsScreen } from "./src/screens/CustomWordsScreen";
import { AchievementsScreen } from "./src/screens/AchievementsScreen";
import { tr, pl } from "./src/i18n";
import { ListenResult, ListenScreen } from "./src/screens/ListenScreen";
import { PacksScreen } from "./src/screens/PacksScreen";
import { Confetti } from "./src/ui/Confetti";
import { packWords } from "./src/logic/games";

type Screen = "home" | "train" | "profile" | "mistakes" | "session" | "browse" | "settings" | "article" | "speed" | "typing" | "custom" | "achievements" | "listen" | "packs" | "pack";
const TAB_SCREENS: Screen[] = ["home", "train", "browse", "profile"];
const EXTRA_NEW = 10;

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [writable, setWritable] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [tab, setTab] = useState<Tab>("home");
  const undoStack = useRef<{ id: string; card: CardState | undefined; daily: Daily; streak: StreakState; mistakes: Record<string, number> }[]>([]);
  const practiceUndo = useRef<Record<string, number>[]>([]);
  const [practice, setPractice] = useState<{ key: number; items: SessionItem[] }>({ key: 0, items: [] });
  const [newRelease, setNewRelease] = useState<ReleaseInfo | null>(null);
  const checkedUpdate = useRef(false);
  const [today, setToday] = useState(dayNumber());
  const [session, setSession] = useState<{ key: number; items: SessionItem[] }>({ key: 0, items: [] });
  const [toasts, setToasts] = useState<string[]>([]);
  const [confetti, setConfetti] = useState(false);
  const [packSession, setPackSession] = useState<{ key: number; items: SessionItem[]; title: string; practice: boolean }>({ key: 0, items: [], title: "", practice: false });
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
        const isTab = TAB_SCREENS.includes(screen);
        const target: Tab = isTab ? "home" : tab;
        setTab(target);
        setScreen(target);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen, tab]);

  const trLang = data?.settings.trLang ?? "ru";
  const level = data?.settings.level ?? "A2";
  const deck = useMemo(() => makeDeck(data?.customWords ?? [], trLang, level), [data?.customWords, trLang, level]);

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
      queueDue: q.due.length,
      queueNew: q.fresh.length,
      unseen: pool.filter((w) => !data.cards[w.id]).length,
      stats,
      streak: currentStreak(data.streak, today),
      ctx,
      firstId: q.due[0] ?? q.fresh[0],
      mistakesWeek: weekMistakes(data.mistakes, today, (id) => !!deck.byId[id]).length,
      wordOfDay: wordOfDay(deck.words, data.cards, today),
      topicProgress: TOPICS.map((tp) => {
        const ws = deck.words.filter((w) => w.topic === tp.id);
        return { id: tp.id, de: tp.de, total: ws.length, seen: ws.filter((w) => data.cards[w.id]).length, learned: ws.filter((w) => (data.cards[w.id]?.interval ?? 0) >= 1).length };
      })
        .filter((x) => x.total > 0 && (s.topics.length ? s.topics.includes(x.id) : true))
        .sort((a, b) => b.seen - a.seen || b.total - a.total)
        .slice(0, 4),
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

  // ---- daily goal: confetti once per day when new + reviews reach the goal ----
  useEffect(() => {
    if (!data || !derived) return;
    const dl = derived.daily;
    if (dl.goalShown || dl.newCount + dl.reviewCount < data.settings.dailyGoal) return;
    setData((d) => (d ? { ...d, daily: { ...dailyFor(d.daily, dl.day), goalShown: true } } : d));
    setConfetti(true);
    hapticOk();
  }, [data, derived]);

  // ---- reminders + widget ----
  const lastPlan = useRef<string | null>(null);
  const refreshExternal = useCallback((d: AppData) => {
    const now = new Date();
    const t0 = dayNumber(now);
    const s = d.settings;
    const words = makeDeck(d.customWords, s.trLang, s.level).words;
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
  }, [screen, !!data, s?.lang, s?.trLang, s?.level, s?.reminderEnabled, s?.reminderHour, s?.reminderMinute, s?.topics, s?.newPerDay, data?.customWords]);

  // ---- optional update check on launch (Android, once per app start) ----
  useEffect(() => {
    if (!data || checkedUpdate.current || !canSelfUpdate || !data.settings.autoUpdateCheck) return;
    checkedUpdate.current = true;
    checkForUpdate().then(setNewRelease).catch(() => {});
  }, [data]);

  // ---- mutations ----
  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => (d ? fn(d) : d)), []);

  const updateSettings = useCallback((patch: Partial<Settings>) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })), [update]);

  const onAnswer = useCallback((id: string, grade: Grade) => {
    const now = dayNumber();
    update((d) => {
      const prev = d.cards[id];
      const daily = dailyFor(d.daily, now);
      undoStack.current.push({ id, card: prev, daily: d.daily, streak: d.streak, mistakes: d.mistakes });
      if (undoStack.current.length > 50) undoStack.current.shift();
      return {
        ...d,
        cards: { ...d.cards, [id]: schedule(prev, grade, now) },
        daily: { ...daily, newCount: daily.newCount + (prev ? 0 : 1), reviewCount: daily.reviewCount + 1 },
        streak: recordStudy(d.streak, now),
        mistakes: grade === "again" ? addMistake(d.mistakes, id, now) : d.mistakes,
      };
    });
  }, [update]);

  const onUndo = useCallback(() => {
    const u = undoStack.current.pop();
    if (!u) return;
    update((d) => {
      const cards = { ...d.cards };
      if (u.card) cards[u.id] = u.card;
      else delete cards[u.id];
      return { ...d, cards, daily: u.daily, streak: u.streak, mistakes: u.mistakes };
    });
  }, [update]);

  const onMistake = useCallback((id: string) => {
    const now = dayNumber();
    update((d) => ({ ...d, cards: { ...d.cards, [id]: markMistake(d.cards[id], now) }, mistakes: addMistake(d.mistakes, id, now) }));
  }, [update]);

  // "Mistakes of the week": practice only, does not touch the SRS schedule.
  // "Помню" removes the word from the list, other grades keep it.
  const onPracticeAnswer = useCallback((id: string, grade: Grade) => {
    update((d) => {
      practiceUndo.current.push(d.mistakes);
      if (grade !== "good") return d;
      const mistakes = { ...d.mistakes };
      delete mistakes[id];
      return { ...d, mistakes };
    });
  }, [update]);
  const onPracticeUndo = useCallback(() => {
    const m = practiceUndo.current.pop();
    if (m) update((d) => ({ ...d, mistakes: m }));
  }, [update]);

  const startMistakes = () => {
    if (!data) return;
    const ids = weekMistakes(data.mistakes, dayNumber(), (id) => !!deck.byId[id]);
    if (!ids.length) return;
    practiceUndo.current = [];
    setPractice((x) => ({ key: x.key + 1, items: ids.map((id) => ({ id, dir: "de-ru" as const })) }));
    setScreen("mistakes");
  };

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

  const onListenEnd = useCallback((r: ListenResult) => {
    update((d) => ({
      ...d,
      records: { ...d.records, listenBest: Math.max(d.records.listenBest, r.score) },
      counters: { ...d.counters, listenRounds: d.counters.listenRounds + 1 },
      streak: r.correct + r.wrong > 0 ? recordStudy(d.streak, dayNumber()) : d.streak,
    }));
  }, [update]);

  // Situation pack: due + new phrases go through the normal SRS; if none are due, a practice run.
  const startPack = (pack: PackId) => {
    if (!data) return;
    const now = dayNumber();
    const ws = packWords(deck.words, pack);
    const todo = ws.filter((w) => !data.cards[w.id] || data.cards[w.id].due <= now);
    const practice = todo.length === 0;
    const items: SessionItem[] = (practice ? ws : todo).map((w) => ({ id: w.id, dir: "de-ru" as const }));
    if (!items.length) return;
    undoStack.current = [];
    practiceUndo.current = [];
    const pk = PACKS.find((x) => x.id === pack)!;
    setPackSession((x) => ({ key: x.key + 1, items, title: pk.de, practice }));
    setScreen("pack");
  };

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
        tr("Нет разрешения на уведомления"),
        tr("Чтобы получать напоминания, разрешите уведомления для Karten в настройках Android."),
        [
          { text: tr("Не сейчас"), style: "cancel" },
          { text: tr("Открыть настройки"), onPress: () => Linking.openSettings() },
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
    undoStack.current = [];
    setSession((x) => ({ key: x.key + 1, items }));
    setScreen("session");
  };

  const pref = data?.settings.theme ?? "system";
  const isDark = pref === "dark" || (pref === "system" && scheme === "dark");
  const theme = isDark ? dark : light;
  const home = () => setScreen(tab);
  const goTab = (x: Tab) => {
    setTab(x);
    setScreen(x);
  };
  const toast = toasts[0] ? ACHIEVEMENTS_BY_ID[toasts[0]] : undefined;

  if (data) setLang(data.settings.lang);
  const lang = data?.settings.lang ?? "ru";
  const onboarding = !!data && !data.settings.onboarded;

  const body = () => {
    if (!data || !derived) return <View style={{ flex: 1 }} />;
    if (onboarding)
      return (
        <OnboardingScreen
          settings={data.settings}
          onLang={(l) => updateSettings({ lang: l, trLang: l })}
          onDone={(patch) => {
            updateSettings(patch);
            goTab("home");
          }}
        />
      );
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
            onUndo={onUndo}
            onExit={home}
            onLearnMore={() => startSession(true)}
            onComplete={() => update((d) => ({ ...d, counters: { ...d.counters, sessionsDone: d.counters.sessionsDone + 1 } }))}
          />
        );
      case "browse":
        return (
          <BrowseScreen cards={data.cards} onCustom={() => setScreen("custom")} customCount={data.customWords.length} bottomInset={TAB_SPACE + 20} />
        );
      case "train":
        return (
          <TrainScreen articleBest={data.records.articleBest} speedBest={data.records.speedBest} listenBest={data.records.listenBest} mistakes={derived.mistakesWeek}
            onOpen={setScreen} onMistakes={startMistakes} />
        );
      case "mistakes":
        return (
          <SessionScreen
            key={`m${practice.key}`}
            practice
            items={practice.items}
            cards={data.cards}
            today={today}
            autoSpeak={data.settings.autoSpeak}
            streak={derived.streak}
            canLearnMore={false}
            onAnswer={onPracticeAnswer}
            onUndo={onPracticeUndo}
            onExit={home}
            onLearnMore={() => {}}
          />
        );
      case "listen":
        return <ListenScreen best={data.records.listenBest} cards={data.cards} onMistake={onMistake} onRoundEnd={onListenEnd} onBack={home} />;
      case "packs":
        return <PacksScreen cards={data.cards} today={today} onStart={startPack} onBack={home} />;
      case "pack":
        return (
          <SessionScreen
            key={`p${packSession.key}`}
            practice={packSession.practice}
            title={packSession.title}
            items={packSession.items}
            cards={data.cards}
            today={today}
            autoSpeak={data.settings.autoSpeak}
            streak={derived.streak}
            canLearnMore={false}
            onAnswer={packSession.practice ? () => {} : onAnswer}
            onUndo={packSession.practice ? () => {} : onUndo}
            onExit={() => setScreen("packs")}
            onLearnMore={() => {}}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            stats={derived.stats}
            streak={derived.streak}
            bestStreak={Math.max(data.streak.best, derived.streak)}
            sessionsDone={data.counters.sessionsDone}
            achievementsUnlocked={ACHIEVEMENTS.filter((a) => data.achievements[a.id]).length}
            achievementsTotal={ACHIEVEMENTS.length}
            onAchievements={() => setScreen("achievements")}
            onSettings={() => setScreen("settings")}
          />
        );
      case "settings":
        return (
          <SettingsScreen
            settings={data.settings}
            onChange={updateSettings}
            onReset={() => {
              setData({ ...emptyData(), settings: data.settings, customWords: data.customWords });
              goTab("home");
            }}
            onBack={home}
            onToggleReminder={toggleReminder}
            onTestReminder={() =>
              testNotification(tr("К повторению сегодня: {n}. Так будет выглядеть напоминание.", { n: derived.stats.dueToday })).catch(() => {})
            }
            permission={permission}
            update={newRelease}
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
            lastStudyDay={data.streak.lastDay}
            today={today}
            queueDue={derived.queueDue}
            queueNew={derived.queueNew}
            newToday={derived.daily.newCount}
            reviewsToday={derived.daily.reviewCount}
            queueSize={derived.queueSize}
            unseenInFilter={derived.unseen}
            settings={data.settings}
            firstWord={derived.firstId ? deck.byId[derived.firstId] : undefined}
            wordOfDay={derived.wordOfDay}
            topicProgress={derived.topicProgress}
            onStart={startSession}
            onSettings={updateSettings}
            onOpen={setScreen}
            articleBest={data.records.articleBest}
            speedBest={data.records.speedBest}
            doneToday={derived.daily.newCount + derived.daily.reviewCount}
            freezeLeft={freezeLeft(data.streak, today)}
            customCount={data.customWords.length}
            onEnableReminder={() => toggleReminder(true)}
            update={newRelease && newRelease.tag !== data.settings.updateDismissed ? newRelease : null}
            onOpenUpdate={() => {
              setTab("profile");
              setScreen("settings");
            }}
            onDismissUpdate={() => newRelease && updateSettings({ updateDismissed: newRelease.tag })}
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
            <View key={`${screen}-${lang}`} style={{ flex: 1 }}>
              {body()}
            </View>
            {data && !onboarding && TAB_SCREENS.includes(screen) ? <TabBar active={tab} onChange={goTab} /> : null}
            {confetti ? <Confetti goal={data?.settings.dailyGoal ?? 20} onDone={() => setConfetti(false)} /> : null}
            {toast ? (
              <AchievementToast
                key={toast.id}
                emoji={toast.emoji}
                title={tr(toast.title)}
                desc={tr(toast.desc)}
                onDone={() => setToasts((q) => q.slice(1))}
              />
            ) : null}
          </SafeAreaView>
        </DeckContext.Provider>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
