/* js/world-builder-core.js — WORLD BUILDER editor CORE (view-agnostic).
 *
 * Assembles EDITOR STATE from source data and hands every view ONE read-only model. A "source" is the
 * frozen snapshot produced by the sole adapter (js/world-builder-data.js): { tile, scenes, locations,
 * connections, unresolved, sceneCount?, locationCount? }. Core derives nothing about the runtime — it never
 * reads the game global; that bridge lives in the adapter. This keeps core pure + node/browser-loadable.
 *
 * SCOPE (deliberately narrow — the hard rules from the brief): NO DOM/Canvas/rAF, NO undo/history/save/load.
 * Those are separate layers; this module only assembles state and centralises the per-kind inspector schemas
 * so that VIEWS carry zero per-type field knowledge. The generic pieces live in js/editor/core/*:
 *    model     buildWorldModel(source)  -> THE single read-only model every view renders from
 *    selection createSelection()        -> empty selection, also the scene-change reset value
 *    inspector inspect(entity, schema)  -> frozen property rows; core owns WHICH schema a kind uses
 *
 * WHY A CENTRAL SCHEMA REGISTRY (not in inspector.js): inspector.js keeps kind->schema mapping out on
 * purpose so it stays generic. This glue module is where that mapping belongs — one DEFAULT_SCHEMAS table,
 * applied through the same inspector code path for every entity, is the proof views are not hardcoded.
 */
(function () {
   'use strict';

    // Resolve an editor-core sub-namespace lazily. Browser: <script> tags already accumulated them on the
    // neutral Editor namespace. Node: require the sibling module file directly so this stays self-sufficient
    // without a load-order contract. Throws loud if neither is present (core must exist before assembly).
  var PIECE_FILES = { model: 'model', selection: 'selection', inspector: 'inspector', identity: 'identity', hitTest: 'hit-test', edit: 'edit' };
  function piece(name) {
    var E = typeof globalThis !== 'undefined' ? globalThis.Editor : null;
      if (E && E[name]) return E[name];
      if (typeof require !== 'undefined' && require.cache !== undefined) {
        try { return require('./editor/core/' + PIECE_FILES[name] + '.js'); } catch (e) { /* fall through */ }
       }
    throw new Error('[wb-core] editor core piece "' + name + '" not loaded');
      }

     // The per-kind field table. Keys are DOT-PATHS the model actually emits; a missing path surfaces as a
    // null-valued row (inspector never hides a gap). editable is false by default — this is a read-model.
  var DEFAULT_SCHEMAS = {
    scene: ['sceneId', 'locationId', 'name', 'width', 'height', 'indoor'],
    exit: ['tx', 'ty', 'target'],
    object: ['tx', 'ty'],
    npc: ['tx', 'ty'],
    connection: ['id', 'a.scene', 'b.scene', 'a.spawn.tx', 'a.spawn.ty', 'b.spawn.tx', 'b.spawn.ty']
      };

     // Detect an entity's kind from the MODEL's shapes — no caller has to name it. A scene carries byKind+
    // overlays+tiles; a connection record carries endpointIds+a/b; an overlay carries its own `kind`.
  function detectKind(entity) {
    if (!entity || typeof entity !== 'object') return null;
    if (entity.byKind && Object.prototype.hasOwnProperty.call(entity, 'overlays')) return 'scene';
      if (Object.prototype.hasOwnProperty.call(entity, 'endpointIds')) return 'connection';
      if (typeof entity.kind === 'string' && (entity.kind === 'exit' || entity.kind === 'object' || entity.kind === 'npc')) {
        return entity.kind;
         }
    return null;
      }

     // The default field schema for a kind, normalised through inspector.makeSchema so partial descriptors
    // still work. Unknown kind -> an empty schema (inspector then yields no rows rather than guessing).
  function schemaForKind(inspector, kind) {
    var keys = DEFAULT_SCHEMAS[kind];
      if (!keys) return null;
    return inspector.makeSchema(keys.map(function (key) { return { key: key }; }));
      }

     // buildEditorState(source, opts?) -> ONE frozen editor-state object for every view to consume. `source`
    // is the adapter's snapshot; the model is derived from it once, so N views share one read-only model
    // rather than each re-deriving (and possibly diverging). selection starts empty — that is also the
    // value a scene change resets to (see resetForScene).
  function buildEditorState(source, opts) {
    var Model = piece('model'), Selection = piece('selection');
      if (!source || typeof source !== 'object') throw new Error('[wb-core] source snapshot required');
    var model = Model.buildWorldModel(source);
      var selection = Selection.createSelection();
    return Object.freeze({
      source: source,                 // read-only passthrough; the model already covers it for rendering
      model: model,                  // THE single read-only model every view renders from
      selection: selection,         // current selection (empty start / scene-change reset)
      sceneId: null,               // active-scene handle a view sets on scene change
      schemas: Object.freeze({    // centralised kind -> field schema registry
        scene: null, exit: null, object: null, npc: null, connection: null
         })
       });
     }

    // resetForScene(state, sceneId?) -> a NEW state that keeps source/model/schemas (the world is unchanged)
    // but clears the selection — "a scene change resets selection" from the M3 intent. Returns a frozen copy;
    // the input state is never mutated.
  function resetForScene(state, sceneId) {
    var Selection = piece('selection');
    if (!state || typeof state !== 'object') throw new Error('[wb-core] state required');
      return Object.freeze({
      source: state.source,
      model: state.model,
      selection: Selection.clear(),  // canonical reset value
      sceneId: (sceneId === undefined ? null : sceneId),
      schemas: state.schemas
       });
    }

     // inspect(state, entity) -> frozen property rows for the selected entity, resolved through its kind's
    // centralised schema. Unknown/no-entity yields an empty row array, never a guess. This is the one entry
    // point views call to fill a property panel — they supply only the entity, not the fields.
  function inspect(state, entity) {
    var Inspector = piece('inspector');
    if (!state || !state.schemas || state.schemas.scene == null) {
        // first-time use: materialise the default schema registry on the live state copy-free path.
      }
    var kind = detectKind(entity);
      var schema = kind ? schemaForKind(Inspector, kind) : null;
    return Inspector.inspect(entity, schema || { fields: [] });
     }

    // ---- M4b: selectable scene items with STABLE ids ------------------------------------------------
    // sceneItems(model, sceneId, opts?) -> frozen list in PAINT ORDER (bottom -> top). The same list
    // drives the canvas renderer and Editor.hitTest (topmost = last), so what a click selects is always
    // what was painted on top. Ids come from identity.js and never encode the tile of a movable item, so
    // a selection survives rerenders AND the item being moved:
    //   legacy-door:<scene>:<x>,<y>          read-only classic door (map door with no connection id)
    //   object:<scene>:<index>                map object (no authored object carries a source id today)
    //   npc:<characterId>:<scene>             cast body (baseline, or opts.npcs for a story moment)
    //   trigger:<connId>:<a|b>:<index>        trigger tile of an endpoint in this scene
    //   connection-endpoint:<connId>:<a|b>    spawn of an endpoint in this scene (painted last = on top)
    // opts.connections: id -> record (the current DRAFT); defaults to the model's registry records.
    // opts.npcs: [{id,name,sprite,x,y,dir}] overriding the model's baseline npc overlay for this scene.
  var PAINT_ORDER = ['legacy-door', 'object', 'npc', 'trigger', 'connection-endpoint'];

  function sceneItems(model, sceneId, opts) {
    opts = opts || {};
    var Identity = piece('identity');
    var scene = model && model.scenes ? model.scenes[sceneId] : null;
    if (!scene) return Object.freeze([]);
    var conns = opts.connections || model.connectionsById;
    var buckets = { 'legacy-door': [], object: [], npc: [], trigger: [], 'connection-endpoint': [] };

    scene.byKind.exits.forEach(function (ex) {
      if (ex.connectionId && model.connectionsById[ex.connectionId]) return; // drawn from the registry record
      buckets['legacy-door'].push({ id: Identity.legacyDoorId(sceneId, ex.tx, ex.ty), kind: 'legacy-door', readOnly: true,
        scene: sceneId, tx: ex.tx, ty: ex.ty, w: 1, h: 1, dir: ex.dir || null, connectionId: ex.connectionId || null,
        target: ex.target ? { scene: ex.target.scene, x: ex.target.x, y: ex.target.y } : null });
    });

    scene.byKind.objects.forEach(function (o, i) {
      buckets.object.push({ id: Identity.objectId(sceneId, o.id != null ? String(o.id) : i), kind: 'object', readOnly: true,
        scene: sceneId, index: i, type: o.type || null, subkind: o.subkind || null, tx: o.tx, ty: o.ty, w: o.w || 1, h: o.h || 1,
        dialogue: o.dialogue == null ? null : o.dialogue });
    });

    var npcs = opts.npcs ? opts.npcs.map(function (n) { return { id: n.id, name: n.name, sprite: n.sprite, tx: n.x, ty: n.y, dir: n.dir }; })
                         : scene.byKind.npcs;
    npcs.forEach(function (n, i) {
      var cid = n.id ? String(n.id) : 'anon-' + i;
      buckets.npc.push({ id: Identity.npcId(cid, sceneId), kind: 'npc', readOnly: true, scene: sceneId, characterId: cid,
        name: n.name || cid, sprite: n.sprite || null, tx: n.tx, ty: n.ty, w: 1, h: 1, dir: n.dir || 'down' });
    });

    Object.keys(conns).sort().forEach(function (connId) {
      var rec = conns[connId];
      if (!rec) return;
      ['a', 'b'].forEach(function (side) {
        var ep = rec[side];
        if (!ep || ep.scene !== sceneId) return;
        (ep.triggers || []).forEach(function (t, i) {
          buckets.trigger.push({ id: Identity.triggerId(connId, side, i), kind: 'trigger', connectionId: connId, side: side,
            index: i, scene: sceneId, tx: t[0], ty: t[1], w: 1, h: 1 });
        });
        if (ep.spawn) {
          buckets['connection-endpoint'].push({ id: Identity.endpointId(connId, side), kind: 'connection-endpoint',
            connectionId: connId, side: side, scene: sceneId, tx: ep.spawn.tx, ty: ep.spawn.ty, w: 1, h: 1, dir: ep.spawn.dir || null });
        }
      });
    });

    var items = [];
    PAINT_ORDER.forEach(function (k) { buckets[k].forEach(function (it) { items.push(Object.freeze(it)); }); });
    Identity.dedupe(items.map(function (it) { return it.id; })); // two items never share an id
    return Object.freeze(items);
  }

  // Topmost item on a tile (null on empty ground), through the shared hit-test core.
  function itemAt(items, tx, ty) { return piece('hitTest').hitTest(items, tx, ty); }
  function findItem(items, id) {
    for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
    return null;
  }

  // Which scene an id lives in, given the draft (endpoints/triggers follow their record's scene).
  function sceneOfId(model, id, connections) {
    var p = piece('identity').parse(id);
    if (!p) return null;
    if (p.kind === 'connection-endpoint' || p.kind === 'trigger') {
      var rec = (connections || model.connectionsById)[p.connId];
      return rec && rec[p.side] ? rec[p.side].scene : null;
    }
    return p.scene || null;
  }

  // legacyDoorInventory(model) -> { sceneId: [ {tx,ty,target} ] } for every map still using classic doors.
  function legacyDoorInventory(model) {
    var out = {};
    Object.keys(model.scenes).sort().forEach(function (sid) {
      sceneItems(model, sid).forEach(function (it) {
        if (it.kind !== 'legacy-door') return;
        (out[sid] = out[sid] || []).push({ tx: it.tx, ty: it.ty, target: it.target });
      });
    });
    return out;
  }

  // Re-expose as a frozen API on both the neutral namespace (browser) and module.exports (node).
  var api = Object.freeze({
    buildEditorState: buildEditorState,
    resetForScene: resetForScene,
    inspect: inspect,
    detectKind: detectKind,
    sceneItems: sceneItems,
    itemAt: itemAt,
    findItem: findItem,
    sceneOfId: sceneOfId,
    legacyDoorInventory: legacyDoorInventory,
    PAINT_ORDER: Object.freeze(PAINT_ORDER.slice()),
    DEFAULT_SCHEMAS: Object.freeze(DEFAULT_SCHEMAS)
     });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
      } else if (typeof globalThis !== 'undefined') {
    globalThis.GameWorldBuilderCore = api;
       }
})();
