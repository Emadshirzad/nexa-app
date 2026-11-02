/**
 * Money / Currency Formatting Utilities
 * Nexa CRM operates strictly with Integer Toman amounts.
 */

export function formatMoney(amountInToman: number | null | undefined): string {
  const val = amountInToman ?? 0;
  return Math.round(val).toLocaleString('en-US');
}

export function formatMoneyWithUnit(amountInToman: number | null | undefined): string {
  return `${formatMoney(amountInToman)} تومان`;
}
