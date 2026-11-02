import type { IProductRepository } from '../repositories/IProductRepository';
import type { IStockMovementRepository } from '../repositories/IStockMovementRepository';
import type { UUID } from '@/shared/types/common';

export interface ReconciliationReport {
  productId: UUID;
  productName: string;
  cachedStock: number;
  ledgerStock: number;
  isConsistent: boolean;
  discrepancy: number;
}

export class StockReconciliationService {
  private readonly productRepo: IProductRepository;
  private readonly movementRepo: IStockMovementRepository;

  constructor(productRepo: IProductRepository, movementRepo: IStockMovementRepository) {
    this.productRepo = productRepo;
    this.movementRepo = movementRepo;
  }

  public async reconcileProduct(productId: UUID): Promise<ReconciliationReport> {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new Error(`محصول با شناسه ${productId} یافت نشد.`);
    }

    const ledgerStock = await this.movementRepo.calculateReconciledStock(productId);
    const cachedStock = product.stockQuantity;

    const isConsistent = cachedStock.scaledValue === ledgerStock.scaledValue;
    const discrepancy = cachedStock.scaledValue - ledgerStock.scaledValue;

    if (!isConsistent) {
      // Reconcile product cache to match immutable ledger truth
      product.updateCachedStock(ledgerStock);
      await this.productRepo.save(product);
    }

    return {
      productId,
      productName: product.name,
      cachedStock: cachedStock.toDecimal(),
      ledgerStock: ledgerStock.toDecimal(),
      isConsistent,
      discrepancy: discrepancy / 1000
    };
  }
}
