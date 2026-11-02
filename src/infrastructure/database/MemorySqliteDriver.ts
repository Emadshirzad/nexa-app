import type { IDatabaseDriver } from './IDatabaseDriver';

/**
 * Lightweight In-Memory SQLite Driver for Browser preview mode
 * and environments where native SQLite binaries are not available.
 */
export class MemorySqliteDriver implements IDatabaseDriver {
  private tables = new Set<string>();
  private store = new Map<string, Array<Record<string, unknown>>>();

  public async execute(sql: string): Promise<void> {
    // Basic DDL table tracker for browser preview
    const matches = sql.matchAll(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)/gi);
    for (const match of matches) {
      if (match[1]) {
        this.tables.add(match[1]);
        if (!this.store.has(match[1])) {
          this.store.set(match[1], []);
        }
      }
    }
  }

  public async query<T = Record<string, unknown>>(sql: string, _params: unknown[] = []): Promise<T[]> {
    if (sql.includes('sqlite_master')) {
      const result = Array.from(this.tables).map((t) => ({ name: t }));
      return result as unknown as T[];
    }
    if (sql.includes('schema_migrations')) {
      return [{ current_version: 1 }] as unknown as T[];
    }
    return [] as T[];
  }

  public async run(_sql: string, _params: unknown[] = []): Promise<{ changes: number; lastInsertRowId?: number }> {
    return { changes: 1, lastInsertRowId: 1 };
  }

  public async transaction<T>(action: (driver: IDatabaseDriver) => Promise<T>): Promise<T> {
    return action(this);
  }

  public async close(): Promise<void> {
    this.store.clear();
    this.tables.clear();
  }

  public isEncrypted(): boolean {
    return false;
  }
}
