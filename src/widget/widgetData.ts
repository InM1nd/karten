import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEY, migrate, AppData } from "../logic/data";
import { WORDS } from "../data/words";
import { dayNumber, isDue } from "../logic/srs";
import { wordOfDay } from "../logic/games";
import { WidgetWord } from "./WordOfDayWidget";

export function widgetProps(data: AppData, today = dayNumber()): { word?: WidgetWord; due: number } {
  const words = [...WORDS, ...data.customWords];
  const w = wordOfDay(words, data.cards, today);
  const due = words.filter((x) => isDue(data.cards[x.id], today)).length;
  return { word: w && { article: w.article, de: w.de, ru: w.ru, at: w.at }, due };
}

export async function loadWidgetProps() {
  let data: AppData;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    data = migrate(raw ? JSON.parse(raw) : null);
  } catch {
    data = migrate(null);
  }
  return widgetProps(data);
}
