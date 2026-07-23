import { Link } from 'react-router-dom'

/** Quick-start actions — drive conversion to core flows */
const QUICK_ACTIONS = [
  {
    title: 'Plan your trip',
    desc: 'Pick stays, 4x4 rides, and local guides with live pricing.',
    to: '/plan',
    cta: 'Open Trip Builder',
  },
  {
    title: 'Ride pools',
    desc: 'Split transport costs with other travelers heading the same way.',
    to: '/pools',
    cta: 'Browse pools',
  },
  {
    title: 'My trip',
    desc: 'View your booking pass, QR voucher, and day-by-day itinerary.',
    to: '/trip',
    cta: 'View trip',
  },
  {
    title: 'Traveler forum',
    desc: 'Find trekking partners and share tips with other Baltistan travelers.',
    to: '/forum',
    cta: 'Join forum',
  },
]

/** Revenue & platform economics — visible to investors and partners */
const BUSINESS_PILLARS = [
  {
    label: 'Platform commission',
    value: '10%',
    detail: 'Transparent fee on every booking; vendors keep 90% in escrow.',
  },
  {
    label: 'Escrow payouts',
    value: '12–48h',
    detail: 'Tiered release after trip completion — protects tourists and vendors.',
  },
  {
    label: 'Ride pool model',
    value: '120%',
    detail: 'Shared fares earn drivers more while passengers save up to 70%.',
  },
  {
    label: 'Loyalty (BaltiPoints)',
    value: 'Earn & redeem',
    detail: 'Repeat travelers redeem up to 20% at checkout.',
  },
  {
    label: 'Vendor boost',
    value: 'Featured slots',
    detail: 'Paid visibility for hostels and transporters in peak valleys.',
  },
  {
    label: 'Payments',
    value: 'PK + global',
    detail: 'JazzCash · EasyPaisa (PKR) · Stripe cards (USD) for foreign tourists.',
  },
]

/** Full SRS feature map — aligned with features.md / userstories.md */
const FEATURE_MODULES = [
  {
    id: 'tourist',
    icon: '🏔️',
    title: 'Tourist Application',
    subtitle: 'Discovery, booking, safety, and retention for travelers',
    groups: [
      {
        name: 'Smart Search & AI Onboarding',
        items: [
          'Multi-destination hubs: Skardu, Shigar, Khaplu, Deosai, Basho, Hunza',
          'Budget-aware AI Magic Build with Backpacker, Adventure, and Luxury vibes',
          'Live meta filters: dates, guests, max budget (PKR), solo-safe & women-friendly',
        ],
      },
      {
        name: 'Dynamic Package Builder',
        items: [
          'Stay deck with expandable room cards, amenity icons, and per-night rates',
          'Transport marketplace: 4x4 Prado, HiAce, Corolla, Alto with driver profiles',
          'Multi-leg route builder — add stops across valleys on one invoice',
          'Real-time cart: stay + transport + guides with instant 10% platform fee',
          'Seat pooling toggle at checkout for shared transport savings',
        ],
      },
      {
        name: 'Seat Pooling Marketplace',
        items: [
          'Active pool feed with seats left and cost-per-seat (120% economics)',
          'Join or leave pools; fare recalculates as passengers change',
          'Driver earns more on pooled trips; passengers save vs private hire',
        ],
      },
      {
        name: 'Offline Survivor Kit',
        items: [
          'IndexedDB cache of confirmed bookings for zero-signal valleys',
          'Cryptographic QR vouchers — check-in without live database hits',
          'Auto-redirect to My Trip when offline; GSM tel: links to call drivers',
        ],
      },
      {
        name: 'Safety & Utility',
        items: [
          'Global SOS button — GPS + SMS to 1122 and control tower',
          'Live road & weather advisory ticker (NDMA-style alerts)',
          '4x4 terrain engine — Deosai/Basho enforce compatible vehicles',
          'Optional Trip Safety Profile: emergency contact & blood group',
        ],
      },
      {
        name: 'Community & Retention',
        items: [
          'BaltiPoints loyalty — earn per PKR spent, redeem up to 20% at checkout',
          'Visual trek reviews with optional photo links',
          'Cart abandonment SMS reminders for incomplete bookings',
          'Traveler forum — find partners beyond ride pooling',
        ],
      },
      {
        name: 'Trip Experience',
        items: [
          'Day-by-day Trip Flow timeline with advisory badges per segment',
          'Vendor chat per booking — negotiate routes and custom requests',
          'Trust badges: Solo-safe, Women-friendly, Gold Partner, Featured',
        ],
      },
    ],
  },
  {
    id: 'vendor',
    icon: '💼',
    title: 'Vendor Management',
    subtitle: 'Onboarding, inventory, compliance, and growth for local operators',
    groups: [
      {
        name: 'Multi-Channel Onboarding',
        items: [
          '4-step KYC wizard: profile, inventory, payout wallet, document upload',
          'SMS-lite registration (REG HOTEL / REG TRANSPORT) for zero-data areas',
          'Physical vetting at Skardu/Hunza hubs → Gold Partner badge',
        ],
      },
      {
        name: 'Hotel & Hostel Operators',
        items: [
          'Room-level inventory: dorms, suites, family rooms with amenity tags',
          'Calendar block/unblock for walk-ins vs online availability',
          'Seasonal pricing multipliers (peak cherry blossom, off-season discounts)',
          'Supabase Storage image uploads for property and room galleries',
        ],
      },
      {
        name: 'Drivers & Fleet Owners',
        items: [
          'Multi-vehicle fleet with driver profiles, languages, and experience tags',
          'Route tariff matrix — flat rates per destination and terrain difficulty',
          'Offline trip completion queue — syncs when signal returns',
        ],
      },
      {
        name: 'Compliance & Payouts',
        items: [
          'Document portal: CNIC, licenses, insurance, trekking certifications',
          'Penny-test wallet verification (JazzCash/EasyPaisa title match)',
          'Vendor wallet + escrow release after QR completion handshake',
        ],
      },
      {
        name: 'Marketing & Visibility',
        items: [
          'Featured vendor boost — paid top-of-search placement by valley',
          'Platform Verified and Gold Partner badges on tourist listings',
        ],
      },
    ],
  },
  {
    id: 'admin',
    icon: '👑',
    title: 'Admin Control Tower',
    subtitle: 'Platform operations, finance, safety, and market control',
    groups: [
      {
        name: 'Inventory & Registry',
        items: [
          'Global asset registry — create vendors, hide rooms/vehicles instantly',
          'Vendor lifecycle: approve, suspend, physical vet, featured status',
          'Global pricing override — category caps and surge multipliers',
        ],
      },
      {
        name: 'Financial Ledger & Escrow',
        items: [
          'Automated 10% commission split on every confirmed booking',
          'Escrow FSM: pending → held → release_scheduled → paid | disputed',
          'Payout batches to IBFT, JazzCash, or EasyPaisa for approved KYC vendors',
        ],
      },
      {
        name: 'Operations & Safety',
        items: [
          'Live fleet map — active trips with last-known GPS pings',
          'Dispute center — hold escrow, resolve refund or release',
          'KYC review queue with document checklist',
          'SOS alert log, road advisory management, audit trail on trip edits',
        ],
      },
    ],
  },
]

export default function FeaturesSection() {
  return (
    <>
      <section className="container home-business" id="business-model">
        <div className="home-business-header">
          <span className="section-eyebrow">Business model</span>
          <h2>Built to scale revenue and trust</h2>
          <p>
            GoNorth is a marketplace — not a tour agency. Vendors set inventory and rates;
            the platform earns commission, escrow protects both sides, and loyalty drives repeat bookings.
          </p>
        </div>
        <div className="home-business-grid">
          {BUSINESS_PILLARS.map((p) => (
            <div key={p.label} className="home-business-card">
              <span className="home-business-label">{p.label}</span>
              <strong>{p.value}</strong>
              <p>{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container home-features" id="features">
        <div className="home-features-header">
          <span className="section-eyebrow">Features</span>
          <h2>Everything in one platform</h2>
          <p>
            Core and advanced capabilities from the product specification — tourist booking,
            vendor operations, and admin control in a single Baltistan-focused marketplace.
          </p>
        </div>
        <div className="home-feature-grid">
          {QUICK_ACTIONS.map((f) => (
            <Link key={f.to} to={f.to} className="home-feature-card">
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="home-feature-cta">{f.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-features-deep">
        <div className="container">
          {FEATURE_MODULES.map((mod) => (
            <article key={mod.id} className="feature-module" id={`features-${mod.id}`}>
              <header className="feature-module-header">
                <span className="feature-module-icon" aria-hidden>{mod.icon}</span>
                <div>
                  <h3>{mod.title}</h3>
                  <p>{mod.subtitle}</p>
                </div>
              </header>
              <div className="feature-module-grid">
                {mod.groups.map((group) => (
                  <div key={group.name} className="feature-group-card">
                    <h4>{group.name}</h4>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container home-vendor-cta">
        <div className="home-vendor-cta-inner">
          <div>
            <h2>Grow with GoNorth</h2>
            <p>
              List rooms, vehicles, or guide services. Complete KYC once, receive escrow payouts
              after every trip, and boost visibility during off-season.
            </p>
          </div>
          <Link to="/vendor/login" className="btn-secondary-link">Vendor portal →</Link>
        </div>
      </section>
    </>
  )
}
