#!/bin/sh
# shoot.sh OUTDIR name "query" [name "query" ...] — native captures in headless Chrome, one at a time.
OUT=$1; shift
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
until mkdir /tmp/lt-chrome.lock 2>/dev/null; do sleep 2; done
trap 'rmdir /tmp/lt-chrome.lock' EXIT
while [ $# -gt 1 ]; do
  "$CH" --headless=new --mute-audio --enable-unsafe-swiftshader --use-angle=swiftshader --hide-scrollbars \
    --window-size=1600,1000 --virtual-time-budget=5000 --screenshot="$OUT/$1.png" \
    "http://127.0.0.1:8791/living-town/proto/continuous-map/?paused=1&$2" 2>/dev/null
  shift 2
done
