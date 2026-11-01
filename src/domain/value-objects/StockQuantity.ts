import { DomainError } from '../errors/DomainError';

export class InvalidStockQuantityError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStockQuantityError';
  }
}

/**
 * StockQuantity Value Object: Scaled integer representation (factor of 1,000).
 * Supports 3 decimal places (e.g. 1.250 kg = 1250 in database).
 * Prevents IEEE 754 floating-point inaccuracies in inventory tracking.
 */
export class StockQuantity {
  private static readonly SCALE = 1000;
  private readonly scaledQuantity: number;

  private constructor(scaledQuantity: number) {
    if (!Number.isInteger(scaledQuantity)) {
      throw new InvalidStockQuantityError(
        `مقدار مقیاس‌شده موجودی باید عدد صحیح باشد. مقدار: ${scaledQuantity}`
      );
    }
    this.scaledQuantity = scaledQuantity;
  }

  public static fromScaled(scaledValue: number): StockQuantity {
    return new StockQuantity(scaledValue);
  }

  public static fromDecimal(decimalValue: number): StockQuantity {
    if (isNaN(decimalValue)) {
      throw new InvalidStockQuantityError('مقدار اعشاری موجودی نامعتبر است.');
    }
    const scaled = Math.round(decimalValue * StockQuantity.SCALE);
    return new StockQuantity(scaled);
  }

  public static zero(): StockQuantity {
    return new StockQuantity(0);
  }

  public get scaledValue(): number {
    return this.scaledQuantity;
  }

  public toDecimal(): number {
    return this.scaledQuantity / StockQuantity.SCALE;
  }

  public add(other: StockQuantity): StockQuantity {
    return new StockQuantity(this.scaledQuantity + other.scaledQuantity);
  }

  public subtract(other: StockQuantity): StockQuantity {
    return new StockQuantity(this.scaledQuantity - other.scaledQuantity);
  }

  public isNegative(): boolean {
    return this.scaledQuantity < 0;
  }

  public isZero(): boolean {
    return this.scaledQuantity === 0;
  }

  public format(unitLabel: string = ''): string {
    const dec = this.toDecimal();
    // Trim trailing zeroes cleanly: 1.250 -> 1.25, 2.000 -> 2
    const formatted = dec.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    });
    return unitLabel ? `${formatted} ${unitLabel}` : formatted;
  }
}
