#!/usr/bin/env node
'use strict';

// test/editor/interaction.js — POINTER->INTENT layer. Drives interaction.js over a FAKE injectable
// surface (no jsdom, no canvas): pixel events become select/drag intents in tile space. Proves an
// endpoint/spawn drag records ONE coalesced changeset op at the final tile, the registry is never
// mutated, cancel/origin/off-grid behave, and the produced op actually reduces when handed to apply.

const assert = require('node:assert/strict');
const Identity = require('../../js/editor/core/identity.js');
require('../../js/editor/core/hit-test.js');
require('../../js/editor/core/draft.js');
require('../../js/editor/core/selection.js');
const Changeset = require('../../js/editor/core/changeset.js');
const Interaction = require('../../js/editor/core/interaction.js');

let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }
function px(tx, ty) { return { x: tx * 16 + 8, y: ty * 16 + 8 }; } // tile center at tileSize 16

// ---- (a) the injectable surface maps pixels to tiles, off-grid returns null -----------------
const grid = Interaction.makeGridSurface({ tileSize: 16, cols: 10, rows: 9 });
ok(grid.pxToTile(8, 8).tx === 0 && grid.pxToTile(8, 8).ty === 0, 'surface px(8,8)->tile(0,0)');
ok(grid.pxToTile(24, 40).tx === 1 && grid.pxToTile(24, 40).ty === 2, 'surface px(24,40)->tile(1,2)');
ok(grid.pxToTile(-1, 8) === null, 'surface negative pixel is off-grid -> null');
ok(grid.pxToTile(999, 999) === null, 'surface out-of-bounds pixel is off-grid -> null');

// ---- a tiny registry + paint-ordered selectables (topmost LAST, matching hit-test z-order) ---
function makeRegistry() {
  return { connections: [{
    id: 'c1',
    a: { scene: 'town', triggers: [[2, 3]], spawn: { tx: 2, ty: 3, dir: 'down' } },
    b: { scene: 'diner', triggers: [[6, 8]], spawn: { tx: 6, ty: 8, dir: 'up' }, departureReaction: 'back-door' }
   }] };
}

// Endpoint A marker sits on top of an exit at the SAME tile -> endpoint (painted later) must win.
const epA = Identity.endpointId('c1', 'a'); // connection-endpoint:c1:a
function selectables() {
  return [
    { id: 'exit:x', kind: 'exit', tx: 2, ty: 3 },                 // under
    { id: epA, kind: 'connection-endpoint', tx: 2, ty: 3 },       // over A (same tile as the exit)
    { id: Identity.endpointId('c1', 'b'), kind: 'connection-endpoint', tx: 6, ty: 8 }
   ];
}

// ---- (b) clicking an endpoint begins a drag AND selects it; topmost wins the tie ------------
let reg = makeRegistry();
let s0 = Interaction.createSession({ surface: grid, selectables: selectables(), registry: reg });
ok(Interaction.isDragging(s0) === false, 'a fresh session is idle');
let s1 = Interaction.pointerDown(s0, px(2, 3));
ok(Interaction.isDragging(s1) === true, 'pointerDown on an endpoint begins a drag');
ok(s1.selection.ids[0] === epA && s1.selection.ids.length === 1, 'the drag selects the topmost (endpoint over exit) by its stable id');
ok(s1.drag.connectionId === 'c1' && s1.drag.side === 'a' && s1.drag.fromSpawn.tx === 2 && s1.drag.fromSpawn.ty === 3, 'drag captured connId/side + origin tile from the parsed id');

// ---- (c) dragging across tiles coalesces to ONE upsert at the final tile -------------------
let s2 = Interaction.dragTo(s1, px(0, 0));          // intermediate hop -> one op so far
ok(s2.drag.moved === true && Interaction.pendingChangeset(s2).operations.length === 1, 'each drag keeps exactly one coalesced op');
let s3 = Interaction.dragTo(s2, px(4, 5));          // final tile (4,5) -> still one op, retargeted
const pend = Interaction.pendingChangeset(s3);
ok(pend.operations.length === 1, 'a multi-tile drag stays a single coalesced upsert');
ok(pend.operations[0].op === 'upsert' && pend.operations[0].connection.id === 'c1', 'the op upserts connection c1');
ok(pend.operations[0].connection.a.spawn.tx === 4 && pend.operations[0].connection.a.spawn.ty === 5, 'the moved side a.spawn landed on the final tile (4,5)');
ok(pend.operations[0].connection.a.spawn.dir === 'down', 'the move preserves the spawn direction');
// The authoritative registry is NEVER mutated in place by the drag preview.
ok(reg.connections[0].a.spawn.tx === 2 && reg.connections[0].a.spawn.ty === 3, 'drag did not mutate the source registry record');
// Other fields survive: the opposite side + triggers + a sibling reaction are untouched.
ok(pend.operations[0].connection.b.spawn.tx === 6 && pend.operations[0].connection.b.departureReaction === 'back-door', 'the move preserves the opposite side and its fields');
ok(JSON.stringify(pend.operations[0].connection.a.triggers) === JSON.stringify([[2, 3]]), 'the move preserves the moved side triggers');

// ---- (d) pointerUp finalizes: yields the changeset and returns to idle ----------------------
const up = Interaction.pointerUp(s3);
ok(up.session.mode === 'idle' && up.session.drag === null, 'pointerUp returns the session to idle with no drag');
ok(up.changeset.operations.length === 1, 'pointerUp yields exactly one coalesced op');

// ---- (e) the produced op is real: applying it moves the registry end-to-end -----------------
const next = Changeset.applyChangeset(reg, up.changeset);
ok(next.connections[0].a.spawn.tx === 4 && next.connections[0].a.spawn.ty === 5, 'applyChangeset reduces the moved endpoint to its final tile');
ok(reg.connections[0].a.spawn.tx === 2, 'the source registry is unchanged after apply (reducer clones)');

// ---- (f) returning to the origin records nothing -------------------------------------------
let s4 = Interaction.pointerDown(Interaction.createSession({ surface: grid, selectables: selectables(), registry: makeRegistry() }), px(2, 3));
s4 = Interaction.dragTo(s4, px(0, 0));
s4 = Interaction.dragTo(s4, px(2, 3)); // back where it started
ok(s4.drag.moved === false, 'dragging back to the origin is not a move');
ok(Interaction.pendingChangeset(s4).operations.length === 0, 'an origin-returning drag records no op');

// ---- (g) cancelDrag discards an in-progress move without recording anything -----------------
let s5 = Interaction.pointerDown(Interaction.createSession({ surface: grid, selectables: selectables(), registry: makeRegistry() }), px(2, 3));
s5 = Interaction.dragTo(s5, px(4, 5));
ok(Interaction.pendingChangeset(s5).operations.length === 1, 'before cancel a live move has one op');
s5 = Interaction.cancelDrag(s5);
ok(s5.mode === 'idle' && s5.drag === null, 'cancelDrag returns to idle and drops the drag');
ok(Interaction.pendingChangeset(s5).operations.length === 0, 'cancelDrag discards the recorded move');

// ---- (h) a non-endpoint marker selects but is not draggable ---------------------------------
let s6 = Interaction.pointerDown(Interaction.createSession({ surface: grid, selectables: [{ id: 'exit:x', kind: 'exit', tx: 2, ty: 3 }], registry: makeRegistry() }), px(2, 3));
ok(s6.selection.ids[0] === 'exit:x' && s6.mode === 'idle', 'a plain marker selects without starting a drag');
let s6b = Interaction.dragTo(s6, px(4, 5));
ok(s6b === s6 && Interaction.pendingChangeset(s6b).operations.length === 0, 'dragTo is a no-op when not dragging');

// ---- (i) a miss / off-grid click CLEARS the selection --------------------------------------
let sel = Interaction.createSession({ surface: grid, selectables: selectables(), registry: makeRegistry() });
sel = Interaction.pointerDown(sel, px(2, 3));       // grab something first
ok(sel.selection.ids.length === 1, 'a hit selected one item');
sel = Interaction.pointerDown(sel, px(8, 8));        // click empty ground (no marker at 8,8)
ok(sel.selection.ids.length === 0, 'a miss on empty ground clears the selection');
sel = Interaction.pointerDown(sel, { x: -1, y: 5 }); // off-grid pixel
ok(sel.selection.ids.length === 0 && sel.mode === 'idle', 'an off-grid click also clears and stays idle');

// ---- (j) fail loud: an endpoint whose connection is absent cannot be dragged ----------------
const ghost = [{ id: Identity.endpointId('ghost', 'a'), kind: 'connection-endpoint', tx: 1, ty: 1 }];
let threw = false;
try { Interaction.pointerDown(Interaction.createSession({ surface: grid, selectables: ghost, registry: makeRegistry() }), px(1, 1)); }
catch (e) { threw = /unknown connection/.test(e.message); }
ok(threw, 'dragging an endpoint of a connection missing from the registry fails loud');

console.log(`EDITOR-INTERACTION-PASS ${pass}`);
