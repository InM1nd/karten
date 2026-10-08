# Release signing (local only)

Everything in this folder except this README and `keystore.properties.example` is git-ignored.

- `karten-release.jks` – the release keystore. **Keep a backup**: updates only install over an existing
  app if they are signed with the same key.
- `keystore.properties` – read by `scripts/configure-android.sh` → `android/app/build.gradle`.
- `SECRETS.local.md` – human-readable note with the passwords (local, untracked).

New machine / fresh clone: copy `keystore.properties.example` to `keystore.properties`, put the `.jks`
next to it and fill in the passwords (without it the release APK is not signed with your key).
To create a brand-new key instead:

```bash
keytool -genkeypair -v -keystore keystore/karten-release.jks -alias karten \
  -keyalg RSA -keysize 4096 -validity 10000
```
