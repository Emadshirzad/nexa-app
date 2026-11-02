import { z } from 'zod';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';
import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import { Product, ProductUnit } from '@/domain/entities/Product';
import { StockMovement } from '@/domain/entities/StockMovement';
import { Money } from '@/domain/value-objects/Money';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'نام کالا الزامی است.').max(100),
  sku: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  unit: z.enum(['piece', 'package', 'kilogram', 'gram', 'meter', 'liter', 'box', 'carton']),
  sellingPrice: z.number().int().min(0, 'قیمت فروش باید عدد مثبت یا صفر باشد.'),
  initialStock: z.number().min(0).default(0),
  minStockThreshold: z.number().min(0).default(0)
});

export type CreateProductDTO = z.input<typeof CreateProductSchema>;

export class CreateProductUseCase {
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

  public async execute(dto: CreateProductDTO): Promise<Result<Product, string>> {
    const parseRes = CreateProductSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }
    const input = parseRes.data;

    try {
      const sku = input.sku && input.sku.trim().length > 0
        ? input.sku.trim()
        : await this.productRepo.getNextSkuSequence();

      // Check unique SKU
      const existingSku = await this.productRepo.findBySku(sku);
      if (existingSku) {
        return fail(`کد کالا (SKU) "${sku}" قبلاً ثبت شده است.`);
      }

      const now = new Date().toISOString();
      const productId = generateUUID();
      const initialStockQty = StockQuantity.fromDecimal(input.initialStock);
      const minStockThresholdQty = StockQuantity.fromDecimal(input.minStockThreshold);
      const price = Money.fromToman(input.sellingPrice);

      const product = new Product({
        id: productId,
        categoryId: input.categoryId || null,
        name: input.name,
        sku,
        unit: input.unit as ProductUnit,
        sellingPrice: price,
        stockQuantity: initialStockQty,
        minStockThreshold: minStockThresholdQty,
        isArchived: false,
        createdAt: now,
        updatedAt: now
      });

      // Atomic execution: Product + Initial stock movement
      await this.driver.transaction(async () => {
        await this.productRepo.save(product);

        if (!initialStockQty.isZero()) {
          const movement = new StockMovement({
            id: generateUUID(),
            productId,
            movementType: 'initial',
            quantity: initialStockQty,
            referenceType: 'initial_stock',
            reason: 'ثبت موجودی اولیه کالا',
            createdAt: now
          });
          await this.movementRepo.record(movement);
        }
      });

      return ok(product);
    } catch (err) {
      return fail(`خطا در ایجاد کالا: ${String(err)}`);
    }
  }
}
