import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';
import { StockMovement, StockMovementType } from '@/domain/entities/StockMovement';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import type { IDatabaseDriver } from '../database/IDatabaseDriver';
import type { UUID } from '@/shared/types/common';

interface StockMovementRow {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string;
  created_at: string;
}

export class SqliteStockMovementRepository implements IStockMovementRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async record(movement: StockMovement): Promise<void> {
    await this.driver.run(
      `INSERT INTO stock_movements (
        id, product_id, movement_type, quantity, reference_type, reference_id, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        movement.id,
        movement.productId,
        movement.movementType,
        movement.quantity.scaledValue,
        movement.referenceType ?? null,
        movement.referenceId ?? null,
        movement.reason,
        movement.createdAt
      ]
    );
  }

  public async findByProductId(productId: UUID): Promise<StockMovement[]> {
    const rows = await this.driver.query<StockMovementRow>(
      `SELECT id, product_id, movement_type, quantity, reference_type, reference_id, reason, created_at
       FROM stock_movements
       WHERE product_id = ?
       ORDER BY created_at DESC;`,
      [productId]
    );

    return rows.map(
      (r) =>
        new StockMovement({
          id: r.id,
          productId: r.product_id,
          movementType: r.movement_type as StockMovementType,
          quantity: StockQuantity.fromScaled(r.quantity),
          referenceType: r.reference_type,
          referenceId: r.reference_id,
          reason: r.reason,
          createdAt: r.created_at
        })
    );
  }

  public async calculateReconciledStock(productId: UUID): Promise<StockQuantity> {
    const rows = await this.driver.query<{ total: number | null }>(
      `SELECT SUM(quantity) as total FROM stock_movements WHERE product_id = ?;`,
      [productId]
    );
    const totalScaled = rows[0]?.total ?? 0;
    return StockQuantity.fromScaled(totalScaled);
  }
}
