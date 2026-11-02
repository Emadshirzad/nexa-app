import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { UUID } from '@/shared/types/common';
import { Result, ok, fail } from '@/shared/types/result';

export class ArchiveProductUseCase {
  private readonly productRepo: IProductRepository;

  constructor(productRepo: IProductRepository) {
    this.productRepo = productRepo;
  }

  public async execute(productId: UUID): Promise<Result<void, string>> {
    try {
      const product = await this.productRepo.findById(productId);
      if (!product) {
        return fail('کالای مورد نظر یافت نشد.');
      }

      product.archive();
      await this.productRepo.save(product);
      return ok(undefined);
    } catch (err) {
      return fail(`خطا در بایگانی کالا: ${String(err)}`);
    }
  }

  public async unarchive(productId: UUID): Promise<Result<void, string>> {
    try {
      const product = await this.productRepo.findById(productId);
      if (!product) {
        return fail('کالای مورد نظر یافت نشد.');
      }

      product.unarchive();
      await this.productRepo.save(product);
      return ok(undefined);
    } catch (err) {
      return fail(`خطا در بازگردانی کالا: ${String(err)}`);
    }
  }
}
