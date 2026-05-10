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
    private final com.fillos.backend.menu.MenuRepository menu;

    public RestaurantController(OrderService orders, com.fillos.backend.menu.MenuRepository menu) {
        this.orders = orders;
        this.menu = menu;
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

    @PostMapping("/orders/{orderId}/ready")
    public void markOrderReady(
            @AuthenticationPrincipal AppUserDetails user,
            @PathVariable UUID orderId) {
        orders.patchOrderStatusAdmin(orderId, new OrderDtos.PatchOrderStatusRequest("ready"));
    }

    @GetMapping("/analytics")
    public java.util.Map<String, Object> getAnalytics(@AuthenticationPrincipal AppUserDetails user) {
        return orders.getRestaurantAnalytics(user.getId());
    }

    @GetMapping("/menu")
    public List<com.fillos.backend.menu.MenuDtos.MenuItemResponse> getMyMenu(@AuthenticationPrincipal AppUserDetails user) {
        return menu.listItemsByRestaurant(user.getId());
    }
}
