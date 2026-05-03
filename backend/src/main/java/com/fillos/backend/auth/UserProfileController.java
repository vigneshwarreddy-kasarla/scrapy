package com.fillos.backend.auth;

import com.fillos.backend.auth.AuthDtos.PatchProfileRequest;
import com.fillos.backend.auth.AuthDtos.PutPushTokenRequest;
import com.fillos.backend.auth.AuthDtos.UserProfileResponse;
import com.fillos.backend.security.AppUserDetails;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserProfileController {
    private final AuthService authService;

    public UserProfileController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal AppUserDetails principal) {
        return authService.currentProfile(principal.getId());
    }

    @PatchMapping("/me")
    public UserProfileResponse patchMe(
            @AuthenticationPrincipal AppUserDetails principal, @Valid @RequestBody PatchProfileRequest body) {
        return authService.patchProfile(principal.getId(), body);
    }

    @PutMapping("/me/push-token")
    public UserProfileResponse putPushToken(
            @AuthenticationPrincipal AppUserDetails principal, @Valid @RequestBody PutPushTokenRequest body) {
        return authService.putPushToken(principal.getId(), body);
    }

    @DeleteMapping("/me/push-token")
    public UserProfileResponse clearPushToken(@AuthenticationPrincipal AppUserDetails principal) {
        return authService.clearPushToken(principal.getId());
    }
}
