package com.fillos.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fillos.jwt")
public record JwtProperties(String secret, long expirationMs) {}
