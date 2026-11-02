/**
 * Nexa CRM Backup Cryptography Module
 * AES-256-GCM + PBKDF2 (100,000 iterations) key derivation
 */

export interface BackupEnvelope {
  magic: 'NEXA_BACKUP_V1';
  appVersion: string;
  createdAt: string;
  salt: string;       // Base64
  iv: string;         // Base64
  ciphertext: string; // Base64
  checksum: string;   // Hex SHA-256
}

export class BackupCrypto {
  private static readonly ITERATIONS = 100000;

  private static uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToUint8(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: BackupCrypto.ITERATIONS,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts plaintext JSON data into a .nxbak envelope
   */
  public static async encrypt(plainTextJson: string, passphrase: string, appVersion = '1.0.0'): Promise<string> {
    if (!passphrase || passphrase.length < 4) {
      throw new Error('رمز عبور پشتیبان باید حداقل ۴ کاراکتر باشد.');
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);

    const enc = new TextEncoder();
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainTextJson)
    );

    const cipherBytes = new Uint8Array(cipherBuffer);

    // Compute SHA-256 checksum of ciphertext
    const hashBuffer = await crypto.subtle.digest('SHA-256', cipherBuffer);
    const hashBytes = new Uint8Array(hashBuffer);
    const checksum = Array.from(hashBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

    const envelope: BackupEnvelope = {
      magic: 'NEXA_BACKUP_V1',
      appVersion,
      createdAt: new Date().toISOString(),
      salt: this.uint8ToBase64(salt),
      iv: this.uint8ToBase64(iv),
      ciphertext: this.uint8ToBase64(cipherBytes),
      checksum
    };

    return JSON.stringify(envelope, null, 2);
  }

  /**
   * Decrypts a .nxbak envelope string back into plaintext JSON
   */
  public static async decrypt(envelopeJson: string, passphrase: string): Promise<string> {
    if (!passphrase) {
      throw new Error('رمز عبور الزامی است.');
    }

    let envelope: BackupEnvelope;
    try {
      envelope = JSON.parse(envelopeJson);
    } catch {
      throw new Error('قالب فایل پشتیبان نامعتبر است.');
    }

    if (envelope.magic !== 'NEXA_BACKUP_V1') {
      throw new Error('فایل انتخاب‌شده یک فایل پشتیبان معتبر نکسا نیست.');
    }

    const salt = this.base64ToUint8(envelope.salt);
    const iv = this.base64ToUint8(envelope.iv);
    const cipherBytes = this.base64ToUint8(envelope.ciphertext);

    // Verify SHA-256 Checksum
    const hashBuffer = await crypto.subtle.digest('SHA-256', cipherBytes);
    const hashBytes = new Uint8Array(hashBuffer);
    const currentChecksum = Array.from(hashBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

    if (currentChecksum !== envelope.checksum) {
      throw new Error('فایل پشتیبان دستکاری شده یا آسیب دیده است (خطای اعتبارسنجی Checksum).');
    }

    const key = await this.deriveKey(passphrase, salt);

    try {
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherBytes
      );
      const dec = new TextDecoder();
      return dec.decode(plainBuffer);
    } catch {
      throw new Error('رمز عبور وارد شده نادرست است یا فایل آسیب دیده است.');
    }
  }
}
