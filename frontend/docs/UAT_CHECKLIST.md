# Nexa CRM — User Acceptance Testing (UAT) Checklist

## 1. Onboarding & Business Profile
- [ ] Fresh install triggers onboarding screen.
- [ ] Submitting empty business name shows Persian validation error.
- [ ] Valid profile creation transitions to Dashboard.
- [ ] Settings allow editing profile details and updates are reflected immediately.

## 2. Product & Inventory Management
- [ ] Create product with unit piece (عدد) and price in Toman.
- [ ] Create product with fractional unit (کیلوگرم: 1.250 kg = 1250 units in DB).
- [ ] Duplicate SKU displays error.
- [ ] Stock adjustments require mandatory reason and create an immutable stock movement.
- [ ] Product with sales history cannot be deleted; archive toggle works.

## 3. Customer & Debt Management
- [ ] Customer created with valid mobile number.
- [ ] Duplicate mobile number rejected with friendly Persian message.
- [ ] Customer profile displays accurate total purchases and outstanding debt.
- [ ] Adding custom tags and filtering by tag works.

## 4. Sales & Invoicing
- [ ] Invoice creation with multiple items calculates correct line totals and subtotal.
- [ ] Line-item discount and overall invoice discount deducted accurately.
- [ ] Invoice issuance deducts inventory from products table and creates stock movement.
- [ ] Partial payment updates outstanding debt correctly.
- [ ] Invoice cancellation requires reason, marks invoice cancelled, and restores inventory exactly once.
- [ ] Repeated cancellation click has no duplicate effect (idempotent).

## 5. Persian PDF Invoicing
- [ ] Generates A4 invoice PDF with IRANSansX font.
- [ ] Persian text is properly shaped (connected letters, correct RTL direction).
- [ ] Digits are formatted cleanly in English numerals with comma grouping.
- [ ] Android Sharesheet opens and PDF can be shared to external apps.

## 6. Security, Backup & Restore
- [ ] App locks after 15 minutes of inactivity or when app is minimized.
- [ ] PIN unlock and biometric authentication work reliably.
- [ ] Encrypted backup generated and saved to device storage.
- [ ] Restoring backup on a new device or cleared app restores 100% of data.
- [ ] Restoring an invalid or tampered file fails safely without altering active data.
