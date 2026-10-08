import React from "react";
import { Platform } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";
import { AppData } from "../logic/data";
import { WordOfDayWidget } from "./WordOfDayWidget";
import { widgetProps } from "./widgetData";
import { WIDGET_NAME } from "./handler";

/** Redraws home-screen widgets (if any are placed) with fresh data. */
export function updateWidgets(data: AppData) {
  if (Platform.OS !== "android") return;
  const p = widgetProps(data);
  requestWidgetUpdate({ widgetName: WIDGET_NAME, renderWidget: () => <WordOfDayWidget {...p} /> }).catch(() => {});
}
