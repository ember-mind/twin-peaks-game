#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { GAME: { Sprites: { CHARS: {}, drawTile() {} }, maps: {} } };
context.window = context;
context.globalThis = context;
context.Image = function Image() {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/maps.js'), 'utf8'), context);
context.GAME.maps = context.GAME.maps || context.GAME.Maps;
vm.runInContext(fs.readFileSync(path.join(root, 'js/retro-authored.js'), 'utf8'), context);

const maps = context.GAME.maps.maps;
const solid = context.GAME.maps.SOLID;
const props = Array.from(context.GAME.Retro2D.interiorPropFootprints || []);
assert.equal(props.length, 23, 'all twenty-three authored prop families declared');

for (const prop of props) {
  const map = maps[prop.map];
  assert(map, `${prop.id}: map exists`);
  assert(prop.cells.length, `${prop.id}: footprint is not empty`);
  for (const cell of prop.cells) {
    const [x, y] = Array.from(cell);
    const glyph = map.rows[y] && map.rows[y][x];
    if (prop.kind === 'physical') assert(solid[glyph], `${prop.id}@${x},${y}: physical art must occupy solid tile, got ${glyph}`);
    else assert(!solid[glyph], `${prop.id}@${x},${y}: soft/passable art must occupy walkable tile, got ${glyph}`);
  }
}

console.log(`INTERIOR-PROP-SEMANTICS-PASS ${props.length}/${props.length}`);
