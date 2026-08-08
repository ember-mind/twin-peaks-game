#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "usage: $0 MASTER.png OUT-48x48.png [RESIZE_GEOMETRY]" >&2
  exit 64
fi

master=$1
out=$2
resize_geometry=${3:-12x16\>}
read -r width height < <(magick identify -format '%w %h\n' "$master")

if [[ "$width" -ne "$height" || $((width % 3)) -ne 0 ]]; then
  echo "master must be square with dimensions divisible by 3: ${width}x${height}" >&2
  exit 65
fi

cell=$((width / 3))
work=$(mktemp -d "${TMPDIR:-/tmp}/tp-character-atlas.XXXXXX")

for row in 0 1 2; do
  for col in 0 1 2; do
    frame=$((row * 3 + col))
    magick "$master" \
      -crop "${cell}x${cell}+$((col * cell))+$((row * cell))" +repage \
      -alpha on -fuzz 14% -transparent '#ED0BEB' \
      -trim +repage \
      -filter point -resize "$resize_geometry" \
      -gravity south -background none -extent 16x16 \
      -strip \
      "$work/frame-${frame}.png"
  done
done

magick montage \
  "$work/frame-0.png" "$work/frame-1.png" "$work/frame-2.png" \
  "$work/frame-3.png" "$work/frame-4.png" "$work/frame-5.png" \
  "$work/frame-6.png" "$work/frame-7.png" "$work/frame-8.png" \
  -tile 3x3 -geometry 16x16+0+0 -background none -strip "$out"

# Fixed project palette, preserving alpha. ImageMagick maps each opaque pixel to
# nearest listed color; transparent background remains transparent.
magick xc:'#072619' xc:'#34572D' xc:'#6A8A43' xc:'#9AAB69' xc:'#DCD9A9' xc:'#EEE6B5' \
  +append "$work/palette.png"
magick "$out" -alpha extract "$work/alpha.png"
magick "$out" -alpha off -dither none -remap "$work/palette.png" "$work/color.png"
magick "$work/color.png" "$work/alpha.png" -alpha off -compose CopyOpacity -composite -strip "$out"

find "$work" -type f -delete
rmdir "$work"

echo "$out"
