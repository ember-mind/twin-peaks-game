#!/usr/bin/env node
'use strict';

/* One-time final-data motion authoring pass. Crystal's WALKING_SPRITE frame
 * redraws the complete pose: most references bob the upper body by one row,
 * shift torso weight and change the contact feet. Our first explicit sheets
 * changed only 4–34 lower pixels and kept rows 0–9 identical. This script
 * bakes whole-pose motion into the literal matrices; runtime never loads it. */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

const grid = (rows) => rows.map((row) => row.split(''));
const rows = (g) => g.map((row) => row.join(''));

function topOf(source) {
  for (let y = 0; y < 16; y++) if (/[^.]/.test(source[y])) return y;
  return 16;
}

function shiftRow(row, dx) {
  if (dx > 0) return '.'.repeat(dx) + row.slice(0, 16 - dx);
  if (dx < 0) return row.slice(-dx) + '.'.repeat(-dx);
  return row;
}

function inkBoundary(source) {
  const input = grid(source), output = grid(source);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (input[y][x] === '.') continue;
    const exposed = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx < 0 || nx >= 16 || ny < 0 || ny >= 16 || input[ny][nx] === '.';
    });
    if (exposed) output[y][x] = 'o';
  }
  return rows(output);
}

function animate(view, direction) {
  const idle = view.idle;
  const output = grid(view.step);
  const top = topOf(idle);
  const upperEnd = 10;
  const sway = direction === 'side' ? -1 : 1;

  if (top === 0) {
    /* Common Crystal contact: crown starts one row lower while feet remain
     * on row 15. Rows 0–8 become 1–9; lower body is authored below. */
    for (let y = 0; y < upperEnd; y++) output[y] = Array(16).fill('.');
    for (let y = 0; y < upperEnd - 1; y++) output[y + 1] = idle[y].split('');
  } else {
    /* Short actors cannot bob down without leaving the 15px reference
     * interval. Give them a lateral weight shift; runtime mirrors step B. */
    for (let y = top; y < upperEnd; y++) output[y] = shiftRow(idle[y], sway).split('');
  }

  /* Shift shoulders/torso with the planted leg. Keep rows 14–15 from the
   * actor-specific step so shoe separation and contact identity survive. */
  for (let y = 10; y <= 13; y++) output[y] = shiftRow(idle[y], sway).split('');
  view.step = inkBoundary(rows(output));
}

function serialize(data) {
  const body = JSON.stringify(data, null, 2).replace(/"([^"\n]+)":/g, '$1:');
  return `/* Generated once from native renderer; edited thereafter as final pixel art. */\n` +
    `(function (G) {\n  'use strict';\n  G.GAME = G.GAME || {};\n` +
    `  var target = G.GAME.RetroCastMatrices = G.GAME.RetroCastMatrices || {};\n` +
    `  var authored = ${body};\n` +
    `  Object.keys(authored).forEach(function (name) { target[name] = authored[name]; });\n` +
    `})(typeof window !== 'undefined' ? window : globalThis);\n`;
}

for (const group of ['a', 'b']) {
  const file = path.join(root, 'js', `retro-cast-matrices-${group}.js`);
  const context = { GAME: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  const data = context.GAME.RetroCastMatrices;
  for (const actor of Object.values(data)) for (const direction of ['down', 'up', 'side']) {
    animate(actor[direction], direction);
  }
  fs.writeFileSync(file, serialize(data));
  console.log(`authored full-pose motion for group ${group.toUpperCase()}`);
}
