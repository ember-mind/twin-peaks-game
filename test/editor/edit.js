#!/usr/bin/env node
'use strict';

// Editor edit store + M4b changeset — synthetic records only (no game modules).
// source + changeset -> expected draft; serialize -> parse -> reapply -> same draft; strict failures.

const assert = require('node:assert/strict');
const Edit = require('../../js/editor/core/edit.js');
const History = require('../../js/editor/core/history.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

const SOURCE = [
  { id: 'zeta-door', a: { scene: 's1', triggers: [[1, 1]], spawn: { tx: 1, ty: 2, dir: 'down' } },
    b: { scene: 's2', triggers: [[4, 9], [5, 9]], spawn: { tx: 4, ty: 8, dir: 'up' }, departureReaction: 'front-door' } },
  { id: 'alpha-door', a: { scene: 's3', triggers: [[0, 0]], spawn: { tx: 0, ty: 1, dir: 'down' }, door: { needsFlag: 'f' } },
    b: { scene: 's1', triggers: [[7, 7]], spawn: { tx: 7, ty: 6, dir: 'up' } } }
];

const store = Edit.createStore(SOURCE);
ok(Object.isFrozen(store.base) && Object.isFrozen(store.base['zeta-door'].b.triggers), 'base is deep-frozen');
ok(store.draft === store.base, 'fresh draft is the base');
ok(Edit.changedIds(store, store.draft).length === 0, 'fresh draft has no changes');
ok(Edit.buildChangeset(store, store.draft).operations.length === 0, 'empty changeset for untouched draft');

// ---- edits are copy-on-write
let d = Edit.setSpawn(store.draft, 'zeta-door', 'b', { tx: 8, ty: 8, dir: 'left' });
ok(d !== store.draft && d['alpha-door'] === store.base['alpha-door'], 'untouched records keep their reference');
ok(store.base['zeta-door'].b.spawn.tx === 4, 'base not mutated');
d = Edit.addTrigger(d, 'zeta-door', 'b', 8, 9);
d = Edit.moveTrigger(d, 'zeta-door', 'b', 0, 3, 9);
d = Edit.removeTrigger(d, 'zeta-door', 'b', 1);
assert.deepEqual(d['zeta-door'].b.triggers, [[3, 9], [8, 9]]);
assert.deepEqual(d['zeta-door'].b.spawn, { tx: 8, ty: 8, dir: 'left' });
ok(d['zeta-door'].b.departureReaction === 'front-door', 'non-edited endpoint fields survive');
d = Edit.setSpawn(d, 'alpha-door', 'a', { dir: 'right' });
pass += 3;

ok(JSON.stringify(Edit.changedIds(store, d)) === '["alpha-door","zeta-door"]', 'changedIds sorted');
ok(Edit.changedEndpoints(store, d, 'zeta-door').join() === 'b', 'changedEndpoints names only b');

// ---- changeset: only changed connections, sorted by id
const cs = Edit.buildChangeset(store, d);
ok(cs.format === 'world-connections-changeset' && cs.version === 1 && cs.target === 'world/connections.json', 'changeset header');
ok(cs.operations.map((o) => o.id).join() === 'alpha-door,zeta-door', 'operations sorted by id');
ok(cs.operations.every((o) => o.op === 'upsert' && o.connection.id === o.id), 'whole-record upserts');
ok(cs.operations[0].endpoints.join() === 'a' && cs.operations[1].endpoints.join() === 'b', 'endpoints listed per op');
ok(cs.operations[0].connection.a.door.needsFlag === 'f', 'door fields kept in exported record');

// a draft edited back to its original value is not a change
let back = Edit.setSpawn(store.draft, 'alpha-door', 'a', { dir: 'right' });
back = Edit.setSpawn(back, 'alpha-door', 'a', { dir: 'down' });
ok(Edit.buildChangeset(store, back).operations.length === 0, 'edit + inverse edit exports nothing');

// ---- source + changeset -> expected draft
const re = Edit.reapply(SOURCE, cs);
assert.equal(Edit.canonical(re), Edit.canonical(d), 'reapply reproduces the draft');
pass++;

// ---- serialize -> parse -> reapply -> same draft, and export is stable
const text = Edit.serialize(cs);
const parsed = JSON.parse(text);
const re2 = Edit.reapply(SOURCE, parsed);
assert.equal(Edit.canonical(re2), Edit.canonical(d));
ok(Edit.serialize(Edit.buildChangeset(store, re2)) === text, 'reapplied draft exports byte-identical changeset');
pass++;

// ---- strict reapply failures
const bad = (mut) => { const c = JSON.parse(text); mut(c); return c; };
assert.throws(() => Edit.reapply(SOURCE, bad((c) => { c.operations[0].id = 'ghost'; c.operations[0].connection.id = 'ghost'; })), /unknown connection id "ghost"/);
assert.throws(() => Edit.reapply(SOURCE, bad((c) => { c.operations[0].endpoints = ['c']; })), /unknown endpoint "c"/);
assert.throws(() => Edit.reapply(SOURCE, bad((c) => { c.operations[0].connection.c = c.operations[0].connection.a; })), /unknown endpoint "c"/);
assert.throws(() => Edit.reapply(SOURCE, bad((c) => { delete c.operations[1].connection.b; })), /missing endpoint "b"/);
assert.throws(() => Edit.reapply(SOURCE, bad((c) => { c.operations[0].connection.id = 'zeta-door'; })), /disagrees/);
assert.throws(() => Edit.reapply(SOURCE, bad((c) => { c.target = 'js/maps.js'; })), /target must be world\/connections.json/);
assert.throws(() => Edit.reapply(SOURCE, { operations: [{ op: 'remove', id: 'ghost' }] }), /unknown connection id/);
assert.throws(() => Edit.reapply(SOURCE, { operations: [{ op: 'rename', id: 'alpha-door' }] }), /op is unknown/);
pass += 8;
ok(!('alpha-door' in Edit.reapply(SOURCE, { operations: [{ op: 'remove', id: 'alpha-door' }] })), 'remove of a known id drops it');

// ---- edit guards
assert.throws(() => Edit.setSpawn(store.draft, 'ghost', 'a', { tx: 1 }), /unknown connection id/);
assert.throws(() => Edit.setSpawn(store.draft, 'zeta-door', 'c', { tx: 1 }), /unknown endpoint/);
assert.throws(() => Edit.setSpawn(store.draft, 'zeta-door', 'a', { dir: 'north' }), /facing/);
assert.throws(() => Edit.setSpawn(store.draft, 'zeta-door', 'a', { tx: 1.5 }), /integer/);
assert.throws(() => Edit.moveTrigger(store.draft, 'zeta-door', 'a', 5, 1, 1), /does not exist/);
assert.throws(() => Edit.removeTrigger(store.draft, 'zeta-door', 'a', -1), /does not exist/);
pass += 6;

// ---- revert + history (Ctrl+Z path)
ok(Edit.revertConnection(store, d, 'zeta-door')['zeta-door'] === store.base['zeta-door'], 'revert selected restores base record');
ok(Edit.changedIds(store, Edit.revertConnection(store, d, 'zeta-door')).join() === 'alpha-door', 'revert selected leaves other drafts');
ok(Edit.revertAll(store) === store.base, 'revert all returns base');
let h = History.create(store.draft);
const e1 = Edit.setSpawn(h.present, 'zeta-door', 'b', { tx: 9 });
h = History.commit(h, e1);
const e2 = Edit.addTrigger(h.present, 'zeta-door', 'b', 9, 9);
h = History.commit(h, e2);
h = History.undo(h);
ok(h.present === e1 && Edit.changedIds(store, h.present).join() === 'zeta-door', 'undo steps back one edit');
h = History.commit(h, Edit.revertAll(store));
h = History.undo(h);
ok(h.present === e1, 'revert all is itself undoable');

// ---- validateDraft with an injected context
const ctx = {
  knownIds: (id) => id === 'zeta-door' || id === 'alpha-door',
  sceneExists: (s) => ['s1', 's2', 's3'].includes(s),
  validateConnection: (rec) => ({ errors: rec.b.spawn.tx > 10 ? ['b.spawn is outside map bounds'] : [] }),
  validateEndpoint: (side, ep) => (ep.scene === 's1' && ep.spawn.tx === 1 && ep.spawn.dir === 'broken' ? 'x' : null)
};
ok(Edit.validateDraft(store.base['zeta-door'], ctx).length === 0, 'valid record -> no errors');
const oob = Edit.setSpawn(store.draft, 'zeta-door', 'b', { tx: 19 })['zeta-door'];
assert.deepEqual(Edit.validateDraft(oob, ctx, { changedSides: ['b'] }), ['b.spawn is outside map bounds']);
pass++;
const sameScene = JSON.parse(JSON.stringify(store.base['zeta-door'])); sameScene.b.scene = 's1';
ok(Edit.validateDraft(sameScene, ctx, { changedSides: ['b'] }).includes('paired endpoint a no longer valid: same scene as b'), 'paired endpoint check');

console.log(`EDITOR-EDIT-PASS ${pass}`);
