# Activity Diagram

This document explains **step-by-step actions** in simple language.
An activity diagram is like a flowchart showing what happens next.

## 1) Main Activity Flow (Customer Order Journey)

```mermaid
flowchart TD
    A([Start]) --> B[Open app/website]
    B --> C[Browse menu]
    C --> D[Add items to cart]
    D --> E{Logged in?}
    E -- No --> F[Login/Register]
    E -- Yes --> G[Open cart checkout panel]
    F --> G
    G --> H[Select address]
    H --> I[Place order]
    I --> J{Payment needed?}
    J -- Yes --> K[Create Razorpay payment order]
    K --> L[Complete payment]
    J -- No --> M[Cash on delivery / unpaid flow]
    L --> N[Order confirmed]
    M --> N
    N --> O[Kitchen prepares food]
    O --> P[Admin assigns delivery agent]
    P --> Q[Delivery in progress]
    Q --> R[Order delivered]
    R --> S[Customer gives review]
    S --> T([End])
```

## 2) Split Activity A (Admin Order Management)

```mermaid
flowchart TD
    A([Start]) --> B[Admin login]
    B --> C[Open admin dashboard]
    C --> D[View order list]
    D --> E[Open order details]
    E --> F{Need status update?}
    F -- Yes --> G[Update order status]
    F -- No --> H{Need delivery assignment?}
    G --> H
    H -- Yes --> I[Assign delivery agent]
    H -- No --> J[Return to order list]
    I --> J
    J --> K([End])
```

## 3) Split Activity B (Delivery Agent Flow)

```mermaid
flowchart TD
    A([Start]) --> B[Delivery agent login]
    B --> C[View assigned orders]
    C --> D[Pick one order]
    D --> E[Update delivery status]
    E --> F{Reached customer?}
    F -- No --> G[Continue delivery]
    G --> E
    F -- Yes --> H[Mark order delivered]
    H --> I([End])
```

## 4) Split Activity C (Implemented Soccer Reward Flow)

```mermaid
flowchart TD
    A([Start]) --> B[Customer opens soccer game]
    B --> C[Play game]
    C --> D{Win conditions met?}
    D -- No --> E[Show try again]
    D -- Yes --> F[Generate reward coupon]
    F --> G[Store coupon with expiry]
    G --> H[Use coupon in cart checkout]
    E --> I([End])
    H --> I
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = available in current backend/frontend.
- <span style="color:red"><u>Planned</u></span> = from design docs, not fully implemented yet.

## Plain-language summary

<span style="color:green"><u>The order flow from browsing menu to delivery and review is implemented.</u></span>
<span style="color:green"><u>Admin and delivery operational flows are implemented at a basic working level.</u></span>
<span style="color:green"><u>Soccer game activity flow is now implemented (single-game scope).</u></span>
