# MealMatch

A mobile app (Expo / React Native) to manage recipes and compose menus. UI is in French.

## Features

- **Recipe library** — create, edit and browse recipes with course tagging.
- **Menu composer** — assemble multi-course menus with a swipe-based picker.
- **Import** — bring recipes in via CSV or OCR (photo / PDF, powered by Claude).
- **Export** — generate a printable PDF of a menu.
- **Local-first** — data is stored locally with `expo-sqlite`; secrets via `expo-secure-store`.

## Tech stack

- Expo SDK 54, React Native 0.81, React 19
- React Navigation (drawer + native stack)
- Zustand for client state
- `expo-sqlite` for persistence
- `react-native-deck-swiper`, `react-native-reanimated`, `react-native-gesture-handler`
- TypeScript

## Getting started

```bash
npm install
npm start          # Expo dev server
npm run android    # build & run on Android
npm run ios        # build & run on iOS
npm run web        # run in the browser
```

Requires Node.js and the Expo tooling. iOS builds require macOS + Xcode.

## Project layout

```
src/
  app/          # screens (Home, Library, Compose, Settings, ...)
  components/   # shared UI components
  db/           # SQLite schema & data access
  export/       # PDF generation
  import/       # CSV importer
  ocr/          # Claude-powered OCR (images & PDFs)
  i18n/         # French strings
  navigation/   # navigators & route types
  state/        # Zustand stores
  theme/        # colors & typography
  utils/        # helpers
```

## Configuration

OCR features call the Claude API; the API key is stored on-device via `expo-secure-store` and can be set from the Settings screen.
