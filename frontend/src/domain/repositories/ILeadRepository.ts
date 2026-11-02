import type { UUID } from '@/shared/types/common';
import type { Lead, LeadStatus } from '../entities/Lead';

export interface ILeadRepository {
  save(lead: Lead): Promise<void>;
  findById(id: UUID): Promise<Lead | null>;
  findByMobile(mobile: string): Promise<Lead | null>;
  listAll(options?: { status?: LeadStatus; search?: string; limit?: number }): Promise<Lead[]>;
  countByStatus(): Promise<Record<LeadStatus, number>>;
  delete(id: UUID): Promise<void>;
}
