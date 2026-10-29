import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Settings, ThemePref } from "../logic/data";
import { dirLabel, useDeck } from "../ui/deck";
import { DAILY_GOALS } from "../logic/data";
import { TrLang } from "../data/types";
import { PermState } from "../ui/notifications";
import { Btn, FadeIn, Pressy, ScreenHeader, SectionTitle, Segmented, T } from "../ui/components";
import { speakGerman } from "../ui/speech";
import { font, useTheme } from "../ui/theme";
import { DIRECTION_OPTIONS } from "./HomeScreen";
import { tr, LANGS, Lang } from "../i18n";
import { ReleaseInfo } from "../logic/update";
import { APP_VERSION } from "../ui/updater";
import { UpdateSection } from "./UpdateSection";

function ToggleRow(p: { label: string; value: boolean; onChange: (v: boolean) => void; a11y?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.switchRow, { borderColor: t.border }]}>
      <T v="body" style={{ flex: 1, paddingRight: 12 }}>{p.label}</T>
      <Switch
        value={p.value}
        onValueChange={p.onChange}
        accessibilityLabel={p.a11y}
        trackColor={{ false: t.cardAlt, true: t.ink }}
        thumbColor={p.value ? t.inkText : "#FFFFFF"}
        ios_backgroundColor={t.cardAlt}
      />
    </View>
  );
}

export function SettingsScreen(p: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onBack: () => void;
  onToggleReminder: (on: boolean) => void;
  onTestReminder: () => void;
  permission: PermState | null;
  update?: ReleaseInfo | null;
}) {
  const t = useTheme();
  const { words: WORDS, trLang } = useDeck();
  const s = p.settings;
  const shiftTime = (deltaMin: number) => {
    const total = (s.reminderHour * 60 + s.reminderMinute + deltaMin + 24 * 60) % (24 * 60);
    p.onChange({ reminderHour: Math.floor(total / 60), reminderMinute: total % 60 });
  };
  const hh = String(s.reminderHour).padStart(2, "0"), mm = String(s.reminderMinute).padStart(2, "0");
  const confirmReset = () =>
    Alert.alert(tr("Сбросить прогресс?"), tr("Вся статистика и расписание повторений будут удалены."), [
      { text: tr("Отмена"), style: "cancel" },
      { text: tr("Сбросить"), style: "destructive", onPress: p.onReset },
    ]);
  const TimeBtn = ({ label, d }: { label: string; d: number }) => (
    <Pressy onPress={() => shiftTime(d)} hitSlop={6} accessibilityRole="button" style={[styles.tbtn, { borderColor: t.border }]}>
      <Text style={[font.medium, { fontSize: 14, color: t.text }]}>{label}</Text>
    </Pressy>
  );

  return (
    <FadeIn>
      <ScreenHeader title={tr("Настройки")} onBack={p.onBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <SectionTitle>{tr("Язык интерфейса")}</SectionTitle>
        <Segmented<Lang> value={s.lang} options={LANGS} onChange={(v) => p.onChange({ lang: v })} />

        <SectionTitle>{tr("Язык перевода карточек")}</SectionTitle>
        <Segmented<TrLang>
          value={s.trLang}
          options={[{ value: "ru", label: "Русский" }, { value: "uk", label: "Українська" }, { value: "en", label: "English" }]}
          onChange={(v) => p.onChange({ trLang: v })}
        />
        <T v="small" dim style={{ marginTop: 8 }}>{tr("Переводы слов, примеров и заметок. Свои слова остаются как вы их ввели.")}</T>

        <SectionTitle>{tr("Направление карточек")}</SectionTitle>
        <Segmented value={s.direction} options={DIRECTION_OPTIONS.map((o) => ({ ...o, label: dirLabel(tr(o.label), trLang) }))} onChange={(v) => p.onChange({ direction: v })} />

        <SectionTitle>{tr("Цель дня (карточек)")}</SectionTitle>
        <Segmented
          value={s.dailyGoal}
          options={DAILY_GOALS.map((n) => ({ value: n, label: String(n) }))}
          onChange={(v) => p.onChange({ dailyGoal: v })}
        />
        <T v="small" dim style={{ marginTop: 8 }}>{tr("Раз в неделю пропущенный день не сбрасывает серию — сработает заморозка.")}</T>

        <SectionTitle>{tr("Уровень")}</SectionTitle>
        <Segmented
          value={s.level}
          options={(["A1", "A2", "B1"] as const).map((n) => ({ value: n, label: n }))}
          onChange={(v) => p.onChange({ level: v })}
        />
        <T v="small" dim style={{ marginTop: 8 }}>{tr("Новые слова выше вашего уровня придут позже.")}</T>

        <SectionTitle>{tr("Новых слов в день")}</SectionTitle>
        <Segmented
          value={s.newPerDay}
          options={[5, 10, 15, 20].map((n) => ({ value: n, label: String(n) }))}
          onChange={(v) => p.onChange({ newPerDay: v })}
        />

        <SectionTitle>{tr("Карточек за занятие (макс.)")}</SectionTitle>
        <Segmented
          value={s.sessionSize}
          options={[10, 20, 30].map((n) => ({ value: n, label: String(n) }))}
          onChange={(v) => p.onChange({ sessionSize: v })}
        />

        <SectionTitle>{tr("Тема оформления")}</SectionTitle>
        <Segmented<ThemePref>
          value={s.theme}
          options={[
            { value: "system", label: tr("Системная") },
            { value: "light", label: tr("Светлая") },
            { value: "dark", label: tr("Тёмная") },
          ]}
          onChange={(v) => p.onChange({ theme: v })}
        />

        <SectionTitle>{tr("Напоминание")}</SectionTitle>
        <ToggleRow label={tr("Ежедневное напоминание")} value={s.reminderEnabled} onChange={p.onToggleReminder} a11y={tr("Ежедневное напоминание")} />
        <View style={[styles.timeRow, { borderColor: t.border }]}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TimeBtn label={tr("−1 ч")} d={-60} />
            <TimeBtn label="−15" d={-15} />
          </View>
          <Text style={[font.semibold, { fontSize: 30, letterSpacing: -1, color: s.reminderEnabled ? t.text : t.faint, textAlign: "center" }]}>
            {`${hh}:${mm}`}
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TimeBtn label="+15" d={15} />
            <TimeBtn label={tr("+1 ч")} d={60} />
          </View>
        </View>
        <T v="small" dim style={{ marginTop: 10 }}>
          {tr("В уведомлении — сколько карточек ждёт сегодня. Если занятие уже сделано, сегодня напоминания не будет.")}
        </T>
        {p.permission === "blocked" || (p.permission === "denied" && s.reminderEnabled) ? (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[styles.dot, { backgroundColor: t.again }]} />
              <T v="bodyM" color={t.again} style={{ flex: 1 }}>{tr("Уведомления для Karten запрещены в настройках Android.")}</T>
            </View>
            <Btn title={tr("Открыть настройки Android")} variant="outline" onPress={() => Linking.openSettings()} style={{ marginTop: 10 }} />
          </View>
        ) : null}
        {s.reminderEnabled && p.permission === "granted" ? (
          <Btn title={tr("Проверить (через 5 секунд)")} icon="bell" variant="outline" onPress={p.onTestReminder} style={{ marginTop: 12 }} />
        ) : null}

        <SectionTitle>{tr("Озвучка")}</SectionTitle>
        <ToggleRow label={tr("Автоматически произносить немецкое слово")} value={s.autoSpeak} onChange={(v) => p.onChange({ autoSpeak: v })} />
        <Btn title={tr("Проверить голос")} icon="volume" variant="outline" onPress={() => speakGerman("Grüß Gott! Wie geht es Ihnen?")} style={{ marginTop: 12 }} />
        <T v="small" dim style={{ marginTop: 10 }}>
          {tr("Если голоса нет — установите немецкий язык в настройках Android: «Синтез речи» → Google → Немецкий.")}
        </T>

        <SectionTitle>{tr("Обновления")}</SectionTitle>
        <UpdateSection initial={p.update} />
        <View style={{ marginTop: 16 }}>
          <ToggleRow label={tr("Проверять при запуске")} value={s.autoUpdateCheck} onChange={(v) => p.onChange({ autoUpdateCheck: v })} />
        </View>

        <SectionTitle>{tr("Данные")}</SectionTitle>
        <Btn title={tr("Сбросить прогресс")} variant="danger" onPress={confirmReset} />

        <View style={{ alignItems: "center", marginTop: 36 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[font.semibold, { color: t.text, fontSize: 15, letterSpacing: -0.2 }]}>Karten</Text>
            <View style={[styles.dot, { backgroundColor: t.accent }]} />
            <T v="small" dim>{`v${APP_VERSION}`}</T>
          </View>
          <T v="small" faint style={{ textAlign: "center", marginTop: 6 }}>
            {tr("{a} слов · {b} австрийских", { a: WORDS.length, b: WORDS.filter((w) => w.at).length })}{"\n"}
            {tr("Интервальное повторение (SM-2), всё хранится на телефоне.")}
          </T>
        </View>
      </ScrollView>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 12 },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, paddingVertical: 14 },
  tbtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
