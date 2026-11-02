import type { UUID, ISO8601String, ISODateString } from '@/shared/types/common';
import { Money } from '../value-objects/Money';
import { DomainError } from '../errors/DomainError';

export class InvalidOtherIncomeError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOtherIncomeError';
  }
}

export interface OtherIncomeProps {
  id: UUID;
  title: string;
  amount: Money;
  incomeDate: ISODateString;
  description?: string | null;
  paymentMethod: string;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export class OtherIncome {
  private readonly props: OtherIncomeProps;

  constructor(props: OtherIncomeProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new InvalidOtherIncomeError('عنوان درآمد متفرقه الزامی است.');
    }
    if (props.amount.value <= 0) {
      throw new InvalidOtherIncomeError('مبلغ درآمد باید بزرگتر از صفر باشد.');
    }
    if (!props.incomeDate) {
      throw new InvalidOtherIncomeError('تاریخ دریافت درآمد الزامی است.');
    }

    this.props = {
      ...props,
      title: props.title.trim()
    };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get title(): string {
    return this.props.title;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public get incomeDate(): ISODateString {
    return this.props.incomeDate;
  }

  public get description(): string | null | undefined {
    return this.props.description;
  }

  public get paymentMethod(): string {
    return this.props.paymentMethod;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public get updatedAt(): ISO8601String {
    return this.props.updatedAt;
  }
}
