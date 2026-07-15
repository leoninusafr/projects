# Competitive Analysis — deutsche Komparsen-Agenturen

Recherchiert aus Erfahrung mit: Casterjob, Moviebird, KomparsenCheck, Castforward, Myers, Tempus.

## Was die Konkurrenz oft falsch macht (Vermeidungsliste)
1. **Veraltete, überladene UIs.** Viele Seiten sehen aus wie 2010: kleine Schrift, dichte
   Tabellen, keine Mobile-Optimierung. → Wir: Apple-Stil, Mobile-First, viel Weißraum.
2. **Endlose Registrierungsformulare.** Extras brechen ab. → Wir: 2-Min-Onboarding,
   modulares Formular, Fortschritt sichtbar.
3. **Riesige, unkomprimierte Fotos** → langsames Laden. → Wir: clientseitige Komprimierung beim Upload.
4. **Suche nur als Filter-Liste, keine Freitext.** Caster müssen exakt wissen, welche Felder es gibt.
   → Wir: Filter + Freitext ("braune Haare, groß, Köln") kombiniert.
5. **Kommunikation außerhalb der Plattform** (E-Mail/Telefon). → Wir: Anfragen in-Plattform,
   Extra klickt nur Ja/Nein, Benachrichtigung (später WhatsApp).
6. **Keine Transparenz bei Daten/Rechten.** → Wir: klarer Consent-Screen, verständlich formuliert.
7. **Kein Self-Service für Agentur** (Rechtstexte im HTML hartcodiert). → Wir: editierbar im Admin.

## Was wir von ihnen übernehmen (Bewährt)
- Klare Rollentrennung Extra / Produktion.
- Merkzettel/Kurzliste pro Caster (wir nennen es "Warenkorb" — intuitiver).
- Tagessatz-Angabe pro Extra für Abrechnung.
- Impressum/AGB/DSGVO als Pflichtseiten (rechtlich nötig in DE).

## Unser Differenzierungs-Vorteil
- Selfie-alle-6-Monate-Pflicht (Live-Capture) → immer aktuelle DB, einzigartig.
- "Warenkorb"-Modell für Produktionen (wie Online-Shop) → extrem simple Buchung.
- Automatisierung: Anfrage→Extra→Bestätigung→Booking→ADAG-Export ohne Agentur-Handschlag.
- Abspann-Credit "Komparsen: Kast" als vertragliches Upsell (Phase 3).
