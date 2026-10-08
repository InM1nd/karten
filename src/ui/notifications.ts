import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { ReminderItem } from "../logic/reminders";

export const CHANNEL_ID = "daily-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Android 13+ only shows the permission dialog once a channel exists, so create it first. */
export async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Ежедневное напоминание",
    description: "Напоминание о занятии в выбранное время",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export type PermState = "granted" | "denied" | "blocked";

export async function getPermission(): Promise<PermState> {
  const s = await Notifications.getPermissionsAsync();
  if (s.granted) return "granted";
  return s.canAskAgain ? "denied" : "blocked";
}

/** Asks for POST_NOTIFICATIONS (Android 13+); on older Android it is granted automatically. */
export async function requestPermission(): Promise<PermState> {
  await ensureChannel();
  const cur = await getPermission();
  if (cur !== "denied") return cur;
  const r = await Notifications.requestPermissionsAsync();
  if (r.granted) return "granted";
  return r.canAskAgain ? "denied" : "blocked";
}

/**
 * Replaces all scheduled reminders with `plan`. Date triggers use exact alarms only when the
 * system allows it; otherwise expo-notifications falls back to inexact (setAndAllowWhileIdle),
 * so no SCHEDULE_EXACT_ALARM permission is needed.
 */
export async function applyPlan(plan: ReminderItem[]) {
  if (plan.length) await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      content: { title: p.title, body: p.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.date, channelId: CHANNEL_ID },
    });
  }
}

/** Test notification a few seconds from now (Settings → «Проверить»). */
export async function testNotification(body: string) {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title: "Karten 🔔", body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL_ID },
  });
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
