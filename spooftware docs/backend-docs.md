# Backend Docs (Current vs Planned)

## Implemented backend capabilities

<span style="color:green"><u>Authentication, authorization, and role-based route protection are implemented.</u></span>
<span style="color:green"><u>Menu catalog APIs and admin menu management are implemented.</u></span>
<span style="color:green"><u>Cart, checkout, order lifecycle, delivery assignment, and customer/admin order views are implemented.</u></span>
<span style="color:green"><u>Review lifecycle and favorites module are implemented.</u></span>
<span style="color:green"><u>Razorpay order-reference integration and webhook entry point are implemented.</u></span>

## Planned/not completed backend capabilities

<span style="color:green"><u>Soccer game module APIs and coupon schema are implemented with guest/mobile and authenticated play paths.</u></span>
<span style="color:red"><u>Only soccer game flow is implemented; broader multi-game engine from planning PDFs is not implemented.</u></span>
<span style="color:red"><u>WhatsApp bot/webhook ordering channel is not implemented.</u></span>
<span style="color:red"><u>Real-time tracking stream (WebSocket/Firebase live location updates) is not implemented.</u></span>
<span style="color:red"><u>Full OTP-first flow and anti-abuse policies in the design documents are not fully implemented.</u></span>

## Current major backend modules

- `auth` / `security`
- `menu`
- `cart`
- `orders` and `delivery`
- `reviews`
- `favorites`
- `payments` / Razorpay webhook
- Flyway migrations for schema evolution

## Database reality check

<span style="color:green"><u>Current schema includes users, menu, cart, orders, addresses, payment flags, reviews, and favorites.</u></span>
<span style="color:green"><u>Game coupon settings and coupons tables are now present for soccer rewards.</u></span>
<span style="color:red"><u>Advanced game progression and WhatsApp order entities are still missing in current migrations.</u></span>

## When to update this file

Update this file immediately when any of these happen:

1. New backend controller/service/module is introduced.
2. Any endpoint path, auth rule, or response shape changes.
3. New migration adds or removes major business tables.
4. Game/WhatsApp/tracking features become implemented.
