# Delivery API — testing guide

Postman: `baseUrl`, `adminToken`, `agentToken` (JWT for a user with role **`delivery_agent`**), `orderId`.

---

## 1. Get a delivery agent JWT

**Preferred:** admin creates the agent, then the agent logs in.

1. **`POST /api/v1/admin/staff/delivery-agents`** with admin Bearer — same JSON as customer register (`name`, optional `email`, `phone`, `password` ≥ 8 chars). **`201`** returns `id` and `role` `delivery_agent`.
2. **`POST /api/v1/auth/login`** with that `phone` + password → save `accessToken` as **`agentToken`**.

Optional **`GET /api/v1/admin/staff/delivery-agents`** lists `id` values for **`PATCH .../assign`**.

**Legacy dev path:** register a customer, then `UPDATE users SET role = 'delivery_agent' WHERE phone = '...'` in SQL if you cannot use the admin API.

Use **`Authorization: Bearer {{agentToken}}`** on delivery routes.

---

## 2. Admin assign → agent list → complete

| Step | Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- | --- |
| A | Customer checkout | Customer cart non-empty | `POST /api/v1/orders` with customer Bearer; optional `{"deliveryAddressId":"..."}` if you created an address ([customer §3.5](customer-api-testing.md#35-saved-addresses)) | — | `201`; save `orderId` |
| B | (Optional) `PATCH /api/v1/admin/orders/{orderId}/status` | Admin | Confirm kitchen ready | `{"status":"confirmed"}` | `200` |
| C | `PATCH /api/v1/admin/orders/{orderId}/assign` | Admin Bearer | JSON with agent’s user UUID | `{"deliveryAgentId":"<agent-user-uuid>"}` | `200`; `status` `out_for_delivery`, `deliveryAgentId` set |
| D | `GET /api/v1/delivery/orders` | Agent Bearer | No body | — | `200`; includes that order for customer phone |
| E | `POST /api/v1/delivery/orders/{orderId}/complete` | Agent Bearer | Path `orderId` | — | `204`; order becomes `delivered`, `deliveredAt` set |
| F | `GET /api/v1/delivery/orders` again | Agent Bearer | — | — | Order **gone** from list (only undelivered rows) |

**Failures:** assign with non–`delivery_agent` user → `400`. Order already assigned / wrong status → `409`. Agent completes another agent’s order → `404`.

---

## Module reference

[delivery-module.md](../modules/delivery-module.md), [order-module.md](../modules/order-module.md).
