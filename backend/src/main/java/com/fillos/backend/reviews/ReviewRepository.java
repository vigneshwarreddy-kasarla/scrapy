package com.fillos.backend.reviews;

import com.fillos.backend.reviews.ReviewDtos.AdminReviewListItem;
import com.fillos.backend.reviews.ReviewDtos.ItemRatingSummaryResponse;
import com.fillos.backend.reviews.ReviewDtos.ReviewResponse;
import com.fillos.backend.reviews.ReviewDtos.ReviewSummaryResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ReviewRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public ReviewRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean orderExistsForUser(UUID orderId, UUID userId) {
        Integer n =
                jdbc.queryForObject(
                        "SELECT COUNT(*)::int FROM orders WHERE id = :orderId AND user_id = :userId",
                        Map.of("orderId", orderId, "userId", userId),
                        Integer.class);
        return n != null && n > 0;
    }

    /** Order exists for user and status is {@code delivered}. */
    public boolean isDeliveredOrderOwnedBy(UUID orderId, UUID userId) {
        Boolean ok =
                jdbc.queryForObject(
                        """
                        SELECT EXISTS(
                          SELECT 1 FROM orders
                          WHERE id = :orderId AND user_id = :userId
                            AND status = CAST('delivered' AS order_status)
                        )
                        """,
                        Map.of("orderId", orderId, "userId", userId),
                        Boolean.class);
        return Boolean.TRUE.equals(ok);
    }

    public boolean existsForOrder(UUID orderId) {
        Integer n =
                jdbc.queryForObject(
                        "SELECT COUNT(*)::int FROM order_reviews WHERE order_id = :orderId",
                        Map.of("orderId", orderId),
                        Integer.class);
        return n != null && n > 0;
    }

    public UUID insert(UUID orderId, UUID userId, int rating, String comment) {
        UUID id = UUID.randomUUID();
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", id);
        p.addValue("orderId", orderId);
        p.addValue("userId", userId);
        p.addValue("rating", rating);
        p.addValue("comment", comment);
        jdbc.update(
                """
                INSERT INTO order_reviews (id, order_id, user_id, rating, comment)
                VALUES (:id, :orderId, :userId, :rating, :comment)
                """,
                p);
        return id;
    }

    public Optional<ReviewResponse> findByOrderAndUser(UUID orderId, UUID userId) {
        String sql =
                """
                SELECT r.id, r.order_id, r.rating, r.comment, r.created_at
                FROM order_reviews r
                JOIN orders o ON o.id = r.order_id AND o.user_id = :userId
                WHERE r.order_id = :orderId
                """;
        List<ReviewResponse> rows =
                jdbc.query(
                        sql,
                        Map.of("orderId", orderId, "userId", userId),
                        (rs, rn) ->
                                new ReviewResponse(
                                        rs.getObject("id", UUID.class),
                                        rs.getObject("order_id", UUID.class),
                                        rs.getInt("rating"),
                                        rs.getString("comment"),
                                        rs.getTimestamp("created_at").toInstant()));
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public List<AdminReviewListItem> listAllReviews(int limit, long offset) {
        String sql =
                """
                SELECT r.id, r.order_id, r.user_id, u.phone, r.rating, r.comment, r.created_at
                FROM order_reviews r
                JOIN users u ON u.id = r.user_id AND u.deleted_at IS NULL
                JOIN orders o ON o.id = r.order_id
                ORDER BY r.created_at DESC
                LIMIT :limit OFFSET :offset
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("limit", limit);
        p.addValue("offset", offset);
        return jdbc.query(
                sql,
                p,
                (rs, rn) ->
                        new AdminReviewListItem(
                                rs.getObject("id", UUID.class),
                                rs.getObject("order_id", UUID.class),
                                rs.getObject("user_id", UUID.class),
                                rs.getString("phone"),
                                rs.getInt("rating"),
                                rs.getString("comment"),
                                rs.getTimestamp("created_at").toInstant()));
    }

    public ReviewSummaryResponse globalSummary() {
        String sql = "SELECT AVG(rating)::numeric(10,2) AS avg_r, COUNT(*)::bigint AS cnt FROM order_reviews";
        ResultSetExtractor<ReviewSummaryResponse> extract =
                rs -> {
                    if (!rs.next()) {
                        return new ReviewSummaryResponse(null, 0L);
                    }
                    long cnt = rs.getLong("cnt");
                    if (cnt == 0) {
                        return new ReviewSummaryResponse(null, 0L);
                    }
                    return new ReviewSummaryResponse(rs.getBigDecimal("avg_r"), cnt);
                };
        return jdbc.query(sql, new MapSqlParameterSource(), extract);
    }

    public ItemRatingSummaryResponse itemSummary(UUID menuItemId) {
        String sql =
                """
                SELECT AVG(r.rating)::numeric(10,2) AS avg_r, COUNT(DISTINCT r.id)::bigint AS cnt
                FROM order_items oi
                JOIN order_reviews r ON r.order_id = oi.order_id
                WHERE oi.menu_item_id = :menuItemId
                """;
        ResultSetExtractor<ItemRatingSummaryResponse> extract =
                rs -> {
                    if (!rs.next()) {
                        return new ItemRatingSummaryResponse(menuItemId, null, 0L);
                    }
                    long cnt = rs.getLong("cnt");
                    if (cnt == 0) {
                        return new ItemRatingSummaryResponse(menuItemId, null, 0L);
                    }
                    return new ItemRatingSummaryResponse(menuItemId, rs.getBigDecimal("avg_r"), cnt);
                };
        return jdbc.query(sql, new MapSqlParameterSource("menuItemId", menuItemId), extract);
    }

    /**
     * Updates rating/comment only if the review exists for this user/order and was created within the last 24 hours
     * (server clock / DB {@code NOW()}).
     */
    public int updateWithin24h(UUID orderId, UUID userId, int rating, String comment) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("orderId", orderId);
        p.addValue("userId", userId);
        p.addValue("rating", rating);
        p.addValue("comment", comment);
        return jdbc.update(
                """
                UPDATE order_reviews SET rating = :rating, comment = :comment
                WHERE order_id = :orderId AND user_id = :userId
                  AND created_at > NOW() - INTERVAL '24 hours'
                """,
                p);
    }

    public int deleteWithin24h(UUID orderId, UUID userId) {
        return jdbc.update(
                """
                DELETE FROM order_reviews
                WHERE order_id = :orderId AND user_id = :userId
                  AND created_at > NOW() - INTERVAL '24 hours'
                """,
                Map.of("orderId", orderId, "userId", userId));
    }

    public int deleteById(UUID reviewId) {
        return jdbc.update("DELETE FROM order_reviews WHERE id = :id", Map.of("id", reviewId));
    }
}
