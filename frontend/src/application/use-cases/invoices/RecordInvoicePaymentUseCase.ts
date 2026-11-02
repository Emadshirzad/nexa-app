import { z } from 'zod';
import type { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';

import { Payment, PaymentMethod } from '@/domain/entities/Payment';
import { Money } from '@/domain/value-objects/Money';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';

export const RecordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().int().positive('مبلغ پرداختی باید بزرگتر از صفر باشد.'),
  paymentMethod: z.enum(['cash', 'card_transfer', 'pos', 'bank_transfer', 'other']),
  paymentDate: z.string(), // YYYY-MM-DD
  referenceNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type RecordPaymentDTO = z.infer<typeof RecordPaymentSchema>;

export class RecordInvoicePaymentUseCase {
  private readonly invoiceRepo: IInvoiceRepository;
  private readonly paymentRepo: IPaymentRepository;
  private readonly driver: IDatabaseDriver;

  constructor(
    invoiceRepo: IInvoiceRepository,
    paymentRepo: IPaymentRepository,
    driver: IDatabaseDriver
  ) {
    this.invoiceRepo = invoiceRepo;
    this.paymentRepo = paymentRepo;
    this.driver = driver;
  }

  public async execute(dto: RecordPaymentDTO): Promise<Result<Payment, string>> {
    const parseRes = RecordPaymentSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    try {
      const invoice = await this.invoiceRepo.findById(dto.invoiceId as UUID);
      if (!invoice) {
        return fail('فاکتور مورد نظر یافت نشد.');
      }
      if (invoice.isCancelled()) {
        return fail('امکان ثبت پرداخت برای فاکتور ابطال‌شده وجود ندارد.');
      }

      const paymentMoney = Money.fromToman(dto.amount);
      const now = new Date().toISOString();

      const payment = new Payment({
        id: generateUUID(),
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amount: paymentMoney,
        paymentMethod: dto.paymentMethod as PaymentMethod,
        paymentDate: dto.paymentDate,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
        isVoided: false,
        createdAt: now
      });

      // Atomic execution: Update invoice debt balance + Record payment + Append to cash ledger
      await this.driver.transaction(async () => {
        invoice.applyPayment(paymentMoney);
        await this.invoiceRepo.save(invoice);
        await this.paymentRepo.record(payment);
      });

      return ok(payment);
    } catch (err) {
      return fail(`خطا در ثبت پرداخت: ${String(err)}`);
    }
  }
}
