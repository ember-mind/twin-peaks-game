/* lt-util.js — Living Town: namespace, deterministic RNG, clock formatting.
 *
 * Living Town never reads GAME.*: it shares the Ember Engine with Twin Peaks
 * and nothing else.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var U = LT.Util = LT.Util || {};

  /* mulberry32. A seeded stream per concern keeps one system's extra draw from
   * shifting every other system's results. */
  U.rng = function (seed) {
    var a = seed >>> 0;
    var fn = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    fn.int = function (maxExclusive) { return Math.floor(fn() * maxExclusive); };
    fn.pick = function (list) { return list[fn.int(list.length)]; };
    return fn;
  };

  U.MINUTES_PER_DAY = 1440;

  U.clock = function (minute) {
    var m = ((minute % U.MINUTES_PER_DAY) + U.MINUTES_PER_DAY) % U.MINUTES_PER_DAY;
    var h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  };

  U.stamp = function (day, minute) { return 'D' + day + ' ' + U.clock(minute); };

  /* Absolute minutes since the start of day 1: comparing commitments across a
   * midnight boundary is otherwise a source of silent ordering bugs. */
  U.absolute = function (day, minute) { return (day - 1) * U.MINUTES_PER_DAY + minute; };

  U.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  U.round2 = function (v) { return Math.round(v * 100) / 100; };
})();
