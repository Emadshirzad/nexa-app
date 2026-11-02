import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import { DatabaseConnectionFactory } from '@/infrastructure/database/DatabaseConnectionFactory';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { InactivityTimer } from '@/infrastructure/security/InactivityTimer';

import type { IBusinessProfileRepository } from '@/domain/repositories/IBusinessProfileRepository';
import type { IAppSettingsRepository } from '@/domain/repositories/IAppSettingsRepository';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { ICategoryRepository } from '@/domain/repositories/ICategoryRepository';
import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';

import { SqliteBusinessProfileRepository } from '@/infrastructure/repositories/SqliteBusinessProfileRepository';
import { SqliteAppSettingsRepository } from '@/infrastructure/repositories/SqliteAppSettingsRepository';
import { SqliteProductRepository } from '@/infrastructure/repositories/SqliteProductRepository';
import { SqliteCategoryRepository } from '@/infrastructure/repositories/SqliteCategoryRepository';
import { SqliteStockMovementRepository } from '@/infrastructure/repositories/SqliteStockMovementRepository';

import { SetupBusinessProfileUseCase } from '@/application/use-cases/profile/SetupBusinessProfileUseCase';
import { GetBusinessProfileUseCase } from '@/application/use-cases/profile/GetBusinessProfileUseCase';
import { CreateProductUseCase } from '@/application/use-cases/products/CreateProductUseCase';
import { AdjustStockUseCase } from '@/application/use-cases/products/AdjustStockUseCase';
import { ArchiveProductUseCase } from '@/application/use-cases/products/ArchiveProductUseCase';
import { StockReconciliationService } from '@/domain/services/StockReconciliationService';

export interface AppContainer {
  database: IDatabaseDriver;
  profileRepo: IBusinessProfileRepository;
  settingsRepo: IAppSettingsRepository;
  productRepo: IProductRepository;
  categoryRepo: ICategoryRepository;
  stockMovementRepo: IStockMovementRepository;

  setupBusinessProfileUseCase: SetupBusinessProfileUseCase;
  getBusinessProfileUseCase: GetBusinessProfileUseCase;
  createProductUseCase: CreateProductUseCase;
  adjustStockUseCase: AdjustStockUseCase;
  archiveProductUseCase: ArchiveProductUseCase;
  stockReconciliationService: StockReconciliationService;
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
  const productRepo = new SqliteProductRepository(driver);
  const categoryRepo = new SqliteCategoryRepository(driver);
  const stockMovementRepo = new SqliteStockMovementRepository(driver);

  // 5. Instantiate use cases & services
  const setupBusinessProfileUseCase = new SetupBusinessProfileUseCase(profileRepo);
  const getBusinessProfileUseCase = new GetBusinessProfileUseCase(profileRepo);
  const createProductUseCase = new CreateProductUseCase(productRepo, stockMovementRepo, driver);
  const adjustStockUseCase = new AdjustStockUseCase(productRepo, stockMovementRepo, driver);
  const archiveProductUseCase = new ArchiveProductUseCase(productRepo);
  const stockReconciliationService = new StockReconciliationService(productRepo, stockMovementRepo);

  containerInstance = {
    database: driver,
    profileRepo,
    settingsRepo,
    productRepo,
    categoryRepo,
    stockMovementRepo,
    setupBusinessProfileUseCase,
    getBusinessProfileUseCase,
    createProductUseCase,
    adjustStockUseCase,
    archiveProductUseCase,
    stockReconciliationService
  };

  return containerInstance;
}

export function getAppContainer(): AppContainer {
  if (!containerInstance) {
    throw new Error('AppContainer has not been initialized. Call initializeAppContainer() first.');
  }
  return containerInstance;
}
