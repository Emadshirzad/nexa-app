import { z } from 'zod';
import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import { Lead, type LeadStatus } from '@/domain/entities/Lead';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';

export const UpdateLeadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  mobile: z.string().min(10).max(25).optional(),
  phone: z.string().max(25).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  status: z
    .enum(['new', 'following_up', 'interested', 'converted', 'unsuccessful', 'rejected'])
    .optional(),
  description: z.string().max(500).nullable().optional(),
  followUpDate: z.string().nullable().optional()
});

export type UpdateLeadDTO = z.input<typeof UpdateLeadSchema>;

export class UpdateLeadUseCase {
  private readonly leadRepo: ILeadRepository;

  constructor(leadRepo: ILeadRepository) {
    this.leadRepo = leadRepo;
  }

  public async execute(dto: UpdateLeadDTO): Promise<Result<Lead, string>> {
    const parseRes = UpdateLeadSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    try {
      const lead = await this.leadRepo.findById(dto.id as UUID);
      if (!lead) {
        return fail('سرنخ مورد نظر یافت نشد.');
      }

      if (dto.status && dto.status !== lead.status) {
        lead.updateStatus(dto.status as LeadStatus);
      }

      lead.updateDetails({
        name: dto.name,
        mobile: dto.mobile,
        phone: dto.phone,
        email: dto.email,
        description: dto.description,
        followUpDate: dto.followUpDate
      });

      await this.leadRepo.save(lead);
      return ok(lead);
    } catch (err) {
      return fail(`خطا در ویرایش سرنخ: ${String(err)}`);
    }
  }
}
