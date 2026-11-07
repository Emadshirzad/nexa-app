import type {
  DashboardMetrics,
  DebtorReportItem,
  GlobalSearchResult,
  IReportingRepository,
  LowStockReportItem,
  MonthlySalesTrend,
  TopSellingProductReport
} from '@/domain/repositories/IReportingRepository';
import { ApiClient } from './ApiClient';
import jalaali from 'jalaali-js';

const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export class ApiReportingRepository implements IReportingRepository {
  private api = ApiClient.getInstance();

  public async getDashboardMetrics(todayIso?: string): Promise<DashboardMetrics> {
    const today = todayIso || new Date().toISOString().slice(0, 10);
    const res = await this.api.get<DashboardMetrics>('/reports/dashboard', { today });
    return {
      todaySales: Number(res.todaySales) || 0,
      todaySalesCount: Number(res.todaySalesCount) || 0,
      todayReceipts: Number(res.todayReceipts) || 0,
      totalOutstandingDebt: Number(res.totalOutstandingDebt) || 0,
      pendingTasksTodayCount: Number(res.pendingTasksTodayCount) || 0,
      cashBalance: Number(res.cashBalance) || 0,
      lowStockCount: Number(res.lowStockCount) || 0,
      recentInvoices: res.recentInvoices || [],
      todayTasks: res.todayTasks || []
    };
  }

  public async getMonthlySalesTrends(limitMonths: number = 6): Promise<MonthlySalesTrend[]> {
    const list = await this.api.get<any[]>('/reports/monthly-trends', { limit: limitMonths });
    return (list || []).map((item) => {
      let jalaliLabel = item.jalaliLabel;
      if (item.monthKey && (!jalaliLabel || jalaliLabel === item.monthKey)) {
        const parts = item.monthKey.split('-').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const j = jalaali.toJalaali(parts[0], parts[1], 15);
          jalaliLabel = `${PERSIAN_MONTH_NAMES[j.jm - 1]} ${j.jy}`;
        }
      }
      return {
        monthKey: item.monthKey,
        jalaliLabel: jalaliLabel || item.monthKey,
        invoiceCount: Number(item.invoiceCount) || 0,
        totalSales: Number(item.totalSales) || 0,
        totalCollected: Number(item.totalCollected) || 0
      };
    });
  }

  public async getTopSellingProducts(limit: number = 5): Promise<TopSellingProductReport[]> {
    const list = await this.api.get<any[]>('/reports/top-products', { limit });
    return (list || []).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      totalQuantityScaled: Number(item.totalQuantityScaled) || 0,
      totalRevenue: Number(item.totalRevenue) || 0
    }));
  }

  public async getDebtorsLedger(): Promise<DebtorReportItem[]> {
    const list = await this.api.get<any[]>('/reports/debtors');
    return (list || []).map((item) => ({
      customerId: item.customerId,
      fullName: item.fullName,
      mobile: item.mobile,
      totalDebt: Number(item.totalDebt) || 0,
      lastInvoiceDate: item.lastInvoiceDate
    }));
  }

  public async getLowStockReport(): Promise<LowStockReportItem[]> {
    const list = await this.api.get<any[]>('/reports/low-stock');
    return (list || []).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      currentStockScaled: Number(item.currentStockScaled) || 0,
      minThresholdScaled: Number(item.minThresholdScaled) || 0,
      unit: item.unit,
      deficitScaled: Number(item.deficitScaled) || 0
    }));
  }

  public async globalSearch(query: string, limitPerCategory: number = 5): Promise<GlobalSearchResult[]> {
    if (!query.trim()) return [];
    const list = await this.api.get<any[]>('/reports/global-search', {
      q: query.trim(),
      limit: limitPerCategory
    });
    return (list || []).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      route: item.route,
      badge: item.badge
    }));
  }
}
