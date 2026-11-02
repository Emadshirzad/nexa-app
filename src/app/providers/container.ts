import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import { DatabaseConnectionFactory } from '@/infrastructure/database/DatabaseConnectionFactory';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { InactivityTimer } from '@/infrastructure/security/InactivityTimer';

import type { IBusinessProfileRepository } from '@/domain/repositories/IBusinessProfileRepository';
import type { IAppSettingsRepository } from '@/domain/repositories/IAppSettingsRepository';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { ICategoryRepository } from '@/domain/repositories/ICategoryRepository';
import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';

import { SqliteBusinessProfileRepository } from '@/infrastructure/repositories/SqliteBusinessProfileRepository';
import { SqliteAppSettingsRepository } from '@/infrastructure/repositories/SqliteAppSettingsRepository';
import { SqliteProductRepository } from '@/infrastructure/repositories/SqliteProductRepository';
import { SqliteCategoryRepository } from '@/infrastructure/repositories/SqliteCategoryRepository';
import { SqliteStockMovementRepository } from '@/infrastructure/repositories/SqliteStockMovementRepository';
import { SqliteCustomerRepository } from '@/infrastructure/repositories/SqliteCustomerRepository';
import { SqliteInvoiceRepository } from '@/infrastructure/repositories/SqliteInvoiceRepository';
import { SqlitePaymentRepository } from '@/infrastructure/repositories/SqlitePaymentRepository';
import { SqliteLeadRepository } from '@/infrastructure/repositories/SqliteLeadRepository';
import { SqliteTaskRepository } from '@/infrastructure/repositories/SqliteTaskRepository';

import { SetupBusinessProfileUseCase } from '@/application/use-cases/profile/SetupBusinessProfileUseCase';
import { GetBusinessProfileUseCase } from '@/application/use-cases/profile/GetBusinessProfileUseCase';
import { CreateProductUseCase } from '@/application/use-cases/products/CreateProductUseCase';
import { AdjustStockUseCase } from '@/application/use-cases/products/AdjustStockUseCase';
import { ArchiveProductUseCase } from '@/application/use-cases/products/ArchiveProductUseCase';
import { StockReconciliationService } from '@/domain/services/StockReconciliationService';
import { CreateCustomerUseCase } from '@/application/use-cases/customers/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '@/application/use-cases/customers/UpdateCustomerUseCase';
import { ArchiveCustomerUseCase } from '@/application/use-cases/customers/ArchiveCustomerUseCase';
import { CreateInvoiceUseCase } from '@/application/use-cases/invoices/CreateInvoiceUseCase';
import { CancelInvoiceUseCase } from '@/application/use-cases/invoices/CancelInvoiceUseCase';
import { RecordInvoicePaymentUseCase } from '@/application/use-cases/invoices/RecordInvoicePaymentUseCase';
import { CreateLeadUseCase } from '@/application/use-cases/leads/CreateLeadUseCase';
import { UpdateLeadUseCase } from '@/application/use-cases/leads/UpdateLeadUseCase';
import { ConvertLeadToCustomerUseCase } from '@/application/use-cases/leads/ConvertLeadToCustomerUseCase';
import { CreateTaskUseCase } from '@/application/use-cases/tasks/CreateTaskUseCase';
import { CompleteTaskUseCase } from '@/application/use-cases/tasks/CompleteTaskUseCase';
import { UpdateTaskUseCase } from '@/application/use-cases/tasks/UpdateTaskUseCase';

export interface AppContainer {
  database: IDatabaseDriver;
  profileRepo: IBusinessProfileRepository;
  settingsRepo: IAppSettingsRepository;
  productRepo: IProductRepository;
  categoryRepo: ICategoryRepository;
  stockMovementRepo: IStockMovementRepository;
  customerRepo: ICustomerRepository;
  invoiceRepo: IInvoiceRepository;
  paymentRepo: IPaymentRepository;
  leadRepo: ILeadRepository;
  taskRepo: ITaskRepository;

  setupBusinessProfileUseCase: SetupBusinessProfileUseCase;
  getBusinessProfileUseCase: GetBusinessProfileUseCase;
  createProductUseCase: CreateProductUseCase;
  adjustStockUseCase: AdjustStockUseCase;
  archiveProductUseCase: ArchiveProductUseCase;
  stockReconciliationService: StockReconciliationService;
  createCustomerUseCase: CreateCustomerUseCase;
  updateCustomerUseCase: UpdateCustomerUseCase;
  archiveCustomerUseCase: ArchiveCustomerUseCase;
  createInvoiceUseCase: CreateInvoiceUseCase;
  cancelInvoiceUseCase: CancelInvoiceUseCase;
  recordInvoicePaymentUseCase: RecordInvoicePaymentUseCase;
  createLeadUseCase: CreateLeadUseCase;
  updateLeadUseCase: UpdateLeadUseCase;
  convertLeadToCustomerUseCase: ConvertLeadToCustomerUseCase;
  createTaskUseCase: CreateTaskUseCase;
  completeTaskUseCase: CompleteTaskUseCase;
  updateTaskUseCase: UpdateTaskUseCase;
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
  const customerRepo = new SqliteCustomerRepository(driver);
  const invoiceRepo = new SqliteInvoiceRepository(driver);
  const paymentRepo = new SqlitePaymentRepository(driver);
  const leadRepo = new SqliteLeadRepository(driver);
  const taskRepo = new SqliteTaskRepository(driver);

  // 5. Instantiate use cases & services
  const setupBusinessProfileUseCase = new SetupBusinessProfileUseCase(profileRepo);
  const getBusinessProfileUseCase = new GetBusinessProfileUseCase(profileRepo);
  const createProductUseCase = new CreateProductUseCase(productRepo, stockMovementRepo, driver);
  const adjustStockUseCase = new AdjustStockUseCase(productRepo, stockMovementRepo, driver);
  const archiveProductUseCase = new ArchiveProductUseCase(productRepo);
  const stockReconciliationService = new StockReconciliationService(productRepo, stockMovementRepo);
  const createCustomerUseCase = new CreateCustomerUseCase(customerRepo);
  const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo);
  const archiveCustomerUseCase = new ArchiveCustomerUseCase(customerRepo);
  const createInvoiceUseCase = new CreateInvoiceUseCase(
    invoiceRepo,
    productRepo,
    stockMovementRepo,
    paymentRepo,
    driver
  );
  const cancelInvoiceUseCase = new CancelInvoiceUseCase(
    invoiceRepo,
    productRepo,
    stockMovementRepo,
    driver
  );
  const recordInvoicePaymentUseCase = new RecordInvoicePaymentUseCase(
    invoiceRepo,
    paymentRepo,
    driver
  );
  const createLeadUseCase = new CreateLeadUseCase(leadRepo);
  const updateLeadUseCase = new UpdateLeadUseCase(leadRepo);
  const convertLeadToCustomerUseCase = new ConvertLeadToCustomerUseCase(leadRepo, customerRepo, driver);
  const createTaskUseCase = new CreateTaskUseCase(taskRepo);
  const completeTaskUseCase = new CompleteTaskUseCase(taskRepo);
  const updateTaskUseCase = new UpdateTaskUseCase(taskRepo);

  containerInstance = {
    database: driver,
    profileRepo,
    settingsRepo,
    productRepo,
    categoryRepo,
    stockMovementRepo,
    customerRepo,
    invoiceRepo,
    paymentRepo,
    leadRepo,
    taskRepo,
    setupBusinessProfileUseCase,
    getBusinessProfileUseCase,
    createProductUseCase,
    adjustStockUseCase,
    archiveProductUseCase,
    stockReconciliationService,
    createCustomerUseCase,
    updateCustomerUseCase,
    archiveCustomerUseCase,
    createInvoiceUseCase,
    cancelInvoiceUseCase,
    recordInvoicePaymentUseCase,
    createLeadUseCase,
    updateLeadUseCase,
    convertLeadToCustomerUseCase,
    createTaskUseCase,
    completeTaskUseCase,
    updateTaskUseCase
  };

  return containerInstance;
}

export function getAppContainer(): AppContainer {
  if (!containerInstance) {
    throw new Error('AppContainer has not been initialized. Call initializeAppContainer() first.');
  }
  return containerInstance;
}
