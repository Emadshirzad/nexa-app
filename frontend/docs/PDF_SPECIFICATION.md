# Nexa CRM — PDF Invoice Specification

## 1. Document Format & Geometry
- **Standard Size:** ISO 216 A4 Portrait ($210\text{mm} \times 297\text{mm}$).
- **Margins:** Top/Bottom $15\text{mm}$, Left/Right $15\text{mm}$.
- **Color Scheme:** Minimal White background, Graphite (`#17212B`) headings, Emerald (`#10B981`) table borders and brand accents.

## 2. Persian RTL & Font Rendering
- **Typography:** `IRANSansX` font embedded directly in the document.
- **Bi-Directional Shaping:** Proper Persian character joining (initial, medial, final, isolated forms) and RTL word ordering.
- **Numerals:** Financial figures formatted in English digits with standard comma separation (e.g. `۱۲,۵۰۰,۰۰۰` or `12,500,000 تومان`).
- **Date:** Jalali date format (e.g. `۱۴۰۵/۰۸/۱۱`).

## 3. Invoice Layout Sections
1. **Header Section:**
   - Business Name & Contact Info (from `business_profile`)
   - Invoice Title ("فاکتور رسمی فروش")
   - Invoice Number (`INV-000101`) & Date
2. **Customer Information Section:**
   - Buyer Name, Mobile, and Address (or "مشتری عمومی / نقدی" if walk-in).
3. **Itemized Table:**
   - Columns: ردیف (Row), نام کالا/خدمات (Description), تعداد/مقدار (Qty), واحد (Unit), فی (Unit Price), تخفیف (Discount), مبلغ کل (Line Total).
4. **Summary & Settlement Section:**
   - Subtotal (جمع کل)
   - Total Discount (مجموع تخفیف)
   - Final Payable (مبلغ قابل پرداخت - Toman)
   - Amount in Words (مبلغ به حروف: مثلاً دوازده میلیون و پانصد هزار تومان)
   - Payment Record (مبالغ دریافتی / مانده بدهی)
5. **Footer Section:**
   - Notes, signature boxes for seller and buyer, no watermarks unless cancelled.

## 4. Mobile UX & Sharing
- In-app zoomable preview.
- One-tap button to share via native Android Sharesheet (`@capacitor/share` to WhatsApp, Telegram, Email, Bluetooth).
- Filename: Standardized based on invoice number (e.g., `INV-000101.pdf`).
