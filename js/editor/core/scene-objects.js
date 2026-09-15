'use strict';

// EDITOR CORE — scene objects. WORLD BUILDER M8: the entries of world/scene-objects.json, per scene an ordered
// objects[] (each with a kebab-case sourceId) and an ordered interact map "x,y" -> interact id. Game-free: scene
// sizes, dialogue ids, interact ids and mission nodes are injected by the caller (js/world-builder-data.js in the
// page, tools/world-apply.js on disk).
//
// What moves here: an object's origin (x, y) and, for a rect (an object that carries w and h), its size; an
// interact key's tile. What is created: an object of a kind already present in the registry with a dialogue id,
// and an interact key with an interact id the caller knows. What is deleted: any entry, unless a mission node
// references its dialogue (the caller refuses). Dialogue cascades, types, kinds and interact ids of existing
// entries are data the editor copies untouched; conditions stay hand-edited.
//
// Store: base / draft are frozen maps scene -> { objects: [entry], interact: [{ ref, x, y, id }] }. An interact
// entry's ref is its base key ("13,5") or "new-<n>" for a created one, so its identity survives a move. Drafts are
// replaced, never mutated.
//
// Changeset (version 1):
//   { format: 'scene-objects-changeset', version: 1, target: 'world/scene-objects.json', operations: [
//       { op: 'upsert', scene, sourceId, object: {...} }          moved / resized object (only x, y, w, h differ)
//       { op: 'create', scene, sourceId, object: {...} }          appended to the scene's objects[]
//       { op: 'delete', scene, sourceId }
//       { op: 'upsert', scene, interact: '<base x,y>', to: 'x,y' } moved interact key, kept in place in key order
//       { op: 'create', scene, interact: 'x,y', id }              appended to the scene's interact keys
//       { op: 'delete', scene, interact: '<base x,y>' } ] }
// applyObjectsChangeset is STRICT: unknown scene or entry, a create of an existing entry, two ops on one entry, an
// upsert changing anything but x/y/w/h (or adding / dropping w/h), an interact key collision, a bad shape, or a
// foreign target all throw.

(function () {
  const R = globalThis.Editor || {};

  const FORMAT = 'scene-objects-changeset';
  const TARGET = 'world/scene-objects.json';
  const VERSION = 1;
  const OBJECT_KEYS = ['sourceId', 'type', 'kind', 'x', 'y', 'w', 'h', 'dialogue'];
  const MOVABLE = ['x', 'y', 'w', 'h'];

  function fail(msg) { throw new Error('[scene-objects] ' + msg); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function freezeDeep(v) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.freeze(v);
      Object.keys(v).forEach(function (k) { freezeDeep(v[k]); });
    }
    return v;
  }
  function isTile(n) { return Number.isInteger(n) && n >= 0; }
  function isRect(o) { return o.w !== undefined || o.h !== undefined; }
  function keyOf(x, y) { return x + ',' + y; }
  function parseKey(k) {
    if (typeof k !== 'string' || !/^\d+,\d+$/.test(k)) fail('interact key must be "x,y", got ' + JSON.stringify(k));
    const p = k.split(',');
    return { x: +p[0], y: +p[1] };
  }
  const SOURCE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  function requireRegistry(data) {
    if (!data || typeof data !== 'object' || data.version !== 1 || !data.scenes || typeof data.scenes !== 'object') {
      fail('registry must be { version: 1, scenes: {} } (world/scene-objects.json)');
    }
  }

  // Item id key for an interact entry (identity.js object:<scene>:<key>): colon-free, never a valid sourceId clash
  // because sourceIds may not start with "interact-".
  function interactItemKey(ref) { return 'interact-' + String(ref).replace(',', '-'); }

  // createObjectStore(registry) -> frozen { data, base, draft }
  function createObjectStore(data) {
    requireRegistry(data);
    const base = {};
    Object.keys(data.scenes).forEach(function (scene) {
      const sc = data.scenes[scene];
      base[scene] = {
        objects: (sc.objects || []).map(function (o) { return clone(o); }),
        interact: Object.keys(sc.interact || {}).map(function (k) { const p = parseKey(k); return { ref: k, x: p.x, y: p.y, id: sc.interact[k] }; })
      };
    });
    freezeDeep(base);
    return Object.freeze({ data: data, base: base, draft: base });
  }

  function sceneOf(draft, scene) {
    if (!has(draft, scene)) fail('scene "' + scene + '" is not in world/scene-objects.json (adding a scene stays hand-authored)');
    return draft[scene];
  }
  function objectIndex(sc, scene, sourceId) {
    for (let i = 0; i < sc.objects.length; i++) if (sc.objects[i].sourceId === sourceId) return i;
    fail('no object "' + sourceId + '" in ' + scene);
  }
  function interactIndex(sc, scene, ref) {
    for (let i = 0; i < sc.interact.length; i++) if (sc.interact[i].ref === ref) return i;
    fail('no interact key "' + ref + '" in ' + scene);
  }
  function withScene(draft, scene, next) {
    const out = Object.assign({}, draft);
    out[scene] = freezeDeep(next);
    return Object.freeze(out);
  }
  function toInt(v, what, min) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < min) fail(what + ' must be an integer >= ' + min + ', got ' + JSON.stringify(v));
    return n;
  }

  function moveObject(draft, scene, sourceId, x, y) {
    const sc = sceneOf(draft, scene);
    const i = objectIndex(sc, scene, sourceId);
    const next = Object.assign({}, sc.objects[i], { x: toInt(x, 'x', 0), y: toInt(y, 'y', 0) });
    const objects = sc.objects.slice(); objects[i] = next;
    return withScene(draft, scene, { objects: objects, interact: sc.interact });
  }

  function resizeObject(draft, scene, sourceId, w, h) {
    const sc = sceneOf(draft, scene);
    const i = objectIndex(sc, scene, sourceId);
    if (!isRect(sc.objects[i])) fail(sourceId + ' is a single-tile object (no w/h); RESIZE applies to rects only');
    const next = Object.assign({}, sc.objects[i], { w: toInt(w, 'w', 1), h: toInt(h, 'h', 1) });
    const objects = sc.objects.slice(); objects[i] = next;
    return withScene(draft, scene, { objects: objects, interact: sc.interact });
  }

  function deleteObject(draft, scene, sourceId) {
    const sc = sceneOf(draft, scene);
    const i = objectIndex(sc, scene, sourceId);
    const objects = sc.objects.slice(); objects.splice(i, 1);
    return withScene(draft, scene, { objects: objects, interact: sc.interact });
  }

  // kinds(store) -> [{ kind, type }] of every kind already present in the BASE registry, sorted by kind.
  function kinds(store) {
    const seen = {};
    Object.keys(store.base).forEach(function (scene) {
      store.base[scene].objects.forEach(function (o) { if (o.kind && !has(seen, o.kind)) seen[o.kind] = o.type; });
    });
    return Object.keys(seen).sort().map(function (k) { return { kind: k, type: seen[k] }; });
  }

  function suggestSourceId(draft, scene, kind) {
    const sc = sceneOf(draft, scene);
    const stem = String(kind || 'object').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'object';
    const taken = {};
    sc.objects.forEach(function (o) { taken[o.sourceId] = true; });
    if (!taken[stem]) return stem;
    for (let n = 2; ; n++) if (!taken[stem + '-' + n]) return stem + '-' + n;
  }

  // newObject(store, spec) -> the entry a NEW OBJECT creates: { sourceId, type (from the kind), kind, x, y, w?, h?, dialogue }
  function newObject(store, spec) {
    const k = kinds(store).filter(function (e) { return e.kind === spec.kind; })[0];
    if (!k) fail('kind "' + spec.kind + '" is not present in world/scene-objects.json; pick one of ' + kinds(store).map(function (e) { return e.kind; }).join(', '));
    const o = { sourceId: spec.sourceId, type: k.type, kind: k.kind, x: toInt(spec.x, 'x', 0), y: toInt(spec.y, 'y', 0) };
    const w = spec.w === undefined || spec.w === '' ? 1 : toInt(spec.w, 'w', 1);
    const h = spec.h === undefined || spec.h === '' ? 1 : toInt(spec.h, 'h', 1);
    if (w !== 1 || h !== 1) { o.w = w; o.h = h; }
    o.dialogue = spec.dialogue;
    return o;
  }

  function createObject(store, draft, scene, spec) {
    const sc = sceneOf(draft, scene);
    const o = newObject(store, spec);
    if (sc.objects.some(function (e) { return e.sourceId === o.sourceId; }) || (store.base[scene] && store.base[scene].objects.some(function (e) { return e.sourceId === o.sourceId; }))) {
      fail('sourceId "' + o.sourceId + '" already exists in ' + scene);
    }
    return withScene(draft, scene, { objects: sc.objects.concat([o]), interact: sc.interact });
  }

  function moveInteract(draft, scene, ref, x, y) {
    const sc = sceneOf(draft, scene);
    const i = interactIndex(sc, scene, ref);
    const interact = sc.interact.slice();
    interact[i] = Object.assign({}, interact[i], { x: toInt(x, 'x', 0), y: toInt(y, 'y', 0) });
    return withScene(draft, scene, { objects: sc.objects, interact: interact });
  }

  function deleteInteract(draft, scene, ref) {
    const sc = sceneOf(draft, scene);
    const i = interactIndex(sc, scene, ref);
    const interact = sc.interact.slice(); interact.splice(i, 1);
    return withScene(draft, scene, { objects: sc.objects, interact: interact });
  }

  // createInteract(store, draft, scene, {x, y, id}) -> { draft, ref }
  function createInteract(store, draft, scene, spec) {
    const sc = sceneOf(draft, scene);
    if (typeof spec.id !== 'string' || !/^[A-Za-z0-9_]+$/.test(spec.id)) fail('interact id must be a non-empty identifier, got ' + JSON.stringify(spec.id));
    let n = 1;
    while (sc.interact.some(function (e) { return e.ref === 'new-' + n; })) n++;
    const ref = 'new-' + n;
    const entry = { ref: ref, x: toInt(spec.x, 'x', 0), y: toInt(spec.y, 'y', 0), id: spec.id };
    return { draft: withScene(draft, scene, { objects: sc.objects, interact: sc.interact.concat([entry]) }), ref: ref };
  }

  function revertScene(store, draft, scene) {
    sceneOf(draft, scene);
    return withScene(draft, scene, store.base[scene]);
  }

  // revertEntry(store, draft, scene, {sourceId}|{ref}) -> draft with that one entry back to base (or removed if created)
  function revertEntry(store, draft, scene, which) {
    const sc = sceneOf(draft, scene), bs = store.base[scene];
    if (which.sourceId !== undefined) {
      const b = bs.objects.filter(function (o) { return o.sourceId === which.sourceId; })[0];
      const i = sc.objects.findIndex(function (o) { return o.sourceId === which.sourceId; });
      let objects = sc.objects.slice();
      if (!b) { if (i !== -1) objects.splice(i, 1); }
      else if (i !== -1) objects[i] = b;
      else { // deleted: put it back at its base position among the survivors
        const order = bs.objects.map(function (o) { return o.sourceId; });
        objects.push(b);
        objects.sort(function (p, q) {
          const a = order.indexOf(p.sourceId), c = order.indexOf(q.sourceId);
          return (a === -1 ? 1e9 : a) - (c === -1 ? 1e9 : c);
        });
      }
      return withScene(draft, scene, { objects: objects, interact: sc.interact });
    }
    const bi = bs.interact.filter(function (e) { return e.ref === which.ref; })[0];
    const j = sc.interact.findIndex(function (e) { return e.ref === which.ref; });
    let interact = sc.interact.slice();
    if (!bi) { if (j !== -1) interact.splice(j, 1); }
    else if (j !== -1) interact[j] = bi;
    else {
      const order = bs.interact.map(function (e) { return e.ref; });
      interact.push(bi);
      interact.sort(function (p, q) {
        const a = order.indexOf(p.ref), c = order.indexOf(q.ref);
        return (a === -1 ? 1e9 : a) - (c === -1 ? 1e9 : c);
      });
    }
    return withScene(draft, scene, { objects: sc.objects, interact: interact });
  }

  function sameJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  // changes(store, draft) -> [{ scene, entry: 'object'|'interact', op, sourceId|ref, before, after }] in registry order
  function changes(store, draft) {
    const out = [];
    Object.keys(store.base).forEach(function (scene) {
      const bs = store.base[scene], ds = draft[scene];
      if (ds === bs) return;
      bs.objects.forEach(function (b) {
        const d = ds.objects.filter(function (o) { return o.sourceId === b.sourceId; })[0];
        if (!d) out.push({ scene: scene, entry: 'object', op: 'delete', sourceId: b.sourceId, before: b, after: null });
        else if (!sameJson(b, d)) out.push({ scene: scene, entry: 'object', op: 'upsert', sourceId: b.sourceId, before: b, after: d });
      });
      ds.objects.forEach(function (d) {
        if (!bs.objects.some(function (o) { return o.sourceId === d.sourceId; })) out.push({ scene: scene, entry: 'object', op: 'create', sourceId: d.sourceId, before: null, after: d });
      });
      bs.interact.forEach(function (b) {
        const d = ds.interact.filter(function (e) { return e.ref === b.ref; })[0];
        if (!d) out.push({ scene: scene, entry: 'interact', op: 'delete', ref: b.ref, before: b, after: null });
        else if (!sameJson(b, d)) out.push({ scene: scene, entry: 'interact', op: 'upsert', ref: b.ref, before: b, after: d });
      });
      ds.interact.forEach(function (d) {
        if (!bs.interact.some(function (e) { return e.ref === d.ref; })) out.push({ scene: scene, entry: 'interact', op: 'create', ref: d.ref, before: null, after: d });
      });
    });
    return out;
  }

  function buildObjectsChangeset(store, draft) {
    const operations = changes(store, draft).map(function (c) {
      if (c.entry === 'object') {
        if (c.op === 'delete') return { op: 'delete', scene: c.scene, sourceId: c.sourceId };
        return { op: c.op, scene: c.scene, sourceId: c.sourceId, object: clone(c.after) };
      }
      if (c.op === 'delete') return { op: 'delete', scene: c.scene, interact: c.ref };
      if (c.op === 'upsert') return { op: 'upsert', scene: c.scene, interact: c.ref, to: keyOf(c.after.x, c.after.y) };
      return { op: 'create', scene: c.scene, interact: keyOf(c.after.x, c.after.y), id: c.after.id };
    });
    return freezeDeep({ format: FORMAT, version: VERSION, target: TARGET, operations: operations });
  }

  // dialogueIds(dialogue) -> every dialogue id a binding can resolve to (string, cascade `then`s and default)
  function dialogueIds(d) {
    if (typeof d === 'string') return [d];
    if (!Array.isArray(d)) return [];
    return d.map(function (step) { return typeof step === 'string' ? step : step && step.then; }).filter(function (s) { return typeof s === 'string'; });
  }

  // entryErrors(ctx, scene, entry, opts) -> error strings for one object or interact entry.
  // ctx.sceneSize(scene) -> {width, height}|null, ctx.dialogueExists(id), ctx.interactIdKnown(id)
  // opts.created: new entries must bind existing dialogue ids / known interact ids.
  function objectErrors(ctx, scene, o, opts) {
    const errs = [], at = scene + ' ' + (o.sourceId || '?');
    const size = ctx.sceneSize(scene);
    if (!size) return ['scene "' + scene + '" does not exist'];
    Object.keys(o).forEach(function (k) { if (OBJECT_KEYS.indexOf(k) === -1) errs.push(at + ' has unknown field "' + k + '"'); });
    if (typeof o.sourceId !== 'string' || !SOURCE_ID.test(o.sourceId)) errs.push(at + ': sourceId must be kebab-case (a-z, 0-9, dashes)');
    else if (/^interact-/.test(o.sourceId)) errs.push(at + ': sourceId may not start with "interact-" (reserved for interact keys)');
    if (!isTile(o.x) || !isTile(o.y)) errs.push(at + ': x,y must be non-negative integers');
    const w = o.w === undefined ? 1 : o.w, h = o.h === undefined ? 1 : o.h;
    if ((o.w === undefined) !== (o.h === undefined)) errs.push(at + ': w and h go together');
    if (!Number.isInteger(w) || w < 1 || !Number.isInteger(h) || h < 1) errs.push(at + ': w,h must be integers >= 1');
    else if (isTile(o.x) && isTile(o.y) && (o.x + w > size.width || o.y + h > size.height)) {
      errs.push(at + ': ' + o.x + ',' + o.y + (isRect(o) ? ' ' + w + 'x' + h : '') + ' falls outside ' + scene + ' (' + size.width + 'x' + size.height + ')');
    }
    const ids = dialogueIds(o.dialogue);
    if (!ids.length) errs.push(at + ': dialogue must be a dialogue id' + (opts && opts.created ? '' : ' or a cascade'));
    else if (opts && opts.created && typeof o.dialogue !== 'string') errs.push(at + ': a NEW OBJECT binds one dialogue id; cascades are hand-edited in world/scene-objects.json');
    ids.forEach(function (id) { if (!ctx.dialogueExists(id)) errs.push(at + ': dialogue "' + id + '" does not exist'); });
    return errs;
  }
  function interactErrors(ctx, scene, e, opts) {
    const errs = [], at = scene + ' interact ' + keyOf(e.x, e.y);
    const size = ctx.sceneSize(scene);
    if (!size) return ['scene "' + scene + '" does not exist'];
    if (!isTile(e.x) || !isTile(e.y)) errs.push(at + ': x,y must be non-negative integers');
    else if (e.x >= size.width || e.y >= size.height) errs.push(at + ' falls outside ' + scene + ' (' + size.width + 'x' + size.height + ')');
    if (opts && opts.created && !ctx.interactIdKnown(e.id)) errs.push(at + ': interact id "' + e.id + '" is not an INTERACT_DLG key');
    return errs;
  }

  // draftErrors(ctx, store, draft) -> { '<scene>': [errors] } for every scene whose draft differs from base
  function draftErrors(ctx, store, draft) {
    const out = {};
    Object.keys(draft).forEach(function (scene) {
      if (draft[scene] === store.base[scene]) return;
      const errs = [], bs = store.base[scene], ds = draft[scene];
      const seen = {};
      ds.objects.forEach(function (o) {
        if (has(seen, o.sourceId)) errs.push(scene + ': duplicate sourceId ' + o.sourceId);
        seen[o.sourceId] = true;
        const b = bs.objects.filter(function (x) { return x.sourceId === o.sourceId; })[0];
        if (b && sameJson(b, o)) return;
        objectErrors(ctx, scene, o, { created: !b }).forEach(function (e) { errs.push(e); });
      });
      const keys = {};
      ds.interact.forEach(function (e) {
        const k = keyOf(e.x, e.y);
        if (has(keys, k)) errs.push(scene + ': two interact keys on ' + k);
        keys[k] = true;
        const b = bs.interact.filter(function (x) { return x.ref === e.ref; })[0];
        if (b && sameJson(b, e)) return;
        interactErrors(ctx, scene, e, { created: !b }).forEach(function (x) { errs.push(x); });
      });
      if (errs.length) out[scene] = errs.filter(function (e, i) { return errs.indexOf(e) === i; });
    });
    return out;
  }

  // missionReferences(missions, ids) -> [{ mission, node, id }]: nodes holding one of ids as an exact string value
  // (target_id, dialogue, ...). Prose that merely contains the word does not count. missions: { M5: {nodes: []} } or [].
  function missionReferences(missions, ids) {
    const want = {};
    (ids || []).forEach(function (id) { want[id] = true; });
    const out = [];
    const list = Array.isArray(missions) ? missions : Object.keys(missions || {}).map(function (k) { return Object.assign({ mission: k }, missions[k]); });
    list.forEach(function (m) {
      (m.nodes || []).forEach(function (n) {
        const found = {};
        (function walk(v) {
          if (typeof v === 'string') { if (has(want, v)) found[v] = true; }
          else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { walk(v[k]); });
        }(n));
        Object.keys(found).sort().forEach(function (id) { out.push({ mission: m.mission, node: n.id, id: id }); });
      });
    });
    return out;
  }

  // registryWithDraft(store, draft) -> a world/scene-objects.json object for the draft (scene order kept)
  function registryWithDraft(store, draft) {
    const scenes = {};
    Object.keys(store.data.scenes).forEach(function (scene) {
      const ds = draft[scene], interact = {};
      ds.interact.forEach(function (e) { interact[keyOf(e.x, e.y)] = e.id; });
      scenes[scene] = { objects: clone(ds.objects), interact: interact };
    });
    return { version: store.data.version, scenes: scenes };
  }

  // applyObjectsChangeset(data, changeset) -> { data, changes: [{ scene, entry, op, key, before, after }] }. STRICT.
  function applyObjectsChangeset(data, changeset) {
    requireRegistry(data);
    if (!changeset || typeof changeset !== 'object' || !Array.isArray(changeset.operations)) fail('changeset must be an object with an operations[] array');
    if (changeset.format !== FORMAT) fail('changeset format must be ' + FORMAT + ', got ' + JSON.stringify(changeset.format));
    if (changeset.version !== VERSION) fail('scene objects changeset version must be ' + VERSION + ', got ' + JSON.stringify(changeset.version));
    if (changeset.target !== TARGET) fail('scene objects changeset target must be ' + TARGET + ', got ' + JSON.stringify(changeset.target));
    const out = clone(data);
    // work on ordered interact lists so a moved key keeps its position
    const work = {};
    Object.keys(out.scenes).forEach(function (scene) {
      work[scene] = Object.keys(out.scenes[scene].interact).map(function (k) { return { key: k, id: out.scenes[scene].interact[k] }; });
    });
    const seen = {}, result = [];
    changeset.operations.forEach(function (op, i) {
      const where = 'operations[' + i + ']';
      if (!op || typeof op !== 'object') fail(where + ' is not an object');
      if (['upsert', 'create', 'delete'].indexOf(op.op) === -1) fail(where + '.op must be upsert, create or delete, got ' + JSON.stringify(op.op));
      if (typeof op.scene !== 'string' || !has(out.scenes, op.scene)) fail(where + ' names unknown scene ' + JSON.stringify(op.scene) + ' (adding a scene stays hand-authored)');
      const sc = out.scenes[op.scene];
      const isObject = op.sourceId !== undefined;
      if (isObject === (op.interact !== undefined)) fail(where + ' must name exactly one of sourceId or interact');
      const allowed = isObject ? (op.op === 'delete' ? ['op', 'scene', 'sourceId'] : ['op', 'scene', 'sourceId', 'object'])
        : (op.op === 'delete' ? ['op', 'scene', 'interact'] : op.op === 'upsert' ? ['op', 'scene', 'interact', 'to'] : ['op', 'scene', 'interact', 'id']);
      Object.keys(op).forEach(function (k) { if (allowed.indexOf(k) === -1) fail(where + ' carries unknown field "' + k + '"'); });
      const entryKey = op.scene + (isObject ? '/' + op.sourceId : '/@' + op.interact);
      if (has(seen, entryKey)) fail(where + ' is a second operation on ' + entryKey + ' (' + seen[entryKey] + ' already)');
      seen[entryKey] = where;
      if (isObject) {
        const idx = sc.objects.findIndex(function (o) { return o.sourceId === op.sourceId; });
        if (op.op === 'create') {
          if (idx !== -1) fail(where + ' creates ' + op.scene + '/' + op.sourceId + ', which already exists');
          if (!op.object || typeof op.object !== 'object' || op.object.sourceId !== op.sourceId) fail(where + '.object must carry sourceId ' + JSON.stringify(op.sourceId));
          Object.keys(op.object).forEach(function (k) { if (OBJECT_KEYS.indexOf(k) === -1) fail(where + '.object carries unknown field "' + k + '"'); });
          if (typeof op.object.dialogue !== 'string') fail(where + '.object.dialogue must be one dialogue id (cascades are hand-edited)');
          const created = {};
          OBJECT_KEYS.forEach(function (k) { if (op.object[k] !== undefined) created[k] = clone(op.object[k]); });
          sc.objects.push(created);
          result.push({ scene: op.scene, entry: 'object', op: 'create', key: op.sourceId, before: null, after: created });
          return;
        }
        if (idx === -1) fail(where + ' names unknown object ' + op.scene + '/' + op.sourceId);
        const before = clone(sc.objects[idx]);
        if (op.op === 'delete') {
          sc.objects.splice(idx, 1);
          result.push({ scene: op.scene, entry: 'object', op: 'delete', key: op.sourceId, before: before, after: null });
          return;
        }
        const obj = op.object;
        if (!obj || typeof obj !== 'object') fail(where + '.object missing');
        Object.keys(obj).concat(Object.keys(before)).forEach(function (k) {
          if (MOVABLE.indexOf(k) !== -1) return;
          if (!sameJson(obj[k], before[k])) fail(where + ' changes "' + k + '" of ' + op.scene + '/' + op.sourceId + '; only x, y, w, h move in the Builder (type, kind, dialogue and cascades are hand-edited)');
        });
        if (isRect(before) !== isRect(obj)) fail(where + (isRect(before) ? ' drops w/h from rect ' : ' adds w/h to single-tile object ') + op.sourceId);
        const next = clone(before);
        MOVABLE.forEach(function (k) { if (before[k] !== undefined) next[k] = obj[k]; });
        sc.objects[idx] = next;
        result.push({ scene: op.scene, entry: 'object', op: 'upsert', key: op.sourceId, before: before, after: clone(next) });
        return;
      }
      const list = work[op.scene];
      const at = list.findIndex(function (e) { return e.key === op.interact && !e.created && !e.moved; });
      if (op.op === 'create') {
        parseKey(op.interact);
        if (typeof op.id !== 'string' || !/^[A-Za-z0-9_]+$/.test(op.id)) fail(where + '.id must be an interact id');
        list.push({ key: op.interact, id: op.id, created: true });
        result.push({ scene: op.scene, entry: 'interact', op: 'create', key: op.interact, before: null, after: { key: op.interact, id: op.id } });
        return;
      }
      if (at === -1) fail(where + ' names unknown interact key ' + op.scene + ' ' + JSON.stringify(op.interact));
      const before = { key: list[at].key, id: list[at].id };
      if (op.op === 'delete') {
        list.splice(at, 1);
        result.push({ scene: op.scene, entry: 'interact', op: 'delete', key: op.interact, before: before, after: null });
        return;
      }
      parseKey(op.to);
      list[at] = { key: op.to, id: list[at].id, moved: true };
      result.push({ scene: op.scene, entry: 'interact', op: 'upsert', key: op.interact, before: before, after: { key: op.to, id: before.id } });
    });
    Object.keys(work).forEach(function (scene) {
      const interact = {};
      work[scene].forEach(function (e) {
        if (has(interact, e.key)) fail(scene + ': two interact keys on ' + e.key + ' after the changeset');
        interact[e.key] = e.id;
      });
      out.scenes[scene].interact = interact;
    });
    return { data: out, changes: result };
  }

  R.sceneObjects = Object.freeze({
    FORMAT, TARGET, VERSION, OBJECT_KEYS,
    interactItemKey, createObjectStore, moveObject, resizeObject, deleteObject, kinds, suggestSourceId, newObject,
    createObject, moveInteract, deleteInteract, createInteract, revertScene, revertEntry, changes, buildObjectsChangeset,
    dialogueIds, objectErrors, interactErrors, draftErrors, missionReferences, registryWithDraft, applyObjectsChangeset
  });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.sceneObjects;
})();
