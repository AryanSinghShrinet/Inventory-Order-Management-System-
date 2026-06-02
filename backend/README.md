# Inventory & Order Management — Backend

FastAPI service for the Inventory & Order Management System. PostgreSQL-backed,
Dockerized, and production-ready. See the top-level [`../README.md`](../README.md)
for the full architecture and deployment guide.

## Quick start (local)

```bash
cd ..
cp .env.example .env
docker compose up --build
```

- API: <http://localhost:8000>
- OpenAPI docs: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- Health: <http://localhost:8000/healthz>

## Local development (without Docker)

```bash
python -m venv .venv
source .venv/bin/activate          # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg://USER:PASS@localhost:5432/inventory
alembic upgrade head
uvicorn app.main:app --reload
```

## Tests

```bash
pytest -q
```

The test suite uses an in-memory SQLite engine for speed, with a fresh schema
per test.

## Project layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app, exception handlers, lifespan
│   ├── config.py            # pydantic-settings
│   ├── database.py          # engine + session + Base
│   ├── errors.py            # AppError hierarchy
│   ├── models/              # SQLAlchemy ORM
│   ├── schemas/             # Pydantic v2
│   ├── routers/             # FastAPI routes
│   ├── services/            # Business logic (orders)
│   └── seed.py              # Realistic B2B/SaaS demo data
├── alembic/                 # Migrations
├── tests/                   # pytest smoke + rule tests
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://…/inventory` | SQLAlchemy URL |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed origins |
| `SEED_ON_START` | `false` | If `true`, run the demo seed on startup |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warning` / `error` |
| `HOST` | `0.0.0.0` | Bind host |
| `PORT` | `8000` | Bind port |

## API summary

| Method | Path | Purpose |
| --- | --- | --- |
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
| `GET`    | `/dashboard/summary` | Stats for the dashboard |
| `GET`    | `/healthz` | Liveness probe |
| `GET`    | `/docs` | Swagger UI |
