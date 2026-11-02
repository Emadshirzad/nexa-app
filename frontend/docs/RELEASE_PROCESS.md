# Nexa CRM — Release Process & Quality Gates

## 1. Release Quality Gates
A release candidate can only be promoted to production when:
1. **P0 Bugs:** 0 open issues (zero data loss, database corruption, or financial inaccuracy).
2. **P1 Bugs:** 0 open issues (zero broken sales flows, inventory leaks, or backup failures).
3. **Automated Tests:** 100% of unit and integration tests passing.
4. **Android Real-Device Verification:** Verified on Android 9 (API 28) and modern Android (API 34+).
5. **Backup & Restore Validation:** End-to-end encrypted backup and restore round-trip passed with complete data parity.
6. **Go/No-Go Decision:** Formally documented and approved.

## 2. Release Steps
1. Increment `versionCode` (integer) and `versionName` (semver) in `android/app/build.gradle` and `package.json`.
2. Update `docs/CHANGELOG.md` with features, fixes, and migration notes.
3. Run full automated test suite: `npm test`.
4. Trigger clean production build: `npm run build && npx cap sync android`.
5. Build release APK with release keystore.
6. Run SHA-256 checksum and apksigner verification.
7. Archive APK and metadata in release storage.
