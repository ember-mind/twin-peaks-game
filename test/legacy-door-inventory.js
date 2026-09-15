#!/usr/bin/env node
'use strict';

/* test/legacy-door-inventory.js — where every classic door in js/maps.js stands against the registry.
 *
 * Boots the REAL map chain in index.html order (glue -> registry -> scene + connection installers ->
 * world-engine/catalog), then classifies every classic door source entry (maps.js doors{} and the glue
 * `gate`, which glue compiles into a door) by what the booted GAME.Maps actually holds on that tile:
 *
 *   shadowed     the tile carries a registry descriptor (connectionId) after boot: the classic entry is dead data
 *   conflict     classic door is live, but a registry connection already joins the same two maps
 *   live paired  classic door is live and the target map has a live classic door back to this map
 *   live one-way classic door is live and the target map has no door back to this map at all
 *
 * It also guards the booted state directly: every door descriptor on every map must carry a connectionId.
 * After M5 the expected state is 0 classic source entries, 0 live, 0 shadowed, 0 conflict.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Phase 1 (main b284dd2) was { sources: 27, shadowed: 10, conflict: 0, paired: 14, oneWay: 3 } — 26 doors{}
// entries + the town gate. M5 migrated every live door into world/connections.json and deleted the rest.
const EXPECT = { sources: 0, shadowed: 0, conflict: 0, paired: 0, oneWay: 0 };

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
// index.html order. Connection installers are listed as they exist on disk before and after M5; a listed file
// that exists must load (require, not try): a silently skipped installer would read as "classic door live".
const CHAIN = ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'environmental-inspect.js', 'retro-font.js',
  'portraits.js', 'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'environment-reactions.js', 'location-connections.js',
  'world-connections.gen.js',
  'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
  'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js',
  'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
  'room-315-art.js', 'room-315-scene.js', 'room-315-production.js',
  'hospital-art.js', 'hospital-scene.js', 'hospital-production.js',
  'traincar-art.js', 'traincar-scene.js', 'traincar-production.js', 'traincar-location-production.js',
  'world-connections-production.js', 'world-engine.js', 'world-catalog.js'];
const OPTIONAL = { 'traincar-location-production.js': 1, 'world-connections-production.js': 1 };
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
assert.ok(G.WorldData && Array.isArray(G.WorldData.connections), 'registry loaded');

// ---- classic source entries (what maps.js still authors)
const sources = [];
Object.keys(SRC).forEach(function (mapId) {
  const src = SRC[mapId];
  Object.keys(src.doors || {}).forEach(function (key) {
    sources.push({ map: mapId, key: key, to: src.doors[key].to, origin: 'doors' });
  });
  if (src.gate) sources.push({ map: mapId, key: src.gate.x + ',' + src.gate.y, to: src.gate.to, origin: 'gate' });
});

// ---- registry joins between map pairs
const joined = {};
const pairKey = (m, t) => [m, t].sort().join('<->');
G.WorldData.connections.forEach(function (c) { (joined[pairKey(c.a.scene, c.b.scene)] = joined[pairKey(c.a.scene, c.b.scene)] || []).push(c.id); });

function liveClassic(mapId, to) {
  const doors = (MAPS[mapId] && MAPS[mapId].doors) || {};
  return Object.keys(doors).filter((k) => !doors[k].connectionId && (to === undefined || doors[k].to === to));
}
function anyDoorBack(mapId, to) {
  const doors = (MAPS[to] && MAPS[to].doors) || {};
  return Object.keys(doors).some((k) => doors[k].to === mapId);
}

const rows = sources.map(function (s) {
  const live = MAPS[s.map].doors[s.key];
  let status, evidence;
  if (!live) { status = 'missing'; evidence = 'no descriptor on the booted map'; }
  else if (live.connectionId) { status = 'shadowed'; evidence = live.connectionId; }
  else if (joined[pairKey(s.map, s.to)]) { status = 'conflict'; evidence = 'registry ' + joined[pairKey(s.map, s.to)].join(','); }
  else if (liveClassic(s.to, s.map).length) { status = 'live paired'; evidence = s.to + ' ' + liveClassic(s.to, s.map).join(' / ') + ' -> ' + s.map; }
  else if (!anyDoorBack(s.map, s.to)) { status = 'live one-way'; evidence = 'no door ' + s.to + ' -> ' + s.map; }
  else { status = 'live mixed'; evidence = s.to + ' returns only through the registry'; }
  return Object.assign({ status: status, evidence: evidence }, s);
});

console.log('map        tile    origin  -> target                       status        evidence');
rows.forEach(function (r) {
  console.log([r.map.padEnd(10), r.key.padEnd(7), r.origin.padEnd(7), '-> ' + r.to.padEnd(28), r.status.padEnd(13), r.evidence].join(' '));
});

const count = (st) => rows.filter((r) => r.status === st).length;
const got = { sources: rows.length, shadowed: count('shadowed'), conflict: count('conflict'),
  paired: count('live paired'), oneWay: count('live one-way') };
console.log('counts ' + JSON.stringify(got) + ' missing=' + count('missing') + ' mixed=' + count('live mixed'));

assert.equal(count('missing'), 0, 'every classic source entry has a descriptor after boot');
assert.equal(count('live mixed'), 0, 'no classic door returns only through the registry');
assert.deepEqual(got, EXPECT, 'legacy door inventory counts');

// ---- booted-state guard: every door on every map is a registry descriptor
const unowned = [];
let total = 0;
Object.keys(MAPS).forEach(function (mapId) {
  const m = MAPS[mapId];
  if (!m || typeof m !== 'object' || !m.doors) return;
  Object.keys(m.doors).forEach(function (k) { total++; if (!m.doors[k].connectionId) unowned.push(mapId + ' ' + k); });
});
if (EXPECT.sources === 0) assert.deepEqual(unowned, [], 'every booted door descriptor carries a connectionId');

console.log('LEGACY-DOOR-INVENTORY-PASS sources=' + got.sources + ' live=' + (got.paired + got.oneWay) +
  ' shadowed=' + got.shadowed + ' conflict=' + got.conflict + ' booted-doors=' + total + ' unowned=' + unowned.length);

// ---- --write-fixture: snapshot every map's doors (pre-M5 fixture for test/world-door-equality.js)
if (process.argv.includes('--write-fixture')) {
  const source = {}, booted = {};
  Object.keys(SRC).forEach(function (mapId) {
    const src = SRC[mapId], out = {};
    Object.keys(src.doors || {}).forEach(function (k) { out[k] = src.doors[k]; });
    if (src.gate) out[src.gate.x + ',' + src.gate.y] = { to: src.gate.to, tx: src.gate.tx, ty: src.gate.ty, dir: src.gate.dir, needsClues: 3 };
    source[mapId] = out;
  });
  Object.keys(MAPS).sort().forEach(function (mapId) {
    const m = MAPS[mapId];
    if (m && typeof m === 'object' && m.doors) booted[mapId] = m.doors;
  });
  const file = path.join(__dirname, 'fixtures', 'doors-before-m5.json');
  fs.writeFileSync(file, JSON.stringify({ note: 'GAME.Maps.<id>.doors before M5 (main b284dd2). source = classic js/maps.js doors{} + glue gate as glue compiles them; booted = descriptors after the full production chain.', source: source, booted: booted }, null, 2) + '\n');
  console.log('wrote ' + path.relative(process.cwd(), file));
}
