package com.fillos.backend.user;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public UserRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<UserAccount> ROW =
            (rs, rowNum) ->
                    new UserAccount(
                            rs.getObject("id", UUID.class),
                            rs.getString("name"),
                            rs.getString("email"),
                            rs.getString("phone"),
                            rs.getString("password_hash"),
                            rs.getString("role"),
                            rs.getBoolean("is_active"),
                            rs.getInt("token_version"));

    public boolean existsByPhone(String phone) {
        Integer n =
                jdbc.queryForObject(
                        "SELECT COUNT(*)::int FROM users WHERE phone = :phone AND deleted_at IS NULL",
                        Map.of("phone", phone),
                        Integer.class);
        return n != null && n > 0;
    }

    public boolean existsByEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        Integer n =
                jdbc.queryForObject(
                        "SELECT COUNT(*)::int FROM users WHERE email = :email AND deleted_at IS NULL",
                        Map.of("email", email),
                        Integer.class);
        return n != null && n > 0;
    }

    public Optional<UserAccount> findByPhone(String phone) {
        String sql =
                """
                SELECT id, name, email, phone, password_hash, role::text AS role, is_active, token_version
                FROM users
                WHERE phone = :phone AND deleted_at IS NULL
                """;
        List<UserAccount> rows = jdbc.query(sql, Map.of("phone", phone), ROW);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public Optional<UserAccount> findById(UUID id) {
        String sql =
                """
                SELECT id, name, email, phone, password_hash, role::text AS role, is_active, token_version
                FROM users
                WHERE id = :id AND deleted_at IS NULL
                """;
        List<UserAccount> rows = jdbc.query(sql, Map.of("id", id), ROW);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public Optional<Integer> findTokenVersionById(UUID id) {
        String sql = "SELECT token_version FROM users WHERE id = :id AND deleted_at IS NULL";
        List<Integer> rows =
                jdbc.query(sql, Map.of("id", id), (rs, rn) -> rs.getInt("token_version"));
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public int incrementTokenVersion(UUID id) {
        return jdbc.update(
                """
                UPDATE users SET token_version = token_version + 1, updated_at = NOW()
                WHERE id = :id AND deleted_at IS NULL
                """,
                Map.of("id", id));
    }

    public UUID insertUser(
            String name, String email, String phone, String countryCode, String passwordHash, String role, Double lat, Double lng) {
        UUID id = UUID.randomUUID();
        String sql =
                """
                INSERT INTO users (id, name, email, phone, country_code, password_hash, role, is_active, lat, lng)
                VALUES (:id, :name, :email, :phone, :countryCode, :passwordHash, CAST(:role AS user_role), TRUE, :lat, :lng)
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", id);
        p.addValue("name", name);
        p.addValue("email", email);
        p.addValue("phone", phone);
        p.addValue("countryCode", countryCode);
        p.addValue("passwordHash", passwordHash);
        p.addValue("role", role);
        p.addValue("lat", lat);
        p.addValue("lng", lng);
        jdbc.update(sql, p);
        return id;
    }

    public int updateProfile(UUID id, String name, String email) {
        String sql =
                """
                UPDATE users SET name = :name, email = :email, updated_at = NOW()
                WHERE id = :id AND deleted_at IS NULL
                """;
        return jdbc.update(sql, Map.of("id", id, "name", name, "email", email));
    }

    public int updateFcmToken(UUID id, String fcmTokenOrNull) {
        return jdbc.update(
                """
                UPDATE users SET fcm_token = :token, updated_at = NOW()
                WHERE id = :id AND deleted_at IS NULL
                """,
                new MapSqlParameterSource("id", id).addValue("token", fcmTokenOrNull));
    }

    public boolean hasPushToken(UUID id) {
        Boolean b =
                jdbc.queryForObject(
                        """
                        SELECT fcm_token IS NOT NULL AND length(trim(fcm_token)) > 0
                        FROM users WHERE id = :id AND deleted_at IS NULL
                        """,
                        Map.of("id", id),
                        Boolean.class);
        return Boolean.TRUE.equals(b);
    }

    public List<PublicUserRow> listActiveUsersByRole(String role) {
        String sql =
                """
                SELECT id, name, phone, email
                FROM users
                WHERE role = CAST(:role AS user_role)
                  AND deleted_at IS NULL
                  AND is_active = TRUE
                ORDER BY name
                """;
        return jdbc.query(
                sql,
                Map.of("role", role),
                (rs, rn) ->
                        new PublicUserRow(
                                rs.getObject("id", UUID.class),
                                rs.getString("name"),
                                rs.getString("phone"),
                                rs.getString("email")));
    }

    public record PublicUserRow(UUID id, String name, String phone, String email) {}

    public record UserAccount(
            UUID id,
            String name,
            String email,
            String phone,
            String passwordHash,
            String role,
            boolean active,
            int tokenVersion) {}
}
