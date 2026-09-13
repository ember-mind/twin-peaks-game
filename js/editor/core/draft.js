'use strict';

// EDITOR CORE — draft. A pure accumulator of connection operations that produces a versioned
// changeset. Zero game references: it knows only "upsert this record" / "remove this id". The
// apply layer (js/editor/apply) is what ever touches the filesystem or a registry file; this
// module never does.
//
// Every operation returns a NEW frozen draft, so drafts are shareable and order-stable — no
// caller can mutate history out from under a sibling. Records are deep-cloned on entry because
// the changeset pipeline treats records as JSON-serializable (an invariant apply relies on too):
// an owned copy stops a live editor object's later edits bleeding into a frozen changeset.

const Editor = (function () {
  const R = globalThis.Editor || {};

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  // createDraft(author?) -> the empty, frozen starting point.
  function createDraft(author) {
    return Object.freeze({ author: author == null ? null : author, operations: [] });
  }

  // upsertConnection(draft, connection) -> new draft with an append-only upsert op owning a copy.
  function upsertConnection(draft, connection) {
    const op = Object.freeze({ op: 'upsert', connection: clone(connection) });
    return Object.freeze({ author: draft.author, operations: draft.operations.concat([op]) });
  }

  // removeConnection(draft, id) -> new draft with an append-only remove op. Idempotence of the
  // *reduce* lives in changeset.js; here we only record intent.
  function removeConnection(draft, id) {
    const op = Object.freeze({ op: 'remove', id: id });
    return Object.freeze({ author: draft.author, operations: draft.operations.concat([op]) });
  }

  // toChangeset(draft) -> a serializable, frozen changeset. Pure + deterministic: the same draft
  // always yields the same changeset, which is what makes a change reproducible and testable.
  function toChangeset(draft) {
    return Object.freeze({
      version: 0,
      author: draft.author == null ? null : draft.author,
      operations: Object.freeze(draft.operations.slice())
    });
  }

  // A changeset is empty when it carries no ops (the no-op case the reducer must leave untouched).
  function isEmptyChangeset(cs) { return !cs || cs.operations.length === 0; }

  R.draft = Object.freeze({ createDraft, upsertConnection, removeConnection, toChangeset, isEmptyChangeset });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.draft;
  return R.draft;
})();
