import { describe, it, expect } from 'vitest';
import { MockDatabase } from '@/infrastructure/mock/MockDatabase';
import {
  MockBusinessProfileRepository,
  MockExpenseRepository,
  MockInvoiceRepository,
  MockPaymentRepository,
  MockProductRepository,
  MockReportingRepository,
  MockTaskRepository
} from '@/infrastructure/mock/MockRepositories';
import { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { Money } from '@/domain/value-objects/Money';
import { Payment } from '@/domain/entities/Payment';
import { Expense } from '@/domain/entities/Expense';
import { generateUUID } from '@/shared/utils/id';

describe('Mock repositories (backend-less mode)', () => {
  it('persists business profile and reports hasProfile', async () => {
    const db = new MockDatabase();
    const repo = new MockBusinessProfileRepository(db);

    expect(await repo.hasProfile()).toBe(false);

    await repo.saveProfile(
      new BusinessProfile({
        id: generateUUID(),
        name: 'فروشگاه تست',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    );

    expect(await repo.hasProfile()).toBe(true);
    expect((await repo.getProfile())?.name).toBe('فروشگاه تست');
  });

  it('generates next invoice number sequentially', async () => {
    const db = new MockDatabase();
    const repo = new MockInvoiceRepository(db);
    const maxExisting = Math.max(...db.invoices.map((i) => parseInt(/^INV-(\d+)$/.exec(i.invoiceNumber)![1], 10)));

    const next = await repo.getNextInvoiceNumber();
    expect(parseInt(next.replace('INV-', ''), 10)).toBeGreaterThan(maxExisting);
  });

  it('records payment with cash entry and expense with negative cash entry', async () => {
    const db = new MockDatabase();
    const balanceBefore = db.currentCashBalance();

    const invoice = db.invoices.find((i) => i.status === 'issued' && i.outstandingDebt.value > 0);
    expect(invoice).toBeTruthy();

    const payRepo = new MockPaymentRepository(db);
    await payRepo.record(
      new Payment({
        id: generateUUID(),
        invoiceId: invoice!.id,
        customerId: invoice!.customerId,
        amount: Money.fromToman(5000),
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().slice(0, 10),
        isVoided: false,
        createdAt: new Date().toISOString()
      })
    );
    expect(db.currentCashBalance()).toBe(balanceBefore + 5000);

    const expenseRepo = new MockExpenseRepository(db);
    await expenseRepo.recordExpense(
      new Expense({
        id: generateUUID(),
        categoryId: null,
        title: 'هزینه تست',
        amount: Money.fromToman(1000),
        expenseDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'cash',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    );
    expect(db.currentCashBalance()).toBe(balanceBefore + 5000 - 1000);
  });

  it('builds dashboard metrics from seeded data', async () => {
    const db = new MockDatabase();
    const reports = new MockReportingRepository(db);

    const metrics = await reports.getDashboardMetrics();
    expect(metrics.todaySalesCount).toBeGreaterThanOrEqual(0);
    expect(metrics.recentInvoices.length).toBeGreaterThan(0);
    expect(metrics.todayTasks.length).toBeGreaterThan(0);
    expect(metrics.lowStockCount).toBeGreaterThan(0);
  });

  it('flags low-stock and daily/overdue tasks', async () => {
    const db = new MockDatabase();
    const products = new MockProductRepository(db);
    const tasks = new MockTaskRepository(db);

    const low = await products.listLowStock();
    expect(low.some((p) => p.stockQuantity.scaledValue <= p.minStockThreshold.scaledValue)).toBe(true);

    const overdue = await tasks.getOverdueTasks();
    expect(overdue.length).toBeGreaterThan(0);
  });
});
