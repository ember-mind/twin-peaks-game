#!/usr/bin/env node
'use strict';

// Editor selection + history — the interactive core. Selection is a frozen SET of stable ids; history is
// a pure Memento command stack that navigates KNOWN state snapshots (the same frozen registries the
// changeset reducer produces). This test drives a select -> edit -> undo -> redo sequence and asserts
// each landing spot equals a hand-named expected state, proving undo/redo reach real known states and
// that a fresh action invalidates stale redos. Zero runtime refs; all data is synthetic.

const assert = require('node:assert/strict');
const Selection = require('../../js/editor/core/selection.js');
const History = require('../../js/editor/core/history.js');
let pass = 0;
function ok(cond, label) { assert.ok(cond, label); pass++; }

// ================= SELECTION (stable-id set) =================
const empty = Selection.createSelection();
assert.deepEqual(empty.ids, [], 'createSelection is an empty frozen set');
ok(Object.isFrozen(empty), 'selection object is frozen (no caller can mutate the id list)');

let one = Selection.select(empty, 'npc:chef:diner');
ok(one.ids.length === 1 && one.ids[0] === 'npc:chef:diner', 'select replaces to a single selection');
ok(Selection.currentId(one) === 'npc:chef:diner', 'currentId is the topmost selected entity (for the inspector)');

// idempotent single-select returns the SAME object (no needless allocation)
ok(Selection.select(one, 'npc:chef:diner') === one, 'selecting the lone active id is a no-op identity return');

let multi = Selection.addTo(one, 'endpoint:conn-1:a');
assert.deepEqual(multi.ids, ['npc:chef:diner', 'endpoint:conn-1:a'], 'addTo accumulates in first-inserted order (stable)');
ok(Selection.isSelected(multi, 'endpoint:conn-1:a') && !Selection.isSelected(multi, 'trigger:conn-1:0'), 'membership reflects exactly the selected ids');
let toggled = Selection.toggle(multi, 'npc:chef:diner'); // shift-click removes the first
assert.deepEqual(toggled.ids, ['endpoint:conn-1:a'], 'toggle flips membership (multi-select accumulation)');
ok(Selection.createSelection().ids.length === 0 && Selection.clear().ids.length === 0, 'clear resets to empty (scene-change semantics)');

// ================= HISTORY (command-based undo/redo over known states) =================
// Named snapshots — the "known states" the stack must land on.
const S0 = Object.freeze({ step: 0 });
const S1 = Object.freeze({ step: 1, label: 'added chef' });
const S2 = Object.freeze({ step: 2, label: 'moved door' });
const S3 = Object.freeze({ step: 3, label: 'renamed npc' });

let h = History.create(S0);
assert.equal(h.present, S0, 'create lands on the known starting state');
ok(!History.canUndo(h) && !History.canRedo(h), 'a fresh history can neither undo nor redo');
// no-op commit is identity: it must not mint an empty step or wipe a usable redo tail
ok(History.commit(h, S0) === h, 'committing the present again is a no-op (no empty undo step)');

h = History.commit(h, S1, { label: 'add chef' });
assert.equal(h.present, S1, 'commit reaches known state S1');
ok(History.canUndo(h) && !History.canRedo(h) && h.future.length === 0, 'after a commit undo is available, redo is not');

h = History.commit(h, S2, { label: 'move door' });
assert.equal(h.present, S2, 'second commit reaches known state S2');
ok(History.nextUndoLabel(h) === 'move door', 'next undo surfaces the top command label');

// undo/redo navigate to KNOWN states, not just "back one"
h = History.undo(h);
assert.equal(h.present, S1, 'undo from S2 lands on known state S1');
ok(History.canRedo(h) && History.nextRedoLabel(h) === 'move door', 'after undo, redo is available and names the pending command');
h = History.redo(h);
assert.equal(h.present, S2, 'redo from S1 returns to known state S2');

// After an undo there IS a redo tail (undo moves commands onto it); a fresh commit must INVALIDATE that
// tail — the timeline forks. h is at S2; one undo opens a redo, then committing a new state clears it.
h = History.undo(h);                 // S2 -> S1, future now holds the undone command
ok(History.canRedo(h), 'an undo opens a redo tail (the undone command is recoverable)');
const forkedReal = History.commit(h, S3, { label: 'rename' });   // commit from S1 to S3
assert.equal(forkedReal.present, S3, 'a new commit after undo reaches known state S3');
ok(!History.canRedo(forkedReal), 'the new commit cleared the stale redo tail (timeline fork)');



// deep-sequence to a known final state, then full round-trip back to origin
let seq = History.create(S0);
seq = History.commit(seq, S1, { label: 'a' });
seq = History.commit(seq, S2, { label: 'b' });
seq = History.commit(seq, S3, { label: 'c' });
assert.equal(seq.present, S3, 'three commits reach the known tail state S3');
ok(seq.past.length === 3 && seq.future.length === 0, 'the undo stack holds every committed transition');
seq = History.undo(seq); seq = History.undo(seq); seq = History.undo(seq);
assert.equal(seq.present, S0, 'three undos walk back to the known origin state S0');
ok(!History.canUndo(seq) && History.canRedo(seq), 'at the origin, undo is gone and the full redo path is available');
// undo pops newest-first, so `future` front is the most-recently-undone command: a single redo would
// jump back to the tail (S3), not the oldest. Three redos round-trip the whole timeline to S3.
seq = History.redo(seq); seq = History.redo(seq); seq = History.redo(seq);
assert.equal(seq.present, S3, 'three redos round-trip back to the known tail state S3');


// ================= INTEGRITY: frozen snapshots & no caller mutation of the stack =================
ok(Object.isFrozen(seq) && Object.isFrozen(seq.past) && Object.isFrozen(seq.future), 'history and its stacks are frozen (no external rewrite)');
const before = seq.past.length;
// In this file's strict mode an append to a frozen array THROWS; in sloppy mode it would be silently
// inert. Either way the stack must not grow — assert the outcome, not the mechanism.
let mutated = false;
try { seq.past.push({ id: 'x', label: 'y', from: S0, to: S1 }); } catch (e) { mutated = true; }
ok(mutated || seq.past.length === before, 'a frozen stack resists a caller append (throws in strict mode or is inert)');
ok(seq.past.length === before, 'the frozen past did not grow after the append attempt');


// ================= SELECTION DRIVEN THROUGH HISTORY (the real edit loop) =================
// A "state" here carries the current selection; editing = a new selection committed into history.
const base = Selection.createSelection();
let s1 = Selection.select(base, 'npc:chef:diner');
let s2 = Selection.addTo(s1, 'endpoint:conn-1:a');
let s3 = Selection.toggle(s1, 'npc:chef:diner'); // deselects the chef -> back to just the endpoint? no: s1 has chef only
assert.deepEqual(s3.ids, [], 'toggle on a single-element selection deselects it (known empty state)');
let hi = History.create(base);
hi = History.commit(hi, s1, { label: 'select chef' });
hi = History.commit(hi, s2, { label: 'multi-select endpoint' });
assert.equal(History.canUndo(hi), true, 'editing selection is undoable');
const undone = History.undo(hi);
assert.deepEqual(undone.present.ids, ['npc:chef:diner'], 'undoing a multi-select edit lands on the known prior selection state');
ok(undone.present === s1, 'the undo landed on the exact frozen selection object, not a copy');

console.log(`EDITOR-HISTORY-PASS ${pass}`);
