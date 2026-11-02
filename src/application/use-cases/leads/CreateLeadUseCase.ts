import { z } from 'zod';
import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import { Lead, type LeadStatus } from '@/domain/entities/Lead';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';

export const CreateLeadSchema = z.object({
  name: z.string().min(1, 'نام سرنخ الزامی است.').max(100),
  mobile: z.string().min(10, 'شماره همراه باید حداقل ۱۰ رقم باشد.').max(25),
  phone: z.string().max(25).nullable().optional(),
  email: z.string().email('فرمت ایمیل نامعتبر است.').nullable().optional().or(z.literal('')),
  status: z
    .enum(['new', 'following_up', 'interested', 'converted', 'unsuccessful', 'rejected'])
    .default('new'),
  description: z.string().max(500).nullable().optional(),
  followUpDate: z.string().nullable().optional()
});

export type CreateLeadDTO = z.input<typeof CreateLeadSchema>;

export class CreateLeadUseCase {
  private readonly leadRepo: ILeadRepository;

  constructor(leadRepo: ILeadRepository) {
    this.leadRepo = leadRepo;
  }

  public async execute(dto: CreateLeadDTO): Promise<Result<Lead, string>> {
    const parseRes = CreateLeadSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    const input = parseRes.data;

    try {
      const now = new Date().toISOString();
      const lead = new Lead({
        id: generateUUID(),
        name: input.name,
        mobile: input.mobile,
        phone: input.phone,
        email: input.email || null,
        status: input.status as LeadStatus,
        description: input.description,
        followUpDate: input.followUpDate,
        createdAt: now,
        updatedAt: now
      });

      await this.leadRepo.save(lead);
      return ok(lead);
    } catch (err) {
      return fail(`خطا در ثبت سرنخ: ${String(err)}`);
    }
  }
}
