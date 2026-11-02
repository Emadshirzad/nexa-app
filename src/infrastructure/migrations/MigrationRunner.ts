import type { IDatabaseDriver } from '../database/IDatabaseDriver';
import type { Migration } from './Migration';
import { migration001 } from './001_initial_schema';

export class MigrationRunner {
  private readonly driver: IDatabaseDriver;
  private readonly migrations: Migration[];

  constructor(driver: IDatabaseDriver, migrations: Migration[] = [migration001]) {
    this.driver = driver;
    this.migrations = migrations.sort((a, b) => a.version - b.version);
  }

  public async run(): Promise<{ appliedCount: number; currentVersion: number }> {
    // 1. Ensure migrations tracker table exists
    await this.driver.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    // 2. Fetch current applied version
    const rows = await this.driver.query<{ current_version: number | null }>(`
      SELECT MAX(version) as current_version FROM schema_migrations;
    `);
    const currentVersion = rows[0]?.current_version ?? 0;

    // 3. Find pending migrations
    const pending = this.migrations.filter((m) => m.version > currentVersion);

    let appliedCount = 0;
    let latestVersion = currentVersion;

    for (const migration of pending) {
      await this.driver.transaction(async (tx) => {
        // Execute migration statements
        await migration.up(tx);

        // Record migration history
        await tx.run(
          `INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);`,
          [migration.version, migration.name, new Date().toISOString()]
        );
      });

      appliedCount++;
      latestVersion = migration.version;
    }

    return {
      appliedCount,
      currentVersion: latestVersion
    };
  }

  public async getCurrentVersion(): Promise<number> {
    const rows = await this.driver.query<{ current_version: number | null }>(`
      SELECT MAX(version) as current_version FROM schema_migrations;
    `);
    return rows[0]?.current_version ?? 0;
  }
}
