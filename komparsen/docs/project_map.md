# Projekt-Map: Komparsen-Agentur "Kast"

## Vision
Extras registrieren sich in 2 Minuten inkl. Foto-Upload; Produktionen suchen per Filter
oder Freitext und legen Extras in einen Merkzettel ("Warenkorb"). Alles automatisiert,
DSGVO-sicher, skalierbar. Apple-Stil: clean, seriös, aber jung & modern — nicht steif.

## Tech-Entscheidungen (Stand MVP)
- **Laufzeitkosten jetzt = 0.** Reiner Node.js-Server (eingebaute Module, KEIN npm install),
  Datenschicht als lokale JSON-Datei unter `data/`.
- **Supabase-ready:** Schema als SQL-Migration (`migrations/001_init.sql`) vorbereitet.
  Wechsel später 1:1, ohne App-Code zu ändern.
- **Auth:** E-Mail + Passwort mit persistenter Session (Cookie), "Angemeldet bleiben" wie Gmail.
  Double-Opt-In Pflicht. Magic-Link & 2FA = Phase 2 (Platzhalter vorhanden).
- **Frontend:** Vanilla HTML/CSS/JS, System-Font, Apple-Neutralpalette. Kein Framework, kein Build.
- **Design (hart):** KEIN Lila, KEIN "KI-Slop" (keine Verläufe/glows, keine generischen
  "Mach mir eine Website"-Optik). Seriös aber jung, nicht steif.

## Ordnerstruktur
```
/opt/data/projects/komparsen/
├── CONTINUE.md            # Neue-Chat-Sicherheit (immer zuerst lesen!)
├── state.md               # Fortschritt (Mensch-lesbar)
├── server.js              # Null-Dep Node-Server (HTTP + API + statisch)
├── lib/
│   ├── db.js              # Datenschicht (JSON jetzt / Supabase später) + Seed
│   ├── auth.js            # Register/Login/Sessions/Double-Opt-In
│   ├── util.js            # Helpers (id, slug, sanitize, validation)
│   └── export.js          # ADAG-Abrechnungs-Export
├── public/
│   ├── styles.css         # Apple-Design-System
│   ├── app.js             # Client-Routing + API-Calls
│   ├── compress.js        # Clientseitige Bildkomprimierung (Canvas)
│   ├── index.html         # Landing
│   ├── login.html, onboarding.html, search.html
│   ├── dashboard.html (Admin), admin.html (Site-Settings), impressum.html, kalender.html
├── migrations/001_init.sql  # Postgres + RLS (Supabase)
├── contracts/             # AGB Extra, Produktionsvertrag, DSGVO-Checkliste
├── data/                  # JSON-State (zur Laufzeit)
└── backups/               # ZIP-Backups
```

## Rollen
1. **Extra (Komparse):** Registriert, baut Profil, lädt Fotos, Selfie alle 6 Mon (nur Live).
2. **Produktion (Caster):** Sucht Extras, Merkzettel/Warenkorb, Export. Abspann-Credit später per Vertrag.
3. **Admin (Agentur/Leon):** Dashboard mit aktiven To-dos, Rechtstexte editierbar, Kalender, ADAG-Export.

## Roadmap
- **Phase 1 (jetzt):** Onboarding + Foto + DB + Admin-Grundgerüst + Caster-Suche + Merkzettel + Kalender + ADAG-Export.
- **Phase 2:** Magic-Link, 2FA, echte Mail-Versendung, Bild-Tagging.
- **Phase 3:** Vision-Modell ("Wikinger-Typ"), Abspann-Credit-Verträge, eigene Abrechnung.
