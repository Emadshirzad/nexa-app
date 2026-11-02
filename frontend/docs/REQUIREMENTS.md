# Nexa CRM — System Requirements Specification

## 1. Functional Requirements

### 1.1 Business Profile & Onboarding
- **FR-ONB-01:** Mandatory onboarding wizard on first launch requiring:
  - Business Name
  - Contact Mobile/Phone
  - Optional Address and Business Description
- **FR-ONB-02:** Profile settings editable at any time under Settings.

### 1.2 Product & Inventory Management
- **FR-PRD-01:** Support product creation with Name, Category, SKU (auto-generated or manual), Unit, Selling Price (Integer Toman), Initial Stock, and Minimum Stock Threshold.
- **FR-PRD-02:** Units supported: Piece (عدد), Package (بسته), Kilogram (کیلوگرم), Gram (گرم), Meter (متر), Liter (لیتر), Box (جعبه), Carton (کارتن).
- **FR-PRD-03:** Stock precision: 3 decimal places represented as scaled integer ($quantity \times 1000$).
- **FR-PRD-04:** Immutable stock movements recording movement type (Initial, Addition, Deduction, Adjustment, Invoice Sale, Invoice Cancellation), quantity, reference ID, reason, and timestamp.
- **FR-PRD-05:** Prevent hard deletion of products with historical transactions (archive only).
- **FR-PRD-06:** Negative stock warning requiring explicit user confirmation before recording.

### 1.3 Customer Management
- **FR-CST-01:** Customer records containing: Name, Mobile (unique), Landline, Address, Notes, Custom Tags, and Follow-up Date.
- **FR-CST-02:** In-depth customer view showing:
  - Aggregated purchase history
  - Current outstanding debt
  - Direct communication links (phone call, SMS, messaging)
  - Notes & activity history
- **FR-CST-03:** Prevent duplicate mobile numbers.
- **FR-CST-04:** Support anonymous / walk-in sales without customer binding.

### 1.4 Lead Management & CRM Pipeline
- **FR-LED-01:** Capture leads with Name, Mobile, Contact Channels, Status, Description, and Next Follow-up Date.
- **FR-LED-02:** Status transitions: New, Following Up, Interested, Converted, Unsuccessful, Rejected.
- **FR-LED-03:** Lead conversion into Customer:
  - Atomic transfer of contact details to `customers` table
  - Mark lead as Converted with link to new customer ID
  - Prevention of duplicate customer records

### 1.5 Task & Reminder Management
- **FR-TSK-01:** Manage tasks with Title, Description, Due Date (Jalali), Priority (Normal, Urgent), and Status (Pending, In Progress, Completed).
- **FR-TSK-02:** Optional entity associations: Customer, Lead, or Invoice.
- **FR-TSK-03:** Filter views: Today, Upcoming, Overdue, Completed.
- **FR-TSK-04:** Android Local Notifications for scheduled tasks respecting configurable Quiet Hours.

### 1.6 Sales & Invoicing
- **FR-INV-01:** Sequential automated invoice numbering (e.g., `INV-000101`).
- **FR-INV-02:** Multi-item invoice composition with line-item discounts and overall invoice discount.
- **FR-INV-03:** Historical snapshot: Store product name, SKU, unit, and unit price in `invoice_items` at issuance.
- **FR-INV-04:** Immutable state machine: Draft -> Issued -> Cancelled.
- **FR-INV-05:** Idempotent invoice cancellation:
  - Requires mandatory cancellation reason.
  - Automatically generates compensating stock movements restoring inventory exactly once.
- **FR-INV-06:** Multiple payments per invoice (Cash, Card Transfer, POS, Bank Transfer, Other).

### 1.7 Finance & Cash Ledger
- **FR-FIN-01:** Single global cash ledger recording opening balance, invoice receipts, business expenses, and other revenues.
- **FR-FIN-02:** Outstanding customer debt tracking:
  $$\text{Debt} = \sum \text{Issued Invoices Total} - \sum \text{Valid Payments}$$
- **FR-FIN-03:** All monetary values stored as 64-bit integer Toman. Zero floating-point arithmetic.
- **FR-FIN-04:** Expense management categorized with custom categories.

### 1.8 PDF Invoicing
- **FR-PDF-01:** Generate standard A4 official invoice in Persian RTL format.
- **FR-PDF-02:** High-fidelity IRANSansX font embedding and Persian text shaping (connecting Arabic/Persian letters and Persian/English numbers).
- **FR-PDF-03:** In-app preview and direct sharing via Android Sharesheet (`@capacitor/share`).

### 1.9 Security, Backup & Restore
- **FR-SEC-01:** App lock using 4–6 digit PIN and Biometric Authentication (Fingerprint / Face Unlock).
- **FR-SEC-02:** Encrypted backup generation using AES-256-GCM with PBKDF2 key derivation.
- **FR-SEC-03:** Safe restore procedure with pre-restore active database snapshot and integrity validation prior to database replacement.

---

## 2. Non-Functional Requirements
- **NFR-PERF-01:** Cold startup time $< 1.8\text{s}$ on mid-range Android devices.
- **NFR-PERF-02:** Search queries across 5,000 customers/products resolve in $< 80\text{ms}$.
- **NFR-OFFLINE-01:** Zero network calls required for any business feature.
- **NFR-A11Y-01:** Minimum touch target size $48 \times 48\text{dp}$.
- **NFR-COMPAT-01:** Support Android 9.0 (API level 28) up to latest Android versions (API 34/35).
