package com.fillos.backend.auth;

import com.fillos.backend.auth.AuthDtos.DeliveryAgentSummaryResponse;
import com.fillos.backend.auth.AuthDtos.RegisterRequest;
import com.fillos.backend.auth.AuthDtos.UserProfileResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/staff")
public class AdminStaffController {
    private final AuthService authService;

    public AdminStaffController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/delivery-agents")
    public List<DeliveryAgentSummaryResponse> listDeliveryAgents() {
        return authService.listActiveDeliveryAgents();
    }

    @PostMapping("/delivery-agents")
    @ResponseStatus(HttpStatus.CREATED)
    public UserProfileResponse createDeliveryAgent(@Valid @RequestBody RegisterRequest body) {
        return authService.createDeliveryAgentByAdmin(body);
    }

    @PostMapping("/users/{role}")
    @ResponseStatus(HttpStatus.CREATED)
    public UserProfileResponse createUser(
            @org.springframework.web.bind.annotation.PathVariable String role,
            @Valid @RequestBody RegisterRequest body) {
        return authService.createUserByAdmin(body, role);
    }
}
