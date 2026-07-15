# Deploy — KAST online bringen (GitHub + Netlify, €0)

## Warum?
- Laptop erreicht den lokalen Container nicht (Docker-Port-Forwarding / Firewall).
- Netlify liefert eine öffentliche URL → sofort vom Laptop/Handy erreichbar.
- GitHub = Code-Backup außerhalb des Containers (Persistenz-Sorge gelöst).

## 1. GitHub (Backup + Quelle für Netlify)
```bash
cd /opt/data/projects/komparsen
git add -A
git commit -m "KAST MVP: Auth, Suche, Buchung, ADAG, DSGVO, Netlify-ready"
# Auf GitHub: neues Repo "kast" anlegen, dann:
git remote add origin https://github.com/<dein-user>/kast.git
git push -u origin main
```

## 2. Netlify (Hosting, Gratis-Tier)
- Netlify anlegen → "Add new site" → "Import from Git" → dein `kast`-Repo.
- Build-Einstellungen (werden auch aus `netlify.toml` gezogen):
  - Build command: `echo 'no build'`
  - Publish directory: `public`
  - Functions directory: `netlify/functions`
- Deploy → du bekommst eine URL wie `https://kast-xyz.netlify.app`.

## 3. WICHTIG — Datenschicht für echten Betrieb
Netlify Functions haben KEIN persistentes Dateisystem. Die JSON-DB (`data/db.json`)
geht nach jedem Cold-Start/Deploy verloren. Für Produktion:
1. Supabase-Projekt anlegen (Grundtarif ist gratis).
2. `migrations/001_init.sql` im SQL-Editor ausführen (legt Tabellen + RLS an).
3. `lib/db.js` auf Supabase umstellen (nur diese Datei tauschen — alle Aufrufe bleiben gleich).
4. Supabase-URL + Anon-Key als Netlify Env-Vars setzen.

Bis dahin: lokal mit `node server.js` nutzen (JSON-DB persistent im Container).

## 4. Env-Vars (Netlify Dashboard → Site settings → Environment)
- `NETLIFY=1` (aktiviert Function-Modus in server.js)
- (Produktion) `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## 5. Test nach Deploy
- Öffentliche URL aufrufen → Landing lädt.
- Onboarding durchspielen → nach Verify automatisch eingeloggt.
- Suche testen → Fotos + Treffer.
- Admin: `/admin.html` nur mit Admin-Login.
