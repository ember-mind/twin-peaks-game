#!/bin/sh
# Rebuild the whole kit: plates, ground, objects, day/night grades.
# usage: sh build-all.sh [python]
set -e
PY=${1:-python3}
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
$PY "$HERE/source/build-plates.py"
$PY "$HERE/ground/build-ground.py"
$PY "$HERE/build-objects.py"
$PY "$ROOT/engine/tools/grade-kit.py" "$HERE"/ground/ground.png "$HERE"/objects/*.png
$PY "$HERE/grade-fix.py"
# light falls on the walk only when the lanterns are what lights it
for f in light-spill lamp-pool; do
  $PY -c "from PIL import Image; import sys; p=sys.argv[1]; Image.new('RGBA', Image.open(p).size).save(p)" "$HERE/objects/$f-day.png"
done
# a street light's pool is faint at dusk and full at night
$PY -c "
from PIL import Image; import sys
p = sys.argv[1]; im = Image.open(p).convert('RGBA'); px = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        if a: px[x, y] = (r, g, b, min(255, a * 2))
im.save(p)" "$HERE/objects/lamp-pool-night.png"
$PY -c "
from PIL import Image; import sys
p = sys.argv[1]; im = Image.open(p).convert('RGBA'); px = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        if a: px[x, y] = (r, g, b, a // 2)
im.save(p)" "$HERE/objects/lamp-pool.png"
