import * as Speech from "expo-speech";
import { Word } from "../data/types";

export function germanText(w: Word): string {
  return w.kind === "noun" ? `${w.article} ${w.de}` : w.de.replace("…", "").replace(/[()]/g, "");
}

export function speakGerman(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "de-DE", rate: 0.9 });
}
