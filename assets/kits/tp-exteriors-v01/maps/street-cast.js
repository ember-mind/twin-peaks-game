/* street-cast.js — who walks the main street, and where they are at minute t.
 *
 * Pure, no DOM: the kit page and the Node check both use it. Each cast
 * member of the map (map.cast) keeps a loop of places; they stay a while,
 * then walk the engine's route to the next. The whole day is laid out ahead
 * from a seed, so a position is a pure function of the minute.
 *
 *   StreetCast.plan(world, cast, seed, ppm) -> plan
 *   StreetCast.at(plan, i, t) -> { x, y, outdoors, moving, dir, phase, place }
 *   StreetCast.walks(plan) -> [{ from, to, t0, route }]   for WorldMap.doorOpen
 */
(function (root) {
  var EMBER = root.EMBER = root.EMBER || {};
  var WM = EMBER.WorldMap || (typeof require === 'function' ? require('../../../../engine/ember-worldmap.js') : null);
  var S = root.StreetCast = {};

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  S.plan = function (w, cast, seed, ppm, days) {
    var r = rng(seed), end = 1440 * (days || 2), routes = {};
    function route(a, b) { var k = a + '>' + b; return routes[k] || (routes[k] = WM.route(w, a, b)); }
    var people = cast.map(function (c, i) {
      var legs = [], t = Math.floor(r() * 6), at = c.loop[0], k = 0;
      while (t < end) {
        var stay = 2 + Math.floor(r() * (w.places[at].indoor ? 9 : 5));
        legs.push({ kind: 'stay', place: at, t0: t, t1: t + stay });
        t += stay;
        k = (k + 1) % c.loop.length;
        var to = c.loop[k];
        if (to === at) continue;
        var rt = route(at, to);
        if (!rt) throw new Error('no route ' + at + ' -> ' + to);
        var dur = rt.length / ppm;
        legs.push({ kind: 'walk', from: at, to: to, t0: t, t1: t + dur, route: rt });
        t += dur; at = to;
      }
      return { id: c.id, name: c.name, legs: legs };
    });
    return { w: w, ppm: ppm, people: people, end: end };
  };

  function legAt(p, t) {
    var lo = 0, hi = p.legs.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (p.legs[mid].t0 <= t) lo = mid; else hi = mid - 1; }
    return p.legs[lo];
  }

  function point(route, s) {
    for (var i = 0; i < route.legs.length; i++) {
      var L = route.legs[i];
      if (s <= L.at + L.d || i === route.legs.length - 1) {
        var k = L.d ? Math.min(1, Math.max(0, (s - L.at) / L.d)) : 1, dx = L.b[0] - L.a[0], dy = L.b[1] - L.a[1];
        var len = L.d || 1;
        return { x: L.a[0] + dx * k, y: L.a[1] + dy * k, nx: -dy / len, ny: dx / len,
                 dir: Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up') };
      }
    }
  }

  S.at = function (plan, i, t) {
    var p = plan.people[i], tt = ((t % plan.end) + plan.end) % plan.end, L = legAt(p, tt), w = plan.w;
    if (L.kind === 'stay') {
      var pl = w.places[L.place], f = pl.feet || WM.feet(w, pl.tile);
      return { x: f[0], y: f[1], outdoors: !pl.indoor, moving: false, dir: pl.face || 'down', place: L.place };
    }
    var s = Math.min(L.route.length, (tt - L.t0) * plan.ppm), q = point(L.route, s);
    return { x: q.x, y: q.y, outdoors: true, moving: true, dir: q.dir, phase: s / 16, from: L.from, to: L.to,
             nx: q.nx, ny: q.ny, fromEnds: Math.min(s, L.route.length - s) };
  };

  /* every walk, for the engine's door rule (a pure function of the plan) */
  S.walks = function (plan) {
    var out = [];
    plan.people.forEach(function (p) { p.legs.forEach(function (L) { if (L.kind === 'walk') out.push({ from: L.from, to: L.to, t0: L.t0, route: L.route }); }); });
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : global);
