# Fillos — minimal customer UI

Vite + React + TypeScript. Calls the Spring Boot API under **`http://localhost:8080`** by default (same origins allowed in `SecurityConfig`: **5173** / **5174**).

## Run

1. Start Postgres + backend (`backend/`, port **8080**).
2. From this folder:

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

Optional: copy **`.env.example`** to **`.env.local`** and set **`VITE_API_URL`** if the API base differs.

If you applied backend Flyway seed migrations (**`V12`** + **`V13`** + **`V15`**), log in as customer **`9995550001`** / **`DummyPass1!`** to see menu, cart, and sample orders (stored as `+919995550001` in DB).

## What’s in the UI

- **Menu** — public categories + items; optional review summary; **Add to cart** (requires login).
- **Cart** — line qty + remove; link to checkout.
- **Checkout** — optional saved address + **customer note** → `POST /api/v1/orders`.
- **Orders** — list + detail; **Get Razorpay checkout payload** (JSON for wiring Checkout later); **Cancel** when allowed.
- **Log in / Register** — JWT stored in **`localStorage`** (`fillos_token`).

See detailed page-by-page frontend module docs with route access and screenshots: **`docs/FRONTEND_MODULES.md`**.
