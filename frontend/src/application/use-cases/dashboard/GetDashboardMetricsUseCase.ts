import type { IReportingRepository, DashboardMetrics } from '@/domain/repositories/IReportingRepository';
import { type Result, ok, fail } from '@/shared/types/result';

export class GetDashboardMetricsUseCase {
  constructor(private readonly reportingRepo: IReportingRepository) {}

  async execute(todayIso?: string): Promise<Result<DashboardMetrics>> {
    try {
      const metrics = await this.reportingRepo.getDashboardMetrics(todayIso);
      return ok(metrics);
    } catch (error) {
      return fail(error instanceof Error ? error : new Error('خطا در بارگذاری اطلاعات داشبورد'));
    }
  }
}
