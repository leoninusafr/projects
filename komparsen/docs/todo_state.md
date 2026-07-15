# TODO-State (YOLO-Aufbau)

## Erledigt
- [x] Entscheidungen + Brainstorm (3 Sichten)
- [x] docs/ (project_map, database_schema, todo_state, competitive_analysis)
- [x] CONTINUE.md + state.md (neue-Chat-Sicherheit)
- [x] Ordnerstruktur unter /opt/data/projects/komparsen/ (persistent)
- [x] Null-Dep Node-Server + JSON-Datenschicht (Supabase-ready)
- [x] Apple-Design-System (CSS, keine KI-Slop)
- [x] Auth: Register/Login, Double-Opt-In, Sessions (30 Tage)
- [x] Extra-Onboarding: Profil + Selfie-Pflicht (Live-Capture) + Consents (Art. 9)
- [x] Foto-Upload mit clientseitiger JS-Kompression
- [x] Caster-Suche (Filter + Freitext) + Merkzettel/Warenkorb + CSV-Export
- [x] Admin-Dashboard + editierbare Rechtstexte (Impressum etc.)
- [x] Kalender + Booking-Confirm + ADAG-Abrechnungs-Export
- [x] Supabase-Migration (Schema + RLS) in migrations/001_init.sql
- [x] Vertragsvorlagen (AGB Extra, Produktionsvertrag, DSGVO-Checkliste)
- [x] **E2E-Test-Suite (tests/e2e.js) — 46 Assertions, ALLE GRÜN**
- [x] **SECURITY-FIX: Auth-Guard war No-Op → Datenleck geschlossen (401 ohne Login)**
- [x] **DSGVO-FIX: E-Mail aus Suchergebnis entfernt**
- [x] **BUG-FIX: /api/impressum Handler fehlte → ergänzt**
- [x] **BUG-FIX: Confirm-Booking falscher Index → gebessert**
- [x] **FEATURE: Auto-Login nach Opt-In (verify?redirect=1) → Onboarding 2-4 funktioniert**
- [x] **DSGVO: Consent-Werte echt ausgelesen (vorher hart true)**
- [x] **AUTHZ: requireRole(['admin']) auf dashboard/kalender/admin + 403.html**
- [x] **FEATURE: /api/photo/:id → echte Fotos in Suche**
- [x] **DSGVO: Account-Löschung (Art. 17) DELETE /api/profile/me + UI-Button in Nav**
- [x] **UX: nav.js dynamischer Login/Logout/Delete-Status in Nav**

## Offen / Nächste Schritte
- [ ] Echte Mail-Versendung (aktuell mockSendMail → data/mailbox/)
- [ ] rate-limit / brute-force-schutz auf Login
- [ ] HTTPS + CSP-Header (Produktion)
- [ ] Warenkorb→WhatsApp-Anfrage (Phase 2)
- [ ] Vision-Modell ("Wikinger-Typ") Suche (Phase 3)
- [ ] Markenname final? (Platzhalter "Kast")
- [ ] Tagessatz-Defaults pro Region

## Wie testen?
1. Server starten: `node /opt/data/projects/komparsen/server.js`
2. E2E: `node /opt/data/projects/komparsen/tests/e2e.js` (Server muss laufen, Port 4173)
3. Browser: http://localhost:4173
