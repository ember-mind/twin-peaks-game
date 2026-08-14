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

const town = context.GAME.maps.maps.town;
const defs = Array.from(context.GAME.Retro2D.townStructureDefs || []);
assert.equal(defs.length, 11, 'all 11 town components have StructureDef metadata');
assert.equal(new Set(defs.map((d) => d.id)).size, defs.length, 'structure ids are unique');

function at(x, y) {
  return town.rows[y] && town.rows[y][x];
}

for (const raw of defs) {
  const d = JSON.parse(JSON.stringify(raw));
  const [x, y, w, h] = d.component;
  assert.equal(at(...d.anchor), d.ch, `${d.id}: anchor sits on its solid component`);
  let cells = 0;
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    if (at(xx, yy) === d.ch) cells++;
  }
  assert(cells >= w * h * 0.68, `${d.id}: component bbox substantially matches map solids`);
  assert(d.visualBounds[2] >= w * 16, `${d.id}: visual width covers collision width`);
  assert(d.visualBounds[3] >= h * 16, `${d.id}: visual height covers collision height`);
  assert.equal(d.cameraFocus.length, 2, `${d.id}: camera focus declared`);
  assert(d.materialKit, `${d.id}: material kit declared`);
  if (d.door) {
    assert.equal(at(...d.door), 'D', `${d.id}: declared door matches map D`);
    const [dx, dy] = d.door;
    assert(
      at(dx - 1, dy) === d.ch || at(dx + 1, dy) === d.ch || at(dx, dy - 1) === d.ch,
      `${d.id}: door touches its solid component`
    );
  }
}

console.log(`TOWN-STRUCTURE-SEMANTICS-PASS ${defs.length}/${defs.length}`);
