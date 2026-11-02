import { describe, it, expect } from 'vitest';
import { Money, InvalidMoneyError } from '@/domain/value-objects/Money';

describe('Money Value Object', () => {
  it('creates money from integer Toman', () => {
    const money = Money.fromToman(15000);
    expect(money.value).toBe(15000);
    expect(money.format()).toBe('15,000 تومان');
  });

  it('rejects floating-point amounts to prevent financial rounding drift', () => {
    expect(() => Money.fromToman(100.5)).toThrowError(InvalidMoneyError);
    expect(() => Money.fromToman(1250.99)).toThrowError(InvalidMoneyError);
  });

  it('rejects negative amounts', () => {
    expect(() => Money.fromToman(-500)).toThrowError(InvalidMoneyError);
  });

  it('safely adds money', () => {
    const m1 = Money.fromToman(10000);
    const m2 = Money.fromToman(25000);
    const sum = m1.add(m2);
    expect(sum.value).toBe(35000);
    expect(sum.format()).toBe('35,000 تومان');
  });

  it('safely subtracts money and rejects negative results', () => {
    const m1 = Money.fromToman(50000);
    const m2 = Money.fromToman(20000);
    const diff = m1.subtract(m2);
    expect(diff.value).toBe(30000);

    // Attempting to subtract more than current amount throws
    expect(() => diff.subtract(Money.fromToman(40000))).toThrowError(InvalidMoneyError);
  });

  it('multiplies money with integer rounding', () => {
    const price = Money.fromToman(15000);
    const total = price.multiply(3);
    expect(total.value).toBe(45000);
  });

  it('compares money amounts correctly', () => {
    const m1 = Money.fromToman(1000);
    const m2 = Money.fromToman(2000);
    expect(m1.isLessThan(m2)).toBe(true);
    expect(m2.isGreaterThan(m1)).toBe(true);
    expect(m1.equals(Money.fromToman(1000))).toBe(true);
  });
});
