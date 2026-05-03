package com.fillos.backend.reviews;

import com.fillos.backend.reviews.ReviewDtos.ReviewResponse;
import com.fillos.backend.reviews.ReviewDtos.SubmitReviewRequest;
import com.fillos.backend.security.AppUserDetails;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderReviewController {
    private final ReviewService reviewService;

    public OrderReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/{orderId}/review")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse submit(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable("orderId") UUID orderId,
            @Valid @RequestBody SubmitReviewRequest body) {
        return reviewService.submit(principal.getId(), orderId, body);
    }

    @GetMapping("/{orderId}/review")
    public ReviewResponse get(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("orderId") UUID orderId) {
        return reviewService.getForOrder(principal.getId(), orderId);
    }

    @PatchMapping("/{orderId}/review")
    public ReviewResponse patch(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable("orderId") UUID orderId,
            @Valid @RequestBody SubmitReviewRequest body) {
        return reviewService.patch(principal.getId(), orderId, body);
    }

    @DeleteMapping("/{orderId}/review")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("orderId") UUID orderId) {
        reviewService.deleteForUser(principal.getId(), orderId);
    }
}
