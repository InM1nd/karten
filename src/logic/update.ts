/** In-app update helpers (pure): GitHub release parsing + version comparison. */
export const RELEASES_URL = "https://api.github.com/repos/InM1nd/karten/releases/latest";

export interface ReleaseInfo {
  version: string;
  tag: string;
  name: string;
  notes: string;
  apkUrl: string | null;
  apkName: string | null;
  apkSize: number;
  htmlUrl: string;
}

/** "v1.4.0" -> [1, 4, 0]; garbage -> [] */
export function parseVersion(v: string): number[] {
  const m = String(v ?? "").trim().replace(/^v/i, "").match(/^\d+(\.\d+)*/);
  return m ? m[0].split(".").map((x) => parseInt(x, 10)) : [];
}

/** >0 if a is newer than b, 0 if equal, <0 if older. */
export function compareVersions(a: string, b: string): number {
  const x = parseVersion(a), y = parseVersion(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

export function parseRelease(json: unknown): ReleaseInfo | null {
  if (!json || typeof json !== "object") return null;
  const r = json as Record<string, unknown>;
  const tag = typeof r.tag_name === "string" ? r.tag_name : "";
  if (!parseVersion(tag).length || r.draft === true || r.prerelease === true) return null;
  const assets = Array.isArray(r.assets) ? (r.assets as Record<string, unknown>[]) : [];
  const apk = assets.find((a) => typeof a?.name === "string" && (a.name as string).toLowerCase().endsWith(".apk") && typeof a.browser_download_url === "string");
  return {
    version: tag.replace(/^v/i, ""),
    tag,
    name: typeof r.name === "string" && r.name ? r.name : tag,
    notes: typeof r.body === "string" ? r.body.trim() : "",
    apkUrl: apk ? (apk.browser_download_url as string) : null,
    apkName: apk ? (apk.name as string) : null,
    apkSize: apk && typeof apk.size === "number" ? apk.size : 0,
    htmlUrl: typeof r.html_url === "string" ? r.html_url : "",
  };
}

/** Is `rel` an installable update for the running `current` version? */
export function isUpdate(rel: ReleaseInfo | null, current: string): rel is ReleaseInfo {
  return !!rel && !!rel.apkUrl && compareVersions(rel.version, current) > 0;
}
