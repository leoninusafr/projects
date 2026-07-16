# STATE.md — Fortschritt (immer aktuell halten!)

Letztes Update: 2026-07-16 (Theme-System vereinheitlicht + Impressum-Auto-Generierung)
Projekt: Komparsen-Agentur "Kast"
Pfad: /opt/data/home/kolour-proj/komparsen/ (persistent, gleiches Volume wie /workspace)

## Status: PRODUKTIONSREIF FÜR LOKALEN BETRIEB (MVP komplett)

### Verifiziert (Stand 2026-07-16)
- 46 E2E-Tests GRÜN (tests/e2e.js): Auth, Double-Opt-In, Profil, Consents,
  Fotos, Suche (DSGVO-sicher), Warenkorb-Export, Admin, Buchung+Confirm,
  ADAG-Export, Settings, Auto-Login, Rollen-Schutz, Account-Löschung.
- Security: zentrale Auth-Guard, Rollenprüfung auf Admin-Routen, Rate-Limit
  auf Login/Register (server.js RATE), Security-Header (CSP/X-Frame-Options).
- DSGVO: Live-Selfie-Pflicht, Art.-9-Einwilligung, E-Mail nicht in Suche,
  Account-Löschung (Art. 17), anonymisierte Statistik.

### Heute gebaut / gefixt (2026-07-16)
1. **THEME-SYSTEM vereinheitlicht (6 Designs):**
   block / studio / editorial / kartei / manifest / intro — alle in theme.js gemappt,
   Admin-Select (admin.html) auf alle 6 angepasst, index.html hat jetzt das
   .intro-Overlay (zuvor sperrte `intro` die Seite via overflow:hidden).
   Visuell per Browser-Tool verifiziert (Computed Styles, keine KI-Slop).
2. **TOTE CSS-LINKS ENTFERNT:** 11 HTML-Seiten referenzierten /styles-alt.css
   (gelöscht in altem Commit) → 404. Alle entfernt.
3. **IMPRESSUM AUTO-GENERIERT (§ 5 TMG / § 18 MStV):**
   - lib/db.js: getImpressum() baut das Impressum aus den strukturierten
     Admin-Feldern (owner_name/address/city/email/phone/ustid + separate_imprint_address
     + freier impressum_extra-Zusatzblock). Keine [Platzhalter] in der Ausgabe.
   - server.js /api/impressum liefert das generierte Impressum (öffentlich).
   - admin.html/admin.js: "Pflichtdaten ergänzen (Website)"-Button scrollt zum
     Website-Tab; Impressum-Vorschau (readonly) wird nach Speichern automatisch
     upgedatet. Setup-Check markiert fehlende Felder mit "!" (inkl. [..]-Platzhalter).
   - db.json: owner_*-Felder auf sichtbare Platzhalter ([Vorname Nachname] etc.)
     zurückgesetzt → Impressum zeigt ehrlich nur Firma, bis echte Daten eingetragen.
   - Migration in ensure(): fehlende site_settings-Keys (impressum_extra, owner_ustid)
     werden beim Start ergänzt.
   End-to-End verifiziert: Admin setzt owner_name="Leon Mustermann" →
     /api/impressum enthält sofort "Leon Mustermann" überall.

### Bekannte Limitationen (bewusst, für später)
- Mail ist gemockt (lib/notify.js + auth.mockSendMail → data/mailbox/*.txt).
  Echte SMTP-Verschickung noch nicht angehängt (braucht Credentials).
- Kein HTTPS in lokaler Entwicklung (CSP/Local host OK; Produktion nötig).
- /workspace war root-owned & nicht beschreibbar → hier gebaut.

### Nächste Aktionen
1. Echte Mail (SMTP) ankabeln — braucht von Leon: SMTP_HOST/USER/PASS
   (externes Secret → vorher Freigabe).
2. Production-Dashboard / Search-UI / Kalender visuell im Browser gegenchecken
   (bisher nur code-level + HTTP-200).
3. Backup erneuern: `cd /opt/data/home/kolour-proj/komparsen && zip -r backups/komparsen_backup.zip . -x 'data/db.json' 'data/mailbox/*'`
