import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetRepresentation } from "react-native-android-widget";
import { Article } from "../data/types";
import type { ThemePref } from "../logic/data";
import { tr, pl } from "../i18n";

export interface WidgetWord {
  article?: Article;
  de: string;
  ru: string;
  at?: boolean;
}

type Hex = `#${string}`;
interface Pal { bg: Hex; text: Hex; dim: Hex; border: Hex; accent: Hex; article: Record<Article, Hex> }

// Same palette as the app theme (src/ui/theme.ts)
const LIGHT: Pal = {
  bg: "#FFFFFF", text: "#111111", dim: "#8E8E93", border: "#ECECEC", accent: "#FF6B00",
  article: { der: "#3E63DD", die: "#E03E6F", das: "#2F9E6A" },
};
const DARK: Pal = {
  bg: "#000000", text: "#F5F5F5", dim: "#8E8E93", border: "#232326", accent: "#FF7A1A",
  article: { der: "#7C9BFF", die: "#FF6B9A", das: "#4CC38A" },
};

// files copied into android assets/fonts by the widget config plugin
const F = { regular: "InterTight-Regular", medium: "InterTight-Medium", semibold: "InterTight-SemiBold" };

export function WordOfDayWidget({ word, due, dark = false }: { word?: WidgetWord; due: number; dark?: boolean }) {
  const c = dark ? DARK : LIGHT;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={tr("Слово дня — открыть Karten")}
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderRadius: 26,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <FlexWidget style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "match_parent" }}>
        <TextWidget
          text={word?.at ? tr("СЛОВО ДНЯ") + " · AT" : tr("СЛОВО ДНЯ")}
          style={{ fontSize: 11, letterSpacing: 1.5, color: c.dim, fontFamily: F.medium }}
        />
        <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
          {due > 0 ? <FlexWidget style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent, marginRight: 6 }} /> : null}
          <TextWidget
            text={due > 0 ? tr("{n} к повторению", { n: due }) : tr("всё повторено")}
            style={{ fontSize: 12, color: due > 0 ? c.text : c.dim, fontFamily: F.medium }}
          />
        </FlexWidget>
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "column", width: "match_parent" }}>
        {word?.article ? (
          <FlexWidget style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
            <FlexWidget style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.article[word.article], marginRight: 7 }} />
            <TextWidget text={word.article} style={{ fontSize: 15, color: c.article[word.article], fontFamily: F.semibold }} />
          </FlexWidget>
        ) : null}
        <TextWidget
          text={word?.de ?? "Karten"}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 28, letterSpacing: -0.8, color: c.text, fontFamily: F.semibold }}
        />
        <TextWidget
          text={word?.ru ?? tr("Открой приложение, чтобы начать")}
          maxLines={2}
          truncate="END"
          style={{ fontSize: 15, color: c.dim, fontFamily: F.regular, marginTop: 2 }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

/** Light/dark representation following the app's theme setting ("system" → follows the launcher's night mode). */
export function widgetRepresentation(p: { word?: WidgetWord; due: number; theme?: ThemePref }): WidgetRepresentation {
  const L = <WordOfDayWidget word={p.word} due={p.due} />;
  const D = <WordOfDayWidget word={p.word} due={p.due} dark />;
  if (p.theme === "light") return { light: L, dark: null };
  if (p.theme === "dark") return { light: D, dark: null };
  return { light: L, dark: D };
}
