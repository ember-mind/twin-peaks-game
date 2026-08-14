#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 0 && $# -ne 2 ]]; then
  echo "usage: $0 [CHARACTER_KEY RAW_MASTER.png]" >&2
  exit 64
fi

root=$(cd "$(dirname "$0")/.." && pwd)
manifest="$root/assets/sprites/cast-manifest.json"
masters="$root/assets/sprites/cast-masters"
atlases="$root/assets/sprites/cast-16"
cast="$root/assets/sprites/cast-walkcycles-16.png"
work=$(mktemp -d "${TMPDIR:-/tmp}/tp-cast-rebuild.XXXXXX")

cd "$root"
mkdir -p "$masters" "$atlases"

if [[ $# -eq 2 ]]; then
  key=$1
  raw_master=$2
  [[ -f "$raw_master" ]] || { echo "raw master missing: $raw_master" >&2; exit 65; }
  [[ $key != cooper ]] || { echo "Cooper uses approved cooper-walkcycle master" >&2; exit 66; }
  node -e "const m=require(process.argv[1]); if(!m.characters.some(c=>c.key===process.argv[2])) process.exit(1)" "$manifest" "$key" || {
    echo "unknown character key: $key" >&2
    exit 67
  }
  magick xc:'#ED0BEB' xc:'#072619' xc:'#34572D' xc:'#6A8A43' xc:'#9AAB69' xc:'#DCD9A9' xc:'#EEE6B5' \
    +append "$work/master-palette.png"
  magick "$raw_master" -dither none -remap "$work/master-palette.png" -strip "$work/$key.png"
  cp "$work/$key.png" "$masters/$key.png"
  echo "imported $key from $raw_master"
fi

while IFS=$'\t' read -r key resize_geometry; do
  if [[ $key == cooper ]]; then
    cp assets/sprites/cooper-walkcycle-16.png "$atlases/cooper.png"
    continue
  fi
  [[ -f "$masters/$key.png" ]] || { echo "missing master: $masters/$key.png" >&2; exit 68; }
  if [[ -n $resize_geometry ]]; then
    tools/build-character-atlas.sh "$masters/$key.png" "$atlases/$key.png" "$resize_geometry" >/dev/null
  else
    tools/build-character-atlas.sh "$masters/$key.png" "$atlases/$key.png" >/dev/null
  fi
done < <(node -e "const m=require(process.argv[1]); for(const c of m.characters) console.log(c.key+'\\t'+(c.resizeGeometry||''))" "$manifest")

tools/build-cast-atlas.sh "$atlases" "$cast" >/dev/null
tools/audit-cast-atlas.sh

hash=$(shasum -a 256 "$cast" | awk '{print substr($1,1,12)}')
tag="cast-$hash"
node - "$tag" <<'NODE'
const fs = require('node:fs');
const tag = process.argv[2];
const authoredPath = 'js/retro-authored.js';
const authored = fs.readFileSync(authoredPath, 'utf8').replace(
  /cast-walkcycles-16\.png\?v=[^']+/,
  `cast-walkcycles-16.png?v=${tag}`
);
fs.writeFileSync(authoredPath, authored);
NODE

node test/cast-sprite-sheet.js
node test/retro-production.js >/dev/null

find "$work" -type f -delete
rmdir "$work"
echo "ARCHIVE CAST REBUILT: 24 characters, 216 frames, asset tag $tag; production remains native-authored"
