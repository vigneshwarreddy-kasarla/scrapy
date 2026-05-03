package com.fillos.backend.menu;

import com.fillos.backend.menu.MenuDtos.CreateCategoryRequest;
import com.fillos.backend.menu.MenuDtos.CreateMenuItemRequest;
import com.fillos.backend.menu.MenuDtos.MenuCategoryResponse;
import com.fillos.backend.menu.MenuDtos.MenuItemResponse;
import com.fillos.backend.menu.MenuDtos.UpdateCategoryRequest;
import com.fillos.backend.menu.MenuDtos.UpdateMenuItemRequest;
import java.sql.Array;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlTypeValue;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MenuRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public MenuRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static SqlTypeValue sqlTextArray(List<String> values) {
        List<String> safe = values == null ? List.of() : values;
        return (ps, paramIndex, sqlType, typeName) -> {
            Connection c = ps.getConnection();
            String[] arr = safe.isEmpty() ? new String[0] : safe.toArray(String[]::new);
            Array a = c.createArrayOf("text", arr);
            ps.setArray(paramIndex, a);
        };
    }

    private static List<String> readTextArray(ResultSet rs, String column) throws SQLException {
        Array arr = rs.getArray(column);
        if (arr == null) {
            return Collections.emptyList();
        }
        Object[] obj = (Object[]) arr.getArray();
        return Arrays.stream(obj).map(Object::toString).toList();
    }

    private static final RowMapper<MenuCategoryResponse> CATEGORY_ROW =
            (rs, rowNum) ->
                    new MenuCategoryResponse(
                            rs.getObject("id", UUID.class),
                            rs.getString("name"),
                            rs.getInt("display_order"),
                            rs.getString("image_url"),
                            rs.getBoolean("is_active"));

    private static final RowMapper<MenuItemResponse> ITEM_ROW =
            (rs, rowNum) ->
                    new MenuItemResponse(
                            rs.getObject("id", UUID.class),
                            rs.getObject("category_id", UUID.class),
                            rs.getString("name"),
                            rs.getString("description"),
                            rs.getBigDecimal("price"),
                            rs.getBigDecimal("discounted_price"),
                            rs.getString("image_url"),
                            rs.getBoolean("is_veg"),
                            rs.getBoolean("is_available"),
                            rs.getInt("preparation_time"),
                            (Integer) rs.getObject("calories"),
                            readTextArray(rs, "tags"),
                            readTextArray(rs, "ingredients"),
                            readTextArray(rs, "allergens"),
                            (Integer) rs.getObject("weight_grams"),
                            rs.getInt("display_order"));

    public List<MenuCategoryResponse> listActiveCategoriesForCustomer() {
        String sql =
                """
                SELECT id, name, display_order, image_url, is_active
                FROM menu_categories
                WHERE is_active = TRUE
                ORDER BY display_order ASC, name ASC
                """;
        return jdbc.query(sql, CATEGORY_ROW);
    }

    public List<MenuItemResponse> listAvailableItemsForCustomer(UUID categoryId) {
        String sql =
                """
                SELECT i.id, i.category_id, i.name, i.description, i.price, i.discounted_price,
                       i.image_url, i.is_veg, i.is_available, i.preparation_time, i.calories, i.tags,
                       i.ingredients, i.allergens, i.weight_grams, i.display_order
                FROM menu_items i
                JOIN menu_categories c ON c.id = i.category_id
                WHERE i.category_id = :categoryId
                  AND i.is_available = TRUE
                  AND c.is_active = TRUE
                ORDER BY i.display_order ASC, i.name ASC
                """;
        return jdbc.query(sql, Map.of("categoryId", categoryId), ITEM_ROW);
    }

    public MenuItemResponse findAvailableItemForCustomer(UUID itemId) {
        String sql =
                """
                SELECT i.id, i.category_id, i.name, i.description, i.price, i.discounted_price,
                       i.image_url, i.is_veg, i.is_available, i.preparation_time, i.calories, i.tags,
                       i.ingredients, i.allergens, i.weight_grams, i.display_order
                FROM menu_items i
                JOIN menu_categories c ON c.id = i.category_id
                WHERE i.id = :id AND i.is_available = TRUE AND c.is_active = TRUE
                """;
        List<MenuItemResponse> rows = jdbc.query(sql, Map.of("id", itemId), ITEM_ROW);
        return rows.isEmpty() ? null : rows.getFirst();
    }

    public List<MenuCategoryResponse> listAllCategoriesForAdmin() {
        String sql =
                """
                SELECT id, name, display_order, image_url, is_active
                FROM menu_categories
                ORDER BY display_order ASC, name ASC
                """;
        return jdbc.query(sql, CATEGORY_ROW);
    }

    public List<MenuItemResponse> listAllItemsForAdmin(UUID categoryId) {
        String sql =
                """
                SELECT id, category_id, name, description, price, discounted_price,
                       image_url, is_veg, is_available, preparation_time, calories, tags,
                       ingredients, allergens, weight_grams, display_order
                FROM menu_items
                WHERE category_id = :categoryId
                ORDER BY display_order ASC, name ASC
                """;
        return jdbc.query(sql, Map.of("categoryId", categoryId), ITEM_ROW);
    }

    public UUID insertCategory(CreateCategoryRequest req) {
        UUID id = UUID.randomUUID();
        String sql =
                """
                INSERT INTO menu_categories (id, name, display_order, is_active, image_url)
                VALUES (:id, :name, :displayOrder, :active, :imageUrl)
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", id);
        p.addValue("name", req.name());
        p.addValue("displayOrder", req.displayOrder());
        p.addValue("active", req.active());
        p.addValue("imageUrl", req.imageUrl());
        jdbc.update(sql, p);
        return id;
    }

    public int updateCategory(UUID id, UpdateCategoryRequest req) {
        String sql =
                """
                UPDATE menu_categories
                SET name = :name, display_order = :displayOrder, is_active = :active, image_url = :imageUrl
                WHERE id = :id
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", id);
        p.addValue("name", req.name());
        p.addValue("displayOrder", req.displayOrder());
        p.addValue("active", req.active());
        p.addValue("imageUrl", req.imageUrl());
        return jdbc.update(sql, p);
    }

    public int deleteItemsInCategory(UUID categoryId) {
        return jdbc.update(
                "DELETE FROM menu_items WHERE category_id = :categoryId", Map.of("categoryId", categoryId));
    }

    public int deleteCategory(UUID id) {
        return jdbc.update("DELETE FROM menu_categories WHERE id = :id", Map.of("id", id));
    }

    public boolean categoryExists(UUID id) {
        Integer n =
                jdbc.queryForObject(
                        "SELECT COUNT(*)::int FROM menu_categories WHERE id = :id", Map.of("id", id), Integer.class);
        return n != null && n > 0;
    }

    public boolean categoryExistsAndActiveForCustomer(UUID id) {
        Integer n =
                jdbc.queryForObject(
                        "SELECT COUNT(*)::int FROM menu_categories WHERE id = :id AND is_active = TRUE",
                        Map.of("id", id),
                        Integer.class);
        return n != null && n > 0;
    }

    public UUID insertItem(CreateMenuItemRequest req) {
        UUID id = UUID.randomUUID();
        String sql =
                """
                INSERT INTO menu_items (
                  id, category_id, name, description, price, discounted_price, image_url,
                  is_veg, is_available, preparation_time, calories, tags, ingredients, allergens,
                  weight_grams, display_order
                ) VALUES (
                  :id, :categoryId, :name, :description, :price, :discountedPrice, :imageUrl,
                  :veg, :available, :prepTime, :calories, :tags, :ingredients, :allergens,
                  :weightGrams, :displayOrder
                )
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", id);
        p.addValue("categoryId", req.categoryId());
        p.addValue("name", req.name());
        p.addValue("description", req.description());
        p.addValue("price", req.price());
        p.addValue("discountedPrice", req.discountedPrice());
        p.addValue("imageUrl", req.imageUrl());
        p.addValue("veg", req.veg());
        p.addValue("available", req.available());
        p.addValue("prepTime", req.preparationTime());
        p.addValue("calories", req.calories());
        p.addValue("tags", sqlTextArray(req.tags()));
        p.addValue("ingredients", sqlTextArray(req.ingredients()));
        p.addValue("allergens", sqlTextArray(req.allergens()));
        p.addValue("weightGrams", req.weightGrams());
        p.addValue("displayOrder", req.displayOrder());
        jdbc.update(sql, p);
        return id;
    }

    public int updateItem(UUID id, UpdateMenuItemRequest req) {
        String sql =
                """
                UPDATE menu_items SET
                  category_id = :categoryId,
                  name = :name,
                  description = :description,
                  price = :price,
                  discounted_price = :discountedPrice,
                  image_url = :imageUrl,
                  is_veg = :veg,
                  is_available = :available,
                  preparation_time = :prepTime,
                  calories = :calories,
                  tags = :tags,
                  ingredients = :ingredients,
                  allergens = :allergens,
                  weight_grams = :weightGrams,
                  display_order = :displayOrder
                WHERE id = :id
                """;
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("id", id);
        p.addValue("categoryId", req.categoryId());
        p.addValue("name", req.name());
        p.addValue("description", req.description());
        p.addValue("price", req.price());
        p.addValue("discountedPrice", req.discountedPrice());
        p.addValue("imageUrl", req.imageUrl());
        p.addValue("veg", req.veg());
        p.addValue("available", req.available());
        p.addValue("prepTime", req.preparationTime());
        p.addValue("calories", req.calories());
        p.addValue("tags", sqlTextArray(req.tags()));
        p.addValue("ingredients", sqlTextArray(req.ingredients()));
        p.addValue("allergens", sqlTextArray(req.allergens()));
        p.addValue("weightGrams", req.weightGrams());
        p.addValue("displayOrder", req.displayOrder());
        return jdbc.update(sql, p);
    }

    public int patchItemAvailability(UUID id, boolean available) {
        return jdbc.update(
                "UPDATE menu_items SET is_available = :available WHERE id = :id",
                Map.of("available", available, "id", id));
    }

    public int deleteItem(UUID id) {
        return jdbc.update("DELETE FROM menu_items WHERE id = :id", Map.of("id", id));
    }

    public MenuItemResponse findItemForAdmin(UUID id) {
        String sql =
                """
                SELECT id, category_id, name, description, price, discounted_price,
                       image_url, is_veg, is_available, preparation_time, calories, tags,
                       ingredients, allergens, weight_grams, display_order
                FROM menu_items WHERE id = :id
                """;
        List<MenuItemResponse> rows = jdbc.query(sql, Map.of("id", id), ITEM_ROW);
        return rows.isEmpty() ? null : rows.getFirst();
    }

}
