# Nexa CRM — Screen Map & Route Hierarchy

## 1. Top-Level Tab Structure (Five Bottom Navigation Items)

```mermaid
graph TD
    Root["Nexa CRM Root"] --> Nav["Bottom Navigation Bar"]
    Nav --> Tab1["1. Home (/dashboard)"]
    Nav --> Tab2["2. Customers (/customers)"]
    Nav --> Tab3["3. Invoices (/invoices)"]
    Nav --> Tab4["4. Tasks (/tasks)"]
    Nav --> Tab5["5. More (/more)"]

    Tab5 --> M1["Products & Inventory (/products)"]
    Tab5 --> M2["Leads (/leads)"]
    Tab5 --> M3["Reports (/reports)"]
    Tab5 --> M4["Finance & Ledger (/finance)"]
    Tab5 --> M5["Settings (/settings)"]
```

## 2. Complete Route Catalog

| Route Path | View / Component | Navigation Context | Presentation Mode |
|---|---|---|---|
| `/onboarding` | `OnboardingView.vue` | Standalone First Launch | Fullscreen |
| `/lock` | `LockView.vue` | Security Auth Gate | Fullscreen Modal |
| `/dashboard` | `DashboardView.vue` | Bottom Nav (Tab 1) | Main Layout |
| `/customers` | `CustomerListView.vue` | Bottom Nav (Tab 2) | Main Layout |
| `/customers/new` | `CustomerFormView.vue` | Sub-page | Focused Page (Back button) |
| `/customers/:id` | `CustomerDetailView.vue`| Sub-page | Focused Page |
| `/invoices` | `InvoiceListView.vue` | Bottom Nav (Tab 3) | Main Layout |
| `/invoices/new` | `InvoiceCreateView.vue` | Sub-page | Focused Page |
| `/invoices/:id` | `InvoiceDetailView.vue` | Sub-page | Focused Page |
| `/tasks` | `TaskListView.vue` | Bottom Nav (Tab 4) | Main Layout |
| `/more` | `MoreMenuView.vue` | Bottom Nav (Tab 5) | Main Layout |
| `/products` | `ProductListView.vue` | More Sub-section | Main Layout |
| `/products/new` | `ProductFormView.vue` | Sub-page | Focused Page |
| `/products/:id` | `ProductDetailView.vue` | Sub-page | Focused Page |
| `/inventory` | `InventoryLedgerView.vue`| More Sub-section | Main Layout |
| `/leads` | `LeadListView.vue` | More Sub-section | Main Layout |
| `/leads/:id` | `LeadDetailView.vue` | Sub-page | Focused Page |
| `/reports` | `ReportsView.vue` | More Sub-section | Main Layout |
| `/finance` | `FinanceLedgerView.vue` | More Sub-section | Main Layout |
| `/settings` | `SettingsView.vue` | More Sub-section | Main Layout |
| `/settings/backup` | `BackupRestoreView.vue`| Sub-page | Focused Page |
