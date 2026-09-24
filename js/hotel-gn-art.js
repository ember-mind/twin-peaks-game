/* Great Northern lobby — native 20x12 lodge composition (320x192 pixels). */
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : globalThis;
  var GAME = root.GAME = root.GAME || {};
  var W = 320, H = 192;
  var p = Object.freeze({
    ink: '#211e1c', black: '#171817',
    wallDark: '#3b2b23', wall: '#65432d', wallLight: '#8b5c39',
    oak: '#70482f', oakHi: '#a46a3d', gold: '#b5864c',
    cream: '#e9c582', light: '#ffe7a6',
    redDark: '#4c2327', red: '#803338', redHi: '#aa5350',
    stoneDark: '#47423a', stone: '#776957', stoneHi: '#a28c6a',
    green: '#46513a', greenHi: '#77805a', fire: '#d77b37'
  });

  /* Only map cells carrying a physical furniture glyph belong here. Stairs
   * are a painted architectural flight ending at the real hall door, so its
   * walkable cells intentionally stay out of this list. */
  var props = [
    { id: 'fireplace', cells: [[2, 4], [3, 4], [4, 4], [5, 4]], x: 32, footY: 80 },
    { id: 'chairWest', cells: [[4, 6]], x: 64, footY: 112 },
    { id: 'table', cells: [[5, 6]], x: 80, footY: 112 },
    { id: 'chairEast', cells: [[6, 6]], x: 96, footY: 112 },
    { id: 'luggage', cells: [[17, 6]], x: 272, footY: 112 },
    { id: 'reception', cells: [[11, 8], [12, 8], [13, 8], [14, 8]], x: 176, footY: 148 },
    /* Walked on, not stood behind: whoever is on the flight or at the hall
     * door above it is drawn over it (audit 2026-09-24: Cooper arriving from
     * Room 315 was hidden under the landing, head only). */
    { id: 'stairs', cells: [], x: 272, footY: 0 }
  ];

  function painter(ctx, cx, cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    return function (x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x - cx, y - cy, w, h);
    };
  }
  function diamond(R, x, y, r, color) {
    for (var dy = -r; dy <= r; dy++) {
      var span = r - Math.abs(dy);
      R(x - span, y + dy, span * 2 + 1, 1, color);
    }
  }

  function floor(R) {
    R(16, 64, 288, 112, p.wallDark);
    var bands = [64, 72, 82, 94, 108, 124, 144, 168, 176];
    for (var b = 0; b < bands.length - 1; b++) {
      var y = bands[b], h = bands[b + 1] - y;
      R(16, y, 288, 1, p.ink);
      var start = 16 - (b % 2 ? 24 : 0);
      for (var x = start, n = 0; x < 304; x += 48, n++) {
        var left = Math.max(16, x), right = Math.min(304, x + 48);
        if (right <= left) continue;
        R(left, y + 1, right - left, Math.max(1, h - 2), p.oak);
        if (left > 16) R(left, y + 1, 1, Math.max(1, h - 2), p.wallDark);
        if (right - left > 14) {
          var grain = 7 + ((n + b) % 3) * 3;
          var gx = left + 6 + ((b * 13 + n * 7) % Math.max(1, right - left - grain - 7));
          R(gx, y + 3, grain, 1, p.gold);
          if (grain > 9) R(gx + 2, y + 2, grain - 5, 1, p.wallLight);
          if ((n + b) % 3 === 1) R(left + 5, y + h - 3, right - left - 10, 1, p.wallDark);
        }
      }
      R(16, bands[b + 1] - 1, 288, 1, p.wallDark);
    }
    R(16, 64, 2, 112, p.ink); R(18, 64, 1, 112, p.wallLight);
    R(302, 64, 2, 112, p.ink); R(301, 64, 1, 112, p.wallLight);
    R(16, 176, 288, 2, p.ink); R(18, 176, 284, 1, p.wallLight);

    /* The runner. A fresh critic read the round-1 version as "a flat vertical
     * band with no perspective break or furniture crossing it, splitting the
     * room into two unrelated halves". Three things fix that without moving a
     * tile: it TAPERS toward the doors at the north end, it changes value
     * where the chandelier hangs over it, and two things cross its edges —
     * the counter's cast shadow on the east, the lounge rug on the west. */
    /* walls() repaints y<64 afterwards, so the visible run is y 64..176. The
     * taper is 1px per side per band: at seven bands the edge reads as a
     * receding line rather than a stack of rectangles. */
    var bands = [[44, 78, 142, 36], [78, 92, 141, 38], [92, 106, 140, 40],
      [106, 120, 139, 42], [120, 134, 138, 44], [134, 148, 137, 46],
      [148, 176, 136, 48]];
    bands.forEach(function (b) {
      var y = b[0], h = b[1] - b[0], x = b[2], w = b[3];
      R(x, y, w, h, p.ink);
      R(x + 2, y, w - 4, h, p.gold);
      R(x + 5, y, w - 10, h, p.redDark);
      R(x + 9, y, w - 18, h, p.red);
      R(x + 11, y, 2, h, p.redHi);
      R(x + w - 13, y, 2, h, p.redDark);
    });
    /* The chandelier's light falls across the middle of the run as a stepped
     * pool, not a rectangle, so the strip is not one value door to wall. */
    [[96, 22], [92, 20], [100, 20], [88, 16], [104, 16], [84, 10], [108, 10]]
      .forEach(function (step) {
        R(160 - (step[1] >> 1), step[0], step[1], 4, p.redHi);
      });
    R(153, 90, 14, 12, p.redHi);
    /* Woven fringe at both short ends: what makes it read as a rug laid on
     * the floor rather than a painted stripe. The north fringe sits at the
     * wall foot, where the run actually becomes visible. */
    var fx;
    for (fx = 144; fx < 178; fx += 3) {
      R(fx, 64, 1, 3, p.gold);
      R(fx + 1, 64, 1, 2, p.cream);
    }
    for (fx = 138; fx < 182; fx += 3) {
      R(fx, 173, 1, 3, p.gold);
      R(fx + 1, 173, 1, 2, p.cream);
    }
    for (var markY = 78; markY <= 158; markY += 16) {
      diamond(R, 160, markY, 4, p.gold);
      diamond(R, 160, markY, 2, p.redDark);
      R(160, markY, 1, 1, p.wallLight);
    }
    /* The counter throws a stepped shadow west onto the runner's east edge,
     * and the lounge rug meets its west edge at x=136. Neither half of the
     * room ends at the strip any more. */
    R(172, 132, 12, 2, p.red);
    R(168, 134, 16, 2, p.redDark);
    R(163, 136, 21, 3, p.redDark);
    R(160, 139, 24, 3, p.ink);
    R(165, 142, 19, 2, p.redDark);
    R(172, 144, 12, 2, p.redDark);
    /* Bounded west lounge rug, kept separate from the public runner. */
    R(40, 84, 96, 52, p.ink); R(42, 86, 92, 48, p.gold);
    R(45, 89, 86, 42, p.redDark); R(48, 92, 80, 36, p.red);
    R(50, 94, 76, 2, p.redHi); R(50, 125, 76, 2, p.redDark);
    R(50, 94, 2, 32, p.gold); R(124, 94, 2, 32, p.gold);
    for (var rugX = 56; rugX < 114; rugX += 14) {
      R(rugX, 91, 5, 1, p.wallLight); R(rugX, 128, 5, 1, p.gold);
    }
    diamond(R, 61, 105, 3, p.gold); diamond(R, 61, 105, 1, p.redDark);
    diamond(R, 109, 105, 3, p.gold); diamond(R, 109, 105, 1, p.redDark);
  }

  function column(R, x, y, h) {
    R(x, y, 14, h, p.ink); R(x + 1, y, 12, h, p.wallDark);
    R(x + 3, y, 7, h, p.wall); R(x + 4, y, 2, h, p.wallLight);
    R(x + 1, y, 12, 3, p.wallDark); R(x + 2, y + 1, 10, 1, p.wallLight);
    for (var yy = y + 18; yy < y + h - 5; yy += 30) {
      R(x + 1, yy, 12, 3, p.wallDark); R(x + 2, yy, 10, 1, p.wallLight);
      R(x + 4, yy + 1, 6, 1, p.gold);
    }
    R(x + 1, y + h - 4, 12, 4, p.wallDark); R(x + 3, y + h - 3, 8, 1, p.wallLight);
  }
  function beam(R, x, y, w, h) {
    R(x, y, w, h, p.ink); R(x + 1, y + 1, w - 2, h - 2, p.wallDark);
    if (h > 3) { R(x + 2, y + 1, w - 4, 1, p.wallLight); R(x + 2, y + h - 2, w - 4, 1, p.wall); }
  }
  function plant(R, x, y) {
    /* One connected foliage mass with a lit crown. The round-1 plant was
     * seven detached 5x3 dashes over an empty oak box, which a fresh critic
     * read at 1x as a picture frame rather than a plant. */
    R(x - 6, y - 7, 12, 8, p.ink);
    R(x - 5, y - 6, 10, 6, p.oak);
    R(x - 4, y - 5, 8, 1, p.gold);
    R(x - 4, y - 2, 8, 1, p.wallDark);
    R(x - 1, y - 9, 3, 3, p.ink);
    R(x - 5, y - 20, 10, 12, p.ink);
    R(x - 7, y - 17, 14, 7, p.ink);
    R(x - 4, y - 19, 8, 10, p.green);
    R(x - 6, y - 16, 12, 5, p.green);
    R(x - 3, y - 18, 6, 4, p.greenHi);
    R(x - 5, y - 15, 4, 2, p.greenHi);
    R(x + 1, y - 14, 4, 2, p.green);
    R(x - 2, y - 22, 4, 4, p.ink);
    R(x - 1, y - 21, 2, 3, p.greenHi);
    R(x - 6, y - 12, 3, 3, p.ink);
    R(x - 5, y - 11, 2, 2, p.green);
    R(x + 3, y - 12, 3, 3, p.ink);
    R(x + 4, y - 11, 2, 2, p.green);
  }

  function lantern(R, x, y) {
    R(x - 2, y - 4, 5, 3, p.ink); R(x, y - 6, 1, 2, p.gold);
    R(x - 4, y, 9, 12, p.ink); R(x - 3, y, 7, 10, p.gold);
    R(x - 2, y + 1, 5, 8, p.cream); R(x - 1, y + 2, 3, 6, p.light);
    R(x - 4, y + 10, 9, 2, p.wallDark);
  }

  function walls(R) {
    /* The log courses. A fresh critic read the round-1 wall as "the same
     * brick-like unit across the entire upper half at uniform contrast", so
     * the wall competed with the props. Three changes push it back: the log
     * face drops from wallLight/wallDark to a wall/wallDark pair, the
     * per-course seam is one soft shadow line instead of a lit top edge, and
     * the run is varied — log lengths alternate, knots appear on a fixed
     * pattern, and the course under the ceiling beam is a full step darker.
     * The mounted head and the GREAT NORTHERN sign stay the two accents. */
    R(0, 0, W, 64, p.wallDark);
    for (var y = 7, row = 0; y < 60; y += 13, row++) {
      var deep = y >= 44;
      var face = deep ? p.wallDark : p.wall;
      var seam = deep ? p.ink : p.wallDark;
      R(16, y, 288, 1, p.ink);
      var span = (row % 2) ? 44 : 36;
      for (var x = 18 - (row % 2 ? 22 : 0); x < 302; x += span) {
        var left = Math.max(18, x), right = Math.min(302, x + span - 2);
        if (right - left < 4) continue;
        R(left, y + 1, right - left, 10, face);
        /* One shadow line under each log, and a faint one along the top.
         * No lit edge: a highlight per course is what made the wall shout. */
        R(left, y + 9, right - left, 2, seam);
        R(left + 1, y + 1, Math.max(1, right - left - 2), 1, deep ? p.wallDark : p.wallDark);
        /* A knot every third log, on the course's own rhythm. */
        if (((row * 3 + left) % 7) === 0 && right - left > 14) {
          R(left + 6, y + 4, 3, 3, seam);
          R(left + 7, y + 5, 1, 1, face);
        }
        R(right - 1, y + 1, 1, 10, p.ink);
      }
    }
    /* A darker band under the ceiling beam so the top of the wall falls away
     * instead of meeting the beam at full value. */
    R(16, 51, 288, 7, p.wallDark);
    R(16, 51, 288, 1, p.ink);
    for (var bx = 20; bx < 300; bx += 40) R(bx, 54, 24, 1, p.ink);
    beam(R, 16, 0, 288, 6); beam(R, 16, 58, 288, 7);
    [18, 166, 250, 306].forEach(function (x) { column(R, x, 0, 64); });

    /* Actual hall door at map cell (16,1): one jamb and one red panel. */
    R(254, 10, 22, 54, p.ink); R(256, 12, 18, 50, p.wallLight);
    R(258, 15, 14, 44, p.wallDark); R(259, 17, 12, 25, p.ink);
    R(260, 18, 10, 22, p.redDark); R(261, 19, 8, 20, p.red);
    R(261, 19, 2, 19, p.redHi); R(268, 29, 2, 2, p.gold); R(269, 29, 1, 1, p.cream);
    R(258, 42, 14, 4, p.wallDark); R(256, 58, 18, 4, p.wallDark);
    R(256, 12, 18, 3, p.wall); R(258, 13, 14, 1, p.gold);

    /* Quiet wall art and practicals establish lodge scale without inventing
     * another opening or blocking the rear receiving route. */
    /* Framed landscape. In the round-1 build this hung at x=44, entirely
     * behind the fireplace stack, so it was paint nobody could see; it now
     * hangs on the clear log wall west of the chandelier and carries one
     * strong silhouette — a lit sky, a horizon line, a ridge and a dark
     * foreground — instead of three abstract blocks. */
    R(104, 12, 38, 32, p.ink); R(106, 14, 34, 28, p.gold);
    R(107, 15, 32, 26, p.oak); R(109, 17, 28, 22, p.ink);
    R(110, 18, 26, 12, p.stoneHi);
    R(110, 18, 26, 4, p.cream);
    R(110, 26, 26, 4, p.stoneDark);
    R(110, 30, 26, 1, p.ink);
    R(113, 22, 9, 8, p.stoneDark);
    R(115, 20, 5, 4, p.stoneDark);
    R(116, 20, 2, 2, p.wallLight);
    R(124, 24, 11, 6, p.stoneDark);
    R(127, 22, 5, 3, p.stoneDark);
    R(110, 31, 26, 7, p.green);
    R(110, 31, 26, 1, p.greenHi);
    R(112, 34, 8, 1, p.greenHi);
    R(124, 36, 9, 1, p.greenHi);
    R(110, 38, 26, 1, p.ink);
    lantern(R, 30, 28); lantern(R, 148, 30); lantern(R, 244, 30);
    lantern(R, 8, 112); lantern(R, 312, 114);
    plant(R, 26, 111); plant(R, 300, 112); plant(R, 300, 168);

    /* South double doors are the only paired arrival opening. */
    R(0, 176, 320, 16, p.black); R(136, 176, 48, 16, p.ink);
    R(140, 178, 18, 14, p.wall); R(162, 178, 18, 14, p.wall);
    R(142, 180, 14, 10, p.gold); R(164, 180, 14, 10, p.gold);
    R(144, 181, 10, 8, p.cream); R(166, 181, 10, 8, p.cream);
    R(148, 182, 2, 7, p.light); R(170, 182, 2, 7, p.light);
    R(158, 176, 4, 16, p.ink); R(136, 176, 48, 2, p.wallLight);
  }

  function fireplace(R) {
    /* Hearth body fills the four C cells and climbs into a stone bay. */
    R(24, 8, 80, 72, p.ink); R(26, 10, 76, 68, p.stoneDark);
    for (var row = 0; row < 5; row++) {
      var yy = 18 + row * 10;
      R(28, yy, 18, 9, p.stone); R(29, yy + 1, 16, 1, p.stoneHi); R(29, yy + 8, 16, 1, p.stoneDark);
      R(52, yy, 21, 9, p.stone); R(53, yy + 1, 19, 1, p.stoneHi); R(53, yy + 8, 19, 1, p.stoneDark);
      R(78, yy, 19, 9, p.stone); R(79, yy + 1, 17, 1, p.stoneHi); R(79, yy + 8, 17, 1, p.stoneDark);
    }
    /* Bear plaque, mounted on the stone rather than floating. */
    R(46, 12, 36, 31, p.ink); R(48, 14, 32, 27, p.wallDark);
    R(51, 17, 26, 20, p.wall); R(49, 21, 30, 12, p.wall);
    R(52, 17, 7, 6, p.oak); R(71, 17, 7, 6, p.oak);
    R(54, 21, 22, 16, p.oak); R(52, 25, 26, 10, p.oak);
    R(56, 22, 4, 3, p.ink); R(70, 22, 4, 3, p.ink);
    R(58, 27, 14, 8, p.oakHi); R(60, 28, 10, 3, p.ink); R(61, 34, 8, 2, p.ink);
    R(57, 34, 3, 2, p.cream); R(69, 34, 3, 2, p.cream); R(63, 36, 4, 2, p.redDark);
    /* Mantel, firebox and low sill. */
    R(22, 42, 84, 8, p.ink); R(24, 43, 80, 2, p.stoneHi); R(26, 46, 76, 3, p.stoneDark);
    R(31, 49, 66, 29, p.stone); R(34, 50, 60, 27, p.ink); R(36, 52, 56, 23, p.black);
    R(37, 72, 54, 3, p.fire); R(40, 70, 48, 2, p.cream);
    [[40, 60, 5], [48, 54, 5], [57, 58, 5], [66, 51, 5], [75, 57, 5], [83, 62, 4]].forEach(function (a) {
      R(a[0], a[1], a[2], 73 - a[1], p.fire);
      R(a[0] + 1, a[1] + 4, Math.max(2, a[2] - 2), 68 - a[1], p.cream);
      R(a[0] + 1, 67, Math.max(1, a[2] - 2), 5, p.light);
    });
    R(30, 76, 68, 6, p.ink); R(32, 76, 64, 2, p.stoneHi); R(34, 78, 60, 2, p.stone);
    R(40, 79, 48, 1, p.gold);
  }

  function chair(R, x, y, mirror) {
    var left = mirror ? x + 16 : x;
    function C(dx, dy, w, h, color) {
      var px = mirror ? left - dx - w : left + dx;
      R(px, y + dy, w, h, color);
    }
    C(1, -22, 14, 22, p.ink); C(3, -20, 10, 18, p.redDark); C(4, -18, 8, 14, p.red);
    C(3, -21, 10, 2, p.redHi); C(4, -18, 2, 9, p.redHi); C(5, -4, 8, 3, p.redDark);
    C(0, -19, 4, 16, p.ink); C(1, -18, 3, 4, p.redHi); C(1, -14, 2, 9, p.red);
    C(13, -19, 4, 16, p.ink); C(13, -18, 3, 4, p.redHi); C(14, -14, 2, 9, p.red);
    C(2, -3, 4, 2, p.wallDark); C(11, -3, 4, 2, p.wallDark);
    C(2, 0, 3, 2, p.ink); C(12, 0, 3, 2, p.ink);
  }
  function table(R) {
    R(77, 107, 22, 4, p.ink); R(80, 108, 16, 2, p.oak);
    R(76, 96, 24, 4, p.ink); R(78, 97, 20, 2, p.oakHi); R(80, 98, 16, 1, p.gold);
    R(85, 100, 6, 10, p.ink); R(86, 101, 4, 9, p.wallLight); R(87, 102, 2, 8, p.wallDark);
    R(84, 91, 8, 3, p.ink); R(85, 92, 6, 1, p.gold); R(87, 87, 2, 5, p.gold);
    R(83, 84, 10, 4, p.ink); R(84, 84, 8, 2, p.cream); R(85, 86, 6, 2, p.light);
  }

  var font = {
    G: ['111', '100', '101', '101', '111'], R: ['110', '101', '110', '101', '101'],
    E: ['111', '100', '110', '100', '111'], A: ['010', '101', '111', '101', '101'],
    T: ['111', '010', '010', '010', '010'], N: ['101', '111', '111', '101', '101'],
    O: ['111', '101', '101', '101', '111'], H: ['101', '101', '111', '101', '101']
  };
  function label(R, text, x, y) {
    Array.from(text).forEach(function (ch, i) {
      (font[ch] || []).forEach(function (row, dy) {
        Array.from(row).forEach(function (v, dx) { if (v === '1') R(x + i * 4 + dx, y + dy, 1, 1, p.cream); });
      });
    });
  }

  function receptionBack(R) {
    /* Wall-mounted work zone. The clear y=112..126 strip remains an aisle for
     * Ben and service circulation; no decorative shape is painted there. */
    R(176, 48, 72, 62, p.ink); R(178, 50, 68, 58, p.wallDark);
    R(180, 52, 64, 3, p.wallLight); R(180, 56, 64, 2, p.wall);
    R(182, 58, 60, 24, p.oak); R(184, 60, 56, 20, p.wallDark);
    R(180, 62, 64, 21, p.ink); R(182, 64, 60, 17, p.gold); R(184, 66, 56, 13, p.wallDark);
    /* Great Northern sign belongs to its support wall above the key bank. */
    [[202, 76, 5], [214, 76, 8], [226, 76, 5]].forEach(function (a) {
      for (var n = 0; n < a[2]; n++) R(a[0] - n, a[1] - a[2] + n, 2 * n + 1, 1, p.wallLight);
    });
    label(R, 'GREAT', 192, 65); label(R, 'NORTHERN', 187, 72);
    R(182, 82, 60, 2, p.ink); R(184, 82, 56, 1, p.gold);
    /* Key pigeonholes: mounted cubbies stop above the staff aisle. */
    R(182, 84, 60, 28, p.ink); R(184, 86, 56, 24, p.oak);
    for (var yy = 88; yy < 108; yy += 10) for (var xx = 186; xx < 238; xx += 13) {
      R(xx, yy, 11, 8, p.ink); R(xx + 2, yy + 2, 7, 4, ((xx + yy) % 3 === 0) ? p.oakHi : p.wallDark);
      R(xx + 8, yy + 3, 2, 2, p.gold);
    }
    R(184, 110, 56, 2, p.wallLight);
    /* Side-entry jamb indicates service side without masquerading as a door. */
    R(242, 78, 6, 44, p.ink); R(243, 80, 3, 40, p.wall); R(244, 81, 1, 37, p.wallLight);
    R(242, 120, 6, 5, p.wallDark); R(244, 121, 2, 3, p.gold);
  }
  function reception(R) {
    /* Counter occupies the four C cells on the right perimeter. */
    R(174, 123, 68, 6, p.ink); R(176, 124, 64, 3, p.gold); R(178, 127, 60, 18, p.wallDark);
    [180, 199, 218].forEach(function (x, i) {
      R(x, 130, 17, 12, i === 2 ? p.oakHi : p.oak);
      R(x, 130, 17, 1, p.wallLight); R(x + 1, 132, 15, 1, p.gold);
      R(x + 2, 140, 13, 1, p.wallDark); R(x + 16, 132, 1, 10, p.ink);
    });
    R(176, 143, 64, 2, p.ink); R(178, 144, 60, 1, p.wallLight);
    /* Guest-edge bell and desk lamp sit on the same transaction plane. */
    R(197, 120, 11, 3, p.ink); R(198, 118, 9, 3, p.gold); R(200, 117, 5, 2, p.cream);
    R(224, 124, 11, 2, p.ink); R(225, 122, 9, 2, p.gold); R(229, 116, 1, 7, p.gold);
    R(225, 112, 9, 4, p.gold); R(226, 113, 7, 3, p.cream); R(228, 114, 3, 2, p.light);
  }
  function luggage(R) {
    /* Parked cart in far-right service bay, clear of central runner. */
    R(268, 112, 34, 8, p.ink); R(270, 113, 30, 1, p.gold); R(272, 115, 26, 3, p.wallDark);
    R(272, 82, 2, 31, p.gold); R(294, 82, 2, 31, p.gold); R(273, 80, 4, 3, p.cream); R(291, 80, 4, 3, p.cream);
    R(276, 90, 17, 7, p.ink); R(277, 91, 15, 5, p.oak); R(279, 92, 11, 3, p.red);
    R(273, 97, 22, 14, p.wallDark); R(275, 99, 18, 10, p.redDark); R(277, 100, 14, 1, p.redHi);
    R(279, 99, 1, 10, p.gold); R(289, 99, 1, 10, p.gold);
    diamond(R, 275, 113, 3, p.ink); diamond(R, 275, 113, 2, p.wallDark);
    diamond(R, 293, 113, 3, p.ink); diamond(R, 293, 113, 2, p.wallDark);
    R(275, 111, 22, 1, p.wallLight);
  }
  function stairs(R) {
    /* Sloped flight joins the hall door; scenery, not a collision footprint.
     * Only x=236..264 is inside the camera crop, which is why the round-1
     * flight read as abstract stripes at 1x: the eye saw eight equal bands
     * and no structure. Each step is now a dark riser under a light tread
     * with a lit nosing, the left stringer is a continuous diagonal board,
     * and a newel post with a ball finial anchors the bottom of the run. */
    R(236, 36, 84, 116, p.ink); R(238, 38, 78, 112, p.wallDark);
    for (var step = 0; step < 12; step++) {
      var y = 40 + step * 9, left = 238 + Math.floor(step * 1.5), right = 316 - Math.floor(step * .4);
      /* Riser in shadow, then the tread catching the light. */
      R(left, y, right - left, 4, p.wallDark);
      R(left, y, right - left, 1, p.ink);
      R(left, y + 4, right - left, 4, p.oak);
      R(left, y + 4, right - left, 1, p.oakHi);
      R(left, y + 8, right - left, 1, p.ink);
      /* Stair runner: narrower than the tread, with gold edging. */
      var rx = left + 14, rw = Math.max(10, right - left - 27);
      R(rx - 1, y + 1, rw + 2, 7, p.ink);
      R(rx, y + 1, rw, 3, p.redDark);
      R(rx, y + 4, rw, 3, p.red);
      R(rx, y + 4, rw, 1, p.redHi);
      R(rx, y + 1, 1, 7, p.gold);
      R(rx + rw - 1, y + 1, 1, 7, p.gold);
    }
    /* Left stringer: one continuous diagonal board, so the flight has an
     * edge instead of dissolving into its own treads. */
    for (var ry = 38; ry <= 148; ry++) {
      var t = Math.max(0, Math.min(1, (ry - 40) / 100));
      var railX = 238 + Math.floor(t * 18);
      R(railX - 2, ry, 4, 1, p.ink);
      R(railX - 1, ry, 2, 1, p.oak);
      R(railX - 1, ry, 1, 1, p.oakHi);
      R(314, ry, 2, 1, p.ink); R(315, ry, 1, 1, p.gold);
      /* Handrail, one board above the stringer. */
      if (ry > 44) {
        R(railX + 5, ry - 16, 3, 1, p.ink);
        R(railX + 6, ry - 16, 1, 1, p.gold);
      }
    }
    for (var post = 0; post < 5; post++) {
      var py = 52 + post * 20, px = 240 + Math.floor(post * 3.6);
      R(px, py - 14, 3, 15, p.ink);
      R(px + 1, py - 13, 1, 13, p.gold);
      R(313, py - 6, 4, 11, p.ink);
      R(314, py - 5, 1, 8, p.gold);
    }
    /* Newel post at the foot of the flight: the one strong silhouette that
     * tells a 1x reader this is a staircase. */
    R(236, 128, 10, 26, p.ink);
    R(237, 129, 8, 24, p.oak);
    R(238, 130, 6, 3, p.oakHi);
    R(238, 136, 6, 1, p.gold);
    R(238, 145, 6, 1, p.gold);
    R(239, 133, 4, 12, p.wallDark);
    R(237, 122, 8, 7, p.ink);
    R(238, 123, 6, 5, p.gold);
    R(239, 124, 4, 3, p.cream);
    R(240, 125, 2, 1, p.light);
    R(236, 146, 84, 7, p.ink); R(238, 147, 78, 3, p.wallLight); R(240, 150, 74, 2, p.wallDark);
    R(278, 146, 36, 5, p.redDark); R(280, 147, 32, 1, p.redHi);
  }
  function chandelier(R) {
    R(158, 0, 3, 12, p.ink); R(159, 2, 1, 10, p.gold); R(155, 11, 11, 3, p.gold);
    R(159, 13, 2, 12, p.wallLight);
    for (var dx = -18; dx <= 18; dx++) {
      var y = 15 + Math.round(7 * (1 - dx * dx / 324));
      R(160 + dx, y, 1, 2, p.gold);
    }
    [[144, 13], [152, 19], [160, 25], [168, 19], [176, 13]].forEach(function (a) {
      R(a[0] - 3, a[1], 7, 9, p.ink); R(a[0] - 2, a[1], 5, 7, p.gold);
      R(a[0] - 1, a[1] + 1, 3, 5, p.cream); R(a[0], a[1] + 2, 1, 3, p.light);
      R(a[0] - 3, a[1] + 7, 7, 1, p.gold);
    });
  }

  function prop(R, d) {
    if (d.id === 'fireplace') fireplace(R);
    else if (d.id === 'chairWest') chair(R, 64, 112, false);
    else if (d.id === 'chairEast') chair(R, 96, 112, true);
    else if (d.id === 'table') table(R);
    else if (d.id === 'luggage') luggage(R);
    else if (d.id === 'reception') reception(R);
    else if (d.id === 'stairs') stairs(R);
  }

  function steppedPool(ctx, cameraX, cameraY, cx, cy, rx, ry, xMin, xMax, yMin, yMax, color, opacity, exclusions, parentAlpha) {
    var oldAlpha = ctx.globalAlpha, oldFill = ctx.fillStyle;
    var camX = Math.round(cameraX || 0), camY = Math.round(cameraY || 0);
    var alpha = parentAlpha == null ? 1 : parentAlpha;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * opacity)); ctx.fillStyle = color;
    for (var dy = -ry; dy <= ry; dy++) {
      var worldY = Math.round(cy) + dy;
      if (worldY < yMin || worldY >= yMax) continue;
      var curve = 1 - (dy * dy) / (ry * ry); if (curve <= 0) continue;
      var half = Math.floor((rx * Math.sqrt(curve)) / 2) * 2;
      if (half < 2) continue;
      var spans = [[Math.max(xMin, Math.round(cx) - half), Math.min(xMax, Math.round(cx) + half + 1)]];
      (exclusions || []).forEach(function (block) {
        var next = [];
        spans.forEach(function (s) {
          if (worldY < block.y || worldY >= block.y + block.h || s[1] <= block.x || s[0] >= block.x + block.w) { next.push(s); return; }
          if (s[0] < block.x) next.push([s[0], Math.min(s[1], block.x)]);
          if (s[1] > block.x + block.w) next.push([Math.max(s[0], block.x + block.w), s[1]]);
        });
        spans = next;
      });
      spans.forEach(function (s) { if (s[1] > s[0]) ctx.fillRect(s[0] - camX, worldY - camY, s[1] - s[0], 1); });
    }
    ctx.globalAlpha = oldAlpha; ctx.fillStyle = oldFill;
  }
  /* AmbientLife owns the clocks. The art layer only reads the current frame
   * and turns it into a clipped receiving-plane pulse, so all animation still
   * comes from the existing fire/chandelier/desk archetypes. A five-frame
   * archetype is treated as quiet -> rise -> full warmth -> settle -> quiet;
   * keeping the pool opacities below .12 preserves the authored grain. */
  function ambientPulse(id) {
    var life = GAME.AmbientLife;
    if (!life || typeof life.snapshot !== 'function') return 0;
    var snap = life.snapshot('hotel_gn'), item = null;
    (snap.items || []).some(function (entry) {
      if (entry.id !== id) return false;
      item = entry; return true;
    });
    if (!item || !item.active) return 0;
    return [0.18, 0.58, 1, 0.44, 0][item.frame] || 0;
  }
  function lightPools(ctx, cameraX, cameraY, parentAlpha) {
    steppedPool(ctx, cameraX, cameraY, 64, 62, 48, 32, 20, 108, 42, 116, p.fire, .07, [{ x: 34, y: 50, w: 58, h: 27 }], parentAlpha);
    steppedPool(ctx, cameraX, cameraY, 64, 62, 30, 22, 24, 104, 45, 111, p.fire, .12, [{ x: 34, y: 50, w: 58, h: 27 }], parentAlpha);
    steppedPool(ctx, cameraX, cameraY, 64, 62, 16, 14, 34, 94, 47, 104, p.gold, .17, [{ x: 34, y: 50, w: 58, h: 27 }], parentAlpha);
    steppedPool(ctx, cameraX, cameraY, 160, 48, 36, 27, 124, 198, 22, 84, p.gold, .05, [], parentAlpha);
    steppedPool(ctx, cameraX, cameraY, 160, 48, 22, 18, 132, 190, 27, 78, p.fire, .11, [], parentAlpha);
    steppedPool(ctx, cameraX, cameraY, 229, 116, 18, 16, 208, 246, 98, 144, p.fire, .06, [], parentAlpha);
    steppedPool(ctx, cameraX, cameraY, 229, 116, 10, 10, 216, 242, 104, 138, p.gold, .13, [], parentAlpha);

    /* Live receiving planes: the broad spans are clipped to the actual lodge
     * surfaces rather than painted as a screen-wide wash. They make the
     * source-to-material relationship legible on the stone sill, red chairs,
     * lounge rug and parquet; the desk pulse stays on the counter/cubbies. */
    var firePulse = ambientPulse('lobby-fire');
    if (firePulse) {
      steppedPool(ctx, cameraX, cameraY, 64, 72, 48, 34, 24, 108, 40, 118, p.fire, .075 * firePulse,
        [{ x: 34, y: 50, w: 58, h: 27 }], parentAlpha);
      steppedPool(ctx, cameraX, cameraY, 68, 101, 40, 25, 42, 118, 82, 132, p.gold, .105 * firePulse, [], parentAlpha);
    }
    var chandelierPulse = ambientPulse('lobby-chandelier');
    if (chandelierPulse) {
      steppedPool(ctx, cameraX, cameraY, 160, 54, 44, 32, 122, 202, 24, 94, p.gold, .065 * chandelierPulse, [], parentAlpha);
      steppedPool(ctx, cameraX, cameraY, 160, 89, 35, 28, 126, 196, 58, 122, p.fire, .055 * chandelierPulse, [], parentAlpha);
    }
    var deskPulse = ambientPulse('lobby-desk-lamp');
    if (deskPulse) {
      steppedPool(ctx, cameraX, cameraY, 229, 119, 24, 22, 204, 252, 98, 148, p.fire, .075 * deskPulse, [], parentAlpha);
      steppedPool(ctx, cameraX, cameraY, 229, 130, 17, 15, 210, 248, 108, 148, p.gold, .105 * deskPulse, [], parentAlpha);
    }
  }

  function draw(ctx, cx, cy) {
    var R = painter(ctx, cx, cy), oldAlpha = ctx.globalAlpha, oldFill = ctx.fillStyle;
    ctx.globalAlpha = 1;
    R(0, 0, W, H, p.ink); floor(R); walls(R);
    fireplace(R); receptionBack(R); stairs(R); luggage(R); reception(R);
    chair(R, 64, 112, false); table(R); chair(R, 96, 112, true); chandelier(R);
    lightPools(ctx, cx, cy, oldAlpha);
    ctx.globalAlpha = oldAlpha; ctx.fillStyle = oldFill;
  }
  function foreground(ctx, cx, cy, min, max) {
    min = min == null ? -Infinity : min; max = max == null ? Infinity : max;
    var R = painter(ctx, cx, cy), oldAlpha = ctx.globalAlpha, oldFill = ctx.fillStyle; ctx.globalAlpha = 1;
    props.forEach(function (d) { if (d.footY >= min && d.footY < max) prop(R, d); });
    ctx.globalAlpha = oldAlpha; ctx.fillStyle = oldFill;
  }
  GAME.HotelGNArt = { draw: draw, foreground: foreground, palette: p, props: props };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.HotelGNArt;
}());
