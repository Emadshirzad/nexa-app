import { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { Category } from '@/domain/entities/Category';
import { Product, type ProductUnit } from '@/domain/entities/Product';
import { Customer } from '@/domain/entities/Customer';
import { Invoice, type InvoiceStatus } from '@/domain/entities/Invoice';
import { InvoiceItem } from '@/domain/entities/InvoiceItem';
import { Payment } from '@/domain/entities/Payment';
import { CashTransaction, type CashTransactionType } from '@/domain/entities/CashTransaction';
import { Expense, type ExpensePaymentMethod } from '@/domain/entities/Expense';
import { OtherIncome } from '@/domain/entities/OtherIncome';
import { Lead, type LeadStatus } from '@/domain/entities/Lead';
import { Task, type TaskPriority } from '@/domain/entities/Task';
import { StockMovement, type StockMovementType } from '@/domain/entities/StockMovement';
import { Money } from '@/domain/value-objects/Money';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import { generateUUID } from '@/shared/utils/id';

const PROFILE_KEY = 'nexa_mock_profile';

const dayOffset = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const stampAt = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

/**
 * Central in-memory data store for the mock (backend-less) mode.
 * Repositories hold live entity instances; IDs stay stable for the session.
 * Business profile is persisted to localStorage so onboarding is not repeated.
 */
export class MockDatabase {
  public categories: Category[] = [];
  public products: Product[] = [];
  public stockMovements: StockMovement[] = [];
  public customers: Customer[] = [];
  public customerNotes: Array<{ id: string; customerId: string; content: string; createdAt: string }> = [];
  public invoices: Invoice[] = [];
  public payments: Payment[] = [];
  public cashTransactions: CashTransaction[] = [];
  public leads: Lead[] = [];
  public tasks: Task[] = [];
  public expenses: Expense[] = [];
  public otherIncomes: OtherIncome[] = [];
  public settings: Map<string, string> = new Map();
  public profile: BusinessProfile | null = null;

  constructor() {
    this.seed();
    this.loadPersistedProfile();
  }

  // Cash ledger -------------------------------------------------------------

  public currentCashBalance(): number {
    const last = this.cashTransactions[this.cashTransactions.length - 1];
    return last?.balanceAfter.value ?? 0;
  }

  public appendCash(
    transactionType: CashTransactionType,
    amountSigned: number,
    description: string,
    referenceType: string | null = null,
    referenceId: string | null = null,
    transactionDate: string = dayOffset(0)
  ): CashTransaction {
    const tx = new CashTransaction({
      id: generateUUID(),
      transactionType,
      amount: Money.fromSignedToman(amountSigned),
      balanceAfter: Money.fromSignedToman(this.currentCashBalance() + amountSigned),
      referenceType,
      referenceId,
      description,
      transactionDate,
      createdAt: new Date().toISOString()
    });
    this.cashTransactions.push(tx);
    return tx;
  }

  // Product stock helpers ---------------------------------------------------

  public recordMovement(
    productId: string,
    movementType: StockMovementType,
    qtyDelta: number,
    reason: string,
    referenceType: string | null = null,
    referenceId: string | null = null
  ): StockMovement {
    const movement = new StockMovement({
      id: generateUUID(),
      productId,
      movementType,
      quantity: StockQuantity.fromScaled(Math.abs(qtyDelta)),
      referenceType,
      referenceId,
      reason,
      createdAt: new Date().toISOString()
    });
    this.stockMovements.push(movement);
    return movement;
  }

  // Business profile persistence (keeps onboarding across reloads) ----------

  public saveProfile(profile: BusinessProfile): void {
    this.profile = profile;
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile.toJSON()));
    } catch {
      // Storage unavailable (test environment) — session-only
    }
  }

  private loadPersistedProfile(): void {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown>;
        this.profile = new BusinessProfile({
          id: (data['id'] as string) || generateUUID(),
          name: data['name'] as string,
          phone: data['phone'] as string | undefined,
          email: data['email'] as string | undefined,
          address: data['address'] as string | undefined,
          description: data['description'] as string | undefined,
          createdAt: (data['createdAt'] as string) || new Date().toISOString(),
          updatedAt: (data['updatedAt'] as string) || new Date().toISOString()
        });
      }
    } catch {
      this.profile = null;
    }
  }

  // Seed data ---------------------------------------------------------------

  private seed(): void {
    // Categories
    this.categories = [
      new Category({ id: 'cat-general', name: 'عمومی', color: '#10B981', isActive: true, createdAt: stampAt(30), updatedAt: stampAt(30) }),
      new Category({ id: 'cat-foods', name: 'خوراکی', color: '#F59E0B', isActive: true, createdAt: stampAt(30), updatedAt: stampAt(30) }),
      new Category({ id: 'cat-office', name: 'لوازم اداری', color: '#3D5E7A', isActive: true, createdAt: stampAt(30), updatedAt: stampAt(30) })
    ];

    // Products (quantities/thresholds scaled by 1000)
    const productSpecs: Array<{
      name: string; unit: ProductUnit; price: number; stock: number; min: number; catId: string | null;
    }> = [
      { name: 'نوشیدنی انرژی‌زا ۲۵۰ میلی‌لیتری', unit: 'carton', price: 185_000, stock: 12, min: 3, catId: 'cat-foods' },
      { name: 'چای احمد نسیم ۴۰۰ گرمی', unit: 'piece', price: 320_000, stock: 8, min: 2, catId: 'cat-foods' },
      { name: 'قهوه فوری گلد ۱۰۰ گرمی', unit: 'piece', price: 485_000, stock: 2, min: 3, catId: 'cat-foods' },
      { name: 'شکلات تلخ ۸۶٪ دقیا', unit: 'piece', price: 95_000, stock: 40, min: 10, catId: 'cat-foods' },
      { name: 'پک کاغذ A4 (بسته ۵۰۰ برگ)', unit: 'piece', price: 260_000, stock: 25, min: 5, catId: 'cat-office' },
      { name: 'خودنویس رازول سیلور', unit: 'piece', price: 68_000, stock: 1, min: 5, catId: 'cat-office' },
      { name: 'کاغذ یادداشت چسب‌دار ۳×۳', unit: 'carton', price: 74_000, stock: 15, min: 4, catId: 'cat-office' },
      { name: 'بطری آب معدنی ۱.۵ لیتری', unit: 'piece', price: 20_000, stock: 30, min: 6, catId: 'cat-general' }
    ];
    this.products = productSpecs.map((spec, i) => new Product({
      id: `prod-${i + 1}`,
      categoryId: spec.catId,
      name: spec.name,
      sku: `P-1${String(i + 1).padStart(3, '0')}`,
      unit: spec.unit,
      sellingPrice: Money.fromToman(spec.price),
      stockQuantity: StockQuantity.fromDecimal(spec.stock),
      minStockThreshold: StockQuantity.fromDecimal(spec.min),
      isArchived: false,
      createdAt: stampAt(20 - i),
      updatedAt: stampAt(20 - i)
    }));

    // Stock movements: initial stock-in ledger for each product
    for (const p of this.products) {
      this.recordMovement(p.id, 'initial', p.stockQuantity.scaledValue, 'موجودی اولیه');
    }

    // Customers
    const customerSpecs = [
      { name: 'علی محمدی', mobile: '09121110001', tags: ['VIP'], follow: dayOffset(3) as string | null },
      { name: 'فاطمه رضایی', mobile: '09121110002', tags: [] as string[], follow: dayOffset(1) },
      { name: 'حسین کریمی', mobile: '09121110003', tags: ['عمده'], follow: dayOffset(-1) },
      { name: 'مریم حسینی', mobile: '09121110004', tags: [] as string[], follow: null },
      { name: 'رضا صادقی', mobile: '09121110005', tags: [] as string[], follow: null }
    ];
    this.customers = customerSpecs.map((c, i) => new Customer({
      id: `cust-${i + 1}`,
      name: c.name,
      mobile: c.mobile,
      followUpDate: c.follow,
      isArchived: false,
      tags: c.tags,
      createdAt: stampAt(25 - i),
      updatedAt: stampAt(25 - i)
    }));

    // Invoices
    interface InvoiceSeedSpec {
      daysAgo: number;
      customerIndex: number;
      items: Array<{ productIndex: number; qty: number }>;
      status?: InvoiceStatus;
    }
    const invoiceSpecs: InvoiceSeedSpec[] = [
      { daysAgo: 12, customerIndex: 0, items: [{ productIndex: 0, qty: 2 }, { productIndex: 1, qty: 5 }] },
      { daysAgo: 6, customerIndex: 1, items: [{ productIndex: 3, qty: 10 }] },
      { daysAgo: 3, customerIndex: 3, items: [{ productIndex: 4, qty: 4 }, { productIndex: 6, qty: 3 }] },
      { daysAgo: 1, customerIndex: 2, items: [{ productIndex: 2, qty: 1 }], status: 'cancelled' },
      { daysAgo: 0, customerIndex: 0, items: [{ productIndex: 5, qty: 8 }] }
    ];

    let invoiceCounter = 1;
    for (const spec of invoiceSpecs) {
      const customer = this.customers[spec.customerIndex];
      const invoiceId = generateUUID();
      const items = spec.items.map(({ productIndex, qty }) => {
        const product = this.products[productIndex];
        return new InvoiceItem({
          id: generateUUID(),
          invoiceId,
          productId: product.id,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          unitSnapshot: product.unit,
          unitPriceSnapshot: product.sellingPrice,
          quantity: StockQuantity.fromDecimal(qty),
          discountAmount: Money.zero(),
          lineTotal: Money.fromToman(product.sellingPrice.value * qty),
          createdAt: stampAt(spec.daysAgo)
        });
      });

      const subtotal = items.reduce((sum, it) => sum + it.lineTotal.value, 0);
      const isDraft = spec.customerIndex === 1;
      const isCancelled = spec.status === 'cancelled';
      const status: InvoiceStatus = isDraft ? 'draft' : isCancelled ? 'cancelled' : 'issued';
      const paid = status === 'issued'
        ? (spec.customerIndex === 0 ? Math.floor(subtotal * 0.6) : subtotal)
        : 0;

      const invoice = new Invoice({
        id: invoiceId,
        invoiceNumber: `INV-${1001 + invoiceCounter++ - 1}`,
        customerId: customer.id,
        invoiceDate: dayOffset(-spec.daysAgo),
        status,
        subtotal: Money.fromToman(subtotal),
        itemDiscountTotal: Money.zero(),
        invoiceDiscount: Money.zero(),
        finalAmount: Money.fromToman(subtotal),
        paidAmount: Money.fromToman(paid),
        outstandingDebt: Money.fromSignedToman(subtotal - paid),
        notes: null,
        items,
        issuedAt: status === 'issued' ? stampAt(spec.daysAgo) : null,
        cancelledAt: isCancelled ? stampAt(spec.daysAgo) : null,
        cancellationReason: isCancelled ? 'انصراف مشتری از خرید' : null,
        createdAt: stampAt(spec.daysAgo),
        updatedAt: stampAt(spec.daysAgo)
      });
      this.invoices.push(invoice);

      if (paid > 0) {
        this.payments.push(new Payment({
          id: generateUUID(),
          invoiceId: invoice.id,
          customerId: customer.id,
          amount: Money.fromToman(paid),
          paymentMethod: 'cash',
          paymentDate: invoice.invoiceDate,
          referenceNumber: null,
          notes: null,
          isVoided: false,
          voidedAt: null,
          voidReason: null,
          createdAt: stampAt(spec.daysAgo)
        }));
      }
    }

    // Opening cash balance at ledger start
    this.appendCash('opening_balance', 8_500_000, 'موجودی صندوق اولیه', null, null, dayOffset(-14));

    // Cash entries for invoice payments (chronological seed order preserved)
    for (const p of this.payments) {
      const inv = this.invoices.find((i) => i.id === p.invoiceId);
      this.appendCash('invoice_payment', p.amount.value, `وصول فاکتور ${inv?.invoiceNumber ?? '-'}`, 'invoice', inv?.id ?? null, p.paymentDate);
    }

    // Expenses + other incomes for finance page
    const expenseSpecs: Array<{ title: string; amount: number; daysAgo: number; method: ExpensePaymentMethod }> = [
      { title: 'اجاره مغازه', amount: 4_500_000, daysAgo: 8, method: 'bank_transfer' },
      { title: 'ترانزیت کالا', amount: 780_000, daysAgo: 5, method: 'cash' },
      { title: 'حقوق پرسنل', amount: 9_200_000, daysAgo: 2, method: 'bank_transfer' }
    ];
    for (const e of expenseSpecs) {
      const expense = new Expense({
        id: generateUUID(),
        categoryId: null,
        title: e.title,
        amount: Money.fromToman(e.amount),
        expenseDate: dayOffset(-e.daysAgo),
        description: null,
        paymentMethod: e.method,
        createdAt: stampAt(e.daysAgo),
        updatedAt: stampAt(e.daysAgo)
      });
      this.expenses.push(expense);
      this.appendCash('expense', -e.amount, e.title, 'expense', expense.id, expense.expenseDate);
    }

    const incomeSpecs = [
      { title: 'فروش خرد انبار', amount: 350_000, daysAgo: 4 },
      { title: 'بازگشت وجه فروش بدون فاکتور', amount: 150_000, daysAgo: 9 }
    ];
    for (const i of incomeSpecs) {
      const income = new OtherIncome({
        id: generateUUID(),
        title: i.title,
        amount: Money.fromToman(i.amount),
        incomeDate: dayOffset(-i.daysAgo),
        description: null,
        paymentMethod: 'cash',
        createdAt: stampAt(i.daysAgo),
        updatedAt: stampAt(i.daysAgo)
      });
      this.otherIncomes.push(income);
      this.appendCash('other_income', i.amount, i.title, 'other_income', income.id, income.incomeDate);
    }

    // Leads
    const leadSpecs: Array<{ name: string; mobile: string; status: LeadStatus; desc: string }> = [
      { name: 'محمود آل‌مراد', mobile: '09351115555', status: 'new', desc: 'درخواست ۵۰ جعبه شربت برای عروسی' },
      { name: 'نگار شریفی', mobile: '09362222222', status: 'interested', desc: 'درخواست لیست قیمت عمده نوشیدنی' },
      { name: 'امیر قاسمی', mobile: '09373333333', status: 'following_up', desc: 'خریدار تجهیزات اداری برای شرکت جدید' },
      { name: 'بهنام تهرانی', mobile: '09384444444', status: 'rejected', desc: 'قیمت مناسب نبود' }
    ];
    this.leads = leadSpecs.map((l, i) => new Lead({
      id: `lead-${i + 1}`,
      name: l.name,
      mobile: l.mobile,
      status: l.status,
      description: l.desc,
      createdAt: stampAt(10 - i),
      updatedAt: stampAt(10 - i)
    }));

    // Tasks
    const taskSpecs: Array<{ title: string; dueOffset: number; priority: TaskPriority; status: 'pending' | 'in_progress' | 'completed' }> = [
      { title: 'پیگیری مانده بدهی علی محمدی', dueOffset: 0, priority: 'urgent', status: 'pending' },
      { title: 'سفارش مجدد قهوه گلد', dueOffset: 0, priority: 'normal', status: 'pending' },
      { title: 'پاسخ به استعلام سرنخ نگار شریفی', dueOffset: 1, priority: 'normal', status: 'in_progress' },
      { title: 'چیدمان انبار و شمارش موجودی', dueOffset: -2, priority: 'urgent', status: 'pending' },
      { title: 'تماس با سرنخ امیر قاسمی', dueOffset: 0, priority: 'normal', status: 'completed' }
    ];
    this.tasks = taskSpecs.map((t, i) => new Task({
      id: `task-${i + 1}`,
      title: t.title,
      dueDate: dayOffset(t.dueOffset),
      priority: t.priority,
      status: t.status,
      relatedType: null,
      relatedId: null,
      completedAt: t.status === 'completed' ? stampAt(1) : null,
      createdAt: stampAt(6 - i),
      updatedAt: stampAt(6 - i)
    }));

    // App settings defaults (mirrors old SQLite seeds)
    this.settings = new Map<string, string>([
      ['notifications_enabled', 'false'],
      ['quiet_hours_start', '22'],
      ['quiet_hours_end', '7'],
      ['font_size', '15']
    ]);
  }
}
