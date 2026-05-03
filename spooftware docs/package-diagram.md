# Package Diagram

A package diagram shows how code is grouped into folders/modules.
For non-technical readers: this is the "which topic lives in which folder" map.

## 1) Main Package Diagram (Backend + Frontend)

```mermaid
flowchart LR
    subgraph Backend[backend/src/main/java/com/fillos/backend]
      B1[auth]
      B2[security]
      B3[menu]
      B4[cart]
      B5[orders]
      B6[address]
      B7[reviews]
      B8[favorites]
      B9[payments]
      B10[config]
      B11[health]
      B12[game]
      B13[planned: whatsapp]
    end

    subgraph Frontend[frontend/src]
      F1[api]
      F2[components]
      F3[context]
      F4[pages]
      F5[commerce]
      F6[planned: mobile app package]
      F7[game pages]
    end

    F1 --> B1
    F1 --> B3
    F1 --> B4
    F1 --> B5
    F1 --> B7
    F1 --> B8
    F1 --> B9
```

## 2) Split Package A (Backend Package Relationships)

```mermaid
flowchart TD
    API[controllers package layer]
    AUTH[auth]
    SEC[security]
    MENU[menu]
    CART[cart]
    ORD[orders]
    ADR[address]
    REV[reviews]
    FAV[favorites]
    PAY[payments]
    CFG[config]
    DB[(db/migration sql files)]

    API --> AUTH
    API --> MENU
    API --> CART
    API --> ORD
    API --> ADR
    API --> REV
    API --> FAV
    API --> PAY
    AUTH --> SEC
    ORD --> PAY
    ORD --> ADR
    MENU --> DB
    CART --> DB
    ORD --> DB
    REV --> DB
    FAV --> DB
    CFG --> AUTH
    CFG --> PAY
```

## 3) Split Package B (Frontend Package Relationships)

```mermaid
flowchart TD
    APP[App router]
    PAGES[pages]
    COMP[components]
    API[api/client]
    CTX[context/AuthContext]
    COM[commerce helpers]

    APP --> PAGES
    APP --> COMP
    APP --> CTX
    PAGES --> API
    PAGES --> COMP
    PAGES --> COM
    COMP --> CTX
```

## 4) Split Package C (Extension Packages)

```mermaid
flowchart LR
    BGAME[backend/game]
    BWA[backend/whatsapp - Planned]
    BTRACK[backend/tracking - Planned]
    FGAME[frontend/pages/game]
    MAPP[mobile-app package - Planned]

    FGAME --> BGAME
    MAPP --> BGAME
    MAPP --> BTRACK
    BWA --> BTRACK
```

## Status legend

- <span style="color:green"><u>Implemented</u></span> = package/module exists in current repository.
- <span style="color:red"><u>Planned</u></span> = package/module documented for future work.

## Plain-language summary

<span style="color:green"><u>The codebase is already modular, with clear backend domain packages and frontend page/component separation.</u></span>
<span style="color:green"><u>Game-related backend and frontend packages are now present.</u></span>
<span style="color:red"><u>WhatsApp and deeper tracking package groups remain planned.</u></span>
