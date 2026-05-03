# Interaction Overview Diagram

An interaction overview diagram is a **big-picture map** of how different interactions connect.
For non-technical readers: this is a "storyboard" of the whole system journey.

## 1) Main Interaction Overview (End-to-End Story)

```mermaid
flowchart TD
    A([Start]) --> B[Interaction: Customer browses menu]
    B --> C[Interaction: Customer adds items to cart]
    C --> D[Interaction: Login/Register if needed]
    D --> E[Interaction: Cart-side checkout and place order]
    E --> F[Interaction: Payment process]
    F --> G[Interaction: Admin manages order]
    G --> H[Interaction: Delivery agent delivers order]
    H --> I[Interaction: Customer tracks + receives order]
    I --> J[Interaction: Customer submits review]
    J --> K([End])
```

## 2) Split Overview A (Customer Interaction Path)

```mermaid
flowchart LR
    A[Open app/web] --> B[Browse menu]
    B --> C[Add to cart]
    C --> D[Authenticate]
    D --> E[Cart checkout panel]
    E --> F[Payment]
    F --> G[Track order]
    G --> H[Review order]
```

## 3) Split Overview B (Operations Interaction Path)

```mermaid
flowchart LR
    A[Admin login] --> B[View order queue]
    B --> C[Update status]
    C --> D[Assign delivery agent]
    D --> E[Delivery agent receives task]
    E --> F[Delivery status updates]
    F --> G[Mark delivered]
```

## 4) Split Overview C (Payment + Status Synchronization)

```mermaid
flowchart TD
    A[Customer starts payment] --> B[Backend creates payment order]
    B --> C[Razorpay processes payment]
    C --> D[Backend receives confirmation]
    D --> E[Order payment status updated]
    E --> F[Frontend shows latest status]
```

## 5) Split Overview D (Game + Future Interactions)

```mermaid
flowchart TD
    A[Customer plays soccer game] --> B[System checks eligibility]
    B --> C[System generates coupon]
    C --> D[Customer redeems coupon in cart checkout]

    E[Customer orders via WhatsApp - Planned] --> F[Bot captures location/order - Planned]
    F --> G[Backend creates order - Planned]
    G --> H[Tracking link sent - Planned]
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = active interaction in current codebase.
- <span style="color:red"><u>Planned</u></span> = in design docs but not fully implemented yet.

## Plain-language summary

<span style="color:green"><u>The main interaction chain from browsing to ordering, operations, and review is already working.</u></span>
<span style="color:green"><u>Soccer game reward interaction is now implemented at basic level.</u></span>
<span style="color:red"><u>WhatsApp interaction chain remains a future interaction and is included for planning clarity.</u></span>
