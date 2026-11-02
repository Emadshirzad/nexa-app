import { z } from 'zod';
import type { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { AndroidNotificationService } from '@/infrastructure/notifications/AndroidNotificationService';
import { Result, ok, fail } from '@/shared/types/result';
import type { UUID } from '@/shared/types/common';
import type { Task } from '@/domain/entities/Task';

export const CompleteTaskSchema = z.object({
  id: z.string().uuid()
});

export type CompleteTaskDTO = z.input<typeof CompleteTaskSchema>;

export class CompleteTaskUseCase {
  private readonly taskRepo: ITaskRepository;

  constructor(taskRepo: ITaskRepository) {
    this.taskRepo = taskRepo;
  }

  public async execute(dto: CompleteTaskDTO): Promise<Result<Task, string>> {
    const parseRes = CompleteTaskSchema.safeParse(dto);
    if (!parseRes.success) {
      return fail(parseRes.error.errors.map((e) => e.message).join('، '));
    }

    try {
      const task = await this.taskRepo.findById(dto.id as UUID);
      if (!task) {
        return fail('وظیفه مورد نظر یافت نشد.');
      }

      task.complete();
      await this.taskRepo.save(task);

      // Cancel any pending notification
      AndroidNotificationService.cancelTaskReminder(task.id).catch(() => {});

      return ok(task);
    } catch (err) {
      return fail(`خطا در ثبت انجام وظیفه: ${String(err)}`);
    }
  }
}
