import { createContext, useContext } from "react";
import { Article } from "../data/types";

export interface Theme {
  dark: boolean;
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textDim: string;
  border: string;
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
  bg: "#F4F5F9",
  card: "#FFFFFF",
  cardAlt: "#EDEFF5",
  text: "#151824",
  textDim: "#6A7085",
  border: "#DDE1EA",
  accent: "#3D5AFE",
  accentText: "#FFFFFF",
  again: "#E5484D",
  hard: "#E59A1B",
  good: "#2FA36B",
  at: "#C8102E",
  article: { der: "#2F6FDB", die: "#D6336C", das: "#2B9A66" },
};

export const dark: Theme = {
  dark: true,
  bg: "#0F1117",
  card: "#1A1D27",
  cardAlt: "#242836",
  text: "#F1F3F9",
  textDim: "#9BA1B5",
  border: "#2C3142",
  accent: "#7B8CFF",
  accentText: "#0F1117",
  again: "#FF6B6F",
  hard: "#F5B547",
  good: "#4CC38A",
  at: "#FF5A6E",
  article: { der: "#6EA8FF", die: "#FF7EAD", das: "#5FD39B" },
};

export const ThemeContext = createContext<Theme>(light);
export const useTheme = () => useContext(ThemeContext);
