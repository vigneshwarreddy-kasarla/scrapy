package com.fillos.backend.favorites;

import com.fillos.backend.favorites.FavoriteDtos.FavoritesReplaceRequest;
import com.fillos.backend.favorites.FavoriteDtos.FavoritesResponse;
import com.fillos.backend.security.AppUserDetails;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoritesController {
    private final FavoritesRepository favoritesRepository;

    public FavoritesController(FavoritesRepository favoritesRepository) {
        this.favoritesRepository = favoritesRepository;
    }

    @GetMapping
    public FavoritesResponse list(@AuthenticationPrincipal AppUserDetails principal) {
        return new FavoritesResponse(favoritesRepository.listFavorites(principal.getId()));
    }

    @PostMapping("/items/{menuItemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("menuItemId") UUID menuItemId) {
        if (!favoritesRepository.isCustomerVisibleMenuItem(menuItemId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Menu item not available");
        }
        favoritesRepository.addFavorite(principal.getId(), menuItemId);
    }

    @DeleteMapping("/items/{menuItemId}")
    public ResponseEntity<Void> remove(
            @AuthenticationPrincipal AppUserDetails principal, @PathVariable("menuItemId") UUID menuItemId) {
        int n = favoritesRepository.removeFavorite(principal.getId(), menuItemId);
        if (n == 0) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void replace(
            @AuthenticationPrincipal AppUserDetails principal, @Valid @RequestBody FavoritesReplaceRequest body) {
        favoritesRepository.replaceFavorites(principal.getId(), body.menuItemIds());
    }
}
