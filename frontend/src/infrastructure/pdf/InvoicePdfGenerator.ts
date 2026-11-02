import type { Invoice } from '@/domain/entities/Invoice';
import type { BusinessProfile } from '@/domain/entities/BusinessProfile';
import type { Customer } from '@/domain/entities/Customer';
import { formatJalali } from '@/shared/utils/jalali';
import { tomanToPersianWords } from '@/shared/utils/persianNumberWords';
import { getUnitLabel } from '@/shared/constants/units';

export class InvoicePdfGenerator {
  public static renderHtml(
    invoice: Invoice,
    profile: BusinessProfile,
    customer?: Customer | null
  ): string {
    const isCancelled = invoice.isCancelled();
    const formattedDate = formatJalali(invoice.invoiceDate);

    const itemsRows = invoice.items
      .map((item, index) => {
        const unit = getUnitLabel(item.unitSnapshot);
        const qty = item.quantity.toDecimal();
        const price = item.unitPriceSnapshot.format();
        const discount = item.discountAmount.value > 0 ? item.discountAmount.format() : '۰';
        const lineTotal = item.lineTotal.format();

        return `
        <tr>
          <td style="text-align: center; width: 40px;">${index + 1}</td>
          <td>
            <strong>${item.productNameSnapshot}</strong>
            ${item.skuSnapshot ? `<div style="font-size: 10px; color: #64748b;">کد: ${item.skuSnapshot}</div>` : ''}
          </td>
          <td style="text-align: center; width: 70px;">${qty}</td>
          <td style="text-align: center; width: 60px;">${unit}</td>
          <td style="text-align: left; width: 100px;">${price}</td>
          <td style="text-align: left; width: 85px;">${discount}</td>
          <td style="text-align: left; width: 110px; font-weight: bold;">${lineTotal}</td>
        </tr>
      `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاکتور فروش ${invoice.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: IRANSansX, Tahoma, sans-serif;
      margin: 0;
      padding: 16px;
      color: #17212b;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.5;
      direction: rtl;
    }
    .invoice-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }
    .cancelled-banner {
      background-color: #fee2e2;
      border: 1px solid #ef4444;
      color: #b91c1c;
      padding: 8px 16px;
      text-align: center;
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 12px;
      border-radius: 6px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      background: #f8fafc;
      border-bottom: 2px solid #10b981;
      padding: 14px 18px;
    }
    .header-title {
      font-size: 18px;
      font-weight: 800;
      color: #17212b;
      margin: 0 0 4px 0;
    }
    .header-sub {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
    .meta-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      display: inline-block;
      text-align: right;
    }
    .meta-item {
      margin-bottom: 4px;
      font-size: 11px;
    }
    .meta-item:last-child {
      margin-bottom: 0;
    }
    .meta-item strong {
      color: #243746;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 12px 16px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
    }
    .party-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .party-title {
      font-size: 11px;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .party-detail {
      font-size: 11px;
      color: #334155;
      margin-bottom: 3px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th {
      background: #243746;
      color: #ffffff;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 600;
      border-left: 1px solid #334155;
      text-align: right;
    }
    .items-table th:last-child {
      border-left: none;
    }
    .items-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      border-left: 1px solid #f1f5f9;
      font-size: 11px;
    }
    .items-table td:last-child {
      border-left: none;
    }
    .items-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .summary-section {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 12px;
      padding: 14px 16px;
      background: #f8fafc;
      border-top: 1px solid #cbd5e1;
    }
    .words-box {
      font-size: 11px;
      color: #475569;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .totals-table td {
      padding: 5px 8px;
    }
    .totals-table tr.grand-total td {
      font-size: 13px;
      font-weight: bold;
      color: #10b981;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      background: #e8f5ef;
    }
    .footer-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 24px 20px 16px;
      background: #ffffff;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
    .signature-line {
      margin-top: 40px;
      border-top: 1px dashed #cbd5e1;
      display: inline-block;
      width: 65%;
      padding-top: 4px;
    }
  </style>
</head>
<body>

  ${
    isCancelled
      ? `<div class="cancelled-banner">
          این فاکتور در تاریخ ${invoice.cancelledAt ? formatJalali(invoice.cancelledAt) : ''} ابطال گردیده است.
          ${invoice.cancellationReason ? `<br><span style="font-size:11px; font-weight:normal;">دلیل ابطال: ${invoice.cancellationReason}</span>` : ''}
        </div>`
      : ''
  }

  <div class="invoice-card">
    <div style="padding: 14px 18px; background: #f8fafc; border-bottom: 2px solid #10b981; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="header-title">${profile.name}</h1>
        <p class="header-sub">صورتحساب رسمی فروش کالا و خدمات</p>
      </div>
      <div class="meta-box">
        <div class="meta-item">شماره فاکتور: <strong>${invoice.invoiceNumber}</strong></div>
        <div class="meta-item">تاریخ صدور: <strong>${formattedDate}</strong></div>
        <div class="meta-item">وضعیت: <strong>${isCancelled ? 'ابطال‌شده' : 'صادرشده'}</strong></div>
      </div>
    </div>

    <!-- Seller & Buyer Section -->
    <div class="parties-grid">
      <div class="party-card">
        <div class="party-title">مشخصات فروشنده</div>
        <div class="party-detail"><strong>نام فروشگاه / کسب‌وکار:</strong> ${profile.name}</div>
        ${profile.phone ? `<div class="party-detail"><strong>شماره تماس:</strong> ${profile.phone}</div>` : ''}
        ${profile.address ? `<div class="party-detail"><strong>نشانی:</strong> ${profile.address}</div>` : ''}
      </div>

      <div class="party-card">
        <div class="party-title">مشخصات خریدار</div>
        <div class="party-detail"><strong>نام خریدار:</strong> ${customer ? customer.name : 'مشتری عمومی / نقدی'}</div>
        ${customer?.mobile ? `<div class="party-detail"><strong>شماره همراه:</strong> ${customer.mobile}</div>` : ''}
        ${customer?.address ? `<div class="party-detail"><strong>نشانی:</strong> ${customer.address}</div>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: center;">#</th>
          <th>شرح کالا / خدمات</th>
          <th style="text-align: center;">مقدار</th>
          <th style="text-align: center;">واحد</th>
          <th style="text-align: left;">مبلغ واحد (تومان)</th>
          <th style="text-align: left;">تخفیف</th>
          <th style="text-align: left;">مبلغ کل (تومان)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals & Settlements -->
    <div class="summary-section">
      <div>
        <div class="words-box">
          <div style="font-weight: bold; margin-bottom: 4px; color: #243746;">مبلغ کل به حروف:</div>
          <div>${tomanToPersianWords(invoice.finalAmount.value)}</div>
          ${
            invoice.notes
              ? `<div style="margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
                  <strong>یادداشت:</strong> ${invoice.notes}
                </div>`
              : ''
          }
        </div>
      </div>

      <div>
        <table class="totals-table">
          <tr>
            <td style="color: #64748b;">جمع کل اقلام:</td>
            <td style="text-align: left; font-weight: 600;">${invoice.subtotal.format()}</td>
          </tr>
          ${
            invoice.totalDiscount.value > 0
              ? `<tr>
                  <td style="color: #ef4444;">مجموع تخفیفات:</td>
                  <td style="text-align: left; color: #ef4444; font-weight: 600;">- ${invoice.totalDiscount.format()}</td>
                </tr>`
              : ''
          }
          <tr class="grand-total">
            <td>مبلغ قابل پرداخت:</td>
            <td style="text-align: left;">${invoice.finalAmount.format()}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">مبلغ پرداخت‌شده:</td>
            <td style="text-align: left; color: #10b981; font-weight: 600;">${invoice.paidAmount.format()}</td>
          </tr>
          ${
            invoice.outstandingDebt.value > 0
              ? `<tr>
                  <td style="color: #b91c1c; font-weight: bold;">مانده بدهی:</td>
                  <td style="text-align: left; color: #b91c1c; font-weight: bold;">${invoice.outstandingDebt.format()}</td>
                </tr>`
              : `<tr>
                  <td colspan="2" style="text-align: center; color: #10b981; font-weight: bold; padding-top: 6px;">تسویه کامل شده است</td>
                </tr>`
          }
        </table>
      </div>
    </div>

    <!-- Signatures -->
    <div class="footer-signatures">
      <div>
        مهر و امضای فروشنده
        <br>
        <span class="signature-line"></span>
      </div>
      <div>
        امضای خریدار
        <br>
        <span class="signature-line"></span>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  public static print(
    invoice: Invoice,
    profile: BusinessProfile,
    customer?: Customer | null
  ): void {
    const html = this.renderHtml(invoice, profile, customer);

    // Create a hidden printing iframe to avoid disturbing the SPA DOM
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 300);
    }
  }

  public static async downloadHtml(
    invoice: Invoice,
    profile: BusinessProfile,
    customer?: Customer | null
  ): Promise<void> {
    const html = this.renderHtml(invoice, profile, customer);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public static async shareSummary(
    invoice: Invoice,
    profile: BusinessProfile,
    customer?: Customer | null
  ): Promise<void> {
    const itemsSummary = invoice.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.productNameSnapshot} (${it.quantity.toDecimal()} ${getUnitLabel(it.unitSnapshot)}) = ${it.lineTotal.format()} تومان`
      )
      .join('\n');

    const message = [
      `🧾 فاکتور فروش: ${invoice.invoiceNumber}`,
      `🏢 فروشنده: ${profile.name}`,
      `👤 خریدار: ${customer ? customer.name : 'مشتری عمومی'}`,
      `📅 تاریخ: ${formatJalali(invoice.invoiceDate)}`,
      `-----------------------`,
      itemsSummary,
      `-----------------------`,
      `مبلغ کل: ${invoice.finalAmount.format()} تومان`,
      `پرداخت‌شده: ${invoice.paidAmount.format()} تومان`,
      invoice.outstandingDebt.value > 0
        ? `مانده بدهی: ${invoice.outstandingDebt.format()} تومان`
        : 'وضعیت: تسویه کامل'
    ].join('\n');

    try {
      // Web Share API (supported on modern mobile/PWA browsers)
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `فاکتور ${invoice.invoiceNumber}`,
          text: message
        });
        return;
      }
      throw new Error('unsupported');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Fallback: copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
      }
    }
  }
}
