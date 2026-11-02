import { z } from 'zod';
import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import { Customer } from '@/domain/entities/Customer';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';

export const ConvertLeadSchema = z.object({
  leadId: z.string().uuid('شناسه سرنخ نامعتبر است.'),
  address: z.string().max(250).nullable().optional(),
  tags: z.array(z.string()).default([])
});

export type ConvertLeadDTO = z.input<typeof ConvertLeadSchema>;

export class ConvertLeadToCustomerUseCase {
  private readonly leadRepo: ILeadRepository;
  private readonly customerRepo: ICustomerRepository;
  private readonly driver: IDatabaseDriver;

  constructor(
    leadRepo: ILeadRepository,
    customerRepo: ICustomerRepository,
    driver: IDatabaseDriver
  ) {
    this.leadRepo = leadRepo;
    this.customerRepo = customerRepo;
    this.driver = driver;
  }

  public async execute(dto: ConvertLeadDTO): Promise<Result<Customer, string>> {
    const parseRes = ConvertLeadSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    try {
      const lead = await this.leadRepo.findById(dto.leadId as UUID);
      if (!lead) {
        return fail('سرنخ مورد نظر یافت نشد.');
      }

      if (lead.isConverted() && lead.convertedCustomerId) {
        const existing = await this.customerRepo.findById(lead.convertedCustomerId);
        if (existing) {
          return ok(existing);
        }
      }

      const now = new Date().toISOString();

      // Check if customer with this mobile already exists
      let customer = await this.customerRepo.findByMobile(lead.mobile);

      await this.driver.transaction(async () => {
        if (!customer) {
          customer = new Customer({
            id: generateUUID(),
            name: lead.name,
            mobile: lead.mobile,
            phone: lead.phone,
            address: dto.address || null,
            notes: lead.description || 'تبدیل‌شده از سرنخ فروش',
            followUpDate: lead.followUpDate,
            tags: dto.tags || ['تبدیل‌شده'],
            isArchived: false,
            createdAt: now,
            updatedAt: now
          });

          await this.customerRepo.save(customer);
        }

        lead.convertToCustomer(customer.id);
        await this.leadRepo.save(lead);
      });

      return ok(customer!);
    } catch (err) {
      return fail(`خطا در تبدیل سرنخ به مشتری: ${String(err)}`);
    }
  }
}
