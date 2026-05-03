# Requirements Gathering

## Sources used

- `FoodApp_TechDesign_v2.pdf`
- `FoodApp_MasterPlan_v4.pdf`
- `backend/` (controllers, migrations, backend docs)
- `frontend/` (routes/pages and frontend docs)

## Product scope

<span style="color:green"><u>The system is a single-vendor food ordering platform with one kitchen and one admin dashboard.</u></span>
<span style="color:green"><u>Core ordering flow (menu, cart, checkout, order history, order detail, admin order handling) is implemented.</u></span>
<span style="color:red"><u>Multi-channel rollout goals (website-first, WhatsApp channel, Android app) are strategic requirements but not fully represented in this repo yet.</u></span>

## Functional requirements by domain

### 1) Identity and security

<span style="color:green"><u>User registration/login with JWT-based authorization is implemented.</u></span>
<span style="color:green"><u>Role-based access for admin, delivery agent, and customer routes is implemented.</u></span>
<span style="color:red"><u>OTP-first login, refresh-token lifecycle, and advanced anti-abuse rules from the plan are not fully implemented in this codebase.</u></span>

### 2) Catalog, cart, and ordering

<span style="color:green"><u>Menu category/item APIs and frontend browsing are implemented.</u></span>
<span style="color:green"><u>Cart operations and checkout order creation are implemented.</u></span>
<span style="color:green"><u>Order status lifecycle and cancellation constraints are implemented.</u></span>
<span style="color:red"><u>Guest checkout + guest tracking token flow from Master Plan v4 is not implemented as described in the PDFs.</u></span>

### 3) Payments and coupons

<span style="color:green"><u>Razorpay order reference flow and webhook endpoint are implemented.</u></span>
<span style="color:red"><u>Full coupon engine with game-generated coupons and advanced validation rules is not implemented yet.</u></span>

### 4) Delivery and tracking

<span style="color:green"><u>Delivery assignment and delivery-agent endpoints are implemented.</u></span>
<span style="color:red"><u>Live GPS tracking stream/WebSocket location updates from the technical design are not implemented yet.</u></span>

### 5) Reviews and retention

<span style="color:green"><u>Post-delivery rating/review endpoints and admin moderation are implemented.</u></span>
<span style="color:green"><u>Favorites capability exists in backend and frontend routing.</u></span>
<span style="color:red"><u>Game module (spin, scratch, trivia or penalty) and level-based reward logic from both PDFs are not implemented yet.</u></span>

### 6) Channel expansion

<span style="color:red"><u>WhatsApp ordering flow (bot, webhook intake, payment link loop) is not implemented in current backend/frontend.</u></span>
<span style="color:red"><u>Android React Native app code is not present in this repository.</u></span>

## Non-functional requirements (target vs current)

<span style="color:green"><u>Backend uses Spring Boot + PostgreSQL with Flyway migrations and documented modules.</u></span>
<span style="color:green"><u>Frontend uses React + Vite and route-level access controls.</u></span>
<span style="color:red"><u>Production-level observability and launch hardening (Sentry/UptimeRobot/Lighthouse targets) are plan-level goals and not fully codified in-repo.</u></span>

## Gap summary (important)

1. Highest implemented maturity: auth, menu, cart, orders, admin operations, reviews, favorites.
2. Highest planned-but-missing areas: game module, WhatsApp ordering, live tracking architecture.
3. Strategic mismatch: PDFs describe web+app+WhatsApp rollout, while this repo mainly covers web/admin + shared backend.

## Documentation status convention for this folder

- Always mark completed items as: `<span style="color:green"><u>...</u></span>`
- Always mark pending items as: `<span style="color:red"><u>...</u></span>`
- Keep requirement statements short and testable after major changes.
