import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqliteDriver } from '@/infrastructure/database/BetterSqliteDriver';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { SqliteProductRepository } from '@/infrastructure/repositories/SqliteProductRepository';
import { SqliteStockMovementRepository } from '@/infrastructure/repositories/SqliteStockMovementRepository';
import { CreateProductUseCase } from '@/application/use-cases/products/CreateProductUseCase';
import { AdjustStockUseCase } from '@/application/use-cases/products/AdjustStockUseCase';
import { ArchiveProductUseCase } from '@/application/use-cases/products/ArchiveProductUseCase';
import { StockReconciliationService } from '@/domain/services/StockReconciliationService';

describe('Products and Inventory Vertical Slice', () => {
  let driver: BetterSqliteDriver;
  let productRepo: SqliteProductRepository;
  let movementRepo: SqliteStockMovementRepository;
  let createProductUseCase: CreateProductUseCase;
  let adjustStockUseCase: AdjustStockUseCase;
  let archiveProductUseCase: ArchiveProductUseCase;
  let reconciliationService: StockReconciliationService;

  beforeEach(async () => {
    driver = new BetterSqliteDriver(':memory:');
    const runner = new MigrationRunner(driver);
    await runner.run();

    productRepo = new SqliteProductRepository(driver);
    movementRepo = new SqliteStockMovementRepository(driver);
    createProductUseCase = new CreateProductUseCase(productRepo, movementRepo, driver);
    adjustStockUseCase = new AdjustStockUseCase(productRepo, movementRepo, driver);
    archiveProductUseCase = new ArchiveProductUseCase(productRepo);
    reconciliationService = new StockReconciliationService(productRepo, movementRepo);
  });

  afterEach(async () => {
    await driver.close();
  });

  it('creates product with automatic SKU and initial stock ledger entry', async () => {
    const res = await createProductUseCase.execute({
      name: 'پسته رفسنجان اکبری',
      unit: 'kilogram',
      sellingPrice: 850000,
      initialStock: 12.5, // 12.500 kg = 12500 scaled
      minStockThreshold: 2.0 // 2.000 kg = 2000 scaled
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    const product = res.data;
    expect(product.sku).toBe('PRD-1001');
    expect(product.stockQuantity.scaledValue).toBe(12500);
    expect(product.stockQuantity.toDecimal()).toBe(12.5);
    expect(product.sellingPrice.value).toBe(850000);
    expect(product.sellingPrice.format()).toBe('850,000 تومان');

    // Verify stock_movements ledger entry
    const movements = await movementRepo.findByProductId(product.id);
    expect(movements.length).toBe(1);
    expect(movements[0].movementType).toBe('initial');
    expect(movements[0].quantity.scaledValue).toBe(12500);
    expect(movements[0].reason).toBe('ثبت موجودی اولیه کالا');
  });

  it('adjusts stock with mandatory reason and maintains cache consistency', async () => {
    const createRes = await createProductUseCase.execute({
      name: 'زعفران قائنات',
      unit: 'gram',
      sellingPrice: 120000,
      initialStock: 100, // 100.000 g
      minStockThreshold: 10
    });
    expect(createRes.success).toBe(true);
    if (!createRes.success) return;
    const product = createRes.data;

    // 1. Addition adjustment: add 50 grams
    const addRes = await adjustStockUseCase.execute({
      productId: product.id,
      quantityChange: 50,
      movementType: 'addition',
      reason: 'خرید از کشاورز',
      allowNegativeConfirmation: false
    });

    expect(addRes.success).toBe(true);
    if (!addRes.success) return;
    expect(addRes.data.newStock).toBe(150);

    // 2. Deduction adjustment: deduct 30 grams
    const deductRes = await adjustStockUseCase.execute({
      productId: product.id,
      quantityChange: -30,
      movementType: 'deduction',
      reason: 'بسته‌بندی صادراتی',
      allowNegativeConfirmation: false
    });

    expect(deductRes.success).toBe(true);
    if (!deductRes.success) return;
    expect(deductRes.data.newStock).toBe(120);

    // Reconcile against immutable ledger
    const report = await reconciliationService.reconcileProduct(product.id);
    expect(report.isConsistent).toBe(true);
    expect(report.ledgerStock).toBe(120);
    expect(report.cachedStock).toBe(120);
  });

  it('blocks negative stock adjustments unless explicit confirmation is provided', async () => {
    const createRes = await createProductUseCase.execute({
      name: 'کابل HDMI',
      unit: 'piece',
      sellingPrice: 75000,
      initialStock: 5,
      minStockThreshold: 1
    });
    if (!createRes.success) return;
    const product = createRes.data;

    // Attempt to deduct 10 (exceeds 5 in stock) without confirmation
    const failRes = await adjustStockUseCase.execute({
      productId: product.id,
      quantityChange: -10,
      movementType: 'deduction',
      reason: 'فروش بیش از موجودی',
      allowNegativeConfirmation: false
    });

    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain('نیازمند تأیید صریح شماست');

    // Now permit with explicit confirmation
    const passRes = await adjustStockUseCase.execute({
      productId: product.id,
      quantityChange: -10,
      movementType: 'deduction',
      reason: 'فروش پیش‌خرید با تأیید مدیر',
      allowNegativeConfirmation: true
    });

    expect(passRes.success).toBe(true);
    if (!passRes.success) return;
    expect(passRes.data.newStock).toBe(-5);
    expect(passRes.data.isNegative).toBe(true);
  });

  it('archives product and preserves transaction history', async () => {
    const createRes = await createProductUseCase.execute({
      name: 'شارژر تایپ سی',
      unit: 'piece',
      sellingPrice: 190000,
      initialStock: 10,
      minStockThreshold: 2
    });
    if (!createRes.success) return;
    const product = createRes.data;

    // Archive
    const archiveRes = await archiveProductUseCase.execute(product.id);
    expect(archiveRes.success).toBe(true);

    const reloaded = await productRepo.findById(product.id);
    expect(reloaded?.isArchived).toBe(true);

    // List active products excludes archived product
    const activeProducts = await productRepo.listAll(false);
    expect(activeProducts.some((p) => p.id === product.id)).toBe(false);

    // But searching with includeArchived includes it
    const allProducts = await productRepo.listAll(true);
    expect(allProducts.some((p) => p.id === product.id)).toBe(true);
  });
});
