#!/usr/bin/env python3
"""Cut the object sprite kit out of source-plate.png.

Every sprite is defined by a mask in plate coordinates (polygons, rects,
colour-class trims and per-pixel fixes). Pixels are copied from the plate;
only pixels hidden behind another object are repainted, and only with
pixels copied from elsewhere in the plate.

Run: python build-objects.py   (from anywhere; paths are relative to this file)
"""
import json
import os
from collections import deque

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
PLATE = os.path.join(HERE, "source-plate.png")
OBJ_DIR = os.path.join(HERE, "objects")
EV_DIR = os.path.join(HERE, "evidence")
TILE = 16

RGB = np.array(Image.open(PLATE).convert("RGB"))
H, W = RGB.shape[:2]
PAL, IDX = np.unique(RGB.reshape(-1, 3), axis=0, return_inverse=True)
IDX = IDX.reshape(H, W)


def pal(i):
    return tuple(int(v) for v in PAL[i])


def pal_index(rgb):
    hit = np.nonzero((PAL == np.array(rgb)).all(1))[0]
    assert len(hit), rgb
    return int(hit[0])


# Colour classes, by palette index (see evidence of the palette in the plate).
def _ids(*rgbs):
    return {pal_index(c) for c in rgbs}


GREEN = _ids((9, 61, 29), (41, 68, 46), (53, 103, 48), (84, 120, 74), (113, 153, 82),
             (88, 94, 50), (123, 148, 111), (164, 183, 86), (168, 179, 140),
             (185, 188, 112), (206, 221, 138), (120, 114, 41), (153, 144, 67))
DARK = _ids((0, 4, 11), (23, 25, 37))
GRASS = _ids((84, 120, 74), (53, 103, 48), (113, 153, 82), (123, 148, 111),
             (168, 179, 140), (88, 94, 50))
STONE = _ids((96, 87, 83), (123, 106, 90), (151, 123, 92), (151, 135, 122),
             (173, 154, 109), (112, 121, 124), (80, 97, 111), (67, 71, 76),
             (130, 140, 149), (167, 147, 152), (73, 66, 45), (202, 162, 121),
             (107, 66, 55), (61, 38, 36), (128, 85, 68))
WATER = _ids((25, 55, 77), (34, 104, 92), (73, 118, 136), (80, 97, 111),
             (67, 71, 76), (96, 136, 156), (19, 121, 135))
WARM = _ids((231, 161, 84), (231, 191, 112), (254, 222, 134), (255, 196, 62),
            (255, 255, 174), (237, 173, 50), (200, 157, 43), (172, 126, 39),
            (254, 246, 214), (255, 255, 255), (223, 224, 200), (195, 178, 77))


def cls(ids):
    return np.isin(IDX, list(ids))


def empty():
    return np.zeros((H, W), bool)


def rect(x0, y0, x1, y1):
    """Inclusive plate rect."""
    m = empty()
    m[max(0, y0):min(H, y1 + 1), max(0, x0):min(W, x1 + 1)] = True
    return m


def poly(*pts):
    im = Image.new("L", (W, H), 0)
    ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=1, outline=1)
    return np.array(im, bool)


def union(*ms):
    out = empty()
    for m in ms:
        out |= m
    return out


def flood_trim(mask, bg, seeds=None):
    """Remove pixels of `mask` that are `bg` and 4-connected through bg
    pixels to the outside of the mask (or to `seeds`)."""
    removable = mask & bg
    seen = np.zeros_like(mask)
    q = deque()
    ys, xs = np.nonzero(removable)
    for y, x in zip(ys, xs):
        edge = False
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if not (0 <= yy < H and 0 <= xx < W) or not mask[yy, xx]:
                edge = True
                break
        if edge or (seeds is not None and seeds[y, x]):
            seen[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and removable[yy, xx] and not seen[yy, xx]:
                seen[yy, xx] = True
                q.append((yy, xx))
    return mask & ~seen


def despeckle(mask, min_n=2):
    """Drop mask pixels with fewer than min_n 8-neighbours in the mask."""
    p = np.pad(mask, 1).astype(int)
    n = sum(p[1 + dy:H + 1 + dy, 1 + dx:W + 1 + dx]
            for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
    return mask & (n >= min_n)


def bbox(mask, pad=0):
    ys, xs = np.nonzero(mask)
    return (max(0, xs.min() - pad), max(0, ys.min() - pad),
            min(W - 1, xs.max() + pad), min(H - 1, ys.max() + pad))


def fill_holes(mask):
    """Fill transparent pixels fully enclosed by the mask."""
    x0, y0, x1, y1 = bbox(mask, 1)
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


def largest(mask):
    """Keep the largest 8-connected component."""
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


def big_parts(mask, min_n):
    """Keep 8-connected components of at least min_n pixels."""
    out = empty()
    left = mask.copy()
    while left.any():
        c = largest(left)
        left &= ~c
        if c.sum() < min_n:
            break
        out |= c
    return out


def pix(*pts):
    m = empty()
    for x, y in pts:
        m[y, x] = True
    return m


# --------------------------------------------------------------------------
# Repaint helpers: fill hidden pixels by copying plate pixels.

def tile_fill(img, hole, donor):
    """Fill `hole` pixels by tiling the donor rect (x0, y0, x1, y1 inclusive),
    phase-locked to plate coordinates so stone courses keep lining up."""
    x0, y0, x1, y1 = donor
    dw, dh = x1 - x0 + 1, y1 - y0 + 1
    for y, x in zip(*np.nonzero(hole)):
        img[y, x] = RGB[y0 + (y - y0) % dh, x0 + (x - x0) % dw]


def row_fill(img, hole, donor_cols):
    """Fill `hole` pixels with the same row, from donor columns [a, b] tiled."""
    a, b = donor_cols
    n = b - a + 1
    for y, x in zip(*np.nonzero(hole)):
        img[y, x] = RGB[y, a + (x - a) % n]


# --------------------------------------------------------------------------
# Object specs. Coordinates are plate pixels, rects inclusive.
#
# Each spec: id, kind, mask (bool plate array), optional repaint callable
# (img -> None, img is a plate-sized RGB copy), base (plate y of the ground
# line), left (plate x of the footprint's left edge), fp (footprint w, h in
# tiles), plus building extras.

SPECS = []


def add(**kw):
    SPECS.append(kw)
    return kw


def building_mask(chimney, roof, walls, extra=()):
    m = union(rect(*chimney), poly(*roof), rect(*walls), *extra)
    return m


def dilate(mask, r=1):
    out = mask.copy()
    for _ in range(r):
        p = np.pad(out, 1)
        out = (p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
    return out


def inpaint(img, hole, known):
    """Fill thin hidden areas (bars in front of foliage) from the nearest
    known neighbour, horizontal first."""
    known = known & ~hole
    todo = hole.copy()
    while todo.any():
        progress = False
        for dy, dx in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            src = np.zeros_like(known)
            ys, xs = np.nonzero(todo)
            for y, x in zip(ys, xs):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and known[yy, xx]:
                    img[y, x] = img[yy, xx]
                    src[y, x] = True
            if src.any():
                known |= src
                todo &= ~src
                progress = True
        if not progress:
            break


# Wall colours of the cottages: anything else low on a wall is an occluder.
WALLC = _ids((151, 135, 122), (173, 154, 109), (123, 106, 90), (151, 123, 92),
             (96, 87, 83), (167, 147, 152), (202, 162, 121), (203, 178, 175),
             (130, 140, 149), (112, 121, 124))


def wall_repaint(band, donor, protect=None):
    """Repaint the part of `band` hidden behind garden objects with wall
    texture tiled from `donor`."""
    def run(img):
        occ = band & ~cls(WALLC)
        if protect is not None:
            occ &= ~protect
        occ = fill_holes(dilate(occ, 1) & band) & band
        if protect is not None:
            occ &= ~protect
        tile_fill(img, occ, donor)
    return run


def foliage_repaint(mask, bars):
    """Fill fence bars / posts in front of a bush with nearby bush pixels."""
    def run(img):
        inpaint(img, mask & bars, mask)
    return run


# ==========================================================================
# Buildings. base = first ground row below the facade; left = facade's left
# edge. Footprint: facade width x 3 rows, minus the door tile(s).

def door_band(x0, y0, x1, y1):
    return rect(x0, y0, x1, y1)


add(id="cottage-1", kind="building",
    mask=union(rect(69, 61, 82, 68), poly((54, 68), (148, 68), (148, 112), (54, 112)),
               rect(57, 112, 149, 154), rect(94, 154, 117, 159)),
    repaint=[wall_repaint(rect(57, 141, 95, 154) | rect(116, 137, 150, 154),
                          donor=(662, 118, 671, 141),
                          protect=rect(94, 150, 117, 159) | rect(118, 139, 127, 153))],
    base=160, left=56, fpw=6, fph=3,
    door=(99, 127, 112, 153),
    windows=[(68, 118, 86, 138), (124, 119, 136, 138)])

add(id="cottage-2", kind="building",
    mask=union(rect(254, 51, 267, 66), poly((183, 65), (293, 65), (293, 112), (183, 112)),
               rect(186, 112, 290, 155), rect(221, 152, 246, 159)),
    repaint=[wall_repaint(rect(186, 138, 222, 155) | rect(246, 148, 290, 155),
                          donor=(214, 116, 221, 137),
                          protect=rect(221, 150, 246, 159) | rect(253, 134, 280, 148))],
    base=160, left=186, fpw=6, fph=3,
    door=(225, 124, 242, 152),
    windows=[(201, 116, 214, 134), (257, 116, 274, 136)])

add(id="cafe", kind="building",
    mask=union(rect(330, 50, 343, 66), poly((318, 64), (437, 64), (437, 106), (318, 106)),
               rect(318, 106, 437, 163)),
    repaint=[wall_repaint(rect(318, 138, 330, 163) | rect(328, 148, 366, 163) |
                          rect(386, 144, 403, 163) | rect(425, 138, 437, 163),
                          donor=(366, 144, 385, 163),
                          protect=rect(404, 118, 424, 163) | rect(336, 125, 384, 143))],
    base=164, left=318, fpw=7, fph=3,
    door=(404, 120, 424, 158),
    windows=[(336, 126, 384, 143)])

add(id="cottage-3", kind="building",
    mask=union(rect(519, 55, 533, 64), poly((459, 63), (543, 63), (543, 112), (459, 112)),
               rect(463, 112, 541, 157)),
    repaint=[wall_repaint(rect(463, 136, 500, 157) | rect(520, 124, 541, 157),
                          donor=(662, 118, 671, 141),
                          protect=rect(500, 124, 521, 157))],
    base=158, left=462, fpw=5, fph=3,
    door=(505, 126, 519, 156),
    windows=[(478, 116, 494, 136)])

add(id="cottage-4", kind="building",
    mask=union(rect(672, 52, 691, 63), poly((595, 62), (705, 62), (705, 114), (595, 114)),
               rect(597, 114, 702, 158)),
    repaint=[wall_repaint(rect(597, 150, 702, 158) | rect(686, 138, 702, 158),
                          donor=(662, 118, 671, 141),
                          protect=rect(636, 120, 660, 158) | rect(607, 134, 636, 150))],
    base=159, left=598, fpw=7, fph=3,
    door=(640, 124, 658, 156),
    windows=[(613, 118, 630, 136), (674, 118, 690, 136)])



# ==========================================================================
# Free-standing objects. A generous hand polygon, then the surrounding
# ground is flood-trimmed away from the outside through ground colours.

COBBLE_BG = _ids((96, 87, 83), (123, 106, 90), (151, 123, 92), (151, 135, 122),
                 (173, 154, 109), (112, 121, 124), (130, 140, 149), (167, 147, 152),
                 (202, 162, 121), (217, 177, 146), (73, 66, 45), (88, 94, 50),
                 (80, 97, 111), (67, 71, 76), (242, 190, 162), (203, 178, 175))
GRASS_BG = _ids((84, 120, 74), (113, 153, 82), (123, 148, 111), (168, 179, 140),
                (204, 209, 168), (153, 144, 67), (164, 183, 86))


def texture_bg(main_ids, dark_ids, r=2, main_frac=0.4, dark_frac=0.25):
    """Pixels whose neighbourhood reads as a ground texture: mostly
    `main_ids`, few `dark_ids` (foliage is mostly dark)."""
    k = 2 * r + 1
    mm = np.pad(cls(main_ids).astype(float), r)
    dd = np.pad(cls(dark_ids).astype(float), r)
    fm = sum(mm[dy:dy + H, dx:dx + W] for dy in range(k) for dx in range(k)) / (k * k)
    fd = sum(dd[dy:dy + H, dx:dx + W] for dy in range(k) for dx in range(k)) / (k * k)
    return (fm >= main_frac) & (fd <= dark_frac)


FOLIAGE_DARK = _ids((41, 68, 46), (23, 25, 37), (9, 61, 29), (0, 4, 11))
GRASSY = texture_bg({pal_index((84, 120, 74)), pal_index((53, 103, 48)), pal_index((113, 153, 82))},
                    FOLIAGE_DARK, r=2, main_frac=0.55, dark_frac=0.2)
BG_COBBLE = cls(COBBLE_BG)
BG_GRASS = cls(GRASS_BG) | GRASSY


def cutout(shape, bg, keep=None, min_n=2, holes=True):
    m = flood_trim(shape, bg)
    if keep is not None:
        m |= keep & shape
    m = despeckle(m, min_n)
    m = largest(m)
    if holes:
        m = fill_holes(m) & shape
    return m


LIT_STONE = _ids((123, 106, 90), (151, 123, 92), (151, 135, 122), (173, 154, 109),
                 (202, 162, 121), (96, 87, 83), (112, 121, 124), (217, 177, 146),
                 (231, 191, 112), (242, 190, 162), (123, 148, 111), (88, 94, 50),
                 (120, 114, 41), (153, 144, 67), (84, 120, 74), (53, 103, 48),
                 (113, 153, 82), (130, 140, 149), (167, 147, 152))


def lamp(id_, rects, fph=1, note=None):
    """rects: finial, lantern, post, base (plate, inclusive)."""
    shape = union(*[rect(*r) for r in rects])
    post = rects[2]
    base = rects[3]
    spec = add(id=id_, kind="lamp", mask=cutout(shape, cls(LIT_STONE), min_n=1),
               base=base[3] + 1, left=(post[0] + post[2]) // 2 - 7, fpw=1, fph=fph)
    if note:
        spec["note"] = note
    return spec


ON_PILLAR = "stands on a pillar cap; no footprint of its own"
lamp("lamp-1", [(20, 144, 25, 148), (16, 149, 29, 165), (20, 166, 25, 180), (18, 180, 28, 191)])
lamp("lamp-2", [(290, 145, 294, 150), (285, 151, 298, 165), (290, 166, 295, 180), (288, 180, 298, 193)])
lamp("lamp-3", [(587, 144, 592, 150), (584, 151, 595, 163), (587, 164, 592, 180), (585, 180, 594, 193)])
lamp("lamp-bridge-1", [(652, 202, 657, 208), (648, 209, 660, 221), (651, 222, 656, 233),
                       (650, 234, 658, 238)], fph=0, note=ON_PILLAR)
lamp("lamp-bridge-2", [(748, 203, 753, 208), (745, 209, 757, 221), (748, 222, 754, 232),
                       (747, 233, 755, 238)], fph=0, note=ON_PILLAR)
lamp("lamp-bridge-3", [(745, 299, 750, 305), (742, 305, 753, 318), (744, 319, 750, 328),
                       (743, 329, 751, 335)], fph=0, note=ON_PILLAR)


def thing(id_, kind, shape, bg, base, left, fpw=1, fph=1, **kw):
    return add(id=id_, kind=kind, mask=cutout(shape, bg, **{k: v for k, v in kw.items()
                                                          if k in ("keep", "min_n", "holes")}),
               base=base, left=left, fpw=fpw, fph=fph,
               **{k: v for k, v in kw.items() if k not in ("keep", "min_n", "holes")})


def erode(mask):
    p = np.pad(mask, 1)
    return (p[1:-1, 1:-1] & p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])


TRUNK = _ids((107, 66, 55), (61, 38, 36), (128, 85, 68), (73, 66, 45), (139, 81, 39))
LEAFY = GREEN | DARK | _ids((25, 55, 77), (67, 71, 76))
ROWS = np.arange(H)[:, None] * np.ones((1, W), int)


def foliage(shape, yg=None, trunk=None, extra_bg=None, warm=False):
    """Foliage cut: leafy colours inside `shape`, opened to drop thin dark
    mortar lines, grass texture flood-trimmed below plate row `yg`. The
    trunk rect adds bark and outline pixels only (not the ground shadow)."""
    leafy = LEAFY | WARM if warm else LEAFY
    m = shape & cls(leafy)
    m = dilate(erode(m)) & m
    if yg is not None:
        g = (GRASSY | cls(GRASS_BG)) & (ROWS >= yg)
        if extra_bg is not None:
            g |= extra_bg
        m = flood_trim(m, g)
    elif extra_bg is not None:
        m = flood_trim(m, extra_bg)
    area = shape
    if trunk is not None:
        m |= trunk & cls(TRUNK | DARK)
        area = shape | trunk
    m = largest(despeckle(m, 3))
    return fill_holes(m) & area


def plant(id_, kind, shape, base, left, fpw=1, fph=1, yg=None, trunk=None, **kw):
    warm = kw.pop("keep_warm", False)
    m = foliage(shape, yg, trunk, kw.pop("extra_bg", None), warm)
    return add(id=id_, kind=kind, mask=m, base=base, left=left, fpw=fpw, fph=fph, **kw)


# Park
def bench(id_, x0, x1, top, seat_gap, bottom, legs, base_left):
    """Back + seat rect with the grass seen through the slat gap removed,
    plus the two leg rects (dark pixels only)."""
    m = rect(x0, top, x1, bottom)
    m &= ~(cls(GREEN) & rect(x0 + 3, seat_gap, x1 - 3, seat_gap))
    m &= ~(cls(GREEN) & rect(x0 + 3, bottom, x1 - 3, bottom))
    for lx0, lx1 in legs:
        m |= rect(lx0, bottom + 1, lx1, bottom + 6) & ~cls(GRASS_BG | {pal_index((53, 103, 48))})
    return add(id=id_, kind="bench", mask=m, base=bottom + 7, left=base_left, fpw=2, fph=1)


bench("bench-1", 196, 231, 268, 276, 284, [(195, 199), (227, 231)], 198)
bench("bench-2", 493, 528, 268, 276, 284, [(493, 496), (525, 528)], 495)
add(id="bin", kind="prop", mask=rect(267, 270, 280, 287) | rect(268, 269, 278, 269),
    base=288, left=266, fpw=1, fph=1)

plant("tree-park-1", "tree",
      poly((0, 198), (30, 196), (48, 210), (58, 230), (58, 262), (50, 270), (47, 275),
           (30, 277), (14, 277), (0, 276)),
      293, 14, yg=258, trunk=rect(13, 270, 31, 292), note="clipped by the plate's left edge")
plant("tree-park-2", "tree",
      poly((118, 222), (130, 208), (150, 198), (172, 202), (186, 222), (188, 250),
           (178, 262), (164, 266), (142, 266), (122, 258), (116, 240)),
      278, 143, yg=256, trunk=rect(143, 256, 159, 277))
plant("tree-park-3", "tree",
      poly((232, 240), (240, 226), (255, 222), (268, 230), (274, 248), (270, 258), (262, 262),
           (246, 262), (234, 257)),
      271, 245, yg=256, trunk=rect(247, 258, 258, 270))
plant("tree-park-4", "tree",
      poly((400, 226), (408, 206), (432, 198), (456, 204), (470, 222), (474, 248),
           (474, 266), (458, 268), (430, 262), (402, 260), (398, 244)),
      277, 432, yg=256, trunk=rect(430, 256, 450, 276) | rect(451, 258, 458, 273))
plant("bush-park-2", "bush", rect(111, 272, 142, 299), 300, 111, fpw=2, yg=262)
plant("bush-park-3", "bush", rect(143, 284, 176, 299), 300, 144, fpw=2, yg=262)
plant("bush-park-4", "bush", rect(280, 270, 311, 299), 300, 280, fpw=2, yg=262)
plant("bush-park-5", "bush", rect(404, 274, 441, 299), 300, 406, fpw=2, yg=262)
plant("bush-park-6", "bush",
      poly((544, 262), (560, 256), (597, 256), (597, 286), (589, 286), (589, 299), (544, 299)),
      300, 551, fpw=3, yg=256)
plant("bush-park-7", "bush", rect(598, 254, 631, 286), 287, 606, fpw=2, yg=250)


# --------------------------------------------------------------------------
# Front gardens and the café frontage. Bushes stop at the fence top: what is
# below is hidden by the fence in the plate.

GARDEN_BG = cls(WALLC) | BG_COBBLE
FRONT_BG = BG_COBBLE | cls(WALLC)

plant("bush-garden-1", "bush", rect(40, 137, 95, 165), 166, 44, fpw=3, yg=130,
      extra_bg=GARDEN_BG)
plant("bush-garden-2", "bush", rect(122, 133, 178, 165), 166, 126, fpw=3, yg=130,
      extra_bg=GARDEN_BG)
plant("bush-garden-3", "bush", rect(176, 136, 219, 165), 166, 181, fpw=2, yg=130,
      extra_bg=GARDEN_BG)
plant("flowers-garden-1", "bush", rect(446, 134, 502, 165), 166, 450, fpw=3, yg=130,
      extra_bg=GARDEN_BG, keep_warm=True)
plant("bush-garden-4", "bush", rect(520, 122, 553, 170), 171, 529, fpw=2,
      extra_bg=GARDEN_BG)
plant("bush-garden-5", "bush", rect(596, 146, 653, 165), 166, 600, fpw=3, yg=130,
      extra_bg=GARDEN_BG)
plant("hedge-garden-1", "bush", rect(669, 157, 703, 183), 184, 670, fpw=2, yg=130,
      extra_bg=GARDEN_BG)
plant("tree-garden-1", "tree", rect(702, 92, 752, 168), 169, 718, yg=150,
      extra_bg=GARDEN_BG | cls({pal_index((80, 97, 111)), pal_index((112, 121, 124))}))

thing("planter-1", "prop", rect(305, 136, 326, 171), FRONT_BG, 172, 308)
thing("planter-2", "prop", rect(425, 144, 436, 163), FRONT_BG, 164, 423)
thing("table-set", "prop", rect(326, 155, 369, 174), FRONT_BG, 175, 332, fpw=2)
thing("a-frame-sign", "prop", rect(387, 148, 402, 169), FRONT_BG, 170, 387)
thing("barrel-1", "prop", rect(447, 126, 464, 151), FRONT_BG | cls(GREEN), 152, 448)
thing("barrel-2", "prop", rect(686, 139, 704, 164), FRONT_BG | cls(GREEN), 165, 688)



# --------------------------------------------------------------------------
# Fences, posts, the street balustrade and the steps.

LIGHT_STONE = _ids((96, 87, 83), (123, 106, 90), (151, 123, 92), (151, 135, 122),
                   (173, 154, 109), (112, 121, 124), (130, 140, 149), (167, 147, 152),
                   (202, 162, 121), (217, 177, 146), (73, 66, 45), (80, 97, 111),
                   (203, 178, 175), (242, 190, 162))
BARS = _ids((0, 4, 11), (23, 25, 37), (25, 55, 77), (41, 68, 46), (80, 97, 111))


def see_through(shape, keep_ids):
    """Railings and fences: keep only the bar colours, the gaps go clear."""
    return despeckle(shape & cls(keep_ids), 1)


add(id="fence-iron", kind="fence", note="32 px repeatable segment",
    mask=see_through(rect(50, 168, 81, 180), BARS | _ids((67, 71, 76), (112, 121, 124))),
    base=181, left=50, fpw=2, fph=1)
add(id="fence-wood", kind="fence", note="32 px repeatable segment",
    mask=see_through(rect(706, 164, 737, 180), set(range(len(PAL))) - GREEN),
    base=181, left=706, fpw=2, fph=1)

RAIL_KEEP = _ids((0, 4, 11), (23, 25, 37), (25, 55, 77), (41, 68, 46), (80, 97, 111))
add(id="balustrade", kind="fence", note="32 px repeatable segment, iron post on its left",
    mask=see_through(rect(509, 234, 540, 241), RAIL_KEEP) | rect(509, 233, 540, 233)
         | rect(509, 242, 540, 254) | rect(509, 230, 512, 241),
    base=255, left=509, fpw=2, fph=1)
add(id="steps", kind="prop", mask=rect(332, 238, 392, 258), base=259, left=334,
    fpw=4, fph=0, note="walkable: the way down from the street to the park")

def mask_of(*ids):
    return union(*[sp["mask"] for sp in SPECS if sp["id"] in ids])


# The full runs as they stand in the plate (the segments above are the
# repeatable pieces cut from them).
IRON_KEEP = BARS | _ids((67, 71, 76), (112, 121, 124))
for i, r in enumerate([(45, 168, 85, 180), (125, 165, 147, 180), (177, 165, 215, 180),
                       (451, 165, 485, 180), (524, 165, 549, 180), (601, 165, 629, 180)], 1):
    add(id="fence-iron-%d" % i, kind="fence", mask=see_through(rect(*r), IRON_KEEP),
        base=r[3] + 1, left=r[0], fpw=max(1, round((r[2] - r[0] + 1) / TILE)), fph=1)
add(id="fence-wood-1", kind="fence",
    mask=see_through(rect(702, 164, 739, 180), set(range(len(PAL))) - GREEN),
    base=181, left=704, fpw=2, fph=1)
for i, (x0, x1) in enumerate([(86, 93), (117, 124), (216, 224), (486, 493), (516, 523),
                              (594, 600), (630, 638), (659, 668)], 1):
    thing("gate-post-%d" % i, "fence", rect(x0, 162, x1, 182), cls(GREEN), 183, (x0 + x1) // 2 - 7)
thing("gate-wood-1", "fence", rect(243, 164, 254, 181), cls(GREEN), 182, 241)
add(id="wall-garden-low-1", kind="fence", base=182, left=14, fpw=2, fph=1,
    mask=rect(14, 166, 44, 181) & ~dilate(mask_of("lamp-1")))
add(id="wall-garden-low-2", kind="fence", mask=rect(148, 165, 176, 182), base=183, left=148,
    fpw=2, fph=1)
plant("planter-box-1", "prop", rect(255, 164, 283, 182), 183, 261, fpw=2, yg=150,
      extra_bg=BG_COBBLE)
PILLAR_BG = cls(GREEN) | cls(_ids((80, 97, 111), (25, 55, 77), (67, 71, 76)))
for i, r in enumerate([(14, 108, 21, 165), (441, 104, 450, 181), (550, 96, 557, 181),
                       (740, 98, 750, 183)]):
    thing("pillar-garden-%d" % i, "fence", rect(*r), PILLAR_BG, r[3] + 1, (r[0] + r[2]) // 2 - 7)

# Gap foliage between the houses, below the backdrop line.
for i, (r, yg) in enumerate([((22, 112, 56, 166), None), ((150, 112, 186, 165), 112),
                             ((294, 112, 318, 160), None), ((451, 112, 463, 130), None),
                             ((558, 112, 596, 166), 112)]):
    plant("garden-foliage-%d" % i, "bush", rect(*r), r[3] + 1, r[0], fph=0, yg=yg,
          extra_bg=GARDEN_BG, note="gap foliage between houses; flat top at the backdrop line")

# Street balustrade runs, stone posts and the stair pillars.
TREES_IN_FRONT = mask_of("tree-park-1", "tree-park-2", "tree-park-3", "tree-park-4",
                         "bush-park-7")


def rail_run(x0, x1):
    """The run minus what the park trees hide (left transparent)."""
    m = see_through(rect(x0, 228, x1, 241), RAIL_KEEP) | rect(x0, 233, x1, 233) \
        | rect(x0, 242, x1, 254)
    return largest(m & ~TREES_IN_FRONT) | (m & ~TREES_IN_FRONT & ~rect(0, 0, W, 232))


for i, (x0, x1) in enumerate([(50, 203), (218, 317), (408, 554), (569, 629)], 1):
    add(id="balustrade-run-%d" % i, kind="fence", mask=rail_run(x0, x1), base=255, left=x0,
        fpw=max(1, round((x1 - x0 + 1) / TILE)), fph=1,
        note="gaps where the park trees stand in front")
for i, (x0, x1) in enumerate([(204, 217), (555, 568)], 1):
    add(id="balustrade-post-%d" % i, kind="fence", mask=rect(x0, 227, x1, 254), base=255,
        left=(x0 + x1) // 2 - 7)
for i, (x0, x1) in enumerate([(318, 331), (393, 407)], 1):
    add(id="balustrade-pillar-%d" % i, kind="fence", mask=rect(x0, 222, x1, 256), base=257,
        left=(x0 + x1) // 2 - 7)
for i, r in enumerate([(210, 198, 228, 205), (525, 198, 541, 205)], 1):
    add(id="drain-%d" % i, kind="prop", mask=rect(*r), base=r[3] + 1, left=r[0], fph=0,
        note="street grate, walkable")


# --------------------------------------------------------------------------
# Waterside

WATER_BG = cls(_ids((25, 55, 77), (34, 104, 92), (73, 118, 136), (96, 136, 156),
                    (19, 121, 135)))
jetty = rect(320, 277, 399, 332)
jetty = flood_trim(jetty, (cls(GRASS_BG) | GRASSY | cls({pal_index((53, 103, 48))})) & (ROWS < 306))
jetty = flood_trim(jetty, WATER_BG & (ROWS >= 318))
add(id="jetty", kind="jetty", mask=largest(jetty), base=333, left=320, fpw=5, fph=0,
    note="walkable deck; posts at both ends")

add(id="embankment", kind="prop", note="32 px repeatable wall face between grass and water",
    mask=rect(176, 301, 207, 319), base=320, left=176, fpw=2, fph=1)
JETTY = SPECS[-2]["mask"]
add(id="embankment-run-1", kind="prop", mask=rect(0, 300, 319, 319) & ~JETTY, base=320,
    left=0, fpw=20, fph=1)
add(id="embankment-run-2", kind="prop", base=320, left=400, fpw=13, fph=1,
    mask=(rect(400, 300, 599, 319) | rect(589, 286, 631, 299))
    & ~JETTY & ~mask_of("bush-park-6", "bush-park-7"))


def bridge_mask():
    near = poly((630, 222), (668, 222), (668, 244), (682, 256), (752, 328), (762, 328),
                (762, 352), (738, 356), (700, 334), (656, 304), (630, 302))
    far = poly((737, 222), (767, 222), (767, 282), (758, 276), (745, 262), (737, 258))
    m = near | far
    m = flood_trim(m, WATER_BG & (ROWS >= 296))
    m &= ~(cls(GREEN) & (ROWS >= 340))
    return largest(m) | far


add(id="bridge", kind="bridge", mask=bridge_mask(), base=357, left=630, fph=0,
    note="parapets, piers and arches only; the deck is cobble ground drawn by the map; "
         "clipped by the plate's right edge")

# --------------------------------------------------------------------------
# Foreground trees along the bottom edge: always in front.

def fg(shape):
    m = shape & cls(GREEN | DARK)
    m = dilate(erode(m)) & m
    m = flood_trim(m, WATER_BG)
    return fill_holes(big_parts(despeckle(m, 3), 80)) & shape


for fid, shp in (("foreground-left", rect(0, 330, 345, H - 1)),
                 ("foreground-right", rect(588, 336, W - 1, H - 1))):
    m = fg(shp)
    x0, y0, x1, y1 = bbox(m)
    add(id=fid, kind="foreground", mask=m, base=y1 + 1, left=x0, fph=0, depth=y1 - y0 + 1,
        note="always drawn in front of actors")

# Park flower clumps (petals and the leaves right under them) and the lily
# pads on the river, found as clusters.
PETALS = WARM | _ids((223, 224, 200), (254, 246, 214), (204, 209, 168), (247, 217, 180),
                     (195, 178, 77), (185, 188, 112), (206, 221, 138))


def clusters(seed, grow):
    """Bounding rects of groups of `seed` pixels closer than `grow` px."""
    g = dilate(seed, grow)
    out = []
    left = g.copy()
    while left.any():
        c = largest(left)
        left &= ~c
        x0, y0, x1, y1 = bbox(c & seed)
        out.append((x0, y0, x1, y1))
    return sorted(out)


taken = union(*[sp["mask"] for sp in SPECS])
park = rect(0, 256, 640, 299) & ~taken
for i, (x0, y0, x1, y1) in enumerate(clusters(park & cls(PETALS), 3), 1):
    shp = rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1) & park
    pet = shp & cls(PETALS)
    m = pet | (dilate(pet, 1) & shp & ~cls({pal_index((84, 120, 74))}))
    add(id="flowers-park-%d" % i, kind="bush", mask=m, base=y1 + 2, left=x0, fph=0,
        note="ground decoration, walkable")

river = rect(0, 318, 700, 350) & ~taken
pads = river & cls(GREEN) & ~cls(_ids((34, 104, 92)))
pads = despeckle(pads, 1)
pad_rects = [r for r in clusters(pads, 2) if (r[2] - r[0] + 1) * (r[3] - r[1] + 1) >= 6]
for i, (x0, y0, x1, y1) in enumerate(pad_rects, 1):
    shp = rect(x0, y0, x1, y1)
    add(id="lilypads-%d" % i, kind="prop", mask=shp & pads | (shp & cls(DARK) & dilate(pads)),
        base=y1 + 1, left=x0, fph=0, note="floats on the river")

# --------------------------------------------------------------------------
# Backdrop: sky, hills and forest above the back row, buildings removed.

BACKDROP_H = 112
MIRROR_BAND = 22   # rows of hill/forest above a building mirrored into its hole


def render_backdrop():
    """Remove the buildings and fill each column of the hole by mirroring,
    back and forth, the band of hill and forest right above it."""
    holes = empty()
    for sp in SPECS:
        if sp["kind"] == "building" or sp["id"] in ("tree-garden-1", "pillar-garden-3"):
            holes |= sp["mask"]
    holes = dilate(holes, 2)  # the roof ridge and outline pixels just outside the masks
    holes[BACKDROP_H:] = False
    img = RGB[:BACKDROP_H].copy()
    for x in range(W):
        col = holes[:BACKDROP_H, x]
        y = 0
        while y < BACKDROP_H:
            if not col[y]:
                y += 1
                continue
            t = y
            while y < BACKDROP_H and col[y]:
                y += 1
            n = min(MIRROR_BAND, t)
            for yy in range(t, y):
                d = (yy - t) % (2 * n)
                src = t - 1 - d if d < n else t - n + (d - n)
                img[yy, x] = RGB[src, x]
    rgba = np.dstack([img, np.full((BACKDROP_H, W), 255, np.uint8)])
    return Image.fromarray(rgba, "RGBA"), (0, 0)


add(id="backdrop", kind="backdrop", render=render_backdrop, mask=rect(0, 0, W - 1, BACKDROP_H - 1),
    base=BACKDROP_H, left=0, fph=0, depth=0,
    note="fixed backdrop behind everything; buildings removed and filled from the "
         "hills and forest above them")


# ==========================================================================
# OUTPUT

MAGENTA = (255, 0, 255)
DOOR_DARK = pal_index((61, 38, 36))
DOOR_SHADOW = pal_index((23, 25, 37))
DOOR_FLOOR = pal_index((107, 66, 55))
DOOR_FLOOR_LIT = pal_index((128, 85, 68))


def door_open_sprite(size, drect, leaf_rgb, edge_rgb):
    """Door opening: dark warm interior, leaf swung inward as a thin edge on
    the hinge (left) side, floor catching a little light."""
    w, h = size
    x, y, dw, dh = drect
    a = np.zeros((h, w, 4), np.uint8)
    for yy in range(dh):
        for xx in range(dw):
            if yy < 2:
                c = pal(DOOR_SHADOW)
            elif yy >= dh - 2:
                c = pal(DOOR_FLOOR_LIT) if xx >= 3 else pal(DOOR_FLOOR)
            elif yy >= dh - max(3, dh // 5):
                c = pal(DOOR_FLOOR)
            else:
                c = pal(DOOR_DARK)
            if xx == 0:
                c = edge_rgb
            elif xx in (1, 2) and yy >= 1:
                c = leaf_rgb if xx == 1 else edge_rgb
            a[y + yy, x + xx] = (*c, 255)
    return Image.fromarray(a, "RGBA")


def render(spec):
    img = RGB.copy()
    for r in spec.get("repaint", []):
        r(img)
    mask = spec["mask"]
    x0, y0, x1, y1 = bbox(mask)
    sub = img[y0:y1 + 1, x0:x1 + 1]
    alpha = np.where(mask[y0:y1 + 1, x0:x1 + 1], 255, 0).astype(np.uint8)
    rgba = np.dstack([sub, alpha])
    rgba[alpha == 0, :3] = 0
    return Image.fromarray(rgba, "RGBA"), (x0, y0)


def entry(spec, im, src):
    sx, sy = src
    w, h = im.size
    fpw, fph = spec.get("fpw", 1), spec.get("fph", 1)
    rows = max(fph, 1)
    left = spec["left"]
    base = min(spec["base"], sy + h)  # a trimmed mask may end above the nominal base
    e = {"id": spec["id"], "file": "objects/%s.png" % spec["id"], "w": w, "h": h,
         "anchor": [left - sx, base - rows * TILE - sy],
         "footprint": [], "depth": spec.get("depth", base - sy),
         "source": [sx, sy], "kind": spec["kind"]}
    door_tiles = set()
    if "door" in spec:
        dx0, dy0, dx1, dy1 = spec["door"]
        t0 = (dx0 - left) // TILE
        t1 = (dx1 - left) // TILE
        dw = 1 if t0 == t1 else 2
        e["door"] = {"dx": int(t0), "dy": rows - 1, "w": dw,
                     "rect": [dx0 - sx, dy0 - sy, dx1 - dx0 + 1, dy1 - dy0 + 1]}
        door_tiles = {(t0 + i, rows - 1) for i in range(dw)}
    if "windows" in spec:
        e["windows"] = [[a - sx, b - sy, c - a + 1, d - b + 1] for a, b, c, d in spec["windows"]]
    if "footprint" in spec:
        e["footprint"] = spec["footprint"]
    elif fph > 0:
        e["footprint"] = [[dx, dy] for dy in range(fph) for dx in range(fpw)
                          if (dx, dy) not in door_tiles]
    for k in ("note",):
        if k in spec:
            e[k] = spec[k]
    return e


def door_colours(spec, im, src):
    dx0, dy0, dx1, dy1 = spec["door"]
    region = RGB[dy0:dy1 + 1, dx0:dx1 + 1].reshape(-1, 3)
    cols, cnt = np.unique(region, axis=0, return_counts=True)
    order = np.argsort(-cnt)
    lum = cols.sum(1)
    leaf = tuple(int(v) for v in cols[order[0]])
    edge = tuple(int(v) for v in cols[np.argmin(lum)])
    return leaf, edge


def on_bg(im, bg=MAGENTA):
    b = Image.new("RGBA", im.size, (*bg, 255))
    b.alpha_composite(im)
    return b.convert("RGB")


def build(only=None, preview=None):
    os.makedirs(OBJ_DIR, exist_ok=True)
    os.makedirs(EV_DIR, exist_ok=True)
    entries, sprites = [], []
    for spec in SPECS:
        if only and spec["id"] not in only:
            continue
        im, src = spec["render"]() if "render" in spec else render(spec)
        e = entry(spec, im, src)
        if "door" in spec:
            leaf, edge = door_colours(spec, im, src)
            do = door_open_sprite(im.size, e["door"]["rect"], leaf, edge)
            do.save(os.path.join(OBJ_DIR, "%s-door-open.png" % spec["id"]))
            e["door"]["open"] = "objects/%s-door-open.png" % spec["id"]
        im.save(os.path.join(OBJ_DIR, "%s.png" % spec["id"]))
        entries.append(e)
        sprites.append((e, im))
        if preview:
            s = 4
            w, h = im.size
            sx, sy = src
            crop = Image.fromarray(RGB[sy:sy + h, sx:sx + w]).resize((w * s, h * s), Image.NEAREST)
            spr = on_bg(im).resize((w * s, h * s), Image.NEAREST)
            d = ImageDraw.Draw(spr)
            ax, ay = e["anchor"]
            for dx, dy in e["footprint"]:
                X, Y = (ax + dx * TILE) * s, (ay + dy * TILE) * s
                d.rectangle([X, Y, X + TILE * s - 1, Y + TILE * s - 1], outline=(0, 255, 255))
            d.line([(0, e["depth"] * s), (w * s, e["depth"] * s)], fill=(255, 255, 0))
            if "door" in e:
                x, y, dw, dh = e["door"]["rect"]
                d.rectangle([x * s, y * s, (x + dw) * s - 1, (y + dh) * s - 1], outline=(255, 128, 0))
            for x, y, ww, hh in e.get("windows", []):
                d.rectangle([x * s, y * s, (x + ww) * s - 1, (y + hh) * s - 1], outline=(0, 128, 255))
            out = Image.new("RGB", (w * s * 2 + 8, h * s), (0, 0, 0))
            out.paste(crop, (0, 0))
            out.paste(spr, (w * s + 8, 0))
            os.makedirs(preview, exist_ok=True)
            out.save(os.path.join(preview, "%s.png" % spec["id"]))
    if only:
        return entries, sprites
    made = {os.path.basename(e["file"]) for e in entries}
    made |= {os.path.basename(e["door"]["open"]) for e in entries if "door" in e}
    for f in os.listdir(OBJ_DIR):
        if f.endswith(".png") and f not in made:
            os.remove(os.path.join(OBJ_DIR, f))
    with open(os.path.join(HERE, "objects.json"), "w") as f:
        json.dump(entries, f, indent=1, default=int)
    sheet(sprites)
    recompose(sprites)
    return entries, sprites


def sheet(sprites, scale=3):
    """All sprites on magenta with their ids, shelf-packed."""
    from PIL import ImageFont
    font = ImageFont.load_default()
    maxw = 1400
    placed, x, y, rowh = [], 8, 8, 0
    for e, im in sorted(sprites, key=lambda t: -t[1].size[1]):
        w, h = im.size[0] * scale, im.size[1] * scale
        if e["kind"] == "backdrop":
            w, h = im.size[0] * 2, im.size[1] * 2
        cw = max(w, 8 * len(e["id"]))
        if x + cw > maxw and x > 8:
            x, y, rowh = 8, y + rowh + 22, 0
        placed.append((e, im, x, y, w, h))
        x += cw + 12
        rowh = max(rowh, h)
    H_ = y + rowh + 30
    out = Image.new("RGB", (maxw + 16, H_), (40, 40, 48))
    d = ImageDraw.Draw(out)
    for e, im, x, y, w, h in placed:
        out.paste(on_bg(im).resize((w, h), Image.NEAREST), (x, y))
        d.text((x, y + h + 4), e["id"], fill=(255, 255, 255), font=font)
    out.save(os.path.join(EV_DIR, "objects-sheet.png"))


def recompose(sprites, scale=2):
    """Sprites back at their source positions over flat dark ground, beside
    the plate."""
    ground = Image.new("RGBA", (W, H), (28, 30, 36, 255))
    order = sorted(sprites, key=lambda t: (t[0]["kind"] != "backdrop",
                                           t[0]["kind"] == "foreground",
                                           t[0]["source"][1] + t[0]["depth"]))
    for e, im in order:
        ground.alpha_composite(im, tuple(e["source"]))
    plate = Image.open(PLATE).convert("RGBA")
    out = Image.new("RGB", (W * scale, H * scale * 2 + 8), (0, 0, 0))
    out.paste(plate.convert("RGB").resize((W * scale, H * scale), Image.NEAREST), (0, 0))
    out.paste(ground.convert("RGB").resize((W * scale, H * scale), Image.NEAREST), (0, H * scale + 8))
    out.save(os.path.join(EV_DIR, "objects-recompose.png"))


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated ids (skips json/evidence)")
    ap.add_argument("--preview", help="write per-object 4x previews here")
    a = ap.parse_args()
    ents, _ = build(a.only.split(",") if a.only else None, a.preview)
    print("%d objects" % len(ents))
