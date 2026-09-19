/* roadhouse-art.js — The Roadhouse, native 256x192 authored interior.
 *
 * The map is deliberately still the small, legible ASCII floor plan in
 * maps.js.  This module paints its orthographic room in one deterministic
 * pass: dark walnut, a quiet brown plank/checker floor, and small pools of
 * red stage light, amber practicals, and neon.  Integer rectangles are used
 * throughout so this remains a true pixel scene at the production scale.
 *
 * M12 — WHAT THIS FILE OWNS NOW. world/props.json owns the Roadhouse furniture; this file paints the SHELL it
 * stands in. Kept here: walls, floor, wall sconces, the stage recess and its boards, the spotlight pools, the
 * mic and speakers, the back-bar shelves and bottles, the picture frames, the jukebox, the plants, the south
 * wall, the door opening and its jamb, and the floor pools the furniture sits in. Moved to the prop set: the
 * neon sign, the stage curtain, the piano, the deer, the pendant lamps, the bar counter, the booths, the
 * tables, the chairs, the candles and the door leaf. Painting those here as well was the M11 finding: the room
 * was drawn twice. If a prop instance is removed from world/props.json, the piece is gone from the room — it
 * does not fall back to paint.
 */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;

  var palette = {
    ink: '#171418', black: '#21191a', walnutDeep: '#302021',
    walnutDark: '#402725', walnut: '#5b3529', walnutMid: '#75422f',
    walnutHi: '#9b5a3b', walnutGold: '#b87943',
    wall: '#302321', wallMid: '#392326', wallHi: '#5e3430',
    /* The open floor is deliberately one value quieter than the upholstery;
     * receiving pools can then stop on hard dark edges instead of washing the
     * whole room to the booth's red level. */
    floorDeep: '#33252a', floorDark: '#46302e', floor: '#533831',
    floorMid: '#5d3d34', floorHi: '#68453a',
    redDeep: '#401a28', redDark: '#60202d', red: '#852b38',
    redMid: '#a33a43', redHi: '#ca5147', redLight: '#e46d50',
    curtainDeep: '#411729', curtainDark: '#621b2e', curtain: '#85243a',
    curtainHi: '#a83a45',
    amberDeep: '#714321', amber: '#a4662c', amberMid: '#d18a39',
    amberHi: '#f4c568', amberWhite: '#ffe2a0',
    neonDeep: '#6f202e', neon: '#d64948', neonHi: '#ff7352',
    bottleGreen: '#263e35', bottle: '#4d6950', bottleHi: '#8caa71',
    metalDeep: '#30282a', metal: '#6a6860', metalHi: '#b2a987',
    glass: '#d59a54', glassHi: '#ffe29a',
    shadow: '#281d20', shadowMid: '#20181b', shadowDark: '#171317',
    plantDeep: '#183026', plant: '#294936', plantHi: '#68804c'
  };

  /* Grounded footprints mirror the solid furniture glyphs in maps.js.  The
   * stage, wall bar, and door are architecture; these are the only props
   * that participate in depth bands.  No footprint claims a Cast Presence
   * body, the pay phone (8,5), or either south-door cell. */
  var definitions = [
    {id: 'northTableWest', cells: [[3,3],[4,3]], bounds: [44,47,38,20], shadow: [48,63,32,4]},
    {id: 'northChairsWest', cells: [[5,3],[6,3]], bounds: [79,48,30,24], shadow: [80,68,28,4]},
    {id: 'northTableMiddle', cells: [[7,3],[8,3]], bounds: [108,47,38,20], shadow: [112,63,32,4]},
    {id: 'northChairsMiddle', cells: [[9,3],[10,3]], bounds: [143,48,30,24], shadow: [144,68,28,4]},
    {id: 'northTableEast', cells: [[11,3],[12,3]], bounds: [172,47,38,20], shadow: [176,63,32,4]},
    {id: 'southTableWest', cells: [[3,7],[4,7]], bounds: [44,111,38,20], shadow: [48,127,32,4]},
    {id: 'southChairsWest', cells: [[5,7],[6,7]], bounds: [79,112,30,24], shadow: [80,132,28,4]},
    {id: 'southTableMiddle', cells: [[7,7],[8,7]], bounds: [108,111,38,20], shadow: [112,127,32,4]},
    {id: 'southChairsMiddle', cells: [[9,7],[10,7]], bounds: [143,112,30,24], shadow: [144,132,28,4]},
    {id: 'southTableEast', cells: [[11,7],[12,7]], bounds: [172,111,38,20], shadow: [176,127,32,4]},
    {id: 'barFurniture', cells: [[4,5],[5,5],[6,5],[7,5]], bounds: [158,72,92,42], shadow: [168,109,76,4]},
    {id: 'barStoolWest', cells: [[3,5]], bounds: [158,92,16,28], shadow: [158,118,16,4]},
    {id: 'barStoolEast', cells: [[9,5]], bounds: [224,92,16,28], shadow: [224,118,16,4]}
  ];

  function southEdge(cells) {
    var row = -1;
    for (var i = 0; i < cells.length; i++) if (cells[i][1] > row) row = cells[i][1];
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

  function drawFloor(R, p) {
    /* The room's navigation field is an 8px subdivision checker: two quiet
     * walnut values alternate across the whole open aisle, while a dark base
     * remains visible as the perimeter and the tiny gaps between squares. */
    R(0, 32, 256, 128, p.floorDeep);
    var row, col, y, x, tone;
    /* Subdivide each canonical tile into two 8px squares.  The close warm
     * values keep the checker legible without turning the navigation field
     * into a grid of near-black patches. */
    for (row = 4; row < 20; row++) {
      y = row * 8;
      for (col = 2; col < 31; col++) {
        x = col * 8;
        tone = ((row + col) & 1) ? p.floorDark : p.floor;
        R(x, y, 8, 8, tone);
        /* Sparse interior grain gives selected subdivisions material depth
         * without outlining every cell into a paneled grid. */
        if (((row * 5 + col * 3) & 7) === 0) {
          R(x + 2, y + 5, 4, 1, p.floorMid);
        }
      }
    }
    /* Hard ink baseboards separate the checker from the walnut wall and from
     * the south threshold.  The boundary is deliberately broad enough to
     * survive native-size viewing, while the field itself stays quiet. */
    R(0, 31, 256, 2, p.ink);
    R(0, 142, 256, 2, p.ink);
    R(0, 32, 16, 110, p.ink);
    R(240, 32, 16, 110, p.ink);
    R(16, 32, 1, 110, p.floorDeep);
    R(239, 32, 1, 110, p.floorDeep);
  }

  function drawWall(R, p) {
    R(0, 0, 256, 160, p.wall);
    R(0, 0, 256, 4, p.ink);
    R(8, 5, 240, 2, p.walnutMid);
    R(8, 7, 240, 2, p.walnutDeep);
    /* Vertical walnut pilasters make the side perimeter read as a room, not
     * as a border around empty pixels. */
    for (var x = 8; x < 248; x += 32) {
      R(x, 8, 4, 152, p.walnutDeep);
      R(x + 1, 8, 1, 152, p.walnutHi);
      R(x + 4, 8, 2, 152, p.wallMid);
    }
    for (var y = 20; y < 160; y += 20) R(8, y, 240, 2, p.walnutDark);
    R(8, 39, 240, 3, p.walnutDeep);
    R(8, 40, 240, 1, p.walnutHi);
    /* The floor replaces the lower wall face but leaves a dark perimeter. */
    drawFloor(R, p);
    R(0, 40, 16, 120, p.walnutDeep);
    R(4, 44, 2, 112, p.walnutHi);
    R(240, 40, 16, 120, p.walnutDeep);
    R(250, 44, 2, 112, p.walnutHi);
    /* Sparse side-wall plank seams remain visible around the sconces and keep
     * the exposed walnut from reading as a flat plum strip. */
    R(1, 49, 14, 1, p.walnutDark); R(1, 50, 14, 1, p.walnutDeep);
    R(1, 91, 14, 1, p.walnutDark); R(1, 92, 14, 1, p.walnutDeep);
    R(1, 135, 14, 1, p.walnutDark); R(1, 136, 14, 1, p.walnutDeep);
    R(241, 49, 14, 1, p.walnutDark); R(241, 50, 14, 1, p.walnutDeep);
    R(241, 91, 14, 1, p.walnutDark); R(241, 92, 14, 1, p.walnutDeep);
    R(241, 135, 14, 1, p.walnutDark); R(241, 136, 14, 1, p.walnutDeep);
    /* A few short, low-contrast offsets add panel depth without a regular
     * wall grid. */
    R(2, 77, 5, 1, p.walnutDark); R(10, 82, 4, 1, p.walnutDark);
    R(2, 126, 5, 1, p.walnutDark); R(10, 131, 4, 1, p.walnutDark);
    R(249, 77, 5, 1, p.walnutDark); R(249, 82, 4, 1, p.walnutDark);
    R(249, 126, 5, 1, p.walnutDark); R(249, 131, 4, 1, p.walnutDark);
    sideSconce(R, 8, 61, p); sideSconce(R, 8, 109, p);
    sideSconce(R, 252, 61, p); sideSconce(R, 252, 109, p);
  }

  function sideSconce(R, x, y, p) {
    /* Broken stepped receiving marks tint the wall beyond the fixture without
     * becoming a solid box: walnut outer shoulders, intermediate side glints,
     * then the dark framed source and its bright core. */
    R(x - 5, y - 7, 10, 1, p.walnutDark);
    R(x - 7, y - 5, 14, 2, p.walnutMid);
    R(x - 8, y - 3, 2, 8, p.walnutMid);
    R(x + 6, y - 3, 2, 8, p.walnutMid);
    R(x - 6, y + 5, 12, 2, p.walnutMid);
    R(x - 5, y + 7, 10, 2, p.walnutDark);
    R(x - 4, y - 4, 8, 1, p.walnutHi);
    R(x - 5, y - 2, 3, 5, p.walnutGold);
    R(x + 2, y - 2, 3, 5, p.walnutGold);
    R(x - 4, y + 3, 8, 2, p.walnutHi);
    R(x - 4, y + 11, 5, 3, p.walnutMid);
    R(x + 2, y + 13, 3, 2, p.walnutMid);
    R(x - 1, y - 5, 2, 2, p.ink);
    R(x - 2, y - 3, 4, 2, p.walnutGold);
    R(x - 4, y - 1, 8, 2, p.ink);
    R(x - 4, y + 1, 2, 7, p.ink); R(x + 2, y + 1, 2, 7, p.ink);
    R(x - 2, y + 1, 4, 6, p.amber);
    R(x - 1, y + 2, 2, 3, p.amberHi);
    R(x, y + 3, 2, 2, p.amberWhite);
    R(x - 3, y + 8, 6, 2, p.ink);
  }

  function drawStage(R, p) {
    /* M12: the curtain and its folds are roadhouse-stage-01 now. What stays is the recess it hangs in (so the
     * 6 px the 112-wide prop leaves on either side read as dark stage wall, not as a hole), the boards, the
     * spotlight pool and the mic and speakers, which no prop carries. */
    R(62, 12, 134, 43, p.ink);
    R(68, 48, 122, 10, p.walnutDeep);
    R(70, 49, 118, 2, p.walnutHi);
    R(70, 53, 118, 5, p.walnut);
    R(62, 57, 134, 7, p.ink);
    R(66, 57, 126, 3, p.walnutMid);
    R(66, 60, 126, 3, p.walnutDeep);
    /* Compact dimensional stage spot: a stepped oval sits on the boards
     * beneath the mic instead of reading as a flat horizontal light band. */
    R(62, 49, 12, 2, p.redDeep); R(182, 49, 10, 2, p.redDeep);
    R(105, 48, 46, 1, p.ink);
    R(100, 49, 56, 1, p.amberDeep);
    R(96, 50, 64, 2, p.amber);
    R(102, 52, 52, 1, p.amberMid);
    R(109, 53, 38, 2, p.amberMid);
    R(116, 55, 24, 2, p.amber);
    R(118, 51, 20, 1, p.amberHi);
    R(121, 53, 14, 2, p.amberHi);
    /* Board seams interrupt the receiving pool; light never fills the recess. */
    R(102, 52, 9, 1, p.amberDeep); R(143, 54, 7, 1, p.amberDeep);
    R(123, 57, 10, 1, p.ink);
    /* Mic, stand, and two speakers — no prop carries these. */
    R(126, 29, 4, 22, p.ink); R(127, 31, 2, 18, p.metalHi);
    R(124, 28, 8, 5, p.ink); R(126, 27, 4, 2, p.metalHi);
    R(120, 50, 16, 3, p.ink); R(123, 49, 10, 2, p.metal);
    speaker(R, 77, 39, p); speaker(R, 173, 39, p);
  }

  function speaker(R, x, y, p) {
    R(x, y, 15, 22, p.ink); R(x + 2, y + 2, 11, 18, p.metalDeep);
    R(x + 3, y + 3, 9, 2, p.metal); R(x + 4, y + 8, 7, 7, p.black);
    R(x + 6, y + 10, 3, 3, p.metal); R(x + 4, y + 17, 7, 1, p.metal);
  }


  function frame(R, x, y, p) {
    R(x, y, 15, 20, p.ink); R(x + 2, y + 2, 11, 16, p.walnutMid);
    R(x + 3, y + 3, 9, 14, p.amberDeep); R(x + 4, y + 4, 7, 11, p.walnut);
    R(x + 5, y + 6, 5, 5, p.walnutGold); R(x + 6, y + 7, 3, 3, p.metalHi);
    R(x + 3, y + 16, 9, 1, p.walnutHi);
  }

  function drawTrophies(R, p) {
    /* M12: the picture frames are wall dressing and stay; the mounted deer is roadhouse-trophy-01. */
    frame(R, 16, 28, p); frame(R, 16, 88, p); frame(R, 16, 112, p);
    frame(R, 230, 50, p); frame(R, 230, 76, p);
  }

  function bottle(R, x, y, color, p, tall) {
    tall = !!tall;
    R(x + 2, y, 3, 2, p.amberDeep); R(x + 1, y + 2, 5, tall ? 10 : 8, p.ink);
    R(x + 2, y + 3, 3, tall ? 8 : 6, color);
    R(x + 2, y + 3, 1, tall ? 5 : 4, p.bottleHi);
    R(x, y + (tall ? 11 : 9), 7, 2, p.walnutGold);
  }


  function pendantPool(R, x, y, p) {
    /* Broken shoulders catch the wood behind the bottles. Each pool stays
     * narrower than the spacing of its neighbours and exposes dark seams. */
    R(x, y + 15, 10, 3, p.walnutGold);
    R(x - 2, y + 18, 14, 3, p.walnutHi);
    R(x - 4, y + 21, 18, 2, p.walnutMid);
    R(x - 3, y + 24, 7, 2, p.walnutGold);
    R(x + 6, y + 24, 6, 2, p.walnutHi);
    R(x - 1, y + 27, 11, 4, p.walnutMid);
    R(x + 2, y + 33, 5, 3, p.walnutMid);
  }


  function drawBar(R, p) {
    /* Back bar and shelves occupy the right wall, keeping the phone's tile at
     * x=8,y=5 as a visually quiet, readable notch before the counter. */
    R(160, 11, 88, 84, p.walnutDeep); R(164, 14, 80, 4, p.walnutHi);
    R(166, 19, 76, 67, p.wallMid);
    R(166, 31, 76, 3, p.walnutDark); R(166, 50, 76, 3, p.walnutDark);
    R(166, 69, 76, 3, p.walnutDark);
    R(166, 32, 76, 2, p.walnutHi); R(166, 51, 76, 2, p.walnutHi);
    R(166, 70, 76, 2, p.walnutHi);
    pendantPool(R, 176, 8, p); pendantPool(R, 207, 8, p); pendantPool(R, 229, 8, p);
    var colors = [p.bottleGreen, p.bottle, p.redDark, p.bottleGreen, p.amberDeep];
    for (var i = 0; i < 10; i++) bottle(R, 169 + i * 7, 21 + (i % 2), colors[i % colors.length], p, i % 3 === 0);
    for (var j = 0; j < 10; j++) bottle(R, 169 + j * 7, 38 + (j % 3), colors[(j + 2) % colors.length], p, j % 4 === 0);
    for (var k = 0; k < 10; k++) bottle(R, 169 + k * 7, 57 + (k % 2), colors[(k + 1) % colors.length], p, k % 3 === 1);
    /* M12: the counter is roadhouse-bar-01 and the hanging lamps are roadhouse-pendant-01/02. The back-bar wall
     * above them — shelves, bottles, service window — is wall dressing and stays painted, as do the pools the
     * lamps throw on the shelf and on the floor: the prop carries the fixture, not its light. */
    for (var lightX = 0; lightX < 3; lightX++) {
      var centre = [176, 207, 229][lightX];
      R(centre - 7, 113, 14, 2, p.floorHi);
      R(centre - 9, 116, 8, 2, p.floorMid);
      R(centre + 2, 116, 7, 2, p.floorMid);
    }
    /* Back-bar attendant window. */
    R(211, 56, 22, 22, p.ink); R(214, 59, 16, 15, p.walnut);
    R(217, 61, 10, 11, p.glass); R(218, 62, 8, 2, p.glassHi);
  }

  function drawStageApron(R, p) {
    /* The bar is painted after drawStage so its shelves can sit at the right
     * wall.  Reassert this straight raised front afterwards: it joins the
     * curtain, mic floor, and open performance floor into one silhouette. */
    R(62, 57, 134, 7, p.ink);
    R(66, 57, 126, 3, p.walnutMid);
    R(66, 60, 126, 3, p.walnutDeep);
    /* Compact center blocks continue the spot onto the vertical apron without
     * creating another triangle or full-width band. */
    R(116, 57, 24, 1, p.amberDeep);
    R(120, 58, 16, 2, p.amber);
    R(123, 60, 10, 2, p.amberMid);
    R(120, 62, 16, 1, p.amberDeep);
    R(125, 59, 6, 2, p.amberHi);
    R(76, 63, 106, 1, p.walnutHi);
    /* The raised apron casts a dark break before a few lit floor boards. */
    R(113, 66, 30, 2, p.floorMid);
    R(118, 68, 20, 2, p.amberDeep);
    R(108, 70, 11, 2, p.floorMid); R(132, 71, 12, 2, p.floorMid);
  }





  /* M12: the booths, tables, chairs and candles are prop instances (roadhouse-booth-*, -table-*, -chair-*,
   * -candle-*). What stays here is the light they sit in — the floor pools under each table group — because the
   * prop set carries objects, not the room's lighting, and a table with no pool floats. The pools are placed on
   * the PROP anchors, not on the old painted positions. */
  function drawBoothsAndTables(R, p) {
    var groups = [[105, 82], [130, 110], [70, 104]];
    for (var i = 0; i < groups.length; i++) {
      tableFloorPool(R, groups[i][0], groups[i][1], p);
      candlePool(R, groups[i][0], groups[i][1], p);
    }
  }

  function tableFloorPool(R, x, y, p) {
    /* A warm, low-contrast ellipse begins just above the tabletop and runs
     * behind the chairs through the feet.  Warm moats replace black outlines;
     * the open checker remains the dark separator between each pool. */
    R(x - 13, y - 2, 26, 2, p.floorMid);
    R(x - 18, y + 1, 36, 3, p.floorHi);
    R(x - 20, y + 5, 13, 3, p.floorMid);
    R(x + 9, y + 5, 11, 3, p.floorMid);
    R(x - 16, y + 9, 32, 3, p.amberDeep);
    R(x - 12, y + 13, 24, 3, p.floorHi);
    R(x - 10, y + 17, 8, 3, p.floorMid);
    R(x + 3, y + 18, 7, 3, p.floorMid);
    R(x - 7, y + 22, 12, 2, p.floorMid);
  }


  function candlePool(R, x, y, p) {
    /* Pre-pass under the tabletop: this is deliberately quieter than the
     * final oval so the tabletop and candle remain the readable focal point. */
    R(x - 12, y + 2, 24, 1, p.floorDark);
    R(x - 9, y + 3, 18, 2, p.floorMid);
    R(x - 6, y + 5, 12, 2, p.amberDeep);
    R(x - 3, y + 7, 6, 1, p.floorMid);
  }



  function jukebox(R, p) {
    /* The jukebox is a right-perimeter landmark, away from the pay-phone
     * approach and the open centre. */
    R(214, 111, 31, 45, p.ink); R(217, 114, 25, 39, p.redDark);
    R(220, 116, 19, 33, p.amber); R(222, 118, 15, 27, p.neonHi);
    R(224, 120, 11, 24, p.amberHi); R(226, 123, 7, 17, p.walnutDeep);
    R(227, 125, 5, 2, p.amberWhite); R(228, 130, 3, 9, p.metalDeep);
    R(222, 144, 15, 4, p.walnut); R(218, 149, 23, 4, p.walnutDeep);
    R(218, 115, 25, 2, p.neon); R(221, 118, 3, 28, p.red);
  }

  function plant(R, x, y, p) {
    R(x + 5, y + 12, 13, 8, p.ink); R(x + 7, y + 11, 9, 8, p.walnutMid);
    R(x + 8, y, 3, 15, p.plant); R(x + 12, y + 4, 3, 12, p.plant);
    R(x + 3, y + 5, 8, 3, p.plant); R(x + 12, y + 2, 8, 3, p.plant);
    R(x + 4, y + 3, 5, 2, p.plantHi); R(x + 14, y + 1, 4, 2, p.plantHi);
    R(x + 8, y + 14, 9, 2, p.walnutGold);
  }

  function drawBottomDoor(R, p) {
    /* South wall and the lit double door. The south cells remain the map's
     * only route out; the foreground frame is separately depth-sorted. */
    R(0, 144, 256, 48, p.ink);
    for (var x = 8; x < 248; x += 32) {
      R(x, 148, 24, 3, p.walnutDark); R(x + 2, 149, 20, 1, p.walnutMid);
      R(x, 159, 24, 3, p.walnutDark); R(x + 2, 160, 20, 1, p.walnutMid);
      R(x, 172, 24, 3, p.walnutDark); R(x + 2, 173, 20, 1, p.walnutMid);
      R(x, 185, 24, 3, p.walnutDark); R(x + 2, 186, 20, 1, p.walnutMid);
    }
    /* A narrow threshold pool receives the panes' amber before the door leaf
     * starts at y=141; its three steps do not bleed into the open floor. */
    R(120, 135, 16, 2, p.amberDeep);
    R(114, 137, 28, 2, p.amber);
    R(108, 139, 40, 2, p.amberDeep);
    plant(R, 61, 144, p); plant(R, 177, 144, p);
    /* M12: the leaf is roadhouse-door-01. The opening it sits in stays painted — without this recess the prop
     * would hang on a flat wall — and drawDoorFrame still paints the jamb in the foreground pass. */
    R(104, 141, 48, 35, p.ink); R(107, 144, 42, 32, p.walnutDeep);
  }

  function drawDoorFrame(R, p) {
    R(104, 141, 4, 35, p.ink); R(148, 141, 4, 35, p.ink);
    R(108, 141, 40, 4, p.walnutHi); R(109, 142, 38, 2, p.walnutGold);
    R(126, 141, 4, 35, p.ink); R(127, 142, 1, 34, p.walnutHi);
  }

  function drawPlayerContact(R, p) {
    var E = GAME.Engine, state = E && E.state, player = state && state.player;
    if (!state || state.mapId !== 'roadhouse' || !player || !Number.isFinite(player.x) || !Number.isFinite(player.y)) return;
    var x = Math.round(player.x), y = Math.round(player.y);
    R(x + 3, y + 15, 10, 2, p.shadowMid);
    R(x + 4, y + 17, 8, 1, p.shadowDark);
  }




  /* M12: the prop registry owns the Roadhouse furniture (world/props.json, option A). What is painted here is
   * the SHELL — walls, floor, sconces, the stage recess and its boards, the back-bar shelves, the south wall and
   * the door opening — plus the pieces no prop exists for: the mic, the speakers, the jukebox, the plants, the
   * picture frames and the pay phone at its interact tile. Everything the prop set carries (neon, stage curtain,
   * piano, deer, pendants, bar counter, booths, tables, chairs, candles, door leaf) was painted here until M12
   * and is gone: js/props-production.js draws it now, and painting it twice was the M11 finding. */
  function draw(ctx, cx, cy) {
    var R = rectPainter(ctx, cx, cy), p = palette;
    R(0, 0, 256, 192, p.ink);
    drawWall(R, p);
    drawStage(R, p);
    drawTrophies(R, p);
    drawBar(R, p);
    drawStageApron(R, p);
    drawBoothsAndTables(R, p);
    jukebox(R, p);
    drawBottomDoor(R, p);
    /* M12: `definitions` stays as the room's furniture contract (cells and foot y), but nothing here paints it
     * any more — the south tables, the chairs and the bar stools are prop instances, and their contact shadows
     * went with them. Only the player's own contact shadow is still painted. */
    drawPlayerContact(R, p);
  }

  function foreground(ctx, cx, cy, minFoot, maxFoot) {
    minFoot = minFoot == null ? -Infinity : minFoot;
    maxFoot = maxFoot == null ? Infinity : maxFoot;
    var R = rectPainter(ctx, cx, cy), p = palette;
    /* The door jamb is the only painted piece left that has to sort against the actors. */
    if (160 >= minFoot && 160 < maxFoot) drawDoorFrame(R, p);
  }

  GAME.RoadhouseArt = {
    draw: draw,
    foreground: foreground,
    definitions: definitions,
    props: definitions,
    palette: palette,
    doorFoot: 160
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.RoadhouseArt;
})();
