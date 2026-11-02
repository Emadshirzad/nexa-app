export interface DashboardRecentInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number; // Integer Toman
  status: string;
  createdAt: string;
}

export interface DashboardTodayTask {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  isCompleted: boolean;
}

export interface DashboardMetrics {
  todaySales: number;           // Integer Toman
  todaySalesCount: number;
  todayReceipts: number;        // Integer Toman
  totalOutstandingDebt: number; // Integer Toman
  pendingTasksTodayCount: number;
  cashBalance: number;          // Signed integer Toman
  lowStockCount: number;
  recentInvoices: DashboardRecentInvoice[];
  todayTasks: DashboardTodayTask[];
}

export interface MonthlySalesTrend {
  monthKey: string;      // YYYY-MM
  jalaliLabel: string;   // e.g. "آبان ۱۴۰۵"
  invoiceCount: number;
  totalSales: number;    // Integer Toman
  totalCollected: number;// Integer Toman
}

export interface TopSellingProductReport {
  productId: string;
  productName: string;
  unit: string;
  totalQuantityScaled: number; // scaled by 1000
  totalRevenue: number;        // Integer Toman
}

export interface DebtorReportItem {
  customerId: string;
  fullName: string;
  mobile: string;
  totalDebt: number; // Integer Toman
  lastInvoiceDate?: string;
}

export interface LowStockReportItem {
  productId: string;
  productName: string;
  sku: string;
  currentStockScaled: number; // scaled by 1000
  minThresholdScaled: number; // scaled by 1000
  unit: string;
  deficitScaled: number;      // scaled by 1000
}

export interface GlobalSearchResult {
  id: string;
  type: 'customer' | 'product' | 'invoice' | 'lead' | 'task';
  title: string;
  subtitle: string;
  route: string;
  badge: string;
}

export interface IReportingRepository {
  getDashboardMetrics(todayIso?: string): Promise<DashboardMetrics>;
  getMonthlySalesTrends(limitMonths?: number): Promise<MonthlySalesTrend[]>;
  getTopSellingProducts(limit?: number): Promise<TopSellingProductReport[]>;
  getDebtorsLedger(): Promise<DebtorReportItem[]>;
  getLowStockReport(): Promise<LowStockReportItem[]>;
  globalSearch(query: string, limitPerCategory?: number): Promise<GlobalSearchResult[]>;
}
