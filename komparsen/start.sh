#!/usr/bin/env bash
# KAST — Startet Node-Server + Cloudflare-Tunnel, hält beide am Leben.
# Robust für Dauerbetrieb: fängt SIGTERM, restart-loop, keine Zombie-Forks.
# Aufruf:  bash start.sh   (Vordergrund; als Dienst via nohup/Screen/Cron)
set -u
cd "$(dirname "$0")"

PORT="${PORT:-4173}"
CLOUDFLARED="${CLOUDFLARED:-/tmp/cloudflared}"
URL_FILE="${URL_FILE:-/opt/data/home/kolour-proj/komparsen/.tunnel_url}"
LOG_DIR="${LOG_DIR:-/opt/data/home/kolour-proj/komparsen/.logs}"
mkdir -p "$LOG_DIR"

cleanup() {
  echo "[kast] shutdown …"
  [ -n "${SRV:-}" ] && kill "$SRV" 2>/dev/null
  [ -n "${TUN:-}" ] && kill "$TUN" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

start_server() {
  node server.js >> "$LOG_DIR/server.log" 2>&1 &
  SRV=$!
  echo "[kast] Server-PID $SRV"
}
start_tunnel() {
  "$CLOUDFLARED" tunnel --url "http://localhost:$PORT" --no-autoupdate >> "$LOG_DIR/tunnel.log" 2>&1 &
  TUN=$!
  echo "[kast] Tunnel-PID $TUN"
}

start_server
# warten bis Server lauscht
for i in $(seq 1 20); do
  if curl -s -o /dev/null "http://localhost:$PORT/"; then break; fi
  sleep 0.5
done

start_tunnel

# URL aus Tunnel-Log fischen
( tail -f "$LOG_DIR/tunnel.log" 2>/dev/null | grep --line-buffered -o 'https://[a-z0-9-]*\.trycloudflare\.com' | while read -r u; do
    echo "$u" > "$URL_FILE"
    echo "[kast] Tunnel-URL: $u"
  done ) &

# Watchdog: restart bei Tod (mit Delay gegen Spin)
while true; do
  if ! kill -0 "${SRV:-}" 2>/dev/null; then
    echo "[kast] Server tot -> restart"; sleep 2; start_server
  fi
  if ! kill -0 "${TUN:-}" 2>/dev/null; then
    echo "[kast] Tunnel tot -> restart"; sleep 2; start_tunnel
  fi
  sleep 10
done
