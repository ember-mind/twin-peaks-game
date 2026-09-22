"""Grade every kit image into day and night from its dusk pixels.

The kit is cut from a dusk painting. Day and night are the same pixels
regraded, as for the plate: a light (warm, bright, with warm bright
neighbours) keeps glowing at night and dims by day; everything else darkens
toward moonlight or lifts toward daylight. Writes <name>-day.png and
<name>-night.png beside each source, alpha untouched.

usage: grade-kit.py <png> [<png> ...]
"""
import colorsys
import sys
from PIL import Image


def warm(p):
    r, g, b = p[:3]
    return r > 185 and g > 130 and r > b + 55


def light_mask(img):
    W, H = img.size
    px = img.load()
    out = set()
    for y in range(H):
        for x in range(W):
            if px[x, y][3] == 0 or not warm(px[x, y]):
                continue
            n = 0
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and px[nx, ny][3] and warm(px[nx, ny]):
                    n += 1
            if n >= 2:
                out.add((x, y))
    return out


def night(r, g, b, lit, sky):
    if sky:
        v = (0.3 * r + 0.59 * g + 0.11 * b) / 255 * 0.42
        return (int(v * 255 * 0.8 + 14), int(v * 255 * 0.9 + 18), int(v * 255 + 36))
    if lit:
        return (min(255, int(r * 1.06)), min(255, int(g * 1.04)), int(b * 0.9))
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    r2, g2, b2 = colorsys.hsv_to_rgb(h, s * 0.8, v * 0.52)
    return (int(r2 * 255 * 0.82 + 6), int(g2 * 255 * 0.92 + 10), int(b2 * 255 + 24))


def day(r, g, b, lit, sky):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if lit:
        v *= 0.78; s *= 0.45
    else:
        v = min(1.0, v * 1.22 + 0.04); s = min(1.0, s * 1.08)
    r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v)
    if sky:
        r2, g2, b2 = r2 * 0.9 + 0.05, g2 * 0.95 + 0.06, b2 + 0.1
    return (min(255, int(r2 * 255 * 1.03)), min(255, int(g2 * 255 * 1.02)), min(255, int(b2 * 255 * 0.96)))


def grade(path, sky_rows=0):
    src = Image.open(path).convert('RGBA')
    lit = light_mask(src)
    for name, fn in (('night', night), ('day', day)):
        out = src.copy()
        px = out.load()
        W, H = out.size
        for y in range(H):
            for x in range(W):
                r, g, b, a = px[x, y]
                if a:
                    px[x, y] = fn(r, g, b, (x, y) in lit, y < sky_rows) + (a,)
        out.save(path[:-4] + '-' + name + '.png')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        if p.endswith('-day.png') or p.endswith('-night.png'):
            continue
        grade(p, sky_rows=70 if p.endswith('backdrop.png') else 0)
