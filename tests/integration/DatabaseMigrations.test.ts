import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqliteDriver } from '@/infrastructure/database/BetterSqliteDriver';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';

describe('Database Migrations & SQLite Integrity', () => {
  let driver: BetterSqliteDriver;

  beforeEach(() => {
    // In-memory isolated database for each test
    driver = new BetterSqliteDriver(':memory:');
  });

  afterEach(async () => {
    await driver.close();
  });

  it('runs initial migration and creates all 21 core tables', async () => {
    const runner = new MigrationRunner(driver);
    const result = await runner.run();

    expect(result.appliedCount).toBe(1);
    expect(result.currentVersion).toBe(1);

    // Query sqlite_master for table count
    const tables = await driver.query<{ name: string }>(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
    `);

    const tableNames = tables.map((t) => t.name);

    const requiredTables = [
      'business_profile',
      'app_settings',
      'categories',
      'products',
      'stock_movements',
      'customers',
      'tags',
      'customer_tags',
      'customer_notes',
      'invoices',
      'invoice_items',
      'payments',
      'leads',
      'lead_activities',
      'tasks',
      'expense_categories',
      'expenses',
      'other_incomes',
      'cash_transactions',
      'activities',
      'schema_migrations'
    ];

    for (const required of requiredTables) {
      expect(tableNames).toContain(required);
    }

    expect(tableNames.length).toBeGreaterThanOrEqual(21);
  });

  it('is idempotent: running migrations twice does not re-apply', async () => {
    const runner = new MigrationRunner(driver);
    await runner.run();

    const secondRun = await runner.run();
    expect(secondRun.appliedCount).toBe(0);
    expect(secondRun.currentVersion).toBe(1);
  });

  it('enforces SQLite foreign key constraints', async () => {
    const runner = new MigrationRunner(driver);
    await runner.run();

    // Attempting to insert product with non-existent category_id should violate FK constraint
    await expect(
      driver.run(`
        INSERT INTO products (
          id, category_id, name, sku, unit, selling_price, stock_quantity, min_stock_threshold, is_archived, created_at, updated_at
        ) VALUES (
          'prod-1', 'non-existent-cat', 'تست', 'SKU-001', 'piece', 50000, 1000, 0, 0, datetime('now'), datetime('now')
        );
      `)
    ).rejects.toThrow();
  });

  it('atomically rolls back transactions on error', async () => {
    const runner = new MigrationRunner(driver);
    await runner.run();

    // Insert a valid category inside a failed transaction
    await expect(
      driver.transaction(async (tx) => {
        await tx.run(`
          INSERT INTO categories (id, name, color, is_active, created_at, updated_at)
          VALUES ('cat-roll', 'آزمایشی', '#10B981', 1, datetime('now'), datetime('now'));
        `);

        // Intentionally throw
        throw new Error('Transaction failure simulation');
      })
    ).rejects.toThrow('Transaction failure simulation');

    // Confirm that 'cat-roll' was NOT inserted due to rollback
    const rows = await driver.query(`SELECT * FROM categories WHERE id = 'cat-roll';`);
    expect(rows.length).toBe(0);
  });
});
