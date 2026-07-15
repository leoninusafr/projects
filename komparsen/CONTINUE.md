# CONTINUE.md — KAST Komparsen-Agentur

**Stand:** 2026-07-15 · Letzter Push: `e6ec164` auf `github.com/leoninusafr/projects` (Ordner `komparsen/`)
**Lokal:** `/opt/data/projects/komparsen/` (persistent, überlebt Container-Reset)
**Status:** Frontend + API funktionsfähig, 47 E2E-Tests grün. Läuft lokal via `node server.js` (Port per `PORT=xxxx`).

## Was fertig ist
- **DSGVO-konform:** Suche/Fotos/Export NUR für eingeloggte Produktion/Admin (Gast = 401). Gäste sehen nur aggregierte, anonyme Teaser-Stats (`/api/stats/public`).
- **Onboarding:** Rollenwahl (Komparse / "Ich suche Komparsen"), Firmenfeld optional, Selfie-Consent (Art.9), Double-Opt-In.
- **Login:** Auto-Erkennung der Rolle → Weiterleitung (Produktion/Extra→Suche, Admin→Dashboard).
- **Landing:** Apple-simple, "Mitgliedschaft kostenlos", Pitch, Zitat, Social-Footer.
- **SEO/GEO:** Meta/OG/JSON-LD + `robots.txt` + `sitemap.xml`.
- **Authz:** Rollen-Gates (Extra kein Admin, Produktion kein Export ohne Login etc.).
- **Persistenz lokal:** JSON-DB in `data/db.json` + gemockte Mailbox in `data/mailbox/`.

## Was NOCH offen (Priorität)
1. **Supabase-Backend** — Netlify Functions haben KEIN persistentes FS. `lib/db.js` muss auf Supabase umgestellt werden (Migration `migrations/001_init.sql` bereit). Sonst gehen auf Netlify alle Daten nach Cold-Start verloren.
2. **Domain:** Platzhalter `kast.example` in index.html (canonical, og:url, sitemap) → echte Domain ersetzen.
3. **Social-Links:** `instagram.com/kast` / `linkedin.com/company/kast` sind Platzhalter.
4. **PAT rotieren** — GitHub-Token stand im Chat im Klartext (in Memory gespeichert, aber rotieren!).

## Wie weiterarbeiten (im neuen Chat)
- Sag "weiter an KAST" oder referenziere diese Datei.
- Lokaler Test: `cd /opt/data/projects/komparsen && PORT=4202 node server.js` → Browser `http://localhost:4202`.
- E2E: `BASE=http://localhost:4202 node tests/e2e.js` (muss vor jedem Commit grün sein).
- Deploy: Netlify importiert `projects`-Repo, Base dir = `komparsen`, sonst liest `netlify.toml` alles (publish=`public`, functions=`netlify/functions`).

## Wichtige Konventionen (vom User)
- KEINE Emojis im Code, nur inline-SVG-Icons.
- KEINE lila Farben, KEIN "KI-Slop" (Glows/Gradients).
- Apple-simple Design, "seriös aber jung".
- DSGVO ist kritisch.
- Alles lokal-first, zero-dependency (reines Node, kein npm install).
- Fortschritt NIEMALS löschen, lieber appenden. Zip-Backup bei größeren Schritten.
