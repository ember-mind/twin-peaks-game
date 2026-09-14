// test/apply-changeset.js — STEP 4 APPLY PIPELINE, round-trip proof (node-only, hermetic).
//
// Proves the changeset pipeline end-to-end WITHOUT touching world/connections.json or the gen file:
//   apply() is a dry-run pure transform (version bump + audit entry, no I/O);
//   commit() atomically writes json v+1 to a caller-chosen path + appends an audit sidecar;
//   the produced registry is itself a legal, loadable runtime binding at version+1.
// We deliberately do NOT shell out to test/gen-world-data.js here: it hardcodes repo paths, and a
// non-destructive suite must not rewrite the repo's real registry/gen file. js/editor/apply/
// changeset-apply.js#regenerate() is what wires gen for REAL commits; this test isolates correctness.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const CA = require('../js/editor/apply/changeset-apply.js');

let pass = 0;
function ok(cond, msg) { if (!cond) throw new Error('FAIL: ' + msg); pass++; }

// Load the real registry read-only (never written by this test).
const repoRoot = path.join(__dirname, '..');
const registryPath = path.join(repoRoot, 'world', 'connections.json');
const base = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
ok(Array.isArray(base.connections) && base.connections.length === 15, 'base registry has 15 records');
const baseVersion = base.version == null ? 1 : base.version;

// ---- (a) DRY-RUN apply bumps the version and is pure (no disk write). ----------------------------
const beforeMtime = fs.statSync(registryPath).mtimeMs;
const csUpsert = { operations: [
  { op: 'upsert', connection: JSON.parse(JSON.stringify(base.connections[0])) } // re-upsert existing -> no change of content, version still bumps
] };
const dry = CA.apply(base, csUpsert);
ok(dry.dryRun === true, 'apply() defaults to dry-run');
assert.equal(dry.next.version, baseVersion + 1, 'next registry bumps the version by exactly one');
assert.equal(dry.toVersion, baseVersion + 1, 'toVersion is fromVersion+1');
ok(Array.isArray(dry.auditEntry.changes) && dry.auditEntry.changes.length === 1, 'audit entry records one change');
assert.equal(dry.auditEntry.fromVersion, baseVersion, 'audit entry captures the source version');
ok(fs.statSync(registryPath).mtimeMs === beforeMtime, 'dry-run apply wrote nothing to world/connections.json');

// ---- (b) upsert of a NEW connection adds it; remove deletes one — all in one changeset. ---------
const newRec = { id: '__test-scratch-door__', a: { scene: 'town', triggers: [[1, 1]], spawn: { tx: 1, ty: 2, dir: 'down' } }, b: { scene: 'diner', triggers: [[9, 9]], spawn: { tx: 8, ty: 8, dir: 'up' } } };
const csTwo = { operations: [
  { op: 'upsert', connection: newRec },
  { op: 'remove', id: base.connections[0].id }
] };
const two = CA.apply(base, csTwo);
ok(two.next.connections.some(c => c.id === '__test-scratch-door__'), 'apply added the new connection');
ok(!two.next.connections.some(c => c.id === base.connections[0].id), 'apply removed the targeted connection');
assert.equal(two.next.connections.length, base.connections.length, 'add + remove keep the record count');

// ---- (c) COMMIT writes json v+1 to a caller-chosen temp path + appends an audit sidecar. ---------
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'changeset-'));
const outJson = path.join(dir, 'connections.json');
const outAudit = path.join(dir, 'connections.audit.jsonl');
const committed = CA.commit(outJson, base, outAudit, { changeset: csTwo, stamp: 'unit-test' });
ok(committed.dryRun === false, 'commit() is not a dry-run');
ok(fs.existsSync(outJson), 'commit wrote the versioned json to the target path');
const written = JSON.parse(fs.readFileSync(outJson, 'utf8'));
assert.equal(written.version, baseVersion + 1, 'written json carries version+1');
ok(written.connections.some(c => c.id === '__test-scratch-door__'), 'written json contains the added record');
ok(!written.connections.some(c => c.id === base.connections[0].id), 'written json lacks the removed record');
const auditLines = fs.readFileSync(outAudit, 'utf8').split('\n').filter(Boolean);
assert.equal(auditLines.length, 1, 'audit sidecar appended exactly one entry line');
const auditEntry = JSON.parse(auditLines[0]);
assert.equal(auditEntry.toVersion, baseVersion + 1, 'audit entry reports the new version');
assert.equal(auditEntry.stamp, 'unit-test', 'audit entry carries the caller-supplied stamp');

// ---- (d) The produced registry is itself a legal binding and loads as frozen runtime data. ------
CA.validateRegistry(written); // a thrown here means apply produced an illegal registry
const vm = require('vm');
const sandbox = {};
sandbox.window = undefined; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
// Embed the committed records exactly as gen-world-data.js does, then load them in isolation.
const moduleSrc = "(function(){function f(v){if(v&&typeof v==='object'){Object.freeze(v);for(var k in v)f(v[k]);}return v;}var GAME={};var connections=" + JSON.stringify(written.connections) + ";" +
   "GAME.WorldData={version:" + written.version + ",connections:f(connections)};return GAME.WorldData;})()";
const loaded = vm.runInContext(moduleSrc, sandbox);
assert.equal(loaded.version, baseVersion + 1, 'the produced registry loads as a frozen binding at version+1');
ok(Object.isFrozen(loaded.connections) && Object.isFrozen(loaded.connections[0]), 'loaded records are deep-frozen');

// ---- (e) Validation rejects malformed input loudly. --------------------------------------------
assert.throws(function () { CA.apply(base, { operations: [{ op: 'remove', id: '__does-not-exist__' }] }); }, /unknown id/, 'removing an unknown id fails loud');
assert.throws(function () { CA.apply(base, { operations: [{ op: 'upsert', connection: { a: {}, b: {} } }] }); }, /id|endpoint/, 'an upsert without an id/endpoints is rejected');
assert.throws(function () { CA.apply(base, { operations: [{ op: 'bogus' }] }); }, /unknown/, 'an unknown op type is rejected');

// ---- (f) Read-only cast view derives which connections are live at a story-moment. --------------
const view = CA.buildCastView(base, ['diner']);
ok(view.length === base.connections.length, 'cast view covers every connection');
ok(view.every(function (v) { return typeof v.live === 'boolean'; }), 'each cast entry has a boolean live flag');
ok(view.some(function (v) { return v.live; }), 'a connection touching the diner scene is live when the diner is present');

// ---- (g) Idempotence: applying an empty changeset only bumps the version, nothing else. ----------
const noop = CA.apply(base, { operations: [] });
assert.equal(noop.next.connections.length, base.connections.length, 'empty changeset keeps record count');
assert.deepEqual(JSON.parse(JSON.stringify(noop.next.connections)).sort(function (a, b) { return a.id < b.id ? -1 : 1; }),
  base.connections.slice().map(c => JSON.parse(JSON.stringify(c))).sort(function (a, b) { return a.id < b.id ? -1 : 1; }),
  'empty changeset leaves every record unchanged');

console.log('APPLY-CHANGESET-PASS ' + pass + ' checks — dry-run version bump, add/remove, atomic commit+audit sidecar, frozen reload, loud rejection, cast view, idempotence');
