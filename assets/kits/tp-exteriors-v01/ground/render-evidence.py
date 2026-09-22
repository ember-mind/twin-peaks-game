#!/usr/bin/env python3
"""Ground evidence: a test field laid by the engine's own picker (pick-field.js),
drawn from the atlas at 2x or more. usage: render-evidence.py [grade]"""
import json, os, subprocess, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
FIELD = """\
fffffffffffffffffffffffffffffff
ffffgggggggggggggggggggggffffff
fffgggggggggggfffgggggggggggfff
ggggggggggggggfffgggggggggggggg
ccccccccccccccccccccccccccccccc
ccccccccccccccccccccccccccccccc
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
aaaaaaaaccccccaaaaaaaaaaaaaaaaa
aaaaaaaaccccccaaaaaaagggaaaaaaa
aaaaaaaaaaaaaaaaaaaaagggaaaaaaa
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
ccccccccccccccccccccccccccccccc
ggggggggggggccccccggggggggggggg
gggggggggggggccccgggggggfffgggg
ffffffffffffffffffffffffffffffff"""
grade = sys.argv[1] if len(sys.argv) > 1 else ''
field = os.path.join(HERE, '.field.txt')
open(field, 'w').write('\n'.join(r[:31] for r in FIELD.split('\n')) + '\n')
out = json.loads(subprocess.check_output(['node', os.path.join(HERE, 'pick-field.js'), field, '7']))
os.remove(field)
atlas = Image.open(os.path.join(HERE, 'ground%s.png' % ('-' + grade if grade else ''))).convert('RGB')
T, cols = 16, atlas.width // 16
im = Image.new('RGB', (out['w'] * T, out['h'] * T))
for i, c in enumerate(out['cells']):
    im.paste(atlas.crop(((c % cols) * T, (c // cols) * T, (c % cols + 1) * T, (c // cols + 1) * T)),
             ((i % out['w']) * T, (i // out['w']) * T))
dst = os.path.join(HERE, '..', 'evidence', 'ground-field%s.png' % ('-' + grade if grade else ''))
im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(dst)
print(dst)
