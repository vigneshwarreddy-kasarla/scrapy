# Use Case Diagram

This document is intentionally simple so non-technical readers (age 10 to 40+) can understand it quickly.

## What is a Use Case Diagram?

A use case diagram shows:

- **who** uses the system (actors)
- **what** they can do (use cases)

Think of it as a "who does what" picture.

## Actors (People using the system)

- Customer
- Admin
- Delivery Agent
- Payment Gateway (Razorpay)

## Main Use Case Diagram (Current + Planned)

```mermaid
flowchart LR
    C[Customer]
    A[Admin]
    D[Delivery Agent]
    P[Payment Gateway]

    UC1((Browse Menu))
    UC2((Add to Cart))
    UC3((Login/Register))
    UC4((Place Order))
    UC5((Track Order))
    UC6((Give Review))
    UC7((Manage Favorites))
    UC8((Play Soccer Game for Coupon))

    UA1((Manage Menu))
    UA2((Manage Orders))
    UA3((Assign Delivery Agent))
    UA4((Manage Users/Staff))
    UA5((Manage Coupons - Partial))
    UA6((Configure Soccer Game Rewards))

    UD1((View Assigned Orders))
    UD2((Update Delivery Status))

    UP1((Create Payment Order))
    UP2((Confirm Payment Webhook))

    C --> UC1
    C --> UC2
    C --> UC3
    C --> UC4
    C --> UC5
    C --> UC6
    C --> UC7
    C --> UC8

    A --> UA1
    A --> UA2
    A --> UA3
    A --> UA4
    A --> UA5
    A --> UA6

    D --> UD1
    D --> UD2

    UC4 --> UP1
    P --> UP2
```

## Split Diagram A: Customer only (easy view)

```mermaid
flowchart TD
    C[Customer] --> U1((Browse Menu))
    C --> U2((Add to Cart))
    C --> U3((Login/Register))
    C --> U4((Place Order))
    C --> U5((Track Order))
    C --> U6((Give Review))
    C --> U7((Manage Favorites))
    C --> U8((Play Soccer Game for Coupon))
```

## Split Diagram B: Admin + Delivery only (easy view)

```mermaid
flowchart TD
    A[Admin] --> A1((Manage Menu))
    A --> A2((Manage Orders))
    A --> A3((Assign Delivery Agent))
    A --> A4((Manage Users/Staff))
    A --> A5((Manage Coupons - Partial))
    A --> A6((Configure Soccer Game Rewards))

    D[Delivery Agent] --> D1((View Assigned Orders))
    D --> D2((Update Delivery Status))
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = available in current repo.
- <span style="color:red"><u>Planned</u></span> = in planning docs but not fully built yet.

## Plain-language summary

<span style="color:green"><u>Customers can browse food, order, track, review, and manage favorites in the current system.</u></span>
<span style="color:green"><u>Admins can manage menu, orders, and delivery assignment.</u></span>
<span style="color:green"><u>Delivery agents can view assigned orders and update delivery progress.</u></span>
<span style="color:green"><u>Soccer game reward and coupon validation flows are implemented.</u></span>
<span style="color:red"><u>Full advanced multi-game coupon workflows are not fully implemented.</u></span>
