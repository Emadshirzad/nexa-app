import { z } from 'zod';
import type { IBusinessProfileRepository } from '@/domain/repositories/IBusinessProfileRepository';
import { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';

export const SetupProfileSchema = z.object({
  name: z.string().min(1, 'نام کسب‌وکار الزامی است.').max(100),
  phone: z.string().optional(),
  email: z.string().email('ایمیل وارد شده نامعتبر است.').optional().or(z.literal('')),
  address: z.string().max(250).optional(),
  description: z.string().max(500).optional()
});

export type SetupProfileDTO = z.infer<typeof SetupProfileSchema>;

export class SetupBusinessProfileUseCase {
  private readonly profileRepo: IBusinessProfileRepository;

  constructor(profileRepo: IBusinessProfileRepository) {
    this.profileRepo = profileRepo;
  }

  public async execute(dto: SetupProfileDTO): Promise<Result<BusinessProfile, string>> {
    const parseRes = SetupProfileSchema.safeParse(dto);
    if (!parseRes.success) {
      const errMessage = parseRes.error.errors.map((e) => e.message).join('، ');
      return fail(errMessage);
    }

    try {
      const existing = await this.profileRepo.getProfile();
      const now = new Date().toISOString();

      let profile: BusinessProfile;
      if (existing) {
        existing.update({
          name: dto.name,
          phone: dto.phone,
          email: dto.email || undefined,
          address: dto.address,
          description: dto.description
        });
        profile = existing;
      } else {
        profile = new BusinessProfile({
          id: generateUUID(),
          name: dto.name,
          phone: dto.phone,
          email: dto.email || undefined,
          address: dto.address,
          description: dto.description,
          createdAt: now,
          updatedAt: now
        });
      }

      await this.profileRepo.saveProfile(profile);
      return ok(profile);
    } catch (err) {
      return fail(`خطا در ذخیره پروفایل: ${String(err)}`);
    }
  }
}
