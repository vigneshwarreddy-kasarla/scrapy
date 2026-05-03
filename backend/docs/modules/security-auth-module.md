# Fillos — Security, JWT, auth, users, bootstrap (backend)

**Path:** [backend/docs/modules/security-auth-module.md](security-auth-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Spring Security, JWT (`tv` token version), auth/profile APIs, configuration. **Step-by-step testing** lives under [`../testing/`](../testing/).

---

## 1. What this slice does

- **Register / login** — `users` table; JWT includes claim **`tv`** (must match `users.token_version`; **logout** increments it). Auth input uses **10-digit India phone**; backend stores as `+91` + number and also persists `users.country_code` (default `+91`). Password policy is enforced on register: **8–72 chars**, at least one uppercase, lowercase, number, special char, and **no spaces**.
- **Push token** — `PUT` / `DELETE /api/v1/users/me/push-token` stores or clears **`fcm_token`** for future FCM; see [push-module](push-module.md).
- **Admin self-registration** — `POST /api/v1/auth/register-admin` guarded by header `X-Admin-Registration-Secret` + env (wrong/off → `404`).
- **Admin staff** — delivery agents under `/api/v1/admin/staff/**` (same admin JWT as other `/api/v1/admin/**` routes); see [staff-module](staff-module.md).
- **Rules** — public: health, `GET /api/v1/menu/**`, **`GET /api/v1/reviews/summary`**, `POST` register, login, register-admin, **`POST /api/v1/webhooks/razorpay`** (Razorpay HMAC, not JWT), `OPTIONS/**`, actuator health/info; `/api/v1/admin/**` → admin JWT; `/api/v1/delivery/**` → JWT with **`ROLE_DELIVERY_AGENT`**; `/api/v1/cart/**`, `/api/v1/orders/**`, `/api/v1/users/me`, `/api/v1/users/me/**` → any authenticated JWT; **else** → authenticated JWT.

**Not included:** refresh tokens, OAuth2, password reset, email verification.

---

## 2. Prerequisites

| Requirement | Notes |
| --- | --- |
| PostgreSQL | `DB_URL`, `DB_USER`, `DB_PASSWORD`. |
| API | Default `http://localhost:8080`. |
| JWT secret | ≥ 32 bytes (`JWT_SECRET` / `fillos.jwt.secret`). |

---

## 3. Configuration (`application.yml` + env)

| Key / env | Meaning |
| --- | --- |
| `fillos.jwt.secret` / `JWT_SECRET` | HMAC key (≥ 32 bytes). |
| `fillos.jwt.expiration-ms` / `JWT_EXPIRATION_MS` | Token TTL ms. |
| `fillos.admin-bootstrap.*` / `FILLOS_*` | Optional first admin on startup. |
| `fillos.admin-registration.enabled` / `FILLOS_ADMIN_REGISTRATION_ENABLED` | Enable `register-admin`. |
| `fillos.admin-registration.secret` / `FILLOS_ADMIN_REGISTRATION_SECRET` | Header secret for `register-admin`. |

Flyway: [V3__users_token_version.sql](../../src/main/resources/db/migration/V3__users_token_version.sql).

---

## 4. HTTP API (reference only)

DTOs: [AuthDtos.java](../../src/main/java/com/fillos/backend/auth/AuthDtos.java).

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | None | `AuthController.register` | `201` | `400`, `409` |
| `POST` | `/api/v1/auth/login` | None | `AuthController.login` | `200` | `401` |
| `POST` | `/api/v1/auth/register-admin` | Header `X-Admin-Registration-Secret` (env; not JWT) | `AuthController.registerAdmin` | `201` | `404`, `409` |
| `POST` | `/api/v1/auth/logout` | Bearer | `AuthController.logout` | `204` | `403` |
| `GET` | `/api/v1/users/me` | Bearer | `UserProfileController.me` | `200` | `403`, `404` |
| `PATCH` | `/api/v1/users/me` | Bearer | `UserProfileController.patchMe` | `200` | `403`, `404`, `409` |
| `PUT` | `/api/v1/users/me/push-token` | Bearer | `UserProfileController.putPushToken` | `200` | `400`, `403`, `404` |
| `DELETE` | `/api/v1/users/me/push-token` | Bearer | `UserProfileController.clearPushToken` | `200` | `403`, `404` |

`GET /users/me` response includes **`pushRegistered`** (boolean); see [push-module.md](push-module.md).

Admin-only staff routes (`/api/v1/admin/staff/**`) are covered by the **`/api/v1/admin/**`** row below; details in [staff-module.md](staff-module.md).

**How to test (examples, instructions, bodies):** [customer-api-testing.md](../testing/customer-api-testing.md#2-auth-and-profile-customer-token) and [admin-api-testing.md](../testing/admin-api-testing.md#1-auth-used-only-for-admin-provisioning).

---

## 5. HTTP authorization matrix (`SecurityConfig`)

| Pattern | Access |
| --- | --- |
| `OPTIONS /**` | Public |
| `GET /api/v1/health` | Public |
| `GET /api/v1/menu/**` | Public |
| `GET /api/v1/reviews/summary` | Public |
| `POST /api/v1/auth/register`, `login`, `register-admin` | Public |
| `POST /api/v1/webhooks/razorpay` | Public (signature verified in app, not JWT) |
| `/actuator/health`, `/actuator/info`, `/error` | Public |
| `/api/v1/admin/**` | JWT + `ROLE_ADMIN` |
| `/api/v1/delivery/**` | JWT + `ROLE_DELIVERY_AGENT` |
| `/api/v1/cart/**`, `/api/v1/orders/**`, `/api/v1/users/me`, `/api/v1/users/me/**` | JWT (any role) |
| **All other requests** | JWT (any role) |

**CORS:** localhost / 127.0.0.1 ports `5173`–`5174`; methods through `DELETE`; `/api/**`.

---

## 6. JWT claims and roles

| Claim | Meaning |
| --- | --- |
| `sub` | User UUID |
| `phone`, `role` | From DB |
| `tv` | Token version; must equal `users.token_version` |

| DB `role` | Spring authority |
| --- | --- |
| `admin` | `ROLE_ADMIN` |
| `delivery_agent` | `ROLE_DELIVERY_AGENT` |
| else | `ROLE_CUSTOMER` |

---

## 7. File reference

| File | Role |
| --- | --- |
| [SecurityConfig.java](../../src/main/java/com/fillos/backend/security/SecurityConfig.java) | Filter chain, CORS |
| [JwtService.java](../../src/main/java/com/fillos/backend/security/JwtService.java) | Sign / verify JWT |
| [JwtAuthenticationFilter.java](../../src/main/java/com/fillos/backend/security/JwtAuthenticationFilter.java) | Bearer + `tv` check |
| [JwtProperties.java](../../src/main/java/com/fillos/backend/config/JwtProperties.java) | `fillos.jwt` |
| [AdminBootstrapProperties.java](../../src/main/java/com/fillos/backend/config/AdminBootstrapProperties.java) / [AdminBootstrapRunner.java](../../src/main/java/com/fillos/backend/config/AdminBootstrapRunner.java) | Bootstrap admin |
| [AdminRegistrationProperties.java](../../src/main/java/com/fillos/backend/config/AdminRegistrationProperties.java) | `register-admin` config |
| [UserRepository.java](../../src/main/java/com/fillos/backend/user/UserRepository.java) | `users`, `token_version` |
| [AuthService.java](../../src/main/java/com/fillos/backend/auth/AuthService.java) | Auth logic |
| [AuthController.java](../../src/main/java/com/fillos/backend/auth/AuthController.java) | `/api/v1/auth/*` |
| [AdminStaffController.java](../../src/main/java/com/fillos/backend/auth/AdminStaffController.java) | `/api/v1/admin/staff/*` |
| [RazorpayWebhookController.java](../../src/main/java/com/fillos/backend/payments/RazorpayWebhookController.java) | `/api/v1/webhooks/razorpay` |
| [UserProfileController.java](../../src/main/java/com/fillos/backend/auth/UserProfileController.java) | `/api/v1/users/me` |

---

## 8. Testing docs

| Doc | Content |
| --- | --- |
| [README.md](../testing/README.md) | Index of all testing guides |
| [api-flow-mindmap.md](../testing/api-flow-mindmap.md) | What to call before each route |
| [customer-api-testing.md](../testing/customer-api-testing.md) | Auth + profile + public + cart |
| [admin-api-testing.md](../testing/admin-api-testing.md) | `register-admin` + admin menu + staff |

---

## 9. Related modules

- [health-module.md](health-module.md)  
- [cart-module.md](cart-module.md)  
- [order-module.md](order-module.md)  
- [payment-module.md](payment-module.md)  
- [razorpay-module.md](razorpay-module.md)  
- [push-module.md](push-module.md)  
- [menu-module.md](menu-module.md)  
- [staff-module.md](staff-module.md)

---

## 10. When to edit this doc

New routes, JWT claims, CORS, or auth DTOs.
