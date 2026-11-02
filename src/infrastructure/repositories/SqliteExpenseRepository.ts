import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import { Expense, type ExpensePaymentMethod } from '@/domain/entities/Expense';
import { OtherIncome } from '@/domain/entities/OtherIncome';
import { Money } from '@/domain/value-objects/Money';
import type { UUID, ISODateString } from '@/shared/types/common';
import { generateUUID } from '@/shared/utils/id';

interface ExpenseRow {
  id: string;
  category_id: string | null;
  title: string;
  amount: number;
  expense_date: string;
  description: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

interface OtherIncomeRow {
  id: string;
  title: string;
  amount: number;
  income_date: string;
  description: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export class SqliteExpenseRepository implements IExpenseRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async recordExpense(expense: Expense): Promise<void> {
    await this.driver.transaction(async (tx) => {
      // 1. Insert expense record
      await tx.run(
        `INSERT INTO expenses (
          id, category_id, title, amount, expense_date, description,
          payment_method, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          expense.id,
          expense.categoryId || null,
          expense.title,
          expense.amount.value,
          expense.expenseDate,
          expense.description || null,
          expense.paymentMethod,
          expense.createdAt,
          expense.updatedAt
        ]
      );

      // 2. Append outflow to cash ledger
      const lastTxRows = await tx.query<{ balance_after: number }>(
        `SELECT balance_after FROM cash_transactions ORDER BY rowid DESC LIMIT 1;`
      );
      const currentCashBalance = lastTxRows[0]?.balance_after ?? 0;
      const newCashBalance = currentCashBalance - expense.amount.value;

      await tx.run(
        `INSERT INTO cash_transactions (
          id, transaction_type, amount, balance_after, reference_type, reference_id,
          description, transaction_date, created_at
        ) VALUES (?, 'expense', ?, ?, 'expense', ?, ?, ?, ?);`,
        [
          generateUUID(),
          -expense.amount.value,
          newCashBalance,
          expense.id,
          `ثبت هزینه: ${expense.title}`,
          expense.expenseDate,
          expense.createdAt
        ]
      );
    });
  }

  public async recordOtherIncome(income: OtherIncome): Promise<void> {
    await this.driver.transaction(async (tx) => {
      // 1. Insert income record
      await tx.run(
        `INSERT INTO other_incomes (
          id, title, amount, income_date, description,
          payment_method, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          income.id,
          income.title,
          income.amount.value,
          income.incomeDate,
          income.description || null,
          income.paymentMethod,
          income.createdAt,
          income.updatedAt
        ]
      );

      // 2. Append inflow to cash ledger
      const lastTxRows = await tx.query<{ balance_after: number }>(
        `SELECT balance_after FROM cash_transactions ORDER BY rowid DESC LIMIT 1;`
      );
      const currentCashBalance = lastTxRows[0]?.balance_after ?? 0;
      const newCashBalance = currentCashBalance + income.amount.value;

      await tx.run(
        `INSERT INTO cash_transactions (
          id, transaction_type, amount, balance_after, reference_type, reference_id,
          description, transaction_date, created_at
        ) VALUES (?, 'other_income', ?, ?, 'other_income', ?, ?, ?, ?);`,
        [
          generateUUID(),
          income.amount.value,
          newCashBalance,
          income.id,
          `ثبت درآمد متفرقه: ${income.title}`,
          income.incomeDate,
          income.createdAt
        ]
      );
    });
  }

  public async findExpenseById(id: UUID): Promise<Expense | null> {
    const rows = await this.driver.query<ExpenseRow>(
      `SELECT * FROM expenses WHERE id = ?;`,
      [id]
    );
    return rows[0] ? this.mapExpenseRow(rows[0]) : null;
  }

  public async listExpenses(options?: {
    startDate?: ISODateString;
    endDate?: ISODateString;
    categoryId?: UUID;
    limit?: number;
  }): Promise<Expense[]> {
    let sql = `SELECT * FROM expenses WHERE 1=1`;
    const params: unknown[] = [];

    if (options?.startDate) {
      sql += ` AND expense_date >= ?`;
      params.push(options.startDate);
    }
    if (options?.endDate) {
      sql += ` AND expense_date <= ?`;
      params.push(options.endDate);
    }
    if (options?.categoryId) {
      sql += ` AND category_id = ?`;
      params.push(options.categoryId);
    }

    sql += ` ORDER BY expense_date DESC, created_at DESC`;

    if (options?.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    const rows = await this.driver.query<ExpenseRow>(sql, params);
    return rows.map((r) => this.mapExpenseRow(r));
  }

  public async listOtherIncomes(options?: {
    startDate?: ISODateString;
    endDate?: ISODateString;
    limit?: number;
  }): Promise<OtherIncome[]> {
    let sql = `SELECT * FROM other_incomes WHERE 1=1`;
    const params: unknown[] = [];

    if (options?.startDate) {
      sql += ` AND income_date >= ?`;
      params.push(options.startDate);
    }
    if (options?.endDate) {
      sql += ` AND income_date <= ?`;
      params.push(options.endDate);
    }

    sql += ` ORDER BY income_date DESC, created_at DESC`;

    if (options?.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    const rows = await this.driver.query<OtherIncomeRow>(sql, params);
    return rows.map((r) => this.mapIncomeRow(r));
  }

  public async getTotalExpenses(
    startDate?: ISODateString,
    endDate?: ISODateString
  ): Promise<Money> {
    let sql = `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1`;
    const params: unknown[] = [];

    if (startDate) {
      sql += ` AND expense_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND expense_date <= ?`;
      params.push(endDate);
    }

    const rows = await this.driver.query<{ total: number }>(sql, params);
    return Money.fromToman(rows[0]?.total ?? 0);
  }

  public async getTotalOtherIncomes(
    startDate?: ISODateString,
    endDate?: ISODateString
  ): Promise<Money> {
    let sql = `SELECT COALESCE(SUM(amount), 0) as total FROM other_incomes WHERE 1=1`;
    const params: unknown[] = [];

    if (startDate) {
      sql += ` AND income_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND income_date <= ?`;
      params.push(endDate);
    }

    const rows = await this.driver.query<{ total: number }>(sql, params);
    return Money.fromToman(rows[0]?.total ?? 0);
  }

  private mapExpenseRow(row: ExpenseRow): Expense {
    return new Expense({
      id: row.id as UUID,
      categoryId: row.category_id as UUID | null,
      title: row.title,
      amount: Money.fromToman(row.amount),
      expenseDate: row.expense_date,
      description: row.description,
      paymentMethod: row.payment_method as ExpensePaymentMethod,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  private mapIncomeRow(row: OtherIncomeRow): OtherIncome {
    return new OtherIncome({
      id: row.id as UUID,
      title: row.title,
      amount: Money.fromToman(row.amount),
      incomeDate: row.income_date,
      description: row.description,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
