#!/usr/bin/env node
/* retro-contact-shadow — E0b grounding gate.
 *
 * Every multi-tile building must sit on darker ground than the same ground
 * further south: the 4px band directly under a facade's bottom edge has to
 * read at most 85% of the luminance of the same glyph three tiles away.
 *
 * Renders the production 2D pipeline the way js/engine.js paintGround does —
 * arrival through Retro2D.drawArrivalBackdrop, every other map as tiles via
 * GAME.Sprites.drawTile in row-major order THEN GAME.sprites.drawStructures —
 * into a plain pixel buffer. Measuring only the per-tile pass misses both the
 * arrival backdrop and the town second pass, where the occlusion actually
 * lives; that mistake is what this gate exists to prevent. Node only. */
'use strict';

global.window = global;
globalThis.GAME = { Sprites: { CHARS: {}, drawTile() {} }, Maps: {} };
require('../js/tiles.js');
require('../js/chars.js');
require('../js/maps.js');
require('../js/retro.js');
require('../js/retro-authored.js');

const dict = (GAME.maps && GAME.maps.maps) || GAME.maps;
const MAX_RATIO = 0.85;
let fails = 0, checks = 0;
function ok(cond, msg) { checks++; console.log((cond ? 'ok - ' : 'not ok - ') + msg); if (!cond) fails++; }

function parseColor(s) {
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 1];
  m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16), 1];
  m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,]+([\d.]+))?\)/.exec(s);
  if (m) return [+m[1], +m[2], +m[3], m[4] != null ? +m[4] : 1];
  return null;
}

function render(map) {
  const rows = map.rows, W = 16 * rows[0].length, H = 16 * rows.length;
  const buf = new Float32Array(W * H * 3).fill(-1);
  const unsupported = new Set();
  const ctx = {
    fillStyle: '#000', globalAlpha: 1,
    fillRect(x, y, w, h) {
      const c = parseColor(this.fillStyle);
      if (!c) { unsupported.add('fillStyle ' + this.fillStyle); return; }
      const a = c[3] * this.globalAlpha, x0 = Math.round(x), y0 = Math.round(y);
      for (let yy = y0; yy < y0 + h; yy++) for (let xx = x0; xx < x0 + w; xx++) {
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const i = (yy * W + xx) * 3;
        for (let k = 0; k < 3; k++) { const dst = buf[i + k] < 0 ? 0 : buf[i + k]; buf[i + k] = c[k] * a + dst * (1 - a); }
      }
    },
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, arc() {}, fill() {},
    clearRect() {}, clip() {}, rect() {}, translate() {}, scale() {}, setTransform() {}, fillText() {},
    measureText() { return { width: 0 }; }, drawImage() { unsupported.add('drawImage'); },
    createLinearGradient() { unsupported.add('createLinearGradient'); return { addColorStop() {} }; },
  };
  if (map.id === 'arrival') {
    /* js/engine.js paintGround: the arrival room is an authored backdrop,
     * no tile pass and no drawStructures. */
    GAME.Retro2D.drawArrivalBackdrop(ctx, 0, 0, W, H);
  } else {
    const opts = { mapId: map.id, indoor: !!map.indoor };
    for (let ty = 0; ty < rows.length; ty++) for (let tx = 0; tx < rows[ty].length; tx++) {
      GAME.Sprites.drawTile(ctx, rows[ty][tx], tx * 16, ty * 16, tx, ty, rows, opts);
    }
    GAME.sprites.drawStructures(ctx, map, 0, 0, opts);
  }
  function lum(x0, y0, x1, y1) {
    let s = 0, n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 3;
      if (buf[i] < 0) continue;
      s += 0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2]; n++;
    }
    return n ? s / n : NaN;
  }
  return { lum, unsupported: [...unsupported] };
}

/* Sites: tile columns of the footprint's bottom row (door and vehicle
 * columns excluded so the sample is ground), and the row under it. */
const SITES = [
  { map: 'town', name: 'hospital (5)', cols: [22, 24, 25], row: 7 },
  { map: 'town', name: 'book house (9)', cols: [33, 34, 35], row: 6 },
  { map: 'town', name: 'palmer house (3)', cols: [40, 41, 43], row: 7 },
  { map: 'arrival', name: 'store (9)', cols: [2, 3], row: 3, far: 4 },
  { map: 'arrival', name: 'cabin (J)', cols: [8], row: 3, far: 4 },
];

const rendered = {};
for (const site of SITES) {
  const map = dict[site.map];
  if (!rendered[site.map]) rendered[site.map] = render(map);
  const r = rendered[site.map];
  ok(r.unsupported.length === 0, site.map + ': every canvas op is captured ' + JSON.stringify(r.unsupported));
  const by = site.row * 16, far = site.far != null ? site.far * 16 : Math.min(by + 48, map.rows.length * 16 - 8);
  let a = 0, b = 0;
  for (const c of site.cols) { a += r.lum(c * 16, by, c * 16 + 15, by + 3); b += r.lum(c * 16, far, c * 16 + 15, far + 7); }
  a /= site.cols.length; b /= site.cols.length;
  const ratio = a / b;
  ok(ratio <= MAX_RATIO, site.map + ' ' + site.name + ': band y[' + by + '..' + (by + 3) + '] cols ' + site.cols.join(',') +
    ' lum ' + a.toFixed(1) + ' vs ground y[' + far + '..' + (far + 7) + '] ' + b.toFixed(1) + ' → ratio ' + ratio.toFixed(2) + ' ≤ ' + MAX_RATIO);
}

console.log('retro-contact-shadow: ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
