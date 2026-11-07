import type {
  ICashLedgerRepository,
  FinancialSummary
} from '@/domain/repositories/ICashLedgerRepository';
import { CashTransaction, type CashTransactionType } from '@/domain/entities/CashTransaction';
import { Money } from '@/domain/value-objects/Money';
import { ApiClient } from './ApiClient';
import type { UUID, ISODateString } from '@/shared/types/common';

export class ApiCashLedgerRepository implements ICashLedgerRepository {
  private api = ApiClient.getInstance();

  private toDomain(data: any): CashTransaction {
    return new CashTransaction({
      id: data.id as UUID,
      transactionType: data.transaction_type as CashTransactionType,
      amount: Money.fromSignedToman(Number(data.amount) || 0),
      balanceAfter: Money.fromSignedToman(Number(data.balance_after) || 0),
      referenceType: data.reference_type ?? null,
      referenceId: (data.reference_id as UUID) || null,
      description: data.description || '',
      transactionDate: data.transaction_date,
      createdAt: data.created_at || new Date().toISOString()
    });
  }

  public async getCurrentBalance(): Promise<Money> {
    try {
      const res = await this.api.get<{ balance: number }>('/cash-transactions/balance');
      return Money.fromSignedToman(Number(res.balance) || 0);
    } catch {
      return Money.zero();
    }
  }

  public async listTransactions(limit: number = 100): Promise<CashTransaction[]> {
    try {
      const res = await this.api.get<any[]>('/cash-transactions', { limit });
      const list = Array.isArray(res) ? res : [];
      return list.map((item) => this.toDomain(item));
    } catch {
      return [];
    }
  }

  public async getFinancialSummary(startDate?: ISODateString, endDate?: ISODateString): Promise<FinancialSummary> {
    try {
      const res = await this.api.get<any>('/cash-transactions/summary', {
        start_date: startDate,
        end_date: endDate
      });

      return {
        currentCashBalance: Money.fromSignedToman(Number(res.current_cash_balance) || 0),
        totalReceipts: Money.fromToman(Number(res.total_receipts) || 0),
        totalExpenses: Money.fromToman(Number(res.total_expenses) || 0),
        totalOtherIncomes: Money.fromToman(Number(res.total_other_incomes) || 0),
        netSurplus: Money.fromSignedToman(Number(res.net_surplus) || 0)
      };
    } catch {
      return {
        currentCashBalance: Money.zero(),
        totalReceipts: Money.zero(),
        totalExpenses: Money.zero(),
        totalOtherIncomes: Money.zero(),
        netSurplus: Money.zero()
      };
    }
  }
}
