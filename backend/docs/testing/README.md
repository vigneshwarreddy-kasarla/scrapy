# Fillos API — testing docs

Concise **how to test** guides (Postman-friendly). Module reference tables stay in [`../modules/`](../modules/).

| Doc | Audience |
| --- | --- |
| [api-flow-mindmap.md](api-flow-mindmap.md) | Which routes need a token or prior calls (visual). |
| [customer-api-testing.md](customer-api-testing.md) | Public APIs, customer JWT, profile, cart, public menu. |
| [admin-api-testing.md](admin-api-testing.md) | Admin JWT, menu CRUD, staff agents, optional `register-admin`. |
| [delivery-api-testing.md](delivery-api-testing.md) | Delivery agent JWT, assign → list → complete. |
| [health-module.md](../modules/health-module.md) | `GET /api/v1/health` reference (liveness JSON). |
| [order-module.md](../modules/order-module.md) | Checkout, admin orders, links to delivery. |
| [staff-module.md](../modules/staff-module.md) | Admin create/list delivery agents. |
| [address-module.md](../modules/address-module.md) | Saved addresses + checkout snapshot. |
| [payment-module.md](../modules/payment-module.md) | Admin `paid` / `unpaid` on orders (no PSP). |
| [razorpay-module.md](../modules/razorpay-module.md) | Razorpay Checkout order + webhook → `paid`. |
| [push-module.md](../modules/push-module.md) | FCM-style device token on `users.me`. |
| [reviews-module.md](../modules/reviews-module.md) | Post-delivery reviews; 24h customer edit/delete; admin list/delete; public summary. |

**Setup:** `baseUrl` = `http://localhost:8080`; run Postgres + app (see [admin-api-testing.md](admin-api-testing.md#environment) for Docker / env).

**Dev seed data:** Flyway **`V12__dev_seed_dummy_data.sql`** inserts sample users/menu/orders/review, **`V13__seed_password_policy_update.sql`** updates those seed passwords to policy-compliant **`DummyPass1!`**, and **`V15__normalize_seed_phones_and_drop_salt.sql`** normalizes legacy seed phones to India format (phones **`+919995550001`** / **`+919995550002`** / **`+919995550003`**). Images live in **`dummyimages/`** (repo root) and **`backend/src/main/resources/static/dummyimages/`**; URLs use **`http://localhost:8080/dummyimages/...`**. Use a fresh DB or expect `ON CONFLICT` skips if phones already exist.
