import type {
  ICustomerRepository,
  CustomerFinancialSummary,
  CustomerNote
} from '@/domain/repositories/ICustomerRepository';
import { Customer } from '@/domain/entities/Customer';
import { ApiClient } from './ApiClient';
import type { UUID } from '@/shared/types/common';

export class ApiCustomerRepository implements ICustomerRepository {
  private api = ApiClient.getInstance();

  private toDomain(data: any): Customer {
    return new Customer({
      id: data.id as UUID,
      name: data.name,
      mobile: data.mobile,
      phone: data.phone ?? undefined,
      address: data.address ?? undefined,
      notes: data.notes ?? undefined,
      followUpDate: data.follow_up_date ?? undefined,
      isArchived: Boolean(data.is_archived),
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    });
  }

  public async findById(id: UUID): Promise<Customer | null> {
    try {
      const data = await this.api.get<any>(`/customers/${id}`);
      return data ? this.toDomain(data) : null;
    } catch {
      return null;
    }
  }

  public async findByMobile(mobile: string): Promise<Customer | null> {
    const cleaned = mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');
    const list = await this.search(cleaned, undefined, true);
    return list.find((c) => c.mobile === cleaned) ?? null;
  }

  public async search(query: string, tag?: string, includeArchived?: boolean): Promise<Customer[]> {
    const res = await this.api.get<any>('/customers', {
      q: query.trim() || undefined,
      tag: tag || undefined,
      include_archived: includeArchived ? 1 : 0,
      all: true
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async listAll(includeArchived?: boolean): Promise<Customer[]> {
    const res = await this.api.get<any>('/customers', {
      include_archived: includeArchived ? 1 : 0,
      all: true
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async save(customer: Customer): Promise<void> {
    const payload = {
      name: customer.name,
      mobile: customer.mobile,
      phone: customer.phone ?? null,
      address: customer.address ?? null,
      notes: customer.notes ?? null,
      follow_up_date: customer.followUpDate ?? null,
      is_archived: customer.isArchived,
      tags: customer.tags
    };

    try {
      const existing = await this.findById(customer.id);
      if (existing) {
        await this.api.put(`/customers/${customer.id}`, payload);
      } else {
        await this.api.post('/customers', { id: customer.id, ...payload });
      }
    } catch {
      await this.api.post('/customers', { id: customer.id, ...payload });
    }
  }

  public async getFinancialSummary(customerId: UUID): Promise<CustomerFinancialSummary> {
    try {
      const res = await this.api.get<CustomerFinancialSummary>(`/customers/${customerId}/financial-summary`);
      return {
        totalPurchases: Number(res.totalPurchases) || 0,
        totalPayments: Number(res.totalPayments) || 0,
        outstandingDebt: Number(res.outstandingDebt) || 0,
        invoiceCount: Number(res.invoiceCount) || 0
      };
    } catch {
      return {
        totalPurchases: 0,
        totalPayments: 0,
        outstandingDebt: 0,
        invoiceCount: 0
      };
    }
  }

  public async addNote(customerId: UUID, content: string): Promise<CustomerNote> {
    const data = await this.api.post<any>(`/customers/${customerId}/notes`, { content });
    return {
      id: data.id as UUID,
      customerId: data.customer_id as UUID,
      content: data.content,
      createdAt: data.created_at || new Date().toISOString()
    };
  }

  public async getNotes(customerId: UUID): Promise<CustomerNote[]> {
    try {
      const list = await this.api.get<any[]>(`/customers/${customerId}/notes`);
      return (list || []).map((n) => ({
        id: n.id as UUID,
        customerId: n.customer_id as UUID,
        content: n.content,
        createdAt: n.created_at || new Date().toISOString()
      }));
    } catch {
      return [];
    }
  }

  public async listTags(): Promise<string[]> {
    try {
      const res = await this.api.get<string[]>('/customers/tags');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }
}
