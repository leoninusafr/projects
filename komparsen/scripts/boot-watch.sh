#!/usr/bin/env bash
# KAST Boot-Watcher: läuft per Cron alle 5 Min.
# Prüft, ob Port 4173 (Node-Server) lebt; startet start.sh sonst im Hintergrund.
# So läuft KAST nach Container/PC-Neustart automatisch weiter (kein systemd nötig).
set -u
DIR=/opt/data/home/kolour-proj/komparsen
LOG="$DIR/.logs/boot-watch.log"
mkdir -p "$(dirname "$LOG")"

if curl -s -o /dev/null --max-time 3 "http://localhost:4173/"; then
  # alles ok
  exit 0
fi

echo "[boot-watch] $(date '+%F %T') Server down — starte start.sh" >> "$LOG"
# starte im Hintergrund (nochup), damit Cron nicht blockt
nohup bash "$DIR/start.sh" >> "$LOG" 2>&1 &
# gib Cron kurz Zeit
sleep 2
echo "[boot-watch] $(date '+%F %T') start.sh abgesetzt (PID $!)" >> "$LOG"
