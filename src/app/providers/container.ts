import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import { DatabaseConnectionFactory } from '@/infrastructure/database/DatabaseConnectionFactory';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { InactivityTimer } from '@/infrastructure/security/InactivityTimer';

export interface AppContainer {
  database: IDatabaseDriver;
}

let containerInstance: AppContainer | null = null;

export async function initializeAppContainer(): Promise<AppContainer> {
  if (containerInstance) {
    return containerInstance;
  }

  // 1. Initialize SQLite database driver (Capacitor SQLite on Android, Better-SQLite in Node/web)
  const driver = await DatabaseConnectionFactory.getDriver();

  // 2. Run automated schema migrations
  const migrationRunner = new MigrationRunner(driver);
  const migrationResult = await migrationRunner.run();
  console.log(`[Database] Initialized. Applied ${migrationResult.appliedCount} migrations. Schema version: ${migrationResult.currentVersion}`);

  // 3. Initialize security inactivity monitor
  await InactivityTimer.init();

  containerInstance = {
    database: driver
  };

  return containerInstance;
}

export function getAppContainer(): AppContainer {
  if (!containerInstance) {
    throw new Error('AppContainer has not been initialized. Call initializeAppContainer() first.');
  }
  return containerInstance;
}
