import type { IAppSettingsRepository } from '@/domain/repositories/IAppSettingsRepository';
import type { IBusinessProfileRepository } from '@/domain/repositories/IBusinessProfileRepository';
import type {
  ICategoryRepository
} from '@/domain/repositories/ICategoryRepository';
import type {
  ICustomerRepository,
  CustomerFinancialSummary,
  CustomerNote
} from '@/domain/repositories/ICustomerRepository';
import type {
  ICashLedgerRepository,
  FinancialSummary
} from '@/domain/repositories/ICashLedgerRepository';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import type { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';
import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { Category } from '@/domain/entities/Category';
import { Customer } from '@/domain/entities/Customer';
import { Invoice, type InvoiceStatus } from '@/domain/entities/Invoice';
import { Money } from '@/domain/value-objects/Money';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import { Product } from '@/domain/entities/Product';
import { StockMovement } from '@/domain/entities/StockMovement';
import { Payment } from '@/domain/entities/Payment';
import { Expense } from '@/domain/entities/Expense';
import { OtherIncome } from '@/domain/entities/OtherIncome';
import { CashTransaction } from '@/domain/entities/CashTransaction';
import {
  DashboardMetrics,
  DashboardRecentInvoice,
  DashboardTodayTask,
  DebtorReportItem,
  GlobalSearchResult,
  IReportingRepository,
  LowStockReportItem,
  MonthlySalesTrend,
  TopSellingProductReport
} from '@/domain/repositories/IReportingRepository';
import { Lead, LeadStatus } from '@/domain/entities/Lead';
import { Task, TaskPriority, TaskStatus } from '@/domain/entities/Task';
import { generateUUID } from '@/shared/utils/id';
import jalaali from 'jalaali-js';

import { MockDatabase } from './MockDatabase';

const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// ---------------------------------------------------------------------------
// Simple entities / settings / profile
// ---------------------------------------------------------------------------

export class MockAppSettingsRepository implements IAppSettingsRepository {
  constructor(private db: MockDatabase) {}

  public async get(key: string): Promise<string | null> {
    return this.db.settings.get(key) ?? null;
  }

  public async set(key: string, value: string): Promise<void> {
    this.db.settings.set(key, value);
  }

  public async getAll(): Promise<Record<string, string>> {
    return Object.fromEntries(this.db.settings);
  }
}

export class MockBusinessProfileRepository implements IBusinessProfileRepository {
  constructor(private db: MockDatabase) {}

  public async getProfile(): Promise<BusinessProfile | null> {
    return this.db.profile;
  }

  public async saveProfile(profile: BusinessProfile): Promise<void> {
    this.db.saveProfile(profile);
  }

  public async hasProfile(): Promise<boolean> {
    return this.db.profile !== null;
  }
}

export class MockCategoryRepository implements ICategoryRepository {
  constructor(private db: MockDatabase) {}

  public async findById(id: string): Promise<Category | null> {
    return this.db.categories.find((c) => c.id === id) ?? null;
  }

  public async findByName(name: string): Promise<Category | null> {
    return this.db.categories.find((c) => c.name === name.trim()) ?? null;
  }

  public async listAll(): Promise<Category[]> {
    return [...this.db.categories];
  }

  public async save(category: Category): Promise<void> {
    const idx = this.db.categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      this.db.categories[idx] = category;
    } else {
      this.db.categories.push(category);
    }
  }
}

// ---------------------------------------------------------------------------
// Products / inventory
// ---------------------------------------------------------------------------

export class MockProductRepository implements IProductRepository {
  constructor(private db: MockDatabase) {}

  public async findById(id: string): Promise<Product | null> {
    return this.db.products.find((p) => p.id === id) ?? null;
  }

  public async findBySku(sku: string): Promise<Product | null> {
    return this.db.products.find((p) => p.sku === sku.trim()) ?? null;
  }

  public async search(
    query: string,
    categoryId?: string | null,
    includeArchived?: boolean
  ): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    return this.db.products.filter((p) => {
      if (!includeArchived && p.isArchived) return false;
      if (categoryId && p.categoryId !== categoryId) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }

  public async listAll(includeArchived?: boolean): Promise<Product[]> {
    return this.db.products.filter((p) => includeArchived || !p.isArchived);
  }

  public async listLowStock(): Promise<Product[]> {
    return this.db.products.filter(
      (p) => !p.isArchived && p.stockQuantity.scaledValue <= p.minStockThreshold.scaledValue
    );
  }

  public async save(product: Product): Promise<void> {
    const idx = this.db.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.db.products[idx] = product;
    } else {
      this.db.products.push(product);
    }
  }

  public async getNextSkuSequence(): Promise<string> {
    const maxNum = this.db.products.reduce((max, p) => {
      const m = /^P-1(\d+)$/.exec(p.sku);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return `P-1${String(maxNum + 1).padStart(3, '0')}`;
  }

  public async hasHistory(id: string): Promise<boolean> {
    return this.db.stockMovements.some((m) => m.productId === id);
  }
}

const POSITIVE_MOVEMENT_TYPES = ['initial', 'addition', 'invoice_cancellation', 'adjustment'];

export class MockStockMovementRepository implements IStockMovementRepository {
  constructor(private db: MockDatabase) {}

  public async record(movement: StockMovement): Promise<void> {
    this.db.stockMovements.push(movement);
  }

  public async findByProductId(productId: string): Promise<StockMovement[]> {
    return this.db.stockMovements.filter((m) => m.productId === productId);
  }

  public async calculateReconciledStock(productId: string): Promise<StockQuantity> {
    let scaled = 0;
    for (const m of Positives(this.findByProductIdSync(productId))) {
      const sign = POSITIVE_MOVEMENT_TYPES.includes(m.movementType as string) ? 1 : -1;
      scaled += sign * m.quantity.scaledValue;
    }
    return StockQuantity.fromScaled(scaled);
  }

  private findByProductIdSync(productId: string): StockMovement[] {
    return this.db.stockMovements.filter((m) => m.productId === productId);
  }
}

function Positives(list: StockMovement[]): StockMovement[] {
  return list;
}

// ---------------------------------------------------------------------------
// Sales / customers / invoices / payments / leads / tasks
// ---------------------------------------------------------------------------

export class MockCustomerRepository implements ICustomerRepository {
  constructor(private db: MockDatabase) {}

  public async findById(id: string): Promise<Customer | null> {
    return this.db.customers.find((c) => c.id === id) ?? null;
  }

  public async findByMobile(mobile: string): Promise<Customer | null> {
    return this.db.customers.find((c) => c.mobile === mobile.trim()) ?? null;
  }

  public async search(
    query: string,
    tag?: string,
    includeArchived?: boolean
  ): Promise<Customer[]> {
    const q = query.trim().toLowerCase();
    return this.db.customers.filter((c) => {
      if (!includeArchived && c.isArchived) return false;
      if (tag && !(c.tags as string[]).includes(tag)) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.mobile.includes(q);
    });
  }

  public async listAll(includeArchived?: boolean): Promise<Customer[]> {
    return this.db.customers.filter((c) => includeArchived || !c.isArchived);
  }

  public async save(customer: Customer): Promise<void> {
    const idx = this.db.customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      this.db.customers[idx] = customer;
    } else {
      this.db.customers.push(customer);
    }
  }

  public async getFinancialSummary(customerId: string): Promise<CustomerFinancialSummary> {
    const invoices = this.db.invoices.filter(
      (inv) => inv.customerId === customerId && inv.status === 'issued'
    );
    const customerInvoices = this.db.invoices.filter((inv) => inv.customerId === customerId);
    const customerInvoiceIds = new Set(customerInvoices.map((inv) => inv.id));
    const payments = this.db.payments.filter(
      (p) => p.customerId === customerId && !p.isVoided && customerInvoiceIds.has(p.invoiceId ?? '')
    );

    const totalPurchases = invoices.reduce((sum, inv) => sum + inv.finalAmount.value, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount.value, 0);
    return {
      totalPurchases,
      totalPayments,
      outstandingDebt: totalPurchases - totalPayments,
      invoiceCount: invoices.length
    };
  }

  public async addNote(customerId: string, content: string): Promise<CustomerNote> {
    const note = {
      id: generateUUID(),
      customerId,
      content,
      createdAt: new Date().toISOString()
    };
    this.db.customerNotes.push(note);
    return note;
  }

  public async getNotes(customerId: string): Promise<CustomerNote[]> {
    return this.db.customerNotes.filter((n) => n.customerId === customerId);
  }

  public async listTags(): Promise<string[]> {
    const tags = new Set<string>();
    for (const c of this.db.customers) {
      (c.tags as string[]).forEach((t) => tags.add(t));
    }
    return [...tags].sort();
  }
}

export class MockInvoiceRepository implements IInvoiceRepository {
  constructor(private db: MockDatabase) {}

  public async findById(id: string): Promise<Invoice | null> {
    return this.db.invoices.find((inv) => inv.id === id) ?? null;
  }

  public async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.db.invoices.find((inv) => inv.invoiceNumber === invoiceNumber.trim()) ?? null;
  }

  public async search(
    query: string,
    status?: InvoiceStatus,
    customerId?: string
  ): Promise<Invoice[]> {
    const q = query.trim().toLowerCase();
    return this.db.invoices.filter((inv) => {
      if (status && inv.status !== status) return false;
      if (customerId && inv.customerId !== customerId) return false;
      if (!q) return true;
      return inv.invoiceNumber.toLowerCase().includes(q);
    });
  }

  public async listAll(limit?: number): Promise<Invoice[]> {
    const sorted = [...this.db.invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return limit ? sorted.slice(0, limit) : sorted;
  }

  public async save(invoice: Invoice): Promise<void> {
    const idx = this.db.invoices.findIndex((inv) => inv.id === invoice.id);
    if (idx >= 0) {
      this.db.invoices[idx] = invoice;
    } else {
      this.db.invoices.push(invoice);
    }
  }

  public async getNextInvoiceNumber(): Promise<string> {
    const maxNum = this.db.invoices.reduce((max, inv) => {
      const m = /^INV-(\d+)$/.exec(inv.invoiceNumber);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 1000);
    return `INV-${maxNum + 1}`;
  }

  public async hasCancellationMovements(invoiceId: string): Promise<boolean> {
    return this.db.stockMovements.some(
      (m) => m.movementType === 'invoice_cancellation' && m.referenceId === invoiceId
    );
  }
}

export class MockPaymentRepository implements IPaymentRepository {
  constructor(private db: MockDatabase) {}

  public async record(payment: Payment): Promise<void> {
    this.db.payments.push(payment);
    const inv = this.db.invoices.find((i) => i.id === payment.invoiceId);
    this.db.appendCash(
      'invoice_payment',
      payment.amount.value,
      `وصول فاکتور ${inv?.invoiceNumber ?? '-'}`,
      'invoice',
      payment.invoiceId ?? null,
      payment.paymentDate
    );
  }

  public async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return this.db.payments.filter((p) => p.invoiceId === invoiceId && !p.isVoided);
  }

  public async findByCustomerId(customerId: string): Promise<Payment[]> {
    return this.db.payments.filter((p) => p.customerId === customerId && !p.isVoided);
  }

  public async voidPayment(paymentId: string, reason: string): Promise<void> {
    const payment = this.db.payments.find((p) => p.id === paymentId);
    if (!payment) return;
    payment.void(reason);
  }
}

export class MockLeadRepository implements ILeadRepository {
  constructor(private db: MockDatabase) {}

  public async save(lead: Lead): Promise<void> {
    const idx = this.db.leads.findIndex((l) => l.id === lead.id);
    if (idx >= 0) {
      this.db.leads[idx] = lead;
    } else {
      this.db.leads.push(lead);
    }
  }

  public async findById(id: string): Promise<Lead | null> {
    return this.db.leads.find((l) => l.id === id) ?? null;
  }

  public async findByMobile(mobile: string): Promise<Lead | null> {
    return this.db.leads.find((l) => l.mobile === mobile.trim()) ?? null;
  }

  public async listAll(options?: {
    status?: LeadStatus;
    search?: string;
    limit?: number;
  }): Promise<Lead[]> {
    const q = (options?.search ?? '').trim().toLowerCase();
    const filtered = this.db.leads.filter((l) => {
      if (options?.status && l.status !== options.status) return false;
      if (!q) return true;
      return l.name.toLowerCase().includes(q) || l.mobile.includes(q);
    });
    return options?.limit ? filtered.slice(0, options.limit) : filtered;
  }

  public async countByStatus(): Promise<Record<LeadStatus, number>> {
    const counts: Record<LeadStatus, number> = {
      new: 0,
      following_up: 0,
      interested: 0,
      converted: 0,
      unsuccessful: 0,
      rejected: 0
    };
    for (const l of this.db.leads) {
      counts[l.status]++;
    }
    return counts;
  }

  public async delete(id: string): Promise<void> {
    const idx = this.db.leads.findIndex((l) => l.id === id);
    if (idx >= 0) {
      this.db.leads.splice(idx, 1);
    }
  }
}

export class MockTaskRepository implements ITaskRepository {
  constructor(private db: MockDatabase) {}

  public async save(task: Task): Promise<void> {
    const idx = this.db.tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      this.db.tasks[idx] = task;
    } else {
      this.db.tasks.push(task);
    }
  }

  public async findById(id: string): Promise<Task | null> {
    return this.db.tasks.find((t) => t.id === id) ?? null;
  }

  public async listAll(options?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    relatedType?: string;
    relatedId?: string;
    limit?: number;
  }): Promise<Task[]> {
    const filtered = this.db.tasks.filter((t) => {
      if (options?.status && t.status !== options.status) return false;
      if (options?.priority && t.priority !== options.priority) return false;
      if (options?.dueDate && t.dueDate !== options.dueDate) return false;
      if (options?.relatedType && t.relatedType !== options.relatedType) return false;
      if (options?.relatedId && t.relatedId !== options.relatedId) return false;
      return true;
    });
    return options?.limit ? filtered.slice(0, options.limit) : filtered;
  }

  public async getPendingTasksDueToday(): Promise<Task[]> {
    const today = new Date().toISOString().slice(0, 10);
    return this.db.tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate <= today
    );
  }

  public async getOverdueTasks(): Promise<Task[]> {
    const today = new Date().toISOString().slice(0, 10);
    return this.db.tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate < today
    );
  }

  public async delete(id: string): Promise<void> {
    const idx = this.db.tasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.db.tasks.splice(idx, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export class MockExpenseRepository implements IExpenseRepository {
  constructor(private db: MockDatabase) {}

  public async recordExpense(expense: Expense): Promise<void> {
    this.db.expenses.push(expense);
    this.db.appendCash('expense', -expense.amount.value, expense.title, 'expense', expense.id, expense.expenseDate);
  }

  public async recordOtherIncome(income: OtherIncome): Promise<void> {
    this.db.otherIncomes.push(income);
    this.db.appendCash('other_income', income.amount.value, income.title, 'other_income', income.id, income.incomeDate);
  }

  public async findExpenseById(id: string): Promise<Expense | null> {
    return this.db.expenses.find((e) => e.id === id) ?? null;
  }

  public async listExpenses(options?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    limit?: number;
  }): Promise<Expense[]> {
    const list = this.db.expenses.filter((e) => {
      if (options?.startDate && e.expenseDate < options.startDate) return false;
      if (options?.endDate && e.expenseDate > options.endDate) return false;
      if (options?.categoryId && e.categoryId !== options.categoryId) return false;
      return true;
    });
    return options?.limit ? list.slice(0, options.limit) : list;
  }

  public async listOtherIncomes(options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<OtherIncome[]> {
    const list = this.db.otherIncomes.filter((o) => {
      if (options?.startDate && o.incomeDate < options.startDate) return false;
      if (options?.endDate && o.incomeDate > options.endDate) return false;
      return true;
    });
    return options?.limit ? list.slice(0, options.limit) : list;
  }

  public async getTotalExpenses(startDate?: string, endDate?: string): Promise<Money> {
    let total = 0;
    for (const e of this.db.expenses) {
      if (startDate && e.expenseDate < startDate) continue;
      if (endDate && e.expenseDate > endDate) continue;
      total += e.amount.value;
    }
    return Money.fromToman(total);
  }

  public async getTotalOtherIncomes(startDate?: string, endDate?: string): Promise<Money> {
    let total = 0;
    for (const o of this.db.otherIncomes) {
      if (startDate && o.incomeDate < startDate) continue;
      if (endDate && o.incomeDate > endDate) continue;
      total += o.amount.value;
    }
    return Money.fromToman(total);
  }
}

export class MockCashLedgerRepository implements ICashLedgerRepository {
  constructor(private db: MockDatabase) {}

  public async getCurrentBalance(): Promise<Money> {
    return Money.fromSignedToman(this.db.currentCashBalance());
  }

  public async listTransactions(limit: number = 100): Promise<CashTransaction[]> {
    const sorted = [...this.db.cashTransactions].reverse();
    return limit ? sorted.slice(0, limit) : sorted;
  }

  public async getFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummary> {
    const inRange = (date: string) =>
      (!startDate || date >= startDate) && (!endDate || date <= endDate);

    let totalReceipts = 0;
    for (const p of this.db.payments) {
      if (!p.isVoided && inRange(p.paymentDate)) totalReceipts += p.amount.value;
    }
    let totalExpenses = 0;
    for (const e of this.db.expenses) {
      if (inRange(e.expenseDate)) totalExpenses += e.amount.value;
    }
    let totalOtherIncomes = 0;
    for (const o of this.db.otherIncomes) {
      if (inRange(o.incomeDate)) totalOtherIncomes += o.amount.value;
    }

    return {
      currentCashBalance: Money.fromSignedToman(this.db.currentCashBalance()),
      totalReceipts: Money.fromToman(totalReceipts),
      totalExpenses: Money.fromToman(totalExpenses),
      totalOtherIncomes: Money.fromToman(totalOtherIncomes),
      netSurplus: Money.fromSignedToman(totalReceipts + totalOtherIncomes - totalExpenses)
    };
  }
}

// ---------------------------------------------------------------------------
// Reporting (aggregated views over the mock data)
// ---------------------------------------------------------------------------

const SCALED_UNIT_LABELS: Record<string, string> = {
  piece: 'عدد', carton: 'کارتن', kilogram: 'کیلوگرم', gram: 'گرم', meter: 'متر', liter: 'لیتر'
};

export class MockReportingRepository implements IReportingRepository {
  constructor(private db: MockDatabase) {}

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public async getDashboardMetrics(_todayIso?: string): Promise<DashboardMetrics> {
    const today = this.todayIso();
    const issued = this.db.invoices.filter((inv) => inv.status === 'issued');

    const todayInvoices = issued.filter((inv) => inv.invoiceDate === today);
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.finalAmount.value, 0);
    const todayReceipts = this.db.payments
      .filter((p) => !p.isVoided && p.paymentDate === today)
      .reduce((sum, p) => sum + p.amount.value, 0);
    const totalOutstandingDebt = issued.reduce((sum, inv) => sum + inv.outstandingDebt.value, 0);
    const cashBalance = this.db.currentCashBalance();
    const pendingTasksToday = this.db.tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate <= today
    ).length;
    const lowStock = await new MockProductRepository(this.db).listLowStock();

    const recentInvoices = issued
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((inv): DashboardRecentInvoice => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: this.db.customers.find((c) => c.id === inv.customerId)?.name ?? 'مشتری عمومی',
        totalAmount: inv.finalAmount.value,
        status: inv.status,
        createdAt: inv.createdAt
      }));

    const todayTasks: DashboardTodayTask[] = this.db.tasks
      .filter((t) => t.dueDate <= today)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
        isCompleted: t.status === 'completed'
      }));

    return {
      todaySales,
      todaySalesCount: todayInvoices.length,
      todayReceipts,
      totalOutstandingDebt,
      pendingTasksTodayCount: pendingTasksToday,
      cashBalance,
      lowStockCount: lowStock.length,
      recentInvoices,
      todayTasks
    };
  }

  public async getMonthlySalesTrends(limitMonths: number = 6): Promise<MonthlySalesTrend[]> {
    const issued = this.db.invoices.filter((inv) => inv.status === 'issued');
    const monthMap = new Map<string, MonthlySalesTrend>();

    for (const inv of issued) {
      const d = new Date(`${inv.invoiceDate}T00:00:00`);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const label = `${PERSIAN_MONTH_NAMES[j.jm - 1]} ${j.jy}`;

      const entry = monthMap.get(key) ?? {
        monthKey: key,
        jalaliLabel: label,
        invoiceCount: 0,
        totalSales: 0,
        totalCollected: 0
      };
      entry.invoiceCount++;
      entry.totalSales += inv.finalAmount.value;
      entry.totalCollected += inv.paidAmount.value;
      monthMap.set(key, entry);
    }

    return [...monthMap.values()]
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .slice(0, limitMonths);
  }

  public async getTopSellingProducts(limit: number = 5): Promise<TopSellingProductReport[]> {
    const productAgg = new Map<string, TopSellingProductReport>();
    for (const inv of this.db.invoices) {
      if (inv.status !== 'issued') continue;
      for (const item of inv.items) {
        const productId = (item.productId ?? item.productNameSnapshot) as string;
        const existing = productAgg.get(productId) ?? {
          productId,
          productName: item.productNameSnapshot,
          unit: SCALED_UNIT_LABELS[item.unitSnapshot] ?? item.unitSnapshot,
          totalQuantityScaled: 0,
          totalRevenue: 0
        };
        existing.totalQuantityScaled += item.quantity.scaledValue;
        existing.totalRevenue += item.lineTotal.value;
        productAgg.set(productId, existing);
      }
    }
    return [...productAgg.values()]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  public async getDebtorsLedger(): Promise<DebtorReportItem[]> {
    const debtMap = new Map<string, DebtorReportItem>();
    for (const inv of this.db.invoices) {
      if (inv.status !== 'issued' || inv.outstandingDebt.value <= 0) continue;
      const customer = this.db.customers.find((c) => c.id === inv.customerId);
      if (!customer) continue;
      const existing = debtMap.get(customer.id) ?? {
        customerId: customer.id,
        fullName: customer.name,
        mobile: customer.mobile,
        totalDebt: 0,
        lastInvoiceDate: inv.invoiceDate
      };
      existing.totalDebt += inv.outstandingDebt.value;
      existing.lastInvoiceDate = inv.invoiceDate;
      debtMap.set(customer.id, existing);
    }
    return [...debtMap.values()].sort((a, b) => b.totalDebt - a.totalDebt);
  }

  public async getLowStockReport(): Promise<LowStockReportItem[]> {
    return this.db.products
      .filter((p) => !p.isArchived && p.stockQuantity.scaledValue <= p.minStockThreshold.scaledValue)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        currentStockScaled: p.stockQuantity.scaledValue,
        minThresholdScaled: p.minStockThreshold.scaledValue,
        unit: SCALED_UNIT_LABELS[p.unit] ?? p.unit,
        deficitScaled: Math.max(0, p.minStockThreshold.scaledValue - p.stockQuantity.scaledValue)
      }));
  }

  public async globalSearch(query: string, limitPerCategory: number = 5): Promise<GlobalSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: GlobalSearchResult[] = [];

    this.db.customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q))
      .slice(0, limitPerCategory)
      .forEach((c) => results.push({
        id: c.id,
        type: 'customer',
        title: c.name,
        subtitle: c.mobile,
        route: `/customers/${c.id}`,
        badge: 'مشتری'
      }));

    this.db.products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, limitPerCategory)
      .forEach((p) => results.push({
        id: p.id,
        type: 'product',
        title: p.name,
        subtitle: `${p.sku} — ${p.sellingPrice.format()}`,
        route: `/products/${p.id}`,
        badge: 'کالا'
      }));

    this.db.invoices
      .filter((inv) => inv.invoiceNumber.toLowerCase().includes(q))
      .slice(0, limitPerCategory)
      .forEach((inv) => results.push({
        id: inv.id,
        type: 'invoice',
        title: `فاکتور ${inv.invoiceNumber}`,
        subtitle: inv.finalAmount.format(),
        route: `/invoices/${inv.id}`,
        badge: 'فاکتور'
      }));

    this.db.leads
      .filter((l) => l.name.toLowerCase().includes(q) || l.mobile.includes(q))
      .slice(0, limitPerCategory)
      .forEach((l) => results.push({
        id: l.id,
        type: 'lead',
        title: l.name,
        subtitle: l.mobile,
        route: `/leads/${l.id}`,
        badge: 'سرنخ'
      }));

    this.db.tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, limitPerCategory)
      .forEach((t) => results.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: t.dueDate,
        route: '/tasks',
        badge: 'وظیفه'
      }));

    return results;
  }
}
