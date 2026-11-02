import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import { Lead, type LeadStatus } from '@/domain/entities/Lead';
import type { UUID } from '@/shared/types/common';

interface LeadRow {
  id: string;
  name: string;
  mobile: string;
  phone: string | null;
  email: string | null;
  status: string;
  description: string | null;
  follow_up_date: string | null;
  converted_customer_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export class SqliteLeadRepository implements ILeadRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async findById(id: UUID): Promise<Lead | null> {
    const rows = await this.driver.query<LeadRow>(
      `SELECT * FROM leads WHERE id = ?;`,
      [id]
    );
    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  public async findByMobile(mobile: string): Promise<Lead | null> {
    const cleaned = mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');
    const rows = await this.driver.query<LeadRow>(
      `SELECT * FROM leads WHERE mobile = ?;`,
      [cleaned]
    );
    return rows[0] ? this.mapRowToEntity(rows[0]) : null;
  }

  public async listAll(options?: {
    status?: LeadStatus;
    search?: string;
    limit?: number;
  }): Promise<Lead[]> {
    let sql = `SELECT * FROM leads WHERE 1=1`;
    const params: unknown[] = [];

    if (options?.status) {
      sql += ` AND status = ?`;
      params.push(options.status);
    }

    if (options?.search && options.search.trim()) {
      sql += ` AND (name LIKE ? OR mobile LIKE ?)`;
      params.push(`%${options.search.trim()}%`, `%${options.search.trim()}%`);
    }

    sql += ` ORDER BY created_at DESC`;

    if (options?.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    const rows = await this.driver.query<LeadRow>(sql, params);
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async countByStatus(): Promise<Record<LeadStatus, number>> {
    const rows = await this.driver.query<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count FROM leads GROUP BY status;`
    );

    const counts: Record<LeadStatus, number> = {
      new: 0,
      following_up: 0,
      interested: 0,
      converted: 0,
      unsuccessful: 0,
      rejected: 0
    };

    for (const r of rows) {
      if (r.status in counts) {
        counts[r.status as LeadStatus] = Number(r.count);
      }
    }

    return counts;
  }

  public async save(lead: Lead): Promise<void> {
    await this.driver.run(
      `INSERT INTO leads (
        id, name, mobile, phone, email, status,
        description, follow_up_date, converted_customer_id,
        converted_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        mobile = excluded.mobile,
        phone = excluded.phone,
        email = excluded.email,
        status = excluded.status,
        description = excluded.description,
        follow_up_date = excluded.follow_up_date,
        converted_customer_id = excluded.converted_customer_id,
        converted_at = excluded.converted_at,
        updated_at = excluded.updated_at;`,
      [
        lead.id,
        lead.name,
        lead.mobile,
        lead.phone || null,
        lead.email || null,
        lead.status,
        lead.description || null,
        lead.followUpDate || null,
        lead.convertedCustomerId || null,
        lead.convertedAt || null,
        lead.createdAt,
        lead.updatedAt
      ]
    );
  }

  public async delete(id: UUID): Promise<void> {
    await this.driver.run(`DELETE FROM leads WHERE id = ?;`, [id]);
  }

  private mapRowToEntity(row: LeadRow): Lead {
    return new Lead({
      id: row.id as UUID,
      name: row.name,
      mobile: row.mobile,
      phone: row.phone,
      email: row.email,
      status: row.status as LeadStatus,
      description: row.description,
      followUpDate: row.follow_up_date,
      convertedCustomerId: row.converted_customer_id as UUID | null,
      convertedAt: row.converted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
