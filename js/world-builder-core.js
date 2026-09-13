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
  var PIECE_FILES = { model: 'model', selection: 'selection', inspector: 'inspector' };
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

  // Re-expose as a frozen API on both the neutral namespace (browser) and module.exports (node).
  var api = Object.freeze({
    buildEditorState: buildEditorState,
    resetForScene: resetForScene,
    inspect: inspect,
    detectKind: detectKind,
    DEFAULT_SCHEMAS: Object.freeze(DEFAULT_SCHEMAS)
     });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
      } else if (typeof globalThis !== 'undefined') {
    globalThis.GameWorldBuilderCore = api;
       }
})();
