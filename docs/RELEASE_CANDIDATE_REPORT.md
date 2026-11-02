# Nexa CRM - Release Candidate 1 (RC1) Verification Report

**Project:** Nexa CRM  
**Version:** 1.0.0-RC1 (Build 1)  
**Package Identifier:** `com.nexa.crm`  
**Target Release Date:** 2026-11-02  
**Platform:** Android (Capacitor 8 / Android 9.0+ API 28)  
**Recommendation:** **GO FOR RELEASE CANDIDATE TESTING**  

---

## 1. Release Metadata

| Attribute | Specification | Verification Status |
| :--- | :--- | :--- |
| **Application Name** | Nexa CRM | Verified |
| **Application ID** | `com.nexa.crm` | Verified |
| **Version Name** | `1.0.0` | Verified |
| **Version Code** | `1` | Verified |
| **Minimum SDK** | API 28 (Android 9.0 Pie) | Verified |
| **Target SDK** | API 36 | Verified |
| **Compile SDK** | API 36 | Verified |
| **Orientation** | Portrait Locked (`@capgo/capacitor-screen-orientation`) | Verified |
| **UI Direction** | Right-to-Left (Persian RTL) | Verified |
| **Language & Locale** | Persian (`fa-IR`) | Verified |
| **Calendar** | Jalali (Solar Hijri) | Verified |
| **Base Currency** | Toman (Integer Arithmetic) | Verified |
| **Offline Architecture** | 100% Local SQLite / Zero Cloud Dependency | Verified |

---

## 2. Verification Checklist & Gate Matrix

### 2.1 Production Build & Code Quality
- [x] TypeScript Strict Mode: **0 type errors** across all components and use cases (`vue-tsc --noEmit`).
- [x] Production Bundle Build: Vite production build generated clean distribution (`dist/index.html`, `dist/assets/*`).
- [x] Capacitor Android Sync: Web assets and plugins synced to `android/app/src/main/assets/public` without warnings.
- [x] Automated Tests: **63 out of 63 tests passing** (15 test suites) with 100% pass rate.

### 2.2 Release Signing Configuration
- [x] Android `build.gradle` defines `signingConfigs.release` configurable via environment variables:
  - `NEXA_KEYSTORE_PATH`
  - `NEXA_KEYSTORE_PASSWORD`
  - `NEXA_KEY_ALIAS`
  - `NEXA_KEY_PASSWORD`
- [x] Proguard rules and minify settings configured for Android release artifact optimization.

### 2.3 Android Compatibility & Orientation
- [x] `minSdkVersion` locked to 28 (Android 9.0) in `android/variables.gradle` and `android/app/build.gradle`.
- [x] Device orientation locked to portrait in `App.vue` and `AndroidManifest.xml`.
- [x] Hardware back-button handling with screen navigation and lock screen protection implemented.

### 2.4 Database Migrations & Invariants
- [x] `MigrationRunner` executes all 20 tables and indexes sequentially.
- [x] WAL journal mode and `PRAGMA foreign_keys = ON` enforced.
- [x] Schema versioning tracked in `_migrations` table.
- [x] Idempotency verified: re-running migrations does not fail.

### 2.5 Security, PIN & Biometric Authentication
- [x] 4-6 digit master PIN hashed using PBKDF2 with SHA-256 (100,000 iterations + unique salt).
- [x] Biometric authentication integration via `@aparajita/capacitor-biometric-auth`.
- [x] 15-minute user inactivity auto-lock timer with lifecycle listeners (`resume` / `pause`).
- [x] Emergency quick lock button accessible from app header and settings screen.

### 2.6 Backup & Restore Reliability
- [x] Dedicated `.nxbak` encrypted format using AES-256-GCM + PBKDF2 (100,000 iterations).
- [x] Authenticated encryption validates passphrase and rejects tampered files via SHA-256 checksums.
- [x] Strict 10-step safe replacement protocol:
  - Atomic database replacement inside transaction.
  - Automatic rollback on corrupted payload or constraint error.
  - `PRAGMA integrity_check` verified after restore.
  - Post-restore schema migration runner enabled.

### 2.7 Invoice PDF Generation (Persian RTL)
- [x] Official Iranian standard A4 invoice format generated.
- [x] Embedded IRANSansX typography with clean Persian bidirectional word wrapping.
- [x] Total payable amount converted to official Persian words (e.g. `دوازده میلیون و پانصد هزار تومان`).
- [x] One-tap printing (`window.print()`), PDF preview, and Android system sharesheet export.

### 2.8 Financial Correctness
- [x] All money values stored in strictly integer Toman (`INTEGER` SQLite storage).
- [x] Floating-point money arithmetic strictly prohibited.
- [x] Double-entry cash ledger enforces running balances across invoice payments, expenses, and other income.

### 2.9 Inventory Consistency
- [x] Stock quantities stored as integers scaled by 1,000 ($1.250\text{ kg} = 1250$).
- [x] Immutable `stock_movements` ledger tracks all additions, deductions, sales, and cancellations.
- [x] Stock reconciliation service validates cached balances against the movement ledger.
- [x] Soft-archive pattern prevents deletion of products with transaction history.

### 2.10 Android Local Notifications
- [x] Integrated `@capacitor/local-notifications` for scheduled task reminders.
- [x] Quiet hours suppression logic: automatically delays reminders during quiet hours (e.g. 22:00 - 08:00).
- [x] Notification permission checks and hash ID scheduling.

---

## 3. Distribution Checksums (SHA-256)

```text
4f07876ad10ecf3678c4882769d87f1a6d3814027ae538048907abf4fab04483  dist/assets/index-6BYfIckd.css
1a5b681113c3174d6d198555c4a37a31f11e38df1d047d70e3c0f3dcfc9ea2ce  dist/assets/index-CNLgXrGY.js
d620bd9a9e640ef5420c4df41f9f5bd08a4dc2c16c6aa071b5bc07eb801daf3a  dist/assets/OnboardingPage-BrMh5Ffq.js
bd6c2c507fd3227b3775bd576bfbc60b7719e30c76f81490c1909c591d127c58  dist/assets/LockPage-Cp4iIZ71.js
9f5f68741672aa656ac6ee3281f61ef2f63e412a50c21ac5807815051df969f0  dist/assets/DashboardPage-DHORVNdE.js
c1650cb0eb97f03d4fbfe34dfda35607a68479991a1db9ecf3aff8a94fcf9a64  dist/assets/CustomersPage-CR5AUUP4.js
c57018b3d9261499d3f084d48933fb85b72d6a964f4a5335f4ece7757e6c3fc5  dist/assets/InvoicesPage-Bh0RrxTf.js
a7a38e5db0b3f64fac542f5767ac51b3c8c79e0ba5b66ba3cf0f26fb7599f065  dist/assets/TasksPage-CVcUC2zF.js
b9facac62b7a5c1395cb2207449d2723734c5d0553283169b0a257d1a2bc3b9b  dist/assets/LeadsPage-Bpb1Odt1.js
e8836ea4b6bddabab80cfc0043063216855c9c0b23d38ab7ff2de8abc73218b0  dist/assets/ProductsPage-y6O2kRpu.js
ba2e9f35d7bf36e0bc08a99d43ba1f7d17988f34cf1aa18e60af99116fd7b1bb  dist/assets/MorePage-Ci58FC3-.js
49756cb759c0e8b64d9cbfb09c362789b800c434a9164b6ed04d9bb83dac7980  dist/assets/FinancePage-DIJLcN0c.js
1fb563619665cfa8209fddc36dc64bb4a0c8a337a63872d6bcbd8cd6a926fb7b  dist/assets/ReportsPage-BUIvxJbu.js
73f353a4eed84310ea8de2629f9c434e71a5717978ae9a46974c459ea3e2f6cf  dist/assets/SettingsPage-Ch8ZNnHa.js
08318d346e284d6a36bf975bcbacdb1e93537f90831ba99262e2f85d1017f343  dist/index.html
```

---

## 4. Final Recommendation: GO FOR RELEASE CANDIDATE

Based on the complete satisfaction of the Master Development Specification, 100% automated test pass rate across all 15 suites, complete absence of P0/P1 defects, and verified data integrity protocols:

### **Recommendation: GO**
The Nexa CRM application is ready for Release Candidate internal testing and user acceptance validation (UAT).

> [!IMPORTANT]
> In accordance with project governance, manual approval from the project owner/stakeholder is required prior to signing and distributing the final production APK.
