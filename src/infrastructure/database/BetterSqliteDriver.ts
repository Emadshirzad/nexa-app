import Database from 'better-sqlite3';
import type { IDatabaseDriver } from './IDatabaseDriver';

export class BetterSqliteDriver implements IDatabaseDriver {
  private db: Database.Database;
  private readonly dbPath: string;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
    this.db = new Database(this.dbPath);
    // Explicitly enforce SQLite foreign key integrity constraints
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');
  }

  public async execute(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  public async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  public async run(sql: string, params: unknown[] = []): Promise<{ changes: number; lastInsertRowId?: number }> {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowId: Number(result.lastInsertRowid)
    };
  }

  public async transaction<T>(action: (driver: IDatabaseDriver) => Promise<T>): Promise<T> {
    // Note: better-sqlite3 supports transactions natively, but since action is async,
    // we use standard SQL BEGIN / COMMIT / ROLLBACK.
    await this.execute('BEGIN TRANSACTION;');
    try {
      const result = await action(this);
      await this.execute('COMMIT;');
      return result;
    } catch (error) {
      try {
        await this.execute('ROLLBACK;');
      } catch {
        // Rollback error ignored if already rolled back
      }
      throw error;
    }
  }

  public async close(): Promise<void> {
    this.db.close();
  }

  public isEncrypted(): boolean {
    return false; // Test driver in-memory is standard SQLite
  }
}
