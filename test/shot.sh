#!/usr/bin/env bash
# test/shot.sh — screenshot headless di una scena del gioco.
# Uso: ./shot.sh map x y dir out.png [cluesN] [flag]
# Esempio: ./shot.sh town 30 31 up before-town.png
set -e
MAP="${1:-town}"
X="${2:-30}"
Y="${3:-31}"
DIR="${4:-up}"
OUT="${5:-/tmp/tp-shot.png}"
CLUES="${6:-}"
FLAG="${7:-}"
URL="file://$(pwd)/test/shot.html?map=${MAP}&x=${X}&y=${Y}&dir=${DIR}"
[ -n "$CLUES" ] && URL="${URL}&clues=${CLUES}"
[ -n "$FLAG" ] && URL="${URL}&flag=${FLAG}"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
exec "$CH" --headless=new --window-size=960,640 --virtual-time-budget=9000 --screenshot="$OUT" --hide-scrollbars "$URL" 2>/dev/null
