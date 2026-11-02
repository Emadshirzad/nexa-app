import type { UUID } from '@/shared/types/common';
import type { Product } from '../entities/Product';

export interface IProductRepository {
  findById(id: UUID): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  search(query: string, categoryId?: UUID | null, includeArchived?: boolean): Promise<Product[]>;
  listAll(includeArchived?: boolean): Promise<Product[]>;
  listLowStock(): Promise<Product[]>;
  save(product: Product): Promise<void>;
  getNextSkuSequence(): Promise<string>;
  hasHistory(id: UUID): Promise<boolean>;
}
