#!/usr/bin/env node
'use strict';

/* test/world-apply.js — tools/world-apply.js on a TEMP COPY fixture (the repo registry is never touched).
 *
 * Fixture root: a copy of js/ test/ world/ narrative/ index.html in a tmp dir (the tool boots <root>/js, runs
 * <root>/test/gen-world-data.js and <root>/test/world-engine-v0.1-catalog.js, and scans js/test/narrative for
 * references before a delete).
 *   M4b (version 1): dry-run leaves the fixture byte-identical; apply rewrites deterministically and regenerates
 *   the .gen.js; a second apply is a no-op; strict refusals and invalid records exit non-zero without writing.
 *   M6 (version 2): create + catalog write, delete + catalog write (bytes return to the original), dry-run prints
 *   the catalog diff, rollback of all three files on an injected gen or catalog-check failure, refused delete of
 *   a referenced id, refused duplicate id (registry, catalog, same changeset), scene with no catalog location.
 *   M7: door gating fields (set, clear, needsClues 0 refused) and PAIRED <-> ONE-WAY conversion as ordinary upserts;
 *   converting back with the original placements returns every file to its original bytes.
 * Ids created here are assembled at runtime: a literal id in this file would count as a reference.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const Edit = require(path.join(REPO, 'js', 'editor', 'core', 'edit.js'));
const CLI = path.join(REPO, 'tools', 'world-apply.js');
let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + detail : '')); pass++; }

const repoRegistryBefore = fs.readFileSync(path.join(REPO, 'world', 'connections.json'));
const repoGenBefore = fs.readFileSync(path.join(REPO, 'js', 'world-connections.gen.js'));
const repoCatalogBefore = fs.readFileSync(path.join(REPO, 'js', 'world-catalog.js'));

const FIXTURES = [];
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-world-apply-'));
  for (const d of ['engine', 'js', 'test', 'world', 'narrative']) fs.cpSync(path.join(REPO, d), path.join(root, d), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'index.html'), path.join(root, 'index.html'));
  FIXTURES.push(root);
  return root;
}
process.on('exit', () => FIXTURES.forEach((r) => fs.rmSync(r, { recursive: true, force: true })));
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

// ================= M6: version-2 create / delete with catalog write =================
const CatalogWrite = require(path.join(REPO, 'js', 'editor', 'apply', 'catalog-write.js'));
const NEW_ID = ['town', 'hospital', 'm6', 'probe'].join('-');
const OW_ID = ['town', 'hospital', 'm6', 'drop'].join('-');
const created = { id: NEW_ID, a: { scene: 'town', triggers: [[30, 9]], spawn: { tx: 30, ty: 10, dir: 'down' } },
  b: { scene: 'hospital', triggers: [[14, 9]], spawn: { tx: 13, ty: 9, dir: 'left' } } };
const oneWay = { id: OW_ID, one_way: true, a: { scene: 'town', triggers: [[34, 9]] }, b: { scene: 'hospital', triggers: [], spawn: { tx: 2, ty: 9, dir: 'right' } } };
const v2 = (ops) => ({ format: 'world-connections-changeset', version: 2, target: 'world/connections.json', operations: ops });
const CREATE = v2([{ op: 'create', id: NEW_ID, connection: created }]);
const catalogOf = (root) => CatalogWrite.membership(CatalogWrite.readCatalog(read(root, 'js/world-catalog.js').toString('utf8')));
const nodeIn = (root, rel) => spawnSync(process.execPath, [path.join(root, rel)], { cwd: root, encoding: 'utf8' });
const three = (root) => ['world/connections.json', 'js/world-connections.gen.js', 'js/world-catalog.js'].map((rel) => read(root, rel));
const sameThree = (root, snap) => three(root).every((b, i) => b.equals(snap[i]));

// ---- create: dry-run prints VALID 16 + catalog diff, writes nothing
const cf = makeFixture();
const snap0 = three(cf);
r = run(cf, CREATE, ['--dry-run']);
ok(r.code === 0, 'create dry-run exits 0', r.out + r.err);
ok(r.out.includes('CREATE ' + NEW_ID + ' (paired)') && r.out.includes('BEFORE null') && r.out.includes('AFTER  ' + JSON.stringify(created.a)), 'create dry-run prints CREATE + BEFORE null / AFTER', r.out);
ok(r.out.includes('VALID 16 record(s) against real maps'), 'create dry-run VALID 16', r.out);
ok(r.out.includes('CATALOG js/world-catalog.js create ' + NEW_ID + ' -> town + hospital'), 'dry-run names the catalog locations', r.out);
ok(r.out.includes("-         connections: ['town-hospital']") && r.out.includes("+         connections: ['town-hospital', '" + NEW_ID + "']") && r.out.includes("'arrival-town', '" + NEW_ID + "']"), 'dry-run prints the catalog diff for both locations', r.out);
ok(r.out.includes('DRY-RUN 2 endpoint change(s)') && sameThree(cf, snap0), 'create dry-run writes nothing');

// ---- create: apply writes registry + gen + catalog, catalog check green inside the tool and after
r = run(cf, CREATE);
ok(r.code === 0 && r.out.includes('WROTE world/connections.json') && r.out.includes('WROTE js/world-catalog.js') && r.out.includes('CHECK WORLD-ENGINE-V0.1-CATALOG-PASS'), 'create apply writes and passes the catalog check', r.out + r.err);
const reg2 = JSON.parse(read(cf, 'world/connections.json').toString('utf8'));
ok(reg2.connections.length === 16 && Edit.canonical(reg2.connections[15]) === Edit.canonical(created), 'created record appended last');
ok(JSON.stringify(reg2.connections.slice(0, 15)) === JSON.stringify(base.connections), 'existing records untouched, order kept');
ok(read(cf, 'js/world-connections.gen.js').toString('utf8').includes('"id": "' + NEW_ID + '"'), 'gen binding regenerated with the new record');
const cat2 = catalogOf(cf);
ok(cat2.town.includes(NEW_ID) && cat2.hospital.includes(NEW_ID) && Object.keys(cat2).filter((k) => cat2[k].includes(NEW_ID)).length === 2, 'catalog lists the id in exactly town + hospital');
ok(nodeIn(cf, 'test/world-engine-v0.1-catalog.js').status === 0, 'catalog test green on the fixture after create');
const inv = nodeIn(cf, 'test/legacy-door-inventory.js');
ok(inv.status === 0 && /booted-doors=61 unowned=0/.test(inv.stdout), 'legacy-door-inventory green, 2 more booted doors, all owned', inv.stdout + inv.stderr);
ok(nodeIn(cf, 'test/test-world-registry.js').status !== 0, 'the real-repo registry pin (15 ids) notices the fixture change');

// ---- delete: apply removes the record and the catalog ids; all three files return to the original bytes
const DELETE = v2([{ op: 'delete', id: NEW_ID }]);
r = run(cf, DELETE, ['--dry-run']);
ok(r.code === 0 && r.out.includes('DELETE ' + NEW_ID) && r.out.includes('VALID 15 record(s)') && r.out.includes("+         connections: ['town-hospital']"), 'delete dry-run prints VALID 15 + catalog diff', r.out + r.err);
r = run(cf, DELETE);
ok(r.code === 0 && r.out.includes('CHECK WORLD-ENGINE-V0.1-CATALOG-PASS'), 'delete apply exits 0 and passes the catalog check', r.out + r.err);
ok(sameThree(cf, snap0), 'create then delete leaves registry, gen and catalog byte-identical to the original');

// ---- one-way create
r = run(makeFixture(), v2([{ op: 'create', id: OW_ID, connection: oneWay }]), ['--dry-run']);
ok(r.code === 0 && r.out.includes('CREATE ' + OW_ID + ' (one-way)') && r.out.includes('VALID 16 record(s)'), 'one-way create validates', r.out + r.err);
const owBad = JSON.parse(JSON.stringify(oneWay)); owBad.a.spawn = { tx: 34, ty: 10, dir: 'down' };
r = run(makeFixture(), v2([{ op: 'create', id: OW_ID, connection: owBad }]), ['--dry-run']);
ok(r.code === 2 && /endpoint a of one-way connection .* has no spawn/.test(r.err), 'one-way create with a.spawn refused', r.err);

// ---- rollback: injected failure in the catalog check, then in the generator
for (const [label, rel, body] of [['catalog check', 'test/world-engine-v0.1-catalog.js', "console.error('injected catalog failure'); process.exit(3);\n"],
  ['generator', 'test/gen-world-data.js', "console.error('injected gen failure'); process.exit(4);\n"]]) {
  const rf = makeFixture();
  const snap = three(rf);
  fs.writeFileSync(path.join(rf, rel), body);
  const res = run(rf, CREATE);
  ok(res.code === 1, 'injected ' + label + ' failure exits 1', res.out + res.err);
  ok(res.err.includes('injected') && res.err.includes('ROLLED BACK world/connections.json, js/world-connections.gen.js, js/world-catalog.js (byte-identical to the pre-run copy)'), 'injected ' + label + ' failure reports rollback', res.err);
  ok(sameThree(rf, snap), 'injected ' + label + ' failure restores all three files');
}

// ---- refuse delete of a referenced id (every registry record is referenced by tests)
{
  const f = makeFixture(); const snap = three(f);
  const res = run(f, v2([{ op: 'delete', id: 'town-roadhouse' }]));
  ok(res.code === 1 && /REFUSED delete town-roadhouse: referenced by \d+ file\(s\)/.test(res.err) && res.err.includes('test/world-builder-browser.js'), 'delete of a referenced id refused, files listed', res.err);
  ok(!/\n    js\/world-catalog\.js|\n    js\/world-connections\.gen\.js/.test(res.err), 'catalog and generated binding are not counted as references');
  ok(sameThree(f, snap), 'refused delete writes nothing');
  const legacy = run(makeFixture(), { version: 1, operations: [{ op: 'remove', id: 'town-roadhouse' }] });
  ok(legacy.code === 1 && /REFUSED delete town-roadhouse/.test(legacy.err), 'version 1 remove goes through the same delete guards', legacy.err);
}

// ---- refuse duplicate id: registry, catalog, same changeset
{
  const dupReg = JSON.parse(JSON.stringify(created)); dupReg.id = 'town-hospital';
  const res = run(makeFixture(), v2([{ op: 'create', id: 'town-hospital', connection: dupReg }]));
  ok(res.code === 2 && res.err.includes('creates connection id "town-hospital", which already exists in the registry'), 'create of a registry id refused', res.err);
  const f = makeFixture();
  fs.writeFileSync(path.join(f, 'js', 'world-catalog.js'), CatalogWrite.addId(read(f, 'js/world-catalog.js').toString('utf8'), 'hospital', NEW_ID));
  const snap = three(f);
  const res2 = run(f, CREATE);
  ok(res2.code === 1 && res2.err.includes('CATALOG [catalog-write] connection id "' + NEW_ID + '" is already listed in js/world-catalog.js (hospital)'), 'create of an id already in the catalog refused', res2.err);
  ok(sameThree(f, snap), 'catalog duplicate writes nothing');
  const res3 = run(makeFixture(), v2([{ op: 'create', id: NEW_ID, connection: created }, { op: 'create', id: NEW_ID, connection: created }]));
  ok(res3.code === 2 && res3.err.includes('second operation on connection id "' + NEW_ID + '"'), 'two creates of one id refused', res3.err);
  const bad = JSON.parse(JSON.stringify(created)); bad.id = 'Town_Door';
  ok(/kebab-case/.test(run(makeFixture(), v2([{ op: 'create', id: 'Town_Door', connection: bad }])).err), 'non-kebab id refused');
}

// ---- trigger tile already claimed, scene without catalog location
{
  const clash = JSON.parse(JSON.stringify(created)); clash.b.triggers = [[7, 11]];
  const res = run(makeFixture(), v2([{ op: 'create', id: NEW_ID, connection: clash }]));
  ok(res.code === 1 && res.err.includes('INVALID hospital 7,11 is claimed by both town-hospital and ' + NEW_ID), 'trigger tile claimed by an existing record refused', res.err);
  const f = makeFixture();
  fs.writeFileSync(path.join(f, 'js', 'world-catalog.js'), read(f, 'js/world-catalog.js').toString('utf8').replace("{ id: 'ward', sceneId: 'hospital' }", "{ id: 'ward', sceneId: 'hospital_ward' }"));
  const res2 = run(f, CREATE, ['--dry-run']);
  ok(res2.code === 1 && res2.err.includes('scene "hospital" has no catalog location') && res2.err.includes('Locations: double-r (double_r_exterior_prototype, diner); town (town)') && res2.err.includes('hospital (hospital_ward)'), 'scene with no catalog location fails with the location list', res2.err);
}

// ================= M7: door gating fields + PAIRED <-> ONE-WAY through the ordinary upsert =================
{
  const f = makeFixture();
  const snap = three(f);
  const baseStore = Edit.createStore(base.connections);
  // gating: town-hospital endpoint a gets needsClues 2 next to its existing needsFlag/blockedMsg
  const gated = Edit.setDoorField(baseStore.draft, 'town-hospital', 'a', 'needsClues', 2);
  const GATE = JSON.parse(Edit.serialize(Edit.buildChangeset(baseStore, gated)));
  let res = run(f, GATE, ['--dry-run']);
  ok(res.code === 0 && res.out.includes('TARGET world/connections.json :: town-hospital') && res.out.includes('"needsClues":2') && !res.out.includes('BEFORE {"scene":"hospital"'), 'gating dry-run prints only endpoint a with needsClues', res.out + res.err);
  res = run(f, GATE);
  ok(res.code === 0 && JSON.parse(read(f, 'world/connections.json').toString('utf8')).connections.find((c) => c.id === 'town-hospital').a.door.needsClues === 2, 'gating apply writes needsClues', res.out + res.err);
  ok(read(f, 'js/world-connections.gen.js').toString('utf8').includes('"needsClues": 2'), 'gating lands in the generated binding');
  const clearStore = Edit.createStore(JSON.parse(read(f, 'world/connections.json').toString('utf8')).connections);
  const cleared = Edit.setDoorField(clearStore.draft, 'town-hospital', 'a', 'needsClues', '');
  res = run(f, JSON.parse(Edit.serialize(Edit.buildChangeset(clearStore, cleared))));
  ok(res.code === 0 && sameThree(f, snap), 'clearing the field returns all three files to the original bytes', res.out + res.err);
  const zero = JSON.parse(JSON.stringify(GATE)); zero.operations[0].connection.a.door.needsClues = 0;
  ok(/INVALID town-hospital: a\.door\.needsClues must be a positive integer/.test(refused('needsClues 0', zero, 1).err), 'needsClues 0 refused by the runtime validator verbatim');

  // PAIRED -> ONE-WAY: great-northern-room-315-hall keeps a (room_315) as the source
  const ow = Edit.toOneWay(baseStore.draft, 'great-northern-room-315-hall');
  const OW = JSON.parse(Edit.serialize(Edit.buildChangeset(baseStore, ow)));
  ok(OW.operations.length === 1 && OW.operations[0].op === 'upsert' && OW.operations[0].endpoints.join() === 'a,b', 'to one-way exports one upsert of a,b');
  res = run(f, OW);
  const owRec = JSON.parse(read(f, 'world/connections.json').toString('utf8')).connections.find((c) => c.id === 'great-northern-room-315-hall');
  ok(res.code === 0 && owRec.one_way === true && !owRec.a.spawn && owRec.b.triggers.length === 0 && res.out.includes('CHECK WORLD-ENGINE-V0.1-CATALOG-PASS'), 'to one-way applies and the catalog check stays green', res.out + res.err);
  ok(catalogOf(f)['great-northern'].includes('great-northern-room-315-hall') && read(f, 'js/world-catalog.js').equals(snap[2]), 'conversion leaves the catalog untouched');
  const inv7 = nodeIn(f, 'test/legacy-door-inventory.js');
  ok(inv7.status === 0 && /unowned=0/.test(inv7.stdout), 'legacy-door-inventory green after to one-way', inv7.stdout + inv7.stderr);

  // ONE-WAY -> PAIRED back with the original spawn and trigger: bytes return to the original
  const owStore = Edit.createStore(JSON.parse(read(f, 'world/connections.json').toString('utf8')).connections);
  const orig = base.connections.find((c) => c.id === 'great-northern-room-315-hall');
  assert.throws(() => Edit.toPaired(owStore.draft, 'great-northern-room-315-hall', { aSpawn: orig.a.spawn }), /place a b trigger first/); pass++;
  const pd = Edit.toPaired(owStore.draft, 'great-northern-room-315-hall', { aSpawn: orig.a.spawn, bTrigger: orig.b.triggers[0] });
  res = run(f, JSON.parse(Edit.serialize(Edit.buildChangeset(owStore, pd))));
  ok(res.code === 0 && sameThree(f, snap), 'to paired with the original placements restores all three files byte-identical', res.out + res.err);

  // a hand-edited paired conversion missing b's trigger is refused before writing
  const half = JSON.parse(JSON.stringify(OW)); delete half.operations[0].connection.one_way;
  ok(/INVALID great-northern-room-315-hall: (a\.spawn must contain integer tx and ty|b\.triggers must not be empty)/.test(refused('paired without spawn/trigger', half, 1).err), 'paired record without a.spawn / b trigger refused');
  // a one-way record that still carries a b door is refused
  const bdoor = JSON.parse(JSON.stringify(OW)); bdoor.operations[0].connection.b.door = { needsFlag: 'x' };
  ok(/b\.door is not allowed without triggers/.test(refused('one-way b door', bdoor, 1).err), 'one-way arrival with door fields refused');
}

ok(fs.readFileSync(path.join(REPO, 'world', 'connections.json')).equals(repoRegistryBefore), 'repo world/connections.json untouched');
ok(fs.readFileSync(path.join(REPO, 'js', 'world-connections.gen.js')).equals(repoGenBefore), 'repo js/world-connections.gen.js untouched');

ok(fs.readFileSync(path.join(REPO, 'js', 'world-catalog.js')).equals(repoCatalogBefore), 'repo js/world-catalog.js untouched');

console.log(`WORLD-APPLY-PASS ${pass}`);
