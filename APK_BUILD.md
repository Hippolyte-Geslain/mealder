# APK Build Guide — MealMatch

How to ship MealMatch as a sideloadable Android `.apk` to a single user, for $0.

> Decision recap (from `CLAUDE.md`, 2026-05-29): no backend, no Play Store, no
> running PC. User installs the APK once, app runs fully offline. OCR keeps
> working because it calls Anthropic directly from the device with the user's
> own key.

---

## North star metric

**The user opens MealMatch on their phone and successfully imports a recipe via
OCR — without me ever touching their device.**

That single event proves end-to-end:
- APK installed and launched on a stock Android.
- SQLite migrations ran on first boot.
- The user pasted their Anthropic key into Settings.
- A real OCR call left the device, hit `api.anthropic.com`, and came back parsed.
- The parsed recipe was saved locally and is visible after app restart.

Anything short of this is "I built an APK," not "I shipped the app."

---

## Prerequisites (one-time)

1. **Expo account** — free. `npx expo login`.
2. **EAS CLI** — `npm i -g eas-cli`, then `eas login`.
3. **Android package id** — required before first build. Add to `app.json`:
   ```json
   "android": {
     "package": "com.hippo.mealmatch",
     ...
   }
   ```
   Pick a reverse-DNS id you actually own. **It cannot change** after the user
   installs — changing it makes a different app, not an update.
4. **App signing key** — let EAS generate and store it. Do **not** lose it; same
   key must sign every future update or the user has to uninstall first.

---

## Build configuration

Create `eas.json` at the repo root:

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "channel": "production",
      "autoIncrement": true
    }
  }
}
```

Why APK and not AAB: AAB is a Play Store format. For sideloading you need a
single installable file → APK.

Build:
```bash
eas build --platform android --profile preview
```
EAS hosts the artifact; share the URL/QR with the user. Free tier: 15
Android builds/month.

---

## Best practices

### Versioning
- Bump `expo.version` in `app.json` for every user-visible release (e.g.
  `1.0.0` → `1.0.1`).
- Let EAS manage `android.versionCode` via `autoIncrement: true`. Android
  refuses to install an APK whose `versionCode` is lower than what's already
  installed.

### Signing
- Use EAS-managed credentials. Run `eas credentials` once to confirm the
  keystore is stored.
- Back it up: `eas credentials` → download keystore → keep offline copy.
  Losing the keystore = user must uninstall before they can update.

### Permissions
- Audit what the manifest requests. Currently used: photos (image-picker),
  storage (file-system), camera if you enable it. Strip anything you don't
  use — every permission is a trust ask.
- The French photo-permission string in `app.json` is correct; verify any
  new ones are also French.

### Assets
- Verify `assets/icon.png` (1024x1024) and `assets/adaptive-icon.png`
  (foreground 1024x1024, transparent background) before building. Wrong sizes
  produce blurry launcher icons that look unprofessional.
- Splash background `#F7F1E3` matches the app theme — keep them in sync if
  the theme changes.

### Bundle size
- React Native + Expo APK baseline is ~30–60 MB. Acceptable. Don't chase
  smaller without a reason.
- If size matters later: `expo-doctor`, then split per ABI (`armeabi-v7a`,
  `arm64-v8a`, `x86_64`) via Gradle. Most modern phones only need `arm64-v8a`.

### OTA updates (optional, $0)
- Add `expo-updates` and configure the `production` channel.
- After the first APK is installed, push JS-only changes with
  `eas update --branch production`. Native deps changes still require a new APK.
- Free tier: 1,000 MAU. You have 1 user.

### Pre-flight checklist (before sending the APK)
- [ ] `eas build --profile preview` finishes green.
- [ ] Install the APK on your own Android device.
- [ ] Cold start: app opens, no crash, French strings render.
- [ ] Settings → paste Anthropic key → key persists after app restart.
- [ ] Import a recipe via camera/photo OCR → recipe appears in list.
- [ ] Import a recipe via PDF OCR → recipe appears in list.
- [ ] Compose a menu → export PDF → share sheet opens.
- [ ] Kill app, reopen → all data still there (SQLite persisted).
- [ ] Airplane mode → app still opens and shows existing recipes (offline-first).

---

## Gotchas specific to this codebase

- **`newArchEnabled: true`** in `app.json`. The new architecture is fine on
  recent Expo but watch the build log for native module incompatibilities.
  If a build fails with a Fabric/TurboModule error, flip to `false` and
  rebuild before chasing the real cause.
- **`react-native-reanimated` v4 + `react-native-worklets`** need the
  babel plugin. `babel.config.js` should already include
  `react-native-worklets/plugin` as the *last* plugin. Confirm before
  building — wrong order causes silent animation breakage in release.
- **`expo-secure-store`** stores the Anthropic API key. On Android it uses
  the Keystore; the key is bound to the app signature. **If the keystore
  changes between builds, the user's saved API key becomes unreadable** —
  they'll have to paste it again. Another reason not to lose the keystore.
- **`expo-sqlite` migrations** run on first launch. Test the cold-install
  path on a real device, not just over a dev reload — migration bugs only
  show up on a fresh DB.
- **OCR works in release builds**, but Anthropic's API can rate-limit or
  reject a bad key silently. Add (or verify) a clear error path in OCR
  failure cases before shipping; an opaque "OCR failed" message will burn
  trust on the first user attempt.
- **No analytics, no crash reporting.** That's a choice consistent with the
  local-first stance, but it means if the app crashes on the user's phone
  you'll hear about it via text message, not Sentry. Make peace with that
  or add `expo-application` + a manual "send logs" button.

---

## Delivery

1. EAS finishes the build → gives you a build URL and a QR code.
2. Share the build URL with the user (Signal, email, whatever).
3. They tap → download → Android prompts "Install from unknown source" → they
   accept → app installed.
4. Tell them: open Settings inside MealMatch, paste their Anthropic key, try
   importing a recipe.
5. Wait for the photo of a working recipe on their phone. That's the north
   star hit.

---

## What this guide is *not*

- Not a Play Store submission guide (different format, $25 fee, review
  process — out of scope).
- Not an iOS guide (requires $99/yr Apple Developer account — out of scope).
- Not a CI/CD setup (one user, occasional builds — manual `eas build` is
  fine until proven otherwise).
