import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment, PaymentMethod } from '@/domain/entities/Payment';
import { Money } from '@/domain/value-objects/Money';
import type { IDatabaseDriver } from '../database/IDatabaseDriver';
import type { UUID } from '@/shared/types/common';
import { generateUUID } from '@/shared/utils/id';

interface PaymentRow {
  id: string;
  invoice_id: string | null;
  customer_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  is_voided: number;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
}

export class SqlitePaymentRepository implements IPaymentRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async record(payment: Payment): Promise<void> {
    await this.driver.transaction(async (tx) => {
      // 1. Insert Payment Record
      await tx.run(
        `INSERT INTO payments (
          id, invoice_id, customer_id, amount, payment_method, payment_date,
          reference_number, notes, is_voided, voided_at, void_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          payment.id,
          payment.invoiceId ?? null,
          payment.customerId ?? null,
          payment.amount.value,
          payment.paymentMethod,
          payment.paymentDate,
          payment.referenceNumber ?? null,
          payment.notes ?? null,
          payment.isVoided ? 1 : 0,
          payment.voidedAt ?? null,
          payment.voidReason ?? null,
          payment.createdAt
        ]
      );

      // 2. Atomic append to global Cash Ledger
      const lastTxRows = await tx.query<{ balance_after: number }>(
        `SELECT balance_after FROM cash_transactions ORDER BY rowid DESC LIMIT 1;`
      );
      const currentCashBalance = lastTxRows[0]?.balance_after ?? 0;
      const newCashBalance = currentCashBalance + payment.amount.value;

      await tx.run(
        `INSERT INTO cash_transactions (
          id, transaction_type, amount, balance_after, reference_type, reference_id,
          description, transaction_date, created_at
        ) VALUES (?, 'invoice_payment', ?, ?, 'payment', ?, ?, ?, ?);`,
        [
          generateUUID(),
          payment.amount.value,
          newCashBalance,
          payment.id,
          `دریافت وجه بابت فاکتور (${payment.referenceNumber || payment.paymentMethod})`,
          payment.paymentDate,
          payment.createdAt
        ]
      );
    });
  }

  public async findByInvoiceId(invoiceId: UUID): Promise<Payment[]> {
    const rows = await this.driver.query<PaymentRow>(
      `SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date ASC;`,
      [invoiceId]
    );
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async findByCustomerId(customerId: UUID): Promise<Payment[]> {
    const rows = await this.driver.query<PaymentRow>(
      `SELECT * FROM payments WHERE customer_id = ? ORDER BY payment_date DESC;`,
      [customerId]
    );
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async voidPayment(paymentId: UUID, reason: string): Promise<void> {
    await this.driver.transaction(async (tx) => {
      const rows = await tx.query<PaymentRow>(`SELECT * FROM payments WHERE id = ?;`, [paymentId]);
      if (!rows[0]) throw new Error('تراکنش پرداخت یافت نشد.');
      const row = rows[0];

      const now = new Date().toISOString();
      await tx.run(
        `UPDATE payments SET is_voided = 1, voided_at = ?, void_reason = ? WHERE id = ?;`,
        [now, reason.trim(), paymentId]
      );

      // Compensating transaction in cash ledger
      const lastTxRows = await tx.query<{ balance_after: number }>(
        `SELECT balance_after FROM cash_transactions ORDER BY rowid DESC LIMIT 1;`
      );
      const currentCashBalance = lastTxRows[0]?.balance_after ?? 0;
      const newCashBalance = currentCashBalance - row.amount;

      await tx.run(
        `INSERT INTO cash_transactions (
          id, transaction_type, amount, balance_after, reference_type, reference_id,
          description, transaction_date, created_at
        ) VALUES (?, 'adjustment', ?, ?, 'voided_payment', ?, ?, ?, ?);`,
        [
          generateUUID(),
          -row.amount,
          newCashBalance,
          paymentId,
          `ابطال تراکنش پرداخت: ${reason.trim()}`,
          now.substring(0, 10),
          now
        ]
      );
    });
  }

  private mapRowToEntity(row: PaymentRow): Payment {
    return new Payment({
      id: row.id,
      invoiceId: row.invoice_id,
      customerId: row.customer_id,
      amount: Money.fromToman(row.amount),
      paymentMethod: row.payment_method as PaymentMethod,
      paymentDate: row.payment_date,
      referenceNumber: row.reference_number,
      notes: row.notes,
      isVoided: Boolean(row.is_voided),
      voidedAt: row.voided_at,
      voidReason: row.void_reason,
      createdAt: row.created_at
    });
  }
}
