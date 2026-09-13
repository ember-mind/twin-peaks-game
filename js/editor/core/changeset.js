'use strict';

// EDITOR CORE — changeset. A versioned, serializable list of upsert/remove operations over a
// connection registry, plus the PURE reducer that turns (registry, changeset) into the next
// registry with NO filesystem and NO audit sidecar. The apply layer reuses this exact math for
// its dry-run; the only difference is that apply additionally writes + audits, which lives there.
//
// This module is intentionally identical-by-construction to js/editor/apply/changeset-apply.js's
// apply() core (see that file's header: "PURE, dry-run by default"). They must stay in lockstep;
// a drift here means the editor would preview something the real commit would not. Keep both in
// sync and let test/editor/changeset.js + test/apply-changeset.js catch divergence.

const Editor = (function () {
  const R = globalThis.Editor || {};

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function has(obj, k) { return Object.prototype.hasOwnProperty.call(obj, k); }
  function fail(msg) { throw new Error('[changeset] ' + msg); }

   // emptyChangeset() -> a frozen version-0 changeset with no operations.
  function emptyChangeset() {
    return Object.freeze({ version: 0, author: null, operations: [] });
   }

   // addUpsert / addRemove grow a changeset immutably (a new frozen object each time).
  function addUpsert(cs, connection) {
    const op = Object.freeze({ op: 'upsert', connection: clone(connection) });
    return Object.freeze({ version: cs.version + 1, author: cs.author == null ? null : cs.author, operations: cs.operations.concat([op]) });
   }
  function addRemove(cs, id) {
    const op = Object.freeze({ op: 'remove', id: id });
    return Object.freeze({ version: cs.version + 1, author: cs.author == null ? null : cs.author, operations: cs.operations.concat([op]) });
   }

   // applyChangeset(registry, changeset) -> next registry {version: fromVersion+1, connections}.
   // Pure: the source registry is never mutated; each record is deep-cloned on entry. Semantics
   // mirror apply(): upsert dedups by id preserving insertion order (replace in place or append);
   // remove fails loud on an unknown id so a typo can't masquerade as success. Re-running the same
   // upsert-only changeset is idempotent (overwrite converges), which is what makes "apply" safe
   // to preview repeatedly without drift.
  function applyChangeset(registry, changeset) {
    if (!registry || !Array.isArray(registry.connections)) fail('registry must have a connections[] array');
    if (!changeset || !Array.isArray(changeset.operations)) fail('changeset must have an operations[] array');
    const fromVersion = (registry.version == null) ? 1 : registry.version;

    const byId = {};
    const nextConnections = registry.connections.map(function (c) {
      byId[c.id] = clone(c);
      return byId[c.id];
     });

    changeset.operations.forEach(function (op, i) {
      if (op.op === 'upsert') {
        if (!op.connection || typeof op.connection !== 'object') fail(`operations[${i}].connection missing`);
        const rec = clone(op.connection);
        const existed = has(byId, op.connection.id);
        byId[rec.id] = rec;
        if (existed) {
          const idx = nextConnections.findIndex(function (c) { return c.id === rec.id; });
          nextConnections[idx] = rec;
         } else {
          nextConnections.push(rec);
         }
       } else if (op.op === 'remove') {
        if (!has(byId, op.id)) fail(`operations[${i}] removes unknown id "${op.id}"`);
        delete byId[op.id];
        for (let j = nextConnections.length - 1; j >= 0; j--) {
          if (nextConnections[j].id === op.id) nextConnections.splice(j, 1);
         }
       } else {
        fail(`operations[${i}].op is unknown: ${String(op.op)}`);
       }
      });

    return Object.freeze({ version: fromVersion + 1, connections: nextConnections });
   }

  R.changeset = Object.freeze({ emptyChangeset, addUpsert, addRemove, applyChangeset });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.changeset;
  return R.changeset;
})();
