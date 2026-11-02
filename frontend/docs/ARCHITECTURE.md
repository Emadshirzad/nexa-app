# Nexa CRM — Software Architecture Document

## 1. Architectural Style: Clean Architecture & DDD

Nexa CRM is structured strictly around **Clean Architecture** principles to isolate business rules from the user interface, database engines, and native mobile plugins.

```
       +-------------------------------------------------------+
       |                  Presentation Layer                   |
       |  (Vue 3, Views, Components, Composables, Pinia UI)    |
       +-------------------------------------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       |                   Application Layer                   |
       |     (Use Cases, Input DTOs, Zod Validators, Ports)     |
       +-------------------------------------------------------+
                        |                      ^
                        v                      |
       +---------------------------------+     |
       |          Domain Layer           |     |
       | (Entities, Value Objects,       |     |
       |  Repository Interfaces, Errors) |     |
       +---------------------------------+     |
                        ^                      |
                        |                      |
       +-------------------------------------------------------+
       |                 Infrastructure Layer                  |
       |  (SQLite Repositories, SQLCipher, Migrations,         |
       |   Android Local Notifications, Filesystem, AES Backup)|
       +-------------------------------------------------------+
```

### Dependency Rules:
1. **Domain Layer:** Has zero external dependencies. Pure TypeScript. It must never import from Vue, Pinia, Capacitor, or SQLite.
2. **Application Layer:** Contains application business logic (Use Cases). Imports only from the Domain layer.
3. **Infrastructure Layer:** Implements Domain Repository interfaces and platform services (Capacitor SQLite, Keystore, Local Notifications, PDF renderer).
4. **Presentation Layer:** Contains UI rendering and state coordination. Components invoke Application Use Cases via Dependency Injection. Components never write SQL queries.

---

## 2. Directory Layout & Layer Responsibilities

```
src/
├── app/                  # Application bootstrap, routing, DI container, root layout
│   ├── App.vue
│   ├── router/           # Vue Router navigation guards & route definitions
│   ├── layouts/          # MainLayout (Bottom Nav), AuthLayout, FocusedLayout
│   └── providers/        # DI container wiring repositories and use cases
│
├── domain/               # Enterprise Business Rules (Pure TypeScript)
│   ├── entities/         # Product, Customer, Invoice, InvoiceItem, Payment, etc.
│   ├── value-objects/    # Money (Toman), StockQuantity, Sku, MobileNumber
│   ├── repositories/     # Interfaces (IProductRepository, IInvoiceRepository, etc.)
│   ├── services/         # Domain calculations (DebtService, StockReconciler)
│   └── errors/           # Domain-specific errors (InsufficientStockError, etc.)
│
├── application/          # Application Business Rules
│   ├── use-cases/        # CreateInvoiceUseCase, CancelInvoiceUseCase, etc.
│   ├── dto/              # Request / Response transfer objects
│   └── validators/       # Zod schemas for input validation
│
├── infrastructure/       # Frameworks & Drivers
│   ├── database/         # SQLite driver, connection factory, transaction runner
│   ├── migrations/       # SQL migration scripts & migration runner
│   ├── repositories/     # Concrete SQLite repository implementations
│   ├── backup/           # AES-256-GCM file packaging, PBKDF2 key derivation
│   ├── security/         # Biometric auth, Keystore key access, PIN hasher
│   ├── notifications/    # Android Local Notifications bridge
│   ├── pdf/              # Persian PDF generator with IRANSansX font
│   └── platform/         # Android lifecycle, back button, keyboard helpers
│
├── presentation/         # UI & View Layer
│   ├── components/       # Reusable UI primitives (Buttons, Modals, DatePicker)
│   ├── composables/      # UI logic hooks (useTheme, useJalali, useAuth)
│   ├── stores/           # Pinia stores strictly for shared UI state
│   ├── pages/            # Routable views (Dashboard, Customers, Invoices, etc.)
│   └── styles/           # Tailwind CSS directives, typography, theme variables
│
└── shared/               # Cross-Cutting Concerns
    ├── constants/        # Application constants, unit enums, payment methods
    ├── types/            # Result<T, E>, Nullable<T>, UUID
    ├── utils/            # Persian string helpers, number formatters, UUID generator
    ├── schemas/          # Common Zod schema building blocks
    └── formatters/       # Toman currency formatter, Jalali date formatter
```

---

## 3. Dependency Injection Pattern
A lightweight Service Locator / Container is configured in `src/app/providers/container.ts`:
```typescript
export interface AppContainer {
  database: DatabaseConnection;
  productRepo: IProductRepository;
  customerRepo: ICustomerRepository;
  invoiceRepo: IInvoiceRepository;
  stockMovementRepo: IStockMovementRepository;
  cashLedgerRepo: ICashLedgerRepository;
  createInvoiceUseCase: CreateInvoiceUseCase;
  cancelInvoiceUseCase: CancelInvoiceUseCase;
  // ... other use cases
}
```
Components access use cases using a typed `useContainer()` or Vue provide/inject hook, ensuring decoupling and easy unit test mocking.

---

## 4. Concurrency & Transaction Management
- All multi-table mutations (such as issuing an invoice, recording an itemized stock movement, recording a cash transaction, and updating balances) are wrapped in atomic SQLite transactions:
  `BEGIN TRANSACTION; ... COMMIT;`
- In case of any error or constraint violation, an automatic `ROLLBACK;` occurs, keeping the database in a consistent state.
