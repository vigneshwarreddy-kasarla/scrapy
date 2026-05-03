package com.fillos.backend.orders;

import com.fillos.backend.orders.OrderDtos.CheckoutRequest;
import com.fillos.backend.orders.OrderDtos.OrderResponse;
import com.fillos.backend.orders.OrderDtos.OrderSummaryResponse;
import com.fillos.backend.security.AppUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** Creates an order from the current user's cart (snapshot prices), then clears cart lines. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse checkout(
            @AuthenticationPrincipal AppUserDetails principal,
            @Valid @RequestBody(required = false) CheckoutRequest body) {
        return orderService.checkout(principal.getId(), body);
    }

    @GetMapping
    public List<OrderSummaryResponse> list(@AuthenticationPrincipal AppUserDetails principal) {
        return orderService.listMyOrders(principal.getId());
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("orderId") UUID orderId) {
        return orderService.getOrder(principal.getId(), orderId);
    }

    /** Cancels own order while still {@code placed} or {@code confirmed}, unpaid, and not delivered. */
    @PostMapping("/{orderId}/cancel")
    public OrderResponse cancel(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("orderId") UUID orderId) {
        return orderService.cancelMyOrder(principal.getId(), orderId);
    }
}
