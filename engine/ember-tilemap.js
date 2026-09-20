/* ember-tilemap.js — Ember Engine: character-grid painting and depth order.
 *
 * The map is rows of characters. What a character looks like is content, so it
 * arrives as a callback; which cells are visible this frame is geometry, so it
 * lives here.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var EMBER = root.EMBER = root.EMBER || {};
  if (typeof require === 'function' && !EMBER.Math) require('./ember-math.js');
  var M = EMBER.Math;
  var T = EMBER.Tilemap = EMBER.Tilemap || {};

  /* Visible cell window, with overdraw. Sprites taller or wider than their
   * anchoring cell would otherwise pop in and out while the camera crosses a
   * tile boundary. */
  T.visibleRange = function (opts) {
    var tile = opts.tile;
    var overdraw = opts.overdraw === undefined ? 0 : opts.overdraw;
    return {
      x0: Math.floor(opts.camX / tile) - overdraw,
      y0: Math.floor(opts.camY / tile) - overdraw,
      x1: Math.floor((opts.camX + opts.viewW - 1) / tile) + overdraw,
      y1: Math.floor((opts.camY + opts.viewH - 1) / tile) + overdraw
    };
  };

  /* Paint the visible window. Outside the map the border cell repeats.
   * drawCell(ctx, ch, screenX, screenY, mapX, mapY, rows) owns all art. */
  T.paintWindow = function (ctx, opts, drawCell) {
    var rows = opts.rows, tile = opts.tile;
    var range = T.visibleRange(opts);
    var maxX = opts.width - 1, maxY = opts.height - 1;
    var painted = 0;
    for (var y = range.y0; y <= range.y1; y++) {
      for (var x = range.x0; x <= range.x1; x++) {
        var mx = M.clamp(x, 0, maxX);
        var my = M.clamp(y, 0, maxY);
        drawCell(ctx, rows[my][mx], x * tile - opts.camX, y * tile - opts.camY, mx, my, rows);
        painted++;
      }
    }
    return painted;
  };

  /* Painter's order by foot position. Stable, so entities sharing a row keep
   * the order the caller built them in. */
  T.depthSort = function (entities) {
    return entities.sort(function (a, b) { return a.wy - b.wy; });
  };

  /* Painter's order with scenery interleaved. Entities arrive depth-sorted;
   * between one entity's feet and the next one's, the scene gets the chance
   * to redraw whatever stands in that band, so a counter covers the person
   * behind it and not the person in front. What is redrawn is the caller's
   * business: drawBand(minFootY, maxFootY, afterIndex) with afterIndex -1 for
   * the band behind everyone. */
  T.paintDepthBands = function (entities, footOffset, drawEntity, drawBand) {
    var first = entities.length ? entities[0].wy + footOffset : Infinity;
    drawBand(-Infinity, first, -1);
    for (var i = 0; i < entities.length; i++) {
      drawEntity(entities[i], i);
      var foot = entities[i].wy + footOffset;
      var next = i + 1 < entities.length ? entities[i + 1].wy + footOffset : Infinity;
      drawBand(foot, next, i);
    }
    return entities.length;
  };
})();
