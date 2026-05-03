package com.fillos.backend.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class CartDtos {
    private CartDtos() {}

    public record AddCartLineRequest(@NotNull UUID menuItemId, @Min(1) int quantity) {}

    public record UpdateCartLineRequest(@Min(1) int quantity) {}

    public record CartSyncLine(@NotNull UUID menuItemId, @Min(1) int quantity) {}

    public record CartSyncRequest(@NotNull List<CartSyncLine> lines) {}

    public record CartLineResponse(
            UUID lineId,
            UUID menuItemId,
            String name,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {}

    public record CartResponse(UUID cartId, List<CartLineResponse> lines, BigDecimal subtotal) {}
}
