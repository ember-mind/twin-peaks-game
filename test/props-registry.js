#!/usr/bin/env node
'use strict';

/* test/props-registry.js — world/props.json, the M9 prop registry, and js/props.gen.js generated from it.
 *
 * Covers:
 *   1. the real registry is canonical 2-space JSON, passes the shape pass with zero problems, and round-trips
 *      (parse -> stringify -> the same bytes);
 *   2. js/props.gen.js is EXACTLY what tools/world-apply.js (regenProps) generates from world/props.json — a hand
 *      edit of the gen file fails here — and loading it yields the same registry, deep-frozen;
 *   3. every reject rule fires with a NAMED error, one case each (validation matrix, see reports/opus-world-builder-m9-props.md);
 *   4. every warn rule warns, one case each, and warnings alone do not make the registry invalid;
 *   5. the Roadhouse locks are hard rejects, one case each;
 *   6. the seeded Roadhouse slice: 12 definitions, 26 instances (M12 furnished the room from the prop set),
 *      every instance id prefixed "roadhouse-".
 *
 *   --registry-only  skip the seeded counts of 6. tools/world-apply.js runs this mode on the repo it writes: after
 *                    a Builder create/delete the instance count legitimately differs, while 1-5 must still hold.
 *
 * The repo files are never written: 2. regenerates into a temp copy and byte-compares.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const WA = require(path.join(ROOT, 'tools', 'world-apply.js'));
const PROPS = path.join(ROOT, 'world', 'props.json');
const GEN = path.join(ROOT, 'js', 'props.gen.js');

let pass = 0;
function ok(cond, label, detail) { assert.ok(cond, label + (detail ? ' :: ' + detail : '')); pass++; }
const clone = (v) => JSON.parse(JSON.stringify(v));

const REGISTRY_ONLY = process.argv.includes('--registry-only');

const sourceText = fs.readFileSync(PROPS, 'utf8');
const registry = JSON.parse(sourceText);

// ---- 1. canonical source, clean shape pass ---------------------------------------------------------------
ok(JSON.stringify(registry, null, 2) + '\n' === sourceText, 'world/props.json is canonical 2-space JSON');
ok(Object.keys(registry).join(',') === 'version,scenes,definitions,instances', 'top-level keys: version, scenes, definitions, instances', Object.keys(registry).join(','));
{
  const problems = [];
  WA.propsShapeProblems(ROOT, registry, problems);
  ok(problems.length === 0, 'the real registry has no shape problem', problems.join(' | '));
}
ok(WA.duplicateKeys(sourceText, 'instances').length === 0, 'no duplicate instance id in the raw text');

// ---- 6. the seeded Roadhouse slice -----------------------------------------------------------------------
if (!REGISTRY_ONLY) {
  ok(Object.keys(registry.definitions).length === 12, '12 definitions promoted from the prototype', String(Object.keys(registry.definitions).length));
  ok(Object.keys(registry.instances).length === 26, '26 native-canvas instances promoted (19 from M9 + the 7 M12 added when the props took over the furniture)', String(Object.keys(registry.instances).length));
}
ok(Object.keys(registry.instances).every((id) => id.startsWith('roadhouse-')), 'every instance id is prefixed "roadhouse-"');
ok(Object.keys(registry.instances).every((id) => registry.instances[id].sceneId === 'roadhouse'), 'every instance is in the roadhouse scene');
{
  const proto = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/prototypes/direct-reference/roadhouse-props.prototype.json'), 'utf8'));
  ok(proto.props.length === 12 && proto.props.every((p) => {
    const d = registry.definitions[p.id];
    return d && JSON.stringify(d.frame) === JSON.stringify(p.frame) &&
      JSON.stringify(d.anchor) === JSON.stringify(p.anchor) && JSON.stringify(d.footprint) === JSON.stringify(p.footprint);
  }), 'frame / anchor / footprint of every definition are the prototype values verbatim');
}

// ---- 2. the gen file is generated, never hand-edited -----------------------------------------------------
{
  const expected = WA.propsGenText(registry);
  ok(fs.readFileSync(GEN, 'utf8') === expected, 'js/props.gen.js is byte-identical to regenProps output (hand edits fail here)');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-props-gen-'));
  fs.mkdirSync(path.join(tmp, 'world')); fs.mkdirSync(path.join(tmp, 'js'));
  fs.copyFileSync(PROPS, path.join(tmp, 'world', 'props.json'));
  fs.writeFileSync(path.join(tmp, 'js', 'props.gen.js'), 'HAND EDITED\n');
  const line = WA.regenProps(tmp);
  ok(fs.readFileSync(path.join(tmp, 'js', 'props.gen.js'), 'utf8') === expected, 'regenProps overwrites a hand-edited gen file with the generated text');
  ok(/wrote js\/props\.gen\.js \(\d+ definitions, \d+ instances\)/.test(line), 'regenProps reports what it wrote', line);
  fs.rmSync(tmp, { recursive: true, force: true });

  const sandbox = { window: undefined, GAME: {} };
  sandbox.globalThis = sandbox;
  require('node:vm').runInNewContext(fs.readFileSync(GEN, 'utf8'), sandbox, { filename: 'props.gen.js' });
  const loaded = sandbox.GAME.WorldData.props;
  ok(JSON.stringify(loaded.definitions) === JSON.stringify(registry.definitions) &&
     JSON.stringify(loaded.instances) === JSON.stringify(registry.instances) &&
     JSON.stringify(loaded.scenes) === JSON.stringify(registry.scenes), 'the loaded registry round-trips world/props.json');
  ok(loaded.tilePx === 16 && Object.isFrozen(loaded) && Object.isFrozen(loaded.instances['roadhouse-chair-01']), 'GAME.WorldData.props is deep-frozen, tilePx 16');
}

// ---- 3. every reject rule fires, with a named error -------------------------------------------------------
// Each case mutates a copy of the real registry so exactly one rule can fire.
function shapeProblems(mutate) {
  const data = clone(registry);
  mutate(data);
  const problems = [];
  WA.propsShapeProblems(ROOT, data, problems);
  return problems;
}
const fires = (label, mutate, needle) => {
  const problems = shapeProblems(mutate);
  ok(problems.some((p) => p.includes(needle)), 'REJECT ' + label + ' -> "' + needle + '"', problems.join(' | ') || '(no problem reported)');
};

fires('missing definition', (d) => { d.instances['roadhouse-chair-01'].propId = 'roadhouse.nope'; }, 'missing definition "roadhouse.nope"');
fires('frame outside atlas bounds (x)', (d) => { d.definitions['roadhouse.chair.red'].frame = [250, 48, 18, 30]; }, 'falls outside atlas');
fires('frame outside atlas bounds (y)', (d) => { d.definitions['roadhouse.chair.red'].frame = [160, 80, 18, 30]; }, 'falls outside atlas');
fires('atlas file missing', (d) => { d.definitions['roadhouse.chair.red'].atlas = 'assets/props/does-not-exist.png'; }, 'does not exist');
fires('NaN tx', (d) => { d.instances['roadhouse-chair-01'].tx = Number.NaN; }, '.tx must be a finite number');
fires('non-numeric ty', (d) => { d.instances['roadhouse-chair-01'].ty = '7.25'; }, '.ty must be a finite number');
fires('tx off the scene canvas', (d) => { d.instances['roadhouse-chair-01'].tx = 40; }, 'falls outside roadhouse');
fires('ty off the scene canvas', (d) => { d.instances['roadhouse-chair-01'].ty = 12.5; }, 'falls outside roadhouse');
fires('negative tx', (d) => { d.instances['roadhouse-chair-01'].tx = -1; }, 'falls outside roadhouse');
fires('sub-pixel tx', (d) => { d.instances['roadhouse-chair-01'].tx = 5.31; }, 'must land on a whole pixel');
fires('transform not allowed by the definition', (d) => { d.instances['roadhouse-stage-01'].flipX = true; }, 'transform flipX is not allowed by roadhouse.stage.velvet');
fires('unknown transform in a definition', (d) => { d.definitions['roadhouse.chair.red'].transforms = ['rotate90']; }, '.transforms may only list flipX');
fires('instance layer not an integer', (d) => { d.instances['roadhouse-chair-01'].layer = 3.5; }, '.layer must be an integer 0..9');
fires('instance layer out of 0..9', (d) => { d.instances['roadhouse-chair-01'].layer = 10; }, '.layer must be an integer 0..9');
fires('defaultLayer out of 0..9', (d) => { d.definitions['roadhouse.chair.red'].defaultLayer = -1; }, '.defaultLayer must be an integer 0..9');
fires('unknown instance field', (d) => { d.instances['roadhouse-chair-01'].collides = true; }, 'has unknown field "collides"');
fires('unknown definition field', (d) => { d.definitions['roadhouse.chair.red'].rows = ['ffff']; }, 'has unknown field "rows"');
fires('scene with no canvas', (d) => { d.instances['roadhouse-chair-01'].sceneId = 'diner'; }, 'has no canvas in world/props.json');
fires('anchor outside its own frame', (d) => { d.definitions['roadhouse.chair.red'].anchor = [99, 28]; }, 'falls outside its own frame');
fires('footprint that is not [dx, dy] pairs', (d) => { d.definitions['roadhouse.chair.red'].footprint = [[0]]; }, '.footprint must be an array of [dx, dy] integer pairs');
fires('bad instance id', (d) => { d.instances.Roadhouse_Chair = clone(d.instances['roadhouse-chair-01']); }, 'instance id must be kebab-case');
fires('bad definition id', (d) => { d.definitions.ChairRed = clone(d.definitions['roadhouse.chair.red']); }, 'definition id must be dotted lowercase');
fires('canvas that is not whole tiles', (d) => { d.scenes.roadhouse.canvas = [256, 190]; }, '.canvas must be [w, h], positive whole tiles');
// duplicate instance id: JSON.parse keeps the last one, so the raw text is scanned
{
  const dup = sourceText.replace('"roadhouse-chair-02": {', '"roadhouse-chair-01": {');
  const keys = WA.duplicateKeys(dup, 'instances');
  ok(keys.length === 1 && keys[0] === 'roadhouse-chair-01', 'REJECT duplicate instance id -> named in the raw-text scan', keys.join(','));
}
// PNG IHDR reader itself
{
  const size = WA.pngSize(path.join(ROOT, registry.definitions['roadhouse.chair.red'].atlas));
  ok(size.width === 256 && size.height === 96, 'pngSize reads the atlas IHDR (256x96)', JSON.stringify(size));
  assert.throws(() => WA.pngSize(PROPS), /is not a PNG \(no IHDR\)/, 'pngSize refuses a non-PNG');
  pass++;
}

// ---- 4. + 5. world rules: warnings and the Roadhouse locks ------------------------------------------------
const G = WA.loadWorld(ROOT, false);
const args = { root: ROOT };
function worldRun(mutate) {
  const data = clone(registry);
  if (mutate) mutate(data);
  const problems = [], warnings = [];
  WA.propsWorldProblems(args, data, G, problems, warnings);
  return { problems, warnings };
}
{
  const base = worldRun(null);
  ok(base.problems.length === 0, 'the real registry passes every hard world rule', base.problems.join(' | '));
  /* M12 cleared the last real overlap (roadhouse-booth-01 no longer shares tile 2,6 with the Log Lady), so the
   * shipped registry warns about nothing. What has to keep working is the MECHANISM: a footprint put back on a
   * body tile still warns, and still only warns. Pinning "the shipped data has a warning" would have made the
   * fix fail the test that exists to police the fix. */
  ok(base.warnings.length === 0, 'the shipped registry has no footprint overlaps left', base.warnings.join(' | '));
  const onBody = worldRun((d) => { d.instances['roadhouse-booth-01'].ty = 6.125; });
  ok(onBody.warnings.length > 0 && onBody.warnings.every((w) => w.startsWith('WARN ')) &&
     onBody.warnings.some((w) => /loglady/.test(w)) && onBody.problems.length === 0,
    'a footprint back on a Cast Presence body tile warns without failing', onBody.warnings.join(' | '));
}
const warns = (label, mutate, needle) => {
  const r = worldRun(mutate);
  ok(r.warnings.some((w) => w.includes(needle)), 'WARN ' + label + ' -> "' + needle + '"', r.warnings.join(' | ') || '(no warning)');
  ok(!r.problems.some((p) => p.includes(needle)), 'WARN ' + label + ' is a warning, not a problem', r.problems.join(' | '));
};
// a one-tile footprint moved onto each kind of tile; the chair is the smallest mover
const putChairOn = (x, y) => (d) => { d.instances['roadhouse-chair-01'].tx = x + 0.5; d.instances['roadhouse-chair-01'].ty = y + 0.5; };
warns('footprint on a door tile', (d) => { d.definitions['roadhouse.chair.red'].footprint = [[0, 0]]; putChairOn(7, 8)(d); d.instances['roadhouse-chair-01'].propId = 'roadhouse.table.round'; d.definitions['roadhouse.table.round'].footprint = [[0, 1]]; }, 'is a door tile');
warns('footprint on a Cast Presence body tile', putChairOn(4, 8), 'is a Cast Presence body tile');
{
  // scene-objects interact tile: the woods "olio" tile (14,12), reached by giving the woods a canvas + one instance
  const r = worldRun((d) => {
    const w = G.Maps.woods;
    d.scenes.woods = { canvas: [w.width * 16, w.height * 16] };
    d.instances['roadhouse-probe-01'] = { propId: 'roadhouse.chair.red', sceneId: 'woods', tx: 14.5, ty: 12.5 };
  });
  ok(r.warnings.some((w) => w.includes('is the scene-objects interact tile "olio"')), 'WARN footprint on a scene-objects interact tile', r.warnings.join(' | '));
}
const locks = (label, mutate, needle) => {
  const r = worldRun(mutate);
  ok(r.problems.some((p) => p.includes(needle)), 'LOCK ' + label + ' -> "' + needle + '"', r.problems.join(' | ') || '(no problem)');
};
locks('south door tile claimed', (d) => { d.instances['roadhouse-chair-01'].tx = 7.5; d.instances['roadhouse-chair-01'].ty = 9.5; }, 'south door tile 7,9 is claimed by roadhouse-chair-01');
locks('pay phone tile claimed', (d) => { d.instances['roadhouse-chair-01'].tx = 8.5; d.instances['roadhouse-chair-01'].ty = 5.5; }, 'pay phone tile 8,5 is claimed by roadhouse-chair-01');
locks('stage moved south', (d) => { d.instances['roadhouse-stage-01'].ty = 6; }, 'the stage stays north');
locks('scene canvas smaller than its map', (d) => { d.scenes.roadhouse.canvas = [128, 160]; }, 'is smaller than the map');
locks('scene that is not a map', (d) => { d.scenes.nowhere = { canvas: [256, 160] }; }, 'is not a map in js/maps.js');
// map rows and Cast Presence walkability: props own no row, so the guard proves the booted rows still match
{
  const rows = G.Maps.roadhouse.rows.slice();
  G.Maps.roadhouse.rows = rows.slice(0, 9).concat(['iiiiiiiiiiiiiiii']);
  const r = worldRun(null);
  G.Maps.roadhouse.rows = rows;
  ok(r.problems.some((p) => p.includes('map rows changed (props never own collision)')), 'LOCK roadhouse map rows changed', r.problems.join(' | '));
}

console.log('PROPS-REGISTRY-PASS ' + Object.keys(registry.definitions).length + ' definitions, ' +
  Object.keys(registry.instances).length + ' instances, ' + pass + ' checks');
