import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { Task, type TaskPriority, type TaskStatus, type TaskRelatedType } from '@/domain/entities/Task';
import { ApiClient } from './ApiClient';
import type { UUID, ISODateString } from '@/shared/types/common';

export class ApiTaskRepository implements ITaskRepository {
  private api = ApiClient.getInstance();

  private toDomain(data: any): Task {
    return new Task({
      id: data.id as UUID,
      title: data.title,
      description: data.description ?? undefined,
      dueDate: data.due_date,
      priority: (data.priority as TaskPriority) || 'normal',
      status: (data.status as TaskStatus) || 'pending',
      relatedType: (data.related_type as TaskRelatedType) || undefined,
      relatedId: (data.related_id as UUID) || undefined,
      completedAt: data.completed_at ?? undefined,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    });
  }

  public async findById(id: UUID): Promise<Task | null> {
    try {
      const data = await this.api.get<any>(`/tasks/${id}`);
      return data ? this.toDomain(data) : null;
    } catch {
      return null;
    }
  }

  public async listAll(options?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: ISODateString;
    relatedType?: string;
    relatedId?: UUID;
    limit?: number;
  }): Promise<Task[]> {
    const res = await this.api.get<any>('/tasks', {
      status: options?.status,
      priority: options?.priority,
      due_date: options?.dueDate,
      related_type: options?.relatedType,
      related_id: options?.relatedId,
      limit: options?.limit,
      all: !options?.limit
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async getPendingTasksDueToday(): Promise<Task[]> {
    const res = await this.api.get<any>('/tasks', {
      due_today: 1,
      all: true
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async getOverdueTasks(): Promise<Task[]> {
    const res = await this.api.get<any>('/tasks', {
      overdue: 1,
      all: true
    });
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => this.toDomain(item));
  }

  public async save(task: Task): Promise<void> {
    const payload = {
      title: task.title,
      description: task.description ?? null,
      due_date: task.dueDate,
      priority: task.priority,
      status: task.status,
      related_type: task.relatedType ?? null,
      related_id: task.relatedId ?? null,
      completed_at: task.completedAt ?? null
    };

    try {
      const existing = await this.findById(task.id);
      if (existing) {
        await this.api.put(`/tasks/${task.id}`, payload);
      } else {
        await this.api.post('/tasks', { id: task.id, ...payload });
      }
    } catch {
      await this.api.post('/tasks', { id: task.id, ...payload });
    }
  }

  public async delete(id: UUID): Promise<void> {
    await this.api.delete(`/tasks/${id}`);
  }
}
