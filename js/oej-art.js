/* oej-art.js — One Eyed Jacks, native 256x192 authored interior.
 *
 * The map stays the small legible ASCII floor plan in maps.js (16x10, the
 * same shell as the Roadhouse): this module paints its orthographic room in
 * one deterministic pass of integer rectangles — red velvet drapes on every
 * wall, gold trim, a burgundy carpet, four green-felt gaming tables, the long
 * bar counter that fills the C run, and the service cabinet on the east wall.
 *
 * Division of labour follows js/hospital-art.js: the SHELL (walls, drapes,
 * sconces, carpet, light pools, south wall and the door opening) is painted
 * in draw(); every grounded piece of furniture is painted in foreground()
 * keyed by its footprint's south edge, so a body never gets buried by a
 * table it is standing in front of. Cast Presence puts Jacques at 7,5,
 * Audrey at 13,7 and Hawk at 6,8; none of those cells carries furniture.
 */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;

  var palette = {
    ink: '#170e13', black: '#20131a',
    /* Drapes: the perimeter of the room is curtain, not plaster. */
    curtainDeep: '#360f1d', curtainDark: '#4c1524', curtain: '#631d2c',
    curtainMid: '#7d2634', curtainHi: '#9a3440',
    /* Carpet sits one step below the drapes so bodies read against it. */
    carpetDeep: '#2c0f1a', carpetDark: '#3d1422', carpet: '#4a1a28',
    carpetMid: '#57202e', carpetHi: '#652837',
    /* Gold is the only bright value in the room: rails, trim, lamps. */
    goldDeep: '#5e3f14', gold: '#8d6320', goldMid: '#bc8d2c',
    goldHi: '#e5bd5c', goldWhite: '#ffe9a6',
    /* Felt: the one saturated green, and only on the four tables. */
    feltDeep: '#0e2a1a', feltDark: '#17422a', felt: '#215a34',
    feltMid: '#2c7340', feltHi: '#3f8c4d',
    walnutDeep: '#241511', walnutDark: '#3a2119', walnut: '#553122',
    walnutMid: '#6d4029', walnutHi: '#8d5636',
    metalDeep: '#2c2419', metal: '#6b5a39', metalHi: '#b09763',
    bottleGreen: '#1f3a2b', bottleAmber: '#7a4c1c', bottleRed: '#5f1c24',
    glass: '#c9b98d', glassHi: '#f2e6bc',
    chipWhite: '#ddd3c2', chipRed: '#a82f34', chipBlue: '#2c4f74',
    shadow: '#1b0a12', shadowMid: '#130710', shadowDark: '#0d050b'
  };

  /* Grounded furniture. Wall-mounted pieces (drapes, sconces, the mirror,
   * the south doorway) are architecture and stay in draw(). Every footprint
   * below mirrors a solid glyph run in maps.js and is repeated as a
   * fail-fast contract in js/oej-scene.js. */
  var definitions = [
    {id: 'tableNorthWest', cells: [[3,2],[4,2]], bounds: [46,26,36,22], shadow: [48,46,32,4]},
    {id: 'tableNorthEast', cells: [[11,2],[12,2]], bounds: [174,26,36,22], shadow: [176,46,32,4]},
    {id: 'tableSouthWest', cells: [[3,7],[4,7]], bounds: [46,106,36,22], shadow: [48,126,32,4]},
    {id: 'tableSouthEast', cells: [[11,7],[12,7]], bounds: [174,106,36,22], shadow: [176,126,32,4]},
    {id: 'seatNorthWest', cells: [[3,3]], bounds: [48,46,16,20], shadow: [48,64,16,3]},
    {id: 'seatNorthEast', cells: [[12,3]], bounds: [192,46,16,20], shadow: [192,64,16,3]},
    {id: 'seatSouthWest', cells: [[3,6]], bounds: [48,94,16,20], shadow: [48,112,16,3]},
    {id: 'seatSouthEast', cells: [[12,6]], bounds: [192,94,16,20], shadow: [192,112,16,3]},
    {id: 'barCounter', cells: [[5,4],[6,4],[7,4],[8,4],[9,4],[10,4]],
      bounds: [80,44,96,36], shadow: [80,80,96,4]},
    {id: 'serviceCabinet', cells: [[14,2]], bounds: [222,18,18,30], shadow: [222,48,18,3]}
  ];

  /* The south double door (7,9 / 8,9) is walkable: its jamb has no footprint
   * and sorts on this foot line so it covers a body in the threshold. */
  var DOOR_FOOT = 176;

  /* The engine centres this 16x10 map in the 256x192 viewport, so the visible
   * band in map coordinates is y in [-16, 176), not [0, 192). Everything this
   * module paints lives inside it. */
  var VIEW_TOP = -16;
  var VIEW_BOTTOM = 176;

  function southEdge(cells) {
    var row = -1, i;
    for (i = 0; i < cells.length; i++) if (cells[i][1] > row) row = cells[i][1];
    return (row + 1) * TILE;
  }
  definitions.forEach(function (prop) { prop.footY = southEdge(prop.cells); });

  function rectPainter(ctx, cx, cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    return function (x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x - cx, y - cy, w, h);
    };
  }

  /* ------------------------------------------------------------ carpet */

  function drawCarpet(R, p) {
    /* Burgundy field, four close values, plus a sparse gold lattice. The
     * field is deliberately quieter than the drapes: the carpet is the plane
     * every body stands on and must never compete with a silhouette. */
    R(16, 22, 224, 122, p.carpetDeep);
    var row, col, x, y;
    for (row = 0; row < 16; row++) {
      y = 22 + row * 8;
      if (y + 8 > 144) break;
      for (col = 0; col < 28; col++) {
        x = 16 + col * 8;
        R(x, y, 8, 8, ((row + col) & 1) ? p.carpetDark : p.carpet);
      }
    }
    /* A diamond of gold thread every other lattice knot. Two pixels each:
     * enough to read as a pattern at native size, too little to flatten. */
    for (row = 0; row < 8; row++) {
      y = 26 + row * 16;
      if (y + 3 > 142) break;
      for (col = 0; col < 14; col++) {
        x = 20 + col * 16 + ((row & 1) ? 8 : 0);
        if (x + 3 > 238) continue;
        R(x + 1, y, 1, 1, p.goldDeep);
        R(x, y + 1, 3, 1, p.goldDeep);
        R(x + 1, y + 1, 1, 1, p.gold);
        R(x + 1, y + 2, 1, 1, p.goldDeep);
      }
    }
    /* Inset border: a dark moat, then a thin gold cord, then the field. It
     * stops the carpet from bleeding into the drapes. */
    R(16, 22, 224, 2, p.carpetDeep);
    R(16, 142, 224, 2, p.carpetDeep);
    R(16, 22, 2, 122, p.carpetDeep);
    R(238, 22, 2, 122, p.carpetDeep);
    R(20, 26, 216, 1, p.goldDeep);
    R(20, 139, 216, 1, p.goldDeep);
    R(20, 26, 1, 114, p.goldDeep);
    R(235, 26, 1, 114, p.goldDeep);
  }

  /* -------------------------------------------------------- perimeter */

  function drapePanel(R, x, y, w, h, p) {
    /* Vertical velvet folds: a dark trough every 6px with a lit shoulder,
     * broken so the wall never reads as a striped ramp. */
    R(x, y, w, h, p.curtainDark);
    var i, fx;
    for (i = 0; fx = x + i * 6, fx < x + w; i++) {
      R(fx, y, 2, h, p.curtainDeep);
      if (fx + 3 < x + w) R(fx + 3, y, 1, h, p.curtain);
      if (fx + 4 < x + w && (i % 3) !== 2) R(fx + 4, y, 1, h, p.curtainMid);
    }
  }

  function drawNorthWall(R, p) {
    /* The engine centres a 160px-tall map in the 192px viewport, so map rows
     * -1 and 10 are on screen: the painted band runs from y=-16 to y=176.
     * That upper 16px is the ceiling and the top of the drape, which is what
     * gives this room a wall tall enough to read as a room. */
    R(0, VIEW_TOP, 256, 22 - VIEW_TOP, p.ink);
    R(0, VIEW_TOP, 256, 5, p.black);
    R(0, VIEW_TOP + 5, 256, 2, p.walnutDeep);
    R(0, VIEW_TOP + 5, 256, 1, p.walnutMid);
    drapePanel(R, 0, -3, 256, 23, p);
    R(0, -6, 256, 3, p.ink);
    R(0, -6, 256, 2, p.goldDeep);
    R(0, -6, 256, 1, p.gold);
    for (var sx = 4; sx < 256; sx += 16) R(sx, -6, 4, 1, p.goldHi);
    R(0, 20, 256, 2, p.ink);
    /* Swagged head: the drape is gathered under the rod instead of hanging
     * as a flat curtain from the ceiling. */
    for (var gx = 0; gx < 256; gx += 32) {
      R(gx + 2, -3, 12, 2, p.curtainMid);
      R(gx + 6, -1, 8, 2, p.curtainHi);
      R(gx + 18, -3, 12, 2, p.curtain);
      R(gx + 22, -1, 8, 2, p.curtainMid);
    }
    /* Gold-framed mirror over the entry axis; its glass is a dimmer copy of
     * the room's own values, never a bright rectangle. */
    R(104, -2, 48, 21, p.ink);
    R(106, -1, 44, 18, p.goldDeep);
    R(107, 0, 42, 16, p.gold);
    R(108, 1, 40, 14, p.ink);
    R(109, 2, 38, 12, p.curtainDeep);
    R(110, 3, 36, 4, p.curtainDark);
    R(112, 4, 14, 2, p.curtain);
    R(131, 5, 12, 2, p.curtain);
    R(110, 9, 36, 3, p.curtainDeep);
    R(107, 0, 42, 1, p.goldHi);
    R(107, 15, 42, 1, p.goldMid);
    /* Two chandeliers hang in the wall band, clear of every walkable cell. */
    chandelier(R, 48, VIEW_TOP + 1, p);
    chandelier(R, 208, VIEW_TOP + 1, p);
  }

  function chandelier(R, x, y, p) {
    R(x - 1, y, 2, 4, p.metalDeep);
    R(x - 11, y + 4, 22, 2, p.gold);
    R(x - 11, y + 4, 22, 1, p.goldHi);
    R(x - 12, y + 6, 3, 3, p.goldDeep);
    R(x + 9, y + 6, 3, 3, p.goldDeep);
    R(x - 2, y + 6, 4, 3, p.goldDeep);
    var arms = [-11, 0, 10];
    for (var i = 0; i < arms.length; i++) {
      var ax = x + arms[i];
      R(ax, y + 8, 2, 6, p.gold);
      R(ax, y + 9, 1, 4, p.goldHi);
      R(ax - 1, y + 6, 4, 3, p.goldHi);
      R(ax, y + 6, 2, 2, p.goldWhite);
      R(ax - 2, y + 7, 1, 2, p.goldMid);
      R(ax + 3, y + 7, 1, 2, p.goldMid);
      R(ax - 2, y + 14, 6, 1, p.goldMid);
      R(ax - 1, y + 15, 4, 1, p.goldDeep);
    }
    R(x - 9, y + 15, 18, 1, p.goldDeep);
  }

  function drawSideWalls(R, p) {
    R(0, 20, 16, 156, p.ink);
    R(240, 20, 16, 156, p.ink);
    drapePanel(R, 1, 22, 13, 120, p);
    drapePanel(R, 242, 22, 13, 120, p);
    R(14, 22, 2, 120, p.ink);
    R(240, 22, 2, 120, p.ink);
    R(0, 22, 1, 120, p.goldDeep);
    R(255, 22, 1, 120, p.goldDeep);
    sconce(R, 7, 56, p); sconce(R, 7, 110, p);
    sconce(R, 248, 56, p); sconce(R, 248, 110, p);
  }

  function sconce(R, x, y, p) {
    /* A narrow wash on the drape, then the bracket and the lit shade. The
     * earlier version threw 10px horizontal bars that read as glitch dashes
     * across the curtain at native size. */
    R(x - 2, y - 7, 4, 1, p.curtain);
    R(x - 3, y - 6, 6, 2, p.curtainMid);
    R(x - 3, y + 6, 6, 2, p.curtainMid);
    R(x - 2, y + 8, 4, 1, p.curtain);
    R(x - 3, y - 4, 6, 2, p.ink);
    R(x - 2, y - 3, 4, 1, p.goldDeep);
    R(x - 3, y - 2, 6, 1, p.ink);
    R(x - 3, y - 1, 6, 7, p.ink);
    R(x - 2, y - 1, 4, 5, p.gold);
    R(x - 1, y, 2, 3, p.goldHi);
    R(x, y + 1, 1, 1, p.goldWhite);
    R(x - 2, y + 4, 4, 1, p.goldMid);
  }

  function sconcePool(R, wall, y, p) {
    /* Light spilling from a wall sconce: a wedge anchored ON the drape edge
     * that fades outward. Detached horizontal dashes in the middle of the
     * carpet read as debris, not as light. */
    var west = wall === 'west';
    function band(offset, width, tone) {
      R(west ? 16 : 240 - width, y + offset, width, 2, tone);
    }
    /* A quiet base under the whole wedge keeps its steps from reading as
     * separate bars on the carpet field. */
    R(west ? 16 : 232, y - 9, 8, 19, p.carpetDark);
    band(-8, 4, p.carpetMid);
    band(-6, 6, p.carpetMid);
    band(-4, 8, p.carpetHi);
    band(-2, 9, p.carpetHi);
    band(0, 8, p.carpetMid);
    band(2, 6, p.carpetMid);
    band(4, 5, p.carpetMid);
    band(6, 3, p.carpetDark);
  }

  function drawSconcePools(R, p) {
    sconcePool(R, 'west', 58, p);
    sconcePool(R, 'west', 112, p);
    sconcePool(R, 'east', 58, p);
    sconcePool(R, 'east', 112, p);
  }

  /* ------------------------------------------------------- south wall */

  function drawSouthWall(R, p) {
    /* The south face ends at y=176: that is the bottom edge of the viewport
     * once the engine has centred the 160px map. */
    R(0, 144, 256, 32, p.ink);
    drapePanel(R, 0, 148, 256, 28, p);
    R(0, 144, 256, 3, p.ink);
    R(0, 147, 256, 1, p.goldDeep);
    /* Wainscot: gold-trimmed panels along the whole south face, interrupted
     * by the doorway so the exit is the one hole in the drape. */
    for (var x = 6; x + 24 <= 250; x += 30) {
      if (x + 24 > 100 && x < 156) continue;
      R(x, 152, 24, 16, p.walnutDark);
      R(x + 1, 153, 22, 14, p.walnut);
      R(x + 3, 155, 18, 10, p.walnutDeep);
      R(x + 3, 155, 18, 1, p.goldDeep);
      R(x + 3, 164, 18, 1, p.walnutMid);
      R(x, 170, 24, 3, p.walnutDeep);
      R(x + 1, 170, 22, 1, p.goldDeep);
    }
    /* Threshold pool: the lamp over the door reaches three steps onto the
     * carpet and stops on the carpet's dark border. */
    R(118, 136, 20, 2, p.carpetMid);
    R(112, 138, 32, 2, p.carpetHi);
    R(106, 140, 44, 2, p.carpetMid);
    /* The recess the leaves hang in. Without it the door would read as a
     * decal on a flat drape. */
    R(104, 141, 48, 35, p.ink);
    R(107, 144, 42, 32, p.walnutDeep);
    R(109, 146, 38, 28, p.walnutDark);
    R(110, 147, 17, 26, p.walnut);
    R(129, 147, 17, 26, p.walnut);
    R(112, 149, 13, 10, p.curtainDark);
    R(131, 149, 13, 10, p.curtainDark);
    R(113, 150, 11, 8, p.curtain);
    R(132, 150, 11, 8, p.curtain);
    R(112, 161, 13, 10, p.curtainDark);
    R(131, 161, 13, 10, p.curtainDark);
    R(113, 162, 11, 8, p.curtain);
    R(132, 162, 11, 8, p.curtain);
    R(124, 156, 2, 5, p.goldHi);
    R(130, 156, 2, 5, p.goldHi);
  }

  function drawDoorFrame(R, p) {
    /* Foreground jamb: repainted over a body standing in the threshold. */
    R(104, 141, 4, 35, p.ink);
    R(148, 141, 4, 35, p.ink);
    R(105, 142, 2, 33, p.goldDeep);
    R(149, 142, 2, 33, p.goldDeep);
    R(104, 141, 48, 4, p.ink);
    R(106, 142, 44, 2, p.gold);
    R(106, 142, 44, 1, p.goldHi);
    R(127, 141, 2, 35, p.ink);
  }

  /* -------------------------------------------------------- furniture */

  function feltTable(R, x, y, p, wheel) {
    /* 36x22 oval. The rail is deliberately thin: the felt bed is the plane
     * that has to read at native size, and a thick mahogany lid turns the
     * table into a desk. North pair is roulette, south pair is cards. */
    R(x + 10, y, 16, 1, p.ink);
    R(x + 6, y + 1, 24, 1, p.ink);
    R(x + 2, y + 2, 32, 1, p.ink);
    R(x, y + 3, 36, 16, p.ink);
    R(x + 2, y + 19, 32, 1, p.ink);
    R(x + 6, y + 20, 24, 1, p.ink);
    R(x + 10, y + 21, 16, 1, p.ink);
    R(x + 10, y + 1, 16, 1, p.walnutHi);
    R(x + 6, y + 2, 24, 1, p.walnutMid);
    R(x + 2, y + 3, 32, 1, p.walnutMid);
    R(x + 1, y + 4, 34, 1, p.walnut);
    R(x + 1, y + 5, 2, 11, p.walnut);
    R(x + 33, y + 5, 2, 11, p.walnut);
    R(x + 2, y + 16, 32, 2, p.walnutDark);
    R(x + 6, y + 18, 24, 1, p.walnutDeep);
    R(x + 10, y + 19, 16, 1, p.walnutDeep);
    R(x + 3, y + 4, 30, 13, p.feltDeep);
    R(x + 4, y + 5, 28, 11, p.feltDark);
    R(x + 5, y + 5, 26, 8, p.felt);
    R(x + 7, y + 6, 22, 4, p.feltMid);
    R(x + 10, y + 6, 14, 2, p.feltHi);
    R(x + 5, y + 14, 26, 1, p.feltDeep);
    if (wheel) {
      roulette(R, x + 11, y + 10, p);
      chipStack(R, x + 21, y + 8, p.chipRed, p);
      chipStack(R, x + 26, y + 9, p.chipWhite, p);
      R(x + 20, y + 13, 9, 1, p.goldDeep);
    } else {
      /* Dealt hand: two face-up cards, the dealer's arc, three stacks. */
      R(x + 6, y + 8, 5, 6, p.ink);
      R(x + 7, y + 9, 3, 4, p.chipWhite);
      R(x + 8, y + 10, 1, 2, p.chipRed);
      R(x + 12, y + 8, 5, 6, p.ink);
      R(x + 13, y + 9, 3, 4, p.chipWhite);
      R(x + 14, y + 10, 1, 2, p.ink);
      R(x + 6, y + 6, 24, 1, p.goldDeep);
      R(x + 8, y + 5, 20, 1, p.gold);
      chipStack(R, x + 20, y + 9, p.chipRed, p);
      chipStack(R, x + 25, y + 8, p.chipBlue, p);
      chipStack(R, x + 25, y + 12, p.chipWhite, p);
    }
  }

  function roulette(R, cx, cy, p) {
    /* A wheel, not a box: stepped round rim, alternating pockets, gold hub. */
    R(cx - 3, cy - 4, 6, 1, p.ink);
    R(cx - 5, cy - 3, 10, 1, p.ink);
    R(cx - 6, cy - 2, 12, 5, p.ink);
    R(cx - 5, cy + 3, 10, 1, p.ink);
    R(cx - 3, cy + 4, 6, 1, p.ink);
    R(cx - 3, cy - 3, 6, 1, p.goldDeep);
    R(cx - 5, cy - 2, 10, 1, p.walnutDeep);
    R(cx - 5, cy - 1, 10, 3, p.black);
    R(cx - 5, cy + 2, 10, 1, p.goldDeep);
    R(cx - 4, cy - 1, 2, 1, p.chipRed);
    R(cx, cy - 1, 2, 1, p.chipRed);
    R(cx - 2, cy + 1, 2, 1, p.chipRed);
    R(cx + 2, cy + 1, 2, 1, p.chipRed);
    R(cx - 1, cy, 2, 1, p.goldMid);
    R(cx - 1, cy, 1, 1, p.goldWhite);
  }

  function chipStack(R, x, y, color, p) {
    R(x, y, 4, 4, p.ink);
    R(x + 1, y + 1, 2, 3, color);
    R(x + 1, y + 1, 2, 1, p.chipWhite);
    R(x + 1, y + 3, 2, 1, p.shadowMid);
  }

  function seat(R, x, y, p) {
    /* Velvet stool: gold-studded seat band, dark turned legs, hard contact. */
    R(x + 2, y, 12, 2, p.ink);
    R(x + 1, y + 2, 14, 9, p.ink);
    R(x + 2, y + 2, 12, 7, p.curtainDark);
    R(x + 3, y + 3, 10, 4, p.curtain);
    R(x + 4, y + 3, 8, 2, p.curtainMid);
    R(x + 5, y + 3, 5, 1, p.curtainHi);
    R(x + 2, y + 9, 12, 2, p.goldDeep);
    R(x + 3, y + 9, 10, 1, p.gold);
    R(x + 2, y + 11, 3, 7, p.walnutDark);
    R(x + 11, y + 11, 3, 7, p.walnutDark);
    R(x + 3, y + 11, 1, 5, p.walnutMid);
    R(x + 12, y + 11, 1, 5, p.walnutMid);
    R(x + 2, y + 17, 3, 2, p.ink);
    R(x + 11, y + 17, 3, 2, p.ink);
  }

  function bottle(R, x, y, color, p, tall) {
    var h = tall ? 9 : 7;
    R(x + 1, y, 2, 2, p.ink);
    R(x, y + 2, 4, h, p.ink);
    R(x + 1, y + 3, 2, h - 2, color);
    R(x + 1, y + 3, 1, h - 4, p.glass);
    R(x, y + h + 1, 4, 1, p.goldDeep);
  }

  function barCounter(R, p) {
    /* The C run, 96px of bar, built back to front: a dark mirrored back bar,
     * the shelf plank the bottles actually stand on, the counter top with its
     * gold nosing, the padded front and the brass footrail. Everything above
     * the top edge legitimately occludes a body standing on the north side. */
    R(80, 44, 96, 2, p.ink);
    R(81, 46, 94, 1, p.goldDeep);
    R(81, 47, 94, 11, p.walnutDeep);
    R(83, 47, 90, 9, p.black);
    var i;
    for (i = 0; i < 7; i++) R(86 + i * 13, 47, 2, 9, p.walnutDark);
    var colors = [p.bottleGreen, p.bottleAmber, p.bottleRed, p.bottleGreen, p.bottleAmber];
    for (i = 0; i < 12; i++) {
      var tall = i % 3 === 0;
      bottle(R, 85 + i * 7, tall ? 47 : 49, colors[i % colors.length], p, tall);
    }
    barLamp(R, 96, 44, p);
    barLamp(R, 160, 44, p);
    R(80, 58, 96, 2, p.ink);
    R(81, 58, 94, 2, p.walnut);
    R(81, 58, 94, 1, p.walnutHi);
    R(80, 60, 96, 2, p.ink);
    R(81, 62, 94, 4, p.walnutMid);
    R(81, 62, 94, 1, p.walnutHi);
    R(92, 63, 16, 2, p.goldDeep);
    R(150, 63, 16, 2, p.goldDeep);
    R(81, 66, 94, 2, p.goldDeep);
    R(81, 66, 94, 1, p.goldMid);
    R(82, 67, 92, 1, p.gold);
    R(80, 68, 96, 10, p.ink);
    R(81, 69, 94, 8, p.walnutDark);
    for (i = 0; i < 6; i++) {
      var px = 84 + i * 15;
      R(px, 70, 11, 6, p.curtainDeep);
      R(px + 1, 70, 9, 4, p.curtainDark);
      R(px + 2, 70, 7, 2, p.curtain);
      R(px, 69, 11, 1, p.goldDeep);
      R(px + 5, 72, 1, 1, p.goldMid);
    }
    R(80, 77, 96, 2, p.metalDeep);
    R(81, 77, 94, 1, p.metalHi);
    R(80, 79, 96, 1, p.ink);
    /* Glasses left standing on the bar top. */
    R(114, 62, 3, 4, p.glass);
    R(114, 62, 3, 1, p.glassHi);
    R(136, 62, 3, 4, p.glass);
    R(136, 62, 3, 1, p.glassHi);
  }

  function barLamp(R, x, y, p) {
    R(x - 5, y + 1, 10, 2, p.ink);
    R(x - 4, y + 2, 8, 2, p.goldDeep);
    R(x - 3, y + 2, 6, 1, p.goldMid);
    R(x - 4, y + 4, 8, 3, p.goldHi);
    R(x - 2, y + 4, 4, 2, p.goldWhite);
    R(x - 1, y + 7, 2, 4, p.goldDeep);
    R(x - 3, y + 11, 6, 1, p.gold);
    R(x - 6, y + 12, 12, 1, p.goldDeep);
  }

  function serviceCabinet(R, p) {
    /* Tall service cabinet against the east drape, 18x30 at 14,2. */
    R(222, 18, 18, 30, p.ink);
    R(223, 19, 16, 3, p.walnutMid);
    R(223, 19, 16, 1, p.goldDeep);
    R(223, 22, 16, 24, p.walnutDark);
    R(224, 23, 6, 10, p.walnutDeep);
    R(232, 23, 6, 10, p.walnutDeep);
    R(224, 34, 6, 10, p.walnutDeep);
    R(232, 34, 6, 10, p.walnutDeep);
    R(224, 23, 6, 1, p.walnut);
    R(232, 23, 6, 1, p.walnut);
    R(224, 34, 6, 1, p.walnut);
    R(232, 34, 6, 1, p.walnut);
    R(230, 27, 1, 3, p.goldHi);
    R(231, 27, 1, 3, p.goldMid);
    R(230, 38, 1, 3, p.goldHi);
    R(231, 38, 1, 3, p.goldMid);
    R(223, 46, 16, 2, p.walnutDeep);
    R(223, 46, 16, 1, p.goldDeep);
  }

  function drawProp(R, prop, p) {
    var b = prop.bounds;
    if (prop.id === 'barCounter') barCounter(R, p);
    else if (prop.id === 'serviceCabinet') serviceCabinet(R, p);
    else if (prop.id.indexOf('table') === 0) {
      feltTable(R, b[0], b[1], p, prop.cells[0][1] === 2);
    } else if (prop.id.indexOf('seat') === 0) seat(R, b[0], b[1], p);
  }

  function drawShadow(R, prop, p) {
    var s = prop.shadow;
    R(s[0], s[1], s[2], s[3], p.shadow);
    R(s[0] + 2, s[1] + 1, s[2] - 4, s[3] - 1, p.shadowMid);
  }

  function drawPlayerContact(R, p) {
    var E = GAME.Engine, state = E && E.state, player = state && state.player;
    if (!state || state.mapId !== 'oej' || !player ||
        !Number.isFinite(player.x) || !Number.isFinite(player.y)) return;
    var x = Math.round(player.x), y = Math.round(player.y);
    R(x + 3, y + 15, 10, 2, p.shadowMid);
    R(x + 4, y + 17, 8, 1, p.shadowDark);
  }

  function draw(ctx, cx, cy) {
    var R = rectPainter(ctx, cx, cy), p = palette, i;
    R(0, VIEW_TOP, 256, VIEW_BOTTOM - VIEW_TOP, p.ink);
    drawCarpet(R, p);
    drawNorthWall(R, p);
    drawSideWalls(R, p);
    drawSconcePools(R, p);
    drawSouthWall(R, p);
    for (i = 0; i < definitions.length; i++) drawShadow(R, definitions[i], p);
    drawPlayerContact(R, p);
    for (i = 0; i < definitions.length; i++) drawProp(R, definitions[i], p);
  }

  /* The engine passes actor-foot intervals: repaint only the furniture whose
   * own foot line falls inside, so a body in front of a table stays in
   * front of it and a body behind the bar is occluded by it. */
  function foreground(ctx, cx, cy, minFoot, maxFoot) {
    minFoot = minFoot == null ? -Infinity : minFoot;
    maxFoot = maxFoot == null ? Infinity : maxFoot;
    var R = rectPainter(ctx, cx, cy), p = palette, i, prop;
    for (i = 0; i < definitions.length; i++) {
      prop = definitions[i];
      if (prop.footY < minFoot || prop.footY >= maxFoot) continue;
      drawProp(R, prop, p);
    }
    if (DOOR_FOOT >= minFoot && DOOR_FOOT < maxFoot) drawDoorFrame(R, p);
  }

  GAME.OejArt = {
    draw: draw,
    foreground: foreground,
    definitions: definitions,
    props: definitions,
    palette: palette,
    doorFoot: DOOR_FOOT,
    viewTop: VIEW_TOP,
    viewBottom: VIEW_BOTTOM
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.OejArt;
})();
