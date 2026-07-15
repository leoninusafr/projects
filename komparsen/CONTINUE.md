# CONTINUE.md — WICHTIG: Lies mich bei jedem neuen Chat!

Dieses Projekt liegt unter: **/opt/data/projects/komparsen/** (persistent, gleiches Volume wie /workspace).
Es wird NICHT nach /workspace geschrieben, weil /workspace root-owned ist und der Agent
(hermes, uid 10000) dort nicht schreiben darf. Falls /workspace später freigegeben wird
(`sudo chown hermes:hermes /workspace`), kann alles 1:1 dorthin verschoben werden.

## Was ist das?
Komparsen-Agentur "Kast" — Apple-Stil Plattform. Extras registrieren sich + laden Fotos,
Produktionen suchen per Filter/Freitext + Merkzettel ("Warenkorb"). Admin-Dashboard, Kalender,
ADAG-Export. Lokal-first (Node, null Deps), Supabase-ready. DSGVO-sicher.

## Wie weiterarbeiten?
1. Lies `docs/project_map.md`, `docs/database_schema.md`, `docs/todo_state.md`.
2. Lies `state.md` (Fortschritt) und `docs/todo_state.md` (Offene Punkte).
3. Server starten: `node /opt/data/projects/komparsen/server.js` → http://localhost:PORT (env PORT, default 4173)
4. Danach einfach im YOLO-Modus weiterbauen. Keine Dateien löschen, nur ergänzen.

## Hard Rules (nicht verletzen)
- KEIN Lila, KEIN "KI-Slop" im Design (keine Verläufe/glows). Apple-Neutral: #f5f5f7 / #1d1d1f / Akzent #0071e3.
- Keine laufenden Kosten jetzt → lokale JSON-DB, kein npm install notwendig.
- Selfie = biometrische Daten (DSGVO Art. 9) → nur mit Opt-in, nur Live-Capture.
- Passwörter nie im Klartext, nie Secrets im Frontend.
- Fortschritt nie verlieren → regelmäßig `docs/todo_state.md` + `state.md` updaten, Backup nach `backups/`.

## Tech
- server.js (null-dep Node http), lib/db.js (JSON jetzt), migrations/001_init.sql (Supabase später),
  public/ (HTML/CSS/JS, keine Build-Tools).
