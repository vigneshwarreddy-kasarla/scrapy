package com.fillos.backend.auth;

import com.fillos.backend.auth.AuthDtos.DeliveryAgentSummaryResponse;
import com.fillos.backend.auth.AuthDtos.LoginRequest;
import com.fillos.backend.auth.AuthDtos.PatchProfileRequest;
import com.fillos.backend.auth.AuthDtos.PutPushTokenRequest;
import com.fillos.backend.auth.AuthDtos.RegisterRequest;
import com.fillos.backend.auth.AuthDtos.TokenResponse;
import com.fillos.backend.auth.AuthDtos.UserProfileResponse;
import com.fillos.backend.config.AdminRegistrationProperties;
import com.fillos.backend.config.JwtProperties;
import com.fillos.backend.security.JwtService;
import com.fillos.backend.user.UserRepository;
import com.fillos.backend.user.UserRepository.UserAccount;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private static final String DEFAULT_COUNTRY_CODE = "+91";
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long expirationMs;
    private final AdminRegistrationProperties adminRegistration;

    public AuthService(
            UserRepository users,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties,
            AdminRegistrationProperties adminRegistration) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.expirationMs = jwtProperties.expirationMs();
        this.adminRegistration = adminRegistration;
    }

    @Transactional
    public TokenResponse register(RegisterRequest req) {
        String normalizedPhone = normalizeIndiaPhone(req.phone());
        if (users.existsByPhone(normalizedPhone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered");
        }
        if (req.email() != null && !req.email().isBlank() && users.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        String hash = passwordEncoder.encode(req.password());
        String email = req.email() == null || req.email().isBlank() ? null : req.email();
        UUID id = users.insertUser(req.name(), email, normalizedPhone, DEFAULT_COUNTRY_CODE, hash, "customer");
        return tokenFor(id, normalizedPhone, "customer", 0);
    }

    /**
     * Creates an admin user when {@code fillos.admin-registration} is enabled and the request header
     * {@code X-Admin-Registration-Secret} matches the configured secret (constant-time). Otherwise responds
     * with {@code 404} to avoid disclosing whether the feature exists.
     */
    @Transactional
    public TokenResponse registerAdmin(RegisterRequest req, String registrationSecretHeader) {
        if (!adminRegistration.enabled()
                || adminRegistration.secret() == null
                || adminRegistration.secret().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (!constantTimeEquals(
                registrationSecretHeader == null ? "" : registrationSecretHeader, adminRegistration.secret())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        String normalizedPhone = normalizeIndiaPhone(req.phone());
        if (users.existsByPhone(normalizedPhone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered");
        }
        if (req.email() != null && !req.email().isBlank() && users.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        String hash = passwordEncoder.encode(req.password());
        String email = req.email() == null || req.email().isBlank() ? null : req.email();
        UUID id = users.insertUser(req.name(), email, normalizedPhone, DEFAULT_COUNTRY_CODE, hash, "admin");
        return tokenFor(id, normalizedPhone, "admin", 0);
    }

    /**
     * Admin-only: create a user with role {@code delivery_agent}. Agent signs in later via {@link #login}.
     */
    @Transactional
    public UserProfileResponse createDeliveryAgentByAdmin(RegisterRequest req) {
        String normalizedPhone = normalizeIndiaPhone(req.phone());
        if (users.existsByPhone(normalizedPhone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered");
        }
        if (req.email() != null && !req.email().isBlank() && users.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        String hash = passwordEncoder.encode(req.password());
        String email = req.email() == null || req.email().isBlank() ? null : req.email();
        UUID id =
                users.insertUser(
                        req.name(), email, normalizedPhone, DEFAULT_COUNTRY_CODE, hash, "delivery_agent");
        return new UserProfileResponse(id, req.name(), email, normalizedPhone, "delivery_agent", true, false);
    }

    public List<DeliveryAgentSummaryResponse> listActiveDeliveryAgents() {
        return users.listActiveUsersByRole("delivery_agent").stream()
                .map(u -> new DeliveryAgentSummaryResponse(u.id(), u.name(), u.phone(), u.email()))
                .toList();
    }

    public TokenResponse login(LoginRequest req) {
        String normalizedPhone = normalizeIndiaPhone(req.phone());
        UserAccount u =
                users.findByPhone(normalizedPhone)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!u.active()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        if (u.passwordHash() == null || !passwordEncoder.matches(req.password(), u.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return tokenFor(u.id(), u.phone(), u.role(), u.tokenVersion());
    }

    private static String normalizeIndiaPhone(String raw) {
        String digits = raw == null ? "" : raw.trim();
        return DEFAULT_COUNTRY_CODE + digits;
    }

    @Transactional
    public void logout(UUID userId) {
        if (users.incrementTokenVersion(userId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
    }

    public UserProfileResponse currentProfile(UUID userId) {
        return toProfileResponse(userId);
    }

    @Transactional
    public UserProfileResponse putPushToken(UUID userId, PutPushTokenRequest body) {
        String token = body.fcmToken().trim();
        if (token.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fcmToken must not be blank");
        }
        if (users.updateFcmToken(userId, token) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return toProfileResponse(userId);
    }

    @Transactional
    public UserProfileResponse clearPushToken(UUID userId) {
        if (users.updateFcmToken(userId, null) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return toProfileResponse(userId);
    }

    @Transactional
    public UserProfileResponse patchProfile(UUID userId, PatchProfileRequest req) {
        UserAccount u =
                users.findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        String name = req.name() != null ? req.name() : u.name();
        String email = req.email() != null ? req.email() : u.email();
        if (email != null && !email.isBlank() && !email.equals(u.email()) && users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        if (users.updateProfile(userId, name, email) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return toProfileResponse(userId);
    }

    private UserProfileResponse toProfileResponse(UUID userId) {
        UserAccount u =
                users.findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return new UserProfileResponse(
                u.id(), u.name(), u.email(), u.phone(), u.role(), u.active(), users.hasPushToken(userId));
    }

    private TokenResponse tokenFor(UUID id, String phone, String role, int tokenVersion) {
        String token = jwtService.createAccessToken(id, phone, role, tokenVersion);
        return new TokenResponse(token, "Bearer", expirationMs / 1000);
    }

    private static boolean constantTimeEquals(String a, String b) {
        byte[] x = a.getBytes(StandardCharsets.UTF_8);
        byte[] y = b.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(x, y);
    }
}
