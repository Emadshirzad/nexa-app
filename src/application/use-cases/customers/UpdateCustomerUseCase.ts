import { z } from 'zod';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { UUID } from '@/shared/types/common';
import { Result, ok, fail } from '@/shared/types/result';

export const UpdateCustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'نام مشتری الزامی است.').max(100),
  mobile: z.string().min(10, 'شماره همراه باید حداقل ۱۰ رقم باشد.').max(25),
  phone: z.string().max(25).nullable().optional(),
  address: z.string().max(250).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  followUpDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

export type UpdateCustomerDTO = z.infer<typeof UpdateCustomerSchema>;

export class UpdateCustomerUseCase {
  private readonly customerRepo: ICustomerRepository;

  constructor(customerRepo: ICustomerRepository) {
    this.customerRepo = customerRepo;
  }

  public async execute(dto: UpdateCustomerDTO): Promise<Result<void, string>> {
    const parseRes = UpdateCustomerSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    try {
      const customer = await this.customerRepo.findById(dto.id as UUID);
      if (!customer) {
        return fail('مشتری مورد نظر یافت نشد.');
      }

      const cleanedMobile = dto.mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');

      // If mobile changed, verify uniqueness
      if (cleanedMobile !== customer.mobile) {
        const existing = await this.customerRepo.findByMobile(cleanedMobile);
        if (existing && existing.id !== customer.id) {
          return fail(`شماره همراه ${cleanedMobile} برای مشتری دیگری ثبت شده است.`);
        }
      }

      customer.update({
        name: dto.name,
        mobile: cleanedMobile,
        phone: dto.phone,
        address: dto.address,
        notes: dto.notes,
        followUpDate: dto.followUpDate,
        tags: dto.tags
      });

      await this.customerRepo.save(customer);
      return ok(undefined);
    } catch (err) {
      return fail(`خطا در ویرایش مشتری: ${String(err)}`);
    }
  }
}
