# MealMatch — Project Launch & Implementation File

> **This is the living implementation reference.** It states what exists, what is decided,
> and what remains to be built. Update it every time a phase moves forward or a gated
> decision is made. Plans and READMEs may be written alongside the project; this file is
> the single source of truth for *implementation status and decisions*.

Last updated: **2026-06-09** (Phases 1–4, web track and cost history implemented).

---

## 1. Product statement

MealMatch is a French-language, local-first Expo/React Native app for working chefs:
a recipe library with per-portion costing, a Tinder-style swipe composer that assembles
multi-course menus, and frictionless import (CSV, photo/PDF OCR via Claude BYOK).
The Epicure research (ingredient embeddings, arXiv 2604.22776 / 2605.22391 — see
`EPICURE_RESEARCH.md`) adds a flavor layer: automatic flavor profiles per recipe and a
purely informational flavor-mix visualization per menu.

Architecture principles (non-negotiable unless explicitly revisited):

- **Local-first, zero backend.** SQLite on-device (`src/db/`), secrets in secure store.
  Nothing to host. Distribution: sideloaded release APK ($0, decided 2026-05-29).
- **Bring-your-own-key AI.** All Claude calls go directly from the device using the
  user's key (`src/utils/apiKey.ts`). No proxy, no recurring developer cost.
- **French UI**, all strings centralized in `src/i18n/fr.ts`; theme tokens in `src/theme/`.

---

## 2. Locked decisions (2026-06-09)

| # | Decision |
|---|----------|
| D1 | Swipe composer and flavor-profile cards are confirmed features. |
| D2 | The menu flavor-mix feature is **purely informational** — it never recommends, warns, or re-orders the swipe deck. Display only. |
| D3 | Flavor-mix visuals kept: **A — Radar (hexagone des saveurs)** and **D — Courbes de progression** (per-dimension lines across Entrée → Plat → Dessert). Rejected: segmented bars, heat grid. Both kept visuals require `react-native-svg`. |
| D4 | Flavor-mix visualization appears on **Compose (live), Menu Summary, and Menu Detail** — same read-only component reused. |
| D5 | **Ingredient substitution is removed from the plan entirely.** Do not reintroduce it. |
| D6 | Flavor profiles are computed via **Claude BYOK** (one call at recipe save/import, cached in SQLite), behind a `src/flavor/` interface so the real Epicure model (~2 MB, weights not yet released) can be swapped in later without touching the UI. |
| D7 | Costing/export (feature 6) is the **business backbone**. Any change to it is **gated**: present options to the owner (closed questions) and get a decision *before* writing code. Same protocol as the visuals choice in D3. |
| D8 | **Selling price / margin support: not now.** Costing stays cost-only. Re-open via the gate protocol when wanted. (2026-06-09) |
| D9 | **Saved menus keep live costs** (recomputed from current recipe costs) — explicit confirmation of the existing behavior; no snapshotting. (2026-06-09) |
| D10 | **PDF export has two variants chosen at export time**: client (no costs at all) and kitchen (per-course costs, totals table, flavor radar — still informational per D2). (2026-06-09) |
| D11 | **Web target is supported**: platform branches for secure storage, file reads, PDF print, plus the Anthropic direct-browser-access header. Production hosting must serve COOP/COEP headers (see `metro.config.js`). (2026-06-09) |
| D12 | **Ingredient cost history**: every default-cost change is recorded at recipe save; read-only history screen under Réglages → Coûts. (2026-06-09) |

### Decision-gate protocol (applies to D7 and any 🔒 item below)

1. Before starting a gated item, write up the candidate approaches (mockups/options).
2. Ask the owner closed questions (with context if the question can't be closed).
3. Record the answer as a new locked decision in §2 with the date.
4. Only then implement.

---

## 3. What exists today (done)

Full screen-by-screen behavior is documented in `SCREENS.md`. Summary:

- **Recipe library** — create/edit/delete recipes with course tagging (Entrée/Plat/Dessert),
  photo, ingredient lines (name, quantity, unit, cost/portion), ingredient-name
  autocomplete from `src/db/ingredientLibrary.ts`. Screens: `Library.tsx`, `RecipeForm.tsx`.
- **Menu composer** — step-by-step swipe deck, one recipe per course, empty-state handling.
  Screens: `Compose.tsx` (+ `composeStore.ts`), `MenuSummary.tsx`.
- **Saved menus** — list, open, delete; per-menu cover count with live cost recompute.
  Screens: `SavedMenus.tsx`, `MenuDetail.tsx`, `Home.tsx` (recent menus).
- **Costing** — per-portion ingredient costs → per-cover and grand total (`src/utils/money.ts`).
- **Import** — CSV (`src/import/csv.ts`) and OCR photo/PDF via Claude
  (`src/ocr/claude.ts`, `src/ocr/claudePdf.ts`) with review step (`ImportReview.tsx`).
- **Export** — printable menu PDF via `expo-print` + share sheet (`src/export/menuPdf.ts`).
- **Settings** — Anthropic API key stored encrypted on-device.
- **Navigation** — bottom tabs + stacks (`src/navigation/`), small-target padding done.
- **Research & discovery** — Epicure summary (`EPICURE_RESEARCH.md`), screen map
  (`SCREENS.md`), web-compatibility discovery (findings in `CLAUDE.md`, no code yet),
  APK distribution decision ($0 path, `CLAUDE.md`).

---

## 4. What needs to be done

Phases are ordered; each phase ends with this file being updated (check the boxes,
add decisions, bump "Last updated").

### Phase 1 — Flavor foundation (`src/flavor/`) — ✅ done 2026-06-09

- [x] Flavor profile type (`src/flavor/types.ts`): scores 0–1 on 6 axes
      (sucré, salé, umami, gras, piquant, acide) + cultural cluster label (nullable).
- [x] Provider interface (`src/flavor/provider.ts`, swap point for Epicure) with
      Claude BYOK implementation (`src/flavor/claude.ts`): forced tool call
      (`record_flavor_profile`), model `claude-sonnet-4-6` (same as OCR), French prompt.
- [x] SQLite migration 4: `recipe.flavor_json` + `recipe.flavor_input` (input key =
      normalized name + sorted ingredient names → recompute only when they change).
      Computed in background after save (`RecipeForm`) and bulk import (`ImportReview`)
      via `src/flavor/service.ts`; profile stays null without an API key and the UI
      hides all flavor elements.
- [x] Backfill: "Calculer les profils manquants" in Réglages, sequential with
      progress, aborts cleanly on missing key.

### Phase 2 — Flavor-profile card on recipes — ✅ done 2026-06-09

- [x] `FlavorPills.tsx`: dominant dimensions (score ≥ 0.45, max 3) + cluster pill;
      shown on `RecipeCard.tsx` (swipe deck) and in `RecipeForm.tsx` (edit mode).
- [x] French labels for the 6 axes + backfill strings in `src/i18n/fr.ts` (`fr.flavor`).

### Phase 3 — Menu flavor-mix visualization (informational only, per D2) — ✅ done 2026-06-09

- [x] `react-native-svg` installed (expo SDK 54 compatible).
- [x] `FlavorRadar.tsx` — menu-level polygon (mean of picked courses) over the 6 axes.
- [x] `FlavorLines.tsx` — one line per axis across Entrée → Plat → Dessert,
      color legend, missing courses omitted.
- [x] `MenuFlavorMix.tsx` wrapper mounted on Compose (compact live strip: mini radar +
      mini lines, appears after the first pick), Menu Summary and Menu Detail (full
      card, per D4). No text advice, no warnings, no deck re-ordering (per D2).
- [x] **Manual verification on a device** — owner confirmed the runtime check
      (2026-06-09), alongside typecheck + Metro bundles.

### Phase 4 — Costing & export evolutions 🔒 GATED (per D7) — gate opened 2026-06-09

Decisions D8–D12 recorded via the gate protocol. Status:

- [x] Margin/selling-price support → **deferred (D8)**, no code.
- [x] Cost propagation to saved menus → **live costs confirmed (D9)**, no code.
- [x] PDF export → **implemented (D10)**: export-time choice client/cuisine in
      `MenuDetail.tsx`; kitchen variant adds per-course costs, totals table and an
      inline-SVG flavor radar (`src/export/menuPdf.ts`).
- [x] Cost history → **implemented (D12)**: migration 5 (`ingredient_cost_history`),
      change detection in `upsertFromRecipe` (`src/db/ingredientLibrary.ts`),
      read-only screen `src/app/CostHistory.tsx` (Réglages → Coûts), per-entry
      ▲/▼ delta vs previous price. History starts accruing from now (no retroactive data).

### Parallel track — Distribution & platforms

- [x] EAS project set up (2026-06-09): logged in as `hippogagne`, project linked
      (`eas init`, ID in `app.json`), `eas.json` created with the `preview` APK profile,
      `android.package = com.hippogagne.mealder`, cloud keystore generated,
      image-picker mic permission disabled (images only). First APK build
      **finished 2026-06-09 22:39** (v1.0.0, versionCode 1):
      APK → https://expo.dev/artifacts/eas/cYreJAXbGKhJwqDN33rYym.apk
      Logs → https://expo.dev/accounts/hippogagne/projects/mealder/builds/60f5baa7-129e-4d54-a98d-a128f7781a7c
- [ ] Sideload the APK on the target phone and smoke-test. On first launch, verify
      Réglages shows "Profils de saveurs" — that confirms the build picked up the
      working-tree changes (the repo was uncommitted at build time; HEAD was 9fc0641).
- [x] Web build (D11, 2026-06-09): `react-dom` / `react-native-web` /
      `@expo/metro-runtime` installed; `src/utils/secureKV.ts` (secure-store →
      localStorage on web) used by `apiKey.ts` + `owner.ts`; OCR image path now uses
      ImageManipulator `base64: true` (no file system needed on either platform);
      PDF/CSV reads get web branches (fetch/FileReader); all three Anthropic calls
      send `anthropic-dangerous-direct-browser-access`; menu PDF falls back to the
      browser print dialog; `metro.config.js` adds wasm asset + COOP/COEP dev headers.
      `expo export --platform web` passes. **Runtime check in a real browser still
      pending** (SQLite OPFS persistence, keyboard-controller and reanimated behavior).

### Deferred / out of scope

- **Ingredient substitution: removed permanently (D5).**
- Real Epicure weights integration: blocked on public release; the `src/flavor/`
  interface (Phase 1) is the only preparation needed now.

---

## 5. Update log

- **2026-06-09** — Initial version. Decisions D1–D7 recorded (visuals A+D chosen,
  Claude BYOK profile source, Compose+Summary+Detail placement, substitution removed,
  costing gated). No code written yet.
- **2026-06-09 (later)** — Phases 1–3 implemented: `src/flavor/` module (types,
  provider interface, Claude BYOK provider, refresh/backfill service), DB migration 4,
  flavor pills on recipe cards/form, radar + progression-lines components mounted on
  Compose/Summary/Detail, backfill UI in Réglages, `react-native-svg` added.
  Verified: `tsc --noEmit` clean, `expo export --platform android` bundles.
  Next: device check of Phase 3 visuals, then Phase 4 is 🔒 gated (owner decisions
  required) and the APK build needs an interactive EAS login.
- **2026-06-09 (later still)** — Phase 4 gate opened and answered (D8–D12). Implemented:
  PDF client/kitchen variants with flavor radar (D10), web compatibility track (D11),
  ingredient cost history (D12). D8 (pricing) deferred, D9 (live costs) confirmed
  without code. Verified after each step: `tsc --noEmit` clean, `expo export` passes
  for android + web. Remaining walls: device/browser runtime verification (owner),
  `eas login` for the APK build (owner).
