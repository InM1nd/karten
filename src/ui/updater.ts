/**
 * In-app updates (Android): latest GitHub release -> download the APK into the app cache ->
 * hand it to the system package installer through expo-file-system's FileProvider (content:// URI).
 * Android itself asks the user to allow "Install unknown apps" for Karten the first time.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as FS from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { isUpdate, parseRelease, ReleaseInfo, RELEASES_URL } from "../logic/update";

export const APP_VERSION: string = Constants.expoConfig?.version ?? "0.0.0";
const PACKAGE = "com.zabolotny.karten";
const FLAG_GRANT_READ_URI_PERMISSION = 1;
const FLAG_ACTIVITY_NEW_TASK = 0x10000000;

export const canSelfUpdate =
  Platform.OS === "android" ||
  // screenshot harness (scripts/web-screens) renders the Android update UI on web
  (Platform.OS === "web" && typeof window !== "undefined" && !!(window as unknown as { __kartenShots?: boolean }).__kartenShots);

export async function fetchLatest(signal?: AbortSignal): Promise<ReleaseInfo | null> {
  const r = await fetch(RELEASES_URL, { headers: { Accept: "application/vnd.github+json" }, signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return parseRelease(await r.json());
}

/** Latest release if it is newer than the running app, otherwise null. */
export async function checkForUpdate(): Promise<ReleaseInfo | null> {
  const rel = await fetchLatest();
  return isUpdate(rel, APP_VERSION) ? rel : null;
}

/** Downloads the APK into the cache dir; returns the local file:// uri. */
export async function downloadApk(rel: ReleaseInfo, onProgress: (p: number) => void): Promise<string> {
  if (!rel.apkUrl) throw new Error("no apk");
  const dir = FS.cacheDirectory + "updates/";
  await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  // drop older downloads
  for (const f of await FS.readDirectoryAsync(dir).catch(() => [] as string[])) {
    await FS.deleteAsync(dir + f, { idempotent: true }).catch(() => {});
  }
  const target = dir + (rel.apkName ?? `Karten-${rel.tag}.apk`).replace(/[^\w.-]/g, "_");
  const task = FS.createDownloadResumable(rel.apkUrl, target, {}, (e) => {
    const total = e.totalBytesExpectedToWrite > 0 ? e.totalBytesExpectedToWrite : rel.apkSize;
    if (total > 0) onProgress(Math.min(1, e.totalBytesWritten / total));
  });
  const res = await task.downloadAsync();
  if (!res || res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res?.status ?? "?"}`);
  onProgress(1);
  return res.uri;
}

/** Opens the system installer for a downloaded APK. */
export async function installApk(fileUri: string): Promise<void> {
  const contentUri = await FS.getContentUriAsync(fileUri);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    type: "application/vnd.android.package-archive",
    flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK,
  });
}

/** System screen "Install unknown apps" for Karten (Android 8+). */
export async function openUnknownSourcesSettings(): Promise<void> {
  await IntentLauncher.startActivityAsync("android.settings.MANAGE_UNKNOWN_APP_SOURCES", { data: `package:${PACKAGE}` });
}
