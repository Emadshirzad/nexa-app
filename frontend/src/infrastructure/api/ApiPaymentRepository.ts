import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment, type PaymentMethod } from '@/domain/entities/Payment';
import { Money } from '@/domain/value-objects/Money';
import { ApiClient } from './ApiClient';
import type { UUID } from '@/shared/types/common';

export class ApiPaymentRepository implements IPaymentRepository {
  private api = ApiClient.getInstance();

  private toDomain(data: any): Payment {
    return new Payment({
      id: data.id as UUID,
      invoiceId: (data.invoice_id as UUID) || null,
      customerId: (data.customer_id as UUID) || null,
      amount: Money.fromToman(Number(data.amount) || 0),
      paymentMethod: (data.payment_method as PaymentMethod) || 'cash',
      paymentDate: data.payment_date,
      referenceNumber: data.reference_number ?? undefined,
      notes: data.notes ?? undefined,
      isVoided: Boolean(data.is_voided),
      voidedAt: data.voided_at ?? undefined,
      voidReason: data.void_reason ?? undefined,
      createdAt: data.created_at || new Date().toISOString()
    });
  }

  public async record(payment: Payment): Promise<void> {
    if (!payment.invoiceId) {
      throw new Error('فاکتور برای ثبت پرداخت الزامی است.');
    }

    await this.api.post(`/invoices/${payment.invoiceId}/payments`, {
      id: payment.id,
      amount: payment.amount.value,
      payment_method: payment.paymentMethod,
      payment_date: payment.paymentDate,
      reference_number: payment.referenceNumber ?? null,
      notes: payment.notes ?? null
    });
  }

  public async findByInvoiceId(invoiceId: UUID): Promise<Payment[]> {
    try {
      const res = await this.api.get<any[]>(`/invoices/${invoiceId}/payments`);
      const list = Array.isArray(res) ? res : [];
      return list.map((item) => this.toDomain(item));
    } catch {
      return [];
    }
  }

  public async findByCustomerId(customerId: UUID): Promise<Payment[]> {
    try {
      const res = await this.api.get<any[]>(`/customers/${customerId}/payments`);
      const list = Array.isArray(res) ? res : [];
      return list.map((item) => this.toDomain(item));
    } catch {
      return [];
    }
  }

  public async voidPayment(paymentId: UUID, reason: string): Promise<void> {
    await this.api.patch(`/payments/${paymentId}/void`, { reason });
  }
}
