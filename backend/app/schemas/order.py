"""Pydantic schemas for the Order resource."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0, examples=[1])
    quantity: int = Field(..., gt=0, le=10_000, examples=[3])


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0, examples=[1])
    items: List[OrderItemCreate] = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=500)
    status: OrderStatus = Field(default=OrderStatus.PENDING)

    @model_validator(mode="after")
    def _no_duplicate_products(self) -> "OrderCreate":
        seen: set[int] = set()
        for item in self.items:
            if item.product_id in seen:
                raise ValueError(f"Duplicate product id {item.product_id} in order")
            seen.add(item.product_id)
        return self


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str = ""
    product_sku: str = ""
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    customer_name: str = ""
    customer_email: str = ""
    status: OrderStatus
    total_amount: Decimal
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut] = []

    @classmethod
    def from_order(cls, order) -> "OrderOut":  # type: ignore[no-untyped-def]
        items_data: List[dict] = []
        for it in order.items:
            items_data.append(
                {
                    "id": it.id,
                    "product_id": it.product_id,
                    "product_name": it.product.name if it.product else "",
                    "product_sku": it.product.sku if it.product else "",
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "subtotal": it.subtotal,
                }
            )
        return cls(
            id=order.id,
            customer_id=order.customer_id,
            customer_name=order.customer.full_name if order.customer else "",
            customer_email=order.customer.email if order.customer else "",
            status=order.status,
            total_amount=order.total_amount,
            notes=order.notes,
            created_at=order.created_at,
            updated_at=order.updated_at,
            items=items_data,
        )
