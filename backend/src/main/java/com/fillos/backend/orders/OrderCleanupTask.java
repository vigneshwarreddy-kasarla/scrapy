package com.fillos.backend.orders;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import java.util.Map;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class OrderCleanupTask {
    private final NamedParameterJdbcTemplate jdbc;

    public OrderCleanupTask(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Every 15 minutes, cancel orders that have been stuck in 'placed', 'confirmed', 'preparing', or 'ready'
     * for more than 4 hours.
     */
    @Scheduled(fixedRate = 900000) 
    public void cancelStaleOrders() {
        Instant cutoff = Instant.now().minus(4, ChronoUnit.HOURS);
        
        int updated = jdbc.update(
            """
            UPDATE orders 
            SET status = CAST('cancelled' AS order_status),
                updated_at = NOW()
            WHERE status NOT IN (CAST('delivered' AS order_status), CAST('cancelled' AS order_status))
              AND created_at < :cutoff
            """,
            Map.of("cutoff", java.sql.Timestamp.from(cutoff))
        );
        
        if (updated > 0) {
            System.out.println("[CLEANUP] Cancelled " + updated + " stale orders older than " + cutoff);
        }
    }
}
