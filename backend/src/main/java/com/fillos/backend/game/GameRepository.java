package com.fillos.backend.game;

import com.fillos.backend.game.GameDtos.SoccerAnalyticsResponse;
import com.fillos.backend.game.GameDtos.SoccerCouponResponse;
import com.fillos.backend.game.GameDtos.SoccerSettingsPatchRequest;
import com.fillos.backend.game.GameDtos.SoccerSettingsResponse;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GameRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public GameRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public SoccerSettingsResponse getSoccerSettings() {
        String sql =
                """
                SELECT is_enabled, min_discount_percent, max_discount_percent, coupon_ttl_hours, updated_at
                FROM game_coupon_settings
                WHERE game_key = CAST('soccer' AS game_key)
                """;
        return jdbc.queryForObject(
                sql,
                Map.of(),
                (rs, rn) ->
                        new SoccerSettingsResponse(
                                rs.getBoolean("is_enabled"),
                                rs.getInt("min_discount_percent"),
                                rs.getInt("max_discount_percent"),
                                rs.getInt("coupon_ttl_hours"),
                                rs.getTimestamp("updated_at").toInstant()));
    }

    public SoccerSettingsResponse patchSoccerSettings(SoccerSettingsPatchRequest body) {
        SoccerSettingsResponse current = getSoccerSettings();
        int min = body.minDiscountPercent() != null ? body.minDiscountPercent() : current.minDiscountPercent();
        int max = body.maxDiscountPercent() != null ? body.maxDiscountPercent() : current.maxDiscountPercent();
        if (min > max) {
            throw new IllegalArgumentException("minDiscountPercent cannot be greater than maxDiscountPercent");
        }
        boolean enabled = body.enabled() != null ? body.enabled() : current.enabled();
        int ttl = body.couponTtlHours() != null ? body.couponTtlHours() : current.couponTtlHours();
        jdbc.update(
                """
                UPDATE game_coupon_settings
                SET is_enabled = :enabled,
                    min_discount_percent = :minDiscount,
                    max_discount_percent = :maxDiscount,
                    coupon_ttl_hours = :ttl,
                    updated_at = NOW()
                WHERE game_key = CAST('soccer' AS game_key)
                """,
                Map.of("enabled", enabled, "minDiscount", min, "maxDiscount", max, "ttl", ttl));
        return getSoccerSettings();
    }

    public Optional<SoccerCouponResponse> findActiveCoupon(UUID userId, Instant now) {
        String sql =
                """
                SELECT code, discount_percent, expires_at, created_at
                FROM game_coupons
                WHERE user_id = :userId
                  AND game_key = CAST('soccer' AS game_key)
                  AND redeemed_at IS NULL
                  AND expires_at > :now
                ORDER BY created_at DESC
                LIMIT 1
                """;
        List<SoccerCouponResponse> rows =
                jdbc.query(
                        sql,
                        Map.of("userId", userId, "now", Timestamp.from(now)),
                        (rs, rn) ->
                                new SoccerCouponResponse(
                                        rs.getString("code"),
                                        rs.getInt("discount_percent"),
                                        rs.getTimestamp("expires_at").toInstant(),
                                        rs.getTimestamp("created_at").toInstant()));
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public SoccerCouponResponse createSoccerCoupon(UUID userId, int discountPercent, Instant expiresAt) {
        String code = "SOCCER-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", UUID.randomUUID());
        p.addValue("userId", userId);
        p.addValue("code", code);
        p.addValue("discount", discountPercent);
        p.addValue("expiresAt", Timestamp.from(expiresAt));
        jdbc.update(
                """
                INSERT INTO game_coupons (id, user_id, game_key, code, discount_percent, expires_at)
                VALUES (:id, :userId, CAST('soccer' AS game_key), :code, :discount, :expiresAt)
                """,
                p);
        return new SoccerCouponResponse(code, discountPercent, expiresAt, Instant.now());
    }

    public Optional<SoccerCouponResponse> validateCoupon(UUID userId, String code, Instant now) {
        String sql =
                """
                SELECT code, discount_percent, expires_at, created_at
                FROM game_coupons
                WHERE user_id = :userId
                  AND game_key = CAST('soccer' AS game_key)
                  AND code = :code
                  AND redeemed_at IS NULL
                  AND expires_at > :now
                LIMIT 1
                """;
        List<SoccerCouponResponse> rows =
                jdbc.query(
                        sql,
                        Map.of("userId", userId, "code", code, "now", Timestamp.from(now)),
                        (rs, rn) ->
                                new SoccerCouponResponse(
                                        rs.getString("code"),
                                        rs.getInt("discount_percent"),
                                        rs.getTimestamp("expires_at").toInstant(),
                                        rs.getTimestamp("created_at").toInstant()));
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public UUID findOrCreateGuestCustomerByPhone(String phoneDigits) {
        List<UUID> rows =
                jdbc.query(
                        """
                        SELECT id
                        FROM users
                        WHERE phone = :phone
                          AND deleted_at IS NULL
                        LIMIT 1
                        """,
                        Map.of("phone", phoneDigits),
                        (rs, rn) -> rs.getObject("id", UUID.class));
        if (!rows.isEmpty()) {
            return rows.getFirst();
        }
        UUID userId = UUID.randomUUID();
        String guestName = "Guest " + phoneDigits.substring(Math.max(0, phoneDigits.length() - 4));
        try {
            jdbc.update(
                    """
                    INSERT INTO users (id, name, phone, role, is_active)
                    VALUES (:id, :name, :phone, CAST('customer' AS user_role), TRUE)
                    """,
                    Map.of("id", userId, "name", guestName, "phone", phoneDigits));
            return userId;
        } catch (DataAccessException ex) {
            List<UUID> existing =
                    jdbc.query(
                            "SELECT id FROM users WHERE phone = :phone AND deleted_at IS NULL LIMIT 1",
                            Map.of("phone", phoneDigits),
                            (rs, rn) -> rs.getObject("id", UUID.class));
            if (!existing.isEmpty()) return existing.getFirst();
            throw ex;
        }
    }

    public SoccerAnalyticsResponse getSoccerAnalytics(Instant now) {
        Long generated =
                jdbc.queryForObject(
                        "SELECT COUNT(*) FROM game_coupons WHERE game_key = CAST('soccer' AS game_key)",
                        Map.of(),
                        Long.class);
        Long active =
                jdbc.queryForObject(
                        """
                        SELECT COUNT(*) FROM game_coupons
                        WHERE game_key = CAST('soccer' AS game_key)
                          AND redeemed_at IS NULL
                          AND expires_at > :now
                        """,
                        Map.of("now", Timestamp.from(now)),
                        Long.class);
        Long redeemed =
                jdbc.queryForObject(
                        """
                        SELECT COUNT(*) FROM game_coupons
                        WHERE game_key = CAST('soccer' AS game_key)
                          AND redeemed_at IS NOT NULL
                        """,
                        Map.of(),
                        Long.class);
        Double avgDiscount =
                jdbc.queryForObject(
                        """
                        SELECT COALESCE(AVG(discount_percent), 0)
                        FROM game_coupons
                        WHERE game_key = CAST('soccer' AS game_key)
                        """,
                        Map.of(),
                        Double.class);
        List<SoccerCouponResponse> latest =
                jdbc.query(
                        """
                        SELECT code, discount_percent, expires_at, created_at
                        FROM game_coupons
                        WHERE game_key = CAST('soccer' AS game_key)
                        ORDER BY created_at DESC
                        LIMIT 10
                        """,
                        Map.of(),
                        (rs, rn) ->
                                new SoccerCouponResponse(
                                        rs.getString("code"),
                                        rs.getInt("discount_percent"),
                                        rs.getTimestamp("expires_at").toInstant(),
                                        rs.getTimestamp("created_at").toInstant()));
        long generatedVal = generated != null ? generated : 0L;
        long redeemedVal = redeemed != null ? redeemed : 0L;
        double redemptionRate = generatedVal == 0 ? 0 : (redeemedVal * 100.0) / generatedVal;
        return new SoccerAnalyticsResponse(
                generatedVal,
                active != null ? active : 0L,
                redeemedVal,
                redemptionRate,
                avgDiscount != null ? avgDiscount : 0,
                latest);
    }
}
