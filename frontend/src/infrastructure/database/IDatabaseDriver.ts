/**
 * Database Access Interface.
 * The application speaks to data through domain repositories; this interface only
 * provides transactional boundaries for use cases that need atomic multi-step writes.
 * In mock mode this is backed by a no-op in-memory driver (writes are synchronous
 * single-threaded JS, so rollback is only needed for exceptions).
 * When the backend is added, swap the container wiring for real API-backed drivers.
 */
export interface IDatabaseDriver {
  /**
   * Runs an atomic transaction. If callback throws, automatically "rolls back".
   */
  transaction<T>(action: (driver: IDatabaseDriver) => Promise<T>): Promise<T>;

  /**
   * Returns whether the underlying store is encrypted (SQLCipher). Always false in mock mode.
   */
  isEncrypted(): boolean;
}
