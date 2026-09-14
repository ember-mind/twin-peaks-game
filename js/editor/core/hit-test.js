'use strict';

// EDITOR CORE — hit-test. Pure TOPMOST-WINS selection over an ordered selectable list. The editor
// paints overlays bottom-to-top, so "the item the click lands on" is always the LAST-painted one whose
// footprint covers the tile — later index wins every tie, across all kinds (an npc painted above an
// object on the same tile owns that tile). This mirrors canvas hit-testing where paint order IS z-order.
//
// A "selectable" carries { id, kind, tx, ty, w?, h? }. w/h default to 1 (single-tile markers); a
// multi-tile object covers the rectangle [tx..tx+w) x [ty..ty+h). The list is the single source of
// truth for z-order: callers feed it in paint order and get the topmost match back, so the test's
// "two items on one tile -> the topmost" assertion holds trivially and deterministically.

(function () {
  const R = globalThis.Editor || {};

   // A selectable covers a tile when its rectangle contains it. Missing w/h default to 1 (a single-tile
   // marker, the common case); an explicitly non-positive size is malformed and covers nothing (fail
   // closed), so a broken marker can never intercept a click that should fall through to empty ground.
  function covers(sel, tx, ty) {
    if (!sel || typeof sel.tx !== 'number' || typeof sel.ty !== 'number') return false;
    const w = sel.w != null ? sel.w : 1;
    const h = sel.h != null ? sel.h : 1;
    if (w < 1 || h < 1) return false;
    return tx >= sel.tx && tx < sel.tx + w && ty >= sel.ty && ty < sel.ty + h;
     }

   // Topmost match in PAINT order: iterate bottom-to-top, keeping the last coverage found. Returning
   // null on no hit lets the click fall through to empty ground. O(n) over one tile's candidates.
  function hitTest(selectables, tx, ty) {
    let top = null;
    for (let i = 0; i < selectables.length; i++) {
      if (covers(selectables[i], tx, ty)) top = selectables[i]; // later wins: overwrite each tie
       }
     return top;
     }

    // Convenience: hit-test by id only. The selection layer wants an id, not the whole selectable.
  function hitTestId(selectables, tx, ty) {
    const hit = hitTest(selectables, tx, ty);
    return hit ? hit.id : null;
     }

   // Stable z-order for a model scene: paint exits under objects under npcs (npcs are on top and win
   // ties). Kept in one place so the renderer and hit-test cannot disagree about what is "on top".
  function flattenScene(scene) {
    if (!scene || !scene.byKind) return [];
    const out = [];
     (scene.byKind.exits || []).forEach(function (o) { out.push(o); });
     (scene.byKind.objects || []).forEach(function (o) { out.push(o); });
     (scene.byKind.npcs || []).forEach(function (o) { out.push(o); });
    return out;
     }

   // Hit-test a model scene at a tile in one call: flatten to paint order, then topmost-wins.
  function hitTestScene(scene, tx, ty) {
    return hitTestId(flattenScene(scene), tx, ty);
     }

  R.hitTest = Object.freeze({ covers, hitTest, hitTestId, flattenScene, hitTestScene });
  globalThis.Editor = R;
  if (typeof module !== 'undefined' && module.exports) module.exports = R.hitTest;
  return R.hitTest;
})();
