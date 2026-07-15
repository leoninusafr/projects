-- KAST — Supabase/Postgres Migration (Phase 2, wenn Geld verdient wird)
-- Lokal wird JSON genutzt; dieses Schema spiegelt lib/db.js 1:1.
-- Aktivieren: supabase db push / psql -f 001_init.sql

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,            -- nur lokal; bei Supabase Auth via auth.users
  role text not null default 'extra' check (role in ('extra','production','admin')),
  email_verified boolean default false,
  verification_token text,
  created_at timestamptz default now(),
  last_login timestamptz
);

create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  first_name text, last_name text, dob date,
  gender text check (gender in ('weiblich','männlich','divers')),
  height_cm int, weight_kg int,
  hair_color text check (hair_color in ('braun','blond','schwarz','rot','grau','gefaerbt')),
  eye_color text check (eye_color in ('blau','braun','gruen','grau','sonstige')),
  ethnicity text, city text, plz text, radius_km int,
  skills text[],
  bio text,
  selfie_due_at timestamptz,
  selfie_verified_at timestamptz,
  consents jsonb default '{}'::jsonb,
  visible boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  kind text check (kind in ('portrait','full','selfie')),
  data text,                    -- bei Supabase: Storage-URL; lokal base64
  width int, height int,
  created_at timestamptz default now()
);

create table if not exists productions (
  user_id uuid primary key references users(id) on delete cascade,
  company text, contact_name text, created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  extra_id uuid references users(id) on delete cascade,
  production_id uuid references users(id) on delete cascade,
  title text, date_start timestamptz, date_end timestamptz,
  location text, day_rate numeric(10,2), status text default 'angefragt',
  created_at timestamptz default now()
);

create table if not exists shortlists (
  id uuid primary key default gen_random_uuid(),
  production_id uuid references users(id) on delete cascade,
  extra_ids uuid[], name text, created_at timestamptz default now()
);

create table if not exists site_settings (
  key text primary key, value text, separate_imprint_address text
);

-- ===== Row Level Security (RLS) =====
alter table users enable row level security;
alter table profiles enable row level security;
alter table photos enable row level security;
alter table bookings enable row level security;
alter table productions enable row level security;

-- Extras sehen nur sich selbst
create policy "self_read" on profiles for select using (auth.uid() = user_id);
create policy "self_write" on profiles for all using (auth.uid() = user_id);

-- Produktionen sehen nur sichtbare Profile (für Suche)
create policy "public_visible" on profiles for select using (visible = true);

-- Fotos: nur Eigentümer; Produktionen nur sichtbare
create policy "photo_owner" on photos for all using (auth.uid() = user_id);
create policy "photo_visible" on photos for select using (
  exists (select 1 from profiles p where p.user_id = photos.user_id and p.visible = true)
);

-- Bookings: beteiligte sehen ihre; Admin alles
create policy "booking_involved" on bookings for select using (
  auth.uid() = extra_id or auth.uid() = production_id
);

-- Hinweis: Admin-Rechte über Supabase-Rolle (service_role) oder JWT-Claim.
-- Selfie = Art.9 DSGVO: nur mit consents->>'biometric'='true' verarbeiten.
