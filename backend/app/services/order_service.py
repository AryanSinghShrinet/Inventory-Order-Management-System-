"""Order business logic: stock deduction, total computation, restoration."""

from decimal import Decimal
from typing import List, Tuple

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.errors import BusinessRuleError, ConflictError, NotFoundError
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate


def _atomic_decrement_stock(
    db: Session, product_id: int, quantity: int
) -> Tuple[int, Decimal, str]:
    """Atomically decrement product stock and return the new stock + unit price + name.

    Uses a single UPDATE ... WHERE stock_qty >= quantity RETURNING to avoid the
    classic "check then decrement" race condition.
    """
    stmt = (
        update(Product)
        .where(Product.id == product_id, Product.stock_qty >= quantity)
        .values(stock_qty=Product.stock_qty - quantity)
        .returning(Product.id, Product.stock_qty, Product.price, Product.name, Product.sku)
    )
    row = db.execute(stmt).first()
    if row is None:
        # Either product does not exist, or insufficient stock. Disambiguate.
        product = db.get(Product, product_id)
        if product is None:
            raise NotFoundError(f"Product {product_id} not found")
        raise BusinessRuleError(
            f"Insufficient stock for {product.name!r}: requested {quantity}, available {product.stock_qty}",
            code="insufficient_stock",
            fields={"stock_qty": f"only {product.stock_qty} available"},
        )
    return row.stock_qty, row.price, row.name


def create_order(db: Session, payload: OrderCreate) -> Order:
    """Create an order, atomically deduct stock, and compute the total.

    If anything fails mid-transaction the whole operation is rolled back, so
    stock is never partially consumed.
    """
    customer = db.get(Customer, payload.customer_id)
    if customer is None:
        raise NotFoundError(f"Customer {payload.customer_id} not found")

    try:
        # Phase 1: verify all products exist and lock stock rows in deterministic
        # order to avoid deadlocks when two concurrent orders touch the same
        # product in different sequences.
        ordered_items = sorted(payload.items, key=lambda i: i.product_id)

        for item in ordered_items:
            product = db.get(Product, item.product_id)
            if product is None:
                raise NotFoundError(f"Product {item.product_id} not found")

        # Phase 2: deduct stock one by one (atomic) and build line items.
        line_items: List[OrderItem] = []
        total = Decimal("0.00")
        for item in ordered_items:
            new_stock, unit_price, _ = _atomic_decrement_stock(
                db, item.product_id, item.quantity
            )
            subtotal = (unit_price * item.quantity).quantize(Decimal("0.01"))
            total += subtotal
            line_items.append(
                OrderItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    subtotal=subtotal,
                )
            )

        # Phase 3: persist the order with its computed total.
        order = Order(
            customer_id=payload.customer_id,
            status=payload.status,
            total_amount=total.quantize(Decimal("0.01")),
            notes=payload.notes,
            items=line_items,
        )
        db.add(order)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Database conflict while creating order", code="db_conflict") from exc

    db.refresh(order)
    return _reload_order(db, order.id)


def get_order(db: Session, order_id: int) -> Order:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.customer),
        )
    )
    order = db.execute(stmt).scalar_one_or_none()
    if order is None:
        raise NotFoundError(f"Order {order_id} not found")
    return order


def list_orders(db: Session, limit: int = 100, offset: int = 0) -> List[Order]:
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.customer),
        )
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def cancel_order(db: Session, order_id: int) -> Order:
    """Cancel an order and restore stock to the products."""
    order = get_order(db, order_id)
    if order.status == OrderStatus.CANCELLED:
        return order
    if order.status == OrderStatus.FULFILLED:
        raise BusinessRuleError(
            "Fulfilled orders cannot be cancelled; create a return instead",
            code="already_fulfilled",
        )

    try:
        for item in order.items:
            db.execute(
                update(Product)
                .where(Product.id == item.product_id)
                .values(stock_qty=Product.stock_qty + item.quantity)
            )
        order.status = OrderStatus.CANCELLED
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Database conflict while cancelling order") from exc

    db.refresh(order)
    return _reload_order(db, order.id)


def delete_order(db: Session, order_id: int) -> None:
    """Hard-delete an order. Stock is restored to the products."""
    order = get_order(db, order_id)
    try:
        if order.status != OrderStatus.CANCELLED:
            for item in order.items:
                db.execute(
                    update(Product)
                    .where(Product.id == item.product_id)
                    .values(stock_qty=Product.stock_qty + item.quantity)
                )
        db.delete(order)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Database conflict while deleting order") from exc


def _reload_order(db: Session, order_id: int) -> Order:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.customer),
        )
    )
    return db.execute(stmt).scalar_one()
