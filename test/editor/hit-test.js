#!/usr/bin/env node
'use strict';

// Editor hit-test — TOPMOST-WINS selection over an ordered selectable list. Paint order IS z-order,
// so the last-painted overlay whose footprint covers a tile owns that click. Two items on one tile ->
// the topmost is selected; this holds ACROSS kinds (an npc painted above an object wins), which is what
// makes a click unambiguous when markers overlap. Pure: no DOM, no canvas, synthetic data only.

const assert = require('node:assert/strict');
const HT = require('../../js/editor/core/hit-test.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

// ---- two single-tile items on the SAME tile -> the topmost (last-painted) wins ----
const stacked = [
  { id: 'bottom', kind: 'object', tx: 3, ty: 4 },
  { id: 'top',    kind: 'npc',    tx: 3, ty: 4 }   // painted after -> on top
];
ok(HT.hitTestId(stacked, 3, 4) === 'top', 'two items, same tile -> topmost (last-painted) is selected');
assert.equal(HT.hitTest(stacked, 3, 4), stacked[1], 'hitTest returns the whole topmost selectable');
ok(HT.hitTestId(stacked, 0, 0) === null, 'a tile no overlay covers -> null (click falls through)');

// ---- ACROSS kinds: exit + object + npc on one tile, topmost wins regardless of kind ----
const crossKinds = [
  { id: 'exit-x',  kind: 'exit',   tx: 5, ty: 5 },
  { id: 'obj-y',   kind: 'object', tx: 5, ty: 5 },
  { id: 'npc-z',   kind: 'npc',    tx: 5, ty: 5 }  // painted last -> owns the tile
];
ok(HT.hitTestId(crossKinds, 5, 5) === 'npc-z', 'across kinds: topmost npc wins a 3-way overlap on one tile');

// ---- z-order, NOT kind priority: reverse paint order flips the winner on the same overlap ----
const reversed = [
  { id: 'npc-first', kind: 'npc',    tx: 5, ty: 5 },
  { id: 'exit-last', kind: 'exit',   tx: 5, ty: 5 }  // painted last -> now wins, despite being a "lower" kind
];
ok(HT.hitTestId(reversed, 5, 5) === 'exit-last', 'selection follows paint order, not kind rank');

// ---- multi-tile footprint: a 2x2 object covers its four cells; just-outside fails ----
const big = [{ id: 'room-obj', kind: 'object', tx: 1, ty: 1, w: 2, h: 2 }];
ok(HT.hitTestId(big, 1, 1) === 'room-obj', 'top-left cell of a multi-tile object hits it');
ok(HT.hitTestId(big, 2, 2) === 'room-obj', 'bottom-right cell of the 2x2 object hits it');
ok(HT.hitTestId(big, 3, 2) === null, 'one tile past the footprint misses (exclusive right/bottom edge)');
ok(HT.hitTestId(big, 0, 0) === null, 'a diagonal-adjacent tile misses the footprint');

// ---- degenerate sizes fail closed: a non-positive w/h cannot cover anything ----
const broken = [{ id: 'zombie', kind: 'object', tx: 1, ty: 1, w: 0, h: -2 }];
ok(HT.covers(broken[0], 1, 1) === false, 'non-positive size degrades to no footprint (fail closed)');

// ---- non-numeric coords fail closed ----
ok(HT.covers({ id: 'x', tx: 1, ty: 1 }, 'a', 1) === false, 'string tile coord does not cover anything');
ok(HT.hitTestId([], 0, 0) === null, 'empty list never hits');

// ---- scene integration: flattenScene orders exits<objects<npcs, so the topmost npc owns its tile ----
const scene = {
  byKind: {
    exits:   [{ id: 'door', kind: 'exit', tx: 2, ty: 2 }],
    objects: [{ id: 'table', kind: 'object', tx: 2, ty: 2, w: 1, h: 1 }],
    npcs:    [{ id: 'chef', kind: 'npc', tx: 2, ty: 2 }]   // painted last within flattenScene
  }
};
const flat = HT.flattenScene(scene);
ok(flat.length === 3 && flat[0].id === 'door' && flat[1].id === 'table' && flat[2].id === 'chef',
   'flattenScene emits a stable z-order: exits under objects under npcs');
ok(HT.hitTestScene(scene, 2, 2) === 'chef', 'hitTestScene resolves an overlapping tile to the topmost npc');
ok(HT.flattenScene(null).length === 0, 'flattenScene on a null scene yields no candidates');

console.log(`EDITOR-HITTEST-PASS ${pass}`);
