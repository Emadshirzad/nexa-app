import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqliteDriver } from '@/infrastructure/database/BetterSqliteDriver';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { SqliteLeadRepository } from '@/infrastructure/repositories/SqliteLeadRepository';
import { SqliteTaskRepository } from '@/infrastructure/repositories/SqliteTaskRepository';
import { SqliteCustomerRepository } from '@/infrastructure/repositories/SqliteCustomerRepository';
import { CreateLeadUseCase } from '@/application/use-cases/leads/CreateLeadUseCase';
import { UpdateLeadUseCase } from '@/application/use-cases/leads/UpdateLeadUseCase';
import { ConvertLeadToCustomerUseCase } from '@/application/use-cases/leads/ConvertLeadToCustomerUseCase';
import { CreateTaskUseCase } from '@/application/use-cases/tasks/CreateTaskUseCase';
import { CompleteTaskUseCase } from '@/application/use-cases/tasks/CompleteTaskUseCase';
import { UpdateTaskUseCase } from '@/application/use-cases/tasks/UpdateTaskUseCase';
import { AndroidNotificationService } from '@/infrastructure/notifications/AndroidNotificationService';

describe('Leads, Tasks and Notifications Integration', () => {
  let driver: BetterSqliteDriver;
  let leadRepo: SqliteLeadRepository;
  let taskRepo: SqliteTaskRepository;
  let customerRepo: SqliteCustomerRepository;

  let createLeadUseCase: CreateLeadUseCase;
  let updateLeadUseCase: UpdateLeadUseCase;
  let convertLeadToCustomerUseCase: ConvertLeadToCustomerUseCase;
  let createTaskUseCase: CreateTaskUseCase;
  let completeTaskUseCase: CompleteTaskUseCase;
  let updateTaskUseCase: UpdateTaskUseCase;

  beforeEach(async () => {
    driver = new BetterSqliteDriver(':memory:');
    const runner = new MigrationRunner(driver);
    await runner.run();

    leadRepo = new SqliteLeadRepository(driver);
    taskRepo = new SqliteTaskRepository(driver);
    customerRepo = new SqliteCustomerRepository(driver);

    createLeadUseCase = new CreateLeadUseCase(leadRepo);
    updateLeadUseCase = new UpdateLeadUseCase(leadRepo);
    convertLeadToCustomerUseCase = new ConvertLeadToCustomerUseCase(leadRepo, customerRepo, driver);
    createTaskUseCase = new CreateTaskUseCase(taskRepo);
    completeTaskUseCase = new CompleteTaskUseCase(taskRepo);
    updateTaskUseCase = new UpdateTaskUseCase(taskRepo);
  });

  afterEach(async () => {
    await driver.close();
  });

  describe('Lead Management & Conversion', () => {
    it('creates lead with cleaned mobile and allows status updates', async () => {
      const res = await createLeadUseCase.execute({
        name: 'سارا احمدی',
        mobile: '+98 935 999 8877',
        phone: '02122334455',
        description: 'علاقه‌مند به خرید عمده قهوه',
        followUpDate: '2026-11-05'
      });

      expect(res.success).toBe(true);
      if (!res.success) return;

      const lead = res.data;
      expect(lead.name).toBe('سارا احمدی');
      expect(lead.mobile).toBe('09359998877');
      expect(lead.status).toBe('new');

      // Update status to following_up
      const updateRes = await updateLeadUseCase.execute({
        id: lead.id,
        status: 'following_up'
      });
      expect(updateRes.success).toBe(true);

      const reloaded = await leadRepo.findById(lead.id);
      expect(reloaded?.status).toBe('following_up');
    });

    it('converts a lead into a customer atomically', async () => {
      // 1. Create a lead
      const leadRes = await createLeadUseCase.execute({
        name: 'کامران شایگان',
        mobile: '09123334455',
        phone: '02177889900',
        description: 'مذاکره اولیه نمایشگاه مواد غذایی'
      });
      const lead = leadRes.data!;

      // 2. Convert to customer
      const convertRes = await convertLeadToCustomerUseCase.execute({
        leadId: lead.id,
        address: 'تهران، خیابان شریعتی',
        tags: ['نمایشگاه']
      });

      expect(convertRes.success).toBe(true);
      if (!convertRes.success) return;

      const customer = convertRes.data;
      expect(customer.name).toBe('کامران شایگان');
      expect(customer.mobile).toBe('09123334455');
      expect(customer.address).toBe('تهران، خیابان شریعتی');

      // Verify lead is marked converted
      const updatedLead = await leadRepo.findById(lead.id);
      expect(updatedLead?.isConverted()).toBe(true);
      expect(updatedLead?.convertedCustomerId).toBe(customer.id);
      expect(updatedLead?.convertedAt).toBeDefined();

      // Repeated conversion returns the same customer idempotently
      const repeatedRes = await convertLeadToCustomerUseCase.execute({
        leadId: lead.id
      });
      expect(repeatedRes.success).toBe(true);
      if (!repeatedRes.success) return;
      expect(repeatedRes.data.id).toBe(customer.id);
    });
  });

  describe('Task Management', () => {
    it('creates task, updates details, and marks complete', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await createTaskUseCase.execute({
        title: 'تماس با مشتری برای پیش‌فاکتور',
        description: 'تأیید آدرس و شماره شبا',
        dueDate: today,
        priority: 'urgent'
      });

      expect(res.success).toBe(true);
      if (!res.success) return;

      const task = res.data;
      expect(task.priority).toBe('urgent');
      expect(task.status).toBe('pending');
      expect(task.isUrgent()).toBe(true);

      // Verify task appears in getPendingTasksDueToday
      const todayTasks = await taskRepo.getPendingTasksDueToday();
      expect(todayTasks.some((t) => t.id === task.id)).toBe(true);

      // Complete the task
      const completeRes = await completeTaskUseCase.execute({ id: task.id });
      expect(completeRes.success).toBe(true);

      const completedTask = await taskRepo.findById(task.id);
      expect(completedTask?.isCompleted()).toBe(true);
      expect(completedTask?.completedAt).toBeDefined();

      // No longer appears in pending tasks
      const pendingAfter = await taskRepo.getPendingTasksDueToday();
      expect(pendingAfter.some((t) => t.id === task.id)).toBe(false);

      // Reopen and update via UpdateTaskUseCase
      const updateRes = await updateTaskUseCase.execute({
        id: task.id,
        title: 'عنوان اصلاح‌شده وظیفه',
        priority: 'normal'
      });
      expect(updateRes.success).toBe(true);
      if (!updateRes.success) return;
      expect(updateRes.data.title).toBe('عنوان اصلاح‌شده وظیفه');
      expect(updateRes.data.priority).toBe('normal');
    });

    it('queries overdue tasks correctly', async () => {
      // Create an overdue task (yesterday)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      await createTaskUseCase.execute({
        title: 'وظیفه دیروز',
        dueDate: yesterday,
        priority: 'normal'
      });

      const overdue = await taskRepo.getOverdueTasks();
      expect(overdue.some((t) => t.title === 'وظیفه دیروز')).toBe(true);
    });
  });

  describe('Quiet Hours & Notification Service', () => {
    it('detects quiet hours correctly', () => {
      // 23:30 is in quiet hours (23 to 7)
      const night = new Date('2026-11-02T23:30:00');
      expect(AndroidNotificationService.isInQuietHours(night)).toBe(true);

      // 03:00 is in quiet hours
      const midNight = new Date('2026-11-02T03:00:00');
      expect(AndroidNotificationService.isInQuietHours(midNight)).toBe(true);

      // 14:00 is NOT in quiet hours
      const afternoon = new Date('2026-11-02T14:00:00');
      expect(AndroidNotificationService.isInQuietHours(afternoon)).toBe(false);
    });

    it('adjusts scheduled notification to morning if during quiet hours', () => {
      const night = new Date('2026-11-02T23:45:00');
      const adjusted = AndroidNotificationService.adjustForQuietHours(night);
      // Expected postponed to 08:00 next morning (2026-11-03)
      expect(adjusted.getHours()).toBe(8);
      expect(adjusted.getMinutes()).toBe(0);
      expect(adjusted.getDate()).toBe(night.getDate() + 1);

      // Daytime unaffected
      const daytime = new Date('2026-11-02T15:30:00');
      const unadjusted = AndroidNotificationService.adjustForQuietHours(daytime);
      expect(unadjusted.getTime()).toBe(daytime.getTime());
    });
  });
});
