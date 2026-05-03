package com.fillos.backend.payments;

import com.fillos.backend.config.RazorpayProperties;
import com.fillos.backend.orders.OrderRepository;
import com.fillos.backend.orders.OrderRepository.RazorpayOrderContext;
import com.fillos.backend.payments.RazorpayDtos.RazorpayCheckoutResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RazorpayPaymentService {
    private static final Logger log = LoggerFactory.getLogger(RazorpayPaymentService.class);

    private final RazorpayProperties props;
    private final OrderRepository orders;
    private final ObjectMapper objectMapper;

    public RazorpayPaymentService(RazorpayProperties props, OrderRepository orders, ObjectMapper objectMapper) {
        this.props = props;
        this.orders = orders;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public RazorpayCheckoutResponse createOrReuseRazorpayOrder(UUID userId, UUID fillosOrderId) {
        requireConfigured();
        RazorpayOrderContext ctx =
                orders.findForRazorpayCheckout(fillosOrderId, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if ("cancelled".equalsIgnoreCase(ctx.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is cancelled");
        }
        if ("delivered".equalsIgnoreCase(ctx.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order already delivered");
        }
        if ("paid".equalsIgnoreCase(ctx.paymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order already paid");
        }
        int amountSmallest = toSmallestUnit(ctx.totalAmount());
        if (amountSmallest <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order total must be positive");
        }
        if (ctx.razorpayOrderId() != null && !ctx.razorpayOrderId().isBlank()) {
            return new RazorpayCheckoutResponse(
                    fillosOrderId, ctx.razorpayOrderId(), amountSmallest, props.currency(), props.keyId());
        }
        try {
            RazorpayClient client = new RazorpayClient(props.keyId(), props.keySecret());
            JSONObject body = new JSONObject();
            body.put("amount", amountSmallest);
            body.put("currency", props.currency());
            body.put("receipt", receiptFor(fillosOrderId));
            JSONObject notes = new JSONObject();
            notes.put("fillos_order_id", fillosOrderId.toString());
            body.put("notes", notes);
            Order rp = client.orders.create(body);
            String rpOrderId = rp.get("id");
            if (rpOrderId == null || rpOrderId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay returned no order id");
            }
            if (orders.attachRazorpayOrderId(fillosOrderId, userId, rpOrderId) == 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Could not attach Razorpay order");
            }
            return new RazorpayCheckoutResponse(fillosOrderId, rpOrderId, amountSmallest, props.currency(), props.keyId());
        } catch (RazorpayException e) {
            log.warn("Razorpay order create failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay error: " + e.getMessage());
        }
    }

    @Transactional
    public void handleWebhook(String rawBody, String signatureHeader) {
        if (!props.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay is not configured");
        }
        if (props.webhookSecret() == null || props.webhookSecret().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "Razorpay webhook secret is not configured");
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing X-Razorpay-Signature");
        }
        try {
            Utils.verifyWebhookSignature(rawBody, signatureHeader, props.webhookSecret());
        } catch (RazorpayException e) {
            log.warn("Razorpay webhook signature invalid: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook signature");
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = root.path("event").asText("");
            if (!"payment.captured".equals(event)) {
                return;
            }
            JsonNode payment = root.path("payload").path("payment").path("entity");
            String rpOrderId = payment.path("order_id").asText(null);
            String rpPaymentId = payment.path("id").asText(null);
            if (rpOrderId == null || rpOrderId.isBlank()) {
                log.warn("Webhook payment.captured missing order_id");
                return;
            }
            UUID fillosOrderId = orders.findFillosOrderIdByRazorpayOrderId(rpOrderId).orElse(null);
            if (fillosOrderId == null) {
                log.warn("No Fillos order for Razorpay order_id={}", rpOrderId);
                return;
            }
            int n = orders.markPaidFromRazorpayWebhook(fillosOrderId, rpOrderId, rpPaymentId);
            if (n == 0) {
                log.debug("Webhook mark paid no-op (already paid?) fillosOrderId={}", fillosOrderId);
            }
        } catch (Exception e) {
            log.warn("Webhook parse/handle failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook payload");
        }
    }

    private void requireConfigured() {
        if (!props.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Razorpay is disabled or missing key id/secret (set fillos.razorpay.enabled and keys)");
        }
    }

    private static String receiptFor(UUID fillosOrderId) {
        String s = fillosOrderId.toString().replace("-", "");
        return s.length() <= 40 ? s : s.substring(0, 40);
    }

    /** INR → paise; other currencies: treat 2-decimal major unit as smallest (extend when adding multi-currency rules). */
    private int toSmallestUnit(BigDecimal total) {
        BigDecimal scaled = total.setScale(2, RoundingMode.HALF_UP);
        return scaled.multiply(BigDecimal.valueOf(100)).intValueExact();
    }
}
