package com.fillos.backend.reviews;

import com.fillos.backend.reviews.ReviewDtos.ItemRatingSummaryResponse;
import com.fillos.backend.reviews.ReviewDtos.ReviewSummaryResponse;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reviews")
public class PublicReviewSummaryController {
    private final ReviewService reviewService;

    public PublicReviewSummaryController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/summary")
    public ReviewSummaryResponse summary() {
        return reviewService.publicSummary();
    }

    @GetMapping("/items/{itemId}/summary")
    public ItemRatingSummaryResponse itemSummary(@PathVariable("itemId") UUID itemId) {
        return reviewService.publicItemSummary(itemId);
    }
}
