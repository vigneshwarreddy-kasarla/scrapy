# Fillos — Order reviews module (backend)

**Path:** [backend/docs/modules/reviews-module.md](reviews-module.md)  
**Last updated:** 2026-04-12  
**Purpose:** Customers submit **one rating + optional comment** per **delivered** order. **Testing:** [customer §4](../testing/customer-api-testing.md#4-orders).

---

## 1. What this module does

- **`POST /api/v1/orders/{orderId}/review`** — Body [`SubmitReviewRequest`](../../src/main/java/com/fillos/backend/reviews/ReviewDtos.java): `rating` (1–5), optional `comment` (≤ 2000 chars). Allowed only when the order is **yours** and **`delivered`**. **One review per order** (unique `order_id`); duplicate → **`409`**.
- **`GET /api/v1/orders/{orderId}/review`** — Returns your review for that order; **`404`** if the order is not yours or there is no review yet.
- **`PATCH /api/v1/orders/{orderId}/review`** — Same JSON body as **`POST`** ([`SubmitReviewRequest`](../../src/main/java/com/fillos/backend/reviews/ReviewDtos.java)). Only your review; only within **24 hours** of `createdAt` (checked with database **`NOW()`**). **`404`** if order/review missing; **`409`** if the edit window has passed.
- **`DELETE /api/v1/orders/{orderId}/review`** — Removes your review for that order; same **24-hour** window as **`PATCH`**. **`204`** on success; **`404`** / **`409`** as above.
- **`GET /api/v1/reviews/summary`** — **Public** storefront stats: global average rating (2 decimal places) and total review count. When there are no reviews, `averageRating` is **`null`** and `reviewCount` is **`0`**.
- **`GET /api/v1/admin/reviews`** — **Admin** paginated list of all reviews (`limit` 1–100 default 50, `offset` default 0): review id, order id, user id, customer phone, rating, comment, `createdAt` (newest first).
- **`DELETE /api/v1/admin/reviews/{reviewId}`** — **Admin** hard-deletes a review (e.g. moderation). **`204`**; **`404`** if id unknown. After delete, the customer may **`POST`** a new review for that order again (unique is per `order_id`).

**Not included:** soft-hide without delete, per-item or per-store aggregates beyond the global summary, editing after 24 hours (customer).

---

## 2. Database (Flyway)

[V10__order_reviews.sql](../../src/main/resources/db/migration/V10__order_reviews.sql) — table `order_reviews` (`order_id`, `user_id`, `rating`, `comment`, `created_at`).

---

## 3. HTTP API (reference only)

| Method | Path | Auth | Controller | Success | Fail |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/v1/orders/{orderId}/review` | Bearer | `OrderReviewController.submit` | `201` | `400`, `403`, `409` |
| `GET` | `/api/v1/orders/{orderId}/review` | Bearer | `OrderReviewController.get` | `200` | `403`, `404` |
| `PATCH` | `/api/v1/orders/{orderId}/review` | Bearer | `OrderReviewController.patch` | `200` | `403`, `404`, `409` |
| `DELETE` | `/api/v1/orders/{orderId}/review` | Bearer | `OrderReviewController.delete` | `204` | `403`, `404`, `409` |
| `GET` | `/api/v1/reviews/summary` | None | `PublicReviewSummaryController.summary` | `200` | — |
| `GET` | `/api/v1/admin/reviews` | Admin JWT | `AdminReviewsController.list` | `200` | `403` |
| `DELETE` | `/api/v1/admin/reviews/{reviewId}` | Admin JWT | `AdminReviewsController.delete` | `204` | `403`, `404` |

---

## 4. File reference

| File | Role |
| --- | --- |
| [OrderReviewController.java](../../src/main/java/com/fillos/backend/reviews/OrderReviewController.java) | Customer review REST |
| [PublicReviewSummaryController.java](../../src/main/java/com/fillos/backend/reviews/PublicReviewSummaryController.java) | Public summary REST |
| [AdminReviewsController.java](../../src/main/java/com/fillos/backend/reviews/AdminReviewsController.java) | Admin list + delete REST |
| [ReviewService.java](../../src/main/java/com/fillos/backend/reviews/ReviewService.java) | Rules |
| [ReviewRepository.java](../../src/main/java/com/fillos/backend/reviews/ReviewRepository.java) | JDBC |
| [ReviewDtos.java](../../src/main/java/com/fillos/backend/reviews/ReviewDtos.java) | DTOs |

---

## 5. Related docs

- [order-module.md](order-module.md)  
- [delivery-module.md](delivery-module.md)

---

## 6. When to edit this doc

Configurable edit window, soft moderation, multi-item reviews, or per-store aggregates.
