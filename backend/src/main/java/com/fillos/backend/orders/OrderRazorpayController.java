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

@RestController
@RequestMapping("/api/v1/orders")
public class OrderRazorpayController {
    private final RazorpayPaymentService razorpayPayments;

    public OrderRazorpayController(RazorpayPaymentService razorpayPayments) {
        this.razorpayPayments = razorpayPayments;
    }

    /** Creates a Razorpay Order (or returns an existing one) for Checkout on the client. */
    @PostMapping("/{orderId}/payments/razorpay/order")
    public RazorpayCheckoutResponse createRazorpayOrder(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("orderId") UUID orderId) {
        return razorpayPayments.createOrReuseRazorpayOrder(principal.getId(), orderId);
    }
}
