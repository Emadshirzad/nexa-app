import type { UUID, ISO8601String, ISODateString } from '@/shared/types/common';
import { Money } from '../value-objects/Money';
import type { InvoiceItem } from './InvoiceItem';
import { DomainError } from '../errors/DomainError';

export class InvalidInvoiceError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInvoiceError';
  }
}

export type InvoiceStatus = 'draft' | 'issued' | 'cancelled';

export interface InvoiceProps {
  id: UUID;
  invoiceNumber: string;
  customerId?: UUID | null;
  invoiceDate: ISODateString;
  status: InvoiceStatus;
  subtotal: Money;
  itemDiscountTotal: Money;
  invoiceDiscount: Money;
  finalAmount: Money;
  paidAmount: Money;
  outstandingDebt: Money;
  notes?: string | null;
  issuedAt?: ISO8601String | null;
  cancelledAt?: ISO8601String | null;
  cancellationReason?: string | null;
  items?: InvoiceItem[];
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export class Invoice {
  private props: InvoiceProps;

  constructor(props: InvoiceProps) {
    if (!props.invoiceNumber || props.invoiceNumber.trim().length === 0) {
      throw new InvalidInvoiceError('شماره فاکتور الزامی است.');
    }
    if (!props.invoiceDate) {
      throw new InvalidInvoiceError('تاریخ فاکتور الزامی است.');
    }

    this.props = {
      ...props,
      items: props.items || []
    };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get invoiceNumber(): string {
    return this.props.invoiceNumber;
  }

  public get customerId(): UUID | null | undefined {
    return this.props.customerId;
  }

  public get invoiceDate(): ISODateString {
    return this.props.invoiceDate;
  }

  public get status(): InvoiceStatus {
    return this.props.status;
  }

  public get subtotal(): Money {
    return this.props.subtotal;
  }

  public get itemDiscountTotal(): Money {
    return this.props.itemDiscountTotal;
  }

  public get invoiceDiscount(): Money {
    return this.props.invoiceDiscount;
  }

  public get totalDiscount(): Money {
    return this.props.itemDiscountTotal.add(this.props.invoiceDiscount);
  }

  public get finalAmount(): Money {
    return this.props.finalAmount;
  }

  public get paidAmount(): Money {
    return this.props.paidAmount;
  }

  public get outstandingDebt(): Money {
    return this.props.outstandingDebt;
  }

  public get notes(): string | null | undefined {
    return this.props.notes;
  }

  public get issuedAt(): ISO8601String | null | undefined {
    return this.props.issuedAt;
  }

  public get cancelledAt(): ISO8601String | null | undefined {
    return this.props.cancelledAt;
  }

  public get cancellationReason(): string | null | undefined {
    return this.props.cancellationReason;
  }

  public get items(): InvoiceItem[] {
    return [...(this.props.items || [])];
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public get updatedAt(): ISO8601String {
    return this.props.updatedAt;
  }

  public isIssued(): boolean {
    return this.props.status === 'issued';
  }

  public isCancelled(): boolean {
    return this.props.status === 'cancelled';
  }

  public isDraft(): boolean {
    return this.props.status === 'draft';
  }

  public isFullyPaid(): boolean {
    return this.props.outstandingDebt.isZero() && !this.props.finalAmount.isZero();
  }

  /**
   * Transition to Issued. Freezes invoice data and timestamps issuance.
   */
  public issue(): void {
    if (this.props.status === 'cancelled') {
      throw new InvalidInvoiceError('فاکتور ابطال‌شده را نمی‌توان مجدداً صادر کرد.');
    }
    this.props.status = 'issued';
    this.props.issuedAt = new Date().toISOString();
    this.props.updatedAt = new Date().toISOString();
  }

  /**
   * Idempotent cancellation: marks invoice cancelled with mandatory reason.
   */
  public cancel(reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new InvalidInvoiceError('درج دلیل ابطال فاکتور الزامی است.');
    }
    if (this.props.status === 'cancelled') {
      return; // Idempotent no-op
    }

    this.props.status = 'cancelled';
    this.props.cancelledAt = new Date().toISOString();
    this.props.cancellationReason = reason.trim();
    this.props.outstandingDebt = Money.zero();
    this.props.updatedAt = new Date().toISOString();
  }

  /**
   * Records a payment against this invoice, updating paidAmount and outstandingDebt.
   */
  public applyPayment(paymentAmount: Money): void {
    if (this.props.status !== 'issued') {
      throw new InvalidInvoiceError('پرداخت فقط برای فاکتورهای صادرشده معتبر است.');
    }

    const newPaidToman = this.props.paidAmount.value + paymentAmount.value;
    this.props.paidAmount = Money.fromToman(newPaidToman);

    const remainingDebt = Math.max(0, this.props.finalAmount.value - newPaidToman);
    this.props.outstandingDebt = Money.fromToman(remainingDebt);
    this.props.updatedAt = new Date().toISOString();
  }

  public setItems(items: InvoiceItem[]): void {
    this.props.items = [...items];
  }

  public toJSON(): InvoiceProps {
    return { ...this.props, items: this.items };
  }
}
