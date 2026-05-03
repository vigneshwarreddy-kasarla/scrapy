package com.fillos.backend.reviews;

import com.fillos.backend.reviews.ReviewDtos.AdminReviewListItem;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/reviews")
public class AdminReviewsController {
    private final ReviewService reviewService;

    public AdminReviewsController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<AdminReviewListItem> list(
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "offset", defaultValue = "0") long offset) {
        int safeLimit = Math.min(100, Math.max(1, limit));
        long safeOffset = Math.max(0, offset);
        return reviewService.listForAdmin(safeLimit, safeOffset);
    }

    @DeleteMapping("/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("reviewId") UUID reviewId) {
        reviewService.deleteByAdmin(reviewId);
    }
}
