/* Mechanical native export from fresh Blender color and matching object-ID passes.
 * Run round-3-build.py through Blender MCP first. No pixel painting or resizing
 * of diagnostic art: the fresh source raster is already exactly 48 by 36. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const out = __dirname;
const magick = '/opt/homebrew/bin/magick';
function rgba(file) {
  return execFileSync(magick, [file, '-depth', '8', 'rgba:-']);
}
const raw = rgba('/tmp/tp-round3-native-raw.png');
const ids = rgba('/tmp/tp-round3-object-ids.png');
const pixels = Buffer.alloc(raw.length);
const palettes = {
  table: ['201714', '403023', '664833', '81593c'],
  chair: ['0f0100', '6e1f00', 'd4570a', 'aa1300'],
  candle: ['501400', '8f2f00', 'b03900', 'ffc4a7'],
  ashtray: ['6e1f00', '8f2f00', 'b03900'],
  pendant: ['300900', 'b34800', 'e97f40', 'ffc4a7']
};
const groups = Object.keys(palettes);
const used = Object.fromEntries(groups.map((name) => [name, new Set()]));
const colors = Object.fromEntries(groups.map((name) => [name, palettes[name].map((hex) => Buffer.from(hex, 'hex'))]));
for (let p = 0; p < raw.length; p += 4) {
  if (raw[p + 3] < 128) continue;
  const red = ids[p];
  const name = groups[red < 60 ? 0 : red < 105 ? 1 : red < 150 ? 2 : red < 192 ? 3 : 4];
  let best, distance = Infinity;
  for (const color of colors[name]) {
    const d = color.reduce((sum, value, i) => sum + (raw[p + i] - value) ** 2, 0);
    if (d < distance) { distance = d; best = color; }
  }
  best.copy(pixels, p);
  pixels[p + 3] = 255;
  used[name].add(best.toString('hex'));
}
execFileSync(magick, ['-size', '48x36', '-depth', '8', 'rgba:-', path.join(out, 'round-3-native.png')], { input: pixels });
execFileSync(magick, [path.join(out, 'round-3-native.png'), '-background', 'none', '-gravity', 'center', '-extent', '64x48', path.join(out, 'round-3-asset.png')]);
console.log(JSON.stringify({ dimensions: [48, 36], padded: [64, 48], alpha: [0, 255], tones: Object.fromEntries(groups.map((name) => [name, [...used[name]]])) }, null, 2));
