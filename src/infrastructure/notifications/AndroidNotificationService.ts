import { LocalNotifications } from '@capacitor/local-notifications';
import type { Task } from '@/domain/entities/Task';
import type { UUID } from '@/shared/types/common';

export interface QuietHours {
  startHour: number; // e.g. 23 (11 PM)
  endHour: number; // e.g. 7 (7 AM)
}

export class AndroidNotificationService {
  private static readonly DEFAULT_QUIET_HOURS: QuietHours = {
    startHour: 23,
    endHour: 7
  };

  /**
   * Hashes a UUID into a 31-bit positive integer suitable for Android notification ID
   */
  public static hashId(uuid: string): number {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      hash = (hash << 5) - hash + uuid.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Checks if a given Date falls into quiet hours
   */
  public static isInQuietHours(
    date: Date,
    quietHours: QuietHours = this.DEFAULT_QUIET_HOURS
  ): boolean {
    const hours = date.getHours();
    if (quietHours.startHour > quietHours.endHour) {
      // Crosses midnight, e.g. 23:00 to 07:00
      return hours >= quietHours.startHour || hours < quietHours.endHour;
    }
    return hours >= quietHours.startHour && hours < quietHours.endHour;
  }

  /**
   * Postpones the notification date if it falls during quiet hours
   */
  public static adjustForQuietHours(
    scheduledDate: Date,
    quietHours: QuietHours = this.DEFAULT_QUIET_HOURS
  ): Date {
    if (!this.isInQuietHours(scheduledDate, quietHours)) {
      return scheduledDate;
    }

    const adjusted = new Date(scheduledDate);
    if (adjusted.getHours() >= quietHours.startHour) {
      // Moves to next day morning
      adjusted.setDate(adjusted.getDate() + 1);
    }
    adjusted.setHours(quietHours.endHour + 1, 0, 0, 0); // e.g. 08:00 AM
    return adjusted;
  }

  /**
   * Requests local notification permission if needed
   */
  public static async requestPermission(): Promise<boolean> {
    try {
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') {
        return true;
      }
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Schedules a reminder notification for a given task
   */
  public static async scheduleTaskReminder(task: Task, quietHours?: QuietHours): Promise<void> {
    try {
      if (task.isCompleted()) return;

      const dueDate = new Date(task.dueDate);
      if (isNaN(dueDate.getTime())) return;

      // Adjust for quiet hours
      const notifyAt = this.adjustForQuietHours(dueDate, quietHours || this.DEFAULT_QUIET_HOURS);
      if (notifyAt.getTime() <= Date.now()) {
        return; // Already in the past
      }

      const notifId = this.hashId(task.id);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: task.isUrgent() ? `⚠️ یادآوری فوری: ${task.title}` : `یادآوری: ${task.title}`,
            body: task.description || 'موعد انجام این وظیفه فرا رسیده است.',
            schedule: { at: notifyAt },
            sound: 'default'
          }
        ]
      });
    } catch {
      // Fallback in web/test environment
    }
  }

  /**
   * Cancels a scheduled task notification
   */
  public static async cancelTaskReminder(taskId: UUID): Promise<void> {
    try {
      const notifId = this.hashId(taskId);
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }]
      });
    } catch {
      // Fallback
    }
  }
}
