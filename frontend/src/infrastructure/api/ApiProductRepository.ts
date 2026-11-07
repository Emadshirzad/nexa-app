import type { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product, type ProductUnit } from '@/domain/entities/Product';
import { Money } from '@/domain/value-objects/Money';
import { StockQuantity } from '@/domain/value-objects/StockQuantity';
import { ApiClient } from './ApiClient';
import type { UUID } from '@/shared/types/common';

export class ApiProductRepository implements IProductRepository {
  private api = ApiClient.getInstance();

  private toDomain(data: any): Product {
    return new Product({
      id: data.id as UUID,
      categoryId: (data.category_id as UUID) || null,
      name: data.name,
      sku: data.sku,
      unit: (data.unit as ProductUnit) || 'piece',
      sellingPrice: Money.fromToman(Number(data.selling_price) || 0),
      stockQuantity: StockQuantity.fromScaled(Number(data.stock_quantity) || 0),
      minStockThreshold: StockQuantity.fromScaled(Number(data.min_stock_threshold) || 0),
      isArchived: Boolean(data.is_archived),
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    });
  }

  public async findById(id: UUID): Promise<Product | null> {
    try {
      const data = await this.api.get<any>(`/products/${id}`);
      return data ? this.toDomain(data) : null;
    } catch {
      return null;
    }
  }

  public async findBySku(sku: string): Promise<Product | null> {
    const list = await this.search(sku.trim(), null, true);
    return list.find((p) => p.sku === sku.trim()) ?? null;
  }

  public async search(
    query: string,
    categoryId?: UUID | null,
    includeArchived?: boolean
  ): Promise<Product[]> {
    const res = await this.api.get<any>('/products', {
      q: query.trim() || undefined,
      category_id: categoryId || undefined,
      include_archived: includeArchived ? 1 : 0,
      all: true
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async listAll(includeArchived?: boolean): Promise<Product[]> {
    const res = await this.api.get<any>('/products', {
      include_archived: includeArchived ? 1 : 0,
      all: true
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async listLowStock(): Promise<Product[]> {
    const res = await this.api.get<any>('/products', {
      low_stock: 1,
      include_archived: 0,
      all: true
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async save(product: Product): Promise<void> {
    const payload = {
      category_id: product.categoryId ?? null,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      selling_price: product.sellingPrice.value,
      stock_quantity: product.stockQuantity.scaledValue,
      min_stock_threshold: product.minStockThreshold.scaledValue,
      is_archived: product.isArchived
    };

    try {
      const existing = await this.findById(product.id);
      if (existing) {
        await this.api.put(`/products/${product.id}`, payload);
      } else {
        await this.api.post('/products', { id: product.id, ...payload });
      }
    } catch {
      await this.api.post('/products', { id: product.id, ...payload });
    }
  }

  public async getNextSkuSequence(): Promise<string> {
    try {
      const res = await this.api.get<{ next_sku: string }>('/products/next-sku');
      return res.next_sku || 'P-1001';
    } catch {
      return 'P-1001';
    }
  }

  public async hasHistory(id: UUID): Promise<boolean> {
    try {
      const res = await this.api.get<{ has_history: boolean }>(`/products/${id}/has-history`);
      return Boolean(res.has_history);
    } catch {
      return false;
    }
  }
}
