"""Pydantic schemas for the Customer resource."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=160, examples=["Riya Sharma"])
    email: EmailStr = Field(..., examples=["riya@northwind.io"])
    phone: Optional[str] = Field(default=None, max_length=40, examples=["+91-98765-43210"])
    company: Optional[str] = Field(default=None, max_length=160)
    address: Optional[str] = Field(default=None, max_length=255)


class CustomerCreate(CustomerBase):
    @field_validator("full_name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Full name must not be blank")
        return cleaned

    @field_validator("phone")
    @classmethod
    def _normalize_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.strip() or None


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
