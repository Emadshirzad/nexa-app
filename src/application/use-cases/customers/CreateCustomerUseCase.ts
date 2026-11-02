import { z } from 'zod';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { Customer } from '@/domain/entities/Customer';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'نام مشتری الزامی است.').max(100),
  mobile: z.string().min(10, 'شماره همراه باید حداقل ۱۰ رقم باشد.').max(25),
  phone: z.string().max(25).nullable().optional(),
  address: z.string().max(250).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  followUpDate: z.string().nullable().optional(),
  tags: z.array(z.string()).default([])
});

export type CreateCustomerDTO = z.infer<typeof CreateCustomerSchema>;

export class CreateCustomerUseCase {
  private readonly customerRepo: ICustomerRepository;

  constructor(customerRepo: ICustomerRepository) {
    this.customerRepo = customerRepo;
  }

  public async execute(dto: CreateCustomerDTO): Promise<Result<Customer, string>> {
    const parseRes = CreateCustomerSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    try {
      const cleanedMobile = dto.mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');

      // Enforce duplicate mobile prohibition
      const existing = await this.customerRepo.findByMobile(cleanedMobile);
      if (existing) {
        return fail(`مشتری با شماره همراه ${cleanedMobile} قبلاً با نام "${existing.name}" ثبت شده است.`);
      }

      const now = new Date().toISOString();
      const customer = new Customer({
        id: generateUUID(),
        name: dto.name,
        mobile: cleanedMobile,
        phone: dto.phone || null,
        address: dto.address || null,
        notes: dto.notes || null,
        followUpDate: dto.followUpDate || null,
        isArchived: false,
        tags: dto.tags || [],
        createdAt: now,
        updatedAt: now
      });

      await this.customerRepo.save(customer);

      // If initial note was provided, record in customer_notes
      if (dto.notes && dto.notes.trim()) {
        await this.customerRepo.addNote(customer.id, dto.notes.trim());
      }

      return ok(customer);
    } catch (err) {
      return fail(`خطا در ثبت مشتری: ${String(err)}`);
    }
  }
}
