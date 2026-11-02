import type { UUID, ISODateString } from '@/shared/types/common';
import type { Task, TaskStatus, TaskPriority } from '../entities/Task';

export interface ITaskRepository {
  save(task: Task): Promise<void>;
  findById(id: UUID): Promise<Task | null>;
  listAll(options?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: ISODateString;
    relatedType?: string;
    relatedId?: UUID;
    limit?: number;
  }): Promise<Task[]>;
  getPendingTasksDueToday(): Promise<Task[]>;
  getOverdueTasks(): Promise<Task[]>;
  delete(id: UUID): Promise<void>;
}
