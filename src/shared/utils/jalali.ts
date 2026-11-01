import jalaali from 'jalaali-js';

const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

/**
 * Returns current date in Jalali format: YYYY/MM/DD (English numerals)
 */
export function getTodayJalali(): string {
  const now = new Date();
  const j = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const month = String(j.jm).padStart(2, '0');
  const day = String(j.jd).padStart(2, '0');
  return `${j.jy}/${month}/${day}`;
}

/**
 * Converts a Gregorian Date object or ISO string (YYYY-MM-DD) to Jalali (YYYY/MM/DD)
 */
export function toJalaliString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return '';
  }
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const month = String(j.jm).padStart(2, '0');
  const day = String(j.jd).padStart(2, '0');
  return `${j.jy}/${month}/${day}`;
}

/**
 * Formats a Jalali date with Persian month name:
 * e.g. "1405/08/11" -> "11 آبان 1405"
 */
export function formatJalaliHuman(jalaliStr: string): string {
  if (!jalaliStr) return '';
  const parts = jalaliStr.replace(/-/g, '/').split('/');
  if (parts.length !== 3) return jalaliStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = PERSIAN_MONTH_NAMES[monthIdx] || parts[1];
  return `${day} ${monthName} ${year}`;
}

/**
 * Converts a Jalali string (YYYY/MM/DD) to ISO Date string (YYYY-MM-DD)
 */
export function jalaliToIso(jalaliStr: string): string {
  if (!jalaliStr) return '';
  const parts = jalaliStr.replace(/-/g, '/').split('/');
  if (parts.length !== 3) return '';
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  const g = jalaali.toGregorian(jy, jm, jd);
  const m = String(g.gm).padStart(2, '0');
  const d = String(g.gd).padStart(2, '0');
  return `${g.gy}-${m}-${d}`;
}
