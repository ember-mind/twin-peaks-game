/* town-core.js — prototype: a real outdoor map from a tile and object kit.
 *
 * Pure, no DOM: runs in the page and under Node. A map is data (town.json):
 * a ground grid of materials and a list of placed kit objects. From it come
 * the collision grid (water, object footprints), the places people go (a
 * building's door, a bench, a spot) and the routes between them.
 *
 * Truth is integer: a walk is (route, departure minute, pixels per minute).
 * Where someone stands at minute m is a pure function of that, so the host
 * only sends departures, never positions.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var C = root.TownCore = {};

  /* Ground materials people cannot walk on. */
  C.BLOCKING_GROUND = { water: true, embankment_face: true, void: true };

  /* Build the world from the map and the kit's object table. */
  C.build = function (map, kitObjects) {
    var T = map.tile || 16, W = map.w, H = map.h;
    var kit = {}; kitObjects.forEach(function (o) { kit[o.id] = o; });
    var blocked = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      if (C.BLOCKING_GROUND[C.materialAt(map, x, y)]) blocked[y * W + x] = 1;
    }
    var objects = map.objects.map(function (o, i) {
      var k = kit[o.kit];
      if (!k) throw new Error('map places unknown kit object ' + o.kit);
      var inst = { i: i, id: o.id || (o.kit + '#' + i), kit: k, tx: o.tx, ty: o.ty,
                   px: o.tx * T - k.anchor[0], py: o.ty * T - k.anchor[1] };
      inst.depth = inst.py + k.depth;
      if (!o.walkable) (k.footprint || []).forEach(function (f) {
        var fx = o.tx + f[0], fy = o.ty + f[1];
        if (fx >= 0 && fy >= 0 && fx < W && fy < H) blocked[fy * W + fx] = 1;
      });
      if (k.door) {
        inst.door = { tx: o.tx + k.door.dx, ty: o.ty + k.door.dy, w: k.door.w || 1 };
      }
      return inst;
    });
    /* A door is walkable even where the building's footprint covers it. */
    objects.forEach(function (o) { if (o.door) for (var j = 0; j < o.door.w; j++) blocked[o.door.ty * W + o.door.tx + j] = 0; });
    (map.walkable || []).forEach(function (c) { blocked[c[1] * W + c[0]] = 0; });
    (map.blocked || []).forEach(function (c) { blocked[c[1] * W + c[0]] = 1; });

    var world = { map: map, T: T, W: W, H: H, blocked: blocked, objects: objects, places: {}, spots: {} };
    /* Places: a building's door (people vanish into it) or an outdoor spot. */
    Object.keys(map.places || {}).forEach(function (name) {
      var ref = map.places[name];
      var o = objects.filter(function (ob) { return ob.id === ref; })[0];
      if (!o || !o.door) throw new Error('place ' + name + ' names no building with a door: ' + ref);
      /* The door leaf's centre, not the tile's: that is where a person
       * disappears, standing just in front of the step. */
      var r = o.kit.door.rect, cx = o.px + r[0] + Math.floor(r[2] / 2);
      world.places[name] = { name: name, indoor: true, object: o, tile: [Math.floor(cx / T), o.door.ty], feet: [cx, o.depth + 1] };
    });
    Object.keys(map.spots || {}).forEach(function (name) {
      var s = map.spots[name];
      world.spots[name] = { name: name, indoor: false, tile: [s.tx, s.ty], seats: s.seats || null, face: s.face || 'down' };
      world.places[name] = world.spots[name];
    });
    return world;
  };

  C.materialAt = function (map, x, y) {
    var row = map.ground[y]; if (!row) return 'void';
    return map.legend[row.charAt(x)] || 'void';
  };

  C.walkable = function (w, x, y) { return x >= 0 && y >= 0 && x < w.W && y < w.H && !w.blocked[y * w.W + x]; };

  /* BFS on tiles with a fixed neighbour order, then pulled taut: a waypoint is
   * dropped whenever the straight line past it stays on walkable tiles. Both
   * steps are deterministic, so every mirror walks the same line. */
  var DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  C.tilePath = function (w, a, b) {
    var W = w.W, start = a[1] * W + a[0], goal = b[1] * W + b[0];
    var prev = new Int32Array(W * w.H).fill(-1), q = [start]; prev[start] = start;
    for (var qi = 0; qi < q.length; qi++) {
      var c = q[qi]; if (c === goal) break;
      var cx = c % W, cy = (c / W) | 0;
      for (var d = 0; d < 4; d++) {
        var nx = cx + DIRS[d][0], ny = cy + DIRS[d][1], n = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= w.H || prev[n] >= 0) continue;
        if (w.blocked[n] && n !== goal) continue;
        prev[n] = c; q.push(n);
      }
    }
    if (prev[goal] < 0) return null;
    var out = [], cur = goal;
    while (cur !== start) { out.unshift([cur % W, (cur / W) | 0]); cur = prev[cur]; }
    out.unshift(a);
    return out;
  };

  function lineClear(w, a, b) {
    /* Supercover walk between tile centres: every tile the line touches. */
    var x0 = a[0] + 0.5, y0 = a[1] + 0.5, x1 = b[0] + 0.5, y1 = b[1] + 0.5;
    var n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 4);
    for (var i = 0; i <= n; i++) {
      var t = n ? i / n : 0, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      /* a body is not a point: keep a little clear of corners */
      var pts = [[x, y], [x - 0.3, y], [x + 0.3, y], [x, y - 0.2], [x, y + 0.2]];
      for (var j = 0; j < pts.length; j++) if (!C.walkable(w, Math.floor(pts[j][0]), Math.floor(pts[j][1]))) {
        var fx = Math.floor(pts[j][0]), fy = Math.floor(pts[j][1]);
        if ((fx === b[0] && fy === b[1]) || (fx === a[0] && fy === a[1])) continue;
        return false;
      }
    }
    return true;
  }

  C.taut = function (w, path) {
    if (!path || path.length < 3) return path;
    var out = [path[0]], i = 0;
    while (i < path.length - 1) {
      var j = path.length - 1;
      while (j > i + 1 && !lineClear(w, path[i], path[j])) j--;
      out.push(path[j]); i = j;
    }
    return out;
  };

  /* Feet position of a tile in world pixels: centre of the tile, near its bottom. */
  C.feet = function (w, t) { return [t[0] * w.T + w.T / 2, t[1] * w.T + w.T - 3]; };

  C.route = function (w, fromPlace, toPlace) {
    var a = w.places[fromPlace].tile, b = w.places[toPlace].tile;
    var path = C.taut(w, C.tilePath(w, a, b));
    if (!path) return null;
    var pts = path.map(function (t) { return C.feet(w, t); });
    if (w.places[fromPlace].feet) pts[0] = w.places[fromPlace].feet.slice();
    if (w.places[toPlace].feet) pts[pts.length - 1] = w.places[toPlace].feet.slice();
    var legs = [], total = 0;
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], d = Math.round(Math.sqrt(dx * dx + dy * dy));
      legs.push({ a: pts[i - 1], b: pts[i], d: d, at: total }); total += d;
    }
    return { tiles: path, legs: legs, length: total, from: fromPlace, to: toPlace };
  };

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
      var route = C.route(town.w, p.at, to);
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
      var pl = w.places[p.at], f = pl.feet || C.feet(w, pl.tile);
      return { x: f[0], y: f[1], outdoors: !pl.indoor, moving: false, place: p.at, dir: pl.face || 'down' };
    }
    var s = Math.max(0, Math.min(p.walk.route.length, (t - p.walk.t0) * town.ppm)), q = point(p.walk.route, s);
    return { x: q.x, y: q.y, outdoors: true, moving: s < p.walk.route.length, dir: q.dir, phase: s / 16,
             nx: q.nx, ny: q.ny, fromEnds: q.fromEnds };
  };

  /* How open a building's door is at view time t: 0 shut, 1 open. A door
   * opens for someone leaving and for someone arriving, and is a pure
   * function of the walks, so mirrors agree without sending it. */
  C.doorOpen = function (town, place, t) {
    var open = 0, OPEN_PX = 22;
    town.people.forEach(function (p) {
      [p.walk, p.lastWalk].forEach(function (wk) {
        if (!wk) return;
        var s = (t - wk.t0) * town.ppm;
        if (wk.from === place && s >= -6 && s < OPEN_PX) open = 1;
        if (wk.to === place && s > wk.route.length - OPEN_PX && s < wk.route.length + 6) open = 1;
      });
    });
    return open;
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
