/**
 * Web-only notification facade (no-op in mock mode).
 * Keeps the same async API the task use cases expect; will be backed by a real
 * notification service once the backend exists. Silent failure is intentional —
 * the use cases fire-and-forget reminders.
 */
export class NotificationService {
  public static async scheduleTaskReminder(_taskId: string, _title: string, _dueDate: string): Promise<void> {
    // Mock mode: no local notifications
  }

  public static async cancelTaskReminder(_taskId: string): Promise<void> {
    // Mock mode: no local notifications
  }
}
