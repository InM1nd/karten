import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEY, migrate, AppData, ThemePref } from "../logic/data";
import { makeDeck } from "../ui/deck";
import { dayNumber, isDue } from "../logic/srs";
import { wordOfDay } from "../logic/games";
import { WidgetWord } from "./WordOfDayWidget";
import { setLang } from "../i18n";

export function widgetProps(data: AppData, today = dayNumber()): { word?: WidgetWord; due: number; theme: ThemePref } {
  setLang(data.settings.lang);
  const words = makeDeck(data.customWords, data.settings.trLang, data.settings.level).words;
  const w = wordOfDay(words, data.cards, today);
  const due = words.filter((x) => isDue(data.cards[x.id], today)).length;
  return { word: w && { article: w.article, de: w.de, ru: w.ru, at: w.at }, due, theme: data.settings.theme };
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
