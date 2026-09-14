#!/usr/bin/env node
'use strict';

// Editor changeset pipeline — draft -> versioned changeset -> pure reduce + validation, with a
// rejected op. Synthetic only (no real registry), zero game refs. Mirrors apply-changeset.js's
// reducer so the two stay provably in lockstep.

const assert = require('node:assert/strict');
const Draft = require('../../js/editor/core/draft.js');
const Changeset = require('../../js/editor/core/changeset.js');
const Validation = require('../../js/editor/core/validation.js');
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

console.log(`EDITOR-CHANGESET-PASS ${pass}`);
