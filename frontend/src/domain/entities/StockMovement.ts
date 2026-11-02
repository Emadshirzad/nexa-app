import type { UUID, ISO8601String } from '@/shared/types/common';
import { StockQuantity } from '../value-objects/StockQuantity';
import { DomainError } from '../errors/DomainError';

export class InvalidStockMovementError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStockMovementError';
  }
}

export type StockMovementType =
  | 'initial'
  | 'addition'
  | 'deduction'
  | 'adjustment'
  | 'invoice_sale'
  | 'invoice_cancellation';

export interface StockMovementProps {
  id: UUID;
  productId: UUID;
  movementType: StockMovementType;
  quantity: StockQuantity; // Positive for influx, negative for outflux
  referenceType?: string | null; // e.g. 'invoice', 'manual_adjustment'
  referenceId?: string | null;   // e.g. invoiceId
  reason: string;
  createdAt: ISO8601String;
}

export class StockMovement {
  private readonly props: StockMovementProps;

  constructor(props: StockMovementProps) {
    if (!props.productId) {
      throw new InvalidStockMovementError('شناسه کالا برای ثبت گردش انبار الزامی است.');
    }
    if (!props.reason || props.reason.trim().length === 0) {
      throw new InvalidStockMovementError('دلیل تغییر موجودی الزامی است.');
    }
    this.props = {
      ...props,
      reason: props.reason.trim()
    };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get productId(): UUID {
    return this.props.productId;
  }

  public get movementType(): StockMovementType {
    return this.props.movementType;
  }

  public get quantity(): StockQuantity {
    return this.props.quantity;
  }

  public get referenceType(): string | null | undefined {
    return this.props.referenceType;
  }

  public get referenceId(): string | null | undefined {
    return this.props.referenceId;
  }

  public get reason(): string {
    return this.props.reason;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public toJSON(): StockMovementProps {
    return { ...this.props };
  }
}
