#!/usr/bin/env node
'use strict';

/* Evidenza R60: costruisce una camminata REALE sulla maps.js di produzione,
 * visitando i sei edifici. Il percorso e' quello urbano inteso (strade,
 * sentieri, marciapiedi e corte), non la scorciatoia geometrica piu' breve
 * attraverso il prato. Con --capture-tag=<tag> cattura un frame nativo ogni
 * tre passi; nessun teleport e nessuna coordinata solida. */
const assert = require('node:assert');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

global.window = global;
require('../js/maps.js');

const town = GAME.maps.maps.town;
const rows = town.rows;
const W = town.width;
const H = town.height;
const start = [30, 31];
const stops = [
  ['roadhouse', 47, 28],
  ['diner', 42, 20],
  ['palmer', 42, 6],
  ['hospital', 23, 6],
  ['hotel', 9, 6],
  ['sheriff', 12, 20]
];

function key(x, y) { return x + ',' + y; }
function tile(x, y) { return rows[y] && rows[y][x] || ''; }
function walkable(x, y) {
  return x >= 0 && y >= 0 && x < W && y < H && !GAME.maps.SOLID[tile(x, y)];
}
const AUTHORED_ROUTE = new Set(['r', '-', ':', 'p', '=', 'u', 'D']);
function stepCost(x, y) {
  const ch = tile(x, y);
  if (AUTHORED_ROUTE.has(ch)) return 1;
  if (ch === '.' || ch === ',') return 8;
  return 4;
}

/* Dijkstra deterministico: il costo rende esplicita la gerarchia urbana,
 * ma ogni nodo continua a provenire dalla griglia reale e ogni arco resta
 * un singolo passo cardinale. */
function intendedPath(from, to) {
  let order = 0;
  const frontier = [{ point: from, cost: 0, order: order++ }];
  const best = new Map([[key(from[0], from[1]), 0]]);
  const previous = new Map([[key(from[0], from[1]), null]]);
  while (frontier.length) {
    frontier.sort((a, b) => a.cost - b.cost || a.order - b.order);
    const entry = frontier.shift();
    const current = entry.point;
    if (entry.cost !== best.get(key(current[0], current[1]))) continue;
    if (current[0] === to[0] && current[1] === to[1]) break;
    for (const next of [[current[0] - 1, current[1]], [current[0] + 1, current[1]],
      [current[0], current[1] - 1], [current[0], current[1] + 1]]) {
      const k = key(next[0], next[1]);
      if (!walkable(next[0], next[1])) continue;
      const cost = entry.cost + stepCost(next[0], next[1]);
      if (best.has(k) && best.get(k) <= cost) continue;
      best.set(k, cost);
      previous.set(k, current);
      frontier.push({ point: next, cost, order: order++ });
    }
  }
  const targetKey = key(to[0], to[1]);
  assert(previous.has(targetKey), 'nessun percorso verso ' + targetKey);
  const out = [];
  for (let cursor = to; cursor; cursor = previous.get(key(cursor[0], cursor[1]))) out.push(cursor);
  return out.reverse();
}

let full = [start];
let cursor = start;
const stopIndexes = [];
for (const stop of stops) {
  const segment = intendedPath(cursor, [stop[1], stop[2]]);
  full = full.concat(segment.slice(1));
  cursor = [stop[1], stop[2]];
  stopIndexes.push(full.length - 1);
}

for (let i = 0; i < full.length; i++) {
  assert(walkable(full[i][0], full[i][1]), 'passo solido #' + i + ' ' + full[i]);
  if (i) assert(Math.abs(full[i][0] - full[i - 1][0]) + Math.abs(full[i][1] - full[i - 1][1]) === 1,
    'salto non cardinale #' + i);
}
const rawGrassSteps = full.filter(([x, y]) => tile(x, y) === '.' || tile(x, y) === ',');
assert.strictEqual(rawGrassSteps.length, 0,
  'la route urbana completa dispone di superfici authored: nessun passo su prato grezzo');

const sampleIndexes = new Set([0, full.length - 1, ...stopIndexes]);
for (let i = 3; i < full.length; i += 3) sampleIndexes.add(i);
const samples = [...sampleIndexes].sort((a, b) => a - b);
const args = new Map(process.argv.slice(2).map((arg) => {
  const match = /^--([^=]+)=(.*)$/.exec(arg);
  return match ? [match[1], match[2]] : [arg.replace(/^--/, ''), true];
}));
const tag = args.get('capture-tag');
const root = path.resolve(__dirname, '..');

function direction(index) {
  const a = full[index], b = full[Math.min(index + 1, full.length - 1)];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx < 0) return 'left';
  if (dx > 0) return 'right';
  if (dy < 0) return 'up';
  return 'down';
}

if (tag) {
  for (let order = 0; order < samples.length; order++) {
    const index = samples[order], point = full[index], dir = direction(index);
    const name = `${tag}-walk-${String(order).padStart(3, '0')}-s${index}-x${point[0]}-y${point[1]}-native.png`;
    const result = spawnSync(process.execPath, [path.join(__dirname, 'native-shot.js'),
      '--map=town', `--x=${point[0]}`, `--y=${point[1]}`, `--dir=${dir}`,
      `--out=artifacts/retro-gauntlet/${name}`], { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
  }
}

console.log(`TOWN-ROUTE-PASS ${full.length - 1} passi, ${samples.length} frame, 6/6 edifici, ${rawGrassSteps.length} prato grezzo`);
