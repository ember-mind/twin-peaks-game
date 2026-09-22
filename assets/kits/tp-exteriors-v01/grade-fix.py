#!/usr/bin/env python3
"""After grade-kit.py: take back the glow from surfaces that only look warm.

grade-kit.py (engine/tools, the shared grader) keeps any warm, bright, clustered pixel lit at
night. The Double R's cream siding, the station's cream trim and the road's
painted dashes pass that test, so the whole diner would glow like a lamp.
Here every pixel outside the object's light zones (its windows, the open
door, lanterns, signs) is regraded with grade-kit's own formulas as unlit.

Run after grade-kit.py (build-all.sh does).
"""
import importlib.util
import sys
import json
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True   # leave no cache beside the shared grader
spec = importlib.util.spec_from_file_location(
    'grade_kit', os.path.join(HERE, '..', '..', '..', 'engine', 'tools', 'grade-kit.py'))
gk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gk)

# light zones beyond windows and door, in plate coords: lanterns, signs, lamps
EXTRA = {
    'double-r': [(97, 68, 113, 88), (143, 68, 159, 88), (100, 42, 157, 64), (114, 72, 142, 101)],
    'sheriff-station': [(116, 62, 138, 72), (104, 46, 151, 62), (110, 74, 142, 111)],
}
# objects that are all surface (paint, no light)
ALL_SURFACE = {'road-dash', 'stall-line', 'wheel-stop', 'bench', 'fence', 'fence-post', 'flagpole'}

objects = json.load(open(os.path.join(HERE, 'objects.json')))
for e in objects:
    zones = []
    if e['id'] in ALL_SURFACE:
        pass
    elif 'windows' in e or e['id'] in EXTRA:
        zones = [tuple(w) for w in e.get('windows', [])]
        if 'door' in e:
            zones.append(tuple(e['door']['rect']))
        sx, sy = e['source'][1], e['source'][2]
        zones += [(x0 - sx, y0 - sy, x1 - x0 + 1, y1 - y0 + 1) for x0, y0, x1, y1 in EXTRA.get(e['id'], [])]
    else:
        continue
    src = Image.open(os.path.join(HERE, e['file'])).convert('RGBA')
    px = src.load()
    for grade, fn in (('night', gk.night), ('day', gk.day)):
        path = os.path.join(HERE, e['file'][:-4] + '-' + grade + '.png')
        out = Image.open(path).convert('RGBA')
        po = out.load()
        for y in range(src.height):
            for x in range(src.width):
                r, g, b, a = px[x, y]
                if not a or any(zx <= x < zx + zw and zy <= y < zy + zh for zx, zy, zw, zh in zones):
                    continue
                po[x, y] = fn(r, g, b, False, False) + (a,)
        out.save(path)
print('regraded surfaces of', sum(1 for e in objects if e['id'] in ALL_SURFACE or 'windows' in e or e['id'] in EXTRA), 'objects')
