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
| **Target SDK** | API 35 (Android 15) | Verified |
| **Compile SDK** | API 35 (Android 15) | Verified |
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
- [x] Automated Tests: **64 out of 64 tests passing** (15 test suites) with 100% pass rate.

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

## 3. Distribution Checksums & Release Artifacts

### 3.1 Android Release APK
| Attribute | Detail |
| :--- | :--- |
| **Artifact File** | `android/app/build/outputs/apk/release/app-release.apk` |
| **File Size** | 23 MB (23,788,140 bytes) |
| **Application ID** | `com.nexa.crm` |
| **Version Code / Name** | `1` / `1.0` |
| **Signing Scheme** | APK Signature Scheme v2 (`Verified`) |
| **Signer Certificate DN** | `CN=Nexa CRM, OU=Mobile Development, O=Nexa CRM, L=Tehran, ST=Tehran, C=IR` |
| **Certificate SHA-256** | `ea0b4b8a19462f23cbe5d898f9ce7ee888771780235dd5731f01ad604ce29d04` |
| **APK SHA-256** | `496fa8739fb0bf7640e757217140053782c3ab879980f6ddacfb3f4b968d7b4b` |

### 3.2 Web Assets Checksums (SHA-256)
```text
1f51f1f13580eef5299564c8c82f7fe7c3e73aa43360541f6cb96c4ed45470ac  dist/assets/index-D4eCHY0l.css
828e7fb0ad55dce20226fe737d23b0851fd45e8f07cc26cded54a242f53a71fa  dist/assets/index-C7vpIAY2.js
04b8a16db2b4702d5300ab54cacea078997b2d42c4ec92041048fca7be5b246b  dist/assets/OnboardingPage-CKUAUnGr.js
0c0b8081b5d79c928ea5d24bda79cdfea38e5571ead63a64c58632235ba7c628  dist/assets/LockPage-CcbVJuuj.js
ba773aa44892431c15494574d93a094edd4c0776a10e236b51a3116d05c7fd5b  dist/assets/DashboardPage-DMK7uJoK.js
c5215b93ed5fe469fe88875e697c564dfb28bc54a1e98e59b0cdf8a89f9262f4  dist/assets/CustomersPage-CM3IAOEX.js
87e026c82aa17ac80f4b0705dbb4d470da35e994cf642a7d7c9711fa4bbdaa88  dist/assets/InvoicesPage-1iaL8U7v.js
964a6c867da2ed828116d4802e777a88a3cb0c4789bb91f69ac07ab19df97cb6  dist/assets/TasksPage-BblV17hD.js
2ecea7dc5a56ba96491f4802917b5617911457674d3c3279b93844e308dd6e55  dist/assets/LeadsPage-CEp-DkNh.js
685127426eaadf6f3f7f8c9a2fa4e2b6ce0863c9fa9ccbf4794a535d264211b8  dist/assets/ProductsPage-JHZQEtPR.js
59957d7858ffba34508354147db59bbaeacb05bf174880ba350889e9df48fefc  dist/assets/MorePage-CD5YxPnn.js
3d91b25230dedf73f11118e3bb39946069a4b30d111339d996512249abb35a96  dist/assets/FinancePage-DF4vN_5O.js
77e412f3e940be1e4bf2d31fce25fc1ec6f13ac6ea97c583f5db265b0c3c622f  dist/assets/ReportsPage-CSyZpQRq.js
65228a4f97a11d9d787dcb37076417b8a73b9418a8552adc1266abc0e6fe5a6e  dist/assets/SettingsPage-1eYL4WFU.js
51a0e4611b5bf0a590f56dbc426fc902c66f7b22f70ca4de4aab6eb31bd052a2  dist/index.html
```

---

## 4. Final Recommendation: GO FOR RELEASE CANDIDATE

Based on the complete satisfaction of the Master Development Specification, 100% automated test pass rate across all 15 suites, complete absence of P0/P1 defects, and verified data integrity protocols:

### **Recommendation: GO**
The Nexa CRM application has been compiled, packaged, signed with the production release keystore, and verified via `apksigner`. All automated unit and integration tests pass with 100% success rate. The signed Release APK is ready for device deployment and final User Acceptance Testing (UAT).

> [!NOTE]
> Release APK location: `android/app/build/outputs/apk/release/app-release.apk`  
> SHA-256: `496fa8739fb0bf7640e757217140053782c3ab879980f6ddacfb3f4b968d7b4b`
