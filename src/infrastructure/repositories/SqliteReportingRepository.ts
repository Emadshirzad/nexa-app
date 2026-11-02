import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import type {
  IReportingRepository,
  DashboardMetrics,
  MonthlySalesTrend,
  TopSellingProductReport,
  DebtorReportItem,
  LowStockReportItem,
  GlobalSearchResult
} from '@/domain/repositories/IReportingRepository';
import { toJalaliString, formatJalaliHuman } from '@/shared/utils/jalali';

export class SqliteReportingRepository implements IReportingRepository {
  constructor(private readonly driver: IDatabaseDriver) {}

  async getDashboardMetrics(todayIso?: string): Promise<DashboardMetrics> {
    const today = todayIso ?? new Date().toISOString().slice(0, 10);

    // 1. Today's sales (final_amount sum of issued invoices today)
    const salesRes = await this.driver.query<{ total: number; count: number }>(
      `SELECT COALESCE(SUM(final_amount), 0) as total, COUNT(id) as count
       FROM invoices
       WHERE status != 'cancelled' AND (substr(created_at, 1, 10) = ? OR invoice_date = ?)`,
      [today, today]
    );
    const todaySales = salesRes[0]?.total ?? 0;
    const todaySalesCount = salesRes[0]?.count ?? 0;

    // 2. Today's receipts (payments created or paid today)
    const receiptsRes = await this.driver.query<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE is_voided = 0 AND (substr(payment_date, 1, 10) = ? OR substr(created_at, 1, 10) = ?)`,
      [today, today]
    );
    const todayReceipts = receiptsRes[0]?.total ?? 0;

    // 3. Total outstanding debt
    const debtRes = await this.driver.query<{ total: number }>(
      `SELECT COALESCE(SUM(outstanding_debt), 0) as total
       FROM invoices
       WHERE status != 'cancelled' AND outstanding_debt > 0`
    );
    const totalOutstandingDebt = debtRes[0]?.total ?? 0;

    // 4. Pending tasks due today or overdue
    const tasksCountRes = await this.driver.query<{ count: number }>(
      `SELECT COUNT(id) as count
       FROM tasks
       WHERE status != 'completed' AND substr(due_date, 1, 10) <= ?`,
      [today]
    );
    const pendingTasksTodayCount = tasksCountRes[0]?.count ?? 0;

    // 5. Cash Balance (from cash_transactions)
    const cashRes = await this.driver.query<{ balance_after: number }>(
      `SELECT balance_after
       FROM cash_transactions
       ORDER BY created_at DESC, rowid DESC
       LIMIT 1`
    );
    const cashBalance = cashRes[0]?.balance_after ?? 0;

    // 6. Low stock products count
    const lowStockRes = await this.driver.query<{ count: number }>(
      `SELECT COUNT(id) as count
       FROM products
       WHERE is_archived = 0 AND stock_quantity <= min_stock_threshold`
    );
    const lowStockCount = lowStockRes[0]?.count ?? 0;

    // 7. Recent 5 invoices
    const recentInvoicesRaw = await this.driver.query<{
      id: string;
      invoice_number: string;
      customer_name: string | null;
      final_amount: number;
      status: string;
      created_at: string;
    }>(
      `SELECT 
         inv.id,
         inv.invoice_number,
         COALESCE(c.name, 'مشتری متفرقه') as customer_name,
         inv.final_amount,
         inv.status,
         inv.created_at
       FROM invoices inv
       LEFT JOIN customers c ON inv.customer_id = c.id
       ORDER BY inv.created_at DESC
       LIMIT 5`
    );
    const recentInvoices = recentInvoicesRaw.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerName: row.customer_name ?? 'مشتری متفرقه',
      totalAmount: row.final_amount,
      status: row.status,
      createdAt: row.created_at
    }));

    // 8. Today's tasks (due today or overdue)
    const todayTasksRaw = await this.driver.query<{
      id: string;
      title: string;
      priority: string;
      due_date: string;
      status: string;
    }>(
      `SELECT id, title, priority, due_date, status
       FROM tasks
       WHERE status != 'completed' AND substr(due_date, 1, 10) <= ?
       ORDER BY CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END, due_date ASC
       LIMIT 5`,
      [today]
    );
    const todayTasks = todayTasksRaw.map((row) => ({
      id: row.id,
      title: row.title,
      priority: row.priority,
      dueDate: row.due_date,
      isCompleted: row.status === 'completed'
    }));

    return {
      todaySales,
      todaySalesCount,
      todayReceipts,
      totalOutstandingDebt,
      pendingTasksTodayCount,
      cashBalance,
      lowStockCount,
      recentInvoices,
      todayTasks
    };
  }

  async getMonthlySalesTrends(limitMonths = 6): Promise<MonthlySalesTrend[]> {
    const rows = await this.driver.query<{
      month_key: string;
      invoice_count: number;
      total_sales: number;
      total_collected: number;
    }>(
      `SELECT 
         substr(created_at, 1, 7) as month_key,
         COUNT(id) as invoice_count,
         COALESCE(SUM(final_amount), 0) as total_sales,
         COALESCE(SUM(paid_amount), 0) as total_collected
       FROM invoices
       WHERE status != 'cancelled'
       GROUP BY substr(created_at, 1, 7)
       ORDER BY month_key DESC
       LIMIT ?`,
      [limitMonths]
    );

    return rows.map((r) => {
      let jalaliLabel = r.month_key;
      try {
        const jStr = toJalaliString(`${r.month_key}-01`);
        const human = formatJalaliHuman(jStr);
        const parts = human.split(' ');
        if (parts.length >= 3) {
          jalaliLabel = `${parts[1]} ${parts[2]}`;
        }
      } catch {
        // Fallback to month_key
      }

      return {
        monthKey: r.month_key,
        jalaliLabel,
        invoiceCount: r.invoice_count,
        totalSales: r.total_sales,
        totalCollected: r.total_collected
      };
    });
  }

  async getTopSellingProducts(limit = 5): Promise<TopSellingProductReport[]> {
    const rows = await this.driver.query<{
      product_id: string;
      product_name: string;
      unit: string;
      total_quantity: number;
      total_revenue: number;
    }>(
      `SELECT 
         COALESCE(p.id, ii.product_id, '') as product_id,
         COALESCE(p.name, ii.product_name_snapshot) as product_name,
         COALESCE(p.unit, ii.unit_snapshot) as unit,
         COALESCE(SUM(ii.quantity), 0) as total_quantity,
         COALESCE(SUM(ii.line_total), 0) as total_revenue
       FROM invoice_items ii
       JOIN invoices inv ON ii.invoice_id = inv.id
       LEFT JOIN products p ON ii.product_id = p.id
       WHERE inv.status != 'cancelled'
       GROUP BY COALESCE(p.id, ii.product_id, ''), COALESCE(p.name, ii.product_name_snapshot), COALESCE(p.unit, ii.unit_snapshot)
       ORDER BY total_revenue DESC
       LIMIT ?`,
      [limit]
    );

    return rows.map((r) => ({
      productId: r.product_id,
      productName: r.product_name,
      unit: r.unit,
      totalQuantityScaled: r.total_quantity,
      totalRevenue: r.total_revenue
    }));
  }

  async getDebtorsLedger(): Promise<DebtorReportItem[]> {
    const rows = await this.driver.query<{
      customer_id: string;
      full_name: string;
      mobile: string;
      total_debt: number;
      last_invoice_date: string | null;
    }>(
      `SELECT 
         c.id as customer_id,
         c.name as full_name,
         c.mobile,
         COALESCE(SUM(inv.outstanding_debt), 0) as total_debt,
         MAX(inv.created_at) as last_invoice_date
       FROM customers c
       JOIN invoices inv ON c.id = inv.customer_id
       WHERE inv.status != 'cancelled' AND inv.outstanding_debt > 0
       GROUP BY c.id, c.name, c.mobile
       HAVING total_debt > 0
       ORDER BY total_debt DESC`
    );

    return rows.map((r) => ({
      customerId: r.customer_id,
      fullName: r.full_name,
      mobile: r.mobile,
      totalDebt: r.total_debt,
      lastInvoiceDate: r.last_invoice_date ?? undefined
    }));
  }

  async getLowStockReport(): Promise<LowStockReportItem[]> {
    const rows = await this.driver.query<{
      product_id: string;
      product_name: string;
      sku: string;
      current_stock: number;
      min_threshold: number;
      unit: string;
      deficit: number;
    }>(
      `SELECT 
         id as product_id,
         name as product_name,
         sku,
         stock_quantity as current_stock,
         min_stock_threshold as min_threshold,
         unit,
         (min_stock_threshold - stock_quantity) as deficit
       FROM products
       WHERE is_archived = 0 AND stock_quantity <= min_stock_threshold
       ORDER BY deficit DESC`
    );

    return rows.map((r) => ({
      productId: r.product_id,
      productName: r.product_name,
      sku: r.sku,
      currentStockScaled: r.current_stock,
      minThresholdScaled: r.min_threshold,
      unit: r.unit,
      deficitScaled: r.deficit
    }));
  }

  async globalSearch(query: string, limitPerCategory = 4): Promise<GlobalSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const pattern = `%${trimmed}%`;
    const results: GlobalSearchResult[] = [];

    // 1. Search Customers
    const customers = await this.driver.query<{
      id: string;
      name: string;
      mobile: string;
      address: string | null;
    }>(
      `SELECT id, name, mobile, address
       FROM customers
       WHERE is_archived = 0 AND (name LIKE ? OR mobile LIKE ?)
       LIMIT ?`,
      [pattern, pattern, limitPerCategory]
    );
    for (const c of customers) {
      results.push({
        id: c.id,
        type: 'customer',
        title: c.name,
        subtitle: `${c.mobile}${c.address ? ' - ' + c.address : ''}`,
        route: `/customers/${c.id}`,
        badge: 'مشتری'
      });
    }

    // 2. Search Products
    const products = await this.driver.query<{
      id: string;
      name: string;
      sku: string;
      selling_price: number;
    }>(
      `SELECT id, name, sku, selling_price
       FROM products
       WHERE is_archived = 0 AND (name LIKE ? OR sku LIKE ?)
       LIMIT ?`,
      [pattern, pattern, limitPerCategory]
    );
    for (const p of products) {
      results.push({
        id: p.id,
        type: 'product',
        title: p.name,
        subtitle: `کد: ${p.sku} | قیمت: ${p.selling_price.toLocaleString('en-US')} تومان`,
        route: `/products/${p.id}`,
        badge: 'محصول'
      });
    }

    // 3. Search Invoices
    const invoices = await this.driver.query<{
      id: string;
      invoice_number: string;
      final_amount: number;
      customer_name: string | null;
    }>(
      `SELECT inv.id, inv.invoice_number, inv.final_amount, c.name as customer_name
       FROM invoices inv
       LEFT JOIN customers c ON inv.customer_id = c.id
       WHERE inv.invoice_number LIKE ? OR c.name LIKE ?
       LIMIT ?`,
      [pattern, pattern, limitPerCategory]
    );
    for (const inv of invoices) {
      results.push({
        id: inv.id,
        type: 'invoice',
        title: `فاکتور شماره ${inv.invoice_number}`,
        subtitle: `${inv.customer_name ?? 'مشتری متفرقه'} | ${inv.final_amount.toLocaleString('en-US')} تومان`,
        route: `/invoices/${inv.id}`,
        badge: 'فاکتور'
      });
    }

    // 4. Search Leads
    const leads = await this.driver.query<{
      id: string;
      name: string;
      mobile: string;
      status: string;
    }>(
      `SELECT id, name, mobile, status
       FROM leads
       WHERE name LIKE ? OR mobile LIKE ?
       LIMIT ?`,
      [pattern, pattern, limitPerCategory]
    );
    for (const l of leads) {
      results.push({
        id: l.id,
        type: 'lead',
        title: l.name,
        subtitle: `موبایل: ${l.mobile}`,
        route: `/leads/${l.id}`,
        badge: 'سرنخ'
      });
    }

    // 5. Search Tasks
    const tasks = await this.driver.query<{
      id: string;
      title: string;
      due_date: string;
      priority: string;
    }>(
      `SELECT id, title, due_date, priority
       FROM tasks
       WHERE title LIKE ? OR description LIKE ?
       LIMIT ?`,
      [pattern, pattern, limitPerCategory]
    );
    for (const t of tasks) {
      results.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: `موعد: ${t.due_date} | اولویت: ${t.priority === 'urgent' ? 'فوری' : 'عادی'}`,
        route: `/tasks`,
        badge: 'وظیفه'
      });
    }

    return results;
  }
}
