#!/usr/bin/env node
'use strict';

/* One-time authored-data refiner. It removes excess profile mass only when
 * both final poses stay connected, then adds an intentional lower-body/arm
 * tone change where old procedural gait moved fewer than four cells. Runtime
 * loads only resulting literal matrices, never this script. */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const group = String(process.argv[2] || 'b').toLowerCase();
if (!/^[ab]$/.test(group)) throw new Error('usage: refine-authored-group-b.js [a|b]');
const file = path.join(root, 'js', `retro-cast-matrices-${group}.js`);
const context = { GAME: {} };
vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
const data = context.GAME.RetroCastMatrices;

const grid = (rows) => rows.map((row) => row.split(''));
const rows = (g) => g.map((row) => row.join(''));
const mass = (r) => r.join('').replace(/\./g, '').length;

function shape(r) {
  const g = grid(r), mask = g.map((row) => row.map((token) => token !== '.'));
  let minX = 16, maxX = -1, maxY = -1, components = 0;
  const seen = new Uint8Array(256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (mask[y][x]) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    const start = y * 16 + x;
    if (seen[start]) continue;
    components++; seen[start] = 1; const stack = [start];
    while (stack.length) {
      const pos = stack.pop(), cy = Math.floor(pos / 16), cx = pos % 16;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cx + dx, ny = cy + dy, next = ny * 16 + nx;
        if (nx >= 0 && nx < 16 && ny >= 0 && ny < 16 && mask[ny][nx] && !seen[next]) {
          seen[next] = 1; stack.push(next);
        }
      }
    }
  }
  return { width: maxX - minX + 1, maxY, components };
}

function trimProfile(actor) {
  const target = Math.floor(mass(actor.down.idle) * 0.89);
  let idle = grid(actor.side.idle), step = grid(actor.side.step);
  const order = [];
  for (let y = 4; y <= 13; y++) {
    const xs = [];
    for (let x = 0; x < 16; x++) if (idle[y][x] !== '.' && step[y][x] !== '.') xs.push(x);
    if (xs.length > 6) {
      /* Alternating jaw/rear contour produces a stepped, not shaved, edge. */
      order.push([y, y & 1 ? xs[0] : xs[xs.length - 1]]);
      order.push([y, y & 1 ? xs[xs.length - 1] : xs[0]]);
    }
  }
  for (const [y, x] of order) {
    if (mass(rows(idle)) <= target) break;
    const oldIdle = idle[y][x], oldStep = step[y][x];
    idle[y][x] = '.'; step[y][x] = '.';
    const a = shape(rows(idle)), b = shape(rows(step));
    if (a.components !== 1 || b.components !== 1 || a.width < 12 || b.width < 12 || a.maxY !== 15 || b.maxY !== 15) {
      idle[y][x] = oldIdle; step[y][x] = oldStep;
    }
  }
  actor.side.idle = rows(idle); actor.side.step = rows(step);
}

function lowerDiff(a, b) {
  let n = 0;
  for (let y = 10; y < 16; y++) for (let x = 0; x < 16; x++) if (a[y][x] !== b[y][x]) n++;
  return n;
}

function strengthenStep(view) {
  const idle = view.idle, step = grid(view.step);
  const candidates = [];
  for (let y = 10; y <= 13; y++) {
    const xs = [];
    for (let x = 0; x < 16; x++) if (step[y][x] !== '.') xs.push(x);
    for (const x of xs.slice(2, -2)) if (idle[y][x] === step[y][x]) candidates.push([y, x]);
  }
  for (const [y, x] of candidates) {
    if (lowerDiff(idle, rows(step)) >= 4) break;
    step[y][x] = step[y][x] === 'o' ? 'c' : 'o';
  }
  view.step = rows(step);
}

function inkBoundary(source) {
  const g = grid(source), out = grid(source);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (g[y][x] === '.') continue;
    if ([[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx < 0 || nx >= 16 || ny < 0 || ny >= 16 || g[ny][nx] === '.';
    })) out[y][x] = 'o';
  }
  return rows(out);
}

for (const actor of Object.values(data)) {
  if (mass(actor.side.idle) / mass(actor.down.idle) > 0.89) trimProfile(actor);
  for (const view of ['down', 'up', 'side']) for (const pose of ['idle', 'step']) {
    actor[view][pose] = inkBoundary(actor[view][pose]);
  }
  for (const view of ['down', 'up', 'side']) strengthenStep(actor[view]);
}

const body = JSON.stringify(data, null, 2).replace(/"([^"\n]+)":/g, '$1:');
const source = `/* Generated once from native renderer; edited thereafter as final pixel art. */\n` +
`(function (G) {\n  'use strict';\n  G.GAME = G.GAME || {};\n  var target = G.GAME.RetroCastMatrices = G.GAME.RetroCastMatrices || {};\n` +
`  var authored = ${body};\n  Object.keys(authored).forEach(function (name) { target[name] = authored[name]; });\n` +
`})(typeof window !== 'undefined' ? window : globalThis);\n`;
fs.writeFileSync(file, source);
console.log(`refined 12 group-${group.toUpperCase()} authored actors`);
