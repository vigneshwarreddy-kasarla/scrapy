# Fillos — Push device registration (backend)

**Path:** [backend/docs/modules/push-module.md](push-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Let authenticated users **register** or **clear** an **FCM-style device token** on `users.fcm_token` (column from [V1](../../src/main/resources/db/migration/V1__init_core.sql)). Enables a future **Firebase Cloud Messaging** (or compatible) sender to target devices. **Testing:** [customer §2](../testing/customer-api-testing.md#2-auth-and-profile-customer-token).

---

## 1. What this module does

- **`PUT /api/v1/users/me/push-token`** — Body `{"fcmToken":"<string>"}` (max 4096 chars). Stores token; **does not** return the raw token in responses.
- **`DELETE /api/v1/users/me/push-token`** — Clears `fcm_token`.
- **`GET /api/v1/users/me`** (and other profile responses) include **`pushRegistered`** (`true` when a non-blank token is stored).

**Not included:** sending pushes, topic subscribe, admin broadcast, Apple APNs separate from FCM.

---

## 2. HTTP API (reference only)

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `PUT` | `/api/v1/users/me/push-token` | Bearer | `UserProfileController.putPushToken` | `200` | `400`, `403`, `404` |
| `DELETE` | `/api/v1/users/me/push-token` | Bearer | `UserProfileController.clearPushToken` | `200` | `403`, `404` |

DTO: [`PutPushTokenRequest`](../../src/main/java/com/fillos/backend/auth/AuthDtos.java).

---

## 3. File reference

| File | Role |
| --- | --- |
| [UserProfileController.java](../../src/main/java/com/fillos/backend/auth/UserProfileController.java) | REST |
| [AuthService.java](../../src/main/java/com/fillos/backend/auth/AuthService.java) | `putPushToken`, `clearPushToken`, profile mapping |
| [UserRepository.java](../../src/main/java/com/fillos/backend/user/UserRepository.java) | `updateFcmToken`, `hasPushToken` |

---

## 4. Related docs

- [security-auth-module.md](security-auth-module.md)  
- [order-module.md](order-module.md) (future: notify on status change)

---

## 5. When to edit this doc

Multiple devices per user, platform-specific tokens, or outbound notification workers.
