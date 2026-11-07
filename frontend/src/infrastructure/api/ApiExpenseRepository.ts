import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import { Expense, type ExpensePaymentMethod } from '@/domain/entities/Expense';
import { OtherIncome } from '@/domain/entities/OtherIncome';
import { Money } from '@/domain/value-objects/Money';
import { ApiClient } from './ApiClient';
import type { UUID, ISODateString } from '@/shared/types/common';

export class ApiExpenseRepository implements IExpenseRepository {
  private api = ApiClient.getInstance();

  private toExpenseDomain(data: any): Expense {
    return new Expense({
      id: data.id as UUID,
      categoryId: (data.category_id as UUID) || null,
      title: data.title,
      amount: Money.fromToman(Number(data.amount) || 0),
      expenseDate: data.expense_date,
      description: data.description ?? undefined,
      paymentMethod: (data.payment_method as ExpensePaymentMethod) || 'cash',
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    });
  }

  private toOtherIncomeDomain(data: any): OtherIncome {
    return new OtherIncome({
      id: data.id as UUID,
      title: data.title,
      amount: Money.fromToman(Number(data.amount) || 0),
      incomeDate: data.income_date,
      description: data.description ?? undefined,
      paymentMethod: data.payment_method || 'cash',
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    });
  }

  public async recordExpense(expense: Expense): Promise<void> {
    await this.api.post('/expenses', {
      id: expense.id,
      category_id: expense.categoryId ?? null,
      title: expense.title,
      amount: expense.amount.value,
      expense_date: expense.expenseDate,
      description: expense.description ?? null,
      payment_method: expense.paymentMethod
    });
  }

  public async recordOtherIncome(income: OtherIncome): Promise<void> {
    await this.api.post('/other-incomes', {
      id: income.id,
      title: income.title,
      amount: income.amount.value,
      income_date: income.incomeDate,
      description: income.description ?? null,
      payment_method: income.paymentMethod
    });
  }

  public async findExpenseById(id: UUID): Promise<Expense | null> {
    try {
      const data = await this.api.get<any>(`/expenses/${id}`);
      return data ? this.toExpenseDomain(data) : null;
    } catch {
      return null;
    }
  }

  public async listExpenses(options?: {
    startDate?: ISODateString;
    endDate?: ISODateString;
    categoryId?: UUID;
    limit?: number;
  }): Promise<Expense[]> {
    const res = await this.api.get<any>('/expenses', {
      start_date: options?.startDate,
      end_date: options?.endDate,
      category_id: options?.categoryId,
      limit: options?.limit,
      all: !options?.limit
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toExpenseDomain(item));
  }

  public async listOtherIncomes(options?: {
    startDate?: ISODateString;
    endDate?: ISODateString;
    limit?: number;
  }): Promise<OtherIncome[]> {
    const res = await this.api.get<any>('/other-incomes', {
      start_date: options?.startDate,
      end_date: options?.endDate,
      limit: options?.limit
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toOtherIncomeDomain(item));
  }

  public async getTotalExpenses(startDate?: ISODateString, endDate?: ISODateString): Promise<Money> {
    const list = await this.listExpenses({ startDate, endDate });
    const total = list.reduce((sum, e) => sum + e.amount.value, 0);
    return Money.fromToman(total);
  }

  public async getTotalOtherIncomes(startDate?: ISODateString, endDate?: ISODateString): Promise<Money> {
    const list = await this.listOtherIncomes({ startDate, endDate });
    const total = list.reduce((sum, o) => sum + o.amount.value, 0);
    return Money.fromToman(total);
  }
}
