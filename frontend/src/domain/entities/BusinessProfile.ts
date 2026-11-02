import type { UUID, ISO8601String } from '@/shared/types/common';
import { DomainError } from '../errors/DomainError';

export class InvalidBusinessProfileError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBusinessProfileError';
  }
}

export interface BusinessProfileProps {
  id: UUID;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export class BusinessProfile {
  private props: BusinessProfileProps;

  constructor(props: BusinessProfileProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidBusinessProfileError('نام کسب‌وکار الزامی است.');
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

  public get phone(): string | undefined {
    return this.props.phone;
  }

  public get email(): string | undefined {
    return this.props.email;
  }

  public get address(): string | undefined {
    return this.props.address;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public get updatedAt(): ISO8601String {
    return this.props.updatedAt;
  }

  public update(updateProps: Partial<Omit<BusinessProfileProps, 'id' | 'createdAt'>>): void {
    if (updateProps.name !== undefined) {
      if (!updateProps.name.trim()) {
        throw new InvalidBusinessProfileError('نام کسب‌وکار نمی‌تواند خالی باشد.');
      }
      this.props.name = updateProps.name.trim();
    }
    if (updateProps.phone !== undefined) this.props.phone = updateProps.phone.trim();
    if (updateProps.email !== undefined) this.props.email = updateProps.email?.trim();
    if (updateProps.address !== undefined) this.props.address = updateProps.address?.trim();
    if (updateProps.description !== undefined) this.props.description = updateProps.description?.trim();

    this.props.updatedAt = new Date().toISOString();
  }

  public toJSON(): BusinessProfileProps {
    return { ...this.props };
  }
}
