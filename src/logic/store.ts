import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData, DATA_VERSION, emptyData, KEY, migrate } from "./data";

export * from "./data";

const BACKUP_PREFIX = "karten:backup:v";

export interface Loaded {
  data: AppData;
  /** false if storage could not be read: then we must NOT overwrite it. */
  writable: boolean;
}

async function readRaw(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return await AsyncStorage.getItem(KEY); // one retry; throws again if storage is broken
  }
}

export async function loadData(): Promise<Loaded> {
  let raw: string | null;
  try {
    raw = await readRaw();
  } catch {
    return { data: emptyData(), writable: false };
  }
  return { data: await parseStored(raw), writable: true };
}

async function parseStored(raw: string | null): Promise<AppData> {
  try {
    if (!raw) return emptyData();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      await AsyncStorage.setItem(BACKUP_PREFIX + "corrupt", raw);
      return emptyData();
    }
    const v = (parsed as { version?: unknown })?.version;
    if (v !== DATA_VERSION) {
      // keep an untouched copy of the old data before the first migrated save
      const bk = BACKUP_PREFIX + String(v ?? "unknown");
      if (!(await AsyncStorage.getItem(bk))) await AsyncStorage.setItem(bk, raw);
    }
    return migrate(parsed);
  } catch {
    return emptyData();
  }
}

let pending: Promise<void> = Promise.resolve();
export function saveData(data: AppData): Promise<void> {
  // serialize writes so an older snapshot never overwrites a newer one
  pending = pending.then(() => AsyncStorage.setItem(KEY, JSON.stringify(data))).catch(() => {});
  return pending;
}
