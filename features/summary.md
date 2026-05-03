# Scrapy - Project Evolution & Features

## 1. Backend & Deployment Readiness
- **Database Configuration Fix**: Fixed the Hikari connection error by adding `DataSourceConfig.java`. This intercepts the standard Render `DATABASE_URL` (which uses `postgres://` or `postgresql://`) and dynamically maps it to a standard `jdbc:postgresql://` URI at startup.
- **Render Deployment Setup**: 
  - On Render, define the `DATABASE_URL` environment variable under your Web Service.
  - Set `JWT_SECRET` for secure token signing.
  - Add `VITE_API_URL` to your frontend static deployment variables to point to the Render backend URL.

## 2. Roles and Workflows
- **New Role - Restaurant**: Added a `restaurant` value to the PostgreSQL `user_role` enum via Flyway Migration (`V20__add_restaurant_role_and_tracking.sql`).
- **Security Updates**: Updated the Spring Security `SecurityConfig.java` to properly protect endpoints matching `/api/v1/restaurant/**` with the new role.
- **Order Lifecycle Integration**:
  - Implemented `listPendingOrdersForRestaurant()` in `OrderRepository` and `OrderService`.
  - Created a `RestaurantController` to allow restaurant managers to accept new orders.
  - Added new backend endpoints for the delivery riders to continuously sync their `delivery_lat` and `delivery_lng`.

## 3. Frontend & Map Integration
- **UI & UX Redesign**: Stripped out gradients, glassmorphism, floating template elements, and purple/blue colors in `index.css`. Replaced with a flat, modern **Dark Ocean Blue** theme (`--bg: #0f172a`) and bright orange accents. Standardized typography with the `Inter` font stack and implemented responsive dark/light color schemes.
- **Live Maps System**: 
  - Integrated OpenStreetMap, `react-leaflet`, `leaflet-routing-machine`, and `leaflet-geosearch`.
  - Created the `<DeliveryMap />` component.
  - Added the HTML5 Geolocation API to dynamically update the delivery rider's location and track it against a hardcoded restaurant using a dashed routing path.
  - Replaced generic copy with concise, professional English.
