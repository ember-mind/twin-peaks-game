'use strict';

// EDITOR CORE — validation. A small pipeline of independent validators run over a changeset so a
// bad edit is rejected BEFORE it can reach apply/commit. The design is "fail loud": assertValid
// throws on the first problem, while runValidators collects ALL problems at once (useful for the
// inspector's "fix these N things" panel).
//
// Record completeness mirrors js/editor/apply/changeset-apply.js#validateRecord (a connection must
// carry an id and, for each endpoint a/b, a scene string + a triggers array + a numeric spawn.tx)
// so the editor cannot draft something the apply layer would then reject. The check lives in BOTH
// places on purpose: core rejects early and cheaply, the apply layer re-checks as its last gate.

(function () {
  const R = globalThis.Editor || {};

   // --- individual validators: each returns an array of error strings (empty == passed) ---
  function opShape(op, i) {
    const out = [];
    if (!op || typeof op !== 'object') return [`operations[${i}] is not an object`];
    const withRecord = op.op === 'upsert' || op.op === 'create', byId = op.op === 'remove' || op.op === 'delete';
    if (withRecord && (!op.connection || typeof op.connection !== 'object')) out.push(`operations[${i}].connection missing`);
    else if (byId && typeof op.id !== 'string') out.push(`operations[${i}].id must be a string`);
    else if (!withRecord && !byId) out.push(`operations[${i}].op is unknown: ${String(op.op)}`);
    return out;
   }

   // endpoint completeness — the heart of "can this record ever be a legal connection?".
  function recordCompleteness(connection, where) {
    const out = [];
    if (!connection || typeof connection !== 'object' || Array.isArray(connection)) return [`${where}: connection is not an object`];
    if (typeof connection.id !== 'string' || !connection.id) out.push(`${where}.id must be a non-empty string`);
    if (connection.one_way !== undefined && connection.one_way !== true) out.push(`${where}.one_way must be true when present`);
    const oneWay = connection.one_way === true;
    for (const key of ['a', 'b']) {
      const ep = connection[key];
      if (!ep || typeof ep !== 'object') { out.push(`${where}.${key}: endpoint missing`); continue; }
      if (typeof ep.scene !== 'string' || !ep.scene) out.push(`${where}.${key}.scene must name a scene`);
      if (!Array.isArray(ep.triggers)) out.push(`${where}.${key}.triggers must be an array`);
      // one-way: a is trigger-only (no spawn), b is arrival-only (spawn, no triggers)
      if (oneWay && key === 'a') { if (ep.spawn !== undefined) out.push(`${where}.a.spawn is not allowed on a one-way connection`); continue; }
      if (oneWay && key === 'b' && Array.isArray(ep.triggers) && ep.triggers.length) out.push(`${where}.b.triggers must be empty on a one-way connection`);
      if (!ep.spawn || typeof ep.spawn.tx !== 'number') out.push(`${where}.${key}.spawn.tx must be numeric`);
     }
    return out;
   }

   // unknown-remove: a remove naming an id absent from the registry is almost always a typo.
  function unknownRemove(op, i, knownIds) {
    if (op.op === 'create' && op.connection && knownIds && knownIds.has(op.connection.id)) return [`operations[${i}] creates existing id "${op.connection.id}"`];
    if (op.op !== 'remove' && op.op !== 'delete') return [];
    if (!knownIds || !knownIds.has(op.id)) return [`operations[${i}] removes unknown id "${op.id}"`];
    return [];
   }

   // duplicate upsert of the same id inside ONE changeset is a smell (last-wins hides intent).
  function duplicateUpsertInChangeset(cs) {
    const out = [];
    const seen = new Set();
    cs.operations.forEach(function (op, i) {
      if (op.op === 'upsert' && op.connection && typeof op.connection.id === 'string') {
        if (seen.has(op.connection.id)) out.push(`operations[${i}] upserts an id already upserted earlier: ${op.connection.id}`);
        seen.add(op.connection.id);
       }
     });
    return out;
   }

   // The ordered validator list. Each takes (changeset, ctx) and returns error strings.
  const DEFAULT_VALIDATORS = Object.freeze([
    function opShapes(cs, ctx) { const o = []; cs.operations.forEach(function (op, i) { opShape(op, i).forEach(e => o.push(e)); }); return o; },
    function recordShapes(cs, ctx) {
      const o = [];
      cs.operations.forEach(function (op, i) { if (op.op === 'upsert' || op.op === 'create') recordCompleteness(op.connection, `operations[${i}].connection`).forEach(e => o.push(e)); });
      return o;
     },
    function registryRefs(cs, ctx) {
      const o = [];
      const knownIds = new Set((ctx && ctx.registry && ctx.registry.connections || []).map(function (c) { return c.id; }));
      cs.operations.forEach(function (op, i) { unknownRemove(op, i, knownIds).forEach(e => o.push(e)); });
      return o;
     },
    duplicateUpsertInChangeset
   ]);

   // runValidators(changeset, ctx?, validators?) -> { ok, errors }. Collects EVERY error (non-throwing).
  function runValidators(changeset, ctx, validators) {
    const cs = changeset || { operations: [] };
    ctx = ctx || {};
    const list = validators || DEFAULT_VALIDATORS;
    const errors = [];
    for (const v of list) {
      try { (v(cs, ctx) || []).forEach(function (e) { errors.push(e); }); }
      catch (err) { errors.push('validator threw: ' + String(err && err.message || err)); }
      }
    return { ok: errors.length === 0, errors: errors };
   }

   // assertValid throws on the first error — the "fail loud" entry point apply/commit would use.
  function assertValid(changeset, ctx, validators) {
    const res = runValidators(changeset, ctx, validators);
    if (!res.ok) throw new Error('[validation] changeset invalid:\n  - ' + res.errors.join('\n  - '));
    return true;
   }

  R.validation = Object.freeze({ opShape, recordCompleteness, unknownRemove, duplicateUpsertInChangeset, DEFAULT_VALIDATORS, runValidators, assertValid });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.validation;
  return R.validation;
})();
