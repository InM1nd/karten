# Karten — German flashcards (A2–B1, RU interface)

Offline React Native + Expo (SDK 57, RN 0.86, TypeScript) app. No backend, no account.

## Build (local, no EAS)

```bash
. ./env.sh                       # Node 22, JDK 17, Android SDK from ~/opt and ~/Android/Sdk
npm install
npm run typecheck                # tsc --noEmit
npm test                         # node:test logic tests (SRS, typing checker, achievements, migration, reminders, games, deck)
npm run test:ui                  # jest + @testing-library/react-native UI tests
CI=1 npx expo prebuild --platform android --clean --no-install
./scripts/configure-android.sh   # release signing v1+v2+v3, arm64-only, stored 16 KB-aligned libs, R8, Gradle limits
cd android && ./gradlew assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../Karten-v1.1.0.apk
```

Logs and verification output: `build-logs/`. Release keystore: `keystore/karten-release.jks`
(local, self-generated — keep it, otherwise updates can't be installed over the existing app).

## Structure
- `src/data/words.ts` — the deck (topic → entries; `at` = Austrian word); `src/data/exRu.ts` — RU translations of examples
- `src/logic/data.ts` — data model v2 + pure `migrate()` (v1 → v2, never throws); `store.ts` — AsyncStorage I/O with backups
- `src/logic/srs.ts` — SM-2-style scheduler (+ `markMistake` for game errors), session queue, streak, stats
- `src/logic/typing.ts` — umlaut/case tolerant answer checker + character diff
- `src/logic/games.ts`, `achievements.ts`, `reminders.ts` — article/speed game logic, 15 achievements, 7-day reminder plan
- `src/ui/notifications.ts` — expo-notifications channel/permission/scheduling
- `src/widget/*` — "Слово дня" home-screen widget (react-native-android-widget)
- `src/screens/*` — Home, Session, Browse, Settings, Article, Speed, Typing, CustomWords, Achievements
- `tests/` — `node:test` unit tests (run with `tsx`); `tests-rn/` — jest UI tests
- `scripts/make_icons.py`, `scripts/make_extra_assets.py` — icon/splash/notification-icon/widget-preview assets
