# Nexa CRM — Database Schema Specification

## 1. Engine & General Conventions
- **Database Engine:** SQLite 3 with SQLCipher 256-bit AES encryption.
- **Foreign Keys:** Enabled via `PRAGMA foreign_keys = ON;`.
- **Primary Keys:** UUID (stored as TEXT, 36 chars, RFC 4122 v4).
- **Monetary Values:** Non-negative integers representing **Toman** (`INTEGER`). Floating-point types are strictly forbidden.
- **Stock Quantities:** Scaled integers with 3 decimal precision ($quantity \times 1000$, `INTEGER`).
- **Dates & Times:**
  - Event timestamps: ISO 8601 UTC string (`TEXT`, e.g. `2026-11-02T01:54:48Z`).
  - Calendar dates: Plain ISO date format (`TEXT`, e.g. `YYYY-MM-DD`).

---

## 2. Table Definitions

### 2.1 `business_profile`
Stores the single profile for the business.
```sql
CREATE TABLE business_profile (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### 2.2 `app_settings`
Configuration key-value store or singleton record.
```sql
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### 2.3 `categories`
Product classification categories.
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#10B981',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### 2.4 `products`
Catalog of products and services.
```sql
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    unit TEXT NOT NULL DEFAULT 'piece',
    selling_price INTEGER NOT NULL CHECK (selling_price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0, -- Scaled x1000
    min_stock_threshold INTEGER NOT NULL DEFAULT 0, -- Scaled x1000
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
```

### 2.5 `stock_movements`
Immutable audit ledger of all inventory fluctuations.
```sql
CREATE TABLE stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('initial', 'addition', 'deduction', 'adjustment', 'invoice_sale', 'invoice_cancellation')),
    quantity INTEGER NOT NULL, -- Scaled x1000, can be positive or negative
    reference_type TEXT,      -- e.g., 'invoice', 'manual_adjustment'
    reference_id TEXT,        -- e.g., invoice_id
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
```

### 2.6 `customers`
Customer contact records.
```sql
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    notes TEXT,
    follow_up_date TEXT, -- YYYY-MM-DD
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_customers_name ON customers(name);
```

### 2.7 `tags` and `customer_tags`
Tag taxonomy for customer categorization.
```sql
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#243746',
    created_at TEXT NOT NULL
);

CREATE TABLE customer_tags (
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (customer_id, tag_id)
);
```

### 2.8 `customer_notes`
Chronological customer log entries.
```sql
CREATE TABLE customer_notes (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_customer_notes_customer ON customer_notes(customer_id);
```

### 2.9 `invoices`
Sales invoice records.
```sql
CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_date TEXT NOT NULL, -- YYYY-MM-DD
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

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(status);
```

### 2.10 `invoice_items`
Item lines in an invoice with historical snapshots.
```sql
CREATE TABLE invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT NOT NULL,
    unit_snapshot TEXT NOT NULL,
    unit_price_snapshot INTEGER NOT NULL CHECK (unit_price_snapshot >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0), -- Scaled x1000
    discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total INTEGER NOT NULL CHECK (line_total >= 0),
    created_at TEXT NOT NULL
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);
```

### 2.11 `payments`
Payment transactions recorded against invoices or customer debt.
```sql
CREATE TABLE payments (
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

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

### 2.12 `leads` and `lead_activities`
Prospective customer pipeline.
```sql
CREATE TABLE leads (
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

CREATE TABLE lead_activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    note TEXT NOT NULL,
    follow_up_date TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_date);
CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);
```

### 2.13 `tasks`
Task tracking and notification scheduling.
```sql
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL, -- YYYY-MM-DD
    priority TEXT NOT NULL CHECK (priority IN ('normal', 'urgent')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    related_type TEXT CHECK (related_type IN ('customer', 'lead', 'invoice', NULL)),
    related_id TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_related ON tasks(related_type, related_id);
```

### 2.14 `expense_categories`, `expenses`, `other_incomes`
Operating financial flows.
```sql
CREATE TABLE expense_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#243746',
    created_at TEXT NOT NULL
);

CREATE TABLE expenses (
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

CREATE TABLE other_incomes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    income_date TEXT NOT NULL,
    description TEXT,
    payment_method TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### 2.15 `cash_transactions`
Single source of truth for global cash ledger.
```sql
CREATE TABLE cash_transactions (
    id TEXT PRIMARY KEY,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('opening_balance', 'invoice_payment', 'expense', 'other_income', 'adjustment')),
    amount INTEGER NOT NULL, -- Positive for influx, negative for outflow
    balance_after INTEGER NOT NULL,
    reference_type TEXT,    -- 'payment', 'expense', 'other_income'
    reference_id TEXT,
    description TEXT NOT NULL,
    transaction_date TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_cash_transactions_date ON cash_transactions(transaction_date);
CREATE INDEX idx_cash_transactions_ref ON cash_transactions(reference_type, reference_id);
```

### 2.16 `activities` and `schema_migrations`
```sql
CREATE TABLE activities (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT, -- JSON snapshot
    created_at TEXT NOT NULL
);

CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
);
```
