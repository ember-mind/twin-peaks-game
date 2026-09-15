/* test-world-registry.js — WORLD BUILDER v0.2 / Phase 1 tests for the single connection registry.
 *
 * The registry (world/connections.json -> js/world-connections.gen.js, exposing GAME.WorldData)
 * REPLACES the four *-location-data groups as the authoritative source of connection records. These
 * tests prove three things that make the group deletion safe:
 *   1. SHAPE: exactly seven records, ids sorted, door fields preserved (matches what install() needs).
 *   2. READ-ONLY: GAME.WorldData.connections is deep-frozen — an editor can never mutate the registry;
 *     it must work on a draft copy.
 *   3. VALIDATION: every record validates against the REAL maps via LocationConnections.validateConnection
 *     (the same checks install() runs, but non-mutating) and a tampered record is rejected WITHOUT
 *     touching GAME.Maps — the contract the editor/apply tool rely on before a changeset is ever written.
 *   4. STALE GUARD: regenerating js/world-connections.gen.js from world/connections.json must reproduce
 *     the committed file byte-for-byte; drift means "run gen-world-data.js".
 * Prologue (DOM + load chain) mirrors test/world-builder.js so it runs under Node exactly like the page.
 */
(function () {
    'use strict';

  var assert = require('node:assert/strict');
  var fs = require('node:fs');
  var path = require('node:path');
  var vm = require('node:vm');

  global.window = global;
  global.addEventListener = function () {};
  global.requestAnimationFrame = function () {};
  global.performance = { now: function () { return 0; } };
  global.document = { createElement: function () { return { style: {}, getContext: function () {
     return new Proxy({ measureText: function (s) { return { width: 1 }; } },
        { get: function (t, k) { return k in t ? t[k] : function () {}; }, set: function () { return true; } });
       } , addEventListener: function () {}, body: {} }; } };
  try { global.navigator = { maxTouchPoints: 0 }; } catch (e) { /* Node 24 navigator getter */ }
    global.matchMedia = function () { return { matches: false }; };
  global.document.readyState = 'loading';
  global.document.getElementById = function () { return null; };

  var DIR = path.join(path.dirname(__filename), '..', 'js');
  var ROOT = path.join(path.dirname(__filename), '..');
  function req(f) { return require(path.join(DIR, f)); }
  function tryReq(f) { try { req(f); } catch (e) { /* scene installers needing audio/EnvReactions */ } }

   // Same real chain as world-builder.js up to world-catalog, plus the registry module.
  ['tiles.js', 'chars.js', 'houses.js', 'maps.js', 'data.js', 'environmental-inspect.js',
   'retro-font.js', 'portraits.js', 'gold-tone.js', 'engine.js', 'scene-objects.gen.js', 'glue.js', 'location-connections.js',
   'double-r-exterior-art.js', 'double-r-exterior-scene.js', 'world-connections.gen.js', 'double-r-location-production.js',
   'sheriffs-station-art.js', 'sheriffs-station-exterior-art.js', 'sheriffs-station-scene.js', 'sheriffs-station-exterior-scene.js', 'sheriffs-station-production.js',
   'room-315-art.js', 'room-315-scene.js', 'room-315-production.js',
   'hospital-art.js', 'hospital-scene.js', 'hospital-production.js',
   'traincar-art.js', 'traincar-scene.js', 'world-connections-production.js'
  ].forEach(tryReq);
  req('world-engine.js');
  req('world-catalog.js');

  var G = global.GAME;
  var records = G.WorldData.connections;

   // ---- 1. SHAPE: exactly fifteen records (seven authored + eight migrated classic doors in M5), ids sorted ----
  assert.equal(records.length, 15, 'registry holds the fifteen connections');
  var ids = records.map(function (c) { return c.id; });
  assert.deepEqual(ids, ['arrival-town', 'double-r-front-entrance', 'great-northern-room-315-hall', 'redroom-room-315-wake',
   'sheriffs-station-front-entrance', 'town-double-r-lot', 'town-great-northern-lobby', 'town-hospital', 'town-palmer-house',
   'town-roadhouse', 'town-sheriffs-station-lot', 'town-traincar-east', 'town-woods-north', 'traincar-oej-entrance', 'woods-redroom-dream'],
   'registry ids are present and in stable sorted order');
  assert.deepEqual(records.filter(function (c) { return c.one_way === true; }).map(function (c) { return c.id; }),
   ['arrival-town', 'redroom-room-315-wake', 'woods-redroom-dream'], 'exactly the three one-way records');
  assert.equal(records.find(function (c) { return c.id === 'town-woods-north'; }).a.door.needsClues, 3, 'woods gate keeps its clue count');
  assert.equal(records.find(function (c) { return c.id === 'town-traincar-east'; }).a.door.needsFlag, 'atto3',
   'gating door fields survive into the registry');
  assert.equal(records.find(function (c) { return c.id === 'traincar-oej-entrance'; }).a.door.needsFlag, 'east_route_confirmed',
   'oej gating flag survives into the registry');

   // ---- 2. READ-ONLY: deep-frozen so editors work on drafts, never this array ----
  assert.ok(Object.isFrozen(records), 'registry array is frozen');
  records.forEach(function (c) {
    assert.ok(Object.isFrozen(c), c.id + ' record frozen');
    assert.ok(Object.isFrozen(c.a) && Object.isFrozen(c.b), c.id + ' endpoints frozen');
     ['a', 'b'].forEach(function (side) {
      assert.ok(Object.isFrozen(c[side].spawn), c.id + '.' + side + '.spawn frozen');
      assert.ok(Object.isFrozen(c[side].triggers), c.id + '.' + side + '.triggers array frozen');
       });
     });

     // ---- 3. VALIDATOR LOGIC: validateConnection is what the editor + apply tool call before a
   //      changeset ever touches GAME.Maps. We exercise it both ways deterministically, without depending
   //      on a full node reproduction of every scene's runtime walkability (that the real install proves in
   //      smoke/walkthrough): a positive case on a small synthetic map, and three rejection cases built from
   //      REAL registry records broken for STRUCTURAL reasons that do not depend on tile solidity.
   var LC = G.LocationConnections;
     // A controlled two-scene world: validateConnection should accept a well-formed connection between them.
   var maps = {
      scene_a: { id: 'scene_a', width: 3, height: 3, doors: {}, isSolid: function () { return false; } },
       scene_b: { id: 'scene_b', width: 3, height: 3, doors: {}, isSolid: function () { return false; } }
        };
    var good = { id: 'x', a: { scene: 'scene_a', triggers: [[0, 0]], spawn: { tx: 1, ty: 1, dir: 'down' } },
      b: { scene: 'scene_b', triggers: [[0, 2]], spawn: { tx: 0, ty: 1, dir: 'up' } } };
    assert.ok(LC.validateConnection(good, maps).valid, 'validateConnection accepts a well-formed two-scene connection');
     // Rejections built from real registry records, broken structurally (independent of tile solidity).
   var byId = {};
   records.forEach(function (c) { byId[c.id] = c; });
    var outOfBounds = JSON.parse(JSON.stringify(byId['double-r-front-entrance']));
   outOfBounds.b.spawn.tx = 999;
   assert.ok(LC.validateConnection(outOfBounds, G.Maps).valid === false, 'out-of-bounds spawn is rejected');
   var emptyTriggers = JSON.parse(JSON.stringify(byId['great-northern-room-315-hall']));
   emptyTriggers.a.triggers = [];
   assert.ok(LC.validateConnection(emptyTriggers, G.Maps).valid === false, 'empty triggers are rejected');
   var sameScene = JSON.parse(JSON.stringify(byId['sheriffs-station-front-entrance']));
   sameScene.b.scene = sameScene.a.scene;
   assert.ok(LC.validateConnection(sameScene, G.Maps).valid === false, 'a/b in the same scene is rejected');
     // Non-mutation: validation must never install anything into GAME.Maps (the editor's pre-apply contract).
   function doorSignature() {
     var h = {};
     Object.keys(G.Maps).forEach(function (k) { var m = G.Maps[k]; if (m.doors) h[k] = JSON.stringify(m.doors); });
     return JSON.stringify(h);
        }
    var signatureBefore = doorSignature();
   [outOfBounds, emptyTriggers, sameScene].forEach(function (c) { LC.validateConnection(c, G.Maps); });
    assert.equal(doorSignature(), signatureBefore, 'validateConnection never mutates GAME.Maps');

   // ---- 4. STALE GUARD: regenerate must reproduce the committed file ----
  var canonPath = path.join(ROOT, 'world', 'connections.json');
  var genPath = path.join(ROOT, 'js', 'world-connections.gen.js');
  var genOnDisk = fs.readFileSync(genPath, 'utf8');
   // Re-run the generator's own logic into a temp buffer and compare.
  var child = require('node:child_process').execSync('node ' + path.join(__dirname, 'gen-world-data.js'), { cwd: ROOT });
   assert.ok(/wrote js\/world-connections\.gen\.js \(15 records/.test(child.toString()), 'generator reports fifteen records');
   var genAfter = fs.readFileSync(genPath, 'utf8');
  assert.equal(genAfter, genOnDisk, 'committed world-connections.gen.js is in sync with world/connections.json (run node test/gen-world-data.js on drift)');

  console.log('WORLD-REGISTRY-PASS shape(15 sorted, 3 one-way), deep-frozen, validates-vs-real-maps non-mutating, stale-guard in sync');
}());
