import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqliteDriver } from '@/infrastructure/database/BetterSqliteDriver';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { SqliteReportingRepository } from '@/infrastructure/repositories/SqliteReportingRepository';
import { SqliteCustomerRepository } from '@/infrastructure/repositories/SqliteCustomerRepository';
import { SqliteProductRepository } from '@/infrastructure/repositories/SqliteProductRepository';
import { SqliteInvoiceRepository } from '@/infrastructure/repositories/SqliteInvoiceRepository';
import { SqlitePaymentRepository } from '@/infrastructure/repositories/SqlitePaymentRepository';
import { SqliteStockMovementRepository } from '@/infrastructure/repositories/SqliteStockMovementRepository';
import { SqliteLeadRepository } from '@/infrastructure/repositories/SqliteLeadRepository';
import { SqliteTaskRepository } from '@/infrastructure/repositories/SqliteTaskRepository';
import { GetDashboardMetricsUseCase } from '@/application/use-cases/dashboard/GetDashboardMetricsUseCase';
import { GetReportsDataUseCase } from '@/application/use-cases/reports/GetReportsDataUseCase';
import { GlobalSearchUseCase } from '@/application/use-cases/search/GlobalSearchUseCase';
import { CreateCustomerUseCase } from '@/application/use-cases/customers/CreateCustomerUseCase';
import { CreateProductUseCase } from '@/application/use-cases/products/CreateProductUseCase';
import { CreateInvoiceUseCase } from '@/application/use-cases/invoices/CreateInvoiceUseCase';
import { CreateLeadUseCase } from '@/application/use-cases/leads/CreateLeadUseCase';
import { CreateTaskUseCase } from '@/application/use-cases/tasks/CreateTaskUseCase';

describe('Dashboard, Reports and Global Search Integration', () => {
  let driver: BetterSqliteDriver;
  let reportingRepo: SqliteReportingRepository;
  let customerRepo: SqliteCustomerRepository;
  let productRepo: SqliteProductRepository;
  let invoiceRepo: SqliteInvoiceRepository;
  let paymentRepo: SqlitePaymentRepository;
  let movementRepo: SqliteStockMovementRepository;
  let leadRepo: SqliteLeadRepository;
  let taskRepo: SqliteTaskRepository;

  let getDashboardMetricsUseCase: GetDashboardMetricsUseCase;
  let getReportsDataUseCase: GetReportsDataUseCase;
  let globalSearchUseCase: GlobalSearchUseCase;

  let createCustomerUseCase: CreateCustomerUseCase;
  let createProductUseCase: CreateProductUseCase;
  let createInvoiceUseCase: CreateInvoiceUseCase;
  let createLeadUseCase: CreateLeadUseCase;
  let createTaskUseCase: CreateTaskUseCase;

  beforeEach(async () => {
    driver = new BetterSqliteDriver(':memory:');
    const runner = new MigrationRunner(driver);
    await runner.run();

    reportingRepo = new SqliteReportingRepository(driver);
    customerRepo = new SqliteCustomerRepository(driver);
    productRepo = new SqliteProductRepository(driver);
    invoiceRepo = new SqliteInvoiceRepository(driver);
    paymentRepo = new SqlitePaymentRepository(driver);
    movementRepo = new SqliteStockMovementRepository(driver);
    leadRepo = new SqliteLeadRepository(driver);
    taskRepo = new SqliteTaskRepository(driver);

    getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(reportingRepo);
    getReportsDataUseCase = new GetReportsDataUseCase(reportingRepo);
    globalSearchUseCase = new GlobalSearchUseCase(reportingRepo);

    createCustomerUseCase = new CreateCustomerUseCase(customerRepo);
    createProductUseCase = new CreateProductUseCase(productRepo, movementRepo, driver);
    createInvoiceUseCase = new CreateInvoiceUseCase(
      invoiceRepo,
      productRepo,
      movementRepo,
      paymentRepo,
      driver
    );
    createLeadUseCase = new CreateLeadUseCase(leadRepo);
    createTaskUseCase = new CreateTaskUseCase(taskRepo);
  });

  afterEach(async () => {
    await driver.close();
  });

  it('calculates dashboard metrics accurately', async () => {
    const today = new Date().toISOString().slice(0, 10);

    // 1. Create customer
    const cRes = await createCustomerUseCase.execute({
      name: 'مهندس سهرابی',
      mobile: '09121112233'
    });
    expect(cRes.success).toBe(true);
    if (!cRes.success) return;
    const customer = cRes.data;

    // 2. Create products: one with normal stock, one low stock
    const p1Res = await createProductUseCase.execute({
      name: 'سرور لینوکس پرسرعت',
      sellingPrice: 10000000,
      initialStock: 10,
      minStockThreshold: 2,
      unit: 'piece'
    });
    expect(p1Res.success).toBe(true);
    if (!p1Res.success) return;
    const p1 = p1Res.data;

    const p2Res = await createProductUseCase.execute({
      name: 'کابل شبکه Cat6',
      sellingPrice: 50000,
      initialStock: 1,
      minStockThreshold: 5,
      unit: 'piece'
    });
    expect(p2Res.success).toBe(true);
    if (!p2Res.success) return;

    // 3. Create invoice with partial payment
    const invRes = await createInvoiceUseCase.execute({
      customerId: customer.id,
      invoiceDate: today,
      items: [
        {
          productId: p1.id,
          name: p1.name,
          sku: p1.sku,
          unit: p1.unit,
          quantity: 2,
          unitPrice: 10000000,
          discount: 1000000
        }
      ],
      upfrontPayment: {
        amount: 5000000,
        paymentMethod: 'pos'
      }
    });
    expect(invRes.success).toBe(true);

    // 4. Create tasks (one due today pending, one due later)
    await createTaskUseCase.execute({
      title: 'تماس با سهرابی برای تسویه باقی‌مانده',
      dueDate: today,
      priority: 'urgent'
    });
    await createTaskUseCase.execute({
      title: 'جلسه بازاریابی آینده',
      dueDate: '2099-01-01',
      priority: 'normal'
    });

    // 5. Query Dashboard Metrics
    const metricsRes = await getDashboardMetricsUseCase.execute(today);
    expect(metricsRes.success).toBe(true);
    if (!metricsRes.success) return;

    const m = metricsRes.data;
    // Total line: 2 * 10,000,000 - 1,000,000 = 19,000,000
    expect(m.todaySales).toBe(19000000);
    expect(m.todaySalesCount).toBe(1);
    expect(m.todayReceipts).toBe(5000000);
    expect(m.totalOutstandingDebt).toBe(14000000);
    expect(m.pendingTasksTodayCount).toBe(1);
    expect(m.cashBalance).toBe(5000000);
    expect(m.lowStockCount).toBe(1); // p2 has stock 1 <= threshold 5
    expect(m.recentInvoices.length).toBe(1);
    expect(m.todayTasks.length).toBe(1);
    expect(m.todayTasks[0].title).toBe('تماس با سهرابی برای تسویه باقی‌مانده');
  });

  it('aggregates reports data including sales trends, debtors, and top products', async () => {
    const today = new Date().toISOString().slice(0, 10);

    const cRes = await createCustomerUseCase.execute({
      name: 'شرکت فناوری آریا',
      mobile: '09351234567'
    });
    if (!cRes.success) return;
    const customer = cRes.data;

    const pRes = await createProductUseCase.execute({
      name: 'نرم‌افزار حسابداری تحت وب',
      sellingPrice: 8500000,
      initialStock: 20,
      minStockThreshold: 5,
      unit: 'package'
    });
    expect(pRes.success).toBe(true);
    if (!pRes.success) return;
    const prod = pRes.data;

    // Issue invoice
    const invRes = await createInvoiceUseCase.execute({
      customerId: customer.id,
      invoiceDate: today,
      items: [
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          quantity: 3,
          unitPrice: 8500000,
          discount: 500000
        }
      ],
      upfrontPayment: {
        amount: 10000000,
        paymentMethod: 'card_transfer'
      }
    });
    expect(invRes.success).toBe(true);

    const reportRes = await getReportsDataUseCase.execute();
    expect(reportRes.success).toBe(true);
    if (!reportRes.success) return;

    const r = reportRes.data;
    // 1. Sales Trends
    expect(r.salesTrends.length).toBeGreaterThan(0);
    expect(r.salesTrends[0].totalSales).toBe(25000000);
    expect(r.salesTrends[0].totalCollected).toBe(10000000);

    // 2. Top Selling Products
    expect(r.topSellingProducts.length).toBe(1);
    expect(r.topSellingProducts[0].productName).toBe('نرم‌افزار حسابداری تحت وب');
    expect(r.topSellingProducts[0].totalQuantityScaled).toBe(3000);
    expect(r.topSellingProducts[0].totalRevenue).toBe(25000000);

    // 3. Debtors Ledger
    expect(r.debtorsLedger.length).toBe(1);
    expect(r.debtorsLedger[0].fullName).toBe('شرکت فناوری آریا');
    expect(r.debtorsLedger[0].totalDebt).toBe(15000000);
  });

  it('performs unified global search across entities', async () => {
    // 1. Create sample entities
    await createCustomerUseCase.execute({
      name: 'علی احمدی',
      mobile: '09198765432'
    });

    await createProductUseCase.execute({
      name: 'مودم فیبر نوری هواوی',
      sellingPrice: 1200000,
      initialStock: 10,
      minStockThreshold: 2,
      unit: 'piece'
    });

    await createLeadUseCase.execute({
      name: 'احمد رضایی',
      mobile: '09120001122'
    });

    await createTaskUseCase.execute({
      title: 'پیگیری ارسال مودم هواوی',
      dueDate: '2026-11-03',
      priority: 'urgent'
    });

    // Search by 'احمد' (matches customer 'علی احمدی' and lead 'احمد رضایی')
    const searchRes1 = await globalSearchUseCase.execute('احمد');
    expect(searchRes1.success).toBe(true);
    if (!searchRes1.success) return;

    const typesFound1 = searchRes1.data.map((item) => item.type);
    expect(typesFound1).toContain('customer');
    expect(typesFound1).toContain('lead');

    // Search by 'هواوی' (matches product and task)
    const searchRes2 = await globalSearchUseCase.execute('هواوی');
    expect(searchRes2.success).toBe(true);
    if (!searchRes2.success) return;

    const typesFound2 = searchRes2.data.map((item) => item.type);
    expect(typesFound2).toContain('product');
    expect(typesFound2).toContain('task');

    // Empty search
    const searchResEmpty = await globalSearchUseCase.execute('   ');
    expect(searchResEmpty.success).toBe(true);
    if (!searchResEmpty.success) return;
    expect(searchResEmpty.data).toEqual([]);
  });
});
