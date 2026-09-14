'use strict';

// EDITOR CORE — edit. The pure draft store behind EDIT mode. A draft is a frozen map
// { connectionId -> whole connection record } that starts equal to the registry (the BASE) and is
// replaced, never mutated, by every edit. The UI commits each new map into history.js, so undo is a
// pointer move and revert is just "copy the base record back in".
//
// Changeset (M4a contract kept: whole-record upsert / remove, no nested patches) as exported here:
//   { format: 'world-connections-changeset', version: 1, target: 'world/connections.json',
//     operations: [ { op: 'upsert', id, endpoints: ['a'|'b',...], connection: {id, a, b} }
//                 | { op: 'remove', id } ] }
// Only connections that differ from the base are emitted, sorted by id. `endpoints` names the sides
// that changed; reapply() rejects anything but 'a'/'b' there, an unknown connection id, a record whose
// id disagrees with its op, or a record missing an endpoint — a stale or hand-edited changeset fails
// loudly instead of silently landing on the wrong record.
//
// Validation is injected: validateDraft(record, ctx) knows the rule list, the caller supplies the
// world-aware predicates (scene lookup, the runtime connection validator), so this file stays game-free.

(function () {
  const R = globalThis.Editor || {};

  const SIDES = ['a', 'b'];
  const FACINGS = ['up', 'down', 'left', 'right'];
  const FORMAT = 'world-connections-changeset';
  const TARGET = 'world/connections.json';

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

  // setSpawn(draft, connId, side, {tx?, ty?, dir?}) — integer tile, facing in up/down/left/right.
  function setSpawn(draft, connId, side, patch) {
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
    return withEndpoint(draft, connId, side, function (ep) {
      requireTrigger(ep, index, connId, side);
      ep.triggers[index] = [toInt(tx, 'trigger x'), toInt(ty, 'trigger y')];
    });
  }

  function addTrigger(draft, connId, side, tx, ty) {
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

  // buildChangeset(store, draft) -> the exportable changeset: only changed connections, sorted by id.
  function buildChangeset(store, draft) {
    const operations = changedIds(store, draft).map(function (id) {
      if (!has(draft, id)) return { op: 'remove', id: id };
      return { op: 'upsert', id: id, endpoints: changedEndpoints(store, draft, id), connection: clone(draft[id]) };
    });
    return freezeDeep({ format: FORMAT, version: 1, target: TARGET, operations: operations });
  }

  function serialize(changeset) { return JSON.stringify(changeset, null, 2) + '\n'; }

  // reapply(records | store, changeset) -> draft map. STRICT: unknown connection id, unknown endpoint,
  // or an op whose record disagrees with its id all throw. The source is never mutated.
  function reapply(source, changeset) {
    const store = Array.isArray(source) ? createStore(source) : source;
    if (!store || !store.base) fail('reapply needs a record array or a store');
    if (!changeset || typeof changeset !== 'object' || !Array.isArray(changeset.operations)) {
      fail('changeset must be an object with an operations[] array');
    }
    if (changeset.target !== undefined && changeset.target !== TARGET) {
      fail('changeset target must be ' + TARGET + ', got ' + JSON.stringify(changeset.target));
    }
    const next = Object.assign({}, store.base);
    changeset.operations.forEach(function (op, i) {
      const where = 'operations[' + i + ']';
      if (!op || typeof op !== 'object') fail(where + ' is not an object');
      const id = op.op === 'upsert' ? (op.id !== undefined ? op.id : op.connection && op.connection.id) : op.id;
      if (typeof id !== 'string' || !id) fail(where + ' has no connection id');
      if (!has(store.base, id)) fail(where + ' names unknown connection id "' + id + '"');
      if (op.op === 'remove') { delete next[id]; return; }
      if (op.op !== 'upsert') fail(where + '.op is unknown: ' + String(op.op));
      const rec = op.connection;
      if (!rec || typeof rec !== 'object') fail(where + '.connection missing');
      if (rec.id !== id) fail(where + ' id "' + id + '" disagrees with connection.id "' + rec.id + '"');
      (op.endpoints || []).forEach(function (s) {
        if (SIDES.indexOf(s) === -1) fail(where + ' names unknown endpoint "' + s + '" on ' + id);
      });
      Object.keys(rec).forEach(function (k) {
        if (k !== 'id' && SIDES.indexOf(k) === -1) fail(where + ' carries unknown endpoint "' + k + '" on ' + id);
      });
      SIDES.forEach(function (s) {
        if (!rec[s] || typeof rec[s] !== 'object') fail(where + ' is missing endpoint "' + s + '" on ' + id);
      });
      next[id] = freezeDeep(clone(rec));
    });
    return Object.freeze(next);
  }

  // validateDraft(record, ctx) -> error strings, [] when valid.
  // ctx.knownIds(id) -> bool             connection id exists in the registry
  // ctx.sceneExists(scene) -> bool       scene is a real map
  // ctx.validateConnection(rec) -> {errors}   the runtime validator; its messages are kept verbatim
  // ctx.validateEndpoint(side, ep) -> string|null   one endpoint alone (for the paired-endpoint check)
  // opts.changedSides: sides the user edited; their pair must still validate.
  function validateDraft(record, ctx, opts) {
    const errors = [];
    const changedSides = (opts && opts.changedSides) || [];
    if (!record || typeof record !== 'object') return ['connection record missing'];
    if (!ctx.knownIds(record.id)) errors.push('connection id "' + record.id + '" does not exist in the registry');
    SIDES.forEach(function (s) {
      const ep = record[s];
      if (!ep || typeof ep !== 'object') { errors.push('endpoint ' + s + ' does not exist'); return; }
      if (typeof ep.scene !== 'string' || !ctx.sceneExists(ep.scene)) errors.push('endpoint ' + s + ' scene "' + ep.scene + '" does not exist');
    });
    const res = ctx.validateConnection(record) || { errors: [] };
    (res.errors || []).forEach(function (e) { errors.push(e); });
    changedSides.forEach(function (s) {
      const other = s === 'a' ? 'b' : 'a';
      if (!record[other]) return;
      const err = ctx.validateEndpoint(other, record[other]);
      if (err) errors.push('paired endpoint ' + other + ' no longer valid: ' + err);
      else if (record[s] && record[s].scene === record[other].scene) errors.push('paired endpoint ' + other + ' no longer valid: same scene as ' + s);
    });
    return errors;
  }

  R.edit = Object.freeze({
    SIDES, FACINGS, FORMAT, TARGET,
    canonical, createStore, setSpawn, moveTrigger, addTrigger, removeTrigger,
    revertConnection, revertAll, changedEndpoints, changedIds, isChanged,
    buildChangeset, serialize, reapply, validateDraft
  });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.edit;
})();
