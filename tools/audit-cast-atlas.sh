#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
manifest="$root/assets/sprites/cast-manifest.json"
cast="$root/assets/sprites/cast-walkcycles-16.png"
allowed='072619|34572D|6A8A43|9AAB69|DCD9A9|EEE6B5'

[[ $(magick identify -format '%wx%h' "$cast") == 240x240 ]] || {
  echo "invalid cast atlas dimensions" >&2
  exit 70
}

count=0
while IFS= read -r key; do
  file="$root/assets/sprites/cast-16/$key.png"
  [[ -f "$file" ]] || { echo "missing $key" >&2; exit 71; }
  [[ $(magick identify -format '%wx%h' "$file") == 48x48 ]] || {
    echo "$key: invalid dimensions" >&2
    exit 72
  }
  colors=$(magick "$file" -unique-colors txt:- | sed -nE 's/.*#([0-9A-Fa-f]{8}).*/\1/p')
  while IFS= read -r rgba; do
    rgb=${rgba:0:6}
    alpha=${rgba:6:2}
    [[ $alpha == 00 || $alpha == FF ]] || { echo "$key: partial alpha $rgba" >&2; exit 73; }
    [[ $alpha == 00 ]] && continue
    [[ $rgb =~ ^($allowed)$ ]] || { echo "$key: foreign color $rgba" >&2; exit 74; }
  done <<< "$colors"
  count=$((count + 1))
done < <(node -e "const m=require(process.argv[1]); for(const c of m.characters) console.log(c.key)" "$manifest")

[[ $count -eq 24 ]] || { echo "expected 24 characters, got $count" >&2; exit 75; }
echo "CAST-ATLAS-AUDIT PASS: 24 characters, 9 frames each, fixed palette, binary alpha"
