# Fillos — Saved addresses module (backend)

**Path:** [backend/docs/modules/address-module.md](address-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Customers save **delivery addresses** and optionally attach one at **checkout**; a **text snapshot** is stored on the order for ops/drivers. **Testing:** [customer-api-testing §3.5](../testing/customer-api-testing.md#35-saved-addresses).

---

## 1. What this module does

- **CRUD** under **`/api/v1/users/me/addresses`** (same JWT as profile/cart).
- **`POST /api/v1/orders`** accepts an optional JSON body [`CheckoutRequest`](../../src/main/java/com/fillos/backend/orders/OrderDtos.java) with `deliveryAddressId` (must belong to the caller). When set, `orders.delivery_address_snapshot` stores a single formatted line derived from the saved address at checkout time. The same body may include optional **`customerNote`** (see [order-module](order-module.md)).

**Not included:** geocoding, address validation APIs, per-order ad-hoc address without saving.

---

## 2. Database (Flyway)

[V7__user_addresses.sql](../../src/main/resources/db/migration/V7__user_addresses.sql) — table `user_addresses`; column `orders.delivery_address_snapshot`; at most one **`is_default`** row per user (partial unique index).

---

## 3. HTTP API (reference only)

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/users/me/addresses` | Bearer | `UserAddressController.list` | `200` | `403` |
| `POST` | `/api/v1/users/me/addresses` | Bearer | `UserAddressController.create` | `201` | `400`, `403` |
| `PATCH` | `/api/v1/users/me/addresses/{addressId}` | Bearer | `UserAddressController.patch` | `200` | `400`, `403`, `404` |
| `DELETE` | `/api/v1/users/me/addresses/{addressId}` | Bearer | `UserAddressController.delete` | `204` | `403`, `404` |
| `POST` | `/api/v1/orders` | Bearer | `OrderController.checkout` | `201` | `400`, `403`, `404` |

Create body: [`CreateAddressRequest`](../../src/main/java/com/fillos/backend/address/AddressDtos.java). Checkout optional body: `{"deliveryAddressId":"<uuid>"}` or omit / empty object for legacy behaviour (no snapshot).

---

## 4. File reference

| File | Role |
| --- | --- |
| [UserAddressController.java](../../src/main/java/com/fillos/backend/address/UserAddressController.java) | REST |
| [AddressService.java](../../src/main/java/com/fillos/backend/address/AddressService.java) | Defaults + checkout snapshot |
| [AddressRepository.java](../../src/main/java/com/fillos/backend/address/AddressRepository.java) | JDBC |
| [AddressDtos.java](../../src/main/java/com/fillos/backend/address/AddressDtos.java) | DTOs |
| [SecurityConfig.java](../../src/main/java/com/fillos/backend/security/SecurityConfig.java) | `/api/v1/users/me` + `/api/v1/users/me/**` authenticated |

---

## 5. Related docs

- [order-module.md](order-module.md)  
- [delivery-module.md](delivery-module.md)  
- [security-auth-module.md](security-auth-module.md)

---

## 6. When to edit this doc

New address fields, validation rules, or checkout coupling changes.
