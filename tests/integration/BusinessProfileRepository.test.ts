import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqliteDriver } from '@/infrastructure/database/BetterSqliteDriver';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { SqliteBusinessProfileRepository } from '@/infrastructure/repositories/SqliteBusinessProfileRepository';
import { SqliteAppSettingsRepository } from '@/infrastructure/repositories/SqliteAppSettingsRepository';
import { BusinessProfile } from '@/domain/entities/BusinessProfile';
import { generateUUID } from '@/shared/utils/id';

describe('Business Profile & App Settings Repositories', () => {
  let driver: BetterSqliteDriver;
  let profileRepo: SqliteBusinessProfileRepository;
  let settingsRepo: SqliteAppSettingsRepository;

  beforeEach(async () => {
    driver = new BetterSqliteDriver(':memory:');
    const runner = new MigrationRunner(driver);
    await runner.run();

    profileRepo = new SqliteBusinessProfileRepository(driver);
    settingsRepo = new SqliteAppSettingsRepository(driver);
  });

  afterEach(async () => {
    await driver.close();
  });

  it('initially has no business profile', async () => {
    expect(await profileRepo.hasProfile()).toBe(false);
    expect(await profileRepo.getProfile()).toBeNull();
  });

  it('saves and retrieves business profile in SQLite', async () => {
    const now = new Date().toISOString();
    const profile = new BusinessProfile({
      id: generateUUID(),
      name: 'فروشگاه آذرخش',
      phone: '09121112233',
      address: 'تهران، بازار بزرگ',
      description: 'پخش لوازم الکترونیکی',
      createdAt: now,
      updatedAt: now
    });

    await profileRepo.saveProfile(profile);

    expect(await profileRepo.hasProfile()).toBe(true);

    const retrieved = await profileRepo.getProfile();
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe('فروشگاه آذرخش');
    expect(retrieved!.phone).toBe('09121112233');
    expect(retrieved!.address).toBe('تهران، بازار بزرگ');
  });

  it('updates an existing business profile cleanly', async () => {
    const now = new Date().toISOString();
    const profile = new BusinessProfile({
      id: generateUUID(),
      name: 'نام اولیه',
      createdAt: now,
      updatedAt: now
    });

    await profileRepo.saveProfile(profile);

    const loaded = (await profileRepo.getProfile())!;
    loaded.update({
      name: 'نام به‌روزرسانی‌شده',
      phone: '09998887766'
    });

    await profileRepo.saveProfile(loaded);

    const reloaded = (await profileRepo.getProfile())!;
    expect(reloaded.name).toBe('نام به‌روزرسانی‌شده');
    expect(reloaded.phone).toBe('09998887766');
  });

  it('manages app settings key-value store', async () => {
    // Check initial default settings from migration 001
    const currency = await settingsRepo.get('currency');
    expect(currency).toBe('Toman');

    const calendar = await settingsRepo.get('calendar');
    expect(calendar).toBe('Jalali');

    // Update setting
    await settingsRepo.set('theme', 'dark');
    expect(await settingsRepo.get('theme')).toBe('dark');

    // Get all settings
    const all = await settingsRepo.getAll();
    expect(all.theme).toBe('dark');
    expect(all.currency).toBe('Toman');
  });
});
