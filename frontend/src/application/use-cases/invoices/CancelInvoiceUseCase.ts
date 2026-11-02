import { z } from 'zod';
import type { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';
import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';

import { StockMovement } from '@/domain/entities/StockMovement';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';

export const CancelInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  reason: z.string().min(2, 'درج دلیل ابطال فاکتور الزامی است.').max(200)
});

export type CancelInvoiceDTO = z.infer<typeof CancelInvoiceSchema>;

export class CancelInvoiceUseCase {
  private readonly invoiceRepo: IInvoiceRepository;
  private readonly productRepo: IProductRepository;
  private readonly movementRepo: IStockMovementRepository;
  private readonly driver: IDatabaseDriver;

  constructor(
    invoiceRepo: IInvoiceRepository,
    productRepo: IProductRepository,
    movementRepo: IStockMovementRepository,
    driver: IDatabaseDriver
  ) {
    this.invoiceRepo = invoiceRepo;
    this.productRepo = productRepo;
    this.movementRepo = movementRepo;
    this.driver = driver;
  }

  public async execute(dto: CancelInvoiceDTO): Promise<Result<void, string>> {
    const parseRes = CancelInvoiceSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    try {
      const invoice = await this.invoiceRepo.findById(dto.invoiceId as UUID);
      if (!invoice) {
        return fail('فاکتور مورد نظر یافت نشد.');
      }

      // Idempotency: If already cancelled, do not repeat or re-restore stock
      if (invoice.isCancelled()) {
        return ok(undefined);
      }

      // Verify that cancellation movements have not been recorded yet
      const alreadyRestored = await this.invoiceRepo.hasCancellationMovements(invoice.id);
      if (alreadyRestored) {
        // Just ensure invoice status is marked cancelled
        invoice.cancel(dto.reason);
        await this.invoiceRepo.save(invoice);
        return ok(undefined);
      }

      const now = new Date().toISOString();

      // Atomic Execution: Mark invoice cancelled + Compensatory stock restoration
      await this.driver.transaction(async () => {
        // 1. Mark Invoice as Cancelled
        invoice.cancel(dto.reason);
        await this.invoiceRepo.save(invoice);

        // 2. Restore Inventory exactly once per invoice item
        for (const item of invoice.items) {
          if (item.productId) {
            const product = await this.productRepo.findById(item.productId);
            if (product) {
              const restorationMovement = new StockMovement({
                id: generateUUID(),
                productId: product.id,
                movementType: 'invoice_cancellation',
                quantity: item.quantity, // Positive quantity restores stock
                referenceType: 'invoice',
                referenceId: invoice.id,
                reason: `ابطال فاکتور ${invoice.invoiceNumber}: ${dto.reason.trim()}`,
                createdAt: now
              });

              await this.movementRepo.record(restorationMovement);

              // Update product cached stock
              const newStockScaled = product.stockQuantity.scaledValue + item.quantity.scaledValue;
              product.updateCachedStock(StockQuantity.fromScaled(newStockScaled));
              await this.productRepo.save(product);
            }
          }
        }
      });

      return ok(undefined);
    } catch (err) {
      return fail(`خطا در ابطال فاکتور: ${String(err)}`);
    }
  }
}
