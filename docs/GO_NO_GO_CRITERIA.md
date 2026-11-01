# Nexa CRM — Go / No-Go Decision Criteria

## 1. Release Gate Criteria

| Category | Gate Requirement | Minimum Threshold | Status |
|---|---|---|---|
| **Data Integrity** | Zero data corruption or loss on app crash/kill | 100% Pass | Mandatory |
| **Financial Accuracy** | Zero rounding errors; exact integer Toman ledger | 100% Pass | Mandatory |
| **Inventory Ledger** | Product cache reconciles 100% with stock movements | 100% Pass | Mandatory |
| **Cancellation** | Cancellation restores stock exactly once; idempotent | 100% Pass | Mandatory |
| **Backup & Restore** | Encrypted round-trip restore verified with full checksum parity | 100% Pass | Mandatory |
| **Persian Typography** | Zero broken Persian ligatures or disconnected letters in PDF | 100% Pass | Mandatory |
| **Security** | Database encrypted at rest; PIN/Biometric lock operational | 100% Pass | Mandatory |
| **Compatibility** | Verified functional on Android 9.0 (API 28) and modern Android | 100% Pass | Mandatory |
| **Defect Threshold** | Open P0 (Critical) defects | 0 | Mandatory |
| **Defect Threshold** | Open P1 (Major) defects | 0 | Mandatory |
| **Defect Threshold** | Open P2 (Medium) defects | $\le 3$ (with workaround) | Acceptable |

## 2. Decision Protocol
Every production release must have a formal sign-off document listing:
- Build Version Name & Version Code
- Git commit hash
- SHA-256 checksum of the signed APK
- Test execution report summary
- Final sign-off: **GO** (Ready for distribution) or **NO-GO** (Blocked)
