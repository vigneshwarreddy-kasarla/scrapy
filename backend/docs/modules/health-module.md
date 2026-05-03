# Fillos — Health module (backend)

**Path:** [backend/docs/modules/health-module.md](health-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Lightweight **liveness** JSON for clients and load balancers. **Testing:** [customer-api-testing §1](../testing/customer-api-testing.md#1-public-no-token).

---

## 1. What this module does

- Exposes **`GET /api/v1/health`** with a small JSON payload (`ok`, `service`, `time`).
- **No authentication** (see [security-auth-module §5](security-auth-module.md) authorization matrix).
- Does **not** check the database or downstream services; use Spring Boot **Actuator** (`/actuator/health`) if you need deeper checks.

---

## 2. HTTP API (reference only)

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/health` | None | `HealthController.health` | `200` | — |

**Example body:** `{"ok":true,"service":"fillos-backend","time":"<ISO-8601 instant>"}`

---

## 3. File reference

| File | Role |
| --- | --- |
| [HealthController.java](../../src/main/java/com/fillos/backend/health/HealthController.java) | Returns static shape + current time |

---

## 4. Related docs

- [security-auth-module.md](security-auth-module.md) — which routes are public.  
- [Testing index](../testing/README.md) — customer walkthrough includes this endpoint.

---

## 5. When to edit this doc

You change the path, JSON fields, or add real dependency checks to this controller.
