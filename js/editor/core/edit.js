'use strict';

// EDITOR CORE — edit. The pure draft store behind EDIT mode. A draft is a frozen map
// { connectionId -> whole connection record } that starts equal to the registry (the BASE) and is
// replaced, never mutated, by every edit. The UI commits each new map into history.js, so undo is a
// pointer move and revert is just "copy the base record back in".
//
// Changeset (whole records, no nested patches). buildChangeset exports VERSION 2:
//   { format: 'world-connections-changeset', version: 2, target: 'world/connections.json',
//     operations: [ { op: 'upsert', id, endpoints: ['a'|'b',...], connection: {id, a, b} }   id in base
//                 | { op: 'create', id, connection: {id, one_way?, a, b} }                  id new
//                 | { op: 'delete', id } ] }                                                id in base
// Version 1 (M4b/M5 exports) is still accepted by reapply(): ops upsert / remove only. create/delete
// need version 2; remove is version 1 only. Only connections that differ from the base are emitted,
// sorted by id. `endpoints` names the sides that changed; reapply() rejects anything but 'a'/'b' there,
// an unknown connection id, a create whose id already exists or is not kebab-case, two ops on one id,
// a record whose id disagrees with its op, or a record missing an endpoint — a stale or hand-edited
// changeset fails loudly instead of silently landing on the wrong record.
//
// Catalog membership (js/world-catalog.js) is NOT part of the changeset: tools/world-apply.js derives it
// from the create/delete ops. Uniqueness against the catalog is a ctx predicate (ctx.catalogHasId).
//
// One-way records ("one_way": true) are edited under the runtime schema: endpoint b takes no triggers
// (addTrigger/moveTrigger refuse), endpoint a has no spawn (setSpawn refuses).
//
// Validation is injected: validateDraft(record, ctx) knows the rule list, the caller supplies the
// world-aware predicates (scene lookup, the runtime connection validator), so this file stays game-free.

(function () {
  const R = globalThis.Editor || {};

  const SIDES = ['a', 'b'];
  const FACINGS = ['up', 'down', 'left', 'right'];
  const FORMAT = 'world-connections-changeset';
  const TARGET = 'world/connections.json';
  const VERSION = 2;
  const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  function fail(msg) { throw new Error('[edit] ' + msg); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function freezeDeep(v) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.freeze(v);
      Object.keys(v).forEach(function (k) { freezeDeep(v[k]); });
    }
    return v;
  }

  // Key-order-independent JSON, so "changed" means a real value change, not a re-ordered object.
  function canonical(v) {
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canonical(v[k]); }).join(',') + '}';
    }
    return JSON.stringify(v);
  }
  function same(x, y) { return canonical(x) === canonical(y); }

  // createStore(records) -> frozen { base, draft } where both start as the same id->record map.
  function createStore(records) {
    if (!Array.isArray(records)) fail('records must be an array');
    const base = {};
    records.forEach(function (r) {
      if (!r || typeof r.id !== 'string' || !r.id) fail('every record needs an id');
      if (has(base, r.id)) fail('duplicate record id ' + r.id);
      base[r.id] = freezeDeep(clone(r));
    });
    freezeDeep(base);
    return Object.freeze({ base: base, draft: base });
  }

  function requireEndpoint(draft, connId, side) {
    if (!has(draft, connId)) fail('unknown connection id "' + connId + '"');
    if (SIDES.indexOf(side) === -1) fail('unknown endpoint "' + side + '" on ' + connId);
    const rec = draft[connId];
    if (!rec || !rec[side]) fail('connection ' + connId + ' has no endpoint ' + side);
    return rec;
  }

  // withEndpoint: copy-on-write of one endpoint; every other record keeps its frozen reference.
  function withEndpoint(draft, connId, side, change) {
    const rec = clone(requireEndpoint(draft, connId, side));
    change(rec[side]);
    const next = Object.assign({}, draft);
    next[connId] = freezeDeep(rec);
    return Object.freeze(next);
  }

  function toInt(v, what) {
    const n = Number(v);
    if (!Number.isInteger(n)) fail(what + ' must be an integer, got ' + JSON.stringify(v));
    return n;
  }

  function isOneWay(rec) { return !!rec && rec.one_way === true; }
  function refuseOneWay(draft, connId, side, what) {
    const rec = requireEndpoint(draft, connId, side);
    if (!isOneWay(rec)) return;
    if (what === 'trigger' && side === 'b') fail('endpoint b of one-way connection ' + connId + ' takes no triggers');
    if (what === 'spawn' && side === 'a') fail('endpoint a of one-way connection ' + connId + ' has no spawn');
  }

  // setSpawn(draft, connId, side, {tx?, ty?, dir?}) — integer tile, facing in up/down/left/right.
  function setSpawn(draft, connId, side, patch) {
    refuseOneWay(draft, connId, side, 'spawn');
    return withEndpoint(draft, connId, side, function (ep) {
      const spawn = Object.assign({}, ep.spawn || {});
      if (patch.tx !== undefined) spawn.tx = toInt(patch.tx, 'spawn.tx');
      if (patch.ty !== undefined) spawn.ty = toInt(patch.ty, 'spawn.ty');
      if (patch.dir !== undefined) {
        if (FACINGS.indexOf(patch.dir) === -1) fail('facing must be up/down/left/right, got ' + JSON.stringify(patch.dir));
        spawn.dir = patch.dir;
      }
      ep.spawn = { tx: spawn.tx, ty: spawn.ty, dir: spawn.dir };
    });
  }

  function requireTrigger(ep, index, connId, side) {
    if (!Array.isArray(ep.triggers) || !Number.isInteger(index) || index < 0 || index >= ep.triggers.length) {
      fail('trigger ' + side + ':' + index + ' does not exist on ' + connId);
    }
  }

  function moveTrigger(draft, connId, side, index, tx, ty) {
    refuseOneWay(draft, connId, side, 'trigger');
    return withEndpoint(draft, connId, side, function (ep) {
      requireTrigger(ep, index, connId, side);
      ep.triggers[index] = [toInt(tx, 'trigger x'), toInt(ty, 'trigger y')];
    });
  }

  function addTrigger(draft, connId, side, tx, ty) {
    refuseOneWay(draft, connId, side, 'trigger');
    return withEndpoint(draft, connId, side, function (ep) {
      if (!Array.isArray(ep.triggers)) ep.triggers = [];
      ep.triggers.push([toInt(tx, 'trigger x'), toInt(ty, 'trigger y')]);
    });
  }

  function removeTrigger(draft, connId, side, index) {
    return withEndpoint(draft, connId, side, function (ep) {
      requireTrigger(ep, index, connId, side);
      ep.triggers.splice(index, 1);
    });
  }

  // ---- M6: create / delete ------------------------------------------------------------------------

  // "double_r_exterior_prototype", "room_315" -> "double-r-exterior-prototype-room-315"
  function suggestId(sceneA, sceneB) {
    return [sceneA, sceneB].map(function (s) {
      return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }).filter(Boolean).join('-');
  }

  // Facing away from the nearest map edge. Distances are compared top, bottom, left, right; on a tie the
  // vertical axis wins (explicit rule, not list order: every classic door in the game is a north/south door).
  function interiorFacing(tx, ty, width, height) {
    const d = { top: ty, bottom: height - 1 - ty, left: tx, right: width - 1 - tx };
    const v = Math.min(d.top, d.bottom), h = Math.min(d.left, d.right);
    if (v <= h) return d.top <= d.bottom ? 'down' : 'up';
    return d.left <= d.right ? 'right' : 'left';
  }

  // The tile in front of a trigger, one step toward the map interior, facing that way.
  function spawnInFront(tx, ty, width, height) {
    const dir = interiorFacing(tx, ty, width, height);
    const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    return { tx: tx + v[0], ty: ty + v[1], dir: dir };
  }

  // newConnection(spec) -> a whole record from two picked tiles.
  // spec = { id, oneWay, a: {scene, tx, ty, width, height}, b: {...}, spawn: {a?, b?} }
  // paired: both picks are triggers, each spawn defaults to spawnInFront of its trigger.
  // one-way: a pick is the trigger (no spawn); b takes no trigger, its spawn defaults to spawnInFront of b.
  function newConnection(spec) {
    if (!spec || !spec.a || !spec.b) fail('newConnection needs picks a and b');
    const over = spec.spawn || {};
    function pick(side) {
      const p = spec[side];
      const tx = toInt(p.tx, side + ' tile x'), ty = toInt(p.ty, side + ' tile y');
      const def = spawnInFront(tx, ty, toInt(p.width, side + ' scene width'), toInt(p.height, side + ' scene height'));
      const sp = over[side] ? { tx: toInt(over[side].tx, side + ' spawn x'), ty: toInt(over[side].ty, side + ' spawn y'), dir: over[side].dir || def.dir } : def;
      return { scene: p.scene, tx: tx, ty: ty, spawn: sp };
    }
    const a = pick('a'), b = pick('b');
    const rec = { id: spec.id };
    if (spec.oneWay) {
      rec.one_way = true;
      rec.a = { scene: a.scene, triggers: [[a.tx, a.ty]] };
      rec.b = { scene: b.scene, triggers: [], spawn: b.spawn };
    } else {
      rec.a = { scene: a.scene, triggers: [[a.tx, a.ty]], spawn: a.spawn };
      rec.b = { scene: b.scene, triggers: [[b.tx, b.ty]], spawn: b.spawn };
    }
    return rec;
  }

  // idErrors(id, store, draft, ctx?) -> why `id` cannot name a NEW connection ([] when it can).
  function idErrors(id, store, draft, ctx) {
    const out = [];
    if (typeof id !== 'string' || !ID_RE.test(id)) {
      out.push('connection id ' + JSON.stringify(id) + ' must be kebab-case (a-z, 0-9, single hyphens)');
      return out;
    }
    if (store && has(store.base, id)) out.push('connection id "' + id + '" already exists in the registry');
    else if (draft && has(draft, id)) out.push('connection id "' + id + '" already exists in the draft');
    if (ctx && typeof ctx.catalogHasId === 'function' && ctx.catalogHasId(id)) out.push('connection id "' + id + '" is already listed in js/world-catalog.js');
    return out;
  }

  // Structural checks shared by createConnection and reapply's create op (the maps-aware checks are ctx's).
  function recordShape(rec, where) {
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) fail(where + ' connection is not an object');
    Object.keys(rec).forEach(function (k) {
      if (k !== 'id' && k !== 'one_way' && SIDES.indexOf(k) === -1) fail(where + ' carries unknown endpoint "' + k + '" on ' + rec.id);
    });
    if (rec.one_way !== undefined && rec.one_way !== true) fail(where + ' one_way must be true when present on ' + rec.id);
    SIDES.forEach(function (s) {
      if (!rec[s] || typeof rec[s] !== 'object') fail(where + ' is missing endpoint "' + s + '" on ' + rec.id);
      if (typeof rec[s].scene !== 'string' || !rec[s].scene) fail(where + ' endpoint ' + s + ' of ' + rec.id + ' names no scene');
      if (!Array.isArray(rec[s].triggers)) fail(where + ' endpoint ' + s + ' of ' + rec.id + ' has no triggers array');
    });
    if (isOneWay(rec)) {
      if (rec.a.spawn !== undefined) fail(where + ' endpoint a of one-way connection ' + rec.id + ' has no spawn');
      if (rec.b.triggers.length) fail(where + ' endpoint b of one-way connection ' + rec.id + ' takes no triggers');
    }
  }

  // createConnection(store, draft, record, ctx?) -> draft with the new record. The id must be kebab-case and
  // unused in base, draft and (via ctx.catalogHasId) the catalog.
  function createConnection(store, draft, record, ctx) {
    recordShape(record, 'create:');
    const errs = idErrors(record.id, store, draft, ctx);
    if (errs.length) fail(errs.join('; '));
    const next = Object.assign({}, draft);
    next[record.id] = freezeDeep(clone(record));
    return Object.freeze(next);
  }

  // deleteConnection(store, draft, id) -> draft without the record. Deleting a record created in this draft
  // simply drops it (the export then carries neither op).
  function deleteConnection(store, draft, connId) {
    if (!has(draft, connId)) fail('unknown connection id "' + connId + '"');
    const next = Object.assign({}, draft);
    delete next[connId];
    return Object.freeze(next);
  }

  function isCreated(store, draft, connId) { return has(draft, connId) && !has(store.base, connId); }
  function isDeleted(store, draft, connId) { return has(store.base, connId) && !has(draft, connId); }

  // claimConflicts(records) -> one error per trigger tile claimed by two records (runtime installer rule).
  function claimConflicts(records) {
    const claims = {}, out = [];
    (records || []).forEach(function (rec) {
      if (!rec) return;
      SIDES.forEach(function (s) {
        const ep = rec[s];
        if (!ep || !Array.isArray(ep.triggers)) return;
        ep.triggers.forEach(function (t) {
          const key = ep.scene + ' ' + t[0] + ',' + t[1];
          if (claims[key] && claims[key] !== rec.id) out.push(key + ' is claimed by both ' + claims[key] + ' and ' + rec.id);
          else claims[key] = rec.id;
        });
      });
    });
    return out;
  }

  // revertConnection: put the base record back (or drop a record the base never had).
  function revertConnection(store, draft, connId) {
    if (!has(store.base, connId) && !has(draft, connId)) fail('unknown connection id "' + connId + '"');
    const next = Object.assign({}, draft);
    if (has(store.base, connId)) next[connId] = store.base[connId];
    else delete next[connId];
    return Object.freeze(next);
  }
  function revertAll(store) { return store.base; }

  // Which sides of a record differ from base (['a'], ['a','b'] or []).
  function changedEndpoints(store, draft, connId) {
    const b = store.base[connId], d = draft[connId];
    if (!b || !d) return SIDES.slice();
    return SIDES.filter(function (s) { return !same(b[s], d[s]); });
  }

  // changedIds(store, draft) -> sorted ids whose draft differs from base (including removed ones).
  function changedIds(store, draft) {
    const ids = {};
    Object.keys(store.base).forEach(function (id) { if (!has(draft, id) || !same(store.base[id], draft[id])) ids[id] = true; });
    Object.keys(draft).forEach(function (id) { if (!has(store.base, id)) ids[id] = true; });
    return Object.keys(ids).sort();
  }

  function isChanged(store, draft, connId) {
    return has(draft, connId) !== has(store.base, connId) || !same(store.base[connId], draft[connId]);
  }

  // buildChangeset(store, draft) -> the exportable version-2 changeset: only changed connections, sorted by id.
  function buildChangeset(store, draft) {
    const operations = changedIds(store, draft).map(function (id) {
      if (!has(draft, id)) return { op: 'delete', id: id };
      if (!has(store.base, id)) return { op: 'create', id: id, connection: clone(draft[id]) };
      return { op: 'upsert', id: id, endpoints: changedEndpoints(store, draft, id), connection: clone(draft[id]) };
    });
    return freezeDeep({ format: FORMAT, version: VERSION, target: TARGET, operations: operations });
  }

  function serialize(changeset) { return JSON.stringify(changeset, null, 2) + '\n'; }

  // reapply(records | store, changeset) -> draft map. STRICT: unknown connection id, unknown endpoint, a
  // create on an existing id, two ops on one id, an op not allowed at the changeset's version, or an op
  // whose record disagrees with its id all throw. The source is never mutated.
  function reapply(source, changeset) {
    const store = Array.isArray(source) ? createStore(source) : source;
    if (!store || !store.base) fail('reapply needs a record array or a store');
    if (!changeset || typeof changeset !== 'object' || !Array.isArray(changeset.operations)) {
      fail('changeset must be an object with an operations[] array');
    }
    if (changeset.target !== undefined && changeset.target !== TARGET) {
      fail('changeset target must be ' + TARGET + ', got ' + JSON.stringify(changeset.target));
    }
    const version = changeset.version === undefined ? 1 : changeset.version;
    if (version !== 1 && version !== 2) fail('changeset version must be 1 or 2, got ' + JSON.stringify(changeset.version));
    const next = Object.assign({}, store.base);
    const seen = {};
    changeset.operations.forEach(function (op, i) {
      const where = 'operations[' + i + ']';
      if (!op || typeof op !== 'object') fail(where + ' is not an object');
      const allowed = version === 1 ? ['upsert', 'remove'] : ['upsert', 'create', 'delete'];
      if (['upsert', 'remove', 'create', 'delete'].indexOf(op.op) === -1) fail(where + '.op is unknown: ' + String(op.op));
      if (allowed.indexOf(op.op) === -1) fail(where + '.op "' + op.op + '" is not allowed in a version ' + version + ' changeset' + (op.op === 'remove' ? ' (use delete)' : ' (needs version 2)'));
      const id = op.op === 'upsert' || op.op === 'create' ? (op.id !== undefined ? op.id : op.connection && op.connection.id) : op.id;
      if (typeof id !== 'string' || !id) fail(where + ' has no connection id');
      if (has(seen, id)) fail(where + ' is a second operation on connection id "' + id + '" (' + seen[id] + ' already)');
      seen[id] = where;
      if (op.op === 'create') {
        if (has(store.base, id)) fail(where + ' creates connection id "' + id + '", which already exists in the registry');
        if (!ID_RE.test(id)) fail(where + ' connection id ' + JSON.stringify(id) + ' must be kebab-case (a-z, 0-9, single hyphens)');
      } else if (!has(store.base, id)) {
        fail(where + ' names unknown connection id "' + id + '"');
      }
      if (op.op === 'remove' || op.op === 'delete') { delete next[id]; return; }
      const rec = op.connection;
      if (!rec || typeof rec !== 'object') fail(where + '.connection missing');
      if (rec.id !== id) fail(where + ' id "' + id + '" disagrees with connection.id "' + rec.id + '"');
      (op.endpoints || []).forEach(function (s) {
        if (SIDES.indexOf(s) === -1) fail(where + ' names unknown endpoint "' + s + '" on ' + id);
      });
      recordShape(rec, where);
      next[id] = freezeDeep(clone(rec));
    });
    return Object.freeze(next);
  }

  // validateDraft(record, ctx, opts?) -> error strings, [] when valid.
  // ctx.knownIds(id) -> bool             connection id exists in the registry
  // ctx.sceneExists(scene) -> bool       scene is a real map
  // ctx.validateConnection(rec) -> {errors}   the runtime validator; its messages are kept verbatim
  // ctx.validateEndpoint(side, ep) -> string|null   one endpoint alone (for the paired-endpoint check)
  // ctx.catalogHasId(id) / ctx.sceneLocation(scene) -> location id|null / ctx.legacyDoorAt(scene,x,y) -> bool
  //                                      optional; used for created records and trigger tiles
  // opts.changedSides: sides the user edited; their pair must still validate.
  // opts.created: the record is new in this draft (id must be unused, both scenes need a catalog location).
  // opts.draft: the whole draft; a trigger tile claimed by another record in it is an error.
  function validateDraft(record, ctx, opts) {
    const errors = [];
    opts = opts || {};
    const changedSides = opts.changedSides || [];
    if (!record || typeof record !== 'object') return ['connection record missing'];
    if (opts.created) {
      idErrors(record.id, null, null, ctx).forEach(function (e) { errors.push(e); });
      if (ctx.knownIds(record.id)) errors.push('connection id "' + record.id + '" already exists in the registry');
    } else if (!ctx.knownIds(record.id)) {
      errors.push('connection id "' + record.id + '" does not exist in the registry');
    }
    SIDES.forEach(function (s) {
      const ep = record[s];
      if (!ep || typeof ep !== 'object') { errors.push('endpoint ' + s + ' does not exist'); return; }
      if (typeof ep.scene !== 'string' || !ctx.sceneExists(ep.scene)) { errors.push('endpoint ' + s + ' scene "' + ep.scene + '" does not exist'); return; }
      if (opts.created && typeof ctx.sceneLocation === 'function' && !ctx.sceneLocation(ep.scene)) {
        errors.push('endpoint ' + s + ' scene "' + ep.scene + '" has no catalog location in js/world-catalog.js');
      }
      if (typeof ctx.legacyDoorAt === 'function') {
        (ep.triggers || []).forEach(function (t, i) {
          if (ctx.legacyDoorAt(ep.scene, t[0], t[1])) errors.push(s + '.triggers[' + i + '] ' + ep.scene + ' ' + t[0] + ',' + t[1] + ' holds a legacy map door');
        });
      }
    });
    if (opts.created && record.a && record.b && record.a.scene === record.b.scene) errors.push('endpoints a and b must be in different scenes');
    const res = ctx.validateConnection(record) || { errors: [] };
    const oneWay = isOneWay(record);
    (res.errors || []).forEach(function (e) { errors.push(e); });
    changedSides.forEach(function (s) {
      const other = s === 'a' ? 'b' : 'a';
      if (!record[other]) return;
      const err = ctx.validateEndpoint(other, record[other], { oneWay: oneWay });
      if (err) errors.push('paired endpoint ' + other + ' no longer valid: ' + err);
      else if (record[s] && record[s].scene === record[other].scene) errors.push('paired endpoint ' + other + ' no longer valid: same scene as ' + s);
    });
    if (opts.draft) {
      const others = Object.keys(opts.draft).filter(function (id) { return id !== record.id; }).map(function (id) { return opts.draft[id]; });
      claimConflicts(others.concat([record])).forEach(function (e) {
        if (e.indexOf(' and ' + record.id) !== -1) errors.push(e);
      });
    }
    return errors;
  }

  R.edit = Object.freeze({
    SIDES, FACINGS, FORMAT, TARGET, VERSION, ID_RE,
    canonical, isOneWay, createStore, setSpawn, moveTrigger, addTrigger, removeTrigger,
    suggestId, interiorFacing, spawnInFront, newConnection, idErrors, createConnection, deleteConnection,
    isCreated, isDeleted, claimConflicts,
    revertConnection, revertAll, changedEndpoints, changedIds, isChanged,
    buildChangeset, serialize, reapply, validateDraft
  });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.edit;
})();
