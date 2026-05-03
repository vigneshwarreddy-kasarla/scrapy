package com.fillos.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fillos.admin-bootstrap")
public record AdminBootstrapProperties(
        boolean enabled, String phone, String name, String email, String password) {}
