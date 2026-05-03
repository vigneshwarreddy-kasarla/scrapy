package com.fillos.backend.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Value("${app.host}")
        private String hostUrl;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration c = new CorsConfiguration();

                c.setAllowedOrigins(
                                List.of(
                                                "http://localhost:5173",
                                                "http://localhost:5174",
                                                "http://127.0.0.1:5173",
                                                "http://127.0.0.1:5174",
                                                hostUrl));
                c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                c.setAllowedHeaders(List.of("*"));
                c.setExposedHeaders(List.of("Location"));
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/api/**", c);
                return source;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(
                        HttpSecurity http, JwtAuthenticationFilter jwtFilter,
                        CorsConfigurationSource corsConfigurationSource)
                        throws Exception {
                http.csrf(AbstractHttpConfigurer::disable)
                                .cors(c -> c.configurationSource(corsConfigurationSource))
                                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(
                                                auth -> auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                                                                .permitAll()
                                                                .requestMatchers("/actuator/health", "/actuator/info")
                                                                .permitAll()
                                                                .requestMatchers(HttpMethod.GET, "/api/v1/health")
                                                                .permitAll()
                                                                .requestMatchers(HttpMethod.GET, "/api/v1/menu/**")
                                                                .permitAll()
                                                                .requestMatchers(HttpMethod.GET,
                                                                                "/api/v1/reviews/summary")
                                                                .permitAll()
                                                                .requestMatchers(HttpMethod.GET,
                                                                                "/api/v1/reviews/items/**")
                                                                .permitAll()
                                                                .requestMatchers(
                                                                                HttpMethod.POST,
                                                                                "/api/v1/games/soccer/guest/status",
                                                                                "/api/v1/games/soccer/guest/play",
                                                                                "/api/v1/games/soccer/guest/validate-coupon")
                                                                .permitAll()
                                                                .requestMatchers(HttpMethod.GET, "/dummyimages/**")
                                                                .permitAll()
                                                                .requestMatchers(
                                                                                HttpMethod.POST,
                                                                                "/api/v1/auth/register",
                                                                                "/api/v1/auth/login",
                                                                                "/api/v1/auth/register-admin")
                                                                .permitAll()
                                                                .requestMatchers("/error")
                                                                .permitAll()
                                                                .requestMatchers(HttpMethod.POST,
                                                                                "/api/v1/webhooks/razorpay")
                                                                .permitAll()
                                                                .requestMatchers("/api/v1/admin/**")
                                                                .hasRole("ADMIN")
                                                                .requestMatchers("/api/v1/delivery/**")
                                                                .hasRole("DELIVERY_AGENT")
                                                                .requestMatchers("/api/v1/restaurant/**")
                                                                .hasRole("RESTAURANT")
                                                                .requestMatchers(
                                                                                "/api/v1/cart/**",
                                                                                "/api/v1/favorites/**",
                                                                                "/api/v1/orders/**",
                                                                                "/api/v1/users/me",
                                                                                "/api/v1/users/me/**")
                                                                .authenticated()
                                                                .anyRequest()
                                                                .authenticated())
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }
}
