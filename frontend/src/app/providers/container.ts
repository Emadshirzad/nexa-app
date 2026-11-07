import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import { InMemoryDriver } from '@/infrastructure/InMemoryDriver';
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
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import type { ICashLedgerRepository } from '@/domain/repositories/ICashLedgerRepository';
import type { IReportingRepository } from '@/domain/repositories/IReportingRepository';

import { MockDatabase } from '@/infrastructure/mock/MockDatabase';
import {
  MockAppSettingsRepository,
  MockBusinessProfileRepository,
  MockCashLedgerRepository,
  MockCategoryRepository,
  MockCustomerRepository,
  MockExpenseRepository,
  MockInvoiceRepository,
  MockLeadRepository,
  MockPaymentRepository,
  MockProductRepository,
  MockReportingRepository,
  MockStockMovementRepository,
  MockTaskRepository
} from '@/infrastructure/mock/MockRepositories';
import {
  ApiAppSettingsRepository,
  ApiBusinessProfileRepository,
  ApiCashLedgerRepository,
  ApiCategoryRepository,
  ApiCustomerRepository,
  ApiExpenseRepository,
  ApiInvoiceRepository,
  ApiLeadRepository,
  ApiPaymentRepository,
  ApiProductRepository,
  ApiReportingRepository,
  ApiStockMovementRepository,
  ApiTaskRepository
} from '@/infrastructure/api';
import { BackupService } from '@/infrastructure/backup/BackupService';
import { CsvService } from '@/infrastructure/csv/CsvService';

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
import { RecordExpenseUseCase } from '@/application/use-cases/finance/RecordExpenseUseCase';
import { RecordOtherIncomeUseCase } from '@/application/use-cases/finance/RecordOtherIncomeUseCase';
import { GetFinancialSummaryUseCase } from '@/application/use-cases/finance/GetFinancialSummaryUseCase';
import { GetDashboardMetricsUseCase } from '@/application/use-cases/dashboard/GetDashboardMetricsUseCase';
import { GetReportsDataUseCase } from '@/application/use-cases/reports/GetReportsDataUseCase';
import { GlobalSearchUseCase } from '@/application/use-cases/search/GlobalSearchUseCase';

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
  expenseRepo: IExpenseRepository;
  cashLedgerRepo: ICashLedgerRepository;
  reportingRepo: IReportingRepository;
  backupService: BackupService;
  csvService: CsvService;

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
  recordExpenseUseCase: RecordExpenseUseCase;
  recordOtherIncomeUseCase: RecordOtherIncomeUseCase;
  getFinancialSummaryUseCase: GetFinancialSummaryUseCase;
  getDashboardMetricsUseCase: GetDashboardMetricsUseCase;
  getReportsDataUseCase: GetReportsDataUseCase;
  globalSearchUseCase: GlobalSearchUseCase;
}

let containerInstance: AppContainer | null = null;

export async function initializeAppContainer(): Promise<AppContainer> {
  if (containerInstance) {
    return containerInstance;
  }

  // 1. Database driver & inactivity timer
  const driver: IDatabaseDriver = new InMemoryDriver();
  await InactivityTimer.init();

  // 2. Instantiate repositories (API by default, Mock if VITE_USE_MOCK=true)
  const useMock = import.meta.env.VITE_USE_MOCK === 'true';

  let profileRepo: IBusinessProfileRepository;
  let settingsRepo: IAppSettingsRepository;
  let productRepo: IProductRepository;
  let categoryRepo: ICategoryRepository;
  let stockMovementRepo: IStockMovementRepository;
  let customerRepo: ICustomerRepository;
  let invoiceRepo: IInvoiceRepository;
  let paymentRepo: IPaymentRepository;
  let leadRepo: ILeadRepository;
  let taskRepo: ITaskRepository;
  let expenseRepo: IExpenseRepository;
  let cashLedgerRepo: ICashLedgerRepository;
  let reportingRepo: IReportingRepository;

  if (useMock) {
    const db = new MockDatabase();
    profileRepo = new MockBusinessProfileRepository(db);
    settingsRepo = new MockAppSettingsRepository(db);
    productRepo = new MockProductRepository(db);
    categoryRepo = new MockCategoryRepository(db);
    stockMovementRepo = new MockStockMovementRepository(db);
    customerRepo = new MockCustomerRepository(db);
    invoiceRepo = new MockInvoiceRepository(db);
    paymentRepo = new MockPaymentRepository(db);
    leadRepo = new MockLeadRepository(db);
    taskRepo = new MockTaskRepository(db);
    expenseRepo = new MockExpenseRepository(db);
    cashLedgerRepo = new MockCashLedgerRepository(db);
    reportingRepo = new MockReportingRepository(db);
  } else {
    profileRepo = new ApiBusinessProfileRepository();
    settingsRepo = new ApiAppSettingsRepository();
    productRepo = new ApiProductRepository();
    categoryRepo = new ApiCategoryRepository();
    stockMovementRepo = new ApiStockMovementRepository();
    customerRepo = new ApiCustomerRepository();
    invoiceRepo = new ApiInvoiceRepository();
    paymentRepo = new ApiPaymentRepository();
    leadRepo = new ApiLeadRepository();
    taskRepo = new ApiTaskRepository();
    expenseRepo = new ApiExpenseRepository();
    cashLedgerRepo = new ApiCashLedgerRepository();
    reportingRepo = new ApiReportingRepository();
  }

  // 4. Instantiate use cases & services
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
  const recordExpenseUseCase = new RecordExpenseUseCase(expenseRepo);
  const recordOtherIncomeUseCase = new RecordOtherIncomeUseCase(expenseRepo);
  const getFinancialSummaryUseCase = new GetFinancialSummaryUseCase(cashLedgerRepo);
  const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(reportingRepo);
  const getReportsDataUseCase = new GetReportsDataUseCase(reportingRepo);
  const globalSearchUseCase = new GlobalSearchUseCase(reportingRepo);
  const backupService = new BackupService(
    profileRepo,
    settingsRepo,
    categoryRepo,
    productRepo,
    stockMovementRepo,
    customerRepo,
    invoiceRepo,
    paymentRepo,
    leadRepo,
    taskRepo,
    expenseRepo,
    cashLedgerRepo
  );
  const csvService = new CsvService(customerRepo, productRepo, createProductUseCase);

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
    expenseRepo,
    cashLedgerRepo,
    reportingRepo,
    backupService,
    csvService,
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
    updateTaskUseCase,
    recordExpenseUseCase,
    recordOtherIncomeUseCase,
    getFinancialSummaryUseCase,
    getDashboardMetricsUseCase,
    getReportsDataUseCase,
    globalSearchUseCase
  };

  return containerInstance;
}

export function getAppContainer(): AppContainer {
  if (!containerInstance) {
    throw new Error('AppContainer has not been initialized. Call initializeAppContainer() first.');
  }
  return containerInstance;
}
