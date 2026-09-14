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
ok(cs.format === 'world-connections-changeset' && cs.version === 2 && cs.target === 'world/connections.json', 'changeset header');
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

// ---- one-way records: b takes no triggers, a has no spawn; export/reapply keep one_way
const ONE_WAY = [{ id: 'dream-exit', one_way: true,
  a: { scene: 's1', triggers: [[3, 3]] }, b: { scene: 's2', triggers: [], spawn: { tx: 2, ty: 6, dir: 'down' } } }];
const ow = Edit.createStore(ONE_WAY);
ok(Edit.isOneWay(ow.base['dream-exit']) && !Edit.isOneWay(store.base['zeta-door']), 'isOneWay reads one_way');
assert.throws(() => Edit.addTrigger(ow.draft, 'dream-exit', 'b', 1, 1), /endpoint b of one-way connection dream-exit takes no triggers/);
assert.throws(() => Edit.moveTrigger(ow.draft, 'dream-exit', 'b', 0, 1, 1), /takes no triggers/);
assert.throws(() => Edit.setSpawn(ow.draft, 'dream-exit', 'a', { tx: 1 }), /endpoint a of one-way connection dream-exit has no spawn/);
pass += 3;
let owd = Edit.addTrigger(ow.draft, 'dream-exit', 'a', 4, 3);
owd = Edit.setSpawn(owd, 'dream-exit', 'b', { tx: 3 });
const owcs = Edit.buildChangeset(ow, owd);
ok(owcs.operations[0].connection.one_way === true && owcs.operations[0].endpoints.join() === 'a,b', 'one-way export keeps one_way');
ok(Edit.canonical(Edit.reapply(ONE_WAY, JSON.parse(Edit.serialize(owcs)))) === Edit.canonical(owd), 'one-way changeset reapplies');
const seenOpts = [];
Edit.validateDraft(owd['dream-exit'], Object.assign({}, ctx, { knownIds: () => true, validateConnection: () => ({ errors: [] }),
  validateEndpoint: (side, ep, o) => { seenOpts.push(side + ':' + (o && o.oneWay)); return null; } }), { changedSides: ['a'] });
ok(seenOpts.join() === 'b:true', 'paired-endpoint check validates b under the one-way schema');

// ---- M6: create / delete drafts
ok(Edit.suggestId('sheriffs_station_exterior', 'room_315') === 'sheriffs-station-exterior-room-315', 'suggestId kebab-cases both scenes');
assert.deepEqual(Edit.spawnInFront(5, 0, 20, 10), { tx: 5, ty: 1, dir: 'down' });       // top edge
assert.deepEqual(Edit.spawnInFront(5, 9, 20, 10), { tx: 5, ty: 8, dir: 'up' });         // bottom edge
assert.deepEqual(Edit.spawnInFront(0, 5, 20, 12), { tx: 1, ty: 5, dir: 'right' });      // left edge
assert.deepEqual(Edit.spawnInFront(19, 5, 20, 12), { tx: 18, ty: 5, dir: 'left' });     // right edge
assert.deepEqual(Edit.spawnInFront(3, 3, 7, 7), { tx: 3, ty: 4, dir: 'down' });         // centre tie -> vertical
pass += 5;

const picks = { a: { scene: 's1', tx: 2, ty: 9, width: 10, height: 10 }, b: { scene: 's3', tx: 0, ty: 4, width: 12, height: 9 } };
const paired = Edit.newConnection(Object.assign({ id: 's1-s3' }, picks));
assert.deepEqual(paired, { id: 's1-s3', a: { scene: 's1', triggers: [[2, 9]], spawn: { tx: 2, ty: 8, dir: 'up' } },
  b: { scene: 's3', triggers: [[0, 4]], spawn: { tx: 1, ty: 4, dir: 'right' } } });
const oneWayNew = Edit.newConnection(Object.assign({ id: 's1-s3-dream', oneWay: true }, picks));
assert.deepEqual(oneWayNew, { id: 's1-s3-dream', one_way: true, a: { scene: 's1', triggers: [[2, 9]] },
  b: { scene: 's3', triggers: [], spawn: { tx: 1, ty: 4, dir: 'right' } } });
const moved = Edit.newConnection(Object.assign({ id: 's1-s3', spawn: { b: { tx: 5, ty: 5 } } }, picks));
assert.deepEqual(moved.b.spawn, { tx: 5, ty: 5, dir: 'right' });
pass += 3;

let cd = Edit.createConnection(store, store.draft, paired);
ok(cd['s1-s3'] && Object.isFrozen(cd['s1-s3'].a.triggers) && cd['zeta-door'] === store.base['zeta-door'], 'create adds a frozen record, others keep their reference');
ok(Edit.isCreated(store, cd, 's1-s3') && !Edit.isCreated(store, cd, 'zeta-door'), 'isCreated');
ok(Edit.changedEndpoints(store, cd, 's1-s3').join() === 'a,b', 'a created record changes both endpoints');
cd = Edit.createConnection(store, cd, oneWayNew);
cd = Edit.deleteConnection(store, cd, 'alpha-door');
ok(Edit.isDeleted(store, cd, 'alpha-door'), 'isDeleted');
const cs2 = Edit.buildChangeset(store, cd);
ok(cs2.version === 2, 'export is version 2');
assert.deepEqual(cs2.operations.map((o) => o.op + ':' + o.id), ['delete:alpha-door', 'create:s1-s3', 'create:s1-s3-dream']);
pass++;
assert.deepEqual(cs2.operations[1], { op: 'create', id: 's1-s3', connection: paired });
assert.deepEqual(cs2.operations[0], { op: 'delete', id: 'alpha-door' });
pass += 2;
ok(Edit.canonical(Edit.reapply(SOURCE, JSON.parse(Edit.serialize(cs2)))) === Edit.canonical(cd), 'v2 serialize -> reapply reproduces create + delete draft');

// deleting a record created in the same draft leaves nothing to export
ok(Edit.buildChangeset(store, Edit.deleteConnection(store, Edit.createConnection(store, store.draft, paired), 's1-s3')).operations.length === 0, 'create then delete exports nothing');
// revert of a created record drops it; revert of a deleted record restores it
ok(!('s1-s3' in Edit.revertConnection(store, cd, 's1-s3')), 'revert drops a created record');
ok(Edit.revertConnection(store, cd, 'alpha-door')['alpha-door'] === store.base['alpha-door'], 'revert restores a deleted record');

// undo / redo through history
let hh = History.create(store.draft);
hh = History.commit(hh, Edit.createConnection(store, hh.present, paired), { label: 'create s1-s3' });
hh = History.commit(hh, Edit.deleteConnection(store, hh.present, 'zeta-door'), { label: 'delete zeta-door' });
hh = History.undo(hh);
ok('zeta-door' in hh.present && 's1-s3' in hh.present, 'undo restores the deleted record, keeps the created one');
hh = History.undo(hh);
ok(!('s1-s3' in hh.present) && hh.present === store.draft, 'second undo removes the created record');
hh = History.redo(hh);
ok('s1-s3' in hh.present && History.nextRedoLabel(hh) === 'delete zeta-door', 'redo re-creates, delete is next redo');

// create guards
assert.throws(() => Edit.createConnection(store, store.draft, Object.assign({}, paired, { id: 'zeta-door' })), /already exists in the registry/);
assert.throws(() => Edit.createConnection(store, cd, Object.assign({}, paired)), /already exists in the draft/);
assert.throws(() => Edit.createConnection(store, store.draft, Object.assign({}, paired, { id: 'Bad_Id' })), /kebab-case/);
assert.throws(() => Edit.createConnection(store, store.draft, Object.assign({}, paired, { id: 'a--b' })), /kebab-case/);
assert.throws(() => Edit.createConnection(store, store.draft, paired, { catalogHasId: (id) => id === 's1-s3' }), /already listed in js\/world-catalog\.js/);
assert.throws(() => Edit.createConnection(store, store.draft, { id: 'x-y', a: paired.a }), /missing endpoint "b"/);
const owBadNew = JSON.parse(JSON.stringify(oneWayNew)); owBadNew.b.triggers = [[1, 1]];
assert.throws(() => Edit.createConnection(store, store.draft, owBadNew), /takes no triggers/);
assert.throws(() => Edit.deleteConnection(store, store.draft, 'ghost'), /unknown connection id "ghost"/);
pass += 8;

// v2 reapply refusals
const v2 = (ops) => ({ format: 'world-connections-changeset', version: 2, target: 'world/connections.json', operations: ops });
assert.throws(() => Edit.reapply(SOURCE, v2([{ op: 'create', id: 'zeta-door', connection: Object.assign({}, paired, { id: 'zeta-door' }) }])), /creates connection id "zeta-door", which already exists/);
assert.throws(() => Edit.reapply(SOURCE, v2([{ op: 'create', id: 'x', connection: paired }])), /disagrees/);
assert.throws(() => Edit.reapply(SOURCE, v2([{ op: 'create', id: 'Bad', connection: Object.assign({}, paired, { id: 'Bad' }) }])), /kebab-case/);
assert.throws(() => Edit.reapply(SOURCE, v2([{ op: 'delete', id: 'ghost' }])), /unknown connection id "ghost"/);
assert.throws(() => Edit.reapply(SOURCE, v2([{ op: 'delete', id: 'zeta-door' }, { op: 'delete', id: 'zeta-door' }])), /second operation on connection id "zeta-door"/);
assert.throws(() => Edit.reapply(SOURCE, v2([{ op: 'create', id: 's1-s3', connection: paired }, { op: 'create', id: 's1-s3', connection: paired }])), /second operation/);
assert.throws(() => Edit.reapply(SOURCE, v2([{ op: 'remove', id: 'zeta-door' }])), /not allowed in a version 2 changeset \(use delete\)/);
assert.throws(() => Edit.reapply(SOURCE, { version: 1, operations: [{ op: 'create', id: 's1-s3', connection: paired }] }), /not allowed in a version 1 changeset \(needs version 2\)/);
assert.throws(() => Edit.reapply(SOURCE, { version: 3, operations: [] }), /version must be 1 or 2/);
pass += 9;
ok(!('zeta-door' in Edit.reapply(SOURCE, { version: 1, operations: [{ op: 'remove', id: 'zeta-door' }] })), 'version 1 remove still accepted');

// validateDraft for created records + claim conflicts
const cctx = Object.assign({}, ctx, { knownIds: (id) => id === 'zeta-door' || id === 'alpha-door',
  validateConnection: () => ({ errors: [] }), catalogHasId: (id) => id === 'listed-id', sceneLocation: (s) => (s === 's3' ? null : 'loc') });
const created = Edit.createConnection(store, store.draft, Object.assign({}, paired, { b: Object.assign({}, paired.b, { scene: 's2' }) }));
ok(Edit.validateDraft(created['s1-s3'], cctx, { created: true, draft: created }).length === 0, 'valid created record -> no errors');
const noLoc = Edit.validateDraft(paired, cctx, { created: true });
ok(noLoc.includes('endpoint b scene "s3" has no catalog location in js/world-catalog.js'), 'created record needs a catalog location');
ok(Edit.validateDraft(Object.assign({}, paired, { id: 'listed-id' }), cctx, { created: true }).some((e) => /already listed/.test(e)), 'created id already in catalog');
ok(Edit.validateDraft(Object.assign({}, paired, { id: 'zeta-door' }), cctx, { created: true }).some((e) => /already exists in the registry/.test(e)), 'created id already in registry');
const clash = JSON.parse(JSON.stringify(paired)); clash.id = 'clash'; clash.a.triggers = [[1, 1]]; clash.b.scene = 's2';
const clashDraft = Edit.createConnection(store, store.draft, clash);
ok(Edit.validateDraft(clash, cctx, { created: true, draft: clashDraft }).includes('s1 1,1 is claimed by both zeta-door and clash'), 'trigger tile claimed by another draft record');
ok(Edit.validateDraft(Object.assign({}, paired, { b: Object.assign({}, paired.b, { scene: 's1' }) }), cctx, { created: true }).includes('endpoints a and b must be in different scenes'), 'created record needs two scenes');
ok(Edit.validateDraft(paired, Object.assign({}, cctx, { sceneLocation: () => 'loc', legacyDoorAt: (s, x, y) => s === 's1' && x === 2 && y === 9 }), { created: true }).includes('a.triggers[0] s1 2,9 holds a legacy map door'), 'legacy door on a trigger tile');
ok(Edit.claimConflicts(SOURCE).length === 0 && Edit.claimConflicts(SOURCE.concat([clash])).join() === 's1 1,1 is claimed by both zeta-door and clash', 'claimConflicts over a record list');

console.log(`EDITOR-EDIT-PASS ${pass}`);
