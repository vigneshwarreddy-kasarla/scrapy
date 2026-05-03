package com.fillos.backend.favorites;

import com.fillos.backend.favorites.FavoriteDtos.FavoriteItemResponse;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class FavoritesRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public FavoritesRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<FavoriteItemResponse> listFavorites(UUID userId) {
        String sql =
                """
                SELECT i.id AS menu_item_id, i.category_id, i.name, i.description, i.price, i.discounted_price,
                       i.image_url, i.is_veg, i.is_available
                FROM user_favorites f
                JOIN menu_items i ON i.id = f.menu_item_id
                WHERE f.user_id = :userId
                ORDER BY f.created_at DESC
                """;
        return jdbc.query(
                sql,
                Map.of("userId", userId),
                (rs, rn) ->
                        new FavoriteItemResponse(
                                rs.getObject("menu_item_id", UUID.class),
                                rs.getObject("category_id", UUID.class),
                                rs.getString("name"),
                                rs.getString("description"),
                                rs.getBigDecimal("price"),
                                rs.getBigDecimal("discounted_price"),
                                rs.getString("image_url"),
                                rs.getBoolean("is_veg"),
                                rs.getBoolean("is_available")));
    }

    public boolean isCustomerVisibleMenuItem(UUID menuItemId) {
        String sql =
                """
                SELECT EXISTS(
                  SELECT 1
                  FROM menu_items i
                  JOIN menu_categories c ON c.id = i.category_id
                  WHERE i.id = :menuItemId
                    AND i.is_available = TRUE
                    AND c.is_active = TRUE
                )
                """;
        Boolean ok = jdbc.queryForObject(sql, Map.of("menuItemId", menuItemId), Boolean.class);
        return Boolean.TRUE.equals(ok);
    }

    public void addFavorite(UUID userId, UUID menuItemId) {
        jdbc.update(
                """
                INSERT INTO user_favorites (user_id, menu_item_id)
                VALUES (:userId, :menuItemId)
                ON CONFLICT (user_id, menu_item_id) DO NOTHING
                """,
                Map.of("userId", userId, "menuItemId", menuItemId));
    }

    public int removeFavorite(UUID userId, UUID menuItemId) {
        return jdbc.update(
                "DELETE FROM user_favorites WHERE user_id = :userId AND menu_item_id = :menuItemId",
                Map.of("userId", userId, "menuItemId", menuItemId));
    }

    public void replaceFavorites(UUID userId, List<UUID> menuItemIds) {
        jdbc.update("DELETE FROM user_favorites WHERE user_id = :userId", Map.of("userId", userId));
        if (menuItemIds == null || menuItemIds.isEmpty()) return;

        List<UUID> uniqueIds = menuItemIds.stream().distinct().toList();
        Set<UUID> validIds = findVisibleMenuItems(uniqueIds);
        if (validIds.isEmpty()) return;

        String sql =
                """
                INSERT INTO user_favorites (user_id, menu_item_id)
                VALUES (:userId, :menuItemId)
                ON CONFLICT (user_id, menu_item_id) DO NOTHING
                """;
        for (UUID menuItemId : validIds) {
            jdbc.update(sql, Map.of("userId", userId, "menuItemId", menuItemId));
        }
    }

    public Set<UUID> findVisibleMenuItems(List<UUID> menuItemIds) {
        if (menuItemIds == null || menuItemIds.isEmpty()) return Set.of();
        String sql =
                """
                SELECT i.id
                FROM menu_items i
                JOIN menu_categories c ON c.id = i.category_id
                WHERE i.id IN (:ids)
                  AND i.is_available = TRUE
                  AND c.is_active = TRUE
                """;
        return Set.copyOf(jdbc.query(sql, Map.of("ids", menuItemIds), (rs, rn) -> rs.getObject(1, UUID.class)));
    }
}
