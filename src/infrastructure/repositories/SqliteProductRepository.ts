import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product, ProductUnit } from '@/domain/entities/Product';
import { Money } from '@/domain/value-objects/Money';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import type { IDatabaseDriver } from '../database/IDatabaseDriver';
import type { UUID } from '@/shared/types/common';

interface ProductRow {
  id: string;
  category_id: string | null;
  name: string;
  sku: string;
  unit: string;
  selling_price: number;
  stock_quantity: number;
  min_stock_threshold: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export class SqliteProductRepository implements IProductRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async findById(id: UUID): Promise<Product | null> {
    const rows = await this.driver.query<ProductRow>(
      `SELECT * FROM products WHERE id = ?;`,
      [id]
    );
    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  public async findBySku(sku: string): Promise<Product | null> {
    const rows = await this.driver.query<ProductRow>(
      `SELECT * FROM products WHERE sku = ?;`,
      [sku]
    );
    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  public async search(query: string, categoryId?: UUID | null, includeArchived: boolean = false): Promise<Product[]> {
    let sql = `SELECT * FROM products WHERE 1=1`;
    const params: unknown[] = [];

    if (!includeArchived) {
      sql += ` AND is_archived = 0`;
    }

    if (categoryId) {
      sql += ` AND category_id = ?`;
      params.push(categoryId);
    }

    if (query && query.trim()) {
      sql += ` AND (name LIKE ? OR sku LIKE ?)`;
      const term = `%${query.trim()}%`;
      params.push(term, term);
    }

    sql += ` ORDER BY name ASC;`;

    const rows = await this.driver.query<ProductRow>(sql, params);
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async listAll(includeArchived: boolean = false): Promise<Product[]> {
    const sql = includeArchived
      ? `SELECT * FROM products ORDER BY name ASC;`
      : `SELECT * FROM products WHERE is_archived = 0 ORDER BY name ASC;`;

    const rows = await this.driver.query<ProductRow>(sql);
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async listLowStock(): Promise<Product[]> {
    const rows = await this.driver.query<ProductRow>(
      `SELECT * FROM products WHERE is_archived = 0 AND stock_quantity <= min_stock_threshold ORDER BY stock_quantity ASC;`
    );
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async save(product: Product): Promise<void> {
    await this.driver.run(
      `INSERT INTO products (
        id, category_id, name, sku, unit, selling_price, stock_quantity, min_stock_threshold, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category_id = excluded.category_id,
        name = excluded.name,
        sku = excluded.sku,
        unit = excluded.unit,
        selling_price = excluded.selling_price,
        stock_quantity = excluded.stock_quantity,
        min_stock_threshold = excluded.min_stock_threshold,
        is_archived = excluded.is_archived,
        updated_at = excluded.updated_at;`,
      [
        product.id,
        product.categoryId ?? null,
        product.name,
        product.sku,
        product.unit,
        product.sellingPrice.value,
        product.stockQuantity.scaledValue,
        product.minStockThreshold.scaledValue,
        product.isArchived ? 1 : 0,
        product.createdAt,
        product.updatedAt
      ]
    );
  }

  public async getNextSkuSequence(): Promise<string> {
    const rows = await this.driver.query<{ count: number }>(`
      SELECT COUNT(*) as count FROM products;
    `);
    const nextNum = (rows[0]?.count ?? 0) + 1001;
    return `PRD-${nextNum}`;
  }

  public async hasHistory(id: UUID): Promise<boolean> {
    const movementRows = await this.driver.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM stock_movements WHERE product_id = ?;`,
      [id]
    );
    const invoiceRows = await this.driver.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM invoice_items WHERE product_id = ?;`,
      [id]
    );

    const movements = movementRows[0]?.count ?? 0;
    const invoiceItems = invoiceRows[0]?.count ?? 0;
    return movements > 0 || invoiceItems > 0;
  }

  private mapRowToEntity(row: ProductRow): Product {
    return new Product({
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      sku: row.sku,
      unit: row.unit as ProductUnit,
      sellingPrice: Money.fromToman(row.selling_price),
      stockQuantity: StockQuantity.fromScaled(row.stock_quantity),
      minStockThreshold: StockQuantity.fromScaled(row.min_stock_threshold),
      isArchived: Boolean(row.is_archived),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
