/* world-builder-data.js — WORLD BUILDER v0.1 M1 (pure, no DOM).
 *
 * Read-only view-model built FROM the authoritative runtime data:
 *   - GAME.World.catalog            (locations + their environments + connection ids)
 *   - GAME.Maps[sceneId]           (width/height/indoor + doors/objects/npcs overlays)
 *   - GAME.{DoubleR,Traincar,SheriffsStation,Room315}LocationConnections (paired a/b exits)
 *
 * This is the only "editor model" that exists: it never invents world data and never
 * mutates any source — buildWorldSnapshot returns a deep-frozen structure so a renderer
 * or inspector can read overlay coordinates without the risk of writing tile data back.
 * Kept pure so Node tests exercise the same extraction the browser page uses (M3 accuracy).
 */
(function () {
  'use strict';

  var TILE = 16; // js/engine.js:19 — one grid tile is 16px on canvas; overlay coords are tile units.

  function freezeDeep(o) {
    if (o === null || typeof o !== 'object') return o;
    Object.keys(o).forEach(function (k) { freezeDeep(o[k]); });
     return Object.freeze(o);
   }

  // Deep structural copy of plain data (arrays/objects/primitives), returning a tree OWNED by the
   // caller. This is what makes the snapshot read-only without side effects: every nested value in
   // the snapshot is a fresh copy, so freezeDeep() below can never reach back and freeze an
   // authoritative source array (e.g. a connection's .triggers or an object's .dialogue). Functions
   // are dropped (the builder needs no behaviour), and cycles are not expected in authored world data.
  function clone(v) {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(clone);
    var out = {};
    Object.keys(v).forEach(function (k) { if (typeof v[k] !== 'function') out[k] = clone(v[k]); });
     return out;
   }


  // "double-r" -> "Double R", "sheriffs_station_exterior" -> "Sheriffs Station Exterior".
  function humanize(id) {
    var s = String(id || '').replace(/[_\-]+/g, ' ');
    return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // A connection record is a paired a/b exit. Normalize both endpoints to one shape so the
  // renderer can show "from scene X at trigger tiles -> arrive on scene Y at spawn".
  function normalizeConnection(record) {
    var out = {};
    if (record && record.one_way === true) out.one_way = true;
    if (record && record.a) {
      out.a = { endpoint: 'a', scene: record.a.scene, triggers: clone(record.a.triggers || []),
                spawn: record.a.spawn ? { tx: record.a.spawn.tx, ty: record.a.spawn.ty, dir: record.a.spawn.dir } : null };
    }
    if (record && record.b) {
      out.b = { endpoint: 'b', scene: record.b.scene, triggers: clone(record.b.triggers || []),
                spawn: record.b.spawn ? { tx: record.b.spawn.tx, ty: record.b.spawn.ty, dir: record.b.spawn.dir } : null };
    }
    return out;
  }

  // Overlays for one scene: exits (doors), interactive objects, and NPC home positions.
  // Each overlay carries only real fields plus a canonical {kind, tx, ty} the renderer /
  // hit-test rely on. w/h default to 1 so single-tile objects and multi-tile landmarks share
  // the same shape; landmark regions (town waterfall/cemetery) keep their real w/h.
  function sceneOverlays(map, sceneId) {
    var G = (typeof window !== 'undefined' && window.GAME) || (typeof globalThis !== 'undefined' && globalThis.GAME) || {};
    var overlays = [];

    Object.keys(map.doors || {}).forEach(function (key) {
      var d = map.doors[key];
      var coords = key.split(',');
      overlays.push(freezeDeep({
        kind: 'exit',
        connectionId: d.connectionId || null,
        tx: parseInt(coords[0], 10),
        ty: parseInt(coords[1], 10),
        target: { scene: d.to, x: d.tx, y: d.ty },
        dir: d.dir || 'down'
      }));
    });

    (map.objects || []).forEach(function (o) {
      overlays.push(freezeDeep({
        kind: 'object',
        type: o.type || null,
        subkind: o.kind || null,
        tx: o.x,
        ty: o.y,
            w: (o.w || 1),
             h: (o.h || 1),
          dialogue: o.dialogue == null ? null : clone(o.dialogue)
        }));
    });

    // Cast Presence v0.1 (2026-09-13): named-character bodies are no longer map
    // data (js/glue.js NPCS is empty). The builder shows the authored BASELINE
    // cast of the scene (GAME.CastPresence.bodiesFor(scene, null)); story
    // windows are not previewed here. Falls back to map.npcs when the resolver
    // or its data is not loaded.
    var castBodies = null;
    try {
      if (G.CastPresence && G.NarrativeData && G.NarrativeData.cast) castBodies = G.CastPresence.bodiesFor(sceneId, null);
    } catch (e) { castBodies = null; }
    (castBodies || map.npcs || []).forEach(function (n) {
      overlays.push(freezeDeep({
        kind: 'npc',
        id: n.id || null,
        name: n.name || n.id || null,
        sprite: n.sprite || null,
        tx: n.x,
        ty: n.y,
        dir: n.dir || 'down'
      }));
    });

    return overlays;
  }

  // Reverse-map a sceneId back to its catalog location (a scene belongs to exactly one).
  function buildWorldSnapshot(opts) {
    var o = opts || {};
    var maps = o.maps || {};
    var catalog = o.catalog || { locations: [] };
    var connections = o.connections || [];
    var tile = o.tile || TILE;

    // Only real scenes belong in the map table. Helper functions (doorAt/objectAt/isSolid)
    // leak into Object.keys(GAME.Maps); a scene must have numeric width/height to count.
    var sceneIds = Object.keys(maps).filter(function (id) {
      var m = maps[id];
      return m && typeof m.width === 'number' && typeof m.height === 'number';
    });

    var scenesById = {};
     // Build everything as PLAIN objects first; freeze only once, at the end. Freezing early
     // would make the back-fills below (locationId / overlayCount) throw in strict mode.
    sceneIds.forEach(function (sceneId) {
      var map = maps[sceneId];
      var overlays = sceneOverlays(map, sceneId);
      scenesById[sceneId] = {
        sceneId: sceneId,
        name: humanize(sceneId),
        locationId: null, // filled below from the catalog
          width: map.width,
          height: map.height,
          indoor: !!map.indoor,
           // rows are arrays of single-char tile strings; .slice() detaches the array while keeping the
           // immutable cell strings. The base-map renderer (BLOCKER 2) reads real geometry from here, and
            // freezeDeep never reaches a source row reference.
        rows: map.rows ? map.rows.slice() : null,
          overlayCount: overlays.length,
        overlays: overlays
        };
      });

    var locations = (catalog.locations || []).map(function (loc) {
      var environments = (loc.environments || []).map(function (env) {
        return {
          id: env.id,
          name: humanize(env.id),
          sceneId: env.sceneId,
            // indoor follows the live map when present; null if the scene isn't loaded yet.
          indoor: scenesById[env.sceneId] ? scenesById[env.sceneId].indoor : null
          };
        });
      environments.forEach(function (env) {
        if (scenesById[env.sceneId]) scenesById[env.sceneId].locationId = loc.id;
        });
      return {
        id: loc.id,
        name: humanize(loc.id),
         environments: environments,
         connections: clone(loc.connections || [])
         };
        });

    var connectionsNorm = connections.map(function (rec) {
      var n = normalizeConnection(rec);
      return { id: rec.id, a: n.a, b: n.b };
       });

     // Issue 7: every connection id the catalog exposes must resolve to exactly one authored record.
    // The builder cannot invent a connection, so any catalog id with no loaded record is surfaced here
    // (fail loud) instead of silently dropping it. A canonical connectionId->record registry is a
    // future architecture improvement; for now we detect the gap rather than hide it.
    var authoredIds = {}; connectionsNorm.forEach(function (c) { authoredIds[c.id] = true; });
     var unresolved = [];
    locations.forEach(function (loc) {
      loc.connections.forEach(function (cid) {
        if (!authoredIds[cid] && unresolved.indexOf(cid) === -1) unresolved.push(cid);
       });
       });

      // Deep-freeze the assembled tree in one pass. The renderer / inspector then get an
    // immutable view-model: a write to any overlay throws (strict mode), proving read-only.
    return freezeDeep({
      tile: tile,
      sceneCount: sceneIds.length,
      locationCount: locations.length,
      locations: locations,
      scenes: scenesById,
      connections: connectionsNorm,
      unresolved: unresolved
       });

  }

     // Browser entry point: pull the source straight out of the live GAME global.
     // Connection records now live in a SINGLE registry, GAME.WorldData.connections
     // (js/world-connections.gen.js, loaded by world-builder.html before this file) — so we READ one
     // authoritative frozen array instead of concatenating legacy per-location groups, which were deleted.
     // buildWorldSnapshot().unresolved still surfaces any catalog connection id with no loaded record, so
     // the builder can't silently drop a connection.
  function collectWorldSource(GAME) {
    var G = GAME || (typeof window !== 'undefined' && window.GAME) || {};
    var registry = (G.WorldData && Array.isArray(G.WorldData.connections)) ? G.WorldData.connections : null;
     if (!registry) throw new Error('collectWorldSource: GAME.WorldData.connections is missing — load js/world-connections.gen.js first');
    return { maps: G.Maps || {}, catalog: (G.World && G.World.catalog) || { locations: [] },
            connections: registry.slice(), tile: TILE };
     }

     // BLOCKER 2 — real geometry. Map rows are single-char-per-tile strings; this projects each cell to a
    // small semantic category+colour so Town/Diner/Sheriff read as DIFFERENT real layouts, not an empty
    // grid. Recognised chars use a fixed palette; any other char falls back to a stable hue by code point
     // so every tile still renders distinctly and deterministically (faithful, no invented art). Pure + node-testable.
  var TILE_CATEGORY = {
      T: { cat: 'tree', color: '#1f4d2b' }, '.': { cat: 'open', color: '#241f18' },
       g: { cat: 'grass', color: '#35603a' }, w: { cat: 'water', color: '#1d4e6b' },
        i: { cat: 'floor', color: '#7a6a53' }, f: { cat: 'floor', color: '#8a7860' },
         r: { cat: 'road', color: '#5a5148' }, D: { cat: 'door', color: '#caa04a' },
          d: { cat: 'door', color: '#b98a3a' }
       };
  function tileColorFor(ch) {
    var c = TILE_CATEGORY[ch];
     if (c) return { cat: c.cat, color: c.color };
     var hue = (ch.charCodeAt(0) * 47) % 360;
      return { cat: 'tile-' + ch, color: 'hsl(' + hue + ',45%,42%)' };
       }

    // Per-cell base-map plan for one scene, aligned to overlay tile units (cell.x == tx). Rendered UNDER overlays.
  function planBaseMap(scene) {
   if (!scene || !scene.rows) return { width: 0, height: 0, rows: [] };
   var out = [];
     scene.rows.forEach(function (row, y) {
       var cells = [];
        for (var x = 0; x < row.length; x++) {
         var c = tileColorFor(row.charAt(x));
          cells.push({ x: x, y: y, ch: row.charAt(x), cat: c.cat, color: c.color });
           }
       out.push(cells);
     });
   return { width: out.length ? out[0].length : 0, height: out.length, rows: out };
    }

  // adaptWorld(GAME) — THE ONLY game-aware bridge between the runtime and the editor core. Every editor-core
  // module is game-free by construction; this function is the single point where a live GAME becomes a
  // view-agnostic source, so no view ever reads the runtime global itself. The chain is one direction only:
  //   collectWorldSource(GAME)  -> buildWorldSnapshot's INPUT ({maps,catalog,connections,tile}); fails loud
  //                                if the connection registry is absent (the builder never invents a world).
  //   buildWorldSnapshot(source)-> the frozen view-model; its output IS buildWorldModel's input shape.
  //   Editor.model.buildWorldModel(snapshot) -> the ONE read-only model every view shares, resolved lazily
  //                                only when core is present. A runtime-only load (no core) still yields a
  //                                complete snapshot with model:null rather than throwing — the page can run.
  function adaptWorld(GAME) {
    var source = collectWorldSource(GAME);          // sole GAME read in the whole editor
    var snapshot = buildWorldSnapshot(source);       // existing api; counts/shape unchanged
    var model = null;
     try {
      var E = (typeof globalThis !== 'undefined') ? globalThis.Editor : null;
      var M = (E && E.model) || (typeof require !== 'undefined' ? require('./editor/core/model.js') : null);
       model = M ? M.buildWorldModel(snapshot) : null;
        } catch (e) { model = null; } // core absent in a runtime-only load: the snapshot stands alone.
    return Object.freeze({ source: source, snapshot: snapshot, model: model });
  }

  // ---- M4b game-aware helpers (still the ONLY place the editor touches the runtime) ----------------

  // storyStateFromSeed(GAME, seed) — a narrative state built exactly as test/cast-continuity-validate.js
  // stateFromSeed() does: fresh createState(), then flags/values/evidence/nodes_done merged, props cloned.
  function storyStateFromSeed(GAME, seed) {
    var G = GAME || {};
    if (!G.NarrativeRuntime || typeof G.NarrativeRuntime.createState !== 'function') throw new Error('storyStateFromSeed: NarrativeRuntime not loaded');
    var st = G.NarrativeRuntime.createState();
    ['flags', 'values', 'evidence', 'nodes_done'].forEach(function (k) { Object.assign(st[k], (seed && seed[k]) || {}); });
    if (seed && seed.props) st.props = JSON.parse(JSON.stringify(seed.props));
    return st;
  }

  // castForSeed(GAME, seed|null, castData?) -> frozen { sceneId: [{id,name,sprite,x,y,dir,source,owner}] } from
  // GAME.CastPresence.resolveCast(state). seed null = baseline (resolveCast(null)). castData (M7): the Builder's
  // draft copy of narrative/cast/windows.json, resolved by the same resolver through its opts.data.
  function castForSeed(GAME, seed, castData) {
    var G = GAME || {};
    if (!G.CastPresence || typeof G.CastPresence.resolveCast !== 'function') throw new Error('castForSeed: CastPresence not loaded');
    var all = G.CastPresence.resolveCast(seed ? storyStateFromSeed(G, seed) : null, castData ? { data: castData } : undefined);
    var out = {};
    Object.keys(all).sort().forEach(function (id) {
      var r = all[id];
      if (r.status !== 'PLACED') return;
      var b = r.body || {};
      (out[r.sceneId] = out[r.sceneId] || []).push({ id: id, name: b.name || id, sprite: b.sprite || null,
        x: r.x, y: r.y, dir: r.dir || 'down', source: r.source || null, owner: r.owner || null });
    });
    return freezeDeep(out);
  }

  // validationContext(GAME) -> the injected ctx for Editor.edit.validateDraft: real registry ids, real maps,
  // and GAME.LocationConnections' own validators so every message is the runtime's, verbatim.
  function validationContext(GAME) {
    var G = GAME || {};
    var LC = G.LocationConnections;
    if (!LC || typeof LC.validateConnection !== 'function') throw new Error('validationContext: LocationConnections not loaded');
    var ids = {};
    ((G.WorldData && G.WorldData.connections) || []).forEach(function (c) { ids[c.id] = true; });
    var maps = G.Maps || {};
    var locations = (G.World && G.World.catalog && G.World.catalog.locations) || [];
    var catalogIds = {};
    locations.forEach(function (loc) { (loc.connections || []).forEach(function (cid) { catalogIds[cid] = true; }); });
    return Object.freeze({
      knownIds: function (id) { return Object.prototype.hasOwnProperty.call(ids, id); },
      // M6 create/delete predicates — the same rules tools/world-apply.js enforces on disk
      catalogHasId: function (id) { return Object.prototype.hasOwnProperty.call(catalogIds, id); },
      sceneLocation: function (scene) {
        var hits = locations.filter(function (loc) { return (loc.environments || []).some(function (env) { return env.sceneId === scene; }); });
        return hits.length === 1 ? hits[0].id : null; // zero or several locations: the author has to fix the catalog
      },
      legacyDoorAt: function (scene, tx, ty) {
        var m = maps[scene], d = m && m.doors && m.doors[tx + ',' + ty];
        return !!(d && !d.connectionId);
      },
      sceneExists: function (scene) { var m = maps[scene]; return !!(m && typeof m.width === 'number'); },
      validateConnection: function (rec) { return LC.validateConnection(rec, maps); },
      validateEndpoint: function (side, ep, opts) {
        try { LC.validateEndpoint(side, ep, maps, opts); return null; }
        catch (e) { return String(e.message || e).replace(/^LocationConnections: /, ''); }
      }
    });
  }

  // castContext(GAME) -> the injected ctx for Editor.cast.placementErrors: real maps, the runtime's own collision
  // (GAME.Maps.isSolid with no clues held, the state the door validation assumes for spawns) and legacy map doors.
  // Registry trigger tiles come from the caller's connection draft (triggerAt), so a moved trigger counts at once.
  function castContext(GAME, triggerAt) {
    var G = GAME || {};
    var maps = G.Maps || {};
    if (typeof maps.isSolid !== 'function') throw new Error('castContext: GAME.Maps.isSolid not loaded');
    return Object.freeze({
      castData: (G.NarrativeData && G.NarrativeData.cast) || null,
      sceneExists: function (scene) { var m = maps[scene]; return !!(m && typeof m.width === 'number'); },
      isWalkable: function (scene, x, y) { return !maps.isSolid(scene, x, y, { clues: [] }); },
      doorAt: function (scene, x, y) {
        var id = triggerAt ? triggerAt(scene, x, y) : null;
        if (id) return 'trigger of ' + id;
        var d = maps[scene] && maps[scene].doors && maps[scene].doors[x + ',' + y];
        return d && !d.connectionId ? 'legacy map door' : null;
      }
    });
  }

  // objectsContext(GAME) -> the injected ctx for Editor.sceneObjects (M8): the registry (GAME.WorldData.sceneObjects),
  // real map sizes (only maps glue builds from js/maps.js carry registry objects), dialogue ids (GAME.Data.dialogues),
  // glue's interact table (INTERACT_DLG ids, sparkle flags) and the mission nodes the delete guard scans.
  function objectsContext(GAME) {
    var G = GAME || {};
    var reg = G.WorldData && G.WorldData.sceneObjects;
    if (!reg || !reg.scenes) throw new Error('objectsContext: GAME.WorldData.sceneObjects missing — load js/scene-objects.gen.js first');
    var maps = G.Maps || {}, source = (G.maps && G.maps.maps) || {};
    var dialogues = (G.Data && G.Data.dialogues) || {};
    var dlg = G.INTERACT_DLG || {}, sparkle = G.INTERACT_SPARKLE || {};
    return Object.freeze({
      registry: reg,
      missions: (G.NarrativeData && G.NarrativeData.missions) || {},
      sceneSize: function (scene) {
        var m = source[scene] && maps[scene];
        return m && typeof m.width === 'number' ? { width: m.width, height: m.height } : null;
      },
      dialogueExists: function (id) { return Object.prototype.hasOwnProperty.call(dialogues, id); },
      interactIdKnown: function (id) { return Object.prototype.hasOwnProperty.call(dlg, id); },
      interactIds: function () { return Object.keys(dlg).sort(); },
      resolveInteract: function (id) { return Object.prototype.hasOwnProperty.call(dlg, id) ? dlg[id] : id; },
      isSparkle: function (id) { return Object.prototype.hasOwnProperty.call(sparkle, id); }
    });
  }

  var api = { TILE: TILE, castContext: castContext, objectsContext: objectsContext, buildWorldSnapshot: buildWorldSnapshot, collectWorldSource: collectWorldSource,
                 planBaseMap: planBaseMap, tileColorFor: tileColorFor, clone: clone, adaptWorld: adaptWorld,
                 storyStateFromSeed: storyStateFromSeed, castForSeed: castForSeed, validationContext: validationContext };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') window.GAME = window.GAME || {}, window.GAME.WorldBuilderData = api;
})();
