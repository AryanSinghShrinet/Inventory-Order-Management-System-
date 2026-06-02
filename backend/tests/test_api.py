"""End-to-end tests for the critical business rules."""

from decimal import Decimal


def _create_product(client, **overrides):
    body = {
        "name": "Test Product",
        "sku": "TEST-SKU-1",
        "description": "x",
        "price": "100.00",
        "stock_qty": 10,
        "low_stock_threshold": 2,
        "category": "Test",
    }
    body.update(overrides)
    return client.post("/products", json=body)


def _create_customer(client, **overrides):
    body = {
        "full_name": "Test Customer",
        "email": "test@example.com",
        "phone": "+1 555 0100",
    }
    body.update(overrides)
    return client.post("/customers", json=body)


def test_healthz(client):
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_product_crud(client):
    r = _create_product(client)
    assert r.status_code == 201, r.text
    pid = r.json()["id"]

    r = client.get(f"/products/{pid}")
    assert r.status_code == 200
    assert r.json()["sku"] == "TEST-SKU-1"

    r = client.put(f"/products/{pid}", json={"price": "199.00", "stock_qty": 25})
    assert r.status_code == 200
    assert Decimal(r.json()["price"]) == Decimal("199.00")
    assert r.json()["stock_qty"] == 25

    r = client.delete(f"/products/{pid}")
    assert r.status_code == 204


def test_product_sku_unique(client):
    r1 = _create_product(client, sku="DUPE-SKU")
    assert r1.status_code == 201
    r2 = _create_product(client, sku="DUPE-SKU", name="Other")
    assert r2.status_code == 409
    assert r2.json()["code"] == "duplicate_sku"
    assert r2.json()["fields"]["sku"] == "must be unique"


def test_product_sku_normalized_to_uppercase(client):
    r = _create_product(client, sku="  lower-sku ")
    assert r.status_code == 201
    assert r.json()["sku"] == "LOWER-SKU"


def test_product_price_and_stock_non_negative(client):
    r = _create_product(client, price="-1.00")
    assert r.status_code == 422
    r = _create_product(client, stock_qty=-5)
    assert r.status_code == 422


def test_customer_email_unique(client):
    r1 = _create_customer(client, email="dup@example.com")
    assert r1.status_code == 201
    r2 = _create_customer(client, email="dup@example.com", full_name="Other")
    assert r2.status_code == 409
    assert r2.json()["code"] == "duplicate_email"


def test_order_creation_reduces_stock_and_computes_total(client):
    p1 = _create_product(client, sku="ORDER-A", price="50.00", stock_qty=10).json()
    p2 = _create_product(client, sku="ORDER-B", price="20.00", stock_qty=8).json()
    c = _create_customer(client).json()

    r = client.post(
        "/orders",
        json={
            "customer_id": c["id"],
            "items": [
                {"product_id": p1["id"], "quantity": 2},
                {"product_id": p2["id"], "quantity": 3},
            ],
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert Decimal(body["total_amount"]) == Decimal("160.00")  # (2*50) + (3*20)
    assert sum(i["quantity"] for i in body["items"]) == 5

    assert client.get(f"/products/{p1['id']}").json()["stock_qty"] == 8
    assert client.get(f"/products/{p2['id']}").json()["stock_qty"] == 5


def test_order_insufficient_stock_rejected_and_stock_unchanged(client):
    p = _create_product(client, sku="LOW-STOCK", price="10.00", stock_qty=3).json()
    c = _create_customer(client).json()

    r = client.post(
        "/orders",
        json={
            "customer_id": c["id"],
            "items": [{"product_id": p["id"], "quantity": 5}],
        },
    )
    assert r.status_code == 409
    assert r.json()["code"] == "insufficient_stock"

    # Stock is unchanged
    r = client.get(f"/products/{p['id']}")
    assert r.json()["stock_qty"] == 3


def test_order_invalid_product_returns_404(client):
    c = _create_customer(client).json()
    r = client.post(
        "/orders",
        json={
            "customer_id": c["id"],
            "items": [{"product_id": 9999, "quantity": 1}],
        },
    )
    assert r.status_code == 404


def test_order_zero_or_negative_quantity_rejected(client):
    p = _create_product(client, sku="QTY-1").json()
    c = _create_customer(client, email="a@a.com").json()
    r = client.post(
        "/orders",
        json={
            "customer_id": c["id"],
            "items": [{"product_id": p["id"], "quantity": 0}],
        },
    )
    assert r.status_code == 422


def test_order_empty_items_rejected(client):
    c = _create_customer(client, email="b@b.com").json()
    r = client.post(
        "/orders",
        json={"customer_id": c["id"], "items": []},
    )
    assert r.status_code == 422


def test_delete_order_restores_stock(client):
    p = _create_product(client, sku="DEL-1", price="20.00", stock_qty=8).json()
    c = _create_customer(client, email="c@c.com").json()
    o = client.post(
        "/orders",
        json={
            "customer_id": c["id"],
            "items": [{"product_id": p["id"], "quantity": 3}],
        },
    ).json()

    assert client.get(f"/products/{p['id']}").json()["stock_qty"] == 5

    r = client.delete(f"/orders/{o['id']}")
    assert r.status_code == 204
    assert client.get(f"/products/{p['id']}").json()["stock_qty"] == 8


def test_dashboard_summary(client):
    for i in range(3):
        _create_product(client, sku=f"DASH-{i}", price="10.00", stock_qty=2, low_stock_threshold=10)
    for i in range(2):
        _create_customer(client, email=f"d{i}@d.com", full_name=f"User {i}")
    p = client.get("/products").json()[0]
    c = client.get("/customers").json()[0]
    client.post(
        "/orders",
        json={"customer_id": c["id"], "items": [{"product_id": p["id"], "quantity": 1}]},
    )

    r = client.get("/dashboard/summary")
    assert r.status_code == 200
    body = r.json()
    assert body["total_products"] == 3
    assert body["total_customers"] == 2
    assert body["total_orders"] == 1
    assert body["low_stock_count"] >= 1
    assert len(body["orders_last_14_days"]) == 14
