'use strict';

// EDITOR CORE — history. A pure command-based UNDO/REDO stack over arbitrary immutable state. Each edit
// is a Memento { id, label, from, to }; commit appends the transition to `past` and clears any `future`
// redo tail (a fresh action invalidates stale redos). undo/redo just navigate the snapshot pair, so
// they reach KNOWN states without replaying side effects — which fits the rest of the pipeline, where an
// edit is a pure reducer (applyChangeset(registry, cs)) that yields a frozen next registry.
//
// State values are held BY REFERENCE, not cloned: callers pass already-frozen snapshots (the registry,
// a model), so history never deep-copies and never mutates what it stores. This module is generic — it
// knows nothing about connections or the runtime; it only moves an opaque value between slots.

(function () {
  const R = globalThis.Editor || {};

    // freezeHistory deep-freezes the three-level structure: Object.freeze is SHALLOW, so each stack array
    // must be frozen on its own — a container that merely wraps unfrozen arrays would let a caller grow or
    // rewrite history from outside (the trap draft.js dodges by wrapping its ops array). Commands are already
    // frozen; the state snapshots inside are frozen by their callers, so this fully seals the structure.
  function freezeHistory(past, present, future) {
    return Object.freeze({ past: Object.freeze(past), present: present, future: Object.freeze(future) });
   }

     // create(initial) -> a fresh history with one known starting state and no undo/redo available yet.
  function create(initial) {
    return freezeHistory([], initial, []);
        }

    // commit(hist, next, opts?) -> execute an edit: push the transition to `past`, set `present=next`,
    // and drop any redo tail (the action forks the timeline). A no-op commit (same reference) is a cheap
    // identity return — it must not create an empty undo step or clear a usable redo tail.
  function commit(hist, next, opts) {
    opts = opts || {};
    if (next === hist.present) return hist;
    const id = opts.id != null ? String(opts.id) : 'cmd-' + (hist.past.length + 1);
      const command = Object.freeze({ id: id, label: opts.label == null ? null : String(opts.label), from: hist.present, to: next });
      return freezeHistory(hist.past.concat([command]), next, []);
         }

         // undo -> step back one command: the previous state becomes present and the command moves to `future`.
    function undo(hist) {
      if (hist.past.length === 0) return hist;
      const command = hist.past[hist.past.length - 1];
      return freezeHistory(hist.past.slice(0, -1), command.from, [command].concat(hist.future));
           }

          // redo -> step forward one command, taking it off the `future` tail back into `past`.
    function redo(hist) {
      if (hist.future.length === 0) return hist;
      const command = hist.future[0];
      return freezeHistory(hist.past.concat([command]), command.to, hist.future.slice(1));
         }

     // Predicates a UI binds its buttons to. Exposed on the object too via these helpers so a render can
     // cheaply enable/disable without recomputing lengths by hand.
  function canUndo(hist) { return hist.past.length > 0; }
  function canRedo(hist) { return hist.future.length > 0; }
    // labelOf -> the human label of the command that would be undone/redo'd, or null when none is pending.
  function nextUndoLabel(hist) { return canUndo(hist) ? hist.past[hist.past.length - 1].label : null; }
  function nextRedoLabel(hist) { return canRedo(hist) ? hist.future[0].label : null; }

  R.history = Object.freeze({ create, commit, undo, redo, canUndo, canRedo, nextUndoLabel, nextRedoLabel });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.history;
  return R.history;
})();
