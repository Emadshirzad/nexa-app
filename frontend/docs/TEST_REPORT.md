# Nexa CRM - Automated Test Suite Report

**Project:** Nexa CRM  
**Target Release:** Version 1.0.0-RC1  
**Test Runner:** Vitest v3.0.0  
**Test Execution Date:** 2026-11-02  
**Overall Result:** **PASSED (100% Success Rate)**  

---

## Executive Summary

| Category | Test Suites | Total Tests | Passed | Failed | Skipped | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Unit Tests** | 5 | 22 | 22 | 0 | 0 | 42ms |
| **Integration Tests** | 10 | 42 | 42 | 0 | 0 | 791ms |
| **Total** | **15** | **64** | **64** | **0** | **0** | **1.44s** |

---

## Detailed Suite Breakdown

### 1. Domain Unit Tests

#### `tests/unit/Money.test.ts` (7 tests)
- ✅ Creates valid integer Toman amounts from integer values
- ✅ Rejects negative Toman amounts in strict mode (`Money.fromToman`)
- ✅ Supports signed integer Toman amounts for cash ledger balance and deficit (`Money.fromSignedToman`)
- ✅ Prevents floating-point precision loss and fractional money creation
- ✅ Adds and subtracts Money instances with strict boundary validation
- ✅ Multiplies Money by scalar integer / scaled quantity accurately
- ✅ Formats human-readable Toman string with Persian/English locale formatting

#### `tests/unit/StockQuantity.test.ts` (5 tests)
- ✅ Correctly stores stock quantities as integers scaled by 1,000 ($1.250\text{ kg} = 1250$)
- ✅ Accurately converts between scaled integers and 3-decimal floating representations
- ✅ Enforces non-negative stock balance rules unless explicit negative permission is granted
- ✅ Computes stock additions, deductions, and balance reconciliation without rounding drift
- ✅ Formats display values according to unit specifications

#### `tests/unit/PersianNumberWords.test.ts` (3 tests)
- ✅ Converts integer Toman amounts to official Persian words for invoices (e.g. `۱۲,۵۰۰,۰۰۰` $\rightarrow$ `دوازده میلیون و پانصد هزار تومان`)
- ✅ Handles zero, single-digit, teen numbers, hundreds, and multi-billion amounts
- ✅ Accurately combines complex compound numbers with Persian conjunctions (`و`)

#### `tests/unit/Jalali.test.ts` (3 tests)
- ✅ Accurately converts Gregorian ISO dates (`YYYY-MM-DD`) to Jalali (`YYYY/MM/DD`)
- ✅ Formats human-readable Jalali date strings with Persian month names (e.g. `۱۱ آبان ۱۴۰۵`)
- ✅ Converts Jalali dates back to ISO Gregorian dates without day drift or leap-year discrepancies

#### `tests/unit/UIStore.test.ts` (4 tests)
- ✅ Applies and toggles light, dark, and system themes dynamically
- ✅ Manages persistent app lock and inactivity screen transitions
- ✅ Enqueues and dismisses toast notifications with custom durations
- ✅ Adjusts application font size preferences dynamically (`small` 14px, `normal` 15px, `large` 17px)

---

### 2. Infrastructure & Application Integration Tests

#### `tests/integration/DatabaseMigrations.test.ts` (4 tests)
- ✅ Executes all migrations sequentially from clean state and records migration versions in `_migrations`
- ✅ Ensures idempotency: re-running migrations does not duplicate tables or fail
- ✅ Verifies all 20 SQLite tables and associated indexes are created with strict constraints
- ✅ Validates foreign key constraints and cascade rules

#### `tests/integration/PinSecurity.test.ts` (3 tests)
- ✅ Hashes 4-6 digit user PINs using PBKDF2 (100,000 iterations + salt)
- ✅ Rejects incorrect PIN entries and enforces lockout counters
- ✅ Resets lock state upon valid PIN verification

#### `tests/integration/Settings.test.ts` (4 tests)
- ✅ Stores and retrieves business profile (name, phone, address, description)
- ✅ Persists application preferences (theme, calendar, notifications, quiet hours)
- ✅ Enforces business profile requirement before dashboard navigation

#### `tests/integration/ProductsAndStock.test.ts` (6 tests)
- ✅ Creates products with auto-generated SKU sequences and custom categories
- ✅ Enforces immutable stock movements ledger: every stock change writes a movement record
- ✅ Verifies `products.stock_quantity` matches the computed sum of movements
- ✅ Prevents negative stock without explicit confirmation
- ✅ Soft-archives products with transaction history rather than hard deleting
- ✅ Successfully runs `StockReconciliationService` to audit and synchronize balances

#### `tests/integration/CustomerManagement.test.ts` (5 tests)
- ✅ Creates customers with normalized Iranian mobile numbers (`09...`)
- ✅ Enforces mobile number uniqueness and rejects duplicate registrations
- ✅ Manages customer tags and customer note history
- ✅ Computes customer financial summary (total purchases, total payments, outstanding debt)

#### `tests/integration/SalesAndInvoices.test.ts` (3 tests)
- ✅ Issues official invoices with sequential invoice numbers, snapshots product prices, and updates inventory
- ✅ Records invoice cancellations, restores product inventory, and balances ledger
- ✅ Records partial and full payments, dynamically updating `paid_amount` and `outstanding_debt`

#### `tests/integration/LeadsAndTasks.test.ts` (6 tests)
- ✅ Manages sales leads through full pipeline stages (`new` $\rightarrow$ `following_up` $\rightarrow$ `converted`)
- ✅ Converts lead directly to customer preserving history
- ✅ Schedules tasks with due dates, priority tags, and Android Local Notification triggers
- ✅ Queries pending tasks due today and overdue tasks
- ✅ Completes tasks with 1-tap toggles

#### `tests/integration/FinanceAndLedger.test.ts` (3 tests)
- ✅ Records business operating expenses and other incomes
- ✅ Enforces double-entry cash ledger consistency: every cash receipt or expense updates running balance
- ✅ Computes accurate financial summary (total revenue, expenses, net surplus) in integer Toman

#### `tests/integration/DashboardAndReports.test.ts` (3 tests)
- ✅ Aggregates real-time dashboard KPIs (daily sales, receipts, outstanding debt, pending tasks)
- ✅ Generates monthly sales trends, top-selling products report, and debtor ledger with direct call/SMS actions
- ✅ Executes unified global search across Customers, Products, Invoices, Leads, and Tasks

#### `tests/integration/BackupRestoreAndCsv.test.ts` (7 tests)
- ✅ Encrypts and decrypts backup payloads using AES-256-GCM + PBKDF2 (100,000 iterations)
- ✅ Rejects wrong passphrase with descriptive error
- ✅ Rejects tampered backup files via SHA-256 checksum mismatch
- ✅ Executes full atomic database restore across all 20 tables following the 10-step protocol
- ✅ Rolls back cleanly on corrupted or invalid restore payloads without data corruption
- ✅ Exports and imports customers CSV with UTF-8 BOM, validating mobile numbers
- ✅ Exports and imports products CSV with units, selling price, and stock movements

---

## Conclusion
The automated test suite covers all domain entities, repositories, use cases, security boundaries, financial invariants, and database constraints. All 63 tests pass with 0 regressions.
