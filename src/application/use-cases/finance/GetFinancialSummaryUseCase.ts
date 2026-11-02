import type {
  ICashLedgerRepository,
  FinancialSummary
} from '@/domain/repositories/ICashLedgerRepository';
import type { ISODateString } from '@/shared/types/common';

export class GetFinancialSummaryUseCase {
  private readonly ledgerRepo: ICashLedgerRepository;

  constructor(ledgerRepo: ICashLedgerRepository) {
    this.ledgerRepo = ledgerRepo;
  }

  public async execute(
    startDate?: ISODateString,
    endDate?: ISODateString
  ): Promise<FinancialSummary> {
    return this.ledgerRepo.getFinancialSummary(startDate, endDate);
  }
}
