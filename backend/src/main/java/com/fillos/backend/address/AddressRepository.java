package com.fillos.backend.address;

import com.fillos.backend.address.AddressDtos.AddressResponse;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AddressRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public AddressRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<AddressResponse> listByUserId(UUID userId) {
        String sql =
                """
                SELECT id, label, line1, line2, city, region, postal_code, country, is_default, created_at
                FROM user_addresses
                WHERE user_id = :userId
                ORDER BY is_default DESC, created_at ASC
                """;
        return jdbc.query(sql, Map.of("userId", userId), (rs, rn) -> mapRow(rs));
    }

    public Optional<AddressRow> findByIdAndUserId(UUID id, UUID userId) {
        String sql =
                """
                SELECT id, user_id, label, line1, line2, city, region, postal_code, country, is_default, created_at
                FROM user_addresses
                WHERE id = :id AND user_id = :userId
                """;
        List<AddressRow> rows =
                jdbc.query(
                        sql,
                        Map.of("id", id, "userId", userId),
                        (rs, rn) ->
                                new AddressRow(
                                        rs.getObject("id", UUID.class),
                                        rs.getObject("user_id", UUID.class),
                                        rs.getString("label"),
                                        rs.getString("line1"),
                                        rs.getString("line2"),
                                        rs.getString("city"),
                                        rs.getString("region"),
                                        rs.getString("postal_code"),
                                        rs.getString("country"),
                                        rs.getBoolean("is_default"),
                                        rs.getTimestamp("created_at").toInstant()));
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public UUID insert(
            UUID userId,
            String label,
            String line1,
            String line2,
            String city,
            String region,
            String postalCode,
            String country,
            boolean isDefault) {
        UUID id = UUID.randomUUID();
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", id);
        p.addValue("userId", userId);
        p.addValue("label", label);
        p.addValue("line1", line1);
        p.addValue("line2", line2);
        p.addValue("city", city);
        p.addValue("region", region);
        p.addValue("postalCode", postalCode);
        p.addValue("country", country);
        p.addValue("isDefault", isDefault);
        jdbc.update(
                """
                INSERT INTO user_addresses (id, user_id, label, line1, line2, city, region, postal_code, country, is_default)
                VALUES (:id, :userId, :label, :line1, :line2, :city, :region, :postalCode, :country, :isDefault)
                """,
                p);
        return id;
    }

    public int clearDefaultForUser(UUID userId) {
        return jdbc.update(
                """
                UPDATE user_addresses SET is_default = FALSE, updated_at = NOW()
                WHERE user_id = :userId AND is_default = TRUE
                """,
                Map.of("userId", userId));
    }

    public int updateAddress(
            UUID id,
            UUID userId,
            String label,
            String line1,
            String line2,
            String city,
            String region,
            String postalCode,
            String country,
            boolean isDefault) {
        return jdbc.update(
                """
                UPDATE user_addresses
                SET label = :label,
                    line1 = :line1,
                    line2 = :line2,
                    city = :city,
                    region = :region,
                    postal_code = :postalCode,
                    country = :country,
                    is_default = :isDefault,
                    updated_at = NOW()
                WHERE id = :id AND user_id = :userId
                """,
                Map.of(
                        "id",
                        id,
                        "userId",
                        userId,
                        "label",
                        label,
                        "line1",
                        line1,
                        "line2",
                        line2,
                        "city",
                        city,
                        "region",
                        region,
                        "postalCode",
                        postalCode,
                        "country",
                        country,
                        "isDefault",
                        isDefault));
    }

    public int delete(UUID id, UUID userId) {
        return jdbc.update(
                "DELETE FROM user_addresses WHERE id = :id AND user_id = :userId",
                Map.of("id", id, "userId", userId));
    }

    public Optional<AddressResponse> findResponseByIdAndUserId(UUID id, UUID userId) {
        return findByIdAndUserId(id, userId).map(AddressRepository::toResponse);
    }

    private static AddressResponse mapRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new AddressResponse(
                rs.getObject("id", UUID.class),
                rs.getString("label"),
                rs.getString("line1"),
                rs.getString("line2"),
                rs.getString("city"),
                rs.getString("region"),
                rs.getString("postal_code"),
                rs.getString("country"),
                rs.getBoolean("is_default"),
                rs.getTimestamp("created_at").toInstant());
    }

    private static AddressResponse toResponse(AddressRow r) {
        return new AddressResponse(
                r.id(),
                r.label(),
                r.line1(),
                r.line2(),
                r.city(),
                r.region(),
                r.postalCode(),
                r.country(),
                r.isDefault(),
                r.createdAt());
    }

    public record AddressRow(
            UUID id,
            UUID userId,
            String label,
            String line1,
            String line2,
            String city,
            String region,
            String postalCode,
            String country,
            boolean isDefault,
            Instant createdAt) {}

    public static String formatSnapshot(AddressRow a) {
        StringBuilder sb = new StringBuilder();
        if (a.label() != null && !a.label().isBlank()) {
            sb.append(a.label().trim()).append(" — ");
        }
        sb.append(a.line1().trim());
        if (a.line2() != null && !a.line2().isBlank()) {
            sb.append(", ").append(a.line2().trim());
        }
        sb.append(", ").append(a.city().trim());
        if (a.region() != null && !a.region().isBlank()) {
            sb.append(", ").append(a.region().trim());
        }
        sb.append(" ").append(a.postalCode().trim());
        if (a.country() != null && !a.country().isBlank() && !"US".equalsIgnoreCase(a.country())) {
            sb.append(" ").append(a.country().trim());
        }
        return sb.toString();
    }
}
