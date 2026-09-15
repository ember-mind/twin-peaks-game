#!/usr/bin/env node
'use strict';

/* test/world-apply-objects.js — tools/world-apply.js with scene objects changesets (M8), on TEMP COPIES only.
 *
 * Fixture root: a copy of js/ test/ world/ narrative/ index.html (as test/world-apply.js). Covers: dry-run of the welcome
 * sign move (one x line, nothing written), apply + regenerate + registry-only equality inside the tool, NO-OP rerun,
 * moving back restores bytes; resizing the tracks landmark; create + delete of an object and of an interact key; the
 * mission reference guard on delete; strict refusals (exit 2) and validation failures (exit 1); rollback on an injected
 * generator or equality failure; a bundle with a connections part, applied and rolled back as one write.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const SO = require(path.join(REPO, 'js', 'editor', 'core', 'scene-objects.js'));
const CLI = path.join(REPO, 'tools', 'world-apply.js');
let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + detail : '')); pass++; }

const WATCHED = ['world/scene-objects.json', 'js/scene-objects.gen.js', 'world/connections.json', 'js/world-connections.gen.js', 'js/world-catalog.js'];
const repoBefore = WATCHED.map((rel) => fs.readFileSync(path.join(REPO, rel)));

const FIXTURES = [];
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-world-apply-objects-'));
  for (const d of ['js', 'test', 'world', 'narrative']) fs.cpSync(path.join(REPO, d), path.join(root, d), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'index.html'), path.join(root, 'index.html'));
  FIXTURES.push(root);
  return root;
}
process.on('exit', () => FIXTURES.forEach((r) => fs.rmSync(r, { recursive: true, force: true })));
function run(root, csObj, extra) {
  const file = path.join(root, 'changeset-' + Math.random().toString(36).slice(2) + '.json');
  fs.writeFileSync(file, JSON.stringify(csObj, null, 2));
  const r = spawnSync(process.execPath, [CLI, file, '--root=' + root].concat(extra || []), { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const snap = (root) => WATCHED.map((rel) => fs.readFileSync(path.join(root, rel)));
const same = (a, b) => a.length === b.length && a.every((buf, i) => buf.equals(b[i]));
const readJson = (root) => JSON.parse(fs.readFileSync(path.join(root, 'world', 'scene-objects.json'), 'utf8'));

const REG = JSON.parse(repoBefore[0].toString('utf8'));
const store = SO.createObjectStore(REG);
const cs = (draft) => JSON.parse(JSON.stringify(SO.buildObjectsChangeset(store, draft)));
const SIGN = cs(SO.moveObject(store.draft, 'town', 'welcome-sign', 31, 30));
const SIGN_BACK = { format: SO.FORMAT, version: 1, target: SO.TARGET, operations: [{ op: 'upsert', scene: 'town', sourceId: 'welcome-sign', object: REG.scenes.town.objects[3] }] };

// ---- dry-run: one x line, nothing written
{
  const f = makeFixture(), s0 = snap(f);
  const r = run(f, SIGN, ['--dry-run']);
  ok(r.code === 0, 'dry-run exits 0', r.err);
  ok(r.out.includes('TARGET world/scene-objects.json :: town object welcome-sign') && r.out.includes('"x":30') && r.out.includes('AFTER  {"sourceId":"welcome-sign","type":"landmark","kind":"welcomesign","x":31,"y":30,"dialogue":"sign_town"}'), 'TARGET / BEFORE / AFTER printed', r.out);
  const diff = r.out.split('DIFF world/scene-objects.json\n')[1].split('\nVALID')[0].trim().split('\n').map((l) => l.trim());
  ok(JSON.stringify(diff) === JSON.stringify(['@@ line 57', '-           "x": 30,', '+           "x": 31,'.replace(/^\+\s+/, '+           ')].map((l) => l.trim())), 'diff is the one x line', diff.join('|'));
  ok(r.out.includes('VALID 1 scene object change(s)') && r.out.includes('DRY-RUN 1 scene object change(s); nothing written'), 'VALID + DRY-RUN lines', r.out);
  ok(same(snap(f), s0), 'dry-run writes nothing');
}

// ---- apply, NO-OP rerun, move back restores bytes
{
  const f = makeFixture(), s0 = snap(f);
  let r = run(f, SIGN);
  ok(r.code === 0 && r.out.includes('WROTE world/scene-objects.json (1 change(s))'), 'apply exits 0 and writes', r.out + r.err);
  ok(r.out.includes('[gen-world-data] wrote js/scene-objects.gen.js') && r.out.includes('CHECK SCENE-OBJECTS-REGISTRY-PASS 20 entries on 13 maps'), 'gen + registry-only equality ran inside the tool', r.out);
  ok(readJson(f).scenes.town.objects[3].x === 31 && fs.readFileSync(path.join(f, 'js', 'scene-objects.gen.js'), 'utf8').includes('"x": 31'), 'registry and binding carry the move');
  const s1 = snap(f);
  ok(s1[2].equals(s0[2]) && s1[3].equals(s0[3]) && s1[4].equals(s0[4]), 'connections registry, its binding and the catalog are untouched');
  const eq = spawnSync(process.execPath, [path.join(f, 'test', 'scene-objects-equality.js')], { encoding: 'utf8' });
  ok(eq.status !== 0 && /bytes unchanged/.test(eq.stderr), 'the pre-M8 fixture comparison notices the move on the copy (why the tool runs --registry-only)', eq.stderr.slice(0, 300));
  r = run(f, SIGN);
  ok(r.code === 0 && r.out.includes('NO-OP world/scene-objects.json already matches the changeset') && same(snap(f), s1), 'second apply is a NO-OP', r.out + r.err);
  r = run(f, SIGN_BACK);
  ok(r.code === 0 && same(snap(f), s0), 'moving back restores every file byte for byte', r.out + r.err);
}

// ---- resize the tracks landmark
{
  const f = makeFixture();
  const r = run(f, cs(SO.resizeObject(store.draft, 'town', 'tracks', 2, 30)));
  const t = readJson(f).scenes.town.objects[2];
  ok(r.code === 0 && t.w === 2 && t.h === 30 && JSON.stringify(t.dialogue) === JSON.stringify(REG.scenes.town.objects[2].dialogue), 'tracks resized, cascade untouched', r.out + r.err);
}

// ---- create + delete an object, create + delete an interact key
{
  const f = makeFixture(), s0 = snap(f);
  let r = run(f, cs(SO.createObject(store, store.draft, 'woods', { sourceId: 'grove-sign', kind: 'welcomesign', x: 12, y: 16, dialogue: 'sign_grove' })));
  ok(r.code === 0 && r.out.includes('CREATE world/scene-objects.json :: woods object grove-sign') && r.out.includes('CHECK SCENE-OBJECTS-REGISTRY-PASS 21 entries'), 'create object applies and glue boots it', r.out + r.err);
  const created = readJson(f);
  const del = { format: SO.FORMAT, version: 1, target: SO.TARGET, operations: [{ op: 'delete', scene: 'woods', sourceId: 'grove-sign' }] };
  r = run(f, del);
  ok(r.code === 0 && same(snap(f), s0), 'deleting the created object restores every file', r.out + r.err);
  const ci = SO.createInteract(store, store.draft, 'traincar', { x: 6, y: 8, id: 'olio' });
  r = run(f, cs(ci.draft));
  ok(r.code === 0 && readJson(f).scenes.traincar.interact['6,8'] === 'olio' && r.out.includes('CHECK SCENE-OBJECTS-REGISTRY-PASS 21 entries'), 'create interact key applies', r.out + r.err);
  r = run(f, { format: SO.FORMAT, version: 1, target: SO.TARGET, operations: [{ op: 'delete', scene: 'traincar', interact: '6,8' }] });
  ok(r.code === 0 && same(snap(f), s0), 'deleting the created interact key restores every file', r.out + r.err);
  ok(created.scenes.woods.objects[0].type === 'landmark', 'created object took the kind\'s type');
}

// ---- mission reference guard
{
  const f = makeFixture(), s0 = snap(f);
  const r = run(f, cs(SO.deleteInteract(store.draft, 'traincar', '20,2')));
  ok(r.code === 1 && r.err.includes('REFUSED delete traincar interact 20,2: referenced by 1 mission node(s):') && r.err.includes('narrative/missions/M5.json m5_sign_oej (sign_oej)'), 'delete of sign_oej refused, node listed', r.err);
  ok(same(snap(f), s0), 'refused delete writes nothing');
  const ok2 = run(f, cs(SO.deleteObject(store.draft, 'town', 'cemetery')), ['--dry-run']);
  ok(ok2.code === 0 && ok2.out.includes('DELETE world/scene-objects.json :: town object cemetery'), 'an unreferenced object may be deleted', ok2.out + ok2.err);
}

// ---- refusals (exit 2) and validation failures (exit 1)
{
  const f = makeFixture(), s0 = snap(f);
  const refused = [
    ['a dialogue change on upsert', { op: 'upsert', scene: 'town', sourceId: 'welcome-sign', object: Object.assign({}, REG.scenes.town.objects[3], { dialogue: 'sign_grove' }) }, /REFUSED — .*changes "dialogue" of town\/welcome-sign/],
    ['an unknown scene', { op: 'delete', scene: 'sheriffs_station_exterior', sourceId: 'x' }, /REFUSED — .*unknown scene "sheriffs_station_exterior"/],
    ['a create of an existing sourceId', { op: 'create', scene: 'town', sourceId: 'tracks', object: REG.scenes.town.objects[2] }, /REFUSED — .*creates town\/tracks, which already exists/],
    ['a cascade on create', { op: 'create', scene: 'woods', sourceId: 'c', object: { sourceId: 'c', type: 'landmark', kind: 'tracks', x: 1, y: 1, dialogue: ['sign_grove'] } }, /REFUSED — .*must be one dialogue id/]
  ];
  for (const [label, op, re] of refused) {
    const r = run(f, { format: SO.FORMAT, version: 1, target: SO.TARGET, operations: [op] });
    ok(r.code === 2 && re.test(r.err), label + ' exits 2', r.err);
  }
  const invalid = [
    ['a missing dialogue', SO.createObject(store, store.draft, 'woods', { sourceId: 'ghost', kind: 'welcomesign', x: 1, y: 1, dialogue: 'no_such_dialogue' }), /INVALID woods ghost: dialogue "no_such_dialogue" does not exist/],
    ['an unknown interact id', SO.createInteract(store, store.draft, 'woods', { x: 2, y: 2, id: 'sign_grove' }).draft, /interact id "sign_grove" is not an INTERACT_DLG key/],
    ['a rect off the map', SO.resizeObject(store.draft, 'town', 'tracks', 2, 40), /town tracks: 53,1 2x40 falls outside town/],
    ['an interact key off the map', SO.moveInteract(store.draft, 'traincar', '4,6', 30, 6), /traincar interact 30,6 falls outside traincar/]
  ];
  for (const [label, draft, re] of invalid) {
    const r = run(f, cs(draft));
    ok(r.code === 1 && re.test(r.err) && r.err.includes('nothing written'), label + ' exits 1', r.err);
  }
  const collide = run(f, cs(SO.moveInteract(store.draft, 'room_315', '1,5', 2, 5)));
  ok(collide.code === 2 && /two interact keys on 2,5 after the changeset/.test(collide.err), 'interact key collision exits 2', collide.err);
  ok(same(snap(f), s0), 'no refusal wrote anything');
}

// ---- rollback on injected failures
for (const [label, rel, body] of [
  ['generator', 'test/gen-world-data.js', "console.error('injected gen failure'); process.exit(4);\n"],
  ['equality check', 'test/scene-objects-equality.js', "console.error('injected equality failure'); process.exit(5);\n"]]) {
  const f = makeFixture(), s0 = snap(f);
  fs.writeFileSync(path.join(f, rel), body);
  const r = run(f, SIGN);
  ok(r.code === 1 && r.err.includes('injected') && r.err.includes('ROLLED BACK world/scene-objects.json, js/scene-objects.gen.js, js/world-connections.gen.js (byte-identical to the pre-run copy)'), 'injected ' + label + ' failure rolls back', r.err);
  ok(same(snap(f), s0), 'injected ' + label + ' failure restores every file');
}

// ---- bundle with a connections part
{
  const conn = JSON.parse(fs.readFileSync(path.join(REPO, 'world', 'connections.json'), 'utf8')).connections.find((c) => c.id === 'sheriffs-station-front-entrance');
  const next = JSON.parse(JSON.stringify(conn)); next.a.door = Object.assign({}, next.a.door || {}, { needsFlag: 'atto3' });
  const bundle = { format: 'world-builder-bundle', version: 1, changesets: [
    { format: 'world-connections-changeset', version: 2, target: 'world/connections.json', operations: [{ op: 'upsert', id: conn.id, endpoints: ['a'], connection: next }] },
    SIGN] };
  let f = makeFixture(); let s0 = snap(f);
  let r = run(f, bundle, ['--dry-run']);
  ok(r.code === 0 && r.out.includes('VALID 15 record(s)') && r.out.includes('VALID 1 scene object change(s)') && same(snap(f), s0), 'bundle dry-run validates both parts', r.out + r.err);
  fs.writeFileSync(path.join(f, 'test', 'scene-objects-equality.js'), "console.error('injected equality failure'); process.exit(5);\n");
  r = run(f, bundle);
  ok(r.code === 1 && r.out.includes('WROTE world/connections.json') && r.err.includes('ROLLED BACK world/connections.json, js/world-connections.gen.js, js/world-catalog.js, world/scene-objects.json, js/scene-objects.gen.js'), 'a failure in the objects part rolls back the connections part too', r.out + r.err);
  ok(same(snap(f), s0), 'bundle rollback restores all five files');
  f = makeFixture(); s0 = snap(f);
  r = run(f, bundle);
  ok(r.code === 0 && r.out.includes('CHECK WORLD-ENGINE-V0.1-CATALOG-PASS') && r.out.includes('CHECK SCENE-OBJECTS-REGISTRY-PASS'), 'bundle applies both parts', r.out + r.err);
  ok(readJson(f).scenes.town.objects[3].x === 31 && JSON.parse(fs.readFileSync(path.join(f, 'world', 'connections.json'), 'utf8')).connections.find((c) => c.id === conn.id).a.door.needsFlag === 'atto3', 'both targets written');
}

ok(same(snap(REPO), repoBefore), 'the real repo registry files are byte-identical');
console.log('WORLD-APPLY-OBJECTS-PASS ' + pass);
