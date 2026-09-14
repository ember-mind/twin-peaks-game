#!/usr/bin/env node
'use strict';

// Editor changeset pipeline — draft -> versioned changeset -> pure reduce + validation, with a
// rejected op. Synthetic only (no real registry), zero game refs. Mirrors apply-changeset.js's
// reducer so the two stay provably in lockstep.

const assert = require('node:assert/strict');
const Draft = require('../../js/editor/core/draft.js');
const Changeset = require('../../js/editor/core/changeset.js');
const Validation = require('../../js/editor/core/validation.js');
const Edit = require('../../js/editor/core/edit.js');
const ApplyLayer = require('../../js/editor/apply/changeset-apply.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

// A legal connection record (id + a/b scenes + triggers[] + numeric spawn.tx).
function conn(id, sa, sb) {
  return { id: id, a: { scene: sa, triggers: [], spawn: { tx: 0, ty: 0 } }, b: { scene: sb, triggers: [], spawn: { tx: 1, ty: 1 } } };
}
function makeRegistry() {
  return { version: 1, connections: [ conn('seed', 's-a', 's-b'), conn('gone', 's-c', 's-d') ] };
}

// ---- draft accumulation -> deterministic changeset ----
let d = Draft.createDraft('tester');
ok(Draft.isEmptyChangeset(Draft.toChangeset(d)), 'fresh draft is an empty changeset');
d = Draft.upsertConnection(d, conn('x', 's-a', 's-b'));
d = Draft.removeConnection(d, 'gone');
const csA = Draft.toChangeset(d);
ok(csA.operations.length === 2 && csA.operations[0].op === 'upsert' && csA.operations[1].op === 'remove', 'draft has upsert then remove');
assert.deepEqual(Draft.toChangeset(d).operations, csA.operations, 'toChangeset is deterministic for the same draft');
ok(Object.isFrozen(csA) && Object.isFrozen(csA.operations[0]) && Object.isFrozen(csA.operations[1]), 'changeset and its ops are frozen (no caller can mutate history)');

// ---- pure reduce: upsert-new + update-existing + remove, version bump, source untouched ----
const reg = makeRegistry();
const next1 = Changeset.applyChangeset(reg, csA);
ok(next1.version === 2, 'reduce bumped version v1 -> v+1 (once, not per-op)');
ok(next1.connections.length === 2, 'upsert added x then remove dropped gone (seed+gone -> seed+x = 2)');
ok(!next1.connections.some(c => c.id === 'gone'), 'remove dropped the named connection');
assert.deepEqual(reg.connections.map(c => c.id), ['seed', 'gone'], 'source registry order/content untouched by reduce');

// ---- idempotence: applying the same upsert-only changeset twice converges on identical content ----
const upCs = Draft.toChangeset(Draft.upsertConnection(Draft.createDraft(), conn('x', 's-a', 's-b')));
let afterOne = Changeset.applyChangeset(makeRegistry(), upCs);
let afterTwo = Changeset.applyChangeset(afterOne, upCs);
assert.deepEqual(afterTwo.connections, afterOne.connections, 're-applying an upsert-only changeset is idempotent on content');

// ---- a legal changeset passes validation ----
assert.doesNotThrow(() => Validation.assertValid(csA, { registry: reg }), 'a well-formed changeset passes assertValid');

// ---- rejected ops fail LOUD ----
const badScene = Draft.toChangeset(Draft.upsertConnection(Draft.createDraft(), { id: 'z', a: { triggers: [], spawn: { tx: 0 } }, b: { scene: 's-d', triggers: [], spawn: { tx: 0 } } }));
assert.throws(() => Validation.assertValid(badScene, { registry: reg }), /scene must name a scene/, 'missing endpoint scene is rejected');

const badRemove = Draft.toChangeset(Draft.removeConnection(Draft.createDraft(), 'no-such-id'));
assert.throws(() => Validation.assertValid(badRemove, { registry: reg }), /unknown id/, 'removing an unknown id fails loud');

// ---- runValidators collects EVERY problem at once (non-throwing) ----
const many = Draft.removeConnection(Draft.upsertConnection(Draft.createDraft(), { id: '' , a: { scene: 'x', triggers: [], spawn: {} }, b: null }), 'no-such-id');
const rep = Validation.runValidators(many, { registry: reg });
ok(rep.ok === false && rep.errors.length >= 3, `runValidators collected multiple errors (${rep.errors.length})`);

// ---- the reducer itself also refuses an unknown remove (last gate, matches apply) ----
assert.throws(() => Changeset.applyChangeset(makeRegistry(), badRemove), /unknown id/, 'reducer independently rejects unknown remove');

// ---- the validator LIST is pluggable, and a throwing validator is captured rather than fatal ----
// Passing [] runs no checks (the list is parameterized, not hardcoded); passing one that throws must be
// caught by the pipeline so it degrades to an error entry instead of crashing. Both directions make
// "runs a validator list" provable from outside, not assumed.
const empty = Validation.runValidators(csA, { registry: reg }, []);
ok(empty.ok === true && empty.errors.length === 0, 'an empty validator list reports no errors (the list is parameterized, not hardcoded)');
const throwing = Validation.runValidators(csA, { registry: reg }, [ () => { throw new Error('validator boom'); } ]);
ok(throwing.ok === false && /threw/.test(throwing.errors[0]), 'a validator that throws is captured as an error entry, not fatal to the pipeline');
assert.throws(() => Validation.assertValid(csA, { registry: reg }, [ () => { throw new Error('validator boom'); } ]), /threw/, 'assertValid surfaces a throwing validator as a loud failure too');

// ---- one-way record completeness: a has triggers and no spawn, b has a spawn and no triggers
const oneWayRec = { id: 'dream', one_way: true, a: { scene: 'x', triggers: [[1, 1]] }, b: { scene: 'y', triggers: [], spawn: { tx: 1, ty: 1, dir: 'up' } } };
ok(Validation.recordCompleteness(oneWayRec, 'r').length === 0, 'one-way record is complete without a.spawn');
const owBad = JSON.parse(JSON.stringify(oneWayRec)); owBad.b.triggers = [[2, 2]]; owBad.a.spawn = { tx: 0, ty: 0 };
ok(Validation.recordCompleteness(owBad, 'r').join('|') === 'r.a.spawn is not allowed on a one-way connection|r.b.triggers must be empty on a one-way connection', 'one-way shape violations reported');
const noFlag = JSON.parse(JSON.stringify(oneWayRec)); delete noFlag.one_way;
ok(Validation.recordCompleteness(noFlag, 'r').join('|') === 'r.a.spawn.tx must be numeric', 'without one_way the record is paired and needs a.spawn');

// ---- M6: version-2 changesets (create / delete), exported by Editor.edit and reduced in lockstep ----
{
  const registry = { version: 1, connections: [conn('seed', 's-a', 's-b'), conn('gone', 's-c', 's-d')] };
  // conn() records have empty triggers; give them one so the edit store's shapes are realistic
  registry.connections.forEach((c) => { c.a.triggers = [[0, 1]]; c.b.triggers = [[1, 2]]; });
  const store = Edit.createStore(registry.connections);
  const fresh = { id: 'seed-new', a: { scene: 's-a', triggers: [[4, 4]], spawn: { tx: 4, ty: 5, dir: 'down' } },
    b: { scene: 's-d', triggers: [[2, 2]], spawn: { tx: 2, ty: 3, dir: 'down' } } };
  const oneWay = { id: 'dream-drop', one_way: true, a: { scene: 's-b', triggers: [[3, 3]] }, b: { scene: 's-c', triggers: [], spawn: { tx: 1, ty: 1, dir: 'up' } } };
  let d = Edit.createConnection(store, store.draft, fresh);
  d = Edit.createConnection(store, d, oneWay);
  d = Edit.deleteConnection(store, d, 'gone');
  d = Edit.setSpawn(d, 'seed', 'a', { dir: 'left' });
  const cs = JSON.parse(Edit.serialize(Edit.buildChangeset(store, d)));
  ok(cs.format === 'world-connections-changeset' && cs.version === 2 && cs.target === 'world/connections.json', 'v2 header');
  assert.deepEqual(cs.operations.map((o) => o.op + ':' + o.id), ['create:dream-drop', 'delete:gone', 'upsert:seed', 'create:seed-new']);
  pass++;
  ok(!('endpoints' in cs.operations[0]) && cs.operations[0].connection.one_way === true, 'create carries the whole record, one_way kept, no endpoints list');
  ok(Object.keys(cs.operations[1]).join() === 'op,id', 'delete carries only op + id');

  // every reducer agrees: edit.reapply (draft map), changeset.applyChangeset (core), changeset-apply.apply (node apply layer)
  const viaEdit = Edit.reapply(registry.connections, cs);
  const viaCore = Changeset.applyChangeset(registry, cs);
  const viaApply = ApplyLayer.apply(registry, cs).next;
  const ids = (list) => list.map((c) => c.id).sort().join();
  ok(Object.keys(viaEdit).sort().join() === 'dream-drop,seed,seed-new' && ids(viaCore.connections) === ids(viaApply.connections) && ids(viaCore.connections) === Object.keys(viaEdit).sort().join(), 'edit / core / apply reducers produce the same id set');
  ok(viaCore.connections.every((c) => Edit.canonical(c) === Edit.canonical(viaEdit[c.id])) && viaApply.connections.every((c) => Edit.canonical(c) === Edit.canonical(viaEdit[c.id])), 'and the same records');
  ok(ApplyLayer.apply(registry, cs).auditEntry.changes.map((c) => c.op).join() === 'create,delete,upsert,create', 'apply layer audits create/delete');
  ok(Validation.runValidators(cs, { registry }).ok, 'v2 changeset passes the validator pipeline');

  // create never overwrites, delete of unknown fails, in all three reducers + the validator pipeline
  const dup = { version: 2, operations: [{ op: 'create', id: 'seed', connection: Object.assign({}, fresh, { id: 'seed' }) }] };
  assert.throws(() => Edit.reapply(registry.connections, dup), /already exists in the registry/);
  assert.throws(() => Changeset.applyChangeset(registry, dup), /creates existing id "seed"/);
  assert.throws(() => ApplyLayer.apply(registry, dup), /creates existing id "seed"/);
  ok(Validation.runValidators(dup, { registry }).errors.includes('operations[0] creates existing id "seed"'), 'validator reports create of an existing id');
  const ghost = { version: 2, operations: [{ op: 'delete', id: 'ghost' }] };
  assert.throws(() => Edit.reapply(registry.connections, ghost), /unknown connection id "ghost"/);
  assert.throws(() => Changeset.applyChangeset(registry, ghost), /unknown id "ghost"/);
  assert.throws(() => ApplyLayer.apply(registry, ghost), /unknown id "ghost"/);
  pass += 6;
  const badOneWay = { version: 2, operations: [{ op: 'create', id: 'dream-bad', connection: Object.assign({}, oneWay, { id: 'dream-bad', b: Object.assign({}, oneWay.b, { triggers: [[1, 1]] }) }) }] };
  assert.throws(() => Edit.reapply(registry.connections, badOneWay), /takes no triggers/);
  assert.throws(() => ApplyLayer.apply(registry, badOneWay), /b\.triggers must be empty on a one-way connection/);
  ok(Validation.runValidators(badOneWay, { registry }).errors.some((e) => /b\.triggers must be empty/.test(e)), 'one-way create validated with the M5 rules');
  pass += 2;

  // version 1 still accepted (upsert + remove), create/delete refused there
  const v1 = { version: 1, operations: [{ op: 'remove', id: 'gone' }, { op: 'upsert', id: 'seed', connection: registry.connections[0] }] };
  ok(Object.keys(Edit.reapply(registry.connections, v1)).join() === 'seed', 'version 1 upsert/remove still reapplies');
  assert.throws(() => Edit.reapply(registry.connections, { version: 1, operations: [{ op: 'delete', id: 'gone' }] }), /not allowed in a version 1 changeset/);
  pass++;
}

console.log(`EDITOR-CHANGESET-PASS ${pass}`);
