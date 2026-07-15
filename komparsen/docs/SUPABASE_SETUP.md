# Supabase-Setup — KAST online persistent machen

**Warum:** Netlify hat kein dauerhaftes Dateisystem. Ohne Supabase wird die JSON-DB
bei jedem Cold-Start zurückgesetzt → dein Admin verschwindet, Login schlägt fehl.
Mit Supabase sind alle Daten dauerhaft + DSGVO-sicher (Row Level Security).

## Schritt 1 — Supabase-Projekt anlegen (kostenlos, ~3 Min)
1. https://supabase.com → "Start your project" → mit GitHub einloggen.
2. "New project": Name z.B. `kast`, Region `Frankfurt (eu-central-1)` (DSGVO!),
   ein DB-Passwort setzen (aufschreiben).
3. Warten bis das Projekt bereit ist (~2 Min).

## Schritt 2 — Datenbank-Schema einspielen
1. Im Supabase-Dashboard: links **SQL Editor** → "New query".
2. Den Inhalt von `migrations/001_init.sql` reinkopieren → **Run**.
3. Fertig: alle Tabellen + RLS-Policies sind angelegt.

## Schritt 3 — Keys holen
Im Dashboard: **Project Settings → API**. Du brauchst drei Werte:
- **Project URL** → `SUPABASE_URL`  (z.B. https://abcd.supabase.co)
- **anon public** key → `SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_KEY`  (GEHEIM! nie ins Frontend/Git)

## Schritt 4 — Admin online anlegen
Lokal im Projektordner ausführen (ersetze die Werte):

```bash
cd komparsen
SUPABASE_URL="https://abcd.supabase.co" \
SUPABASE_SERVICE_KEY="eyJ...service..." \
node scripts/seed-admin-supabase.js leon63808@gmail.com '@Penis123'
```

Ausgabe "Main-Admin in Supabase angelegt" = erfolgreich.

## Schritt 5 — Netlify verbinden
Netlify-Dashboard → deine Site → **Site settings → Environment variables** → drei Variablen:
```
SUPABASE_URL         = https://abcd.supabase.co
SUPABASE_ANON_KEY    = eyJ...anon...
SUPABASE_SERVICE_KEY = eyJ...service...
```
Danach: **Deploys → Trigger deploy → Deploy site** (damit die neuen Env-Vars greifen).

## Schritt 6 — Testen
- Öffne deine Netlify-URL → `/login.html`
- Login: leon63808@gmail.com / @Penis123
- Sollte jetzt funktionieren und dauerhaft bleiben.

## Sicherheit
- `SUPABASE_SERVICE_KEY` umgeht RLS → nur serverseitig (Netlify Env), NIE im Browser.
- Der Server nutzt den Service-Key nur für Admin-Schreibvorgänge; Lesen läuft über
  RLS-geschützte Policies (Produktionen sehen nur `visible=true`).
- Passwort nach erstem Login ändern (kommt: Admin-Panel "Passwort ändern").
