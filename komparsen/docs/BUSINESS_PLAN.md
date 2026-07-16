# Business Plan — KAST (Komparsen-Agentur)

> Stand: Juli 2026 · Gründer: Leon (20, Hamburg, Student) · Status: MVP live, erste Kartei im Aufbau

---

## 1. Was ist KAST?

KAST ist eine **Komparsen-Agentur (Casting / Nebendarsteller-Vermittlung)**, die komplett digital, DSGVO-konform und maximal automatisiert läuft. Statt Excel-Listen und Telefon-Ketten verbindet KAST Produktionen in Sekunden mit passenden Komparsen — über eine selbstlaufende Plattform.

**Kernversprechen:**
- **Für Komparsen:** In 2 Minuten Profil anlegen, Foto hochladen, gefunden werden — kostenlos, datenschutzkonform, jederzeit löschbar.
- **Für Produktionen:** Filtern („braune Haare, groß, Köln"), Anfrage mit einem Klick, Export auf Knopfdruck (ADAG-konform).
- **Für den Betreiber (dich):** Ein Admin-Panel, das fast alles allein regelt. Du baust erst die Kartei, dann läuft der Vermittlungsbetrieb automatisch.

---

## 2. Markt & Problem

- Deutschland hat eine **große, aber unorganisierte** Komparsen-Szene. Casting-Büros arbeiten oft mit veralteten Mitteln (Mail, Telefon, Excel).
- Produktionen brauchen **schnell, lokal, verlässlich** passende Gesichter — und scheuen Aufwand + DSGVO-Risiko.
- Komparsen wollen **einfach sichtbar** sein, ohne Agentur-Vertragszwang oder Gebühren.

**KAST positioniert sich als die digitale, seriöse, DSGVO-sichere Alternative.**

---

## 3. Umsatzmodell (skalierbar, rechtssicher)

| Quelle | Mechanik | Phase |
|---|---|---|
| **Vermittlungsgebühr** | Produktion zahlt pro gebuchtem Komparse (z.B. 10–15% vom Tagessatz oder Pauschale) | ab Go-Live |
| **Premium-Listing** | Komparsen können Sichtbarkeit boosten (optional, keine Pflicht) | später |
| **Produktions-Abo** | Monatliche Flat für Casting-Teams mit Dauerbedarf | später |
| **White-Label** | KAST-Software an andere Casting-Büros lizenzieren | Vision |

**Warum das funktioniert:** Erst sammeln wir eine **große, kostenlose Kartei** (Komparsen zahlen nichts). Sobald das Volumen da ist, zahlen nur Produktionen — klassisches Two-Sided-Marketplace-Modell.

---

## 4. Recht & DSGVO (Gründungspfeiler)

KAST ist von Tag 1 **DSGVO-konform**:
- Double-Opt-In für alle Accounts.
- Biometrische Daten (Casting-Fotos) nur mit **separater, ausdrücklicher Einwilligung** (Art. 9 DSGVO).
- Selfie-Live-Check alle 6 Monate (Kamera-zwingend, kein Galerie-Upload) → „lebendig + aktuell".
- Jeder Nutzer kann Profil + Fotos **selbst löschen**.
- Keine Weitergabe an Dritte ohne Einwilligung.
- Barrierefrei (Screenreader/ARIA) für Inklusion + rechtliche Absicherung (BITV).

> **Hinweis:** Dies ist kein Rechtsgutachten. Vor Go-Live empfiehlt sich ein DSGVO-Check durch einen Fachanwalt (siehe Roadmap).

---

## 5. Technisches Setup (Null-Dependency, sicher)

- **Server:** Node.js (Null-Dependency, eigener Server) — kein Framework-Overhead, leicht auditierbar.
- **Daten:** Lokale JSON-DB (DSGVO: Daten bleiben in deiner Hand) oder optional Supabase (falls Cloud-Sync nötig).
- **Frontend:** Vanilla HTML/CSS/JS — schnell, barrierefrei, kein Build-Chaos.
- **Deploy:** Netlify (Frontend, auto-deploy per Git) + persistenter Node-Server (API via Proxy).
- **Erreichbarkeit:** Cloudflare-Tunnel (sicher, kein Portforward, kein Router-Loch).
- **Security:** scrypt-Hashing, Rate-Limiting, Session-Tokens, keine bekannten Libraries → kleine Angriffsfläche.

---

## 6. Roadmap

| Phase | Ziel | Status |
|---|---|---|
| **0. MVP** | Server, Register/Login, Admin, Suche, Selfie-Check | ✅ live |
| **1. Kartei-Aufbau** | Social-Kampagne: tausende Komparsen erfassen | ⏳ jetzt |
| **2. Produktionen** | Anfrage/Booking/Export, WhatsApp+Mail-Notify | geplant |
| **3. Automatisierung** | KI-Suche („Viking-Typ"), Auto-Matching, Re-Verify | geplant |
| **4. Monetarisierung** | Vermittlungsgebühr, Premium, Abo | geplant |
| **5. Recht** | UG gründen, DSGVO-Audit, Impressum final | Leons Teil |

---

## 7. Was du (Leon) bis Go-Live noch tun musst

1. **Domain kaufen** (z.B. `kast.de` ~10 €/Jahr) — optional, `komparsen.netlify.app` geht auch kostenlos.
2. **UG anmelden** (Gewerbe/UG) — rechtliche Absicherung.
3. **Social-Accounts** anlegen (Instagram/LinkedIn) — Texte liegen bereit.
4. **Impressum vervollständigen** (Adresse, Kontakt) — im Admin-Panel `!`-Marker führt dich.
5. **GitHub-Token rotieren** (Sicherheit).

**Alles andere läuft automatisch.**

---

## 8. Risiken & Mitigation

| Risiko | Mitigation |
|---|---|
| DSGVO-Verstoß | Double-Opt-In, Art-9-Einwilligung, Löschbarkeit, Audit |
| Zu wenig Komparsen | Aggressive, kostenlose Social-Kampagne Phase 1 |
| Hackerangriff | Null-Deps, scrypt, Rate-Limit, keine externen Secrets im Repo |
| Rechtliche Grauzonen (Arbeitsvertrag) | Rechtscheck vor Go-Live, ggf. nur Vermittlung (kein Arbeitgeber) |

---

*KAST — Vom Profil zum Set. Kostenlos werden. In Sekunden finden.*
