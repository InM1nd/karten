import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import App from "../App";
import { WORDS } from "../src/data/words";

const KEY = "karten:data:v1";

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

async function stored() {
  return JSON.parse((await AsyncStorage.getItem(KEY))!);
}

async function runSession(grade: "Помню" | "Не помню" | "Трудно" = "Помню") {
  let answered = 0;
  for (let i = 0; i < 60; i++) {
    if (screen.queryByText("Готово!")) break;
    await fireEvent.press(screen.getByText("Показать ответ"));
    await fireEvent.press(await screen.findByText(grade));
    answered++;
  }
  return answered;
}

async function boot() {
  await render(<App />);
  expect(await screen.findByLabelText("Настройки")).toBeTruthy();
}

test("home -> daily session -> done; card back shows RU example; progress + achievement persisted", async () => {
  await boot();
  expect(screen.getByLabelText("10 карточек на сегодня")).toBeTruthy();
  await fireEvent.press(screen.getByText("Начать"));
  await fireEvent.press(screen.getByText("Показать ответ"));
  // first new card is "der Alltag" (round-robin starts with Alltag topic)
  expect(await screen.findByText("Мои будни сейчас довольно напряжённые.")).toBeTruthy();
  await fireEvent.press(screen.getByText("Помню"));
  const n = await runSession("Помню");
  expect(n).toBe(9);
  expect(screen.getByText("Готово!")).toBeTruthy();
  expect(await screen.findByText("Первый шаг")).toBeTruthy(); // achievement toast
  await fireEvent.press(screen.getByText("На главную"));
  expect(screen.getByText("На сегодня всё.")).toBeTruthy();
  await waitFor(async () => {
    const d = await stored();
    expect(d.version).toBe(2);
    expect(Object.keys(d.cards)).toHaveLength(10);
    expect(d.counters.sessionsDone).toBe(1);
    expect(d.achievements.first_session).toBeGreaterThan(0);
  });
});

test("'Не помню' re-queues the card within the session", async () => {
  await boot();
  await fireEvent.press(screen.getByText("Начать"));
  await fireEvent.press(screen.getByText("Показать ответ"));
  await fireEvent.press(await screen.findByText("Не помню"));
  expect(await runSession("Помню")).toBe(10);
});

test("v1 data from Karten 1.0.x is migrated without loss and backed up", async () => {
  const v1 = {
    version: 1,
    cards: { "der Paradeiser": { ease: 2.5, interval: 3, reps: 2, lapses: 0, due: 99999, last: 1 } },
    streak: { lastDay: 1, streak: 4, best: 4 },
    daily: { day: 1, newCount: 3, reviewCount: 5 },
    settings: { direction: "ru-de", newPerDay: 15, sessionSize: 20, topics: [], theme: "system", autoSpeak: false },
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(v1));
  await boot();
  expect(screen.getByLabelText("15 карточек на сегодня")).toBeTruthy(); // 15 new/day kept, nothing learned today yet
  await waitFor(async () => {
    const d = await stored();
    expect(d.version).toBe(2);
    expect(d.cards["der Paradeiser"]).toEqual(v1.cards["der Paradeiser"]);
    expect(d.streak.best).toBe(4);
    expect(d.settings.direction).toBe("ru-de");
    expect(d.achievements.streak_3).toBeGreaterThan(0); // best streak 4 → badge on first launch
  });
  expect(JSON.parse((await AsyncStorage.getItem("karten:backup:v1"))!)).toEqual(v1);
});

test("article trainer: answer, stop, result + record saved", async () => {
  await boot();
  await fireEvent.press(screen.getByText("Артикли"));
  expect(screen.getByText(/Рекорд: 0/)).toBeTruthy();
  await fireEvent.press(screen.getByText("Старт"));
  await fireEvent.press(screen.getByText("← der"));
  expect(await screen.findByText(/✓ Верно|✗ Не der/)).toBeTruthy();
  await fireEvent.press(screen.getByText("Стоп"));
  expect(await screen.findByText(/ответов: 1/)).toBeTruthy();
  await waitFor(async () => expect((await stored()).counters.articleRounds).toBe(1));
});

test("speed mode: pick an option, stop, result", async () => {
  await boot();
  await fireEvent.press(screen.getByText("Скорость"));
  await fireEvent.press(screen.getByText("Старт"));
  expect(screen.getByText("Стоп")).toBeTruthy();
  const shown = WORDS.find((w) => (screen.queryByText(w.de) || screen.queryByText(`${w.article} ${w.de}`)) && screen.queryByText(w.ru))!;
  expect(shown).toBeTruthy();
  await fireEvent.press(screen.getByText(shown.ru));
  expect(await screen.findByText(/комбо 1/)).toBeTruthy();
  await fireEvent.press(screen.getByText("Стоп"));
  expect(await screen.findByText(/верно 1 · ошибок 0/)).toBeTruthy();
  await waitFor(async () => {
    const d = await stored();
    expect(d.counters.speedRounds).toBe(1);
    expect(d.records.speedBest).toBe(10);
  });
});

test("typing mode: tolerant check, article hint, give up; answers feed SRS", async () => {
  await boot();
  await fireEvent.press(screen.getByText("Письмо"));
  expect(screen.getByText("повседневность, будни")).toBeTruthy(); // der Alltag
  const input = screen.getByPlaceholderText("der / die / das …");
  await fireEvent.changeText(input, "DER alltag");
  await fireEvent.press(screen.getByText("Проверить"));
  expect(screen.getByText("Верно!")).toBeTruthy();
  await fireEvent.press(screen.getByText("Дальше"));
  await fireEvent.changeText(screen.getByPlaceholderText(/der \/ die \/ das|по-немецки/), "Gewohnheit");
  await fireEvent.press(screen.getByText("Проверить"));
  expect(screen.getByText("Почти: проверь артикль")).toBeTruthy();
  await fireEvent.press(screen.getByText("Дальше"));
  await fireEvent.press(screen.getByText("ü"));
  await fireEvent.press(screen.getByText("Не знаю"));
  expect(screen.getByText("Неверно")).toBeTruthy();
  await waitFor(async () => {
    const d = await stored();
    expect(d.cards["der Alltag"].interval).toBe(1);
    expect(d.cards["die Gewohnheit"]).toBeTruthy();
    expect(d.counters.typingCorrect).toBe(1);
  });
});

test("custom words: add, appears in list, dictionary and unlocks badge; delete-safe editor", async () => {
  await boot();
  await fireEvent.press(screen.getByText("Мои слова"));
  await fireEvent.press(screen.getByText("Добавить слово"));
  await fireEvent.press(screen.getByText("Сохранить"));
  expect(screen.getByText("Введите немецкое слово")).toBeTruthy();
  await fireEvent.press(screen.getByText("das"));
  await fireEvent.changeText(screen.getByLabelText("По-немецки *"), "Kaffeehaus");
  await fireEvent.changeText(screen.getByLabelText("Множественное число"), "Kaffeehäuser");
  await fireEvent.changeText(screen.getByLabelText("Перевод *"), "венское кафе");
  await fireEvent.press(screen.getByText("Сохранить"));
  expect(screen.getByText("венское кафе")).toBeTruthy();
  expect(await screen.findByText("Свой словарь")).toBeTruthy();
  await waitFor(async () => {
    const d = await stored();
    expect(d.customWords).toHaveLength(1);
    expect(d.customWords[0]).toMatchObject({ article: "das", de: "Kaffeehaus", plural: "Kaffeehäuser", topic: "custom" });
  });
  await fireEvent.press(screen.getByLabelText("Назад"));
  await fireEvent.press(screen.getByText("Словарь"));
  await fireEvent.changeText(screen.getByPlaceholderText("Поиск по-немецки или по-русски"), "kaffee");
  expect(screen.getByText("венское кафе")).toBeTruthy();
});

test("reminder: enable from home banner -> permission asked -> notifications scheduled with due info", async () => {
  await boot();
  await fireEvent.press(screen.getByText("Включить"));
  await waitFor(() => expect(Notifications.requestPermissionsAsync).toHaveBeenCalled());
  await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled());
  const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
  const first = calls[0][0];
  expect(first.trigger.type).toBe("date");
  expect(first.trigger.channelId).toBe("daily-reminder");
  expect(first.trigger.date.getHours()).toBe(19);
  expect(first.content.body).toMatch(/новых слов/);
  await waitFor(async () => expect((await stored()).settings.reminderEnabled).toBe(true));
  expect(screen.queryByText("Включить")).toBeNull();
});

test("settings: reminder time adjust; achievements screen lists badges; RU→DE + dark theme", async () => {
  await boot();
  await fireEvent.press(screen.getByText("RU → DE"));
  await fireEvent.press(screen.getByLabelText("Настройки"));
  expect(screen.getByText("19:00")).toBeTruthy();
  await fireEvent.press(screen.getByText("+15"));
  await fireEvent.press(screen.getByText("−1 ч"));
  expect(screen.getByText("18:15")).toBeTruthy();
  await fireEvent.press(screen.getByText("Тёмная"));
  await fireEvent.press(screen.getByLabelText("Назад"));
  await fireEvent.press(screen.getByText("Достижения"));
  expect(screen.getByText("Месяц силы")).toBeTruthy();
  expect(screen.getByText("Echt Wienerisch")).toBeTruthy();
  expect(screen.getByText("0/15")).toBeTruthy();
  await act(async () => {});
});
