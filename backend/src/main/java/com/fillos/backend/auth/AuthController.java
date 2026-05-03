package com.fillos.backend.auth;

import com.fillos.backend.auth.AuthDtos.LoginRequest;
import com.fillos.backend.auth.AuthDtos.RegisterRequest;
import com.fillos.backend.auth.AuthDtos.TokenResponse;
import com.fillos.backend.security.AppUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse register(@Valid @RequestBody RegisterRequest body) {
        return authService.register(body);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest body) {
        return authService.login(body);
    }

    @PostMapping("/register-admin")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse registerAdmin(
            @RequestHeader(value = "X-Admin-Registration-Secret", required = false) String registrationSecret,
            @Valid @RequestBody RegisterRequest body) {
        return authService.registerAdmin(body, registrationSecret);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal AppUserDetails principal) {
        authService.logout(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
