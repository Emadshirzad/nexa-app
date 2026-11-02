import { z } from 'zod';
import type { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import type { IStockMovementRepository } from '@/domain/repositories/IStockMovementRepository';
import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';

import { Invoice } from '@/domain/entities/Invoice';
import { InvoiceItem } from '@/domain/entities/InvoiceItem';
import { Payment, PaymentMethod } from '@/domain/entities/Payment';
import { StockMovement } from '@/domain/entities/StockMovement';
import { Money } from '@/domain/value-objects/Money';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';

export const InvoiceItemInputSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'نام کالا الزامی است.'),
  sku: z.string().default(''),
  unit: z.string().default('piece'),
  unitPrice: z.number().int().min(0, 'قیمت واحد باید عدد مثبت باشد.'),
  quantity: z.number().positive('تعداد/مقدار باید بزرگتر از صفر باشد.'),
  discount: z.number().int().min(0).default(0)
});

export type InvoiceItemInputDTO = z.input<typeof InvoiceItemInputSchema>;

export const CreateInvoiceSchema = z.object({
  customerId: z.string().uuid().nullable().optional(),
  invoiceDate: z.string(), // YYYY-MM-DD
  items: z.array(InvoiceItemInputSchema).min(1, 'حداقل یک قلم کالا در فاکتور الزامی است.'),
  invoiceDiscount: z.number().int().min(0).default(0),
  notes: z.string().nullable().optional(),
  upfrontPayment: z.object({
    amount: z.number().int().positive(),
    paymentMethod: z.enum(['cash', 'card_transfer', 'pos', 'bank_transfer', 'other']),
    referenceNumber: z.string().optional()
  }).optional()
});

export type CreateInvoiceDTO = z.input<typeof CreateInvoiceSchema>;

export class CreateInvoiceUseCase {
  private readonly invoiceRepo: IInvoiceRepository;
  private readonly productRepo: IProductRepository;
  private readonly movementRepo: IStockMovementRepository;
  private readonly paymentRepo: IPaymentRepository;
  private readonly driver: IDatabaseDriver;

  constructor(
    invoiceRepo: IInvoiceRepository,
    productRepo: IProductRepository,
    movementRepo: IStockMovementRepository,
    paymentRepo: IPaymentRepository,
    driver: IDatabaseDriver
  ) {
    this.invoiceRepo = invoiceRepo;
    this.productRepo = productRepo;
    this.movementRepo = movementRepo;
    this.paymentRepo = paymentRepo;
    this.driver = driver;
  }

  public async execute(dto: CreateInvoiceDTO): Promise<Result<Invoice, string>> {
    const parseRes = CreateInvoiceSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }
    const input = parseRes.data;

    try {
      const invoiceId = generateUUID();
      const invoiceNumber = await this.invoiceRepo.getNextInvoiceNumber();
      const now = new Date().toISOString();

      let subtotalToman = 0;
      let itemDiscountTotalToman = 0;
      const invoiceItems: InvoiceItem[] = [];

      // Build snapshots for every item
      for (const itemInput of input.items) {
        let nameSnapshot = itemInput.name;
        let skuSnapshot = itemInput.sku;
        let unitSnapshot = itemInput.unit;
        let unitPriceToman = itemInput.unitPrice;

        // If productId provided, load product snapshot from DB
        let product = null;
        if (itemInput.productId) {
          product = await this.productRepo.findById(itemInput.productId as UUID);
          if (product) {
            nameSnapshot = product.name;
            skuSnapshot = product.sku;
            unitSnapshot = product.unit;
            unitPriceToman = itemInput.unitPrice > 0 ? itemInput.unitPrice : product.sellingPrice.value;
          }
        }

        const price = Money.fromToman(unitPriceToman);
        const qty = StockQuantity.fromDecimal(itemInput.quantity);
        const discount = Money.fromToman(itemInput.discount);

        const { gross, lineTotal } = InvoiceItem.calculate(price, qty, discount);

        subtotalToman += gross.value;
        itemDiscountTotalToman += discount.value;

        const invoiceItem = new InvoiceItem({
          id: generateUUID(),
          invoiceId,
          productId: itemInput.productId as UUID | null,
          productNameSnapshot: nameSnapshot,
          skuSnapshot: skuSnapshot,
          unitSnapshot: unitSnapshot,
          unitPriceSnapshot: price,
          quantity: qty,
          discountAmount: discount,
          lineTotal,
          createdAt: now
        });

        invoiceItems.push(invoiceItem);
      }

      const subtotal = Money.fromToman(subtotalToman);
      const itemDiscountTotal = Money.fromToman(itemDiscountTotalToman);
      const invoiceDiscount = Money.fromToman(input.invoiceDiscount);

      // Final Amount = Subtotal - Item Discounts - Invoice Discount
      const finalToman = Math.max(0, subtotalToman - itemDiscountTotalToman - invoiceDiscount.value);
      const finalAmount = Money.fromToman(finalToman);

      const upfrontAmount = input.upfrontPayment ? Money.fromToman(input.upfrontPayment.amount) : Money.zero();
      const paidAmount = upfrontAmount.isGreaterThan(finalAmount) ? finalAmount : upfrontAmount;
      const outstandingDebt = finalAmount.subtract(paidAmount);

      const invoice = new Invoice({
        id: invoiceId,
        invoiceNumber,
        customerId: input.customerId as UUID | null,
        invoiceDate: input.invoiceDate,
        status: 'issued', // Directly issued
        subtotal,
        itemDiscountTotal,
        invoiceDiscount,
        finalAmount,
        paidAmount,
        outstandingDebt,
        notes: input.notes,
        issuedAt: now,
        items: invoiceItems,
        createdAt: now,
        updatedAt: now
      });

      // Atomic Execution: Save Invoice + Deduct Inventory + Record Payment
      await this.driver.transaction(async () => {
        // 1. Save Invoice & Items
        await this.invoiceRepo.save(invoice);

        // 2. Create Stock Deductions for catalog products
        for (const item of invoiceItems) {
          if (item.productId) {
            const product = await this.productRepo.findById(item.productId);
            if (product) {
              const deductionMovement = new StockMovement({
                id: generateUUID(),
                productId: product.id,
                movementType: 'invoice_sale',
                quantity: StockQuantity.fromScaled(-item.quantity.scaledValue),
                referenceType: 'invoice',
                referenceId: invoiceId,
                reason: `فروش در فاکتور ${invoiceNumber}`,
                createdAt: now
              });

              await this.movementRepo.record(deductionMovement);

              // Update product cached stock
              const newStockScaled = product.stockQuantity.scaledValue - item.quantity.scaledValue;
              product.updateCachedStock(StockQuantity.fromScaled(newStockScaled));
              await this.productRepo.save(product);
            }
          }
        }

        // 3. Record Upfront Payment if provided
        if (input.upfrontPayment && upfrontAmount.value > 0) {
          const payment = new Payment({
            id: generateUUID(),
            invoiceId,
            customerId: input.customerId as UUID | null,
            amount: upfrontAmount,
            paymentMethod: input.upfrontPayment.paymentMethod as PaymentMethod,
            paymentDate: input.invoiceDate,
            referenceNumber: input.upfrontPayment.referenceNumber,
            notes: `پرداخت نقدی هنگام صدور فاکتور ${invoiceNumber}`,
            isVoided: false,
            createdAt: now
          });

          await this.paymentRepo.record(payment);
        }
      });

      return ok(invoice);
    } catch (err) {
      return fail(`خطا در صدور فاکتور: ${String(err)}`);
    }
  }
}
