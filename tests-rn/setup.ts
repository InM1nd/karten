/* eslint-disable */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("expo-speech", () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: "success", Error: "error" },
  ImpactFeedbackStyle: { Light: "light" },
}));
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, canAskAgain: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("id")),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: "date", TIME_INTERVAL: "timeInterval" },
}));
jest.mock("react-native-android-widget", () => ({
  requestWidgetUpdate: jest.fn(() => Promise.resolve()),
  registerWidgetTaskHandler: jest.fn(),
  FlexWidget: () => null,
  TextWidget: () => null,
}));
jest.mock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { version: "1.4.0" } } }));
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  deleteAsync: jest.fn(() => Promise.resolve()),
  createDownloadResumable: jest.fn((url: string, uri: string, _o: unknown, cb: (e: unknown) => void) => ({
    downloadAsync: jest.fn(async () => {
      cb({ totalBytesWritten: 50, totalBytesExpectedToWrite: 100 });
      return { uri, status: 200 };
    }),
  })),
  getContentUriAsync: jest.fn((u: string) => Promise.resolve(u.replace("file://", "content://"))),
}));
jest.mock("expo-intent-launcher", () => ({ startActivityAsync: jest.fn(() => Promise.resolve({ resultCode: 0 })) }));
(global as any).fetch = jest.fn(() => Promise.reject(new Error("offline")));
