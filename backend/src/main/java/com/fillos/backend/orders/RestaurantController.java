package com.fillos.backend.orders;

import com.fillos.backend.orders.OrderDtos.AdminOrderSummaryResponse;
import com.fillos.backend.security.AppUserDetails;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/restaurant")
public class RestaurantController {

    private final OrderService orders;

    public RestaurantController(OrderService orders) {
        this.orders = orders;
    }

    @GetMapping("/orders/pending")
    public List<AdminOrderSummaryResponse> listPendingOrders() {
        return orders.listPendingOrdersForRestaurant();
    }

    @PostMapping("/orders/{orderId}/accept")
    public void acceptOrder(
            @AuthenticationPrincipal AppUserDetails user,
            @PathVariable UUID orderId) {
        orders.acceptOrderByRestaurant(user.getId(), orderId);
    }
}
