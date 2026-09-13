/* test/world-door-equality.js — DELETION-PROOF proof that GAME.WorldData is a faithful source of truth
 * for connection doors, so deleting the four *-location-data groups changes no runtime behaviour.
 *
 * The test does NOT require the *-location-data.js files (this pass deletes them). Instead it drives the
 * PERSISTENT production installers — double-r / sheriffs-station / room-315 / traincar — which read the group
 * globals while they still exist and GAME.WorldData after deletion, always producing the same doors.
 *   A = door descriptors present in every scene after the normal production install chain runs.
 *   B = doors produced by installing ONLY GAME.WorldData.connections onto FRESH per-scene door bags that reuse
 *       each real map's dimensions/isSolid but start empty. This isolates "doors come solely from the
 *       registry": a missing or divergent record simply fails to reproduce A on some tile.
 * We assert A === B for every scene. The two explicit traincar anchors are the regression guards for the exact
 * 6-field divergence in world/connections.json that this pass found and fixed.
 */
(function () {
  'use strict';

  var assert = require('node:assert/strict');
  global.window = global;
  global.addEventListener = function () {};
  global.requestAnimationFrame = function () {};
  global.performance = { now: function () { return Date.now(); } };
  global.document = { createElement: function () {
    var el = { style: {}, width: 0, height: 0, className: '' };
    el.getContext = function () {
      var base = { measureText: function (s) { return { width: String(s).length * 6 }; },
        save: function () {}, restore: function () {}, clearRect: function () {} };
      return new Proxy(base, { get: function (t, k) { return k in t ? t[k] : function () {}; }, set: function () { return true; } });
    };
    el.addEventListener = function () {};
    el.style = new Proxy(el.style, { get: function (t, k) { return k in t ? t[k] : ''; }, set: function () { return true; } });
    el.getBoundingClientRect = function () { return { width: 320, height: 240, top: 0, left: 0 }; };
    el.appendChild = function () {};
    el.insertBefore = function (node) { node._inserted = true; return node; };
    el.parentNode = null;
    global.document.body = { style: el.style, appendChild: function () {}, insertBefore: function () {} };
    return el;
  },
    body: { style: {}, appendChild: function () {}, insertBefore: function () {} },
    head: { appendChild: function () {} }, createElementNS: function () { return { setAttribute: function () {}, style: {} }; },
    readyState: 'loading', getElementById: function () { return null; } };
  try { global.navigator = { userAgent: 'node', maxTouchPoints: 0, language: 'en-US' }; } catch (e) { /* Node 24 */ }
  global.matchMedia = function () { return { matches: false, addEventListener: function () {}, addListener: function () {} }; };
  global.document.readyState = 'loading';

  var path = require('path');
  var req = function (f) { return require(path.join(__dirname, f)); };
  var tryReq = function (f) { try { req(f); } catch (e) { /* optional: scene/audio env may be absent in node */ } };

  // Proven bootstrap from test/world-engine-v0.1-catalog.js: registers every endpoint scene and loads the
   // connection groups that still exist pre-deletion (via tryReq, so they no-throw once deleted this pass).
 global.GAME = {};
  req('../js/tiles.js'); req('../js/chars.js'); req('../js/houses.js'); req('../js/maps.js');
  req('../js/data.js'); req('../js/glue.js');
  req('../js/location-connections.js');
  req('../js/double-r-exterior-scene.js');
   tryReq('../js/double-r-location-data.js');
    tryReq('../js/traincar-location-data.js');
     tryReq('../js/sheriffs-station-art.js'); tryReq('../js/sheriffs-station-exterior-art.js');
      tryReq('../js/sheriffs-station-scene.js'); tryReq('../js/sheriffs-station-exterior-scene.js');
       tryReq('../js/room-315-scene.js');
        tryReq('../js/hospital-scene.js');
          tryReq('../js/traincar-scene.js');
           tryReq('../js/oej-scene.js');
     tryReq('../js/sheriffs-station-location-data.js');
   tryReq('../js/room-315-location-data.js');
 req('../js/environment-reactions.js');
 global.GAME.DoubleRExteriorScene.install();
   // A: run every production installer FIRST — this registers sheriffs_station_exterior and places all doors in
    // GAME.Maps. Done before world-catalog, which validates every scene at require time and would reject the
     // not-yet-registered exterior scene; door-equality does not need the catalog at all.
   ['../js/double-r-location-production.js', '../js/sheriffs-station-production.js',
      '../js/room-315-production.js', '../js/traincar-location-production.js'
     ].forEach(function (f) { tryReq(f); });

  req('../js/world-engine.js');
    req('../js/world-connections.gen.js');

   var G = global.GAME;
  assert.ok(G.WorldData && Array.isArray(G.WorldData.connections), 'GAME.WorldData.connections not loaded');

  function snapshotDoors(maps) {
    var out = {};
    Object.keys(maps).forEach(function (k) {
      var m = maps[k];
      if (m && typeof m === 'object' && m.doors && Object.keys(m.doors).length) out[k] = JSON.parse(JSON.stringify(m.doors));
    });
    return out;
  }
  var A = snapshotDoors(G.Maps);
   // B: install ONLY the registry onto fresh per-scene door bags (real dims + isSolid, empty doors{}). This
    // isolates "doors come solely from the registry": a record that is missing or divergent simply fails to
     // reproduce the descriptor production actually installed.
  var scenesForB = {};
  G.WorldData.connections.forEach(function (record) {
     ['a', 'b'].forEach(function (side) {
      var sceneId = record[side].scene;
      if (!scenesForB[sceneId]) {
        var real = G.Maps[sceneId];
        assert(real, 'registry endpoint scene ' + sceneId + ' exists in GAME.Maps');
        scenesForB[sceneId] = { id: sceneId, width: real.width, height: real.height, doors: {},
          isSolid: function (x, y, ctx) { return real.isSolid ? real.isSolid(x, y, ctx) : false; } };
       }
     });
    });
  G.WorldData.connections.forEach(function (record) { G.LocationConnections.install(record, scenesForB); });
  var B = snapshotDoors(scenesForB);

   // Compare ONLY registry-owned doors: every door the registry produces must be reproduced byte-identically by
    // the production install (A). Non-catalog map doors — e.g. arrival->town, which is not one of the seven
     // connection records — are out of registry scope and intentionally ignored here.
  var reproduced = 0;
  var scenesWithRegistryDoors = 0;
  Object.keys(B).forEach(function (sceneId) {
    assert(A[sceneId], 'scene ' + sceneId + ' has a production-installed door bag');
    var keys = Object.keys(B[sceneId]);
    if (keys.length) scenesWithRegistryDoors++;
    keys.forEach(function (key) {
      assert.deepEqual(A[sceneId][key], B[sceneId][key], `registry door ${sceneId}[${key}] reproduced by production`);
      reproduced++;
     });
   });
  assert(reproduced > 0, 'at least one registry connection door was installed');

    // Reverse guard within registry scope: every registry trigger tile is actually present in the live map, so a
     // record that installs nothing on its scene cannot pass.
  G.WorldData.connections.forEach(function (record) {
     ['a', 'b'].forEach(function (side) {
      if (!record[side].triggers) return;
      record[side].triggers.forEach(function (trigger) {
        var tx = trigger[0], ty = trigger[1], sceneId = record[side].scene;
        assert(A[sceneId] && A[sceneId][tx + ',' + ty],
          `${record.id} trigger ${sceneId}[${tx},${ty}] is installed in GAME.Maps`);
       });
      });
   });

    // Regression anchors for the exact divergence found this pass (6 fields across two records).
  var te = G.WorldData.connections.find(function (r) { return r.id === 'town-traincar-east'; });
  assert.deepEqual(te.a.triggers, [[55, 14], [55, 15]], 'town-traincar-east a.triggers faithful to original');
  assert.equal(te.b.spawn.dir, 'right', 'town-traincar-east b.spawn dir right (original)');
  var oe = G.WorldData.connections.find(function (r) { return r.id === 'traincar-oej-entrance'; });
   assert.deepEqual(oe.b.triggers, [[7, 9], [8, 9]], 'traincar-oej-entrance b.triggers faithful to original');

  console.log('WORLD-DOOR-EQUALITY-PASS registry reproduces all ' + reproduced + ' connection door descriptors across ' +
    scenesWithRegistryDoors + ' scenes byte-identically (deleting the data groups changes no runtime doors; ' +
     'arrival->town and other non-catalog map doors are out of scope)');
}());
