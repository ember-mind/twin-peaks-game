#!/usr/bin/env node
'use strict';

// Editor apply-preflight — proves "the catalog test runs before any apply": a failing
// catalog gate must block a write, a passing one lets the gated commit through. Hermetic
// (temp files), no real registry touched.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCatalogPreflight, preflightThenCommit } = require('../js/editor/apply/preflight.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

// A minimal but LEGAL registry (validateRecord: id + a/b scenes + triggers[] + spawn.tx).
function makeRegistry() {
  return { version: 1, connections: [
    { id: 'seed', a: { scene: 's-a', triggers: [], spawn: { tx: 0, ty: 0 } }, b: { scene: 's-b', triggers: [], spawn: { tx: 0, ty: 0 } } }
   ] };
}

// A changeset that adds one connection (so the gated commit bumps v1 -> v2).
const addChange = { operations: [
  { op: 'upsert', connection: { id: 'extra', a: { scene: 's-b', triggers: [], spawn: { tx: 1, ty: 1 } }, b: { scene: 's-c', triggers: [], spawn: { tx: 2, ty: 2 } } } }
] };

// ---- real catalog gate passes by default ----
let pf = runCatalogPreflight();
ok(pf.ok === true, 'real catalog/bijection gate passes (both scripts green)');

// ---- a missing gate script reports ok:false WITHOUT throwing at the caller ----
pf = runCatalogPreflight({ scripts: ['test/__definitely-absent-gate__.js'] });
ok(pf.ok === false, 'a failing/missing gate yields ok:false');
ok(/FAILED|no such file|Cannot find/i.test(pf.output || ''), 'failing gate reports why in output');

// ---- PASSING gate -> preflightThenCommit writes v+1 to a fresh temp target ----
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-preflight-'));
const target = path.join(dir, 'registry.json');
ok(!fs.existsSync(target), 'temp target does not exist before gated commit');

let res;
assert.doesNotThrow(() => { res = preflightThenCommit(target, makeRegistry(), null, { changeset: addChange }); });
ok(res.dryRun === false && res.wrote === target, 'gated commit actually wrote (dryRun:false)');
ok(fs.existsSync(target), 'gated commit created the target file');
const reloaded = JSON.parse(fs.readFileSync(target, 'utf8'));
ok(reloaded.version === 2, 'gated apply bumped version v1 -> v+1');
ok(reloaded.connections.length === 2, 'gated apply added the connection (upsert)');

// ---- FAILING gate -> preflightThenCommit throws and writes NOTHING ----
const blockedTarget = path.join(dir, 'blocked.json');
assert.throws(() => preflightThenCommit(blockedTarget, makeRegistry(), null, { changeset: addChange, scripts: ['test/__absent__.js'] }), /preflight/);
ok(!fs.existsSync(blockedTarget), 'failing gate wrote nothing — the broken apply never reached disk');

console.log(`EDITOR-PREFLIGHT-PASS ${pass}`);
