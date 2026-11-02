/**
 * Converts integer numbers to Persian words (عدد به حروف)
 */

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function convertThreeDigits(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];

  const h = Math.floor(num / 100);
  const remainder = num % 100;

  if (h > 0) {
    parts.push(HUNDREDS[h]);
  }

  if (remainder >= 10 && remainder <= 19) {
    parts.push(TEENS[remainder - 10]);
  } else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    if (t > 0) parts.push(TENS[t]);
    if (o > 0) parts.push(ONES[o]);
  }

  return parts.join(' و ');
}

export function numberToPersianWords(value: number): string {
  if (value === 0) return 'صفر';
  if (value < 0) return `منفی ${numberToPersianWords(Math.abs(value))}`;

  const groups: number[] = [];
  let temp = Math.floor(value);

  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i];
    if (groupValue > 0) {
      const groupText = convertThreeDigits(groupValue);
      const scaleText = SCALES[i];
      if (scaleText) {
        parts.push(`${groupText} ${scaleText}`);
      } else {
        parts.push(groupText);
      }
    }
  }

  return parts.join(' و ');
}

export function tomanToPersianWords(amountToman: number): string {
  if (amountToman === 0) return 'صفر تومان';
  return `${numberToPersianWords(amountToman)} تومان`;
}
