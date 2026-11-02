# Nexa CRM

```
nexa/
├── frontend/      # Vue 3 web UI (mock data mode, Laravel API integration point)
├── backend/       # PHP/Laravel 13 API (MySQL via Docker)
└── docker-compose.yml
```

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173 (Vite dev server)
- Backend API: http://localhost:8080/api/v1
- MySQL: localhost:3306 (db `nexa`, user `nexa`, pass `nexa_secret`)

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
| Expenses | `/api/v1/expenses` (+ filters `start_date`, `end_date`) |
| Invoices | `/api/v1/invoices` (+ filters `status`, `customer_id`) |
| Payments | nested: `GET/POST /invoices/{id}/payments`, `PATCH /payments/{id}/void` |
| Customer notes | nested: `GET/POST /customers/{id}/notes` |
| Business profile | `GET/POST /api/v1/business-profile` (upsert) |
| Settings | `GET/PUT /api/v1/settings/{key}` |

Pagination payloads follow Laravel's paginator format
(`{ data, links, meta }`). All money amounts are integer Toman.

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
