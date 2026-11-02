import type { UUID, ISODateString } from '@/shared/types/common';
import type { Expense } from '../entities/Expense';
import type { OtherIncome } from '../entities/OtherIncome';
import type { Money } from '../value-objects/Money';

export interface IExpenseRepository {
  recordExpense(expense: Expense): Promise<void>;
  recordOtherIncome(income: OtherIncome): Promise<void>;
  findExpenseById(id: UUID): Promise<Expense | null>;
  listExpenses(options?: {
    startDate?: ISODateString;
    endDate?: ISODateString;
    categoryId?: UUID;
    limit?: number;
  }): Promise<Expense[]>;
  listOtherIncomes(options?: {
    startDate?: ISODateString;
    endDate?: ISODateString;
    limit?: number;
  }): Promise<OtherIncome[]>;
  getTotalExpenses(startDate?: ISODateString, endDate?: ISODateString): Promise<Money>;
  getTotalOtherIncomes(startDate?: ISODateString, endDate?: ISODateString): Promise<Money>;
}
