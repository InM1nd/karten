#!/usr/bin/env bash
# Re-applies local build customisations after `npx expo prebuild` (which regenerates ./android).
set -euo pipefail
cd "$(dirname "$0")/.."
GP=android/gradle.properties
# make sure the file ends with a newline before appending
[ -n "$(tail -c1 $GP)" ] && echo >> $GP
sed -i 's/^org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx2560m -XX:MaxMetaspaceSize=640m -Dfile.encoding=UTF-8/' $GP
sed -i 's/^org.gradle.parallel=.*/org.gradle.parallel=false/' $GP
sed -i 's/^reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a/' $GP
# set_prop KEY VALUE: replace if present, append otherwise
set_prop() { if grep -q "^$1=" $GP; then sed -i "s|^$1=.*|$1=$2|" $GP; else echo "$1=$2" >> $GP; fi; }
set_prop org.gradle.workers.max 3
set_prop kotlin.compiler.execution.strategy in-process
# Native libs: stored uncompressed + 16 KB page-aligned in the APK (AGP default,
# extractNativeLibs=false) - the layout Android 15/16 and Pixel 16 KB mode expect.
# R8 minification + resource shrinking keep the APK well under 24 MB.
set_prop expo.useLegacyPackaging false
set_prop android.enableMinifyInReleaseBuilds true
set_prop android.enableShrinkResourcesInReleaseBuilds true
# 1.5: the JS bundle (1000 words x 3 languages) is deflated inside the APK
set_prop android.enableBundleCompression true
# the app ships only PNG/vector assets: no GIF/WebP decoders needed (~0.8 MB of native libs)
set_prop expo.gif.enabled false
set_prop expo.webp.enabled false

APPG=android/app/build.gradle
if ! grep -q 'karten-release' $APPG; then
python3 - "$APPG" <<'PY'
import sys, re
p = sys.argv[1]; s = open(p).read()
# load keystore.properties
s = s.replace("android {", """def karten = new Properties()
def kartenFile = rootProject.file('../keystore/keystore.properties')
if (kartenFile.exists()) { kartenFile.withInputStream { karten.load(it) } } // karten-release

android {""", 1)
# add release signing config next to debug
s = s.replace("""    signingConfigs {
        debug {""", """    signingConfigs {
        release {
            if (kartenFile.exists()) {
                storeFile file(karten['storeFile'])
                storePassword karten['storePassword']
                keyAlias karten['keyAlias']
                keyPassword karten['keyPassword']
            }
            enableV1Signing true
            enableV2Signing true
            enableV3Signing true
        }
        debug {""", 1)
# use it for release build type
rel = s.index("        release {", s.index("buildTypes {"))
blk_end = s.index("signingConfig signingConfigs.debug", rel)
s = s[:blk_end] + "signingConfig signingConfigs.release" + s[blk_end+len("signingConfig signingConfigs.debug"):]
open(p, "w").write(s)
PY
fi
# 1.5: keep only the app's languages in resources.arsc (library translations for ~80 locales are dead weight)
if ! grep -q 'resourceConfigurations' $APPG; then
  sed -i '0,/defaultConfig {/s//defaultConfig {\n        resourceConfigurations += ["en", "ru", "uk", "de"]/' $APPG
fi
echo "android/ configured"
