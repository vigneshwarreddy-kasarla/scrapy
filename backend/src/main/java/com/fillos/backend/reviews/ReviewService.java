package com.fillos.backend.reviews;

import com.fillos.backend.reviews.ReviewDtos.AdminReviewListItem;
import com.fillos.backend.reviews.ReviewDtos.ItemRatingSummaryResponse;
import com.fillos.backend.reviews.ReviewDtos.ReviewResponse;
import com.fillos.backend.reviews.ReviewDtos.ReviewSummaryResponse;
import com.fillos.backend.reviews.ReviewDtos.SubmitReviewRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReviewService {
    private final ReviewRepository reviews;

    public ReviewService(ReviewRepository reviews) {
        this.reviews = reviews;
    }

    @Transactional
    public ReviewResponse submit(UUID userId, UUID orderId, SubmitReviewRequest body) {
        if (!reviews.isDeliveredOrderOwnedBy(orderId, userId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "You can only review your own delivered orders");
        }
        if (reviews.existsForOrder(orderId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order already has a review");
        }
        String comment = body.comment() == null || body.comment().isBlank() ? null : body.comment().trim();
        try {
            reviews.insert(orderId, userId, body.rating(), comment);
            return reviews
                    .findByOrderAndUser(orderId, userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Review not found"));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order already has a review");
        }
    }

    public ReviewResponse getForOrder(UUID userId, UUID orderId) {
        if (!reviews.orderExistsForUser(orderId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        return reviews
                .findByOrderAndUser(orderId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No review for this order"));
    }

    public List<AdminReviewListItem> listForAdmin(int limit, long offset) {
        return reviews.listAllReviews(limit, offset);
    }

    public ReviewSummaryResponse publicSummary() {
        return reviews.globalSummary();
    }

    public ItemRatingSummaryResponse publicItemSummary(UUID menuItemId) {
        return reviews.itemSummary(menuItemId);
    }

    @Transactional
    public ReviewResponse patch(UUID userId, UUID orderId, SubmitReviewRequest body) {
        if (!reviews.orderExistsForUser(orderId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        ReviewResponse existing =
                reviews.findByOrderAndUser(orderId, userId).orElse(null);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No review for this order");
        }
        String comment = body.comment() == null || body.comment().isBlank() ? null : body.comment().trim();
        int n = reviews.updateWithin24h(orderId, userId, body.rating(), comment);
        if (n == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Reviews can only be edited within 24 hours of posting");
        }
        return new ReviewResponse(
                existing.reviewId(), existing.orderId(), body.rating(), comment, existing.createdAt());
    }

    @Transactional
    public void deleteForUser(UUID userId, UUID orderId) {
        if (!reviews.orderExistsForUser(orderId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        if (reviews.findByOrderAndUser(orderId, userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No review for this order");
        }
        int n = reviews.deleteWithin24h(orderId, userId);
        if (n == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Reviews can only be deleted within 24 hours of posting");
        }
    }

    @Transactional
    public void deleteByAdmin(UUID reviewId) {
        int n = reviews.deleteById(reviewId);
        if (n == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
    }
}
