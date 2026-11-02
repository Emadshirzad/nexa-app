import { describe, it, expect } from 'vitest';
import { StockQuantity, InvalidStockQuantityError } from '@/domain/value-objects/StockQuantity';

describe('StockQuantity Value Object', () => {
  it('creates stock quantity from scaled integer (1.250 kg = 1250)', () => {
    const stock = StockQuantity.fromScaled(1250);
    expect(stock.scaledValue).toBe(1250);
    expect(stock.toDecimal()).toBe(1.25);
    expect(stock.format('کیلوگرم')).toBe('1.25 کیلوگرم');
  });

  it('creates stock quantity from decimal accurately', () => {
    const stock = StockQuantity.fromDecimal(2.75);
    expect(stock.scaledValue).toBe(2750);
    expect(stock.toDecimal()).toBe(2.75);
  });

  it('rejects non-integer scaled quantities', () => {
    expect(() => StockQuantity.fromScaled(1250.5)).toThrowError(InvalidStockQuantityError);
  });

  it('supports addition and subtraction with scaled precision', () => {
    const initial = StockQuantity.fromDecimal(5.0); // 5000
    const sale = StockQuantity.fromDecimal(1.35); // 1350
    const remaining = initial.subtract(sale);

    expect(remaining.scaledValue).toBe(3650);
    expect(remaining.toDecimal()).toBe(3.65);

    const restored = remaining.add(sale);
    expect(restored.scaledValue).toBe(5000);
    expect(restored.toDecimal()).toBe(5);
  });

  it('formats whole numbers cleanly without redundant zeroes', () => {
    const pieces = StockQuantity.fromDecimal(10);
    expect(pieces.format('عدد')).toBe('10 عدد');
  });
});
