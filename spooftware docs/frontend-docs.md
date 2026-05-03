# Frontend Docs (Current vs Planned)

## Implemented frontend capabilities

<span style="color:green"><u>React + Vite frontend with route-based layout is implemented.</u></span>
<span style="color:green"><u>Public pages for menu, item detail, and login are implemented.</u></span>
<span style="color:green"><u>Protected customer pages for profile, cart (with embedded checkout), favorites, orders, and order detail are implemented.</u></span>
<span style="color:green"><u>Admin page with protected access is implemented.</u></span>
<span style="color:green"><u>Soccer game page is available, including guest play via mobile number and logged-in play flow.</u></span>

## Planned/not completed frontend capabilities

<span style="color:red"><u>Only soccer game reward flow is implemented; broader multi-game UX from planning docs is still pending.</u></span>
<span style="color:red"><u>WhatsApp-first customer flow UI is not represented in current web frontend.</u></span>
<span style="color:red"><u>Android React Native app screens are not part of this repository.</u></span>
<span style="color:red"><u>Real-time delivery tracking map UX is not fully implemented as described in planning docs.</u></span>

## Current route map

- Public: `/menu`, `/menu/items/:itemId`, `/login`, `/game/soccer`
- Customer protected: `/profile`, `/cart`, `/favorites`, `/orders`, `/orders/:orderId`
- Admin protected: `/admin`

## UX requirements to keep aligned

<span style="color:green"><u>Ordering and account flows in web frontend are currently aligned with implemented backend APIs.</u></span>
<span style="color:red"><u>Future channel parity requirements (website + Android + WhatsApp + game module) are still pending.</u></span>

## When to update this file

Update this file on any significant frontend change:

1. New page or route is added/removed.
2. Access control rules (public/protected/admin) change.
3. Checkout/order flow UI changes.
4. Game or tracking UI is introduced.
