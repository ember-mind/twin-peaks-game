/* ember-camera.js — Ember Engine: follow camera primitives.
 *
 * Only two facts live here: how a world axis is clamped into a viewport, and
 * how the camera eases toward its target. Per-scene framing offsets stay with
 * whoever knows the scene.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var EMBER = root.EMBER = root.EMBER || {};
  if (typeof require === 'function' && !EMBER.Math) require('./ember-math.js');
  var M = EMBER.Math;
  var C = EMBER.Camera = EMBER.Camera || {};

  /* World smaller than the viewport centres instead of clamping, which is why
   * this cannot be a bare clamp() at the call site. */
  C.clampAxis = function (value, worldSize, viewSize) {
    if (worldSize > viewSize) return M.clamp(value, 0, worldSize - viewSize);
    return (worldSize - viewSize) / 2;
  };

  C.axisScrolls = function (worldSize, viewSize) { return worldSize > viewSize; };

  /* Centre the viewport on a world position. anchorX/anchorY shift the focus
   * inside the subject (half a tile, typically). */
  C.centerOn = function (targetX, targetY, opts) {
    opts = opts || {};
    var ax = opts.anchorX || 0, ay = opts.anchorY || 0;
    return {
      x: C.clampAxis(targetX + ax - opts.viewW / 2, opts.worldW, opts.viewW),
      y: C.clampAxis(targetY + ay - opts.viewH / 2, opts.worldH, opts.viewH)
    };
  };

  C.approach = function (current, target, dt, rate) {
    return M.approach(current, target, dt, rate === undefined ? 0.012 : rate);
  };
})();
