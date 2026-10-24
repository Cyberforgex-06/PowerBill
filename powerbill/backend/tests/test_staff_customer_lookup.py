from __future__ import annotations

from app.extensions import db
from app.models import User
from tests.conftest import ORIGIN, login


def test_staff_customer_lookup_is_private_and_role_restricted(client, seeded):
    endpoint = "/api/v1/staff/customers"
    assert client.get(endpoint, base_url=ORIGIN).status_code == 401
    assert login(client, "adaeze@example.com").status_code == 200
    assert client.get(endpoint, base_url=ORIGIN).status_code == 403


def test_billing_officer_can_search_active_customers_only(client, app, seeded):
    with app.app_context():
        inactive = db.session.query(User).filter_by(email="musa@example.com").one()
        inactive.is_active = False
        db.session.commit()
    assert login(client, "officer@example.com").status_code == 200
    response = client.get("/api/v1/staff/customers?q=Adaeze", base_url=ORIGIN)
    assert response.status_code == 200
    items = response.get_json()["items"]
    assert len(items) == 1
    assert items[0]["email"] == "adaeze@example.com"
    response = client.get("/api/v1/staff/customers", base_url=ORIGIN)
    assert response.status_code == 200
    assert [item["email"] for item in response.get_json()["items"]] == ["adaeze@example.com"]


def test_admin_can_search_customers_by_email_and_reject_unknown_filters(client, seeded):
    assert login(client, "admin@example.com").status_code == 200
    response = client.get("/api/v1/staff/customers?q=musa%40example.com", base_url=ORIGIN)
    assert response.status_code == 200
    assert [item["email"] for item in response.get_json()["items"]] == ["musa@example.com"]
    assert client.get("/api/v1/staff/customers?role=admin", base_url=ORIGIN).status_code == 400
