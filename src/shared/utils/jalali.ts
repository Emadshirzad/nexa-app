import jalaali from 'jalaali-js';

export interface JalaaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export const PERSIAN_MONTH_NAMES = [
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

export const JALALI_MONTHS = PERSIAN_MONTH_NAMES;

export const JALALI_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

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

export const formatJalali = toJalaliString;

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

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

export function isoDateToParts(iso: string): JalaaliDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const j = jalaali.toJalaali(Number(m[1]), Number(m[2]), Number(m[3]));
  return { jy: j.jy, jm: j.jm, jd: j.jd };
}

export function jalaaliPartsToIso({ jy, jm, jd }: JalaaliDate): string {
  const g = jalaali.toGregorian(jy, jm, jd);
  const mm = String(g.gm).padStart(2, '0');
  const dd = String(g.gd).padStart(2, '0');
  return `${g.gy}-${mm}-${dd}`;
}

export function jalaaliMonthLength(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

export function jalaaliWeekStartDay({ jy, jm }: { jy: number; jm: number }): number {
  const iso = jalaaliPartsToIso({ jy, jm, jd: 1 });
  const date = new Date(`${iso}T00:00:00`);
  // Saturday = 0 for the Persian calendar week
  return (date.getDay() + 1) % 7;
}

export function formatJalaliDisplay(iso: string | null | undefined, withYear = true): string {
  if (!iso) return '';
  const j = isoDateToParts(iso);
  if (!j) return iso;
  const base = `${toPersianDigits(j.jd)} ${PERSIAN_MONTH_NAMES[j.jm - 1]}`;
  return withYear ? `${base} ${toPersianDigits(j.jy)}` : base;
}

export function jalaaliToday(): JalaaliDate {
  const now = new Date();
  return jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function isoToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
