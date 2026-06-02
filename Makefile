# ---- Convenience targets for the Inventory & Order Management System --------
# Run from the repository root. Requires Docker (with Compose v2) installed.

SHELL := /bin/sh
.DEFAULT_GOAL := help

.PHONY: help up down build rebuild logs ps shell-backend shell-frontend \
        seed test test-docker lint clean restart

help:
	@echo "Targets:"
	@echo "  make up              - start the full stack (db + backend + frontend)"
	@echo "  make down            - stop and remove containers"
	@echo "  make build           - build all images"
	@echo "  make rebuild         - rebuild images without cache"
	@echo "  make logs            - tail logs from all services"
	@echo "  make ps              - list running containers"
	@echo "  make shell-backend   - open a shell in the backend container"
	@echo "  make shell-frontend  - open a shell in the frontend container"
	@echo "  make seed            - run database seed inside the backend container"
	@echo "  make test            - run pytest locally (outside docker)"
	@echo "  make test-docker     - run pytest inside the backend container"
	@echo "  make lint            - run ruff on the backend"
	@echo "  make clean           - remove containers, volumes, and build cache"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

rebuild:
	docker compose build --no-cache

logs:
	docker compose logs -f --tail=200

ps:
	docker compose ps

shell-backend:
	docker compose exec backend bash

shell-frontend:
	docker compose exec frontend sh

seed:
	docker compose exec backend python -m app.seed

test:
	cd backend && python -m pytest -q

test-docker:
	docker compose exec backend python -m pytest -q

lint:
	cd backend && python -m ruff check app tests || true

clean:
	docker compose down -v --remove-orphans
	docker system prune -f

restart:
	docker compose restart backend frontend
