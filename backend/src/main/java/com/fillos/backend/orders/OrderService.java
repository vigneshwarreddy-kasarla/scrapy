package com.fillos.backend.orders;

import com.fillos.backend.address.AddressService;
import com.fillos.backend.orders.OrderDtos.AdminOrderDetailResponse;
import com.fillos.backend.orders.OrderDtos.AdminOrderSummaryResponse;
import com.fillos.backend.orders.OrderDtos.AssignDeliveryRequest;
import com.fillos.backend.orders.OrderDtos.CheckoutRequest;
import com.fillos.backend.orders.OrderDtos.OrderResponse;
import com.fillos.backend.orders.OrderDtos.OrderSummaryResponse;
import com.fillos.backend.orders.OrderDtos.PatchOrderStatusRequest;
import com.fillos.backend.orders.OrderDtos.PatchPaymentRequest;
import com.fillos.backend.orders.OrderRepository.CartSnapshotLine;
import com.fillos.backend.user.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {
    private static final int LIST_LIMIT = 50;

    private final OrderRepository orders;
    private final UserRepository users;
    private final AddressService addresses;

    public OrderService(OrderRepository orders, UserRepository users, AddressService addresses) {
        this.orders = orders;
        this.users = users;
        this.addresses = addresses;
    }

    @Transactional
    public OrderResponse checkout(UUID userId, CheckoutRequest checkout) {
        List<CartSnapshotLine> lines = orders.loadCartSnapshotLines(userId);
        if (lines.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }
        BigDecimal total = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        for (CartSnapshotLine row : lines) {
            BigDecimal lineTotal =
                    row.unitPrice()
                            .multiply(BigDecimal.valueOf(row.quantity()))
                            .setScale(2, RoundingMode.HALF_UP);
            total = total.add(lineTotal);
        }
        String deliverySnap = null;
        if (checkout != null && checkout.deliveryAddressId() != null) {
            deliverySnap = addresses.snapshotForCheckout(userId, checkout.deliveryAddressId());
        }
        String customerNote = null;
        if (checkout != null && checkout.customerNote() != null) {
            String t = checkout.customerNote().trim();
            customerNote = t.isEmpty() ? null : t;
        }
        UUID orderId = orders.insertOrder(userId, total, deliverySnap, customerNote);
        for (CartSnapshotLine row : lines) {
            BigDecimal lineTotal =
                    row.unitPrice()
                            .multiply(BigDecimal.valueOf(row.quantity()))
                            .setScale(2, RoundingMode.HALF_UP);
            orders.insertOrderItem(orderId, row.menuItemId(), row.name(), row.quantity(), row.unitPrice(), lineTotal);
        }
        orders.clearCartForUser(userId);
        return orders
                .findOrderForUser(orderId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Order not found"));
    }

    public OrderResponse getOrder(UUID userId, UUID orderId) {
        return orders
                .findOrderForUser(orderId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    @Transactional
    public OrderResponse cancelMyOrder(UUID userId, UUID orderId) {
        if (orders.cancelOrderForCustomer(orderId, userId) == 0) {
            if (orders.findOrderForUser(orderId, userId).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
            }
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Order cannot be cancelled (must be placed or confirmed, unpaid, and not delivered)");
        }
        return getOrder(userId, orderId);
    }

    public List<OrderSummaryResponse> listMyOrders(UUID userId) {
        return orders.listOrdersForUser(userId, LIST_LIMIT);
    }

    public List<AdminOrderSummaryResponse> listOrdersAdmin(int limit, long offset) {
        return orders.listAllOrdersAdmin(limit, offset);
    }

    public AdminOrderDetailResponse getOrderAdmin(UUID orderId) {
        return orders
                .findOrderByIdForAdmin(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    @Transactional
    public AdminOrderDetailResponse patchOrderStatusAdmin(UUID orderId, PatchOrderStatusRequest body) {
        if (orders.updateOrderStatus(orderId, body.status()) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        return getOrderAdmin(orderId);
    }

    @Transactional
    public AdminOrderDetailResponse patchPaymentAdmin(UUID orderId, PatchPaymentRequest body) {
        if (orders.updatePaymentStatus(orderId, body.paymentStatus()) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        return getOrderAdmin(orderId);
    }

    @Transactional
    public AdminOrderDetailResponse assignDeliveryAdmin(UUID orderId, AssignDeliveryRequest body) {
        var agent =
                users.findById(body.deliveryAgentId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!agent.active()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is inactive");
        }
        if (!"delivery_agent".equals(agent.role())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a delivery agent");
        }
        if (orders.assignDeliveryAgent(orderId, body.deliveryAgentId()) == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Order cannot be assigned (wrong status, already assigned, or completed)");
        }
        return getOrderAdmin(orderId);
    }

    public List<AdminOrderSummaryResponse> listOrdersForAgent(UUID agentId) {
        return orders.listOrdersForDeliveryAgent(agentId, LIST_LIMIT);
    }

    @Transactional
    public void completeDelivery(UUID agentId, UUID orderId) {
        if (orders.markDeliveredByAgent(orderId, agentId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found or not assigned to you");
        }
    }
}
