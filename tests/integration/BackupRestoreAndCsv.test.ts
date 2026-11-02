import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqliteDriver } from '@/infrastructure/database/BetterSqliteDriver';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { BackupCrypto } from '@/infrastructure/security/BackupCrypto';
import { BackupService } from '@/infrastructure/backup/BackupService';
import { CsvService } from '@/infrastructure/csv/CsvService';
import { SqliteCustomerRepository } from '@/infrastructure/repositories/SqliteCustomerRepository';
import { SqliteProductRepository } from '@/infrastructure/repositories/SqliteProductRepository';
import { SqliteStockMovementRepository } from '@/infrastructure/repositories/SqliteStockMovementRepository';
import { SqliteInvoiceRepository } from '@/infrastructure/repositories/SqliteInvoiceRepository';
import { SqlitePaymentRepository } from '@/infrastructure/repositories/SqlitePaymentRepository';
import { CreateCustomerUseCase } from '@/application/use-cases/customers/CreateCustomerUseCase';
import { CreateProductUseCase } from '@/application/use-cases/products/CreateProductUseCase';
import { CreateInvoiceUseCase } from '@/application/use-cases/invoices/CreateInvoiceUseCase';
import { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { SqliteBusinessProfileRepository } from '@/infrastructure/repositories/SqliteBusinessProfileRepository';
import { generateUUID } from '@/shared/utils/id';

describe('Backup, Restore and CSV Integration', () => {
  let driver: BetterSqliteDriver;
  let backupService: BackupService;
  let csvService: CsvService;

  let customerRepo: SqliteCustomerRepository;
  let productRepo: SqliteProductRepository;
  let movementRepo: SqliteStockMovementRepository;
  let invoiceRepo: SqliteInvoiceRepository;
  let paymentRepo: SqlitePaymentRepository;
  let profileRepo: SqliteBusinessProfileRepository;

  let createCustomerUseCase: CreateCustomerUseCase;
  let createProductUseCase: CreateProductUseCase;
  let createInvoiceUseCase: CreateInvoiceUseCase;

  beforeEach(async () => {
    driver = new BetterSqliteDriver(':memory:');
    const runner = new MigrationRunner(driver);
    await runner.run();

    customerRepo = new SqliteCustomerRepository(driver);
    productRepo = new SqliteProductRepository(driver);
    movementRepo = new SqliteStockMovementRepository(driver);
    invoiceRepo = new SqliteInvoiceRepository(driver);
    paymentRepo = new SqlitePaymentRepository(driver);
    profileRepo = new SqliteBusinessProfileRepository(driver);

    createCustomerUseCase = new CreateCustomerUseCase(customerRepo);
    createProductUseCase = new CreateProductUseCase(productRepo, movementRepo, driver);
    createInvoiceUseCase = new CreateInvoiceUseCase(
      invoiceRepo,
      productRepo,
      movementRepo,
      paymentRepo,
      driver
    );

    backupService = new BackupService(driver);
    csvService = new CsvService(customerRepo, productRepo, createProductUseCase);
  });

  afterEach(async () => {
    await driver.close();
  });

  describe('BackupCrypto (AES-256-GCM + PBKDF2 100k)', () => {
    it('encrypts and decrypts valid JSON roundtrip', async () => {
      const original = JSON.stringify({ message: 'تست پشتیبان‌گیری امن', count: 42 });
      const passphrase = 'my-secure-password';

      const encrypted = await BackupCrypto.encrypt(original, passphrase);
      expect(encrypted).toContain('NEXA_BACKUP_V1');

      const decrypted = await BackupCrypto.decrypt(encrypted, passphrase);
      expect(decrypted).toBe(original);
    });

    it('rejects decryption when wrong passphrase is provided', async () => {
      const original = JSON.stringify({ secret: 'data' });
      const encrypted = await BackupCrypto.encrypt(original, 'correct-passphrase');

      await expect(BackupCrypto.decrypt(encrypted, 'wrong-passphrase')).rejects.toThrow(
        'رمز عبور وارد شده نادرست است'
      );
    });

    it('rejects tampered ciphertext with checksum error', async () => {
      const original = JSON.stringify({ secret: 'data' });
      const encrypted = await BackupCrypto.encrypt(original, 'correct-passphrase');

      const parsed = JSON.parse(encrypted);
      // Tamper ciphertext
      parsed.ciphertext = parsed.ciphertext.slice(0, -4) + 'AAAA';
      const tampered = JSON.stringify(parsed);

      await expect(BackupCrypto.decrypt(tampered, 'correct-passphrase')).rejects.toThrow(
        'خطای اعتبارسنجی Checksum'
      );
    });
  });

  describe('BackupService Full Atomic Database Restore', () => {
    it('restores all business entities, invoices, and profile accurately', async () => {
      // 1. Setup initial business data
      const now = new Date().toISOString();
      const profile = new BusinessProfile({
        id: generateUUID(),
        name: 'فروشگاه افق البرز',
        phone: '02633221100',
        address: 'کرج، میدان سپاه',
        createdAt: now,
        updatedAt: now
      });
      await profileRepo.saveProfile(profile);

      const cRes = await createCustomerUseCase.execute({
        name: 'علی محمدی',
        mobile: '09121113355'
      });
      expect(cRes.success).toBe(true);
      if (!cRes.success) return;
      const customer = cRes.data;

      const pRes = await createProductUseCase.execute({
        name: 'باتری خورشیدی 100 وات',
        sellingPrice: 3200000,
        initialStock: 15,
        minStockThreshold: 3,
        unit: 'piece'
      });
      expect(pRes.success).toBe(true);
      if (!pRes.success) return;
      const prod = pRes.data;

      await createInvoiceUseCase.execute({
        customerId: customer.id,
        invoiceDate: '2026-11-02',
        items: [
          {
            productId: prod.id,
            name: prod.name,
            sku: prod.sku,
            unit: prod.unit,
            quantity: 2,
            unitPrice: 3200000,
            discount: 200000
          }
        ],
        upfrontPayment: {
          amount: 2000000,
          paymentMethod: 'card_transfer'
        }
      });

      // 2. Create encrypted backup
      const backupString = await backupService.createBackup('safe-pass-9988');
      expect(backupString).toBeTruthy();

      // 3. Clear database to simulate device replacement or disaster
      await driver.execute('PRAGMA foreign_keys = OFF;');
      await driver.execute('DELETE FROM invoice_items;');
      await driver.execute('DELETE FROM invoices;');
      await driver.execute('DELETE FROM payments;');
      await driver.execute('DELETE FROM stock_movements;');
      await driver.execute('DELETE FROM products;');
      await driver.execute('DELETE FROM customers;');
      await driver.execute('DELETE FROM business_profile;');
      await driver.execute('PRAGMA foreign_keys = ON;');

      const customersBefore = await customerRepo.listAll();
      expect(customersBefore.length).toBe(0);

      // 4. Restore database from backup
      const restoreRes = await backupService.restoreBackup(backupString, 'safe-pass-9988');
      expect(restoreRes.success).toBe(true);
      if (!restoreRes.success) return;

      expect(restoreRes.data.restoredTables).toBeGreaterThan(0);
      expect(restoreRes.data.restoredRows).toBeGreaterThan(0);

      // 5. Verify restored entities
      const restoredProfile = await profileRepo.getProfile();
      expect(restoredProfile?.name).toBe('فروشگاه افق البرز');

      const restoredCustomers = await customerRepo.listAll();
      expect(restoredCustomers.length).toBe(1);
      expect(restoredCustomers[0].name).toBe('علی محمدی');

      const restoredProducts = await productRepo.listAll();
      expect(restoredProducts.length).toBe(1);
      expect(restoredProducts[0].name).toBe('باتری خورشیدی 100 وات');

      const restoredInvoices = await invoiceRepo.listAll();
      expect(restoredInvoices.length).toBe(1);
      expect(restoredInvoices[0].finalAmount.value).toBe(6200000);
      expect(restoredInvoices[0].paidAmount.value).toBe(2000000);
      expect(restoredInvoices[0].outstandingDebt.value).toBe(4200000);
    });

    it('rolls back completely if restore data is invalid', async () => {
      // 1. Seed customer
      await createCustomerUseCase.execute({
        name: 'مشتری دست‌نخورده',
        mobile: '09129998877'
      });

      // 2. Corrupted backup payload with invalid SQL column/constraint
      const invalidJson = JSON.stringify({
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        tableData: {
          products: [{ id: 'fake-id', invalid_column_xyz: 123 }]
        }
      });
      const enc = await BackupCrypto.encrypt(invalidJson, 'pass1234');

      // 3. Attempt restore
      const res = await backupService.restoreBackup(enc, 'pass1234');
      expect(res.success).toBe(false);

      // 4. Verify existing customer was preserved by rollback
      const customers = await customerRepo.listAll();
      expect(customers.length).toBe(1);
      expect(customers[0].name).toBe('مشتری دست‌نخورده');
    });
  });

  describe('CsvService Customers & Products Import/Export', () => {
    it('exports customers with UTF-8 BOM and imports correctly', async () => {
      await createCustomerUseCase.execute({
        name: 'سارا تهرانی',
        mobile: '09123334455',
        phone: '02188776655',
        address: 'تهران، ونک'
      });

      const csv = await csvService.exportCustomers();
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('سارا تهرانی');
      expect(csv).toContain('09123334455');

      // Import new customers via CSV
      const importCsv = `\uFEFFنام و نام خانوادگی,شماره موبایل,تلفن ثابت,آدرس,یادداشت
محمد کاظمی,09361112233,02144556677,تهران آزادی,مشتری نقدی
سارا تهرانی,09123334455,,,تکراری
نامعتبر,091200,123,,شماره غلط`;

      const importRes = await csvService.importCustomers(importCsv);
      expect(importRes.imported).toBe(1); // محمد کاظمی
      expect(importRes.skipped).toBe(1);  // سارا تهرانی (تکراری)
      expect(importRes.errors.length).toBe(1); // شماره موبایل نامعتبر

      const allCustomers = await customerRepo.listAll();
      expect(allCustomers.length).toBe(2);
    });

    it('exports products with UTF-8 BOM and imports with units and stock', async () => {
      await createProductUseCase.execute({
        name: 'چای بهاره گیلان',
        sellingPrice: 180000,
        initialStock: 25,
        minStockThreshold: 5,
        unit: 'kilogram'
      });

      const csv = await csvService.exportProducts();
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('چای بهاره گیلان');
      expect(csv).toContain('180000');

      // Import new products via CSV
      const importCsv = `\uFEFFنام کالا,کد کالا,واحد شمارش,قیمت فروش (تومان),موجودی فعلی,حداقل موجودی
زعفران قائنات,SKU-ZAF,گرم,95000,100,10
برنج طارم هاشمی,,کیلوگرم,120000,500,50`;

      const importRes = await csvService.importProducts(importCsv);
      expect(importRes.imported).toBe(2);
      expect(importRes.errors.length).toBe(0);

      const allProducts = await productRepo.listAll();
      expect(allProducts.length).toBe(3);

      const zaferan = allProducts.find((p) => p.name === 'زعفران قائنات');
      expect(zaferan?.unit).toBe('gram');
      expect(zaferan?.sellingPrice.value).toBe(95000);
      expect(zaferan?.stockQuantity.toDecimal()).toBe(100);
    });
  });
});
