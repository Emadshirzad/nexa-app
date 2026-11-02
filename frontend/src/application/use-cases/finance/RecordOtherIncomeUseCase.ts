import { z } from 'zod';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import { OtherIncome } from '@/domain/entities/OtherIncome';
import { Money } from '@/domain/value-objects/Money';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';

export const RecordOtherIncomeSchema = z.object({
  title: z.string().min(1, 'عنوان درآمد متفرقه الزامی است.').max(150),
  amount: z.number().int().positive('مبلغ درآمد باید بزرگتر از صفر باشد.'),
  incomeDate: z.string().min(1, 'تاریخ دریافت الزامی است.'),
  description: z.string().max(500).nullable().optional(),
  paymentMethod: z
    .enum(['cash', 'card_transfer', 'pos', 'bank_transfer', 'other'])
    .default('cash')
});

export type RecordOtherIncomeDTO = z.input<typeof RecordOtherIncomeSchema>;

export class RecordOtherIncomeUseCase {
  private readonly expenseRepo: IExpenseRepository;

  constructor(expenseRepo: IExpenseRepository) {
    this.expenseRepo = expenseRepo;
  }

  public async execute(dto: RecordOtherIncomeDTO): Promise<Result<OtherIncome, string>> {
    const parseRes = RecordOtherIncomeSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    const input = parseRes.data;

    try {
      const now = new Date().toISOString();
      const income = new OtherIncome({
        id: generateUUID(),
        title: input.title,
        amount: Money.fromToman(input.amount),
        incomeDate: input.incomeDate,
        description: input.description,
        paymentMethod: input.paymentMethod,
        createdAt: now,
        updatedAt: now
      });

      await this.expenseRepo.recordOtherIncome(income);
      return ok(income);
    } catch (err) {
      return fail(`خطا در ثبت درآمد متفرقه: ${String(err)}`);
    }
  }
}
