# Software Requirements Specification (SRS) & Feature Blueprint
## Project Name: BaltiTour - AI Dynamic Trip Builder
**Target Region:** Baltistan (Skardu, Shigar, Khaplu, Hunza, etc.)  
**Architecture:** Cross-Platform Mobile App (Flutter) + Backend API (Node.js/FastAPI)

---

## 1. System Overview
BaltiTour ek automated, real-time dynamic tour itinerary generator aur marketplace hai. Yeh platform Baltistan ke local vendors (Hostels/Hotels, Drivers/Car Rentals, Tour Guides) ko directly tourists ke sath connect karta hai. Iska core logic user ki custom selections ke mutabiq instant dynamically priced invoices aur offline-compatible vouchers generate karta hai.

---

## 2. Core Modules & Comprehensive Feature List

### 🌟 Module 1: Tourist Application (Frontend - Client Side)

#### A. Smart Search & AI Onboarding
*   **Location Finder:** Multi-destination input dropdown featuring major Baltistan hubs (Skardu Center, Shigar Valley, Khaplu, Deosai, Basho Valley, Hunza).
*   **Smart Meta Input:** Calendar date-picker for check-in/out, number of guests, and an optional **Max Budget (PKR)** filter.
*   **AI Package Recommender:** If the user enters a budget, the system auto-suggests the best matching combination of low-cost hostels and shared transit.

#### B. Dynamic Package Builder (The Core Engine)
*   **Stay Selection Deck:** Live listing of registered hostels/hotels filtering rooms based on guest capacity. Shows ratings, amenities, and per-night rates.
*   **Transport Marketplace:** Option to filter rides by vehicle type (4x4 Prado, HiAce Grand Cabin, Corolla GLI, Suzuki Alto) with verified driver profiles and daily rates.
*   **Cost Pooling Toggle:** A one-click checkbox: *"Share seats on this ride with other backpackers to split costs."*
*   **Add-On Activity Grid:** Multi-select options to hire specialized local tour guides (e.g., K2 Basecamp trackers, Deosai camping experts).
*   **Real-Time Cart Calculator:** Sticky floating window that automatically recalculates taxes, vendor splits, and the final booking invoice instantly upon every tap.

#### C. Seat Pooling / Social Ridesharing Marketplace
*   **Active Pool Feed:** A public dashboard showcasing ongoing group tours created by other solo backpackers or couples.
*   **Join-Pool Request:** Instant bidding/booking for a specific seat in an existing car heading to a shared destination.
*   **Dynamic Fare Division:** System automatically divides the fixed vehicle rent by the number of active passengers joining the trip.

#### D. Offline "Survivor Kit" & Vouchers (Low Connectivity Support)
*   **Local Caching (Hive/SQLite):** Automatic download of full itinerary, host addresses, and vehicle numbers when connected to internet in major cities.
*   **QR Voucher Generator:** Unique cryptographic QR codes for check-ins at hostels without requiring live database hits.
*   **Native Telephony Hooks:** Deep links to call assigned drivers or hostel managers via standard GSM cellular connections (bypassing WhatsApp/Internet).

#### E. Safety & Utility Essentials
*   **SOS Emergency Trigger:** A highly accessible red button that fetches the phone's last known GPS coordinates and broadcasts them via cellular SMS to emergency services (1122, local police) and BaltiTour control center.
*   **Live Weather & Road Alert Ticker:** High-priority warning banners fetching local NDMA/weather feeds regarding landsliding on Jaglot-Skardu Road or Babusar Top closures.

#### F. Traveler Community & Social Proof (Retention Hooks)
*   **BaltiPoints (Gamified Loyalty):** A regional loyalty program where users earn points for every PKR 100 spent. Points are redeemable for booking discounts or "Local Gift Vouchers" (e.g., free apricots/walnuts at partner shops).
*   **Visual Trek Reviews:** Capability to upload high-compression photos of treks and hostel stays to build trust within the community.
*   **Smart Abandonment Engine:** Sends automated, low-bandwidth SCOM-lite alerts (via SMS or Notification) to users with incomplete carts to encourage booking completion.
*   **Social Traveler Hub:** A lightweight community forum where solo travelers can find trekking partners or cultural exchange groups beyond simple ride-pooling.

#### G. Visual Experience & Logistics
*   **Trip Flow Timeline:** A dynamic, visual itinerary showing a day-by-day breakdown (e.g., Day 1: Arrival + Hotel X, Day 2: Trek with Guide Y + Car Z). Includes integrated 'Weather & Road Advisory' badges for each segment.
*   **Live Negotiation Messenger:** A direct, low-latency chat interface allowing tourists to message vendors for custom requests, price negotiation, or route clarifications.

#### H. Trust & Safety Suite
*   **Trust & Safety Suite:** Special "Safe for Solo Travelers" and "Women-Friendly" certifications for hostels and guides. Verified driver live-tracking (via network/SMS pings) with an option to share trip progress with emergency contacts.

---

### 💼 Module 2: Vendor Management System (App / Web Portal)

#### A. Multi-Channel Onboarding & Verification
*   **Sequential Onboarding Wizard:** A 4-step interactive flow for new vendors: 
    1. **Profile Setup:** Basic business info, contact person, and location.
    2. **Asset Inventory:** Room counts/types (Hotels) or Vehicle fleet details (Transporters).
    3. **Financial Setup:** Bank/EasyPaisa/JazzCash details for automated payouts.
    4. **Document KYC:** High-resolution uploads of licenses, insurance, and certifications.
*   **SMS-Lite Registration (Offline Bootstrap):** In areas with zero data coverage (e.g., Astore, Upper Shigar), vendors can initiate registration by sending a formatted SMS (e.g., `REG HOTEL [Name] [Rooms]`) to a designated shortcode. The system creates a placeholder account to be completed later.
*   **Physical Vetting Hubs:** Integration with physical BaltiTour service desks in Skardu and Hunza. Vendors can present original physical documents (NOCs, Insurance) for instant high-trust verification and "Gold Badge" status.

#### B. Hotel & Hostel Operators
*   **Property & Room Asset Manager (Room-Level Granularity):**
    *   **Dynamic Room Creation:** Capability for hosts to list individual rooms (Dorms, Private Suites, Family Rooms) with unique per-night pricing.
    *   **Smart Feature Tagging:** A multi-select list for vendors to highlight specific amenities (e.g., 'K2 View', 'Free WiFi', 'Hot Shower', 'Shared Kitchen'). These tags appear as visual icons on the tourist frontend.
    *   **High-Altitude Image Gallery:** Optimized image upload portal for property and individual room photos, utilizing progressive loading for low-signal areas.
*   **Inventory Calendar:** Grid view to block rooms manually for walk-in guests or open them for online app users.
*   **Dynamic Room Pricing:** Capability to set seasonal surges (high prices in July/Cherry Blossom season, discounted prices in October).

#### C. Drivers & Fleet Owners
*   **Fleet Manager Dashboard (Vehicle-Level Asset Manager):**
    *   **Multi-Vehicle Inventory:** Support for "Fleet Owners" to manage multiple drivers and vehicles under a single business entity.
    *   **Vehicle Profile Detail:** Granular tracking of asset details: Model Year, Number Plate, AC/Heater status, 4x4 capability, and Roof Rack availability.
    *   **Driver Professional Profile:** Display of driver experience (trekking routes known), language proficiency (Balti, Urdu, English), and high-resolution vehicle photos.
*   **Route-Based Tariff Matrix:** Setup panel where drivers specify specialized mountain rates (e.g., Fixed rate for Khaplu vs. Steep mountain rates for Deosai Plains).
*   **Offline Trip Sync:** Ability to mark a trip step as "Completed" inside zero-network zones, which auto-syncs with servers the moment mobile signals return.

#### D. Verification, Compliance & KYC
*   **Document Upload Portal:** Mandatory tracking for:
    *   **Drivers:** License, CNIC, Vehicle Registration, and **Passenger Liability Insurance**.
    *   **Hotels:** Business License, CNIC, and Fire Safety NOCs.
    *   **Guides:** Trekking/Climbing Certifications, First Aid Certification, and **Tourism Association Membership**.
*   **Verified Badging:** Automated display of a "Safe Profile" badge once the admin or a Physical Hub confirms document legitimacy.

#### E. Marketing & Visibility (Growth Tools)
*   **Featured Vendor Slots:** Paid "Boost" feature allowing hostels or transporters to appear at the top of the search results for specific dates or valleys.
*   **Off-Season Campaigns:** Admin-managed promotional banners for vendors to offer special discounts during the Autumn/Winter seasons.

---

### 👑 Module 3: Super Admin Control Tower (Web Dashboard - Absolute Control)

#### A. Global Inventory & Registry Management
*   **Manual Inventory Override:** Absolute power to manually add, edit, or permanently remove any Hostel, Driver, Vehicle, or Guide from the central registry regardless of vendor input.
*   **Global Pricing Override Engine:** Centralized control to set fixed base rates, apply global seasonal surges (e.g., +50% for Cherry Blossom), or mandate flat discounts across all vendors or specific categories (e.g., forcing all Corollas to a specific rate for a government event).
*   **Vendor Life-Cycle Master:** Instant tools for platform-wide vendor management:
    *   **Promotion:** Manual elevation to "Gold Badge" or "Gov Preferred" status.
    *   **Enforcement:** One-click instant suspension or permanent blacklisting of fraudulent or low-performing vendors.

#### B. Financial Ledger & Automated Escrow
*   **Commission Splitter:** Automated calculation rules mapping the flat commission (e.g., 10% platform fee) and transferring the remaining split directly into the vendor's wallet balance.
*   **Payout Settlement Ledger:** Matrix displaying cash flows, completed trip distributions, and bank transfer histories for EasyPaisa, JazzCash, and local commercial bank accounts.

#### B. Fleet Operations & Safety Monitoring
*   **Live Trip Tracker Map:** Geospatial monitoring dashboard showing current active tours inside the Baltistan region based on last-known network pings.
*   **Dispute & Review Resolution Center:** Panel to review low ratings (1-3 stars) given to drivers or hostels, with the ability to temporarily suspend fraudulent profiles.

---

## 3. Non-Functional & Technical Specifications

*   **Offline Data Architecture:** Client app uses a strict "Offline-First" sync logic via an embedded database cache.
*   **Low Bandwidth API Payload:** Rest API endpoints must use compressed JSON structures optimized for highly unstable SCOM 2G/3G connectivity networks.
*   **UI Contrast Parameters:** UI design layout requires dark themes or high-contrast elements with large legible font scales to remain usable under harsh high-altitude sun-glare.
*   **SMS Failover Strategy:** If the backend detects that a vendor is offline (no WebSocket ping for 10 minutes), any booking notification is automatically transformed and sent as a standard cellular SMS notification.
