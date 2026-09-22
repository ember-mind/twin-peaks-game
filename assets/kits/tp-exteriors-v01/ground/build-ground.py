#!/usr/bin/env python3
"""Build the Twin Peaks exterior ground atlas (ground.png, ground.json).

Every colour is taken from the shared palette of the two concept plates
(../source/palette.png; the script asserts it), and the values follow the
concepts: the slate asphalt of both lots, the station's grey concrete walk,
the diner's tan kerb lip, the dark verge and forest greens.

All materials are coursed (the engine's L/R edge codes): features that cross
a vertical tile edge are fixed by that edge's code, so the two tiles sharing
the edge draw the same thing; nothing crosses a horizontal edge except
uncorrelated single-pixel speckle, so any arrangement is seamless.

  asphalt   slate with speckle, small repairs and cracks; big repairs are
            decal objects cut from the plate
  concrete  sidewalk slabs: a joint row on top of every tile, a vertical joint
            on the left edge wherever that edge's code is 0 (slabs average
            three tiles, as in the concepts)
  grass     the dark verge
  forest    needle duff under the pines (not walkable)

Transitions (engine rule types, first match wins):
  fringe  concrete next to asphalt: the kerb (lip, face, shadow) on each side
          that meets the road
  fringe  asphalt / concrete next to grass or forest: a ragged grass lip
  fringe  forest next to grass: the verge creeps in over the duff

Re-run: python build-ground.py
"""
import json
import os
import random

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
T = 16
COLS = 16
PAL_IMG = np.array(Image.open(os.path.join(HERE, '..', 'source', 'palette.png')).convert('RGB'))
PALETTE = {'%02x%02x%02x' % tuple(c) for c in PAL_IMG[::12, ::12].reshape(-1, 3)}


def C(h):
    assert h in PALETTE, h + ' is not in the plate palette'
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


A = dict(base=C('44505f'), s1=C('3d4a58'), s2=C('404c5a'), s3=C('445261'), s4=C('465363'),
         patch=C('3b4754'), dark=C('363c46'), oil=C('30393b'), crack=C('2d373a'), grit=C('4e4f43'))
K_ = dict(base=C('99947b'), s1=C('88847a'), s2=C('ad9f85'), s3=C('878768'), joint=C('6c6a61'),
          jointhi=C('ad9f85'), chip=C('767369'), stain=C('878768'),
          lip=C('c2b797'), lip2=C('ad9f85'), face=C('616160'), face2=C('6c6a61'), shadow=C('36434c'),
          shadow2=C('3b4754'))
G = dict(base=C('2d4436'), mid=C('3a553a'), light=C('44623d'), hi=C('5d723f'), dark=C('1a312e'),
         darker=C('1a2d2b'), soil=C('352c28'))
F = dict(base=C('282423'), duff=C('352c28'), dark=C('1f1b1a'), moss=C('253c33'), moss2=C('20312c'),
         needle=C('583d2d'), needle2=C('43403e'), cone=C('7d553b'), green=C('1a2d2b'))


def rng(*key):
    return random.Random('|'.join(str(k) for k in key))


def speckle(cv, r, base, table):
    cv[:, :] = base
    for y in range(T):
        for x in range(T):
            v, acc = r.random(), 0
            for col, pr in table:
                acc += pr
                if v < acc:
                    cv[y, x] = col
                    break


def put(cv, x, y, c):
    if 0 <= x < cv.shape[1] and 0 <= y < cv.shape[0]:
        cv[y, x] = c


def blob(r, size, rad=2, flat=False):
    pts, x, y = {(0, 0)}, 0, 0
    moves = ((1, 0), (-1, 0), (1, 0), (-1, 0), (0, 1), (0, -1)) if flat else ((1, 0), (-1, 0), (0, 1), (0, -1))
    while len(pts) < size:
        dx, dy = r.choice(moves)
        if abs(x + dx) <= rad * 2 and abs(y + dy) <= rad:
            x, y = x + dx, y + dy
            pts.add((x, y))
    return pts


# ---------------------------------------------------------------- edge features
# A feature straddling the vertical edge between two tiles is drawn by both
# tiles from the edge's code: into a 3-tile-wide canvas, the edge at x=T
# (left edge) or x=2T (right edge), then the middle tile is kept.

def edge_feats(mat, code):
    r = rng(mat, 'edge', code)
    out = []
    n = {'asphalt': (0, 2), 'grass': (1, 3), 'forest': (1, 3), 'concrete': (0, 1)}[mat]
    for _ in range(r.randint(*n)):
        if mat == 'asphalt':
            col = A['s1'] if r.random() < .6 else A['patch']
            pts = blob(r, r.randint(3, 7), 1, flat=True)
        elif mat == 'grass':
            col = r.choice((G['dark'], G['mid'], G['mid'], G['light']))
            pts = blob(r, r.randint(2, 5), 1)
        elif mat == 'forest':
            col = r.choice((F['duff'], F['moss'], F['needle2'], F['dark']))
            pts = blob(r, r.randint(2, 5), 1)
        else:
            col = K_['chip']
            pts = {(0, 0), (1, 0), (-1, 0)}
        y = r.randint(3, T - 4)
        out.append((y, pts, col))
    return out


def paint_edges(cv3, mat, L, R):
    for code, ex in ((L, T), (R, 2 * T)):
        for y, pts, col in edge_feats(mat, code):
            for dx, dy in pts:
                put(cv3, ex + dx, y + dy, col)


# ---------------------------------------------------------------- materials

def asphalt(L, R, i):
    cv3 = np.zeros((T, 3 * T, 3), np.uint8)
    r = rng('asphalt', L, R, i)
    mid = np.zeros((T, T, 3), np.uint8)
    speckle(mid, r, A['base'], [(A['s1'], .025), (A['s2'], .03), (A['s3'], .03), (A['s4'], .01), (A['dark'], .002)])
    cv3[:, T:2 * T] = mid
    kind = i % 10
    if kind == 1:                       # a small stepped repair, like the lots'
        x0, y0, w, h = r.randint(3, 7), r.randint(3, 7), r.randint(4, 7), r.randint(3, 5)
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                if not ((y == y0 or y == y0 + h - 1) and (x == x0 or x == x0 + w - 1) and r.random() < .7):
                    cv3[y, T + x] = A['patch']
        for x in range(x0 + 1, x0 + w - 1):
            if r.random() < .5:
                cv3[y0 + h - 1, T + x] = A['dark']
    elif kind == 2:                     # a hairline crack
        x, y = r.randint(3, 12), r.randint(3, 5)
        for _ in range(r.randint(5, 8)):
            if 2 <= y < T - 2:
                cv3[y, T + x] = A['dark']
            y += 1
            x = min(T - 3, max(2, x + r.choice((-1, 0, 0, 1))))
    elif kind == 3:                     # an oil drop
        for dx, dy in blob(r, r.randint(3, 6), 1, flat=True):
            cv3[8 + dy, T + 7 + dx] = A['oil'] if r.random() < .6 else A['dark']
    elif kind == 4:                     # grit
        for _ in range(r.randint(2, 3)):
            cv3[r.randint(2, T - 3), T + r.randint(1, T - 2)] = A['grit']
    paint_edges(cv3, 'asphalt', L, R)
    return cv3[:, T:2 * T].copy()


def concrete(L, R, i):
    cv3 = np.zeros((T, 3 * T, 3), np.uint8)
    r = rng('concrete', L, R, i)
    mid = np.zeros((T, T, 3), np.uint8)
    speckle(mid, r, K_['base'], [(K_['s1'], .06), (K_['s2'], .03), (K_['s3'], .01)])
    cv3[:, T:2 * T] = mid
    cv3[0, T:2 * T] = K_['joint']        # joint row between slab courses
    for x in range(T, 2 * T):
        if r.random() < .5:
            cv3[1, x] = K_['jointhi']
    if L == 0:                           # slab joint on this tile's left edge
        cv3[:, T] = K_['joint']
        cv3[1:, T + 1] = [K_['jointhi'] if r.random() < .4 else K_['base'] for _ in range(T - 1)]
    kind = i % 4
    if kind == 1:
        for _ in range(r.randint(1, 3)):  # chips
            x, y = r.randint(3, 12), r.randint(4, 13)
            for dx in range(r.randint(1, 3)):
                cv3[y, T + x + dx] = K_['chip']
    elif kind == 2:                       # a worn stain
        for dx, dy in blob(r, r.randint(4, 8), 1, flat=True):
            cv3[9 + dy, T + 8 + dx] = K_['stain']
    paint_edges(cv3, 'concrete', L, R)
    t = cv3[:, T:2 * T].copy()
    if L == 0:
        t[:, 0] = K_['joint']
    return t


def grass(L, R, i):
    cv3 = np.zeros((T, 3 * T, 3), np.uint8)
    r = rng('grass', L, R, i)
    mid = np.zeros((T, T, 3), np.uint8)
    speckle(mid, r, G['base'], [(G['dark'], .05), (G['mid'], .07), (G['light'], .02), (G['darker'], .015), (G['hi'], .003)])
    cv3[:, T:2 * T] = mid
    for _ in range(r.randint(2, 4)):
        col = r.choice((G['mid'], G['mid'], G['dark'], G['light']))
        cx, cy = r.randint(3, 12), r.randint(3, 12)
        for dx, dy in blob(r, r.randint(2, 6), 1):
            cv3[cy + dy, T + cx + dx] = col
    if i == 3:                           # tufts catching the light
        for _ in range(r.randint(2, 3)):
            x, y = r.randint(2, 13), r.randint(3, 12)
            cv3[y, T + x] = G['hi']
            cv3[y + 1, T + x] = G['light']
            cv3[y + 1, T + x - 1] = G['dark']
    paint_edges(cv3, 'grass', L, R)
    return cv3[:, T:2 * T].copy()


def forest(L, R, i):
    cv3 = np.zeros((T, 3 * T, 3), np.uint8)
    r = rng('forest', L, R, i)
    mid = np.zeros((T, T, 3), np.uint8)
    speckle(mid, r, F['moss2'], [(F['base'], .16), (F['duff'], .07), (F['dark'], .06), (F['moss'], .08), (F['green'], .08)])
    cv3[:, T:2 * T] = mid
    for _ in range(r.randint(2, 4)):     # fallen needles, short diagonal strokes
        x, y = r.randint(2, 12), r.randint(2, 12)
        d = r.choice((-1, 1))
        for k in range(r.randint(2, 3)):
            cv3[y + k, T + x + k * d] = F['needle']
    if i == 3:
        x, y = r.randint(4, 11), r.randint(4, 11)  # a pine cone
        cv3[y, T + x] = F['cone']
        cv3[y + 1, T + x] = F['needle']
        cv3[y, T + x + 1] = F['needle']
    paint_edges(cv3, 'forest', L, R)
    return cv3[:, T:2 * T].copy()


# ---------------------------------------------------------------- transitions
N_BIT, E_BIT, S_BIT, W_BIT = 1, 2, 4, 8


def side_px(bit, t, d):
    if bit == N_BIT:
        return t, d
    if bit == S_BIT:
        return t, T - 1 - d
    if bit == W_BIT:
        return d, t
    return T - 1 - d, t


def kerb(tile, mask):
    """Concrete meeting asphalt: the kerb on each side facing the road. South
    (the side the camera sees) shows lip, face and a shadow on the road;
    north shows only the lip; east and west a narrow lip and face."""
    out = tile.copy()
    if mask & S_BIT:
        for x in range(T):
            out[T - 6, x] = K_['lip']
            out[T - 5, x] = K_['lip2']
            out[T - 4, x] = K_['face']
            out[T - 3, x] = K_['face2'] if x % 7 else K_['face']
            out[T - 2, x] = K_['shadow']
            out[T - 1, x] = K_['shadow2']
    if mask & N_BIT:
        for x in range(T):
            out[0, x] = K_['shadow']
            out[1, x] = K_['face']
            out[2, x] = K_['lip']
    for bit in (E_BIT, W_BIT):
        if mask & bit:
            for t in range(T):
                for d, col in enumerate((K_['shadow'], K_['face'], K_['lip'])):
                    x, y = side_px(bit, t, d)
                    out[y, x] = col
    # corners where two kerbed sides meet stay dark at the outer corner
    if mask & S_BIT and mask & E_BIT:
        out[T - 6:, T - 3:] = K_['shadow']
    if mask & S_BIT and mask & W_BIT:
        out[T - 6:, :3] = K_['shadow']
    return out


def lip(tile, mask, key, pal):
    """A ragged lip of vegetation spilling over the tile on masked sides; 2 px
    deep at the corners so neighbouring lips meet."""
    r = rng('lip', *key)
    out = tile.copy()
    for bit in (N_BIT, E_BIT, S_BIT, W_BIT):
        if not mask & bit:
            continue
        prof, cur = [2] * T, 2
        for t in range(2, T - 2):
            cur = min(4, max(1, cur + r.choice((-1, 0, 0, 1))))
            prof[t] = cur
        for t in range(T):
            d = prof[t]
            for k in range(d):
                x, y = side_px(bit, t, k)
                v = r.random()
                out[y, x] = pal[0] if v < .5 else (pal[1] if v < .85 else pal[2])
            x, y = side_px(bit, t, d)
            out[y, x] = pal[3]
            if r.random() < .15 and d + 1 < T:
                x, y = side_px(bit, t, d + 1)
                out[y, x] = pal[0]
    return out


# ---------------------------------------------------------------- atlas
cells = []


def add(tile):
    assert tile.shape == (T, T, 3)
    cells.append(tile)
    return len(cells) - 1


K = 3
BUILD = {'asphalt': (asphalt, 10), 'concrete': (concrete, 4), 'grass': (grass, 4), 'forest': (forest, 4)}
mats = {}
for name, (fn, n) in BUILD.items():
    table = [add(fn(L, R, i)) for L in range(K) for R in range(K) for i in range(n)]
    mats[name] = dict(kind='coursed', codes=K, interiors=n, table=table)
mats['forest']['walkable'] = False


def fringe_table(mat, fn, make):
    tab = {}
    for mask in range(1, 16):
        for L in ([0] if mask & W_BIT else range(K)):
            for R in ([0] if mask & E_BIT else range(K)):
                tab['%d,%d,%d' % (mask, L, R)] = add(make(fn(L, R, 0), mask, (mat, mask, L, R)))
    return tab


GRASS_LIP = (G['base'], G['mid'], G['dark'], G['darker'])
kerb_tables = {'concrete': fringe_table('concrete', concrete, lambda t, m, k: kerb(t, m))}
lip_tables = {m: fringe_table(m, BUILD[m][0], lambda t, mk, k: lip(t, mk, k, GRASS_LIP)) for m in ('asphalt', 'concrete')}
creep_tables = {'forest': fringe_table('forest', forest, lambda t, m, k: lip(t, m, k, (G['base'], G['dark'], G['mid'], F['moss2'])))}

rows = (len(cells) + COLS - 1) // COLS
atlas = np.zeros((rows * T, COLS * T, 4), np.uint8)
for i, c in enumerate(cells):
    y, x = divmod(i, COLS)
    atlas[y * T:(y + 1) * T, x * T:(x + 1) * T, :3] = c
    atlas[y * T:(y + 1) * T, x * T:(x + 1) * T, 3] = 255
used = {'%02x%02x%02x' % tuple(p) for p in np.unique(np.concatenate(cells).reshape(-1, 3), axis=0)}
assert used <= PALETTE, used - PALETTE
Image.fromarray(atlas, 'RGBA').save(os.path.join(HERE, 'ground.png'))

ground = dict(
    tile=T, columns=COLS, image='ground.png', cellCount=len(cells), materials=mats,
    rules=[
        dict(type='fringe', materials=['concrete'], neighbours=['asphalt'], tables=kerb_tables),
        dict(type='fringe', materials=['asphalt', 'concrete'], neighbours=['grass', 'forest'], tables=lip_tables),
        dict(type='fringe', materials=['forest'], neighbours=['grass'], tables=creep_tables),
    ],
    notes=("Coursed materials: L=vcode(x,y)%3, R=vcode(x+1,y)%3, cell=table[(L*3+R)*interiors+i]. "
           "Fringe keys 'mask,L,R' (mask N=1 E=2 S=4 W=8; L=0 when W set, R=0 when E set). "
           "The kerb is the concrete/asphalt fringe; there is no kerb material."),
)
with open(os.path.join(HERE, 'ground.json'), 'w') as f:
    json.dump(ground, f, indent=1)
print('cells', len(cells), 'atlas', atlas.shape[1], 'x', atlas.shape[0], 'colours', len(used))
