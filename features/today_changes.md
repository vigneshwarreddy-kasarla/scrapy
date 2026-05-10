# Today's Feature Changes & Modifications

## New Features

### 1. Restaurant Menu Management
- **Add Menu Item**: Restaurants can now add new food items directly from their dashboard.
- **Form Integration**: A dynamic form allows setting the item name, price, description, and veg/non-veg status.
- **Automatic Association**: New items are automatically linked to the logged-in restaurant.

### 2. Live Order Tracking (Maps)
- **Customer View**: Customers can now see a live map on their order detail page tracking the delivery agent's location once the order is "Out for Delivery."
- **Delivery Partner View**: Delivery agents see a map with the customer's location on their active jobs list to help with navigation.
- **Restaurant View**: Restaurants can track the delivery agent's location after the order has been picked up.
- **Leaflet Integration**: Uses OpenStreetMap for reliable, license-free mapping.

### 3. Order Status Workflow
- **Enhanced Statuses**: Added explicit "Mark as Ready" for restaurants and "Take Order" for delivery agents.
- **Real-time Updates**: Status changes are pushed to relevant parties via WebSockets.

### 4. Automatic System Cleanup
- **Stale Order Cancellation**: A background task automatically cancels orders that remain unfulfilled for more than 4 hours, notifying all parties.

## Modified Features

### 1. Enhanced Authentication Logic
- **Detailed Error Messages**: Login now specifically reports if a phone number is missing or a password is incorrect, instead of a generic "Unauthorized" error.
- **Role Authority Mapping**: Fixed security context mapping to ensure "Restaurant" and "Delivery Partner" roles have the correct permissions to access their respective APIs.

### 2. Dashboard Layouts
- **Restaurant Dashboard**: Added analytics panel (Items Sold, Delivered, Active, Pending) and a "My Menu" list.
- **Delivery Dashboard**: Split into "My Active Jobs" and "Available Jobs" sections.

---

## Authentication Error (401) - Guide

### Why it happens:
1. **Normalization**: The system adds `+91` to all numbers. If the DB has `+1` (from old seeds), login fails. (Fixed in recent migrations).
2. **Missing Authority**: If you can log in but can't see pages, the `ROLE_RESTAURANT` or `ROLE_DELIVERY_AGENT` was likely missing from your session token.

### How to overcome:
1. **Use Seeded Numbers**: 
   - Restaurant: `9995550004`
   - Delivery: `9995550003`
   - Password: `DummyPass1`
2. **Clean State**: If errors persist, try "Logout" and log back in to refresh the JWT token with updated role permissions.
3. **Database Check**: Ensure migrations `V23` and `V24` are applied to the database.
