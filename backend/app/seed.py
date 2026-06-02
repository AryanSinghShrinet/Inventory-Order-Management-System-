"""Seed the database with realistic B2B/SaaS demo data.

Idempotent: if a product with the same SKU already exists, that product is
left untouched. Customers with the same email are also left as-is.

Run manually:  python -m app.seed
"""

import logging
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.services import order_service
from app.schemas.order import OrderCreate, OrderItemCreate

logger = logging.getLogger("inventory.seed")


PRODUCTS = [
    # (sku, name, description, price, stock, threshold, category)
    ("TSHRT-CTN-BLK-M", "Apex Cotton Tee — Black / M", "180 GSM combed cotton, pre-shrunk.", 1299.00, 42, 8, "Apparel"),
    ("TSHRT-CTN-WHT-L", "Apex Cotton Tee — White / L", "180 GSM combed cotton, pre-shrunk.", 1299.00, 7, 8, "Apparel"),
    ("HODIE-FLC-NVY-L", "Northwind Pullover Hoodie — Navy / L", "320 GSM fleece, brushed inner.", 3499.00, 18, 5, "Apparel"),
    ("HODIE-FLC-OAT-M", "Northwind Pullover Hoodie — Oat / M", "320 GSM fleece, brushed inner.", 3499.00, 4, 5, "Apparel"),
    ("CAP-6P-OLV", "Six-Panel Cap — Olive", "Adjustable strap, brass buckle.", 899.00, 56, 10, "Accessories"),
    ("BAG-CNV-NAT", "Heritage Canvas Tote — Natural", "12 oz canvas, cotton webbing handles.", 1599.00, 22, 6, "Accessories"),
    ("BOTT-INS-750", "Vacuum Bottle 750 ml", "18/8 stainless, 12 h cold / 24 h hot.", 1899.00, 31, 8, "Drinkware"),
    ("MUG-CER-330", "Stoneware Mug 330 ml", "Matte glaze, dishwasher safe.", 549.00, 64, 12, "Drinkware"),
    ("NTBK-A5-DOT", "Dot Grid Notebook A5", "120 gsm ivory paper, 160 pages.", 699.00, 88, 15, "Stationery"),
    ("PEN-RLL-BLK", "Brass Rollerball Pen — Black", "Solid brass, Schmidt refill.", 1199.00, 12, 6, "Stationery"),
    ("LAMP-DSK-OAK", "Desk Lamp — Oak / Brass", "Dimmable LED, USB-C, 3000 K.", 5499.00, 6, 3, "Home"),
    ("CDL-SOY-VAN", "Soy Candle — Vanilla 200 g", "Hand-poured, 45 h burn time.", 999.00, 24, 8, "Home"),
]

CUSTOMERS = [
    ("Riya Sharma", "riya@northwind.io", "+91 98765 43210", "Northwind Labs", "12 MG Road, Bengaluru"),
    ("Arjun Mehta", "arjun@altitude.studio", "+91 99887 11223", "Altitude Studio", "4 Linking Road, Mumbai"),
    ("Priya Iyer", "priya@fieldsandfig.com", "+91 91234 56789", "Fields & Fig", "8 Anna Nagar, Chennai"),
    ("Kabir Singh", "kabir@meridianworks.co", "+91 90909 80808", "Meridian Works", "Plot 21, Hitech City, Hyderabad"),
    ("Ananya Verma", "ananya@quietkraft.in", "+91 98333 12121", "Quietkraft", "Sector 18, Noida"),
    ("Devansh Patel", "devansh@threadhaus.com", "+91 90000 12121", "Threadhaus", "CG Road, Ahmedabad"),
    ("Maya Reddy", "maya@foldstationery.in", "+91 96666 54545", "Fold Stationery", "Banjara Hills, Hyderabad"),
    ("Ishaan Kapoor", "ishaan@oaklight.co", "+91 97777 30303", "Oaklight", "Civil Lines, Delhi"),
]


def _seed_products(db: Session) -> list[Product]:
    existing = {p.sku for p in db.query(Product).all()}
    created: list[Product] = []
    for sku, name, desc, price, stock, threshold, category in PRODUCTS:
        if sku in existing:
            continue
        p = Product(
            sku=sku,
            name=name,
            description=desc,
            price=Decimal(str(price)),
            stock_qty=stock,
            low_stock_threshold=threshold,
            category=category,
        )
        db.add(p)
        created.append(p)
    db.commit()
    for p in created:
        db.refresh(p)
    return db.query(Product).order_by(Product.id.asc()).all()


def _seed_customers(db: Session) -> list[Customer]:
    existing = {c.email for c in db.query(Customer).all()}
    created: list[Customer] = []
    for full_name, email, phone, company, address in CUSTOMERS:
        if email in existing:
            continue
        c = Customer(
            full_name=full_name,
            email=email,
            phone=phone,
            company=company,
            address=address,
        )
        db.add(c)
        created.append(c)
    db.commit()
    for c in created:
        db.refresh(c)
    return db.query(Customer).order_by(Customer.id.asc()).all()


def _seed_orders(db: Session, products_: list[Product], customers_: list[Customer]) -> int:
    if db.query(Order).count() > 0:
        return 0

    rng = random.Random(42)
    today = datetime.now(timezone.utc)

    n_orders = 0
    for days_ago in [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14]:
        # 0-2 orders per day
        per_day = rng.randint(0, 2)
        for _ in range(per_day):
            customer = rng.choice(customers_)
            line_count = rng.randint(1, 3)
            line_products = rng.sample(products_, k=min(line_count, len(products_)))
            items: list[OrderItemCreate] = []
            for p in line_products:
                qty = rng.randint(1, 3)
                # Cap at current stock to avoid insufficient-stock errors during seed.
                qty = min(qty, max(1, p.stock_qty))
                items.append(OrderItemCreate(product_id=p.id, quantity=qty))

            payload = OrderCreate(
                customer_id=customer.id,
                items=items,
                notes=None,
                status=rng.choice([OrderStatus.PENDING, OrderStatus.PENDING, OrderStatus.FULFILLED]),
            )
            try:
                order_service.create_order(db, payload)
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("Skipping seed order: %s", exc)
                continue

            # Backdate the order so the chart looks interesting.
            created = db.query(Order).order_by(Order.id.desc()).first()
            if created is not None:
                created.created_at = today - timedelta(days=days_ago, hours=rng.randint(0, 12))
                db.add(created)
                db.commit()
                n_orders += 1
    return n_orders


def run_seed() -> None:
    """Idempotently insert demo data into the database."""
    db = SessionLocal()
    try:
        products_ = _seed_products(db)
        customers_ = _seed_customers(db)
        n_orders = _seed_orders(db, products_, customers_)
        logger.info(
            "Seed complete: %d products, %d customers, %d orders",
            len(products_),
            len(customers_),
            n_orders,
        )
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_seed()
