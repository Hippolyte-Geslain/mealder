# MealMatch (`mealder`) — Project Context

French-language Expo / React Native app to manage recipes and compose multi-course
menus. See `README.md` for the user-facing feature list and getting-started steps.
This file captures decisions and findings that are **not** obvious from the code.

> **Implementation status and roadmap live in `projectlaunch.md`** — read it before
> starting any feature work, follow its decision-gate protocol (§2) for gated 🔒 items,
> and update it (checkboxes, decisions, update log) whenever a phase moves forward.

## Architecture facts that matter

- **Local-first, no backend.** All data lives on-device in `expo-sqlite`
  (`src/db/`); secrets in `expo-secure-store` (`src/utils/apiKey.ts`,
  `src/db/owner.ts`). There is no API server, no remote DB, nothing to host.
- **OCR calls Anthropic directly** from the device (`src/ocr/claude.ts` image,
  `src/ocr/claudePdf.ts` PDF) at `https://api.anthropic.com/v1/messages`, using a
  user-supplied key stored on-device (bring-your-own-key). No proxy involved.
- The Metro/Expo dev server (`npm start`) is a **development-only** bundler. It is
  the only reason a PC must currently be running — it is *not* needed in production.

## Build & deployment decision (2026-05-29)

Goal: make the app available to an **Android** user without running the Expo dev
server on a PC. Conclusion: **no server is required.**

- **Chosen path — standalone APK, sideloaded. Total cost $0.** Build a release
  `.apk`, send the file to the user; it installs once and runs fully offline
  (OCR still works, calling Anthropic from the device). No store account needed.
- Build with EAS Build free tier (15 Android builds/month, $0) using an APK
  profile in `eas.json` (`"android": { "buildType": "apk" }`), or build locally.
- Optional, still $0: EAS Update free tier (1,000 MAU) for over-the-air JS updates
  without re-sending the APK.

Cost reference for other paths (not chosen):

| Path | One-time | Recurring |
|------|----------|-----------|
| Android APK sideload (chosen) | $0 | $0 |
| Web build on free static host | $0 | $0 |
| Google Play | $25 | $0 |
| Apple App Store / TestFlight (iOS) | — | $99/yr |

## Web compatibility — IMPLEMENTED 2026-06-09 (decision D11, `projectlaunch.md`)

The findings below have all been addressed: web deps installed, secure-store wrapped
by `src/utils/secureKV.ts` (localStorage on web), file reads platform-branched
(ImageManipulator `base64: true` for OCR images; fetch/FileReader for PDF/CSV),
the `anthropic-dangerous-direct-browser-access` header added to every Anthropic call,
menu PDF falls back to the browser print dialog, and `metro.config.js` serves wasm +
COOP/COEP headers for SQLite (a production static host must send the same headers).
`expo export --platform web` passes; a real-browser runtime check is still pending.
Original discovery (kept for reference):

**Prerequisite (web isn't even installed):**
- Missing deps: `react-dom`, `react-native-web`, `@expo/metro-runtime`
  (`npx expo install ...`). Web target cannot run without these.

**Blockers — break at runtime on web, need code changes:**
- `expo-secure-store` has **no web support** → `src/utils/apiKey.ts`,
  `src/db/owner.ts`. Need a web fallback (localStorage / async-storage).
- `expo-file-system/legacy` is **not supported on web** (`documentDirectory` is
  null; read/copy/mkdir throw) → `src/utils/photos.ts` (photo storage),
  `src/ocr/claude.ts` + `src/ocr/claudePdf.ts` (base64 read), `src/app/ImportPicker.tsx`
  (CSV read). On web, read picked files via the Blob/FileReader API instead.
- OCR fetch is **CORS-blocked from a browser** unless the request adds the header
  `anthropic-dangerous-direct-browser-access: true` → `src/ocr/claude.ts`,
  `src/ocr/claudePdf.ts`. One-line header fix (no proxy needed; BYOK is sanctioned).
- PDF export: `expo-print` `printToFileAsync` on web **opens the print dialog**
  instead of returning a file uri, and `expo-sharing` `isAvailableAsync()` is
  `false` on web → `src/export/menuPdf.ts` flow needs a web branch.

**Needs configuration / verification:**
- `expo-sqlite` works on web (OPFS/wa-sqlite) but the page must be served with
  `Cross-Origin-Opener-Policy` + `Cross-Origin-Embedder-Policy` headers for
  persistence, plus Metro config → `src/db/client.ts`. Verify migrations run.
- `react-native-keyboard-controller` (`KeyboardAwareScrollView`) — limited web
  support → `src/app/{ImportReview,RecipeForm,Settings,MenuSummary}.tsx`.
- `react-native-reanimated` v4 + `react-native-worklets` — web needs babel/worklets
  setup; verify animations (esp. `src/app/Compose.tsx`).
- `expo-image-manipulator` — has web (canvas) support; verify resize in OCR path.

**Likely OK on web:**
- `expo-crypto` `randomUUID` (`src/utils/uuid.ts`), `expo-image-picker` /
  `expo-document-picker` picking (file input — the *read* afterward is what breaks),
  `react-native-deck-swiper` (PanResponder), `react-native-gesture-handler`,
  `react-native-safe-area-context`, React Navigation.

## Conventions

- All UI strings are French and centralized in `src/i18n/fr.ts`.
- Theme tokens in `src/theme/` (`colors.ts`, `typography.ts`).
- Client state via Zustand (`src/state/`); persistence via SQLite (`src/db/`).
