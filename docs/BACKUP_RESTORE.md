# Nexa CRM — Backup & Restore Specification

## 1. Overview
Because Nexa CRM has no cloud backend in V1, local backup and restore is the primary mechanism for disaster recovery and cross-device migration.

## 2. Backup Archive Structure
The backup file (`nexa_backup_YYYYMMDD_HHMMSS.nxbak`) contains a JSON envelope wrapping an authenticated, encrypted payload:

```json
{
  "magic": "NEXA_BACKUP",
  "version": 1,
  "appVersion": "1.0.0",
  "schemaVersion": 1,
  "createdAt": "2026-11-02T02:00:00Z",
  "kdf": {
    "algorithm": "PBKDF2-HMAC-SHA256",
    "iterations": 100000,
    "salt": "<base64_32_bytes>"
  },
  "cipher": {
    "algorithm": "AES-256-GCM",
    "iv": "<base64_12_bytes>",
    "authTag": "<base64_16_bytes>"
  },
  "payload": "<base64_encrypted_database_bytes>"
}
```

## 3. Strict 10-Step Safe Restore Protocol
To guarantee that user data is never corrupted or lost during a failed restore, the application executes the following 10 steps sequentially:

```mermaid
flowchart TD
    S1["1. Select Backup File"] --> S2["2. Validate Format & Magic Bytes"]
    S2 --> S3["3. User Enters Password / Derive Key"]
    S3 --> S4["4. Verify AES-GCM Integrity & Auth Tag"]
    S4 --> S5["5. Check Schema Version Compatibility"]
    S5 --> S6["6. Create Pre-Restore Safety Backup of Active DB"]
    S6 --> S7["7. Decrypt Payload into Temporary DB (restore_temp.db)"]
    S7 --> S8["8. Run PRAGMA integrity_check on Temporary DB"]
    S8 --> S9["9. Atomic File Swap: Replace active DB with restored DB"]
    S9 --> S10["10. Re-open DB Connection & Confirm Success"]
```

If **any** step fails:
- The active database is immediately preserved untouched.
- Any temporary database file is deleted.
- A descriptive error is returned to the user.
- Zero data loss occurs.

## 4. Retention Policy
- Automated daily backups keep:
  - 7 daily snapshots
  - 4 weekly snapshots
- Backups are stored in app-private storage, with an option to export/share via Android Sharesheet to Google Drive, Telegram, or external SD card.
