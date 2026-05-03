# Deployment Diagram

A deployment diagram shows **where the software runs** (machines/services) and how they connect.
For non-technical readers: this is the "which computer runs what" picture.

## 1) Current Local/Dev Deployment

```mermaid
flowchart LR
    U[User Browser]
    FE[Frontend Dev Server\nlocalhost:5173]
    BE[Spring Boot Backend\nlocalhost:8080]
    DB[(PostgreSQL in Docker\nlocalhost:5432)]
    RZ[Razorpay Sandbox/API]

    U --> FE
    FE --> BE
    BE --> DB
    BE --> RZ
```

## 2) Split Deployment A (Current Runtime Nodes)

```mermaid
flowchart TD
    subgraph DeveloperMachine[Developer Laptop/Desktop]
      NODE1[Node.js Process\nVite Frontend]
      NODE2[Java Process\nSpring Boot Backend]
      NODE3[Docker Container\nPostgreSQL]
    end

    EXT1[External Payment\nRazorpay]

    NODE1 --> NODE2
    NODE2 --> NODE3
    NODE2 --> EXT1
```

## 3) Split Deployment B (Planned Production Deployment)

```mermaid
flowchart LR
    CUST[Customers]
    ADMIN[Admin Users]
    AGENT[Delivery Agents]

    WEB[Vercel Website - Planned]
    DASH[Vercel Admin UI - Planned]
    API[Railway API - Planned]
    PSQL[(Railway PostgreSQL - Planned)]
    PAY[Razorpay]
    FCM[Firebase FCM - Planned]
    WA[WhatsApp Provider - Planned]
    MAPS[Google Maps - Planned]

    CUST --> WEB
    ADMIN --> DASH
    AGENT --> WEB

    WEB --> API
    DASH --> API
    API --> PSQL
    API --> PAY
    API --> FCM
    API --> WA
    WEB --> MAPS
```

## 4) Split Deployment C (Planned Multi-Channel Expansion)

```mermaid
flowchart LR
    ANDROID[Android App - Planned]
    WEBSITE[Mobile Website]
    WHATSAPP[WhatsApp Channel - Planned]
    API[Unified Backend API]
    DB[(PostgreSQL)]

    ANDROID --> API
    WEBSITE --> API
    WHATSAPP --> API
    API --> DB
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = currently working in local/dev setup.
- <span style="color:red"><u>Planned</u></span> = production strategy from planning docs.

## Plain-language summary

<span style="color:green"><u>Today, frontend, backend, and PostgreSQL run locally with payment integration support.</u></span>
<span style="color:red"><u>The full cloud deployment model (Vercel/Railway/Firebase/WhatsApp providers) is a planned target architecture.</u></span>
