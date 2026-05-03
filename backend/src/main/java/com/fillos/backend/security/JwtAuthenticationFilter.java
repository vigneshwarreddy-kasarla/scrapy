package com.fillos.backend.security;

import com.fillos.backend.user.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final String BEARER = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository users;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER)) {
            filterChain.doFilter(request, response);
            return;
        }
        String raw = header.substring(BEARER.length()).trim();
        if (raw.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            Claims claims = jwtService.parseAndValidate(raw);
            UUID id = UUID.fromString(claims.getSubject());
            String phone = claims.get("phone", String.class);
            String role = claims.get("role", String.class);
            if (phone == null || role == null) {
                filterChain.doFilter(request, response);
                return;
            }
            int tvClaim = parseTokenVersionClaim(claims.get("tv"));
            Optional<Integer> tvDb = users.findTokenVersionById(id);
            if (tvDb.isEmpty() || tvDb.get() != tvClaim) {
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }
            AppUserDetails principal = new AppUserDetails(id, phone, role);
            var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception ignored) {
            SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }

    private static int parseTokenVersionClaim(Object tv) {
        if (tv == null) {
            return -1;
        }
        if (tv instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(tv.toString());
        } catch (NumberFormatException e) {
            return -1;
        }
    }
}
