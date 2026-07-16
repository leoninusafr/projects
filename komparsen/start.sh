#!/usr/bin/env bash
# KAST — Startet Node-Server + Cloudflare-Tunnel, hält beide am Leben.
# Aufruf:  bash start.sh   (läuft im Vordergrund; mit & oder als Dienst starten)
set -u
cd "$(dirname "$0")"

PORT="${PORT:-4173}"
CLOUDFLARED="${CLOUDFLARED:-/tmp/cloudflared}"
URL_FILE="${URL_FILE:-/opt/data/home/kolour-proj/komparsen/.tunnel_url}"
LOG_DIR="${LOG_DIR:-/opt/data/home/kolour-proj/komparsen/.logs}"
mkdir -p "$LOG_DIR"

echo "[kast] starte Node-Server auf 0.0.0.0:$PORT …"
node server.js >> "$LOG_DIR/server.log" 2>&1 &
SRV=$!
echo "[kast] Server-PID $SRV"

# kurz warten, bis Server lauscht
for i in $(seq 1 20); do
  if curl -s -o /dev/null "http://localhost:$PORT/"; then break; fi
  sleep 0.5
done

echo "[kast] starte Cloudflare-Tunnel …"
"$CLOUDFLARED" tunnel --url "http://localhost:$PORT" --no-autoupdate >> "$LOG_DIR/tunnel.log" 2>&1 &
TUN=$!
echo "[kast] Tunnel-PID $TUN"

# URL aus dem Tunnel-Log fischen und in Datei schreiben (für cron/Status)
( tail -f "$LOG_DIR/tunnel.log" 2>/dev/null | grep --line-buffered -o 'https://[a-z0-9-]*\.trycloudflare\.com' | while read -r u; do
    echo "$u" > "$URL_FILE"
    echo "[kast] Tunnel-URL: $u"
  done ) &

# Watchdog: falls einer der Prozesse stirbt, neu starten
while true; do
  if ! kill -0 "$SRV" 2>/dev/null; then
    echo "[kast] Server tot -> restart"; node server.js >> "$LOG_DIR/server.log" 2>&1 & SRV=$!
  fi
  if ! kill -0 "$TUN" 2>/dev/null; then
    echo "[kast] Tunnel tot -> restart"; "$CLOUDFLARED" tunnel --url "http://localhost:$PORT" --no-autoupdate >> "$LOG_DIR/tunnel.log" 2>&1 & TUN=$!
  fi
  sleep 10
done
