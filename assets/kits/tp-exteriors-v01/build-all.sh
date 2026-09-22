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
$PY -c "from PIL import Image; import sys; p=sys.argv[1]; Image.new('RGBA', Image.open(p).size).save(p)" "$HERE/objects/light-spill-day.png"
