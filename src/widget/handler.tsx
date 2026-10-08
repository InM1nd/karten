import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { WordOfDayWidget } from "./WordOfDayWidget";
import { loadWidgetProps } from "./widgetData";

export const WIDGET_NAME = "WordOfDay";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
    case "WIDGET_CLICK": {
      const p = await loadWidgetProps();
      props.renderWidget(<WordOfDayWidget {...p} />);
      break;
    }
    default:
      break;
  }
}
