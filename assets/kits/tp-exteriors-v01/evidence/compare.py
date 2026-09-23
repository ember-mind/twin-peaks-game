#!/usr/bin/env python3
"""Concept (left) beside the kit on the main street (right), same frame, 2x.

The concept is its native plate (source/*-plate.png, before any cutting);
the kit side is cropped from evidence/overview-<grade>.png (a 2x capture of
test/kit-exteriors.html) at the frame the concept shows.
usage: compare.py [grade]"""
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
grade = sys.argv[1] if len(sys.argv) > 1 else 'dusk'
ov = Image.open(os.path.join(HERE, 'overview-%s.png' % grade)).convert('RGB')
# world offset of each plate on the map (compose.js places the diner at tile
# (2,5) = plate x16/base 103, the station at (21,5) = plate x14/base 112)
FRAMES = {'double-r': (16, 9), 'sheriff': (322, 0)}
for name, (ox, oy) in FRAMES.items():
    plate = Image.open(os.path.join(HERE, '..', 'source', '%s-plate.png' % name)).convert('RGB')
    kit = ov.crop((ox * 2, oy * 2, ox * 2 + 512, oy * 2 + 384))
    out = Image.new('RGB', (512 * 2 + 8, 384), (0, 0, 0))
    out.paste(plate.resize((512, 384), Image.NEAREST), (0, 0))
    out.paste(kit, (520, 0))
    out.save(os.path.join(HERE, 'compare-%s-%s.png' % (name, grade)))
    print('compare-%s-%s.png' % (name, grade))
