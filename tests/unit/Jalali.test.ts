import { describe, it, expect } from 'vitest';
import { toJalaliString, formatJalaliHuman, jalaliToIso } from '@/shared/utils/jalali';

describe('Jalali Date Utilities', () => {
  it('converts Gregorian date to Jalali YYYY/MM/DD', () => {
    // 2026-11-02 -> 1405/08/11 (or equivalent)
    const jalali = toJalaliString('2026-11-02');
    expect(jalali).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
    expect(jalali.startsWith('1405/')).toBe(true);
  });

  it('formats Jalali date into Persian human format', () => {
    const formatted = formatJalaliHuman('1405/08/11');
    expect(formatted).toBe('11 آبان 1405');
  });

  it('converts Jalali back to ISO date string', () => {
    const iso = jalaliToIso('1405/08/11');
    expect(iso).toBe('2026-11-02');
  });
});
