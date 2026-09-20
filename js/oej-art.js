/* oej-art.js — One Eyed Jacks, native 256x192 authored interior.
 *
 * The map stays the small legible ASCII floor plan in maps.js (16x10, the
 * same shell as the Roadhouse): this module paints its orthographic room in
 * one deterministic pass of integer rectangles — red velvet drapes on every
 * wall, gold trim, a burgundy carpet, four green-felt gaming tables, the long
 * bar counter that fills the C run, and the service cabinet on the east wall.
 *
 * The map-row pass of 2026-09-20 retired the mirrored 2x2 corner grid that two
 * fresh critics both read as a tilemap test. The tables now differ in width as
 * well as in game (a three-cell craps table along the north drape, a two-cell
 * blackjack table beside it, a three-cell roulette on the centre carpet, a
 * two-cell poker oval south-east), three of them carry a seated patron, and
 * the south-west corner is left as walking room.
 *
 * Division of labour follows js/hospital-art.js: the SHELL (walls, drapes,
 * sconces, carpet, light pools, south wall and the door opening) is painted
 * in draw(); every grounded piece of furniture is painted in foreground()
 * keyed by its footprint's south edge, so a body never gets buried by a
 * table it is standing in front of. Cast Presence puts Jacques at 7,5,
 * Audrey at 13,7 and Hawk at 6,8; none of those cells carries furniture.
 * Each patron sits one cell NORTH of their table, so the cloth sorts after
 * them and cuts them below the chest, and the cell above every patron is
 * itself solid, so the head that overhangs it can never cover a body.
 */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;

  var palette = {
    ink: '#170e13', black: '#20131a', eye: '#342c2b',
    /* Drapes: the perimeter of the room is curtain, not plaster. */
    curtainDeep: '#360f1d', curtainDark: '#4c1524', curtain: '#631d2c',
    curtainMid: '#7d2634', curtainHi: '#9a3440',
    /* Carpet is a full value step below the drapes and less saturated. The
     * round-2 carpet sat within two luma of the curtain and in the same hue,
     * so floor and wall merged and the room had no horizon. */
    carpetDeep: '#1d0d16', carpetDark: '#28121c', carpet: '#311723',
    carpetMid: '#3b1d29', carpetHi: '#472532', carpetGlow: '#512c3a',
    /* The skirting that separates them. */
    skirtDeep: '#1a0f0c', skirt: '#4a2c1c', skirtHi: '#7a4a2a',
    /* Gold is the only bright value in the room: rails, trim, lamps. */
    goldDeep: '#5e3f14', gold: '#8d6320', goldMid: '#bc8d2c',
    goldHi: '#e5bd5c', goldWhite: '#ffe9a6',
    /* Felt: the one saturated green, and only on the four tables. */
    feltDeep: '#0e2a1a', feltDark: '#17422a', felt: '#215a34',
    feltMid: '#2c7340', feltHi: '#3f8c4d',
    /* Stools carry their own crimson so a chair never reads as a small
     * table: the tables are mahogany + felt, the stools are leather + brass. */
    stoolDeep: '#5e1626', stoolDark: '#7c2030', stool: '#9c2f3c',
    stoolHi: '#bd4a4a',
    walnutDeep: '#241511', walnutDark: '#3a2119', walnut: '#553122',
    walnutMid: '#6d4029', walnutHi: '#8d5636',
    metalDeep: '#2c2419', metal: '#6b5a39', metalHi: '#b09763',
    bottleGreen: '#1f3a2b', bottleAmber: '#7a4c1c', bottleRed: '#5f1c24',
    bottleClear: '#6d7a68',
    glass: '#c9b98d', glassHi: '#f2e6bc',
    chipWhite: '#ddd3c2', chipRed: '#a82f34', chipBlue: '#2c4f74',
    pocketDark: '#120a10', pocketRed: '#8f2630',
    shadow: '#1b0a12', shadowMid: '#130710', shadowDark: '#0d050b'
  };

  /* Grounded furniture. Wall-mounted pieces (drapes, sconces, the mirror,
   * the south doorway) are architecture and stay in draw(). Every footprint
   * below mirrors a solid glyph run in maps.js and is repeated as a
   * fail-fast contract in js/oej-scene.js. */
  var definitions = [
    /* Bounds never cross into a neighbouring cell: Audrey stands at 13,7,
     * immediately east of the south-east table, and a 2px rail overhang was
     * enough to repaint over the left edge of her sprite. */
    /* Order matters: a patron is listed BEFORE the table they sit at, so
     * within one depth band the cloth is painted over their lap exactly the
     * way the diner's booth table cuts its guest below the chest. */
    {id: 'guestCraps', cells: [[3,1]], bounds: [48,9,16,20], shadow: [48,27,16,3], guest: 'dealerWatcher'},
    {id: 'guestBlackjack', cells: [[11,1]], bounds: [176,9,16,20], shadow: [176,27,16,3], guest: 'cardPlayer'},
    {id: 'tableCraps', cells: [[2,2],[3,2],[4,2]], bounds: [32,26,48,22], shadow: [32,46,48,4], game: 'craps'},
    {id: 'tableBlackjack', cells: [[10,2],[11,2]], bounds: [160,26,32,22], shadow: [160,46,32,4], game: 'blackjack'},
    {id: 'serviceCabinet', cells: [[14,2]], bounds: [224,18,16,30], shadow: [224,48,16,3]},
    {id: 'barCounter', cells: [[5,4],[6,4],[7,4],[8,4],[9,4],[10,4]],
      bounds: [80,44,96,36], shadow: [80,80,96,4]},
    {id: 'guestRoulette', cells: [[5,5]], bounds: [80,73,16,20], shadow: [80,91,16,3], guest: 'wheelPlayer'},
    {id: 'tableRoulette', cells: [[4,6],[5,6],[6,6]], bounds: [64,90,48,22], shadow: [64,110,48,4], game: 'roulette'},
    {id: 'tablePoker', cells: [[9,7],[10,7]], bounds: [144,106,32,22], shadow: [144,126,32,4], game: 'poker'},
    {id: 'stoolPoker', cells: [[11,7]], bounds: [176,110,16,20], shadow: [176,128,16,3], seatVariant: 1}
  ];

  /* Three patrons, three different heads and coats. `mirror` turns the pose
   * so two neighbours never read as the same decal. */
  var guests = {
    dealerWatcher: {hair: '#2b1a16', hairHi: '#4d3024', skin: '#e0b48e', skinHi: '#f0c9a1',
      skinShadow: '#bd876c', coat: '#2d3550', coatHi: '#454f72', coatShadow: '#1b2136',
      shirt: '#e9ddbb', bob: false, mirror: false},
    cardPlayer: {hair: '#4a2c18', hairHi: '#89644d', skin: '#caa07c', skinHi: '#e3bd97',
      skinShadow: '#a06f57', coat: '#57202b', coatHi: '#7a3340', coatShadow: '#37141c',
      shirt: '#ded3ae', bob: true, mirror: true},
    wheelPlayer: {hair: '#171314', hairHi: '#3b3033', skin: '#8f6244', skinHi: '#ab7a56',
      skinShadow: '#6b4630', coat: '#3f3a2c', coatHi: '#5d5641', coatShadow: '#272419',
      shirt: '#d9cfae', bob: false, mirror: true}
  };

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
    /* A coarse carpet, not a tile test: 16px blocks in two close values, a
     * wide plain border inside a gold cord, and a medallion motif every
     * other block. The field scale is deliberately twice the tile so it
     * never lines up with the furniture grid. */
    R(16, 22, 224, 122, p.carpetDeep);
    var row, col, x, y;
    for (row = 0; row < 8; row++) {
      y = 30 + row * 16;
      if (y + 16 > 138) break;
      for (col = 0; col < 13; col++) {
        x = 24 + col * 16;
        if (x + 16 > 232) break;
        R(x, y, 16, 16, ((row + col) & 1) ? p.carpetDark : p.carpet);
      }
    }
    /* One medallion per second block, four pixels of gold thread. */
    for (row = 0; row < 8; row++) {
      y = 36 + row * 32;
      if (y + 5 > 134) break;
      for (col = 0; col < 7; col++) {
        x = 30 + col * 32 + ((row & 1) ? 16 : 0);
        if (x + 5 > 230) continue;
        R(x + 2, y, 1, 1, p.goldDeep);
        R(x + 1, y + 1, 3, 1, p.goldDeep);
        R(x, y + 2, 5, 1, p.goldDeep);
        R(x + 2, y + 2, 1, 1, p.gold);
        R(x + 1, y + 3, 3, 1, p.goldDeep);
        R(x + 2, y + 4, 1, 1, p.goldDeep);
      }
    }
    /* Plain border band, then the gold cord. */
    R(16, 22, 224, 8, p.carpetDark);
    R(16, 136, 224, 8, p.carpetDark);
    R(16, 22, 8, 122, p.carpetDark);
    R(232, 22, 8, 122, p.carpetDark);
    R(20, 26, 216, 1, p.goldDeep);
    R(20, 139, 216, 1, p.goldDeep);
    R(20, 26, 1, 114, p.goldDeep);
    R(235, 26, 1, 114, p.goldDeep);
  }

  function drawSkirting(R, p) {
    /* The horizon. A hard three-value skirting board along the foot of every
     * drape: without it the curtain and the carpet meet as two reds and the
     * room reads flat. Painted after the carpet, before the furniture. */
    R(0, 20, 256, 2, p.ink);
    R(0, 22, 256, 3, p.skirtDeep);
    R(0, 22, 256, 1, p.skirtHi);
    R(0, 23, 256, 1, p.skirt);
    R(14, 22, 4, 122, p.skirtDeep);
    R(14, 22, 1, 122, p.skirtHi);
    R(15, 22, 1, 122, p.skirt);
    R(238, 22, 4, 122, p.skirtDeep);
    R(241, 22, 1, 122, p.skirtHi);
    R(240, 22, 1, 122, p.skirt);
    R(0, 140, 256, 4, p.skirtDeep);
    R(0, 140, 256, 1, p.skirtHi);
    R(0, 141, 256, 1, p.skirt);
    R(0, 144, 256, 1, p.ink);
  }

  /* -------------------------------------------------------- perimeter */

  function drapePanel(R, x, y, w, h, p) {
    /* Vertical velvet folds: a dark trough every 6px with a lit shoulder,
     * broken so the wall never reads as a striped ramp. */
    R(x, y, w, h, p.curtainDark);
    var i, fx;
    for (i = 0; fx = x + i * 8, fx < x + w; i++) {
      R(fx, y, 2, h, p.curtainDeep);
      if (fx + 4 < x + w) R(fx + 4, y, 1, h, p.curtain);
      if (fx + 5 < x + w && (i % 3) === 0) R(fx + 5, y, 1, h, p.curtainMid);
    }
  }


  /* 3x5 sign type. Only the letters the house name needs. */
  var SIGN_FONT = {
    'O': ['111','101','101','101','111'],
    'N': ['101','111','111','101','101'],
    'E': ['111','100','110','100','111'],
    'Y': ['101','101','010','010','010'],
    'D': ['110','101','101','101','110'],
    'J': ['001','001','001','101','010'],
    'A': ['010','101','111','101','101'],
    'C': ['011','100','100','100','011'],
    'K': ['101','110','100','110','101'],
    'S': ['011','100','010','001','110'],
    ' ': ['000','000','000','000','000']
  };

  function signWord(R, text, x, y, p) {
    for (var i = 0; i < text.length; i++) {
      var rows = SIGN_FONT[text.charAt(i)];
      if (!rows) continue;
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 3; c++) {
          if (rows[r].charAt(c) !== '1') continue;
          R(x + i * 4 + c, y + r + 1, 1, 1, p.goldDeep);
          R(x + i * 4 + c, y + r, 1, 1, p.goldWhite);
        }
      }
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
    /* The house sign over the entry axis. Round 2 left an empty gold frame
     * here, which a fresh critic read as a blank panel. It carries the name
     * now: two lines of 3x5 type in lit bulbs over a dark board, which at 1x
     * reads as two bright bars of lettering and at 3x reads as the words. */
    R(104, -2, 48, 21, p.ink);
    R(105, -1, 46, 19, p.goldDeep);
    R(106, 0, 44, 17, p.gold);
    R(107, 0, 42, 1, p.goldHi);
    R(107, 16, 42, 1, p.goldMid);
    R(108, 1, 40, 15, p.ink);
    R(109, 2, 38, 13, p.curtainDeep);
    signWord(R, 'ONE EYED', 112, 3, p);
    signWord(R, 'JACKS', 118, 10, p);
    /* Frame bulbs. */
    for (var bx = 108; bx <= 144; bx += 8) {
      R(bx, -1, 2, 1, p.goldWhite);
      R(bx + 2, 17, 2, 1, p.goldWhite);
    }
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
    sconce(R, 7, 82, p); sconce(R, 248, 82, p);
  }

  function sconce(R, x, y, p) {
    /* One big bracket lamp per side wall instead of two small ones. The
     * round-2 sconces were seven pixels of gold on a dark drape and a fresh
     * critic read them as undifferentiated dots at 1x; this is a 13x18
     * silhouette with a dark shade cap and a lit cone under it. */
    R(x - 1, y - 10, 2, 4, p.ink);
    R(x - 2, y - 9, 4, 1, p.walnutMid);
    R(x - 6, y - 6, 12, 2, p.ink);
    R(x - 5, y - 6, 10, 1, p.walnutMid);
    R(x - 7, y - 4, 14, 5, p.ink);
    R(x - 6, y - 4, 12, 4, p.goldDeep);
    R(x - 5, y - 4, 10, 2, p.gold);
    R(x - 4, y - 4, 8, 1, p.goldMid);
    R(x - 6, y + 1, 12, 2, p.ink);
    R(x - 5, y + 1, 10, 1, p.goldHi);
    R(x - 4, y + 2, 8, 1, p.goldWhite);
    R(x - 4, y + 3, 8, 4, p.ink);
    R(x - 3, y + 3, 6, 3, p.goldMid);
    R(x - 2, y + 3, 4, 2, p.goldHi);
    R(x - 1, y + 4, 2, 1, p.goldWhite);
    R(x - 3, y + 7, 6, 2, p.ink);
    R(x - 2, y + 7, 4, 1, p.goldDeep);
  }

  function halfPool(R, west, cy, w, h, color) {
    /* Half of the town light grammar (interiorWarmLight / interiorPool in
     * js/retro-authored.js): a stepped ellipse whose inset grows with the
     * square of the distance from its centre line. Halved and anchored on
     * the drape, because this light comes off a wall, not a pendant.
     * Flat opaque values, not alpha: this module paints solid rectangles. */
    for (var row = 0; row < h; row += 2) {
      var edge = Math.abs((row + 1) / h * 2 - 1);
      var len = Math.round(w * (1 - 0.82 * edge * edge));
      if (len < 1) continue;
      R(west ? 16 : 240 - len, cy - (h >> 1) + row, len, 2, color);
    }
  }

  function sconcePool(R, wall, cy, p) {
    /* Three nested steps, each shorter and one value warmer. Nothing squares
     * off the edge: the previous version drew stacked bars with a base rect
     * behind them and read as a wedge cut out of the carpet. */
    var west = wall === 'west';
    halfPool(R, west, cy, 15, 34, p.carpet);
    halfPool(R, west, cy, 11, 26, p.carpetMid);
    halfPool(R, west, cy, 7, 16, p.carpetHi);
  }

  function drawSconcePools(R, p) {
    sconcePool(R, 'west', 84, p);
    sconcePool(R, 'east', 84, p);
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
    /* The recess the leaves hang in. It starts at y=144, the top of the door
     * row, and spans only the two door cells plus a 4px surround: anything
     * wider or taller repaints over a body standing north or west of the
     * threshold (Hawk stands at 6,8, right beside it).
     * Without this recess the door would read as a decal on a flat drape. */
    R(108, 144, 40, 32, p.ink);
    R(110, 146, 36, 30, p.walnutDeep);
    R(112, 148, 32, 28, p.walnutDark);
    R(113, 149, 14, 26, p.walnut);
    R(129, 149, 14, 26, p.walnut);
    R(115, 151, 10, 10, p.curtainDark);
    R(131, 151, 10, 10, p.curtainDark);
    R(116, 152, 8, 8, p.curtain);
    R(132, 152, 8, 8, p.curtain);
    R(115, 163, 10, 10, p.curtainDark);
    R(131, 163, 10, 10, p.curtainDark);
    R(116, 164, 8, 8, p.curtain);
    R(132, 164, 8, 8, p.curtain);
    R(124, 158, 2, 5, p.goldHi);
    R(130, 158, 2, 5, p.goldHi);
  }

  function drawDoorFrame(R, p) {
    /* Foreground jamb: repainted over a body standing in the threshold, and
     * only there. Both posts sit inside the two door cells (112..144). */
    R(112, 144, 4, 32, p.ink);
    R(140, 144, 4, 32, p.ink);
    R(113, 145, 2, 30, p.goldDeep);
    R(141, 145, 2, 30, p.goldDeep);
    R(112, 144, 32, 4, p.ink);
    R(113, 145, 30, 2, p.gold);
    R(113, 145, 30, 1, p.goldHi);
    R(127, 144, 2, 32, p.ink);
  }

  /* -------------------------------------------------------- furniture */

  /* Four tables, four games. They sit on the cells the map rows give them,
   * but nothing else about them is shared: the rail profile, the felt
   * markings, the layout's long axis and the objects on the cloth all differ,
   * so the room stops reading as one sprite stamped four times. */
  function feltTable(R, x, y, w, p, kind) {
    var padded = kind === 'craps', oval = kind === 'poker';
    /* Silhouette. The craps table is a squarer padded box, the poker table a
     * rounder oval, the two card/wheel tables the standard rail. The width
     * comes from the footprint, so a three-cell table is genuinely longer
     * rather than the same 32px sprite moved along the row. */
    if (padded) {
      R(x + 3, y, w - 6, 1, p.ink);
      R(x, y + 1, w, 20, p.ink);
      R(x + 3, y + 21, w - 6, 1, p.ink);
    } else if (oval) {
      R(x + 10, y, w - 20, 1, p.ink);
      R(x + 5, y + 1, w - 10, 1, p.ink);
      R(x + 2, y + 2, w - 4, 1, p.ink);
      R(x, y + 3, w, 16, p.ink);
      R(x + 2, y + 19, w - 4, 1, p.ink);
      R(x + 5, y + 20, w - 10, 1, p.ink);
      R(x + 10, y + 21, w - 20, 1, p.ink);
    } else {
      R(x + 8, y, w - 16, 1, p.ink);
      R(x + 4, y + 1, w - 8, 1, p.ink);
      R(x + 1, y + 2, w - 2, 1, p.ink);
      R(x, y + 3, w, 16, p.ink);
      R(x + 1, y + 19, w - 2, 1, p.ink);
      R(x + 4, y + 20, w - 8, 1, p.ink);
      R(x + 8, y + 21, w - 16, 1, p.ink);
    }
    /* Rail. Craps gets a padded leather top edge, poker a narrow armrest,
     * the others plain mahogany. */
    if (padded) {
      R(x + 1, y + 1, w - 2, 3, p.stoolDark);
      R(x + 2, y + 1, w - 4, 1, p.stool);
      R(x + 1, y + 17, w - 2, 3, p.stoolDeep);
      R(x + 2, y + 19, w - 4, 1, p.walnutDeep);
      R(x + 1, y + 4, 2, 13, p.walnut);
      R(x + w - 3, y + 4, 2, 13, p.walnut);
    } else if (oval) {
      R(x + 10, y + 1, w - 20, 1, p.walnutHi);
      R(x + 5, y + 2, w - 10, 1, p.walnutMid);
      R(x + 2, y + 3, w - 4, 2, p.walnut);
      R(x + 1, y + 5, 2, 11, p.walnutMid);
      R(x + w - 3, y + 5, 2, 11, p.walnutMid);
      R(x + 2, y + 16, w - 4, 2, p.walnutDark);
      R(x + 5, y + 18, w - 10, 1, p.walnutDeep);
      R(x + 10, y + 19, w - 20, 1, p.walnutDeep);
    } else {
      R(x + 8, y + 1, w - 16, 1, p.walnutHi);
      R(x + 4, y + 2, w - 8, 1, p.walnutMid);
      R(x + 1, y + 3, w - 2, 1, p.walnutMid);
      R(x + 1, y + 4, w - 2, 1, p.walnut);
      R(x + 1, y + 5, 2, 11, p.walnut);
      R(x + w - 3, y + 5, 2, 11, p.walnut);
      R(x + 2, y + 16, w - 4, 2, p.walnutDark);
      R(x + 4, y + 18, w - 8, 1, p.walnutDeep);
      R(x + 8, y + 19, w - 16, 1, p.walnutDeep);
    }
    /* Felt bed. */
    var bx = x + 3, by = y + 4, bw = w - 6, bh = 13;
    R(bx, by, bw, bh, p.feltDeep);
    R(bx + 1, by + 1, bw - 2, bh - 2, p.feltDark);
    R(bx + 2, by + 1, bw - 4, bh - 6, p.felt);
    if (!padded) R(bx + 4, by + 2, bw - 8, 4, p.feltMid);
    if (oval) R(bx + 6, by + 2, bw - 12, 2, p.feltHi);
    if (kind === 'roulette') R(bx + 6, by + 2, 12, 2, p.feltHi);
    R(bx + 2, by + 10, bw - 4, 1, p.feltDeep);
    if (kind === 'roulette') layoutRoulette(R, x, y, w, p);
    else if (kind === 'blackjack') layoutBlackjack(R, x, y, w, p);
    else if (kind === 'craps') layoutCraps(R, x, y, w, p);
    else layoutPoker(R, x, y, w, p);
  }

  /* Roulette: the wheel sits at the WEST end, the numbered layout runs east
   * of it as columns of gold boxes with a red/black column beside them. On
   * the three-cell centre table the grid has room for six columns. */
  function layoutRoulette(R, x, y, w, p) {
    roulette(R, x + 11, y + 10, p);
    var cols = Math.max(3, Math.floor((w - 26) / 3)), col;
    for (col = 0; col < cols; col++) {
      R(x + 20 + col * 3, y + 6, 2, 8, p.feltDeep);
      R(x + 20 + col * 3, y + 6, 2, 1, p.goldDeep);
      R(x + 20 + col * 3, y + 9, 2, 1, p.goldDeep);
      R(x + 20 + col * 3, y + 12, 2, 1, p.goldDeep);
    }
    R(x + 20, y + 14, cols * 3 - 1, 1, p.gold);
    chipStack(R, x + w - 9, y + 7, p.chipRed, p);
    chipStack(R, x + w - 14, y + 11, p.chipBlue, p);
    R(x + w - 8, y + 12, 2, 1, p.pocketRed);
    R(x + w - 5, y + 12, 2, 1, p.pocketDark);
  }

  /* Blackjack: dealer's shoe at the EAST end, a gold bet arc swinging west,
   * three bet circles and one dealt hand. */
  function layoutBlackjack(R, x, y, w, p) {
    R(x + w - 9, y + 5, 7, 7, p.ink);
    R(x + w - 8, y + 6, 5, 5, p.walnutMid);
    R(x + w - 8, y + 6, 5, 1, p.walnutHi);
    R(x + w - 7, y + 8, 3, 2, p.chipWhite);
    R(x + 5, y + 6, w - 16, 1, p.goldDeep);
    R(x + 7, y + 5, w - 20, 1, p.gold);
    R(x + 4, y + 7, 2, 3, p.goldDeep);
    R(x + w - 12, y + 7, 2, 3, p.goldDeep);
    var i;
    for (i = 0; i < 3; i++) {
      R(x + 6 + i * 6, y + 11, 4, 1, p.goldDeep);
      R(x + 5 + i * 6, y + 12, 6, 1, p.goldDeep);
      R(x + 6 + i * 6, y + 13, 4, 1, p.goldDeep);
    }
    R(x + 8, y + 8, 4, 5, p.ink);
    R(x + 9, y + 9, 2, 3, p.chipWhite);
    R(x + 12, y + 8, 4, 5, p.ink);
    R(x + 13, y + 9, 2, 3, p.chipWhite);
    R(x + 13, y + 10, 1, 1, p.chipRed);
    chipStack(R, x + 17, y + 12, p.chipBlue, p);
  }

  /* Craps: a long padded box. The stick and two dice run the full length on
   * a pass line, with numbered boxes along the top rail. */
  function layoutCraps(R, x, y, w, p) {
    var boxes = Math.max(6, Math.floor((w - 12) / 4)), i;
    for (i = 0; i < boxes; i++) {
      R(x + 5 + i * 4, y + 5, 3, 3, p.feltDeep);
      R(x + 5 + i * 4, y + 5, 3, 1, p.goldDeep);
    }
    R(x + 4, y + 9, w - 8, 1, p.gold);
    R(x + 4, y + 12, w - 8, 1, p.goldDeep);
    R(x + 6, y + 10, w - 12, 2, p.feltDeep);
    R(x + 7, y + 10, w - 14, 1, p.feltMid);
    /* The stick: a long rake lying across the near half of the bed. */
    R(x + 8, y + 14, w - 18, 1, p.walnutHi);
    R(x + w - 10, y + 13, 2, 3, p.walnutMid);
    R(x + w - 8, y + 9, 3, 3, p.ink);
    R(x + w - 8, y + 9, 3, 3, p.chipWhite);
    R(x + w - 7, y + 10, 1, 1, p.ink);
    R(x + w - 12, y + 6, 3, 3, p.chipWhite);
    R(x + w - 11, y + 6, 1, 1, p.ink);
    R(x + w - 12, y + 8, 1, 1, p.ink);
    chipStack(R, x + 6, y + 14, p.chipRed, p);
  }

  /* Poker: an oval with a chip rack sunk into the near rail, a dealer button
   * and two face-down cards. */
  function layoutPoker(R, x, y, w, p) {
    R(x + 5, y + 13, w - 10, 2, p.walnutDeep);
    R(x + 6, y + 13, w - 12, 1, p.walnutDark);
    var i;
    for (i = 0; i < 5; i++) R(x + 7 + i * 4, y + 13, 2, 1, p.goldDeep);
    chipStack(R, x + 6, y + 7, p.chipRed, p);
    chipStack(R, x + 11, y + 6, p.chipBlue, p);
    chipStack(R, x + 11, y + 10, p.chipWhite, p);
    chipStack(R, x + 16, y + 8, p.chipRed, p);
    R(x + 21, y + 6, 5, 6, p.ink);
    R(x + 22, y + 7, 3, 4, p.curtainDark);
    R(x + 22, y + 7, 3, 1, p.curtain);
    R(x + 24, y + 9, 5, 6, p.ink);
    R(x + 25, y + 10, 3, 4, p.curtainDark);
    R(x + 25, y + 10, 3, 1, p.curtain);
    R(x + 17, y + 12, 4, 3, p.ink);
    R(x + 18, y + 12, 2, 2, p.goldHi);
  }

  function roulette(R, cx, cy, p) {
    /* 15x11 wheel, built as a ring so it reads at 1x rather than as a hole
     * punched in the felt: ink silhouette, a brass rim ring one pixel inside
     * it, a band of alternating pockets, and a lit hub in the middle. */
    R(cx - 3, cy - 5, 7, 1, p.ink);
    R(cx - 5, cy - 4, 11, 1, p.ink);
    R(cx - 7, cy - 3, 15, 7, p.ink);
    R(cx - 5, cy + 4, 11, 1, p.ink);
    R(cx - 3, cy + 5, 7, 1, p.ink);
    /* Brass rim ring: one step of light on the top arc only, so the wheel
     * never becomes the brightest thing in the room. */
    R(cx - 3, cy - 4, 7, 1, p.gold);
    R(cx - 5, cy - 3, 11, 1, p.goldMid);
    R(cx - 6, cy - 2, 1, 5, p.gold);
    R(cx + 6, cy - 2, 1, 5, p.goldDeep);
    R(cx - 5, cy + 3, 11, 1, p.goldDeep);
    R(cx - 3, cy + 4, 7, 1, p.goldDeep);
    /* Pockets: two alternating values, left uncovered so the alternation is
     * what the eye reads. The hub stays three pixels wide. */
    var i;
    for (i = 0; i < 6; i++) {
      R(cx - 5 + i * 2, cy - 2, 2, 5, (i % 2) ? p.pocketRed : p.pocketDark);
    }
    R(cx - 1, cy - 1, 3, 3, p.goldDeep);
    R(cx, cy, 1, 1, p.goldHi);
    /* The ball, at rest on the rim. */
    R(cx + 2, cy - 3, 1, 1, p.chipWhite);
  }

  function chipStack(R, x, y, color, p) {
    R(x, y, 4, 4, p.ink);
    R(x + 1, y + 1, 2, 3, color);
    R(x + 1, y + 1, 2, 1, p.chipWhite);
    R(x + 1, y + 3, 2, 1, p.shadowMid);
  }

  function seat(R, x, y, p, variant) {
    variant = variant || 0;
    /* A stool, not a small table: a round leather cushion on ONE central
     * pedestal, so the silhouette has carpet showing on both sides of the
     * post. The cushion also carries its own crimson pair, a step brighter
     * than the drape and unlike the tables' mahogany. */
    R(x + 4, y, 8, 1, p.ink);
    R(x + 2, y + 1, 12, 9, p.ink);
    R(x + 4, y + 10, 8, 1, p.ink);
    R(x + 3, y + 2, 10, 6, p.stoolDeep);
    R(x + 4, y + 2, 8, 4, p.stoolDark);
    R(x + 5, y + 2, 6, 2, p.stool);
    R(variant ? x + 8 : x + 5, y + 2, 3, 1, p.stoolHi);
    R(x + 3, y + 8, 10, 1, p.goldDeep);
    R(variant ? x + 4 : x + 5, y + 8, 2, 1, p.goldMid);
    R(variant ? x + 10 : x + 9, y + 8, 2, 1, p.goldMid);
    R(x + 3, y + 9, 10, 1, p.shadowDark);
    /* Pedestal and splayed brass foot. */
    R(x + 6, y + 11, 4, 5, p.ink);
    R(x + 7, y + 11, 2, 4, p.walnutMid);
    R(variant ? x + 8 : x + 7, y + 11, 1, 3, p.walnutHi);
    R(x + 4, y + 16, 8, 2, p.ink);
    R(x + 5, y + 16, 6, 1, p.metalHi);
    R(x + 5, y + 18, 6, 1, p.shadowDark);
  }

  /* Seated patrons. Adapted from interiorSeatedGuest in js/retro-authored.js
   * (the Double R booth pose) into this module's flat-rectangle grammar: the
   * same 16x20 silhouette — head, hair, a three-quarter face, sloped
   * shoulders, a coat and one forearm resting on the cloth. Each patron's
   * cell sits on the FAR side of its table, so the table is painted after
   * them and cuts them below the chest exactly like the booth tabletop. */
  function seatedPatron(R, x, y, p, g) {
    function P(px, py, w, h, color) {
      R(g.mirror ? x + 16 - px - w : x + px, y + py, w, h, color);
    }
    /* Head: ink silhouette, hair cap, face turned toward the aisle. */
    P(4, 0, 8, 1, p.ink); P(2, 1, 12, 2, p.ink);
    P(1, 3, 14, 7, p.ink); P(3, 10, 10, 2, p.ink);
    P(3, 1, 10, 4, g.hair); P(4, 1, 7, 1, g.hairHi);
    P(2, 3, 3, 7, g.hair); P(12, 3, 2, 3, g.hair);
    P(5, 4, 8, 6, g.skin); P(6, 4, 6, 2, g.skinHi);
    P(4, 6, 2, 3, g.skinShadow); P(5, 6, 1, 2, g.skin);
    P(6, 10, 6, 1, g.skinShadow);
    P(7, 6, 1, 2, p.eye); P(11, 6, 1, 2, p.eye);
    P(13, 7, 1, 2, g.skin); P(11, 9, 2, 1, g.skinShadow);
    if (g.bob) {
      P(2, 5, 2, 7, g.hair); P(3, 2, 8, 2, g.hair);
      P(4, 2, 4, 1, g.hairHi); P(4, 9, 1, 3, g.hairHi);
    } else {
      P(3, 2, 8, 1, g.hairHi); P(3, 3, 6, 2, g.hair);
      P(4, 3, 3, 1, g.hairHi);
    }
    P(7, 11, 4, 2, g.skinShadow); P(8, 11, 2, 2, g.skin);
    /* Sloped shoulders and a diagonal collar follow the turned upper body. */
    P(4, 12, 4, 1, p.ink); P(3, 13, 10, 5, p.ink);
    P(2, 14, 12, 3, p.ink); P(4, 13, 8, 5, g.coat);
    P(4, 13, 3, 1, g.coatHi); P(7, 13, 3, 1, g.shirt);
    P(8, 14, 3, 1, g.shirt); P(9, 15, 2, 1, g.shirt);
    P(5, 14, 2, 3, g.coatHi); P(11, 14, 1, 4, g.coatShadow);
    P(3, 14, 2, 3, g.coat); P(12, 14, 2, 2, g.coat);
    P(4, 18, 8, 2, g.coatShadow);
    /* One elbow on the cloth, the far hand resting beside it. */
    P(3, 16, 3, 2, g.coat); P(4, 17, 4, 2, g.coat);
    P(4, 17, 3, 1, g.coatHi); P(7, 17, 1, 2, g.shirt);
    P(8, 17, 3, 2, g.skinShadow); P(8, 17, 3, 1, g.skinHi);
    P(12, 15, 2, 1, g.shirt); P(12, 16, 2, 2, g.skinShadow);
    P(12, 16, 2, 1, g.skinHi);
  }

  function bottle(R, x, base, color, p, tall) {
    /* Seven pixels wide with a real neck and shoulder, standing ON the plank
     * at `base`. Five 5px bottles against a near-black recess read as noise
     * at 1x; four wider ones against a lit back read as bottles. */
    var h = tall ? 13 : 11;
    var y = base - h;
    R(x + 3, y, 1, 3, p.ink);
    R(x + 2, y + 3, 3, 1, p.ink);
    R(x, y + 4, 7, h - 4, p.ink);
    R(x + 1, y + 5, 5, h - 6, color);
    R(x + 1, y + 5, 1, h - 7, p.glass);
    R(x + 3, y + 1, 1, 2, color);
    R(x, y + h - 3, 7, 1, p.goldDeep);
    R(x + 2, y + h - 3, 3, 1, p.goldMid);
  }

  function barCounter(R, p) {
    /* The C run, 96px of bar, built back to front: a dark mirrored back bar,
     * the shelf plank the bottles actually stand on, the counter top with its
     * gold nosing, the padded front and the brass footrail. Everything above
     * the top edge legitimately occludes a body standing on the north side. */
    R(80, 44, 96, 2, p.ink);
    R(81, 46, 94, 1, p.goldDeep);
    R(81, 45, 94, 13, p.walnutDeep);
    /* The mirrored back is LIT, not black: the bottles are dark glass and
     * need a lighter plane to silhouette against. */
    R(83, 46, 90, 11, p.walnut);
    R(83, 46, 90, 3, p.walnutMid);
    R(83, 55, 90, 2, p.walnutDark);
    var i;
    var colors = [p.bottleGreen, p.bottleAmber, p.bottleRed, p.bottleGreen];
    for (i = 0; i < 4; i++) bottle(R, 102 + i * 15, 58, colors[i], p, i % 2 === 0);
    barLamp(R, 88, 44, p, false);
    barLamp(R, 168, 44, p, true);
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

  function barLamp(R, x, y, p, dome) {
    /* Two lamps, not one lamp twice: the west end carries a pleated cone
     * shade on a short stem, the east end a plain dome on a taller one. */
    if (dome) {
      R(x - 5, y + 2, 10, 2, p.ink);
      R(x - 4, y + 1, 8, 1, p.goldDeep);
      R(x - 4, y + 3, 8, 3, p.goldMid);
      R(x - 2, y + 3, 4, 2, p.goldHi);
      R(x - 1, y + 4, 2, 1, p.goldWhite);
      R(x - 1, y + 6, 2, 5, p.goldDeep);
      R(x - 4, y + 11, 8, 1, p.gold);
      R(x - 6, y + 12, 12, 1, p.goldDeep);
    } else {
      R(x - 6, y + 1, 12, 2, p.ink);
      R(x - 5, y + 3, 10, 3, p.goldDeep);
      R(x - 4, y + 3, 1, 3, p.goldMid);
      R(x - 1, y + 3, 1, 3, p.goldMid);
      R(x + 2, y + 3, 1, 3, p.goldMid);
      R(x - 4, y + 6, 8, 2, p.goldHi);
      R(x - 2, y + 6, 4, 1, p.goldWhite);
      R(x - 1, y + 8, 2, 3, p.goldDeep);
      R(x - 3, y + 11, 6, 1, p.gold);
      R(x - 5, y + 12, 10, 1, p.goldDeep);
    }
  }

  function serviceCabinet(R, p) {
    /* Tall service cabinet against the east drape, 16x30 on its own cell. */
    R(224, 18, 16, 30, p.ink);
    R(225, 19, 14, 3, p.walnutMid);
    R(225, 19, 14, 1, p.goldDeep);
    R(225, 22, 14, 24, p.walnutDark);
    R(226, 23, 5, 10, p.walnutDeep);
    R(233, 23, 5, 10, p.walnutDeep);
    R(226, 34, 5, 10, p.walnutDeep);
    R(233, 34, 5, 10, p.walnutDeep);
    R(226, 23, 5, 1, p.walnut);
    R(233, 23, 5, 1, p.walnut);
    R(226, 34, 5, 1, p.walnut);
    R(233, 34, 5, 1, p.walnut);
    R(231, 27, 1, 3, p.goldHi);
    R(232, 27, 1, 3, p.goldMid);
    R(231, 38, 1, 3, p.goldHi);
    R(232, 38, 1, 3, p.goldMid);
    R(225, 46, 14, 2, p.walnutDeep);
    R(225, 46, 14, 1, p.goldDeep);
  }

  function drawProp(R, prop, p) {
    var b = prop.bounds;
    if (prop.id === 'barCounter') barCounter(R, p);
    else if (prop.id === 'serviceCabinet') serviceCabinet(R, p);
    else if (prop.id.indexOf('table') === 0) {
      feltTable(R, b[0], b[1], b[2], p, prop.game);
    } else if (prop.id.indexOf('guest') === 0) {
      seatedPatron(R, b[0], b[1], p, guests[prop.guest]);
    } else if (prop.id.indexOf('stool') === 0) seat(R, b[0], b[1], p, prop.seatVariant);
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
    drawSkirting(R, p);
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
