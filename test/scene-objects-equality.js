#!/usr/bin/env node
'use strict';

/* test/scene-objects-equality.js — proof that world/scene-objects.json reproduces every scene object the game had
 * before M8, and that it is the only source.
 *
 * Fixture: test/fixtures/objects-before-m8.json, snapshotted at 662702e (before any M8 change) by
 * `node test/scene-objects-inventory.js --write-fixture`:
 *   source = the js/maps.js objects[] / interact blocks
 *   booted = every GAME.Maps.<id>.objects after the full production chain (glue's merge)
 *
 * Boots the real chain (index.html order) and asserts:
 *   1. js/maps.js carries no objects / interact key on any map;
 *   2. registry-only reproduction: for every js/maps.js map, GAME.Maps.<id>.objects equals what the registry alone
 *      dictates (objects[] copied, then one entry per interact key through GAME.INTERACT_DLG / GAME.INTERACT_SPARKLE);
 *      every registry scene is a js/maps.js map;
 *   3. every dialogue binding (string, cascade `then` and default) exists in GAME.Data.dialogues;
 *   4. glue refuses a second source: a map still carrying objects/interact, and a missing registry, both throw;
 *   5. js/scene-objects.gen.js is what test/gen-world-data.js generates from world/scene-objects.json (run on a
 *      temp copy, the repo is not written);
 *   6. booted objects are byte-identical to the fixture, with a sourceId allowed (last key) on registry objects[].
 *
 *   --registry-only  skip 6. tools/world-apply.js runs this mode on the repo it writes: after a Builder edit the
 *                    objects legitimately differ from the pre-M8 fixture, while 1-5 must still hold.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const JS = path.join(ROOT, 'js');
const REGISTRY_ONLY = process.argv.includes('--registry-only');

global.window = global;
global.addEventListener = function () {};
global.requestAnimationFrame = function () {};
global.performance = { now: function () { return 0; } };
function element() {
  const el = { style: {}, addEventListener() {}, appendChild() {},
    getBoundingClientRect() { return { width: 320, height: 240, top: 0, left: 0 }; } };
  el.getContext = function () {
    return new Proxy({ measureText(s) { return { width: String(s).length * 6 }; } },
      { get(t, k) { return k in t ? t[k] : function () {}; }, set() { return true; } });
  };
  return el;
}
global.document = { createElement: element, createElementNS() { return { setAttribute() {}, style: {} }; },
  body: { style: {}, appendChild() {} }, head: { appendChild() {} },
  readyState: 'loading', getElementById() { return null; }, addEventListener() {} };
global.matchMedia = function () { return { matches: false, addEventListener() {} }; };

const quiet = console.warn;
console.warn = function () {};
try {
  ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'environmental-inspect.js', 'retro-font.js', 'portraits.js',
    'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'environment-reactions.js', 'location-connections.js',
    'world-connections.gen.js',
    'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
    'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js',
    'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
    'room-315-art.js', 'room-315-scene.js', 'room-315-production.js',
    'hospital-art.js', 'hospital-scene.js', 'hospital-production.js',
    'traincar-art.js', 'traincar-scene.js', 'traincar-production.js',
    'world-connections-production.js', 'world-engine.js', 'world-catalog.js'
  ].forEach(function (f) { require(path.join(JS, f)); });
} finally { console.warn = quiet; }

const G = global.GAME;
const SRC = G.maps.maps;
const REG = G.WorldData.sceneObjects;
let checks = 0;
function ok(cond, msg) { assert.ok(cond, msg); checks++; }

// ---- 1. js/maps.js carries no scene object data
Object.keys(SRC).forEach(function (id) {
  ok(!Object.prototype.hasOwnProperty.call(SRC[id], 'objects') && !Object.prototype.hasOwnProperty.call(SRC[id], 'interact'),
    'js/maps.js ' + id + ' carries no objects / interact key');
});

// ---- 2. registry-only reproduction
assert.equal(REG.version, 1, 'registry version 1');
Object.keys(REG.scenes).forEach(function (id) { ok(!!SRC[id], 'registry scene ' + id + ' is a js/maps.js map'); });
function expectedFor(id) {
  const sc = REG.scenes[id] || { objects: [], interact: {} };
  return sc.objects.map(function (o) {
    const out = {};
    Object.keys(o).forEach(function (k) { if (k !== 'sourceId') out[k] = o[k]; });
    out.sourceId = o.sourceId;
    return out;
  }).concat(Object.keys(sc.interact).map(function (k) {
    const key = sc.interact[k], xy = k.split(',');
    return { x: +xy[0], y: +xy[1], dialogue: G.INTERACT_DLG[key] || key, type: G.INTERACT_SPARKLE[key] ? 'sparkle' : 'plain' };
  }));
}
let reproduced = 0;
Object.keys(SRC).forEach(function (id) {
  const exp = JSON.stringify(expectedFor(id)), got = JSON.stringify(G.Maps[id].objects);
  assert.equal(got, exp, id + ': booted objects are exactly what the registry dictates');
  checks++;
  reproduced += G.Maps[id].objects.length;
});

// ---- 3. dialogue bindings resolve
function dialogueIds(d) {
  if (typeof d === 'string') return [d];
  return d.map(function (step) { return typeof step === 'string' ? step : step.then; });
}
Object.keys(SRC).forEach(function (id) {
  G.Maps[id].objects.forEach(function (o) {
    dialogueIds(o.dialogue).forEach(function (did) {
      ok(!!G.Data.dialogues[did], id + ' ' + o.x + ',' + o.y + ': dialogue "' + did + '" exists in GAME.Data.dialogues');
    });
  });
});

// ---- 4. glue refuses a second source and a missing registry
const glueSource = fs.readFileSync(path.join(JS, 'glue.js'), 'utf8');
function runGlue(game) {
  const sandbox = { GAME: game };
  sandbox.window = sandbox;
  vm.runInNewContext(glueSource, sandbox, { filename: 'glue.js' });
}
function fakeGame(mapFields, withRegistry) {
  const map = Object.assign({ id: 'probe', rows: ['..'], width: 2, height: 1, doors: {} }, mapFields);
  const game = { sprites: { CHARS: {} }, maps: { maps: { probe: map }, SOLID: {} } };
  if (withRegistry) game.WorldData = { sceneObjects: { version: 1, scenes: { probe: { objects: [], interact: {} } } } };
  return game;
}
assert.doesNotThrow(function () { runGlue(fakeGame({}, true)); }, 'glue boots a clean map with the registry');
assert.throws(function () { runGlue(fakeGame({ objects: [] }, true)); }, /still carries objects\/interact/, 'glue refuses a map with objects');
assert.throws(function () { runGlue(fakeGame({ interact: {} }, true)); }, /still carries objects\/interact/, 'glue refuses a map with interact');
assert.throws(function () { runGlue(fakeGame({}, false)); }, /sceneObjects missing/, 'glue refuses to boot without the registry');
checks += 4;

// ---- 5. generated binding in sync with its source (generator run on a temp copy)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scene-objects-gen-'));
try {
  ['test', 'world', 'js'].forEach(function (d) { fs.mkdirSync(path.join(tmp, d)); });
  fs.copyFileSync(path.join(__dirname, 'gen-world-data.js'), path.join(tmp, 'test', 'gen-world-data.js'));
  fs.mkdirSync(path.join(tmp, 'js', 'editor', 'core'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'js', 'editor', 'core', 'narrative-targets.js'), path.join(tmp, 'js', 'editor', 'core', 'narrative-targets.js'));
  ['scene-objects.json', 'connections.json', 'narrative-targets.json'].forEach(function (f) { fs.copyFileSync(path.join(ROOT, 'world', f), path.join(tmp, 'world', f)); });
  const r = spawnSync(process.execPath, [path.join(tmp, 'test', 'gen-world-data.js')], { encoding: 'utf8' });
  assert.equal(r.status, 0, 'generator runs on the copy: ' + r.stderr);
  assert.equal(fs.readFileSync(path.join(tmp, 'js', 'scene-objects.gen.js'), 'utf8'), fs.readFileSync(path.join(JS, 'scene-objects.gen.js'), 'utf8'),
    'committed js/scene-objects.gen.js is in sync with world/scene-objects.json (run node test/gen-world-data.js on drift)');
  checks += 2;
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }

if (REGISTRY_ONLY) {
  console.log('SCENE-OBJECTS-REGISTRY-PASS ' + reproduced + ' entries on ' + Object.keys(SRC).length + ' maps reproduced by the registry alone, 0 entries in js/maps.js, ' + checks + ' checks');
  process.exit(0);
}

// ---- 6. byte-identical to the pre-M8 fixture (+ sourceId)
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'objects-before-m8.json'), 'utf8'));
const after = {};
Object.keys(G.Maps).sort().forEach(function (id) {
  const m = G.Maps[id];
  if (m && typeof m === 'object' && Array.isArray(m.objects)) after[id] = JSON.parse(JSON.stringify(m.objects));
});
assert.deepEqual(Object.keys(after), Object.keys(fixture.booted), 'same maps carry objects before and after M8');
const plusSourceId = [];
let entries = 0;
Object.keys(fixture.booted).forEach(function (id) {
  assert.equal(after[id].length, fixture.booted[id].length, id + ': same number of booted objects');
  fixture.booted[id].forEach(function (before, i) {
    const now = after[id][i];
    const stripped = {};
    Object.keys(now).forEach(function (k) { if (k !== 'sourceId') stripped[k] = now[k]; });
    assert.equal(JSON.stringify(stripped), JSON.stringify(before), id + '[' + i + ']: bytes unchanged (sourceId aside)');
    if (now.sourceId !== undefined) {
      assert.equal(Object.keys(now).pop(), 'sourceId', id + '[' + i + ']: sourceId is the last key');
      plusSourceId.push(id + '[' + i + '] +sourceId ' + now.sourceId + '  ' + JSON.stringify(before));
    }
    entries++;
    checks++;
  });
});
// source accounting: every classic entry is now in the registry, verbatim
let migrated = 0;
Object.keys(fixture.source).forEach(function (id) {
  const src = fixture.source[id], reg = REG.scenes[id];
  ok(!!reg, id + ': fixture source map has a registry scene');
  assert.equal(JSON.stringify(reg.interact), JSON.stringify(src.interact), id + ': interact copied verbatim');
  assert.equal(reg.objects.length, src.objects.length, id + ': objects[] count copied');
  src.objects.forEach(function (o, i) {
    const r = {};
    Object.keys(reg.objects[i]).forEach(function (k) { if (k !== 'sourceId') r[k] = reg.objects[i][k]; });
    assert.equal(JSON.stringify(r), JSON.stringify(o), id + '.objects[' + i + ']: copied verbatim (sourceId aside)');
  });
  migrated += src.objects.length + Object.keys(src.interact).length;
});

console.log('SCENE-OBJECTS-EQUALITY-DIFF vs test/fixtures/objects-before-m8.json');
console.log('migrated (block deleted from js/maps.js; entry now in world/scene-objects.json): ' + migrated +
  ' source entries on ' + Object.keys(fixture.source).length + ' maps');
console.log('booted entries: ' + entries + ' before, ' + entries + ' after; byte-identical except +sourceId on ' + plusSourceId.length);
plusSourceId.forEach(function (l) { console.log('  ' + l); });
console.log('SCENE-OBJECTS-EQUALITY-PASS ' + entries + ' booted entries across ' + Object.keys(after).length +
  ' maps byte-identical to the pre-M8 fixture (+sourceId on ' + plusSourceId.length + '), registry alone reproduces ' + reproduced +
  ', 0 entries left in js/maps.js, ' + checks + ' checks');
