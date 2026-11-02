import type { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import { Invoice, InvoiceStatus } from '@/domain/entities/Invoice';
import { InvoiceItem } from '@/domain/entities/InvoiceItem';
import { Money } from '@/domain/value-objects/Money';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import type { IDatabaseDriver } from '../database/IDatabaseDriver';
import type { UUID } from '@/shared/types/common';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  invoice_date: string;
  status: string;
  subtotal: number;
  item_discount_total: number;
  invoice_discount: number;
  final_amount: number;
  paid_amount: number;
  outstanding_debt: number;
  notes: string | null;
  issued_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  discount_amount: number;
  line_total: number;
  created_at: string;
}

export class SqliteInvoiceRepository implements IInvoiceRepository {
  private readonly driver: IDatabaseDriver;

  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  public async findById(id: UUID): Promise<Invoice | null> {
    const rows = await this.driver.query<InvoiceRow>(
      `SELECT * FROM invoices WHERE id = ?;`,
      [id]
    );
    if (!rows[0]) return null;

    const items = await this.getItemsForInvoice(id);
    return this.mapRowToEntity(rows[0], items);
  }

  public async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const rows = await this.driver.query<InvoiceRow>(
      `SELECT * FROM invoices WHERE invoice_number = ?;`,
      [invoiceNumber.trim()]
    );
    if (!rows[0]) return null;

    const items = await this.getItemsForInvoice(rows[0].id);
    return this.mapRowToEntity(rows[0], items);
  }

  public async search(query: string, status?: InvoiceStatus, customerId?: UUID): Promise<Invoice[]> {
    let sql = `SELECT * FROM invoices WHERE 1=1`;
    const params: unknown[] = [];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (customerId) {
      sql += ` AND customer_id = ?`;
      params.push(customerId);
    }

    if (query && query.trim()) {
      sql += ` AND invoice_number LIKE ?`;
      params.push(`%${query.trim()}%`);
    }

    sql += ` ORDER BY invoice_date DESC, created_at DESC;`;

    const rows = await this.driver.query<InvoiceRow>(sql, params);
    const invoices: Invoice[] = [];

    for (const row of rows) {
      const items = await this.getItemsForInvoice(row.id);
      invoices.push(this.mapRowToEntity(row, items));
    }

    return invoices;
  }

  public async listAll(limit: number = 50): Promise<Invoice[]> {
    const rows = await this.driver.query<InvoiceRow>(
      `SELECT * FROM invoices ORDER BY invoice_date DESC, created_at DESC LIMIT ?;`,
      [limit]
    );
    const invoices: Invoice[] = [];

    for (const row of rows) {
      const items = await this.getItemsForInvoice(row.id);
      invoices.push(this.mapRowToEntity(row, items));
    }

    return invoices;
  }

  public async save(invoice: Invoice): Promise<void> {
    await this.driver.transaction(async (tx) => {
      // 1. Upsert Invoice
      await tx.run(
        `INSERT INTO invoices (
          id, invoice_number, customer_id, invoice_date, status,
          subtotal, item_discount_total, invoice_discount, final_amount,
          paid_amount, outstanding_debt, notes, issued_at, cancelled_at,
          cancellation_reason, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          customer_id = excluded.customer_id,
          invoice_date = excluded.invoice_date,
          status = excluded.status,
          subtotal = excluded.subtotal,
          item_discount_total = excluded.item_discount_total,
          invoice_discount = excluded.invoice_discount,
          final_amount = excluded.final_amount,
          paid_amount = excluded.paid_amount,
          outstanding_debt = excluded.outstanding_debt,
          notes = excluded.notes,
          issued_at = excluded.issued_at,
          cancelled_at = excluded.cancelled_at,
          cancellation_reason = excluded.cancellation_reason,
          updated_at = excluded.updated_at;`,
        [
          invoice.id,
          invoice.invoiceNumber,
          invoice.customerId ?? null,
          invoice.invoiceDate,
          invoice.status,
          invoice.subtotal.value,
          invoice.itemDiscountTotal.value,
          invoice.invoiceDiscount.value,
          invoice.finalAmount.value,
          invoice.paidAmount.value,
          invoice.outstandingDebt.value,
          invoice.notes ?? null,
          invoice.issuedAt ?? null,
          invoice.cancelledAt ?? null,
          invoice.cancellationReason ?? null,
          invoice.createdAt,
          invoice.updatedAt
        ]
      );

      // 2. Sync Items (Only replace items if invoice is draft or being newly issued)
      if (invoice.items.length > 0) {
        await tx.run(`DELETE FROM invoice_items WHERE invoice_id = ?;`, [invoice.id]);

        for (const item of invoice.items) {
          await tx.run(
            `INSERT INTO invoice_items (
              id, invoice_id, product_id, product_name_snapshot, sku_snapshot,
              unit_snapshot, unit_price_snapshot, quantity, discount_amount,
              line_total, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              item.id,
              item.invoiceId,
              item.productId ?? null,
              item.productNameSnapshot,
              item.skuSnapshot,
              item.unitSnapshot,
              item.unitPriceSnapshot.value,
              item.quantity.scaledValue,
              item.discountAmount.value,
              item.lineTotal.value,
              item.createdAt
            ]
          );
        }
      }
    });
  }

  public async getNextInvoiceNumber(): Promise<string> {
    const rows = await this.driver.query<{ count: number }>(`
      SELECT COUNT(*) as count FROM invoices;
    `);
    const nextSeq = (rows[0]?.count ?? 0) + 101;
    return `INV-${String(nextSeq).padStart(6, '0')}`;
  }

  public async hasCancellationMovements(invoiceId: UUID): Promise<boolean> {
    const rows = await this.driver.query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM stock_movements
       WHERE reference_type = 'invoice' AND reference_id = ? AND movement_type = 'invoice_cancellation';`,
      [invoiceId]
    );
    return (rows[0]?.count ?? 0) > 0;
  }

  private async getItemsForInvoice(invoiceId: string): Promise<InvoiceItem[]> {
    const rows = await this.driver.query<InvoiceItemRow>(
      `SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY rowid ASC;`,
      [invoiceId]
    );

    return rows.map(
      (r) =>
        new InvoiceItem({
          id: r.id,
          invoiceId: r.invoice_id,
          productId: r.product_id,
          productNameSnapshot: r.product_name_snapshot,
          skuSnapshot: r.sku_snapshot,
          unitSnapshot: r.unit_snapshot,
          unitPriceSnapshot: Money.fromToman(r.unit_price_snapshot),
          quantity: StockQuantity.fromScaled(r.quantity),
          discountAmount: Money.fromToman(r.discount_amount),
          lineTotal: Money.fromToman(r.line_total),
          createdAt: r.created_at
        })
    );
  }

  private mapRowToEntity(row: InvoiceRow, items: InvoiceItem[]): Invoice {
    return new Invoice({
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerId: row.customer_id,
      invoiceDate: row.invoice_date,
      status: row.status as InvoiceStatus,
      subtotal: Money.fromToman(row.subtotal),
      itemDiscountTotal: Money.fromToman(row.item_discount_total),
      invoiceDiscount: Money.fromToman(row.invoice_discount),
      finalAmount: Money.fromToman(row.final_amount),
      paidAmount: Money.fromToman(row.paid_amount),
      outstandingDebt: Money.fromToman(row.outstanding_debt),
      notes: row.notes,
      issuedAt: row.issued_at,
      cancelledAt: row.cancelled_at,
      cancellationReason: row.cancellation_reason,
      items,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
