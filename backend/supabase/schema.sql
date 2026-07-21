-- BaltiTour Iteration 1 — run in Supabase SQL Editor for production
-- Local dev uses SQLite via SQLAlchemy (same shape)

CREATE TYPE user_role AS ENUM ('tourist', 'vendor', 'admin');
CREATE TYPE vendor_type AS ENUM ('hotel', 'transport', 'guide', 'mixed');
CREATE TYPE vendor_status AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role user_role NOT NULL DEFAULT 'tourist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  vendor_type vendor_type NOT NULL,
  valley TEXT NOT NULL DEFAULT 'Skardu',
  status vendor_status NOT NULL DEFAULT 'pending',
  solo_safe BOOLEAN NOT NULL DEFAULT false,
  women_friendly BOOLEAN NOT NULL DEFAULT false,
  gold_badge BOOLEAN NOT NULL DEFAULT false,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  valley TEXT NOT NULL,
  description TEXT DEFAULT ''
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 2,
  price_per_night INT NOT NULL,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  plate TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  is_4x4 BOOLEAN NOT NULL DEFAULT false,
  has_ac BOOLEAN NOT NULL DEFAULT false,
  daily_rate INT NOT NULL,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  daily_rate INT NOT NULL,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  requires_4x4 BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  flat_rate INT NOT NULL,
  UNIQUE(vehicle_id, route_id)
);

CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT,
  status kyc_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (enable after auth wired)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved vendors" ON vendors FOR SELECT USING (status = 'approved');
CREATE POLICY "Vendor manage own" ON vendors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin all vendors" ON vendors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
