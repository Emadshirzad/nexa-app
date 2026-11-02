import type { Migration } from './Migration';
import type { IDatabaseDriver } from '../database/IDatabaseDriver';

export const migration001: Migration = {
  version: 1,
  name: '001_initial_schema',
  up: async (driver: IDatabaseDriver): Promise<void> => {
    // 1. Business Profile
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS business_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 2. App Settings
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 3. Categories
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#10B981',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 4. Products
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        unit TEXT NOT NULL DEFAULT 'piece',
        selling_price INTEGER NOT NULL CHECK (selling_price >= 0),
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        min_stock_threshold INTEGER NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    `);

    // 5. Stock Movements (Immutable Ledger)
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        movement_type TEXT NOT NULL CHECK (movement_type IN ('initial', 'addition', 'deduction', 'adjustment', 'invoice_sale', 'invoice_cancellation')),
        quantity INTEGER NOT NULL,
        reference_type TEXT,
        reference_id TEXT,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
    `);

    // 6. Customers
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL UNIQUE,
        phone TEXT,
        address TEXT,
        notes TEXT,
        follow_up_date TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    `);

    // 7 & 8. Tags & Customer Tags
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#243746',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customer_tags (
        customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (customer_id, tag_id)
      );
    `);

    // 9. Customer Notes
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS customer_notes (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);
    `);

    // 10. Invoices
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
        invoice_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'cancelled')),
        subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
        item_discount_total INTEGER NOT NULL DEFAULT 0 CHECK (item_discount_total >= 0),
        invoice_discount INTEGER NOT NULL DEFAULT 0 CHECK (invoice_discount >= 0),
        final_amount INTEGER NOT NULL DEFAULT 0 CHECK (final_amount >= 0),
        paid_amount INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
        outstanding_debt INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        issued_at TEXT,
        cancelled_at TEXT,
        cancellation_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    `);

    // 11. Invoice Items
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
        product_name_snapshot TEXT NOT NULL,
        sku_snapshot TEXT NOT NULL,
        unit_snapshot TEXT NOT NULL,
        unit_price_snapshot INTEGER NOT NULL CHECK (unit_price_snapshot >= 0),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
        line_total INTEGER NOT NULL CHECK (line_total >= 0),
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);
    `);

    // 12. Payments
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        invoice_id TEXT REFERENCES invoices(id) ON DELETE RESTRICT,
        customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
        amount INTEGER NOT NULL CHECK (amount > 0),
        payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card_transfer', 'pos', 'bank_transfer', 'other')),
        payment_date TEXT NOT NULL,
        reference_number TEXT,
        notes TEXT,
        is_voided INTEGER NOT NULL DEFAULT 0,
        voided_at TEXT,
        void_reason TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
    `);

    // 13 & 14. Leads & Lead Activities
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        status TEXT NOT NULL CHECK (status IN ('new', 'following_up', 'interested', 'converted', 'unsuccessful', 'rejected')),
        description TEXT,
        follow_up_date TEXT,
        converted_customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
        converted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lead_activities (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        note TEXT NOT NULL,
        follow_up_date TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date);
      CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
    `);

    // 15. Tasks
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        priority TEXT NOT NULL CHECK (priority IN ('normal', 'urgent')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
        related_type TEXT CHECK (related_type IN ('customer', 'lead', 'invoice', NULL)),
        related_id TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_related ON tasks(related_type, related_id);
    `);

    // 16, 17, 18. Expenses & Other Incomes
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#243746',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        category_id TEXT REFERENCES expense_categories(id) ON DELETE RESTRICT,
        title TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK (amount > 0),
        expense_date TEXT NOT NULL,
        description TEXT,
        payment_method TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS other_incomes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK (amount > 0),
        income_date TEXT NOT NULL,
        description TEXT,
        payment_method TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 19. Cash Transactions (Global Cash Ledger)
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS cash_transactions (
        id TEXT PRIMARY KEY,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('opening_balance', 'invoice_payment', 'expense', 'other_income', 'adjustment')),
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        reference_type TEXT,
        reference_id TEXT,
        description TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_cash_transactions_ref ON cash_transactions(reference_type, reference_id);
    `);

    // 20. Activities (Audit Log)
    await driver.execute(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // Initial default settings
    await driver.run(`
      INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES
      ('currency', 'Toman', datetime('now')),
      ('calendar', 'Jalali', datetime('now')),
      ('language', 'fa-IR', datetime('now')),
      ('theme', 'system', datetime('now')),
      ('lock_timeout_minutes', '15', datetime('now'));
    `);

    // Initial default categories
    await driver.run(`
      INSERT OR IGNORE INTO categories (id, name, color, is_active, created_at, updated_at) VALUES
      ('cat-general', 'عمومی', '#10B981', 1, datetime('now'), datetime('now'));
    `);

    // Initial default expense categories
    await driver.run(`
      INSERT OR IGNORE INTO expense_categories (id, name, color, created_at) VALUES
      ('exp-general', 'هزینه‌های عمومی', '#243746', datetime('now')),
      ('exp-rent', 'اجاره و شارژ', '#3D5E7A', datetime('now')),
      ('exp-salary', 'حقوق و دستمزد', '#10B981', datetime('now'));
    `);
  }
};
