/* ember-math.js — Ember Engine: scalar helpers shared by every experience.
 *
 * Game-independent by construction: no GAME namespace, no map ids, no story
 * state. Twin Peaks and Living Town both execute these functions.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var EMBER = root.EMBER = root.EMBER || {};
  var M = EMBER.Math = EMBER.Math || {};

  M.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  M.lerp = function (a, b, t) { return a + (b - a) * t; };

  /* Cubic smoothstep on an already normalised 0..1 parameter. The grid step
   * easing of both experiences comes from here; changing it changes both. */
  M.smoothstep = function (t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t * t * (3 - 2 * t);
  };

  /* Frame-rate independent approach toward a target. dt in milliseconds. */
  M.approach = function (current, target, dt, rate) {
    var k = 1 - Math.exp(-dt * rate);
    return current + (target - current) * k;
  };
})();
