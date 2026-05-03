# State Machine Diagram

A state machine diagram shows how something changes from one **state** to another.
Think: "current status -> next status".

## 1) Main State Machine (Order Status)

```mermaid
stateDiagram-v2
    [*] --> placed
    placed --> confirmed: admin confirms
    placed --> cancelled: customer/admin cancels
    confirmed --> out_for_delivery: assign delivery agent
    confirmed --> cancelled: admin cancels
    out_for_delivery --> delivered: agent marks delivered
    delivered --> [*]
    cancelled --> [*]
```

## 2) Split State Machine A (Payment Status)

```mermaid
stateDiagram-v2
    [*] --> unpaid
    unpaid --> paid: payment success / admin mark paid
    paid --> unpaid: admin correction (rare)
    paid --> [*]
    unpaid --> [*]
```

## 3) Split State Machine B (Review Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> no_review
    no_review --> review_created: customer submits review
    review_created --> review_updated: customer edits within allowed time
    review_created --> review_deleted: customer/admin deletes
    review_updated --> review_deleted: customer/admin deletes
    review_created --> [*]
    review_updated --> [*]
    review_deleted --> [*]
```

## 4) Split State Machine C (Planned Game Coupon Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> no_active_coupon
    no_active_coupon --> coupon_generated: customer wins game
    coupon_generated --> coupon_used: customer applies coupon in checkout
    coupon_generated --> coupon_expired: expiry time reached
    coupon_used --> no_active_coupon: after successful redemption
    coupon_expired --> no_active_coupon
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = available in current codebase.
- <span style="color:red"><u>Planned</u></span> = from planning PDFs, not fully implemented yet.

## Plain-language summary

<span style="color:green"><u>Order states and payment states are implemented and actively used in backend flows.</u></span>
<span style="color:green"><u>Review lifecycle (create/update/delete) is implemented.</u></span>
<span style="color:red"><u>Game coupon lifecycle states are planned and documented for future development.</u></span>
