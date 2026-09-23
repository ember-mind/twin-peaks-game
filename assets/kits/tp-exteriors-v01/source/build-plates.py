#!/usr/bin/env python3
"""Bring the two approved exterior concepts down to native pixels.

The concepts are 1448x1086 paintings of a 256x192 frame (5.66 source px per
native px). Both are quantized together to one shared palette, so the diner
and the station stand on the same street in the same colours, then each
native pixel takes the most common palette colour in the middle of its
source cell. Sign lettering does not survive that, so it is re-lettered in
native glyphs here.

Writes double-r-plate.png and sheriff-plate.png (256x192) and palette.png.
Run: python build-plates.py
"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', '..', '..')
CONCEPTS = {
    'double-r': os.path.join(ROOT, 'artifacts/double-r-exterior-v01/double-r-exterior-v01-final.png'),
    'sheriff': os.path.join(ROOT, 'artifacts/sheriffs-station-exterior-v01/concept-raw.png'),
}
NW, NH, NCOL = 256, 192, 64

ims = {k: Image.open(p).convert('RGB') for k, p in CONCEPTS.items()}
both = Image.new('RGB', (ims['double-r'].width * 2, ims['double-r'].height))
both.paste(ims['double-r'], (0, 0))
both.paste(ims['sheriff'], (ims['double-r'].width, 0))
q = both.quantize(colors=NCOL, method=Image.Quantize.MEDIANCUT, kmeans=4)
PAL = np.array(q.getpalette()[:NCOL * 3], np.uint8).reshape(-1, 3)


def native(im):
    idx = np.array(im.quantize(palette=q, dither=Image.Dither.NONE))
    H, W = idx.shape
    s = W / NW
    out = np.zeros((NH, NW), int)
    for y in range(NH):
        for x in range(NW):
            x0, x1 = int(x * s + s * 0.2), int(x * s + s * 0.8) + 1
            y0, y1 = int(y * s + s * 0.2), int(y * s + s * 0.8) + 1
            out[y, x] = np.bincount(idx[y0:y1, x0:x1].ravel(), minlength=NCOL).argmax()
    return out


FONT = {  # 5x7 caps, as js/retro-font.js
    'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
}


def nearest(rgb):
    return int(np.argmin(((PAL.astype(int) - np.array(rgb)) ** 2).sum(1)))


def letter(idx, text, x, y, fg, gap=1, narrow=None):
    for ch in text:
        g = FONT[ch]
        cols = narrow.get(ch, range(5)) if narrow else range(5)
        for cx, c in enumerate(cols):
            for r in range(7):
                if g[r][c] == '1':
                    idx[y + r, x + cx] = fg
        x += len(list(cols)) + gap
    return x


def fill(idx, x0, y0, x1, y1, c):
    idx[y0:y1 + 1, x0:x1 + 1] = c


plates = {}
for k, im in ims.items():
    plates[k] = native(im)

# --- lettering -------------------------------------------------------------
BIG_R = ['1111100', '1100110', '1100011', '1100011', '1100110', '1111100',
         '1101100', '1100110', '1100110', '1100011', '1100011']
MINI = {'D': ['110', '101', '101', '101', '110'], 'I': ['111', '010', '010', '010', '111'],
        'N': ['1001', '1101', '1011', '1001', '1001'], 'E': ['111', '100', '110', '100', '111'],
        'R': ['110', '101', '110', '101', '101']}


def glyph(idx, rows, x, y, c):
    for r, line in enumerate(rows):
        for cx, v in enumerate(line):
            if v == '1':
                idx[y + r, x + cx] = c
    return x + len(rows[0])


dr = plates['double-r']
PINK, GREEN, CREAM, INK = (nearest(c) for c in ((177, 70, 77), (37, 60, 51), (216, 200, 153), (31, 27, 26)))
# fascia sign: green board, DOUBLE in caps and a big R, underline under DOUBLE
fill(dr, 103, 46, 154, 61, GREEN)
letter(dr, 'DOUBLE', 105, 48, PINK, gap=1, narrow={'L': range(5)})
glyph(dr, BIG_R, 145, 48, PINK)
fill(dr, 105, 57, 140, 58, PINK)
# roadside sign: cream board, RR, a red rule, DINER
fill(dr, 229, 39, 251, 67, INK)
fill(dr, 230, 40, 250, 66, CREAM)
glyph(dr, BIG_R, 232, 41, PINK)
glyph(dr, BIG_R, 241, 41, PINK)
fill(dr, 232, 53, 248, 53, PINK)
x = 231
for ch in 'DINER':
    x = glyph(dr, MINI[ch], x, 57, INK) + 1
sh = plates['sheriff']
board = sh[52, 104]
fill(sh, 107, 49, 148, 59, board)
letter(sh, 'SHERIFF', 108, 51, nearest((226, 214, 184)), gap=1, narrow={'I': [1, 2, 3], 'F': range(4), 'E': range(4)})

for k, idx in plates.items():
    Image.fromarray(PAL[idx]).save(os.path.join(HERE, '%s-plate.png' % k))
sw = Image.fromarray(np.repeat(np.repeat(PAL.reshape(4, 16, 3), 12, 0), 12, 1))
sw.save(os.path.join(HERE, 'palette.png'))
print('plates', list(plates), 'palette', NCOL)
