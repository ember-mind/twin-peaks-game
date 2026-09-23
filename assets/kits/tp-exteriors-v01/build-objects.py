#!/usr/bin/env python3
"""Build the Twin Peaks exterior object kit (objects/*.png, objects.json).

Two sources, both at native pixels (source/build-plates.py):
  source/double-r-plate.png   the Double R lot at dusk
  source/sheriff-plate.png    the sheriff's station at dusk

Cut objects are masks in plate coordinates (polygons, rects, colour trims);
their pixels are copied from the plate. Pixels hidden behind another object
(the facade behind a planter, a bench, a shrub) are repainted by copying the
same rows from an unobstructed stretch of the same facade.

The concepts crop every pine at the frame edge or behind a roof, and draw no
street lamp or fence run, so those are drawn here in the concepts' own
palette and manner (stepped tiers, one highlight family, 1 px dark outline).

objects.json follows the Living Town kit schema exactly (see
engine/ember-worldmap.js): id, file, w, h, anchor, footprint, depth, kind,
optional door {dx, dy, w, rect, open} and windows [[x, y, w, h]].

Run: python build-objects.py [--preview DIR]
"""
import json
import os
import random
from collections import deque

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OBJ_DIR = os.path.join(HERE, 'objects')
EV_DIR = os.path.join(HERE, 'evidence')
T = 16

PLATES = {k: np.array(Image.open(os.path.join(HERE, 'source', '%s-plate.png' % k)).convert('RGB'))
          for k in ('double-r', 'sheriff')}
H, W = 192, 256
PAL = {'%02x%02x%02x' % tuple(c) for c in
       np.array(Image.open(os.path.join(HERE, 'source', 'palette.png')).convert('RGB'))[::12, ::12].reshape(-1, 3)}


def C(h):
    assert h in PAL, h + ' is not in the plate palette'
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def cls(plate, hexes):
    rgb = PLATES[plate]
    m = np.zeros((H, W), bool)
    for h in hexes:
        m |= (rgb == np.array(C(h))).all(2)
    return m


def empty():
    return np.zeros((H, W), bool)


def rect(x0, y0, x1, y1):
    m = empty()
    m[max(0, y0):min(H, y1 + 1), max(0, x0):min(W, x1 + 1)] = True
    return m


def poly(*pts):
    im = Image.new('L', (W, H), 0)
    ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=1, outline=1)
    return np.array(im, bool)


def union(*ms):
    out = empty()
    for m in ms:
        out |= m
    return out


def flood_trim(mask, bg):
    """Drop `bg` pixels of `mask` 4-connected through bg to the mask's outside."""
    removable = mask & bg
    seen = np.zeros_like(mask)
    q = deque()
    for y, x in zip(*np.nonzero(removable)):
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if not (0 <= yy < H and 0 <= xx < W) or not mask[yy, xx]:
                seen[y, x] = True
                q.append((y, x))
                break
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and removable[yy, xx] and not seen[yy, xx]:
                seen[yy, xx] = True
                q.append((yy, xx))
    return mask & ~seen


def despeckle(mask, min_n=2):
    p = np.pad(mask, 1).astype(int)
    n = sum(p[1 + dy:H + 1 + dy, 1 + dx:W + 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
    return mask & (n >= min_n)


def largest(mask):
    lab = np.zeros((H, W), int)
    best, best_n, n_lab = 0, 0, 0
    for y, x in zip(*np.nonzero(mask)):
        if lab[y, x]:
            continue
        n_lab += 1
        q = deque([(y, x)])
        lab[y, x] = n_lab
        n = 0
        while q:
            cy, cx = q.popleft()
            n += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = cy + dy, cx + dx
                    if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n_lab
                        q.append((yy, xx))
        if n > best_n:
            best, best_n = n_lab, n
    return lab == best


def fill_holes(mask):
    ys, xs = np.nonzero(mask)
    x0, y0, x1, y1 = max(0, xs.min() - 1), max(0, ys.min() - 1), min(W - 1, xs.max() + 1), min(H - 1, ys.max() + 1)
    sub = mask[y0:y1 + 1, x0:x1 + 1]
    h, w = sub.shape
    out = np.zeros_like(sub)
    q = deque((y, x) for y in range(h) for x in (0, w - 1) if not sub[y, x])
    q.extend((y, x) for x in range(w) for y in (0, h - 1) if not sub[y, x])
    for y, x in q:
        out[y, x] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < h and 0 <= xx < w and not sub[yy, xx] and not out[yy, xx]:
                out[yy, xx] = True
                q.append((yy, xx))
    m = mask.copy()
    m[y0:y1 + 1, x0:x1 + 1] |= ~out
    return m


def dilate(mask, r=1):
    out = mask.copy()
    for _ in range(r):
        p = np.pad(out, 1)
        out = p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    return out


def row_fill(img, plate, hole, cols):
    """Fill hole pixels from the same row of the plate, donor columns tiled."""
    a, b = cols
    n = b - a + 1
    src = PLATES[plate]
    for y, x in zip(*np.nonzero(hole)):
        img[y, x] = src[y, a + (x - a) % n]


def col_fill(img, plate, hole, row):
    """Fill hole pixels from the same column at plate row `row`."""
    src = PLATES[plate]
    for y, x in zip(*np.nonzero(hole)):
        img[y, x] = src[row, x]


def clean_sides(mask, bg, depth=6):
    """Drop background-class pixels near each row's left and right ends:
    foliage the concepts paint against a building's side walls."""
    m = mask.copy()
    for y in range(H):
        xs = np.nonzero(m[y])[0]
        if not len(xs):
            continue
        for x in list(range(xs[0], min(xs[0] + depth, W))) + list(range(max(xs[-1] - depth + 1, 0), xs[-1] + 1)):
            if bg[y, x]:
                m[y, x] = False
    return m


# --------------------------------------------------------------------------
# Specs: cut from a plate (plate, mask, repaint) or drawn (draw -> RGBA
# numpy array). base = y of the ground line, left = x of the footprint's
# left edge, both in plate coords for cut specs and sprite coords for drawn.

SPECS = []


def add(**kw):
    SPECS.append(kw)
    return kw


SKY_DR = ['404c5a', '434e5d', '444f5d', '43505d', '926345', '7d553b', '484e4e']
SKY_SH = ['44505f', '425060', '43505d', '404c5a']
GREENS = ['1a2d2b', '1a312e', '152927', '20312c', '253c33', '2d4436', '3a553a', '44623d', '5d723f',
          '73823b', '606453', '55584e']
ASPHALT = ['44505f', '3d4a58', '445261', '425060', '3b4754', '465363', '404c5a', '444f5d', '434e5d',
           '363c46', '30393b', '43505d', '2d373a', '444f5e', '435161', '434f5e', '445161', '455262', '485666']
WALK = ['88847a', '99947b', 'ad9f85', '6c6a61', '767369', '616160', 'c0a678', 'f1b961', '878768', 'd8c899',
        'c2b797', '4e4f43']

# ---- the Double R ----------------------------------------------------------
DR_PLANTER_L = rect(29, 91, 81, 107)
DR_PLANTER_R = rect(174, 91, 226, 107)
DR_POLY = poly((29, 8), (215, 8), (228, 46), (228, 102), (21, 102), (21, 46))
DR_HIDDEN = (DR_PLANTER_L | DR_PLANTER_R) & DR_POLY
# the roof's far left end is painted brown with the sunset in the concept;
# at native size it reads as a stain, so it takes the roof's own courses
DR_ROOF_STAIN = cls('double-r', ['926345', '7d553b', '6d4931', '583d2d', '43403e']) & poly((22, 9), (62, 9), (62, 46), (22, 46))


def dr_repaint(img):
    row_fill(img, 'double-r', DR_HIDDEN, (84, 99))
    row_fill(img, 'double-r', DR_ROOF_STAIN, (64, 95))


add(id='double-r', kind='building', plate='double-r',
    mask=clean_sides(flood_trim(DR_POLY, cls('double-r', SKY_DR + GREENS)), cls('double-r', GREENS + ['152927', '1f1b1a']))
    | DR_HIDDEN | DR_ROOF_STAIN,
    repaint=[dr_repaint],
    base=103, left=16, fpw=13, fph=2,
    door=(114, 72, 142, 101), leaf=(129, 73, 141, 100),
    windows=[(37, 71, 93, 91), (163, 71, 219, 91)])


def planter(id_, box, left):
    x0, y0, x1, y1 = box
    m = rect(*box) & ~cls('double-r', WALK)
    # the planter box itself (red) and the bushes above it; drop facade bits
    m &= ~(cls('double-r', ['d8c899', 'f2e6ba', 'c0a678', 'b1464d', '752636']) & rect(x0, y0, x1, y1 - 7))
    m = fill_holes(largest(despeckle(m, 3))) & rect(*box)
    # footprint on the tile grid of the building (left 16, base 103), one
    # row in front of it; drawn and sorted at its own ground line
    return add(id=id_, kind='plant', plate='double-r', mask=m, base=119, ground=y1 + 1, left=left,
               fpw=3, fph=1)


planter('planter-l', (29, 91, 81, 107), 32)
planter('planter-r', (174, 91, 226, 107), 176)

add(id='bin', kind='prop', plate='double-r',
    mask=fill_holes(largest(flood_trim(rect(9, 64, 25, 90), cls('double-r', GREENS + [
        'ad9f85', '99947b', 'c0a678', 'd8c899', 'c2b797', '878768', '88847a'])))),
    base=91, left=9, fpw=1, fph=1)


def rr_sign_draw():
    """The roadside sign: board from the plate, the post and its red foot
    rebuilt (bushes hide most of the post in the concept)."""
    src = PLATES['double-r']
    x0, y0, x1, y1 = 226, 36, 253, 108
    w, h = x1 - x0 + 1, y1 - y0 + 1
    a = np.zeros((h, w, 4), np.uint8)
    board = rect(228, 38, 252, 68)
    for y, x in zip(*np.nonzero(board)):
        a[y - y0, x - x0] = (*src[y, x], 255)
    post = [C('1f1b1a'), C('6c6a61'), C('88847a'), C('616160'), C('1f1b1a')]
    px = 238
    for y in range(69, 101):
        for i, c in enumerate(post):
            a[y - y0, px + i - x0] = (*c, 255)
    foot = [C('1f1b1a')] + [C('752636')] * 7 + [C('5f222f')] * 2 + [C('1f1b1a')]
    for y in range(99, 106):
        for i, c in enumerate(foot):
            a[y - y0, 235 + i - x0] = (*(c if y < 105 else C('1f1b1a')), 255)
        a[y - y0, 236 - x0] = (*C('b1464d'), 255) if 99 < y < 104 else a[y - y0, 236 - x0]
    for x in range(236, 245):
        a[99 - y0, x - x0] = (*C('b1464d'), 255)
    return a, (x0, y0)


add(id='rr-sign', kind='prop', plate='double-r', draw=rr_sign_draw, base=106, left=232, fpw=1, fph=1,
    note='roadside sign; post and foot rebuilt, board from the concept')

def spill_draw():
    """The warm pools the diner's wall lanterns throw on the walk, from the
    concept: core and halo, half transparent so the walk shows through."""
    src = PLATES['double-r']
    x0, y0, x1, y1 = 88, 101, 167, 119
    a = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), np.uint8)
    alpha = {C('f1b961'): 150, C('c0a678'): 70}
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            k = tuple(int(v) for v in src[y, x])
            if k in alpha:
                a[y - y0, x - x0] = (*k, alpha[k])
    return a, (x0, y0)


add(id='light-spill', kind='decal', plate='double-r', draw=spill_draw, base=119, left=96, fpw=1, fph=0, depth=0,
    note='lantern light on the walk; drawn at dusk and night, empty by day')

# ---- the sheriff's station -------------------------------------------------
SH_BENCH = rect(43, 100, 85, 120)
SH_SHRUB_L = rect(17, 103, 41, 120)
SH_SHRUBS_R = rect(166, 103, 226, 120)
SH_HIDDEN = (SH_BENCH | SH_SHRUB_L | SH_SHRUBS_R) & rect(0, 0, 255, 111)


def sh_repaint(img):
    # the roof's east end: pines stand in front of it in the concept, so it
    # takes the west end's oak trim, mirrored
    src = PLATES['sheriff']
    for y in range(13, 55):
        for k in range(6):
            img[y, 206 - k] = src[y, 17 + k]
    row_fill(img, 'sheriff', SH_HIDDEN & rect(26, 0, 220, 255), (88, 103))
    col_fill(img, 'sheriff', SH_HIDDEN & rect(0, 0, 25, 255), 99)
    col_fill(img, 'sheriff', SH_HIDDEN & rect(221, 0, 255, 255), 99)


add(id='sheriff-station', kind='building', plate='sheriff',
    mask=rect(201, 13, 206, 54) | clean_sides(flood_trim(union(rect(17, 9, 206, 54), rect(15, 54, 230, 62), rect(19, 62, 228, 111)),
                                cls('sheriff', SKY_SH + GREENS)), cls('sheriff', GREENS))
    | (SH_HIDDEN & rect(19, 62, 228, 111)),
    repaint=[sh_repaint],
    base=112, left=14, fpw=13, fph=2,
    door=(110, 74, 142, 111), leaf=(127, 76, 140, 110),
    windows=[(38, 70, 91, 95), (166, 70, 209, 95)])

add(id='bench', kind='prop', plate='sheriff',
    mask=flood_trim(rect(44, 101, 84, 119), cls('sheriff', WALK + ['3c424b', '6c6a61', '99947b', '88847a',
                                                                  '616160', '767369', 'ad9f85', '55584e',
                                                                  '606453', '878768'])),
    base=128, ground=120, left=46, fpw=2, fph=1)


def shrub(id_, box, left, fpw=1):
    # on the station's tile grid (left 14, base 112), the row in front of it
    m = rect(*box) & cls('sheriff', GREENS + ['1c2325', '282423', '2c3638'])
    m = fill_holes(largest(despeckle(m, 3))) & rect(*box)
    return add(id=id_, kind='plant', plate='sheriff', mask=m, base=128, ground=box[3] + 1, left=left, fpw=fpw, fph=1)


shrub('shrub-1', (17, 103, 41, 119), 14, 2)
shrub('shrub-2', (166, 103, 190, 119), 174)
shrub('shrub-3', (189, 103, 208, 119), 190)
shrub('shrub-4', (207, 103, 226, 119), 206)

add(id='flagpole', kind='prop', plate='sheriff',
    mask=(rect(233, 23, 236, 112) & ~cls('sheriff', SKY_SH + GREENS + ['1c2325', '282423', '583d2d', '7d553b']))
    | (rect(228, 111, 241, 119) & ~cls('sheriff', GREENS + ['583d2d', '7d553b', '926345', 'c08151', '6d4931'])),
    base=128, ground=120, left=222, fpw=1, fph=1)

add(id='wheel-stop', kind='prop', plate='sheriff',
    mask=flood_trim(rect(32, 135, 65, 144), cls('sheriff', ASPHALT)),
    base=144, left=34, fpw=2, fph=0, depth=None,
    note='lies on the asphalt; no footprint, people step over it')

add(id='stall-line', kind='decal', plate='sheriff',
    mask=flood_trim(rect(17, 146, 25, 180), cls('sheriff', ASPHALT)),
    base=181, left=13, fpw=1, fph=0, depth=0, note='painted parking stall line')


def patches():
    """Asphalt repairs from the Double R lot: the dark stepped blobs."""
    dark = cls('double-r', ['363c46', '3b4754', '30393b', '2d373a', '3d4a58']) & rect(0, 122, 255, 191)
    dark &= ~dilate(cls('double-r', ['c2b797', 'ad9f85', '878768', 'd8c899']), 2)
    left = despeckle(dark, 3)
    out = []
    while left.any() and len(out) < 4:
        c = largest(left)
        left &= ~c
        ys, xs = np.nonzero(c)
        if c.sum() < 40:
            break
        if xs.min() < 2 or xs.max() > 253 or ys.max() > 189:
            continue
        out.append(fill_holes(c))
    return out


for i, m in enumerate(patches()):
    ys, xs = np.nonzero(m)
    add(id='asphalt-patch-%d' % (i + 1), kind='decal', plate='double-r', mask=m,
        base=ys.max() + 1, left=xs.min(), fpw=1, fph=0, depth=0, note='asphalt repair')

# ---- drawn in the concepts' manner ----------------------------------------
PINE = dict(out=C('152927'), d0=C('1a2d2b'), d1=C('20312c'), m0=C('253c33'), m1=C('2d4436'),
            l0=C('3a553a'), l1=C('44623d'), hi=C('5d723f'), dot=C('73823b'),
            bark=C('352c28'), bark2=C('583d2d'))


def pine(w, h, seed, dark=False):
    """A fir as the station concept draws them: a stepped silhouette whose
    tiers widen downward and pull back at each new tier, flat dark body, a
    lighter column left of the centre, sparse single-pixel needle lights, a
    short trunk. No outline: the silhouette sits on the dusk sky by value."""
    r = random.Random(seed)
    trunk_h = max(4, h // 12)
    a = np.zeros((h + trunk_h, w, 4), np.uint8)
    cx = (w - 1) / 2
    period = max(7, h // 7)
    halves = []
    for y in range(h):
        k = y / (h - 1)
        full = 0.5 + (w / 2 - 0.5) * k ** 0.92
        tier = (y % period) / period
        half = full * (0.72 + 0.28 * tier)          # pull back at each tier's top
        halves.append(max(0.5, half))
    for y in range(h):
        half = halves[y - y % 2]
        # stepped edge: widths move in whole pixels every two rows, a needle
        # tip poking out on the lit side now and then
        hl = int(round(half)) + (1 if y % 2 == 0 and r.random() < .2 else 0)
        hr = int(round(half))
        x0, x1 = int(round(cx - hl)), int(round(cx + hr))
        for x in range(max(0, x0), min(w, x1 + 1)):
            rel = (x - cx) / max(1.0, half)
            if -0.55 < rel < -0.05:
                c = PINE['m0']
            elif -0.25 < rel < 0.2 and y % period < period * 0.6:
                c = PINE['m1'] if (y // 2) % 3 else PINE['m0']
            elif rel > 0.6:
                c = PINE['d0']
            else:
                c = PINE['d1']
            a[y, x] = (*c, 255)
        if x0 >= 0 and y % period > period * 0.7:      # shadow under each tier's lip
            for x in range(max(0, x0), min(w, x1 + 1)):
                if (x - cx) > -half * 0.2:
                    a[y, x, :3] = PINE['d0']
    n = max(3, int(w * h / 70))
    for _ in range(n):
        y, x = r.randint(2, h - 3), r.randint(1, w - 2)
        if a[y, x, 3] and a[y, x - 1, 3] and a[y, x + 1, 3]:
            a[y, x, :3] = PINE['hi'] if r.random() < .7 else PINE['l1']
    tw = max(2, w // 10)
    tx0 = int(cx - tw / 2 + 0.5)
    for y in range(h - 2, h + trunk_h):
        for x in range(tx0, tx0 + tw):
            a[y, x] = (*(PINE['bark2'] if x == tx0 else PINE['bark']), 255)
    for x in range(tx0 - 1, tx0 + tw + 1):
        a[h + trunk_h - 1, x] = (*PINE['out'], 255)
    if dark:   # backdrop pines: one value step down, toward the sky
        rgb = a[:, :, :3].astype(int)
        a[:, :, :3] = np.clip(rgb * 0.7 + np.array([6, 10, 16]), 0, 255).astype(np.uint8)
    return a


PINES = [('pine-s', 22, 44, 1, 1), ('pine-m', 30, 68, 2, 1), ('pine-l', 38, 92, 3, 1), ('pine-xl', 46, 120, 4, 1),
         ('pine-m2', 28, 60, 12, 1), ('pine-l2', 40, 100, 13, 1)]
for pid, w, h, seed, fp in PINES:
    def draw(w=w, h=h, seed=seed):
        return pine(w, h, seed), None
    th = max(4, h // 12)
    add(id=pid, kind='tree', draw=draw, base=h + th - 1, left=w // 2 - 8, fpw=1, fph=1)


def lamp_draw():
    """A town street light: dark steel pole, curved arm, a hooded head with a
    warm lens; the concepts' lamp colours (warm lens f1b961, steel greys)."""
    w, h = 22, 58
    a = np.zeros((h, w, 4), np.uint8)
    steel, steel2, dark, lens, lens2, hood = C('3c424b'), C('55584e'), C('1c2325'), C('f1b961'), C('f2e6ba'), C('2c3638')

    def px(x, y, c):
        a[y, x] = (*c, 255)
    for y in range(8, h - 3):          # pole
        px(15, y, dark); px(16, y, steel2); px(17, y, steel); px(18, y, dark)
    for x in range(13, 21):            # base plate
        for y in range(h - 3, h):
            px(x, y, dark if y == h - 1 or x in (13, 20) else steel)
    for x in range(6, 17):             # arm
        px(x, 6, dark); px(x, 7, steel2)
    px(16, 8, steel)
    for x in range(1, 12):             # hood
        px(x, 5, dark); px(x, 6, hood); px(x, 7, hood)
    for x in range(2, 11):
        px(x, 8, lens2 if 4 <= x <= 8 else lens)
    for x in range(3, 10):
        px(x, 9, lens)
    px(0, 6, dark); px(0, 7, dark); px(12, 7, dark); px(1, 8, dark); px(11, 8, dark); px(2, 9, dark); px(10, 9, dark)
    return a, None


# Not the engine's `lamp` kind: its ground pool is a soft ramp of stacked
# translucent rects. The lens is a window the kit marks alwaysLit (so the
# lamp still relights the cast) and the pool is the crisp lamp-pool decal.
add(id='street-lamp', kind='streetlight', draw=lamp_draw, base=58, left=9, fpw=1, fph=1,
    windows=[(1, 5, 11, 9)], note='place lamp-pool on the same tile')


def pool_draw():
    """The street light's pool on the ground: a stepped ellipse in two
    flat tones, the diner spill's colours, half transparent."""
    w, h = 44, 14
    a = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        for x in range(w):
            d = ((x - (w - 1) / 2) / (w / 2)) ** 2 + ((y - (h - 1) / 2) / (h / 2)) ** 2
            if d < 0.36:
                a[y, x] = (*C('f1b961'), 90)
            elif d < 1:
                a[y, x] = (*C('c0a678'), 55)
    return a, None


add(id='lamp-pool', kind='decal', draw=pool_draw, base=7, left=25, fpw=1, fph=0, depth=0,
    note='light under a street-lamp on the same tile; faint at dusk, full at night, none by day')


def wall_lamp_draw():
    """The diner's brass wall lantern, for any facade."""
    src = PLATES['double-r']
    box = (99, 70, 111, 87)
    m = rect(*box) & ~cls('double-r', ['d8c899', 'c0a678', 'f2e6ba', '99947b', 'ad9f85', 'c2b797', '878768'])
    m = fill_holes(largest(m)) & rect(*box)
    x0, y0, x1, y1 = box
    a = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), np.uint8)
    for y, x in zip(*np.nonzero(m)):
        a[y - y0, x - x0] = (*src[y, x], 255)
    return a, None


add(id='wall-lamp', kind='lamp', draw=wall_lamp_draw, base=40, left=0, fpw=1, fph=0, light=[6, 8],
    note='hangs on a wall: place on the wall base row; drawn 22 px above it')


def fence_draw(n_posts_seg=1):
    """A split-rail fence segment, 32 px: an oak post and two rails, as the
    station's side fences."""
    oak, oak2, oakd, cap, out = C('7d553b'), C('926345'), C('583d2d'), C('c08151'), C('1f1b1a')
    w, h = 32, 20
    a = np.zeros((h, w, 4), np.uint8)

    def px(x, y, c):
        a[y, x] = (*c, 255)
    for x in range(w):                  # rails
        for y, c in ((4, out), (5, oak2), (6, oak), (7, oakd), (8, out), (11, out), (12, oak2), (13, oak), (14, oakd), (15, out)):
            px(x, y, c)
    for y in range(1, h - 1):           # post
        px(0, y, out); px(1, y, oak2); px(2, y, oak); px(3, y, oak); px(4, y, oakd); px(5, y, out)
    for x in range(0, 6):
        px(x, 0, out); px(x, 1, cap if 0 < x < 5 else out); px(x, h - 1, out)
    return a, None


add(id='fence', kind='prop', draw=fence_draw, base=20, left=0, fpw=2, fph=1,
    note='32 px split-rail run, post at its left; lay runs end to end, end with fence-post')


def fence_post_draw():
    a, _ = fence_draw()
    return a[:, :6].copy(), None


add(id='fence-post', kind='prop', draw=fence_post_draw, base=20, left=-5, fpw=1, fph=1)


def bush_draw(w, h, seed):
    """A round roadside bush in the Double R's lighter greens."""
    r = random.Random(seed)
    a = np.zeros((h, w, 4), np.uint8)
    lobes = [(w * 0.3, h * 0.6, w * 0.3), (w * 0.62, h * 0.5, w * 0.34), (w * 0.5, h * 0.35, w * 0.3)]
    for y in range(h):
        for x in range(w):
            best = None
            for lx, ly, lr in lobes:
                d = ((x - lx) ** 2 + ((y - ly) * 1.2) ** 2) ** 0.5 / lr
                if d < 1 and (best is None or d < best[0]):
                    best = (d, x - lx, y - ly)
            if best is None:
                continue
            d, dx, dy = best
            shade = dx * 0.6 + dy * 0.8
            c = C('5d723f') if shade < -3 else C('44623d') if shade < 1 else C('3a553a') if shade < 4 else C('2d4436')
            if y > h - 4:
                c = C('1a312e')
            a[y, x] = (*c, 255)
    for _ in range(w * h // 18):
        y, x = r.randint(1, h - 4), r.randint(1, w - 2)
        if a[y, x, 3]:
            a[y, x, :3] = r.choice((C('73823b'), C('5d723f'), C('1a312e'), C('2d4436')))
    alpha = a[:, :, 3] > 0
    p = np.pad(alpha, 1)
    edge = alpha & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
    a[edge, :3] = C('152927')
    return a, None


add(id='bush-1', kind='plant', draw=lambda: bush_draw(26, 18, 5), base=18, left=5, fpw=1, fph=1)
add(id='bush-2', kind='plant', draw=lambda: bush_draw(36, 24, 6), base=24, left=2, fpw=2, fph=1)


def road_dash_draw():
    a = np.zeros((2, 14, 4), np.uint8)
    a[:, :] = (*C('c0a678'), 255)
    a[1, ::5] = (*C('878768'), 255)
    return a, None


add(id='road-dash', kind='decal', draw=road_dash_draw, base=2, left=1, fpw=1, fph=0, depth=0,
    note='centre line dash of the road')


# ---- backdrop: dark pines across the top of the map -------------------------
BACKDROP_W, BACKDROP_H = 720, 72


def backdrop_draw():
    r = random.Random(99)
    a = np.zeros((BACKDROP_H, BACKDROP_W, 4), np.uint8)
    sky = [C('44505f'), C('425060'), C('404c5a'), C('3d4a58')]
    for y in range(BACKDROP_H):
        a[y, :] = (*sky[min(3, y * 4 // BACKDROP_H)], 255)
    rows = [(46, 18, 0.9, True), (52, 24, 1.0, True), (60, 30, 1.0, False)]
    for base_y, step, scale, dark in rows:
        x = -r.randint(0, step)
        while x < BACKDROP_W:
            h = int(r.randint(40, 70) * scale)
            w = max(16, int(h * 0.42))
            tree = pine(w, h, r.randint(0, 9999), dark=dark)
            th, tw = tree.shape[:2]
            ty = min(BACKDROP_H, base_y + r.randint(-4, 6)) - th
            for yy in range(th):
                for xx in range(tw):
                    X, Y = x + xx, ty + yy
                    if 0 <= X < BACKDROP_W and 0 <= Y < BACKDROP_H and tree[yy, xx, 3]:
                        a[Y, X] = tree[yy, xx]
            x += step + r.randint(-4, 6)
    # the forest floor line: darker duff so the backdrop meets the ground
    for y in range(BACKDROP_H - 10, BACKDROP_H):
        for x in range(BACKDROP_W):
            if a[y, x, :3].sum() > 0 and (a[y, x, :3] == sky[3]).all():
                a[y, x] = (*C('1a2d2b'), 255)
    return a, None


add(id='backdrop', kind='backdrop', draw=backdrop_draw, base=BACKDROP_H, left=0, fpw=0, fph=0, depth=0,
    note='fixed backdrop behind everything: dusk sky and three rows of dark pines')


# ==========================================================================
# OUTPUT

def render(spec):
    if 'draw' in spec:
        a, src = spec['draw']()
        return Image.fromarray(a, 'RGBA'), src
    img = PLATES[spec['plate']].copy()
    for rp in spec.get('repaint', []):
        rp(img)
    mask = spec['mask']
    ys, xs = np.nonzero(mask)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
    sub = img[y0:y1 + 1, x0:x1 + 1]
    alpha = np.where(mask[y0:y1 + 1, x0:x1 + 1], 255, 0).astype(np.uint8)
    rgba = np.dstack([sub, alpha])
    rgba[alpha == 0, :3] = 0
    return Image.fromarray(rgba, 'RGBA'), (int(x0), int(y0))


def entry(spec, im, src):
    sx, sy = src if src else (0, 0)
    w, h = im.size
    fpw, fph = spec.get('fpw', 1), spec.get('fph', 1)
    rows = max(fph, 1)
    left, base = spec['left'], spec['base']
    e = {'id': spec['id'], 'file': 'objects/%s.png' % spec['id'], 'w': w, 'h': h,
         'anchor': [int(left - sx), int(base - rows * T - sy)], 'footprint': [],
         'depth': int(spec.get('ground', base) - sy) if spec.get('depth') is None else int(spec['depth']),
         'kind': spec['kind']}
    if src:
        e['source'] = [spec['plate'], sx, sy]
    door_tiles = set()
    if 'door' in spec:
        dx0, dy0, dx1, dy1 = spec['door']
        t0, t1 = (dx0 - left) // T, (dx1 - left) // T
        dw = 1 if t0 == t1 else 2
        # the rect is the leaf that swings open (the right one of a double
        # door): the engine lights it as the doorway and walks people to it
        lx0, ly0, lx1, ly1 = spec.get('leaf', spec['door'])
        e['door'] = {'dx': int(t0), 'dy': rows - 1, 'w': dw,
                     'rect': [int(lx0 - sx), int(ly0 - sy), int(lx1 - lx0 + 1), int(ly1 - ly0 + 1)]}
        door_tiles = {(t0 + i, rows - 1) for i in range(dw)}
    if 'windows' in spec:
        e['windows'] = [[int(a - sx), int(b - sy), int(c - a + 1), int(d - b + 1)] for a, b, c, d in spec['windows']]
    if fph > 0:
        e['footprint'] = [[dx, dy] for dy in range(fph) for dx in range(fpw) if (dx, dy) not in door_tiles]
    for k in ('note', 'light'):
        if k in spec:
            e[k] = spec[k]
    return e


def door_open_sprite(size, drect):
    """The right leaf swung inward: a warm dark hall, the leaf's thin edge at
    the hinge jamb, the floor catching light."""
    w, h = size
    x, y, dw, dh = drect
    a = np.zeros((h, w, 4), np.uint8)
    hall, hall2, floor, floor2, edge, jamb = C('462828'), C('352c28'), C('7d553b'), C('c08151'), C('1f1b1a'), C('5f222f')
    for yy in range(dh):
        for xx in range(dw):
            c = hall2 if yy < 3 else hall
            if yy >= dh - 5:
                c = floor if yy < dh - 2 else floor2
            if xx == dw - 1:
                c = edge
            elif xx in (dw - 3, dw - 2):
                c = jamb if yy < dh - 2 else edge
            a[y + yy, x + xx] = (*c, 255)
    return Image.fromarray(a, 'RGBA')


def on_bg(im, bg=(255, 0, 255)):
    b = Image.new('RGBA', im.size, (*bg, 255))
    b.alpha_composite(im)
    return b.convert('RGB')


def build(preview=None):
    os.makedirs(OBJ_DIR, exist_ok=True)
    os.makedirs(EV_DIR, exist_ok=True)
    entries, sprites = [], []
    for spec in SPECS:
        im, src = render(spec)
        e = entry(spec, im, src)
        if 'door' in e:
            do = door_open_sprite(im.size, e['door']['rect'])
            do.save(os.path.join(OBJ_DIR, '%s-door-open.png' % spec['id']))
            e['door']['open'] = 'objects/%s-door-open.png' % spec['id']
        im.save(os.path.join(OBJ_DIR, '%s.png' % spec['id']))
        entries.append(e)
        sprites.append((e, im))
        if preview:
            s = 4
            w, h = im.size
            spr = on_bg(im).resize((w * s, h * s), Image.NEAREST)
            d = ImageDraw.Draw(spr)
            ax, ay = e['anchor']
            for dx, dy in e['footprint']:
                X, Y = (ax + dx * T) * s, (ay + dy * T) * s
                d.rectangle([X, Y, X + T * s - 1, Y + T * s - 1], outline=(0, 255, 255))
            d.line([(0, e['depth'] * s), (w * s, e['depth'] * s)], fill=(255, 255, 0))
            if 'door' in e:
                x, y, dw, dh = e['door']['rect']
                d.rectangle([x * s, y * s, (x + dw) * s - 1, (y + dh) * s - 1], outline=(255, 128, 0))
            for x, y, ww, hh in e.get('windows', []):
                d.rectangle([x * s, y * s, (x + ww) * s - 1, (y + hh) * s - 1], outline=(0, 128, 255))
            os.makedirs(preview, exist_ok=True)
            spr.save(os.path.join(preview, '%s.png' % spec['id']))
    made = {os.path.basename(e['file']) for e in entries} | {os.path.basename(e['door']['open']) for e in entries if 'door' in e}
    for f in os.listdir(OBJ_DIR):
        if f.endswith('.png') and not f.endswith('-day.png') and not f.endswith('-night.png') and f not in made:
            os.remove(os.path.join(OBJ_DIR, f))
    with open(os.path.join(HERE, 'objects.json'), 'w') as f:
        json.dump(entries, f, indent=1)
    sheet(sprites)
    return entries


def sheet(sprites, scale=2):
    """Every sprite on magenta with its id, shelf-packed, at 2x."""
    maxw = 1500
    placed, x, y, rowh = [], 8, 8, 0
    for e, im in sorted(sprites, key=lambda t: -t[1].size[1]):
        s = 1 if e['kind'] == 'backdrop' else scale
        w, h = im.size[0] * s, im.size[1] * s
        cw = max(w, 7 * len(e['id']))
        if x + cw > maxw and x > 8:
            x, y, rowh = 8, y + rowh + 22, 0
        placed.append((e, im, x, y, w, h))
        x += cw + 12
        rowh = max(rowh, h)
    out = Image.new('RGB', (maxw + 16, y + rowh + 30), (40, 40, 48))
    d = ImageDraw.Draw(out)
    for e, im, x, y, w, h in placed:
        out.paste(on_bg(im).resize((w, h), Image.NEAREST), (x, y))
        d.text((x, y + h + 4), e['id'], fill=(255, 255, 255))
    out.save(os.path.join(EV_DIR, 'objects-sheet.png'))


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', help='write per-object 4x previews here')
    a = ap.parse_args()
    print('%d objects' % len(build(a.preview)))
