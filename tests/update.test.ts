import { test } from "node:test";
import assert from "node:assert/strict";
import { compareVersions, isUpdate, parseRelease, parseVersion } from "../src/logic/update";
import { addMistake, migrate, weekMistakes } from "../src/logic/data";

test("version parsing and comparison", () => {
  assert.deepEqual(parseVersion("v1.4.0"), [1, 4, 0]);
  assert.deepEqual(parseVersion("junk"), []);
  assert.ok(compareVersions("1.4.0", "1.3.0") > 0);
  assert.ok(compareVersions("v1.10.0", "1.9.9") > 0);
  assert.equal(compareVersions("1.4", "1.4.0"), 0);
  assert.ok(compareVersions("1.3.9", "1.4.0") < 0);
});

test("release parsing picks the apk asset; drafts/prereleases ignored", () => {
  const rel = parseRelease({
    tag_name: "v1.5.0", name: "Karten 1.5.0", body: "notes", html_url: "https://x",
    assets: [{ name: "readme.txt", browser_download_url: "a" }, { name: "Karten-v1.5.0.apk", browser_download_url: "https://dl/apk", size: 123 }],
  });
  assert.equal(rel?.version, "1.5.0");
  assert.equal(rel?.apkUrl, "https://dl/apk");
  assert.ok(isUpdate(rel, "1.4.0"));
  assert.ok(!isUpdate(rel, "1.5.0"));
  assert.equal(parseRelease({ tag_name: "v2.0.0", prerelease: true }), null);
  assert.equal(parseRelease(null), null);
  assert.ok(!isUpdate(parseRelease({ tag_name: "v9.0.0", assets: [] }), "1.4.0")); // no apk -> not installable
});

test("1.4 migration: existing users are onboarded, new fields default, mistakes kept", () => {
  const old = migrate({ version: 2, cards: {}, settings: { direction: "ru-de" } });
  assert.equal(old.settings.onboarded, true);
  assert.equal(old.settings.lang, "ru");
  assert.deepEqual(old.mistakes, {});
  const fresh = migrate(null);
  assert.equal(fresh.settings.onboarded, false);
  const kept = migrate({ version: 2, settings: { lang: "uk", onboarded: false }, mistakes: { a: 5, b: "x" } });
  assert.equal(kept.settings.lang, "uk");
  assert.equal(kept.settings.onboarded, false);
  assert.deepEqual(kept.mistakes, { a: 5 });
  assert.equal(migrate({ settings: { lang: "de" } }).settings.lang, "ru");
});

test("mistakes of the week: add, prune, filter last 7 days", () => {
  let m = addMistake({ old: 1 }, "a", 100);
  assert.deepEqual(m, { a: 100 });
  m = addMistake(m, "b", 103);
  m = { ...m, c: 90 };
  assert.deepEqual(weekMistakes(m, 105, () => true), ["b", "a"]);
  assert.deepEqual(weekMistakes(m, 105, (id) => id !== "b"), ["a"]);
});
