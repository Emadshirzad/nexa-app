import type { UUID, ISO8601String, ISODateString } from '@/shared/types/common';
import { Money } from '../value-objects/Money';

export type CashTransactionType =
  | 'opening_balance'
  | 'invoice_payment'
  | 'expense'
  | 'other_income'
  | 'adjustment';

export interface CashTransactionProps {
  id: UUID;
  transactionType: CashTransactionType;
  amount: Money; // Can be negative for expenses
  balanceAfter: Money;
  referenceType?: string | null;
  referenceId?: UUID | null;
  description: string;
  transactionDate: ISODateString;
  createdAt: ISO8601String;
}

export class CashTransaction {
  private readonly props: CashTransactionProps;

  constructor(props: CashTransactionProps) {
    this.props = { ...props };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get transactionType(): CashTransactionType {
    return this.props.transactionType;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public get balanceAfter(): Money {
    return this.props.balanceAfter;
  }

  public get referenceType(): string | null | undefined {
    return this.props.referenceType;
  }

  public get referenceId(): UUID | null | undefined {
    return this.props.referenceId;
  }

  public get description(): string {
    return this.props.description;
  }

  public get transactionDate(): ISODateString {
    return this.props.transactionDate;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public isInflow(): boolean {
    return this.props.amount.value >= 0;
  }

  public isOutflow(): boolean {
    return this.props.amount.value < 0;
  }
}
