'use strict';

// EDITOR CORE — props. WORLD BUILDER M10b: the instances of world/props.json, a flat map id -> placement
// { propId, sceneId, tx, ty, ox?, oy?, flipX?, layer? }. Game-free: the per-scene canvas, the atlas sizes and the
// map sizes are injected by the caller (js/world-builder-data.js in the page, tools/world-apply.js on disk), the
// way scene-objects.js takes sceneSize / dialogueExists.
//
// What moves here: an instance's anchor (tx, ty), its pixel nudge (ox, oy) and its flipX. What is created: an
// instance of a definition already in the registry. What is deleted: any instance (the caller may still refuse a
// delete whose id is referenced elsewhere — tools/world-apply.js does). DEFINITIONS STAY HAND-EDITED: nothing here
// creates, changes or deletes one, and a changeset that names one is refused by the apply side.
//
// Store: base / draft are frozen maps id -> instance. Drafts are replaced, never mutated; a deleted instance is
// absent from the draft, a created one is a key the base does not have.
//
// Changeset (version 2), the format tools/world-apply.js already accepts:
//   { format: 'props-changeset', version: 2, target: 'world/props.json', operations: [
//       { op: 'create', id, instance: {...} }   a new instance; the id must be free
//       { op: 'upsert', id, instance: {...} }   a moved / nudged / flipped instance (propId and sceneId never change)
//       { op: 'delete', id } ] }
//
// Validation is split with tools/world-apply.js: every rule that needs only the registry plus injected sizes lives
// here (definitionErrors / instanceErrors / sceneErrors / draftErrors), and the tool calls this file instead of
// owning a second copy. What stays there is what needs the disk or the booted game: reading the PNG header, the
// duplicate-key text scan, the Roadhouse locks, and the door / interact / Cast Presence footprint warnings.

(function () {
  const R = globalThis.Editor || {};

  const FORMAT = 'props-changeset';
  const TARGET = 'world/props.json';
  const VERSION = 2;
  const TILE = 16;
  const LAYER_MIN = 0;
  const LAYER_MAX = 9;
  const DEFINITION_KEYS = ['label', 'atlas', 'frame', 'anchor', 'footprint', 'defaultLayer', 'tags', 'transforms'];
  const INSTANCE_KEYS = ['propId', 'sceneId', 'tx', 'ty', 'ox', 'oy', 'flipX', 'layer'];
  // The fields an editor may change on an existing instance; propId and sceneId are identity (delete and create).
  const MOVABLE = ['tx', 'ty', 'ox', 'oy', 'flipX', 'layer'];
  const TRANSFORMS = ['flipX'];
  // The layer above which an instance never interleaves with the actors (js/props-production.js ACTOR_LAYER). The
  // inspector says so; nothing here enforces it, because the runtime owns the draw order. Three bands mirror the
  // runtime exactly: layer < ACTOR_LAYER -> below every actor, == ACTOR_LAYER -> interleaved by foot y,
  // > ACTOR_LAYER -> above every actor.
  const ACTOR_LAYER = 6;
  const BANDS = Object.freeze({
    BELOW_ACTORS: 'below the actors',
    ACTOR_BAND: 'interleaves with the actors',
    ABOVE_ACTORS: 'above the actors'
  });
  const PROP_ID = /^[a-z0-9]+(\.[a-z0-9]+)+$/;
  const INSTANCE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  function fail(msg) { throw new Error('[props] ' + msg); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isInt(n) { return Number.isInteger(n); }
  function sameJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function freezeDeep(v) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.freeze(v);
      Object.keys(v).forEach(function (k) { freezeDeep(v[k]); });
    }
    return v;
  }

  function requireRegistry(data) {
    if (!data || typeof data !== 'object' || data.version !== 1) fail('registry version must be 1 (world/props.json)');
    ['scenes', 'definitions', 'instances'].forEach(function (k) {
      if (!data[k] || typeof data[k] !== 'object' || Array.isArray(data[k])) fail('registry.' + k + ' must be an object');
    });
  }

  // createPropStore(registry) -> frozen { data, base, draft }
  function createPropStore(data) {
    requireRegistry(data);
    const base = {};
    Object.keys(data.instances).forEach(function (id) { base[id] = clone(data.instances[id]); });
    freezeDeep(base);
    return Object.freeze({ data: data, base: base, draft: base });
  }

  // Only the keys the schema knows, in schema order, so a draft entry and a written entry are the same bytes.
  function normalize(inst) {
    const out = {};
    INSTANCE_KEYS.forEach(function (k) { if (inst[k] !== undefined) out[k] = inst[k]; });
    return out;
  }
  function withEntry(draft, id, next) {
    const out = Object.assign({}, draft);
    if (next === null) delete out[id]; else out[id] = freezeDeep(next);
    return Object.freeze(out);
  }
  function entryOf(draft, id) {
    if (!has(draft, id)) fail('no instance "' + id + '" in the draft');
    return draft[id];
  }
  function definitionOf(store, propId) {
    const d = store.data.definitions[propId];
    if (!d) fail('definition "' + propId + '" is not in world/props.json (definitions stay hand-edited)');
    return d;
  }
  // tx/ty are tiles but land on whole scene pixels: the registry refuses anything finer than 1/16 of a tile.
  function toPixelTile(v, what) {
    const n = Number(v);
    if (!Number.isFinite(n)) fail(what + ' must be a finite number, got ' + JSON.stringify(v));
    if (Math.abs(n * TILE - Math.round(n * TILE)) > 0) fail(what + ' must land on a whole pixel (a multiple of 1/' + TILE + ' tile), got ' + n);
    return n;
  }
  function toOffset(v, what) {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    if (!isInt(n)) fail(what + ' must be an integer pixel offset, got ' + JSON.stringify(v));
    return n === 0 ? undefined : n;
  }

  // suggestInstanceId(store, draft, propId) -> a free kebab-case id derived from the definition ("roadhouse.chair.red"
  // -> "roadhouse-chair-01"). Stem: the first two dotted parts, which is how every seeded id reads (the third part is
  // the variant, and two variants of one prop share the numbering).
  function suggestInstanceId(store, draft, propId) {
    const parts = String(propId || 'prop').split('.').filter(Boolean);
    const stem = parts.slice(0, 2).join('-').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'prop';
    const taken = function (id) { return has(draft, id) || has(store.base, id); };
    for (let n = 1; ; n++) {
      const id = stem + '-' + (n < 10 ? '0' + n : String(n));
      if (!taken(id)) return id;
    }
  }

  // placeProp(store, draft, spec) -> a draft carrying one NEW instance. spec: { id, propId, sceneId, tx, ty, ox?, oy?,
  // flipX?, layer? }. The id must be free in base AND draft, so a created id can never shadow a deleted one.
  function placeProp(store, draft, spec) {
    if (!spec || typeof spec !== 'object') fail('placeProp needs a spec { id, propId, sceneId, tx, ty }');
    const id = spec.id;
    if (typeof id !== 'string' || !INSTANCE_ID.test(id)) fail('instance id must be kebab-case (a-z, 0-9, dashes), got ' + JSON.stringify(id));
    if (has(draft, id) || has(store.base, id)) fail('instance id "' + id + '" already exists');
    const def = definitionOf(store, spec.propId);
    if (!store.data.scenes[spec.sceneId]) fail('scene "' + spec.sceneId + '" has no canvas in ' + TARGET + ' (adding a scene stays hand-authored)');
    const inst = { propId: spec.propId, sceneId: spec.sceneId, tx: toPixelTile(spec.tx, 'tx'), ty: toPixelTile(spec.ty, 'ty') };
    const ox = toOffset(spec.ox, 'ox'), oy = toOffset(spec.oy, 'oy');
    if (ox !== undefined) inst.ox = ox;
    if (oy !== undefined) inst.oy = oy;
    if (spec.flipX) {
      if ((def.transforms || []).indexOf('flipX') === -1) fail('transform flipX is not allowed by ' + spec.propId);
      inst.flipX = true;
    }
    if (spec.layer !== undefined && spec.layer !== null && spec.layer !== '') {
      const layer = Number(spec.layer);
      if (!isInt(layer) || layer < LAYER_MIN || layer > LAYER_MAX) fail('layer must be an integer ' + LAYER_MIN + '..' + LAYER_MAX + ', got ' + JSON.stringify(spec.layer));
      if (layer !== def.defaultLayer) inst.layer = layer;
    }
    return withEntry(draft, id, normalize(inst));
  }

  function moveProp(draft, id, tx, ty) {
    const inst = entryOf(draft, id);
    return withEntry(draft, id, normalize(Object.assign({}, inst, { tx: toPixelTile(tx, 'tx'), ty: toPixelTile(ty, 'ty') })));
  }

  // nudgeProp(draft, id, ox, oy) -> the sub-anchor pixel offset. 0 drops the field, so a nudge and back is the base
  // entry again, byte for byte.
  function nudgeProp(draft, id, ox, oy) {
    const inst = entryOf(draft, id);
    const next = Object.assign({}, inst);
    const x = toOffset(ox, 'ox'), y = toOffset(oy, 'oy');
    if (x === undefined) delete next.ox; else next.ox = x;
    if (y === undefined) delete next.oy; else next.oy = y;
    return withEntry(draft, id, normalize(next));
  }

  // flipProp(store, draft, id) -> toggles flipX, refusing a definition that does not allow the transform. flipX is
  // present only when true (the registry rule), so a flip back deletes the field.
  function flipProp(store, draft, id) {
    const inst = entryOf(draft, id);
    const def = definitionOf(store, inst.propId);
    const next = Object.assign({}, inst);
    if (inst.flipX) delete next.flipX;
    else {
      if ((def.transforms || []).indexOf('flipX') === -1) fail('transform flipX is not allowed by ' + inst.propId + ' (transforms: ' + JSON.stringify(def.transforms || []) + ')');
      next.flipX = true;
    }
    return withEntry(draft, id, normalize(next));
  }

  function deleteProp(draft, id) {
    entryOf(draft, id);
    return withEntry(draft, id, null);
  }

  // revertEntry(store, draft, id) -> that one instance back to base (removed if it was created here)
  function revertEntry(store, draft, id) {
    const b = store.base[id];
    if (!b) {
      if (!has(draft, id)) return draft;
      return withEntry(draft, id, null);
    }
    if (has(draft, id) && sameJson(draft[id], b)) return draft;
    return withEntry(draft, id, b);
  }

  // revertScene(store, draft, sceneId) -> every instance of that scene back to base, created ones dropped
  function revertScene(store, draft, sceneId) {
    let out = draft;
    Object.keys(draft).forEach(function (id) { if (draft[id].sceneId === sceneId) out = revertEntry(store, out, id); });
    Object.keys(store.base).forEach(function (id) { if (store.base[id].sceneId === sceneId) out = revertEntry(store, out, id); });
    return out;
  }

  // changes(store, draft) -> [{ op, id, before, after }]: base order first (upsert / delete), then created ids by id.
  function changes(store, draft) {
    const out = [];
    Object.keys(store.base).forEach(function (id) {
      const b = store.base[id], d = draft[id];
      if (!has(draft, id)) out.push({ op: 'delete', id: id, before: b, after: null });
      else if (!sameJson(b, d)) out.push({ op: 'upsert', id: id, before: b, after: d });
    });
    Object.keys(draft).sort().forEach(function (id) {
      if (!has(store.base, id)) out.push({ op: 'create', id: id, before: null, after: draft[id] });
    });
    return out;
  }

  function buildPropsChangeset(store, draft) {
    const operations = changes(store, draft).map(function (c) {
      if (c.op === 'delete') return { op: 'delete', id: c.id };
      return { op: c.op, id: c.id, instance: clone(c.after) };
    });
    return freezeDeep({ format: FORMAT, version: VERSION, target: TARGET, operations: operations });
  }

  // registryWithDraft(store, draft) -> a world/props.json object for the draft. Key order matches what
  // tools/world-apply.js writes for the same changeset (base order, created ids appended in operation order), so the
  // Builder's preview and the file on disk are the same bytes.
  function registryWithDraft(store, draft) {
    const instances = {};
    Object.keys(store.data.instances).forEach(function (id) { if (has(draft, id)) instances[id] = clone(draft[id]); });
    Object.keys(draft).sort().forEach(function (id) { if (!has(store.base, id)) instances[id] = clone(draft[id]); });
    return { version: store.data.version, scenes: clone(store.data.scenes), definitions: clone(store.data.definitions), instances: instances };
  }

  // ---- geometry the UI needs (the same arithmetic js/props-production.js draws with) ---------------------------
  // originOf(def, inst) -> the draw origin in scene pixels. tx/ty name the ANCHOR, so a flip keeps it in place.
  function originOf(def, inst) {
    const f = def.frame, a = def.anchor;
    const ax = inst.flipX ? f[2] - a[0] : a[0];
    return { left: Math.round(inst.tx * TILE) - ax + (inst.ox || 0), top: Math.round(inst.ty * TILE) - a[1] + (inst.oy || 0) };
  }
  // instanceTiles(def, inst) -> the map tiles the footprint claims (anchor tile + each offset)
  function instanceTiles(def, inst) {
    const ax = Math.floor(inst.tx), ay = Math.floor(inst.ty);
    return (def.footprint || []).map(function (c) { return [ax + c[0], ay + c[1]]; });
  }
  // layerOf(def, inst) -> the effective draw layer (instance override, else the definition's default)
  function layerOf(def, inst) { return inst.layer === undefined ? def.defaultLayer : inst.layer; }
  // bandOf(layer) -> the actor-relative draw band label for that layer (same arithmetic as the runtime)
  function bandOf(layer) {
    return layer < ACTOR_LAYER ? BANDS.BELOW_ACTORS : layer > ACTOR_LAYER ? BANDS.ABOVE_ACTORS : BANDS.ACTOR_BAND;
  }

  // hitTest(store, draft, sceneId, px, py) -> the id of the topmost instance whose frame covers the scene pixel, or
  // null. Topmost is the reverse of the draw order js/props-production.js uses: layer, then foot y, then id.
  function hitTest(store, draft, sceneId, px, py) {
    const list = [];
    Object.keys(draft).forEach(function (id) {
      const inst = draft[id];
      if (inst.sceneId !== sceneId) return;
      const def = store.data.definitions[inst.propId];
      if (!def) return; // a missing definition is a validation error; never hit-test a guess
      const o = originOf(def, inst);
      if (px < o.left || py < o.top || px >= o.left + def.frame[2] || py >= o.top + def.frame[3]) return;
      list.push({ id: id, layer: layerOf(def, inst), foot: Math.round(inst.ty * TILE) });
    });
    list.sort(function (a, b) { return (a.layer - b.layer) || (a.foot - b.foot) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
    return list.length ? list[list.length - 1].id : null;
  }

  // overlaps(store, draft) -> [{ tile: 'x,y', sceneId, ids: [] }]: two footprints claiming one tile. A warning for the
  // inspector, never an error — the seeded registry has none, but a designer may want one deliberately.
  function overlaps(store, draft) {
    const claimed = {};
    Object.keys(draft).forEach(function (id) {
      const inst = draft[id], def = store.data.definitions[inst.propId];
      if (!def) return;
      instanceTiles(def, inst).forEach(function (t) {
        const k = inst.sceneId + ' ' + t[0] + ',' + t[1];
        (claimed[k] = claimed[k] || []).push(id);
      });
    });
    return Object.keys(claimed).filter(function (k) { return claimed[k].length > 1; }).sort().map(function (k) {
      const parts = k.split(' ');
      return { sceneId: parts[0], tile: parts[1], ids: claimed[k].slice().sort() };
    });
  }

  // ---- validation ---------------------------------------------------------------------------------------------
  // ctx injects what the core cannot know:
  //   ctx.atlasSize(path)  -> { width, height } | null   (null: unknown here — the caller reports a missing file)
  //   ctx.mapSize(sceneId) -> { width, height } in TILES | null   (null: the scene is not a map)
  // Every message is prefixed with its registry path ("instances.<id>: …"), so tools/world-apply.js prepends
  // "INVALID " and prints exactly what it printed before the split.

  function sceneErrors(ctx, sceneId, sc) {
    const errs = [], at = 'scenes.' + sceneId;
    if (!sc || typeof sc !== 'object' || Object.keys(sc).join(',') !== 'canvas') {
      errs.push(at + ' must carry exactly { canvas }');
      return errs;
    }
    if (!Array.isArray(sc.canvas) || sc.canvas.length !== 2 || !sc.canvas.every(function (n) { return isInt(n) && n > 0 && n % TILE === 0; })) {
      errs.push(at + '.canvas must be [w, h], positive whole tiles of ' + TILE + 'px');
      return errs;
    }
    if (ctx && typeof ctx.mapSize === 'function') {
      const map = ctx.mapSize(sceneId);
      if (!map) errs.push(at + ' is not a map in js/maps.js');
      else if (sc.canvas[0] < map.width * TILE || sc.canvas[1] < map.height * TILE) {
        errs.push(at + '.canvas ' + sc.canvas.join('x') + ' is smaller than the map (' + (map.width * TILE) + 'x' + (map.height * TILE) + ')');
      }
    }
    return errs;
  }

  function definitionErrors(ctx, id, d) {
    const errs = [], at = 'definitions.' + id;
    if (!PROP_ID.test(id)) errs.push(at + ': definition id must be dotted lowercase (e.g. roadhouse.chair.red)');
    if (!d || typeof d !== 'object') { errs.push(at + ' is not an object'); return errs; }
    Object.keys(d).forEach(function (k) { if (DEFINITION_KEYS.indexOf(k) === -1) errs.push(at + ' has unknown field "' + k + '"'); });
    DEFINITION_KEYS.forEach(function (k) { if (d[k] === undefined) errs.push(at + ' is missing "' + k + '"'); });
    if (typeof d.label !== 'string' || !d.label) errs.push(at + '.label must be a non-empty string');
    if (typeof d.atlas !== 'string' || !/^assets\/[A-Za-z0-9_./-]+\.png$/.test(d.atlas || '')) errs.push(at + '.atlas must be an assets/… .png path');
    const f = d.frame;
    const frameOk = Array.isArray(f) && f.length === 4 && f.every(isInt) && f[0] >= 0 && f[1] >= 0 && f[2] > 0 && f[3] > 0;
    if (!frameOk) errs.push(at + '.frame must be [x, y, w, h] integers with w, h > 0');
    const a = d.anchor;
    if (!Array.isArray(a) || a.length !== 2 || !a.every(isInt)) errs.push(at + '.anchor must be [x, y] integers');
    else if (frameOk && (a[0] < 0 || a[0] > f[2] || a[1] < 0 || a[1] > f[3])) errs.push(at + '.anchor ' + a.join(',') + ' falls outside its own frame ' + f[2] + 'x' + f[3]);
    if (!Array.isArray(d.footprint) || !d.footprint.every(function (c) { return Array.isArray(c) && c.length === 2 && c.every(isInt); })) {
      errs.push(at + '.footprint must be an array of [dx, dy] integer pairs (empty for wall/ceiling decoration)');
    }
    if (!isInt(d.defaultLayer) || d.defaultLayer < LAYER_MIN || d.defaultLayer > LAYER_MAX) {
      errs.push(at + '.defaultLayer must be an integer ' + LAYER_MIN + '..' + LAYER_MAX);
    }
    if (!Array.isArray(d.tags) || !d.tags.length || !d.tags.every(function (t) { return typeof t === 'string' && INSTANCE_ID.test(t); })) {
      errs.push(at + '.tags must be a non-empty array of kebab-case tags');
    }
    if (!Array.isArray(d.transforms) || !d.transforms.every(function (t) { return TRANSFORMS.indexOf(t) !== -1; })) {
      errs.push(at + '.transforms may only list ' + TRANSFORMS.join(', '));
    }
    if (frameOk && typeof d.atlas === 'string' && ctx && typeof ctx.atlasSize === 'function') {
      // `at` is passed so a caller that reads the file (tools/world-apply.js) can name the definition in its own
      // "atlas does not exist" problem; a caller that already has the images (the Builder) ignores it.
      const size = ctx.atlasSize(d.atlas, at);
      if (size && (f[0] + f[2] > size.width || f[1] + f[3] > size.height)) {
        errs.push(at + '.frame [' + f.join(', ') + '] falls outside atlas ' + d.atlas + ' (' + size.width + 'x' + size.height + ')');
      }
    }
    return errs;
  }

  // instanceErrors(ctx, data, id, inst) -> everything wrong with one placement. `data` carries the definitions and the
  // scene canvases the instance is checked against (the store's registry, or the draft's registryWithDraft).
  function instanceErrors(ctx, data, id, inst) {
    const errs = [], at = 'instances.' + id;
    if (!INSTANCE_ID.test(id)) errs.push(at + ': instance id must be kebab-case');
    if (!inst || typeof inst !== 'object') { errs.push(at + ' is not an object'); return errs; }
    Object.keys(inst).forEach(function (k) { if (INSTANCE_KEYS.indexOf(k) === -1) errs.push(at + ' has unknown field "' + k + '"'); });
    const d = data.definitions[inst.propId];
    if (!d) { errs.push(at + ': missing definition "' + inst.propId + '"'); return errs; }
    if (typeof inst.sceneId !== 'string' || !data.scenes[inst.sceneId]) {
      errs.push(at + ': scene "' + inst.sceneId + '" has no canvas in ' + TARGET);
      return errs;
    }
    ['tx', 'ty'].forEach(function (k) {
      const v = inst[k];
      if (typeof v !== 'number' || !Number.isFinite(v)) errs.push(at + '.' + k + ' must be a finite number, got ' + JSON.stringify(v));
      else if (Math.abs(v * TILE - Math.round(v * TILE)) > 0) {
        errs.push(at + '.' + k + ' must land on a whole pixel (a multiple of 1/' + TILE + ' tile), got ' + v);
      }
    });
    ['ox', 'oy'].forEach(function (k) { if (inst[k] !== undefined && !isInt(inst[k])) errs.push(at + '.' + k + ' must be an integer pixel offset'); });
    if (inst.layer !== undefined && (!isInt(inst.layer) || inst.layer < LAYER_MIN || inst.layer > LAYER_MAX)) {
      errs.push(at + '.layer must be an integer ' + LAYER_MIN + '..' + LAYER_MAX);
    }
    if (inst.flipX !== undefined) {
      if (inst.flipX !== true) errs.push(at + '.flipX is present only when true');
      else if ((d.transforms || []).indexOf('flipX') === -1) errs.push(at + ': transform flipX is not allowed by ' + inst.propId + ' (transforms: ' + JSON.stringify(d.transforms) + ')');
    }
    const canvas = data.scenes[inst.sceneId].canvas;
    if (Array.isArray(canvas) && Number.isFinite(inst.tx) && Number.isFinite(inst.ty)) {
      if (inst.tx < 0 || inst.ty < 0 || inst.tx * TILE > canvas[0] || inst.ty * TILE > canvas[1]) {
        errs.push(at + ': tx,ty ' + inst.tx + ',' + inst.ty + ' falls outside ' + inst.sceneId + ' (' + (canvas[0] / TILE) + 'x' + (canvas[1] / TILE) + ' tiles)');
      }
    }
    return errs;
  }

  // registryErrors(ctx, data) -> every scene / definition / instance problem of a whole registry, in file order.
  // This is the pass tools/world-apply.js runs (propsShapeProblems) minus what needs the disk.
  function registryErrors(ctx, data) {
    const errs = [];
    Object.keys(data.scenes).forEach(function (s) { sceneErrors(ctx, s, data.scenes[s]).forEach(function (e) { errs.push(e); }); });
    Object.keys(data.definitions).forEach(function (id) { definitionErrors(ctx, id, data.definitions[id]).forEach(function (e) { errs.push(e); }); });
    Object.keys(data.instances).forEach(function (id) { instanceErrors(ctx, data, id, data.instances[id]).forEach(function (e) { errs.push(e); }); });
    return errs;
  }

  // draftErrors(ctx, store, draft) -> { '<scene>': [errors] } for every instance that differs from base. Grouped by
  // scene the way scene-objects.js groups by scene, so the Builder can show a scene's problems next to its canvas.
  function draftErrors(ctx, store, draft) {
    const data = registryWithDraft(store, draft);
    const out = {};
    Object.keys(draft).forEach(function (id) {
      const b = store.base[id];
      if (b && sameJson(b, draft[id])) return;
      const errs = instanceErrors(ctx, data, id, draft[id]);
      if (!errs.length) return;
      const scene = typeof draft[id].sceneId === 'string' ? draft[id].sceneId : '?';
      (out[scene] = out[scene] || []).push.apply(out[scene], errs);
    });
    Object.keys(out).forEach(function (scene) {
      out[scene] = out[scene].filter(function (e, i) { return out[scene].indexOf(e) === i; });
    });
    return out;
  }

  R.props = Object.freeze({
    FORMAT, TARGET, VERSION, TILE, LAYER_MIN, LAYER_MAX, ACTOR_LAYER, BANDS, DEFINITION_KEYS, INSTANCE_KEYS, MOVABLE, TRANSFORMS,
    PROP_ID, INSTANCE_ID,
    createPropStore, suggestInstanceId, placeProp, moveProp, nudgeProp, flipProp, deleteProp, revertEntry, revertScene,
    changes, buildPropsChangeset, registryWithDraft,
    originOf, instanceTiles, layerOf, bandOf, hitTest, overlaps,
    sceneErrors, definitionErrors, instanceErrors, registryErrors, draftErrors
  });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.props;
})();
