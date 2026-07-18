# KAST — Security & Härtung

Status: durch Audt-Tests verifiziert (siehe Beweise unten). Stand: 2026-07-18.

## Architektur-Grundlagen
- **Datenhaltung**: lokale JSON-DB (`data/db.json`, In-Memory + debounced persist).
  **Kein SQL** → SQL-Injection strukturell **unmöglich** (es werden nie
  Query-Strings gebaut).
- **Passwörter**: scrypt + per-user salt (`lib/util.js` `hashPassword`/`verifyPassword`,
  timing-safe `crypto.timingSafeEqual`). Nie im Klartext gespeichert.
- **Sessions**: httpOnly-Cookie, Signatur, Ablaufzeit. Kein JWT im LocalStorage.

## Geprüfte Vektoren (alle grün)
| Test | Methode | Ergebnis |
|---|---|---|
| Path Traversal (`/../server.js`, `/../../etc/passwd`) | curl `--path-as-is` | 403/404 — Datei-Leak blockt (`startsWith(PUBLIC)`-Check in `serveStatic`) |
| SQL Injection | — | unmöglich (kein SQL) |
| XSS via Nutzer-Input (Name `<script>`) | register + `esc()`-Ausgabe | escaped, kein Exec |
| Auth-Bypass (Admin-Routen ohne Login) | `/api/admin/*` ohne Cookie | 401 |
| Passwort-Änderung ohne Auth | `/api/account/change-password` | 401 |
| Malformed Input (Array statt String) | register | graceful 400/error |
| Email-Verifizierung erzwungen | Login blockt bei `email_verified=false` | Double-Opt-In enforced |

## Offene Punkte (nicht Code, sondern Infra/Betrieb)
- [ ] **HTTPS terminierung**: aktuell über Cloudflare-Tunnel (TLS da). Bei eigenem
      Domain+Reverse-Proxy: HSTS + TLS1.3 erzwingen.
- [ ] **Rate-Limiting / Login-Throttle**: serverseitig noch nicht — bei öffentlichem
      Betrieb Brute-Force-Schutz (z.B. 5 Versuche / 15 Min) ergänzen.
- [ ] **CORS**: aktuell nur same-origin (Frontend = gleiche Origin via Tunnel/Netlify
      Proxy). Bei neuen Clients explict allowlist pflegen, nie `*`.
- [ ] **Secrets**: Brevo-Key/etc. via `.env` (in `.gitignore`), nie im Repo.
- [ ] **Backup**: `data/db.json` liegt lokal — regelmäßiges Offsite-Backup (verschlüsselt).
- [ ] **Dependencies**: Projekt ist Null-Dependency (nur Node-Builtins) → Supply-Chain-
      Risiko minimal. Bei neuen Paketen `npm audit` pflegen.

## Main-Admin
- E-Mail: `leon63808@gmail.com`
- Passwort: in `data/db.json` (gesetzt 2026-07-18), NICHT in Git/Memory.
  Im Admin-Panel unter „Mein Konto" jederzeit änderbar.
