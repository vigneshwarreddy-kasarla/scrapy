package com.fillos.backend.game;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.List;

public class GameDtos {
    public record SoccerSettingsResponse(
            boolean enabled, int minDiscountPercent, int maxDiscountPercent, int couponTtlHours, Instant updatedAt) {}

    public record SoccerSettingsPatchRequest(
            Boolean enabled,
            @Min(1) @Max(90) Integer minDiscountPercent,
            @Min(1) @Max(90) Integer maxDiscountPercent,
            @Min(1) @Max(168) Integer couponTtlHours) {}

    public record SoccerCouponResponse(String code, int discountPercent, Instant expiresAt, Instant createdAt) {}

    public record SoccerPlayResponse(
            boolean settingsEnabled, String message, SoccerCouponResponse activeCoupon, SoccerCouponResponse newlyGeneratedCoupon) {}

    public record GuestPlayRequest(@NotBlank @Pattern(regexp = "\\d{10,15}") String mobileNumber) {}

    public record CouponValidateRequest(@NotBlank String code) {}

    public record GuestCouponValidateRequest(
            @NotBlank String code, @NotBlank @Pattern(regexp = "\\d{10,15}") String mobileNumber) {}

    public record CouponValidateResponse(boolean valid, String message, Integer discountPercent, Instant expiresAt) {}

    public record SoccerAnalyticsResponse(
            long generatedCoupons,
            long activeCoupons,
            long redeemedCoupons,
            double redemptionRatePercent,
            double averageDiscountPercent,
            List<SoccerCouponResponse> latestCoupons) {}
}
