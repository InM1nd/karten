import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { Article } from "../data/types";

export interface WidgetWord {
  article?: Article;
  de: string;
  ru: string;
  at?: boolean;
}

const ARTICLE_COLOR: Record<Article, `#${string}`> = { der: "#9CC3FF", die: "#FFA3C4", das: "#8EE6B8" };

export function WordOfDayWidget({ word, due }: { word?: WidgetWord; due: number }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Слово дня — открыть Karten"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 16,
        borderRadius: 24,
        backgroundGradient: { from: "#3D5AFE", to: "#7C4DFF", orientation: "TL_BR" },
      }}
    >
      <FlexWidget style={{ flexDirection: "row", justifyContent: "space-between", width: "match_parent" }}>
        <TextWidget text={word?.at ? "Слово дня · 🇦🇹" : "Слово дня"} style={{ fontSize: 13, color: "#DDE3FF" }} />
        <TextWidget text={due > 0 ? `⏳ ${due} к повторению` : "✓ всё повторено"} style={{ fontSize: 13, color: "#DDE3FF" }} />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "column" }}>
        <FlexWidget style={{ flexDirection: "row" }}>
          {word?.article ? (
            <TextWidget text={word.article + " "} style={{ fontSize: 24, fontWeight: "700", color: ARTICLE_COLOR[word.article] }} />
          ) : null}
          <TextWidget text={word?.de ?? "Karten"} maxLines={1} truncate="END" style={{ fontSize: 24, fontWeight: "700", color: "#FFFFFF" }} />
        </FlexWidget>
        <TextWidget text={word?.ru ?? "Открой приложение, чтобы начать"} maxLines={2} truncate="END" style={{ fontSize: 16, color: "#FFFFFF" }} />
      </FlexWidget>
    </FlexWidget>
  );
}
