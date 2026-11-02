import { Capacitor } from '@capacitor/core';
import type { IDatabaseDriver } from './IDatabaseDriver';
import { CapacitorSqliteDriver } from './CapacitorSqliteDriver';
import { MemorySqliteDriver } from './MemorySqliteDriver';

export class DatabaseConnectionFactory {
  private static instance: IDatabaseDriver | null = null;

  public static async getDriver(dbName: string = 'nexa_crm.db'): Promise<IDatabaseDriver> {
    if (this.instance) {
      return this.instance;
    }

    if (Capacitor.isNativePlatform()) {
      // 1. Native Android Platform: Capacitor SQLite driver
      try {
        const driver = new CapacitorSqliteDriver({
          databaseName: dbName,
          encrypted: false,
          encryptionMode: 'no-encryption'
        });
        await driver.initialize();
        this.instance = driver;
        return driver;
      } catch (err) {
        console.error('Failed to initialize native SQLite driver, falling back:', err);
        const fallback = new MemorySqliteDriver();
        this.instance = fallback;
        return fallback;
      }
    } else if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.env?.VITEST)) {
      // 2. Node.js / Vitest automated test environment: use BetterSqliteDriver
      const { BetterSqliteDriver } = await import('./BetterSqliteDriver');
      const driver = new BetterSqliteDriver(dbName === ':memory:' ? ':memory:' : `nexa_dev_${dbName}`);
      this.instance = driver;
      return driver;
    } else {
      // 3. Browser preview environment
      const driver = new MemorySqliteDriver();
      this.instance = driver;
      return driver;
    }
  }

  public static setDriverForTesting(driver: IDatabaseDriver): void {
    this.instance = driver;
  }

  public static async reset(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
  }
}
