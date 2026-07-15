# Datenbankschema (MVP)

Local: JSON unter `data/`. Production: Postgres via Supabase (`migrations/001_init.sql`).
JS-Datenmodell spiegelt SQL-Tabellen 1:1.

## Entities
### users
id uuid PK · email text unique lowercase · password_hash text (scrypt+salt lokal / auth.users Supabase)
role enum('extra','production','admin') · email_verified bool · verification_token text
created_at ts · last_login ts

### profiles (1:1 user, role=extra)
user_id uuid FK · first_name, last_name text · dob date (->Alter) · gender enum
height_cm int · weight_kg int · hair_color enum(braun,blond,schwarz,rot,grau,gefaerbt)
eye_color enum(blau,braun,gruen,gray,sonstige) · ethnicity text · city, plz text
radius_km int (Reisebereitschaft) · skills text[] · bio text
selfie_due_at ts (Pflicht alle 6 Mon, nur Live-Capture) · selfie_verified_at ts
consents jsonb {image_rights, data_share, biometric, accepted_version} · visible bool
created_at, updated_at ts

### photos
id uuid · user_id uuid FK · kind enum('portrait','full','selfie')
data text (komprimiertes JPEG base64 lokal / Storage-URL Supabase) · width,height int · created_at ts

### productions (role=production)
user_id uuid FK · company text · contact_name text · created_at ts

### bookings (Kalender + Abrechnung)
id uuid · extra_id uuid FK · production_id uuid FK · title text · date_start,date_end ts
location text · day_rate numeric · status enum(angefragt,bestaetigt,abgerechnet) · created_at ts

### shortlists (Merkzettel/Warenkorb Caster)
id uuid · production_id uuid FK · extra_ids uuid[] · name text · created_at ts

### site_settings (editierbare Rechtstexte)
key text ('impressum','agb','privacy','company_name',...) · value text
separate_imprint_address text (optional abweichend)

## Sicherheit
- Keine Secrets im Frontend.
- Lokal: crypto.scrypt (salt + 64-byte), timing-safe Vergleich.
- Supabase: Auth durch Supabase, RLS: Extras nur EIGENE Daten; Produktionen nur visible=true; Admin alles.
- Selfie = biometrische Daten (DSGVO Art. 9): nur mit explizitem Opt-in, nur Live-Capture.
