package com.fillos.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fillos.admin-registration")
public record AdminRegistrationProperties(boolean enabled, String secret) {}
