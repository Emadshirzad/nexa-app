# Nexa CRM — User Flows

## 1. First-Time Setup & Onboarding Flow
1. App is opened for the first time.
2. System checks `business_profile` table.
3. If empty, redirects to `/onboarding`.
4. User enters Business Name, Phone Number, Optional Address, and sets optional 4-6 digit PIN.
5. Setup transaction completes; user is redirected to `/dashboard`.

## 2. Fast Invoice Creation Flow
1. User taps **+ فاکتور جدید** (New Invoice) on Dashboard or Invoices Tab.
2. User selects an existing Customer or chooses "مشتری گذری" (Walk-in / Cash Customer).
3. User adds line items:
   - Selects Product from catalog (or creates a quick item).
   - Enters quantity and optional line-item discount.
   - Dynamic recalculation of line total, subtotal, and total discount.
4. User sets optional overall invoice discount and enters notes.
5. User reviews summary: Final Amount in Toman.
6. User taps **ثبت و صدور فاکتور** (Issue Invoice):
   - Generates unique invoice number (e.g. `INV-000101`).
   - Copies snapshot of product name, SKU, price, and unit.
   - Creates atomic stock deduction movement in `stock_movements`.
   - Transitions status to `issued`.
7. User can immediately record a partial or full payment or generate an A4 PDF preview.

## 3. Invoice Cancellation Flow (Idempotent)
1. User opens an issued invoice at `/invoices/:id`.
2. Taps **ابطال فاکتور** (Cancel Invoice).
3. A confirmation dialog appears requesting the mandatory **دلیل ابطال** (Cancellation Reason).
4. On submit, use case checks:
   - If status is already `cancelled`, abort with no-op.
   - Validates that cancellation movements have not been recorded yet.
5. In an atomic transaction:
   - Sets status to `cancelled`, records `cancelled_at` and `cancellation_reason`.
   - Creates compensatory stock movements (`movement_type = 'invoice_cancellation'`) restoring the exact snapshot quantities to inventory.
   - Reconciles product cached stock quantity.
6. Notifies user with toast; UI updates to show watermark "ابطال شده".

## 4. Lead-to-Customer Conversion Flow
1. User views active lead at `/leads/:id`.
2. Taps **تبدیل به مشتری** (Convert to Customer).
3. Confirmation dialog displays pre-filled details (Name, Mobile, Notes).
4. On confirm:
   - Checks if mobile already exists in `customers`. If duplicate, warns user and links to existing record.
   - Inserts customer record.
   - Updates `leads.status = 'converted'`, `converted_customer_id = customer.id`.
   - Creates activity log entry.
5. Navigates smoothly to the newly created customer profile.
