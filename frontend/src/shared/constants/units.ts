export interface UnitOption {
  value: string;
  label: string;
}

export const PRODUCT_UNITS: UnitOption[] = [
  { value: 'piece', label: 'عدد' },
  { value: 'package', label: 'بسته' },
  { value: 'kilogram', label: 'کیلوگرم' },
  { value: 'kg', label: 'کیلوگرم' },
  { value: 'gram', label: 'گرم' },
  { value: 'meter', label: 'متر' },
  { value: 'liter', label: 'لیتر' },
  { value: 'box', label: 'جعبه' },
  { value: 'carton', label: 'کارتن' },
  { value: 'set', label: 'ست / دست' }
];

export function getUnitLabel(unitValue: string): string {
  const match = PRODUCT_UNITS.find((u) => u.value === unitValue);
  return match ? match.label : unitValue;
}
