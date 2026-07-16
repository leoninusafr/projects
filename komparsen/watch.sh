#!/usr/bin/env bash
# KAST — Watcher: prüft ob Tunnel lebt, schreibt aktuelle URL nach .tunnel_url.
# Als cron (z.B. jede Minute) laufen lassen. Meldet bei Änderung nichts
# (URL steht in der Datei); startet bei Bedarf neu via start.sh-Logik.
set -u
DIR="/opt/data/home/kolour-proj/komparsen"
PORT="${PORT:-4173}"
CLOUDFLARED="${CLOUDFLARED:-/tmp/cloudflared}"
URL_FILE="$DIR/.tunnel_url"
LOG="$DIR/.logs/watcher.log"
mkdir -p "$DIR/.logs"

NOW=$(date '+%Y-%m-%d %H:%M:%S')

# 1) Ist der Node-Server überhaupt up?
if ! curl -s -o /dev/null --max-time 5 "http://localhost:$PORT/"; then
  echo "$NOW [watch] Server antwortet nicht -> starte start.sh neu" >> "$LOG"
  # start.sh im Hintergrund neu starten (killt alte, startet frisch)
  pkill -f "cloudflared tunnel" 2>/dev/null
  pkill -f "node server.js" 2>/dev/null
  sleep 1
  bash "$DIR/start.sh" >> "$LOG" 2>&1 &
  echo "$NOW [watch] start.sh neu gestartet" >> "$LOG"
  exit 0
fi

# 2) Tunnel-URL aus Datei lesen + prüfen, ob sie noch antwortet
URL=""
[ -f "$URL_FILE" ] && URL="$(cat "$URL_FILE")"
if [ -n "$URL" ] && curl -s -o /dev/null --max-time 6 "$URL/"; then
  echo "$NOW [watch] OK ($URL)" >> "$LOG"
else
  echo "$NOW [watch] Tunnel nicht erreichbar -> Restart Tunnel" >> "$LOG"
  pkill -f "cloudflared tunnel" 2>/dev/null
  sleep 1
  "$CLOUDFLARED" tunnel --url "http://localhost:$PORT" --no-autoupdate >> "$DIR/.logs/tunnel.log" 2>&1 &
  echo "$NOW [watch] neuer Tunnel gestartet" >> "$LOG"
fi
