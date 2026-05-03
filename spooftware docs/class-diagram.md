# Class Diagram

A class diagram shows the **main building blocks** of code and how they relate.
For non-technical readers: think of classes as "organized boxes of responsibility".

## 1) Domain Class Diagram (Core Data Model)

```mermaid
classDiagram
    class User {
      +UUID id
      +String name
      +String phone
      +String email
      +String role
      +Boolean isActive
    }

    class UserAddress {
      +UUID id
      +UUID userId
      +String label
      +String line1
      +String city
      +String postalCode
      +Boolean isDefault
    }

    class MenuCategory {
      +UUID id
      +String name
      +Boolean isActive
      +Integer displayOrder
    }

    class MenuItem {
      +UUID id
      +UUID categoryId
      +String name
      +Decimal price
      +Boolean isAvailable
      +Boolean isVeg
    }

    class Order {
      +UUID id
      +UUID userId
      +UUID deliveryAgentId
      +String status
      +String paymentStatus
      +Decimal totalAmount
    }

    class OrderItem {
      +UUID id
      +UUID orderId
      +UUID menuItemId
      +String itemName
      +Integer quantity
      +Decimal unitPrice
    }

    class OrderReview {
      +UUID id
      +UUID orderId
      +UUID userId
      +Integer rating
      +String comment
    }

    class UserFavorite {
      +UUID userId
      +UUID menuItemId
    }

    User "1" --> "*" UserAddress : has
    User "1" --> "*" Order : places
    User "1" --> "*" OrderReview : writes
    User "1" --> "*" UserFavorite : creates
    MenuCategory "1" --> "*" MenuItem : contains
    Order "1" --> "*" OrderItem : includes
    Order "1" --> "0..1" OrderReview : gets
    MenuItem "1" --> "*" OrderItem : ordered as
    MenuItem "1" --> "*" UserFavorite : favorited in
```

## 2) Application Class Diagram (Controller -> Service -> Repository style)

```mermaid
classDiagram
    class AuthController
    class UserProfileController
    class MenuController
    class AdminMenuController
    class CartController
    class OrderController
    class AdminOrderController
    class DeliveryController
    class OrderReviewController
    class AdminReviewsController
    class FavoritesController
    class OrderRazorpayController
    class RazorpayWebhookController

    class AuthService
    class MenuService
    class CartService
    class OrderService
    class ReviewService
    class FavoritesService
    class PaymentService

    class UserRepository
    class MenuRepository
    class CartRepository
    class OrderRepository
    class ReviewRepository
    class FavoritesRepository

    AuthController --> AuthService
    UserProfileController --> AuthService
    MenuController --> MenuService
    AdminMenuController --> MenuService
    CartController --> CartService
    OrderController --> OrderService
    AdminOrderController --> OrderService
    DeliveryController --> OrderService
    OrderReviewController --> ReviewService
    AdminReviewsController --> ReviewService
    FavoritesController --> FavoritesService
    OrderRazorpayController --> PaymentService
    RazorpayWebhookController --> PaymentService

    AuthService --> UserRepository
    MenuService --> MenuRepository
    CartService --> CartRepository
    OrderService --> OrderRepository
    ReviewService --> ReviewRepository
    FavoritesService --> FavoritesRepository
```

## 3) Split Class Diagram (Game + WhatsApp)

```mermaid
classDiagram
    class SoccerGameController
    class AdminSoccerGameController
    class GameRepository
    class GameDtos

    class WhatsAppWebhookController
    class WhatsAppOrderService
    class WhatsAppOrderRepository

    SoccerGameController --> GameRepository
    AdminSoccerGameController --> GameRepository
    SoccerGameController --> GameDtos
    AdminSoccerGameController --> GameDtos

    WhatsAppWebhookController --> WhatsAppOrderService
    WhatsAppOrderService --> WhatsAppOrderRepository
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = represented by current codebase modules.
- <span style="color:red"><u>Planned</u></span> = planned architecture from PDFs.

## Plain-language summary

<span style="color:green"><u>The project already has clear class-level separation for auth, menu, cart, orders, reviews, favorites, and payments.</u></span>
<span style="color:green"><u>Soccer game class group is implemented at controller/repository/DTO level.</u></span>
<span style="color:red"><u>WhatsApp class groups are still planned and documented for future implementation.</u></span>
