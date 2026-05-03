package com.fillos.backend.reviews;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class ReviewDtos {
    private ReviewDtos() {}

    public record SubmitReviewRequest(
            @NotNull @Min(1) @Max(5) Integer rating,
            @Size(max = 2000) String comment) {}

    public record ReviewResponse(UUID reviewId, UUID orderId, int rating, String comment, Instant createdAt) {}

    public record AdminReviewListItem(
            UUID reviewId,
            UUID orderId,
            UUID userId,
            String customerPhone,
            int rating,
            String comment,
            Instant createdAt) {}

    /** Global storefront stats; {@code averageRating} is {@code null} when {@code reviewCount} is 0. */
    public record ReviewSummaryResponse(BigDecimal averageRating, long reviewCount) {}

    /** Item-level rating summary derived from order-level reviews. */
    public record ItemRatingSummaryResponse(UUID menuItemId, BigDecimal averageRating, long reviewCount) {}
}
