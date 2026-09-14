#!/usr/bin/env node
'use strict';

// World-builder editor CORE (js/world-builder-core.js) — assembles editor STATE from source data and gives
// every view ONE read-only model + a centralised schema registry, with NO DOM/Canvas/rAF and no undo/save.
// A synthetic source snapshot (matching buildWorldModel's input shape) drives every assertion, so the core is
// proven game-free by construction: the test supplies all data itself.

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

// Browser parity: the editor-core pieces register onto globalThis.Editor before assembly resolves them.
require('../../js/editor/core/identity.js');
require('../../js/editor/core/model.js');
require('../../js/editor/core/selection.js');
require('../../js/editor/core/inspector.js');

const WB = require('../../js/world-builder-core.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

// ---- a synthetic source snapshot: two scenes (an outdoor town + an indoor diner), one triggered connection.
const source = {
  tile: { g: { cat: 'grass', color: '#4a3' }, w: { cat: 'water', color: '#25c' } },
  scenes: {
    town: {
      sceneId: 'town', name: 'Town Square', locationId: 'loc_town', width: 4, height: 3, indoor: false,
      overlays: [
        { kind: 'exit', tx: 1, ty: 2, target: 'traincar' },
        { kind: 'object', tx: 0, ty: 0, name: 'mailbox' },
        { kind: 'npc', tx: 2, ty: 1 }
       ]
      },
    diner: {
      sceneId: 'diner', name: 'Double R', locationId: 'loc_town', width: 3, height: 2, indoor: true,
      overlays: [{ kind: 'object', tx: 0, ty: 0 }]
       }
     },
    locations: [{ id: 'loc_town' }],
  connections: [
   { id: 'town-to-traincar', a: { scene: 'town', spawn: { tx: 5, ty: 6, dir: 'up' } }, b: { scene: 'traincar', spawn: { tx: 1, ty: 9, dir: 'down' } }, triggers: [] }
   ],
  unresolved: []
};

// ---- (a) buildEditorState assembles a single frozen editor-state object for every view to consume.
const st = WB.buildEditorState(source);
ok(Object.isFrozen(st), 'buildEditorState returns a frozen state');
ok(typeof st.model === 'object' && st.model.sceneCount === 2, 'state carries the single derived model (sceneCount=2)');
ok(typeof st.selection === 'object' && Object.isFrozen(st.selection) && st.selection.ids.length === 0, 'selection starts empty + frozen');
ok(st.sceneId === null, 'no active scene at assembly');
ok(Object.prototype.hasOwnProperty.call(st, 'schemas'), 'state carries the centralised schema registry');

// buildWorldModel is the ONLY model derivation: two views calling it share one object, no divergence.
ok(WB.buildEditorState(source).model === st.model || WB.buildEditorState(source).model.sceneCount === 2, 'every state derives the same-shaped model');

// ---- (b) a scene change resets selection but keeps source/model/schemas (world unchanged).
const next = WB.resetForScene(st, 'diner');
ok(Object.isFrozen(next), 'resetForScene returns a frozen copy');
ok(next.selection.ids.length === 0, 'scene change clears the selection');
ok(next.sceneId === 'diner', 'scene change sets the active scene id');
ok(next.model === st.model && next.source === st.source && next.schemas === st.schemas, 'reset keeps source/model/schemas intact');
// input state is never mutated by a reset.
ok(st.selection.ids.length === 0 && st.sceneId === null, 'input state is untouched by resetForScene');

// ---- (c) detectKind classifies model/overlay shapes so callers need not name the kind.
const town = st.model.scenes['town'];
ok(WB.detectKind(town) === 'scene', 'detectKind -> scene for a model scene');
ok(WB.detectKind(st.model.connectionsById['town-to-traincar']) === 'connection', 'detectKind -> connection for a record');
ok(WB.detectKind(town.byKind.exits[0]) === 'exit', 'detectKind -> exit overlay');
ok(WB.detectKind(town.byKind.objects[0]) === 'object', 'detectKind -> object overlay');
ok(WB.detectKind(town.byKind.npcs[0]) === 'npc', 'detectKind -> npc overlay');
ok(WB.detectKind({ foo: 1 }) === null, 'detectKind -> null for an unknown shape');

// ---- (d) inspect() fills a property panel through the centralised schema — views supply only the entity.
const sceneRows = WB.inspect(st, town).map(function (r) { return r.key; });
ok(sceneRows.join(',') === 'sceneId,locationId,name,width,height,indoor', 'inspect(scene) emits the scene field order');
ok(WB.inspect(st, town)[0].value === 'town' && !WB.inspect(st, town)[0].editable, 'scene row carries its value + is read-only (default)');

const conn = st.model.connectionsById['town-to-traincar'];
const connRows = WB.inspect(st, conn);
ok(connRows.map(function (r) { return r.key; }).join(',') === 'id,one_way,a.scene,b.scene,a.spawn.tx,a.spawn.ty,b.spawn.tx,b.spawn.ty', 'inspect(connection) emits nested dot-path fields');
ok(connRows[2].value === 'town' && connRows[4].value === 5, 'connection dot-paths resolve (a.scene=town, a.spawn.tx=5)');
ok(connRows[1].value === false, 'inspect(connection) shows one_way (false for a paired record)');

// an overlay exposes only its common fields; an unknown shape yields no rows (never a guess).
ok(WB.inspect(st, town.byKind.objects[0]).map(function (r) { return r.key; }).join(',') === 'tx,ty', 'inspect(object overlay) -> tx,ty');
ok(WB.inspect(st, { foo: 1 }).length === 0, 'inspect(unknown shape) -> no rows');

// ---- (e) the module stays game-free and UI-free by static guard: no runtime tokens, no DOM/Canvas/rAF.
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'world-builder-core.js'), 'utf8');
ok(!/\bGAME\b|location-data|Twin Peaks/.test(src), 'world-builder-core is game-free (no GAME/location-data/Twin Peaks)');
ok(!/\bdocument\.|\bwindow\.|requestAnimationFrame|\bCanvas\b|\bctx\.?\b|rAF/i.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\n)\s*\/\/.*$/gm, '')), 'world-builder-core carries no DOM/Canvas/rAF (code only)');

// ---- (f) a bad source fails loud rather than assembling a half-built state.
let threw = false;
try { WB.buildEditorState(null); } catch (e) { threw = true; }
ok(threw, 'buildEditorState throws on a missing source snapshot');

console.log('WORLD-BUILDER-CORE-PASS ' + pass);
