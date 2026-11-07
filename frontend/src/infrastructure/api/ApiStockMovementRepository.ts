import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';
import { StockMovement, type StockMovementType } from '@/domain/entities/StockMovement';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import { ApiClient } from './ApiClient';
import type { UUID } from '@/shared/types/common';

const POSITIVE_MOVEMENT_TYPES: StockMovementType[] = [
  'initial',
  'addition',
  'invoice_cancellation',
  'adjustment'
];

export class ApiStockMovementRepository implements IStockMovementRepository {
  private api = ApiClient.getInstance();

  private toDomain(data: any): StockMovement {
    const rawQty = Math.abs(Number(data.quantity) || 0);
    const mType = data.movement_type as StockMovementType;
    const isPos = POSITIVE_MOVEMENT_TYPES.includes(mType);
    const scaled = isPos ? rawQty : -rawQty;

    return new StockMovement({
      id: data.id as UUID,
      productId: data.product_id as UUID,
      movementType: mType,
      quantity: StockQuantity.fromScaled(scaled),
      referenceType: data.reference_type ?? null,
      referenceId: data.reference_id ?? null,
      reason: data.reason || '',
      createdAt: data.created_at || new Date().toISOString()
    });
  }

  public async record(movement: StockMovement): Promise<void> {
    await this.api.post('/stock-movements', {
      id: movement.id,
      product_id: movement.productId,
      movement_type: movement.movementType,
      quantity: Math.abs(movement.quantity.scaledValue),
      reference_type: movement.referenceType ?? null,
      reference_id: movement.referenceId ?? null,
      reason: movement.reason
    });
  }

  public async findByProductId(productId: UUID): Promise<StockMovement[]> {
    const res = await this.api.get<any[]>('/stock-movements', { product_id: productId });
    const list = Array.isArray(res) ? res : [];
    return list.map((item) => this.toDomain(item));
  }

  public async calculateReconciledStock(productId: UUID): Promise<StockQuantity> {
    try {
      const res = await this.api.get<{ reconciled_stock: number }>(`/stock-movements/reconciled/${productId}`);
      return StockQuantity.fromScaled(Number(res.reconciled_stock) || 0);
    } catch {
      const movements = await this.findByProductId(productId);
      let totalScaled = 0;
      for (const m of movements) {
        if (POSITIVE_MOVEMENT_TYPES.includes(m.movementType)) {
          totalScaled += Math.abs(m.quantity.scaledValue);
        } else {
          totalScaled -= Math.abs(m.quantity.scaledValue);
        }
      }
      return StockQuantity.fromScaled(totalScaled);
    }
  }
}
