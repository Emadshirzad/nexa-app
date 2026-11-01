# Nexa CRM — Security Architecture & Threat Model

## 1. Security Architecture
Nexa CRM implements defense-in-depth on the local Android device:
1. **Application Lock Gate:**
   - Supports 4-to-6 digit numeric PIN and Biometric Authentication (Fingerprint / Face ID via Android BiometricPrompt).
   - Cryptographic salt and PBKDF2/Argon2 hashed PIN stored in secure preferences.
   - Automatic re-lock trigger on application backgrounding or after 15 minutes of inactivity.
2. **Database At-Rest Encryption:**
   - SQLite database encrypted via SQLCipher with 256-bit AES.
   - Master encryption key generated cryptographically on first run and safely stored in Android Keystore / encrypted preferences.
   - Zero plaintext keys stored in app assets or source code.
3. **Backup Protection:**
   - Standalone encrypted backup format using AES-256-GCM.
   - User-defined password acts as the key derivation source with high-iteration PBKDF2.

---

## 2. Threat Analysis & Mitigations

| Threat Vector | Severity | Mitigation Strategy |
|---|---|---|
| Unauthorized physical access to unlocked device | High | Mandatory PIN/Biometric lock screen with 15-minute timeout and automatic lock on app minimize. |
| Direct inspection of SQLite database via root/file manager | High | Full SQLCipher database encryption using hardware-backed Keystore key. |
| Corrupt or malicious backup archive injection | Critical | Cryptographic integrity tag (AES-GCM Auth Tag) verification before restoration; safe temporary database restoration with `PRAGMA integrity_check`. |
| Memory dumping of sensitive financial numbers | Medium | Clearing sensitive memory buffers upon lock screen activation. |
| Inadvertent data leakage through OS logs | Medium | Strict prohibition of financial values, customer PII, or raw passwords in `console.log` or Android logcat. |
