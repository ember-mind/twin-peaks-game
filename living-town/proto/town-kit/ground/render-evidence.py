#!/usr/bin/env python3
"""Render ../evidence/ground-{sheet,fields,compose}.png (+ ground-water.gif).
Tiles are picked by pick.js under Node, so the evidence shows the real picker."""
import json
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
EV = os.path.join(HERE, '..', 'evidence')
T = 16
atlas = Image.open(os.path.join(HERE, 'ground.png')).convert('RGB')
meta = json.load(open(os.path.join(HERE, 'ground.json')))
COLS = meta['columns']
BG = (24, 26, 34)
INK = (230, 225, 210)


def cell_img(i):
    y, x = divmod(i, COLS)
    return atlas.crop((x * T, y * T, (x + 1) * T, (y + 1) * T))


def pick_grids(grids, seed=7):
    js = ("const p=require(%s);const g=JSON.parse(require('fs').readFileSync(0,'utf8'));"
          "console.log(JSON.stringify(g.map(m=>m.map((r,y)=>r.map((_,x)=>p.pickTile(m,x,y,%d))))))"
          % (json.dumps(os.path.join(HERE, 'pick.js')), seed))
    out = subprocess.run(['node', '-e', js], input=json.dumps(grids), capture_output=True,
                         text=True, check=True).stdout
    return json.loads(out)


def render(picks, frame=0):
    h, w = len(picks), len(picks[0])
    im = Image.new('RGB', (w * T, h * T))
    for y, row in enumerate(picks):
        for x, p in enumerate(row):
            c = p['frames'][frame] if 'frames' in p else p['cell']
            im.paste(cell_img(c), (x * T, y * T))
    return im


def up(im, s):
    return im.resize((im.width * s, im.height * s), Image.NEAREST)


# ---------------------------------------------------------------- sheet (3x)
S = 3
groups = []
m = meta['materials']
tr = meta['transitions']
groups.append(('cobble', m['cobble']['table']))
groups.append(('paving', m['paving']['table']))
groups.append(('kerb (row)', m['kerb']['table']))
groups.append(('embankment_top (row) / + grass lip', m['embankment_top']['table'] + tr['embankment_lip']['table']))
groups.append(('embankment_face (row)', m['embankment_face']['table']))
groups.append(('grass (N,E,S,W codes x plain/plain/flowers)', m['grass']['table']))
groups.append(('garden', m['garden']['table']))
groups.append(('water frame 0 / 1 / 2', m['water']['frames'][0] + m['water']['frames'][1] + m['water']['frames'][2]))
groups.append(('water shore frames 0 / 1 / 2', sum(tr['water_shore']['frames'], [])))
groups.append(('cobble + grass fringe (mask,L,R)', list(tr['grass_fringe']['tables']['cobble'].values())))
groups.append(('paving + grass fringe (mask,L,R)', list(tr['grass_fringe']['tables']['paving'].values())))
per_row = 18
cw = T * S + 4
height = 8
for _, cells in groups:
    height += 16 + ((len(cells) + per_row - 1) // per_row) * (cw + 10) + 6
sheet = Image.new('RGB', (per_row * cw + 16, height), BG)
d = ImageDraw.Draw(sheet)
y = 8
for name, cells in groups:
    d.text((8, y), name, fill=INK)
    y += 16
    for k, c in enumerate(cells):
        r, col = divmod(k, per_row)
        x0, y0 = 8 + col * cw, y + r * (cw + 10)
        sheet.paste(up(cell_img(c), S), (x0, y0))
        d.text((x0, y0 + T * S), str(c), fill=(150, 150, 140))
    y += ((len(cells) + per_row - 1) // per_row) * (cw + 10) + 6
sheet.save(os.path.join(EV, 'ground-sheet.png'))

# ---------------------------------------------------------------- fields (2x)
FIELD = ['cobble', 'paving', 'grass', 'garden', 'water', 'embankment']
grids = []
for mat in FIELD:
    if mat == 'embankment':
        g = [['cobble'] * 20 for _ in range(3)] + [['embankment_top'] * 20, ['embankment_face'] * 20] + \
            [['water'] * 20 for _ in range(3)] + [['grass'] * 20 for _ in range(1)] + \
            [['embankment_top'] * 20, ['embankment_face'] * 20] + [['water'] * 20]
    else:
        g = [[mat] * 20 for _ in range(12)]
    grids.append(g)
picks = pick_grids(grids)
fw, fh = 20 * T * 2, 12 * T * 2
fields = Image.new('RGB', (2 * fw + 48, 3 * (fh + 28) + 16), BG)
d = ImageDraw.Draw(fields)
for k, (mat, p) in enumerate(zip(FIELD, picks)):
    cx, cy = 16 + (k % 2) * (fw + 16), 8 + (k // 2) * (fh + 28)
    label = mat if mat != 'embankment' else 'cobble -> embankment -> water; grass -> embankment -> water'
    d.text((cx, cy), label + '  (20x12 tiles, 2x)', fill=INK)
    fields.paste(up(render(p), 2), (cx, cy + 16))
fields.save(os.path.join(EV, 'ground-fields.png'))

# ---------------------------------------------------------------- compose
W_, H_ = 48, 27
g = [['garden'] * W_ for _ in range(H_)]


def fill(x0, y0, x1, y1, mat):
    for yy in range(y0, y1):
        for xx in range(x0, x1):
            if 0 <= xx < W_ and 0 <= yy < H_:
                g[yy][xx] = mat


# hills and house lots (objects cover most of rows 0-7)
fill(0, 0, 48, 10, 'garden')
for x0 in (11, 19, 28, 35):
    fill(x0, 4, x0 + 1, 10, 'paving')   # lanes between the lots
for x0 in (6, 15, 32, 42):
    fill(x0, 8, x0 + 1, 10, 'paving')   # paths to the doors
fill(20, 8, 28, 10, 'paving')           # cafe terrace
fill(0, 10, 48, 11, 'paving')           # pavement in front of the houses
fill(0, 11, 48, 12, 'kerb')
fill(0, 12, 48, 16, 'cobble')           # the street, parapet stands on row 15
fill(0, 16, 41, 18, 'grass')            # park lawn
fill(21, 16, 24, 18, 'paving')          # path down to the pier
fill(41, 16, 48, 18, 'cobble')          # toward the bridge
fill(0, 18, 48, 19, 'embankment_top')
fill(0, 19, 48, 20, 'embankment_face')
fill(0, 20, 48, 27, 'water')
fill(21, 18, 24, 20, 'paving')          # pier landing
picks = pick_grids([g])[0]
comp = render(picks)
plate = Image.open(os.path.join(HERE, '..', 'source-plate.png')).convert('RGB')
out = Image.new('RGB', (comp.width * 2 * 2 + 48, comp.height * 2 + 40), BG)
d = ImageDraw.Draw(out)
d.text((16, 10), 'source plate (2x)', fill=INK)
d.text((comp.width * 2 + 32, 10), 'ground tiles only, 48x27 grid picked by pick.js (2x)', fill=INK)
out.paste(up(plate, 2), (16, 28))
out.paste(up(comp, 2), (comp.width * 2 + 32, 28))
out.save(os.path.join(EV, 'ground-compose.png'))

# ---------------------------------------------------------------- water loop
frames = [up(render(picks, f).crop((0, 17 * T, 48 * T, 27 * T)), 2) for f in range(3)]
frames[0].save(os.path.join(EV, 'ground-water.gif'), save_all=True, append_images=frames[1:],
               duration=220, loop=0)
print('evidence written')
