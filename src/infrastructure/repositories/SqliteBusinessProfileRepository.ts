import type { IBusinessProfileRepository } from '@/domain/repositories/IBusinessProfileRepository';
import { BusinessProfile } from '@/domain/entities/BusinessProfile';
import type { IDatabaseDriver } from '../database/IDatabaseDriver';

interface BusinessProfileRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export class SqliteBusinessProfileRepository implements IBusinessProfileRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async getProfile(): Promise<BusinessProfile | null> {
    const rows = await this.driver.query<BusinessProfileRow>(`
      SELECT id, name, phone, email, address, description, created_at, updated_at
      FROM business_profile
      LIMIT 1;
    `);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return new BusinessProfile({
      id: row.id,
      name: row.name,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      address: row.address ?? undefined,
      description: row.description ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  public async saveProfile(profile: BusinessProfile): Promise<void> {
    const existing = await this.getProfile();

    if (existing) {
      await this.driver.run(
        `UPDATE business_profile
         SET name = ?, phone = ?, email = ?, address = ?, description = ?, updated_at = ?
         WHERE id = ?;`,
        [
          profile.name,
          profile.phone ?? null,
          profile.email ?? null,
          profile.address ?? null,
          profile.description ?? null,
          profile.updatedAt,
          profile.id
        ]
      );
    } else {
      await this.driver.run(
        `INSERT INTO business_profile (id, name, phone, email, address, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          profile.id,
          profile.name,
          profile.phone ?? null,
          profile.email ?? null,
          profile.address ?? null,
          profile.description ?? null,
          profile.createdAt,
          profile.updatedAt
        ]
      );
    }
  }

  public async hasProfile(): Promise<boolean> {
    const rows = await this.driver.query<{ count: number }>(`
      SELECT COUNT(*) as count FROM business_profile;
    `);
    return (rows[0]?.count ?? 0) > 0;
  }
}
