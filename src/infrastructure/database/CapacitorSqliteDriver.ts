import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { IDatabaseDriver } from './IDatabaseDriver';

export interface CapacitorDriverOptions {
  databaseName: string;
  encrypted?: boolean;
  encryptionMode?: 'secret' | 'encryption';
  secret?: string;
  readonly?: boolean;
}

export class CapacitorSqliteDriver implements IDatabaseDriver {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly options: CapacitorDriverOptions;
  private _isEncrypted: boolean = false;

  constructor(options: CapacitorDriverOptions) {
    this.options = {
      encrypted: true,
      encryptionMode: 'secret',
      ...options
    };
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  public async initialize(): Promise<void> {
    if (this.db) return;

    const isConnConsistent = (await this.sqlite.isConnection(this.options.databaseName, false)).result;
    if (isConnConsistent) {
      this.db = await this.sqlite.retrieveConnection(this.options.databaseName, false);
    } else {
      const encrypted = this.options.encrypted ?? false;
      const mode = this.options.encryptionMode ?? (encrypted ? 'secret' : 'no-encryption');

      this.db = await this.sqlite.createConnection(
        this.options.databaseName,
        encrypted,
        mode,
        1,
        false
      );
      this._isEncrypted = encrypted;
    }

    await this.db.open();
    // Enforce foreign key constraints
    await this.db.execute('PRAGMA foreign_keys = ON;');
    await this.db.execute('PRAGMA journal_mode = WAL;');
  }

  public async execute(sql: string): Promise<void> {
    await this.ensureOpen();
    await this.db!.execute(sql);
  }

  public async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    await this.ensureOpen();
    const res = await this.db!.query(sql, params);
    return (res.values as T[]) || [];
  }

  public async run(sql: string, params: unknown[] = []): Promise<{ changes: number; lastInsertRowId?: number }> {
    await this.ensureOpen();
    const res = await this.db!.run(sql, params);
    return {
      changes: res.changes?.changes || 0,
      lastInsertRowId: res.changes?.lastId
    };
  }

  public async transaction<T>(action: (driver: IDatabaseDriver) => Promise<T>): Promise<T> {
    await this.ensureOpen();
    await this.db!.execute('BEGIN TRANSACTION;');
    try {
      const result = await action(this);
      await this.db!.execute('COMMIT;');
      return result;
    } catch (error) {
      try {
        await this.db!.execute('ROLLBACK;');
      } catch {
        // Rollback error ignored
      }
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(this.options.databaseName, false);
      this.db = null;
    }
  }

  public isEncrypted(): boolean {
    return this._isEncrypted;
  }

  private async ensureOpen(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }
}
