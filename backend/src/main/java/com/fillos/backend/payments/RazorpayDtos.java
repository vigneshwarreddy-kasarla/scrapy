package com.fillos.backend.payments;

import java.util.UUID;

public final class RazorpayDtos {
    private RazorpayDtos() {}

    /** Payload for Razorpay Checkout on the client (amount in smallest currency unit, e.g. paise for INR). */
    public record RazorpayCheckoutResponse(
            UUID fillosOrderId,
            String razorpayOrderId,
            int amount,
            String currency,
            String keyId) {}
}
