package com.fillos.backend.config;

import com.fillos.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order
public class AdminBootstrapRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);
    private static final String DEFAULT_COUNTRY_CODE = "+91";

    private final AdminBootstrapProperties props;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrapRunner(AdminBootstrapProperties props, UserRepository users, PasswordEncoder passwordEncoder) {
        this.props = props;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!props.enabled()) {
            return;
        }
        if (props.password() == null || props.password().isBlank()) {
            log.warn("Admin bootstrap enabled but fillos.admin-bootstrap.password is empty; skipping");
            return;
        }
        String storedPhone = normalizePhoneForStorage(props.phone());
        if (users.existsByPhone(storedPhone)) {
            return;
        }
        String hash = passwordEncoder.encode(props.password());
        String email = props.email() == null || props.email().isBlank() ? null : props.email();
        users.insertUser(props.name(), email, storedPhone, DEFAULT_COUNTRY_CODE, hash, "admin", null, null);
        log.info("Bootstrapped admin user for phone {}", storedPhone);
    }

    private static String normalizePhoneForStorage(String phone) {
        String p = phone == null ? "" : phone.trim();
        if (p.matches("^[0-9]{10}$")) {
            return DEFAULT_COUNTRY_CODE + p;
        }
        return p;
    }
}
