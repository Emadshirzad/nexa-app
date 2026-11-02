import { z } from 'zod';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';
import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import { StockMovement, StockMovementType } from '@/domain/entities/StockMovement';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';

export const AdjustStockSchema = z.object({
  productId: z.string().uuid(),
  quantityChange: z.number().refine((val) => val !== 0, 'میزان تغییر موجودی نمی‌تواند صفر باشد.'),
  movementType: z.enum(['addition', 'deduction', 'adjustment']),
  reason: z.string().min(2, 'ثبت دلیل برای اصلاح موجودی انبار الزامی است.').max(200),
  allowNegativeConfirmation: z.boolean().default(false)
});

export type AdjustStockDTO = z.infer<typeof AdjustStockSchema>;

export class AdjustStockUseCase {
  private readonly productRepo: IProductRepository;
  private readonly movementRepo: IStockMovementRepository;
  private readonly driver: IDatabaseDriver;

  constructor(
    productRepo: IProductRepository,
    movementRepo: IStockMovementRepository,
    driver: IDatabaseDriver
  ) {
    this.productRepo = productRepo;
    this.movementRepo = movementRepo;
    this.driver = driver;
  }

  public async execute(dto: AdjustStockDTO): Promise<Result<{ newStock: number; isNegative: boolean }, string>> {
    const parseRes = AdjustStockSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    try {
      const product = await this.productRepo.findById(dto.productId as UUID);
      if (!product) {
        return fail('کالای مورد نظر یافت نشد.');
      }

      const deltaQty = StockQuantity.fromDecimal(dto.quantityChange);
      const newStockScaled = product.stockQuantity.scaledValue + deltaQty.scaledValue;
      const isNegative = newStockScaled < 0;

      // Negative inventory constraint
      if (isNegative && !dto.allowNegativeConfirmation) {
        return fail('موجودی کالا منفی خواهد شد. انجام این عملیات نیازمند تأیید صریح شماست.');
      }

      const now = new Date().toISOString();
      const movement = new StockMovement({
        id: generateUUID(),
        productId: product.id,
        movementType: dto.movementType as StockMovementType,
        quantity: deltaQty,
        referenceType: 'manual_adjustment',
        reason: dto.reason,
        createdAt: now
      });

      // Atomic execution: Save movement + Update cached stock
      await this.driver.transaction(async () => {
        await this.movementRepo.record(movement);
        product.updateCachedStock(StockQuantity.fromScaled(newStockScaled));
        await this.productRepo.save(product);
      });

      return ok({
        newStock: newStockScaled / 1000,
        isNegative
      });
    } catch (err) {
      return fail(`خطا در اصلاح موجودی انبار: ${String(err)}`);
    }
  }
}
