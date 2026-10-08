import * as Haptics from "expo-haptics";

const safe = (p: Promise<unknown>) => p.catch(() => {});
export const hapticOk = () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const hapticBad = () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
export const hapticTap = () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
