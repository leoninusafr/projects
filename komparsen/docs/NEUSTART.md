# KAST — Wiederanlauf nach PC-Ausstellen / Neustart

Du kannst den PC jederzeit ausstellen. Code ist auf GitHub, Datenbank (`data/db.json`)
liegt auf der Festplatte (persistent, ext4). Beim Wiederanmachen:

## 1) Server + Tunnel starten
```bash
cd /opt/data/home/kolour-proj/komparsen
bash start.sh
```
Das startet Node-Server (Port 4173) + Cloudflare-Tunnel. Die Tunnel-URL
rotiert bei jedem Neustart — sie steht danach in `data/.tunnel_url`.

> Achtung: `api.js` (Netlify) zeigt per Default auf die **alte** Tunnel-URL.
> Nach einem Neustart mit neuer URL musst du in `netlify/functions/api.js`
> die `KAST_API_PROXY`-Konstante auf die neue URL setzen + auf Netlify redeployen
> (oder `KAST_API_PROXY` als Env-Var im Netlify-Dashboard setzen — das ist besser).

## 2) Cron-Watcher (hält Tunnel am Leben)
Falls du einen Cron-Watcher eingerichtet hast: der startet den Tunnel bei Bedarf neu.
Ohne ihn läuft nur der manuelle `start.sh`.

## 3) Prüfen, ob alles läuft
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/   # sollte 200 sein
cat data/.tunnel_url                                                  # neue Tunnel-URL
```

## 4) Daten-Backup (regelmäßig machen!)
`data/db.json` ist in `.gitignore` (sensible Nutzerdaten, gehören nicht auf GitHub).
Backup manuell ziehen:
```bash
cp data/db.json data/db.backup-$(date +%Y%m%d).json
```
Bei Bedarf Backup zurückspielen: `cp data/db.backup-DATUM.json data/db.json`
(vorher Server stoppen!).

## 5) Main-Admin-Login
- E-Mail: `leon63808@gmail.com`
- Passwort: `Kast-2026!mX9qL2v`  (bitte im Admin-Panel ändern!)
- Admin-Panel: `/admin.html`

## 6) Was wo lebt
- **Code**: GitHub (`leoninusafr/projects`, Repo `komparsen/`)
- **Frontend-Live**: Netlify (`komparsen.netlify.app`, auto-deploy bei Git-Push)
- **API-Live**: lokaler Node-Server (4173), erreichbar via Cloudflare-Tunnel
- **Daten**: `data/db.json` auf Platte (persistent)

## 7) Bekannte offene Punkte (deine To-Do's)
- [ ] GitHub-Token rotieren (altes im Git-Verlauf) — in GitHub selbst erledigen
- [ ] Echte Email (aktuell mockSendMail = Log) + echtes WhatsApp (Stub in lib/notify.js, braucht API-Key)
- [ ] Domain kaufen + UG gründen + Impressum finalisieren (dein Teil)
- [ ] Feste Cloudflare-URL (geld/domain nötig) statt rotierendem Tunnel
- [ ] KI-Suche (später)
