import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { UUID } from '@/shared/types/common';
import { Result, ok, fail } from '@/shared/types/result';

export class ArchiveCustomerUseCase {
  private readonly customerRepo: ICustomerRepository;

  constructor(customerRepo: ICustomerRepository) {
    this.customerRepo = customerRepo;
  }

  public async execute(customerId: UUID): Promise<Result<void, string>> {
    try {
      const customer = await this.customerRepo.findById(customerId);
      if (!customer) {
        return fail('مشتری یافت نشد.');
      }

      customer.archive();
      await this.customerRepo.save(customer);
      return ok(undefined);
    } catch (err) {
      return fail(`خطا در بایگانی مشتری: ${String(err)}`);
    }
  }

  public async unarchive(customerId: UUID): Promise<Result<void, string>> {
    try {
      const customer = await this.customerRepo.findById(customerId);
      if (!customer) {
        return fail('مشتری یافت نشد.');
      }

      customer.unarchive();
      await this.customerRepo.save(customer);
      return ok(undefined);
    } catch (err) {
      return fail(`خطا در بازگردانی مشتری: ${String(err)}`);
    }
  }
}
