# Fillos — Payment state module (backend)

**Path:** [backend/docs/modules/payment-module.md](payment-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Track **`unpaid` / `paid`** on orders for COD or manual reconciliation. **Online:** [Razorpay](razorpay-module.md) (Checkout + webhook → same `paid` flag). **Testing:** [admin §3](../testing/admin-api-testing.md#3-admin-orders), [customer §4](../testing/customer-api-testing.md#4-orders).

---

## 1. What this module does

- **New checkouts** start as **`unpaid`** with `paidAt` null.
- **Admin** sets payment with **`PATCH /api/v1/admin/orders/{orderId}/payment`** and body `{"paymentStatus":"paid"}` or `"unpaid"`. **`paid`** sets **`paidAt`** to now; **`unpaid`** clears **`paidAt`**.
- **Customer** and **admin** order JSON include **`paymentStatus`** and **`paidAt`** (see [order-module](order-module.md)).

**Flyway one-time backfill:** existing orders before [V8](../../src/main/resources/db/migration/V8__order_payment.sql) are marked **`paid`** so dev databases do not flip everything to unpaid.

**Not included:** Razorpay client UI (frontend Checkout), refunds workflow, partial payments, Stripe/PayPal.

---

## 2. Database (Flyway)

[V8__order_payment.sql](../../src/main/resources/db/migration/V8__order_payment.sql) — enum `payment_status` (`unpaid`, `paid`); columns `orders.payment_status`, `orders.paid_at`. Razorpay ids: [V9](../../src/main/resources/db/migration/V9__razorpay_order_refs.sql).

---

## 3. HTTP API (reference only)

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `PATCH` | `/api/v1/admin/orders/{orderId}/payment` | Bearer admin | `AdminOrderController.patchPayment` | `200` | `400`, `403`, `404` |

Body: [`PatchPaymentRequest`](../../src/main/java/com/fillos/backend/orders/OrderDtos.java) — field **`paymentStatus`**: `unpaid` \| `paid`.

---

## 4. File reference

| File | Role |
| --- | --- |
| [OrderRepository.java](../../src/main/java/com/fillos/backend/orders/OrderRepository.java) | `updatePaymentStatus`, reads |
| [OrderService.java](../../src/main/java/com/fillos/backend/orders/OrderService.java) | `patchPaymentAdmin` |
| [AdminOrderController.java](../../src/main/java/com/fillos/backend/orders/AdminOrderController.java) | REST |
| [OrderDtos.java](../../src/main/java/com/fillos/backend/orders/OrderDtos.java) | `PatchPaymentRequest`, response fields |

---

## 5. Related docs

- [order-module.md](order-module.md)  
- [razorpay-module.md](razorpay-module.md)  
- [security-auth-module.md](security-auth-module.md)

---

## 6. When to edit this doc

PSP integration, new payment states, or rules tying payment to delivery.
