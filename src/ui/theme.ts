import { createContext, useContext } from "react";
import { Platform, TextStyle } from "react-native";
import { Article } from "../data/types";

/**
 * Karten v1.2 "Минимализм": monochrome + one orange accent, Inter Tight.
 * Article colours are only used for a small dot + the article word.
 */
export interface Theme {
  dark: boolean;
  bg: string;
  /** subtle surface (inputs, segmented control, pressed rows) */
  card: string;
  cardAlt: string;
  text: string;
  textDim: string;
  faint: string;
  border: string;
  /** primary button background / foreground */
  ink: string;
  inkText: string;
  accent: string;
  accentText: string;
  again: string;
  hard: string;
  good: string;
  at: string;
  article: Record<Article, string>;
}

export const light: Theme = {
  dark: false,
  bg: "#FFFFFF",
  card: "#F6F6F4",
  cardAlt: "#EFEFEC",
  text: "#111111",
  textDim: "#8E8E93",
  faint: "#B5B5BA",
  border: "#ECECEC",
  ink: "#111111",
  inkText: "#FFFFFF",
  accent: "#FF6B00",
  accentText: "#FFFFFF",
  again: "#E5484D",
  hard: "#C27C0E",
  good: "#2F9E6A",
  at: "#C8102E",
  article: { der: "#3E63DD", die: "#E03E6F", das: "#2F9E6A" },
};

export const dark: Theme = {
  dark: true,
  bg: "#000000",
  card: "#121214",
  cardAlt: "#1C1C1F",
  text: "#F5F5F5",
  textDim: "#8E8E93",
  faint: "#5C5C61",
  border: "#232326",
  ink: "#F5F5F5",
  inkText: "#000000",
  accent: "#FF7A1A",
  accentText: "#000000",
  again: "#FF6369",
  hard: "#F1A10D",
  good: "#3DD68C",
  at: "#FF4D5E",
  article: { der: "#7C9BFF", die: "#FF6B9A", das: "#4CC38A" },
};

export const ThemeContext = createContext<Theme>(light);
export const useTheme = () => useContext(ThemeContext);

/** Inter Tight is embedded at build time (expo-font, Android xml font family "InterTight"). */
export const FONT_FAMILY = "InterTight";
const family = Platform.OS === "ios" ? undefined : FONT_FAMILY;
export const font = {
  regular: { fontFamily: family, fontWeight: "400" } as TextStyle,
  medium: { fontFamily: family, fontWeight: "500" } as TextStyle,
  semibold: { fontFamily: family, fontWeight: "600" } as TextStyle,
  bold: { fontFamily: family, fontWeight: "700" } as TextStyle,
};
