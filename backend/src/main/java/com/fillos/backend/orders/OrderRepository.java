package com.fillos.backend.orders;

import com.fillos.backend.orders.OrderDtos.AdminOrderDetailResponse;
import com.fillos.backend.orders.OrderDtos.AdminOrderSummaryResponse;
import com.fillos.backend.orders.OrderDtos.OrderLineResponse;
import com.fillos.backend.orders.OrderDtos.OrderResponse;
import com.fillos.backend.orders.OrderDtos.OrderSummaryResponse;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OrderRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public OrderRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<CartSnapshotLine> SNAPSHOT_ROW =
            (rs, rn) ->
                    new CartSnapshotLine(
                            rs.getObject("menu_item_id", UUID.class),
                            rs.getString("name"),
                            rs.getInt("quantity"),
                            rs.getBigDecimal("unit_price"));

    public List<CartSnapshotLine> loadCartSnapshotLines(UUID userId) {
        String sql =
                """
                SELECT ci.menu_item_id, mi.name, ci.quantity, mi.price AS unit_price
                FROM carts c
                JOIN cart_items ci ON ci.cart_id = c.id
                JOIN menu_items mi ON mi.id = ci.menu_item_id
                WHERE c.user_id = :userId
                ORDER BY ci.created_at ASC
                """;
        return jdbc.query(sql, Map.of("userId", userId), SNAPSHOT_ROW);
    }

    public UUID insertOrder(
            UUID userId, BigDecimal totalAmount, String deliveryAddressSnapshot, String customerNoteOrNull) {
        UUID orderId = UUID.randomUUID();
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", orderId);
        p.addValue("userId", userId);
        p.addValue("total", totalAmount);
        p.addValue("snap", deliveryAddressSnapshot);
        p.addValue("customerNote", customerNoteOrNull);
        jdbc.update(
                """
                INSERT INTO orders (id, user_id, status, total_amount, delivery_address_snapshot, payment_status,
                                    customer_note)
                VALUES (:id, :userId, 'placed', :total, :snap, CAST('unpaid' AS payment_status), :customerNote)
                """,
                p);
        return orderId;
    }

    public void insertOrderItem(
            UUID orderId, UUID menuItemId, String itemName, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
        UUID lineId = UUID.randomUUID();
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", lineId);
        p.addValue("orderId", orderId);
        p.addValue("menuItemId", menuItemId);
        p.addValue("itemName", itemName);
        p.addValue("quantity", quantity);
        p.addValue("unitPrice", unitPrice);
        p.addValue("lineTotal", lineTotal);
        jdbc.update(
                """
                INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, line_total)
                VALUES (:id, :orderId, :menuItemId, :itemName, :quantity, :unitPrice, :lineTotal)
                """,
                p);
    }

    public void clearCartForUser(UUID userId) {
        jdbc.update(
                """
                DELETE FROM cart_items ci
                USING carts c
                WHERE ci.cart_id = c.id AND c.user_id = :userId
                """,
                Map.of("userId", userId));
        jdbc.update(
                "UPDATE carts SET updated_at = NOW() WHERE user_id = :userId",
                Map.of("userId", userId));
    }

    public Optional<OrderResponse> findOrderForUser(UUID orderId, UUID userId) {
        String orderSql =
                """
                SELECT id, status::text, total_amount, created_at, delivery_address_snapshot,
                       payment_status::text, paid_at, customer_note
                FROM orders
                WHERE id = :orderId AND user_id = :userId
                """;
        List<OrderHead> heads =
                jdbc.query(
                        orderSql,
                        Map.of("orderId", orderId, "userId", userId),
                        (rs, rn) ->
                                new OrderHead(
                                        rs.getObject("id", UUID.class),
                                        rs.getString("status"),
                                        rs.getBigDecimal("total_amount"),
                                        rs.getTimestamp("created_at").toInstant(),
                                        rs.getString("delivery_address_snapshot"),
                                        rs.getString("payment_status"),
                                        instantOrNull(rs.getTimestamp("paid_at")),
                                        rs.getString("customer_note")));
        if (heads.isEmpty()) {
            return Optional.empty();
        }
        OrderHead h = heads.getFirst();
        String linesSql =
                """
                SELECT id, menu_item_id, item_name, quantity, unit_price, line_total
                FROM order_items
                WHERE order_id = :orderId
                ORDER BY created_at ASC
                """;
        List<OrderLineResponse> lines =
                jdbc.query(
                        linesSql,
                        Map.of("orderId", orderId),
                        (rs, rn) ->
                                new OrderLineResponse(
                                        rs.getObject("id", UUID.class),
                                        rs.getObject("menu_item_id", UUID.class),
                                        rs.getString("item_name"),
                                        rs.getInt("quantity"),
                                        rs.getBigDecimal("unit_price"),
                                        rs.getBigDecimal("line_total")));
        return Optional.of(
                new OrderResponse(
                        h.id(),
                        h.status(),
                        lines,
                        h.total(),
                        h.createdAt(),
                        h.deliveryAddressSnapshot(),
                        h.paymentStatus(),
                        h.paidAt(),
                        h.customerNote()));
    }

    public List<OrderSummaryResponse> listOrdersForUser(UUID userId, int limit) {
        String sql =
                """
                SELECT id, status::text, total_amount, created_at, payment_status::text, paid_at, customer_note
                FROM orders
                WHERE user_id = :userId
                ORDER BY created_at DESC
                LIMIT :limit
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("userId", userId);
        p.addValue("limit", limit);
        return jdbc.query(
                sql,
                p,
                (rs, rn) ->
                        new OrderSummaryResponse(
                                rs.getObject("id", UUID.class),
                                rs.getString("status"),
                                rs.getBigDecimal("total_amount"),
                                rs.getTimestamp("created_at").toInstant(),
                                rs.getString("payment_status"),
                                instantOrNull(rs.getTimestamp("paid_at")),
                                rs.getString("customer_note")));
    }

    public List<AdminOrderSummaryResponse> listAllOrdersAdmin(int limit, long offset) {
        String sql =
                """
                SELECT o.id, o.user_id, u.phone, o.status::text, o.total_amount, o.created_at,
                       o.delivery_agent_id, o.delivered_at, o.delivery_address_snapshot,
                       o.payment_status::text, o.paid_at, o.customer_note
                FROM orders o
                JOIN users u ON u.id = o.user_id AND u.deleted_at IS NULL
                ORDER BY o.created_at DESC
                LIMIT :limit OFFSET :offset
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("limit", limit);
        p.addValue("offset", offset);
        return jdbc.query(
                sql,
                p,
                (rs, rn) ->
                        new AdminOrderSummaryResponse(
                                rs.getObject("id", UUID.class),
                                rs.getObject("user_id", UUID.class),
                                rs.getString("phone"),
                                rs.getString("status"),
                                rs.getBigDecimal("total_amount"),
                                rs.getTimestamp("created_at").toInstant(),
                                rs.getObject("delivery_agent_id", UUID.class),
                                instantOrNull(rs.getTimestamp("delivered_at")),
                                rs.getString("delivery_address_snapshot"),
                                rs.getString("payment_status"),
                                instantOrNull(rs.getTimestamp("paid_at")),
                                rs.getString("customer_note")));
    }

    public List<AdminOrderSummaryResponse> listOrdersForDeliveryAgent(UUID agentId, int limit) {
        String sql =
                """
                SELECT o.id, o.user_id, u.phone, o.status::text, o.total_amount, o.created_at,
                       o.delivery_agent_id, o.delivered_at, o.delivery_address_snapshot,
                       o.payment_status::text, o.paid_at, o.customer_note
                FROM orders o
                JOIN users u ON u.id = o.user_id AND u.deleted_at IS NULL
                WHERE o.delivery_agent_id = :agentId AND o.delivered_at IS NULL
                ORDER BY o.created_at ASC
                LIMIT :limit
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("agentId", agentId);
        p.addValue("limit", limit);
        return jdbc.query(
                sql,
                p,
                (rs, rn) ->
                        new AdminOrderSummaryResponse(
                                rs.getObject("id", UUID.class),
                                rs.getObject("user_id", UUID.class),
                                rs.getString("phone"),
                                rs.getString("status"),
                                rs.getBigDecimal("total_amount"),
                                rs.getTimestamp("created_at").toInstant(),
                                rs.getObject("delivery_agent_id", UUID.class),
                                instantOrNull(rs.getTimestamp("delivered_at")),
                                rs.getString("delivery_address_snapshot"),
                                rs.getString("payment_status"),
                                instantOrNull(rs.getTimestamp("paid_at")),
                                rs.getString("customer_note")));
    }

    public List<AdminOrderSummaryResponse> listAvailableOrdersForDelivery(int limit) {
        String sql =
                """
                SELECT o.id, o.user_id, u.phone, o.status::text, o.total_amount, o.created_at,
                       o.delivery_agent_id, o.delivered_at, o.delivery_address_snapshot,
                       o.payment_status::text, o.paid_at, o.customer_note
                FROM orders o
                JOIN users u ON u.id = o.user_id AND u.deleted_at IS NULL
                WHERE o.delivery_agent_id IS NULL 
                  AND o.status IN (CAST('preparing' AS order_status), CAST('ready' AS order_status))
                ORDER BY o.created_at ASC
                LIMIT :limit
                """;
        return jdbc.query(
                sql,
                Map.of("limit", limit),
                (rs, rn) ->
                        new AdminOrderSummaryResponse(
                                rs.getObject("id", UUID.class),
                                rs.getObject("user_id", UUID.class),
                                rs.getString("phone"),
                                rs.getString("status"),
                                rs.getBigDecimal("total_amount"),
                                rs.getTimestamp("created_at").toInstant(),
                                rs.getObject("delivery_agent_id", UUID.class),
                                instantOrNull(rs.getTimestamp("delivered_at")),
                                rs.getString("delivery_address_snapshot"),
                                rs.getString("payment_status"),
                                instantOrNull(rs.getTimestamp("paid_at")),
                                rs.getString("customer_note")));
    }

    public Optional<AdminOrderDetailResponse> findOrderByIdForAdmin(UUID orderId) {
        String orderSql =
                """
                SELECT o.id, o.user_id, u.phone, o.status::text, o.total_amount, o.created_at,
                       o.delivery_agent_id, o.delivered_at, o.delivery_address_snapshot,
                       o.payment_status::text, o.paid_at, o.customer_note
                FROM orders o
                JOIN users u ON u.id = o.user_id AND u.deleted_at IS NULL
                WHERE o.id = :orderId
                """;
        List<AdminOrderHead> heads =
                jdbc.query(
                        orderSql,
                        Map.of("orderId", orderId),
                        (rs, rn) ->
                                new AdminOrderHead(
                                        rs.getObject("id", UUID.class),
                                        rs.getObject("user_id", UUID.class),
                                        rs.getString("phone"),
                                        rs.getString("status"),
                                        rs.getBigDecimal("total_amount"),
                                        rs.getTimestamp("created_at").toInstant(),
                                        rs.getObject("delivery_agent_id", UUID.class),
                                        instantOrNull(rs.getTimestamp("delivered_at")),
                                        rs.getString("delivery_address_snapshot"),
                                        rs.getString("payment_status"),
                                        instantOrNull(rs.getTimestamp("paid_at")),
                                        rs.getString("customer_note")));
        if (heads.isEmpty()) {
            return Optional.empty();
        }
        AdminOrderHead h = heads.getFirst();
        String linesSql =
                """
                SELECT id, menu_item_id, item_name, quantity, unit_price, line_total
                FROM order_items
                WHERE order_id = :orderId
                ORDER BY created_at ASC
                """;
        List<OrderLineResponse> lines =
                jdbc.query(
                        linesSql,
                        Map.of("orderId", orderId),
                        (rs, rn) ->
                                new OrderLineResponse(
                                        rs.getObject("id", UUID.class),
                                        rs.getObject("menu_item_id", UUID.class),
                                        rs.getString("item_name"),
                                        rs.getInt("quantity"),
                                        rs.getBigDecimal("unit_price"),
                                        rs.getBigDecimal("line_total")));
        return Optional.of(
                new AdminOrderDetailResponse(
                        h.id(),
                        h.userId(),
                        h.phone(),
                        h.status(),
                        lines,
                        h.total(),
                        h.createdAt(),
                        h.deliveryAgentId(),
                        h.deliveredAt(),
                        h.deliveryAddressSnapshot(),
                        h.paymentStatus(),
                        h.paidAt(),
                        h.customerNote()));
    }

    public int assignDeliveryAgent(UUID orderId, UUID deliveryAgentId) {
        return jdbc.update(
                """
                UPDATE orders
                SET delivery_agent_id = :agentId,
                    status = CAST('out_for_delivery' AS order_status),
                    updated_at = NOW()
                WHERE id = :orderId
                  AND delivered_at IS NULL
                  AND delivery_agent_id IS NULL
                  AND status IN (CAST('placed' AS order_status), CAST('confirmed' AS order_status))
                """,
                Map.of("orderId", orderId, "agentId", deliveryAgentId));
    }

    public int markDeliveredByAgent(UUID orderId, UUID agentId) {
        return jdbc.update(
                """
                UPDATE orders
                SET status = CAST('delivered' AS order_status),
                    delivered_at = NOW(),
                    updated_at = NOW()
                WHERE id = :orderId
                  AND delivery_agent_id = :agentId
                  AND delivered_at IS NULL
                """,
                Map.of("orderId", orderId, "agentId", agentId));
    }

    public int assignDeliveryToSelf(UUID orderId, UUID agentId) {
        return jdbc.update(
                """
                UPDATE orders
                SET delivery_agent_id = :agentId,
                    status = CAST('out_for_delivery' AS order_status),
                    updated_at = NOW()
                WHERE id = :orderId
                  AND delivery_agent_id IS NULL
                  AND status IN (CAST('preparing' AS order_status), CAST('ready' AS order_status))
                """,
                Map.of("orderId", orderId, "agentId", agentId));
    }

    public int updateOrderStatus(UUID orderId, String status) {
        return jdbc.update(
                """
                UPDATE orders SET status = CAST(:status AS order_status), updated_at = NOW()
                WHERE id = :orderId
                """,
                Map.of("status", status, "orderId", orderId));
    }

    /**
     * Customer cancel: only {@code placed} or {@code confirmed}, still {@code unpaid}, not delivered.
     *
     * @return rows updated (0 if wrong state, wrong user, or already cancelled)
     */
    public int cancelOrderForCustomer(UUID orderId, UUID userId) {
        return jdbc.update(
                """
                UPDATE orders
                SET status = CAST('cancelled' AS order_status), updated_at = NOW()
                WHERE id = :orderId
                  AND user_id = :userId
                  AND status IN (CAST('placed' AS order_status), CAST('confirmed' AS order_status))
                  AND payment_status = CAST('unpaid' AS payment_status)
                  AND delivered_at IS NULL
                """,
                Map.of("orderId", orderId, "userId", userId));
    }

    public int updatePaymentStatus(UUID orderId, String paymentStatus) {
        if ("paid".equals(paymentStatus)) {
            return jdbc.update(
                    """
                    UPDATE orders
                    SET payment_status = CAST('paid' AS payment_status),
                        paid_at = NOW(),
                        updated_at = NOW()
                    WHERE id = :orderId
                    """,
                    Map.of("orderId", orderId));
        }
        return jdbc.update(
                """
                UPDATE orders
                SET payment_status = CAST('unpaid' AS payment_status),
                    paid_at = NULL,
                    updated_at = NOW()
                WHERE id = :orderId
                """,
                Map.of("orderId", orderId));
    }

    public Optional<RazorpayOrderContext> findForRazorpayCheckout(UUID orderId, UUID userId) {
        String sql =
                """
                SELECT id, status::text, payment_status::text, total_amount, razorpay_order_id
                FROM orders
                WHERE id = :orderId AND user_id = :userId
                """;
        List<RazorpayOrderContext> rows =
                jdbc.query(
                        sql,
                        Map.of("orderId", orderId, "userId", userId),
                        (rs, rn) ->
                                new RazorpayOrderContext(
                                        rs.getObject("id", UUID.class),
                                        rs.getString("status"),
                                        rs.getString("payment_status"),
                                        rs.getBigDecimal("total_amount"),
                                        rs.getString("razorpay_order_id")));
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    public int attachRazorpayOrderId(UUID orderId, UUID userId, String razorpayOrderId) {
        return jdbc.update(
                """
                UPDATE orders
                SET razorpay_order_id = :rpOrderId, updated_at = NOW()
                WHERE id = :orderId AND user_id = :userId
                  AND payment_status = CAST('unpaid' AS payment_status)
                  AND razorpay_order_id IS NULL
                """,
                Map.of("orderId", orderId, "userId", userId, "rpOrderId", razorpayOrderId));
    }

    public Optional<UUID> findFillosOrderIdByRazorpayOrderId(String razorpayOrderId) {
        String sql = "SELECT id FROM orders WHERE razorpay_order_id = :rp LIMIT 1";
        List<UUID> rows =
                jdbc.query(sql, Map.of("rp", razorpayOrderId), (rs, rn) -> rs.getObject("id", UUID.class));
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
    }

    /**
     * Marks paid when still unpaid and Razorpay order id matches (idempotent for duplicate webhooks).
     *
     * @return rows updated (0 if already paid or id mismatch)
     */
    public int markPaidFromRazorpayWebhook(UUID fillosOrderId, String razorpayOrderId, String razorpayPaymentId) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", fillosOrderId);
        p.addValue("rpOrder", razorpayOrderId);
        p.addValue("rpPay", razorpayPaymentId == null || razorpayPaymentId.isBlank() ? null : razorpayPaymentId);
        return jdbc.update(
                """
                UPDATE orders
                SET payment_status = CAST('paid' AS payment_status),
                    paid_at = COALESCE(paid_at, NOW()),
                    razorpay_payment_id = COALESCE(:rpPay, razorpay_payment_id),
                    updated_at = NOW()
                WHERE id = :id
                  AND razorpay_order_id = :rpOrder
                  AND payment_status = CAST('unpaid' AS payment_status)
                """,
                p);
    }

    public List<AdminOrderSummaryResponse> listPendingOrdersForRestaurant(int limit) {
        String sql =
                """
                SELECT o.id, o.user_id, u.phone, o.status::text, o.total_amount, o.created_at,
                       o.delivery_agent_id, o.delivered_at, o.delivery_address_snapshot,
                       o.payment_status::text, o.paid_at, o.customer_note
                FROM orders o
                JOIN users u ON u.id = o.user_id AND u.deleted_at IS NULL
                WHERE o.status = CAST('placed' AS order_status) OR o.status = CAST('confirmed' AS order_status)
                ORDER BY o.created_at ASC
                LIMIT :limit
                """;
        return jdbc.query(
                sql,
                Map.of("limit", limit),
                (rs, rn) ->
                        new AdminOrderSummaryResponse(
                                rs.getObject("id", UUID.class),
                                rs.getObject("user_id", UUID.class),
                                rs.getString("phone"),
                                rs.getString("status"),
                                rs.getBigDecimal("total_amount"),
                                rs.getTimestamp("created_at").toInstant(),
                                rs.getObject("delivery_agent_id", UUID.class),
                                instantOrNull(rs.getTimestamp("delivered_at")),
                                rs.getString("delivery_address_snapshot"),
                                rs.getString("payment_status"),
                                instantOrNull(rs.getTimestamp("paid_at")),
                                rs.getString("customer_note")));
    }

    public int acceptOrderByRestaurant(UUID orderId, UUID restaurantId) {
        return jdbc.update(
                """
                UPDATE orders
                SET restaurant_id = :restaurantId,
                    status = CAST('preparing' AS order_status),
                    updated_at = NOW()
                WHERE id = :orderId
                  AND restaurant_id IS NULL
                """,
                Map.of("orderId", orderId, "restaurantId", restaurantId));
    }

    public int updateDeliveryLocation(UUID orderId, BigDecimal lat, BigDecimal lng) {
        return jdbc.update(
                """
                UPDATE orders
                SET delivery_lat = :lat,
                    delivery_lng = :lng,
                    updated_at = NOW()
                WHERE id = :orderId
                """,
                Map.of("orderId", orderId, "lat", lat, "lng", lng));
    }

    public Map<String, Object> getRestaurantAnalytics(UUID restaurantId) {
        String sql =
                """
                SELECT 
                    COUNT(*) FILTER (WHERE status = CAST('delivered' AS order_status)) as delivered_count,
                    COUNT(*) FILTER (WHERE status = CAST('placed' AS order_status) OR status = CAST('confirmed' AS order_status)) as pending_count,
                    COUNT(*) FILTER (WHERE status = CAST('preparing' AS order_status) OR status = CAST('ready' AS order_status)) as active_count,
                    COALESCE(SUM(quantity), 0) as total_items_sold
                FROM orders o
                LEFT JOIN order_items oi ON oi.order_id = o.id
                WHERE o.restaurant_id = :restaurantId OR (o.restaurant_id IS NULL AND o.status = CAST('placed' AS order_status))
                """;
        return jdbc.queryForMap(sql, Map.of("restaurantId", restaurantId));
    }

    public record RazorpayOrderContext(
            UUID id, String status, String paymentStatus, BigDecimal totalAmount, String razorpayOrderId) {}

    record CartSnapshotLine(UUID menuItemId, String name, int quantity, BigDecimal unitPrice) {}

    private record OrderHead(
            UUID id,
            String status,
            BigDecimal total,
            Instant createdAt,
            String deliveryAddressSnapshot,
            String paymentStatus,
            Instant paidAt,
            String customerNote) {}

    private record AdminOrderHead(
            UUID id,
            UUID userId,
            String phone,
            String status,
            BigDecimal total,
            Instant createdAt,
            UUID deliveryAgentId,
            Instant deliveredAt,
            String deliveryAddressSnapshot,
            String paymentStatus,
            Instant paidAt,
            String customerNote) {}

    private static Instant instantOrNull(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }
}
