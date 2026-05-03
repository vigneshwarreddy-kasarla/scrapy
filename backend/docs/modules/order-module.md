# Fillos — Orders module (backend)

**Path:** [backend/docs/modules/order-module.md](order-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Customer **checkout** from cart (optional [saved address](address-module.md) snapshot); **admin** list/detail, **status**, **payment**, **assign delivery**; agent flows in [delivery-module](delivery-module.md). **Payment flags:** [payment-module](payment-module.md); **Razorpay Checkout:** [razorpay-module](razorpay-module.md). **Testing:** [customer §3.5–4](../testing/customer-api-testing.md#35-saved-addresses), [admin §3](../testing/admin-api-testing.md#3-admin-orders), [admin §3b](../testing/admin-api-testing.md#3b-admin-reviews-read-only-list), [delivery](../testing/delivery-api-testing.md).

---

## 1. What this module does

**Customer**

- **`POST /api/v1/orders`** — Snapshot cart → `orders` + `order_items`, clear cart lines. New orders start **`paymentStatus` = `unpaid`**. Optional JSON [`CheckoutRequest`](../../src/main/java/com/fillos/backend/orders/OrderDtos.java): optional `deliveryAddressId` → `delivery_address_snapshot` (see [address-module](address-module.md)); optional **`customerNote`** (≤ 500 chars, trimmed; blank → stored as null) → `orders.customer_note` for kitchen / rider. Order list/detail responses include **`customerNote`**.
- **`GET /api/v1/orders`** — Own orders (latest 50); each summary includes **`paymentStatus`**, **`paidAt`**.
- **`GET /api/v1/orders/{orderId}`** — Own order detail (same payment fields on full body).
- **`POST /api/v1/orders/{orderId}/payments/razorpay/order`** — Create/reuse Razorpay Order for Checkout; requires [Razorpay env](razorpay-module.md#2-configuration-applicationyml--env) enabled.
- **`POST /api/v1/orders/{orderId}/cancel`** — Sets status **`cancelled`** only when order is **`placed`** or **`confirmed`**, **`paymentStatus` is `unpaid`**, and not delivered. Wrong user → **`404`**; wrong state / already paid → **`409`**.
- **`POST` / `GET` / `PATCH` / `DELETE /api/v1/orders/{orderId}/review`** — Rating for **delivered** orders (post); read; **customer** update/delete within **24h** of review `createdAt`. **Public** summary and **admin** list/delete on separate paths; see [reviews-module](reviews-module.md).

**Admin** (`ROLE_ADMIN`, path `/api/v1/admin/orders/**`)

- **`GET /api/v1/admin/orders`** — All orders, `?limit=` (1–100, default 50) and `?offset=` (default 0); includes `userId` + customer `phone`.
- **`GET /api/v1/admin/orders/{orderId}`** — Any order detail + customer phone.
- **`PATCH /api/v1/admin/orders/{orderId}/status`** — Body `{"status":"placed"|"confirmed"|"cancelled"|"out_for_delivery"|"delivered"}` (usually prefer **assign** / agent **complete** for the last two; see [delivery-module](delivery-module.md)).
- **`PATCH /api/v1/admin/orders/{orderId}/assign`** — Body `{"deliveryAgentId":"<uuid>"}`; assigns agent, sets **`out_for_delivery`**.
- **`PATCH /api/v1/admin/orders/{orderId}/payment`** — Body `{"paymentStatus":"paid"|"unpaid"}` — see [payment-module](payment-module.md).

**Not included:** frontend Razorpay Checkout UI, automatic refunds when cancelling after online pay.

---

## 2. Database (Flyway)

| Object | Meaning |
| --- | --- |
| `order_status` | `placed`, `confirmed`, `cancelled` ([V5](../../src/main/resources/db/migration/V5__order_status_expand.sql)); `out_for_delivery`, `delivered` ([V6](../../src/main/resources/db/migration/V6__orders_delivery.sql)). |
| `orders` | `user_id`, `status`, `total_amount`, `delivery_agent_id`, `delivered_at`, `delivery_address_snapshot` ([V7](../../src/main/resources/db/migration/V7__user_addresses.sql)), `payment_status`, `paid_at` ([V8](../../src/main/resources/db/migration/V8__order_payment.sql)), `razorpay_order_id`, `razorpay_payment_id` ([V9](../../src/main/resources/db/migration/V9__razorpay_order_refs.sql)), **`customer_note`** ([V11](../../src/main/resources/db/migration/V11__order_customer_note.sql)), timestamps. |
| `order_items` | Snapshot columns + optional `menu_item_id`. |

[V4__orders.sql](../../src/main/resources/db/migration/V4__orders.sql) … [V9__razorpay_order_refs.sql](../../src/main/resources/db/migration/V9__razorpay_order_refs.sql), [V11__order_customer_note.sql](../../src/main/resources/db/migration/V11__order_customer_note.sql).

---

## 3. HTTP API — customer

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/orders` | Bearer | `OrderController.checkout` | `201` | `400`, `403`, `404` |
| `GET` | `/api/v1/orders` | Bearer | `OrderController.list` | `200` | `403` |
| `GET` | `/api/v1/orders/{orderId}` | Bearer | `OrderController.get` | `200` | `403`, `404` |
| `POST` | `/api/v1/orders/{orderId}/payments/razorpay/order` | Bearer | `OrderRazorpayController.createRazorpayOrder` | `200` | `400`, `403`, `404`, `409`, `502`, `503` |
| `POST` | `/api/v1/orders/{orderId}/cancel` | Bearer | `OrderController.cancel` | `200` | `403`, `404`, `409` |
| `POST` | `/api/v1/orders/{orderId}/review` | Bearer | `OrderReviewController.submit` | `201` | `400`, `403`, `409` |
| `GET` | `/api/v1/orders/{orderId}/review` | Bearer | `OrderReviewController.get` | `200` | `403`, `404` |
| `PATCH` | `/api/v1/orders/{orderId}/review` | Bearer | `OrderReviewController.patch` | `200` | `403`, `404`, `409` |
| `DELETE` | `/api/v1/orders/{orderId}/review` | Bearer | `OrderReviewController.delete` | `204` | `403`, `404`, `409` |

---

## 4. HTTP API — admin

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/admin/orders` | Bearer admin | `AdminOrderController.list` | `200` | `403` |
| `GET` | `/api/v1/admin/orders/{orderId}` | Bearer admin | `AdminOrderController.get` | `200` | `403`, `404` |
| `PATCH` | `/api/v1/admin/orders/{orderId}/status` | Bearer admin | `AdminOrderController.patchStatus` | `200` | `400`, `403`, `404` |
| `PATCH` | `/api/v1/admin/orders/{orderId}/payment` | Bearer admin | `AdminOrderController.patchPayment` | `200` | `400`, `403`, `404` |
| `PATCH` | `/api/v1/admin/orders/{orderId}/assign` | Bearer admin | `AdminOrderController.assignDelivery` | `200` | `400`, `403`, `404`, `409` |

---

## 5. File reference

| File | Role |
| --- | --- |
| [OrderController.java](../../src/main/java/com/fillos/backend/orders/OrderController.java) | Customer REST |
| [OrderRazorpayController.java](../../src/main/java/com/fillos/backend/orders/OrderRazorpayController.java) | Razorpay create order |
| [AdminOrderController.java](../../src/main/java/com/fillos/backend/orders/AdminOrderController.java) | Admin REST |
| [OrderService.java](../../src/main/java/com/fillos/backend/orders/OrderService.java) | Checkout + admin reads/patch |
| [OrderRepository.java](../../src/main/java/com/fillos/backend/orders/OrderRepository.java) | JDBC |
| [OrderDtos.java](../../src/main/java/com/fillos/backend/orders/OrderDtos.java) | DTOs + `CheckoutRequest`, `PatchOrderStatusRequest`, `PatchPaymentRequest`, `AssignDeliveryRequest` |
| [DeliveryController.java](../../src/main/java/com/fillos/backend/orders/DeliveryController.java) | Agent list / complete (see [delivery-module](delivery-module.md)) |
| [OrderReviewController.java](../../src/main/java/com/fillos/backend/reviews/OrderReviewController.java) | Customer reviews ([reviews-module](reviews-module.md)) |

---

## 6. Related docs

- [cart-module.md](cart-module.md)  
- [address-module.md](address-module.md)  
- [security-auth-module.md](security-auth-module.md)  
- [menu-module.md](menu-module.md)  
- [delivery-module.md](delivery-module.md)  
- [payment-module.md](payment-module.md)  
- [razorpay-module.md](razorpay-module.md)  
- [reviews-module.md](reviews-module.md)  
- [Testing index](../testing/README.md)

---

## 7. When to edit this doc

New order statuses or endpoints (delivery: [delivery-module](delivery-module.md); PSP payments: [payment-module](payment-module.md)).
