import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqliteDriver } from '@/infrastructure/database/BetterSqliteDriver';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { SqliteProductRepository } from '@/infrastructure/repositories/SqliteProductRepository';
import { SqliteStockMovementRepository } from '@/infrastructure/repositories/SqliteStockMovementRepository';
import { SqliteCustomerRepository } from '@/infrastructure/repositories/SqliteCustomerRepository';
import { SqliteInvoiceRepository } from '@/infrastructure/repositories/SqliteInvoiceRepository';
import { SqlitePaymentRepository } from '@/infrastructure/repositories/SqlitePaymentRepository';
import { CreateProductUseCase } from '@/application/use-cases/products/CreateProductUseCase';
import { CreateCustomerUseCase } from '@/application/use-cases/customers/CreateCustomerUseCase';
import { CreateInvoiceUseCase } from '@/application/use-cases/invoices/CreateInvoiceUseCase';
import { CancelInvoiceUseCase } from '@/application/use-cases/invoices/CancelInvoiceUseCase';
import { RecordInvoicePaymentUseCase } from '@/application/use-cases/invoices/RecordInvoicePaymentUseCase';
import { InvoicePdfGenerator } from '@/infrastructure/pdf/InvoicePdfGenerator';
import { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { generateUUID } from '@/shared/utils/id';

describe('Sales, Invoices and PDF Integration', () => {
  let driver: BetterSqliteDriver;
  let productRepo: SqliteProductRepository;
  let movementRepo: SqliteStockMovementRepository;
  let customerRepo: SqliteCustomerRepository;
  let invoiceRepo: SqliteInvoiceRepository;
  let paymentRepo: SqlitePaymentRepository;

  let createProductUseCase: CreateProductUseCase;
  let createCustomerUseCase: CreateCustomerUseCase;
  let createInvoiceUseCase: CreateInvoiceUseCase;
  let cancelInvoiceUseCase: CancelInvoiceUseCase;
  let recordInvoicePaymentUseCase: RecordInvoicePaymentUseCase;

  beforeEach(async () => {
    driver = new BetterSqliteDriver(':memory:');
    const runner = new MigrationRunner(driver);
    await runner.run();

    productRepo = new SqliteProductRepository(driver);
    movementRepo = new SqliteStockMovementRepository(driver);
    customerRepo = new SqliteCustomerRepository(driver);
    invoiceRepo = new SqliteInvoiceRepository(driver);
    paymentRepo = new SqlitePaymentRepository(driver);

    createProductUseCase = new CreateProductUseCase(productRepo, movementRepo, driver);
    createCustomerUseCase = new CreateCustomerUseCase(customerRepo);
    createInvoiceUseCase = new CreateInvoiceUseCase(
      invoiceRepo,
      productRepo,
      movementRepo,
      paymentRepo,
      driver
    );
    cancelInvoiceUseCase = new CancelInvoiceUseCase(
      invoiceRepo,
      productRepo,
      movementRepo,
      driver
    );
    recordInvoicePaymentUseCase = new RecordInvoicePaymentUseCase(
      invoiceRepo,
      paymentRepo,
      driver
    );
  });

  afterEach(async () => {
    await driver.close();
  });

  it('creates an invoice, deducts stock, and records upfront payment atomically', async () => {
    // 1. Create a customer
    const custRes = await createCustomerUseCase.execute({
      name: 'محمدرضا رضایی',
      mobile: '09121112233',
      address: 'تهران، خیابان آزادی'
    });
    expect(custRes.success).toBe(true);
    if (!custRes.success) return;
    const customer = custRes.data;

    // 2. Create two products
    const prodRes1 = await createProductUseCase.execute({
      name: 'قهوه اسپرسو ۱۰۰٪ عربیکا',
      sellingPrice: 450000,
      initialStock: 10,
      unit: 'kilogram'
    });
    expect(prodRes1.success).toBe(true);
    if (!prodRes1.success) return;
    const prod1 = prodRes1.data;

    const prodRes2 = await createProductUseCase.execute({
      name: 'سیروپ کارامل',
      sellingPrice: 180000,
      initialStock: 5,
      unit: 'piece'
    });
    expect(prodRes2.success).toBe(true);
    if (!prodRes2.success) return;
    const prod2 = prodRes2.data;

    // 3. Issue invoice: 2 kg coffee + 1 syrup, with 80,000 Toman discount and 400,000 Toman upfront payment
    // Subtotal: (2 * 450,000) + (1 * 180,000) = 900,000 + 180,000 = 1,080,000
    // Invoice discount: 80,000
    // Final Amount = 1,000,000 Toman
    // Upfront Payment = 400,000 Toman
    // Outstanding Debt = 600,000 Toman
    const invoiceRes = await createInvoiceUseCase.execute({
      customerId: customer.id,
      invoiceDate: '2026-11-02',
      items: [
        {
          productId: prod1.id,
          name: prod1.name,
          sku: prod1.sku,
          unit: prod1.unit,
          unitPrice: 450000,
          quantity: 2,
          discount: 0
        },
        {
          productId: prod2.id,
          name: prod2.name,
          sku: prod2.sku,
          unit: prod2.unit,
          unitPrice: 180000,
          quantity: 1,
          discount: 0
        }
      ],
      invoiceDiscount: 80000,
      upfrontPayment: {
        amount: 400000,
        paymentMethod: 'card_transfer',
        referenceNumber: 'TRX-9988'
      }
    });

    expect(invoiceRes.success).toBe(true);
    if (!invoiceRes.success) return;
    const invoice = invoiceRes.data;

    expect(invoice.invoiceNumber).toMatch(/^INV-\d{6}$/);
    expect(invoice.subtotal.value).toBe(1080000);
    expect(invoice.finalAmount.value).toBe(1000000);
    expect(invoice.paidAmount.value).toBe(400000);
    expect(invoice.outstandingDebt.value).toBe(600000);

    // 4. Verify inventory was deducted
    const updatedProd1 = await productRepo.findById(prod1.id);
    expect(updatedProd1?.stockQuantity.toDecimal()).toBe(8); // 10 - 2 = 8

    const updatedProd2 = await productRepo.findById(prod2.id);
    expect(updatedProd2?.stockQuantity.toDecimal()).toBe(4); // 5 - 1 = 4

    // 5. Verify movements were logged
    const movements1 = await movementRepo.findByProductId(prod1.id);
    expect(movements1.some((m) => m.movementType === 'invoice_sale')).toBe(true);

    // 6. Record remaining payment of 600,000
    const payRes = await recordInvoicePaymentUseCase.execute({
      invoiceId: invoice.id,
      amount: 600000,
      paymentMethod: 'cash',
      paymentDate: '2026-11-02'
    });
    expect(payRes.success).toBe(true);

    const reloadedInvoice = await invoiceRepo.findById(invoice.id);
    expect(reloadedInvoice?.paidAmount.value).toBe(1000000);
    expect(reloadedInvoice?.outstandingDebt.value).toBe(0);
  });

  it('performs idempotent invoice cancellation and restores stock exactly once', async () => {
    // 1. Create product
    const prodRes = await createProductUseCase.execute({
      name: 'آسیاب قهوه',
      sellingPrice: 3500000,
      initialStock: 10,
      unit: 'piece'
    });
    expect(prodRes.success).toBe(true);
    if (!prodRes.success) return;
    const prod = prodRes.data;

    // 2. Issue invoice for 3 units
    const invoiceRes = await createInvoiceUseCase.execute({
      invoiceDate: '2026-11-02',
      items: [
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          unitPrice: 3500000,
          quantity: 3,
          discount: 0
        }
      ]
    });
    expect(invoiceRes.success).toBe(true);
    if (!invoiceRes.success) return;
    const invoice = invoiceRes.data;

    // Stock should be 7
    let currentProd = await productRepo.findById(prod.id);
    expect(currentProd?.stockQuantity.toDecimal()).toBe(7);

    // 3. Cancel invoice
    const cancelRes = await cancelInvoiceUseCase.execute({
      invoiceId: invoice.id,
      reason: 'انصراف خریدار قبل از ارسال کالا'
    });
    expect(cancelRes.success).toBe(true);

    // Stock must be restored to 10
    currentProd = await productRepo.findById(prod.id);
    expect(currentProd?.stockQuantity.toDecimal()).toBe(10);

    const cancelledInvoice = await invoiceRepo.findById(invoice.id);
    expect(cancelledInvoice?.status).toBe('cancelled');
    expect(cancelledInvoice?.cancellationReason).toBe('انصراف خریدار قبل از ارسال کالا');

    // 4. Repeated cancellation must be idempotent (must NOT restore stock a second time)
    const secondCancelRes = await cancelInvoiceUseCase.execute({
      invoiceId: invoice.id,
      reason: 'تکرار ابطال'
    });
    expect(secondCancelRes.success).toBe(true);

    currentProd = await productRepo.findById(prod.id);
    expect(currentProd?.stockQuantity.toDecimal()).toBe(10); // Still 10, not 13!
  });

  it('renders official A4 invoice HTML with Persian RTL and words', async () => {
    const profile = new BusinessProfile({
      id: generateUUID(),
      name: 'کافه نکسوس',
      phone: '02188990011',
      address: 'تهران، خیابان ولیعصر',
      createdAt: '2026-11-02T00:00:00Z',
      updatedAt: '2026-11-02T00:00:00Z'
    });

    const invoiceRes = await createInvoiceUseCase.execute({
      invoiceDate: '2026-11-02',
      items: [
        {
          name: 'بسته دانه قهوه ۲۵۰ گرمی',
          sku: 'COF-250',
          unit: 'package',
          unitPrice: 125000,
          quantity: 2,
          discount: 10000
        }
      ]
    });
    expect(invoiceRes.success).toBe(true);
    if (!invoiceRes.success) return;
    const invoice = invoiceRes.data;

    const html = InvoicePdfGenerator.renderHtml(invoice, profile);
    expect(html).toContain('کافه نکسوس');
    expect(html).toContain('بسته دانه قهوه ۲۵۰ گرمی');
    expect(html).toContain('240,000'); // (2 * 125,000) - 10,000 = 240,000
    expect(html).toContain('دویست و چهل هزار تومان');
    expect(html).toContain('dir="rtl"');
  });
});
