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

  // "double-r" -> "Double R", "sheriffs_station_exterior" -> "Sheriffs Station Exterior".
  function humanize(id) {
    var s = String(id || '').replace(/[_\-]+/g, ' ');
    return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // A connection record is a paired a/b exit. Normalize both endpoints to one shape so the
  // renderer can show "from scene X at trigger tiles -> arrive on scene Y at spawn".
  function normalizeConnection(record) {
    var out = {};
    if (record && record.a) {
      out.a = { endpoint: 'a', scene: record.a.scene, triggers: record.a.triggers || [],
                spawn: record.a.spawn ? { tx: record.a.spawn.tx, ty: record.a.spawn.ty, dir: record.a.spawn.dir } : null };
    }
    if (record && record.b) {
      out.b = { endpoint: 'b', scene: record.b.scene, triggers: record.b.triggers || [],
                spawn: record.b.spawn ? { tx: record.b.spawn.tx, ty: record.b.spawn.ty, dir: record.b.spawn.dir } : null };
    }
    return out;
  }

  // Overlays for one scene: exits (doors), interactive objects, and NPC home positions.
  // Each overlay carries only real fields plus a canonical {kind, tx, ty} the renderer /
  // hit-test rely on. w/h default to 1 so single-tile objects and multi-tile landmarks share
  // the same shape; landmark regions (town waterfall/cemetery) keep their real w/h.
  function sceneOverlays(map) {
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
        dialogue: o.dialogue || null
      }));
    });

    (map.npcs || []).forEach(function (n) {
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
      var overlays = sceneOverlays(map);
      scenesById[sceneId] = {
        sceneId: sceneId,
        name: humanize(sceneId),
        locationId: null, // filled below from the catalog
        width: map.width,
        height: map.height,
        indoor: !!map.indoor,
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
        connections: loc.connections || []
        };
      });

    var connectionsNorm = connections.map(function (rec) {
      var n = normalizeConnection(rec);
      return { id: rec.id, a: n.a, b: n.b };
      });

     // Deep-freeze the assembled tree in one pass. The renderer / inspector then get an
     // immutable view-model: a write to any overlay throws (strict mode), proving read-only.
    return freezeDeep({
      tile: tile,
      sceneCount: sceneIds.length,
      locationCount: locations.length,
      locations: locations,
      scenes: scenesById,
      connections: connectionsNorm
      });
  }

  // Browser entry point: pull the source straight out of the live GAME global. The four
  // *LocationConnections arrays are the only connection groups in the catalog today.
  function collectWorldSource(GAME) {
    var G = GAME || (typeof window !== 'undefined' && window.GAME) || {};
    var cats = [G.DoubleRLocationConnections, G.TraincarLocationConnections,
                G.SheriffsStationLocationConnections, G.Room315LocationConnections];
    var connections = [];
    cats.forEach(function (c) { if (Array.isArray(c)) connections = connections.concat(c); });
    return { maps: G.Maps || {}, catalog: (G.World && G.World.catalog) || { locations: [] },
             connections: connections, tile: TILE };
  }

  var api = { TILE: TILE, buildWorldSnapshot: buildWorldSnapshot, collectWorldSource: collectWorldSource };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.GAME = window.GAME || {}, window.GAME.WorldBuilderData = api;
})();
