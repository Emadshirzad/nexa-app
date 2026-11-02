import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import type {
  ICashLedgerRepository,
  FinancialSummary
} from '@/domain/repositories/ICashLedgerRepository';
import {
  CashTransaction,
  type CashTransactionType
} from '@/domain/entities/CashTransaction';
import { Money } from '@/domain/value-objects/Money';
import type { UUID, ISODateString } from '@/shared/types/common';

interface CashTransactionRow {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  transaction_date: string;
  created_at: string;
}

export class SqliteCashLedgerRepository implements ICashLedgerRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async getCurrentBalance(): Promise<Money> {
    const rows = await this.driver.query<{ balance_after: number }>(
      `SELECT balance_after FROM cash_transactions ORDER BY rowid DESC LIMIT 1;`
    );
    return Money.fromSignedToman(rows[0]?.balance_after ?? 0);
  }

  public async listTransactions(limit: number = 100): Promise<CashTransaction[]> {
    const rows = await this.driver.query<CashTransactionRow>(
      `SELECT * FROM cash_transactions ORDER BY rowid DESC LIMIT ?;`,
      [limit]
    );
    return rows.map((r) => this.mapRow(r));
  }

  public async getFinancialSummary(
    startDate?: ISODateString,
    endDate?: ISODateString
  ): Promise<FinancialSummary> {
    let paymentSql = `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE is_voided = 0`;
    let incomeSql = `SELECT COALESCE(SUM(amount), 0) as total FROM other_incomes WHERE 1=1`;
    let expenseSql = `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1`;
    const params: unknown[] = [];

    if (startDate) {
      paymentSql += ` AND payment_date >= ?`;
      incomeSql += ` AND income_date >= ?`;
      expenseSql += ` AND expense_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      paymentSql += ` AND payment_date <= ?`;
      incomeSql += ` AND income_date <= ?`;
      expenseSql += ` AND expense_date <= ?`;
      params.push(endDate);
    }

    const [paymentRows, incomeRows, expenseRows, currentBal] = await Promise.all([
      this.driver.query<{ total: number }>(paymentSql, params),
      this.driver.query<{ total: number }>(incomeSql, params),
      this.driver.query<{ total: number }>(expenseSql, params),
      this.getCurrentBalance()
    ]);

    const totalReceiptsToman = paymentRows[0]?.total ?? 0;
    const totalOtherIncomesToman = incomeRows[0]?.total ?? 0;
    const totalExpensesToman = expenseRows[0]?.total ?? 0;
    const netSurplusToman = totalReceiptsToman + totalOtherIncomesToman - totalExpensesToman;

    return {
      currentCashBalance: currentBal,
      totalReceipts: Money.fromToman(totalReceiptsToman),
      totalOtherIncomes: Money.fromToman(totalOtherIncomesToman),
      totalExpenses: Money.fromToman(totalExpensesToman),
      netSurplus: Money.fromSignedToman(netSurplusToman)
    };
  }

  private mapRow(row: CashTransactionRow): CashTransaction {
    return new CashTransaction({
      id: row.id as UUID,
      transactionType: row.transaction_type as CashTransactionType,
      amount: Money.fromSignedToman(row.amount),
      balanceAfter: Money.fromSignedToman(row.balance_after),
      referenceType: row.reference_type,
      referenceId: row.reference_id as UUID | null,
      description: row.description,
      transactionDate: row.transaction_date,
      createdAt: row.created_at
    });
  }
}
