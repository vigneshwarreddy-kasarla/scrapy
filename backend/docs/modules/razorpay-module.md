# Fillos — Razorpay module (backend)

**Path:** [backend/docs/modules/razorpay-module.md](razorpay-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Create **Razorpay Orders** for existing Fillos orders (client Checkout), then mark **`paid`** via **signed webhooks** when Razorpay sends `payment.captured`. Works alongside manual **`PATCH .../payment`** ([payment-module](payment-module.md)). **Testing:** [customer-api-testing §4](../testing/customer-api-testing.md#4-orders), env vars below.

---

## 1. What this module does

- **Customer** — `POST /api/v1/orders/{orderId}/payments/razorpay/order` (Bearer, order must belong to caller). Returns **`keyId`**, **`razorpayOrderId`**, **`amount`** (smallest currency unit, e.g. **paise** for INR), **`currency`**, **`fillosOrderId`** for [Razorpay Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration) on the frontend.
- **Razorpay** — `POST /api/v1/webhooks/razorpay` (no JWT). Verifies **`X-Razorpay-Signature`** with **`fillos.razorpay.webhook-secret`**. On **`payment.captured`**, sets Fillos order **`payment_status = paid`**, **`paid_at`**, stores **`razorpay_payment_id`** when still **`unpaid`** and **`razorpay_order_id`** matches.

**Guards:** Razorpay disabled or keys missing → **`503`**. Cancelled / delivered / already **paid** Fillos orders → **`400`** / **`409`**. Re-calling create when an unpaid order already has a Razorpay order id → **same payload** (idempotent).

**Not included:** refund APIs, subscriptions, Route split, capturing from backend only (Checkout is client-driven here), non-INR amount rules beyond “major unit × 100”.

---

## 2. Configuration (`application.yml` + env)

| Key / env | Meaning |
| --- | --- |
| `fillos.razorpay.enabled` / `RAZORPAY_ENABLED` | `true` to turn on create + webhook handling. |
| `fillos.razorpay.key-id` / `RAZORPAY_KEY_ID` | Key ID from Razorpay Dashboard (safe for client). |
| `fillos.razorpay.key-secret` / `RAZORPAY_KEY_SECRET` | Key secret (server only). |
| `fillos.razorpay.webhook-secret` / `RAZORPAY_WEBHOOK_SECRET` | Webhook signing secret from Dashboard (required for webhook to run). |
| `fillos.razorpay.currency` / `RAZORPAY_CURRENCY` | Default **`INR`**. |

[RazorpayProperties.java](../../src/main/java/com/fillos/backend/config/RazorpayProperties.java)

---

## 3. Database (Flyway)

[V9__razorpay_order_refs.sql](../../src/main/resources/db/migration/V9__razorpay_order_refs.sql) — `orders.razorpay_order_id`, `orders.razorpay_payment_id` (unique index on Razorpay order id).

---

## 4. HTTP API (reference only)

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/orders/{orderId}/payments/razorpay/order` | Bearer customer | `OrderRazorpayController.createRazorpayOrder` | `200` + body | `400`, `403`, `404`, `409`, `502`, `503` |
| `POST` | `/api/v1/webhooks/razorpay` | `X-Razorpay-Signature` | `RazorpayWebhookController.razorpay` | `200` | `400`, `503` |

Webhook URL for Dashboard: `https://<your-api-host>/api/v1/webhooks/razorpay` (local dev: tunnel or Razorpay CLI where supported).

---

## 5. File reference

| File | Role |
| --- | --- |
| [RazorpayPaymentService.java](../../src/main/java/com/fillos/backend/payments/RazorpayPaymentService.java) | Create order, webhook handler |
| [OrderRazorpayController.java](../../src/main/java/com/fillos/backend/orders/OrderRazorpayController.java) | Customer REST |
| [RazorpayWebhookController.java](../../src/main/java/com/fillos/backend/payments/RazorpayWebhookController.java) | Webhook REST |
| [OrderRepository.java](../../src/main/java/com/fillos/backend/orders/OrderRepository.java) | `findForRazorpayCheckout`, `attachRazorpayOrderId`, `markPaidFromRazorpayWebhook` |
| [SecurityConfig.java](../../src/main/java/com/fillos/backend/security/SecurityConfig.java) | Public `POST` webhook |

---

## 6. Related docs

- [payment-module.md](payment-module.md)  
- [order-module.md](order-module.md)  
- [security-auth-module.md](security-auth-module.md)

---

## 7. When to edit this doc

New events, capture modes, multi-currency amount rules, or refund flows.
