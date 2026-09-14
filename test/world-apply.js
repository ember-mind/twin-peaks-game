#!/usr/bin/env node
'use strict';

/* test/world-apply.js — tools/world-apply.js on a TEMP COPY fixture (the repo registry is never touched).
 *
 * Fixture root: world/connections.json + test/gen-world-data.js + js/ (gen output dir), copied to a tmp dir.
 *   dry-run leaves the fixture byte-identical; apply rewrites deterministically and regenerates the .gen.js;
 *   a second apply is a no-op; strict refusals (unknown id / endpoint / foreign target) and invalid records
 *   exit non-zero without writing.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CLI = path.join(REPO, 'tools', 'world-apply.js');
let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + detail : '')); pass++; }

const repoRegistryBefore = fs.readFileSync(path.join(REPO, 'world', 'connections.json'));
const repoGenBefore = fs.readFileSync(path.join(REPO, 'js', 'world-connections.gen.js'));

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-world-apply-'));
  fs.mkdirSync(path.join(root, 'world'));
  fs.mkdirSync(path.join(root, 'test'));
  fs.mkdirSync(path.join(root, 'js'));
  fs.copyFileSync(path.join(REPO, 'world', 'connections.json'), path.join(root, 'world', 'connections.json'));
  fs.copyFileSync(path.join(REPO, 'test', 'gen-world-data.js'), path.join(root, 'test', 'gen-world-data.js'));
  fs.copyFileSync(path.join(REPO, 'js', 'world-connections.gen.js'), path.join(root, 'js', 'world-connections.gen.js'));
  return root;
}
function run(root, csObj, extra) {
  const file = path.join(root, 'changeset-' + Math.random().toString(36).slice(2) + '.json');
  fs.writeFileSync(file, typeof csObj === 'string' ? csObj : JSON.stringify(csObj, null, 2));
  const r = spawnSync(process.execPath, [CLI, file, '--root=' + root].concat(extra || []), { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const read = (root, rel) => fs.readFileSync(path.join(root, rel));

const base = JSON.parse(repoRegistryBefore.toString('utf8'));
const rec = JSON.parse(JSON.stringify(base.connections.find((c) => c.id === 'sheriffs-station-front-entrance')));
const beforeA = JSON.parse(JSON.stringify(rec.a));
rec.a.spawn = { tx: 8, ty: 8, dir: 'left' };
rec.a.triggers.push([8, 9]);
const CS = { format: 'world-connections-changeset', version: 1, target: 'world/connections.json',
  operations: [{ op: 'upsert', id: rec.id, endpoints: ['a'], connection: rec }] };

// ---- dry-run: byte-identical fixture
const fx = makeFixture();
const reg0 = read(fx, 'world/connections.json'), gen0 = read(fx, 'js/world-connections.gen.js');
let r = run(fx, CS, ['--dry-run']);
ok(r.code === 0, 'dry-run exits 0', r.err);
ok(r.out.includes('TARGET world/connections.json :: sheriffs-station-front-entrance'), 'prints TARGET line');
ok(r.out.includes('BEFORE ' + JSON.stringify(beforeA)), 'prints BEFORE endpoint json', r.out);
ok(r.out.includes('AFTER  ' + JSON.stringify(rec.a)), 'prints AFTER endpoint json', r.out);
ok(!r.out.includes(':: double-r-front-entrance'), 'only the changed connection is printed');
ok(read(fx, 'world/connections.json').equals(reg0), 'dry-run leaves registry byte-identical');
ok(read(fx, 'js/world-connections.gen.js').equals(gen0), 'dry-run leaves gen file byte-identical');

// ---- apply: deterministic rewrite + regenerate
r = run(fx, CS);
ok(r.code === 0, 'apply exits 0', r.err);
const reg1 = read(fx, 'world/connections.json');
const parsed1 = JSON.parse(reg1.toString('utf8'));
ok(reg1.toString('utf8') === JSON.stringify(parsed1, null, 2) + '\n', 'registry written as 2-space JSON + newline');
ok(JSON.stringify(parsed1.connections.map((c) => c.id)) === JSON.stringify(base.connections.map((c) => c.id)), 'record order kept');
ok(parsed1.version === base.version, 'version unchanged');
assert.deepEqual(parsed1.connections.find((c) => c.id === rec.id), rec); pass++;
ok(parsed1.connections.filter((c) => c.id !== rec.id).every((c) => JSON.stringify(c) === JSON.stringify(base.connections.find((b) => b.id === c.id))), 'other records untouched');
const gen1 = read(fx, 'js/world-connections.gen.js').toString('utf8');
ok(!read(fx, 'js/world-connections.gen.js').equals(gen0) && gen1.includes('"tx": 8') && gen1.includes('"dir": "left"'), 'gen-world-data regenerated the binding');

// same changeset on a second fresh fixture -> identical bytes (deterministic)
const fx2 = makeFixture();
ok(run(fx2, CS).code === 0 && read(fx2, 'world/connections.json').equals(reg1), 'apply is deterministic across fixtures');

// ---- second apply: no-op
r = run(fx, CS);
ok(r.code === 0 && r.out.includes('NO-OP'), 'second apply reports NO-OP', r.out);
ok(read(fx, 'world/connections.json').equals(reg1), 'second apply leaves registry byte-identical');
ok(read(fx, 'js/world-connections.gen.js').toString('utf8') === gen1, 'second apply leaves gen file byte-identical');

// ---- refusals: nothing written
function refused(label, cs, code) {
  const f = makeFixture();
  const before = read(f, 'world/connections.json');
  const res = run(f, cs);
  ok(res.code === code, label + ' exits ' + code, res.out + res.err);
  ok(read(f, 'world/connections.json').equals(before), label + ' writes nothing');
  return res;
}
const ghost = JSON.parse(JSON.stringify(CS)); ghost.operations[0].id = 'ghost'; ghost.operations[0].connection.id = 'ghost';
ok(/unknown connection id "ghost"/.test(refused('unknown connection id', ghost, 2).err), 'unknown id message');
const badEp = JSON.parse(JSON.stringify(CS)); badEp.operations[0].endpoints = ['c'];
ok(/unknown endpoint "c"/.test(refused('unknown endpoint', badEp, 2).err), 'unknown endpoint message');
const foreign = JSON.parse(JSON.stringify(CS)); foreign.target = 'js/maps.js';
ok(/REFUSED/.test(refused('foreign target path', foreign, 2).err), 'foreign target refused');
const invalid = JSON.parse(JSON.stringify(CS)); invalid.operations[0].connection.a.spawn.tx = 99;
ok(/INVALID sheriffs-station-front-entrance: a\.spawn is outside map bounds/.test(refused('invalid record', invalid, 1).err), 'validateConnection message verbatim');
const wall = JSON.parse(JSON.stringify(base.connections.find((c) => c.id === 'double-r-front-entrance')));
wall.b.triggers.push([8, 9]);
ok(/b\.triggers\[2\] must be walkable/.test(refused('diner wall trigger', { operations: [{ op: 'upsert', id: wall.id, endpoints: ['b'], connection: wall }] }, 1).err), 'wall trigger rejected against real maps');

ok(fs.readFileSync(path.join(REPO, 'world', 'connections.json')).equals(repoRegistryBefore), 'repo world/connections.json untouched');
ok(fs.readFileSync(path.join(REPO, 'js', 'world-connections.gen.js')).equals(repoGenBefore), 'repo js/world-connections.gen.js untouched');

console.log(`WORLD-APPLY-PASS ${pass}`);
