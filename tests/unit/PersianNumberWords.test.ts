import { describe, it, expect } from 'vitest';
import { numberToPersianWords, tomanToPersianWords } from '@/shared/utils/persianNumberWords';

describe('persianNumberWords', () => {
  it('converts zero', () => {
    expect(numberToPersianWords(0)).toBe('صفر');
    expect(tomanToPersianWords(0)).toBe('صفر تومان');
  });

  it('converts small numbers', () => {
    expect(numberToPersianWords(5)).toBe('پنج');
    expect(numberToPersianWords(14)).toBe('چهارده');
    expect(numberToPersianWords(25)).toBe('بیست و پنج');
    expect(numberToPersianWords(100)).toBe('صد');
    expect(numberToPersianWords(315)).toBe('سیصد و پانزده');
  });

  it('converts thousands and millions in Toman', () => {
    expect(tomanToPersianWords(1250000)).toBe('یک میلیون و دویست و پنجاه هزار تومان');
    expect(tomanToPersianWords(45000000)).toBe('چهل و پنج میلیون تومان');
  });
});
