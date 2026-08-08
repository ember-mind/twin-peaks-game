#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 CAST-16-DIR OUT-240x240.png" >&2
  exit 64
fi

source_dir=$1
out=$2
order=(
  cooper truman lucy andy hawk
  sarah leland norma shelly loglady
  bobby donna jacoby audrey mfap
  laura gerard benhorne giant maddy
  bob james jacques ronette
)

images=()
for key in "${order[@]}"; do
  file="$source_dir/$key.png"
  [[ -f "$file" ]] || { echo "missing atlas: $file" >&2; exit 66; }
  images+=("$file")
done

blank=$(mktemp "${TMPDIR:-/tmp}/tp-cast-blank.XXXXXX.png")
magick -size 48x48 xc:none "$blank"
images+=("$blank")

magick montage "${images[@]}" -tile 5x5 -geometry 48x48+0+0 -background none -strip "$out"
find "$blank" -type f -delete
echo "$out"
