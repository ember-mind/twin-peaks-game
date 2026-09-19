/* lt-town-places.js — Living Town: the park, the street and a home, painted.
 *
 * A projection, strictly: it reads its arguments and writes pixels. Nothing
 * here simulates, decides, schedules, stores or remembers anything, and
 * nothing here reads Math.random — the same arguments always paint the same
 * pixels.
 *
 * The collision truth is the location's `rows` in lt-world.js. This file never
 * writes them and never disagrees with them: every solid cell is painted as
 * the thing it is, at its own tile, and every walkable cell is painted as
 * ground. `LT.TownPlaces.plan(locationId, rows)` is that agreement, made
 * machine-readable, and `test/town-places.js` holds it.
 *
 * Every pixel goes down through `kit.rect`; every contact shadow through
 * `kit.contactShadow`. Nothing is resampled, smoothed or scaled.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var TP = LT.TownPlaces = LT.TownPlaces || {};
  var T = 16;

  /* ---- palettes ------------------------------------------------------
   * Same role names as the production interior kit, so any kit primitive
   * works unchanged. The café's own material is the reference for value
   * range and outline weight; these are its neighbours, not its copies. */

  var INK = '#25282b';

  var HOME = {
    ink: INK, cream: '#f1ead8', creamShade: '#cec2a5', gold: '#e2b458',
    red: '#3f7a73', redHi: '#68a79b', redLight: '#97c9ba', redDark: '#21453f',
    wood: '#8a6a48', woodHi: '#b08c62', woodLight: '#d0b083', woodDark: '#4a382a',
    green: '#2b4436', leaf: '#5d7f4c', leafHi: '#93a860',
    metal: '#8a9796', metalHi: '#dde3d6',
    tile: '#a8825c', tileShade: '#95704f', floorLight: '#bb9268', floorShade: '#a87f57',
    glass: '#9ec3cf', glassHi: '#d2e6e2',
    plaster: '#ddd0b4', plasterHi: '#eee3ca', plasterShade: '#b9ab8c',
    grass: '#5f8a4a', grassHi: '#648f4e', grassDark: '#4c7340', grassLight: '#7aa35c',
    paving: '#a89a80', pavingHi: '#bdb094', pavingDark: '#877b65', pavingInk: '#6b6151',
    bark: '#5a4530', barkHi: '#775c3f',
    water: '#41788c', waterHi: '#5d97a8', waterLight: '#9cc6cc', waterDark: '#2a536a',
    mud: '#6d5b40', mudHi: '#8a7550', mudDark: '#4b3d2a',
    wool: '#7d6a4c', woolHi: '#94805e', woolDark: '#54462f',
    reed: '#4a6b3a', reedHi: '#6d8f46',
    brick: '#8d5c4a', brickHi: '#a87263', brickDark: '#5c3a30'
  };

  /* One accent family per home. The accent belongs to the room — the quilt,
   * the rug, the door, the crockery — and never to whoever lives in it. */
  var ACCENTS = [
    { key: 'a', red: '#3d5f88', redHi: '#6d8fba', redLight: '#a6c1de', redDark: '#213249' },
    { key: 'b', red: '#7a4a68', redHi: '#a5749a', redLight: '#cfa6c3', redDark: '#432639' },
    { key: 'c', red: '#6d7a3a', redHi: '#97a45c', redLight: '#c3ca8d', redDark: '#3b4220' },
    { key: 'd', red: '#a35f3c', redHi: '#c78860', redLight: '#e3b48d', redDark: '#5c3220' },
    { key: 'e', red: '#3f7a73', redHi: '#68a79b', redLight: '#97c9ba', redDark: '#21453f' }
  ];

  var PARK = mix(HOME, {
    tile: '#5f8a4a', tileShade: '#4c7340', floorLight: '#7aa35c', floorShade: '#5f8a4a',
    green: '#2f4a33', leaf: '#5e8248', leafHi: '#8db05f',
    red: '#8a6a48', redHi: '#b08c62', redLight: '#d0b083', redDark: '#4a382a'
  });

  var STREET = mix(HOME, {
    tile: '#9a8d76', tileShade: '#877b66', floorLight: '#aca08a', floorShade: '#948872',
    red: '#7a4a3c', redHi: '#a06f5c', redLight: '#c49b86', redDark: '#452721'
  });

  function mix(base, over) {
    var out = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    for (k in over) if (Object.prototype.hasOwnProperty.call(over, k)) out[k] = over[k];
    return out;
  }

  /* ---- what this package paints -------------------------------------- */

  TP.MATERIALS = { lt_park: PARK, lt_street: STREET };
  ACCENTS.forEach(function (a) {
    TP.MATERIALS['lt_home_' + a.key] = mix(HOME, { red: a.red, redHi: a.redHi, redLight: a.redLight, redDark: a.redDark });
  });

  TP.KINDS = { park: 'park', street: 'street' };

  TP.kindOf = function (locationId) {
    if (TP.KINDS[locationId]) return TP.KINDS[locationId];
    return /^flat_/.test(String(locationId)) ? 'home' : null;
  };

  TP.handles = function (locationId) { return !!TP.kindOf(locationId); };

  /* Which registered kit material a place is painted in. The accent is read
   * off the location id, so the same flat is always the same colour and two
   * flats are never the same — and nobody's name is anywhere near it. */
  TP.materialFor = function (locationId) {
    var kind = TP.kindOf(locationId);
    if (kind === 'park' || kind === 'street') return 'lt_' + kind;
    if (kind !== 'home') return null;
    var m = /^flat_([a-z])$/.exec(String(locationId));
    var i = m ? 'abcdefghijklmnopqrstuvwxyz'.indexOf(m[1]) : idHash(locationId);
    return 'lt_home_' + ACCENTS[((i % ACCENTS.length) + ACCENTS.length) % ACCENTS.length].key;
  };

  function idHash(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < String(s).length; i++) { h ^= String(s).charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h >>> 0;
  }

  /* ---- deterministic hashing ----------------------------------------- */

  function hash2(mx, my) {
    var h = (mx * 374761393 + my * 668265263 + 0x9E3779B9) | 0;
    h = (h ^ (h >>> 13)) >>> 0;
    h = (h * 1274126177) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }
  function bits(h, shift, mod) { return Math.floor(h / Math.pow(2, shift)) % mod; }

  /* ---- reading the rows ---------------------------------------------- */

  function at(rows, x, y) {
    var row = rows[y];
    if (!row || x < 0 || x >= row.length) return null;
    return row.charAt(x);
  }
  function widthOf(rows) { return rows[0].length; }

  /* Horizontal runs of one character, left to right, top to bottom. */
  function runs(rows, ch) {
    var out = [];
    for (var y = 0; y < rows.length; y++) {
      var x = 0;
      while (x < rows[y].length) {
        if (rows[y].charAt(x) !== ch) { x++; continue; }
        var n = 0;
        while (at(rows, x + n, y) === ch) n++;
        out.push({ x: x, y: y, w: n });
        x += n;
      }
    }
    return out;
  }

  /* Rectangular blocks of one character: a run that repeats on the row below
   * with the same x and width is one block. Beds and kitchen runs are either
   * two cells wide or two cells tall, and both must be one piece. */
  function blocks(rows, ch) {
    var taken = {}, out = [];
    runs(rows, ch).forEach(function (r) {
      if (taken[r.x + ',' + r.y]) return;
      var h = 1;
      while (true) {
        var next = true;
        for (var i = 0; i < r.w; i++) if (at(rows, r.x + i, r.y + h) !== ch) { next = false; break; }
        if (!next) break;
        h++;
      }
      for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < r.w; xx++) taken[(r.x + xx) + ',' + (r.y + yy)] = true;
      out.push({ x: r.x, y: r.y, w: r.w, h: h });
    });
    return out;
  }

  /* ---- the plan: art and rows, in one list ---------------------------
   * Every entry claims the cells it covers. A cell claimed here must be solid
   * in `rows`; a solid cell not claimed here is a hole in the art. The Node
   * test checks both directions. `depth` is the piece's floor line in world
   * pixels: an actor whose feet are above it is behind the piece. */

  TP.plan = function (locationId, rows) {
    var kind = TP.kindOf(locationId);
    if (!kind || !rows || !rows.length) return null;
    if (kind === 'park') return parkPlan(rows);
    if (kind === 'street') return streetPlan(rows);
    return homePlan(rows);
  };

  function piece(kind, x, y, w, h, extra) {
    var p = { kind: kind, x: x, y: y, w: w, h: h, depth: (y + h) * T, foreground: true };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) p[k] = extra[k];
    return p;
  }

  function parkPlan(rows) {
    var out = [], water = [], i;
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      var ch = rows[y].charAt(x);
      if (ch === 'T') out.push(piece('tree', x, y, 1, 1));
      else if (ch === 'w') water.push({ x: x, y: y });
    }
    /* The pond is one piece made of its own cells; it lies flat, so nothing
     * is ever painted in front of anybody because of it. */
    if (water.length) {
      var minX = water[0].x, maxX = water[0].x, minY = water[0].y, maxY = water[0].y;
      water.forEach(function (c) {
        minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
        minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
      });
      out.push(piece('water', minX, minY, maxX - minX + 1, maxY - minY + 1, { cells: water, foreground: false }));
    }
    var pond = waterCentre(rows);
    blocks(rows, 'b').forEach(function (b) {
      out.push(piece('bench', b.x, b.y, b.w, b.h, { facing: pond && b.y * T > pond.y ? 'up' : 'down' }));
    });
    runs(rows, 'D').forEach(function (d) { out.push(piece('gate', d.x, d.y, d.w, 1)); });
    return { kind: 'park', pieces: out, material: 'lt_park' };
  }

  function waterCentre(rows) {
    var n = 0, sx = 0, sy = 0;
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      if (rows[y].charAt(x) === 'w') { n++; sx += x * T + T / 2; sy += y * T + T / 2; }
    }
    return n ? { x: sx / n, y: sy / n } : null;
  }

  function streetPlan(rows) {
    var out = [];
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      if (rows[y].charAt(x) === 'T') out.push(piece('tree', x, y, 1, 1));
    }
    /* A doorway with paving on its south side is a house door, approached off
     * the street; one with paving on its north side is the way through to
     * somewhere else. Both are read off the rows, never off a list of names. */
    runs(rows, 'D').forEach(function (d) {
      out.push(piece(at(rows, d.x, d.y + 1) === '-' ? 'door' : 'gate', d.x, d.y, d.w, 1));
    });
    return { kind: 'street', pieces: out, material: 'lt_street' };
  }

  /* The building is every row from the top down to the last row that still
   * has a wall in it; anything below that row is the ground outside. */
  function frontRowOf(rows) {
    for (var y = rows.length - 1; y >= 0; y--) if (rows[y].indexOf('#') >= 0) return y;
    return rows.length - 1;
  }

  function homePlan(rows) {
    var out = [], front = frontRowOf(rows), w = widthOf(rows);
    /* The walls are painted by the room, not by a piece, but they are still
     * cells the art has to answer for: they claim themselves. */
    for (var wy = 0; wy < rows.length; wy++) for (var wx = 0; wx < rows[wy].length; wx++) {
      if (rows[wy].charAt(wx) === '#') out.push(piece('wall', wx, wy, 1, 1, { foreground: false, claimOnly: true }));
    }
    blocks(rows, 'B').forEach(function (b) {
      /* A bed lies the way its own cells lie. Nothing else decides it. */
      out.push(piece('bed', b.x, b.y, b.w, b.h, { orient: b.w >= b.h ? 'across' : 'down', foreground: false }));
    });
    blocks(rows, 'K').forEach(function (b) {
      out.push(piece('kitchen', b.x, b.y, b.w, b.h, { side: b.x <= 1 ? 'left' : (b.x >= w - 2 ? 'right' : 'free') }));
    });
    runs(rows, 'G').forEach(function (r) { out.push(piece('guitar', r.x, r.y, r.w, 1)); });
    runs(rows, 't').forEach(function (r) { out.push(piece('table', r.x, r.y, r.w, 1)); });
    runs(rows, '=').forEach(function (r) { out.push(piece('window', r.x, r.y, r.w, 1, { foreground: false })); });
    /* A chair is walkable — it is where someone stands to sit. It is drawn
     * low and it is never repainted in front of anybody. */
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      if (rows[y].charAt(x) !== 'c') continue;
      /* A chair has its back to whichever side the table is not on. */
      var face = at(rows, x, y - 1) === 't' ? 'up' : at(rows, x, y + 1) === 't' ? 'down'
        : at(rows, x - 1, y) === 't' ? 'left' : at(rows, x + 1, y) === 't' ? 'right' : 'down';
      var back = { up: 'down', down: 'up', left: 'right', right: 'left' }[face];
      out.push(piece('chair', x, y, 1, 1, { walkable: true, foreground: false, facing: back }));
    }
    var door = runs(rows, 'D').filter(function (d) { return d.y === front; })[0] || null;
    return { kind: 'home', pieces: out, material: null, front: front, door: door };
  }

  /* ---- the kit ------------------------------------------------------- */

  var registered = [];
  function kitOf(opts) {
    var kit = (opts && opts.kit) || (root.GAME && root.GAME.Retro2D && root.GAME.Retro2D.interiorKit);
    if (kit && kit.materials && registered.indexOf(kit) < 0) {
      registered.push(kit);
      for (var id in TP.MATERIALS) if (Object.prototype.hasOwnProperty.call(TP.MATERIALS, id)) kit.materials[id] = TP.MATERIALS[id];
    }
    return kit || null;
  }

  /* Installing the materials without drawing, for a host that wants them
   * early. Safe to call more than once. */
  TP.register = function (retro2d) {
    var kit = retro2d && retro2d.interiorKit;
    return kit ? (kitOf({ kit: kit }), kit) : null;
  };

  function paletteOf(kit, locationId, opts) {
    if (opts && opts.palette) return opts.palette;
    var id = TP.materialFor(locationId);
    return (kit && kit.materials && kit.materials[id]) || TP.MATERIALS[id] || HOME;
  }

  /* Lamps and lit windows are the one thing here that reads the clock. The
   * day's own colour is LT.DayLight's business and is applied to the finished
   * frame; this only says whether a lamp is burning. */
  function lampsOn(opts) {
    var m = opts && typeof opts.minute === 'number' ? ((opts.minute % 1440) + 1440) % 1440 : null;
    if (m === null) return 0;
    if (m < 330 || m >= 1290) return 1;          // deep night
    if (m < 420 || m >= 1140) return 0.75;       // dawn and evening
    return 0;
  }

  /* ---- ground painters ------------------------------------------------ */

  function grass(g, R, p, sx, sy, mx, my) {
    var h = hash2(mx, my), patch = hash2(mx >> 1, my >> 1), i;
    /* Two greens, and which one a cell starts from is a large-scale patch, so
     * a lawn has areas rather than noise. */
    var base = bits(patch, 0, 4) === 0 ? p.grassHi : p.grass;
    var other = base === p.grass ? p.grassHi : p.grass;
    R(g, sx, sy, T, T, base);
    for (var by = 0; by < T; by += 8) if ((my * 2 + by / 8) % 2) R(g, sx, sy + by, T, 8, other);
    if (bits(patch, 4, 5) === 0) R(g, sx, sy + bits(h, 2, 9), T, 3, p.grassDark);
    for (i = 0; i < 5; i++) {
      var bx = bits(h, i * 5, 13), byy = bits(h, i * 5 + 3, 13);
      var c = bits(h, i * 5 + 7, 3) === 0 ? p.grassDark : p.grassLight;
      R(g, sx + bx, sy + byy + 1, 1, 2, c);
      R(g, sx + bx + 1, sy + byy, 1, 2, c);
    }
  }

  /* A worn track: grass that has been walked on, never paving. `wash` is the
   * faint wear round something people stand at; the rest is a path, drawn with
   * its edges feathered so two cells side by side make one path and not two. */
  function track(g, R, p, sx, sy, mx, my, strength, wash) {
    var h = hash2(mx * 5 + 3, my * 5 + 7), i;
    if (wash) {
      R(g, sx, sy, T, T, 'rgba(133,110,72,' + (0.13 * strength).toFixed(3) + ')');
      return;
    }
    var a = 0.26 * strength;
    R(g, sx + 2, sy, T - 4, T, 'rgba(133,110,72,' + a.toFixed(3) + ')');
    R(g, sx, sy, 2, T, 'rgba(133,110,72,' + (a * 0.4).toFixed(3) + ')');
    R(g, sx + T - 2, sy, 2, T, 'rgba(133,110,72,' + (a * 0.4).toFixed(3) + ')');
    for (i = 0; i < 3; i++) {
      R(g, sx + 3 + bits(h, i * 4, 10), sy + bits(h, i * 4 + 2, 13), 3, 2, 'rgba(116,95,60,' + (a * 0.7).toFixed(3) + ')');
    }
  }

  /* Small flowers, only where they cannot be mistaken for something to walk
   * round: never on a path, never against a tree. */
  function flowers(g, R, p, sx, sy, mx, my, colour) {
    var h = hash2(mx * 3 + 11, my * 7 + 5);
    if (bits(h, 0, 13) !== 0) return;              // rare, and then a clump
    for (var i = 0; i < 5; i++) {
      var fx = sx + 3 + bits(h, 3 + i * 4, 9), fy = sy + 4 + bits(h, 5 + i * 4, 8);
      R(g, fx, fy + 1, 1, 3, p.reed);
      R(g, fx, fy, 2, 1, i % 2 ? colour : p.cream);
    }
  }

  function paving(g, R, p, sx, sy, mx, my, kind) {
    var h = hash2(mx, my), fx, fy;
    if (kind === 'road') {
      R(g, sx, sy, T, T, p.tileShade);
      for (fy = 0; fy < T; fy += 4) for (fx = 0; fx < T; fx += 5) {
        var k = hash2(mx * 4 + fx, my * 4 + fy);
        var shade = bits(k, 0, 5);
        var col = shade === 0 ? p.floorLight : shade === 1 ? p.tile : shade === 2 ? p.floorShade : p.tileShade;
        R(g, sx + fx + ((fy / 4) % 2 ? 2 : 0), sy + fy, 4, 3, col);
      }
      if (bits(h, 9, 6) === 0) R(g, sx + 3, sy + 6, 9, 1, p.pavingInk);   // a hairline crack
    } else {
      R(g, sx, sy, T, T, p.pavingDark);
      for (fy = 0; fy < T; fy += 8) for (fx = 0; fx < T; fx += 8) {
        var j = hash2(mx * 2 + fx / 8, my * 2 + fy / 8);
        R(g, sx + fx, sy + fy, 7, 7, bits(j, 0, 3) === 0 ? p.pavingHi : p.paving);
        R(g, sx + fx, sy + fy, 7, 1, p.pavingHi);
        R(g, sx + fx, sy + fy + 6, 7, 1, p.pavingDark);
        if (bits(j, 4, 7) === 0) R(g, sx + fx + 2, sy + fy + 3, 3, 1, p.pavingDark);
      }
    }
  }

  /* A kerbstone wherever the road stops being road. */
  function kerb(g, R, p, sx, sy, side) {
    if (side === 'up') {
      R(g, sx, sy, T, 3, p.pavingHi); R(g, sx, sy, T, 1, p.cream);
      R(g, sx, sy + 3, T, 1, 'rgba(37,40,43,.30)');
      for (var i = 0; i < T; i += 8) R(g, sx + i, sy, 1, 3, p.pavingDark);
    } else {
      R(g, sx, sy + T - 3, T, 3, p.pavingHi); R(g, sx, sy + T - 1, T, 1, p.pavingDark);
      R(g, sx, sy + T - 4, T, 1, 'rgba(37,40,43,.22)');
      for (var j = 0; j < T; j += 8) R(g, sx + j, sy + T - 3, 1, 3, p.pavingDark);
    }
  }

  /* A pond, not a cross. The bank is drawn per edge with a profile that moves
   * along the shore, so the plus the rows describe comes out as something with
   * an irregular waterline. Every pixel of it is still inside its own cell. */
  function water(g, R, p, x0, y0, rows, cells) {
    function isWater(x, y) { return at(rows, x, y) === 'w'; }
    cells.forEach(function (c) {
      var sx = x0 + c.x * T, sy = y0 + c.y * T, h = hash2(c.x, c.y), px, py, i;
      var up = isWater(c.x, c.y - 1), down = isWater(c.x, c.y + 1);
      var left = isWater(c.x - 1, c.y), right = isWater(c.x + 1, c.y);
      /* How far in from each edge the waterline sits, wobbling along the shore
       * in world coordinates so it runs on across a cell boundary. */
      function inset(side, along) { return 7 + bits(hash2(side * 977, along), 0, 4); }
      function inside(px2, py2, grow) {
        var t = up ? -99 : inset(0, c.x * T + px2) - grow;
        var b = down ? 99 : T - inset(1, c.x * T + px2) + grow;
        var l = left ? -99 : inset(2, c.y * T + py2) - grow;
        var r = right ? 99 : T - inset(3, c.y * T + py2) + grow;
        return py2 >= t && py2 < b && px2 >= l && px2 < r;
      }
      /* The shore first: a band of wet earth outside the waterline. The grass
       * under it is left showing wherever the shore does not reach, so the
       * pond's outline is not the outline of its cells. */
      for (py = 0; py < T; py++) for (px = 0; px < T; px++) {
        if (inside(px, py, 0) || !inside(px, py, 5)) continue;
        R(g, sx + px, sy + py, 1, 1, inside(px, py, 2) ? p.mudDark : (bits(hash2(sx + px, sy + py), 0, 3) ? p.mud : p.mudHi));
      }
      /* Then the water: deep in the middle, pale along the shore. */
      for (py = 0; py < T; py++) for (px = 0; px < T; px++) {
        if (!inside(px, py, 0)) continue;
        R(g, sx + px, sy + py, 1, 1, inside(px, py, -4) ? p.water : p.waterHi);
      }
      for (py = 0; py < T; py++) for (px = 0; px < T; px++) {
        if (inside(px, py, 0) && !inside(px, py, -1)) R(g, sx + px, sy + py, 1, 1, p.waterDark);
      }
      /* Two ripple values, always the same two, never moving. */
      for (i = 0; i < 3; i++) {
        var rx = 3 + bits(h, i * 6, 8), ry = 4 + bits(h, i * 6 + 3, 8);
        if (!inside(rx, ry, -3) || !inside(rx + 4, ry, -3)) continue;
        R(g, sx + rx, sy + ry, 5, 1, p.waterLight);
        R(g, sx + rx + 1, sy + ry + 1, 3, 1, p.waterHi);
      }
      /* Reeds, or a stone, standing on the shore band. */
      for (i = 0; i < 3; i++) {
        var ex = 1 + bits(h, 12 + i * 3, 12), ey = 3 + bits(h, 14 + i * 3, 10);
        if (inside(ex, ey, 0) || !inside(ex, ey, 6)) continue;
        if (bits(h, 20 + i, 3) !== 0) {
          for (var n = 0; n < 3; n++) R(g, sx + ex + n, sy + ey - bits(h, 22 + n, 3), 1, 3 + bits(h, 24 + n, 4), n % 2 ? p.reed : p.reedHi);
        } else {
          R(g, sx + ex, sy + ey, 4, 3, p.pavingDark);
          R(g, sx + ex, sy + ey, 4, 1, p.paving);
        }
      }
    });
  }

  /* ---- pieces --------------------------------------------------------- */

  function tree(g, kit, p, sx, sy) {
    var R = kit.rect;
    /* The shadow the crown throws, then the trunk, then the crown: a stand of
     * trees in a row builds one canopy out of overlapping ones. */
    R(g, sx + 1, sy + 11, 14, 4, 'rgba(37,40,43,.20)');
    kit.contactShadow(g, sx + 3, sy + 13, 10, p);
    R(g, sx + 5, sy - 4, 6, 18, p.bark);
    R(g, sx + 6, sy - 4, 3, 17, p.barkHi);
    R(g, sx + 5, sy + 4, 6, 1, p.woodDark);
    R(g, sx + 9, sy + 1, 1, 6, p.woodDark);
    /* Crown: stepped pixel lobes, ink outline, one light source top-left. */
    var lobes = [[-1, -22, 18, 8], [-4, -18, 24, 8], [-5, -12, 26, 9], [-3, -5, 22, 7], [0, 0, 16, 5]];
    lobes.forEach(function (l) { R(g, sx + l[0] - 1, sy + l[1] - 1, l[2] + 2, l[3] + 2, p.ink); });
    lobes.forEach(function (l) { R(g, sx + l[0], sy + l[1], l[2], l[3], p.green); });
    [[1, -20, 12, 5], [-2, -15, 12, 6], [-3, -9, 11, 6], [-1, -3, 10, 4]].forEach(function (l) {
      R(g, sx + l[0], sy + l[1], l[2], l[3], p.leaf);
    });
    [[2, -20, 8, 3], [0, -14, 7, 3], [-1, -8, 6, 3]].forEach(function (l) {
      R(g, sx + l[0], sy + l[1], l[2], l[3], p.leafHi);
    });
    /* Leaf clumps broken up so the mass is not one flat shape. */
    [[13, -18], [16, -13], [14, -6], [3, -22], [-3, -11], [7, -2], [11, -1]].forEach(function (a, n) {
      R(g, sx + a[0], sy + a[1], 4, 3, n % 2 ? p.green : p.leaf);
      R(g, sx + a[0] + 1, sy + a[1], 2, 1, p.leafHi);
    });
    R(g, sx - 3, sy - 6, 3, 4, p.green);
    R(g, sx + T, sy - 9, 3, 4, p.green);
  }

  /* A slatted bench: a backrest above the seat, two cast-iron ends under it.
   * One cell wide, so everything has to be in fourteen pixels. */
  function bench(g, kit, p, sx, sy, facing) {
    var R = kit.rect, i;
    /* Backrest, a gap the ground shows through, then the seat: at one cell
     * wide the gap is what makes it a bench and not a box. */
    var backTop = facing === 'down' ? 0 : 10, seatTop = facing === 'down' ? 9 : 1;
    var frameTop = Math.min(backTop, seatTop);
    kit.contactShadow(g, sx + 1, sy + 14, 14, p);
    R(g, sx + 2, sy + seatTop + 6, 12, 2, 'rgba(37,40,43,.26)');
    R(g, sx, sy + backTop, T, 5, p.ink);
    R(g, sx + 1, sy + backTop + 1, 14, 3, p.redDark);
    R(g, sx + 1, sy + backTop + 1, 14, 1, p.red);
    R(g, sx, sy + seatTop, T, 6, p.ink);
    R(g, sx + 1, sy + seatTop + 1, 14, 2, p.redLight);
    R(g, sx + 1, sy + seatTop + 3, 14, 2, p.redHi);
    R(g, sx + 1, sy + seatTop + 2, 14, 1, p.red);
    /* The cast-iron ends bridge the gap, and the legs show under the seat. */
    [0, T - 2].forEach(function (dx) {
      R(g, sx + dx, sy + frameTop, 2, 16 - frameTop, p.ink);
      R(g, sx + dx, sy + frameTop + 1, 1, 13 - frameTop, p.metal);
    });
    for (i = 3; i < 13; i += 5) R(g, sx + i, sy + seatTop + 6, 2, 3, p.ink);
  }

  /* Two stone piers and the ironwork between them: a way through a boundary
   * that has no wall, because the rows give it none. */
  function gate(g, kit, p, sx, sy, w) {
    var R = kit.rect, W = w * T;
    kit.contactShadow(g, sx + 1, sy + 14, W - 2, p);
    [0, W - 6].forEach(function (dx) {
      R(g, sx + dx, sy - 10, 6, 26, p.ink);
      R(g, sx + dx + 1, sy - 9, 4, 24, p.paving);
      R(g, sx + dx + 1, sy - 9, 2, 24, p.pavingHi);
      R(g, sx + dx + 1, sy + 2, 4, 1, p.pavingDark);
      R(g, sx + dx - 1, sy - 13, 8, 4, p.ink);
      R(g, sx + dx, sy - 12, 6, 2, p.pavingHi);
      R(g, sx + dx, sy - 10, 6, 1, p.pavingDark);
    });
    /* Open leaves: the bars are drawn swung back against the piers. */
    [6, W - 12].forEach(function (dx, n) {
      R(g, sx + dx, sy - 7, 6, 21, 'rgba(37,40,43,.20)');
      for (var i = 0; i < 6; i += 2) R(g, sx + dx + i, sy - 7, 1, 20, p.ink);
      R(g, sx + dx, sy - 7, 6, 1, p.ink);
      R(g, sx + dx, sy + 2, 6, 1, p.ink);
      R(g, sx + dx + (n ? 5 : 0), sy - 9, 1, 3, p.ink);
    });
    R(g, sx + 6, sy + 13, W - 12, 3, p.pavingDark);
    R(g, sx + 6, sy + 13, W - 12, 1, p.paving);
  }

  /* A doorway in a masonry stub, with its own step. It stays inside its own
   * two cells: the cells above it are walkable in the rows, so nothing is
   * painted there. No lettering anywhere — this town has no signage. */
  function doorway(g, kit, p, sx, sy, w, lamp) {
    var R = kit.rect, W = w * T, dw = 14, dx = sx + Math.round((W - dw) / 2);
    kit.contactShadow(g, sx + 1, sy + 14, W - 2, p);
    R(g, sx, sy, W, T, p.ink);
    R(g, sx + 1, sy + 1, W - 2, 14, p.pavingDark);
    for (var by = 1; by < 15; by += 4) for (var bx = 1 + ((by / 4) % 2 ? 0 : 3); bx < W - 3; bx += 7) {
      R(g, sx + bx, sy + by, 6, 3, hash2(bx, by) % 3 ? p.paving : p.pavingHi);
      R(g, sx + bx, sy + by, 6, 1, p.pavingHi);
    }
    R(g, sx + 1, sy + 1, W - 2, 1, p.pavingHi);
    /* The opening, recessed: a dark reveal, then the leaves inside it. */
    R(g, dx - 2, sy + 1, dw + 4, 14, p.ink);
    R(g, dx - 1, sy + 2, dw + 2, 12, p.brickDark);
    R(g, dx, sy + 3, dw, 11, p.redDark);
    R(g, dx + 1, sy + 4, dw - 2, 9, p.red);
    R(g, dx + Math.round(dw / 2) - 1, sy + 4, 1, 9, p.redDark);
    [1, Math.round(dw / 2)].forEach(function (lx) {
      R(g, dx + lx + 1, sy + 5, 4, 3, p.redHi);
      R(g, dx + lx + 1, sy + 9, 4, 3, p.redDark);
      R(g, dx + lx + 1, sy + 5, 4, 1, p.redLight);
    });
    R(g, dx + Math.round(dw / 2) - 3, sy + 9, 1, 2, p.gold);
    R(g, dx + Math.round(dw / 2) + 2, sy + 9, 1, 2, p.gold);
    R(g, dx, sy + 2, dw, 1, p.woodDark);
    R(g, dx + 2, sy + 2, dw - 4, 1, p.glassHi);
    R(g, dx - 1, sy + 14, dw + 2, 2, p.pavingHi);
    R(g, dx - 1, sy + 15, dw + 2, 1, p.pavingDark);
    var lx2 = sx + 2;
    R(g, lx2, sy + 3, 5, 6, p.ink);
    R(g, lx2 + 1, sy + 4, 3, 4, lamp > 0 ? '#ffdc82' : p.metal);
    R(g, lx2 + 1, sy + 3, 3, 1, p.metalHi);
    R(g, lx2, sy + 9, 5, 1, p.ink);
    if (lamp > 0) kit.warmLight(g, lx2 - 9, sy - 4, 23, 22, lamp);
    var px = sx + W - 7;
    R(g, px, sy + 4, 5, 5, p.ink);
    R(g, px + 1, sy + 5, 3, 3, p.cream);
    R(g, px + 2, sy + 6, 1, 1, p.ink);
    R(g, sx + 2, sy + 11, 4, 3, p.green);
    R(g, sx + 2, sy + 11, 4, 1, p.leafHi);
    R(g, sx + W - 6, sy + 11, 4, 3, p.green);
    R(g, sx + W - 6, sy + 11, 4, 1, p.leafHi);
  }

  /* ---- the home ------------------------------------------------------- */

  function bed(g, kit, p, sx, sy, w, h, orient) {
    var R = kit.rect, W = w * T, H = h * T, i;
    kit.contactShadow(g, sx + 1, sy + H - 2, W - 2, p);
    R(g, sx, sy + H - 4, W, 4, 'rgba(37,40,43,.18)');
    if (orient === 'across') {
      /* Head to the left, against the side wall; the headboard rises into the
       * wall row above, which is where the rows put a wall. */
      R(g, sx, sy - 8, 8, H + 7, p.ink);
      R(g, sx + 1, sy - 7, 6, H + 5, p.wood);
      R(g, sx + 1, sy - 7, 6, 2, p.woodLight);
      R(g, sx + 1, sy - 4, 6, 1, p.woodDark);
      R(g, sx + 3, sy - 7, 2, H + 5, p.woodHi);
      R(g, sx + 6, sy, W - 6, H, p.ink);                       // the frame
      R(g, sx + 7, sy + 1, W - 9, H - 3, p.cream);             // the sheet
      R(g, sx + 7, sy + 1, W - 9, 1, '#ffffff');
      R(g, sx + 7, sy + H - 3, W - 9, 1, p.creamShade);
      R(g, sx + 7, sy + 2, 12, H - 5, p.ink);                  // the pillow
      R(g, sx + 8, sy + 3, 10, H - 7, p.cream);
      R(g, sx + 8, sy + 3, 10, 2, '#ffffff');
      R(g, sx + 9, sy + H - 6, 8, 1, p.creamShade);
      R(g, sx + 21, sy + 1, W - 23, H - 3, p.red);             // the quilt
      R(g, sx + 21, sy + 1, W - 23, 2, p.redHi);
      R(g, sx + 21, sy + 1, 2, H - 3, p.redLight);
      for (i = 24; i < W - 4; i += 6) R(g, sx + i, sy + 3, 1, H - 7, p.redDark);
      R(g, sx + 19, sy + 1, 3, H - 3, p.creamShade);           // the sheet turned down
      R(g, sx + 19, sy + 1, 3, 1, '#ffffff');
      R(g, sx + W - 3, sy - 2, 3, H + 2, p.ink);               // the foot rail
      R(g, sx + W - 2, sy - 1, 1, H, p.woodHi);
    } else {
      R(g, sx, sy - 8, W, 10, p.ink);
      R(g, sx + 1, sy - 7, W - 2, 8, p.wood);
      R(g, sx + 1, sy - 7, W - 2, 2, p.woodLight);
      R(g, sx + 1, sy - 4, W - 2, 1, p.woodDark);
      R(g, sx + 3, sy - 7, W - 6, 2, p.woodHi);
      R(g, sx, sy + 1, W, H - 1, p.ink);
      R(g, sx + 1, sy + 2, W - 2, H - 4, p.cream);
      R(g, sx + 2, sy + 2, W - 4, 11, p.ink);                  // the pillow
      R(g, sx + 3, sy + 3, W - 6, 9, p.cream);
      R(g, sx + 3, sy + 3, W - 6, 2, '#ffffff');
      R(g, sx + 4, sy + 10, W - 8, 1, p.creamShade);
      R(g, sx + 1, sy + 16, W - 2, H - 18, p.red);             // the quilt
      R(g, sx + 1, sy + 16, W - 2, 2, p.redHi);
      R(g, sx + 1, sy + 16, 2, H - 18, p.redLight);
      for (i = 19; i < H - 4; i += 6) R(g, sx + 3, sy + i, W - 6, 1, p.redDark);
      R(g, sx + 1, sy + 14, W - 2, 3, p.creamShade);           // the sheet turned down
      R(g, sx + 1, sy + 14, W - 2, 1, '#ffffff');
      R(g, sx, sy + H - 3, W, 3, p.ink);
      R(g, sx + 1, sy + H - 2, W - 2, 1, p.woodHi);
    }
  }

  function kitchen(g, kit, p, sx, sy, w, h, side, wallAbove, lamp) {
    var R = kit.rect, W = w * T, H = h * T, i;
    kit.contactShadow(g, sx + 1, sy + H - 2, W - 2, p);
    /* Splashback and a shelf, but only where the rows really put a wall. */
    if (wallAbove) {
      R(g, sx, sy - 13, W, 13, p.plasterShade);
      for (var ty = -12; ty < 0; ty += 4) for (var tx = 0; tx < W; tx += 5) {
        R(g, sx + tx, sy + ty, 4, 3, (tx / 5 + ty / 4) % 2 ? p.cream : p.creamShade);
      }
      R(g, sx, sy - 13, W, 1, p.woodDark);
      R(g, sx + 1, sy - 10, W - 2, 2, p.woodHi);
      R(g, sx + 1, sy - 8, W - 2, 1, p.woodDark);
      [1, 6, 10].forEach(function (dx, n) {
        R(g, sx + dx + 1, sy - 15, 4, 5, n % 2 ? p.red : p.creamShade);
        R(g, sx + dx + 1, sy - 15, 4, 1, n % 2 ? p.redHi : p.cream);
      });
    }
    /* Carcass and cupboard fronts. */
    R(g, sx, sy, W, H, p.ink);
    R(g, sx + 1, sy + 1, W - 2, H - 2, p.wood);
    for (var dy = 6; dy < H - 3; dy += 13) {
      R(g, sx + 2, sy + dy, W - 4, 11, p.woodDark);
      R(g, sx + 3, sy + dy + 1, W - 6, 9, p.woodHi);
      R(g, sx + 3, sy + dy + 1, W - 6, 1, p.woodLight);
      R(g, sx + 4, sy + dy + 8, W - 8, 1, p.woodDark);
      R(g, sx + Math.round(W / 2) - 2, sy + dy + 4, 5, 1, p.metalHi);
      R(g, sx + Math.round(W / 2) - 2, sy + dy + 5, 5, 1, p.woodDark);
    }
    /* One continuous worktop across the whole run, with things set into it. */
    R(g, sx, sy, W, 5, p.ink);
    R(g, sx, sy + 1, W, 3, p.creamShade);
    R(g, sx, sy + 1, W, 1, p.cream);
    R(g, sx, sy + 4, W, 1, p.woodDark);
    /* The sink: a basin cut into the top cell, worktop showing all round it. */
    R(g, sx + 3, sy + 5, W - 6, 8, p.ink);
    R(g, sx + 4, sy + 6, W - 8, 6, p.metal);
    R(g, sx + 4, sy + 6, W - 8, 2, p.metalHi);
    R(g, sx + 5, sy + 10, W - 10, 1, p.metalHi);
    R(g, sx + Math.round(W / 2) - 1, sy - 3, 2, 4, p.metalHi);
    R(g, sx + Math.round(W / 2) - 1, sy - 4, 4, 1, p.metal);
    R(g, sx + Math.round(W / 2) + 2, sy - 3, 1, 2, p.metalHi);
    if (H >= 2 * T) {
      /* The hob: four rings on a dark plate, in the cell below. */
      R(g, sx + 2, sy + T + 3, W - 4, 11, p.ink);
      R(g, sx + 3, sy + T + 4, W - 6, 9, '#3b3f42');
      [[4, 5], [9, 5], [4, 9], [9, 9]].forEach(function (a2) {
        R(g, sx + a2[0], sy + T + a2[1], 4, 3, p.metal);
        R(g, sx + a2[0] + 1, sy + T + a2[1] + 1, 2, 1, p.ink);
      });
      R(g, sx + 3, sy + T + 3, W - 6, 1, p.metalHi);
    }
    /* A kettle and a jar, standing on the worktop where it is clear. */
    var kx = sx + (side === 'right' ? 1 : W - 7);
    R(g, kx, sy - 5, 6, 6, p.ink);
    R(g, kx + 1, sy - 4, 4, 4, p.metalHi);
    R(g, kx + 1, sy - 4, 4, 1, p.cream);
    R(g, kx + 2, sy - 6, 2, 1, p.metal);
    var jx = sx + (side === 'right' ? W - 5 : 1);
    R(g, jx, sy - 4, 4, 5, p.ink);
    for (i = 0; i < 3; i++) R(g, jx + 1, sy - 3 + i, 2, 1, i ? p.red : p.redHi);
    if (lamp > 0) kit.warmLight(g, sx - 8, sy - 8, W + 16, 26, lamp * 0.6);
  }

  function table(g, kit, p, sx, sy) {
    var R = kit.rect;
    kit.contactShadow(g, sx + 2, sy + 14, 12, p);
    R(g, sx + 1, sy + 11, 14, 3, 'rgba(37,40,43,.20)');
    R(g, sx + 3, sy + 8, 2, 6, p.woodDark);
    R(g, sx + 11, sy + 8, 2, 6, p.woodDark);
    R(g, sx, sy + 2, T, 9, p.ink);
    R(g, sx + 1, sy + 3, 14, 7, p.woodHi);
    R(g, sx + 1, sy + 3, 14, 2, p.woodLight);
    R(g, sx + 1, sy + 9, 14, 1, p.woodDark);
    /* A cloth in the room's accent, and something on it. */
    R(g, sx + 1, sy + 4, 14, 5, p.redLight);
    R(g, sx + 1, sy + 4, 14, 1, p.cream);
    R(g, sx + 2, sy + 8, 12, 1, p.red);
    R(g, sx + 4, sy + 5, 1, 3, p.red);
    R(g, sx + 10, sy + 5, 1, 3, p.red);
    kit.cup(g, sx + 8, sy + 1, p);
    R(g, sx + 2, sy + 1, 4, 4, p.ink);              // a small bowl
    R(g, sx + 3, sy + 1, 3, 3, p.creamShade);
    R(g, sx + 3, sy + 1, 3, 1, p.cream);
  }

  function chair(g, kit, p, sx, sy, facing) {
    var R = kit.rect;
    /* Low, and with floor all round it: this cell is one someone walks onto. */
    kit.contactShadow(g, sx + 4, sy + 13, 8, p);
    R(g, sx + 4, sy + 9, 2, 4, p.woodDark);
    R(g, sx + 10, sy + 9, 2, 4, p.woodDark);
    R(g, sx + 3, sy + 6, 10, 5, p.woodDark);
    R(g, sx + 4, sy + 7, 8, 3, p.wood);
    R(g, sx + 4, sy + 7, 8, 1, p.woodHi);
    if (facing === 'down') { R(g, sx + 3, sy + 2, 10, 4, p.woodDark); R(g, sx + 4, sy + 3, 8, 2, p.woodHi); }
    else if (facing === 'up') { R(g, sx + 3, sy + 10, 10, 3, p.woodDark); R(g, sx + 4, sy + 10, 8, 2, p.woodHi); }
    else if (facing === 'left') { R(g, sx + 11, sy + 3, 3, 9, p.woodDark); R(g, sx + 12, sy + 4, 1, 7, p.woodHi); }
    else { R(g, sx + 2, sy + 3, 3, 9, p.woodDark); R(g, sx + 3, sy + 4, 1, 7, p.woodHi); }
  }

  function guitar(g, kit, p, sx, sy) {
    var R = kit.rect;
    kit.contactShadow(g, sx + 2, sy + 14, 12, p);
    R(g, sx + 3, sy + 12, 10, 2, 'rgba(37,40,43,.24)');
    /* The neck, then a body with a waist: upper bout narrow, lower bout wide. */
    R(g, sx + 6, sy - 11, 4, 14, p.ink);
    R(g, sx + 7, sy - 10, 2, 13, p.woodDark);
    R(g, sx + 5, sy - 15, 6, 5, p.ink);
    R(g, sx + 6, sy - 14, 4, 3, p.woodHi);
    R(g, sx + 6, sy - 14, 4, 1, p.woodLight);
    R(g, sx + 4, sy + 1, 8, 4, p.ink);
    R(g, sx + 5, sy + 2, 6, 2, p.gold);
    R(g, sx + 3, sy + 4, 10, 9, p.ink);
    R(g, sx + 4, sy + 5, 8, 7, p.gold);
    R(g, sx + 4, sy + 5, 8, 2, '#f0cd85');
    R(g, sx + 5, sy + 11, 6, 1, p.woodDark);
    R(g, sx + 6, sy + 5, 4, 3, p.woodDark);
    R(g, sx + 7, sy + 6, 2, 1, p.ink);
    R(g, sx + 5, sy + 9, 6, 2, p.woodDark);
    R(g, sx + 7, sy - 10, 1, 19, p.creamShade);
    R(g, sx + 8, sy - 10, 1, 19, p.cream);
  }

  function windowPiece(g, kit, p, sx, sy, w, night) {
    var R = kit.rect, W = w * T;
    /* The wall comes down to meet it: the pane is in a wall, not on a floor. */
    R(g, sx, sy - 18, W, T + 18, p.plaster);
    R(g, sx, sy - 18, W, 1, p.plasterShade);
    var glassed = night ? mixPalette(p, { glass: '#3c4b63', glassHi: '#54687f' }) : p;
    kit.window(g, sx + 3, sy - 12, W - 6, 21, glassed);
    /* Curtains, in the room's accent. */
    R(g, sx + 1, sy - 15, 4, 24, p.red);
    R(g, sx + W - 5, sy - 15, 4, 24, p.red);
    R(g, sx + 1, sy - 15, 2, 24, p.redHi);
    R(g, sx + W - 5, sy - 15, 1, 24, p.redHi);
    R(g, sx, sy - 16, W, 2, p.woodDark);
    R(g, sx, sy - 16, W, 1, p.woodHi);
    R(g, sx + 1, sy + 9, W - 2, 3, p.woodHi);          // sill
    R(g, sx + 1, sy + 12, W - 2, 1, p.woodDark);
    R(g, sx + 1, sy + 13, W - 2, 3, p.plasterShade);
    R(g, sx + 4, sy + 6, 4, 4, p.green);               // a pot on the sill
    R(g, sx + 4, sy + 9, 4, 1, p.woodDark);
  }

  function mixPalette(p, over) { return mix(p, over); }

  /* ---- place painters -------------------------------------------------- */

  function drawPiece(g, kit, p, x0, y0, piece, rows, opts) {
    var sx = x0 + piece.x * T, sy = y0 + piece.y * T, lamp = lampsOn(opts);
    switch (piece.kind) {
      case 'tree': tree(g, kit, p, sx, sy); break;
      case 'bench': bench(g, kit, p, sx, sy, piece.facing); break;
      case 'gate': gate(g, kit, p, sx, sy, piece.w); break;
      case 'door': doorway(g, kit, p, sx, sy, piece.w, lamp); break;
      case 'water': water(g, kit.rect, p, x0, y0, rows, piece.cells); break;
      case 'bed': bed(g, kit, p, sx, sy, piece.w, piece.h, piece.orient); break;
      case 'kitchen': kitchen(g, kit, p, sx, sy, piece.w, piece.h, piece.side,
        at(rows, piece.x, piece.y - 1) === '#', lamp); break;
      case 'table': table(g, kit, p, sx, sy); break;
      case 'chair': chair(g, kit, p, sx, sy, piece.facing); break;
      case 'guitar': guitar(g, kit, p, sx, sy); break;
      case 'window': windowPiece(g, kit, p, sx, sy, piece.w, lamp > 0); break;
    }
  }

  function backdrop(g, kit, colour) {
    var w = (g.canvas && g.canvas.width) || 256, h = (g.canvas && g.canvas.height) || 192;
    kit.rect(g, 0, 0, w, h, colour);
  }

  /* A worn trail where the rows say people come and go: from every doorway,
   * straight out into the open. Trails are walkable and are painted as worn
   * grass, never as paving. */
  function trailCells(rows) {
    var out = {};
    runs(rows, 'D').forEach(function (d) {
      for (var i = 0; i < d.w; i++) {
        var x = d.x + i;
        [-1, 1].forEach(function (step) {
          for (var n = 1; n <= 3; n++) {
            if (at(rows, x, d.y + step * n) !== ',') break;
            out[x + ',' + (d.y + step * n)] = true;
          }
        });
      }
    });
    return out;
  }

  /* Where the ground is worn: out of the gateway, and round the shore. Read
   * off the rows; every cell it marks is one a person may walk on. */
  function parkTrack(rows) {
    var out = {}, x, y;
    function add(cx, cy, s) { if (at(rows, cx, cy) === ',') out[cx + ',' + cy] = Math.max(out[cx + ',' + cy] || 0, s); }
    runs(rows, 'D').forEach(function (d) {
      for (var i = 0; i < d.w; i++) for (var n = 1; n < rows.length; n++) {
        var ch = at(rows, d.x + i, d.y - n);
        if (ch === '-') continue;
        if (ch !== ',') break;
        add(d.x + i, d.y - n, 1);
      }
    });
    for (y = 0; y < rows.length; y++) for (x = 0; x < rows[y].length; x++) {
      if (rows[y].charAt(x) !== 'w') continue;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) add(x + dx, y + dy, 0.8);
    }
    blocks(rows, 'b').forEach(function (b) {
      add(b.x, b.y + 1, 0.7); add(b.x, b.y - 1, 0.55);
    });
    return out;
  }

  function drawPark(g, kit, p, rows, x0, y0, plan, opts) {
    var R = kit.rect, w = widthOf(rows), h = rows.length, x, y;
    backdrop(g, kit, '#243322');
    var trail = parkTrack(rows);
    /* Ground first, everywhere, including off the map: a park does not stop
     * at the edge of its grid. */
    for (y = -1; y <= h; y++) for (x = -1; x <= w; x++) {
      var mx = Math.min(Math.max(x, 0), w - 1), my = Math.min(Math.max(y, 0), h - 1);
      var ch = rows[my].charAt(mx), sx = x0 + x * T, sy = y0 + y * T;
      var outside = x < 0 || y < 0 || x >= w || y >= h;
      if (!outside && (ch === '-' || ch === 'D')) { paving(g, R, p, sx, sy, x, y, 'path'); continue; }
      grass(g, R, p, sx, sy, x, y);
      var worn = outside ? 0 : (trail[x + ',' + y] || 0);
      if (worn) track(g, R, p, sx, sy, x, y, worn, worn < 1);
      else if (!outside && ch === ',') flowers(g, R, p, sx, sy, x, y, y % 2 ? p.gold : p.redLight);
      if (outside) R(g, sx, sy, T, T, 'rgba(20,28,18,.35)');
    }
    /* Shade under the tree line, so a canopy sits on the ground. */
    plan.pieces.forEach(function (piece) {
      if (piece.kind !== 'tree') return;
      R(g, x0 + piece.x * T - 7, y0 + piece.y * T + 3, 30, 14, 'rgba(30,44,26,.16)');
      R(g, x0 + piece.x * T - 3, y0 + piece.y * T + 6, 22, 8, 'rgba(30,44,26,.14)');
    });
    plan.pieces.forEach(function (piece) { drawPiece(g, kit, p, x0, y0, piece, rows, opts); });
    var lamp = lampsOn(opts);
    if (lamp > 0) plan.pieces.forEach(function (piece) {
      if (piece.kind === 'gate') kit.warmLight(g, x0 + piece.x * T - 4, y0 + piece.y * T - 12, piece.w * T + 8, 30, lamp);
    });
  }

  function drawStreet(g, kit, p, rows, x0, y0, plan, opts) {
    var R = kit.rect, w = widthOf(rows), h = rows.length, x, y;
    backdrop(g, kit, '#242a22');
    var road = {};
    for (y = 0; y < h; y++) if (rows[y].split('').every(function (c) { return c === '-'; })) road[y] = true;
    for (y = -1; y <= h; y++) for (x = -1; x <= w; x++) {
      var mx = Math.min(Math.max(x, 0), w - 1), my = Math.min(Math.max(y, 0), h - 1);
      var ch = rows[my].charAt(mx), sx = x0 + x * T, sy = y0 + y * T;
      var outside = x < 0 || y < 0 || x >= w || y >= h;
      var isRoad = road[my] && !outside;
      if (isRoad) {
        paving(g, R, p, sx, sy, x, y, 'road');
        if (!road[my - 1]) kerb(g, R, p, sx, sy, 'up');
        if (!road[my + 1]) kerb(g, R, p, sx, sy, 'down');
        continue;
      }
      if (!outside && (ch === '-' || ch === 'D')) { paving(g, R, p, sx, sy, x, y, 'path'); continue; }
      grass(g, R, p, sx, sy, x, y);
      if (!outside && ch === ',') flowers(g, R, p, sx, sy, x, y, p.redLight);
      if (outside) R(g, sx, sy, T, T, 'rgba(20,24,18,.38)');
    }
    /* Wheel tracks down the middle of the carriageway, and a drain at the kerb. */
    Object.keys(road).forEach(function (key) {
      var ry = Number(key);
      if (road[ry - 1]) return;
      var top = y0 + ry * T;
      R(g, x0, top + 13, w * T, 2, 'rgba(37,40,43,.10)');
      R(g, x0, top + T + 9, w * T, 2, 'rgba(37,40,43,.10)');
      for (var cx = 8; cx < w * T; cx += 48) R(g, x0 + cx, top + T - 1, 20, 2, p.pavingHi);
      for (var dxp = 24; dxp < w * T; dxp += 112) {
        R(g, x0 + dxp, top + 2, 11, 7, p.pavingInk);
        for (var i = 1; i < 6; i += 2) R(g, x0 + dxp + 1, top + 2 + i, 9, 1, p.metal);
      }
    });
    /* Where a footpath meets the carriageway the kerb is dropped: no kerbstone,
     * a worn apron of road instead. The rows say where, by putting paving up
     * against the road. */
    var roadRows = Object.keys(road).map(Number).sort(function (a, b) { return a - b; });
    if (roadRows.length) {
      var first = roadRows[0], last = roadRows[roadRows.length - 1];
      for (x = 0; x < w; x++) {
        if (at(rows, x, first - 1) === '-') {
          R(g, x0 + x * T, y0 + first * T, T, 4, p.floorLight);
          R(g, x0 + x * T, y0 + first * T, T, 1, p.pavingHi);
          R(g, x0 + x * T, y0 + first * T + 3, T, 1, 'rgba(37,40,43,.18)');
        }
        if (at(rows, x, last + 1) === '-') {
          R(g, x0 + x * T, y0 + (last + 1) * T - 4, T, 4, p.floorLight);
          R(g, x0 + x * T, y0 + (last + 1) * T - 1, T, 1, p.pavingHi);
          R(g, x0 + x * T, y0 + (last + 1) * T - 4, T, 1, 'rgba(37,40,43,.18)');
        }
      }
    }
    plan.pieces.forEach(function (piece) { drawPiece(g, kit, p, x0, y0, piece, rows, opts); });
  }

  function drawHome(g, kit, p, rows, x0, y0, plan, opts) {
    var R = kit.rect, w = widthOf(rows), h = rows.length, front = plan.front, x, y;
    var W = w * T, lamp = lampsOn(opts);
    backdrop(g, kit, '#191d20');
    /* The ground outside, below the front wall. */
    for (y = front + 1; y <= h; y++) for (x = -1; x <= w; x++) {
      var my = Math.min(y, h - 1), mx = Math.min(Math.max(x, 0), w - 1);
      var ch = rows[my].charAt(mx), sx = x0 + x * T, sy = y0 + y * T;
      if (ch === '-' && x >= 0 && x < w) paving(g, R, p, sx, sy, x, y, 'path');
      else grass(g, R, p, sx, sy, x, y);
      if (x < 0 || x >= w || y >= h) R(g, sx, sy, T, T, 'rgba(18,22,25,.45)');
    }
    /* The floor, wall to wall. */
    kit.plankFloor(g, x0, y0, T, T, W - T, front * T, p);
    R(g, x0 + T, y0 + T, W - 2 * T, 7, 'rgba(32,28,21,.24)');
    R(g, x0 + T, y0 + T, 5, (front - 1) * T, 'rgba(34,29,21,.17)');
    R(g, x0 + W - T - 6, y0 + T, 6, (front - 1) * T, 'rgba(34,29,21,.20)');
    /* A rug, in wool with the room's accent round its edge, on the largest
     * clear stretch of floor. Flat, low contrast: a floor, not a hole. */
    var rug = rugRect(rows, front);
    if (rug) {
      var rx = x0 + rug.x * T + 4, ry = y0 + rug.y * T + 4, rw = rug.w * T - 8, rh = rug.h * T - 8;
      R(g, rx, ry, rw, rh, p.woolDark);
      R(g, rx + 1, ry + 1, rw - 2, rh - 2, p.wool);
      R(g, rx + 2, ry + 2, rw - 4, 1, p.woolHi);
      R(g, rx + 3, ry + 3, rw - 6, rh - 6, p.redDark);
      R(g, rx + 4, ry + 4, rw - 8, rh - 8, p.wool);
      for (var mx2 = rx + 7; mx2 < rx + rw - 8; mx2 += 8) {
        R(g, mx2, ry + 6, 3, 2, p.red);
        R(g, mx2, ry + rh - 8, 3, 2, p.red);
        R(g, mx2 + 1, ry + Math.round(rh / 2) - 1, 1, 2, p.woolHi);
      }
      for (var fx = rx + 1; fx < rx + rw - 1; fx += 3) { R(g, fx, ry - 1, 2, 1, p.creamShade); R(g, fx, ry + rh, 2, 1, p.creamShade); }
    }
    /* The back wall: plaster over a boarded dado, and a skirting on the floor.
     * It rises off the top of the map, where nothing can walk. */
    R(g, x0, y0 - 22, W, 22 + T, p.plaster);
    R(g, x0, y0 - 22, W, 3, p.plasterHi);
    R(g, x0, y0 - 22, W, 1, p.woodDark);
    R(g, x0, y0 - 7, W, 1, p.plasterShade);                    // picture rail
    R(g, x0, y0 - 6, W, 1, p.woodLight);
    kit.panel(g, x0, y0 + 1, W, 12, p);
    R(g, x0, y0 - 1, W, 2, p.woodLight);
    R(g, x0, y0 + 13, W, 3, p.woodDark);
    R(g, x0, y0 + 13, W, 1, p.woodHi);
    R(g, x0, y0 + T, W, 2, 'rgba(37,40,43,.22)');
    /* The side walls. */
    [0, w - 1].forEach(function (col) {
      kit.panel(g, x0 + col * T, y0 + T - 4, T, (front - 1) * T + 4, p);
      R(g, x0 + col * T, y0 + T - 4, T, 2, p.woodLight);
    });
    /* What hangs on the back wall, chosen by where the rows leave it clear. */
    var free = [];
    for (x = 1; x < w - 1; x++) if (rows[1].charAt(x) === '.') free.push(x);
    var accent = idHash(rows.join('|'));
    var hung = {};
    free.forEach(function (col, n) {
      var slot = (accent + n) % 4;
      if (n % 2 === 1 || free.length < 3) return;
      hung[col] = true;
      if (slot === 3) shelf(g, kit, p, x0 + col * T + 1, y0 - 19);
      else kit.picture(g, x0 + col * T + 2, y0 - 20, 12, 14, p, ['photo', 'portrait', 'clock'][slot]);
    });
    /* One lamp on the back wall, where nothing else hangs. */
    var bare = free.filter(function (col) { return !hung[col]; });
    var lampCol = bare.length ? bare[Math.floor(bare.length / 2)] : (free[0] || 1);
    if (lamp > 0) kit.warmLight(g, x0 + lampCol * T - 16, y0 + 6, 48, 38, lamp);
    kit.lamp(g, x0 + lampCol * T + 7, y0 - 15, p);
    /* Coats on a side wall, which the rows make solid, and a mat inside the
     * door. Nothing on the floor a person could be expected to walk round. */
    var coatSide = (plan.door && plan.door.x > w / 2) ? 0 : w - 1;
    var coatX = x0 + coatSide * T + 1, coatY = y0 + (front - 2) * T;
    R(g, coatX, coatY, 14, 2, p.woodDark);
    R(g, coatX, coatY, 14, 1, p.woodHi);
    [2, 7, 11].forEach(function (dx, n) {
      R(g, coatX + dx, coatY + 2, 1, 2, p.metal);
      if (n === 1) return;
      R(g, coatX + dx - 2, coatY + 3, 5, 9, n ? p.green : p.red);
      R(g, coatX + dx - 2, coatY + 3, 5, 1, n ? p.leaf : p.redHi);
      R(g, coatX + dx - 2, coatY + 3, 1, 9, n ? p.leafHi : p.redHi);
    });
    if (plan.door) {
      var matX = x0 + plan.door.x * T + 2, matY = y0 + (front - 1) * T + 9;
      R(g, matX, matY, plan.door.w * T - 4, 6, p.woodDark);
      R(g, matX + 1, matY + 1, plan.door.w * T - 6, 4, p.mud);
      for (var dxm = 2; dxm < plan.door.w * T - 5; dxm += 3) R(g, matX + dxm, matY + 1, 1, 4, p.mudHi);
    }
    plan.pieces.forEach(function (piece) { drawPiece(g, kit, p, x0, y0, piece, rows, opts); });
    /* Daylight off the window onto the floor: a band, the width of the pane,
     * not a pool. Only when the lamps are not the light in the room. */
    if (lamp === 0) plan.pieces.forEach(function (piece) {
      if (piece.kind !== 'window') return;
      var wx = x0 + piece.x * T, ww = piece.w * T;
      R(g, wx - 1, y0 + T, ww + 2, 30, 'rgba(236,240,222,.10)');
      R(g, wx + 1, y0 + T, ww - 2, 22, 'rgba(244,246,226,.10)');
      R(g, wx + 3, y0 + T, ww - 6, 14, 'rgba(250,250,232,.09)');
    });
    frontWall(g, kit, p, x0, y0 + front * T, W, plan.door ? x0 + plan.door.x * T : x0 + T, plan.door ? plan.door.w * T : 32);
  }

  /* A wall shelf with what a person keeps on one. */
  function shelf(g, kit, p, x, y) {
    var R = kit.rect;
    R(g, x, y + 11, 14, 2, p.woodDark);
    R(g, x, y + 11, 14, 1, p.woodLight);
    R(g, x + 1, y + 13, 1, 2, p.woodDark);
    R(g, x + 12, y + 13, 1, 2, p.woodDark);
    [0, 3, 5, 8, 10].forEach(function (dx, n) {
      var bh = 6 + (n % 3);
      R(g, x + 1 + dx, y + 11 - bh, n % 2 ? 2 : 3, bh, [p.red, p.green, p.gold, p.redDark, p.woodHi][n]);
      R(g, x + 1 + dx, y + 11 - bh, n % 2 ? 2 : 3, 1, p.creamShade);
    });
  }

  /* A cutaway front wall, the way the kit's diner front is a cutaway: low
   * enough to see the room over, with the door the rows put in it. */
  function frontWall(g, kit, p, x, y, w, doorX, doorW) {
    var R = kit.rect;
    R(g, x, y, w, T, p.woodDark);
    R(g, x, y + 1, w, 9, p.plaster);
    R(g, x, y + 1, w, 1, p.plasterHi);
    for (var i = 0; i < w; i += 6) R(g, x + i, y + 4, 3, 1, p.plasterShade);
    R(g, x, y + 10, w, 3, p.wood);
    R(g, x, y + 10, w, 1, p.woodHi);
    R(g, x, y + 13, w, 3, p.woodDark);
    R(g, doorX - 2, y, doorW + 4, T, p.woodDark);
    R(g, doorX, y + 1, doorW, 14, p.redDark);
    R(g, doorX + 1, y + 2, doorW - 2, 12, p.red);
    R(g, doorX + Math.round(doorW / 2) - 1, y + 2, 2, 12, p.woodDark);
    [3, Math.round(doorW / 2) + 2].forEach(function (dx) {
      R(g, doorX + dx, y + 4, doorW / 2 - 5, 4, p.redHi);
      R(g, doorX + dx, y + 4, doorW / 2 - 5, 1, p.redLight);
      R(g, doorX + dx, y + 9, doorW / 2 - 5, 4, p.redDark);
    });
    R(g, doorX + Math.round(doorW / 2) - 4, y + 8, 2, 2, p.gold);
    R(g, doorX + Math.round(doorW / 2) + 2, y + 8, 2, 2, p.gold);
    R(g, doorX, y + 1, doorW, 1, p.woodLight);
  }

  /* The widest clear rectangle of plain floor, two or three cells each way. */
  function rugRect(rows, front) {
    var w = widthOf(rows), best = null;
    for (var y = 2; y <= front - 2; y++) for (var x = 1; x <= w - 3; x++) {
      for (var hh = 2; hh <= 3; hh++) for (var ww = 2; ww <= 4; ww++) {
        if (y + hh > front || x + ww > w - 1) continue;
        var clear = true;
        for (var dy = 0; dy < hh && clear; dy++) for (var dx = 0; dx < ww; dx++) {
          if (at(rows, x + dx, y + dy) !== '.') { clear = false; break; }
        }
        if (!clear) continue;
        var score = ww * hh * 10 - Math.abs(x + ww / 2 - w / 2) - Math.abs(y + hh / 2 - front / 2);
        if (!best || score > best.score) best = { x: x, y: y, w: ww, h: hh, score: score };
      }
    }
    return best;
  }

  /* ---- the two calls the view makes ------------------------------------ */

  /* Ground and back layer. Returns false when this package cannot draw the
   * place, so the caller falls back to the placeholder painter. */
  TP.draw = function (g, locationId, rows, camX, camY, opts) {
    var kind = TP.kindOf(locationId);
    if (!kind || !g || !rows || !rows.length) return false;
    var kit = kitOf(opts);
    if (!kit || !kit.rect) return false;
    var plan = TP.plan(locationId, rows);
    if (!plan) return false;
    var p = paletteOf(kit, locationId, opts);
    var x0 = -Math.round(camX || 0), y0 = -Math.round(camY || 0);
    if (kind === 'park') drawPark(g, kit, p, rows, x0, y0, plan, opts);
    else if (kind === 'street') drawStreet(g, kit, p, rows, x0, y0, plan, opts);
    else drawHome(g, kit, p, rows, x0, y0, plan, opts);
    return true;
  };

  /* Everything that must cover a person standing behind it, for one depth
   * band. Same arguments as `draw`, plus the band. Returns false for a place
   * this package does not paint. */
  TP.drawForeground = function (g, locationId, rows, camX, camY, footMin, footMax, opts) {
    var kind = TP.kindOf(locationId);
    if (!kind || !g || !rows || !rows.length) return false;
    var kit = kitOf(opts);
    if (!kit || !kit.rect) return false;
    var plan = TP.plan(locationId, rows);
    if (!plan) return false;
    var p = paletteOf(kit, locationId, opts);
    var x0 = -Math.round(camX || 0), y0 = -Math.round(camY || 0);
    plan.pieces.forEach(function (piece) {
      if (!piece.foreground) return;
      if (piece.depth >= footMin && piece.depth < footMax) drawPiece(g, kit, p, x0, y0, piece, rows, opts);
    });
    return true;
  };

  /* Which cells each piece claims, for the test that holds art and rows in
   * agreement. Ground painters claim nothing: they paint what is walkable. */
  TP.claims = function (locationId, rows) {
    var plan = TP.plan(locationId, rows);
    if (!plan) return null;
    var out = {};
    plan.pieces.forEach(function (piece) {
      if (piece.cells) { piece.cells.forEach(function (c) { out[c.x + ',' + c.y] = piece.kind; }); return; }
      for (var dy = 0; dy < piece.h; dy++) for (var dx = 0; dx < piece.w; dx++) out[(piece.x + dx) + ',' + (piece.y + dy)] = piece.kind;
    });
    return out;
  };

  /* Kinds that sit on a cell a person may walk onto: a doorway is a way
   * through, and a chair is where someone stands to sit down. Everything
   * else must be on a solid cell. */
  TP.WALKABLE_KINDS = { door: 1, gate: 1, chair: 1 };

  TP.VERSION = 'town-places-v01';
})();
