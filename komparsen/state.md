# STATE.md — Fortschritt (immer aktuell halten!)

Letztes Update: 2026-07-15 (Review-Runde + Security/DSGVO-Härtung abgeschlossen)
Projekt: Komparsen-Agentur "Kast"
Pfad: /opt/data/projects/komparsen/  (persistent, gleiches Volume wie /workspace)
WICHTIG: /workspace war root-owned & NICHT beschreibbar → hier gebaut. Bei Freigabe 1:1 verschieben.

## Status: PRODUKTIONSREIF FÜR LOKALEN BETRIEB (MVP komplett)
- 46 E2E-Tests GRÜN (tests/e2e.js): Auth, Double-Opt-In, Profil, Consents, Fotos,
  Suche (DSGVO-sicher, keine E-Mail), Warenkorb-Export, Admin, Buchung+Confirm,
  ADAG-Export, Settings, Auto-Login, Rollen-Schutz, Account-Löschung.
- Security: zentrale Auth-Guard (kein Datenleck mehr), Rollenprüfung auf Admin-Routen.
- DSGVO: Live-Selfie-Pflicht, explizite Art.-9-Einwilligung, E-Mail nicht in Suche,
  Account-Löschung (Art. 17) implementiert + im UI erreichbar.

## Was läuft / verifiziert
- Server startet sauber (PORT env, default 4173), null Dependencies.
- Alle Flows per HTTP echt durchgetestet.

## Bekannte Blocker / Limitationen (Bewusst, für später)
- Mail ist gemockt (data/mailbox/*.txt) — kein echter SMTP/Supabase-Mail.
- Kein Rate-Limit auf Login (Brute-Force-Schutz fehlt noch).
- Kein HTTPS/CSP in lokaler Entwicklung (Produktion nötig).
- /workspace nicht beschreibbar (root-owned, kein sudo). Workaround: /opt/data/projects/komparsen/.

## Nächste Aktionen
1. Frontend manuell im Browser gegenchecken (Visuell: keine KI-Slop, Apple-Stil).
2. Echte Mail + Rate-Limit vor Live-Gang.
3. Backup erneuern: `cd /opt/data/projects/komparsen && zip -r backups/komparsen_backup.zip . -x 'data/db.json' 'data/mailbox/*'`
