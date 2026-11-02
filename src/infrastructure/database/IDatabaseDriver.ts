/**
 * Database Driver Interface.
 * Encapsulates the underlying SQLite implementation (Capacitor SQLite on Android,
 * Better-SQLite3 for automated tests and Node integration).
 */
export interface IDatabaseDriver {
  /**
   * Executes one or more raw SQL statements (DDL or batch scripts).
   */
  execute(sql: string): Promise<void>;

  /**
   * Runs a parameterized query and returns matching rows.
   */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Runs an INSERT, UPDATE, or DELETE statement.
   * Returns affected row count and last inserted row id if available.
   */
  run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId?: number }>;

  /**
   * Runs an atomic transaction. If callback throws, automatically rolls back.
   */
  transaction<T>(action: (driver: IDatabaseDriver) => Promise<T>): Promise<T>;

  /**
   * Closes the active database connection.
   */
  close(): Promise<void>;

  /**
   * Returns whether the database connection is encrypted (SQLCipher).
   */
  isEncrypted(): boolean;
}
