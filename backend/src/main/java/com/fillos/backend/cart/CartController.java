package com.fillos.backend.cart;

import com.fillos.backend.cart.CartDtos.AddCartLineRequest;
import com.fillos.backend.cart.CartDtos.CartResponse;
import com.fillos.backend.cart.CartDtos.CartSyncRequest;
import com.fillos.backend.cart.CartDtos.UpdateCartLineRequest;
import com.fillos.backend.security.AppUserDetails;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {
    private final CartRepository cartRepository;

    public CartController(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    @GetMapping
    public CartResponse get(@AuthenticationPrincipal AppUserDetails principal) {
        return cartRepository.loadCart(principal.getId());
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addItem(@AuthenticationPrincipal AppUserDetails principal, @Valid @RequestBody AddCartLineRequest body) {
        if (cartRepository.findMenuItemForCart(body.menuItemId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Menu item not available");
        }
        UUID cartId = cartRepository.ensureCart(principal.getId());
        cartRepository.addOrMergeLine(cartId, body.menuItemId(), body.quantity());
    }

    @PatchMapping("/items/{lineId}")
    public ResponseEntity<Void> updateLine(
            @AuthenticationPrincipal AppUserDetails principal,
            @PathVariable("lineId") UUID lineId,
            @Valid @RequestBody UpdateCartLineRequest body) {
        if (cartRepository.updateLineQuantity(principal.getId(), lineId, body.quantity()) == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/items/{lineId}")
    public ResponseEntity<Void> deleteLine(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("lineId") UUID lineId) {
        if (cartRepository.deleteLine(principal.getId(), lineId) == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@AuthenticationPrincipal AppUserDetails principal) {
        cartRepository.clear(principal.getId());
    }

    @PostMapping("/merge")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void merge(
            @AuthenticationPrincipal AppUserDetails principal, @Valid @RequestBody CartSyncRequest body) {
        for (var line : body.lines()) {
            if (cartRepository.findMenuItemForCart(line.menuItemId()).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Menu item not available");
            }
        }
        cartRepository.mergeLines(principal.getId(), body.lines());
    }

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void replace(
            @AuthenticationPrincipal AppUserDetails principal, @Valid @RequestBody CartSyncRequest body) {
        for (var line : body.lines()) {
            if (cartRepository.findMenuItemForCart(line.menuItemId()).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Menu item not available");
            }
        }
        cartRepository.replaceLines(principal.getId(), body.lines());
    }
}
