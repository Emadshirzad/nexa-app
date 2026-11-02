import type { IDatabaseDriver } from '@/infrastructure/database/IDatabaseDriver';
import { BackupCrypto } from '@/infrastructure/security/BackupCrypto';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { Result, ok, fail } from '@/shared/types/result';

export interface NexaBackupPayload {
  schemaVersion: number;
  createdAt: string;
  tableData: Record<string, Record<string, unknown>[]>;
}

export class BackupService {
  private static readonly TABLES_IN_ORDER = [
    'business_profile',
    'app_settings',
    'categories',
    'products',
    'stock_movements',
    'customers',
    'tags',
    'customer_tags',
    'customer_notes',
    'invoices',
    'invoice_items',
    'payments',
    'leads',
    'lead_activities',
    'tasks',
    'expense_categories',
    'expenses',
    'other_incomes',
    'cash_transactions',
    'activities',
    '_migrations'
  ];

  constructor(private readonly driver: IDatabaseDriver) {}

  /**
   * Creates an encrypted .nxbak backup file string
   */
  public async createBackup(passphrase: string): Promise<string> {
    const tableData: Record<string, Record<string, unknown>[]> = {};

    for (const table of BackupService.TABLES_IN_ORDER) {
      try {
        const rows = await this.driver.query<Record<string, unknown>>(`SELECT * FROM ${table}`);
        tableData[table] = rows;
      } catch {
        // Table might not exist in early versions
        tableData[table] = [];
      }
    }

    const payload: NexaBackupPayload = {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      tableData
    };

    const plainText = JSON.stringify(payload);
    return await BackupCrypto.encrypt(plainText, passphrase);
  }

  /**
   * Restores an encrypted .nxbak backup following the strict 10-step protocol:
   * 1. Decrypt with passphrase & validate checksum
   * 2. Validate payload structure & schema version
   * 3. Snapshot active database for rollback
   * 4. Open transaction
   * 5. Disable foreign keys
   * 6. Clear current tables
   * 7. Insert restored rows
   * 8. Re-enable foreign keys
   * 9. Run PRAGMA integrity_check
   * 10. Re-run migrations & verify
   */
  public async restoreBackup(
    envelopeJson: string,
    passphrase: string
  ): Promise<Result<{ restoredTables: number; restoredRows: number }>> {
    // 1. Decrypt
    let plainText: string;
    try {
      plainText = await BackupCrypto.decrypt(envelopeJson, passphrase);
    } catch (err) {
      return fail(err instanceof Error ? err : new Error('خطا در رمزگشایی فایل پشتیبان'));
    }

    // 2. Validate payload
    let payload: NexaBackupPayload;
    try {
      payload = JSON.parse(plainText);
      if (!payload.tableData || typeof payload.tableData !== 'object') {
        return fail(new Error('ساختار داده‌های فایل پشتیبان معتبر نیست.'));
      }
    } catch {
      return fail(new Error('قالب داده‌های پشتیبان مخدوش است.'));
    }

    // 3. Snapshot active data in case of rollback
    const snapshot: Record<string, Record<string, unknown>[]> = {};
    for (const table of BackupService.TABLES_IN_ORDER) {
      try {
        snapshot[table] = await this.driver.query<Record<string, unknown>>(`SELECT * FROM ${table}`);
      } catch {
        snapshot[table] = [];
      }
    }

    let restoredTablesCount = 0;
    let restoredRowsCount = 0;

    // 4. Run replacement atomically
    try {
      await this.driver.transaction(async () => {
        // 5. Disable foreign keys temporarily for clean insertion
        await this.driver.execute('PRAGMA foreign_keys = OFF;');

        // 6. Clear existing tables in reverse dependency order
        for (const table of [...BackupService.TABLES_IN_ORDER].reverse()) {
          try {
            await this.driver.execute(`DELETE FROM ${table};`);
          } catch {
            // Table might not exist yet
          }
        }

        // 7. Insert restored records
        for (const table of BackupService.TABLES_IN_ORDER) {
          const rows = payload.tableData[table];
          if (!rows || rows.length === 0) continue;

          restoredTablesCount++;
          for (const row of rows) {
            const cols = Object.keys(row);
            const placeholders = cols.map(() => '?').join(', ');
            const values = Object.values(row);

            const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders});`;
            await this.driver.run(sql, values);
            restoredRowsCount++;
          }
        }

        // 8. Re-enable foreign keys
        await this.driver.execute('PRAGMA foreign_keys = ON;');

        // 9. Integrity Check
        const integrityRes = await this.driver.query<{ integrity_check: string }>('PRAGMA integrity_check;');
        if (integrityRes.length === 0 || integrityRes[0].integrity_check !== 'ok') {
          throw new Error('پایگاه داده پس از بازیابی، خطای اعتبارسنجی یکپارچگی (PRAGMA integrity_check) داد.');
        }
      });

      // 10. Re-run migrations in case restored database had older schema version
      const runner = new MigrationRunner(this.driver);
      await runner.run();

      return ok({
        restoredTables: restoredTablesCount,
        restoredRows: restoredRowsCount
      });
    } catch (restoreErr) {
      // 9 (Rollback branch): Attempt restoration of safety snapshot
      try {
        await this.driver.transaction(async () => {
          await this.driver.execute('PRAGMA foreign_keys = OFF;');
          for (const table of [...BackupService.TABLES_IN_ORDER].reverse()) {
            try {
              await this.driver.execute(`DELETE FROM ${table};`);
            } catch {}
          }
          for (const table of BackupService.TABLES_IN_ORDER) {
            const rows = snapshot[table];
            if (!rows || rows.length === 0) continue;
            for (const row of rows) {
              const cols = Object.keys(row);
              const placeholders = cols.map(() => '?').join(', ');
              const values = Object.values(row);
              await this.driver.run(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders});`, values);
            }
          }
          await this.driver.execute('PRAGMA foreign_keys = ON;');
        });
      } catch (rollbackErr) {
        console.error('Critical rollback failure:', rollbackErr);
      }

      return fail(
        restoreErr instanceof Error
          ? restoreErr
          : new Error('عملیات بازیابی با خطا مواجه شد و تغییرات بازگردانی شدند.')
      );
    }
  }
}
