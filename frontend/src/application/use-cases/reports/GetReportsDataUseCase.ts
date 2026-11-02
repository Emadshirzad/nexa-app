import type {
  IReportingRepository,
  MonthlySalesTrend,
  TopSellingProductReport,
  DebtorReportItem,
  LowStockReportItem
} from '@/domain/repositories/IReportingRepository';
import { type Result, ok, fail } from '@/shared/types/result';

export interface ComprehensiveReportsData {
  salesTrends: MonthlySalesTrend[];
  topSellingProducts: TopSellingProductReport[];
  debtorsLedger: DebtorReportItem[];
  lowStockItems: LowStockReportItem[];
}

export class GetReportsDataUseCase {
  constructor(private readonly reportingRepo: IReportingRepository) {}

  async execute(): Promise<Result<ComprehensiveReportsData>> {
    try {
      const [salesTrends, topSellingProducts, debtorsLedger, lowStockItems] = await Promise.all([
        this.reportingRepo.getMonthlySalesTrends(6),
        this.reportingRepo.getTopSellingProducts(10),
        this.reportingRepo.getDebtorsLedger(),
        this.reportingRepo.getLowStockReport()
      ]);

      return ok({
        salesTrends,
        topSellingProducts,
        debtorsLedger,
        lowStockItems
      });
    } catch (error) {
      return fail(error instanceof Error ? error : new Error('خطا در تولید گزارش‌های تحلیلی'));
    }
  }
}
