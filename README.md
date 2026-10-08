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
cp app/build/outputs/apk/release/app-release.apk ../Karten-v1.2.0.apk
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
- `src/ui/theme.ts` — v1.2 minimal design tokens (light + true-black dark, one orange accent, article dot colours, Inter Tight weights)
- `src/ui/components.tsx` — typography (`T`), `Pressy` (press scale), `Btn`, `GermanWord` (dot + article), headers, progress, `FadeIn`
- `src/ui/Icon.tsx` + `src/ui/iconGlyphs.ts` — line icons from the bundled icon font, Austrian flag and progress ring in plain Views
- `assets/fonts/` — Inter Tight 400/500/600 (Latin + Cyrillic subset, OFL) and `KartenIcons.ttf`
- `scripts/make_fonts.py` — Inter Tight static instances + subsetting; `scripts/make_icon_font.py` — icon font (needs `skia-pathops`)
- `scripts/make_brand_v12.py` — v1.2 icon/adaptive/monochrome/splash (light+dark)/notification icon/widget preview
- `scripts/make_icons.py`, `scripts/make_extra_assets.py` — the older (≤ v1.1) gradient assets, kept for reference
- `design/` — mockups; `design/v1.2-screens/` — screenshots rendered from the real app code (react-native-web + headless Chrome)
