#!/usr/bin/env python3
"""Build the ground tile atlas (ground.png, ground.json) and refresh the table
inside pick.js, all from ../source-plate.png.

Every colour used is taken from the plate's palette (the script asserts it).
Tiles are drawn procedurally in the plate's pixel style and stitched with an
edge-code (Wang) scheme so that any arrangement the picker produces has no
seams:

- Coursed stone (cobble, paving, kerb, embankment rows): courses are
  horizontal, so horizontal tile edges are always a mortar line. Each
  vertical tile edge carries a code 0..K-1 that fixes, per course, the stone
  that straddles it. Two tiles meeting at an edge agree on the code, so the
  straddling stone is drawn identically on both sides.
- Textured ground (grass, garden): every edge (N/E/S/W) carries a code 0..1
  that fixes the small blobs drawn across it.
- Water: vertical edges carry a code 0..2 that fixes the ripple dashes that
  cross them, per animation frame. Dashes are 1 px tall, so horizontal edges
  need no code.

Re-run: python build-ground.py
"""
import json
import os
import random
import re

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PLATE = os.path.join(HERE, '..', 'source-plate.png')
T = 16
COLS = 16

plate = np.array(Image.open(PLATE).convert('RGB'))
PALETTE = {'%02x%02x%02x' % tuple(c) for c in np.unique(plate.reshape(-1, 3), axis=0)}


def C(hexs):
    assert hexs in PALETTE, hexs + ' is not in the plate palette'
    return tuple(int(hexs[i:i + 2], 16) for i in (0, 2, 4))


def dominant(box, exclude=()):
    """Most common plate colour inside box, used to anchor base fills."""
    x0, y0, x1, y1 = box
    px = plate[y0:y1, x0:x1].reshape(-1, 3)
    vals, counts = np.unique(px, axis=0, return_counts=True)
    for i in np.argsort(-counts):
        h = '%02x%02x%02x' % tuple(vals[i])
        if h not in exclude:
            return h


# Colour roles, sampled from the plate regions that carry each material.
COBBLE_STONE = dominant((440, 196, 600, 228))          # 7b6a5a
LAWN_BASE = dominant((60, 262, 420, 292))              # 54784a
WATER_DEEP = dominant((0, 318, 300, 330))              # 19374d

PAL = {
    'cobble': dict(mortar=C('605753'), stone=C(COBBLE_STONE), patch=C('70797c'),
                   warm=C('977b5c'), light=C('97877a'), dark=C('43474c'),
                   moss=C('356730'), moss2=C('54784a')),
    'paving': dict(mortar=C('605753'), stone=C('97877a'), stone2=C('7b6a5a'),
                   patch=C('70797c'), warm=C('977b5c'), light=C('ad9a6d'), dark=C('7b6a5a'),
                   moss=C('54784a'), moss2=C('356730')),
    'kerbstone': dict(mortar=C('605753'), stone=C('97877a'), patch=C('7b6a5a'),
                      warm=C('977b5c'), light=C('ad9a6d'), dark=C('43474c'),
                      moss=C('356730'), moss2=C('54784a')),
    'coping': dict(mortar=C('605753'), stone=C('97877a'), patch=C('7b6a5a'),
                   warm=C('977b5c'), light=C('a79398'), dark=C('43474c'),
                   moss=C('356730'), moss2=C('54784a')),
    'face': dict(mortar=C('29442e'), stone=C('43474c'), patch=C('605753'),
                 warm=C('50616f'), light=C('605753'), dark=C('29442e'),
                 moss=C('356730'), moss2=C('29442e')),
}
G = dict(base=C(LAWN_BASE), dark=C('356730'), darker=C('29442e'), light=C('719952'),
         bright=C('a4b756'), soil=C('49422d'), soil2=C('3d2624'),
         petal=C('dfe0c8'), petal2=C('ccd1a8'), eye=C('e7bf70'), white=C('ffffff'),
         outline=C('171925'))
W = dict(deep=C(WATER_DEEP), teal=C('22685c'), grey=C('50616f'), blue=C('497688'),
         sky=C('60889c'), glint=C('828c95'), dark=C('171925'), wet=C('29442e'),
         wall=C('43474c'))


def rng(*key):
    return random.Random('|'.join(str(k) for k in key))


# ---------------------------------------------------------------- coursed stone

class Course:
    def __init__(self, h, style, wmin, wmax, amin, amax, flat=None):
        self.h, self.style, self.wmin, self.wmax = h, style, wmin, wmax
        self.amin, self.amax = amin, amax
        self.flat = flat  # 'kerb' | 'coping' | None


COURSES = {
    'cobble': [Course(5, 'cobble', 9, 14, 2, 6), Course(5, 'cobble', 9, 14, 2, 6),
               Course(6, 'cobble', 10, 14, 2, 6)],
    'paving': [Course(8, 'paving', 9, 15, 3, 7), Course(8, 'paving', 9, 15, 3, 7)],
    'kerb': [Course(7, 'kerbstone', 14, 22, 4, 7, flat='kerb'),
             Course(4, 'cobble', 6, 10, 2, 5), Course(5, 'cobble', 7, 11, 2, 5)],
    'embankment_top': [Course(9, 'coping', 13, 20, 4, 7, flat='coping'),
                       Course(7, 'face', 8, 13, 2, 6)],
    'embankment_face': [Course(5, 'face', 7, 12, 2, 6), Course(5, 'face', 7, 12, 2, 6),
                        Course(6, 'face', 8, 13, 2, 6)],
}
CODES_COURSED = 4


def straddle(mat, code, ci, course):
    """(a, b, seed): stone straddling an edge, a px left of it, b px right."""
    r = rng(mat, 'edge', code, ci)
    if r.random() < 0.18:
        return 0, 0, None
    a = r.randint(course.amin, course.amax)
    b = r.randint(course.amin, course.amax)
    while a + b < course.wmin:
        b += 1
    return a, b, r.randrange(1 << 30)


def draw_stone(cv, x0, w, y0, h, seed, course, plain=False):
    """Draw one stone into the 48-wide canvas. Column x0 and row y0 are mortar.
    plain: no off-tone base or warm patch, for edge straddlers, which recur
    wherever their edge code does."""
    p = PAL[course.style]
    r = random.Random(seed)
    H, Wd = cv.shape[:2]
    stone = p['stone2'] if 'stone2' in p and r.random() < .15 and not plain else p['stone']

    def put(x, y, col):
        if 0 <= x < Wd and 0 <= y < H:
            cv[y, x] = col

    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            put(x, y, stone)
    # mortar: left column and top row
    for y in range(y0, y0 + h):
        put(x0, y, p['mortar'])
    for x in range(x0, x0 + w):
        put(x, y0, p['mortar'])
    if course.flat:
        # long dressed stones: highlight top, darker lower face, shadow line
        for x in range(x0 + 1, x0 + w):
            put(x, y0 + 1, p['light'])
            put(x, y0 + h - 1, p['dark'])
            put(x, y0 + h - 2, p['patch'])
            if course.flat == 'coping':
                put(x, y0 + h - 3, p['patch'])
                put(x, y0 + h - 1, G['outline'])
        for _ in range(r.randint(1, 3)):
            px, py = r.randint(1, max(1, w - 4)), r.randint(2, h - 4)
            for dx in range(r.randint(2, 5)):
                if px + dx < w:
                    put(x0 + px + dx, y0 + py, p['patch'] if r.random() < .7 else p['warm'])
        if r.random() < .35:
            put(x0 + w - 1, y0 + 1, p['stone'])
        return
    # blotchy patches like the plate's worn setts
    for _ in range(r.choice((0, 1, 1, 2, 2))):
        pw, ph = r.randint(2, 6), r.randint(1, 3)
        px, py = r.randint(1, max(1, w - 2)), r.randint(1, max(1, h - 2))
        col = p['patch'] if r.random() < .93 or plain else p['warm']
        for dy in range(ph):
            for dx in range(pw):
                if px + dx < w and py + dy < h and r.random() < .85:
                    put(x0 + px + dx, y0 + py + dy, col)
    if r.random() < .5:
        for dx in range(1, min(w, r.randint(2, 5))):
            put(x0 + dx, y0 + 1, p['light'])
    # rounded corners and a darker lower edge on some stones
    if r.random() < .5:
        put(x0 + 1, y0 + 1, p['mortar'])
    if r.random() < .45:
        put(x0 + w - 1, y0 + h - 1, p['mortar'])
    if r.random() < .3:
        for dx in range(w // 3, w - 1):
            put(x0 + dx, y0 + h - 1, p['dark'] if course.style == 'face' else p['mortar'])
    # moss in the joints
    if r.random() < .22:
        put(x0, y0 + r.randint(0, h - 1), p['moss'])
    if r.random() < .12:
        put(x0 + r.randint(0, w - 1), y0, p['moss2'])


def coursed_tile(mat, L, R, interior):
    cv = np.zeros((T, 3 * T, 3), np.uint8)
    y = 0
    for ci, course in enumerate(COURSES[mat]):
        aL, bL, sL = straddle(mat, L, ci, course)
        aR, bR, sR = straddle(mat, R, ci, course)
        if sL is not None:
            draw_stone(cv, T - aL, aL + bL, y, course.h, sL, course, plain=True)
        if sR is not None:
            draw_stone(cv, 2 * T - aR, aR + bR, y, course.h, sR, course, plain=True)
        lo, hi = T + bL, 2 * T - aR
        r = rng(mat, 'int', L, R, interior, ci)
        span = hi - lo
        n = max(1, round(span / ((course.wmin + course.wmax) / 2)))
        cuts = [lo]
        for k in range(1, n):
            cuts.append(lo + round(span * k / n) + r.randint(-1, 1))
        cuts.append(hi)
        for k in range(n):
            draw_stone(cv, cuts[k], cuts[k + 1] - cuts[k], y, course.h,
                       r.randrange(1 << 30), course)
        y += course.h
    return cv[:, T:2 * T].copy()


# ---------------------------------------------------------------- textured ground

def blob(r, col, size):
    """Random-walk cluster of `size` pixels around (0,0), radius <= 2."""
    pts = {(0, 0)}
    x = y = 0
    while len(pts) < size:
        dx, dy = r.choice(((1, 0), (-1, 0), (0, 1), (0, -1), (0, -1)))
        if abs(x + dx) <= 2 and abs(y + dy) <= 2:
            x, y = x + dx, y + dy
            pts.add((x, y))
    return [(px, py, col) for px, py in pts]


def flower(r):
    petal = G['petal'] if r.random() < .7 else G['petal2']
    s = [(0, 0, G['eye']), (-1, 0, petal), (1, 0, petal), (0, -1, petal), (0, 1, petal)]
    if r.random() < .5:
        s += [(-1, 1, G['dark']), (1, 1, G['dark'])]
    return s


def ground_stamp(mat, r):
    roll = r.random()
    if mat == 'grass':
        if roll < .45:
            return blob(r, G['dark'], r.randint(2, 5))
        if roll < .75:
            return blob(r, G['light'], r.randint(1, 3))
        if roll < .92:
            return [(0, 0, G['dark']), (0, -1, G['light'])]
        return blob(r, G['darker'], r.randint(2, 4))
    # garden: darker lawn with bits of soil
    if roll < .4:
        return blob(r, G['darker'], r.randint(2, 6))
    if roll < .7:
        return blob(r, G['base'], r.randint(2, 4))
    if roll < .93:
        return blob(r, G['darker'], r.randint(3, 6))
    return blob(r, G['soil'], r.randint(1, 3))


def stamp_extent(s):
    return max(max(abs(x), abs(y)) for x, y, _ in s)


def paint(cv, s, cx, cy):
    H, Wd = cv.shape[:2]
    for dx, dy, col in s:
        x, y = cx + dx, cy + dy
        if 0 <= x < Wd and 0 <= y < H:
            cv[y, x] = col


GROUND_BASE = {'grass': G['base'], 'garden': G['dark']}
GROUND_SPECKLE = {
    'grass': [(G['dark'], .055), (G['light'], .02), (G['darker'], .008), (G['bright'], .002)],
    'garden': [(G['darker'], .09), (G['base'], .04), (G['soil'], .004), (G['light'], .006)],
}
CODES_GROUND = 2
GROUND_INTERIORS = {'grass': 3, 'garden': 2}   # grass interior 2 = flowers


def edge_features(mat, orient, code, frame=0, n=(1, 3)):
    r = rng(mat, orient, code, frame)
    feats = []
    for _ in range(r.randint(*n)):
        s = ground_stamp(mat, r)
        e = stamp_extent(s)
        t = r.randint(e, T - 1 - e)
        feats.append((t, s))
    return feats


def ground_tile(mat, N, E, S, Wc, interior):
    cv = np.zeros((3 * T, 3 * T, 3), np.uint8)
    cv[:, :] = GROUND_BASE[mat]
    r = rng(mat, 'int', N, E, S, Wc, interior)
    # uncorrelated speckle: invisible at seams by construction
    for y in range(T, 2 * T):
        for x in range(T, 2 * T):
            v = r.random()
            acc = 0
            for col, pr in GROUND_SPECKLE[mat]:
                acc += pr
                if v < acc:
                    cv[y, x] = col
                    break
    for _ in range(r.randint(2, 4)):
        s = ground_stamp(mat, r)
        e = stamp_extent(s)
        paint(cv, s, T + r.randint(e, T - 1 - e), T + r.randint(e, T - 1 - e))
    if mat == 'grass' and interior == 2:
        for _ in range(r.randint(1, 3)):
            s = flower(r)
            paint(cv, s, T + r.randint(2, T - 3), T + r.randint(2, T - 3))
    for t, s in edge_features(mat, 'V', Wc):
        paint(cv, s, T, T + t)
    for t, s in edge_features(mat, 'V', E):
        paint(cv, s, 2 * T, T + t)
    for t, s in edge_features(mat, 'H', N):
        paint(cv, s, T + t, T)
    for t, s in edge_features(mat, 'H', S):
        paint(cv, s, T + t, 2 * T)
    return cv[T:2 * T, T:2 * T].copy()


# ---------------------------------------------------------------- water

CODES_WATER = 3
FRAMES = 3
WATER_INTERIORS = 2


def dash_shape(x0, length, phase, frame):
    """Pixels (x offsets) of a ripple dash at a given frame; loops every 3."""
    st = (phase + frame) % 3
    if st == 0:
        return list(range(x0, x0 + length))
    if st == 1:
        return list(range(x0 + 1, x0 + length + 1))
    # stretched thin: gap in the middle
    mid = x0 + length // 2
    return [x for x in range(x0 - 1, x0 + length + 1) if x != mid]


def water_dash(r):
    roll = r.random()
    if roll < .45:
        col, ln = W['teal'], r.randint(4, 10)
    elif roll < .62:
        col, ln = W['blue'], r.randint(2, 5)
    elif roll < .90:
        col, ln = W['grey'], r.randint(4, 9)
    else:
        col, ln = W['sky'], r.randint(1, 3)
    return col, ln, r.randint(0, 2)


def water_tile(L, R, interior, frame, shore=False):
    cv = np.zeros((T, 3 * T, 3), np.uint8)
    cv[:, :] = W['deep']
    r = rng('water', 'int', L, R, interior, shore)
    for _ in range(r.randint(4, 6)):
        col, ln, ph = water_dash(r)
        y = r.randint(0, T - 1)
        x0 = T + r.randint(0, T - ln)
        for x in dash_shape(x0, ln, ph, frame):
            if T <= x < 2 * T:
                cv[y, x] = col
    if r.random() < .5:  # a glint that shows on one frame only
        gy, gx, gf = r.randint(0, T - 1), T + r.randint(1, T - 2), r.randint(0, 2)
        if gf == frame:
            cv[gy, gx] = W['glint']
    for code, line in ((L, T), (R, 2 * T)):
        er = rng('water', 'V', code)
        for _ in range(er.randint(1, 3)):
            col, ln, ph = water_dash(er)
            ln = max(ln, 3)
            y = er.randint(0, T - 1)
            a = er.randint(1, ln - 1)
            for x in dash_shape(line - a, ln, ph, frame):
                cv[y, x] = col
    tile = cv[:, T:2 * T].copy()
    if shore:
        sr = rng('water', 'shore', L, R, interior)
        # the wall's wet foot and its shadow on the water
        for x in range(T):
            tile[0, x] = W['dark']
            tile[1, x] = W['deep']
            if sr.random() < .3:
                tile[1, x] = W['dark']
            if sr.random() < .15:
                tile[0, x] = W['wet']
        # soft reflection of the wall's stone courses
        for _ in range(2):
            y = sr.randint(3, 5)
            x0 = sr.randint(0, T - 5)
            ln = sr.randint(2, 4)
            for x in dash_shape(x0, ln, sr.randint(0, 2), frame):
                if 0 <= x < T:
                    tile[y, x] = W['wall']
    return tile


# ---------------------------------------------------------------- grass fringe

HARD_WITH_FRINGE = ('cobble', 'paving')
N_BIT, E_BIT, S_BIT, W_BIT = 1, 2, 4, 8


def fringe(tile, mask, key):
    """Grass lip spilling onto stone on the masked sides. Depth is 2 px at the
    tile corners so neighbouring fringe tiles meet, 1-4 px in between."""
    r = rng('fringe', *key)
    out = tile.copy()

    def side_pixels(bit, t, d):
        if bit == N_BIT:
            return t, d
        if bit == S_BIT:
            return t, T - 1 - d
        if bit == W_BIT:
            return d, t
        return T - 1 - d, t

    for bit in (N_BIT, E_BIT, S_BIT, W_BIT):
        if not mask & bit:
            continue
        prof = [2] * T
        cur = 2
        for t in range(2, T - 2):
            cur = min(4, max(1, cur + r.choice((-1, 0, 0, 1))))
            prof[t] = cur
        prof[T - 3] = min(prof[T - 3], 3)
        for t in range(T):
            d = prof[t]
            for k in range(d):
                x, y = side_pixels(bit, t, k)
                v = r.random()
                col = G['dark'] if v < .55 else (G['base'] if v < .85 else G['darker'])
                if k == 0 and r.random() < .3:
                    col = G['base']
                out[y, x] = col
            x, y = side_pixels(bit, t, d)
            out[y, x] = G['darker']
            if d + 1 < T and r.random() < .18:
                x, y = side_pixels(bit, t, d + 1)
                out[y, x] = G['darker']
            if r.random() < .12:  # a blade poking out over the stone
                x, y = side_pixels(bit, t, d)
                out[y, x] = G['dark']
    return out


def embankment_lip(tile, key):
    """Lawn overhanging the coping when grass is above."""
    r = rng('lip', *key)
    out = tile.copy()
    for x in range(T):
        d = r.choice((0, 1, 1, 1, 2))
        for y in range(d):
            out[y, x] = G['dark'] if r.random() < .6 else G['base']
        if d and r.random() < .5:
            out[d, x] = G['darker']
    return out


# ---------------------------------------------------------------- atlas

cells = []


def add(tile):
    assert tile.shape == (T, T, 3)
    cells.append(tile)
    return len(cells) - 1


mats = {}
trans = {}

for mat, interiors in (('cobble', 3), ('paving', 3)):
    K = CODES_COURSED
    table = [add(coursed_tile(mat, L, R, i))
             for L in range(K) for R in range(K) for i in range(interiors)]
    mats[mat] = dict(kind='coursed', codes=K, interiors=interiors, table=table)

for mat in ('kerb', 'embankment_face'):
    K = CODES_COURSED
    table = [add(coursed_tile(mat, L, R, 0)) for L in range(K) for R in range(K)]
    mats[mat] = dict(kind='coursed', codes=K, interiors=1, table=table)

K = CODES_COURSED
emb_plain, emb_lip = [], []
for L in range(K):
    for R in range(K):
        base = coursed_tile('embankment_top', L, R, 0)
        emb_plain.append(add(base))
        emb_lip.append(add(embankment_lip(base, (L, R))))
mats['embankment_top'] = dict(kind='coursed', codes=K, interiors=1, table=emb_plain)

for mat in ('grass', 'garden'):
    K = CODES_GROUND
    I = GROUND_INTERIORS[mat]
    table = [add(ground_tile(mat, N, E, S, Wc, i))
             for N in range(K) for E in range(K) for S in range(K) for Wc in range(K)
             for i in range(I)]
    mats[mat] = dict(kind='textured', codes=K, interiors=I, table=table)

K = CODES_WATER
water_frames = [[None] * (K * K * WATER_INTERIORS) for _ in range(FRAMES)]
shore_frames = [[None] * (K * K) for _ in range(FRAMES)]
for L in range(K):
    for R in range(K):
        for i in range(WATER_INTERIORS):
            for f in range(FRAMES):
                water_frames[f][(L * K + R) * WATER_INTERIORS + i] = add(water_tile(L, R, i, f))
        for f in range(FRAMES):
            shore_frames[f][L * K + R] = add(water_tile(L, R, 0, f, shore=True))
mats['water'] = dict(kind='water', codes=K, interiors=WATER_INTERIORS,
                     table=water_frames[0], frames=water_frames)

fringe_tables = {}
for mat in HARD_WITH_FRINGE:
    K = CODES_COURSED
    tab = {}
    for mask in range(1, 16):
        Ls = [0] if mask & W_BIT else range(K)
        Rs = [0] if mask & E_BIT else range(K)
        for L in Ls:
            for R in Rs:
                base = coursed_tile(mat, L, R, 0)
                tab['%d,%d,%d' % (mask, L, R)] = add(fringe(base, mask, (mat, mask, L, R)))
    fringe_tables[mat] = tab

for m in mats.values():
    m['variants'] = sorted(set(m['table']))

# ---------------------------------------------------------------- write

rows = (len(cells) + COLS - 1) // COLS
atlas = np.zeros((rows * T, COLS * T, 4), np.uint8)
for i, c in enumerate(cells):
    y, x = divmod(i, COLS)
    atlas[y * T:(y + 1) * T, x * T:(x + 1) * T, :3] = c
    atlas[y * T:(y + 1) * T, x * T:(x + 1) * T, 3] = 255
used = {'%02x%02x%02x' % tuple(p) for p in np.unique(np.concatenate(cells).reshape(-1, 3), axis=0)}
assert used <= PALETTE, used - PALETTE
Image.fromarray(atlas, 'RGBA').save(os.path.join(HERE, 'ground.png'))

NOTES = (
    "Pick a tile per cell from its material and its neighbours (pick.js does this). "
    "Edge codes come from a hash of the edge's position and the seed, so the two cells "
    "sharing an edge always agree: vcode(x,y) is the edge on the LEFT of cell (x,y), "
    "hcode(x,y) the edge ABOVE it. "
    "Coursed materials (cobble, paving, kerb, embankment_top, embankment_face): "
    "L=vcode(x,y)%codes, R=vcode(x+1,y)%codes, cell=table[(L*codes+R)*interiors+i], "
    "i=interior hash%interiors. "
    "Textured (grass, garden): N=hcode(x,y), E=vcode(x+1,y), S=hcode(x,y+1), W=vcode(x,y), "
    "each %2; cell=table[((((N*2+E)*2+S)*2+W)*interiors)+i]; grass i=2 (flowers) about 1 in 8. "
    "Water: like coursed with codes=3; frames[f] is the same index into frame f's table; "
    "loop the 3 frames. Out-of-map neighbours count as the cell's own material. "
    "Kerb, embankment_top and embankment_face are 1-tile rows: place kerb between pavement "
    "and street, embankment_top then embankment_face above water."
)

ground = dict(
    tile=T, columns=COLS, image='ground.png', cellCount=len(cells),
    materials=mats,
    transitions=dict(
        scheme=("Wang edge codes inside each material (seamless variants) plus baked "
                "4-bit edge-mask transition tiles. Mask bits: N=1, E=2, S=4, W=8, set "
                "where the orthogonal neighbour is grass-like (grass or garden)."),
        grass_fringe=dict(
            appliesTo=list(HARD_WITH_FRINGE), neighbours=['grass', 'garden'],
            key="'mask,L,R'; L forced to 0 when mask has W, R forced to 0 when mask has E",
            desc=("grass<->paving and grass<->cobble: the hard tile carries a grass lip "
                  "on each side facing grass. The grass tile itself is unchanged."),
            tables=fringe_tables),
        embankment_lip=dict(
            desc=("grass above embankment_top: lawn overhangs the coping. Any other "
                  "material above (cobble<->embankment, paving) uses the plain coping, "
                  "whose top row is a mortar joint that meets the street's courses."),
            table=emb_lip),
        water_shore=dict(
            desc=("water<->embankment: water whose north neighbour is not water uses "
                  "the shore set (wet foot of the wall + shadow), animated, "
                  "index (L*3+R), water codes=3."),
            frames=shore_frames),
    ),
    notes=NOTES,
)
with open(os.path.join(HERE, 'ground.json'), 'w') as f:
    json.dump(ground, f, indent=1)

# refresh the table embedded in pick.js so it works without loading the json
pick_path = os.path.join(HERE, 'pick.js')
if os.path.exists(pick_path):
    src = open(pick_path).read()
    compact = json.dumps({'materials': mats, 'transitions': ground['transitions']},
                         separators=(',', ':'))
    src = re.sub(r'/\* BEGIN GROUND TABLE \*/.*?/\* END GROUND TABLE \*/',
                 lambda _: '/* BEGIN GROUND TABLE */ ' + compact + ' /* END GROUND TABLE */',
                 src, flags=re.S)
    open(pick_path, 'w').write(src)

print('cells', len(cells), 'atlas', atlas.shape[1], 'x', atlas.shape[0], 'colours', len(used))
