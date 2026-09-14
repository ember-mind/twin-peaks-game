'use strict';

// EDITOR CORE — interaction. The pointer→intent layer that turns raw pixel events into editor
// actions (select / drag) without ever naming the canvas, document, or window. A caller injects a
// SURFACE that maps pixels to tiles; this module does all the rest in tile space over an ordered
// selectable list, reusing hit-test.js (topmost-wins), selection.js (the active set) and draft.js
// (the recorded change). It knows nothing of model.js: the caller builds the selectables (endpoints
// land at model.endpointSpawn(...) tiles) and hands them in, so this layer stays a pure state
// machine over plain data.
//
// WHY INJECTABLE: tests drive a fake surface (no jsdom/canvas), the renderer adapts its real pixel
// rect onto makeGridSurface(). A session is FROZEN between events so it composes with history.js —
// every handler returns a new frozen session, never mutating the one it was given, and the source
// registry is deep-cloned on a drag so the authoritative record is never touched in place.
//
// DRAG SEMANTICS (deliberate): a drag MOVES ONE endpoint/spawn to its final tile and records ONE
// upsert op at that final position — not one op per pixel crossed. We rebuild the moved record from
// the untouched registry on every dragTo, so a 10-tile gesture coalesces to a single change. If the
// pointer returns to the origin tile, nothing is recorded (an empty changeset), matching "moved" vs
// "hovered in place". A connection endpoint's stable id encodes connId+side via identity.js, so a
// hit tells us exactly which record side to move without recomputing it.

(function () {
  const R = globalThis.Editor || {};

  // Sibling core modules are fetched lazily: in the browser they already live on Editor.* by load
  // order; under node we require the file, which registers the same object back onto Editor. Both
  // paths yield the identical API, so a session is never bound to a stale or partial namespace.
  function getIdentity() { if (R.identity) return R.identity; try { return require('./identity.js'); } catch (e) { throw new Error('[interaction] identity.js unavailable'); } }
  function getHitTest() { if (R.hitTest) return R.hitTest; try { return require('./hit-test.js'); } catch (e) { throw new Error('[interaction] hit-test.js unavailable'); } }
  function getDraft() { if (R.draft) return R.draft; try { return require('./draft.js'); } catch (e) { throw new Error('[interaction] draft.js unavailable'); } }
  function getSelection() { if (R.selection) return R.selection; try { return require('./selection.js'); } catch (e) { throw new Error('[interaction] selection.js unavailable'); } }

  // A deep, JSON-only clone: connection records are JSON-serializable by invariant, so this copies
  // every field the apply pipeline also relies on and detaches our preview from the authoritative
  // record. Kept local to avoid pulling a second dependency into this module's require graph.
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  // makeGridSurface({tileSize, cols, rows}) -> a frozen injectable surface mapping pixel→tile. This is
  // the concrete shape the renderer adapts its canvas rect onto; tests may instead pass any object
  // exposing pxToTile(px,py)->{tx,ty}|null, so nothing here assumes real pixels.
  function makeGridSurface(opts) {
    const tileSize = (opts && opts.tileSize) || 16;
    const cols = (opts && opts.cols) || 0;
    const rows = (opts && opts.rows) || 0;
    function pxToTile(px, py) {
      if (px < 0 || py < 0) return null;
      const tx = Math.floor(px / tileSize);
      const ty = Math.floor(py / tileSize);
      if (tx >= cols || ty >= rows) return null; // off-grid: a click in the letterbox moves nothing
      return { tx: tx, ty: ty };
    }
    return Object.freeze({ tileSize: tileSize, cols: cols, rows: rows, pxToTile: pxToTile });
  }

  // createSession(opts) -> the frozen starting point for one scene view. surface maps pixels to tiles;
  // selectables are paint-ordered (topmost LAST, matching hit-test z-order); registry is the read-only
  // source of truth a drag rebuilds from. mode 'idle' means no gesture in progress.
  function createSession(opts) {
    opts = opts || {};
    if (!opts.surface || typeof opts.surface.pxToTile !== 'function') throw new Error('[interaction] session needs a surface with pxToTile');
    return Object.freeze({
      surface: opts.surface,
      selectables: Object.freeze((opts.selectables || []).slice()),
      registry: opts.registry || { connections: [] },
      author: opts.author == null ? null : opts.author,
      selection: getSelection().createSelection(),
      mode: 'idle',
      drag: null,
      draft: null
    });
  }

  // pointerDown(session, event{x,y}) -> new session. Hit-test at the clicked tile (topmost wins). A hit
  // on a draggable endpoint begins a drag AND selects it; any other hit just selects; a miss or an
  // off-grid click CLEARS the selection (the editor norm: background click deselects).
  function pointerDown(session, event) {
    const Selection = getSelection();
    const tile = session.surface.pxToTile(event.x, event.y);
    if (!tile) return withState(session, Selection.clear(), 'idle', null, null);

    const hit = getHitTest().hitTest(session.selectables, tile.tx, tile.ty);
    if (!hit) return withState(session, Selection.clear(), 'idle', null, null);

    // An endpoint/spawn is draggable; its id encodes connId+side so we can rebuild that side's spawn.
    const parsed = getIdentity().parse(hit.id);
    if (parsed && parsed.kind === getIdentity().KINDS.ENDPOINT) {
      const record = findConnection(session.registry, parsed.connId);
      if (!record) throw new Error('[interaction] cannot drag endpoint of unknown connection "' + parsed.connId + '"');
      const sideData = record[parsed.side];
      const spawn = sideData && sideData.spawn;
      if (!spawn || typeof spawn.tx !== 'number' || typeof spawn.ty !== 'number') {
        // An arrival/trigger-only side has no tile to grab: select it but do not start a drag.
        return withState(session, Selection.select(session.selection, hit.id), 'idle', null, null);
      }
      const draft = getDraft().createDraft(session.author);
      const drag = Object.freeze({ connectionId: parsed.connId, side: parsed.side, fromSpawn: { tx: spawn.tx, ty: spawn.ty }, toSpawn: { tx: spawn.tx, ty: spawn.ty }, moved: false });
      return withState(session, Selection.select(session.selection, hit.id), 'dragging', drag, draft);
    }

    // A plain marker (exit/object/npc): select it, no drag.
    return withState(session, Selection.select(session.selection, hit.id), 'idle', null, null);
  }

   // dragTo(session, event{x,y}) -> new session. Only meaningful while dragging: retarget the grabbed
   // endpoint to the tile under the pointer and record a SINGLE coalesced upsert at that final position
   // (rebuilt from the untouched registry each call, so N pixels cross = one op). Both `moved` and the
   // recorded target TRACK THE CURRENT TILE: returning to the origin clears the move, so an endpoint that
   // wanders out and back records nothing. An off-grid pixel is ignored — the last on-grid target holds.
  function dragTo(session, event) {
    if (session.mode !== 'dragging' || !session.drag) return session;
    const tile = session.surface.pxToTile(event.x, event.y);
    if (!tile) return session; // off-grid: keep the last on-grid target

    const from = session.drag.fromSpawn;
    const moved = (tile.tx !== from.tx || tile.ty !== from.ty);
    const drag = Object.freeze(Object.assign(Object.create(null), session.drag, { toSpawn: { tx: tile.tx, ty: tile.ty }, moved: moved }));

     // Not moved off the origin yet (or back onto it): keep a live empty draft so pendingChangeset shows
    // "nothing would commit" without finalizing.
    if (!moved) return withState(session, session.selection, 'dragging', drag, getDraft().createDraft(session.author));

     // Rebuild the record from the authoritative registry and move only this side's spawn tile — every
     // other field (the opposite side, triggers, departureReaction, dir) is preserved. The clone means
    // the registry record is never mutated; the op owns its own copy for downstream apply/history.
    const record = findConnection(session.registry, session.drag.connectionId);
    if (!record) throw new Error('[interaction] cannot drag endpoint of unknown connection "' + session.drag.connectionId + '"');
    const movedRecord = clone(record);
    const origSide = movedRecord[session.drag.side];
    movedRecord[session.drag.side].spawn = { tx: tile.tx, ty: tile.ty, dir: (origSide.spawn && origSide.spawn.dir) || 'down' };

    const draft = getDraft().upsertConnection(getDraft().createDraft(session.author), movedRecord);
    return withState(session, session.selection, 'dragging', drag, draft);
   }

  // pointerUp(session) -> { session, changeset }. Finalize the gesture: yield the coalesced changeset
  // (one upsert when the endpoint actually moved, an empty changeset otherwise) and return to idle. A
  // non-dragging pointerUp is a no-op that still returns an empty changeset, so callers get one shape.
  function pointerUp(session) {
    const draft = session.draft || getDraft().createDraft(session.author);
    const changeset = getDraft().toChangeset(draft);
    const cleared = withState(session, session.selection, 'idle', null, null);
    return { session: cleared, changeset: changeset };
  }

  // cancelDrag(session) -> new session. Abort an in-progress drag without recording anything: the
  // endpoint snaps back (no op is produced) but the selection stays, so the user can retry or select.
  function cancelDrag(session) {
    if (session.mode !== 'dragging') return session;
    return withState(session, session.selection, 'idle', null, null);
  }

  // pendingChangeset(session) -> a frozen changeset previewing the in-progress move (empty when no move
  // has landed on a new tile yet), so a UI can show "what would commit" live without finalizing.
  function pendingChangeset(session) {
    const draft = session.draft || getDraft().createDraft(session.author);
    return getDraft().toChangeset(draft);
  }

  function isDragging(session) { return session && session.mode === 'dragging'; }

  // ---- helpers -----------------------------------------------------------------------------

  // findConnection(registry, id) -> the record or null. Registry holds a flat connections[] array.
  function findConnection(registry, connId) {
    const conns = registry && registry.connections;
    if (!Array.isArray(conns)) return null;
    for (let i = 0; i < conns.length; i++) if (conns[i].id === connId) return conns[i];
    return null;
  }

   // A fresh frozen session that copies the immutable shell and swaps in the four mutable-state slots.
  function withState(session, selection, mode, drag, draft) {
    return Object.freeze({
      surface: session.surface,
      selectables: session.selectables,
      registry: session.registry,
      author: session.author,
      selection: selection,
      mode: mode,
      drag: drag,
      draft: draft
     });
   }

  R.interaction = Object.freeze({
    makeGridSurface, createSession, pointerDown, dragTo, pointerUp, cancelDrag, pendingChangeset, isDragging
  });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.interaction;
  return R.interaction;
})();
