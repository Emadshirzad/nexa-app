import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { CreateProductUseCase } from '@/application/use-cases/products/CreateProductUseCase';
import { Customer } from '@/domain/entities/Customer';
import { generateUUID } from '@/shared/utils/id';

export class CsvService {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly productRepo: IProductRepository,
    private readonly createProductUseCase: CreateProductUseCase
  ) {}

  /**
   * Parses CSV string into an array of string rows and columns (RFC 4180 compliant)
   */
  public static parseCsv(text: string): string[][] {
    const cleanText = text.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM
    if (!cleanText) return [];

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (insideQuotes) {
        if (char === '"' && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else if (char === '"') {
          insideQuotes = false;
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          insideQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if (char === '\n' || char === '\r') {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          currentRow.push(currentCell.trim());
          if (currentRow.some((c) => c.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  private static escapeCell(cell: string | number | null | undefined): string {
    const val = cell == null ? '' : String(cell);
    if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  /**
   * Export all active customers to CSV with UTF-8 BOM
   */
  public async exportCustomers(): Promise<string> {
    const customers = await this.customerRepo.listAll(false);
    const headers = ['نام و نام خانوادگی', 'شماره موبایل', 'تلفن ثابت', 'آدرس', 'یادداشت'];
    const lines: string[] = [headers.join(',')];

    for (const c of customers) {
      const row = [
        CsvService.escapeCell(c.name),
        CsvService.escapeCell(c.mobile),
        CsvService.escapeCell(c.phone ?? ''),
        CsvService.escapeCell(c.address ?? ''),
        CsvService.escapeCell(c.notes ?? '')
      ];
      lines.push(row.join(','));
    }

    return '\uFEFF' + lines.join('\r\n');
  }

  /**
   * Import customers from CSV string
   */
  public async importCustomers(csvText: string): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const rows = CsvService.parseCsv(csvText);
    if (rows.length < 2) {
      return { imported: 0, skipped: 0, errors: ['فایل CSV داده‌ای ندارد یا بدون سربرگ است.'] };
    }

    // Skip header row
    const dataRows = rows.slice(1);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;
      const name = row[0]?.trim();
      const mobile = row[1]?.trim();
      const phone = row[2]?.trim() || undefined;
      const address = row[3]?.trim() || undefined;
      const notes = row[4]?.trim() || undefined;

      if (!name) {
        errors.push(`ردیف ${rowNum}: نام مشتری الزامی است.`);
        continue;
      }

      if (!mobile || !/^09\d{9}$/.test(mobile)) {
        errors.push(`ردیف ${rowNum}: شماره موبایل نامعتبر است (${mobile || 'خالی'}).`);
        continue;
      }

      // Check duplicate
      const existing = await this.customerRepo.findByMobile(mobile);
      if (existing) {
        skipped++;
        continue;
      }

      const now = new Date().toISOString();
      const customer = new Customer({
        id: generateUUID(),
        name,
        mobile,
        phone,
        address,
        notes,
        isArchived: false,
        createdAt: now,
        updatedAt: now
      });

      await this.customerRepo.save(customer);
      imported++;
    }

    return { imported, skipped, errors };
  }

  /**
   * Export all active products to CSV with UTF-8 BOM
   */
  public async exportProducts(): Promise<string> {
    const products = await this.productRepo.listAll(false);
    const headers = ['نام کالا', 'کد کالا', 'واحد شمارش', 'قیمت فروش (تومان)', 'موجودی فعلی', 'حداقل موجودی'];
    const lines: string[] = [headers.join(',')];

    for (const p of products) {
      const row = [
        CsvService.escapeCell(p.name),
        CsvService.escapeCell(p.sku),
        CsvService.escapeCell(p.unit),
        CsvService.escapeCell(p.sellingPrice.value),
        CsvService.escapeCell(p.stockQuantity.toDecimal()),
        CsvService.escapeCell(p.minStockThreshold.toDecimal())
      ];
      lines.push(row.join(','));
    }

    return '\uFEFF' + lines.join('\r\n');
  }

  /**
   * Import products from CSV string
   */
  public async importProducts(csvText: string): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const rows = CsvService.parseCsv(csvText);
    if (rows.length < 2) {
      return { imported: 0, skipped: 0, errors: ['فایل CSV داده‌ای ندارد یا بدون سربرگ است.'] };
    }

    const dataRows = rows.slice(1);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    const unitMap: Record<string, 'piece' | 'package' | 'kilogram' | 'gram' | 'meter' | 'liter' | 'box' | 'carton'> = {
      'عدد': 'piece',
      'piece': 'piece',
      'بسته': 'package',
      'package': 'package',
      'کیلوگرم': 'kilogram',
      'کیلو': 'kilogram',
      'kilogram': 'kilogram',
      'گرم': 'gram',
      'gram': 'gram',
      'متر': 'meter',
      'meter': 'meter',
      'لیتر': 'liter',
      'liter': 'liter',
      'جعبه': 'box',
      'box': 'box',
      'کارتن': 'carton',
      'carton': 'carton'
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;
      const name = row[0]?.trim();
      const sku = row[1]?.trim() || undefined;
      const rawUnit = row[2]?.trim() || 'piece';
      const sellingPrice = parseInt(row[3]?.replace(/[^\d]/g, '') || '0', 10);
      const initialStock = parseFloat(row[4] || '0');
      const minStockThreshold = parseFloat(row[5] || '0');

      if (!name) {
        errors.push(`ردیف ${rowNum}: نام کالا الزامی است.`);
        continue;
      }

      if (sku) {
        const existing = await this.productRepo.findBySku(sku);
        if (existing) {
          skipped++;
          continue;
        }
      }

      const unit = unitMap[rawUnit] || 'piece';

      const res = await this.createProductUseCase.execute({
        name,
        sku,
        unit,
        sellingPrice,
        initialStock: isNaN(initialStock) ? 0 : Math.max(0, initialStock),
        minStockThreshold: isNaN(minStockThreshold) ? 0 : Math.max(0, minStockThreshold)
      });

      if (res.success) {
        imported++;
      } else {
        errors.push(`ردیف ${rowNum}: ${res.error}`);
      }
    }

    return { imported, skipped, errors };
  }
}
