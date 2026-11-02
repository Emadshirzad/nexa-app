import type { UUID } from '@/shared/types/common';
import type { Invoice, InvoiceStatus } from '../entities/Invoice';

export interface IInvoiceRepository {
  findById(id: UUID): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
  search(query: string, status?: InvoiceStatus, customerId?: UUID): Promise<Invoice[]>;
  listAll(limit?: number): Promise<Invoice[]>;
  save(invoice: Invoice): Promise<void>;
  getNextInvoiceNumber(): Promise<string>;
  hasCancellationMovements(invoiceId: UUID): Promise<boolean>;
}
