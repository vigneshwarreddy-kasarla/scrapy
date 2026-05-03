package com.fillos.backend.orders;

import com.fillos.backend.orders.OrderDtos.AdminOrderDetailResponse;
import com.fillos.backend.orders.OrderDtos.AdminOrderSummaryResponse;
import com.fillos.backend.orders.OrderDtos.AssignDeliveryRequest;
import com.fillos.backend.orders.OrderDtos.PatchOrderStatusRequest;
import com.fillos.backend.orders.OrderDtos.PatchPaymentRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {
    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<AdminOrderSummaryResponse> list(
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "offset", defaultValue = "0") long offset) {
        int safeLimit = Math.min(100, Math.max(1, limit));
        long safeOffset = Math.max(0, offset);
        return orderService.listOrdersAdmin(safeLimit, safeOffset);
    }

    @GetMapping("/{orderId}")
    public AdminOrderDetailResponse get(@PathVariable("orderId") UUID orderId) {
        return orderService.getOrderAdmin(orderId);
    }

    @PatchMapping("/{orderId}/status")
    public AdminOrderDetailResponse patchStatus(
            @PathVariable("orderId") UUID orderId, @Valid @RequestBody PatchOrderStatusRequest body) {
        return orderService.patchOrderStatusAdmin(orderId, body);
    }

    @PatchMapping("/{orderId}/payment")
    public AdminOrderDetailResponse patchPayment(
            @PathVariable("orderId") UUID orderId, @Valid @RequestBody PatchPaymentRequest body) {
        return orderService.patchPaymentAdmin(orderId, body);
    }

    @PatchMapping("/{orderId}/assign")
    public AdminOrderDetailResponse assignDelivery(
            @PathVariable("orderId") UUID orderId, @Valid @RequestBody AssignDeliveryRequest body) {
        return orderService.assignDeliveryAdmin(orderId, body);
    }
}
