import type { ISODateString } from '@/shared/types/common';
import type { CashTransaction } from '../entities/CashTransaction';
import type { Money } from '../value-objects/Money';

export interface FinancialSummary {
  currentCashBalance: Money;
  totalReceipts: Money;
  totalExpenses: Money;
  totalOtherIncomes: Money;
  netSurplus: Money;
}

export interface ICashLedgerRepository {
  getCurrentBalance(): Promise<Money>;
  listTransactions(limit?: number): Promise<CashTransaction[]>;
  getFinancialSummary(startDate?: ISODateString, endDate?: ISODateString): Promise<FinancialSummary>;
}
