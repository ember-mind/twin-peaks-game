#!/usr/bin/env node
'use strict';

/* test/props-changeset.js — the props-changeset v2 ops of tools/world-apply.js, on TEMP COPIES only.
 *
 * Covers: create / upsert / delete as a dry-run (nothing written) and applied (world/props.json rewritten,
 * js/props.gen.js regenerated, the props tests run inside the tool); NO-OP rerun; strict refusals (exit 2);
 * validation failures (exit 1, nothing written); the delete guard (an instance id referenced under js/ test/
 * narrative/); rollback to the pre-run bytes when a check fails after the first write; --repin reported as not
 * applicable; a bundle carrying a props part alongside a scene-objects part.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CLI = path.join(REPO, 'tools', 'world-apply.js');
const TARGET = 'world/props.json';
let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + detail : '')); pass++; }

const WATCHED = [TARGET, 'js/props.gen.js', 'world/scene-objects.json', 'js/scene-objects.gen.js'];
const repoBefore = WATCHED.map((rel) => fs.readFileSync(path.join(REPO, rel)));

const FIXTURES = [];
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-props-changeset-'));
  for (const d of ['engine', 'js', 'test', 'world', 'narrative', 'assets', 'tools']) fs.cpSync(path.join(REPO, d), path.join(root, d), { recursive: true });
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
const readProps = (root) => JSON.parse(fs.readFileSync(path.join(root, TARGET), 'utf8'));

const REG = JSON.parse(repoBefore[0].toString('utf8'));
const cs = (ops) => ({ format: 'props-changeset', version: 2, target: TARGET, operations: ops });
const MOVE = cs([{ op: 'upsert', id: 'roadhouse-chair-02', instance: Object.assign({}, REG.instances['roadhouse-chair-02'], { tx: 8.3125 }) }]);
const MOVE_BACK = cs([{ op: 'upsert', id: 'roadhouse-chair-02', instance: REG.instances['roadhouse-chair-02'] }]);
const NEW = { propId: 'roadhouse.candle.brass', sceneId: 'roadhouse', tx: 11.5625, ty: 6.4375 };
/* Built from parts on purpose: tools/world-apply.js refuses a delete whose instance id is named by any file under
 * js/ test/ narrative/, and the fixture is a copy of this very file. Spelling the id here would refuse every
 * delete below for the wrong reason. */
const NEW_ID = 'roadhouse-candle-' + '09';   // 03 is a real instance since M12; 09 is still free
const CREATE = cs([{ op: 'create', id: NEW_ID, instance: NEW }]);

// ---- dry-run: printed, nothing written -------------------------------------------------------------------
{
  const f = makeFixture(), s0 = snap(f);
  const r = run(f, MOVE, ['--dry-run']);
  ok(r.code === 0, 'dry-run exits 0', r.err);
  ok(r.out.includes('TARGET world/props.json :: roadhouse-chair-02') && r.out.includes('"tx":7.8125') && r.out.includes('"tx":8.3125'),
    'TARGET / BEFORE / AFTER printed', r.out);
  ok(r.out.includes('VALID 26 prop instance(s)') && r.out.includes('DRY-RUN 1 prop instance change(s); nothing written'), 'VALID + DRY-RUN lines', r.out);
  ok(r.out.includes('REPIN --repin does not apply to world/props.json'), '--repin reported as not applicable', r.out);
  ok(same(snap(f), s0), 'dry-run writes nothing');
}

// ---- upsert: apply, regenerate, NO-OP rerun, move back restores bytes --------------------------------------
{
  const f = makeFixture(), s0 = snap(f);
  let r = run(f, MOVE);
  ok(r.code === 0 && r.out.includes('WROTE world/props.json (1 change(s))') && r.out.includes('wrote js/props.gen.js (12 definitions, 26 instances)'),
    'upsert applies and regenerates the gen file', r.out + r.err);
  ok(r.out.includes('CHECK PROPS-REGISTRY-PASS') && r.out.includes('CHECK PROPS-RENDER-ORDER-PASS'), 'the props tests run inside the tool', r.out);
  ok(readProps(f).instances['roadhouse-chair-02'].tx === 8.3125, 'the new tx is on disk');
  ok(fs.readFileSync(path.join(f, 'js/props.gen.js'), 'utf8').includes('"tx": 8.3125'), 'the gen file carries the new tx');
  r = run(f, MOVE);
  ok(r.code === 0 && r.out.includes('NO-OP world/props.json already matches the changeset'), 'rerun is a NO-OP', r.out + r.err);
  r = run(f, MOVE_BACK);
  ok(r.code === 0 && same(snap(f), s0), 'moving back restores the pre-run bytes of both files', r.out + r.err);
}

// ---- create, then delete the created instance -------------------------------------------------------------
{
  const f = makeFixture(), s0 = snap(f);
  let r = run(f, CREATE);
  ok(r.code === 0 && r.out.includes('CREATE world/props.json :: ' + NEW_ID) && r.out.includes('VALID 27 prop instance(s)'), 'create applies', r.out + r.err);
  ok(readProps(f).instances[NEW_ID].propId === 'roadhouse.candle.brass', 'the created instance is on disk');
  ok(fs.readFileSync(path.join(f, 'js/props.gen.js'), 'utf8').includes(NEW_ID), 'the gen file carries the created instance');
  r = run(f, cs([{ op: 'delete', id: NEW_ID }]));
  ok(r.code === 0 && r.out.includes('DELETE world/props.json :: ' + NEW_ID), 'delete applies', r.out + r.err);
  ok(same(snap(f), s0), 'create + delete round-trips to the pre-run bytes');
}

// ---- delete refused: the instance id is referenced under js/ test/ narrative/ -------------------------------
{
  const f = makeFixture();
  ok(run(f, CREATE).code === 0, 'created the instance to delete');
  const s1 = snap(f);
  fs.writeFileSync(path.join(f, 'test', 'fake-consumer.js'), '// a harness that names ' + NEW_ID + ' by hand\n');
  const r = run(f, cs([{ op: 'delete', id: NEW_ID }]));
  ok(r.code === 1 && r.err.includes('REFUSED delete ' + NEW_ID + ': referenced by 1 file(s)') && r.err.includes('test/fake-consumer.js'),
    'delete is refused and the referencing file is listed', r.out + r.err);
  ok(same(snap(f), s1), 'a refused delete writes nothing');
  // the generated file is exempt: it always names every instance
  fs.rmSync(path.join(f, 'test', 'fake-consumer.js'));
  const r2 = run(f, cs([{ op: 'delete', id: NEW_ID }]));
  ok(r2.code === 0 && !r2.out.includes('REFUSED') && !readProps(f).instances[NEW_ID], 'js/props.gen.js does not block a delete', r2.out + r2.err);
}

// ---- strict refusals (exit 2), nothing written --------------------------------------------------------------
{
  const f = makeFixture(), s0 = snap(f);
  const refusals = [
    [cs([{ op: 'create', id: 'roadhouse-chair-02', instance: NEW }]), 'creates roadhouse-chair-02, which already exists'],
    [cs([{ op: 'upsert', id: 'roadhouse-nope', instance: NEW }]), 'upserts unknown instance roadhouse-nope'],
    [cs([{ op: 'delete', id: 'roadhouse-nope' }]), 'deletes unknown instance roadhouse-nope'],
    [cs([{ op: 'move', id: 'roadhouse-chair-02', instance: NEW }]), '.op must be create, upsert or delete'],
    [cs([MOVE.operations[0], { op: 'delete', id: 'roadhouse-chair-02' }]), 'is a second operation on roadhouse-chair-02'],
    [cs([{ op: 'upsert', id: 'roadhouse-chair-02', instance: Object.assign({}, REG.instances['roadhouse-chair-02'], { propId: 'roadhouse.table.round' }) }]), 'changes propId/sceneId of roadhouse-chair-02'],
    [cs([{ op: 'create', id: NEW_ID, instance: Object.assign({}, NEW, { collides: true }) }]), '.instance carries unknown field "collides"'],
    [cs([{ op: 'delete', id: 'roadhouse-chair-02', instance: NEW }]), 'carries unknown field "instance"'],
    [Object.assign(cs([]), { version: 1 }), 'props changeset version must be 2'],
    /* M10b: the target is checked one layer earlier now — js/editor/core/cast.js splitChangesets owns
    // world/props.json next to the other three, the way it owns world/scene-objects.json. Still exit 2. */
    [Object.assign(cs([]), { target: 'world/connections.json' }), 'is a props changeset targeting "world/connections.json"']
  ];
  refusals.forEach(function (pair) {
    const r = run(f, pair[0]);
    ok(r.code === 2 && (r.err + r.out).includes(pair[1]), 'REFUSED (exit 2): ' + pair[1], String(r.code) + ' ' + r.out + r.err);
  });
  // definitions are hand-edited this milestone: no operation reaches them
  const r = run(f, { format: 'props-changeset', version: 2, target: TARGET, operations: [{ op: 'create', id: 'roadhouse.new.prop', definition: {} }] });
  ok(r.code === 2 && (r.err + r.out).includes('carries unknown field "definition"'), 'a changeset cannot touch definitions', r.out + r.err);
  ok(same(snap(f), s0), 'no refusal wrote anything');
}

// ---- validation failures (exit 1), nothing written ----------------------------------------------------------
{
  const f = makeFixture(), s0 = snap(f);
  const bad = [
    [cs([{ op: 'create', id: NEW_ID, instance: Object.assign({}, NEW, { propId: 'roadhouse.nope' }) }]), 'missing definition "roadhouse.nope"'],
    [cs([{ op: 'create', id: NEW_ID, instance: Object.assign({}, NEW, { tx: 99 }) }]), 'falls outside roadhouse'],
    [cs([{ op: 'create', id: NEW_ID, instance: Object.assign({}, NEW, { layer: 11 }) }]), '.layer must be an integer 0..9'],
    [cs([{ op: 'create', id: NEW_ID, instance: Object.assign({}, NEW, { flipX: true }) }]), 'transform flipX is not allowed by roadhouse.candle.brass'],
    [cs([{ op: 'upsert', id: 'roadhouse-table-02', instance: Object.assign({}, REG.instances['roadhouse-table-02'], { tx: 7.125, ty: 9.125 }) }]), 'south door tile 7,9 is claimed by roadhouse-table-02'],
    [cs([{ op: 'upsert', id: 'roadhouse-stage-01', instance: Object.assign({}, REG.instances['roadhouse-stage-01'], { ty: 6 }) }]), 'the stage stays north']
  ];
  bad.forEach(function (pair) {
    const r = run(f, pair[0]);
    ok(r.code === 1 && r.err.includes(pair[1]) && r.err.includes('problem(s); nothing written'), 'INVALID (exit 1): ' + pair[1], String(r.code) + ' ' + r.out + r.err);
  });
  ok(same(snap(f), s0), 'no validation failure wrote anything');
}

// ---- rollback: a check fails after the first write ------------------------------------------------------------
{
  const f = makeFixture(), s0 = snap(f);
  fs.writeFileSync(path.join(f, 'test', 'props-render-order.js'), 'process.exit(3);\n');
  const r = run(f, MOVE);
  ok(r.code === 1 && r.err.includes('test/props-render-order.js exited 3'), 'a failing check fails the run', r.out + r.err);
  ok(r.err.includes('ROLLED BACK world/props.json, js/props.gen.js') && r.err.includes('byte-identical to the pre-run copy'), 'both files are rolled back', r.err);
  ok(same(snap(f), s0), 'the rolled-back files are the pre-run bytes');
}

// ---- bundle: a props part next to a scene-objects part, applied as one write -------------------------------
{
  const f = makeFixture(), s0 = snap(f);
  const objects = JSON.parse(repoBefore[2].toString('utf8'));
  const sign = objects.scenes.town.objects.find((o) => o.sourceId === 'welcome-sign');
  const bundle = { format: 'world-builder-bundle', version: 1, changesets: [
    { format: 'scene-objects-changeset', version: 1, target: 'world/scene-objects.json',
      operations: [{ op: 'upsert', scene: 'town', sourceId: 'welcome-sign', object: Object.assign({}, sign, { x: 31 }) }] },
    MOVE] };
  const r = run(f, bundle);
  ok(r.code === 0 && r.out.includes('WROTE world/scene-objects.json') && r.out.includes('WROTE world/props.json'), 'bundle applies both parts', r.out + r.err);
  ok(readProps(f).instances['roadhouse-chair-02'].tx === 8.3125 &&
     JSON.parse(fs.readFileSync(path.join(f, 'world/scene-objects.json'), 'utf8')).scenes.town.objects.find((o) => o.sourceId === 'welcome-sign').x === 31,
    'both targets written');
  const dup = { format: 'world-builder-bundle', version: 1, changesets: [MOVE, MOVE_BACK] };
  const r2 = run(f, dup);
  ok(r2.code === 2 && (r2.err + r2.out).includes('changesets[1] is a second changeset for world/props.json'), 'a bundle refuses two props changesets', r2.out + r2.err);
  ok(!same(snap(f), s0), 'the bundle fixture is the changed one (sanity)');
}

ok(same(WATCHED.map((rel) => fs.readFileSync(path.join(REPO, rel))), repoBefore), 'the real repo registry files are byte-identical');
console.log('PROPS-CHANGESET-PASS ' + pass + ' checks');
