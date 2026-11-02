import type { BusinessProfile } from '../entities/BusinessProfile';

export interface IBusinessProfileRepository {
  getProfile(): Promise<BusinessProfile | null>;
  saveProfile(profile: BusinessProfile): Promise<void>;
  hasProfile(): Promise<boolean>;
}
