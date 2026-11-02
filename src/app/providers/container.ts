import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import { DatabaseConnectionFactory } from '@/infrastructure/database/DatabaseConnectionFactory';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { InactivityTimer } from '@/infrastructure/security/InactivityTimer';

import type { IBusinessProfileRepository } from '@/domain/repositories/IBusinessProfileRepository';
import type { IAppSettingsRepository } from '@/domain/repositories/IAppSettingsRepository';
import { SqliteBusinessProfileRepository } from '@/infrastructure/repositories/SqliteBusinessProfileRepository';
import { SqliteAppSettingsRepository } from '@/infrastructure/repositories/SqliteAppSettingsRepository';

import { SetupBusinessProfileUseCase } from '@/application/use-cases/profile/SetupBusinessProfileUseCase';
import { GetBusinessProfileUseCase } from '@/application/use-cases/profile/GetBusinessProfileUseCase';

export interface AppContainer {
  database: IDatabaseDriver;
  profileRepo: IBusinessProfileRepository;
  settingsRepo: IAppSettingsRepository;
  setupBusinessProfileUseCase: SetupBusinessProfileUseCase;
  getBusinessProfileUseCase: GetBusinessProfileUseCase;
}

let containerInstance: AppContainer | null = null;

export async function initializeAppContainer(): Promise<AppContainer> {
  if (containerInstance) {
    return containerInstance;
  }

  // 1. Initialize SQLite database driver
  const driver = await DatabaseConnectionFactory.getDriver();

  // 2. Run automated schema migrations
  const migrationRunner = new MigrationRunner(driver);
  await migrationRunner.run();

  // 3. Initialize security inactivity monitor
  await InactivityTimer.init();

  // 4. Instantiate repositories
  const profileRepo = new SqliteBusinessProfileRepository(driver);
  const settingsRepo = new SqliteAppSettingsRepository(driver);

  // 5. Instantiate use cases
  const setupBusinessProfileUseCase = new SetupBusinessProfileUseCase(profileRepo);
  const getBusinessProfileUseCase = new GetBusinessProfileUseCase(profileRepo);

  containerInstance = {
    database: driver,
    profileRepo,
    settingsRepo,
    setupBusinessProfileUseCase,
    getBusinessProfileUseCase
  };

  return containerInstance;
}

export function getAppContainer(): AppContainer {
  if (!containerInstance) {
    throw new Error('AppContainer has not been initialized. Call initializeAppContainer() first.');
  }
  return containerInstance;
}
