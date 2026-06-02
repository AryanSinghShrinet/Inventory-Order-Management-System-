"""Dashboard summary schemas."""

from decimal import Decimal
from typing import List

from pydantic import BaseModel


class LowStockItem(BaseModel):
    id: int
    sku: str
    name: str
    stock_qty: int
    low_stock_threshold: int


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    pending_orders: int
    low_stock_count: int
    low_stock_items: List[LowStockItem]
    orders_last_14_days: List[dict]  # [{ "date": "2026-05-01", "count": 4, "revenue": "12345.00" }]
