# Nexa CRM

```
nexa/
├── frontend/      # Vue 3 web UI (mock data mode, Laravel API integration point)
├── backend/       # PHP/Laravel 13 API (MySQL via Docker)
└── compose.yaml
```

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173 (Vite dev server)
- Backend API: http://localhost:8080/api/v1
- MySQL: localhost:3306 (db `nexa`, user `nexa`, pass `nexa_secret`)
- phpMyAdmin: http://localhost:8082

On first start the backend waits for MySQL, runs migrations, then serves.

## Backend API (base)

Health probe: `GET /api/v1/health`

CRUD (list supports `?q=search&per_page=50&...filters`):

| Resource | Routes |
|---|---|
| Categories | `/api/v1/categories` |
| Products | `/api/v1/products` (+ filters `category_id`, `low_stock`, `include_archived`) |
| Customers | `/api/v1/customers` (+ filter `tag`, `include_archived`) |
| Leads | `/api/v1/leads` (+ filter `status`) |
| Tasks | `/api/v1/tasks` (+ filters `status`, `priority`, `due_today`) |
| Expenses | `/api/v1/expenses` (+ filters `start_date`, `end_date`, `category_id`) |
| Other incomes | `/api/v1/other-incomes` (+ filters `start_date`, `end_date`; cash ledger written on create/delete) |
| Invoices | `/api/v1/invoices` (+ filters `status`, `customer_id`) |
| Payments | nested: `GET/POST /invoices/{id}/payments`, `GET /customers/{id}/payments`, `GET /payments`, `PATCH /payments/{id}/void` |
| Customer notes | nested: `GET/POST /customers/{id}/notes` |
| Stock movements | `/api/v1/stock-movements` (index `product_id`, store; `GET /stock-movements/reconciled/{productId}`) |
| Cash ledger | `/api/v1/cash-transactions` (+ `/balance`, `/summary?start_date&end_date`) |
| Reports | `/api/v1/reports/{dashboard|monthly-trends|top-products|debtors|low-stock|global-search?q=}` |
| Business profile | `GET/POST /api/v1/business-profile` (upsert) |
| Settings | `GET/PUT /api/v1/settings/{key}` |

List responses use Laravel's default paginator JSON
(`{ current_page, data, per_page, links, ... }`); pass `?all=1` for a plain
array. All money amounts are integer Toman.

## Frontend

The Vue app currently runs fully in-mock; `src/app/providers/container.ts` is the
single wiring point where repositories are created. To connect the Laravel API,
implement the `src/domain/repositories/*` interfaces as API-backed repositories
and swap them into the container. Pages, use cases, and router stay untouched.

```bash
cd frontend && npm install && npm run dev   # local, without Docker
```

## Backend without Docker

```bash
cd backend
composer install
# set DB_* env for a local MySQL
php artisan migrate
php artisan serve
```
