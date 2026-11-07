# Nexa — Offline CRM (mobile-app branch)

Android-first, fully offline CRM (Capacitor + Vue 3). No server, no backend
deploy: all data lives in a local SQLite database on the device
(`src/infrastructure/database/`), with crypto-enabled backup/restore
(`docs/BACKUP_RESTORE.md`) and CSV import/export so nothing is lost if the
device is replaced.

## Branches

- `master` — server mode (Laravel API + Docker). Not required for this app.
- `mobile-app` — **this branch**: offline mode only, restored from the
  pre-refactor mobile codebase (the branch resets to the last verified mobile
  release commit).

## Quick start (web preview / development)

```bash
npm install
npm run dev        # browser preview (in-memory SQLite)
npm test           # vitest
npm run typecheck  # vue-tsc
```

## Android build

Requires JDK 21 + Android SDK (API 35). Full guides: `docs/ANDROID_BUILD.md`,
`docs/ANDROID_SIGNING.md`.

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

CI (`.github/workflows/ci.yml`) runs the test suite and publishes a debug APK
artifact on every push to this branch — no signing secrets, no server.

## Data persistence

| Environment | Driver |
|---|---|
| Native (Android) | `CapacitorSqliteDriver` — `@capacitor-community/sqlite` |
| Browser preview | `MemorySqliteDriver` (in-memory, seed data) |
| Vitest | `BetterSqliteDriver` (file-backed `better-sqlite3`) |

Schema migrations: `src/infrastructure/migrations/`. Always use
`More → backup` (AES-256-GCM encrypted export) before uninstalling.
