# Nexa CRM — Master Implementation Plan

## Overview
This implementation plan breaks the application down into 10 structured, vertical slices as prescribed in Section 26 of the master prompt.

---

### Phase 1: Foundation & Project Scaffolding
- [ ] Initialize Git repository and project configuration.
- [ ] Setup `package.json` with pinned versions (Vue 3, Vite, TypeScript, Tailwind CSS, Pinia, Vue Router, Lucide, Zod, Vitest).
- [ ] Configure Tailwind CSS with custom brand palette (`#17212B`, `#243746`, `#10B981`, `#E8F5EF`), RTL support, and `IRANSansX` font setup.
- [ ] Configure TypeScript strict mode and clean architectural path aliases (`@domain`, `@application`, `@infrastructure`, `@presentation`, `@shared`).
- [ ] Setup Vitest testing environment.
- [ ] Scaffold base layouts (MainLayout with 5-section bottom navigation, FocusedLayout, AuthLayout).
- [ ] Initialize Capacitor and Android native project structure.

### Phase 2: Database Engine, Migrations & Security
- [ ] Configure `@capacitor-community/sqlite` with SQLCipher encryption support.
- [ ] Implement database connection manager and transaction runner.
- [ ] Create initial database migration (`001_initial_schema.sql`) creating all 21 core tables, constraints, and indexes.
- [ ] Implement automated migration runner with pre-migration safety snapshots.
- [ ] Implement App Lock security service (PIN hash/salt via PBKDF2/WebCrypto, BiometricPrompt bridge, 15-minute inactivity timer).
- [ ] Unit & Integration tests for database transactions and migration runner.

### Phase 3: Business Profile & Settings
- [ ] First-launch detection and `/onboarding` wizard.
- [ ] Business profile setup and edit use cases.
- [ ] App settings: Theme (Light/Dark/System), Jalali calendar display, Quiet hours.
- [ ] Persistent settings storage and reactive UI theme switcher.

### Phase 4: Product & Inventory Management
- [ ] Product catalog domain models, DTOs, and Zod validators.
- [ ] Scaled integer stock calculation service ($quantity \times 1000$).
- [ ] Immutable stock movement ledger implementation (`stock_movements`).
- [ ] Product CRUD with category selector, custom category creation, and automatic SKU generator.
- [ ] Stock adjustment with mandatory reason and negative stock confirmation dialog.
- [ ] Product archive/restore behavior (preventing hard deletion of active history).

### Phase 5: Customer Management & Debt Ledger
- [ ] Customer entity, mobile number validation, uniqueness enforcement.
- [ ] Customer tags and chronological notes.
- [ ] Financial aggregation: Total purchases and current outstanding debt calculation.
- [ ] Direct phone call, SMS, and messaging intent triggers.
- [ ] Anonymous / Walk-in customer support for counter sales.

### Phase 6: Sales, Invoicing & PDF Generation
- [ ] Invoice builder use case: item selection, line-item snapshotting, line discounts, invoice-level discount.
- [ ] Atomic invoice issuance: state transition to `issued`, automated stock deduction, invoice number generation.
- [ ] Idempotent invoice cancellation: cancellation reason requirement, compensatory stock movement restoration.
- [ ] Payment recording: partial payments, multiple payment methods, atomic cash ledger synchronization.
- [ ] High-fidelity Persian A4 PDF generator with embedded IRANSansX font and Android Sharesheet integration.

### Phase 7: Leads, Tasks & Local Notifications
- [ ] Lead pipeline management: New, Following Up, Interested, Converted, Unsuccessful, Rejected.
- [ ] Lead-to-Customer conversion use case (atomic transfer, preserving lead history, duplicate detection).
- [ ] Task management with priority (Normal, Urgent), status (Pending, In Progress, Completed), and entity relations.
- [ ] Android Local Notifications scheduling respecting configurable Quiet Hours.

### Phase 8: Finance & Cash Ledger
- [ ] Single global cash account ledger (`cash_transactions`).
- [ ] Expense logging with custom expense categories.
- [ ] Other income tracking.
- [ ] Integer Toman balance calculation and ledger reconciliation.
- [ ] Financial summary reports (Income vs. Expense, Net Cashflow).

### Phase 9: Dashboard, Reports & Global Search
- [ ] Compact, mobile-first Dashboard with real-time financial KPIs, daily sales, outstanding debts, and low-stock alerts.
- [ ] Reports module: Daily & Monthly sales trends, top-selling products, debtor ledger.
- [ ] Instant Global Search across Customers, Products, Invoices, Leads, and Tasks.

### Phase 10: Backup, Restore, CSV & Release Preparation
- [ ] AES-256-GCM encrypted backup archive export.
- [ ] Strict 10-step safe restore protocol with temporary database verification.
- [ ] CSV import/export for Products and Customers with row-level validation.
- [ ] Android release build configuration, ProGuard optimization, release APK signing, and SHA-256 verification.
- [ ] Final UAT execution and Go/No-Go formal sign-off.
