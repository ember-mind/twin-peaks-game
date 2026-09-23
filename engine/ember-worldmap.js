/* ember-worldmap.js — Ember Engine: a map made of a game's kit.
 *
 * Pure, no DOM: runs in a page and under Node. A map is data: a ground grid
 * of materials (legend -> the tile set's material names), the kit objects
 * placed on it, named places (a building's door, a spot) and cell overrides.
 * A kit is the game's art as data: { tileSet, objects }, where each object
 * carries its own anchor, footprint, depth line and optional door/windows.
 * From the two come the collision grid, the places people go and the routes
 * between them. Nothing here knows either game.
 *
 *   EMBER.WorldMap.build(map, kit) -> world
 *   EMBER.WorldMap.route(world, fromPlace, toPlace) -> { legs, length, ... }
 *   EMBER.WorldMap.doorOpen(walks, place, t, ppm) -> 0 | 1
 */
(function (root) {
  var EMBER = root.EMBER = root.EMBER || {};
  if (!EMBER.Ground && typeof require === 'function') EMBER.Ground = require('./ember-ground.js');
  var WM = EMBER.WorldMap = EMBER.WorldMap || {};

  /* Build the world from the map and the kit's object table. */
  WM.build = function (map, kit) {
    var kitObjects = kit.objects, tileSet = kit.tileSet;
    var T = map.tile || 16, W = map.w, H = map.h;
    var kit = {}; kitObjects.forEach(function (o) { kit[o.id] = o; });
    var blocked = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var mat = WM.materialAt(map, x, y);
      if (mat === 'void' || (tileSet && !EMBER.Ground.walkable(tileSet, mat))) blocked[y * W + x] = 1;
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

  WM.materialAt = function (map, x, y) {
    var row = map.ground[y]; if (!row) return 'void';
    return map.legend[row.charAt(x)] || 'void';
  };

  WM.walkable = function (w, x, y) { return x >= 0 && y >= 0 && x < w.W && y < w.H && !w.blocked[y * w.W + x]; };

  /* BFS on tiles with a fixed neighbour order, then pulled taut: a waypoint is
   * dropped whenever the straight line past it stays on walkable tiles. Both
   * steps are deterministic, so every mirror walks the same line. */
  var DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  WM.tilePath = function (w, a, b) {
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
    /* Walk the line the feet will take (WM.feet: tile centre, near the
     * bottom), not the tile centres: a line between centres can clear a
     * corner the feet then cut across. */
    var fy = (w.T - 3) / w.T;
    var x0 = a[0] + 0.5, y0 = a[1] + fy, x1 = b[0] + 0.5, y1 = b[1] + fy;
    var n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 4);
    for (var i = 0; i <= n; i++) {
      var t = n ? i / n : 0, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      /* a body is not a point: keep a little clear of corners */
      var pts = [[x, y], [x - 0.3, y], [x + 0.3, y], [x, y - 0.2], [x, y + 0.2]];
      for (var j = 0; j < pts.length; j++) if (!WM.walkable(w, Math.floor(pts[j][0]), Math.floor(pts[j][1]))) {
        var fx = Math.floor(pts[j][0]), fy = Math.floor(pts[j][1]);
        if ((fx === b[0] && fy === b[1]) || (fx === a[0] && fy === a[1])) continue;
        return false;
      }
    }
    return true;
  }

  WM.taut = function (w, path) {
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
  WM.feet = function (w, t) { return [t[0] * w.T + w.T / 2, t[1] * w.T + w.T - 3]; };

  WM.route = function (w, fromPlace, toPlace) {
    var a = w.places[fromPlace].tile, b = w.places[toPlace].tile;
    var path = WM.taut(w, WM.tilePath(w, a, b));
    if (!path) return null;
    var pts = path.map(function (t) { return WM.feet(w, t); });
    if (w.places[fromPlace].feet) pts[0] = w.places[fromPlace].feet.slice();
    if (w.places[toPlace].feet) pts[pts.length - 1] = w.places[toPlace].feet.slice();
    var legs = [], total = 0;
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], d = Math.round(Math.sqrt(dx * dx + dy * dy));
      legs.push({ a: pts[i - 1], b: pts[i], d: d, at: total }); total += d;
    }
    return { tiles: path, legs: legs, length: total, from: fromPlace, to: toPlace };
  };


  /* Whether a building's door stands open at view time t: it opens for
   * whoever is leaving through it or arriving at it. `walks` are
   * { from, to, t0, route } in town minutes; `ppm` pixels per minute. A pure
   * function of the walks, so every mirror of a world agrees on it. */
  WM.doorOpen = function (walks, place, t, ppm) {
    var OPEN_PX = 22;
    for (var i = 0; i < walks.length; i++) {
      var wk = walks[i]; if (!wk) continue;
      var s = (t - wk.t0) * ppm;
      if (wk.from === place && s >= -6 && s < OPEN_PX) return 1;
      if (wk.to === place && s > wk.route.length - OPEN_PX && s < wk.route.length + 6) return 1;
    }
    return 0;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = WM;
})(typeof window !== 'undefined' ? window : global);
