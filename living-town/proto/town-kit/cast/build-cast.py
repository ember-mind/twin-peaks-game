#!/usr/bin/env python3
"""Paint the Living Town resident atlas in the style of source-plate.png.

Method: a paper doll drawn pixel by pixel, never resampled. Heads are
hand-authored ASCII templates (one per hair style and direction); bodies are
drawn from per-row spans and 1-px-stepped limbs whose ends come from a small
pose table (stand, four walk frames, seated). Every pixel carries a material
(skin, hair, top, bottom, shoes, ...) and a part id. A shading pass then picks
each pixel's tone from its material's ramp: light comes from the upper left
(warm), so right edges and seams between parts fall to the shadow tone (cool)
and upper-left edges rise to the light tone. A selective outline in each
material's own dark closes the silhouette - coloured, never black. Every
colour is one of the plate's 56 palette colours (asserted below).

Left-facing frames are the right-facing geometry mirrored and then shaded
again, so the light stays on the upper left: the atlas has no mirrored rows.

Run: python build-cast.py   (paths are relative to this file)
Outputs: residents.png, residents.json, evidence/*.png
"""
import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(HERE)
LT = os.path.dirname(os.path.dirname(KIT))
PLATE = os.path.join(KIT, "source-plate.png")
OLD = os.path.join(LT, "assets", "inhabitants-hg-24.png")
EV = os.path.join(HERE, "evidence")

CELL = 32
CX = 16          # body centre column
FEET = 30        # lowest row of the shoes
PLATE_IM = Image.open(PLATE).convert("RGB")
PLATE_RGB = np.array(PLATE_IM)
PALETTE = {tuple(int(v) for v in c) for c in np.unique(PLATE_RGB.reshape(-1, 3), axis=0)}


def P(*rgb):
    assert tuple(rgb) in PALETTE, rgb
    return tuple(rgb)


# ---------------------------------------------------------------- ramps
# ramp = (light, base, shadow, deep, line); line is the outline colour.
NAVY = P(23, 25, 37)
INK = P(0, 4, 11)
UMBER = P(61, 38, 36)

RAMPS = {
    "skin_fair": (P(247, 217, 180), P(242, 190, 162), P(217, 177, 146), P(167, 101, 70), P(107, 66, 55)),
    "skin_olive": (P(217, 177, 146), P(202, 162, 121), P(151, 123, 92), P(128, 85, 68), UMBER),
    "skin_tan": (P(202, 162, 121), P(190, 137, 86), P(167, 101, 70), P(107, 66, 55), UMBER),
    "skin_deep": (P(167, 101, 70), P(128, 85, 68), P(107, 66, 55), P(61, 38, 36), NAVY),
    "hair_black": (P(80, 97, 111), P(67, 71, 76), P(23, 25, 37), P(23, 25, 37), INK),
    "hair_brown": (P(151, 123, 92), P(107, 66, 55), P(61, 38, 36), P(61, 38, 36), NAVY),
    "hair_auburn": (P(231, 161, 84), P(167, 101, 70), P(107, 66, 55), P(61, 38, 36), UMBER),
    "hair_blonde": (P(254, 222, 134), P(231, 191, 112), P(190, 137, 86), P(139, 81, 39), P(107, 66, 55)),
    "hair_grey": (P(203, 178, 175), P(167, 147, 152), P(112, 121, 124), P(96, 87, 83), P(67, 71, 76)),
    "hair_white": (P(223, 224, 200), P(203, 178, 175), P(167, 147, 152), P(151, 135, 122), P(96, 87, 83)),
    "rust": (P(190, 137, 86), P(167, 101, 70), P(107, 66, 55), P(61, 38, 36), UMBER),
    "brick": (P(167, 101, 70), P(128, 85, 68), P(107, 66, 55), P(61, 38, 36), UMBER),
    "teal": (P(73, 118, 136), P(34, 104, 92), P(25, 55, 77), P(23, 25, 37), NAVY),
    "blue": (P(143, 163, 172), P(96, 136, 156), P(73, 118, 136), P(25, 55, 77), NAVY),
    "denim": (P(96, 136, 156), P(73, 118, 136), P(25, 55, 77), P(23, 25, 37), NAVY),
    "navy": (P(80, 97, 111), P(25, 55, 77), P(23, 25, 37), P(23, 25, 37), INK),
    "mustard": (P(237, 173, 50), P(200, 157, 43), P(172, 126, 39), P(139, 81, 39), P(73, 66, 45)),
    "cream": (P(254, 246, 214), P(223, 224, 200), P(203, 178, 175), P(151, 135, 122), P(96, 87, 83)),
    "linen": (P(247, 217, 180), P(217, 177, 146), P(173, 154, 109), P(151, 123, 92), P(107, 66, 55)),
    "mauve": (P(203, 178, 175), P(167, 147, 152), P(96, 87, 83), P(67, 71, 76), UMBER),
    "moss": (P(113, 153, 82), P(84, 120, 74), P(53, 103, 48), P(41, 68, 46), P(9, 61, 29)),
    "slate": (P(130, 140, 149), P(112, 121, 124), P(80, 97, 111), P(67, 71, 76), NAVY),
    "charcoal": (P(96, 87, 83), P(67, 71, 76), P(23, 25, 37), P(23, 25, 37), INK),
    "cord": (P(151, 123, 92), P(123, 106, 90), P(96, 87, 83), P(73, 66, 45), UMBER),
    "shoe_brown": (P(128, 85, 68), P(107, 66, 55), P(61, 38, 36), P(61, 38, 36), NAVY),
    "shoe_black": (P(67, 71, 76), P(23, 25, 37), P(23, 25, 37), P(0, 4, 11), INK),
    "orange": (P(254, 222, 134), P(231, 161, 84), P(190, 137, 86), P(139, 81, 39), UMBER),
    "gold": (P(254, 222, 134), P(237, 173, 50), P(200, 157, 43), P(139, 81, 39), P(73, 66, 45)),
    "sea": (P(96, 136, 156), P(19, 121, 135), P(34, 104, 92), P(25, 55, 77), NAVY),
    "eye": (NAVY,) * 5,
    "glass": (P(143, 163, 172), P(130, 140, 149), P(112, 121, 124), P(67, 71, 76), NAVY),
}

# ---------------------------------------------------------------- heads
# 11 columns, column 0 at CX-5; row 0 is the head top (a template may start
# higher, see "top"). Hand-marked:
#   s skin   r skin in shadow (ear, nape)   m mouth   e eye   g glasses rim
#   h hair (auto-shaded)   l hair light   d hair strand/shadow
#   b beard (hair ramp)   k hat   n hat band   '.' empty
# "tail_<dir>" rows continue below the head (hair on shoulders or back);
# they are drawn behind the body facing down/right and over it facing up.
T_SHORT_UP = ["...hhhhh...",
              "..hllhhhh..",
              ".hllhhhhhh.",
              ".hhhhdhhhh.",
              ".hhhdhhhhh.",
              ".shhhhhhhs.",
              ".hhhhhhhhh.",
              "..hdhhdhh..",
              "...rrrrr..."]

HEADS = {
    "short": {
        "down": ["...hhhhh...",
                 "..hllhhhh..",
                 ".hllhhhhhh.",
                 ".hhhhhhdhh.",
                 ".hsssshhdh.",
                 ".sssssssss.",
                 ".ssesssess.",
                 "..sssmsss..",
                 "...sssss..."],
        "up": T_SHORT_UP,
        "right": ["...hhhhh...",
                  "..hllhhhh..",
                  ".hllhhhhhh.",
                  ".hhhhhhhhhh",
                  ".hhhhhhsss.",
                  ".hhdrsssss.",
                  ".hhhssssess",
                  "..hhssssm..",
                  "....ssss..."],
    },
    "beard": {
        "down": ["...hhhhh...",
                 "..hllhhhh..",
                 ".hllhhhhhh.",
                 ".hhhhhhdhh.",
                 ".hsssshhdh.",
                 ".sssssssss.",
                 ".ssesssess.",
                 "..bbbbbbb..",
                 "...bbbbb..."],
        "up": ["...hhhhh...",
               "..hllhhhh..",
               ".hllhhhhhh.",
               ".hhhhdhhhh.",
               ".hhhdhhhhh.",
               ".shhhhhhhs.",
               ".bhhhhhhhb.",
               "..hdhhdhh..",
               "...rrrrr..."],
        "right": ["...hhhhh...",
                  "..hllhhhh..",
                  ".hllhhhhhh.",
                  ".hhhhhhhhhh",
                  ".hhhhhhsss.",
                  ".hhdrsssss.",
                  ".hhhbsssess",
                  "..hhbbbsss.",
                  "...bbbbb..."],
    },
    "bob": {
        "down": ["...hhhhh...",
                 "..hllhhhh..",
                 ".hllhhhhhh.",
                 "hhhhhhhhdhh",
                 "hhhsssshdhh",
                 "hhssssssshh",
                 "hhsessseshh",
                 "hhhssmsshhh",
                 ".hh.sss.hh."],
        "up": ["...hhhhh...",
               "..hllhhhh..",
               ".hllhhhhhh.",
               "hhhhhhhhhhh",
               "hhhhdhhhhhh",
               "hhhhdhhhhhh",
               "hhhhhhdhhhh",
               "hhhhhhdhhhh",
               ".hh.rrr.hh."],
        "right": ["...hhhhh...",
                  "..hllhhhh..",
                  ".hllhhhhhh.",
                  "hhhhhhhhhhh",
                  "hhhhhhssss.",
                  "hhhdhhsssss",
                  "hhhdhhssess",
                  "hhhhhhssss.",
                  ".hhhh.sss.."],
    },
    "long": {
        "down": ["...hhhhh...",
                 "..hllhhhh..",
                 ".hllhhhhhh.",
                 ".hhhhhhhdh.",
                 "hhhhssssdhh",
                 "hhssssssshh",
                 "hhsessseshh",
                 "hhsssmssshh",
                 "hh.sssss.hh"],
        "tail_down": ["hh.......hh",
                      "hd.......dh",
                      ".h.......h."],
        "up": ["...hhhhh...",
               "..hllhhhh..",
               ".hllhhhhhh.",
               ".hhhhhhhhh.",
               "hhhhdhhhhhh",
               "hhhhdhhdhhh",
               "hhhhhhhdhhh",
               "hhdhhhhhhhh",
               "hhdhhhhhdhh"],
        "tail_up": [".hhhhhhhdh.",
                    ".hdhhhhhdh.",
                    "..hhhhhhh..",
                    "...hhdhh..."],
        "right": ["...hhhhh...",
                  "..hllhhhh..",
                  ".hllhhhhhh.",
                  ".hhhhhhhhhh",
                  "hhhhhhhsss.",
                  "hhhdhhsssss",
                  "hhhdhhssess",
                  "hhhhhrssss.",
                  "hhhh.sssss."],
        "tail_right": ["hhhh.......",
                       "hdhh.......",
                       ".hhh.......",
                       "..h........"],
    },
    "neat": {
        "down": ["...hhhhh...",
                 "..hhllhhh..",
                 ".hhllhhhhh.",
                 ".hdhhhhhhh.",
                 ".hhssssssh.",
                 ".sssssssss.",
                 ".sgegsgegs.",
                 "..ssbbbss..",
                 "...sssss..."],
        "up": T_SHORT_UP,
        "right": ["...hhhhh...",
                  "..hhllhhh..",
                  ".hhllhhhhh.",
                  ".hhhhhhhsh.",
                  ".hhhhsssss.",
                  ".hhdrsssss.",
                  ".hhhssgegss",
                  "..hhsssbs..",
                  "....ssss..."],
    },
    "bun": {
        "top": -1,
        "down": ["....lhh....",
                 "...hdddh...",
                 "..hllhhhh..",
                 ".hllhhhhhh.",
                 ".hhhhdhhhh.",
                 ".hsssssssh.",
                 ".sssssssss.",
                 ".ssesssess.",
                 "..sssmsss..",
                 "...sssss..."],
        "up": ["....lhh....",
               "...hdddh...",
               "..hllhhhh..",
               ".hllhhhhhh.",
               ".hhhhdhhhh.",
               ".hhhdhhdhh.",
               ".shhdhhdhs.",
               ".hhhhhhhhh.",
               "..hhhhhhh..",
               "...rrrrr..."],
        "right": ["...........",
                  ".lh........",
                  "hdhdhhhh...",
                  "hhllhhhhh..",
                  ".hlhhhhhhh.",
                  ".hhhhhhsss.",
                  ".hhdrsssss.",
                  ".hhhssssess",
                  "..hhssssm..",
                  "....ssss..."],
    },
    "curly": {
        "top": -1,
        "down": ["..hhlhhhh..",
                 ".hlhhhlhhh.",
                 "hlhhlhhhdhh",
                 "hhhlhhhdhhh",
                 "hhdhhhhhdhh",
                 "hhssssssshh",
                 ".sssssssss.",
                 ".ssesssess.",
                 "..sssmsss..",
                 "...sssss..."],
        "up": ["..hhlhhhh..",
               ".hlhhhlhhh.",
               "hlhhlhhhdhh",
               "hhhlhhhdhhh",
               "hhdhhhhhdhh",
               "hhhhdhhdhhh",
               "shhhhhhhhhs",
               ".hhdhhdhhh.",
               "..hhhhhhh..",
               "...rrrrr..."],
        "right": ["..hhlhhhh..",
                  ".hlhhhlhhh.",
                  "hlhhlhhhhhh",
                  "hhhlhhhdhhh",
                  "hhdhhhhhhs.",
                  "hhhhhhssss.",
                  ".hhdrsssss.",
                  ".hhhssssess",
                  "..hhssssm..",
                  "....ssss..."],
    },
    "cap": {
        "down": ["...kkkkk...",
                 "..kkkkkkk..",
                 ".kkkkkkkkk.",
                 ".kkkkkkkkk.",
                 "nnnnnnnnnnn",
                 ".hsssssssh.",
                 ".ssesssess.",
                 "..sssmsss..",
                 "...sssss..."],
        "up": ["...kkkkk...",
               "..kkkkkkk..",
               ".kkkkkkkkk.",
               ".kkkkkkkkk.",
               ".nnnnnnnnn.",
               ".shhhhhhhs.",
               ".hhhhhhhhh.",
               "..hdhhdhh..",
               "...rrrrr..."],
        "right": ["...kkkkk...",
                  "..kkkkkkk..",
                  ".kkkkkkkkk.",
                  ".kkkkkkkkk.",
                  ".kkkknnnnnn",
                  ".hhhrsssss.",
                  ".hhhssssess",
                  "..hhssssm..",
                  "....ssss..."],
    },
    "pigtails": {
        "down": ["...hhhhh...",
                 "..hllhhhh..",
                 ".hllhhhhhh.",
                 "hhhhhdhhhhh",
                 "hhssssssshh",
                 "hsssssssshh",
                 ".ssesssess.",
                 "..sssmsss..",
                 "...sssss..."],
        "tail_down": ["hh.......hh",
                      ".h.......h."],
        "up": ["...hhhhh...",
               "..hllhhhh..",
               ".hllhhhhhh.",
               "hhhhhdhhhhh",
               "hhhhhdhhhhh",
               "hhhhhdhhhhh",
               "hhhhhdhhhhh",
               "..hhhhhhh..",
               "...rrrrr..."],
        "tail_up": ["hh.......hh",
                    ".h.......h."],
        "right": ["...hhhhh...",
                  "..hllhhhh..",
                  ".hllhhhhhh.",
                  "hhhhhhhhhhh",
                  "hhhhhhhsss.",
                  "hhhhrsssss.",
                  ".hhhssssess",
                  "..hhssssm..",
                  "....ssss..."],
        "tail_right": ["hhh........",
                       ".hh........"],
    },
}

HEAD_CHARS = set(".srmehldbkng")
for style, t in HEADS.items():
    for k, rows in t.items():
        if k == "top":
            continue
        for row in rows:
            assert len(row) == 11 and set(row) <= HEAD_CHARS, (style, k, row)


# ---------------------------------------------------------------- canvas
class Doll:
    """A 32x32 label canvas: material, part id and a 'far' flag per pixel."""

    def __init__(self):
        self.mat = np.full((CELL, CELL), None, object)
        self.part = np.zeros((CELL, CELL), int)
        self.far = np.zeros((CELL, CELL), bool)
        self.fixed = np.full((CELL, CELL), -1, int)  # forced tone index
        self.next_part = 1
        self.meta = {}   # part id -> {"soft": seams against it are ignored, "bias": tone shift}

    def new_part(self, soft=False, bias=0, cyl=False, seam=3):
        self.next_part += 1
        self.meta[self.next_part] = {"soft": soft, "bias": bias, "cyl": cyl, "seam": seam}
        return self.next_part

    def put(self, x, y, mat, part, far=False, tone=-1):
        if 0 <= x < CELL and 0 <= y < CELL:
            self.mat[y, x] = mat
            self.part[y, x] = part
            self.far[y, x] = far
            self.fixed[y, x] = tone

    def span(self, y, x0, x1, mat, part, far=False):
        for x in range(x0, x1 + 1):
            self.put(x, y, mat, part, far)

    def limb(self, top, bottom, width, mat, part, far=False):
        """Thick pixel limb from top=(x, y) to bottom=(x, y), one span per row.
        x is the left column of the span; it steps at most one pixel a row."""
        (x0, y0), (x1, y1) = top, bottom
        n = max(1, y1 - y0)
        for i in range(y1 - y0 + 1):
            x = int(round(x0 + (x1 - x0) * i / n))
            self.span(y0 + i, x, x + width - 1, mat, part, far)

    def mirrored(self):
        """Mirror about the body centre (column CX stays CX-? -> x' = 2*CX - x)."""
        d = Doll()
        for y in range(CELL):
            for x in range(1, CELL):
                sx = 2 * CX - x
                if 0 <= sx < CELL:
                    d.mat[y, x] = self.mat[y, sx]
                    d.part[y, x] = self.part[y, sx]
                    d.far[y, x] = self.far[y, sx]
                    d.fixed[y, x] = self.fixed[y, sx]
        d.meta = dict(self.meta)
        d.next_part = self.next_part
        return d


# ---------------------------------------------------------------- residents
# build: head top row, torso rows, torso half width, arm width, leg width.
BUILDS = {
    "average": dict(top=6, torso=7, tw=4, arm=2),
    "slim": dict(top=5, torso=7, tw=3, arm=2),
    "tall": dict(top=4, torso=8, tw=4, arm=2),
    "stout": dict(top=7, torso=7, tw=5, arm=2),
    "elder": dict(top=7, torso=7, tw=4, arm=2, stoop=1),
    "child": dict(top=11, torso=4, tw=3, arm=2, child=True),
}

RESIDENTS = [
    dict(id="rust_jacket", label="orange jacket, brown hair", build="average", head="short",
         skin="skin_olive", hair="hair_brown", top="orange", accent="cream", collar="shirt",
         lower="trousers", bottom="charcoal", shoes="shoe_brown"),
    dict(id="teal_dress", label="sea-teal dress, gold scarf, black bob", build="slim", head="bob",
         skin="skin_fair", hair="hair_black", top="sea", accent="gold", collar="scarf",
         lower="dress", bottom="sea", legs="skin", shoes="shoe_black"),
    dict(id="linen_blouse", label="auburn hair, cream blouse, teal skirt", build="average", head="long",
         skin="skin_fair", hair="hair_auburn", top="cream", accent="cream", collar="v",
         lower="skirt", bottom="sea", legs="charcoal", shoes="shoe_brown"),
    dict(id="grey_coat", label="elder, teal coat, orange scarf, glasses", build="elder", head="neat",
         skin="skin_fair", hair="hair_grey", top="teal", accent="orange", collar="scarf",
         lower="coat", bottom="cord", shoes="shoe_brown"),
    dict(id="mauve_cardigan", label="elder, white bun, rust cardigan, cream shawl", build="stout", head="bun",
         skin="skin_olive", hair="hair_white", top="rust", accent="cream", collar="scarf",
         lower="skirt", bottom="navy", legs="cord", shoes="shoe_black"),
    dict(id="mustard_knit", label="curly hair, mustard knit", build="stout", head="curly",
         skin="skin_deep", hair="hair_black", top="mustard", accent="mustard", collar="none",
         lower="trousers", bottom="denim", shoes="shoe_brown"),
    dict(id="cord_cap", label="flat cap, moss work coat, gold scarf", build="tall", head="cap",
         skin="skin_tan", hair="hair_brown", hat="charcoal", hatband="charcoal", top="moss",
         accent="gold", collar="scarf", lower="trousers", bottom="cord", shoes="shoe_black"),
    dict(id="bearded_blue", label="beard, blue shirt", build="tall", head="beard",
         skin="skin_tan", hair="hair_brown", top="blue", accent="cream", collar="shirt",
         lower="trousers", bottom="charcoal", shoes="shoe_black"),
    dict(id="girl_pigtails", label="child, pigtails, gold dress", build="child", head="pigtails",
         skin="skin_deep", hair="hair_black", top="gold", accent="cream", collar="shirt",
         lower="dress", bottom="gold", legs="cream", shoes="shoe_brown"),
    dict(id="boy_blonde", label="child, blonde, brick jumper", build="child", head="short",
         skin="skin_fair", hair="hair_blonde", top="brick", accent="cream", collar="none",
         lower="trousers", bottom="denim", shoes="shoe_brown"),
]


def head_mat(r, ch):
    return {"s": r["skin"], "r": r["skin"], "m": r["skin"], "e": "eye", "h": r["hair"], "b": r["hair"],
            "l": r["hair"], "d": r["hair"],
            "k": r.get("hat", r["hair"]), "n": r.get("hatband", r["hair"]),
            "g": "glass"}[ch]


def draw_rows(d, rows, x0, y0, r, part):
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == ".":
                continue
            tone = {"r": 2, "m": 3, "n": 3, "l": 0, "d": 2}.get(ch, -1)
            if ch == "e":
                tone = 1
            if ch == "s":
                # the face is lit; its right edge and the chin/neck row sit a tone lower
                right = row[i + 1] if i + 1 < len(row) else "."
                last = j == len(rows) - 1
                tone = 1 if (right not in "sme" or last) else 0
            d.put(x0 + i, y0 + j, head_mat(r, ch), part, tone=tone)


# Pose table. Per frame: body lift (px up), and for the side view the ankle
# column offsets of the near/far legs, lifted feet and the near-arm swing;
# for the front/back view which foot is raised (by how much) and which hand
# swings forward (down one row) or back (up one row).
SIDE = {
    "stand": dict(lift=0, near=(0, 0), far=(1, 0), swing=0),
    "w0": dict(lift=0, near=(3, 0), far=(-3, 1), swing=-1),
    "w1": dict(lift=1, near=(0, 0), far=(1, 2), swing=0),
    "w2": dict(lift=0, near=(-3, 1), far=(3, 0), swing=1),
    "w3": dict(lift=1, near=(1, 2), far=(0, 0), swing=0),
}
FRONT = {
    "stand": dict(lift=0, raise_l=0, raise_r=0, hand_l=0, hand_r=0),
    "w0": dict(lift=0, raise_l=0, raise_r=2, hand_l=-1, hand_r=1),
    "w1": dict(lift=1, raise_l=0, raise_r=1, hand_l=0, hand_r=0),
    "w2": dict(lift=0, raise_l=2, raise_r=0, hand_l=1, hand_r=-1),
    "w3": dict(lift=1, raise_l=1, raise_r=0, hand_l=0, hand_r=0),
}


def draw_front(d, r, frame, back=False, seated=False):
    b = BUILDS[r["build"]]
    f = FRONT[frame]
    lift = f["lift"]
    drop = 3 if seated else 0
    tw, arm = b["tw"], b["arm"]
    y0 = b["top"] - lift + drop
    sy = y0 + 9                         # shoulder row
    hy = sy + b["torso"]                # first hip row
    lower = r["lower"]
    legs_mat = r.get("legs", r["bottom"])
    legs_mat = r["skin"] if legs_mat == "skin" else legs_mat
    head = HEADS[r["head"]]
    htop = y0 + head.get("top", 0)
    view = "up" if back else "down"

    # hair behind the body (long hair facing down)
    if not back and "tail_" + view in head:
        draw_rows(d, head["tail_" + view], CX - 5, y0 + 9, r, d.new_part())

    # --- legs and shoes
    lx0, lx1 = CX - tw + 1, CX - 1
    rx0, rx1 = CX + 1, CX + tw - 1
    if b.get("child"):
        lx0, rx1 = CX - 2, CX + 2
    if seated:
        lap = hy + 1
        # thighs come at the viewer: a wide lap, knees split by a seam
        pl, pr = d.new_part(), d.new_part()
        thigh_mat = r["bottom"] if lower in ("trousers", "coat") else r["bottom"]
        for y in (lap, lap + 1):
            d.span(y, CX - tw, CX - 1, thigh_mat, pl)
            d.span(y, CX, CX + tw, thigh_mat, pr)
        shin = legs_mat if lower in ("skirt", "dress") else r["bottom"]
        if lower == "coat":
            shin = r["bottom"]
        for x0, x1 in ((lx0, lx1), (rx0, rx1)):
            p = d.new_part()
            for y in range(lap + 2, FEET - 1):
                d.span(y, x0, x1, shin, p)
            ps = d.new_part()
            d.span(FEET - 1, x0, x1, r["shoes"], ps)
            d.span(FEET, x0 - (1 if x0 < CX else 0), x1 + (1 if x0 > CX else 0), r["shoes"], ps)
    else:
        for side, (x0, x1), rz in (("l", (lx0, lx1), f["raise_l"]), ("r", (rx0, rx1), f["raise_r"])):
            far = rz >= 2
            p = d.new_part()
            for y in range(hy + 2 - lift, FEET - 1 - rz):
                d.span(y, x0, x1, legs_mat, p, far)
                if side == "l" and x1 > x0 and y < FEET - 3 - rz:
                    d.put(x0, y, legs_mat, p, far, tone=0)
            ps = d.new_part()
            fy = FEET - rz
            d.span(fy - 1, x0, x1, r["shoes"], ps, far)
            if rz == 0:
                d.span(fy, x0 - (1 if side == "l" else 0), x1 + (1 if side == "r" else 0), r["shoes"], ps)
            else:
                d.span(fy, x0, x1, r["shoes"], ps, far)

    # --- hips / skirt / coat skirt
    ph = d.new_part()
    if lower in ("trousers",):
        for y in (hy, hy + 1):
            d.span(y, CX - tw + 1 if not b.get("child") else CX - 2,
                   CX + tw - 1 if not b.get("child") else CX + 2, r["bottom"], ph)
    else:
        mat = r["top"] if lower in ("dress", "coat") else r["bottom"]
        length = {"skirt": 5, "dress": 5, "coat": 6}[lower]
        if b.get("child"):
            length = 3
        if seated:
            length = 2
        for i in range(length):
            w = tw - 1 + (i + 1) // 2
            if b.get("child"):
                w = 2 + (i + 1) // 2
            d.span(hy + i, CX - w, CX + w, mat, ph)
        if length >= 3 and lower != "coat":
            # two folds fall to the hem; the hem's left end catches the light
            for i in range(length - 2, length):
                d.put(CX - 2, hy + i, mat, ph, tone=2)
                d.put(CX + 1, hy + i, mat, ph, tone=2)
            d.put(CX - 1, hy + 1, mat, ph, tone=0)
        if lower == "coat" and not back and not seated:
            # coat opening: a seam line down the middle, trousers showing below
            for i in range(1, length):
                d.put(CX, hy + i, r["top"], ph, tone=3)

    # --- torso
    pt = d.new_part()
    for i in range(b["torso"]):
        y = sy + i
        w = tw - 1 if i == 0 else tw
        d.span(y, CX - w, CX + w, r["top"], pt)
    # belly for stout builds sits in the silhouette already; waist seam
    if lower == "trousers":
        d.span(sy + b["torso"] - 1, CX - tw, CX + tw, r["top"], pt)
    # collar details (front only)
    col = r.get("collar", "none")
    if not back:
        if col == "v":
            d.put(CX, sy, r["skin"], pt)
            d.put(CX, sy + 1, r["skin"], pt, tone=2)
        elif col == "shirt":
            pa = d.new_part()
            d.span(sy, CX - 1, CX + 1, r["accent"], pa)
            d.put(CX, sy + 1, r["accent"], pa)
            d.put(CX, sy, r["skin"], pa, tone=2)
        elif col == "scarf":
            pa = d.new_part()
            d.span(sy, CX - 2, CX + 2, r["accent"], pa)
            d.span(sy + 1, CX - 1, CX + 1, r["accent"], pa)
            d.put(CX + 1, sy + 2, r["accent"], pa)
            d.put(CX + 1, sy + 3, r["accent"], pa)
        if lower == "coat" or col == "shirt":
            # jacket / coat opening: a placket seam down the middle
            for i in range(2, b["torso"] - (0 if lower == "coat" else 1)):
                d.put(CX, sy + i, r["top"], pt, tone=3)
        elif col == "v":
            # blouse / dress: a fold falling from the left breast
            d.put(CX - 2, sy + 3, r["top"], pt, tone=2)
            d.put(CX - 2, sy + 4, r["top"], pt, tone=2)
            d.put(CX - 1, sy + 5, r["top"], pt, tone=2)
    elif col == "scarf":
        pa = d.new_part()
        d.span(sy, CX - 2, CX + 2, r["accent"], pa)

    # light on the left shoulder of every garment
    for x in range(CX - tw + 1, CX - 1):
        if d.part[sy + 1, x] == pt and d.fixed[sy + 1, x] < 0:
            d.put(x, sy + 1, r["top"], pt, tone=0)
    if col == "none" or back:
        # knit rib / hem: alternating pixels on the last torso row
        for x in range(CX - tw, CX + tw + 1, 2):
            if d.part[sy + b["torso"] - 1, x] == pt:
                d.put(x, sy + b["torso"] - 1, r["top"], pt, tone=2)

    # --- arms (sleeve + hand); in the back view left and right swap
    hl, hr = f["hand_l"], f["hand_r"]
    if back:
        hl, hr = hr, hl
    alen = b["torso"] - 1
    for side, hand in (("l", hl), ("r", hr)):
        pa = d.new_part(bias=1 if side == "r" else 0)
        x0 = CX - tw - arm if side == "l" else CX + tw + 1
        if seated:
            # forearms fold onto the lap
            for y in range(sy + 1, sy + alen - 1):
                d.span(y, x0, x0 + arm - 1, r["top"], pa)
            ph2 = d.new_part()
            hx = CX - tw + 1 if side == "l" else CX + tw - 2
            d.span(sy + alen - 1, x0, x0 + arm - 1, r["top"], pa)
            d.span(sy + alen, hx, hx + 1, r["skin"], ph2)
            continue
        d.put(x0 + (arm - 1 if side == "l" else 0), sy, r["top"], pa)
        for y in range(sy + 1, sy + alen + min(hand, 0) + 1):
            d.span(y, x0, x0 + arm - 1, r["top"], pa)
        ph2 = d.new_part()
        hy2 = sy + alen + 1 + hand
        d.span(hy2, x0, x0 + arm - 1, r["skin"], ph2)
        if hand >= 0 and not b.get("child"):
            d.span(hy2 + 1, x0 + (1 if side == "l" else 0), x0 + (1 if side == "l" else 0), r["skin"], ph2)
        if hand > 0:
            d.span(hy2 - 1, x0, x0 + arm - 1, r["top"], pa)
        for x in range(x0, x0 + arm):          # cuff
            d.put(x, hy2 - 1, r["top"], pa, tone=2 if side == "l" else 3)
        if side == "l":                        # lit outer edge of the sleeve
            for y in range(sy + 1, hy2 - 2):
                d.put(x0, y, r["top"], pa, tone=0)

    # --- head
    rows = head["up" if back else "down"]
    draw_rows(d, rows, CX - 5, htop, r, d.new_part())
    if back and "tail_up" in head:
        draw_rows(d, head["tail_up"], CX - 5, y0 + 9, r, d.new_part())


def draw_side(d, r, frame):
    """Facing right."""
    b = BUILDS[r["build"]]
    f = SIDE[frame]
    lift = f["lift"]
    tw, arm = b["tw"], b["arm"]
    y0 = b["top"] - lift
    sy = y0 + 9
    hy = sy + b["torso"]
    lower = r["lower"]
    legs_mat = r.get("legs", r["bottom"])
    legs_mat = r["skin"] if legs_mat == "skin" else legs_mat
    head = HEADS[r["head"]]
    htop = y0 + head.get("top", 0)
    hx = b.get("stoop", 0)
    # torso depth
    back_x, front_x = CX - tw, CX + max(tw - 1, 2)
    if b.get("child"):
        back_x, front_x = CX - 2, CX + 1
    swing = f["swing"]
    alen = b["torso"] - 1
    shoulder = (CX - 1, sy + 1)
    arm = 2 if b.get("child") else 3     # the near arm reads as a limb, not a stripe

    def arm_draw(sw, far):
        pa = d.new_part(cyl=not far, seam=2)
        hand_x = shoulder[0] + 2 * sw
        end_y = sy + alen - (1 if sw else 0)
        d.limb(shoulder, (hand_x, end_y), arm, r["top"], pa, far)
        d.span(sy, shoulder[0], shoulder[0] + arm - 1, r["top"], pa, far)
        d.span(end_y, hand_x, hand_x + arm - 1, r["top"], pa, far, )
        for x in range(hand_x, hand_x + arm):
            d.put(x, end_y, r["top"], pa, far, tone=2)      # cuff
        ph = d.new_part()
        d.span(end_y + 1, hand_x, hand_x + 1, r["skin"], ph, far)
        if not b.get("child"):
            d.put(hand_x + (1 if sw >= 0 else 0), end_y + 2, r["skin"], ph, far)

    def leg_draw(dx, rz, far):
        p = d.new_part()
        hip = (CX - 2, hy + 1 - lift)
        ax = CX - 2 + dx
        w = 4 if not b.get("child") else 2
        if rz >= 2:
            # knee comes forward, foot tucks back and up
            knee = (CX - 1 + dx + 1, hy + 3 - lift)
            d.limb(hip, knee, w, legs_mat, p, far)
            d.limb(knee, (ax, FEET - 1 - rz), w, legs_mat, p, far)
        else:
            d.limb(hip, (ax, FEET - 2 - rz), w, legs_mat, p, far)
        ps = d.new_part()
        fy = FEET - rz
        d.span(fy - 1, ax, ax + w - 1, r["shoes"], ps, far)
        if rz <= 1:
            d.span(fy, ax, ax + w, r["shoes"], ps, far)
        else:
            d.span(fy, ax + 1, ax + w, r["shoes"], ps, far)

    # far arm (behind body) and far leg
    arm_draw(-swing, True)
    leg_draw(f["far"][0], f["far"][1], True)
    leg_draw(f["near"][0], f["near"][1], False)

    # hips / skirts
    ph = d.new_part()
    if lower == "trousers":
        for y in (hy, hy + 1):
            d.span(y - lift, back_x, front_x, r["bottom"], ph)
    else:
        mat = r["top"] if lower in ("dress", "coat") else r["bottom"]
        length = {"skirt": 5, "dress": 5, "coat": 6}[lower]
        if b.get("child"):
            length = 3
        for i in range(length):
            grow = (i + 1) // 2
            d.span(hy + i - lift, back_x - grow, front_x + (grow + 1) // 2, mat, ph)

    # torso
    pt = d.new_part()
    for i in range(b["torso"]):
        y = sy + i
        x0, x1 = back_x, front_x
        if i == 0:
            x0, x1 = x0 + 1, x1
        if 1 <= i <= 3 and not b.get("child"):
            x1 += 1                      # chest
        if r["build"] == "stout" and 3 <= i <= 6:
            x1 += 1
        if b.get("stoop") and i < 3:
            x0 += 0
            x1 += 1
        d.span(y, x0, x1, r["top"], pt)
    if r.get("collar") == "scarf":
        pa = d.new_part()
        d.span(sy, back_x + 1, front_x + 1, r["accent"], pa)
        d.put(front_x + 1, sy + 1, r["accent"], pa)
        d.put(front_x + 1, sy + 2, r["accent"], pa)

    if "tail_right" in head:
        draw_rows(d, head["tail_right"], CX - 5 + hx, y0 + 9, r, d.new_part())
    rows = head["right"]
    draw_rows(d, rows, CX - 5 + hx, htop, r, d.new_part())
    arm_draw(swing, False)


# ---------------------------------------------------------------- shading
# where a part's shadow side starts, as a fraction of its row width
SHADE_FROM = {"skin": 0.8, "hair": 0.7, "cloth": 0.8}


def shade(d):
    """Turn a label doll into an RGBA cell.

    Form shading per part and row: the right third of a wide span is in
    shadow, the left edge of its upper half catches the light; narrow parts
    only darken their right edge. Seams: a part's right edge against another
    (non-soft) part shades, so arms separate from the torso; the row above a
    different part below shades (waist, hem). Faces keep their hand-marked
    tones (ear, mouth) and only the far cheek of a wide face falls in shadow.
    Far parts (the limb behind the body) sit one tone down.
    """
    out = np.zeros((CELL, CELL, 4), np.uint8)
    filled = d.mat != None  # noqa: E711
    ys, xs = np.nonzero(filled)
    rows, ext = {}, {}
    for y, x in zip(ys, xs):
        p = d.part[y, x]
        r = rows.setdefault((p, y), [x, x])
        r[0], r[1] = min(r[0], x), max(r[1], x)
        e = ext.setdefault(p, [y, y])
        e[0], e[1] = min(e[0], y), max(e[1], y)

    def other(x, y, p):
        """True when (x, y) is empty or a different, non-soft part."""
        if not (0 <= x < CELL and 0 <= y < CELL) or not filled[y, x]:
            return True
        q = d.part[y, x]
        return q != p and not d.meta.get(q, {}).get("soft")

    for y, x in zip(ys, xs):
        m, p = d.mat[y, x], d.part[y, x]
        ramp = RAMPS[m]
        kind = "skin" if m.startswith("skin") else ("hair" if m.startswith("hair") else "cloth")
        meta = d.meta.get(p, {})
        if d.fixed[y, x] >= 0:
            t = d.fixed[y, x]
        else:
            x0, x1 = rows[(p, y)]
            w = x1 - x0 + 1
            y0, y1 = ext[p]
            upper = y <= y0 + (y1 - y0) * 0.5
            t = 1
            if w >= (7 if kind == "skin" else 4):
                rel = (x - x0) / (w - 1)
                if rel >= SHADE_FROM.get(kind, 0.67):
                    t = 2
                elif x == x0 and upper and kind != "skin":
                    t = 0
                elif kind == "hair" and y <= y0 + 2 and rel <= 0.4:
                    t = 0
            elif w >= 2 and x == x1 and kind != "skin":
                t = 2
            if meta.get("cyl") and x == x0 and w >= 2:
                t = 0
            if t < 3 and x + 1 < CELL and filled[y, x + 1] and other(x + 1, y, p):
                # seam against the next part; same cloth either side -> deep line
                t = meta.get("seam", 3) if (d.mat[y, x + 1] == m and kind == "cloth") else max(t, 2)
            if kind == "cloth" and t == 1 and y + 1 < CELL and filled[y + 1, x] \
                    and d.part[y + 1, x] != p and not d.meta.get(d.part[y + 1, x], {}).get("soft") \
                    and not d.mat[y + 1, x].startswith("skin"):
                t = 2
            t += meta.get("bias", 0)
        if d.far[y, x]:
            t += 1
        t = max(0, min(3, t))
        if m == "eye":
            t = 1
        out[y, x, :3] = ramp[t]
        out[y, x, 3] = 255

    # coloured outline: 4-neighbour ring in the darkest adjacent material line
    for y in range(CELL):
        for x in range(CELL):
            if filled[y, x]:
                continue
            best = None
            for dx, dy in ((0, 1), (0, -1), (-1, 0), (1, 0)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < CELL and 0 <= ny < CELL and filled[ny, nx]:
                    col = RAMPS[d.mat[ny, nx]][4]
                    if best is None or sum(col) < best[0]:
                        best = (sum(col), col)
            if best is not None:
                out[y, x, :3] = best[1]
                out[y, x, 3] = 255
    return out


def render(r, direction, frame):
    d = Doll()
    if direction == "down":
        draw_front(d, r, frame)
    elif direction == "up":
        draw_front(d, r, frame, back=True)
    elif direction == "right":
        draw_side(d, r, frame)
    elif direction == "left":
        draw_side(d, r, frame)
        d = d.mirrored()
    elif direction == "seated":
        draw_front(d, r, "stand", seated=True)
    return shade(d)


# ---------------------------------------------------------------- atlas
DIRS = ["down", "up", "left", "right"]
FRAMES = ["stand", "w0", "w1", "w2", "w3"]
COLS = 6            # stand, walk x4, seated
PER_ROW = 2         # residents side by side


def build_atlas():
    n = len(RESIDENTS)
    bands = (n + PER_ROW - 1) // PER_ROW
    atlas = np.zeros((bands * 4 * CELL, PER_ROW * COLS * CELL, 4), np.uint8)
    meta = []
    for i, r in enumerate(RESIDENTS):
        col0 = (i % PER_ROW) * COLS
        row0 = (i // PER_ROW) * 4
        rows = {}
        for k, dname in enumerate(DIRS):
            rows[dname] = row0 + k
            for j, fr in enumerate(FRAMES):
                cell = render(r, dname, fr)
                y, x = (row0 + k) * CELL, (col0 + j) * CELL
                atlas[y:y + CELL, x:x + CELL] = cell
        cell = render(r, "seated", "stand")
        y, x = row0 * CELL, (col0 + 5) * CELL
        atlas[y:y + CELL, x:x + CELL] = cell
        meta.append({"id": r["id"], "label": r["label"], "build": r["build"],
                     "col": col0, "rows": rows})
    return atlas, meta


def check_palette(atlas):
    px = atlas[atlas[..., 3] > 0][:, :3]
    cols = {tuple(int(v) for v in c) for c in np.unique(px, axis=0)}
    bad = cols - PALETTE
    assert not bad, bad
    return len(cols)


# ---------------------------------------------------------------- evidence
def up(im, k):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


def font(size):
    for f in ("/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Monaco.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


BG = (38, 40, 52)
FG = (230, 222, 205)


def sheet_evidence(atlas, meta):
    k = 3
    im = Image.fromarray(atlas, "RGBA")
    bg = Image.new("RGBA", im.size, (123, 106, 90, 255))  # cobble base
    bg.alpha_composite(im)
    big = up(bg, k)
    pad_top, pad_left = 34, 0
    canvas = Image.new("RGB", (big.width, big.height + pad_top), BG)
    canvas.paste(big.convert("RGB"), (pad_left, pad_top))
    dr = ImageDraw.Draw(canvas)
    f = font(12)
    dr.text((6, 4), "residents.png  x3  on cobble  - cols: stand w0 w1 w2 w3 seated(down row)",
            fill=FG, font=f)
    for m in meta:
        x = m["col"] * CELL * k + 4
        y = m["rows"]["down"] * CELL * k + pad_top + 2
        dr.text((x, y), m["id"], fill=(255, 255, 174), font=f, stroke_width=2, stroke_fill=(23, 25, 37))
        for dname, rr in m["rows"].items():
            dr.text((x + COLS * CELL * k - 44, rr * CELL * k + pad_top + 2), dname,
                    fill=FG, font=font(10), stroke_width=2, stroke_fill=(23, 25, 37))
    canvas.save(os.path.join(EV, "sheet-labelled.png"))


def walk_strip(atlas, meta):
    """Four residents: stand + the walk cycle twice, every direction, x4; plus walk.gif."""
    k = 4
    picks = [meta[0], meta[1], meta[5], meta[8]]
    atl = Image.fromarray(atlas, "RGBA")
    rows = []
    for m in picks:
        for dname in DIRS:
            rows.append((m, dname))
    strip = Image.new("RGBA", (CELL * 9, CELL * len(rows)), (123, 106, 90, 255))
    for ri, (m, dname) in enumerate(rows):
        for j, fr in enumerate(["stand", "w0", "w1", "w2", "w3", "w0", "w1", "w2", "w3"]):
            c = m["col"] + FRAMES.index(fr)
            cell = atl.crop((c * CELL, m["rows"][dname] * CELL, (c + 1) * CELL, (m["rows"][dname] + 1) * CELL))
            strip.alpha_composite(cell, (j * CELL, ri * CELL))
    big = up(strip, k).convert("RGB")
    canvas = Image.new("RGB", (big.width + 150, big.height), BG)
    canvas.paste(big, (150, 0))
    dr = ImageDraw.Draw(canvas)
    for ri, (m, dname) in enumerate(rows):
        dr.text((6, ri * CELL * k + 50), f"{m['id']}\n{dname}", fill=FG, font=font(13))
    canvas.save(os.path.join(EV, "walk-strip.png"))
    # animated preview of the same, native x4
    frames = []
    for j in range(4):
        fr = Image.new("RGBA", (CELL * 4, CELL * len(picks)), (123, 106, 90, 255))
        for pi, m in enumerate(picks):
            for di, dname in enumerate(DIRS):
                c = m["col"] + 1 + j
                cell = atl.crop((c * CELL, m["rows"][dname] * CELL, (c + 1) * CELL, (m["rows"][dname] + 1) * CELL))
                fr.alpha_composite(cell, (di * CELL, pi * CELL))
        frames.append(up(fr, k).convert("RGB"))
    frames[0].save(os.path.join(EV, "walk.gif"), save_all=True, append_images=frames[1:],
                   duration=150, loop=0)


def old_sprite(i):
    """Resident i of the old HG sheet, standing, facing down (24x24)."""
    old = Image.open(OLD).convert("RGBA")
    c, r = (i % 5) * 3, (i // 5) * 3
    return old.crop((c * 24, r * 24, c * 24 + 24, r * 24 + 24))


def paste_feet(scene, cell, fx, fy, feet=(16, 30)):
    scene.alpha_composite(cell, (fx - feet[0], fy - feet[1]))


def cell_of(atlas, m, dname, frame):
    c = m["col"] + (5 if frame == "seated" else FRAMES.index(frame))
    rr = m["rows"]["down" if frame == "seated" else dname]
    return Image.fromarray(atlas[rr * CELL:(rr + 1) * CELL, c * CELL:(c + 1) * CELL], "RGBA")


def drop_shadow(scene, fx, fy, w=9):
    """Soft ground shadow: plate pixels under the feet stepped one ramp darker,
    using plate colours only (nearest darker palette colour)."""
    a = np.array(scene)
    pal = np.array(sorted(PALETTE), float)
    lum = pal @ np.array([0.3, 0.59, 0.11])
    for dy in (-1, 0, 1):
        half = w // 2 - (1 if dy else 0)
        for dx in range(-half, half + 1):
            x, y = fx + dx, fy + dy
            if 0 <= y < a.shape[0] and 0 <= x < a.shape[1]:
                c = a[y, x, :3].astype(float)
                target = c * 0.62
                dist = ((pal - target) ** 2).sum(1)
                a[y, x, :3] = pal[int(np.argmin(dist))]
    return Image.fromarray(a, "RGBA")


def composite(atlas, meta):
    k = 4
    plate = PLATE_IM.convert("RGBA")
    scenes = [
        # name, crop box, placements (resident idx, dir, frame, feet x, feet y) relative to crop
        ("street-door", (60, 112, 190, 215),
         [(0, "down", "stand", 44, 46), (1, "right", "w0", 26, 88), (6, "left", "w2", 96, 92),
          (9, "down", "w1", 70, 80)]),
        ("lawn-bench", (170, 245, 300, 305),
         [(4, "down", "seated", 38, 43), (3, "down", "seated", 50, 43), (2, "left", "w1", 88, 50),
          (8, "right", "w0", 14, 54)]),
        ("cobble-lamp", (250, 150, 380, 230),
         [(7, "down", "stand", 32, 52), (5, "up", "w0", 58, 70), (3, "right", "w2", 90, 60),
          (6, "down", "w3", 112, 48)]),
    ]
    old_map = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 1, 6: 5, 7: 5, 8: 4, 9: 0}
    outs = []
    for name, box, places in scenes:
        base = plate.crop(box)
        new = base.copy()
        old = base.copy()
        for (ri, dname, frame, fx, fy) in sorted(places, key=lambda p: p[4]):
            new = drop_shadow(new, fx, fy)
            paste_feet(new, cell_of(atlas, meta[ri], dname, frame), fx, fy)
            old = drop_shadow(old, fx, fy)
            paste_feet(old, old_sprite(old_map[ri]), fx, fy, feet=(12, 23))
        w, h = base.size
        canvas = Image.new("RGB", (w * k * 2 + 12, h * k + 26), BG)
        canvas.paste(up(old, k).convert("RGB"), (0, 26))
        canvas.paste(up(new, k).convert("RGB"), (w * k + 12, 26))
        dr = ImageDraw.Draw(canvas)
        dr.text((6, 5), f"{name}: before (inhabitants-hg-24)  x{k}", fill=FG, font=font(13))
        dr.text((w * k + 18, 5), f"after (cast/residents.png)  x{k}", fill=FG, font=font(13))
        path = os.path.join(EV, f"scene-{name}.png")
        canvas.save(path)
        outs.append(path)
        # native-scale pair too, for honest 1x reading
        nat = Image.new("RGB", (w * 2 + 4, h), BG)
        nat.paste(old.convert("RGB"), (0, 0))
        nat.paste(new.convert("RGB"), (w + 4, 0))
        up(nat, 2).save(os.path.join(EV, f"scene-{name}-x2.png"))
    return outs


def main():
    os.makedirs(EV, exist_ok=True)
    atlas, meta = build_atlas()
    ncol = check_palette(atlas)
    Image.fromarray(atlas, "RGBA").save(os.path.join(HERE, "residents.png"))
    doc = {
        "about": ("Living Town residents painted in the source-plate style. Frame lookup: "
                  "cell column = resident.col + frames[name] (walk: frames.walk[i]); "
                  "cell row = resident.rows[dir]. Pixel rect = [col*32, row*32, 32, 32]. "
                  "Draw the cell so its 'feet' pixel lands on the actor's ground point. "
                  "'seated' exists only in the 'down' row: face down, hips on a seat whose "
                  "top edge is at cell row ~24 (feet still on the ground at row 30). "
                  "Left rows are drawn, not mirrored (light stays upper-left); mirrorLeft "
                  "is false. Built by build-cast.py; every colour is from source-plate.png."),
        "image": "residents.png",
        "cell": [CELL, CELL],
        "feet": [CX, FEET],
        "seat": [CX, 24],
        "mirrorLeft": False,
        "directions": DIRS,
        "frames": {"stand": 0, "walk": [1, 2, 3, 4], "seated": 5},
        "walkCycle": "walk[0] near/left foot planted, walk[1] passing (body up 1 px), "
                     "walk[2] other foot planted, walk[3] passing; ~6-8 fps",
        "colours": ncol,
        "residents": meta,
    }
    with open(os.path.join(HERE, "residents.json"), "w") as fh:
        json.dump(doc, fh, indent=1)
    sheet_evidence(atlas, meta)
    walk_strip(atlas, meta)
    composite(atlas, meta)
    print(f"residents.png {atlas.shape[1]}x{atlas.shape[0]}, {len(RESIDENTS)} residents, "
          f"{ncol} colours, all in plate palette")


if __name__ == "__main__":
    main()
