package com.fillos.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fillos.razorpay")
public record RazorpayProperties(
        Boolean enabled, String keyId, String keySecret, String webhookSecret, String currency) {

    public RazorpayProperties {
        if (enabled == null) {
            enabled = false;
        }
        if (currency == null || currency.isBlank()) {
            currency = "INR";
        } else {
            currency = currency.trim().toUpperCase();
        }
    }

    public boolean isConfigured() {
        return Boolean.TRUE.equals(enabled)
                && keyId != null
                && !keyId.isBlank()
                && keySecret != null
                && !keySecret.isBlank();
    }
}
