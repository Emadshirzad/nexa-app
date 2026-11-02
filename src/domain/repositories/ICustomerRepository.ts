import type { UUID } from '@/shared/types/common';
import type { Customer } from '../entities/Customer';

export interface CustomerFinancialSummary {
  totalPurchases: number; // Integer Toman
  totalPayments: number;  // Integer Toman
  outstandingDebt: number;// Integer Toman
  invoiceCount: number;
}

export interface CustomerNote {
  id: UUID;
  customerId: UUID;
  content: string;
  createdAt: string;
}

export interface ICustomerRepository {
  findById(id: UUID): Promise<Customer | null>;
  findByMobile(mobile: string): Promise<Customer | null>;
  search(query: string, tag?: string, includeArchived?: boolean): Promise<Customer[]>;
  listAll(includeArchived?: boolean): Promise<Customer[]>;
  save(customer: Customer): Promise<void>;
  getFinancialSummary(customerId: UUID): Promise<CustomerFinancialSummary>;
  addNote(customerId: UUID, content: string): Promise<CustomerNote>;
  getNotes(customerId: UUID): Promise<CustomerNote[]>;
  listTags(): Promise<string[]>;
}
