/* town-map.js — prototype: one continuous outdoor map and real walking.
 *
 * Throwaway. Answers three questions before phase 2 commits to them:
 *   1. Can the street and the park painters share one 40×24 grid?
 *   2. Is walking deterministic enough for the mirror (same seed, same
 *      fingerprint every minute, no floats in the truth)?
 *   3. What does "travel time = path length" do to the old minutes table?
 *
 * Truth is integer: a walk is (path, departure minute, tiles per minute).
 * Where someone stands at minute m is a pure function of that, so the host
 * only has to send departures, never positions.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var P = root.ProtoMap = {};

  var W = 40, STREET_H = 11, PARK_H = 13, H = STREET_H + PARK_H;
  P.W = W; P.H = H; P.STREET_H = STREET_H; P.PARK_H = PARK_H;

  function grid(w, h, ch) { var g = []; for (var y = 0; y < h; y++) g.push(new Array(w + 1).join(ch).split('')); return g; }
  function set(g, x, y, ch) { g[y][x] = ch; }
  function fill(g, x0, y0, x1, y1, ch) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) g[y][x] = ch; }

  /* ---- the street: north fronts, carriageway, south gardens and park wall */
  var s = grid(W, STREET_H, '-');
  fill(s, 0, 0, W - 1, 2, 'H');
  [[5, 'flat_a'], [15, 'flat_c'], [31, 'cafe']].forEach(function (d) { set(s, d[0], 2, 'D'); set(s, d[0] + 1, 2, 'D'); });
  fill(s, 0, 8, W - 1, 8, 'f'); fill(s, 0, 9, W - 1, 9, ','); fill(s, 0, 10, W - 1, 10, 'H');
  /* gardens with a gate each, a path to the house behind */
  [2, 29, 35].forEach(function (x) { set(s, x, 8, 'D'); set(s, x + 1, 8, 'D'); set(s, x, 9, '-'); set(s, x + 1, 9, '-'); });
  [6, 27, 33].forEach(function (x) { set(s, x, 9, 'f'); });
  /* a building block, then the park frontage: wall, gate, open to the park */
  fill(s, 7, 8, 12, 10, 'H');
  fill(s, 13, 9, 26, 10, ',');
  set(s, 19, 8, 'D'); set(s, 20, 8, 'D');
  fill(s, 19, 9, 20, 10, '-');
  P.streetRows = s.map(function (r) { return r.join(''); });

  /* ---- the park behind the south houses, reached through the gate ------- */
  var p = grid(W, PARK_H, ',');
  fill(p, 0, 0, 12, 0, 'T'); fill(p, 27, 0, W - 1, 0, 'T');
  for (var x = 0; x < W; x += 3) if (x < 14 || x > 25) set(p, x, 2, 'T');
  fill(p, 19, 0, 20, 3, '-');
  [[17, 5, 22, 5], [16, 6, 23, 7], [17, 8, 22, 8]].forEach(function (r) { fill(p, r[0], r[1], r[2], r[3], 'w'); });
  [[13, 5], [26, 5], [13, 9], [26, 9], [8, 7], [31, 7]].forEach(function (b) { set(p, b[0], b[1], 'b'); set(p, b[0] + 1, b[1], 'b'); });
  fill(p, 0, PARK_H - 1, W - 1, PARK_H - 1, 'T');
  [4, 10, 29, 35].forEach(function (x) { set(p, x, 10, 'T'); });
  P.parkRows = p.map(function (r) { return r.join(''); });

  P.rows = P.streetRows.concat(P.parkRows);
  var SOLID = 'HfTwb#';
  P.walkable = function (x, y) { return x >= 0 && y >= 0 && x < W && y < H && SOLID.indexOf(P.rows[y].charAt(x)) < 0; };

  /* Where each place meets the map. Indoors is off the map: standing on the
   * portal and then gone. The park is a place on the map, so it has spots. */
  P.PORTALS = {
    flat_a: { x: 5, y: 2 }, flat_c: { x: 15, y: 2 }, cafe: { x: 31, y: 2 },
    flat_b: { x: 2, y: 9 }, flat_e: { x: 29, y: 9 }, flat_d: { x: 35, y: 9 }
  };
  P.PARK_SPOTS = [{ x: 13, y: STREET_H + 6 }, { x: 26, y: STREET_H + 6 }, { x: 13, y: STREET_H + 10 },
                  { x: 26, y: STREET_H + 10 }, { x: 8, y: STREET_H + 8 }, { x: 31, y: STREET_H + 8 }, { x: 20, y: STREET_H + 10 }];

  /* ---- pathfinding: BFS, fixed neighbour order, so every mirror agrees --- */
  var DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  P.path = function (a, b) {
    var key = function (x, y) { return y * W + x; };
    var prev = {}, q = [a], seen = {}; seen[key(a.x, a.y)] = true;
    while (q.length) {
      var c = q.shift();
      if (c.x === b.x && c.y === b.y) break;
      for (var i = 0; i < 4; i++) {
        var nx = c.x + DIRS[i][0], ny = c.y + DIRS[i][1], k = key(nx, ny);
        if (seen[k] || !P.walkable(nx, ny)) continue;
        seen[k] = true; prev[k] = c; q.push({ x: nx, y: ny });
      }
    }
    if (!seen[key(b.x, b.y)]) return null;
    var out = [b], cur = b;
    while (cur.x !== a.x || cur.y !== a.y) { cur = prev[key(cur.x, cur.y)]; out.unshift(cur); }
    return out;
  };

  /* ---- a seeded day ------------------------------------------------------ */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  P.RESIDENTS = [
    { id: 'resident_a', name: 'Ada', home: 'flat_a' }, { id: 'resident_b', name: 'Bruno', home: 'flat_b' },
    { id: 'resident_c', name: 'Clara', home: 'flat_c' }, { id: 'resident_d', name: 'Dario', home: 'flat_d' },
    { id: 'resident_e', name: 'Elsa', home: 'flat_e' }
  ];

  function spotOf(place) { return P.PORTALS[place] || place; }

  /* A town: `tpm` tiles per town minute. Everyone decides at integer minutes
   * only; a walk starts at a minute and its position is derived. */
  P.createTown = function (seed, tpm) {
    var r = rng(seed);
    var people = P.RESIDENTS.map(function (res) {
      return { id: res.id, name: res.name, home: res.home, at: res.home, walk: null, busyUntil: 6 * 60 + Math.floor(r() * 120) };
    });
    return { minute: 6 * 60, tpm: tpm, r: r, people: people, walks: 0, tilesWalked: 0, log: [] };
  };

  function choose(town, p) {
    var roll = town.r();
    if (p.at !== p.home && roll < 0.35) return p.home;
    if (roll < 0.6) return 'cafe';
    if (roll < 0.9) return P.PARK_SPOTS[Math.floor(town.r() * P.PARK_SPOTS.length)];
    var others = Object.keys(P.PORTALS).filter(function (k) { return k !== p.at && k !== 'cafe'; });
    return others[Math.floor(town.r() * others.length)];   // "visiting" — just a walk to a door
  }

  P.stepMinute = function (town) {
    town.minute++;
    town.people.forEach(function (p) {
      if (p.walk) {
        var done = (town.minute - p.walk.t0) * town.tpm >= p.walk.path.length - 1;
        if (done) { p.at = p.walk.to; p.walk = null; p.busyUntil = town.minute + 20 + Math.floor(town.r() * 90); }
        return;
      }
      if (town.minute < p.busyUntil) return;
      var to = choose(town, p), path = P.path(spotOf(p.at), spotOf(to));
      if (!path || path.length < 2) { p.busyUntil = town.minute + 10; return; }
      p.walk = { from: p.at, to: to, path: path, t0: town.minute };
      p.at = null; town.walks++; town.tilesWalked += path.length - 1;
      town.log.push({ minute: town.minute, id: p.id, tiles: path.length - 1, minutes: Math.ceil((path.length - 1) / town.tpm) });
    });
  };

  /* Where someone is at a (possibly fractional, view-only) minute. */
  P.positionAt = function (town, p, t) {
    if (!p.walk) {
      if (typeof p.at === 'object') return { x: p.at.x, y: p.at.y, outdoors: true, moving: false };
      var q = P.PORTALS[p.at]; return { x: q.x, y: q.y, outdoors: false, moving: false, place: p.at };
    }
    var f = Math.max(0, (t - p.walk.t0) * town.tpm), n = p.walk.path.length - 1;
    if (f >= n) { var e = p.walk.path[n]; return { x: e.x, y: e.y, outdoors: true, moving: false }; }
    var i = Math.floor(f), a = p.walk.path[i], b = p.walk.path[i + 1], k = f - i;
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, outdoors: true, moving: true,
             dir: b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y > a.y ? 'down' : 'up', phase: f };
  };

  /* Integer-only fingerprint of the truth at the current minute. */
  P.fingerprint = function (town) {
    var h = 2166136261 >>> 0;
    function mix(v) { var str = String(v); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } }
    mix(town.minute);
    town.people.forEach(function (p) {
      mix(p.id);
      if (p.walk) { var tile = Math.min(p.walk.path.length - 1, (town.minute - p.walk.t0) * town.tpm); var c = p.walk.path[tile]; mix('w' + c.x + ',' + c.y); }
      else mix(typeof p.at === 'object' ? 'p' + p.at.x + ',' + p.at.y : p.at);
    });
    return h.toString(16);
  };

  /* Old table vs path length, for the report. */
  P.routeTable = function () {
    var places = ['flat_a', 'flat_b', 'flat_c', 'flat_d', 'flat_e', 'cafe'];
    var park = P.PARK_SPOTS[6], out = [];
    places.forEach(function (a) {
      places.concat(['park']).forEach(function (b) {
        if (a >= b && b !== 'park') return;
        if (a === b) return;
        var path = P.path(spotOf(a), b === 'park' ? park : spotOf(b));
        out.push({ from: a, to: b, tiles: path ? path.length - 1 : null });
      });
    });
    return out;
  };

  if (typeof module !== 'undefined') module.exports = P;
})();
