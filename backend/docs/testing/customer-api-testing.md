# Customer API — testing guide

Postman environment: `baseUrl` = `http://localhost:8080`. Optional: `accessToken`, `categoryId`, `menuItemId`, `lineId`, `addressId`, `orderId`.

See [api-flow-mindmap.md](api-flow-mindmap.md) for prerequisites between routes.

---

## 1. Public (no token)

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `GET /api/v1/health` | None | Send GET; no headers. | — | `200`; `ok`, `service`, `time` — see [health-module.md](../modules/health-module.md) |
| `GET /api/v1/menu/categories` | None | GET; no auth. | — | `200`; JSON array of categories (`id`, `name`, `displayOrder`, …) |
| `GET /api/v1/menu/categories/{id}/items` | Valid **active** category `id` from previous GET | Replace `{id}` in URL. | Path only | `200` + items array, or `404` if category inactive/missing for customers |
| `GET /api/v1/menu/items/{id}` | Item UUID (from items list or admin `Location`) | Replace `{id}`. | Path only | `200` + one item JSON, or `404` if not visible to customers |
| `GET /api/v1/reviews/summary` | None | GET; no auth. | — | `200`; `averageRating` (nullable), `reviewCount` — global stats ([reviews-module](../modules/reviews-module.md)) |

---

## 2. Auth and profile (customer token)

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `POST /api/v1/auth/register` | None | `Content-Type: application/json`. Unique 10-digit India `phone` (server stores `+91` prefix). Password policy: 8–72 chars, uppercase+lowercase+number+special, no spaces. | `{"name":"Ada","email":"ada@example.com","phone":"9876543210","password":"Longpass1!"}` | `201`; body `accessToken`, `tokenType`, `expiresInSeconds` — save token |
| `POST /api/v1/auth/login` | Existing user | Same header; body 10-digit India phone + password. | `{"phone":"9876543210","password":"Longpass1!"}` | `200`; same token shape |
| `GET /api/v1/users/me` | Valid **customer** Bearer token | Authorization type Bearer; paste token **without** quotes. | No body | `200`; `id`, `name`, `email`, `phone`, `role`, `active`, **`pushRegistered`** |
| `PATCH /api/v1/users/me` | Bearer token | JSON with fields to change (omit to keep). | `{"name":"Ada Lovelace"}` or `{"email":"new@example.com"}` | `200`; updated profile JSON (includes **`pushRegistered`**) |
| `PUT /api/v1/users/me/push-token` | Bearer | Register FCM device token for future pushes ([push-module](../modules/push-module.md)). | `{"fcmToken":"<long-token-from-client-SDK>"}` | `200`; profile JSON; token **not** echoed back |
| `DELETE /api/v1/users/me/push-token` | Bearer | Clear stored token (e.g. logout on device). | — | `200`; `pushRegistered` becomes `false` |
| `POST /api/v1/auth/logout` | Bearer token | POST; no body. | — | `204` empty; **same token** must then fail on `GET /users/me` (`403` typical) |

**Notes:** `phone` must match validation (10–15 digits, optional leading `+`). Use **GET** for profile, not POST. Admin-only URLs return `403` with a customer token.

---

## 3. Cart

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `GET /api/v1/cart` | Bearer customer token | GET; no body. | — | `200`; `cartId`, `lines[]`, `subtotal` |
| `POST /api/v1/cart/items` | Token + **`menuItemId`** from **public** menu (available item, active category) | `Content-Type: application/json`. | `{"menuItemId":"<uuid>","quantity":2}` | `204` no body |
| `PATCH /api/v1/cart/items/{lineId}` | Token + `lineId` from `GET /cart` response | Replace `{lineId}`. | `{"quantity":3}` | `204` or `404` |
| `DELETE /api/v1/cart/items/{lineId}` | Token + valid `lineId` | DELETE; no body. | — | `204` or `404` |
| `DELETE /api/v1/cart` | Token | DELETE entire cart lines. | — | `204` |

**Typical failure:** `POST /cart/items` with bad UUID → `400` `"Menu item not available"`. No token → `403`.

---

## 3.5. Saved addresses

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `GET /api/v1/users/me/addresses` | Bearer | GET; no body. | — | `200`; array of saved addresses |
| `POST /api/v1/users/me/addresses` | Bearer | JSON; see [address-module.md](../modules/address-module.md). | `{"label":"Home","line1":"1 Main St","line2":null,"city":"Austin","region":"TX","postalCode":"78701","country":"US","isDefault":true}` | `201`; save `id` as `addressId` for checkout |
| `PATCH` / `DELETE` | Bearer + owned `addressId` | See module doc. | — | `200` / `204` |

---

## 4. Orders

| Route | Prerequisites | How to test | Example input | Output |
| --- | --- | --- | --- | --- |
| `POST /api/v1/orders` | Bearer + **non-empty cart** (§3) | POST; optional JSON. | — or `{"deliveryAddressId":"<addressId>"}` from §3.5, optionally `"customerNote":"Ring doorbell"` (≤ 500 chars) | `201`; includes `paymentStatus` **`unpaid`**, `paidAt` (often null), `deliveryAddressSnapshot` when address sent, **`customerNote`** (null if omitted); cart **cleared** |
| `POST /api/v1/orders` | Bearer + **empty cart** | POST with nothing in cart. | — | `400` `"Cart is empty"` |
| `GET /api/v1/orders` | Bearer | List recent orders (up to 50). | — | `200`; each row includes `paymentStatus`, `paidAt` |
| `GET /api/v1/orders/{orderId}` | Bearer + id from list or checkout | Path `orderId`. | — | `200`; lines + `paymentStatus` / `paidAt` + optional `deliveryAddressSnapshot` |
| `POST /api/v1/orders/{orderId}/cancel` | Bearer + own order in **`placed`** or **`confirmed`**, **`unpaid`**, not delivered | POST; no body | — | `200`; order JSON with `status` **`cancelled`**; already paid / out for delivery / wrong user → **`409`** or **`404`** |
| `POST /api/v1/orders/{orderId}/review` | Bearer + own order **`delivered`**; no existing review | `{"rating":5,"comment":"Great!"}` — `rating` 1–5, `comment` optional | — | `201`; review id + rating + comment ([reviews-module](../modules/reviews-module.md)) |
| `GET /api/v1/orders/{orderId}/review` | Bearer + own `orderId` | — | — | `200` review JSON, or **`404`** if none / not your order |
| `PATCH /api/v1/orders/{orderId}/review` | Bearer + own order + review exists + **within 24h** of review `createdAt` | Same JSON as `POST` | `{"rating":4,"comment":"Updated"}` | `200` updated review; **`409`** if outside 24h |
| `DELETE /api/v1/orders/{orderId}/review` | Bearer + own order + review + **within 24h** | DELETE; no body | — | **`204`**; **`409`** if outside 24h |
| `POST /api/v1/orders/{orderId}/payments/razorpay/order` | Bearer + **unpaid** order you own; [Razorpay enabled](../modules/razorpay-module.md#2-configuration-applicationyml--env) | Path `orderId`; no body | — | `200`; JSON `keyId`, `razorpayOrderId`, `amount` (paise for INR), `currency`, `fillosOrderId` — feed Checkout on web/app |
| `POST /api/v1/webhooks/razorpay` | Razorpay servers (not your JWT) | Raw JSON body + header **`X-Razorpay-Signature`**; configure URL in Razorpay Dashboard | Event `payment.captured` | `200`; Fillos order becomes **`paid`** when signature + `order_id` match |

After checkout, **admin payment**, **assign**, and **delivery agent** flows: [admin-api-testing.md](admin-api-testing.md#3-admin-orders), [delivery-api-testing.md](delivery-api-testing.md). Payment flags: [payment-module.md](../modules/payment-module.md).

---

## Module reference

Slim route tables: [health-module.md](../modules/health-module.md), [security-auth-module.md](../modules/security-auth-module.md), [push-module.md](../modules/push-module.md), [cart-module.md](../modules/cart-module.md), [address-module.md](../modules/address-module.md), [order-module.md](../modules/order-module.md), [reviews-module.md](../modules/reviews-module.md), [payment-module.md](../modules/payment-module.md), [razorpay-module.md](../modules/razorpay-module.md), [menu-module.md](../modules/menu-module.md), [delivery-module.md](../modules/delivery-module.md), [staff-module.md](../modules/staff-module.md).
