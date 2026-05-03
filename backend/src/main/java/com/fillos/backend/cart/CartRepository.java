package com.fillos.backend.cart;

import com.fillos.backend.cart.CartDtos.CartLineResponse;
import com.fillos.backend.cart.CartDtos.CartResponse;
import com.fillos.backend.cart.CartDtos.CartSyncLine;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CartRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public CartRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<CartLineRow> LINE_ROW =
            (rs, rowNum) ->
                    new CartLineRow(
                            rs.getObject("line_id", UUID.class),
                            rs.getObject("menu_item_id", UUID.class),
                            rs.getString("name"),
                            rs.getInt("quantity"),
                            rs.getBigDecimal("unit_price"));

    public UUID ensureCart(UUID userId) {
        jdbc.update(
                "INSERT INTO carts (user_id) VALUES (:userId) ON CONFLICT (user_id) DO NOTHING",
                Map.of("userId", userId));
        return jdbc.queryForObject(
                "SELECT id FROM carts WHERE user_id = :userId", Map.of("userId", userId), UUID.class);
    }

    public Optional<UUID> findMenuItemForCart(UUID menuItemId) {
        String sql =
                """
                SELECT i.id
                FROM menu_items i
                JOIN menu_categories c ON c.id = i.category_id
                WHERE i.id = :id AND i.is_available = TRUE AND c.is_active = TRUE
                """;
        List<UUID> ids = jdbc.query(sql, Map.of("id", menuItemId), (rs, rn) -> rs.getObject(1, UUID.class));
        return ids.isEmpty() ? Optional.empty() : Optional.of(ids.getFirst());
    }

    public void addOrMergeLine(UUID cartId, UUID menuItemId, int quantity) {
        UUID lineId = UUID.randomUUID();
        String sql =
                """
                INSERT INTO cart_items (id, cart_id, menu_item_id, quantity)
                VALUES (:id, :cartId, :menuItemId, :qty)
                ON CONFLICT (cart_id, menu_item_id)
                DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", lineId);
        p.addValue("cartId", cartId);
        p.addValue("menuItemId", menuItemId);
        p.addValue("qty", quantity);
        jdbc.update(sql, p);
        jdbc.update("UPDATE carts SET updated_at = NOW() WHERE id = :id", Map.of("id", cartId));
    }

    public CartResponse loadCart(UUID userId) {
        UUID cartId = ensureCart(userId);
        String sql =
                """
                SELECT ci.id AS line_id, ci.menu_item_id, mi.name, ci.quantity, mi.price AS unit_price
                FROM cart_items ci
                JOIN menu_items mi ON mi.id = ci.menu_item_id
                WHERE ci.cart_id = :cartId
                ORDER BY ci.created_at ASC
                """;
        List<CartLineRow> rows = jdbc.query(sql, Map.of("cartId", cartId), LINE_ROW);
        BigDecimal sum = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        List<CartLineResponse> lines = new ArrayList<>();
        for (CartLineRow r : rows) {
            BigDecimal lineTotal =
                    r.unitPrice()
                            .multiply(BigDecimal.valueOf(r.quantity()))
                            .setScale(2, RoundingMode.HALF_UP);
            sum = sum.add(lineTotal);
            lines.add(
                    new CartLineResponse(
                            r.lineId(), r.menuItemId(), r.name(), r.quantity(), r.unitPrice(), lineTotal));
        }
        return new CartResponse(cartId, lines, sum);
    }

    private record CartLineRow(UUID lineId, UUID menuItemId, String name, int quantity, BigDecimal unitPrice) {}

    public int updateLineQuantity(UUID userId, UUID lineId, int quantity) {
        UUID cartId = ensureCart(userId);
        return jdbc.update(
                """
                UPDATE cart_items SET quantity = :qty
                WHERE id = :lineId AND cart_id = :cartId
                """,
                Map.of("qty", quantity, "lineId", lineId, "cartId", cartId));
    }

    public int deleteLine(UUID userId, UUID lineId) {
        UUID cartId = ensureCart(userId);
        int n =
                jdbc.update(
                        "DELETE FROM cart_items WHERE id = :lineId AND cart_id = :cartId",
                        Map.of("lineId", lineId, "cartId", cartId));
        if (n > 0) {
            jdbc.update("UPDATE carts SET updated_at = NOW() WHERE id = :id", Map.of("id", cartId));
        }
        return n;
    }

    public void clear(UUID userId) {
        UUID cartId = ensureCart(userId);
        jdbc.update("DELETE FROM cart_items WHERE cart_id = :cartId", Map.of("cartId", cartId));
        jdbc.update("UPDATE carts SET updated_at = NOW() WHERE id = :id", Map.of("id", cartId));
    }

    public void mergeLines(UUID userId, List<CartSyncLine> lines) {
        UUID cartId = ensureCart(userId);
        if (lines == null || lines.isEmpty()) return;
        Map<UUID, Integer> normalized = normalize(lines);
        for (Map.Entry<UUID, Integer> e : normalized.entrySet()) {
            addOrMergeLine(cartId, e.getKey(), e.getValue());
        }
    }

    public void replaceLines(UUID userId, List<CartSyncLine> lines) {
        UUID cartId = ensureCart(userId);
        jdbc.update("DELETE FROM cart_items WHERE cart_id = :cartId", Map.of("cartId", cartId));
        if (lines == null || lines.isEmpty()) return;
        Map<UUID, Integer> normalized = normalize(lines);
        String sql =
                """
                INSERT INTO cart_items (id, cart_id, menu_item_id, quantity)
                VALUES (:id, :cartId, :menuItemId, :qty)
                """;
        for (Map.Entry<UUID, Integer> e : normalized.entrySet()) {
            jdbc.update(
                    sql,
                    Map.of(
                            "id", UUID.randomUUID(),
                            "cartId", cartId,
                            "menuItemId", e.getKey(),
                            "qty", e.getValue()));
        }
        jdbc.update("UPDATE carts SET updated_at = NOW() WHERE id = :id", Map.of("id", cartId));
    }

    private static Map<UUID, Integer> normalize(List<CartSyncLine> lines) {
        Map<UUID, Integer> normalized = new LinkedHashMap<>();
        for (CartSyncLine line : lines) {
            if (line == null || line.menuItemId() == null || line.quantity() < 1) continue;
            normalized.merge(line.menuItemId(), line.quantity(), Integer::sum);
        }
        return normalized;
    }
}
