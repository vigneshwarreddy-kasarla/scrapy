package com.fillos.backend.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}
    private static final String PASSWORD_POLICY_REGEX =
            "^(?=\\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,72}$";
    private static final String PASSWORD_POLICY_MESSAGE =
            "password must be 8-72 chars, include uppercase, lowercase, number, special char, and no spaces";

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 150) String email,
            @NotBlank
                    @Pattern(regexp = "^[0-9]{10}$", message = "phone must be exactly 10 digits")
                    String phone,
            @NotBlank @Pattern(regexp = PASSWORD_POLICY_REGEX, message = PASSWORD_POLICY_MESSAGE)
                    String password,
            String role,
            Double lat,
            Double lng) {}

    public record LoginRequest(
            @NotBlank
                    @Pattern(regexp = "^[0-9]{10}$", message = "phone must be exactly 10 digits")
                    String phone,
            @NotBlank String password) {}

    public record TokenResponse(String accessToken, String tokenType, long expiresInSeconds) {}

    public record UserProfileResponse(
            java.util.UUID id,
            String name,
            String email,
            String phone,
            String role,
            boolean active,
            boolean pushRegistered) {}

    public record PatchProfileRequest(@Size(max = 100) String name, @Size(max = 150) String email) {}

    /** FCM / equivalent device token for future push notifications (never echoed back in full). */
    public record PutPushTokenRequest(@NotBlank @Size(max = 4096) String fcmToken) {}

    /** Active delivery agents for admin assignment UIs (no secrets). */
    public record DeliveryAgentSummaryResponse(
            java.util.UUID id, String name, String phone, String email) {}
}
