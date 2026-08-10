#!/usr/bin/env bash
# test/shot.sh — screenshot headless di una scena del gioco.
# Uso: ./shot.sh map x y dir out.png [cluesN] [flag]
# Esempio: ./shot.sh town 30 31 up before-town.png
#
# Opzioni additive (la CLI posizionale storica resta valida):
#   --seed=N --season=summer --wet=true|false
#   --frame=N --frames=N --step-ms=N --time-ms=N --motion=idle|walk|route
#   --character-view=side|threeq --export-frames=/tmp/frames
#   --strip --labels=false --suppress-on-enter
#   --page=test/presentation-harness.html --stop=01
#   --retro  (usa il renderer 2D di produzione)
#   --stop-param=shot --ready-prefix=B4-SHOT-
#   --timeout-ms=20000 --base-url=http://... --gpu=auto|metal|swiftshader
set -euo pipefail
MAP="${1:-town}"
X="${2:-30}"
Y="${3:-31}"
DIR="${4:-up}"
OUT="${5:-/tmp/tp-shot.png}"
shift $(( $# >= 5 ? 5 : $# ))
CLUES=""
FLAG=""
if [[ $# -gt 0 && "$1" != --* ]]; then CLUES="$1"; shift; fi
if [[ $# -gt 0 && "$1" != --* ]]; then FLAG="$1"; shift; fi

SEED=104729
SEASON=summer
WET=""
FRAME=0
FRAMES=1
STEP_MS=100
TIME_MS=1000
MOTION=idle
CHARACTER_VIEW=""
EXPORT_FRAMES_DIR=""
STRIP=0
LABELS=1
SUPPRESS_ON_ENTER=0
SETTLE_MS=900
MAX_SETTLE_MS=6000
PAGE="test/shot.html"
STOP=""
STOP_PARAM=shot
READY_PREFIX=TP-SHOT-READY
TIMEOUT_MS=15000
BASE_URL=""
EXTRA_FLAGS=""
RETRO=0
CH="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
GPU="${TP_SHOT_GPU:-}"

die() { echo "shot.sh: $*" >&2; exit 2; }
for arg in "$@"; do
  case "$arg" in
    --seed=*) SEED="${arg#*=}" ;;
    --season=*) SEASON="${arg#*=}" ;;
    --wet=*) WET="${arg#*=}" ;;
    --frame=*) FRAME="${arg#*=}" ;;
    --frames=*) FRAMES="${arg#*=}" ;;
    --step-ms=*) STEP_MS="${arg#*=}" ;;
    --time-ms=*) TIME_MS="${arg#*=}" ;;
    --motion=*) MOTION="${arg#*=}" ;;
    --character-view=*) CHARACTER_VIEW="${arg#*=}" ;;
    --export-frames=*) EXPORT_FRAMES_DIR="${arg#*=}" ;;
    --strip) STRIP=1 ;;
    --labels=false|--labels=0) LABELS=0 ;;
    --labels=true|--labels=1) LABELS=1 ;;
    --suppress-on-enter) SUPPRESS_ON_ENTER=1 ;;
    --settle-ms=*) SETTLE_MS="${arg#*=}" ;;
    --max-settle-ms=*) MAX_SETTLE_MS="${arg#*=}" ;;
    --page=*) PAGE="${arg#*=}" ;;
    --stop=*) STOP="${arg#*=}" ;;
    --stop-param=*) STOP_PARAM="${arg#*=}" ;;
    --ready-prefix=*) READY_PREFIX="${arg#*=}" ;;
    --timeout-ms=*) TIMEOUT_MS="${arg#*=}" ;;
    --base-url=*) BASE_URL="${arg#*=}" ;;
    --flags=*) EXTRA_FLAGS="${arg#*=}" ;;
    --retro) RETRO=1 ;;
    --chrome=*) CH="${arg#*=}" ;;
    --gpu=*) GPU="${arg#*=}" ;;
    *) die "opzione sconosciuta: $arg" ;;
  esac
done

[[ "$MAP" =~ ^[A-Za-z0-9_-]+$ ]] || die "map non valida: $MAP"
[[ "$X" =~ ^-?[0-9]+$ && "$Y" =~ ^-?[0-9]+$ ]] || die "coordinate non valide: $X,$Y"
[[ "$DIR" =~ ^(up|down|left|right)$ ]] || die "direzione non valida: $DIR"
[[ "$PAGE" =~ ^[A-Za-z0-9_./-]+$ && "$PAGE" != *".."* ]] || die "pagina non valida: $PAGE"
[[ "$SEASON" =~ ^(spring|summer|autumn|winter)$ ]] || die "stagione non valida: $SEASON"
[[ -z "$WET" || "$WET" =~ ^(true|false|0|1)$ ]] || die "wet deve essere true o false"
[[ "$MOTION" =~ ^(idle|walk|route)$ ]] || die "motion deve essere idle, walk o route"
[[ -z "$CHARACTER_VIEW" || "$CHARACTER_VIEW" =~ ^(side|threeq)$ ]] ||
  die "character-view deve essere side o threeq"
[[ "$SEED" =~ ^[0-9]+$ && "$FRAME" =~ ^[0-9]+$ && "$FRAMES" =~ ^[1-9][0-9]*$ ]] ||
  die "seed/frame/frames non validi"
[[ "$STEP_MS" =~ ^[1-9][0-9]*$ && "$TIME_MS" =~ ^[0-9]+$ &&
   "$SETTLE_MS" =~ ^[0-9]+$ && "$MAX_SETTLE_MS" =~ ^[0-9]+$ &&
   "$TIMEOUT_MS" =~ ^[1-9][0-9]*$ ]] || die "timing non valido"
[[ -z "$STOP" || "$STOP" =~ ^[A-Za-z0-9._-]+$ ]] || die "stop non valido: $STOP"
[[ "$STOP_PARAM" =~ ^[A-Za-z][A-Za-z0-9_-]*$ ]] || die "stop-param non valido"
[[ -z "$GPU" || "$GPU" =~ ^(auto|metal|swiftshader)$ ]] || die "gpu non valida: $GPU"
[[ -x "$CH" ]] || die "Chrome non trovato: $CH"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_PID=""
SERVER_LOG="$(mktemp "${TMPDIR:-/tmp}/tp-shot-server.XXXXXX")"
CAPTURE_LOG="$(mktemp "${TMPDIR:-/tmp}/tp-shot-capture.XXXXXX")"
mkdir -p "$(dirname "$OUT")"
TMP_OUT="$(mktemp "$(dirname "$OUT")/.tp-shot.XXXXXX")"
cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$SERVER_LOG" "$CAPTURE_LOG" "$TMP_OUT"
}
trap cleanup EXIT

if [[ -z "$BASE_URL" ]]; then
  PORT=$((18000 + ($$ % 20000)))
  python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >"$SERVER_LOG" 2>&1 &
  SERVER_PID=$!
  BASE_URL="http://127.0.0.1:${PORT}"
fi
READY=0
for _ in $(seq 1 60); do
  if curl -fsS "${BASE_URL}/${PAGE}" >/dev/null 2>&1; then READY=1; break; fi
  sleep 0.05
done
if [[ "$READY" != 1 ]]; then
  echo "shot.sh: server non raggiungibile: ${BASE_URL}/${PAGE}" >&2
  sed -n '1,80p' "$SERVER_LOG" >&2
  exit 2
fi

if [[ "$RETRO" == 1 ]]; then
  PAGE="test/retro-scene.html"
  READY_PREFIX="TP-RETRO-READY"
  URL="${BASE_URL}/${PAGE}?map=${MAP}&x=${X}&y=${Y}&dir=${DIR}&seed=${SEED}&season=${SEASON}&frame=${FRAME}&frames=${FRAMES}&stepMs=${STEP_MS}&motion=${MOTION}&suppressOnEnter=${SUPPRESS_ON_ENTER}"
  [[ -n "$WET" ]] && URL="${URL}&wet=${WET}"
  [[ -n "$EXTRA_FLAGS" ]] && URL="${URL}&flags=${EXTRA_FLAGS}"
elif [[ "$PAGE" == "test/shot.html" ]]; then
  URL="${BASE_URL}/${PAGE}?map=${MAP}&x=${X}&y=${Y}&dir=${DIR}&seed=${SEED}&season=${SEASON}&frame=${FRAME}&frames=${FRAMES}&stepMs=${STEP_MS}&timeMs=${TIME_MS}&motion=${MOTION}&strip=${STRIP}&labels=${LABELS}&settleMs=${SETTLE_MS}&maxSettleMs=${MAX_SETTLE_MS}&suppressOnEnter=${SUPPRESS_ON_ENTER}"
  [[ -n "$CHARACTER_VIEW" ]] && URL="${URL}&characterView=${CHARACTER_VIEW}"
  [[ -n "$EXPORT_FRAMES_DIR" ]] && URL="${URL}&exportFrames=1"
  [[ -n "$WET" ]] && URL="${URL}&wet=${WET}"
  [[ -n "$CLUES" ]] && URL="${URL}&clues=${CLUES}"
  [[ -n "$FLAG" ]] && URL="${URL}&flag=${FLAG}"
  [[ -n "$EXTRA_FLAGS" ]] && URL="${URL}&flags=${EXTRA_FLAGS}"
else
  [[ -n "$STOP" ]] || die "--page richiede --stop"
  URL="${BASE_URL}/${PAGE}?${STOP_PARAM}=${STOP}"
fi

GPU_ARG=()
[[ -n "$GPU" ]] && GPU_ARG=(--gpu="$GPU")
FRAMES_ARG=()
[[ -n "$EXPORT_FRAMES_DIR" ]] && FRAMES_ARG=(--frames-dir="$EXPORT_FRAMES_DIR")
if ! node "$ROOT/test/capture-chrome.js" \
  --chrome="$CH" --url="$URL" --output="$TMP_OUT" \
  --width=960 --height=640 --ready-prefix="$READY_PREFIX" \
  --timeout-ms="$TIMEOUT_MS" "${GPU_ARG[@]}" "${FRAMES_ARG[@]}" >"$CAPTURE_LOG" 2>&1; then
  echo "shot.sh: cattura fallita per $URL" >&2
  sed -n '1,160p' "$CAPTURE_LOG" >&2
  exit 2
fi
node "$ROOT/test/verify-shot.js" "$TMP_OUT" 960 640
mv -f "$TMP_OUT" "$OUT"
