# Fillos — Delivery module (backend)

**Path:** [backend/docs/modules/delivery-module.md](delivery-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Assign orders to **delivery agents** and let agents **list** active jobs and **mark delivered**. Tied to [order-module](order-module.md) schema (`delivery_agent_id`, `delivered_at`, statuses `out_for_delivery`, `delivered`).

---

## 1. What this module does

- **Admin** assigns a user with role `delivery_agent` to an order in status `placed` or `confirmed` (no agent yet, not delivered) → status becomes **`out_for_delivery`**.
- **Agent** lists open assignments: `GET /api/v1/delivery/orders` (requires **`ROLE_DELIVERY_AGENT`**); each row may include **`deliveryAddressSnapshot`**, **`customerNote`**, **`paymentStatus`**, **`paidAt`** ([address-module](address-module.md), [payment-module](payment-module.md)).
- **Agent** completes: `POST /api/v1/delivery/orders/{orderId}/complete` → status **`delivered`**, `delivered_at` set.

**Creating delivery users:** use **[staff-module](staff-module.md)** (`POST /api/v1/admin/staff/delivery-agents`) or seed/DB in dev. See [delivery-api-testing.md](../testing/delivery-api-testing.md).

---

## 2. Database (Flyway)

[V6__orders_delivery.sql](../../src/main/resources/db/migration/V6__orders_delivery.sql) — enum values `out_for_delivery`, `delivered`; columns `orders.delivery_agent_id`, `orders.delivered_at`.

---

## 3. HTTP API (reference only)

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `PATCH` | `/api/v1/admin/orders/{orderId}/assign` | Bearer admin | `AdminOrderController.assignDelivery` | `200` | `400`, `403`, `404`, `409` |
| `GET` | `/api/v1/delivery/orders` | Bearer delivery agent | `DeliveryController.myOrders` | `200` | `403` |
| `POST` | `/api/v1/delivery/orders/{orderId}/complete` | Bearer delivery agent | `DeliveryController.complete` | `204` | `403`, `404` |

**Assign body:** `{"deliveryAgentId":"<uuid>"}` ([`AssignDeliveryRequest`](../../src/main/java/com/fillos/backend/orders/OrderDtos.java)).

---

## 4. File reference

| File | Role |
| --- | --- |
| [DeliveryController.java](../../src/main/java/com/fillos/backend/orders/DeliveryController.java) | Agent REST |
| [AdminOrderController.java](../../src/main/java/com/fillos/backend/orders/AdminOrderController.java) | `PATCH .../assign` |
| [OrderService.java](../../src/main/java/com/fillos/backend/orders/OrderService.java) | Assign / list / complete logic |
| [OrderRepository.java](../../src/main/java/com/fillos/backend/orders/OrderRepository.java) | JDBC updates + agent list |
| [SecurityConfig.java](../../src/main/java/com/fillos/backend/security/SecurityConfig.java) | `/api/v1/delivery/**` → `ROLE_DELIVERY_AGENT` |

---

## 5. Related docs

- [order-module.md](order-module.md)  
- [address-module.md](address-module.md)  
- [payment-module.md](payment-module.md)  
- [staff-module.md](staff-module.md)  
- [security-auth-module.md](security-auth-module.md)  
- [delivery-api-testing.md](../testing/delivery-api-testing.md)

---

## 6. When to edit this doc

New delivery endpoints, assignment rules, or GPS/proof-of-delivery fields.
