import type { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import { Invoice, type InvoiceStatus } from '@/domain/entities/Invoice';
import { InvoiceItem } from '@/domain/entities/InvoiceItem';
import { Money } from '@/domain/value-objects/Money';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import { ApiClient } from './ApiClient';
import type { UUID } from '@/shared/types/common';

export class ApiInvoiceRepository implements IInvoiceRepository {
  private api = ApiClient.getInstance();

  private toDomain(data: any): Invoice {
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const items = rawItems.map((item: any) => new InvoiceItem({
      id: item.id as UUID,
      invoiceId: data.id as UUID,
      productId: (item.product_id as UUID) || null,
      productNameSnapshot: item.product_name_snapshot || '',
      skuSnapshot: item.sku_snapshot || '',
      unitSnapshot: item.unit_snapshot || 'piece',
      unitPriceSnapshot: Money.fromToman(Number(item.unit_price_snapshot) || 0),
      quantity: StockQuantity.fromScaled(Number(item.quantity) || 0),
      discountAmount: Money.fromToman(Number(item.discount_amount) || 0),
      lineTotal: Money.fromToman(Number(item.line_total) || 0),
      createdAt: item.created_at || new Date().toISOString()
    }));

    return new Invoice({
      id: data.id as UUID,
      invoiceNumber: data.invoice_number,
      customerId: (data.customer_id as UUID) || null,
      invoiceDate: data.invoice_date,
      status: (data.status as InvoiceStatus) || 'draft',
      subtotal: Money.fromToman(Number(data.subtotal) || 0),
      itemDiscountTotal: Money.fromToman(Number(data.item_discount_total) || 0),
      invoiceDiscount: Money.fromToman(Number(data.invoice_discount) || 0),
      finalAmount: Money.fromToman(Number(data.final_amount) || 0),
      paidAmount: Money.fromToman(Number(data.paid_amount) || 0),
      outstandingDebt: Money.fromToman(Number(data.outstanding_debt) || 0),
      notes: data.notes ?? undefined,
      issuedAt: data.issued_at ?? undefined,
      cancelledAt: data.cancelled_at ?? undefined,
      cancellationReason: data.cancellation_reason ?? undefined,
      items,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    });
  }

  public async findById(id: UUID): Promise<Invoice | null> {
    try {
      const data = await this.api.get<any>(`/invoices/${id}`);
      return data ? this.toDomain(data) : null;
    } catch {
      return null;
    }
  }

  public async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    const list = await this.search(invoiceNumber.trim());
    return list.find((i) => i.invoiceNumber.toLowerCase() === invoiceNumber.trim().toLowerCase()) ?? null;
  }

  public async search(
    query: string,
    status?: InvoiceStatus,
    customerId?: UUID
  ): Promise<Invoice[]> {
    const res = await this.api.get<any>('/invoices', {
      q: query.trim() || undefined,
      status: status || undefined,
      customer_id: customerId || undefined,
      all: true
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async listAll(limit?: number): Promise<Invoice[]> {
    const res = await this.api.get<any>('/invoices', {
      limit: limit || undefined,
      all: !limit
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async save(invoice: Invoice): Promise<void> {
    const itemsPayload = invoice.items.map((item) => ({
      product_id: item.productId ?? null,
      product_name_snapshot: item.productNameSnapshot,
      sku_snapshot: item.skuSnapshot,
      unit_snapshot: item.unitSnapshot,
      unit_price_snapshot: item.unitPriceSnapshot.value,
      quantity: item.quantity.scaledValue,
      discount_amount: item.discountAmount.value,
      line_total: item.lineTotal.value
    }));

    const payload = {
      invoice_number: invoice.invoiceNumber,
      customer_id: invoice.customerId ?? null,
      invoice_date: invoice.invoiceDate,
      status: invoice.status,
      subtotal: invoice.subtotal.value,
      item_discount_total: invoice.itemDiscountTotal.value,
      invoice_discount: invoice.invoiceDiscount.value,
      final_amount: invoice.finalAmount.value,
      paid_amount: invoice.paidAmount.value,
      outstanding_debt: invoice.outstandingDebt.value,
      notes: invoice.notes ?? null,
      issued_at: invoice.issuedAt ?? null,
      cancelled_at: invoice.cancelledAt ?? null,
      cancellation_reason: invoice.cancellationReason ?? null,
      items: itemsPayload
    };

    try {
      const existing = await this.findById(invoice.id);
      if (existing) {
        await this.api.put(`/invoices/${invoice.id}`, payload);
      } else {
        await this.api.post('/invoices', { id: invoice.id, ...payload });
      }
    } catch {
      await this.api.post('/invoices', { id: invoice.id, ...payload });
    }
  }

  public async getNextInvoiceNumber(): Promise<string> {
    try {
      const res = await this.api.get<{ next_invoice_number: string }>('/invoices/next-number');
      return res.next_invoice_number || 'INV-1001';
    } catch {
      return 'INV-1001';
    }
  }

  public async hasCancellationMovements(invoiceId: UUID): Promise<boolean> {
    try {
      const res = await this.api.get<{ has_cancellation_movements: boolean }>(
        `/invoices/${invoiceId}/has-cancellation-movements`
      );
      return Boolean(res.has_cancellation_movements);
    } catch {
      return false;
    }
  }
}
