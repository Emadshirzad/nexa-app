import type { UUID, ISO8601String, ISODateString } from '@/shared/types/common';
import { DomainError } from '../errors/DomainError';

export class InvalidCustomerError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCustomerError';
  }
}

export interface CustomerProps {
  id: UUID;
  name: string;
  mobile: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  followUpDate?: ISODateString | null;
  isArchived: boolean;
  tags?: string[];
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export class Customer {
  private props: CustomerProps;

  constructor(props: CustomerProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidCustomerError('نام مشتری الزامی است.');
    }
    if (!props.mobile || props.mobile.trim().length === 0) {
      throw new InvalidCustomerError('شماره همراه مشتری الزامی است.');
    }

    // Clean mobile digits
    const cleanedMobile = props.mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');

    this.props = {
      ...props,
      name: props.name.trim(),
      mobile: cleanedMobile,
      tags: props.tags || []
    };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get mobile(): string {
    return this.props.mobile;
  }

  public get phone(): string | null | undefined {
    return this.props.phone;
  }

  public get address(): string | null | undefined {
    return this.props.address;
  }

  public get notes(): string | null | undefined {
    return this.props.notes;
  }

  public get followUpDate(): ISODateString | null | undefined {
    return this.props.followUpDate;
  }

  public get isArchived(): boolean {
    return this.props.isArchived;
  }

  public get tags(): string[] {
    return [...(this.props.tags || [])];
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public get updatedAt(): ISO8601String {
    return this.props.updatedAt;
  }

  public update(updateProps: {
    name?: string;
    mobile?: string;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
    followUpDate?: ISODateString | null;
    tags?: string[];
  }): void {
    if (updateProps.name !== undefined) {
      if (!updateProps.name.trim()) throw new InvalidCustomerError('نام مشتری نمی‌تواند خالی باشد.');
      this.props.name = updateProps.name.trim();
    }
    if (updateProps.mobile !== undefined) {
      if (!updateProps.mobile.trim()) throw new InvalidCustomerError('شماره همراه نمی‌تواند خالی باشد.');
      this.props.mobile = updateProps.mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');
    }
    if (updateProps.phone !== undefined) this.props.phone = updateProps.phone;
    if (updateProps.address !== undefined) this.props.address = updateProps.address;
    if (updateProps.notes !== undefined) this.props.notes = updateProps.notes;
    if (updateProps.followUpDate !== undefined) this.props.followUpDate = updateProps.followUpDate;
    if (updateProps.tags !== undefined) this.props.tags = [...updateProps.tags];

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

  public toJSON(): CustomerProps {
    return { ...this.props, tags: this.tags };
  }
}
