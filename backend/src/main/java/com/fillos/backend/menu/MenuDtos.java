package com.fillos.backend.menu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class MenuDtos {
    private MenuDtos() {}

    public record MenuCategoryResponse(
            UUID id, String name, int displayOrder, String imageUrl, boolean active) {}

    public record MenuItemResponse(
            UUID id,
            UUID categoryId,
            String name,
            String description,
            BigDecimal price,
            BigDecimal discountedPrice,
            String imageUrl,
            boolean veg,
            boolean available,
            int preparationTime,
            Integer calories,
            List<String> tags,
            List<String> ingredients,
            List<String> allergens,
            Integer weightGrams,
            int displayOrder) {}

    public record CreateCategoryRequest(
            @NotBlank String name,
            @PositiveOrZero int displayOrder,
            String imageUrl,
            boolean active) {}

    public record UpdateCategoryRequest(
            @NotBlank String name,
            @PositiveOrZero int displayOrder,
            String imageUrl,
            boolean active) {}

    public record CreateMenuItemRequest(
            @NotNull UUID categoryId,
            @NotBlank String name,
            String description,
            @NotNull BigDecimal price,
            BigDecimal discountedPrice,
            String imageUrl,
            boolean veg,
            boolean available,
            @PositiveOrZero int preparationTime,
            Integer calories,
            List<String> tags,
            List<String> ingredients,
            List<String> allergens,
            @PositiveOrZero Integer weightGrams,
            @PositiveOrZero int displayOrder) {}

    public record UpdateMenuItemRequest(
            @NotNull UUID categoryId,
            @NotBlank String name,
            String description,
            @NotNull BigDecimal price,
            BigDecimal discountedPrice,
            String imageUrl,
            boolean veg,
            boolean available,
            @PositiveOrZero int preparationTime,
            Integer calories,
            List<String> tags,
            List<String> ingredients,
            List<String> allergens,
            @PositiveOrZero Integer weightGrams,
            @PositiveOrZero int displayOrder) {}

    public record PatchItemAvailabilityRequest(boolean available) {}
}
