# Nexa CRM — Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-RC1] - 2026-11-02

### Added
- **Core Architecture & Platform (Phase 1):**
  - Clean Architecture layers (`domain`, `application`, `infrastructure`, `presentation`, `shared`).
  - Capacitor 8 Android integration with portrait orientation lock and minimum SDK 28 (Android 9.0).
  - Modern Minimal mobile design system with Persian RTL layout and IRANSansX font.
- **Database & Security (Phase 2):**
  - SQLite database driver abstraction supporting Better-SQLite3 (tests) and Capacitor SQLite (Android).
  - 20-table schema migration runner with WAL journal mode, transactions, and foreign keys.
  - PBKDF2 (100,000 iterations) salted PIN hashing and biometric authentication lock.
  - 15-minute user inactivity auto-lock and emergency quick-lock.
- **Business Profile & Preferences (Phase 3):**
  - Initial setup onboarding workflow and persistent business profile.
  - Preferences storage for themes (system/light/dark), Jalali calendar, and quiet hours.
- **Product & Inventory Management (Phase 4):**
  - Product catalog with categories, unit options, and auto-incrementing SKU sequences.
  - Stock quantity scaling by 1,000 to prevent floating-point rounding errors.
  - Immutable stock movements ledger tracking additions, deductions, and adjustments.
  - Stock reconciliation domain service.
- **Customer Management & CRM (Phase 5):**
  - Customer registry with unique Iranian mobile validation (`09...`).
  - Customer tags, historical interaction notes, and real-time outstanding debt calculation.
- **Sales, Invoices & Persian PDF (Phase 6):**
  - Invoice issuance workflow with product price snapshots, item discounts, and upfront payments.
  - Invoice cancellation with automatic inventory restock and ledger adjustment.
  - Official A4 invoice generator with Persian RTL layout, embedded typography, and number words.
  - Print (`window.print()`), PDF preview, and native Android Sharesheet export.
- **Leads, Tasks & Local Notifications (Phase 7):**
  - Sales lead pipeline management (`new`, `following_up`, `converted`, `rejected`).
  - Lead-to-customer conversion workflow.
  - Task scheduling with priority tags and Android Local Notifications.
  - Quiet hours automatic reminder suppression.
- **Finance & Cash Ledger (Phase 8):**
  - Operating expenses and other income tracking.
  - Double-entry global cash ledger with running balance tracking and net surplus calculation.
  - Integer Toman financial arithmetic via `Money` value object.
- **Dashboard, Reports & Global Search (Phase 9):**
  - Real-time dashboard KPI metrics (today sales, receipts, outstanding debt, pending tasks).
  - Recent invoices widget and 1-tap task completion.
  - Comprehensive analytical reports: monthly sales trends, top-selling products, debtor ledger with direct call/SMS actions, low-stock inventory alerts.
  - Unified real-time global search across Customers, Products, Invoices, Leads, and Tasks.
- **Backup, Restore & Release Readiness (Phase 10):**
  - `.nxbak` encrypted backup format using AES-256-GCM + PBKDF2 (100,000 iterations).
  - Atomic 10-step safe database restore protocol with rollback guarantee and integrity check.
  - UTF-8 BOM CSV export and import for Customers and Products with row-level validation.
  - Release Candidate verification report, test report (63/63 passing), and SHA-256 checksums.
