import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { IDatabaseDriver } from './IDatabaseDriver';

export interface CapacitorDriverOptions {
  databaseName: string;
  encrypted?: boolean;
  encryptionMode?: 'secret' | 'encryption' | 'no-encryption';
  secret?: string;
  readonly?: boolean;
}

export class CapacitorSqliteDriver implements IDatabaseDriver {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly options: CapacitorDriverOptions;
  private _isEncrypted: boolean = false;
  private txDepth: number = 0;

  constructor(options: CapacitorDriverOptions) {
    this.options = {
      encrypted: false,
      encryptionMode: 'no-encryption',
      ...options
    };
    // Strip trailing .db extension if passed, as the plugin appends SQLite.db automatically
    this.options.databaseName = this.options.databaseName.replace(/\.db$/, '');
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  public async initialize(): Promise<void> {
    if (this.db) return;

    try {
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
      // Enforce foreign key constraints and WAL journal mode.
      // Note: PRAGMA journal_mode must be run via query(), execute() wraps
      // statements in an implicit transaction and SQLite rejects journal
      // mode changes inside a transaction ("cannot change into wal mode").
      await this.db.query('PRAGMA foreign_keys = ON;');
      await this.db.query('PRAGMA journal_mode = WAL;');
    } catch (err) {
      console.error('CapacitorSqliteDriver initialization failed:', err);
      throw err;
    }
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
    this.txDepth++;
    const savepointName = `sp_${this.txDepth}`;

    // Use the plugin's transaction API for the outermost transaction.
    // Raw "BEGIN TRANSACTION;" / "COMMIT;" via execute() conflicts with the
    // plugin's own implicit transaction handling and fails with
    // "Cannot perform this operation because there is no current transaction".
    if (this.txDepth === 1) {
      await this.db!.beginTransaction();
    } else {
      await this.db!.execute(`SAVEPOINT ${savepointName};`);
    }

    try {
      const result = await action(this);
      if (this.txDepth === 1) {
        await this.db!.commitTransaction();
      } else {
        await this.db!.execute(`RELEASE SAVEPOINT ${savepointName};`);
      }
      return result;
    } catch (error) {
      try {
        if (this.txDepth === 1) {
          await this.db!.rollbackTransaction();
        } else {
          await this.db!.execute(`ROLLBACK TO SAVEPOINT ${savepointName};`);
        }
      } catch {
        // Rollback error ignored
      }
      throw error;
    } finally {
      this.txDepth--;
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
