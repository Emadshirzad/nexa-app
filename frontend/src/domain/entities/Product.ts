import type { UUID, ISO8601String } from '@/shared/types/common';
import { Money } from '../value-objects/Money';
import { StockQuantity } from '../value-objects/StockQuantity';
import { DomainError } from '../errors/DomainError';

export class InvalidProductError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProductError';
  }
}

export type ProductUnit =
  | 'piece'     // عدد
  | 'package'   // بسته
  | 'kilogram'  // کیلوگرم
  | 'gram'      // گرم
  | 'meter'     // متر
  | 'liter'     // لیتر
  | 'box'       // جعبه
  | 'carton';   // کارتن

export interface ProductProps {
  id: UUID;
  categoryId?: UUID | null;
  name: string;
  sku: string;
  unit: ProductUnit;
  sellingPrice: Money;
  stockQuantity: StockQuantity;
  minStockThreshold: StockQuantity;
  isArchived: boolean;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export class Product {
  private props: ProductProps;

  constructor(props: ProductProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidProductError('نام کالا الزامی است.');
    }
    if (!props.sku || props.sku.trim().length === 0) {
      throw new InvalidProductError('کد کالا (SKU) الزامی است.');
    }
    this.props = {
      ...props,
      name: props.name.trim(),
      sku: props.sku.trim()
    };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get categoryId(): UUID | null | undefined {
    return this.props.categoryId;
  }

  public get name(): string {
    return this.props.name;
  }

  public get sku(): string {
    return this.props.sku;
  }

  public get unit(): ProductUnit {
    return this.props.unit;
  }

  public get sellingPrice(): Money {
    return this.props.sellingPrice;
  }

  public get stockQuantity(): StockQuantity {
    return this.props.stockQuantity;
  }

  public get minStockThreshold(): StockQuantity {
    return this.props.minStockThreshold;
  }

  public get isArchived(): boolean {
    return this.props.isArchived;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public get updatedAt(): ISO8601String {
    return this.props.updatedAt;
  }

  public isLowStock(): boolean {
    return this.props.stockQuantity.scaledValue <= this.props.minStockThreshold.scaledValue;
  }

  public update(updateProps: {
    name?: string;
    categoryId?: UUID | null;
    unit?: ProductUnit;
    sellingPrice?: Money;
    minStockThreshold?: StockQuantity;
  }): void {
    if (updateProps.name !== undefined) {
      if (!updateProps.name.trim()) throw new InvalidProductError('نام کالا نمی‌تواند خالی باشد.');
      this.props.name = updateProps.name.trim();
    }
    if (updateProps.categoryId !== undefined) this.props.categoryId = updateProps.categoryId;
    if (updateProps.unit !== undefined) this.props.unit = updateProps.unit;
    if (updateProps.sellingPrice !== undefined) this.props.sellingPrice = updateProps.sellingPrice;
    if (updateProps.minStockThreshold !== undefined) this.props.minStockThreshold = updateProps.minStockThreshold;

    this.props.updatedAt = new Date().toISOString();
  }

  /**
   * Sets cached balance from reconciled ledger calculation.
   */
  public updateCachedStock(newQuantity: StockQuantity): void {
    this.props.stockQuantity = newQuantity;
    this.props.updatedAt = new Date().toISOString();
  }

  public archive(): void {
    this.props.isArchived = true;
    this.props.updatedAt = new Date().toISOString();
  }

  public unarchive(): void {
    this.props.isArchived = false;
    this.props.updatedAt = new Date().toISOString();
  }
}
