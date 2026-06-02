"""Product endpoints."""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ConflictError, NotFoundError
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.post(
    "",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(
            f"Product with SKU {payload.sku!r} already exists",
            code="duplicate_sku",
            fields={"sku": "must be unique"},
        ) from exc
    db.refresh(product)
    return product


@router.get("", response_model=List[ProductOut], summary="List all products")
def list_products(
    db: Session = Depends(get_db),
    q: str | None = None,
    category: str | None = None,
) -> list[Product]:
    stmt = select(Product).order_by(Product.created_at.desc())
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where((Product.name.ilike(like)) | (Product.sku.ilike(like)))
    if category:
        stmt = stmt.where(Product.category == category)
    return list(db.execute(stmt).scalars().all())


@router.get("/{product_id}", response_model=ProductOut, summary="Get a product by id")
def get_product(product_id: int, db: Session = Depends(get_db)) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise NotFoundError(f"Product {product_id} not found")
    return product


@router.put("/{product_id}", response_model=ProductOut, summary="Update a product")
def update_product(
    product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)
) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise NotFoundError(f"Product {product_id} not found")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(product, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(
            f"Product with SKU {data.get('sku', product.sku)!r} already exists",
            code="duplicate_sku",
            fields={"sku": "must be unique"},
        ) from exc
    db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product",
)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise NotFoundError(f"Product {product_id} not found")
    db.delete(product)
    db.commit()
