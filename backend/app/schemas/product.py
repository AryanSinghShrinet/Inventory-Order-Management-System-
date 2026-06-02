"""Pydantic schemas for the Product resource."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, examples=["Apex Cotton Tee"])
    sku: str = Field(..., min_length=1, max_length=64, examples=["TSHIRT-COT-M"])
    description: Optional[str] = Field(default=None, max_length=2000)
    price: Decimal = Field(..., ge=0, decimal_places=2, examples=["1299.00"])
    stock_qty: int = Field(..., ge=0, examples=[42])
    low_stock_threshold: int = Field(default=5, ge=0, examples=[5])
    category: Optional[str] = Field(default=None, max_length=80, examples=["Apparel"])

    @field_validator("sku")
    @classmethod
    def _normalize_sku(cls, v: str) -> str:
        cleaned = v.strip().upper()
        if not cleaned:
            raise ValueError("SKU must not be blank")
        return cleaned


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    sku: Optional[str] = Field(default=None, min_length=1, max_length=64)
    description: Optional[str] = Field(default=None, max_length=2000)
    price: Optional[Decimal] = Field(default=None, ge=0)
    stock_qty: Optional[int] = Field(default=None, ge=0)
    low_stock_threshold: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = Field(default=None, max_length=80)

    @field_validator("sku")
    @classmethod
    def _normalize_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip().upper()
        if not cleaned:
            raise ValueError("SKU must not be blank")
        return cleaned


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
