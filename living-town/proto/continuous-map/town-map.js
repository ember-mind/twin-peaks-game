/* town-map.js — prototype: one continuous outdoor map and real walking.
 *
 * Throwaway. The picture is a plate (plate.png) re-pixelled from the join-page
 * painting (reference-town.png) by build-plate.py; fg.png holds the pixels
 * that must cover somebody standing behind them. Walking is on a graph of
 * waypoints in native pixels: doors, garden gates, the street, the steps down
 * to the park, the jetty and the bridge.
 *
 * Truth is integer: a walk is (route, departure minute, pixels per minute).
 * Where someone stands at minute m is a pure function of that, so the host
 * only has to send departures, never positions.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var P = root.ProtoMap = {};

  P.W = 768; P.H = 432; P.TILE = 16;

  /* Waypoints, native pixels, feet position. Order is the tie-break. */
  P.NODES = {
    door_a: [104, 155], gate_a: [105, 180], st_a: [105, 204],
    door_b: [234, 155], gate_b: [234, 180], st_b: [234, 204],
    door_cafe: [413, 158], terrace: [413, 180], st_cafe: [413, 204],
    door_d: [506, 155], gate_d: [505, 180], st_d: [505, 204],
    door_e: [649, 155], gate_e: [649, 180], st_e: [649, 204],
    st_w: [8, 204], st_steps: [362, 204], st_bridge: [700, 212], st_east: [760, 204],
    steps_top: [362, 228], steps_foot: [362, 266],
    lawn_w: [200, 266], bench_w: [213, 296], lawn_e: [470, 264], bench_e: [510, 296],
    jetty_head: [360, 298], jetty_end: [360, 322],
    bridge_mid: [700, 254], bridge_far: [722, 290]
  };
  P.EDGES = [
    ['door_a', 'gate_a'], ['gate_a', 'st_a'], ['door_b', 'gate_b'], ['gate_b', 'st_b'],
    ['door_cafe', 'terrace'], ['terrace', 'st_cafe'], ['door_d', 'gate_d'], ['gate_d', 'st_d'],
    ['door_e', 'gate_e'], ['gate_e', 'st_e'],
    ['st_w', 'st_a'], ['st_a', 'st_b'], ['st_b', 'st_steps'], ['st_steps', 'st_cafe'], ['st_cafe', 'st_d'],
    ['st_d', 'st_e'], ['st_e', 'st_bridge'], ['st_bridge', 'st_east'],
    ['st_steps', 'steps_top'], ['steps_top', 'steps_foot'],
    ['steps_foot', 'lawn_w'], ['lawn_w', 'bench_w'], ['steps_foot', 'lawn_e'], ['lawn_e', 'bench_e'],
    ['steps_foot', 'jetty_head'], ['jetty_head', 'jetty_end'],
    ['st_bridge', 'bridge_mid'], ['bridge_mid', 'bridge_far']
  ];

  /* Foreground pieces from build-plate.py: drawn over anyone whose feet are
   * above `depth`. */
  P.FG = [
    { id: 'tree_w', x: 0, y: 196, w: 60, h: 54, depth: 292 },
    { id: 'tree_cw', x: 112, y: 194, w: 78, h: 56, depth: 272 },
    { id: 'tree_c', x: 232, y: 214, w: 34, h: 36, depth: 272 },
    { id: 'tree_ce', x: 404, y: 198, w: 82, h: 52, depth: 275 },
    { id: 'lamp_bridge_w', x: 646, y: 200, w: 16, h: 38, depth: 240 },
    { id: 'lamp_bridge_e', x: 744, y: 200, w: 16, h: 38, depth: 240 }
  ];

  /* Glass that lights when someone is home (native px). */
  P.WINDOWS = {
    flat_a: [[71, 119, 15, 14], [124, 119, 13, 14]],
    flat_b: [[202, 118, 12, 15], [257, 118, 13, 15]],
    flat_d: [[481, 119, 13, 14]],
    flat_e: [[614, 118, 17, 15], [675, 118, 13, 15]]
  };

  P.PLACES = {
    flat_a: 'door_a', flat_b: 'door_b', flat_c: 'door_cafe', cafe: 'door_cafe', flat_d: 'door_d', flat_e: 'door_e'
  };
  P.OUTDOOR_SPOTS = ['bench_w', 'bench_e', 'jetty_end', 'bridge_far', 'lawn_w'];
  /* Where the n-th person at a spot stands, relative to the spot. View only:
   * the truth is "at bench_w"; nobody stands inside anybody else. */
  P.SLOTS = {
    bench_w: [[0, 0], [-11, 0], [11, 0], [-22, 2], [22, 2]],
    bench_e: [[0, 0], [11, 0], [-11, 0], [22, 2], [-22, 2]],
    jetty_end: [[0, 0], [-12, -4], [12, -4], [-6, -14], [6, -14]],
    bridge_far: [[0, 0], [-8, -10], [8, 10], [-14, -20], [4, 18]],
    lawn_w: [[0, 0], [-16, 4], [16, 2], [-30, 8], [-8, 14]]
  };

  /* Lamps: [head x, head y, ground y of the pool]. */
  P.LAMPS = [[23, 158, 186], [293, 158, 186], [587, 158, 186], [654, 208, 236], [752, 208, 236], [748, 316, 334]];

  /* Bench seats, relative to the bench spot: the first two there sit. */
  P.SEATS = { bench_w: [[-8, -12], [9, -12]], bench_e: [[-8, -12], [9, -12]] };
  P.SLOTS.bench_w = [[0, 0], [-22, 2], [22, 2]]; P.SLOTS.bench_e = [[0, 0], [22, 2], [-22, 2]];

  var ORDER = Object.keys(P.NODES), ADJ = {};
  ORDER.forEach(function (k) { ADJ[k] = []; });
  function dist(a, b) { var p = P.NODES[a], q = P.NODES[b]; return Math.round(Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]))); }
  P.EDGES.forEach(function (e) { var d = dist(e[0], e[1]); ADJ[e[0]].push([e[1], d]); ADJ[e[1]].push([e[0], d]); });

  /* Dijkstra with integer lengths and node order as tie-break. */
  P.route = function (from, to) {
    var best = {}, prev = {}, done = {};
    ORDER.forEach(function (k) { best[k] = Infinity; });
    best[from] = 0;
    for (;;) {
      var u = null;
      ORDER.forEach(function (k) { if (!done[k] && best[k] < Infinity && (u === null || best[k] < best[u])) u = k; });
      if (u === null || u === to) break;
      done[u] = true;
      ADJ[u].forEach(function (e) { var nd = best[u] + e[1]; if (nd < best[e[0]]) { best[e[0]] = nd; prev[e[0]] = u; } });
    }
    if (best[to] === Infinity) return null;
    var nodes = [to]; while (nodes[0] !== from) nodes.unshift(prev[nodes[0]]);
    var legs = [], total = 0;
    for (var i = 1; i < nodes.length; i++) { var d = dist(nodes[i - 1], nodes[i]); legs.push({ a: nodes[i - 1], b: nodes[i], d: d, at: total }); total += d; }
    return { nodes: nodes, legs: legs, length: total };
  };

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  P.RESIDENTS = [
    { id: 'resident_a', name: 'Ada', home: 'flat_a' }, { id: 'resident_b', name: 'Bruno', home: 'flat_b' },
    { id: 'resident_c', name: 'Clara', home: 'flat_c' }, { id: 'resident_d', name: 'Dario', home: 'flat_d' },
    { id: 'resident_e', name: 'Elsa', home: 'flat_e' }
  ];

  function nodeOf(place) { return P.PLACES[place] || place; }

  /* `ppm`: pixels per town minute. Decisions happen at integer minutes only. */
  P.createTown = function (seed, ppm) {
    var r = rng(seed);
    var people = P.RESIDENTS.map(function (res) {
      return { id: res.id, name: res.name, home: res.home, at: res.home, walk: null, busyUntil: 6 * 60 + Math.floor(r() * 120) };
    });
    return { minute: 6 * 60, ppm: ppm, r: r, people: people, walks: 0, pxWalked: 0, log: [] };
  };

  function choose(town, p) {
    var roll = town.r(), hour = Math.floor(town.minute / 60) % 24;
    /* Evenings end at home: after ten nobody sets out anywhere else. */
    if (hour >= 22 || hour < 6) return p.at === p.home ? null : p.home;
    if (hour >= 20 && p.at !== p.home && roll < 0.7) return p.home;
    if (p.at !== p.home && roll < 0.35) return p.home;
    if (roll < 0.6) return 'cafe';
    if (roll < 0.9) return P.OUTDOOR_SPOTS[Math.floor(town.r() * P.OUTDOOR_SPOTS.length)];
    var homes = ['flat_a', 'flat_b', 'flat_d', 'flat_e'].filter(function (k) { return k !== p.at; });
    return homes[Math.floor(town.r() * homes.length)];
  }

  P.stepMinute = function (town) {
    town.minute++;
    town.people.forEach(function (p) {
      if (p.walk) {
        if ((town.minute - p.walk.t0) * town.ppm >= p.walk.route.length) {
          p.at = p.walk.to; p.walk = null; p.busyUntil = town.minute + 20 + Math.floor(town.r() * 90);
        }
        return;
      }
      if (town.minute < p.busyUntil) return;
      var to = choose(town, p);
      if (to === null) { p.busyUntil = town.minute + 30; return; }
      var route = P.route(nodeOf(p.at), nodeOf(to));
      if (!route || route.length === 0) { p.busyUntil = town.minute + 10; return; }
      p.walk = { from: p.at, to: to, route: route, t0: town.minute };
      p.at = null; town.walks++; town.pxWalked += route.length;
      town.log.push({ minute: town.minute, id: p.id, px: route.length, minutes: Math.ceil(route.length / town.ppm) });
    });
  };

  function point(route, s) {
    for (var i = 0; i < route.legs.length; i++) {
      var L = route.legs[i];
      if (s <= L.at + L.d || i === route.legs.length - 1) {
        var k = L.d ? Math.min(1, Math.max(0, (s - L.at) / L.d)) : 1, a = P.NODES[L.a], b = P.NODES[L.b];
        var dx = b[0] - a[0], dy = b[1] - a[1], len = L.d || 1;
        return { x: a[0] + dx * k, y: a[1] + dy * k, nx: -dy / len, ny: dx / len,
                 fromEnds: Math.min(s, route.length - s),
                 dir: Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up') };
      }
    }
  }

  /* Where someone is at a (possibly fractional, view-only) minute. */
  P.positionAt = function (town, p, t) {
    if (!p.walk) {
      var place = p.at, n = P.NODES[nodeOf(place)];
      return { x: n[0], y: n[1], outdoors: !P.PLACES[place], moving: false, place: place, dir: 'down' };
    }
    var s = Math.max(0, (t - p.walk.t0) * town.ppm);
    if (s >= p.walk.route.length) s = p.walk.route.length;
    var q = point(p.walk.route, s);
    return { x: q.x, y: q.y, outdoors: true, moving: s < p.walk.route.length, dir: q.dir, phase: s / 16,
             nx: q.nx, ny: q.ny, fromEnds: q.fromEnds, arriving: s >= p.walk.route.length ? p.walk.to : null };
  };

  /* Integer-only fingerprint of the truth at the current minute. */
  P.fingerprint = function (town) {
    var h = 2166136261 >>> 0;
    function mix(v) { var str = String(v); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } }
    mix(town.minute);
    town.people.forEach(function (p) {
      mix(p.id);
      if (p.walk) mix('w' + p.walk.route.nodes.join('>') + '@' + p.walk.t0);
      else mix(p.at);
    });
    return h.toString(16);
  };

  P.routeTable = function () {
    var places = ['flat_a', 'flat_b', 'flat_c', 'flat_d', 'flat_e', 'cafe'], out = [];
    places.forEach(function (a, i) {
      places.slice(i + 1).concat(['bench_w']).forEach(function (b) {
        if (a === b || nodeOf(a) === nodeOf(b)) return;
        var r = P.route(nodeOf(a), nodeOf(b));
        out.push({ from: a, to: b === 'bench_w' ? 'park' : b, px: r ? r.length : null });
      });
    });
    return out;
  };

  if (typeof module !== 'undefined') module.exports = P;
})();
