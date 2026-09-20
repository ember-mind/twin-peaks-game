/* ember-viewport.js — Ember Engine: native-resolution 2D canvas.
 *
 * The backing store is the logical resolution and nothing else; CSS scales it
 * with nearest-neighbour. UI coordinates must never be derived from device
 * pixels, which is the bug this module exists to make unrepeatable.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var EMBER = root.EMBER = root.EMBER || {};
  var V = EMBER.Viewport = EMBER.Viewport || {};

  V.sizeNative = function (canvas, width, height) {
    if (!canvas) return false;
    var changed = false;
    if (canvas.width !== width) { canvas.width = width; changed = true; }
    if (canvas.height !== height) { canvas.height = height; changed = true; }
    return changed;
  };

  V.attachNative = function (canvas, width, height) {
    if (!canvas) return null;
    V.sizeNative(canvas, width, height);
    var ctx = canvas.getContext('2d');
    if (ctx) ctx.imageSmoothingEnabled = false;
    return ctx;
  };

  /* Largest integer scale that still fits, never below 1: half pixels are what
   * turn pixel art into mush. */
  V.integerScale = function (availableW, availableH, width, height) {
    var s = Math.floor(Math.min(availableW / width, availableH / height));
    return s < 1 ? 1 : s;
  };
})();
