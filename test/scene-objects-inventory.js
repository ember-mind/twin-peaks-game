#!/usr/bin/env node
'use strict';

/* test/scene-objects-inventory.js — every scene object and interact key the game boots, and where it comes from.
 *
 * Boots the REAL map chain in index.html order and lists, for every map:
 *   - each classic source entry: js/maps.js `objects[]` entries and `interact` keys;
 *   - each booted GAME.Maps.<id>.objects entry, with its origin (registry objects[i], registry interact "x,y",
 *     or a native scene file that builds its own map record), kind/type, tile or rect, dialogue binding
 *     (string or cascade) and the sparkle flag glue gives interact keys.
 *
 *   node test/scene-objects-inventory.js                  print the table and assert the expected counts
 *   node test/scene-objects-inventory.js --write-fixture  also write test/fixtures/objects-before-m8.json
 *                                                         (the booted objects after glue's merge; Phase 1 only)
 *
 * Phase 1 (branch point 662702e) found 4 objects[] entries and 16 interact keys in js/maps.js. After M8 the
 * expected state is 0 entries left in js/maps.js: world/scene-objects.json is the only source.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const EXPECT = { mapsObjects: 4, mapsInteract: 16 };

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

const JS = path.join(__dirname, '..', 'js');
// index.html order. scene-objects.gen.js is listed where it loads after M8 (before glue); before M8 it does not
// exist, so it is the one optional file. Every other listed file must load.
const CHAIN = ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'environmental-inspect.js', 'retro-font.js',
  'portraits.js', 'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'environment-reactions.js',
  'location-connections.js', 'world-connections.gen.js',
  'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js',
  'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
  'room-315-art.js', 'room-315-scene.js', 'room-315-production.js',
  'hospital-art.js', 'hospital-scene.js', 'hospital-production.js',
  'traincar-art.js', 'traincar-scene.js', 'traincar-production.js',
  'world-connections-production.js', 'world-engine.js', 'world-catalog.js'];
const OPTIONAL = { 'scene-objects.gen.js': 1 };
const quiet = console.warn;
console.warn = function () {};
try {
  CHAIN.forEach(function (f) {
    if (OPTIONAL[f] && !fs.existsSync(path.join(JS, f))) return;
    require(path.join(JS, f));
  });
} finally { console.warn = quiet; }

const G = global.GAME;
const SRC = G.maps.maps;
const MAPS = G.Maps;
const REG = G.WorldData && G.WorldData.sceneObjects ? G.WorldData.sceneObjects.scenes : null;

// ---- classic source entries (what js/maps.js still authors)
let mapsObjects = 0, mapsInteract = 0;
Object.keys(SRC).forEach(function (id) {
  if (Object.prototype.hasOwnProperty.call(SRC[id], 'objects')) mapsObjects += SRC[id].objects.length;
  if (Object.prototype.hasOwnProperty.call(SRC[id], 'interact')) mapsInteract += Object.keys(SRC[id].interact).length;
});

// ---- booted entries, each tied back to the source that produced it
// glue emits objects[] first (in order), then one entry per interact key (in key order).
function sourceFor(id) {
  if (REG && REG[id]) return { objects: REG[id].objects, interact: REG[id].interact, where: 'registry' };
  if (SRC[id] && (SRC[id].objects || SRC[id].interact)) return { objects: SRC[id].objects || [], interact: SRC[id].interact || {}, where: 'maps.js' };
  return null;
}
function tileOf(o) { return o.w || o.h ? o.x + ',' + o.y + ' ' + (o.w || 1) + 'x' + (o.h || 1) : o.x + ',' + o.y; }
function binding(d) { return typeof d === 'string' ? d : 'cascade ' + JSON.stringify(d); }

const rows = [];
const booted = {};
let bootedCount = 0;
Object.keys(MAPS).sort().forEach(function (id) {
  const m = MAPS[id];
  if (!m || typeof m !== 'object' || !Array.isArray(m.objects)) return;
  booted[id] = JSON.parse(JSON.stringify(m.objects));
  const src = sourceFor(id);
  const nObj = src ? src.objects.length : 0;
  const keys = src ? Object.keys(src.interact) : [];
  assert.equal(m.objects.length, src ? nObj + keys.length : m.objects.length,
    id + ': booted objects = source objects[] + interact keys');
  m.objects.forEach(function (o, i) {
    bootedCount++;
    let origin;
    if (!src) origin = 'native scene (own map record)';
    else if (i < nObj) origin = src.where + ' objects[' + i + ']' + (o.sourceId ? ' ' + o.sourceId : '');
    else origin = src.where + ' interact "' + keys[i - nObj] + '" = ' + src.interact[keys[i - nObj]];
    rows.push([id, origin, (o.type || '-') + (o.kind ? '/' + o.kind : ''), tileOf(o), binding(o.dialogue),
      o.type === 'sparkle' ? 'yes' : 'no']);
  });
});

console.log('| scene | origin | type/kind | tile or rect | dialogue | sparkle |');
console.log('| --- | --- | --- | --- | --- | --- |');
rows.forEach(function (r) { console.log('| ' + r.join(' | ') + ' |'); });
console.log('js/maps.js: objects[] entries ' + mapsObjects + ', interact keys ' + mapsInteract +
  '; booted entries ' + bootedCount + ' on ' + Object.keys(booted).length + ' maps' + (REG ? '; registry loaded' : '; no registry'));

if (process.argv.includes('--write-fixture')) {
  const source = {};
  Object.keys(SRC).forEach(function (id) {
    if (SRC[id].objects || SRC[id].interact) source[id] = { objects: SRC[id].objects || [], interact: SRC[id].interact || {} };
  });
  const out = path.join(__dirname, 'fixtures', 'objects-before-m8.json');
  fs.writeFileSync(out, JSON.stringify({ source: source, booted: booted }, null, 1) + '\n');
  console.log('wrote ' + path.relative(process.cwd(), out));
}

assert.equal(mapsObjects, EXPECT.mapsObjects, 'js/maps.js objects[] entries: ' + mapsObjects);
assert.equal(mapsInteract, EXPECT.mapsInteract, 'js/maps.js interact keys: ' + mapsInteract);
console.log('SCENE-OBJECTS-INVENTORY-PASS ' + bootedCount + ' booted entries, ' +
  (mapsObjects + mapsInteract) + ' entries left in js/maps.js');
