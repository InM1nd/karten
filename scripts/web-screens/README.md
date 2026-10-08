Screenshots in design/v1.2-screens are rendered from the real app code with react-native-web + headless Chrome.
1. Copy App.tsx, index.ts, app.json, package.json, src/, assets/ and node_modules (cp -al) to /tmp/karten-web, then add metro.config.js and webshim/ from here.
   The shims are web-only: they stub the Android widget library and make expo-notifications act like a fresh install.
2. `CI=1 npx expo export -p web --output-dir dist`. Copy assets/fonts/*.ttf to dist/fonts and add @font-face rules for InterTight (400/500/600) and KartenIcons to dist/index.html.
3. Serve dist on 127.0.0.1:8099. Run `npx tsx seed.ts`, then run `node shoot.mjs` (needs puppeteer-core from /workspace/tools).
