import type { UUID, ISO8601String, ISODateString } from '@/shared/types/common';
import { DomainError } from '../errors/DomainError';

export class InvalidTaskError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTaskError';
  }
}

export type TaskPriority = 'normal' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskRelatedType = 'customer' | 'lead' | 'invoice' | null;

export interface TaskProps {
  id: UUID;
  title: string;
  description?: string | null;
  dueDate: ISODateString; // YYYY-MM-DD or YYYY-MM-DD HH:mm
  priority: TaskPriority;
  status: TaskStatus;
  relatedType?: TaskRelatedType;
  relatedId?: UUID | null;
  completedAt?: ISO8601String | null;
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

export class Task {
  private props: TaskProps;

  constructor(props: TaskProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new InvalidTaskError('عنوان وظیفه الزامی است.');
    }
    if (!props.dueDate) {
      throw new InvalidTaskError('تاریخ موعد وظیفه الزامی است.');
    }

    this.props = {
      ...props,
      title: props.title.trim()
    };
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get title(): string {
    return this.props.title;
  }

  public get description(): string | null | undefined {
    return this.props.description;
  }

  public get dueDate(): ISODateString {
    return this.props.dueDate;
  }

  public get priority(): TaskPriority {
    return this.props.priority;
  }

  public get status(): TaskStatus {
    return this.props.status;
  }

  public get relatedType(): TaskRelatedType | undefined {
    return this.props.relatedType;
  }

  public get relatedId(): UUID | null | undefined {
    return this.props.relatedId;
  }

  public get completedAt(): ISO8601String | null | undefined {
    return this.props.completedAt;
  }

  public get createdAt(): ISO8601String {
    return this.props.createdAt;
  }

  public get updatedAt(): ISO8601String {
    return this.props.updatedAt;
  }

  public isCompleted(): boolean {
    return this.props.status === 'completed';
  }

  public isUrgent(): boolean {
    return this.props.priority === 'urgent';
  }

  public complete(): void {
    const now = new Date().toISOString();
    this.props.status = 'completed';
    this.props.completedAt = now;
    this.props.updatedAt = now;
  }

  public reopen(): void {
    const now = new Date().toISOString();
    this.props.status = 'pending';
    this.props.completedAt = null;
    this.props.updatedAt = now;
  }

  public updateDetails(details: {
    title?: string;
    description?: string | null;
    dueDate?: ISODateString;
    priority?: TaskPriority;
    status?: TaskStatus;
    relatedType?: TaskRelatedType;
    relatedId?: UUID | null;
  }): void {
    if (details.title !== undefined) {
      if (!details.title || details.title.trim().length === 0) {
        throw new InvalidTaskError('عنوان وظیفه نمی‌تواند خالی باشد.');
      }
      this.props.title = details.title.trim();
    }
    if (details.description !== undefined) this.props.description = details.description;
    if (details.dueDate !== undefined) this.props.dueDate = details.dueDate;
    if (details.priority !== undefined) this.props.priority = details.priority;
    if (details.status !== undefined) this.props.status = details.status;
    if (details.relatedType !== undefined) this.props.relatedType = details.relatedType;
    if (details.relatedId !== undefined) this.props.relatedId = details.relatedId;

    this.props.updatedAt = new Date().toISOString();
  }
}
