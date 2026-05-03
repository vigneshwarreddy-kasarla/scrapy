package com.fillos.backend.menu;

import com.fillos.backend.menu.MenuDtos.CreateCategoryRequest;
import com.fillos.backend.menu.MenuDtos.CreateMenuItemRequest;
import com.fillos.backend.menu.MenuDtos.MenuCategoryResponse;
import com.fillos.backend.menu.MenuDtos.MenuItemResponse;
import com.fillos.backend.menu.MenuDtos.PatchItemAvailabilityRequest;
import com.fillos.backend.menu.MenuDtos.UpdateCategoryRequest;
import com.fillos.backend.menu.MenuDtos.UpdateMenuItemRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/menu")
public class AdminMenuController {
    private final MenuRepository menuRepository;

    public AdminMenuController(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    @GetMapping("/categories")
    public List<MenuCategoryResponse> listCategories() {
        return menuRepository.listAllCategoriesForAdmin();
    }

    @GetMapping("/categories/{id}/items")
    public ResponseEntity<List<MenuItemResponse>> listItems(@PathVariable("id") UUID categoryId) {
        if (!menuRepository.categoryExists(categoryId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(menuRepository.listAllItemsForAdmin(categoryId));
    }

    @PostMapping("/categories")
    public ResponseEntity<Void> createCategory(@Valid @RequestBody CreateCategoryRequest body) {
        UUID id = menuRepository.insertCategory(body);
        return ResponseEntity.created(URI.create("/api/v1/admin/menu/categories/" + id)).build();
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Void> updateCategory(
            @PathVariable("id") UUID id, @Valid @RequestBody UpdateCategoryRequest body) {
        if (menuRepository.updateCategory(id, body) == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable("id") UUID id) {
        if (!menuRepository.categoryExists(id)) {
            return ResponseEntity.notFound().build();
        }
        menuRepository.deleteItemsInCategory(id);
        menuRepository.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/items")
    public ResponseEntity<Void> createItem(@Valid @RequestBody CreateMenuItemRequest body) {
        if (!menuRepository.categoryExists(body.categoryId())) {
            return ResponseEntity.badRequest().build();
        }
        UUID id = menuRepository.insertItem(body);
        return ResponseEntity.created(URI.create("/api/v1/menu/items/" + id)).build();
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<Void> updateItem(
            @PathVariable("id") UUID id, @Valid @RequestBody UpdateMenuItemRequest body) {
        if (menuRepository.findItemForAdmin(id) == null) {
            return ResponseEntity.notFound().build();
        }
        if (!menuRepository.categoryExists(body.categoryId())) {
            return ResponseEntity.badRequest().build();
        }
        if (menuRepository.updateItem(id, body) == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/items/{id}/availability")
    public ResponseEntity<Void> patchAvailability(
            @PathVariable("id") UUID id, @Valid @RequestBody PatchItemAvailabilityRequest body) {
        if (menuRepository.findItemForAdmin(id) == null) {
            return ResponseEntity.notFound().build();
        }
        menuRepository.patchItemAvailability(id, body.available());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable("id") UUID id) {
        if (menuRepository.deleteItem(id) == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
