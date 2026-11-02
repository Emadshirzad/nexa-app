const PIN_HASH_KEY = 'nexa_sec_pin_hash';
const PIN_SALT_KEY = 'nexa_sec_pin_salt';
const ITERATIONS = 100000;

// Mock-mode storage: browsers' localStorage. Same PBKDF2 hashing as before;
// will move to server-side auth when the backend is added.
const storage = {
  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable — session only
    }
  },
  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable
    }
  }
};

export class PinSecurityService {
  /**
   * Sets or updates the security PIN.
   * Derives a cryptographic hash using PBKDF2-HMAC-SHA256 with 100,000 iterations.
   */
  public static async setupPin(pin: string): Promise<boolean> {
    if (!pin || pin.length < 4 || pin.length > 6) {
      throw new Error('رمز عبور باید ۴ الی ۶ رقم باشد.');
    }

    const salt = crypto.getRandomValues(new Uint8Array(32));
    const saltBase64 = this.bufferToBase64(salt);
    const hash = await this.hashPin(pin, salt);
    const hashBase64 = this.bufferToBase64(hash);

    await storage.set(PIN_SALT_KEY, saltBase64);
    await storage.set(PIN_HASH_KEY, hashBase64);

    return true;
  }

  /**
   * Verifies the user provided PIN against the stored PBKDF2 hash.
   */
  public static async verifyPin(enteredPin: string): Promise<boolean> {
    const saltResValue = await storage.get(PIN_SALT_KEY);
    const hashResValue = await storage.get(PIN_HASH_KEY);

    if (!saltResValue || !hashResValue) {
      return false; // No PIN configured
    }

    const salt = this.base64ToBuffer(saltResValue);
    const expectedHash = this.base64ToBuffer(hashResValue);
    const actualHash = await this.hashPin(enteredPin, salt);

    return this.timingSafeEqual(new Uint8Array(actualHash), new Uint8Array(expectedHash));
  }

  /**
   * Checks whether a PIN has been set for the application.
   */
  public static async isPinSet(): Promise<boolean> {
    const hashResValue = await storage.get(PIN_HASH_KEY);
    return Boolean(hashResValue);
  }

  /**
   * Removes the active PIN.
   */
  public static async removePin(): Promise<void> {
    await storage.remove(PIN_SALT_KEY);
    await storage.remove(PIN_HASH_KEY);
  }

  private static async hashPin(pin: string, salt: Uint8Array): Promise<ArrayBuffer> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    return crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      256 // 256 bits = 32 bytes
    );
  }

  private static bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Constant-time comparison to guard against timing analysis attacks.
   */
  private static timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.byteLength !== b.byteLength) return false;
    let diff = 0;
    for (let i = 0; i < a.byteLength; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }
}
