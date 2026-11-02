import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqliteDriver } from '@/infrastructure/database/BetterSqliteDriver';
import { MigrationRunner } from '@/infrastructure/migrations/MigrationRunner';
import { SqliteCustomerRepository } from '@/infrastructure/repositories/SqliteCustomerRepository';
import { CreateCustomerUseCase } from '@/application/use-cases/customers/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '@/application/use-cases/customers/UpdateCustomerUseCase';
import { ArchiveCustomerUseCase } from '@/application/use-cases/customers/ArchiveCustomerUseCase';

describe('Customer Management & Debt Ledger Vertical Slice', () => {
  let driver: BetterSqliteDriver;
  let customerRepo: SqliteCustomerRepository;
  let createCustomerUseCase: CreateCustomerUseCase;
  let updateCustomerUseCase: UpdateCustomerUseCase;
  let archiveCustomerUseCase: ArchiveCustomerUseCase;

  beforeEach(async () => {
    driver = new BetterSqliteDriver(':memory:');
    const runner = new MigrationRunner(driver);
    await runner.run();

    customerRepo = new SqliteCustomerRepository(driver);
    createCustomerUseCase = new CreateCustomerUseCase(customerRepo);
    updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo);
    archiveCustomerUseCase = new ArchiveCustomerUseCase(customerRepo);
  });

  afterEach(async () => {
    await driver.close();
  });

  it('creates customer with cleaned mobile, tags, and initial note', async () => {
    const res = await createCustomerUseCase.execute({
      name: 'محسن کریمی',
      mobile: '+98 912 345 6789',
      phone: '02188776655',
      address: 'تهران، میدان ونک',
      notes: 'مشتری قدیمی و معتبر',
      tags: ['عمده‌فروش', 'تهران']
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    const customer = res.data;
    expect(customer.name).toBe('محسن کریمی');
    expect(customer.mobile).toBe('09123456789'); // Normalized
    expect(customer.tags).toContain('عمده‌فروش');
    expect(customer.tags).toContain('تهران');

    // Verify notes saved
    const notes = await customerRepo.getNotes(customer.id);
    expect(notes.length).toBe(1);
    expect(notes[0].content).toBe('مشتری قدیمی و معتبر');
  });

  it('strictly rejects duplicate mobile numbers', async () => {
    const firstRes = await createCustomerUseCase.execute({
      name: 'مشتری اول',
      mobile: '09121112233',
      tags: []
    });
    expect(firstRes.success).toBe(true);

    // Try creating another customer with identical mobile
    const dupRes = await createCustomerUseCase.execute({
      name: 'مشتری دوم با همان شماره',
      mobile: '09121112233',
      tags: []
    });

    expect(dupRes.success).toBe(false);
    expect(dupRes.error).toContain('قبلاً با نام "مشتری اول" ثبت شده است');
  });

  it('updates customer details and syncs tags', async () => {
    const createRes = await createCustomerUseCase.execute({
      name: 'رضا کمالی',
      mobile: '09351234567',
      tags: ['خرده‌فروش']
    });
    if (!createRes.success) return;
    const customer = createRes.data;

    const updateRes = await updateCustomerUseCase.execute({
      id: customer.id,
      name: 'رضا کمالی تبریزی',
      mobile: '09351234567',
      address: 'تبریز، خیابان امام',
      tags: ['خرده‌فروش', 'تبریز']
    });

    expect(updateRes.success).toBe(true);

    const reloaded = await customerRepo.findById(customer.id);
    expect(reloaded?.name).toBe('رضا کمالی تبریزی');
    expect(reloaded?.address).toBe('تبریز، خیابان امام');
    expect(reloaded?.tags).toContain('تبریز');
  });

  it('searches customers by name, mobile, and tag filter', async () => {
    await createCustomerUseCase.execute({
      name: 'حسین احمدی',
      mobile: '09141112233',
      tags: ['ویژه']
    });
    await createCustomerUseCase.execute({
      name: 'جواد رضایی',
      mobile: '09159998877',
      tags: ['عادی']
    });

    // Search by partial name
    const byName = await customerRepo.search('احمدی');
    expect(byName.length).toBe(1);
    expect(byName[0].name).toBe('حسین احمدی');

    // Search by partial mobile
    const byMobile = await customerRepo.search('99988');
    expect(byMobile.length).toBe(1);
    expect(byMobile[0].name).toBe('جواد رضایی');

    // Filter by tag
    const byTag = await customerRepo.search('', 'ویژه');
    expect(byTag.length).toBe(1);
    expect(byTag[0].name).toBe('حسین احمدی');
  });

  it('archives customer', async () => {
    const createRes = await createCustomerUseCase.execute({
      name: 'مشتری موقت',
      mobile: '09190001122',
      tags: []
    });
    if (!createRes.success) return;
    const customer = createRes.data;

    await archiveCustomerUseCase.execute(customer.id);

    const activeList = await customerRepo.listAll(false);
    expect(activeList.some((c) => c.id === customer.id)).toBe(false);

    const fullList = await customerRepo.listAll(true);
    expect(fullList.some((c) => c.id === customer.id)).toBe(true);
  });
});
