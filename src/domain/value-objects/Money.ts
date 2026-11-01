import { DomainError } from '../errors/DomainError';

export class InvalidMoneyError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoneyError';
  }
}

/**
 * Money Value Object: Immutable representation of monetary amounts in integer Toman.
 * Strictly prevents floating-point corruption and enforces non-negative money boundaries.
 */
export class Money {
  private readonly amountInToman: number;

  private constructor(amount: number) {
    if (!Number.isInteger(amount)) {
      throw new InvalidMoneyError(`مبلغ باید یک عدد صحیح باشد. مقدار نامعتبر: ${amount}`);
    }
    if (amount < 0) {
      throw new InvalidMoneyError(`مبلغ نمی‌تواند منفی باشد. مقدار: ${amount}`);
    }
    this.amountInToman = amount;
  }

  public static fromToman(amount: number): Money {
    return new Money(amount);
  }

  public static zero(): Money {
    return new Money(0);
  }

  public get value(): number {
    return this.amountInToman;
  }

  public add(other: Money): Money {
    return new Money(this.amountInToman + other.amountInToman);
  }

  public subtract(other: Money): Money {
    const diff = this.amountInToman - other.amountInToman;
    if (diff < 0) {
      throw new InvalidMoneyError(
        `کسر مبلغ ${other.amountInToman} از ${this.amountInToman} منجر به مبلغ منفی می‌شود.`
      );
    }
    return new Money(diff);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new InvalidMoneyError('ضریب ضرب نمی‌تواند منفی باشد.');
    }
    // Rounding is strictly integer-safe
    return new Money(Math.round(this.amountInToman * factor));
  }

  public equals(other: Money): boolean {
    return this.amountInToman === other.amountInToman;
  }

  public isGreaterThan(other: Money): boolean {
    return this.amountInToman > other.amountInToman;
  }

  public isLessThan(other: Money): boolean {
    return this.amountInToman < other.amountInToman;
  }

  public isZero(): boolean {
    return this.amountInToman === 0;
  }

  /**
   * Formats into Persian display with English digits and comma separators:
   * e.g. "12,500,000 تومان"
   */
  public format(withUnit: boolean = true): string {
    const formatted = this.amountInToman.toLocaleString('en-US');
    return withUnit ? `${formatted} تومان` : formatted;
  }
}
