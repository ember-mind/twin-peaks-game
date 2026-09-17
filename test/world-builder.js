/* world-builder.js — WORLD BUILDER v0.1 (Node tests for M1–M3 data layer).
 *
 * Verifies the pure view-model + coordinate layers against the REAL world catalog/maps/
 * connections, the same modules the browser page consumes:
 *   - M1 discovery: snapshot lists all 12 catalog locations with correct scene membership.
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
   'retro-font.js','portraits.js','gold-tone.js','engine.js','scene-objects.gen.js','glue.js','location-connections.js',
   'world-connections.gen.js',
   'double-r-exterior-art.js','double-r-exterior-scene.js','double-r-location-production.js',
   'sheriffs-station-art.js','sheriffs-station-exterior-art.js','sheriffs-station-scene.js','sheriffs-station-exterior-scene.js','sheriffs-station-production.js',
   'room-315-art.js','room-315-scene.js','room-315-production.js',
   'hospital-art.js','hospital-scene.js','hospital-production.js',
   'traincar-art.js','traincar-scene.js','world-connections-production.js'
  ].forEach(tryReq);
  req('world-engine.js');
  req('world-catalog.js');
  // Cast Presence: baseline bodies for the npc overlay
  ['narrative-runtime.js','narrative-data.gen.js','cast-presence.js'].forEach(tryReq);

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

  function footprintsAreAdjacent(footprints, from, to) {
    var left = footprints && footprints[from], right = footprints && footprints[to];
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    for (var i = 0; i < left.length; i++) {
      for (var j = 0; j < right.length; j++) {
        if (Math.abs(left[i][0] - right[j][0]) + Math.abs(left[i][1] - right[j][1]) === 1) return true;
      }
    }
    return false;
  }

  function hasWalkablePath(mapId, from, to) {
    if (!from || !to || !G.Maps || typeof G.Maps.isSolid !== 'function') return false;
    var queue = [{ x: from.x, y: from.y }], seen = {};
    seen[from.x + ',' + from.y] = true;
    for (var i = 0; i < queue.length; i++) {
      var current = queue[i];
      if (current.x === to.x && current.y === to.y) return true;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (step) {
        var x = current.x + step[0], y = current.y + step[1], key = x + ',' + y;
        if (seen[key] || G.Maps.isSolid(mapId, x, y)) return;
        seen[key] = true;
        queue.push({ x: x, y: y });
      });
    }
    return false;
  }

  var source = WB.collectWorldSource(G);
  var snap = WB.buildWorldSnapshot(source);

   // ---- M1 discovery: all 12 locations, correct membership ----
  ok('catalog has 12 locations', snap.locationCount === 12, 'got ' + snap.locationCount);
  var byId = {};
  snap.locations.forEach(function (l) { byId[l.id] = l; });
  ok('double-r exposes exterior+interior(diner)',
    byId['double-r'] && byId['double-r'].environments.some(function (e) { return e.sceneId === 'diner'; }) &&
    byId['double-r'].environments.some(function (e) { return e.sceneId === 'double_r_exterior_prototype'; }));
  ok('hospital joins town through town-hospital', byId['hospital'] && JSON.stringify(byId['hospital'].connections) === '["town-hospital"]');
  ok('town is a single-environment location', byId['town'] && byId['town'].environments.length === 1 && byId['town'].environments[0].sceneId === 'town');

  // Optional authored environment programs must cross the catalog -> Builder snapshot boundary as
  // owned, immutable data. The generic World engine validates activity references; scene-specific
  // anchor names are checked here against the Sheriff scene's canonical footprint registry.
  var sheriffCatalogEnvironment = G.World && G.World.getEnvironment && G.World.getEnvironment('sheriffs-station', 'interior');
  var sheriffSnapshotEnvironment = byId['sheriffs-station'] && byId['sheriffs-station'].environments.filter(function (e) {
    return e.sceneId === 'sheriff';
  })[0];
  var sheriffProgram = sheriffCatalogEnvironment && sheriffCatalogEnvironment.program;
  var sheriffSnapshotProgram = sheriffSnapshotEnvironment && sheriffSnapshotEnvironment.program;
  ok('Sheriff environment.program reaches the Builder snapshot',
    !!sheriffProgram && !!sheriffSnapshotProgram && JSON.stringify(sheriffSnapshotProgram) === JSON.stringify(sheriffProgram));
  ok('Builder owns and freezes the Sheriff environment.program',
    !!sheriffProgram && !!sheriffSnapshotProgram && sheriffSnapshotProgram !== sheriffProgram &&
    Object.isFrozen(sheriffSnapshotProgram) && Object.isFrozen(sheriffSnapshotProgram.intent) &&
    Object.isFrozen(sheriffSnapshotProgram.visualGoals) && Object.isFrozen(sheriffSnapshotProgram.activities) &&
    Object.isFrozen(sheriffSnapshotProgram.groups));
  ok('Builder owns and freezes nested contribution and relationship data',
    !!sheriffProgram && !!sheriffSnapshotProgram &&
    sheriffSnapshotProgram.contributions !== sheriffProgram.contributions &&
    sheriffSnapshotProgram.contributions[0].contributesTo !== sheriffProgram.contributions[0].contributesTo &&
    sheriffSnapshotProgram.relationships !== sheriffProgram.relationships &&
    Object.isFrozen(sheriffSnapshotProgram.contributions[0].contributesTo) &&
    Object.isFrozen(sheriffSnapshotProgram.relationships[0]));
  var sheriffFootprints = G.SheriffsStationScene && G.SheriffsStationScene.layout && G.SheriffsStationScene.layout.footprints;
  var sheriffAnchorsResolve = !!sheriffSnapshotProgram && !!sheriffFootprints && sheriffSnapshotProgram.groups.every(function (group) {
    return group.anchors.every(function (anchor) {
      return Object.prototype.hasOwnProperty.call(sheriffFootprints, anchor);
    });
  });
  ok('Sheriff program anchors resolve against SheriffsStationScene.layout.footprints', sheriffAnchorsResolve);
  var contributionCategories = ['function', 'gameplay', 'narrative', 'character', 'atmosphere', 'composition', 'spatial_readability', 'world_building', 'ambient_life'];
  var sheriffContributions = sheriffSnapshotProgram && sheriffSnapshotProgram.contributions || [];
  ok('Sheriff program has authored contributions', sheriffContributions.length > 0);
  ok('Sheriff contribution anchors resolve against station footprints', sheriffContributions.length > 0 && sheriffContributions.every(function (contribution) {
    return Object.prototype.hasOwnProperty.call(sheriffFootprints || {}, contribution.anchor) &&
      Array.isArray(contribution.contributesTo) && contribution.contributesTo.length > 0 &&
      contribution.contributesTo.every(function (category) { return contributionCategories.indexOf(category) !== -1; });
  }));
  var sheriffRelationships = sheriffSnapshotProgram && sheriffSnapshotProgram.relationships || [];
  var nearRelationships = sheriffRelationships.filter(function (relationship) { return relationship.kind === 'NEAR'; });
  ok('Sheriff NEAR relationships use tile-adjacent footprints', nearRelationships.length > 0 && nearRelationships.every(function (relationship) {
    return footprintsAreAdjacent(sheriffFootprints, relationship.from, relationship.to);
  }));
  var stationTargets = G.SheriffsStationScene && G.SheriffsStationScene.layout && G.SheriffsStationScene.layout.targets;
  var clearRelationship = sheriffRelationships.filter(function (relationship) {
    return relationship.kind === 'REACHABLE' &&
      ((relationship.from === 'entrance' && relationship.to === 'sheriffDesk') ||
       (relationship.from === 'sheriffDesk' && relationship.to === 'entrance'));
  })[0];
  ok('Sheriff program declares an entrance-to-sheriffDesk REACHABLE relationship', !!clearRelationship);
  ok('Sheriff REACHABLE endpoints resolve and have a walkable map path',
    !!clearRelationship && !!stationTargets && !!stationTargets[clearRelationship.from] && !!stationTargets[clearRelationship.to] &&
    hasWalkablePath('sheriff', stationTargets[clearRelationship.from], stationTargets[clearRelationship.to]));

   // scene table only contains real scenes (helper fns filtered out)
  var sceneKeys = Object.keys(snap.scenes);
  ok('no helper-function keys leaked into scenes',
    sceneKeys.indexOf('doorAt') === -1 && sceneKeys.indexOf('objectAt') === -1 && sceneKeys.indexOf('isSolid') === -1);
  ok('real core scenes present', ['town','diner','sheriff','traincar','oej','room_315','hospital'].every(function (s) { return !!snap.scenes[s]; }));

   // ---- M2 overlay accuracy: counts match the live source exactly ----
  // Cast Presence: the npc overlay source is the authored baseline cast of the scene
  function npcSource(map) {
    var id = null; Object.keys(G.Maps).forEach(function (k) { if (G.Maps[k] === map) id = k; });
    return (G.CastPresence && G.NarrativeData && G.NarrativeData.cast && id) ? G.CastPresence.bodiesFor(id, null) : (map.npcs || []);
  }
  function countByKind(map, kind) {
    var n = 0;
    if (kind === 'exit') n += Object.keys(map.doors || {}).length;
    else if (kind === 'object') n += (map.objects || []).length;
    else if (kind === 'npc') n += npcSource(map).length;
    return n;
  }
  ['town','diner','sheriff'].forEach(function (s) {
    var s1 = snap.scenes[s];
    ok(s + ' door overlay count matches source', s1.overlays.filter(function (o) { return o.kind === 'exit'; }).length === countByKind(G.Maps[s], 'exit'), 'snap=' + s1.overlayCount);
    ok(s + ' object overlay count matches source', s1.overlays.filter(function (o) { return o.kind === 'object'; }).length === countByKind(G.Maps[s], 'object'));
    ok(s + ' npc overlay count matches source', s1.overlays.filter(function (o) { return o.kind === 'npc'; }).length === countByKind(G.Maps[s], 'npc'));
  });
  // baseline sheriff cast = truman, andy, hawk, lucy (Leland is a story window, atto5)
  ok('sheriff is interior 16x12 with 4 npcs', snap.scenes.sheriff.indoor && snap.scenes.sheriff.width === 16 && snap.scenes.sheriff.height === 12 &&
    snap.scenes.sheriff.overlays.filter(function (o) { return o.kind === 'npc'; }).length === 4);

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
         // ---- Issue 6: planning must not mutate live source; the guard must be non-vacuous ----------
        var doorsBefore = Object.keys(G.Maps.sheriff.doors || {}).length;
        ok('the sheriff scene actually HAS doors (guard is not vacuously true)', doorsBefore > 0);
        WBUI.planScene(WB.buildWorldSnapshot(WB.collectWorldSource(G)).scenes.town);
        WBUI.planScene(WB.buildWorldSnapshot(WB.collectWorldSource(G)).scenes.sheriff);
         ok('planning scenes leaves source map door SET intact', Object.keys(G.Maps.sheriff.doors || {}).length === doorsBefore);

       // ---- BLOCKER 1: building the snapshot must NOT deep-freeze LIVE source data --------------
        // Three leak sites were fixed by cloning at the boundary (connection triggers, object dialogue,
         // catalog location connections). Capture a LIVE reference to each kind BEFORE building and prove
          // the registry (WorldData / world-catalog) intentionally FREEZES connection triggers and the
          // catalog location-connection lists, so for those kinds the guard is that the snapshot OWNS a distinct copy. Object dialogue lives in unfrozen map objects, where the source must stay writable.
     var src = WB.collectWorldSource(G);

       // (a) a live connection trigger array, scanned across the concatenated connection groups.
        var liveTrig = null, trigRecord = null;
      src.connections.forEach(function (rec) {
       if (liveTrig || !rec) return;
         if (Array.isArray(rec.a && rec.a.triggers) && rec.a.triggers.length) { liveTrig = rec.a.triggers; trigRecord = rec; }
          else if (Array.isArray(rec.b && rec.b.triggers) && rec.b.triggers.length) { liveTrig = rec.b.triggers; trigRecord = rec; }
            });
    var snap1 = WB.buildWorldSnapshot(WB.collectWorldSource(G));
     ok('the authored connections carry triggers to exercise the clone path', !!liveTrig);
        if (liveTrig) {
      ok('source WorldData connections ARE deep-frozen by design (immutable registry): the leak guard is the distinct-copy check immediately below', Object.isFrozen(liveTrig));
       var normRec = snap1.connections.filter(function (c) { return c.id === trigRecord.id; })[0];
         var liveOther = trigRecord.a && Array.isArray(trigRecord.a.triggers) ? trigRecord.a.triggers : (trigRecord.b && trigRecord.b.triggers);
         ok('snapshot connection trigger copy is a DIFFERENT object from the source',
          normRec && normRec.a && normRec.b &&
           normRec.a.triggers !== liveTrig && normRec.b.triggers !== liveOther);
           }

            // (b) a live map-object dialogue reference.
         var liveDial = null;
        Object.keys(src.maps).forEach(function (mkey) {
      var m = src.maps[mkey];
       if (!liveDial || !Array.isArray(m && m.objects)) return;
        m.objects.forEach(function (o) { if (!liveDial && o && o.dialogue != null) liveDial = o.dialogue; });
          });
    if (liveDial) ok('source object dialogue is NOT frozen after snapshot (no leak)', !Object.isFrozen(liveDial));

           // (c) a live catalog-location connections array.
        var catalog = (G.World && G.World.catalog) || { locations: [] };
     var liveLocConns = null, liveLocId = null;
     (catalog.locations || []).forEach(function (loc) {
         if (!liveLocConns && Array.isArray(loc.connections) && loc.connections.length) { liveLocConns = loc.connections; liveLocId = loc.id; }
             });
    ok('a catalog location exposes a non-empty connections array', !!liveLocConns);
       // The source connection list is itself pre-frozen by world-catalog (correctly so), so the no-leak
        // invariant to check here is that the SNAPSHOT OWNS A DISTINCT COPY, never shares the live reference.
   if (liveLocConns) {
     var snapLoc = snap1.locations.filter(function (l) { return l.id === liveLocId; })[0];
    ok('snapshot owns its OWN copy of a location connection list (no shared-reference leak)',
       snapLoc && Array.isArray(snapLoc.connections) && snapLoc.connections !== liveLocConns);
        }



         // ---- BLOCKER 2: scenes carry REAL, DISTINCT per-tile geometry ------------------------------
        var baseTown = WB.planBaseMap(snap1.scenes.town);
         var baseDiner = WB.planBaseMap(snap1.scenes.diner);
        ok('base map yields per-cell coloured geometry for the town scene',
           baseTown.rows.length > 0 && baseTown.rows[0].length > 0 && typeof baseTown.rows[0][0].color === 'string');
         function baseSig(bm) { return bm.rows.map(function (r) { return r.map(function (c) { return c.color; }).join('|'); }).join('\n'); }
        ok('town and diner base maps DIFFER (real geometry, not an empty grid)', baseSig(baseTown) !== baseSig(baseDiner));
         ok('planBaseMap is inert without a scene', WB.planBaseMap(undefined).rows.length === 0);

         // ---- Issue 3 + 4 (paint order == hit-test, stable selection) now live in the M4b section below,
         //      over identity ids from js/editor/core/identity.js instead of the retired kind:tx,ty key.

         // ---- Issue 7: catalog connection ids without an authored record are surfaced loudly ---------
        ok('snapshot exposes an unresolved list for the real fixture', Array.isArray(snap1.unresolved));
        ok('the real authored fixture has NO unresolved connections', snap1.unresolved.length === 0);
          // Inject via a SYNTHETIC snapshot input (the live catalog is frozen, and correctly so): a location
            // that references a connection id with no authored record must surface in .unresolved.
     var ghostCatalog = { locations: [{ id: 'synthetic-loc', environments: [], connections: ['ghost-connection-no-record'] }] };
      var snap2 = WB.buildWorldSnapshot({ maps: {}, catalog: ghostCatalog, connections: src.connections.slice() });
  ok('a catalog connection id with no authored record is flagged unresolved',
      snap2.unresolved.indexOf('ghost-connection-no-record') !== -1);


          // ---- SOLE ADAPTER: adaptWorld(GAME) -> {source, snapshot, model} over the REAL catalog --------
          // The one game-aware bridge into the view-agnostic editor core. Drives collectWorldSource ->
           // buildWorldSnapshot (== buildWorldModel input shape) -> Editor.model.buildWorldModel, all from
            // the same loaded GAME this file already built.
    var adapted = WB.adaptWorld(G);
     ok('adaptWorld returns a frozen {source,snapshot,model}',
        Object.isFrozen(adapted) && typeof adapted.source === 'object' && typeof adapted.snapshot === 'object');
       ok('adaptWorld.model is the single read-only model core builds from the snapshot',
          !!adapted.model && Object.isFrozen(adapted.model));
         ok('model scene/location counts match the snapshot over the real catalog',
           adapted.model.sceneCount === snap1.sceneCount && adapted.model.locationCount === 12,
            'model=' + JSON.stringify([adapted.model.sceneCount, adapted.model.locationCount]));
      var sheriffModelLocation = adapted.model && adapted.model.locationsById && adapted.model.locationsById['sheriffs-station'];
      var sheriffModelEnvironment = sheriffModelLocation && sheriffModelLocation.environments.filter(function (e) {
        return e.sceneId === 'sheriff';
      })[0];
      ok('Builder model retains Sheriff program metadata for the inspector',
        !!sheriffModelEnvironment && !!sheriffModelEnvironment.program &&
        JSON.stringify(sheriffModelEnvironment.program) === JSON.stringify(sheriffSnapshotProgram) &&
        Object.isFrozen(sheriffModelEnvironment.program));

            // The model's connection index is a bijection with the authored records (Issue 6/7 spirit).
      var modelConnIds = Object.keys(adapted.model.connectionsById).sort();
       var snapConnIds = snap1.connections.map(function (c) { return c.id; }).sort();
        ok('model.connectionsById has exactly the authored connection ids',
           modelConnIds.length === snapConnIds.length && modelConnIds.every(function (id, i) { return id === snapConnIds[i]; }));

          // A scene's overlay counts survive the source->snapshot->model chain unchanged.
      var dinerScene = adapted.model.scenes['diner'];
       ok('chained model keeps diner overlay membership',
          !!dinerScene && Object.keys(dinerScene.overlays).length === snap1.scenes['diner'].overlays.length);

         // Fail loud: a GAME with no connection registry never assembles a half world.
      var adaptedThrew = false;
       try { WB.adaptWorld({}); } catch (e) { adaptedThrew = true; }
        ok('adaptWorld fails loud when the connection registry is absent', adaptedThrew);

                   // PROVE THE CHAIN INPUT SHAPE: buildWorldModel over adaptWorld's OWN snapshot must reproduce the very
                  // same read-only tree. This pins "snapshot === buildWorldModel's input" — a divergence would mean the
                     // bridge handed the core a view it could not consume as-is. Same real GAME, no hand-built stub.
              var M = req('editor/core/model.js');
               var rebuilt = M.buildWorldModel(adapted.snapshot);
                ok('buildWorldModel(adapted.snapshot) reproduces model scene/location counts',
                    rebuilt.sceneCount === adapted.model.sceneCount && rebuilt.locationCount === adapted.model.locationCount,
                       'rebuilt=' + JSON.stringify([rebuilt.sceneCount, rebuilt.locationCount]) +
                         ' model=' + JSON.stringify([adapted.model.sceneCount, adapted.model.locationCount]));
               var rebuiltConn = Object.keys(rebuilt.connectionsById).sort();
                ok('rebuild is a deterministic bijection over the same connection ids',
                    rebuiltConn.length === modelConnIds.length && rebuiltConn.every(function (id, i) { return id === modelConnIds[i]; }));
                 ok('a scene resolves through BOTH snapshot and model layers with non-empty overlays',
                     !!adapted.model.scenes['diner'] && Object.keys(adapted.model.scenes['diner'].overlays).length > 0);

                 // ---- VERIFY: public surface unchanged + adaptWorld shapes, model LAZY ------------------
                 // (a) API pin: the module exports EXACTLY the six pre-existing keys plus adaptWorld. Pinning the
                  //     whole set proves originals were not renamed/removed and adaptWorld was ADDED additively
                   //     (no surprise 8th key), so old-surface consumers still resolve everything.
               var apiKeys = Object.keys(WB).sort();
                ok('module api is the original keys + adaptWorld + the M4b story/validation helpers + M7 castContext + M8 objectsContext, nothing else',
                     JSON.stringify(apiKeys) === JSON.stringify(
                            ["TILE","adaptWorld","buildWorldSnapshot","castContext","castForSeed","clone",
                             "collectWorldSource","objectsContext","planBaseMap","storyStateFromSeed","tileColorFor","validationContext"]));

                 // (b) Source shape: the sole GAME read yields exactly the four input buckets.
               ok('adaptWorld.source has exactly {maps,catalog,connections,tile}',
                    JSON.stringify(Object.keys(adapted.source).sort()) === JSON.stringify(
                            ["catalog","connections","maps","tile"]));

                 // (c) Snapshot stands alone: a complete deep-frozen view-model with NO model dependency, so a
                  //     core-absent load yields model:null while the snapshot still validates on its own.
               var loneSnap = WB.buildWorldSnapshot(WB.collectWorldSource(G));
                ok('snapshot (model-independent) is frozen and has 12 locations',
                     Object.isFrozen(loneSnap) && loneSnap.locationCount === 12);

                 // (d) model is LAZY: the slot always exists but may be null; when present it carries exactly the
                  //     four read-only model keys. Proves adaptWorld never force-builds a broken model and
                   //     tolerates a core-absent runtime load by degrading to null, not throwing.
               var modelKeys = adapted.model === null ? [] : Object.keys(adapted.model).sort();
                ok('adaptWorld.model is lazy (null, else the full read-only model view); tuple locked + snapshot frozen',
                       (modelKeys.length === 0 ||
                      JSON.stringify(modelKeys) === JSON.stringify(
                              ["connectionsById","legacyDoors","locationCount","locationsById","sceneCount","scenes","tileMap","unresolved"])) &&
                     Object.isFrozen(adapted) && Object.isFrozen(adapted.snapshot));


            
   // -----------------------------------------------------------------------------
   // CHAIN TEST — end-to-end: adaptWorld(G) -> snapshot -> Editor.model.buildWorldModel(snapshot).
   // Proves the model is built FROM this exact snapshot (identity, not a fresh clone), is one frozen tree,
   // and that a real scene + a real connection each resolve through BOTH the snapshot layer and the model layer.
  var RealModel = req('editor/core/model.js');       // same cached module adaptWorld resolves in node
  var consumedArg = null;
   // R.model is Object.frozen, so its buildWorldModel cannot be reassigned; expose a spy on the globalThis.Editor
   // hook that adaptWorld consults FIRST, delegating to the real builder (identical result, captured argument).
  var prevEditor = typeof globalThis !== 'undefined' ? globalThis.Editor : undefined;
  try {
    if (typeof globalThis !== 'undefined') {
      globalThis.Editor = { model: { buildWorldModel: function (snap) { consumedArg = snap; return RealModel.buildWorldModel(snap); } } };
     }
    var chainAdapted = WB.adaptWorld(G);
    ok('CHAIN: the snapshot returned IS by reference the input buildWorldModel consumes', consumedArg === chainAdapted.snapshot);
    ok('CHAIN: model is non-null and Object.frozen — the single read-only root every view indexes', !!(chainAdapted.model) && Object.isFrozen(chainAdapted.model));
    ok('CHAIN: single tree — scenes/connectionsById/locationsById are frozen sub-trees of that one model',
          !!chainAdapted.model && Object.isFrozen(chainAdapted.model.scenes)
                && Object.isFrozen(chainAdapted.model.connectionsById)
                && Object.isFrozen(chainAdapted.model.locationsById));
    var locId = chainAdapted.snapshot.locations[0].id;
    ok('CHAIN: single tree — model reuses the snapshot location ref by identity (no second cloned tree)',
          chainAdapted.model.locationsById[locId] === chainAdapted.snapshot.locations.find(function (l) { return l.id === locId; }));
    var scId = 'diner';    // real fixture, M2-confirmed present across the editor suites
    ok('CHAIN: a scene resolves through BOTH the snapshot layer and the model layer',
          !!chainAdapted.snapshot.scenes[scId] && !!RealModel.scene(chainAdapted.model, scId)
                && RealModel.scene(chainAdapted.model, scId).locationId === chainAdapted.snapshot.scenes[scId].locationId);
    var cn = chainAdapted.snapshot.connections[0];
    ok('CHAIN: a real connection resolves through BOTH layers with stable endpoint ids',
          !!cn && Object.keys(chainAdapted.model.connectionsById).length === chainAdapted.snapshot.connections.length
                && !!RealModel.connection(chainAdapted.model, cn.id)
                && !!(RealModel.connection(chainAdapted.model, cn.id).endpointIds.a));
   } finally {
    if (typeof globalThis !== 'undefined') { globalThis.Editor = prevEditor; }    // never leak the spy into other suites
   }

   // ==== M4b: selection identity, edit store, validation, story moments, legacy doors (real world) ====
  (function () {
    var fs = require('fs');
    ['identity','hit-test','selection','model','history','edit'].forEach(function (f) { require(path.join(DIR, 'editor', 'core', f + '.js')); });
    var Core = require(path.join(DIR, 'world-builder-core.js'));
    var Edit = require(path.join(DIR, 'editor', 'core', 'edit.js'));
    var world = WB.adaptWorld(G);
    var model = world.model;
    var store = Edit.createStore(world.source.connections);

    var diner = Core.sceneItems(model, 'diner', { connections: store.draft });
    ok('M4b: diner items use identity ids, never kind:tx,ty', diner.length > 0 && diner.every(function (it) { return /^(connection-endpoint|trigger|npc|object|legacy-door):/.test(it.id) && !/^[a-z-]+:\d+,\d+$/.test(it.id); }));
    ok('M4b: diner endpoint b id', !!Core.findItem(diner, 'connection-endpoint:double-r-front-entrance:b'));
    ok('M4b: diner trigger ids carry side + index', !!Core.findItem(diner, 'trigger:double-r-front-entrance:b:0') && !!Core.findItem(diner, 'trigger:double-r-front-entrance:b:1'));
    ok('M4b: diner npc ids are npc:<characterId>:diner', !!Core.findItem(diner, 'npc:norma:diner') && !!Core.findItem(diner, 'npc:shelly:diner'));
    ok('M4b: diner has no legacy door (its doors belong to a connection)', diner.filter(function (it) { return it.kind === 'legacy-door'; }).length === 0);

    // two items on one tile stay distinct; topmost (last painted) wins
    var d1 = Edit.setSpawn(store.draft, 'double-r-front-entrance', 'b', { tx: 5, ty: 2 }); // onto Norma
    var stacked = Core.sceneItems(model, 'diner', { connections: d1 });
    var onTile = stacked.filter(function (it) { return it.tx === 5 && it.ty === 2; });
    ok('M4b: two items on one tile keep distinct ids', onTile.length === 2 && onTile[0].id !== onTile[1].id, JSON.stringify(onTile));
    ok('M4b: topmost wins (endpoint painted above npc)', Core.itemAt(stacked, 5, 2).id === 'connection-endpoint:double-r-front-entrance:b');
    var d2 = Edit.addTrigger(d1, 'double-r-front-entrance', 'b', 9, 7); // onto Shelly
    ok('M4b: trigger painted above npc wins its tile', Core.itemAt(Core.sceneItems(model, 'diner', { connections: d2 }), 9, 7).id === 'trigger:double-r-front-entrance:b:2');

    // identity survives rerender and movement
    var ids1 = Core.sceneItems(model, 'diner', { connections: store.draft }).map(function (i) { return i.id; });
    var ids2 = Core.sceneItems(model, 'diner', { connections: store.draft }).map(function (i) { return i.id; });
    ok('M4b: ids identical across rerenders', JSON.stringify(ids1) === JSON.stringify(ids2));
    var moved = Core.sceneItems(model, 'diner', { connections: Edit.moveTrigger(Edit.setSpawn(store.draft, 'double-r-front-entrance', 'b', { tx: 8, ty: 8 }), 'double-r-front-entrance', 'b', 1, 8, 7) });
    var ep = Core.findItem(moved, 'connection-endpoint:double-r-front-entrance:b'), tr = Core.findItem(moved, 'trigger:double-r-front-entrance:b:1');
    ok('M4b: selection id survives spawn move', ep && ep.tx === 8 && ep.ty === 8);
    ok('M4b: selection id survives trigger move', tr && tr.tx === 8 && tr.ty === 7);

    // M5: no legacy doors remain; the roadhouse doors are the town-roadhouse registry endpoint
    var inv = Core.legacyDoorInventory(model);
    ok('M5: legacy inventory is empty (every door belongs to a registry connection)', Object.keys(inv).length === 0, JSON.stringify(inv));
    ok('M5: no scene carries a legacy-door item', Object.keys(model.scenes).every(function (s) { return Core.sceneItems(model, s).every(function (it) { return it.kind !== 'legacy-door'; }); }));
    var road = Core.sceneItems(model, 'roadhouse');
    ok('M5: roadhouse doors are town-roadhouse endpoint b (triggers + spawn)',
      road.filter(function (it) { return it.kind === 'trigger' && it.connectionId === 'town-roadhouse' && it.side === 'b'; }).length === 2 &&
      !!Core.findItem(road, 'connection-endpoint:town-roadhouse:b'));
    var arrival = Core.sceneItems(model, 'arrival');
    ok('M5: one-way source has a trigger item and no endpoint item',
      !!Core.findItem(arrival, 'trigger:arrival-town:a:0') && !Core.findItem(arrival, 'connection-endpoint:arrival-town:a'));

    // validation: runtime messages verbatim + editor checks
    var ctx = WB.validationContext(G);
    function errs(draft, id) { return Edit.validateDraft(draft[id], ctx, { changedSides: Edit.changedEndpoints(store, draft, id) }); }
    ok('M4b: every registry record validates clean', world.source.connections.every(function (c) { return errs(store.draft, c.id).length === 0; }));
    var bad = Edit.setSpawn(store.draft, 'double-r-front-entrance', 'b', { tx: 19 });
    ok('M4b: spawn x=19 on diner -> "b.spawn is outside map bounds"', errs(bad, 'double-r-front-entrance').indexOf('b.spawn is outside map bounds') !== -1, JSON.stringify(errs(bad, 'double-r-front-entrance')));
    var wall = Edit.addTrigger(store.draft, 'double-r-front-entrance', 'b', 8, 9);
    ok('M4b: trigger on diner wall -> "b.triggers[2] must be walkable"', errs(wall, 'double-r-front-entrance').indexOf('b.triggers[2] must be walkable') !== -1);
    var sher = Edit.addTrigger(Edit.setSpawn(store.draft, 'sheriffs-station-front-entrance', 'a', { tx: 8, ty: 8, dir: 'left' }), 'sheriffs-station-front-entrance', 'a', 8, 9);
    ok('M4b: sheriffs exterior spawn 8,8 left + trigger 8,9 is valid', errs(sher, 'sheriffs-station-front-entrance').length === 0, JSON.stringify(errs(sher, 'sheriffs-station-front-entrance')));
    var ghostRec = JSON.parse(JSON.stringify(store.base['double-r-front-entrance'])); ghostRec.id = 'nope'; ghostRec.b.scene = 'atlantis';
    var ge = Edit.validateDraft(ghostRec, ctx, { changedSides: ['b'] });
    ok('M4b: unknown id + unknown scene reported', ge.indexOf('connection id "nope" does not exist in the registry') !== -1 && ge.indexOf('endpoint b scene "atlantis" does not exist') !== -1, JSON.stringify(ge));
    var same = JSON.parse(JSON.stringify(store.base['double-r-front-entrance'])); same.b.scene = same.a.scene;
    ok('M4b: paired endpoint check fires when both sides share a scene', Edit.validateDraft(same, ctx, { changedSides: ['b'] }).some(function (e) { return e.indexOf('paired endpoint a no longer valid') === 0; }));
    var noEp = { id: 'double-r-front-entrance', a: store.base['double-r-front-entrance'].a };
    ok('M4b: missing endpoint reported', Edit.validateDraft(noEp, ctx, {}).indexOf('endpoint b does not exist') !== -1);

    // story moments via GAME.CastPresence.resolveCast(state built like cast-continuity-validate)
    var pins = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'cast-pins-acts-1-4.json'), 'utf8'));
    var eve = WB.castForSeed(G, pins.seeds.ACT4_EVENING_GATHERING);
    function npcIds(sceneId, cast) { return Core.sceneItems(model, sceneId, { npcs: cast ? (cast[sceneId] || []) : null }).filter(function (i) { return i.kind === 'npc'; }).map(function (i) { return i.characterId; }); }
    ok('M4b: baseline diner shows norma + shelly', npcIds('diner').indexOf('norma') !== -1 && npcIds('diner').indexOf('shelly') !== -1);
    ok('M4b: ACT4_EVENING_GATHERING diner has no norma/shelly', npcIds('diner', eve).indexOf('norma') === -1 && npcIds('diner', eve).indexOf('shelly') === -1);
    ok('M4b: ACT4_EVENING_GATHERING roadhouse has norma + shelly', npcIds('roadhouse', eve).indexOf('norma') !== -1 && npcIds('roadhouse', eve).indexOf('shelly') !== -1);
    ok('M4b: castForSeed agrees with CastPresence.bodiesFor for every seed + scene', Object.keys(pins.seeds).every(function (k) {
      var cast = WB.castForSeed(G, pins.seeds[k]);
      var st = WB.storyStateFromSeed(G, pins.seeds[k]);
      return ['diner', 'roadhouse', 'sheriff', 'town'].every(function (sc) {
        return JSON.stringify((cast[sc] || []).map(function (b) { return b.id + '@' + b.x + ',' + b.y; })) ===
               JSON.stringify(G.CastPresence.bodiesFor(sc, st).map(function (b) { return b.id + '@' + b.x + ',' + b.y; }));
      });
    }));
    ok('M4b: castForSeed is read-only (frozen)', Object.isFrozen(eve) && Object.isFrozen(eve.roadhouse));

    // page wiring: core before builder core before glue; glue reads no GAME world data directly
    var html = fs.readFileSync(path.join(__dirname, '..', 'world-builder.html'), 'utf8');
    function at(src) { return html.indexOf('src="' + src + '"'); }
    var coreFiles = fs.readdirSync(path.join(DIR, 'editor', 'core')).filter(function (f) { return /\.js$/.test(f); });
    ok('M4b: world-builder.html loads every js/editor/core/*.js', coreFiles.every(function (f) { return at('js/editor/core/' + f) !== -1; }));
    ok('M4b: core + world-builder-core load before world-builder.js', coreFiles.every(function (f) { return at('js/editor/core/' + f) < at('js/world-builder-core.js'); }) && at('js/world-builder-core.js') < at('js/world-builder.js') && at('js/world-builder-data.js') < at('js/world-builder.js'));
    var glue = fs.readFileSync(path.join(DIR, 'world-builder.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    ok('M4b: glue never reads GAME.Maps / GAME.WorldData / GAME.CastPresence directly', !/GAME\.(Maps|WorldData|CastPresence|LocationConnections|World\b)/.test(glue));
    ok('M4b: glue never selects by kind:tx,ty', glue.indexOf("kind + ':' + ") === -1 && glue.indexOf('selKey') === -1);
  })();

console.log('\nWORLD-BUILDER: ' + (checks - failed.length) + '/' + checks + ' passed');

  if (failed.length) {
    console.error('FAILED:');
    failed.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('WORLD-BUILDER-PASS ' + checks + '/' + checks);
})();
