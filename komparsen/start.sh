#!/usr/bin/env bash
# KAST — Auto-Start & Restart-Wrapper.
# Startet den Node-Server und hält ihn am Leben (restart bei Crash/Exit).
# Für ZimaOS: dieses Skript beim Container-Start ausführen lassen
# (z. B. via Compose `command`, oder in die Container-Startup-Routine).
set -e
cd "$(dirname "$0")"
PORT="${PORT:-4180}"
echo "[kast] starting on :$PORT (host 0.0.0.0)"
while true; do
  echo "[kast] node server.js ($(date -Is))"
  node server.js || true
  echo "[kast] server exited ($?) — restart in 2s"
  sleep 2
done
