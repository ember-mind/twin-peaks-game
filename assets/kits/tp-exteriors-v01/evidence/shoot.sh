#!/bin/sh
# shoot.sh — every page capture in this folder, headless Chrome, one at a time.
# Serve the worktree root first:  python3 -m http.server 8793 --bind 127.0.0.1
# usage: sh evidence/shoot.sh [port] [python]
PORT=${1:-8793}; PY=${2:-python3}
HERE=$(cd "$(dirname "$0")" && pwd)
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="http://127.0.0.1:$PORT/test/kit-exteriors.html?paused=1&capture=2"
until mkdir /tmp/lt-chrome.lock 2>/dev/null; do sleep 2; done
trap 'rmdir /tmp/lt-chrome.lock' EXIT
shot() {   # name width height query
  "$CH" --headless=new --mute-audio --enable-unsafe-swiftshader --use-angle=swiftshader --hide-scrollbars \
    --window-size=$2,$3 --virtual-time-budget=6000 --screenshot="$HERE/$1.png" "$URL&$4" 2>/dev/null
}
shot overview-dusk 1408 704 "start=1190"
shot overview-day 1408 704 "start=780"
shot overview-night 1408 704 "start=60"
shot overview-debug 1408 704 "start=1190&debug=1"
shot follow-double-r-out-dusk 512 384 "door=double_r&dir=out&start=1185"
shot follow-double-r-in-dusk 512 384 "door=double_r&dir=in&start=1185"
shot follow-sheriff-out-dusk 512 384 "door=sheriff&dir=out&start=1185"
shot follow-sheriff-in-dusk 512 384 "door=sheriff&dir=in&start=1185"
shot follow-double-r-in-night 512 384 "door=double_r&dir=in&start=30"
shot follow-sheriff-out-day 512 384 "door=sheriff&dir=out&start=760"
for g in dusk day night; do $PY "$HERE/compare.py" $g; done
