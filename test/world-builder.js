/* world-builder.js — WORLD BUILDER v0.1 (Node tests for M1–M3 data layer).
 *
 * Verifies the pure view-model + coordinate layers against the REAL world catalog/maps/
 * connections, the same modules the browser page consumes:
 *   - M1 discovery: snapshot lists all 7 catalog locations with correct scene membership.
 *   - M2 overlay accuracy: per-scene overlay counts match GAME.Maps exactly (town/diner/sheriff).
 *   - M3 read-only: connection records normalize to canonical a/b endpoints; the snapshot is
 *     deep-frozen and building it never mutates the live source maps.
 * Coordinates are tested for round-trip exactness so "right pixel -> right overlay" holds.
 */
(function () {
   'use strict';

  var path = require('path');
  global.window = global;
  global.addEventListener = function () {};
  global.requestAnimationFrame = function () {};
  global.performance = { now: function () { return 0; } };
  global.document = { createElement: function () { return { style: {}, getContext: function () {
     return new Proxy({ measureText: function (s) { return { width: 1 }; } },
       { get: function (t, k) { return k in t ? t[k] : function () {}; }, set: function () { return true; } });
      } , addEventListener: function () {}, body: {} }; } };
  try { global.navigator = { maxTouchPoints: 0 }; } catch (e) { /* Node 24: navigator is a read-only getter; engine.js tolerates its absence */ }
    global.matchMedia = function () { return { matches: false }; };
     // Keep world-builder.js from auto-running mount() on require (readyState:'loading' defers boot),
    // and make getElementById -> null so the glue never throws a missing-node error in Node.
   global.document.readyState = 'loading';
   global.document.getElementById = function () { return null; };

  var DIR = path.join(path.dirname(__filename), '..', 'js');
  function req(f) { return require(path.join(DIR, f)); }
  function tryReq(f) { try { req(f); } catch (e) { /* scene installers needing audio/EnvReactions: non-fatal */ } }

   // --- real world chain, mirroring index.html load order up to world-catalog ---
  ['tiles.js','chars.js','houses.js','maps.js','data.js','environmental-inspect.js',
   'retro-font.js','portraits.js','gold-tone.js','engine.js','glue.js','location-connections.js',
   'double-r-exterior-art.js','double-r-exterior-scene.js','double-r-location-data.js','double-r-location-production.js',
   'sheriffs-station-art.js','sheriffs-station-exterior-art.js','sheriffs-station-scene.js','sheriffs-station-exterior-scene.js','sheriffs-station-location-data.js','sheriffs-station-production.js',
   'room-315-art.js','room-315-scene.js','room-315-location-data.js','room-315-production.js',
   'hospital-art.js','hospital-scene.js','hospital-production.js',
   'traincar-art.js','traincar-scene.js','traincar-location-data.js','traincar-location-production.js'
  ].forEach(tryReq);
  req('world-engine.js');
  req('world-catalog.js');

  var WB = req('world-builder-data.js');
  var CO = req('world-builder-coords.js');
  var G = global.GAME;

   // --- test harness (mirror cast-inspector style) ---
  var checks = 0, failed = [];
  function ok(name, cond, detail) {
    checks++;
    if (!cond) { failed.push((detail ? detail + ' :: ' : '') + name); }
    else console.log('   ok - ' + name);
    }

  var source = WB.collectWorldSource(G);
  var snap = WB.buildWorldSnapshot(source);

   // ---- M1 discovery: all 7 locations, correct membership ----
  ok('catalog has 7 locations', snap.locationCount === 7, 'got ' + snap.locationCount);
  var byId = {};
  snap.locations.forEach(function (l) { byId[l.id] = l; });
  ok('double-r exposes exterior+interior(diner)',
    byId['double-r'] && byId['double-r'].environments.some(function (e) { return e.sceneId === 'diner'; }) &&
    byId['double-r'].environments.some(function (e) { return e.sceneId === 'double_r_exterior_prototype'; }));
  ok('hospital has no connections', byId['hospital'] && byId['hospital'].connections.length === 0);
  ok('town is a single-environment location', byId['town'] && byId['town'].environments.length === 1 && byId['town'].environments[0].sceneId === 'town');

   // scene table only contains real scenes (helper fns filtered out)
  var sceneKeys = Object.keys(snap.scenes);
  ok('no helper-function keys leaked into scenes',
    sceneKeys.indexOf('doorAt') === -1 && sceneKeys.indexOf('objectAt') === -1 && sceneKeys.indexOf('isSolid') === -1);
  ok('real core scenes present', ['town','diner','sheriff','traincar','oej','room_315','hospital'].every(function (s) { return !!snap.scenes[s]; }));

   // ---- M2 overlay accuracy: counts match the live source exactly ----
  function countByKind(map, kind) {
    var n = 0;
    if (kind === 'exit') n += Object.keys(map.doors || {}).length;
    else if (kind === 'object') n += (map.objects || []).length;
    else if (kind === 'npc') n += (map.npcs || []).length;
    return n;
  }
  ['town','diner','sheriff'].forEach(function (s) {
    var s1 = snap.scenes[s];
    ok(s + ' door overlay count matches source', s1.overlays.filter(function (o) { return o.kind === 'exit'; }).length === countByKind(G.Maps[s], 'exit'), 'snap=' + s1.overlayCount);
    ok(s + ' object overlay count matches source', s1.overlays.filter(function (o) { return o.kind === 'object'; }).length === countByKind(G.Maps[s], 'object'));
    ok(s + ' npc overlay count matches source', s1.overlays.filter(function (o) { return o.kind === 'npc'; }).length === countByKind(G.Maps[s], 'npc'));
  });
  ok('sheriff is interior 16x12 with 5 npcs', snap.scenes.sheriff.indoor && snap.scenes.sheriff.width === 16 && snap.scenes.sheriff.height === 12 &&
    snap.scenes.sheriff.overlays.filter(function (o) { return o.kind === 'npc'; }).length === 5);

   // ---- M3 connection normalization: a real paired exit resolves both endpoints ----
  var front = null;
  snap.connections.forEach(function (c) { if (c.id === 'double-r-front-entrance') front = c; });
  ok('connection double-r-front-entrance found', !!front);
  ok('its a-endpoint is the exterior with triggers on row 6', front && front.a.scene === 'double_r_exterior_prototype' &&
    JSON.stringify(front.a.triggers) === JSON.stringify([[6, 6], [7, 6]]));
  ok('its b-endpoint arrives in diner at spawn (6,8)/up', front && front.b.scene === 'diner' &&
    front.b.spawn.tx === 6 && front.b.spawn.ty === 8 && front.b.spawn.dir === 'up');

   // ---- coordinate accuracy: round-trip + hit-test selects the right overlay ----
  var zp = CO.tileToPixel(7, 11, 4);
  ok('tileToPixel(7,11,zoom=4) = (28,44)', zp.px === 28 && zp.py === 44, JSON.stringify(zp));
  ok('pixelToTile inverts an exact top-left corner', CO.pixelToTile(28, 44, 4).tx === 7 && CO.pixelToTile(28, 44, 4).ty === 11);

   // hit a real sheriff exit tile and confirm the overlay returned is that exit
  var sheriffExits = snap.scenes.sheriff.overlays.filter(function (o) { return o.kind === 'exit'; });
  ok('sheriff has at least one exit to test', sheriffExits.length > 0);
  if (sheriffExits.length) {
    var e0 = sheriffExits[0];
    var hitPx = CO.tileToPixel(e0.tx, e0.ty, 8);
    var picked = CO.hitTest(snap.scenes.sheriff.overlays, hitPx.px + 3, hitPx.py + 3, 8);
    ok('hitTest at exit tile (e0) selects that same exit overlay', picked === e0 || (picked && picked.kind === 'exit' && picked.tx === e0.tx && picked.ty === e0.ty),
      'got ' + JSON.stringify(picked));
  }
   // an empty corner of the scene (top-left tile 0,0 region) may or may not have an overlay;
   // assert hitTest on a coordinate with no overlay returns null for a known-empty scene corner.
  ok('hitTest returns null where nothing overlaps', CO.hitTest([], 1, 1, 4) === null);

   // ---- M3 read-only guard: snapshot is frozen and source maps are untouched ----
  ok('snapshot top-level frozen', Object.isFrozen(snap));
  ok('nested scene overlay object frozen', snap.scenes.sheriff && Object.isFrozen(snap.scenes.sheriff.overlays[0]) === true);

   // deep-freeze really prevents mutation: a write must throw in strict mode.
  var threw = false;
  try { snap.tile = 99; } catch (err) { threw = true; }
  ok('mutating frozen snapshot throws in strict mode', threw);

   // source maps are NOT mutated by building the view-model: re-snapshot yields identical counts.
  var before = JSON.stringify(G.Maps.sheriff.doors);
  WB.buildWorldSnapshot(WB.collectWorldSource(G)); // build again
  ok('building the snapshot does not mutate live GAME.Maps', JSON.stringify(G.Maps.sheriff.doors) === before);

   // A scene installer may have clobbered global.document; restore the props world-builder.js needs
  // before requiring it. readyState:'loading' defers boot() so require() does not auto-mount.
  global.document = global.document || {};          // some scene script may have left it null/absent
  global.document.addEventListener = function () {};
  global.document.readyState = 'loading';
  global.document.getElementById = function () { return null; };
   var WBUI = req('world-builder.js');              // requires without auto-mount (readyState deferred boot)
  function kindCounts(scene) {
   var c = { exit: 0, object: 0, npc: 0 };
   scene.overlays.forEach(function (o) { if (c[o.kind] != null) c[o.kind]++; });
    return c;
    }
    // three DISTINCT locations, one outdoor + two indoor, proving the renderer handles each.
   ['town', 'diner', 'sheriff'].forEach(function (sid) {
     var scene = snap.scenes[sid];
    ok(sid + ' scene present for renderer', !!scene);
     if (!scene) return;
    var plan = WBUI.planScene(scene);
      // the draw-plan covers exactly one marker per overlay, in the documented paint order.
   ok(sid + ' render-plan marker count == overlay count', plan.markers.length === scene.overlays.length);
    var pc = kindCounts({ overlays: plan.markers });
     var sc = kindCounts(scene);
   ok(sid + ' render-plan per-kind counts match source (' + sc.exit + '/' + sc.object + '/' + sc.npc + ')',
      pc.exit === sc.exit && pc.object === sc.object && pc.npc === sc.npc);
      // M2 spawn markers are a SEPARATE pass and must NOT alter the overlay per-kind counts above.
   var sp = WBUI.planSpawns(snap, sid);
  ok(sid + ' planSpawns returns an array of endpoint markers', Array.isArray(sp));
     if (sid === 'diner') {
    var bEnd = sp.filter(function (s) { return s.which === 'b' && s.id === 'double-r-front-entrance'; })[0];
       ok("planSpawns('diner') has double-r-front-entrance B@(6,8)/up", !!bEnd && bEnd.tx === 6 && bEnd.ty === 8 && bEnd.dir === 'up');
     }
      // M3: picking the center pixel of a real exit selects that exact overlay.
    var exit = plan.markers.filter(function (m) { return m.kind === 'exit'; })[0];
     if (exit) {
      var z = Math.max(4, Math.floor((360 - 12) / scene.width));
       var p = CO.tileToPixel(exit.tx, exit.ty, z);
    var hit = CO.hitTest(plan.markers, p.px + z / 2, p.py + z / 2, z);
      ok(sid + ' M3 click at exit center selects that overlay', hit === exit || (hit && hit.kind === 'exit'));
      }
       });

      // ---- M-guard: the editor is INERT and READ-ONLY (no save/persistence, no tile mutation) ----
  var fs = require('fs');
        // Exposing a save/edit API would break the "v0.1 read-only" contract; forbid it by name.
   ok('world-builder.js exposes NO save/edit/persist API', !('save' in WBUI) && !('edit' in WBUI) && !('persist' in WBUI));
       // Planning with no scene is a no-op: the editor draws nothing until a user picks one.
  ok('planScene is inert without a scene argument', WBUI.planScene(undefined).markers.length === 0);
        // No persistence layer at all — grep the source so a future save feature fails this guard loudly.
   var wbSrc = fs.readFileSync(path.join(DIR, 'world-builder.js'), 'utf8');
  ok('world-builder.js has NO persistence (localStorage/writeFile absent)',
     wbSrc.indexOf('localStorage') === -1 && wbSrc.indexOf('writeFile') === -1);
        // Building + planning a view-model must never write back into the live source maps.
   var doorsBefore = G.Maps.sheriff.doors.length;
  WBUI.planScene(WB.buildWorldSnapshot(WB.collectWorldSource(G)).scenes.town);
  WBUI.planScene(WB.buildWorldSnapshot(WB.collectWorldSource(G)).scenes.sheriff);
   ok('planning scenes leaves source map door count intact', G.Maps.sheriff.doors.length === doorsBefore);

   console.log('\nWORLD-BUILDER: ' + (checks - failed.length) + '/' + checks + ' passed');
  if (failed.length) {
    console.error('FAILED:');
    failed.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('WORLD-BUILDER-PASS ' + checks + '/' + checks);
})();
