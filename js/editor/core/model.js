'use strict';

// EDITOR CORE — model. A pure in-memory world model built from the ADAPTED snapshot shape that
// js/world-builder-data.js#buildWorldSnapshot() produces — NOT from the live runtime global. It is
// the single object every editor view (renderer, hit-test, inspector) reads, so a drift between views
// is impossible: they all index this one tree.
//
// Snapshot contract consumed (see buildWorldSnapshot):
//   { tile, sceneCount, locationCount,
//     locations:[{id,name,environments:[{id,name,sceneId,indoor}],connections:[cid]}],
//     scenes:{[sceneId]:{sceneId,name,locationId,width,height,indoor,rows:string[]|null,
//                        overlayCount,overlays:[{kind:'exit'|'object'|'npc',tx,ty,w,h,...}]}},
//     connections:[{id,a:{endpoint,scene,triggers[],spawn|null},b:{...}}],
//     unresolved:[cid] }
//
// What this adds on top of the snapshot: (1) scene -> tiles (a 2D grid of semantic tile categories,
// mirroring world-builder-data#planBaseMap so overlay coords align with rendered tiles — BLOCKER 2);
// (2) overlays grouped by kind; (3) each connection record carrying STABLE endpoint/trigger ids from
// identity.js (3a) so a drag/select can refer to an endpoint without recomputing it; (4) a legacy-door
// classification, since map.doors predate the trigger/spawn records.

(function () {
  const R = globalThis.Editor || {};

   // Resolve identity lazily: in the browser the adapter loads identity.js first and attaches it to
   // Editor; standalone/node requires it directly. This keeps load order unimportant.
  function getIdentity() {
    if (R.identity) return R.identity;
    try { return require('./identity.js'); } catch (e) { throw new Error('[model] identity.js unavailable'); }
    }

   // Interpret a row of single-char tile codes into {cat,color} cells. Mirrors the data layer's
   // planBaseMap fallback so model + renderer agree on geometry: known code -> tile map entry, else a
   // hue derived from the char (stable per char) so unknown tiles are still deterministic.
  function cellFor(ch, tileMap) {
    if (!ch || ch === '.') return null; // open/empty floor renders nothing distinct
    const t = tileMap && tileMap[ch];
    if (t) return { cat: t.cat, color: t.color };
    let hue = 0; for (let i = 0; i < ch.length; i++) hue += ch.charCodeAt(i);
    return { cat: 'tile-' + ch, color: 'hsl(' + (hue % 360) + ',45%,42%)' };
   }

   // scene -> a grid of cells; rows may be null (scene with no map geometry yet). A row is a string in the
        // live world data (each row stored as one single-char-per-tile string); accept strings or arrays so
         // the model consumes that shape directly instead of demanding nested arrays.
     function tilesFor(scene, tileMap) {
       if (!scene || !scene.rows) return [];
       return scene.rows.map(function (row) {
         const cells = Array.isArray(row) ? row : Array.from(String(row));
         return cells.map(function (ch) { return cellFor(ch, tileMap); });
        });
      }

   // A legacy door: an exit overlay that is a pure coordinate jump — it either names no connection, or
   // its connection carries zero triggers on both ends. New authored connections always have triggers,
   // so this cleanly separates "old-style door" from "triggered endpoint".
  function isLegacyExit(exit, connectionsById) {
    if (!exit.connectionId) return true;
    const c = connectionsById[exit.connectionId];
    if (!c) return false; // unresolved id is surfaced separately, not treated as legacy
    const aEmpty = !c.a || (c.a.triggers || []).length === 0;
    const bEmpty = !c.b || (c.b.triggers || []).length === 0;
    return aEmpty && bEmpty;
   }

   // Build the model. Pure: it reads only `snapshot` and returns a frozen tree, mutating nothing.
  function buildWorldModel(snapshot, opts) {
    opts = opts || {};
    if (!snapshot || typeof snapshot !== 'object') throw new Error('[model] snapshot required');
    const Identity = getIdentity();
    const tileMap = snapshot.tile || {};

    // scenes -> scene models (tiles + overlays grouped by kind + legacy flag per exit).
    const rawConnById = {};
    (snapshot.connections || []).forEach(function (c) { rawConnById[c.id] = c; });

    const rawScenes = snapshot.scenes || {};
    const scenes = {};
    Object.keys(rawScenes).forEach(function (sceneId) {
      const s = rawScenes[sceneId];
      const byKind = { exits: [], objects: [], npcs: [] };
      (s.overlays || []).forEach(function (o) {
        if (o.kind === 'exit') { byKind.exits.push(o); }
        else if (o.kind === 'object') { byKind.objects.push(o); }
        else if (o.kind === 'npc') { byKind.npcs.push(o); }
       });
      scenes[sceneId] = Object.freeze({
        sceneId: s.sceneId,
        name: s.name || s.sceneId,
        locationId: s.locationId || null,
        width: s.width | 0,
        height: s.height | 0,
        indoor: !!s.indoor,
        tiles: Object.freeze(tilesFor(s, tileMap)),
        overlays: Object.freeze((s.overlays || []).slice()),
        byKind: Object.freeze({
          exits: Object.freeze(byKind.exits),
          objects: Object.freeze(byKind.objects),
          npcs: Object.freeze(byKind.npcs)
         })
      });
    });

    // legacy doors, collected across all scenes (the pre-trigger coordinate-jump mechanism).
    const legacyDoors = [];
    Object.keys(scenes).forEach(function (sceneId) {
      scenes[sceneId].byKind.exits.forEach(function (ex) {
        if (isLegacyExit(ex, rawConnById)) {
          legacyDoors.push(Object.freeze({ sceneId: sceneId, tx: ex.tx, ty: ex.ty, target: ex.target || null }));
        }
      });
    });

    // connection records enriched with stable endpoint/trigger ids (3a) — the referent a drag or
    // select addresses. Trigger ids are per-endpoint + index so the inspector can name "endpoint a's
    // 2nd trigger" unambiguously.
    const connectionsById = {};
    (snapshot.connections || []).forEach(function (c) {
      const aTriggers = c.a && c.a.triggers ? c.a.triggers : [];
      const bTriggers = c.b && c.b.triggers ? c.b.triggers : [];
       // triggerId encodes conn+side+index, so a's 0th and b's 0th are distinct selectable ids.
      const triggerIds = {
        a: aTriggers.map(function (_, i) { return Identity.triggerId(c.id, 'a', i); }),
        b: bTriggers.map(function (_, i) { return Identity.triggerId(c.id, 'b', i); })
       };
      connectionsById[c.id] = Object.freeze({
        id: c.id,
        one_way: c.one_way === true,
        a: c.a || null,
        b: c.b || null,
        endpointIds: Object.freeze({ a: Identity.endpointId(c.id, 'a'), b: Identity.endpointId(c.id, 'b') }),
        triggerIds: Object.freeze({ a: Object.freeze(triggerIds.a), b: Object.freeze(triggerIds.b) })
      });
    });

    const locationsById = {};
    (snapshot.locations || []).forEach(function (l) { locationsById[l.id] = l; });

    return Object.freeze({
      sceneCount: snapshot.sceneCount != null ? snapshot.sceneCount : Object.keys(scenes).length,
      locationCount: snapshot.locationCount != null ? snapshot.locationCount : Object.keys(locationsById).length,
      tileMap: Object.freeze(tileMap),
      scenes: Object.freeze(scenes),
      locationsById: Object.freeze(locationsById),
      connectionsById: Object.freeze(connectionsById),
      legacyDoors: Object.freeze(legacyDoors),
      unresolved: Object.freeze((snapshot.unresolved || []).slice())
    });
   }

   // ---- read accessors used by renderer / hit-test / inspector ----
  function scene(model, sceneId) { return model.scenes[sceneId] || null; }
  function location(model, id) { return model.locationsById[id] || null; }
  function connection(model, id) { return model.connectionsById[id] || null; }

   // The spawn tile an endpoint lands on within its own scene — the coordinate overlay must align to.
   // Returns {scene,tx,ty} or null when the side has no spawn (an arrival-only / trigger-only side).
  function endpointSpawn(model, connectionId, side) {
    const c = model.connectionsById[connectionId];
    if (!c) return null;
    const ep = c[side];
    if (!ep || !ep.spawn) return null;
    return { scene: ep.scene, tx: ep.spawn.tx, ty: ep.spawn.ty, dir: ep.spawn.dir || 'down' };
   }

  R.model = Object.freeze({ buildWorldModel, cellFor, tilesFor, isLegacyExit, scene, location, connection, endpointSpawn });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.model;
  return R.model;
})();
