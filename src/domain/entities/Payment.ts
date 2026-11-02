import type { UUID, ISO8601String, ISODateString } from '@/shared/types/common';
import { Money } from '../value-objects/Money';
import { DomainError } from '../errors/DomainError';

export class InvalidPaymentError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaymentError';
  }
}

export type PaymentMethod =
  | 'cash'           // نقد
  | 'card_transfer' // کارت به کارت
  | 'pos'           // پوز / کارتخوان
  | 'bank_transfer' // پایا / ساتنا / حواله بانکی
  | 'other';        // سایر

export interface PaymentProps {
  id: UUID;
  invoiceId?: UUID | null;
  customerId?: UUID | null;
  amount: Money;
  paymentMethod: PaymentMethod;
  paymentDate: ISODateString;
  referenceNumber?: string | null;
  notes?: string | null;
  isVoided: boolean;
  voidedAt?: ISO8601String | null;
  voidReason?: string | null;
  createdAt: ISO8601String;
}

export class Payment {
  private props: PaymentProps;

  constructor(props: PaymentProps) {
    if (props.amount.isZero() || props.amount.value < 0) {
      throw new InvalidPaymentError('مبلغ پرداختی باید بزرگتر از صفر باشد.');
    }
    this.props = { ...props };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get invoiceId(): UUID | null | undefined {
    return this.props.invoiceId;
  }

  public get customerId(): UUID | null | undefined {
    return this.props.customerId;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public get paymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  public get paymentDate(): ISODateString {
    return this.props.paymentDate;
  }

  public get referenceNumber(): string | null | undefined {
    return this.props.referenceNumber;
  }

  public get notes(): string | null | undefined {
    return this.props.notes;
  }

  public get isVoided(): boolean {
    return this.props.isVoided;
  }

  public get voidedAt(): ISO8601String | null | undefined {
    return this.props.voidedAt;
  }

  public get voidReason(): string | null | undefined {
    return this.props.voidReason;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public void(reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new InvalidPaymentError('دلیل ابطال پرداخت الزامی است.');
    }
    this.props.isVoided = true;
    this.props.voidedAt = new Date().toISOString();
    this.props.voidReason = reason.trim();
  }

  public toJSON(): PaymentProps {
    return { ...this.props };
  }
}
