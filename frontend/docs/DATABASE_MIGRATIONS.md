# Nexa CRM — Database Migrations & Versioning Strategy

## 1. Migration Principles
1. **Forward-Only, Reversible:** Every schema change must be represented as a discrete, numbered SQL script or programmatic migration step.
2. **Atomic Execution:** Each migration runs inside an isolated SQLite transaction. If any statement fails, the transaction is rolled back immediately, leaving the database version unchanged.
3. **Tracking Ledger:** Applied migrations are recorded in the `schema_migrations` table:
   ```sql
   CREATE TABLE IF NOT EXISTS schema_migrations (
       version INTEGER PRIMARY KEY,
       name TEXT NOT NULL,
       applied_at TEXT NOT NULL
   );
   ```
4. **Pre-Migration Safety Backup:** Before executing any migration on an existing database during an app upgrade, an automated snapshot `nexa_pre_migration_{version}.db` is written to internal app cache storage.

---

## 2. Migration Registry

### Version 001: Initial Schema
- File: `001_initial_schema.sql`
- Description: Creates all 21 core tables, foreign key constraints, indexes, and initial settings records.
- Verification query:
  ```sql
  SELECT count(*) FROM sqlite_master WHERE type='table';
  ```
  Must equal 21 tables.

---

## 3. Migration Runner Algorithm
```typescript
export async function runMigrations(db: SQLiteDBConnection): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const currentVersionRes = await db.query(
    `SELECT MAX(version) as current_version FROM schema_migrations`
  );
  const currentVersion = currentVersionRes.values?.[0]?.current_version || 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await db.execute('BEGIN TRANSACTION;');
      try {
        await db.execute(migration.sql);
        await db.run(
          `INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)`,
          [migration.version, migration.name, new Date().toISOString()]
        );
        await db.execute('COMMIT;');
      } catch (err) {
        await db.execute('ROLLBACK;');
        throw new MigrationError(`Migration ${migration.version} failed: ${err}`);
      }
    }
  }
}
```
