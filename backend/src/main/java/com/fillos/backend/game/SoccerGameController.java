package com.fillos.backend.game;

import com.fillos.backend.game.GameDtos.CouponValidateRequest;
import com.fillos.backend.game.GameDtos.CouponValidateResponse;
import com.fillos.backend.game.GameDtos.GuestCouponValidateRequest;
import com.fillos.backend.game.GameDtos.GuestPlayRequest;
import com.fillos.backend.game.GameDtos.SoccerCouponResponse;
import com.fillos.backend.game.GameDtos.SoccerPlayResponse;
import com.fillos.backend.game.GameDtos.SoccerSettingsResponse;
import com.fillos.backend.security.AppUserDetails;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/games/soccer")
public class SoccerGameController {
    private final GameRepository gameRepository;

    public SoccerGameController(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @GetMapping
    public SoccerPlayResponse status(@AuthenticationPrincipal AppUserDetails principal) {
        SoccerSettingsResponse settings = gameRepository.getSoccerSettings();
        Optional<SoccerCouponResponse> active = gameRepository.findActiveCoupon(principal.getId(), Instant.now());
        return new SoccerPlayResponse(
                settings.enabled(),
                settings.enabled() ? "Take a shot to win a soccer coupon." : "Soccer game rewards are disabled by admin.",
                active.orElse(null),
                null);
    }

    @PostMapping("/play")
    @ResponseStatus(HttpStatus.CREATED)
    public SoccerPlayResponse play(@AuthenticationPrincipal AppUserDetails principal) {
        SoccerSettingsResponse settings = gameRepository.getSoccerSettings();
        if (!settings.enabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Soccer game rewards are disabled.");
        }
        Instant now = Instant.now();
        Optional<SoccerCouponResponse> active = gameRepository.findActiveCoupon(principal.getId(), now);
        if (active.isPresent()) {
            return new SoccerPlayResponse(true, "You already have an active soccer coupon.", active.get(), null);
        }

        int min = settings.minDiscountPercent();
        int max = settings.maxDiscountPercent();
        int discount = ThreadLocalRandom.current().nextInt(min, max + 1);
        Instant expiresAt = now.plus(settings.couponTtlHours(), ChronoUnit.HOURS);
        SoccerCouponResponse created = gameRepository.createSoccerCoupon(principal.getId(), discount, expiresAt);
        return new SoccerPlayResponse(true, "Goal! New coupon generated.", created, created);
    }

    @PostMapping("/guest/status")
    public SoccerPlayResponse guestStatus(@Valid @RequestBody GuestPlayRequest body) {
        SoccerSettingsResponse settings = gameRepository.getSoccerSettings();
        String digits = body.mobileNumber().replaceAll("\\D", "");
        UUID guestUserId = gameRepository.findOrCreateGuestCustomerByPhone(digits);
        Optional<SoccerCouponResponse> active = gameRepository.findActiveCoupon(guestUserId, Instant.now());
        return new SoccerPlayResponse(
                settings.enabled(),
                settings.enabled() ? "Enter match and shoot to win a coupon." : "Soccer game rewards are disabled by admin.",
                active.orElse(null),
                null);
    }

    @PostMapping("/guest/play")
    @ResponseStatus(HttpStatus.CREATED)
    public SoccerPlayResponse guestPlay(@Valid @RequestBody GuestPlayRequest body) {
        SoccerSettingsResponse settings = gameRepository.getSoccerSettings();
        if (!settings.enabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Soccer game rewards are disabled.");
        }
        String digits = body.mobileNumber().replaceAll("\\D", "");
        UUID guestUserId = gameRepository.findOrCreateGuestCustomerByPhone(digits);
        Instant now = Instant.now();
        Optional<SoccerCouponResponse> active = gameRepository.findActiveCoupon(guestUserId, now);
        if (active.isPresent()) {
            return new SoccerPlayResponse(true, "You already have an active soccer coupon for this mobile number.", active.get(), null);
        }
        int min = settings.minDiscountPercent();
        int max = settings.maxDiscountPercent();
        int discount = ThreadLocalRandom.current().nextInt(min, max + 1);
        Instant expiresAt = now.plus(settings.couponTtlHours(), ChronoUnit.HOURS);
        SoccerCouponResponse created = gameRepository.createSoccerCoupon(guestUserId, discount, expiresAt);
        return new SoccerPlayResponse(true, "Goal! New coupon generated.", created, created);
    }

    @PostMapping("/validate-coupon")
    public CouponValidateResponse validateCoupon(
            @AuthenticationPrincipal AppUserDetails principal, @Valid @RequestBody CouponValidateRequest body) {
        String code = body.code().trim().toUpperCase();
        Optional<SoccerCouponResponse> valid = gameRepository.validateCoupon(principal.getId(), code, Instant.now());
        if (valid.isEmpty()) {
            return new CouponValidateResponse(false, "Coupon is invalid or expired.", null, null);
        }
        SoccerCouponResponse coupon = valid.get();
        return new CouponValidateResponse(true, "Coupon is valid.", coupon.discountPercent(), coupon.expiresAt());
    }

    @PostMapping("/guest/validate-coupon")
    public CouponValidateResponse guestValidateCoupon(@Valid @RequestBody GuestCouponValidateRequest body) {
        String code = body.code().trim().toUpperCase();
        String digits = body.mobileNumber().replaceAll("\\D", "");
        UUID guestUserId = gameRepository.findOrCreateGuestCustomerByPhone(digits);
        Optional<SoccerCouponResponse> valid = gameRepository.validateCoupon(guestUserId, code, Instant.now());
        if (valid.isEmpty()) {
            return new CouponValidateResponse(false, "Coupon is invalid or expired for this mobile number.", null, null);
        }
        SoccerCouponResponse coupon = valid.get();
        return new CouponValidateResponse(true, "Coupon is valid.", coupon.discountPercent(), coupon.expiresAt());
    }
}
