# Nexa CRM — Application Update & Data Preservation Policy

## 1. Zero Data Loss Guarantee
Because Nexa CRM operates offline with no central server database, users must be able to install newer APKs directly over existing installations without losing business data or settings.

## 2. In-Place Update Protocol
1. **Identical Signing Key:** Every release APK must be signed with the exact same production release key. Mismatched signatures prevent Android package manager updates.
2. **Database Lifecycle on Launch:**
   - App checks `schema_migrations` table against registered migration scripts.
   - If pending migrations exist, a pre-migration safety copy `nexa_backup_pre_upgrade.db` is saved.
   - Migrations execute sequentially inside an atomic transaction.
   - Upon successful verification, normal app operation resumes.
3. **Rollback Contingency:**
   - If a migration fails on upgrade, the app aborts the schema change, restores `nexa_backup_pre_upgrade.db`, and presents a safe recovery screen directing the user to export their encrypted backup.
