import type { UUID } from '@/shared/types/common';
import type { StockMovement } from '../entities/StockMovement';
import type { StockQuantity } from '../value-objects/StockQuantity';

export interface IStockMovementRepository {
  record(movement: StockMovement): Promise<void>;
  findByProductId(productId: UUID): Promise<StockMovement[]>;
  calculateReconciledStock(productId: UUID): Promise<StockQuantity>;
}
