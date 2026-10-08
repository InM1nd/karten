import React from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Settings, ThemePref } from "../logic/data";
import { useDeck } from "../ui/deck";
import { PermState } from "../ui/notifications";
import { Btn, SectionTitle, Segmented } from "../ui/components";
import { speakGerman } from "../ui/speech";
import { useTheme } from "../ui/theme";
import { DIRECTION_OPTIONS } from "./HomeScreen";

export function SettingsScreen(p: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
  onBack: () => void;
  onToggleReminder: (on: boolean) => void;
  onTestReminder: () => void;
  permission: PermState | null;
}) {
  const t = useTheme();
  const { words: WORDS } = useDeck();
  const s = p.settings;
  const shiftTime = (deltaMin: number) => {
    const total = (s.reminderHour * 60 + s.reminderMinute + deltaMin + 24 * 60) % (24 * 60);
    p.onChange({ reminderHour: Math.floor(total / 60), reminderMinute: total % 60 });
  };
  const hh = String(s.reminderHour).padStart(2, "0"), mm = String(s.reminderMinute).padStart(2, "0");
  const confirmReset = () =>
    Alert.alert("Сбросить прогресс?", "Вся статистика и расписание повторений будут удалены.", [
      { text: "Отмена", style: "cancel" },
      { text: "Сбросить", style: "destructive", onPress: p.onReset },
    ]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.header}>
        <Pressable onPress={p.onBack} hitSlop={14} accessibilityLabel="Назад">
          <Text style={{ fontSize: 26, color: t.text }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: t.text }]}>Настройки</Text>
      </View>

      <SectionTitle>Направление карточек</SectionTitle>
      <Segmented value={s.direction} options={DIRECTION_OPTIONS} onChange={(v) => p.onChange({ direction: v })} />

      <SectionTitle>Новых слов в день</SectionTitle>
      <Segmented
        value={s.newPerDay}
        options={[5, 10, 15, 20].map((n) => ({ value: n, label: String(n) }))}
        onChange={(v) => p.onChange({ newPerDay: v })}
      />

      <SectionTitle>Карточек за занятие (макс.)</SectionTitle>
      <Segmented
        value={s.sessionSize}
        options={[10, 20, 30].map((n) => ({ value: n, label: String(n) }))}
        onChange={(v) => p.onChange({ sessionSize: v })}
      />

      <SectionTitle>Тема оформления</SectionTitle>
      <Segmented<ThemePref>
        value={s.theme}
        options={[
          { value: "system", label: "Системная" },
          { value: "light", label: "Светлая" },
          { value: "dark", label: "Тёмная" },
        ]}
        onChange={(v) => p.onChange({ theme: v })}
      />

      <SectionTitle>Напоминание</SectionTitle>
      <View style={[styles.switchRow, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={{ color: t.text, fontSize: 17, flex: 1 }}>Ежедневное напоминание</Text>
        <Switch value={s.reminderEnabled} onValueChange={p.onToggleReminder} accessibilityLabel="Ежедневное напоминание" />
      </View>
      <View style={[styles.timeRow, { backgroundColor: t.card, borderColor: t.border }]}>
        <Pressable onPress={() => shiftTime(-60)} hitSlop={6} style={[styles.tbtn, { backgroundColor: t.cardAlt }]}>
          <Text style={[styles.tbtnText, { color: t.text }]}>−1 ч</Text>
        </Pressable>
        <Pressable onPress={() => shiftTime(-15)} hitSlop={6} style={[styles.tbtn, { backgroundColor: t.cardAlt }]}>
          <Text style={[styles.tbtnText, { color: t.text }]}>−15</Text>
        </Pressable>
        <Text style={{ fontSize: 28, fontWeight: "800", color: s.reminderEnabled ? t.text : t.textDim, minWidth: 90, textAlign: "center" }}>
          {hh}:{mm}
        </Text>
        <Pressable onPress={() => shiftTime(15)} hitSlop={6} style={[styles.tbtn, { backgroundColor: t.cardAlt }]}>
          <Text style={[styles.tbtnText, { color: t.text }]}>+15</Text>
        </Pressable>
        <Pressable onPress={() => shiftTime(60)} hitSlop={6} style={[styles.tbtn, { backgroundColor: t.cardAlt }]}>
          <Text style={[styles.tbtnText, { color: t.text }]}>+1 ч</Text>
        </Pressable>
      </View>
      <Text style={{ color: t.textDim, fontSize: 14, marginTop: 8 }}>
        В уведомлении — сколько карточек ждёт сегодня. Если занятие уже сделано, сегодня напоминания не будет.
      </Text>
      {p.permission === "blocked" || (p.permission === "denied" && s.reminderEnabled) ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: t.again, fontSize: 15 }}>Уведомления для Karten запрещены в настройках Android.</Text>
          <Btn title="Открыть настройки Android" outline onPress={() => Linking.openSettings()} style={{ marginTop: 8 }} />
        </View>
      ) : null}
      {s.reminderEnabled && p.permission === "granted" ? (
        <Btn title="🔔 Проверить (через 5 секунд)" outline onPress={p.onTestReminder} style={{ marginTop: 10 }} />
      ) : null}

      <SectionTitle>Озвучка</SectionTitle>
      <View style={[styles.switchRow, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={{ color: t.text, fontSize: 17, flex: 1 }}>Автоматически произносить немецкое слово</Text>
        <Switch value={s.autoSpeak} onValueChange={(v) => p.onChange({ autoSpeak: v })} />
      </View>
      <Btn title="🔊 Проверить голос" outline onPress={() => speakGerman("Grüß Gott! Wie geht es Ihnen?")} style={{ marginTop: 10 }} />
      <Text style={{ color: t.textDim, fontSize: 14, marginTop: 8 }}>
        Если голоса нет — установите немецкий язык в настройках Android: «Синтез речи» → Google → Немецкий.
      </Text>

      <SectionTitle>Данные</SectionTitle>
      <Btn title="Сбросить прогресс" color={t.again} outline onPress={confirmReset} />

      <Text style={{ color: t.textDim, textAlign: "center", marginTop: 28, fontSize: 13 }}>
        Karten v1.1 · {WORDS.length} слов · {WORDS.filter((w) => w.at).length} австрийских{"\n"}
        Интервальное повторение (SM-2), всё хранится на телефоне.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: "800" },
  switchRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 14 },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 14, padding: 10, marginTop: 10 },
  tbtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 10 },
  tbtnText: { fontSize: 15, fontWeight: "700" },
});
