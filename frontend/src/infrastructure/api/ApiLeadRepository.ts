import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import { Lead, type LeadStatus } from '@/domain/entities/Lead';
import { ApiClient } from './ApiClient';
import type { UUID } from '@/shared/types/common';

export class ApiLeadRepository implements ILeadRepository {
  private api = ApiClient.getInstance();

  private toDomain(data: any): Lead {
    return new Lead({
      id: data.id as UUID,
      name: data.name,
      mobile: data.mobile,
      phone: data.phone ?? undefined,
      email: data.email ?? undefined,
      status: (data.status as LeadStatus) || 'new',
      description: data.description ?? undefined,
      followUpDate: data.follow_up_date ?? undefined,
      convertedCustomerId: (data.converted_customer_id as UUID) || undefined,
      convertedAt: data.converted_at ?? undefined,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    });
  }

  public async findById(id: UUID): Promise<Lead | null> {
    try {
      const data = await this.api.get<any>(`/leads/${id}`);
      return data ? this.toDomain(data) : null;
    } catch {
      return null;
    }
  }

  public async findByMobile(mobile: string): Promise<Lead | null> {
    const cleaned = mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');
    const list = await this.listAll({ search: cleaned });
    return list.find((l) => l.mobile === cleaned) ?? null;
  }

  public async listAll(options?: {
    status?: LeadStatus;
    search?: string;
    limit?: number;
  }): Promise<Lead[]> {
    const res = await this.api.get<any>('/leads', {
      status: options?.status,
      q: options?.search?.trim() || undefined,
      limit: options?.limit,
      all: !options?.limit
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async countByStatus(): Promise<Record<LeadStatus, number>> {
    try {
      return await this.api.get<Record<LeadStatus, number>>('/leads/status-counts');
    } catch {
      return {
        new: 0,
        following_up: 0,
        interested: 0,
        converted: 0,
        unsuccessful: 0,
        rejected: 0
      };
    }
  }

  public async save(lead: Lead): Promise<void> {
    const payload = {
      name: lead.name,
      mobile: lead.mobile,
      phone: lead.phone ?? null,
      email: lead.email ?? null,
      status: lead.status,
      description: lead.description ?? null,
      follow_up_date: lead.followUpDate ?? null,
      converted_customer_id: lead.convertedCustomerId ?? null,
      converted_at: lead.convertedAt ?? null
    };

    try {
      const existing = await this.findById(lead.id);
      if (existing) {
        await this.api.put(`/leads/${lead.id}`, payload);
      } else {
        await this.api.post('/leads', { id: lead.id, ...payload });
      }
    } catch {
      await this.api.post('/leads', { id: lead.id, ...payload });
    }
  }

  public async delete(id: UUID): Promise<void> {
    await this.api.delete(`/leads/${id}`);
  }
}
