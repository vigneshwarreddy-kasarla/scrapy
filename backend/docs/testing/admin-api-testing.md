# Admin API — testing guide

Postman: `baseUrl`, `adminToken` (from login or `register-admin`), `categoryId`, `itemId`, optional `adminRegSecret` (copy from env `FILLOS_ADMIN_REGISTRATION_SECRET`).

See [api-flow-mindmap.md](api-flow-mindmap.md) for how admin JWT fits in the overall flow.

---

## Environment

| Topic | Detail |
| --- | --- |
| Run stack | From `backend/`: `docker compose up -d` then start Spring Boot ([docker-compose.yml](../../docker-compose.yml)). |
| DB defaults | `foodapp` on `localhost:5432`, user `postgres` / `postgres` unless overridden. |
| Admin JWT sources | **A)** Bootstrap: set `FILLOS_BOOTSTRAP_ADMIN=true` and `FILLOS_ADMIN_PASSWORD`, restart, then `POST /api/v1/auth/login` with `FILLOS_ADMIN_PHONE` + that password. **B)** `POST /api/v1/auth/register-admin` with `FILLOS_ADMIN_REGISTRATION_ENABLED=true`, non-empty `FILLOS_ADMIN_REGISTRATION_SECRET`, header `X-Admin-Registration-Secret` matching secret. |
| Wrong role | Customer token on `/api/v1/admin/**` → `403`. |

---

## 1. Auth used only for admin provisioning

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `POST /api/v1/auth/register-admin` | `FILLOS_ADMIN_REGISTRATION_ENABLED=true` and secret set in env; header required | Add header `X-Admin-Registration-Secret: <same as env>`; `Content-Type: application/json`; **unique** phone vs DB. | Same JSON shape as customer register | `201` + `accessToken` (user role `admin`). Wrong/missing secret or feature off → **`404`** (no body hint) |

---

## 2. Admin menu routes

Use header `Authorization: Bearer` + `adminToken` on every row below.

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `GET /api/v1/admin/menu/categories` | Admin JWT | GET + Bearer. | — | `200`; array (includes inactive categories) |
| `GET /api/v1/admin/menu/categories/{id}/items` | Admin JWT + known category UUID | Path `{id}`. | — | `200` list or `404` |
| `POST /api/v1/admin/menu/categories` | Admin JWT | JSON body `CreateCategoryRequest`. | `{"name":"Mains","displayOrder":1,"imageUrl":null,"active":true}` | `201`; read **`Location`** header for new category UUID |
| `PUT /api/v1/admin/menu/categories/{id}` | Admin JWT | Full category replace. | Same field names as create | `204` or `404` |
| `DELETE /api/v1/admin/menu/categories/{id}` | Admin JWT | Deletes items in category then category. | — | `204` or `404` |
| `POST /api/v1/admin/menu/items` | Admin JWT + valid `categoryId` | `CreateMenuItemRequest`. | `{"categoryId":"<uuid>","name":"Plain Dosa","description":null,"price":6.00,"discountedPrice":null,"imageUrl":null,"veg":true,"available":true,"preparationTime":10,"calories":null,"tags":["gluten-free"],"displayOrder":0}` | `201`; **`Location`** = `/api/v1/menu/items/{newUuid}` |
| `PUT /api/v1/admin/menu/items/{id}` | Admin JWT | `UpdateMenuItemRequest` (same fields as create). | Full JSON | `204`, `400`, or `404` |
| `PATCH /api/v1/admin/menu/items/{id}/availability` | Admin JWT | Toggle availability. | `{"available":false}` | `204` or `404` |
| `DELETE /api/v1/admin/menu/items/{id}` | Admin JWT | — | — | `204` or `404` |

**After `POST` category/item:** parse `Location` (relative path + UUID) to fill `categoryId` / `itemId` for the next request or for [customer public GET](customer-api-testing.md#1-public-no-token).

---

## 3. Admin orders

Use `Authorization: Bearer` + `adminToken`. At least one **customer checkout** ([customer §4](customer-api-testing.md#4-orders)) helps populate rows to list.

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `GET /api/v1/admin/orders` | Admin JWT | Optional query `limit` (1–100, default 50), `offset` (default 0). | `GET .../admin/orders?limit=20&offset=0` | `200`; array includes `paymentStatus`, `paidAt`, `deliveryAgentId`, `deliveredAt`, `deliveryAddressSnapshot` when relevant |
| `GET /api/v1/admin/orders/{orderId}` | Admin JWT + UUID | Path from list or customer checkout response. | — | `200`; full order + `customerPhone` + line snapshots + `customerNote` + payment fields |
| `PATCH /api/v1/admin/orders/{orderId}/status` | Admin JWT | `Content-Type: application/json`. | `{"status":"confirmed"}` or `{"status":"cancelled"}` (also `out_for_delivery` / `delivered` if needed) | `200`; full order JSON after update; unknown id → `404` |
| `PATCH /api/v1/admin/orders/{orderId}/payment` | Admin JWT | Manual / COD flags ([payment-module](../modules/payment-module.md)). | `{"paymentStatus":"paid"}` or `{"paymentStatus":"unpaid"}` | `200`; `paid` sets `paidAt` to now; `unpaid` clears `paidAt` |
| `PATCH /api/v1/admin/orders/{orderId}/assign` | Admin JWT + order in `placed` or `confirmed`, no agent yet | `{"deliveryAgentId":"<user-uuid>"}` where user exists, active, role **`delivery_agent`** | `200`; order `out_for_delivery` + `deliveryAgentId`; wrong user / state → `400` or `409` |

Full assign → agent complete flow: [delivery-api-testing.md](delivery-api-testing.md).

---

## 3b. Admin reviews (list + delete)

After at least one **customer** post-delivery review ([customer §4](customer-api-testing.md#4-orders)), this list is non-empty.

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `GET /api/v1/admin/reviews` | Admin JWT | Optional `limit` (1–100, default 50), `offset` (default 0). | `GET .../admin/reviews?limit=20&offset=0` | `200`; array of `reviewId`, `orderId`, `userId`, `customerPhone`, `rating`, `comment`, `createdAt` ([reviews-module](../modules/reviews-module.md)) |
| `DELETE /api/v1/admin/reviews/{reviewId}` | Admin JWT + `reviewId` from list | DELETE + Bearer | Path `reviewId` | **`204`** empty; **`404`** if unknown id |

---

## 4. Admin staff (delivery agents)

Use `Authorization: Bearer` + `adminToken`. Body shape for `POST` matches customer **`POST /api/v1/auth/register`** ([`RegisterRequest`](../../src/main/java/com/fillos/backend/auth/AuthDtos.java)).

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `GET /api/v1/admin/staff/delivery-agents` | Admin JWT | GET + Bearer | — | `200`; `[{ id, name, phone, email }, …]` (active agents only) |
| `POST /api/v1/admin/staff/delivery-agents` | Admin JWT | Unique 10-digit India phone vs DB (server stores `+91`); password policy: 8–72 chars, uppercase+lowercase+number+special, no spaces | `{"name":"Rider One","email":null,"phone":"9876543222","password":"ChangeMe1!"}` | `201`; profile with `role` `delivery_agent` — then agent **`POST .../auth/login`** for JWT |

Module: [staff-module.md](../modules/staff-module.md).

---

## Production checklist (short)

| Area | Action |
| --- | --- |
| Secrets | `JWT_SECRET`, DB password, `FILLOS_ADMIN_REGISTRATION_SECRET` in secret store — not git. |
| HTTPS | Terminate TLS in front of the API in production. |
| CORS | Add real frontend origins in `SecurityConfig` for prod. |

---

## Module reference

[menu-module.md](../modules/menu-module.md), [order-module.md](../modules/order-module.md), [reviews-module.md](../modules/reviews-module.md), [payment-module.md](../modules/payment-module.md), [delivery-module.md](../modules/delivery-module.md), [staff-module.md](../modules/staff-module.md), [security-auth-module.md](../modules/security-auth-module.md).
