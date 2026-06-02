"""Customer endpoints."""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ConflictError, NotFoundError
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerOut

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post(
    "",
    response_model=CustomerOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new customer",
)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)) -> Customer:
    customer = Customer(**payload.model_dump())
    db.add(customer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError(
            f"Customer with email {payload.email!r} already exists",
            code="duplicate_email",
            fields={"email": "must be unique"},
        ) from exc
    db.refresh(customer)
    return customer


@router.get("", response_model=List[CustomerOut], summary="List all customers")
def list_customers(
    db: Session = Depends(get_db), q: str | None = None
) -> list[Customer]:
    stmt = select(Customer).order_by(Customer.created_at.desc())
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            (Customer.full_name.ilike(like)) | (Customer.email.ilike(like))
        )
    return list(db.execute(stmt).scalars().all())


@router.get(
    "/{customer_id}", response_model=CustomerOut, summary="Get a customer by id"
)
def get_customer(customer_id: int, db: Session = Depends(get_db)) -> Customer:
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise NotFoundError(f"Customer {customer_id} not found")
    return customer


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a customer",
)
def delete_customer(customer_id: int, db: Session = Depends(get_db)) -> None:
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise NotFoundError(f"Customer {customer_id} not found")
    db.delete(customer)
    db.commit()
