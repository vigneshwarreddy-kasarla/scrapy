# Database Schema Diagram

This document explains the database in small, easy parts.
If one big diagram is hard to read, these split diagrams are better.

## 1) Core ER Diagram (High-Level)

```mermaid
erDiagram
    users ||--o{ user_addresses : has
    users ||--o{ orders : places
    users ||--o{ order_reviews : writes
    users ||--o{ user_favorites : saves
    users ||--o{ orders : delivers
    menu_categories ||--o{ menu_items : contains
    orders ||--o{ order_items : includes
    menu_items ||--o{ order_items : appears_in
    orders ||--o| order_reviews : can_have
    menu_items ||--o{ user_favorites : starred_by
```

## 2) Split ER A (Identity and Profile Data)

```mermaid
erDiagram
    users ||--o{ user_addresses : has

    users {
      uuid id PK
      varchar name
      varchar email
      varchar phone
      varchar password_hash
      enum role
      boolean is_active
      text fcm_token
      int token_version
      varchar country_code
      timestamptz created_at
      timestamptz updated_at
      timestamptz deleted_at
    }

    user_addresses {
      uuid id PK
      uuid user_id FK
      varchar label
      varchar line1
      varchar line2
      varchar city
      varchar region
      varchar postal_code
      char country
      boolean is_default
      timestamptz created_at
      timestamptz updated_at
    }
```

## 3) Split ER B (Menu and Favorites Data)

```mermaid
erDiagram
    menu_categories ||--o{ menu_items : contains
    users ||--o{ user_favorites : owns
    menu_items ||--o{ user_favorites : favorited_as

    menu_categories {
      uuid id PK
      varchar name
      int display_order
      boolean is_active
      text image_url
    }

    menu_items {
      uuid id PK
      uuid category_id FK
      varchar name
      text description
      decimal price
      decimal discounted_price
      text image_url
      boolean is_veg
      boolean is_available
      int preparation_time
      int calories
      text[] tags
      text[] ingredients
      text[] allergens
      int weight_grams
      int display_order
    }

    user_favorites {
      uuid user_id PK,FK
      uuid menu_item_id PK,FK
      timestamptz created_at
    }
```

## 4) Split ER C (Cart and Ordering Data)

```mermaid
erDiagram
    users ||--o{ cart_items : has
    menu_items ||--o{ cart_items : added_as
    users ||--o{ orders : places
    orders ||--o{ order_items : includes
    menu_items ||--o{ order_items : copied_from
    users ||--o{ orders : delivers

    cart_items {
      uuid user_id FK
      uuid menu_item_id FK
      int quantity
      timestamptz updated_at
    }

    orders {
      uuid id PK
      uuid user_id FK
      uuid delivery_agent_id FK
      enum status
      decimal total_amount
      enum payment_status
      timestamptz paid_at
      varchar razorpay_order_id
      varchar razorpay_payment_id
      text delivery_address_snapshot
      text customer_note
      timestamptz delivered_at
      timestamptz created_at
      timestamptz updated_at
    }

    order_items {
      uuid id PK
      uuid order_id FK
      uuid menu_item_id FK
      varchar item_name
      int quantity
      decimal unit_price
      decimal line_total
      timestamptz created_at
    }
```

## 5) Split ER D (Reviews and Feedback Data)

```mermaid
erDiagram
    orders ||--o| order_reviews : can_have_one
    users ||--o{ order_reviews : submits

    order_reviews {
      uuid id PK
      uuid order_id FK
      uuid user_id FK
      smallint rating
      text comment
      timestamptz created_at
    }
```

## 6) Split ER E (Planned Schema Extensions)

```mermaid
erDiagram
    users ||--o{ game_sessions : plays
    users ||--o| customer_game_profile : has
    customer_game_profile }o--|| coupons : active_coupon
    coupons ||--o{ game_sessions : won_in
    game_levels_config ||--o{ coupons : configures
    users ||--o{ whatsapp_orders : places
    orders ||--o{ delivery_tracking : has_updates
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = table/entity exists in current migrations.
- <span style="color:red"><u>Planned</u></span> = appears in planning PDFs, not fully implemented in current DB.

## Plain-language summary

<span style="color:green"><u>Current database strongly supports users, menu, cart, orders, payments, reviews, and favorites.</u></span>
<span style="color:red"><u>Game-level entities, WhatsApp order entities, and richer live tracking entities are planned for future DB expansion.</u></span>
