import { z } from 'zod';
import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { Task, type TaskPriority, type TaskStatus, type TaskRelatedType } from '@/domain/entities/Task';
import { NotificationService } from '@/infrastructure/notifications/NotificationService';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';

export const UpdateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(500).nullable().optional(),
  dueDate: z.string().min(1).optional(),
  priority: z.enum(['normal', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  relatedType: z.enum(['customer', 'lead', 'invoice']).nullable().optional(),
  relatedId: z.string().uuid().nullable().optional()
});

export type UpdateTaskDTO = z.input<typeof UpdateTaskSchema>;

export class UpdateTaskUseCase {
  private readonly taskRepo: ITaskRepository;

  constructor(taskRepo: ITaskRepository) {
    this.taskRepo = taskRepo;
  }

  public async execute(dto: UpdateTaskDTO): Promise<Result<Task, string>> {
    const parseRes = UpdateTaskSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    try {
      const task = await this.taskRepo.findById(dto.id as UUID);
      if (!task) {
        return fail('وظیفه مورد نظر یافت نشد.');
      }

      task.updateDetails({
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate,
        priority: dto.priority as TaskPriority,
        status: dto.status as TaskStatus,
        relatedType: (dto.relatedType as TaskRelatedType) ?? undefined,
        relatedId: (dto.relatedId as UUID) ?? undefined
      });

      await this.taskRepo.save(task);

      if (task.isCompleted()) {
        NotificationService.cancelTaskReminder(task.id).catch(() => {});
      } else {
        NotificationService.scheduleTaskReminder(task.id, task.title, task.dueDate).catch(() => {});
      }

      return ok(task);
    } catch (err) {
      return fail(`خطا در به‌روزرسانی وظیفه: ${String(err)}`);
    }
  }
}
