/* world-builder-coords.js — WORLD BUILDER v0.1 M1 (pure, no DOM).
 *
 * Canvas <-> tile geometry for the editor. Overlay coordinates are TILE units (the same
 * units GAME.Maps and connection records use); the canvas renders them at an integer zoom.
 * Kept pure so a Node test can assert coordinate accuracy without a real canvas — this is
 * the property that makes "click the right pixel selects the right overlay" trustworthy.
 */
(function () {
  'use strict';

   // Tile (tx,ty) -> top-left canvas pixel of that tile's cell at integer zoom.
  function tileToPixel(tx, ty, zoom) {
    return { px: tx * zoom, py: ty * zoom };
   }

   // Canvas pixel -> tile column/row containing it (inverse of tileToPixel). Floor because a
   // pixel anywhere inside a cell maps to that cell; negative pixels clamp to 0.
  function pixelToTile(px, py, zoom) {
    var z = zoom || 1;
    return { tx: Math.max(0, Math.floor(px / z)), ty: Math.max(0, Math.floor(py / z)) };
   }

   // Which overlay contains this canvas pixel? Returns the topmost (last-pushed wins) or null.
   // An exit/npc is a single tile; an object region spans w x h cells. A hit anywhere inside a
   // region's footprint resolves to that object — so multi-tile landmarks are selectable too.
  function hitTest(overlays, px, py, zoom) {
    var z = zoom || 1;
    var t = pixelToTile(px, py, z);
    for (var i = (overlays || []).length - 1; i >= 0; i--) {
      var o = overlays[i];
      if (o.tx <= t.tx && t.tx < (o.tx + (o.w || 1)) &&
          o.ty <= t.ty && t.ty < (o.ty + (o.h || 1))) return o;
     }
    return null;
   }

  var api = { tileToPixel: tileToPixel, pixelToTile: pixelToTile, hitTest: hitTest };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.GAME = window.GAME || {}, window.GAME.WorldBuilderCoords = api;
})();
