'use strict';

// EDITOR CORE — inspector. A SCHEMA-DRIVEN property read-out: given a selected ENTITY (any plain object)
// and a field SCHEMA, it emits structured rows { key, label, value, editable } the UI can render as a
// property panel. The module holds NO per-type knowledge — it never branches on what an entity "is". A
// caller supplies the right schema for the selected kind (a location schema, a connection schema, …);
// applying two different schemas through this one code path is the proof that nothing is hardcoded.
//
// WHY SCHEMA-DRIVEN: the M3 inspector intent lists many fields (LOCATION/SCENE/TYPE for every overlay,
// CONNECTION ID plus both endpoints' scene+spawn+dir for a connection). A switch-on-kind would have to
// grow with every new field and is impossible to unit-drive without game data. A schema keeps core pure,
// game-agnostic, and testable over synthetic objects.
//
// DESIGN NOTES:
//   - keys are DOT-PATHS ('a.spawn.tx'), so nested fields surface without a per-nesting case. The leaf
//    names in this domain are colon-free ids (identity.js), so '.' is unambiguously a separator.
//   - `editable` defaults to FALSE: the read-model philosophy makes panels read-only by default, and an
//    edit path must opt in explicitly. A field whose value is absent can never be edited, so it coerces
//    to false — you cannot write a coordinate that does not exist.
//   - `key` rides on each row as load-bearing metadata: an editable row without its source path could not
//    be wired back to a commit (draft.js addresses fields by path). It is additive, not invented data.
//   - absent fields are SURFACED (row with value null), never hidden — matching the "no paired record
//    loaded" fallback intent: show the gap rather than pretend the field does not exist.
//   - PURE + FROZEN: no DOM, no mutation of the entity or schema; inspect() returns a frozen row array.

const Editor = (function () {
  const R = globalThis.Editor || {};

    // read a dotted key out of an object; any missing hop yields null rather than throwing, so an unset
    // field becomes value:null and an author can still surface it in the panel.
  function fieldPath(obj, key) {
    if (obj == null || key == null) return null;
    const parts = String(key).split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== 'object') return null;
      if (!Object.prototype.hasOwnProperty.call(cur, parts[i])) return null;
      cur = cur[parts[i]];
      }
    return cur === undefined ? null : cur;
    }

    // humanize('a.spawn.tx') -> 'A Spawn Tx': split the path, capitalize each segment. A label override on
    // the field wins, so this is only a sensible default when the author did not name it.
  function humanize(key) {
    return String(key).split('.')
      .map(function (seg) { return seg.length ? (seg[0].toUpperCase() + seg.slice(1)) : seg; })
      .join(' ');
    }

    // makeField(desc) -> a frozen, normalized field descriptor. Defaults: label from the key, type 'any',
    // editable false. `editable` may be a predicate (value, entity)->bool for conditional editability.
  function makeField(desc) {
    if (!desc || typeof desc.key !== 'string' || !desc.key) throw new Error('[inspector] field needs a string key');
    const label = (typeof desc.label === 'string' && desc.label.length) ? desc.label : humanize(desc.key);
    const editable = (typeof desc.editable === 'function') ? desc.editable : !!desc.editable;
    return Object.freeze({ key: desc.key, label: label, type: desc.type || 'any', editable: editable });
    }

    // makeSchema(fields) -> a frozen schema. Accepts either a raw field array or { fields, title }; fields
    // are normalized through makeField so callers may pass partially-specified descriptors.
  function makeSchema(input) {
    const raw = Array.isArray(input) ? input : (input && Array.isArray(input.fields)) ? input.fields : null;
    if (!raw) throw new Error('[inspector] schema needs a fields array or { fields, title }');
    const title = (!Array.isArray(input) && input.title) ? String(input.title) : null;
    return Object.freeze({ title: title, fields: Object.freeze(raw.map(makeField)) });
    }

    // resolve one field over an entity into a row. The value drives both display and editability: an absent
    // field (path misses) yields value:null and forced non-editable; a predicate editable is evaluated at
    // the value+entity so "editable only when N>0" works, and a throwing predicate propagates (fail loud).
  function resolveRow(entity, field) {
    const value = fieldPath(entity, field.key);
    let editable = false;
    if (value !== null) {
      editable = typeof field.editable === 'function' ? !!field.editable(value, entity) : !!field.editable;
      }
    return Object.freeze({ key: field.key, label: field.label, value: value, type: field.type, editable: editable });
    }

    // inspect(entity, schemaOrFields) -> frozen row[]. Applies the schema over the entity in declaration
    // order. A null/undefined entity yields an empty array (nothing to read); a raw field array is accepted
    // for ergonomics and normalized via makeSchema. The same code path serves every entity kind — there is
    // no per-type branch here, which is the whole point of being schema-driven.
  function inspect(entity, schemaOrFields) {
    if (entity == null) return Object.freeze([]);
    const schema = Array.isArray(schemaOrFields) ? makeSchema(schemaOrFields) : schemaOrFields;
    return Object.freeze(schema.fields.map(function (f) { return resolveRow(entity, f); }));
    }

    // rowsForEntityKind is intentionally NOT provided: mapping a selection kind to its schema is glue-layer
    // concern. Keeping that mapping out of core is what lets this module stay generic and game-agnostic.

  R.inspector = Object.freeze({ makeField, makeSchema, inspect, fieldPath, humanize });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.inspector;
  return R.inspector;
})();
