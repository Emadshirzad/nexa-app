import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqliteDriver } from '@/infrastructure/database/BetterSqliteDriver';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { SqliteExpenseRepository } from '@/infrastructure/repositories/SqliteExpenseRepository';
import { SqliteCashLedgerRepository } from '@/infrastructure/repositories/SqliteCashLedgerRepository';
import { SqliteInvoiceRepository } from '@/infrastructure/repositories/SqliteInvoiceRepository';
import { SqlitePaymentRepository } from '@/infrastructure/repositories/SqlitePaymentRepository';
import { SqliteProductRepository } from '@/infrastructure/repositories/SqliteProductRepository';
import { SqliteStockMovementRepository } from '@/infrastructure/repositories/SqliteStockMovementRepository';
import { RecordExpenseUseCase } from '@/application/use-cases/finance/RecordExpenseUseCase';
import { RecordOtherIncomeUseCase } from '@/application/use-cases/finance/RecordOtherIncomeUseCase';
import { GetFinancialSummaryUseCase } from '@/application/use-cases/finance/GetFinancialSummaryUseCase';
import { CreateInvoiceUseCase } from '@/application/use-cases/invoices/CreateInvoiceUseCase';

describe('Finance and Cash Ledger Integration', () => {
  let driver: BetterSqliteDriver;
  let expenseRepo: SqliteExpenseRepository;
  let cashLedgerRepo: SqliteCashLedgerRepository;
  let invoiceRepo: SqliteInvoiceRepository;
  let paymentRepo: SqlitePaymentRepository;
  let productRepo: SqliteProductRepository;
  let movementRepo: SqliteStockMovementRepository;

  let recordExpenseUseCase: RecordExpenseUseCase;
  let recordOtherIncomeUseCase: RecordOtherIncomeUseCase;
  let getFinancialSummaryUseCase: GetFinancialSummaryUseCase;
  let createInvoiceUseCase: CreateInvoiceUseCase;

  beforeEach(async () => {
    driver = new BetterSqliteDriver(':memory:');
    const runner = new MigrationRunner(driver);
    await runner.run();

    expenseRepo = new SqliteExpenseRepository(driver);
    cashLedgerRepo = new SqliteCashLedgerRepository(driver);
    invoiceRepo = new SqliteInvoiceRepository(driver);
    paymentRepo = new SqlitePaymentRepository(driver);
    productRepo = new SqliteProductRepository(driver);
    movementRepo = new SqliteStockMovementRepository(driver);

    recordExpenseUseCase = new RecordExpenseUseCase(expenseRepo);
    recordOtherIncomeUseCase = new RecordOtherIncomeUseCase(expenseRepo);
    getFinancialSummaryUseCase = new GetFinancialSummaryUseCase(cashLedgerRepo);
    createInvoiceUseCase = new CreateInvoiceUseCase(
      invoiceRepo,
      productRepo,
      movementRepo,
      paymentRepo,
      driver
    );
  });

  afterEach(async () => {
    await driver.close();
  });

  it('records expenses and reduces cash ledger balance', async () => {
    const res = await recordExpenseUseCase.execute({
      title: 'قبض برق و گاز کارگاه',
      amount: 450000,
      expenseDate: '2026-11-02',
      paymentMethod: 'card_transfer',
      description: 'دوره مهر ماه'
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    const expense = res.data;
    expect(expense.amount.value).toBe(450000);

    const balance = await cashLedgerRepo.getCurrentBalance();
    expect(balance.value).toBe(-450000); // 0 - 450,000 = -450,000
  });

  it('records other income and increases cash ledger balance', async () => {
    const res = await recordOtherIncomeUseCase.execute({
      title: 'فروش کارتن و ضایعات',
      amount: 150000,
      incomeDate: '2026-11-02',
      paymentMethod: 'cash'
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    const income = res.data;
    expect(income.amount.value).toBe(150000);

    const balance = await cashLedgerRepo.getCurrentBalance();
    expect(balance.value).toBe(150000);
  });

  it('accurately computes multi-source financial summary in integer Toman', async () => {
    // 1. Issue an invoice with upfront payment: 1,000,000 Toman
    await createInvoiceUseCase.execute({
      invoiceDate: '2026-11-02',
      items: [
        {
          name: 'خدمات طراحی اختصاصی',
          sku: 'SRV-01',
          unit: 'piece',
          unitPrice: 1000000,
          quantity: 1,
          discount: 0
        }
      ],
      upfrontPayment: {
        amount: 1000000,
        paymentMethod: 'pos'
      }
    });

    // 2. Record other income: 250,000 Toman
    await recordOtherIncomeUseCase.execute({
      title: 'مشاوره ساعتی',
      amount: 250000,
      incomeDate: '2026-11-02',
      paymentMethod: 'bank_transfer'
    });

    // 3. Record expense: 350,000 Toman
    await recordExpenseUseCase.execute({
      title: 'خرید قهوه و پذیرایی',
      amount: 350000,
      expenseDate: '2026-11-02',
      paymentMethod: 'cash'
    });

    // Net cash balance should be: 1,000,000 + 250,000 - 350,000 = 900,000 Toman
    const summary = await getFinancialSummaryUseCase.execute();
    expect(summary.totalReceipts.value).toBe(1000000);
    expect(summary.totalOtherIncomes.value).toBe(250000);
    expect(summary.totalExpenses.value).toBe(350000);
    expect(summary.netSurplus.value).toBe(900000);
    expect(summary.currentCashBalance.value).toBe(900000);

    // Verify transaction history length
    const txs = await cashLedgerRepo.listTransactions();
    expect(txs.length).toBe(3);
  });
});
