import React, { useState } from "react";
import { View } from "react-native";
import { ReleaseInfo, isUpdate } from "../logic/update";
import { Btn, ProgressLine, T } from "../ui/components";
import { APP_VERSION, canSelfUpdate, downloadApk, fetchLatest, installApk, openUnknownSourcesSettings } from "../ui/updater";
import { useTheme } from "../ui/theme";
import { tr } from "../i18n";

type St =
  | { k: "idle" }
  | { k: "checking" }
  | { k: "latest" }
  | { k: "available"; rel: ReleaseInfo }
  | { k: "downloading"; rel: ReleaseInfo; p: number }
  | { k: "ready"; rel: ReleaseInfo; uri: string }
  | { k: "error"; msg: string; rel?: ReleaseInfo };

/** Settings block: check GitHub for a newer release, show its changelog, download + install the APK. */
export function UpdateSection({ initial }: { initial?: ReleaseInfo | null }) {
  const t = useTheme();
  const [st, setSt] = useState<St>(initial ? { k: "available", rel: initial } : { k: "idle" });

  const check = async () => {
    setSt({ k: "checking" });
    try {
      const rel = await fetchLatest();
      setSt(isUpdate(rel, APP_VERSION) ? { k: "available", rel } : { k: "latest" });
    } catch {
      setSt({ k: "error", msg: tr("Не удалось проверить обновления. Проверь интернет.") });
    }
  };
  const download = async (rel: ReleaseInfo) => {
    setSt({ k: "downloading", rel, p: 0 });
    try {
      const uri = await downloadApk(rel, (p) => setSt({ k: "downloading", rel, p }));
      setSt({ k: "ready", rel, uri });
      await install(rel, uri);
    } catch {
      setSt({ k: "error", rel, msg: tr("Не удалось скачать обновление.") });
    }
  };
  const install = async (rel: ReleaseInfo, uri: string) => {
    try {
      await installApk(uri);
    } catch {
      setSt({ k: "error", rel, msg: tr("Не удалось открыть установщик Android.") });
    }
  };

  const rel = "rel" in st ? st.rel : undefined;
  return (
    <View>
      <T v="bodyM" dim>{tr("Установлена версия {v}", { v: APP_VERSION })}</T>
      {rel ? (
        <View style={{ marginTop: 12, borderWidth: 1, borderColor: t.border, borderRadius: 18, padding: 16 }}>
          <T v="h3">{tr("Доступна версия {v}", { v: rel.version })}</T>
          {rel.apkSize ? <T v="small" dim style={{ marginTop: 2 }}>{`APK · ${(rel.apkSize / 1024 / 1024).toFixed(1)} MB`}</T> : null}
          {rel.notes ? (
            <>
              <T v="caps" dim style={{ marginTop: 14 }}>{tr("Что нового")}</T>
              <T v="bodyM" style={{ marginTop: 6, lineHeight: 21 }}>{rel.notes.replace(/\r/g, "").slice(0, 1200)}</T>
            </>
          ) : null}
        </View>
      ) : null}

      {st.k === "idle" || st.k === "latest" || (st.k === "error" && !st.rel) ? (
        <Btn title={tr("Проверить обновления")} icon="rotate" variant="outline" onPress={check} style={{ marginTop: 12 }} />
      ) : null}
      {st.k === "checking" ? <Btn title={tr("Проверяю…")} variant="outline" disabled onPress={() => {}} style={{ marginTop: 12 }} /> : null}
      {st.k === "latest" ? <T v="bodyM" color={t.good} style={{ marginTop: 10 }}>{tr("У тебя последняя версия.")}</T> : null}
      {st.k === "available" || (st.k === "error" && st.rel) ? (
        canSelfUpdate ? (
          <Btn title={tr("Скачать и установить")} icon="arrowUp" onPress={() => download(st.rel!)} style={{ marginTop: 12 }} />
        ) : (
          <T v="small" dim style={{ marginTop: 10 }}>{tr("Установка обновлений работает только на Android.")}</T>
        )
      ) : null}
      {st.k === "downloading" ? (
        <View style={{ marginTop: 14 }}>
          <T v="bodyM">{tr("Скачиваю… {p}%", { p: Math.round(st.p * 100) })}</T>
          <ProgressLine progress={st.p} color={t.accent} style={{ marginTop: 8, height: 4 }} />
        </View>
      ) : null}
      {st.k === "ready" ? (
        <>
          <Btn title={tr("Установить")} onPress={() => install(st.rel, st.uri)} style={{ marginTop: 12 }} />
          <T v="small" dim style={{ marginTop: 10 }}>
            {tr("Если Android пишет, что установка из этого источника запрещена, разреши её для Karten и вернись — прогресс сохранится.")}
          </T>
          <Btn title={tr("Разрешить установку из Karten")} variant="ghost" onPress={() => openUnknownSourcesSettings().catch(() => {})} style={{ marginTop: 4 }} />
        </>
      ) : null}
      {st.k === "error" ? <T v="bodyM" color={t.again} style={{ marginTop: 10 }}>{st.msg}</T> : null}
    </View>
  );
}
