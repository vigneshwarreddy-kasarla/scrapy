package com.fillos.backend.orders;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class OrderDtos {
    private OrderDtos() {}

    public record PatchOrderStatusRequest(
            @NotBlank
                    @Pattern(
                            regexp = "^(placed|confirmed|cancelled|out_for_delivery|delivered)$",
                            message =
                                    "status must be placed, confirmed, cancelled, out_for_delivery, or delivered")
                    String status) {}

    public record AssignDeliveryRequest(@NotNull UUID deliveryAgentId) {}

    public record PatchPaymentRequest(
            @NotBlank
                    @Pattern(regexp = "^(unpaid|paid)$", message = "paymentStatus must be unpaid or paid")
                    String paymentStatus) {}

    /**
     * Optional body for {@code POST /api/v1/orders}; when {@code deliveryAddressId} is set, must belong to the
     * caller. {@code customerNote} is stored on the order for kitchen / rider (optional, max 500 chars).
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CheckoutRequest(UUID deliveryAddressId, @Size(max = 500) String customerNote) {}

    public record OrderLineResponse(
            UUID lineId,
            UUID menuItemId,
            String itemName,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {}

    public record OrderResponse(
            UUID orderId,
            String status,
            List<OrderLineResponse> lines,
            BigDecimal total,
            Instant createdAt,
            String deliveryAddressSnapshot,
            String paymentStatus,
            Instant paidAt,
            String customerNote) {}

    public record OrderSummaryResponse(
            UUID orderId,
            String status,
            BigDecimal total,
            Instant createdAt,
            String paymentStatus,
            Instant paidAt,
            String customerNote) {}

    public record AdminOrderSummaryResponse(
            UUID orderId,
            UUID userId,
            String customerPhone,
            String status,
            BigDecimal total,
            Instant createdAt,
            UUID deliveryAgentId,
            Instant deliveredAt,
            String deliveryAddressSnapshot,
            String paymentStatus,
            Instant paidAt,
            String customerNote) {}

    public record AdminOrderDetailResponse(
            UUID orderId,
            UUID userId,
            String customerPhone,
            String status,
            List<OrderLineResponse> lines,
            BigDecimal total,
            Instant createdAt,
            UUID deliveryAgentId,
            Instant deliveredAt,
            String deliveryAddressSnapshot,
            String paymentStatus,
            Instant paidAt,
            String customerNote) {}
}
