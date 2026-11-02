import type { IBusinessProfileRepository } from '@/domain/repositories/IBusinessProfileRepository';
import type { BusinessProfile } from '@/domain/entities/BusinessProfile';

export class GetBusinessProfileUseCase {
  private readonly profileRepo: IBusinessProfileRepository;

  constructor(profileRepo: IBusinessProfileRepository) {
    this.profileRepo = profileRepo;
  }

  public async execute(): Promise<BusinessProfile | null> {
    return this.profileRepo.getProfile();
  }
}
