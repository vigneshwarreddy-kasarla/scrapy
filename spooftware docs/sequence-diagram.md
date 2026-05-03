# Sequence Diagram

A sequence diagram shows **who talks to whom, and in what order**.
It is like a chat timeline between system parts.

## 1) Main Sequence (Customer places an order)

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant Backend
    participant DB as PostgreSQL

    Customer->>Frontend: Browse menu
    Frontend->>Backend: GET /menu/categories + items
    Backend->>DB: Read menu data
    DB-->>Backend: Menu rows
    Backend-->>Frontend: Menu response

    Customer->>Frontend: Add items to cart
    Frontend->>Backend: POST /cart/items
    Backend->>DB: Save cart lines
    DB-->>Backend: Success
    Backend-->>Frontend: Cart updated

    Customer->>Frontend: Cart checkout
    Frontend->>Backend: POST /orders
    Backend->>DB: Create order + order_items
    DB-->>Backend: Order id + rows
    Backend-->>Frontend: Order created
```

## 2) Split Sequence A (Payment with Razorpay)

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant Backend
    participant Razorpay
    participant DB as PostgreSQL

    Customer->>Frontend: Click Pay
    Frontend->>Backend: POST /orders/{id}/payments/razorpay/order
    Backend->>Razorpay: Create payment order
    Razorpay-->>Backend: razorpay_order_id
    Backend->>DB: Save payment reference
    Backend-->>Frontend: Payment payload

    Razorpay-->>Backend: Webhook payment success
    Backend->>DB: Update payment status
    Backend-->>Frontend: (next fetch shows paid)
```

## 3) Split Sequence B (Admin assigns delivery agent)

```mermaid
sequenceDiagram
    actor Admin
    participant AdminUI as Frontend Admin
    participant Backend
    participant DB as PostgreSQL

    Admin->>AdminUI: Open admin orders
    AdminUI->>Backend: GET /admin/orders
    Backend->>DB: Read all orders
    DB-->>Backend: Orders list
    Backend-->>AdminUI: Orders response

    Admin->>AdminUI: Assign delivery agent
    AdminUI->>Backend: PATCH /admin/orders/{id}/assign
    Backend->>DB: Update delivery_agent_id + status
    DB-->>Backend: Success
    Backend-->>AdminUI: Updated order
```

## 4) Split Sequence C (Delivery agent completes delivery)

```mermaid
sequenceDiagram
    actor Agent as Delivery Agent
    participant DeliveryUI as Agent Client
    participant Backend
    participant DB as PostgreSQL

    Agent->>DeliveryUI: Open assigned orders
    DeliveryUI->>Backend: GET /delivery/orders
    Backend->>DB: Read assigned orders
    DB-->>Backend: Orders
    Backend-->>DeliveryUI: Orders list

    Agent->>DeliveryUI: Mark delivered
    DeliveryUI->>Backend: PATCH /delivery/orders/{id}/complete
    Backend->>DB: Update order status = delivered
    DB-->>Backend: Success
    Backend-->>DeliveryUI: Delivery completed
```

## 5) Split Sequence D (Soccer game reward flow)

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant Backend
    participant DB as PostgreSQL

    Customer->>Frontend: Play game
    Frontend->>Backend: POST /api/v1/games/soccer/play
    Backend->>DB: Check active coupon + settings
    DB-->>Backend: Eligibility result
    Backend->>DB: Generate reward coupon
    DB-->>Backend: Coupon code
    Backend-->>Frontend: Coupon reward response
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = currently available in the repository.
- <span style="color:red"><u>Planned</u></span> = documented target, not fully implemented yet.

## Plain-language summary

<span style="color:green"><u>Customer ordering, admin assignment, delivery completion, and payment-reference workflow are implemented.</u></span>
<span style="color:green"><u>Soccer game reward sequence is implemented (including guest/mobile play endpoints).</u></span>
