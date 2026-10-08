import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { applyPlan, requestPermission, CHANNEL_ID } from "../src/ui/notifications";

const N = Notifications as jest.Mocked<typeof Notifications>;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, "OS", { get: () => "android", configurable: true });
});

test("Android: channel is created before the POST_NOTIFICATIONS prompt", async () => {
  const order: string[] = [];
  N.setNotificationChannelAsync.mockImplementation(async () => (order.push("channel"), null));
  N.requestPermissionsAsync.mockImplementation(async () => (order.push("request"), { granted: true, canAskAgain: true } as never));
  expect(await requestPermission()).toBe("granted");
  expect(order).toEqual(["channel", "request"]);
  expect(N.setNotificationChannelAsync).toHaveBeenCalledWith(CHANNEL_ID, expect.objectContaining({ name: "Ежедневное напоминание" }));
});

test("permanently denied permission is reported as blocked (no prompt loop)", async () => {
  N.getPermissionsAsync.mockResolvedValueOnce({ granted: false, canAskAgain: false } as never);
  expect(await requestPermission()).toBe("blocked");
  expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
});

test("applyPlan replaces all reminders with date triggers on the channel", async () => {
  const d1 = new Date(2026, 9, 8, 19, 0), d2 = new Date(2026, 9, 9, 19, 0);
  await applyPlan([
    { date: d1, title: "a", body: "b" },
    { date: d2, title: "c", body: "d" },
  ] as never);
  expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  expect(N.scheduleNotificationAsync.mock.calls[1][0]).toEqual({
    content: { title: "c", body: "d" },
    trigger: { type: "date", date: d2, channelId: CHANNEL_ID },
  });
});
