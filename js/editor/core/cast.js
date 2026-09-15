'use strict';

// EDITOR CORE — cast. WORLD BUILDER M7: the placement of a PLACED body (map_id, x, y, dir) inside an existing
// window of narrative/cast/windows.json, or inside a character's baseline. Game-free: story-state resolution,
// walkability and door lookups are injected by the caller (js/world-builder-data.js in the page,
// tools/world-apply.js on disk).
//
// Out of scope, hand-authored per docs/cast-presence-authoring.md: creating windows, editing `when`,
// OFFSCREEN / TERMINAL_REMOVED, dialogue, actor_ids, cause/exit. Only map_id, x, y, dir of a PLACED placement move.
//
// Store: base / draft are frozen maps "<window>/<character>" -> { window, character, owner, map_id, x, y, dir }
// holding every PLACED placement; window is the window id or "baseline". Drafts are replaced, never mutated.
//
// Changeset (version 1):
//   { format: 'cast-windows-changeset', version: 1, target: 'narrative/cast/windows.json',
//     operations: [ { op: 'place', window: '<id>|baseline', character, map_id, x, y, dir } ] }
// Only placements that differ from the base are emitted, sorted by window then character. applyCastChangeset
// is STRICT: unknown window or character, a character the window does not name, a non-PLACED placement, a
// second op on one (window, character), a bad tile or facing, or a foreign target all throw.
//
// Bundle (one export carrying both targets):
//   { format: 'world-builder-bundle', version: 1, changesets: [ <world-connections-changeset>, <cast-windows-changeset> ] }
// At most one changeset per target; splitChangesets() turns a plain changeset or a bundle into that list.

(function () {
  const R = globalThis.Editor || {};

  const FORMAT = 'cast-windows-changeset';
  const TARGET = 'narrative/cast/windows.json';
  const VERSION = 1;
  const BASELINE = 'baseline';
  const BUNDLE_FORMAT = 'world-builder-bundle';
  const BUNDLE_VERSION = 1;
  const CONNECTIONS_FORMAT = 'world-connections-changeset';
  const CONNECTIONS_TARGET = 'world/connections.json';
  const FACINGS = ['up', 'down', 'left', 'right'];
  const ARROWS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

  function fail(msg) { throw new Error('[cast] ' + msg); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function freezeDeep(v) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.freeze(v);
      Object.keys(v).forEach(function (k) { freezeDeep(v[k]); });
    }
    return v;
  }
  function canonical(v) {
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canonical(v[k]); }).join(',') + '}';
    }
    return JSON.stringify(v);
  }

  function key(windowId, character) { return windowId + '/' + character; }

  function requireData(data) {
    if (!data || typeof data !== 'object' || !data.characters || typeof data.characters !== 'object' || !Array.isArray(data.windows)) {
      fail('cast data must have characters{} and windows[] (narrative/cast/windows.json)');
    }
  }

  // placementOf(data, windowId, character) -> { placement, owner } or throws naming why the body is not editable.
  function placementOf(data, windowId, character) {
    requireData(data);
    const ch = data.characters[character];
    if (!ch) fail('unknown character "' + character + '"');
    let pl, owner;
    if (windowId === BASELINE) {
      if (!ch.baseline) fail('character "' + character + '" has no baseline');
      pl = ch.baseline; owner = ch.class || null;
    } else {
      const hits = data.windows.filter(function (w) { return w.id === windowId; });
      if (hits.length === 0) fail('unknown window "' + windowId + '"; creating windows stays hand-authored (docs/cast-presence-authoring.md)');
      if (hits.length > 1) fail('window id "' + windowId + '" appears ' + hits.length + ' times in narrative/cast/windows.json');
      if (!hits[0].cast || !has(hits[0].cast, character)) fail('window ' + windowId + ' does not name character "' + character + '"');
      pl = hits[0].cast[character]; owner = hits[0].owner || null;
    }
    if (!pl || pl.status !== 'PLACED') {
      fail(character + ' in ' + windowId + ' is ' + (pl && pl.status) + '; only PLACED bodies move in the Builder (OFFSCREEN / TERMINAL_REMOVED stay hand-authored)');
    }
    return { placement: pl, owner: owner };
  }

  function entry(windowId, character, owner, pl) {
    return { window: windowId, character: character, owner: owner, map_id: pl.map_id, x: pl.x, y: pl.y, dir: pl.dir || 'down' };
  }

  // createCastStore(data) -> frozen { base, draft } over every PLACED placement (baselines + windows).
  function createCastStore(data) {
    requireData(data);
    const base = {};
    Object.keys(data.characters).sort().forEach(function (c) {
      const b = data.characters[c].baseline;
      if (b && b.status === 'PLACED') base[key(BASELINE, c)] = freezeDeep(entry(BASELINE, c, data.characters[c].class || null, b));
    });
    const seen = {};
    data.windows.forEach(function (w) {
      if (!w || typeof w.id !== 'string') fail('every window needs an id');
      if (has(seen, w.id)) fail('duplicate window id ' + w.id);
      seen[w.id] = true;
      Object.keys(w.cast || {}).sort().forEach(function (c) {
        const pl = w.cast[c];
        if (pl && pl.status === 'PLACED') base[key(w.id, c)] = freezeDeep(entry(w.id, c, w.owner || null, pl));
      });
    });
    freezeDeep(base);
    return Object.freeze({ data: data, base: base, draft: base });
  }

  function toInt(v, what) {
    const n = Number(v);
    if (!Number.isInteger(n)) fail(what + ' must be an integer, got ' + JSON.stringify(v));
    return n;
  }

  // sameWhenConflicts(data, windowId, character) -> ids of OTHER windows with the same `when` that place the same
  // character elsewhere. Such a pair is an overlap V2 forbids; moving either body is refused while it exists.
  function sameWhenConflicts(data, windowId, character) {
    requireData(data);
    if (windowId === BASELINE) return [];
    const w = data.windows.find(function (x) { return x.id === windowId; });
    if (!w) return [];
    const mine = w.cast && w.cast[character];
    return data.windows.filter(function (o) {
      if (o.id === windowId || !o.cast || !has(o.cast, character)) return false;
      if (canonical(o.when === undefined ? null : o.when) !== canonical(w.when === undefined ? null : w.when)) return false;
      const pl = o.cast[character];
      return !mine || pl.status !== 'PLACED' || pl.map_id !== mine.map_id || pl.x !== mine.x || pl.y !== mine.y;
    }).map(function (o) { return o.id; }).sort();
  }

  // placeBody(store, draft, {window, character, map_id?, x?, y?, dir?}) -> draft.
  function placeBody(store, draft, place) {
    if (!place || typeof place !== 'object') fail('placeBody needs {window, character, ...}');
    const k = key(place.window, place.character);
    if (!has(draft, k)) placementOf(store.data, place.window, place.character); // throws the precise reason
    const clash = sameWhenConflicts(store.data, place.window, place.character);
    if (clash.length) fail(place.character + ' is placed by ' + place.window + ' and, under the same `when`, elsewhere by ' + clash.join(', ') + '; fix the overlap in narrative/cast/windows.json first (V2)');
    const cur = draft[k];
    const next = Object.assign({}, cur);
    if (place.map_id !== undefined) {
      if (typeof place.map_id !== 'string' || !place.map_id) fail('map_id must be a non-empty string');
      next.map_id = place.map_id;
    }
    if (place.x !== undefined) next.x = toInt(place.x, 'x');
    if (place.y !== undefined) next.y = toInt(place.y, 'y');
    if (place.dir !== undefined) {
      if (FACINGS.indexOf(place.dir) === -1) fail('facing must be up/down/left/right, got ' + JSON.stringify(place.dir));
      next.dir = place.dir;
    }
    const out = Object.assign({}, draft);
    out[k] = freezeDeep(next);
    return Object.freeze(out);
  }

  function arrowDir(keyName) { return has(ARROWS, keyName) ? ARROWS[keyName] : null; }

  function samePlace(a, b) { return !!a && !!b && a.map_id === b.map_id && a.x === b.x && a.y === b.y && a.dir === b.dir; }

  function changedKeys(store, draft) {
    return Object.keys(draft).filter(function (k) { return !samePlace(store.base[k], draft[k]); }).sort(function (p, q) {
      const a = draft[p], b = draft[q];
      return a.window < b.window ? -1 : a.window > b.window ? 1 : (a.character < b.character ? -1 : a.character > b.character ? 1 : 0);
    });
  }

  function revertBody(store, draft, windowId, character) {
    const k = key(windowId, character);
    if (!has(store.base, k)) fail('no PLACED body ' + k);
    const out = Object.assign({}, draft);
    out[k] = store.base[k];
    return Object.freeze(out);
  }

  function buildCastChangeset(store, draft) {
    const operations = changedKeys(store, draft).map(function (k) {
      const e = draft[k];
      return { op: 'place', window: e.window, character: e.character, map_id: e.map_id, x: e.x, y: e.y, dir: e.dir };
    });
    return freezeDeep({ format: FORMAT, version: VERSION, target: TARGET, operations: operations });
  }

  // applyCastChangeset(data, changeset) -> { data, changes: [{window, character, owner, before, after}] }.
  // data is a deep copy with only map_id/x/y/dir changed in place, so key order (and the JSON bytes of every
  // untouched line) is kept. STRICT, see the header.
  function applyCastChangeset(data, changeset) {
    requireData(data);
    if (!changeset || typeof changeset !== 'object' || !Array.isArray(changeset.operations)) fail('changeset must be an object with an operations[] array');
    if (changeset.format !== FORMAT) fail('changeset format must be ' + FORMAT + ', got ' + JSON.stringify(changeset.format));
    if (changeset.version !== VERSION) fail('cast changeset version must be ' + VERSION + ', got ' + JSON.stringify(changeset.version));
    if (changeset.target !== TARGET) fail('cast changeset target must be ' + TARGET + ', got ' + JSON.stringify(changeset.target));
    const out = clone(data);
    const seen = {};
    const changes = [];
    changeset.operations.forEach(function (op, i) {
      const where = 'operations[' + i + ']';
      if (!op || typeof op !== 'object') fail(where + ' is not an object');
      if (op.op !== 'place') fail(where + '.op must be "place", got ' + JSON.stringify(op.op) + ' (windows, when, status and dialogue stay hand-authored)');
      Object.keys(op).forEach(function (k) {
        if (['op', 'window', 'character', 'map_id', 'x', 'y', 'dir'].indexOf(k) === -1) fail(where + ' carries unknown field "' + k + '"');
      });
      if (typeof op.window !== 'string' || !op.window) fail(where + ' has no window');
      if (typeof op.character !== 'string' || !op.character) fail(where + ' has no character');
      const k = key(op.window, op.character);
      if (has(seen, k)) fail(where + ' is a second operation on ' + k + ' (' + seen[k] + ' already)');
      seen[k] = where;
      const found = placementOf(out, op.window, op.character);
      if (typeof op.map_id !== 'string' || !op.map_id) fail(where + '.map_id must be a non-empty string');
      if (!Number.isInteger(op.x) || !Number.isInteger(op.y)) fail(where + ' x and y must be integers');
      if (FACINGS.indexOf(op.dir) === -1) fail(where + '.dir must be up/down/left/right, got ' + JSON.stringify(op.dir));
      const pl = found.placement;
      const before = { map_id: pl.map_id, x: pl.x, y: pl.y, dir: pl.dir || 'down' };
      pl.map_id = op.map_id; pl.x = op.x; pl.y = op.y; pl.dir = op.dir;
      changes.push({ window: op.window, character: op.character, owner: found.owner, before: before, after: { map_id: op.map_id, x: op.x, y: op.y, dir: op.dir } });
    });
    return { data: out, changes: changes };
  }

  // castDataWithDraft(data, store, draft) -> a copy of data with every draft placement written in (for resolving).
  function castDataWithDraft(data, store, draft) {
    const cs = buildCastChangeset(store, draft);
    return cs.operations.length ? applyCastChangeset(data, cs).data : data;
  }

  // placementErrors(ctx, place, occupants) -> error strings for a target tile ([] when free).
  // ctx.sceneExists(map) / ctx.isWalkable(map, x, y) / ctx.doorAt(map, x, y) -> string|null (what the door is)
  // occupants: character ids of OTHER PLACED bodies on that tile in the same resolved cast.
  function placementErrors(ctx, place, occupants) {
    const errs = [];
    if (!ctx.sceneExists(place.map_id)) return ['map "' + place.map_id + '" does not exist'];
    const at = place.map_id + ' ' + place.x + ',' + place.y;
    if (!ctx.isWalkable(place.map_id, place.x, place.y)) errs.push(at + ' is not walkable');
    const door = ctx.doorAt(place.map_id, place.x, place.y);
    if (door) errs.push(at + ' is a door trigger tile (' + door + ')');
    (occupants || []).forEach(function (c) { errs.push(at + ' is occupied by ' + c); });
    return errs;
  }

  // splitChangesets(obj) -> [{ target, changeset }] for a connections changeset, a cast changeset or a bundle.
  function splitChangesets(obj) {
    if (!obj || typeof obj !== 'object') fail('changeset file must hold a JSON object');
    let list;
    if (obj.format === BUNDLE_FORMAT) {
      if (obj.version !== BUNDLE_VERSION) fail('bundle version must be ' + BUNDLE_VERSION + ', got ' + JSON.stringify(obj.version));
      if (!Array.isArray(obj.changesets) || obj.changesets.length === 0) fail('bundle needs a non-empty changesets[]');
      list = obj.changesets;
    } else {
      list = [obj];
    }
    const seen = {};
    return list.map(function (cs, i) {
      const where = obj.format === BUNDLE_FORMAT ? 'changesets[' + i + ']' : 'changeset';
      if (!cs || typeof cs !== 'object') fail(where + ' is not an object');
      let target;
      if (cs.format === FORMAT) target = TARGET;
      else if (cs.format === BUNDLE_FORMAT) fail(where + ' nests a bundle');
      else if (cs.format === CONNECTIONS_FORMAT || cs.format === undefined) target = cs.target === undefined ? CONNECTIONS_TARGET : cs.target;
      else fail(where + ' has unknown format ' + JSON.stringify(cs.format));
      if (target !== CONNECTIONS_TARGET && target !== TARGET) fail(where + ' targets ' + JSON.stringify(target) + '; only ' + CONNECTIONS_TARGET + ' and ' + TARGET + ' are writable');
      if (cs.format === FORMAT && cs.target !== TARGET) fail(where + ' is a cast changeset targeting ' + JSON.stringify(cs.target));
      if (has(seen, target)) fail(where + ' is a second changeset for ' + target);
      seen[target] = true;
      return { target: target, changeset: cs };
    });
  }

  function buildBundle(changesets) {
    const live = (changesets || []).filter(function (cs) { return cs && cs.operations && cs.operations.length; });
    if (live.length === 0) return null;
    if (live.length === 1) return live[0];
    return freezeDeep({ format: BUNDLE_FORMAT, version: BUNDLE_VERSION, changesets: live.map(clone) });
  }

  R.cast = Object.freeze({
    FORMAT, TARGET, VERSION, BASELINE, BUNDLE_FORMAT, BUNDLE_VERSION, FACINGS,
    key, placementOf, createCastStore, sameWhenConflicts, placeBody, arrowDir, changedKeys, revertBody,
    buildCastChangeset, applyCastChangeset, castDataWithDraft, placementErrors, splitChangesets, buildBundle
  });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.cast;
})();
