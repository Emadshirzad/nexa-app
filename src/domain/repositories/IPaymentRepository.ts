import type { UUID } from '@/shared/types/common';
import type { Payment } from '../entities/Payment';

export interface IPaymentRepository {
  record(payment: Payment): Promise<void>;
  findByInvoiceId(invoiceId: UUID): Promise<Payment[]>;
  findByCustomerId(customerId: UUID): Promise<Payment[]>;
  voidPayment(paymentId: UUID, reason: string): Promise<void>;
}
