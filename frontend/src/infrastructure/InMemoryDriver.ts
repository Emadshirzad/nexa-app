import type { IDatabaseDriver } from './database/IDatabaseDriver';

/**
 * No-op in-memory driver for mock mode.
 * Mock repositories write synchronously to plain in-memory arrays, so an explicit
 * begin/commit is unnecessary — the action simply succeeds or throws as a whole.
 */
export class InMemoryDriver implements IDatabaseDriver {
  public async transaction<T>(action: (driver: IDatabaseDriver) => Promise<T>): Promise<T> {
    return action(this);
  }

  public isEncrypted(): boolean {
    return false;
  }
}
