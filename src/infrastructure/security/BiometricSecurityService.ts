import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: BiometryType;
  reason?: string;
}

export class BiometricSecurityService {
  /**
   * Checks whether biometric hardware (Fingerprint, Face unlock) is available and enrolled.
   */
  public static async checkAvailability(): Promise<BiometricStatus> {
    if (!Capacitor.isNativePlatform()) {
      return {
        isAvailable: false,
        biometryType: BiometryType.none,
        reason: 'بستر وب / شبیه‌ساز فاقد سنسور بیومتریک است'
      };
    }

    try {
      const info = await BiometricAuth.checkBiometry();
      return {
        isAvailable: info.isAvailable,
        biometryType: info.biometryType,
        reason: info.reason
      };
    } catch (err) {
      return {
        isAvailable: false,
        biometryType: BiometryType.none,
        reason: String(err)
      };
    }
  }

  /**
   * Triggers the native Android BiometricPrompt.
   */
  public static async authenticate(
    title: string = 'احراز هویت بیومتریک نکسا',
    subtitle: string = 'برای ورود، اثر انگشت خود را روی حسگر قرار دهید'
  ): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true; // Auto-pass in browser dev mode
    }

    try {
      await BiometricAuth.authenticate({
        reason: subtitle,
        cancelTitle: 'انصراف',
        allowDeviceCredential: true,
        iosFallbackTitle: 'استفاده از رمز عبور',
        androidTitle: title,
        androidSubtitle: subtitle
      });
      return true;
    } catch {
      return false;
    }
  }
}
