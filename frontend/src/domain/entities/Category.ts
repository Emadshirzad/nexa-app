import type { UUID, ISO8601String } from '@/shared/types/common';
import { DomainError } from '../errors/DomainError';

export class InvalidCategoryError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCategoryError';
  }
}

export interface CategoryProps {
  id: UUID;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export class Category {
  private props: CategoryProps;

  constructor(props: CategoryProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidCategoryError('نام دسته‌بندی الزامی است.');
    }
    this.props = {
      ...props,
      name: props.name.trim()
    };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get color(): string {
    return this.props.color;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public get updatedAt(): ISO8601String {
    return this.props.updatedAt;
  }

  public update(name: string, color?: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidCategoryError('نام دسته‌بندی نمی‌تواند خالی باشد.');
    }
    this.props.name = name.trim();
    if (color) this.props.color = color;
    this.props.updatedAt = new Date().toISOString();
  }

  public toJSON(): CategoryProps {
    return { ...this.props };
  }
}
