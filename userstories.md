# User Stories Blueprint
## Project Name: BaltiTour - AI Dynamic Trip Builder
**Framework Format:** As a [Role], I want to [Action], So that [Benefit].

---

## 🏔️ Sprint 1: Tourist / Traveler Persona (Core Experience)

### US-101: Dynamic Package & Multi-Leg Logistics
*   **User Story:** As a traveler, I want to plan a multi-destination trip (e.g., Skardu -> Shigar -> Hunza) and select a hostel, a 4x4 vehicle, and a local guide on a single screen, so that I can see an instant combined price and seamless logistics update.
*   **Acceptance Criteria:**
    *   Changing a vehicle selection updates the total cost estimate instantly.
    *   System supports multiple "Stops" with different accommodation and transport transitions (e.g., changing from a Corolla to a Prado for a specific leg).
    *   The cart breakdown cleanly displays separate costs for Stay, Transport, and Guide across all legs.
    *   The user cannot proceed to checkout if any mandatory step (Stay/Date) is empty.

### US-102: Smart Route & Budget Filtering
*   **User Story:** As a budget backpacker, I want to input my maximum budget (e.g., PKR 60,000), so that the application automatically highlights hostels and ride-sharing options that fit my pocket.
*   **Acceptance Criteria:**
    *   Input field accepts flat PKR numbers.
    *   System displays a clear "AI Recommended Package" indicator on items fitting the budget math.

### US-103: Ride Pooling & Cost Sharing
*   **User Story:** As a solo traveler, I want to opt-in for seat-pooling on a Prado ride to Deosai Plains, so that the total vehicle rent is split evenly with other backpackers.
*   **Acceptance Criteria:**
    *   User can check a box labeled "Enable Seat Pooling".
    *   The dashboard displays active pools with "Seats Left" and "Cost Per Seat" clearly visible.
    *   Fare updates dynamically if another user joins or leaves the pool group.

### US-104: Offline Survivor Kit Access
*   **User Story:** As a tourist entering a zero-signal valley (like upper Shigar or Deosai), I want my application to load my confirmed booking vouchers and driver's mobile number without internet connectivity, so that I don't get stranded.
*   **Acceptance Criteria:**
    *   The application automatically saves/caches the active trip data locally using SQLite/Hive storage upon checkout completion.
    *   The app opens directly to the "Active Trip" offline screen if no network ping is detected.
    *   A native phone call trigger is available to ring the driver over standard GSM signals.

### US-105: High-Altitude Emergency SOS
*   **User Story:** As a tourist stranded during a landsliding event, I want to press a dedicated SOS button, so that my precise GPS coordinates are instantly dispatched to local rescue (1122) and the platform control room via background SMS.
*   **Acceptance Criteria:**
    *   The SOS button is highly visible on the global navigation/header bar.
    *   The feature fetches native smartphone GPS coordinates without active cellular data.
    *   The system formats a clean text message payload for background SMS delivery.

### US-106: Intelligent Terrain-Vehicle Linking
*   **User Story:** As a traveler, I want the application to automatically enforce or recommend a 4x4 vehicle if my itinerary includes Deosai Plains or Basho Valley, so that I don't book an incompatible vehicle for rough terrain.
*   **Acceptance Criteria:**
    *   Selecting a high-altitude/off-road destination triggers a "4x4 Required" constraint.
    *   Non-compatible vehicles (e.g., Corolla/Alto) are grayed out or marked with a warning for those specific legs.

### US-107: One-Click "Vibe" Package Build
*   **User Story:** As a user wanting a quick setup, I want to select a "Vibe" (e.g., Backpacker vs. Luxury) and a budget, so that the AI generates a complete, optimized itinerary for me in one click.
*   **Acceptance Criteria:**
    *   The app features "Backpacker," "Luxury," and "Adventure" vibe presets.
    *   The AI Magic Build button populates a full cart based on the selected vibe and budget constraints.

### US-108: Trust & Safety (Solo Traveler Certification)
*   **User Story:** As a solo traveler, I want to filter for vendors and drivers with "Safe for Solo" and "Women-Friendly" certifications, so that I can ensure my safety during the trip.
*   **Acceptance Criteria:**
    *   Filter options for "Solo Safety Certified" in both Hostel and Transport marketplaces.
    *   Display of verified badges on vendor profiles.

### US-109: Low-Bandwidth Priority Sync (SCOM)
*   **User Story:** As a traveler in a low-signal area, I want my critical trip updates (like SOS or booking changes) to sync first over non-critical data, so that I stay safe and informed even on 2G networks.
*   **Acceptance Criteria:**
    *   System implements a priority queue for background synchronization.
    *   Critical data is sent in compressed binary formats to ensure delivery on unstable SCOM connections.

### US-110: Gamified Loyalty (BaltiPoints)
*   **User Story:** As a tourist, I want to earn BaltiPoints for every PKR spent, so that I get a discount on my next summer trip to Gilgit-Baltistan.
*   **Acceptance Criteria:**
    *   Wallet screen shows active "BaltiPoints" balance.
    *   Checkout process includes a "Redeem Points" toggle.

### US-111: Informed Stay Selection (Room Detail Cards)
*   **User Story:** As a tourist, I want to see a detailed card of a hotel showing its room features and price per room, so that I can make an informed decision based on actual amenities like "K2 View" or "Hot Shower".
*   **Acceptance Criteria:**
    *   Hotel cards in the search results are expandable to show individual room types.
    *   Feature tags (WiFi, View, etc.) are displayed as clear icons on each room card.
    *   Price updates dynamically when a specific room type is selected.

### US-112: Visual Trip Timeline & Advisory
*   **User Story:** As a traveler, I want to see a day-by-day visual timeline of my trip, so that I can understand my schedule and see weather/road alerts for each destination.
*   **Acceptance Criteria:**
    *   Trip Flow tab displays a vertical/horizontal timeline of planned activities.
    *   Each day shows icons for the booked hotel and vehicle.
    *   Status badges show real-time weather/road advisory info.

### US-113: Direct Vendor Messenger
*   **User Story:** As a tourist, I want to message a hostel owner or driver directly, so that I can negotiate prices or ask about specific local requirements.
*   **Acceptance Criteria:**
    *   "Contact Vendor" button opens a lightweight chat interface.
    *   Supports text messaging even on low-signal SCOM networks.

---

## 🚗 Sprint 2: Vendor Persona (Hotels, Drivers & Guides)

### US-201: Live Calendar & Inventory Control
*   **User Story:** As a hostel manager in Skardu, I want to block specific room numbers on the app’s calendar when manual walk-in clients arrive, so that I can avoid double-booking errors.
*   **Acceptance Criteria:**
    *   Vendor dashboard features an interactive grid calendar.
    *   Tapping a date/room blocks it instantly across all client applications.

### US-202: Specialized Route Tariff Definition
*   **User Story:** As a 4x4 Prado driver, I want to set different daily rates based on the terrain difficulty (e.g., Higher base rate for Deosai vs. Standard rate for Khaplu), so that my fuel and maintenance margins are protected.
*   **Acceptance Criteria:**
    *   Driver portal displays a route matrix listing major Baltistan drop points.
    *   Driver can customize flat rates per route entry field.

### US-203: Offline Trip Completion Sync
*   **User Story:** As a mountain driver, I want to mark a specific excursion milestone as "Completed" while deep in a valley with no internet, so that the trip tracking syncs automatically once I reach cellular range.
*   **Acceptance Criteria:**
    *   App allows status updates locally while data signals are unavailable.
    *   Background workers automatically push cached state updates to the core API server once an active network socket connection reconnects.

### US-204: SMS-Lite Registration (Offline Bootstrap)
*   **User Story:** As a vendor in a remote valley with no internet, I want to send a basic registration code via SMS, so that my business is indexed on the platform even before I can travel to a city for full setup.
*   **Acceptance Criteria:**
    *   System recognizes formatted SMS payloads for Hotel and Transport registration.
    *   Admin receives a "Low-Signal Placeholder" alert to follow up with the vendor.

### US-205: Multi-Vehicle Fleet Management
*   **User Story:** As a transport company owner, I want to add 5 different drivers and vehicles to my dashboard, so that I can manage my entire business from a single account.
*   **Acceptance Criteria:**
    *   Vendor dashboard supports a "Add Team Member" feature for drivers.
    *   Fleet owner can view the real-time sync status of all active trips in their fleet.

### US-206: Vendor Profile Boosting
*   **User Story:** As a vendor, I want to pay for a "Featured" slot in my valley, so that I get more bookings during the off-season.
*   **Acceptance Criteria:**
    *   Vendor portal includes a "Promote My Listing" payment button.
    *   Featured items are marked with a star/badge in the tourist search results.

### US-207: Detailed Property & Room Onboarding
*   **User Story:** As a hotel owner, I want to add my property and multiple room types (e.g. Standard Dorm vs Luxury Suite) with photos and specific features, so that tourists can see exactly what I offer and book with confidence.
*   **Acceptance Criteria:**
    *   Wizard includes a "Room Management" step to add/edit individual inventory items.
    *   UI provides a checklist of amenities for quick tagging (View, WiFi, etc.).
    *   Supports multiple image uploads per room category.

### US-208: Vehicle Fleet & Driver Asset Detail
*   **User Story:** As a driver/fleet owner, I want to register my vehicle details (Model, Plate, AC, 4x4) and my own profile (Languages, Trek Experience), so that tourists can pick the best driver for their needs.
*   **Acceptance Criteria:**
    *   Driver portal includes "Add Vehicle" with feature toggles (AC/Heater/Roof Rack).
    *   Profile setup includes language multi-select and experience tags.
    *   Supports vehicle photo gallery uploads.

---

## 👑 Sprint 3: Super Admin Persona (Platform Control)

### US-301: Automated Financial Escrow Split
*   **User Story:** As the platform owner, I want the system to automatically deduct our 10% platform commission from a booking payment and move the remaining 90% balance into the respective vendor's digital wallet ledger, so that manual accounting overhead is eliminated.
*   **Acceptance Criteria:**
    *   The system calculates vendor shares instantly upon checkout confirmation.
    *   An admin ledger updates the specific platform profit account and vendor wallet balances automatically.

### US-302: Driver KYC & Compliance Validation
*   **User Story:** As a platform risk admin, I want to review submitted copies of driver's licenses, vehicle registrations, and **Passenger Liability Insurance**, so that I can approve or deny their listing on the open marketplace.
*   **Acceptance Criteria:**
    *   Admin panel displays a pending approval queue with document image viewers.
    *   The document checklist includes Insurance and Professional Certifications.
    *   Approving a vendor appends a "Verified Profile" badge visible on the tourist frontend UI.

### US-303: Physical Hub Verification (High-Trust)
*   **User Story:** As a local administrator in Skardu, I want to mark a vendor as "Physically Vetted" after they bring their original documents to my desk, so that they can earn a "Gold Badge" for maximum trust.
*   **Acceptance Criteria:**
    *   Admin tool includes a toggle for "Physical Documents Verified at Hub".
    *   Profile badges on the frontend differentiate between Digital and Physical verification levels.

### US-304: Manual Vendor & Inventory Control
*   **User Story:** As a Super Admin, I want to add/remove a vendor or specific asset manually, so that I maintain high quality and professional standards on the platform.
*   **Acceptance Criteria:**
    *   Interface includes "Add Vendor" and "Delete Asset" buttons for the core registry.
    *   Changes propagate instantly to the tourist search results.

### US-305: Global Pricing & Market Override
*   **User Story:** As a Super Admin, I want to override vendor pricing globally, so that I can control market rates during peak seasons or prevent price gouging.
*   **Acceptance Criteria:**
    *   Admin can set a category-wide price (e.g., all 4x4 Prado = Rs. 18,000).
    *   A "Global Surge" toggle allows percentage-based increases across the entire platform.

### US-306: Full-Stack Trip Resolution
*   **User Story:** As a Super Admin, I want to manage all aspects of a trip (change stay, switch driver, adjust price), so that I can resolve complex customer support issues or emergency logistics.
*   **Acceptance Criteria:**
    *   Admin search for "Trip ID" allows editing any field in an active booking.
    *   The system logs all admin overrides for audit trails.
