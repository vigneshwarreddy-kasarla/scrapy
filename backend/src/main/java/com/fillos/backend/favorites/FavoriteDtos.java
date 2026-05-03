package com.fillos.backend.favorites;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class FavoriteDtos {
    private FavoriteDtos() {}

    public record FavoriteItemResponse(
            UUID menuItemId,
            UUID categoryId,
            String name,
            String description,
            BigDecimal price,
            BigDecimal discountedPrice,
            String imageUrl,
            boolean veg,
            boolean available) {}

    public record FavoritesResponse(List<FavoriteItemResponse> items) {}

    public record FavoritesReplaceRequest(@NotNull List<UUID> menuItemIds) {}
}
