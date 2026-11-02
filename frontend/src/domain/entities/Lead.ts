import type { UUID, ISO8601String, ISODateString } from '@/shared/types/common';
import { DomainError } from '../errors/DomainError';

export class InvalidLeadError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidLeadError';
  }
}

export type LeadStatus =
  | 'new'
  | 'following_up'
  | 'interested'
  | 'converted'
  | 'unsuccessful'
  | 'rejected';

export interface LeadProps {
  id: UUID;
  name: string;
  mobile: string;
  phone?: string | null;
  email?: string | null;
  status: LeadStatus;
  description?: string | null;
  followUpDate?: ISODateString | null;
  convertedCustomerId?: UUID | null;
  convertedAt?: ISO8601String | null;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export class Lead {
  private props: LeadProps;

  constructor(props: LeadProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidLeadError('نام سرنخ (مشتری بالقوه) الزامی است.');
    }
    if (!props.mobile || props.mobile.trim().length === 0) {
      throw new InvalidLeadError('شماره همراه سرنخ الزامی است.');
    }

    // Clean mobile
    const cleanedMobile = props.mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');

    this.props = {
      ...props,
      name: props.name.trim(),
      mobile: cleanedMobile
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

  public get email(): string | null | undefined {
    return this.props.email;
  }

  public get status(): LeadStatus {
    return this.props.status;
  }

  public get description(): string | null | undefined {
    return this.props.description;
  }

  public get followUpDate(): ISODateString | null | undefined {
    return this.props.followUpDate;
  }

  public get convertedCustomerId(): UUID | null | undefined {
    return this.props.convertedCustomerId;
  }

  public get convertedAt(): ISO8601String | null | undefined {
    return this.props.convertedAt;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public get updatedAt(): ISO8601String {
    return this.props.updatedAt;
  }

  public isConverted(): boolean {
    return this.props.status === 'converted';
  }

  public updateStatus(status: LeadStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date().toISOString();
  }

  public convertToCustomer(customerId: UUID): void {
    const now = new Date().toISOString();
    this.props.status = 'converted';
    this.props.convertedCustomerId = customerId;
    this.props.convertedAt = now;
    this.props.updatedAt = now;
  }

  public updateDetails(details: {
    name?: string;
    mobile?: string;
    phone?: string | null;
    email?: string | null;
    description?: string | null;
    followUpDate?: ISODateString | null;
  }): void {
    if (details.name !== undefined) {
      if (!details.name || details.name.trim().length === 0) {
        throw new InvalidLeadError('نام سرنخ نمی‌تواند خالی باشد.');
      }
      this.props.name = details.name.trim();
    }

    if (details.mobile !== undefined) {
      if (!details.mobile || details.mobile.trim().length === 0) {
        throw new InvalidLeadError('شماره همراه سرنخ نمی‌تواند خالی باشد.');
      }
      this.props.mobile = details.mobile.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');
    }

    if (details.phone !== undefined) this.props.phone = details.phone;
    if (details.email !== undefined) this.props.email = details.email;
    if (details.description !== undefined) this.props.description = details.description;
    if (details.followUpDate !== undefined) this.props.followUpDate = details.followUpDate;

    this.props.updatedAt = new Date().toISOString();
  }
}
