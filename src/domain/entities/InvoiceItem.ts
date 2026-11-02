import type { UUID, ISO8601String } from '@/shared/types/common';
import { Money } from '../value-objects/Money';
import { StockQuantity } from '../value-objects/StockQuantity';
import { DomainError } from '../errors/DomainError';

export class InvalidInvoiceItemError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInvoiceItemError';
  }
}

export interface InvoiceItemProps {
  id: UUID;
  invoiceId: UUID;
  productId?: UUID | null;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitSnapshot: string;
  unitPriceSnapshot: Money;
  quantity: StockQuantity;
  discountAmount: Money;
  lineTotal: Money;
  createdAt: ISO8601String;
}

export class InvoiceItem {
  private readonly props: InvoiceItemProps;

  constructor(props: InvoiceItemProps) {
    if (!props.productNameSnapshot || props.productNameSnapshot.trim().length === 0) {
      throw new InvalidInvoiceItemError('نام کالای فاکتور الزامی است.');
    }
    if (props.quantity.scaledValue <= 0) {
      throw new InvalidInvoiceItemError('تعداد/مقدار کالا در فاکتور باید بزرگتر از صفر باشد.');
    }

    this.props = { ...props };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get invoiceId(): UUID {
    return this.props.invoiceId;
  }

  public get productId(): UUID | null | undefined {
    return this.props.productId;
  }

  public get productNameSnapshot(): string {
    return this.props.productNameSnapshot;
  }

  public get skuSnapshot(): string {
    return this.props.skuSnapshot;
  }

  public get unitSnapshot(): string {
    return this.props.unitSnapshot;
  }

  public get unitPriceSnapshot(): Money {
    return this.props.unitPriceSnapshot;
  }

  public get quantity(): StockQuantity {
    return this.props.quantity;
  }

  public get discountAmount(): Money {
    return this.props.discountAmount;
  }

  public get lineTotal(): Money {
    return this.props.lineTotal;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  /**
   * Factory method to calculate line total safely in integer Toman:
   * lineTotal = (unitPrice * quantity) - discount
   */
  public static calculate(
    unitPrice: Money,
    quantity: StockQuantity,
    discount: Money = Money.zero()
  ): { gross: Money; lineTotal: Money } {
    const decQty = quantity.toDecimal();
    const grossToman = Math.round(unitPrice.value * decQty);
    const gross = Money.fromToman(grossToman);
    const lineTotalToman = Math.max(0, grossToman - discount.value);
    const lineTotal = Money.fromToman(lineTotalToman);
    return { gross, lineTotal };
  }

  public toJSON(): InvoiceItemProps {
    return { ...this.props };
  }
}
