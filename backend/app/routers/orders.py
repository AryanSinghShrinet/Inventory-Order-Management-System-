"""Order endpoints."""

from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.order import OrderCreate, OrderOut
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post(
    "",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new order",
)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> OrderOut:
    order = order_service.create_order(db, payload)
    return OrderOut.from_order(order)


@router.get("", response_model=List[OrderOut], summary="List all orders")
def list_orders(
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[OrderOut]:
    orders = order_service.list_orders(db, limit=limit, offset=offset)
    return [OrderOut.from_order(o) for o in orders]


@router.get(
    "/{order_id}", response_model=OrderOut, summary="Get an order with its items"
)
def get_order(order_id: int, db: Session = Depends(get_db)) -> OrderOut:
    order = order_service.get_order(db, order_id)
    return OrderOut.from_order(order)


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel and delete an order (restores stock)",
)
def delete_order(order_id: int, db: Session = Depends(get_db)) -> None:
    order_service.delete_order(db, order_id)
