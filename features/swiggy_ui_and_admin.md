# Swiggy-Style UI & Admin Features

## 1. UI Design Mockup
I have generated a high-resolution, production-ready flat design mockup for the Swiggy-style app. 
- **Aesthetic**: Flat design, strict usage of `#0066cc` and its shades, with vibrant orange/peach accents.
- **Typography**: Clean hierarchy utilizing the `Inter` font family without buzzword fluff.
- **Components**: Solid, outline, and ghost buttons with subtle 8px radius shadows, clean layout structure, and realistic listing cards.

*The mockup has been successfully rendered and is visible in your Artifacts UI.*

## 2. Seed Data Updates
- **New Seed User**: Modified the backend dummy database seed (`V12__dev_seed_dummy_data.sql`).
- **Added**: A test user `Dina Restaurant` with the phone number `+19995550004` and password `DummyPass1`. This account is automatically granted the `restaurant` role. 
- **Usage**: When you wipe your database or run locally on a fresh container, you now have all four core personas (Admin, Customer, Delivery, Restaurant) ready to go.

## 3. Dynamic Admin User Creation API
- **Extended `AuthService.java`**: Added a new service method `createUserByAdmin()` that allows an Admin to create accounts with any arbitrary role, skipping OTP limits.
- **New API Endpoint**: Added `POST /api/v1/admin/staff/users/{role}` to the `AdminStaffController.java`.
- **How to Use**:
  As an authenticated Admin, you can create a new restaurant by sending:
  ```http
  POST /api/v1/admin/staff/users/restaurant
  Content-Type: application/json
  Authorization: Bearer <ADMIN_TOKEN>

  {
    "name": "New Swiggy Vendor",
    "phone": "9876543210",
    "password": "SecurePassword123"
  }
  ```
  The endpoint instantly provisions the account with the `restaurant` role, allowing them to log in to the Restaurant Dashboard immediately.
