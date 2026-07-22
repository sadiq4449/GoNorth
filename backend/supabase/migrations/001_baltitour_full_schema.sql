-- BaltiTour full schema (matches SQLAlchemy models)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(32),
  role VARCHAR(20) NOT NULL DEFAULT 'tourist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(20) NOT NULL,
  valley VARCHAR(100) NOT NULL DEFAULT 'Skardu',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  solo_safe BOOLEAN NOT NULL DEFAULT false,
  women_friendly BOOLEAN NOT NULL DEFAULT false,
  gold_badge BOOLEAN NOT NULL DEFAULT false,
  description TEXT NOT NULL DEFAULT '',
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'none',
  physically_vetted BOOLEAN NOT NULL DEFAULT false,
  featured_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  valley VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS fleet_drivers (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL DEFAULT '',
  languages_json TEXT NOT NULL DEFAULT '[]',
  experience_years INTEGER NOT NULL DEFAULT 0,
  route_knowledge TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  price_per_night INTEGER NOT NULL,
  amenities_json TEXT NOT NULL DEFAULT '[]',
  images_json TEXT NOT NULL DEFAULT '[]',
  hidden BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  model VARCHAR(255) NOT NULL,
  plate VARCHAR(32) NOT NULL,
  driver_name VARCHAR(255) NOT NULL,
  is_4x4 BOOLEAN NOT NULL DEFAULT false,
  has_ac BOOLEAN NOT NULL DEFAULT false,
  daily_rate INTEGER NOT NULL,
  languages_json TEXT NOT NULL DEFAULT '[]',
  images_json TEXT NOT NULL DEFAULT '[]',
  features_json TEXT NOT NULL DEFAULT '[]',
  model_year INTEGER,
  fleet_driver_id VARCHAR(36) REFERENCES fleet_drivers(id),
  hidden BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS guides (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255) NOT NULL,
  daily_rate INTEGER NOT NULL,
  languages_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS season_pricing (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  room_id VARCHAR(36) REFERENCES rooms(id) ON DELETE SET NULL,
  season VARCHAR(10) NOT NULL,
  multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS route_tariffs (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vehicle_id VARCHAR(36) REFERENCES vehicles(id) ON DELETE SET NULL,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  terrain_type VARCHAR(100) NOT NULL DEFAULT 'Mountain Road',
  daily_rate INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  reference VARCHAR(32) NOT NULL UNIQUE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  traveler_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  emergency_contact VARCHAR(64),
  blood_group VARCHAR(8),
  destination VARCHAR(100) NOT NULL,
  stops_json TEXT NOT NULL DEFAULT '[]',
  enable_pooling BOOLEAN NOT NULL DEFAULT false,
  check_in VARCHAR(16),
  nights INTEGER NOT NULL,
  guests INTEGER NOT NULL,
  room_id VARCHAR(36) NOT NULL,
  vehicle_id VARCHAR(36) NOT NULL,
  guide_ids_json TEXT NOT NULL DEFAULT '[]',
  line_items_json TEXT NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  points_redeemed INTEGER NOT NULL DEFAULT 0,
  points_discount INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  voucher_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_bookings_reference ON bookings(reference);

CREATE TABLE IF NOT EXISTS escrow_entries (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  platform_share INTEGER NOT NULL,
  vendor_share INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'held',
  release_at TIMESTAMPTZ,
  release_scheduled_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_lat DOUBLE PRECISION,
  completion_lng DOUBLE PRECISION,
  geofence_flag BOOLEAN NOT NULL DEFAULT false,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_kyc (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  cnic VARCHAR(20) NOT NULL,
  cnic_name VARCHAR(255) NOT NULL,
  account_title VARCHAR(255) NOT NULL,
  payout_method VARCHAR(20) NOT NULL,
  account_number VARCHAR(34) NOT NULL,
  cnic_front_url TEXT NOT NULL DEFAULT '',
  cnic_back_url TEXT NOT NULL DEFAULT '',
  license_url TEXT NOT NULL DEFAULT '',
  insurance_url TEXT NOT NULL DEFAULT '',
  title_match_ok BOOLEAN NOT NULL DEFAULT false,
  cnic_match_ok BOOLEAN NOT NULL DEFAULT false,
  penny_verified BOOLEAN NOT NULL DEFAULT false,
  penny_code VARCHAR(16),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  admin_notes TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_wallets (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  pending_balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id VARCHAR(36) PRIMARY KEY,
  wallet_id VARCHAR(36) NOT NULL REFERENCES vendor_wallets(id) ON DELETE CASCADE,
  entry_type VARCHAR(32) NOT NULL,
  amount INTEGER NOT NULL,
  reference VARCHAR(64) NOT NULL DEFAULT '',
  escrow_id VARCHAR(36),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ride_pools (
  id VARCHAR(36) PRIMARY KEY,
  vehicle_id VARCHAR(36) NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  departure_time VARCHAR(16) NOT NULL,
  max_seats INTEGER NOT NULL,
  private_fare INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pool_members (
  id VARCHAR(36) PRIMARY KEY,
  pool_id VARCHAR(36) NOT NULL REFERENCES ride_pools(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(32) NOT NULL DEFAULT '',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sos_alerts (
  id VARCHAR(36) PRIMARY KEY,
  booking_reference VARCHAR(32),
  traveler_name VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(32) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  sms_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  booking_reference VARCHAR(32) NOT NULL,
  sender_role VARCHAR(20) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_chat_messages_booking_reference ON chat_messages(booking_reference);

CREATE TABLE IF NOT EXISTS road_advisories (
  id VARCHAR(36) PRIMARY KEY,
  region VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  active BOOLEAN NOT NULL DEFAULT true,
  admin_override BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS balti_points_accounts (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_balti_points_accounts_email ON balti_points_accounts(email);

CREATE TABLE IF NOT EXISTS points_ledger (
  id VARCHAR(36) PRIMARY KEY,
  account_id VARCHAR(36) NOT NULL REFERENCES balti_points_accounts(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason VARCHAR(64) NOT NULL,
  booking_reference VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pricing_overrides (
  id VARCHAR(36) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  category VARCHAR(32) NOT NULL,
  fixed_rate INTEGER,
  surge_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  admin_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(32) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dispute_tickets (
  id VARCHAR(36) PRIMARY KEY,
  escrow_id VARCHAR(36) NOT NULL REFERENCES escrow_entries(id) ON DELETE CASCADE,
  booking_reference VARCHAR(32) NOT NULL,
  filed_by VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_sessions (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  gateway VARCHAR(20) NOT NULL,
  amount_pkr INTEGER NOT NULL,
  amount_usd_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'PKR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  external_id VARCHAR(128),
  checkout_url TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_batches (
  id VARCHAR(36) PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  total_amount INTEGER NOT NULL DEFAULT 0,
  vendor_count INTEGER NOT NULL DEFAULT 0,
  method VARCHAR(20) NOT NULL DEFAULT 'ibft',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_batch_items (
  id VARCHAR(36) PRIMARY KEY,
  batch_id VARCHAR(36) NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
  vendor_id VARCHAR(36) NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payout_method VARCHAR(20) NOT NULL,
  account_number VARCHAR(34) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  external_ref VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS trip_reviews (
  id VARCHAR(36) PRIMARY KEY,
  booking_reference VARCHAR(32) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_trip_reviews_booking_reference ON trip_reviews(booking_reference);

CREATE TABLE IF NOT EXISTS forum_posts (
  id VARCHAR(36) PRIMARY KEY,
  author_name VARCHAR(255) NOT NULL,
  valley VARCHAR(100) NOT NULL DEFAULT 'Skardu',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_abandonments (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  draft_json TEXT NOT NULL DEFAULT '{}',
  sms_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sms_vendor_leads (
  id VARCHAR(36) PRIMARY KEY,
  phone VARCHAR(32) NOT NULL,
  raw_message TEXT NOT NULL,
  parsed_type VARCHAR(20) NOT NULL DEFAULT 'unknown',
  business_name VARCHAR(255) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'placeholder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
