import { useUIStore } from '@/presentation/stores/uiStore';
import { PinSecurityService } from './PinSecurityService';

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export class InactivityTimer {
  private static timerId: ReturnType<typeof setTimeout> | null = null;
  private static isInitialized = false;

  public static async init(timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Attach activity listeners
    const resetActivity = () => this.resetTimer(timeoutMs);

    window.addEventListener('touchstart', resetActivity, { passive: true });
    window.addEventListener('mousedown', resetActivity, { passive: true });
    window.addEventListener('keydown', resetActivity, { passive: true });

    this.resetTimer(timeoutMs);
  }

  private static resetTimer(timeoutMs: number): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    this.timerId = setTimeout(async () => {
      const isPinConfigured = await PinSecurityService.isPinSet();
      if (isPinConfigured) {
        const uiStore = useUIStore();
        uiStore.lockApp();
      }
    }, timeoutMs);
  }
}
