package com.fillos.backend.orders;

import com.fillos.backend.orders.OrderDtos.AdminOrderSummaryResponse;
import com.fillos.backend.security.AppUserDetails;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/delivery")
public class DeliveryController {
    private final OrderService orderService;

    public DeliveryController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** Active jobs: assigned to this agent and not yet delivered. */
    @GetMapping("/orders")
    public List<AdminOrderSummaryResponse> myOrders(@AuthenticationPrincipal AppUserDetails principal) {
        return orderService.listOrdersForAgent(principal.getId());
    }

    @GetMapping("/orders/available")
    public List<AdminOrderSummaryResponse> availableOrders() {
        return orderService.listAvailableOrdersForDelivery();
    }

    @PostMapping("/orders/{orderId}/take")
    public void takeOrder(@AuthenticationPrincipal AppUserDetails principal, @PathVariable UUID orderId) {
        orderService.takeOrderByAgent(principal.getId(), orderId);
    }

    @PostMapping("/orders/{orderId}/complete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void complete(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("orderId") UUID orderId) {
        orderService.completeDelivery(principal.getId(), orderId);
    }

    @PostMapping("/orders/{orderId}/location")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateLocation(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable("orderId") UUID orderId,
            @org.springframework.web.bind.annotation.RequestBody LocationUpdateRequest body) {
        orderService.updateDeliveryLocation(principal.getId(), orderId, body.lat(), body.lng());
    }

    public record LocationUpdateRequest(java.math.BigDecimal lat, java.math.BigDecimal lng) {}
}
