import type { IReportingRepository, GlobalSearchResult } from '@/domain/repositories/IReportingRepository';
import { type Result, ok, fail } from '@/shared/types/result';

export class GlobalSearchUseCase {
  constructor(private readonly reportingRepo: IReportingRepository) {}

  async execute(query: string): Promise<Result<GlobalSearchResult[]>> {
    try {
      const results = await this.reportingRepo.globalSearch(query);
      return ok(results);
    } catch (error) {
      return fail(error instanceof Error ? error : new Error('خطا در جستجوی سراسری'));
    }
  }
}
