import type {
  ICustomerRepository,
  CustomerFinancialSummary,
  CustomerNote
} from '@/domain/repositories/ICustomerRepository';
import { Customer } from '@/domain/entities/Customer';
import type { IDatabaseDriver } from '../database/IDatabaseDriver';
import type { UUID } from '@/shared/types/common';
import { generateUUID } from '@/shared/utils/id';

interface CustomerRow {
  id: string;
  name: string;
  mobile: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  follow_up_date: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export class SqliteCustomerRepository implements ICustomerRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async findById(id: UUID): Promise<Customer | null> {
    const rows = await this.driver.query<CustomerRow>(
      `SELECT * FROM customers WHERE id = ?;`,
      [id]
    );
    if (!rows[0]) return null;

    const tags = await this.getCustomerTags(id);
    return this.mapRowToEntity(rows[0], tags);
  }

  public async findByMobile(mobile: string): Promise<Customer | null> {
    const cleaned = mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');
    const rows = await this.driver.query<CustomerRow>(
      `SELECT * FROM customers WHERE mobile = ?;`,
      [cleaned]
    );
    if (!rows[0]) return null;

    const tags = await this.getCustomerTags(rows[0].id);
    return this.mapRowToEntity(rows[0], tags);
  }

  public async search(query: string, tag?: string, includeArchived: boolean = false): Promise<Customer[]> {
    let sql = `
      SELECT DISTINCT c.*
      FROM customers c
      LEFT JOIN customer_tags ct ON c.id = ct.customer_id
      LEFT JOIN tags t ON ct.tag_id = t.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (!includeArchived) {
      sql += ` AND c.is_archived = 0`;
    }

    if (tag && tag.trim()) {
      sql += ` AND t.name = ?`;
      params.push(tag.trim());
    }

    if (query && query.trim()) {
      sql += ` AND (c.name LIKE ? OR c.mobile LIKE ? OR c.phone LIKE ?)`;
      const term = `%${query.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY c.name ASC;`;

    const rows = await this.driver.query<CustomerRow>(sql, params);
    const result: Customer[] = [];

    for (const row of rows) {
      const tags = await this.getCustomerTags(row.id);
      result.push(this.mapRowToEntity(row, tags));
    }

    return result;
  }

  public async listAll(includeArchived: boolean = false): Promise<Customer[]> {
    return this.search('', undefined, includeArchived);
  }

  public async save(customer: Customer): Promise<void> {
    await this.driver.transaction(async (tx) => {
      // 1. Upsert Customer
      await tx.run(
        `INSERT INTO customers (
          id, name, mobile, phone, address, notes, follow_up_date, is_archived, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          mobile = excluded.mobile,
          phone = excluded.phone,
          address = excluded.address,
          notes = excluded.notes,
          follow_up_date = excluded.follow_up_date,
          is_archived = excluded.is_archived,
          updated_at = excluded.updated_at;`,
        [
          customer.id,
          customer.name,
          customer.mobile,
          customer.phone ?? null,
          customer.address ?? null,
          customer.notes ?? null,
          customer.followUpDate ?? null,
          customer.isArchived ? 1 : 0,
          customer.createdAt,
          customer.updatedAt
        ]
      );

      // 2. Sync Tags
      await tx.run(`DELETE FROM customer_tags WHERE customer_id = ?;`, [customer.id]);

      for (const tagName of customer.tags) {
        if (!tagName.trim()) continue;
        const normalized = tagName.trim();

        // Ensure tag exists
        const tagRows = await tx.query<{ id: string }>(`SELECT id FROM tags WHERE name = ?;`, [normalized]);
        let tagId: string;

        if (tagRows.length > 0) {
          tagId = tagRows[0].id;
        } else {
          tagId = generateUUID();
          await tx.run(
            `INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, '#243746', datetime('now'));`,
            [tagId, normalized]
          );
        }

        await tx.run(
          `INSERT OR IGNORE INTO customer_tags (customer_id, tag_id) VALUES (?, ?);`,
          [customer.id, tagId]
        );
      }
    });
  }

  public async getFinancialSummary(customerId: UUID): Promise<CustomerFinancialSummary> {
    // Total purchases from issued invoices
    const purchaseRows = await this.driver.query<{ total: number | null; count: number }>(
      `SELECT SUM(final_amount) as total, COUNT(*) as count
       FROM invoices
       WHERE customer_id = ? AND status = 'issued';`,
      [customerId]
    );

    // Total payments made
    const paymentRows = await this.driver.query<{ total: number | null }>(
      `SELECT SUM(amount) as total
       FROM payments
       WHERE customer_id = ? AND is_voided = 0;`,
      [customerId]
    );

    const totalPurchases = purchaseRows[0]?.total ?? 0;
    const invoiceCount = purchaseRows[0]?.count ?? 0;
    const totalPayments = paymentRows[0]?.total ?? 0;
    const outstandingDebt = Math.max(0, totalPurchases - totalPayments);

    return {
      totalPurchases,
      totalPayments,
      outstandingDebt,
      invoiceCount
    };
  }

  public async addNote(customerId: UUID, content: string): Promise<CustomerNote> {
    const id = generateUUID();
    const now = new Date().toISOString();
    await this.driver.run(
      `INSERT INTO customer_notes (id, customer_id, content, created_at) VALUES (?, ?, ?, ?);`,
      [id, customerId, content.trim(), now]
    );
    return { id, customerId, content: content.trim(), createdAt: now };
  }

  public async getNotes(customerId: UUID): Promise<CustomerNote[]> {
    const rows = await this.driver.query<{ id: string; customer_id: string; content: string; created_at: string }>(
      `SELECT id, customer_id, content, created_at FROM customer_notes WHERE customer_id = ? ORDER BY created_at DESC;`,
      [customerId]
    );
    return rows.map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      content: r.content,
      createdAt: r.created_at
    }));
  }

  public async listTags(): Promise<string[]> {
    const rows = await this.driver.query<{ name: string }>(`SELECT name FROM tags ORDER BY name ASC;`);
    return rows.map((r) => r.name);
  }

  private async getCustomerTags(customerId: string): Promise<string[]> {
    const rows = await this.driver.query<{ name: string }>(
      `SELECT t.name
       FROM tags t
       JOIN customer_tags ct ON t.id = ct.tag_id
       WHERE ct.customer_id = ?;`,
      [customerId]
    );
    return rows.map((r) => r.name);
  }

  private mapRowToEntity(row: CustomerRow, tags: string[]): Customer {
    return new Customer({
      id: row.id,
      name: row.name,
      mobile: row.mobile,
      phone: row.phone,
      address: row.address,
      notes: row.notes,
      followUpDate: row.follow_up_date,
      isArchived: Boolean(row.is_archived),
      tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
