package com.fillos.backend.security;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public final class AppUserDetails implements UserDetails {
    private final UUID id;
    private final String phone;
    private final String role;

    public AppUserDetails(UUID id, String phone, String role) {
        this.id = id;
        this.phone = phone;
        this.role = role;
    }

    public UUID getId() {
        return id;
    }

    public String getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(toSpringAuthority(role)));
    }

    private static String toSpringAuthority(String r) {
        if (r == null) {
            return "ROLE_CUSTOMER";
        }
        return switch (r) {
            case "admin" -> "ROLE_ADMIN";
            case "delivery_agent" -> "ROLE_DELIVERY_AGENT";
            case "restaurant" -> "ROLE_RESTAURANT";
            default -> "ROLE_CUSTOMER";
        };
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public String getUsername() {
        return phone;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
