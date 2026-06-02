"""Dashboard summary endpoint."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.dashboard import DashboardSummary, LowStockItem

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary, summary="Dashboard stats")
def get_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    total_products = db.execute(select(func.count(Product.id))).scalar_one()
    total_customers = db.execute(select(func.count(Customer.id))).scalar_one()
    total_orders = db.execute(select(func.count(Order.id))).scalar_one()
    pending_orders = db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING)
    ).scalar_one()
    total_revenue = (
        db.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.status != OrderStatus.CANCELLED
            )
        ).scalar_one()
        or Decimal("0.00")
    )

    low_stock_rows = db.execute(
        select(Product)
        .where(Product.stock_qty <= Product.low_stock_threshold)
        .order_by(Product.stock_qty.asc())
        .limit(20)
    ).scalars().all()
    low_stock_items = [
        LowStockItem(
            id=p.id,
            sku=p.sku,
            name=p.name,
            stock_qty=p.stock_qty,
            low_stock_threshold=p.low_stock_threshold,
        )
        for p in low_stock_rows
    ]

    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    rows = db.execute(
        select(Order.created_at, Order.total_amount)
        .where(Order.created_at >= cutoff, Order.status != OrderStatus.CANCELLED)
    ).all()

    by_day: dict[str, dict[str, Decimal | int]] = defaultdict(
        lambda: {"count": 0, "revenue": Decimal("0.00")}
    )
    # Pre-fill the last 14 days so the chart never has gaps.
    today = datetime.now(timezone.utc).date()
    for i in range(13, -1, -1):
        key = (today - timedelta(days=i)).isoformat()
        by_day[key]  # touch

    for created_at, total in rows:
        if created_at is None:
            continue
        key = (
            created_at.astimezone(timezone.utc).date().isoformat()
            if created_at.tzinfo
            else created_at.date().isoformat()
        )
        by_day[key]["count"] += 1  # type: ignore[operator]
        by_day[key]["revenue"] += Decimal(total or 0)  # type: ignore[operator]

    orders_last_14 = [
        {
            "date": key,
            "count": by_day[key]["count"],
            "revenue": str(Decimal(by_day[key]["revenue"]).quantize(Decimal("0.01"))),
        }
        for key in sorted(by_day.keys())
    ]

    return DashboardSummary(
        total_products=int(total_products or 0),
        total_customers=int(total_customers or 0),
        total_orders=int(total_orders or 0),
        total_revenue=Decimal(total_revenue or 0).quantize(Decimal("0.01")),
        pending_orders=int(pending_orders or 0),
        low_stock_count=len(low_stock_items),
        low_stock_items=low_stock_items,
        orders_last_14_days=orders_last_14,
    )
