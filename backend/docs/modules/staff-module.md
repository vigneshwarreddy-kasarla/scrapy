# Fillos — Admin staff module (backend)

**Path:** [backend/docs/modules/staff-module.md](staff-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Let an **admin** create **delivery agent** accounts and **list** active agents (for assignment UIs). Secured by `/api/v1/admin/**` (same JWT as menu/orders admin). **Testing:** [admin §4](../testing/admin-api-testing.md#4-admin-staff-delivery-agents).

---

## 1. What this module does

- **`GET /api/v1/admin/staff/delivery-agents`** — Active users with DB role `delivery_agent` (`id`, `name`, `phone`, `email`).
- **`POST /api/v1/admin/staff/delivery-agents`** — Create agent; JSON body matches customer [**`RegisterRequest`**](../../src/main/java/com/fillos/backend/auth/AuthDtos.java) (`name`, optional `email`, `phone`, `password`). `phone` is **10-digit India number**; backend stores `+91` prefix and `country_code`. Password policy: **8–72 chars**, uppercase+lowercase+number+special, no spaces. Returns **`201`** + profile (`role` = `delivery_agent`). **No access token** in the response; the agent uses **`POST /api/v1/auth/login`** with the chosen password.

**Not included:** deactivating agents, changing roles, or self-service “apply to deliver”.

---

## 2. HTTP API (reference only)

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/admin/staff/delivery-agents` | Bearer admin | `AdminStaffController.listDeliveryAgents` | `200` | `403` |
| `POST` | `/api/v1/admin/staff/delivery-agents` | Bearer admin | `AdminStaffController.createDeliveryAgent` | `201` | `400`, `403`, `409` |

---

## 3. File reference

| File | Role |
| --- | --- |
| [AdminStaffController.java](../../src/main/java/com/fillos/backend/auth/AdminStaffController.java) | REST |
| [AuthService.java](../../src/main/java/com/fillos/backend/auth/AuthService.java) | `createDeliveryAgentByAdmin`, `listActiveDeliveryAgents` |
| [UserRepository.java](../../src/main/java/com/fillos/backend/user/UserRepository.java) | `listActiveUsersByRole`, `insertUser` |

---

## 4. Related docs

- [delivery-module.md](delivery-module.md) — assign uses `deliveryAgentId` from this list.  
- [security-auth-module.md](security-auth-module.md)

---

## 5. When to edit this doc

New staff roles, list filters, or admin HR workflows.
