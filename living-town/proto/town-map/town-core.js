/* town-core.js — Living Town prototype: the town's day on a shared-engine map.
 *
 * The world (collision, places, routes, doors) is the Ember Engine's
 * (engine/ember-worldmap.js) built from this game's kit; this file is only
 * Living Town: who lives here, what they choose and where they are at a
 * given minute.
 *
 * Truth is integer: a walk is (route, departure minute, pixels per minute).
 * Where someone stands at minute m is a pure function of that, so the host
 * only sends departures, never positions.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var EMBER = root.EMBER = root.EMBER || {};
  var WM = EMBER.WorldMap || (typeof require === 'function' ? require('../../../engine/ember-worldmap.js') : null);
  var C = root.TownCore = {};

  /* ---- a seeded day ------------------------------------------------------ */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  C.createTown = function (w, residents, seed, ppm) {
    var r = rng(seed);
    var people = residents.map(function (res) {
      return { id: res.id, name: res.name, home: res.home, look: res.look, at: res.home, walk: null,
               busyUntil: 6 * 60 + Math.floor(r() * 120), lastWalk: null };
    });
    return { w: w, minute: 6 * 60, ppm: ppm, r: r, people: people, walks: 0, pxWalked: 0 };
  };

  function choose(town, p) {
    var w = town.w, roll = town.r(), hour = Math.floor(town.minute / 60) % 24;
    if (hour >= 22 || hour < 6) return p.at === p.home ? null : p.home;
    if (hour >= 20 && p.at !== p.home && roll < 0.7) return p.home;
    if (p.at !== p.home && roll < 0.35) return p.home;
    if (roll < 0.6 && w.places.cafe) return 'cafe';
    var spots = Object.keys(w.spots);
    if (roll < 0.9 && spots.length) return spots[Math.floor(town.r() * spots.length)];
    var homes = Object.keys(w.places).filter(function (k) { return w.places[k].indoor && k !== 'cafe' && k !== p.at; });
    return homes[Math.floor(town.r() * homes.length)];
  }

  C.stepMinute = function (town) {
    town.minute++;
    town.people.forEach(function (p) {
      if (p.walk) {
        if ((town.minute - p.walk.t0) * town.ppm >= p.walk.route.length) {
          p.at = p.walk.to; p.lastWalk = p.walk; p.walk = null; p.busyUntil = town.minute + 20 + Math.floor(town.r() * 90);
        }
        return;
      }
      if (town.minute < p.busyUntil) return;
      var to = choose(town, p);
      if (to === null) { p.busyUntil = town.minute + 30; return; }
      var route = WM.route(town.w, p.at, to);
      if (!route || route.length === 0) { p.busyUntil = town.minute + 10; return; }
      p.walk = { from: p.at, to: to, route: route, t0: town.minute };
      p.at = null; town.walks++; town.pxWalked += route.length;
    });
  };

  function point(route, s) {
    for (var i = 0; i < route.legs.length; i++) {
      var L = route.legs[i];
      if (s <= L.at + L.d || i === route.legs.length - 1) {
        var k = L.d ? Math.min(1, Math.max(0, (s - L.at) / L.d)) : 1;
        var dx = L.b[0] - L.a[0], dy = L.b[1] - L.a[1], len = L.d || 1;
        return { x: L.a[0] + dx * k, y: L.a[1] + dy * k, nx: -dy / len, ny: dx / len, fromEnds: Math.min(s, route.length - s),
                 dir: Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up') };
      }
    }
  }

  /* Where someone is at a (possibly fractional, view-only) minute. */
  C.positionAt = function (town, p, t) {
    var w = town.w;
    if (!p.walk) {
      var pl = w.places[p.at], f = pl.feet || WM.feet(w, pl.tile);
      return { x: f[0], y: f[1], outdoors: !pl.indoor, moving: false, place: p.at, dir: pl.face || 'down' };
    }
    var s = Math.max(0, Math.min(p.walk.route.length, (t - p.walk.t0) * town.ppm)), q = point(p.walk.route, s);
    return { x: q.x, y: q.y, outdoors: true, moving: s < p.walk.route.length, dir: q.dir, phase: s / 16,
             nx: q.nx, ny: q.ny, fromEnds: q.fromEnds };
  };

  /* Whether a building's door is open at view time t (engine rule). */
  C.doorOpen = function (town, place, t) {
    var walks = [];
    town.people.forEach(function (p) { walks.push(p.walk, p.lastWalk); });
    return WM.doorOpen(walks, place, t, town.ppm);
  };

  C.fingerprint = function (town) {
    var h = 2166136261 >>> 0;
    function mix(v) { var str = String(v); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } }
    mix(town.minute);
    town.people.forEach(function (p) {
      mix(p.id);
      if (p.walk) mix('w' + p.walk.from + '>' + p.walk.to + '@' + p.walk.t0 + ':' + p.walk.route.length);
      else mix(p.at);
    });
    return h.toString(16);
  };

  if (typeof module !== 'undefined') module.exports = C;
})();
