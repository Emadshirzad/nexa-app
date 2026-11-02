import { z } from 'zod';
import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { Task, type TaskPriority, type TaskStatus, type TaskRelatedType } from '@/domain/entities/Task';
import { NotificationService } from '@/infrastructure/notifications/NotificationService';
import { generateUUID } from '@/shared/utils/id';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'عنوان وظیفه الزامی است.').max(150),
  description: z.string().max(500).nullable().optional(),
  dueDate: z.string().min(1, 'تاریخ موعد الزامی است.'), // YYYY-MM-DD or YYYY-MM-DD HH:mm
  priority: z.enum(['normal', 'urgent']).default('normal'),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  relatedType: z.enum(['customer', 'lead', 'invoice']).nullable().optional(),
  relatedId: z.string().uuid().nullable().optional()
});

export type CreateTaskDTO = z.input<typeof CreateTaskSchema>;

export class CreateTaskUseCase {
  private readonly taskRepo: ITaskRepository;

  constructor(taskRepo: ITaskRepository) {
    this.taskRepo = taskRepo;
  }

  public async execute(dto: CreateTaskDTO): Promise<Result<Task, string>> {
    const parseRes = CreateTaskSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    const input = parseRes.data;

    try {
      const now = new Date().toISOString();
      const task = new Task({
        id: generateUUID(),
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        priority: input.priority as TaskPriority,
        status: input.status as TaskStatus,
        relatedType: (input.relatedType as TaskRelatedType) || null,
        relatedId: (input.relatedId as UUID) || null,
        createdAt: now,
        updatedAt: now
      });

      await this.taskRepo.save(task);

      // Schedule local notification asynchronously
      NotificationService.scheduleTaskReminder(task.id, task.title, task.dueDate).catch(() => {});

      return ok(task);
    } catch (err) {
      return fail(`خطا در ایجاد وظیفه: ${String(err)}`);
    }
  }
}
