#!/usr/bin/env node
'use strict';

/* Snapshot meccanico del renderer di sviluppo in matrici finali 16×16.
 * Output diventa dato autoriale: runtime non richiama generatore, seal o fit.
 * Gli artisti rifiniscono poi queste matrici direttamente sulla griglia. */

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

global.window = global;
require(path.join(root, 'js', 'chars.js'));
const GAME = global.GAME;
GAME.Sprites = { CHARS: GAME.sprites.CHARS, drawTile() {} };
GAME.maps = { maps: {} };
require(path.join(root, 'js', 'retro-cast-matrices-a.js'));
require(path.join(root, 'js', 'retro-cast-matrices-b.js'));
require(path.join(root, 'js', 'retro-authored.js'));

function luma(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}

function matrix(name, dir, moving) {
  const pixels = new Array(256).fill(null);
  const ctx = {
    globalAlpha: 1,
    fillStyle: '#000000',
    fillRect(x, y, w, h) {
      if (!/^#[0-9a-f]{6}$/i.test(this.fillStyle)) return;
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
        if (xx >= 0 && xx < 16 && yy >= 0 && yy < 16) pixels[yy * 16 + xx] = this.fillStyle.toLowerCase();
      }
    }
  };
  GAME.Sprites.drawChar(ctx, 0, 0, GAME.Sprites.CHARS[name], dir, moving ? 1 : 0, 1, moving, false, 0);
  const colors = [...new Set(pixels.filter(Boolean))];
  if (colors.length !== 3 || !colors.includes('#000000')) {
    throw new Error(`${name}/${dir}/${moving ? 'step' : 'idle'} colors=${colors.join(',')}`);
  }
  const lit = colors.filter((color) => color !== '#000000').sort((a, b) => luma(a) - luma(b));
  const token = new Map([['#000000', 'o'], [lit[0], 'c'], [lit[1], 's']]);
  return Array.from({ length: 16 }, (_, y) => pixels.slice(y * 16, y * 16 + 16)
    .map((color) => color ? token.get(color) : '.').join(''));
}

const names = Object.keys(GAME.Sprites.CHARS);
const group = process.argv.find((arg) => arg.startsWith('--group='))?.slice(8) || 'all';
const output = process.argv.find((arg) => arg.startsWith('--output='))?.slice(9);
if (!output) throw new Error('--output required');
const selected = group === 'a' ? names.slice(0, 12) : (group === 'b' ? names.slice(12) : names);
const data = {};
for (const name of selected) {
  data[name] = {};
  for (const dir of ['down', 'up', 'side']) {
    const runtimeDir = dir === 'side' ? 'right' : dir;
    data[name][dir] = { idle: matrix(name, runtimeDir, false), step: matrix(name, runtimeDir, true) };
  }
}

const body = JSON.stringify(data, null, 2).replace(/"([^"\n]+)":/g, '$1:');
const source = `/* Generated once from native renderer; edited thereafter as final pixel art. */\n` +
`(function (G) {\n  'use strict';\n  G.GAME = G.GAME || {};\n  var target = G.GAME.RetroCastMatrices = G.GAME.RetroCastMatrices || {};\n` +
`  var authored = ${body};\n  Object.keys(authored).forEach(function (name) { target[name] = authored[name]; });\n` +
`})(typeof window !== 'undefined' ? window : globalThis);\n`;
fs.writeFileSync(path.resolve(root, output), source);
console.log(`${selected.length} actors -> ${output}`);
