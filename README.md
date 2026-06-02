# Stockwise — Inventory & Order Management System

A production-ready, containerized full-stack application for managing
products, customers, and orders. Built for a software-engineer take-home
assessment: every functional requirement from the spec is implemented, every
business rule is enforced both in the API and at the database level, and the
whole stack runs from a single `docker compose up`.

> Frontend: **React 18 (JavaScript) + Vite + Tailwind + TanStack Query**
> Backend: **FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Alembic**
> Database: **PostgreSQL 16**
> Orchestration: **Docker + Docker Compose**
> Deploy: **Render (backend) + Vercel (frontend) + Docker Hub (image)**

---

## Table of contents

1. [Architecture](#architecture)
2. [Quick start (local)](#quick-start-local)
3. [Project layout](#project-layout)
4. [Environment variables](#environment-variables)
5. [API reference](#api-reference)
6. [Business rules](#business-rules)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Architecture

```
                     ┌────────────────────────────────────┐
                     │  Vercel (static)                  │
                     │  React 18 + Vite + Tailwind       │
                     │  (Stockwise dashboard SPA)        │
                     └─────────────┬──────────────────────┘
                                   │  HTTPS / VITE_API_URL
                                   ▼
                     ┌────────────────────────────────────┐
                     │  Render (Docker web service)       │
                     │  FastAPI 0.115 (Python 3.12)       │
                     │  /docs  ·  /healthz                │
                     └─────────────┬──────────────────────┘
                                   │  SQLAlchemy / psycopg
                                   ▼
                     ┌────────────────────────────────────┐
                     │  Render Managed PostgreSQL         │
                     │  (or local container in dev)       │
                     └────────────────────────────────────┘
```

| Concern | Choice | Rationale |
| --- | --- | --- |
| HTTP framework | **FastAPI** | Async, OpenAPI out of the box, type-safe. |
| ORM | **SQLAlchemy 2.0** | Mature, mature migration story with Alembic. |
| Driver | **psycopg 3** | Fast, modern, supports modern Postgres features. |
| Migrations | **Alembic** | Single source of truth for schema. |
| Frontend build | **Vite 5** | Fast HMR, small output, ESM-native. |
| Data fetching | **TanStack Query v5** | Standard for server-state in modern React. |
| Styling | **Tailwind CSS 3** + custom design tokens | Restraint over library bloat. |
| Icons | **lucide-react** | Hand-drawn feel, no emoji as UI. |
| Validation | **Pydantic v2** (server) + **Zod** (client) | One schema per resource on each side, mirrored. |

The stock-decrement and total-computation logic lives in
`backend/app/services/order_service.py`. It uses a single
`UPDATE … WHERE stock_qty >= quantity RETURNING` statement per line item
inside a transaction, so concurrent orders cannot oversell a product.

---

## Quick start (local)

```bash
# 1. Clone and configure
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Boot the full stack
docker compose up --build

# 3. Open in your browser
#    Frontend  →  http://localhost:5173
#    API docs  →  http://localhost:8000/docs
#    Health    →  http://localhost:8000/healthz
```

That's it. On first boot the backend:

1. waits for Postgres to be healthy,
2. runs `alembic upgrade head` to apply the initial schema,
3. runs `app/seed.py` to insert 12 products, 8 customers, and ~15 orders
   across the last 14 days (idempotent — safe to re-run),
4. starts `uvicorn` on port 8000 with the OpenAPI docs exposed.

### Tearing it down

```bash
docker compose down           # stop containers, keep data
docker compose down -v        # stop and wipe the named volume
```

### Without Docker

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg://USER:PASS@localhost:5432/inventory
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## Project layout

```
.
├── backend/                       # FastAPI service
│   ├── app/
│   │   ├── main.py                # App, CORS, lifespan, exception handlers
│   │   ├── config.py              # pydantic-settings
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   ├── errors.py              # AppError hierarchy
│   │   ├── models/                # ORM models
│   │   ├── schemas/               # Pydantic v2 schemas
│   │   ├── routers/               # FastAPI routers
│   │   ├── services/              # Business logic (order service)
│   │   └── seed.py                # Realistic B2B/SaaS demo data
│   ├── alembic/                   # Database migrations
│   ├── tests/                     # pytest suite
│   ├── Dockerfile                 # Multi-stage, non-root, healthcheck
│   ├── requirements.txt
│   ├── pyproject.toml             # ruff + pytest config
│   └── .env.example
├── frontend/                      # React + Vite SPA
│   ├── src/
│   │   ├── api/                   # axios client + TanStack Query hooks
│   │   ├── components/            # layout, ui primitives, domain forms
│   │   ├── pages/                 # Dashboard, Products, Customers, Orders, …
│   │   ├── lib/                   # cn(), formatters
│   │   ├── store/                 # theme provider
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css              # Tailwind base + design tokens
│   ├── public/                    # favicon
│   ├── Dockerfile                 # node:20-alpine → nginx:1.27-alpine
│   ├── nginx.conf
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vercel.json                # SPA rewrite to /index.html
│   └── .env.example
├── docker-compose.yml             # db + backend + frontend
├── render.yaml                    # Render Blueprint (Postgres + Web Service)
├── Makefile
├── .env.example
├── .gitignore
├── .editorconfig
└── README.md
```

---

## Environment variables

All `.env.example` files document their variables. The compose file injects
the same names into the matching containers.

### Top-level (used by `docker compose`)

| Variable | Default | Description |
| --- | --- | --- |
| `POSTGRES_USER` | `inventory` | Postgres role |
| `POSTGRES_PASSWORD` | `change_me_in_production` | Postgres password |
| `POSTGRES_DB` | `inventory` | Database name |
| `POSTGRES_PORT` | `5432` | Host port for Postgres |
| `DATABASE_URL` | `postgresql+psycopg://…@db:5432/inventory` | SQLAlchemy URL |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed origins |
| `SEED_ON_START` | `true` | Run `app.seed` when the API starts |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warning` / `error` |
| `HOST` | `0.0.0.0` | Backend bind host |
| `PORT` | `8000` | Backend bind port |
| `VITE_API_URL` | `http://localhost:8000` | Public backend URL used by the SPA at build time |

> In production, the `DATABASE_URL` is injected automatically by Render from
> the managed Postgres instance, and `CORS_ORIGINS` should be set to the
> deployed Vercel URL.

---

## API reference

The full OpenAPI document is generated by FastAPI and served at `/docs`
(Swagger UI) and `/redoc`. Summary:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`    | `/healthz` | Liveness probe |
| `GET`    | `/` | Service info |
| `POST`   | `/products` | Create product |
| `GET`    | `/products` | List products (`?q=`, `?category=`) |
| `GET`    | `/products/{id}` | Get product |
| `PUT`    | `/products/{id}` | Update product |
| `DELETE` | `/products/{id}` | Delete product |
| `POST`   | `/customers` | Create customer |
| `GET`    | `/customers` | List customers (`?q=`) |
| `GET`    | `/customers/{id}` | Get customer |
| `DELETE` | `/customers/{id}` | Delete customer |
| `POST`   | `/orders` | Create order (deducts stock) |
| `GET`    | `/orders` | List orders (`?limit=&offset=`) |
| `GET`    | `/orders/{id}` | Get order with line items |
| `DELETE` | `/orders/{id}` | Cancel + delete order (restores stock) |
| `GET`    | `/dashboard/summary` | Dashboard stats + 14-day sparkline |

### Error envelope

All application errors return a consistent shape so the frontend can render
field-level validation messages without parsing the default FastAPI shape:

```json
{
  "detail": "Insufficient stock for 'Apex Cotton Tee — Black / M': requested 50, available 7",
  "code": "insufficient_stock",
  "fields": { "stock_qty": "only 7 available" }
}
```

| HTTP | `code` | When |
| --- | --- | --- |
| 400 | `app_error` | Generic application error |
| 404 | `not_found` | Product / customer / order does not exist |
| 409 | `duplicate_sku` | Product SKU already taken |
| 409 | `duplicate_email` | Customer email already taken |
| 409 | `insufficient_stock` | Order quantity exceeds available stock |
| 409 | `already_fulfilled` | Cannot cancel a fulfilled order |
| 409 | `db_conflict` | Underlying constraint violation |
| 422 | `validation_error` | Pydantic validation failure (FastAPI default) |

---

## Business rules

Every rule from the spec is implemented and tested in
`backend/tests/test_api.py`:

1. **Product SKU is unique** — enforced by a unique index in Alembic and
   `409 duplicate_sku` from the API.
2. **Customer email is unique** — same approach: unique index + 409.
3. **Stock cannot go negative** — DB-level `CHECK (stock_qty >= 0)` + Pydantic
   `ge=0` on input.
4. **Insufficient stock rejects the order** — atomic
   `UPDATE … WHERE stock_qty >= quantity` per line item inside one
   transaction. Returns `409 insufficient_stock` and does not consume stock.
5. **Order creation reduces stock** — same atomic update.
6. **Total is computed server-side** — the API never accepts `total_amount`
   from the client. See `services/order_service.py:create_order`.
7. **Cancelling an order restores stock** — `DELETE /orders/{id}`.
8. **Validation & status codes** — Pydantic v2 + `AppError` hierarchy.

---

## Testing

The backend ships with 13 end-to-end tests that exercise every business rule.
The test client uses an in-memory SQLite database for speed.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -q
```

Sample output:

```
.............                                                            [100%]
13 passed in ~1.4s
```

Tests cover:

- healthz
- product CRUD, SKU uniqueness, normalisation, non-negative price/stock
- customer email uniqueness
- order creation deducts stock and computes total
- insufficient stock → 409 (and stock unchanged)
- invalid product id → 404
- non-positive quantity → 422
- empty items → 422
- order deletion restores stock
- dashboard summary

---

## Deployment

### 1. Push the backend image to Docker Hub

```bash
docker build -t <your-dockerhub-user>/inventory-backend:latest ./backend
docker push <your-dockerhub-user>/inventory-backend:latest
```

### 2. Deploy the backend on Render

The repo includes a one-click Render Blueprint at [`render.yaml`](./render.yaml).

1. Push the repo to GitHub.
2. Open <https://dashboard.render.com/blueprints> → **New Blueprint Instance**.
3. Connect the GitHub repo. Render will detect `render.yaml` and offer to
   provision:
   - `inventory-postgres` — managed PostgreSQL (free tier, expires after 90
     days — replace with a paid plan or external Neon instance for production).
   - `inventory-backend` — Docker web service running `uvicorn` on port 8000.
4. Wait for the deploy. Note the public URL of `inventory-backend` (something
   like `https://inventory-backend.onrender.com`).

Optional: update `CORS_ORIGINS` to the Vercel domain once you have it.

### 3. Deploy the frontend on Vercel

1. Open <https://vercel.com/new> and import the **same** GitHub repo, setting
   the **root directory** to `frontend/`.
2. Add one environment variable:
   - `VITE_API_URL` = the Render backend URL from step 2
3. Click **Deploy**. Vercel will use the included `vercel.json` for the SPA
   rewrite and `npm run build` as the build command.
4. Wait for the build, then open the production URL.

### 4. Verify

```bash
curl https://inventory-backend.onrender.com/healthz
# {"status":"ok", ...}

# Open the Vercel URL, create a product, place an order, confirm stock drops.
```

### 5. Submission checklist

| Deliverable | Where it is |
| --- | --- |
| GitHub repo | this repository |
| Live frontend | Vercel URL (step 3) |
| Live backend | Render URL (step 2) |
| Docker Hub image | `<user>/inventory-backend:latest` (step 1) |
| OpenAPI docs | `<render-url>/docs` |

---

## Troubleshooting

**`pg_isready` fails during compose up**

The first time Postgres boots it can take ~10s. The compose healthcheck
retries for 50s. If it still fails, check `docker compose logs db`.

**`/healthz` returns 502 on Render**

Check `docker compose logs` / Render logs. The most common cause is a wrong
`DATABASE_URL`. The Render Blueprint wires it automatically — if you changed
the service name, update `render.yaml` to match.

**Frontend shows "Could not reach the API"**

- Confirm `VITE_API_URL` is set correctly in the Vercel project **and** you
  redeployed after setting it. Vite embeds this at build time.
- The backend must include your Vercel URL in `CORS_ORIGINS`. A quick fix is
  to set it to `*` during testing; lock it down for production.

**Seed data didn't appear**

`SEED_ON_START` defaults to `true`. If you redeploy with the same Postgres
the seed is a no-op (idempotent), which is the correct behaviour.

**Migrations on Render**

Render runs `alembic upgrade head` as part of the `CMD` in `backend/Dockerfile`
before starting `uvicorn`. New migrations are applied automatically on the
next deploy.

---

## License

MIT — do what you want.
