import { describe, it, expect, beforeEach } from 'vitest';
import { PinSecurityService } from '@/infrastructure/security/PinSecurityService';
import { Preferences } from '@capacitor/preferences';

describe('PIN Security Service (Cryptographic PBKDF2)', () => {
  beforeEach(async () => {
    await Preferences.clear();
  });

  it('correctly sets up and verifies a 4-digit PIN', async () => {
    expect(await PinSecurityService.isPinSet()).toBe(false);

    await PinSecurityService.setupPin('1234');
    expect(await PinSecurityService.isPinSet()).toBe(true);

    const isMatch = await PinSecurityService.verifyPin('1234');
    expect(isMatch).toBe(true);

    const isWrong = await PinSecurityService.verifyPin('9999');
    expect(isWrong).toBe(false);
  });

  it('rejects invalid PIN lengths', async () => {
    await expect(PinSecurityService.setupPin('12')).rejects.toThrow();
    await expect(PinSecurityService.setupPin('1234567')).rejects.toThrow();
  });

  it('removes PIN securely', async () => {
    await PinSecurityService.setupPin('4321');
    expect(await PinSecurityService.isPinSet()).toBe(true);

    await PinSecurityService.removePin();
    expect(await PinSecurityService.isPinSet()).toBe(false);
  });
});
