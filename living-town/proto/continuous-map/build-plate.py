"""Build the native outdoor plate from the reference painting.

reference-town.png (1672x941, the join-page painting) -> plate.png (768x432,
56 colours, no dither) and fg.png: only the pixels that must cover a person
standing behind them (canopies over the street, lamps on the embankment).
Pieces and their depths are printed as JSON for town-map.js.
"""
import json
from PIL import Image

W, H = 768, 432
src = Image.open('reference-town.png').convert('RGB')
im = src.resize((W, H), Image.LANCZOS)
plate = im.quantize(colors=56, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')
plate.save('plate.png')

# (id, x0, y0, x1, y1, depth, kind): depth = foot y at which the piece stands
PIECES = [
    ('tree_w', 0, 196, 60, 250, 292, 'leaf'),
    ('tree_cw', 112, 194, 190, 250, 272, 'leaf'),
    ('tree_c', 232, 214, 266, 250, 272, 'leaf'),
    ('tree_ce', 404, 198, 486, 250, 275, 'leaf'),
    ('lamp_bridge_w', 646, 200, 662, 238, 240, 'lamp'),
    ('lamp_bridge_e', 744, 200, 760, 238, 240, 'lamp'),
]
fg = Image.new('RGBA', (W, H), (0, 0, 0, 0))
pp, fp = plate.load(), fg.load()
for pid, x0, y0, x1, y1, depth, kind in PIECES:
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = pp[x, y]
            lum = 0.3 * r + 0.59 * g + 0.11 * b
            if kind == 'leaf':
                keep = (g >= r + 4 and g >= b - 12) or lum < 42
            else:
                keep = lum < 72 or b >= r - 6 or (r > 190 and g > 140)
            if keep:
                fp[x, y] = (r, g, b, 255)
    # one piece is one connected thing: drop moss and speckles on the cobbles
    seen, comps = set(), []
    for y in range(y0, y1):
        for x in range(x0, x1):
            if fp[x, y][3] and (x, y) not in seen:
                comp, stack = [], [(x, y)]
                seen.add((x, y))
                while stack:
                    cx, cy = stack.pop(); comp.append((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if x0 <= nx < x1 and y0 <= ny < y1 and (nx, ny) not in seen and fp[nx, ny][3]:
                            seen.add((nx, ny)); stack.append((nx, ny))
                comps.append(comp)
    comps.sort(key=len, reverse=True)
    for comp in comps[1:]:
        if len(comp) < 40:
            for cx, cy in comp: fp[cx, cy] = (0, 0, 0, 0)
fg.save('fg.png')
print(json.dumps([{'id': p[0], 'x': p[1], 'y': p[2], 'w': p[3] - p[1], 'h': p[4] - p[2], 'depth': p[5]} for p in PIECES]))

# ---- light: the painting is dusk; day and night are the same pixels regraded.
# A lamp, a lit window or a reflection is a light: warm and bright.
import colorsys
def warm(r, g, b):
    return r > 185 and g > 130 and r > b + 55

# A light is a warm bright pixel with warm bright neighbours: a lone warm
# stone is not a lamp, and at night it would be an orange speck.
_pp = plate.load()
LIGHT = set()
for y in range(1, H - 1):
    for x in range(1, W - 1):
        if warm(*_pp[x, y]) and sum(warm(*_pp[x + dx, y + dy]) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) >= 2:
            LIGHT.add((x, y))

def grade(img, fn, name):
    out = img.copy(); px = out.load()
    for y in range(H):
        for x in range(W):
            px[x, y] = fn(*px[x, y], y, (x, y) in LIGHT)
    out.save(name)

def night(r, g, b, y, lit=False):
    if y < 70:  # no sunset at night: the sky's warm band goes to cloud
        v = (0.3 * r + 0.59 * g + 0.11 * b) / 255 * 0.42
        return (int(v * 255 * 0.8 + 14), int(v * 255 * 0.9 + 18), int(v * 255 + 36))
    if lit:
        return (min(255, int(r * 1.06)), min(255, int(g * 1.04)), int(b * 0.9))
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    v *= 0.52; s *= 0.8
    r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v)
    # moonlit: pull toward blue
    return (int(r2 * 255 * 0.82 + 6), int(g2 * 255 * 0.92 + 10), int(b2 * 255 * 1.0 + 24))

def day(r, g, b, y, lit=False):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if lit:
        # lamps off: the glow becomes the stone or glass it lies on
        v *= 0.78; s *= 0.45
    else:
        v = min(1.0, v * 1.22 + 0.04); s = min(1.0, s * 1.08)
    r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v)
    if y < 70:  # the sky: from dawn pink to a pale day
        r2, g2, b2 = r2 * 0.9 + 0.05, g2 * 0.95 + 0.06, b2 * 1.0 + 0.1
    return (min(255, int(r2 * 255 * 1.03)), min(255, int(g2 * 255 * 1.02)), min(255, int(b2 * 255 * 0.96)))

grade(plate, night, 'plate-night.png')
grade(plate, day, 'plate-day.png')

# The covering pixels are graded with the plate, or a canopy glows at night.
def grade_rgba(img, fn, name):
    out = img.copy(); px = out.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a: px[x, y] = fn(r, g, b, y, (x, y) in LIGHT) + (a,)
    out.save(name)
grade_rgba(fg, night, 'fg-night.png')
grade_rgba(fg, day, 'fg-day.png')
