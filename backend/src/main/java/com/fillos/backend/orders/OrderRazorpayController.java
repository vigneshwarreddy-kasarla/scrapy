package com.fillos.backend.orders;

import com.fillos.backend.payments.RazorpayDtos.RazorpayCheckoutResponse;
import com.fillos.backend.payments.RazorpayPaymentService;
import com.fillos.backend.security.AppUserDetails;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import com.fillos.backend.orders.OrderRepository;
import com.fillos.backend.config.NotificationService;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderRazorpayController {
    private final RazorpayPaymentService razorpayPayments;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    public OrderRazorpayController(RazorpayPaymentService razorpayPayments, OrderRepository orderRepository, NotificationService notificationService) {
        this.razorpayPayments = razorpayPayments;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    /** Creates a Razorpay Order (or returns an existing one) for Checkout on the client. */
    @PostMapping("/{orderId}/payments/razorpay/order")
    public RazorpayCheckoutResponse createRazorpayOrder(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("orderId") UUID orderId) {
        return razorpayPayments.createOrReuseRazorpayOrder(principal.getId(), orderId);
    }

    /** Bypasses Razorpay for testing purposes. Marks order as paid and placed, and notifies restaurants. */
    @PostMapping("/{orderId}/payments/bypass")
    public ResponseEntity<?> bypassPayment(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("orderId") UUID orderId) {
        // 1. Mark as paid
        orderRepository.updatePaymentStatus(orderId, "paid");
        // 2. Mark as placed
        orderRepository.updateOrderStatus(orderId, "placed");
        
        // 3. Notify restaurants about new order
        notificationService.notifyRestaurant(Map.of("type", "NEW_ORDER", "orderId", orderId));
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Payment bypassed"));
    }
}
