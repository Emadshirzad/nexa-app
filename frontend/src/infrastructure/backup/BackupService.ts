import { BackupCrypto } from '@/infrastructure/security/BackupCrypto';
import { Lead } from '@/domain/entities/Lead';
import { Task } from '@/domain/entities/Task';
import { Expense } from '@/domain/entities/Expense';
import { OtherIncome } from '@/domain/entities/OtherIncome';
import type { IAppSettingsRepository } from '@/domain/repositories/IAppSettingsRepository';
import type { IBusinessProfileRepository } from '@/domain/repositories/IBusinessProfileRepository';
import type { ICategoryRepository } from '@/domain/repositories/ICategoryRepository';
import type { ICashLedgerRepository } from '@/domain/repositories/ICashLedgerRepository';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { IExpenseRepository } from '@/domain/repositories/IExpenseRepository';
import type { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';
import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { Result, fail } from '@/shared/types/result';

export interface NexaBackupPayload {
  schemaVersion: number;
  createdAt: string;
  tableData: Record<string, Record<string, unknown>[]>;
}

/**
 * Mock-mode backup: snapshots all in-memory mock data into an encrypted
 * .nxbak file (same envelope format as the SQLite implementation).
 * Restoring into the mock session is not supported — will be enabled once
 * the real backend replaces the mock repositories.
 */
export class BackupService {
  constructor(
    private readonly profileRepo: IBusinessProfileRepository,
    private readonly settingsRepo: IAppSettingsRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly productRepo: IProductRepository,
    private readonly stockMovementRepo: IStockMovementRepository,
    private readonly customerRepo: ICustomerRepository,
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly leadRepo: ILeadRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly expenseRepo: IExpenseRepository,
    private readonly cashLedgerRepo: ICashLedgerRepository
  ) {}

  public async createBackup(passphrase: string): Promise<string> {
    const [profile, settings, categories, products, customers, invoices] = await Promise.all([
      this.profileRepo.getProfile(),
      this.settingsRepo.getAll(),
      this.categoryRepo.listAll(),
      this.productRepo.listAll(true),
      this.customerRepo.listAll(true),
      this.invoiceRepo.listAll()
    ]);
    const [movements, payments, leads, tasks, expenses, incomes, cash, notes] = await Promise.all([
      this.collectMovements(),
      this.collectPayments(),
      this.leadRepo.listAll({ limit: 1000 }),
      this.taskRepo.listAll({ limit: 1000 }),
      this.expenseRepo.listExpenses({ limit: 1000 }),
      this.expenseRepo.listOtherIncomes({ limit: 1000 }),
      this.cashLedgerRepo.listTransactions(1000),
      this.collectCustomerNotes()
    ]);

    const payload: NexaBackupPayload = {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      tableData: {
        ...(profile ? { business_profile: [profile.toJSON()] as unknown as Record<string, unknown>[] } : {}),
        app_settings: Object.entries(settings).map(([key, value]) => ({ key, value })),
        categories: categories.map((c) => c.toJSON() as unknown as Record<string, unknown>),
        products: products.map((p) => this.productToRow(p) as Record<string, unknown>),
        stock_movements: movements.map((m) => this.stockToRow(m) as Record<string, unknown>),
        customers: customers.map((c) => this.customerToRow(c) as Record<string, unknown>),
        invoices: invoices.map((i) => this.invoiceToRow(i) as Record<string, unknown>),
        payments: payments.map((p) => (p as { toJSON: () => Record<string, unknown> }).toJSON()),
        leads: leads.map((l) => this.leadToRow(l)),
        tasks: tasks.map((t) => this.taskToRow(t)),
        expenses: expenses.map((e) => this.expenseToRow(e)),
        other_incomes: incomes.map((o) => this.incomeToRow(o)),
        cash_transactions: cash.map((c) => this.cashToRow(c)),
        customer_notes: notes as unknown as Record<string, unknown>[]
      }
    };

    const json = JSON.stringify(payload);
    return BackupCrypto.encrypt(json, passphrase);
  }

  public async restoreBackup(
    _backupString: string,
    _passphrase: string
  ): Promise<Result<{ restoredTables: number; restoredRows: number }>> {
    return fail(
      new Error('در حالت پیش‌نمایش (داده آزمایشی) بازیابی پشتیبان پشتیبانی نمی‌شود. پس از اتصال به بک‌اند فعال خواهد شد.')
    );
  }

  // Snapshot helpers (entity getters -> plain rows) -------------------------

  private async collectMovements(): Promise<Array<{
    id: string; productId: string; movementType: string; quantity: { scaledValue: number };
    referenceType?: string | null; referenceId?: string | null; reason: string; createdAt: string;
  }>> {
    const rows:
      Array<{
        id: string; productId: string; movementType: string; quantity: { scaledValue: number };
        referenceType?: string | null; referenceId?: string | null; reason: string; createdAt: string;
      }> = [];
    const products = await this.productRepo.listAll(true);
    for (const p of products) {
      rows.push(...(await this.stockMovementRepo.findByProductId(p.id)));
    }
    return rows;
  }

  private async collectPayments(): Promise<unknown[]> {
    const rows: unknown[] = [];
    const invoices = await this.invoiceRepo.listAll();
    for (const inv of invoices) {
      rows.push(await this.paymentRepo.findByInvoiceId(inv.id));
    }
    return rows.flat();
  }

  private async collectCustomerNotes(): Promise<unknown[]> {
    const customers = await this.customerRepo.listAll(true);
    const notes = [];
    for (const c of customers) {
      notes.push(...(await this.customerRepo.getNotes(c.id)));
    }
    return notes;
  }

  private leadToRow(l: Lead): Record<string, unknown> {
    return {
      id: l.id,
      name: l.name,
      mobile: l.mobile,
      phone: l.phone ?? null,
      email: l.email ?? null,
      status: l.status,
      description: l.description ?? null,
      follow_up_date: l.followUpDate ?? null,
      converted_customer_id: l.convertedCustomerId ?? null,
      converted_at: l.convertedAt ?? null,
      created_at: l.createdAt,
      updated_at: l.updatedAt
    };
  }

  private taskToRow(t: Task): Record<string, unknown> {
    return {
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      due_date: t.dueDate,
      priority: t.priority,
      status: t.status,
      related_type: t.relatedType ?? null,
      related_id: t.relatedId ?? null,
      completed_at: t.completedAt ?? null,
      created_at: t.createdAt,
      updated_at: t.updatedAt
    };
  }

  private expenseToRow(e: Expense): Record<string, unknown> {
    return {
      id: e.id,
      category_id: e.categoryId ?? null,
      title: e.title,
      amount: e.amount.value,
      expense_date: e.expenseDate,
      description: e.description ?? null,
      payment_method: e.paymentMethod,
      created_at: e.createdAt,
      updated_at: e.updatedAt
    };
  }

  private incomeToRow(o: OtherIncome): Record<string, unknown> {
    return {
      id: o.id,
      title: o.title,
      amount: o.amount.value,
      income_date: o.incomeDate,
      description: o.description ?? null,
      payment_method: o.paymentMethod,
      created_at: o.createdAt,
      updated_at: o.updatedAt
    };
  }

  private productToRow(p: NonNullable<Awaited<ReturnType<IProductRepository['findById']>>>): Record<string, unknown> {
    return {
      id: p.id,
      category_id: p.categoryId ?? null,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      selling_price: p.sellingPrice.value,
      stock_quantity: p.stockQuantity.scaledValue,
      min_stock_threshold: p.minStockThreshold.scaledValue,
      is_archived: p.isArchived ? 1 : 0,
      created_at: p.createdAt,
      updated_at: p.updatedAt
    };
  }

  private stockToRow(m: {
    id: string; productId: string; movementType: string; quantity: { scaledValue: number };
    referenceType?: string | null; referenceId?: string | null; reason: string; createdAt: string;
  }): Record<string, unknown> {
    return {
      id: m.id,
      product_id: m.productId,
      movement_type: m.movementType,
      quantity: m.quantity.scaledValue,
      reference_type: m.referenceType ?? null,
      reference_id: m.referenceId ?? null,
      reason: m.reason,
      created_at: m.createdAt
    };
  }

  private customerToRow(c: NonNullable<Awaited<ReturnType<ICustomerRepository['findById']>>>): Record<string, unknown> {
    return {
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      phone: c.phone ?? null,
      address: c.address ?? null,
      notes: c.notes ?? null,
      follow_up_date: c.followUpDate ?? null,
      is_archived: c.isArchived ? 1 : 0,
      tags: (c.tags as string[]).join(','),
      created_at: c.createdAt,
      updated_at: c.updatedAt
    };
  }

  private invoiceToRow(inv: NonNullable<Awaited<ReturnType<IInvoiceRepository['findById']>>>): Record<string, unknown> {
    return {
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      customer_id: inv.customerId ?? null,
      invoice_date: inv.invoiceDate,
      status: inv.status,
      subtotal: inv.subtotal.value,
      item_discount_total: inv.itemDiscountTotal.value,
      invoice_discount: inv.invoiceDiscount.value,
      final_amount: inv.finalAmount.value,
      paid_amount: inv.paidAmount.value,
      outstanding_debt: inv.outstandingDebt.value,
      notes: inv.notes ?? null,
      cancelled_at: inv.cancelledAt ?? null,
      cancellation_reason: inv.cancellationReason ?? null,
      created_at: inv.createdAt,
      updated_at: inv.updatedAt,
      items: inv.items.map((it) => ({
        id: it.id,
        product_id: it.productId ?? null,
        product_name_snapshot: it.productNameSnapshot,
        sku_snapshot: it.skuSnapshot,
        unit_snapshot: it.unitSnapshot,
        unit_price_snapshot: it.unitPriceSnapshot.value,
        quantity: it.quantity.scaledValue,
        discount_amount: it.discountAmount.value,
        line_total: it.lineTotal.value
      }))
    };
  }

  private cashToRow(c: { id: string; transactionType: string; amount: { value: number }; balanceAfter: { value: number }; referenceType?: string | null; referenceId?: string | null; description: string; transactionDate: string; createdAt: string }): Record<string, unknown> {
    return {
      id: c.id,
      transaction_type: c.transactionType,
      amount: c.amount.value,
      balance_after: c.balanceAfter.value,
      reference_type: c.referenceType ?? null,
      reference_id: c.referenceId ?? null,
      description: c.description,
      transaction_date: c.transactionDate,
      created_at: c.createdAt
    };
  }
}
