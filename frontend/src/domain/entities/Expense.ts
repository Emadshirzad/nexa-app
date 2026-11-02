import type { UUID, ISO8601String, ISODateString } from '@/shared/types/common';
import { Money } from '../value-objects/Money';
import { DomainError } from '../errors/DomainError';

export class InvalidExpenseError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidExpenseError';
  }
}

export type ExpensePaymentMethod = 'cash' | 'card_transfer' | 'pos' | 'bank_transfer' | 'other';

export interface ExpenseProps {
  id: UUID;
  categoryId?: UUID | null;
  title: string;
  amount: Money;
  expenseDate: ISODateString;
  description?: string | null;
  paymentMethod: ExpensePaymentMethod;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export class Expense {
  private readonly props: ExpenseProps;

  constructor(props: ExpenseProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new InvalidExpenseError('عنوان هزینه الزامی است.');
    }
    if (props.amount.value <= 0) {
      throw new InvalidExpenseError('مبلغ هزینه باید بزرگتر از صفر باشد.');
    }
    if (!props.expenseDate) {
      throw new InvalidExpenseError('تاریخ ثبت هزینه الزامی است.');
    }

    this.props = {
      ...props,
      title: props.title.trim()
    };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get categoryId(): UUID | null | undefined {
    return this.props.categoryId;
  }

  public get title(): string {
    return this.props.title;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public get expenseDate(): ISODateString {
    return this.props.expenseDate;
  }

  public get description(): string | null | undefined {
    return this.props.description;
  }

  public get paymentMethod(): ExpensePaymentMethod {
    return this.props.paymentMethod;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public get updatedAt(): ISO8601String {
    return this.props.updatedAt;
  }
}
