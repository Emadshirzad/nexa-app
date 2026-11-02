import { z } from 'zod';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import { Expense, type ExpensePaymentMethod } from '@/domain/entities/Expense';
import { Money } from '@/domain/value-objects/Money';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';

export const RecordExpenseSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'عنوان هزینه الزامی است.').max(150),
  amount: z.number().int().positive('مبلغ هزینه باید بزرگتر از صفر باشد.'),
  expenseDate: z.string().min(1, 'تاریخ هزینه الزامی است.'),
  description: z.string().max(500).nullable().optional(),
  paymentMethod: z
    .enum(['cash', 'card_transfer', 'pos', 'bank_transfer', 'other'])
    .default('cash')
});

export type RecordExpenseDTO = z.input<typeof RecordExpenseSchema>;

export class RecordExpenseUseCase {
  private readonly expenseRepo: IExpenseRepository;

  constructor(expenseRepo: IExpenseRepository) {
    this.expenseRepo = expenseRepo;
  }

  public async execute(dto: RecordExpenseDTO): Promise<Result<Expense, string>> {
    const parseRes = RecordExpenseSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    const input = parseRes.data;

    try {
      const now = new Date().toISOString();
      const expense = new Expense({
        id: generateUUID(),
        categoryId: (input.categoryId as UUID) || null,
        title: input.title,
        amount: Money.fromToman(input.amount),
        expenseDate: input.expenseDate,
        description: input.description,
        paymentMethod: input.paymentMethod as ExpensePaymentMethod,
        createdAt: now,
        updatedAt: now
      });

      await this.expenseRepo.recordExpense(expense);
      return ok(expense);
    } catch (err) {
      return fail(`خطا در ثبت هزینه: ${String(err)}`);
    }
  }
}
