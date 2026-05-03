package com.fillos.backend.menu;

import com.fillos.backend.menu.MenuDtos.MenuCategoryResponse;
import com.fillos.backend.menu.MenuDtos.MenuItemResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/menu")
public class MenuController {
    private final MenuRepository menuRepository;

    public MenuController(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    @GetMapping("/categories")
    public List<MenuCategoryResponse> listCategories() {
        return menuRepository.listActiveCategoriesForCustomer();
    }

    @GetMapping("/categories/{id}/items")
    public ResponseEntity<List<MenuItemResponse>> listItems(@PathVariable("id") UUID categoryId) {
        if (!menuRepository.categoryExistsAndActiveForCustomer(categoryId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(menuRepository.listAvailableItemsForCustomer(categoryId));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<MenuItemResponse> getItem(@PathVariable("id") UUID itemId) {
        MenuItemResponse row = menuRepository.findAvailableItemForCustomer(itemId);
        if (row == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(row);
    }
}
