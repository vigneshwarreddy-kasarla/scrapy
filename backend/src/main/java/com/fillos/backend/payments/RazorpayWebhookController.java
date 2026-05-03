package com.fillos.backend.payments;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RazorpayWebhookController {
    private final RazorpayPaymentService razorpayPayments;

    public RazorpayWebhookController(RazorpayPaymentService razorpayPayments) {
        this.razorpayPayments = razorpayPayments;
    }

    /**
     * Razorpay server-to-server webhooks. Secured by HMAC signature (not JWT). Configure the same URL in the
     * Razorpay Dashboard.
     */
    @PostMapping(value = "/api/v1/webhooks/razorpay", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> razorpay(
            @RequestBody String rawBody, @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        razorpayPayments.handleWebhook(rawBody, signature);
        return ResponseEntity.ok().build();
    }
}
