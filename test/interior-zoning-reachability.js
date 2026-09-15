#!/usr/bin/env node
'use strict';

/* Gate R85: ogni arredo fisico deve migliorare zoning senza spezzare
 * missioni, NPC o oggetti. Usa mappe e NPC reali di produzione. */
const assert = require('node:assert/strict');

global.window = global;
require('../js/tiles.js');
require('../js/chars.js');
require('../js/houses.js');
require('../js/maps.js');
require('../js/data.js');
require('../js/scene-objects.gen.js'); require('../js/glue.js');

const starts = {
  sheriff: [7, 10], palmer: [7, 10], hotel_gn: [8, 10], room_315: [2, 6], hospital: [7, 10],
  diner: [6, 8], oej: [7, 8], roadhouse: [7, 8]
};
const targets = {
  palmer: [[6, 1], [8, 10]],
  room_315: [[13, 3]],
  roadhouse: [[8, 1], [8, 5]]
};
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, y) => `${x},${y}`;

function flood(map, start) {
  const seen = new Set();
  const todo = [start];
  while (todo.length) {
    const [x, y] = todo.shift();
    const k = key(x, y);
    if (seen.has(k) || GAME.Maps.isSolid(map.id, x, y, { clues: [] })) continue;
    seen.add(k);
    for (const [dx, dy] of dirs) todo.push([x + dx, y + dy]);
  }
  return seen;
}

let checks = 0;
for (const [id, start] of Object.entries(starts)) {
  const map = GAME.Maps[id];
  assert(map.rows.every((row) => row.length === map.width), `${id}: map remains rectangular`); checks++;
  const seen = flood(map, start);
  const walkable = [];
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
    if (!GAME.Maps.isSolid(id, x, y, { clues: [] })) walkable.push(key(x, y));
  }
  assert.equal(seen.size, walkable.length, `${id}: all walkable cells remain connected`); checks++;
  for (const door of Object.keys(map.doors)) {
    assert(seen.has(door), `${id}: door ${door} reachable`); checks++;
  }
  for (const npc of map.npcs) {
    assert(dirs.some(([dx, dy]) => seen.has(key(npc.x + dx, npc.y + dy))),
      `${id}: NPC ${npc.id} has reachable interaction side`); checks++;
  }
  for (const [x, y] of targets[id] || []) {
    const reachable = seen.has(key(x, y)) || dirs.some(([dx, dy]) => seen.has(key(x + dx, y + dy)));
    assert(reachable, `${id}: mission target ${x},${y} reachable`); checks++;
  }
}

/* Corridoi narrativi tassativi: test esplicito contro regressioni future. */
const hotelCorridor = [];
for (let y = 2; y <= 4; y++) for (let x = 13; x <= 16; x++) hotelCorridor.push([x, y]);
for (const [id, cells] of Object.entries({
  palmer: [[4,4],[5,4],[4,5],[5,5]],
  hotel_gn: hotelCorridor,
  roadhouse: [[8,2],[8,4],[8,5],[8,6]]
})) {
  const map = GAME.Maps[id];
  for (const [x, y] of cells) {
    assert(!GAME.Maps.isSolid(id, x, y, { clues: [] }), `${id}: protected corridor ${x},${y} stays open`);
    checks++;
  }
}

/* La porta 315 (glifo D, x14 y1) e' raggiungibile dallo spawno del corridoio. */
{
  const seenHotel = flood(GAME.Maps.hotel_gn, starts.hotel_gn);
  assert(seenHotel.has(key(14, 1)), 'hotel_gn: door 14,1 (verso room_315) reachable from 8,10');
  checks++;
}

console.log(`INTERIOR-ZONING-REACHABILITY-PASS ${checks}/${checks} · ${Object.keys(starts).length}/${Object.keys(starts).length} interiors connected`);
