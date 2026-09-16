#!/usr/bin/env node
'use strict';

/* test/world-apply-cast.js — WORLD BUILDER M7: tools/world-apply.js on cast placement changesets and bundles, always on
 * a TEMP COPY (--root=); the repo's windows.json, pins, transitions, audit record and generated data are hashed and
 * must not change.
 *
 *   - move a body whose pins disagree: the run fails, prints the exact pin lines, writes nothing
 *   - rerun with --repin: windows.json + narrative-data.gen.js + exactly those pin entries + one audit line under
 *     "## Builder change record"; test/cast-continuity-validate.js passes inside the tool and after
 *   - a body bound by a V6 transition: the run fails with or without --repin, nothing written
 *   - refusals: onto another body's tile, onto a door trigger tile, onto a wall, a non-PLACED body, a foreign field
 *   - rollback: injected validator / generator failure restores every written file byte-identical
 *   - bundle: a connections changeset + a cast changeset apply together; an injected failure in the catalog check
 *     rolls back all seven files
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CLI = path.join(REPO, 'tools', 'world-apply.js');
const Edit = require(path.join(REPO, 'js', 'editor', 'core', 'edit.js'));
const Cast = require(path.join(REPO, 'js', 'editor', 'core', 'cast.js'));
let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + String(detail).slice(0, 4000) : '')); pass++; }

const WATCH = ['narrative/cast/windows.json', 'js/narrative-data.gen.js', 'test/fixtures/cast-pins-acts-1-4.json',
  'test/fixtures/cast-transitions-acts-1-4.json', 'artifacts/world-character-audit/cast-windows-acts-1-4.md',
  'world/connections.json', 'js/world-connections.gen.js', 'js/world-catalog.js'];
const hash = (root, rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
const repoBefore = WATCH.map((rel) => hash(REPO, rel));

const FIXTURES = [];
function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-world-apply-cast-'));
  for (const d of ['js', 'test', 'world', 'narrative']) fs.cpSync(path.join(REPO, d), path.join(root, d), { recursive: true });
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.cpSync(path.join(REPO, 'artifacts', 'world-character-audit'), path.join(root, 'artifacts', 'world-character-audit'), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'index.html'), path.join(root, 'index.html'));
  FIXTURES.push(root);
  return root;
}
process.on('exit', () => FIXTURES.forEach((r) => fs.rmSync(r, { recursive: true, force: true })));
function run(root, obj, extra, name) {
  const file = path.join(root, name || ('changeset-' + Math.random().toString(36).slice(2) + '.json'));
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
  const r = spawnSync(process.execPath, [CLI, file, '--root=' + root].concat(extra || []), { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr, all: r.stdout + r.stderr };
}
const read = (root, rel) => fs.readFileSync(path.join(root, rel));
const snapshot = (root) => WATCH.map((rel) => read(root, rel));
const same = (root, snap, rels) => WATCH.every((rel, i) => (rels && rels.indexOf(rel) === -1) || read(root, rel).equals(snap[i]));
const nodeIn = (root, rel) => spawnSync(process.execPath, [path.join(root, rel)], { cwd: root, encoding: 'utf8' });

const REAL = JSON.parse(fs.readFileSync(path.join(REPO, 'narrative', 'cast', 'windows.json'), 'utf8'));
const PINS = JSON.parse(fs.readFileSync(path.join(REPO, 'test', 'fixtures', 'cast-pins-acts-1-4.json'), 'utf8'));
const store = Cast.createCastStore(REAL);
const castCs = (moves) => JSON.parse(JSON.stringify(Cast.buildCastChangeset(store, moves.reduce((d, m) => Cast.placeBody(store, d, m), store.draft))));

// Ben Horne's baseline (hotel_gn 12,7) is pinned on every story moment and bound by no transition.
const BEN = castCs([{ window: 'baseline', character: 'benhorne', x: 13 }]);
const benPins = PINS.pins.filter((p) => p.expect.benhorne === 'hotel_gn@12,7').map((p) => p.id);
ok(benPins.length === PINS.pins.length && BEN.operations.length === 1, 'fixture premise: benhorne pinned at hotel_gn@12,7 on every moment', benPins.length);

// ---- pins disagree: fail, exact pin lines, nothing written
const fx = makeFixture();
const snap0 = snapshot(fx);
let r = run(fx, BEN, [], 'ben-move.json');
ok(r.code === 1, 'pin disagreement exits 1', r.all);
const pinLines = r.err.split('\n').filter((l) => /^PIN test\/fixtures\/cast-pins-acts-1-4\.json:\d+ {2}"benhorne": "hotel_gn@12,7", {2}-> {2}"hotel_gn@13,7" {2}\(/.test(l));
ok(pinLines.length === benPins.length, 'one PIN line per disagreeing entry with file:line, old text and new value', r.err);
const fixtureLines = read(fx, 'test/fixtures/cast-pins-acts-1-4.json').toString('utf8').split('\n');
ok(pinLines.every((l) => fixtureLines[Number(/:(\d+) /.exec(l)[1]) - 1].trim() === '"benhorne": "hotel_gn@12,7",'), 'every printed line number points at that pin entry');
ok(r.err.includes('PINS ' + benPins.length + ' V5 pin entries disagree with the new placement; rerun with --repin'), 'names --repin', r.err);
ok(r.out.includes('DIFF narrative/cast/windows.json') && r.out.includes('-         "x": 12,') && r.out.includes('+         "x": 13,'), 'prints the windows.json diff', r.out);
ok(same(fx, snap0), 'pin disagreement writes nothing');

// ---- dry-run --repin previews repins + audit line, writes nothing
r = run(fx, BEN, ['--dry-run', '--repin'], 'ben-move.json');
ok(r.code === 0 && (r.out.match(/^REPIN /gm) || []).length === benPins.length && /^AUDIT artifacts\/world-character-audit\/cast-windows-acts-1-4\.md - \d{4}-\d{2}-\d{2} · window baseline \(PERSISTENT\) · benhorne · hotel_gn@12,7 down → hotel_gn@13,7 down · pins ACT1_TOWN, .* · changeset ben-move\.json$/m.test(r.out) && r.out.includes('DRY-RUN 1 cast placement change(s), ' + benPins.length + ' repin(s); nothing written'), 'dry-run --repin previews', r.all);
ok(same(fx, snap0), 'dry-run --repin writes nothing');

// ---- --repin: applies, validator green, exactly those entries, audit line
r = run(fx, BEN, ['--repin'], 'ben-move.json');
ok(r.code === 0 && r.out.includes('WROTE narrative/cast/windows.json (1 placement change(s))') && r.out.includes('WROTE test/fixtures/cast-pins-acts-1-4.json (' + benPins.length + ' repinned entries)') &&
  r.out.includes('WROTE artifacts/world-character-audit/cast-windows-acts-1-4.md (1 change record line(s))') && /CHECK cast-continuity-validate: V1 exactly-one PASS .*V5 world-window-pins PASS .*V6 causal-transitions PASS/.test(r.out), '--repin applies and the validator passes inside the tool', r.all);
const castAfter = read(fx, 'narrative/cast/windows.json').toString('utf8');
const castDiff = castAfter.split('\n').filter((l, i) => l !== snap0[0].toString('utf8').split('\n')[i]);
ok(castDiff.length === 1 && castDiff[0].trim() === '"x": 13,', 'windows.json: exactly one line changed', castDiff);
const pinsAfter = read(fx, 'test/fixtures/cast-pins-acts-1-4.json').toString('utf8').split('\n');
const pinsBefore = snap0[2].toString('utf8').split('\n');
const changedPinLines = pinsAfter.filter((l, i) => l !== pinsBefore[i]);
ok(pinsAfter.length === pinsBefore.length && changedPinLines.length === benPins.length && changedPinLines.every((l) => l.trim() === '"benhorne": "hotel_gn@13,7",'), 'pins: exactly the ' + benPins.length + ' benhorne entries changed', changedPinLines.slice(0, 3));
ok(read(fx, 'js/narrative-data.gen.js').toString('utf8').includes('"x": 13') && !read(fx, 'js/narrative-data.gen.js').equals(snap0[1]), 'narrative-data.gen.js regenerated');
ok(read(fx, 'test/fixtures/cast-transitions-acts-1-4.json').equals(snap0[3]), 'transitions fixture untouched');
const audit = read(fx, 'artifacts/world-character-audit/cast-windows-acts-1-4.md').toString('utf8');
const auditAdded = audit.slice(snap0[4].toString('utf8').replace(/\n*$/, '\n').length);
ok(audit.startsWith(snap0[4].toString('utf8').replace(/\n*$/, '\n')) && /\n## Builder change record\n\n.*\n\n- \d{4}-\d{2}-\d{2} · window baseline \(PERSISTENT\) · benhorne · hotel_gn@12,7 down → hotel_gn@13,7 down · pins ACT1_TOWN, [A-Z0-9_, ]+ · changeset ben-move\.json\n$/.test(auditAdded), 'audit: heading + one change-record line appended at the end', auditAdded);
const v = nodeIn(fx, 'test/cast-continuity-validate.js');
ok(v.status === 0, 'node test/cast-continuity-validate.js green on the copy after --repin', v.stdout.split('\n').slice(-2).join('\n'));
ok(read(fx, 'world/connections.json').equals(snap0[5]) && read(fx, 'js/world-catalog.js').equals(snap0[7]), 'connections files untouched by a cast-only changeset');

// ---- second apply: NO-OP; a second move appends under the same heading
r = run(fx, BEN, ['--repin']);
ok(r.code === 0 && r.out.includes('NO-OP narrative/cast/windows.json already matches the changeset'), 'second apply is a NO-OP', r.all);
const storeAfter = Cast.createCastStore(JSON.parse(castAfter));
const BACK = JSON.parse(JSON.stringify(Cast.buildCastChangeset(storeAfter, Cast.placeBody(storeAfter, storeAfter.draft, { window: 'baseline', character: 'benhorne', x: 12 }))));
r = run(fx, BACK, ['--repin'], 'ben-back.json');
const audit2 = read(fx, 'artifacts/world-character-audit/cast-windows-acts-1-4.md').toString('utf8');
ok(r.code === 0 && audit2.split('\n').filter((l) => l === '## Builder change record').length === 1 && /· hotel_gn@13,7 down → hotel_gn@12,7 down · pins .* · changeset ben-back\.json\n$/.test(audit2), 'moving back appends a second line under the one heading', r.all);
ok(['narrative/cast/windows.json', 'js/narrative-data.gen.js', 'test/fixtures/cast-pins-acts-1-4.json'].every((rel) => read(fx, rel).equals(snap0[WATCH.indexOf(rel)])), 'moving back restores windows.json, gen and pins byte-identical');

// ---- V6: a body bound by a transition fails with or without --repin
{
  const f = makeFixture(); const snap = snapshot(f);
  const TRUMAN = castCs([{ window: 'ACT3_TRUMAN_REPORT', character: 'truman', x: 10 }]);
  for (const flags of [[], ['--repin']]) {
    const res = run(f, TRUMAN, flags);
    ok(res.code === 1 && res.err.includes('TRANSITION test/fixtures/cast-transitions-acts-1-4.json C3.1 character=truman after (ACT3_TRAINCAR_REPORT) expected=traincar@9,8 got=traincar@10,8 right [ACT3_TRUMAN_REPORT] — transitions are never repinned'), 'transition disagreement fails ' + (flags.join(' ') || 'without flags'), res.err);
  }
  ok(same(f, snap), 'transition failure writes nothing');
}

// ---- refusals (nothing written)
{
  const f = makeFixture(); const snap = snapshot(f);
  const refuse = (label, cs, re, code) => {
    const res = run(f, cs, ['--repin']);
    ok(res.code === (code || 1) && re.test(res.err), label, res.all);
  };
  refuse('onto another body (Audrey, hotel_gn 15,9)', castCs([{ window: 'baseline', character: 'benhorne', x: 15, y: 9 }]),
    /INVALID benhorne \(baseline\) on hotel_gn 15,9 is occupied by audrey \[BASELINE\] at story moment ACT1_TOWN/);
  refuse('onto a door trigger tile (sheriff 7,11)', castCs([{ window: 'baseline', character: 'lucy', x: 7, y: 11 }]),
    /INVALID baseline \/ lucy: sheriff 7,11 is a door trigger tile \(trigger of sheriffs-station-front-entrance\)/);
  refuse('onto a wall (sheriff 0,0)', castCs([{ window: 'baseline', character: 'lucy', x: 0, y: 0 }]), /INVALID baseline \/ lucy: sheriff 0,0 is not walkable/);
  refuse('an OFFSCREEN body', { format: 'cast-windows-changeset', version: 1, target: 'narrative/cast/windows.json', operations: [{ op: 'place', window: 'ACT3_TRUMAN_BOAT', character: 'truman', map_id: 'town', x: 1, y: 1, dir: 'up' }] },
    /REFUSED — \[cast\] truman in ACT3_TRUMAN_BOAT is OFFSCREEN; only PLACED bodies move/, 2);
  const whenOp = castCs([{ window: 'baseline', character: 'lucy', x: 3 }]); whenOp.operations[0].when = { flag: 'x' };
  refuse('a `when` field', whenOp, /REFUSED — \[cast\] operations\[0\] carries unknown field "when"/, 2);
  refuse('an unknown map', { format: 'cast-windows-changeset', version: 1, target: 'narrative/cast/windows.json', operations: [{ op: 'place', window: 'baseline', character: 'lucy', map_id: 'atlantis', x: 1, y: 1, dir: 'up' }] },
    /INVALID baseline \/ lucy: map "atlantis" does not exist/);
  const foreign = castCs([{ window: 'baseline', character: 'lucy', x: 3 }]); foreign.target = 'narrative/missions/M8.json';
  refuse('a foreign cast target', foreign, /REFUSED — .*only world\/connections\.json and narrative\/cast\/windows\.json are writable|REFUSED — .*cast changeset targeting/, 2);
  ok(same(f, snap), 'refusals write nothing');
}

// ---- rollback: injected failure in the validator, then in the generator
for (const [label, rel, body] of [['validator', 'test/cast-continuity-validate.js', "console.log('V5 world-window-pins: FAIL (injected)'); process.exit(5);\n"],
  ['narrative generator', 'test/gen-narrative-data.js', "require('fs').writeFileSync(require('path').join(__dirname, '..', 'js', 'narrative-data.gen.js'), 'garbage'); console.error('injected gen Error'); process.exit(6);\n"]]) {
  const f = makeFixture(); const snap = snapshot(f);
  fs.writeFileSync(path.join(f, rel), body);
  const res = run(f, BEN, ['--repin']);
  ok(res.code === 1 && res.err.includes('injected'), 'injected ' + label + ' failure exits 1', res.all);
  const files = 'narrative/cast/windows.json, js/narrative-data.gen.js, test/fixtures/cast-pins-acts-1-4.json, artifacts/world-character-audit/cast-windows-acts-1-4.md';
  ok(res.err.includes('ROLLED BACK ' + files + ' (byte-identical to the pre-run copy)'), 'injected ' + label + ' failure reports rollback of every file', res.err);
  ok(same(f, snap), 'injected ' + label + ' failure restores every file byte-identical');
}

// ---- bundle: connections + cast together, then an injected catalog failure rolls back all seven files
{
  const REG = JSON.parse(fs.readFileSync(path.join(REPO, 'world', 'connections.json'), 'utf8'));
  const cstore = Edit.createStore(REG.connections);
  const conn = JSON.parse(Edit.serialize(Edit.buildChangeset(cstore, Edit.setDoorField(cstore.draft, 'town-hospital', 'a', 'needsClues', 2))));
  const LUCY = castCs([{ window: 'baseline', character: 'lucy', x: 3, dir: 'right' }]);
  const bundle = JSON.parse(JSON.stringify(Cast.buildBundle([conn, LUCY])));
  ok(bundle.format === 'world-builder-bundle' && bundle.changesets.length === 2, 'buildBundle of both targets');

  const f = makeFixture(); const snap = snapshot(f);
  let res = run(f, bundle, ['--dry-run', '--repin']);
  ok(res.code === 0 && res.out.includes('TARGET world/connections.json :: town-hospital') && res.out.includes('TARGET narrative/cast/windows.json :: baseline / lucy') &&
    res.out.includes('DRY-RUN 1 endpoint change(s); nothing written') && res.out.includes('DRY-RUN 1 cast placement change(s), ' + benPins.length + ' repin(s); nothing written'), 'bundle dry-run reports both parts', res.all);
  ok(same(f, snap), 'bundle dry-run writes nothing');

  const g = makeFixture(); const gsnap = snapshot(g);
  fs.writeFileSync(path.join(g, 'test', 'world-engine-v0.1-catalog.js'), "console.error('injected catalog Error'); process.exit(3);\n");
  res = run(g, bundle, ['--repin']);
  ok(res.code === 1 && res.err.includes('ROLLED BACK world/connections.json, js/world-connections.gen.js, js/world-catalog.js, narrative/cast/windows.json, js/narrative-data.gen.js, test/fixtures/cast-pins-acts-1-4.json, artifacts/world-character-audit/cast-windows-acts-1-4.md (byte-identical to the pre-run copy)'), 'bundle failure rolls back all seven files', res.err);
  ok(same(g, gsnap), 'bundle failure restores every file byte-identical');

  const h = makeFixture(); const hsnap = snapshot(h);
  fs.writeFileSync(path.join(h, 'test', 'cast-continuity-validate.js'), "console.log('V6 causal-transitions: FAIL (injected)'); process.exit(1);\n");
  res = run(h, bundle, ['--repin']);
  ok(res.code === 1 && same(h, hsnap), 'bundle: a cast failure after the connections part was written still restores the connections files', res.all);

  res = run(f, bundle, ['--repin']);
  ok(res.code === 0 && res.out.includes('CHECK WORLD-ENGINE-V0.1-CATALOG-PASS') && /CHECK cast-continuity-validate: .*V5 world-window-pins PASS/.test(res.out), 'bundle applies both parts', res.all);
  ok(JSON.parse(read(f, 'world/connections.json').toString('utf8')).connections.find((c) => c.id === 'town-hospital').a.door.needsClues === 2 &&
    JSON.parse(read(f, 'narrative/cast/windows.json').toString('utf8')).characters.lucy.baseline.x === 3, 'bundle wrote both targets');
  const dup = { format: 'world-builder-bundle', version: 1, changesets: [LUCY, LUCY] };
  res = run(makeFixture(), dup);
  ok(res.code === 2 && res.err.includes('REFUSED — changesets[1] is a second changeset for narrative/cast/windows.json'), 'bundle with two cast changesets refused', res.err);
}

ok(WATCH.every((rel, i) => hash(REPO, rel) === repoBefore[i]), 'repo windows.json, gen, pins, transitions, audit and connections files untouched');
console.log(`WORLD-APPLY-CAST-PASS ${pass}`);
