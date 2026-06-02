"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.config import get_settings
from app.database import Base, engine
from app.errors import AppError
from app.routers import customers, dashboard, orders, products
from app.seed import run_seed

settings = get_settings()

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("inventory")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables (fallback for dev) and optionally seed on startup."""
    # Import models so they are registered with Base.metadata before create_all.
    from app.models import customer, order, product  # noqa: F401

    logger.info("Running database startup checks…")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        # Lightweight: ensure schema exists. In production prefer Alembic.
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as exc:
        logger.error("Database connection failed: %s", exc)
        raise

    if settings.seed_on_start:
        try:
            run_seed()
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Seed step skipped: %s", exc)

    logger.info("Application ready on %s:%s", settings.host, settings.port)
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=(
        "Production-ready REST API for a small-business inventory and order "
        "management system. Documents every endpoint via OpenAPI at /docs."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def _app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_payload())


@app.exception_handler(IntegrityError)
async def _integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    logger.warning("Integrity error on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "detail": "Database constraint violated",
            "code": "db_conflict",
            "fields": {},
        },
    )


@app.get("/healthz", tags=["meta"], summary="Liveness probe")
def healthz() -> dict:
    """Cheap endpoint used by container health checks and uptime monitors."""
    return {"status": "ok", "service": settings.api_title, "version": settings.api_version}


@app.get("/", tags=["meta"], summary="Service information")
def root() -> dict:
    return {
        "service": settings.api_title,
        "version": settings.api_version,
        "docs": "/docs",
        "health": "/healthz",
    }


app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
