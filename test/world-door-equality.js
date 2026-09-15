/* test/world-door-equality.js — proof that the registry reproduces every door the game had before M5.
 *
 * Fixture: test/fixtures/doors-before-m5.json, snapshotted on main b284dd2 (before any M5 change) by
 * `node test/legacy-door-inventory.js --write-fixture`:
 *   source = classic js/maps.js doors{} entries (+ the town gate as glue compiled it)
 *   booted = every GAME.Maps.<id>.doors after the full production chain
 *
 * After M5 this test boots the real chain (index.html order, single installer js/world-connections-production.js)
 * and asserts, for ALL maps:
 *   1. booted doors are byte-identical to the fixture's booted doors once connectionId is set aside, key by key,
 *      and every descriptor now carries a connectionId;
 *   2. js/maps.js carries no classic door entry (source is empty everywhere);
 *   3. every fixture source entry is accounted for: migrated (its classic descriptor is now the registry
 *      descriptor on the same tile), shadowed (the tile was already registry-owned before M5), or dead conflict
 *      (none this pass). The diff is printed explicitly.
 *   4. registry-only reproduction: installing GAME.WorldData.connections alone onto empty door bags reproduces
 *      the booted doors exactly, so the registry is the only door source.
 */
(function () {
  'use strict';

  var assert = require('node:assert/strict');
  var fs = require('node:fs');
  var path = require('node:path');

  global.window = global;
  global.addEventListener = function () {};
  global.requestAnimationFrame = function () {};
  global.performance = { now: function () { return 0; } };
  function element() {
    var el = { style: {}, addEventListener: function () {}, appendChild: function () {},
      getBoundingClientRect: function () { return { width: 320, height: 240, top: 0, left: 0 }; } };
    el.getContext = function () {
      return new Proxy({ measureText: function (s) { return { width: String(s).length * 6 }; } },
        { get: function (t, k) { return k in t ? t[k] : function () {}; }, set: function () { return true; } });
    };
    return el;
  }
  global.document = { createElement: element, createElementNS: function () { return { setAttribute: function () {}, style: {} }; },
    body: { style: {}, appendChild: function () {} }, head: { appendChild: function () {} },
    readyState: 'loading', getElementById: function () { return null; }, addEventListener: function () {} };
  global.matchMedia = function () { return { matches: false, addEventListener: function () {} }; };

  var quiet = console.warn;
  console.warn = function () {};
  try {
    ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'environmental-inspect.js', 'retro-font.js', 'portraits.js',
      'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'environment-reactions.js', 'location-connections.js', 'world-connections.gen.js',
      'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'double-r-location-production.js',
      'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js',
      'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
      'room-315-art.js', 'room-315-scene.js', 'room-315-production.js',
      'hospital-art.js', 'hospital-scene.js', 'hospital-production.js',
      'traincar-art.js', 'traincar-scene.js', 'traincar-production.js',
      'world-connections-production.js', 'world-engine.js', 'world-catalog.js'
    ].forEach(function (f) { require(path.join(__dirname, '..', 'js', f)); });
  } finally { console.warn = quiet; }

  var G = global.GAME;
  var fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'doors-before-m5.json'), 'utf8'));
  function strip(d) { var o = {}; Object.keys(d).forEach(function (k) { if (k !== 'connectionId') o[k] = d[k]; }); return o; }
  function bytes(d) { return JSON.stringify(strip(d)); }

  // ---- 1. booted doors: same maps, same keys, same descriptor bytes (connectionId aside), all registry-owned
  var after = {};
  Object.keys(G.Maps).sort().forEach(function (id) {
    var m = G.Maps[id];
    if (m && typeof m === 'object' && m.doors) after[id] = JSON.parse(JSON.stringify(m.doors));
  });
  assert.deepEqual(Object.keys(after), Object.keys(fixture.booted), 'same maps carry door bags before and after M5');
  var descriptors = 0, gainedId = [];
  Object.keys(fixture.booted).forEach(function (id) {
    assert.deepEqual(Object.keys(after[id]).sort(), Object.keys(fixture.booted[id]).sort(), id + ': same door tiles before and after M5');
    Object.keys(fixture.booted[id]).forEach(function (key) {
      var before = fixture.booted[id][key], now = after[id][key];
      assert.equal(bytes(now), bytes(before), id + ' ' + key + ': descriptor bytes unchanged (connectionId aside)');
      assert.ok(typeof now.connectionId === 'string' && now.connectionId, id + ' ' + key + ': descriptor carries a connectionId');
      if (!before.connectionId) gainedId.push(id + ' ' + key + ' +connectionId ' + now.connectionId);
      else assert.equal(now.connectionId, before.connectionId, id + ' ' + key + ': already-registry tile keeps its connection');
      descriptors++;
    });
  });

  // ---- 2. js/maps.js carries no door data
  var sourceNow = 0;
  Object.keys(G.maps.maps).forEach(function (id) {
    var src = G.maps.maps[id];
    sourceNow += Object.keys(src.doors || {}).length + (src.gate ? 1 : 0);
  });
  assert.equal(sourceNow, 0, 'js/maps.js has no classic door entries and no gate');

  // ---- 3. account for every pre-M5 classic source entry
  var diff = { migrated: [], shadowed: [], deadConflict: [] };
  Object.keys(fixture.source).forEach(function (id) {
    Object.keys(fixture.source[id]).forEach(function (key) {
      var classic = fixture.source[id][key], bootedBefore = fixture.booted[id][key], now = after[id][key];
      assert.ok(now, id + ' ' + key + ': classic entry has a registry descriptor on the same tile');
      if (bootedBefore.connectionId) {
        diff.shadowed.push('- ' + id + ' ' + key + ' ' + JSON.stringify(classic) + '  (dead before M5: ' + bootedBefore.connectionId + ')');
      } else {
        assert.equal(bytes(now), JSON.stringify(classic), id + ' ' + key + ': migrated descriptor equals the classic entry');
        diff.migrated.push('~ ' + id + ' ' + key + ' ' + JSON.stringify(classic) + '  -> ' + now.connectionId);
      }
    });
  });
  assert.equal(diff.deadConflict.length, 0, 'no conflicting crossing had to be deleted');
  assert.equal(diff.migrated.length + diff.shadowed.length, 27, 'all 27 pre-M5 classic entries accounted for');
  assert.deepEqual(gainedId.length, diff.migrated.length, 'exactly the migrated tiles gained a connectionId');

  console.log('DOOR-EQUALITY-DIFF vs test/fixtures/doors-before-m5.json');
  console.log('migrated (classic entry deleted from js/maps.js; same descriptor now installed by the registry): ' + diff.migrated.length);
  diff.migrated.forEach(function (l) { console.log('  ' + l); });
  console.log('shadowed (classic entry deleted from js/maps.js; tile was already registry-owned, descriptor unchanged): ' + diff.shadowed.length);
  diff.shadowed.forEach(function (l) { console.log('  ' + l); });
  console.log('dead conflict crossings deleted: ' + diff.deadConflict.length);
  console.log('booted descriptors: ' + descriptors + ' before, ' + descriptors + ' after; byte-identical except +connectionId on ' + gainedId.length);

  // ---- 4. registry-only reproduction onto empty door bags
  var bags = {};
  G.WorldData.connections.forEach(function (record) {
    ['a', 'b'].forEach(function (side) {
      var sceneId = record[side].scene, real = G.Maps[sceneId];
      assert.ok(real, 'registry endpoint scene ' + sceneId + ' exists in GAME.Maps');
      if (!bags[sceneId]) bags[sceneId] = { id: sceneId, width: real.width, height: real.height, rows: real.rows, doors: {} };
    });
  });
  bags.isSolid = function (id, x, y, state) { return G.Maps.isSolid(id, x, y, state); };
  G.WorldData.connections.forEach(function (record) { G.LocationConnections.install(record, bags); });
  var reproduced = 0;
  Object.keys(after).forEach(function (id) {
    var expected = after[id], got = bags[id] ? JSON.parse(JSON.stringify(bags[id].doors)) : {};
    assert.deepEqual(got, expected, id + ': registry alone reproduces the booted doors');
    reproduced += Object.keys(expected).length;
  });

  // Regression anchors kept from the registry pass.
  var te = G.WorldData.connections.find(function (r) { return r.id === 'town-traincar-east'; });
  assert.deepEqual(te.a.triggers, [[55, 14], [55, 15]], 'town-traincar-east a.triggers faithful to original');
  assert.equal(te.b.spawn.dir, 'right', 'town-traincar-east b.spawn dir right (original)');
  var oe = G.WorldData.connections.find(function (r) { return r.id === 'traincar-oej-entrance'; });
  assert.deepEqual(oe.b.triggers, [[7, 9], [8, 9]], 'traincar-oej-entrance b.triggers faithful to original');

  console.log('WORLD-DOOR-EQUALITY-PASS ' + descriptors + ' door descriptors across ' + Object.keys(after).filter(function (id) { return Object.keys(after[id]).length; }).length +
    ' scenes byte-identical to the pre-M5 fixture (+connectionId on ' + gainedId.length + '), registry alone reproduces ' + reproduced +
    ', 0 classic entries left in js/maps.js');
}());
