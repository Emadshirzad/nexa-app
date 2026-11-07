import type { IBusinessProfileRepository } from '@/domain/repositories/IBusinessProfileRepository';
import { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { ApiClient } from './ApiClient';
import type { UUID } from '@/shared/types/common';

export class ApiBusinessProfileRepository implements IBusinessProfileRepository {
  private api = ApiClient.getInstance();

  public async getProfile(): Promise<BusinessProfile | null> {
    try {
      const data = await this.api.get<any>('/business-profile');
      if (!data || !data.id || !data.name) {
        return null;
      }
      return new BusinessProfile({
        id: data.id as UUID,
        name: data.name,
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        address: data.address ?? undefined,
        description: data.description ?? undefined,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString()
      });
    } catch {
      return null;
    }
  }

  public async saveProfile(profile: BusinessProfile): Promise<void> {
    await this.api.post('/business-profile', {
      name: profile.name,
      phone: profile.phone ?? null,
      email: profile.email ?? null,
      address: profile.address ?? null,
      description: profile.description ?? null
    });
  }

  public async hasProfile(): Promise<boolean> {
    const profile = await this.getProfile();
    return profile !== null;
  }
}
