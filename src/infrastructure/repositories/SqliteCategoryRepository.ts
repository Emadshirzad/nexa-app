import type { ICategoryRepository } from '@/domain/repositories/ICategoryRepository';
import { Category } from '@/domain/entities/Category';
import type { IDatabaseDriver } from '../database/IDatabaseDriver';
import type { UUID } from '@/shared/types/common';

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class SqliteCategoryRepository implements ICategoryRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async findById(id: UUID): Promise<Category | null> {
    const rows = await this.driver.query<CategoryRow>(
      `SELECT id, name, color, is_active, created_at, updated_at FROM categories WHERE id = ?;`,
      [id]
    );
    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  public async findByName(name: string): Promise<Category | null> {
    const rows = await this.driver.query<CategoryRow>(
      `SELECT id, name, color, is_active, created_at, updated_at FROM categories WHERE name = ?;`,
      [name]
    );
    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  public async listAll(): Promise<Category[]> {
    const rows = await this.driver.query<CategoryRow>(
      `SELECT id, name, color, is_active, created_at, updated_at FROM categories ORDER BY name ASC;`
    );
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async save(category: Category): Promise<void> {
    await this.driver.run(
      `INSERT INTO categories (id, name, color, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         color = excluded.color,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at;`,
      [
        category.id,
        category.name,
        category.color,
        category.isActive ? 1 : 0,
        category.createdAt,
        category.updatedAt
      ]
    );
  }

  private mapRowToEntity(row: CategoryRow): Category {
    return new Category({
      id: row.id,
      name: row.name,
      color: row.color,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
