#!/usr/bin/env node
'use strict';

// Editor model — buildWorldModel over a HAND-BUILT synthetic snapshot matching the exact shape of
// js/world-builder-data.js#buildWorldSnapshot(). Zero GAME refs by construction: the test supplies
// every scene/tile/connection itself, so the model is proven game-free and deterministic.

const assert = require('node:assert/strict');
require('../../js/editor/core/identity.js'); // attaches Editor.identity (3a) before model resolves it
const Identity = require('../../js/editor/core/identity.js'); // same factory, to compare ids without hardcoding kind tokens
const Model = require('../../js/editor/core/model.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

// A synthetic tile map: known codes -> category+color, unknowns fall back to a derived hue.
const TILE = {
  T: { cat: 'tree', color: '#3b7' },
  g: { cat: 'grass', color: '#4a3' },
  w: { cat: 'water', color: '#25c' }
};

// Scene "room": 3x2 grid, one exit overlay (legacy door, no connection id), one object overlay.
const roomRows = [
  ['T', '.', 'w'],
  ['g', 'g', '.']
];
// Scene "diner": 2x1 grid, an exit that names a triggered connection (NOT legacy).
const dinerRows = [
  ['.', 'D']
];

const snapshot = {
  tile: TILE,
  sceneCount: 2,
  locationCount: 2,
  locations: [
    { id: 'loc-room', name: 'Room', environments: [{ id: 'env-room', name: 'Room Env', sceneId: 'room', indoor: true }], connections: [] },
    { id: 'loc-diner', name: 'Diner', environments: [{ id: 'env-diner', name: 'Diner Env', sceneId: 'diner', indoor: true }], connections: ['conn-1'] }
  ],
  scenes: {
    room: {
      sceneId: 'room', name: 'Room', locationId: null, width: 3, height: 2, indoor: true,
      rows: roomRows.slice(), overlayCount: 2,
      overlays: [
        { kind: 'exit', connectionId: null, tx: 1, ty: 0, target: { scene: 'diner', x: 0, y: 0 }, dir: 'down' }, // legacy (no connection id)
        { kind: 'object', type: 'table', subkind: null, tx: 0, ty: 1, w: 1, h: 1, dialogue: null }
       ]
     },
    diner: {
      sceneId: 'diner', name: 'Diner', locationId: null, width: 2, height: 1, indoor: true,
      rows: dinerRows.slice(), overlayCount: 1,
      overlays: [
        { kind: 'exit', connectionId: 'conn-1', tx: 1, ty: 0, target: { scene: 'room', x: 1, y: 0 }, dir: 'up' }
       ]
     }
    },
  connections: [
     // conn-1 has triggers on endpoint a -> its exit is NOT legacy.
    { id: 'conn-1', a: { endpoint: 'a', scene: 'diner', triggers: [{ t: 0 }], spawn: { tx: 0, ty: 0, dir: 'down' } },
                  b: { endpoint: 'b', scene: 'room', triggers: [], spawn: { tx: 1, ty: 1, dir: 'up' } } }
    ],
  unresolved: []
};

const model = Model.buildWorldModel(snapshot);

// ---- top-level shape + counts passthrough ----
ok(model.sceneCount === 2 && model.locationCount === 2, 'counts passed through');
ok(Object.keys(model.scenes).length === 2 && Object.keys(model.locationsById).length === 2, 'indexed tables populated');
ok(Object.isFrozen(model) && Object.isFrozen(model.scenes), 'model tree is frozen (read-only view)');

// ---- scene -> tiles: 3x2 grid of cells, "." open floor -> null ----
const room = Model.scene(model, 'room');
assert.equal(room.tiles.length, 2, 'tiles has one row per source row');
assert.deepEqual(room.tiles[0].map(c => (c ? c.cat : null)), ['tree', null, 'water'], 'row 0 cells interpreted via tile map + open floor = null');
ok(!room.tiles.some(r => r.some(c => c && c.color == null)), 'every non-null cell carries a color');

// ---- overlays grouped by kind ----
assert.equal(room.byKind.exits.length, 1, 'room has one exit overlay');
assert.equal(room.byKind.objects.length, 1, 'room has one object overlay');
assert.equal(room.byKind.npcs.length, 0, 'room has no npc overlays');

// ---- connection record carries stable endpoint + trigger ids (3a) ----
const c1 = Model.connection(model, 'conn-1');
assert.equal(c1.endpointIds.a, Identity.endpointId('conn-1', 'a'), 'endpoint a id matches 3a scheme exactly');
assert.equal(c1.endpointIds.b, Identity.endpointId('conn-1', 'b'), 'endpoint b id matches 3a scheme exactly');
ok(c1.triggerIds.a[0] === Identity.triggerId('conn-1', 'a', 0), 'trigger id a/0 matches 3a scheme');
assert.equal(c1.triggerIds.a.length, 1, 'endpoint a exposes one trigger id (matches its triggers[])');
assert.equal(c1.triggerIds.b.length, 0, 'endpoint b exposes zero trigger ids (empty triggers[])');

// ---- legacy door detection: room's exit has NO connection id -> legacy; diner's names conn-1 (triggered) -> NOT legacy ----
ok(Model.isLegacyExit({ connectionId: null }, {}), 'an exit with no connection id is a legacy door');
assert.equal(model.legacyDoors.length, 1, 'exactly one legacy door detected');
assert.deepEqual(model.legacyDoors[0], Object.freeze({ sceneId: 'room', tx: 1, ty: 0, target: { scene: 'diner', x: 0, y: 0 } }), 'the room exit is the legacy door');

// ---- endpointSpawn aligns an overlay coord to a tile in its own scene ----
const sp = Model.endpointSpawn(model, 'conn-1', 'b');
assert.deepEqual(sp, Object.freeze({ scene: 'room', tx: 1, ty: 1, dir: 'up' }), 'endpoint b spawn resolves to a tile in scene room');
ok(Model.endpointSpawn(model, 'no-such', 'a') === null, 'spawn for an unknown connection is null');

// ---- source snapshot is untouched (the model froze only its own copies) ----
assert.ok(!Object.isFrozen(snapshot.scenes.room), 'source scene row array was NOT frozen by the model');
snapshot.scenes.room.rows[0][0] = 'X'; // mutating the source must not reach into the model
ok(Model.scene(model, 'room').tiles[0][0].cat === 'tree', 'a later source mutation does not change the built model');

console.log(`EDITOR-MODEL-PASS ${pass}`);
