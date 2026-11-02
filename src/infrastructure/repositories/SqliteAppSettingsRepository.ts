import type { IAppSettingsRepository } from '@/domain/repositories/IAppSettingsRepository';
import type { IDatabaseDriver } from '../database/IDatabaseDriver';

export class SqliteAppSettingsRepository implements IAppSettingsRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async get(key: string): Promise<string | null> {
    const rows = await this.driver.query<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?;`,
      [key]
    );
    return rows[0]?.value ?? null;
  }

  public async set(key: string, value: string): Promise<void> {
    await this.driver.run(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      [key, value]
    );
  }

  public async getAll(): Promise<Record<string, string>> {
    const rows = await this.driver.query<{ key: string; value: string }>(
      `SELECT key, value FROM app_settings;`
    );
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }
}
