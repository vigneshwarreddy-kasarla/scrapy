# Component Diagram

A component diagram shows the big parts of the system and how they connect.
For non-technical readers: this is the "system blocks and wires" view.

## 1) High-Level Component Diagram

```mermaid
flowchart LR
    subgraph ClientLayer[Client Layer]
      WEB[Web Frontend React + Vite]
      ADMIN[Admin UI React + Vite]
      AGENT[Delivery Agent Client]
      APP[Android App - Planned]
      WA[WhatsApp Channel - Planned]
    end

    subgraph ApiLayer[Backend API Layer]
      AUTH[Auth + Security]
      MENU[Menu]
      CART[Cart]
      ORDER[Orders + Delivery]
      REVIEW[Reviews]
      FAV[Favorites]
      PAY[Payments]
      GAME[Game Module - Planned]
      WAH[WhatsApp Integration - Planned]
      RT[Real-time Tracking - Planned]
    end

    DB[(PostgreSQL)]
    RZ[Razorpay]

    WEB --> AUTH
    WEB --> MENU
    WEB --> CART
    WEB --> ORDER
    WEB --> REVIEW
    WEB --> FAV
    WEB --> PAY

    ADMIN --> AUTH
    ADMIN --> MENU
    ADMIN --> ORDER
    ADMIN --> REVIEW
    ADMIN --> PAY
    ADMIN --> GAME

    AGENT --> AUTH
    AGENT --> ORDER

    APP --> AUTH
    APP --> MENU
    APP --> CART
    APP --> ORDER
    APP --> GAME

    WA --> WAH

    AUTH --> DB
    MENU --> DB
    CART --> DB
    ORDER --> DB
    REVIEW --> DB
    FAV --> DB
    PAY --> DB
    GAME --> DB
    WAH --> DB
    RT --> DB

    PAY --> RZ
```

## 2) Split Component A (Backend Internal Components)

```mermaid
flowchart TD
    API[Spring Boot API]
    SEC[Security/JWT Filter]
    MOD1[Auth Module]
    MOD2[Menu Module]
    MOD3[Cart Module]
    MOD4[Orders Module]
    MOD5[Delivery Module]
    MOD6[Reviews Module]
    MOD7[Favorites Module]
    MOD8[Payments Module]
    MOD9[Planned Game Module]
    MOD10[Planned WhatsApp Module]
    DB[(PostgreSQL)]

    API --> SEC
    API --> MOD1
    API --> MOD2
    API --> MOD3
    API --> MOD4
    API --> MOD5
    API --> MOD6
    API --> MOD7
    API --> MOD8
    API --> MOD9
    API --> MOD10

    MOD1 --> DB
    MOD2 --> DB
    MOD3 --> DB
    MOD4 --> DB
    MOD5 --> DB
    MOD6 --> DB
    MOD7 --> DB
    MOD8 --> DB
    MOD9 --> DB
    MOD10 --> DB
```

## 3) Split Component B (Customer Ordering Components)

```mermaid
flowchart LR
    C[Customer]
    FE[Customer Web UI]
    AUTH[Auth API]
    MENU[Menu API]
    CART[Cart API]
    ORDER[Order API]
    PAY[Payment API]
    DB[(PostgreSQL)]
    RZ[Razorpay]

    C --> FE
    FE --> AUTH
    FE --> MENU
    FE --> CART
    FE --> ORDER
    FE --> PAY
    AUTH --> DB
    MENU --> DB
    CART --> DB
    ORDER --> DB
    PAY --> DB
    PAY --> RZ
```

## 4) Split Component C (Planned Expansion Components)

```mermaid
flowchart LR
    APP[Android App - Planned]
    WA[WhatsApp Bot - Planned]
    GAME[Game Engine - Planned]
    TRACK[Live Tracking - Planned]
    API[Backend API]
    DB[(PostgreSQL)]

    APP --> API
    WA --> API
    GAME --> API
    TRACK --> API
    API --> DB
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = existing components in current repo.
- <span style="color:red"><u>Planned</u></span> = design targets not fully implemented yet.

## Plain-language summary

<span style="color:green"><u>The current system already has working web/admin clients connected to modular backend APIs and PostgreSQL.</u></span>
<span style="color:green"><u>Payment integration with Razorpay exists through backend payment components.</u></span>
<span style="color:red"><u>Android app, WhatsApp channel, game engine, and full live tracking are planned component expansions.</u></span>
