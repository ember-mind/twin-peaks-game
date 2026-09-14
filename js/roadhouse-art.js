/* roadhouse-art.js — The Roadhouse, native 256x192 authored interior.
 *
 * The map is deliberately still the small, legible ASCII floor plan in
 * maps.js.  This module paints its orthographic room in one deterministic
 * pass: dark walnut, a quiet brown plank/checker floor, and small pools of
 * red stage light, amber practicals, and neon.  Integer rectangles are used
 * throughout so this remains a true pixel scene at the production scale.
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
    R(x - 7, y - 5, 14, 2, p.walnutDark);
    R(x - 8, y - 3, 2, 8, p.walnutDark);
    R(x + 6, y - 3, 2, 8, p.walnutDark);
    R(x - 6, y + 5, 12, 2, p.walnutDark);
    R(x - 5, y + 7, 10, 2, p.walnutDark);
    R(x - 4, y - 4, 8, 1, p.walnut);
    R(x - 5, y - 2, 3, 5, p.walnut);
    R(x + 2, y - 2, 3, 5, p.walnut);
    R(x - 4, y + 3, 8, 2, p.walnut);
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
    /* Stage recess and its red curtain: stepped side and hem pixels stand in
     * for the cone of spotlight without using a gradient. */
    R(62, 12, 134, 43, p.ink);
    /* Begin with one solid burgundy/red mass; irregular slivers below provide
     * the folds without turning the curtain into disconnected rectangles. */
    R(66, 15, 126, 33, p.curtainDark);
    R(69, 17, 120, 29, p.curtain);
    R(70, 18, 118, 2, p.curtainHi);
    var folds = [[73,3,20,43],[87,2,23,45],[100,4,19,42],[114,2,25,46],
      [127,4,20,44],[141,2,24,43],[154,4,19,46],[169,2,23,42],[181,3,20,44]];
    for (var i = 0; i < folds.length; i++) {
      var fold = folds[i], x = fold[0], width = fold[1], top = fold[2], end = fold[3];
      R(x, top, width, end - top, p.curtainDark);
      R(x + width, top + 3, 1, Math.max(3, end - top - 7), p.curtainHi);
      R(x - 1, end - 3, Math.min(3, width + 1), 3, p.curtainDeep);
    }
    /* A centered red receiving mass breaks the repeated folds and gives the
     * microphone a localized red stage wall behind it. */
    R(110, 39, 36, 2, p.curtain);
    R(115, 36, 26, 3, p.curtainHi);
    R(121, 34, 14, 4, p.redMid);
    R(125, 32, 6, 7, p.redHi);
    R(66, 45, 126, 4, p.curtainDeep);
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
    R(102, 52, 52, 2, p.amberMid);
    R(109, 54, 38, 2, p.amber);
    R(116, 56, 24, 1, p.amberDeep);
    R(121, 52, 14, 2, p.amberHi);
    R(123, 57, 10, 1, p.ink);
    /* Mic, stand, and two speakers. */
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

  function drawNeon(R, p, ctx, cx, cy) {
    R(13, 10, 76, 35, p.ink); R(16, 13, 70, 28, p.walnutDeep);
    R(18, 15, 66, 2, p.walnutMid); R(18, 40, 66, 2, p.neonDeep);
    /* Red receiving strips sit on the walnut pilasters beside the sign; the
     * stepped foot below it stops before the floor lamps and tables. */
    R(10, 18, 3, 20, p.redDeep); R(89, 18, 3, 20, p.redDeep);
    R(20, 43, 60, 2, p.redDark); R(28, 45, 44, 1, p.redDeep);
    /* Mountain outline and down-pointing arrow borrowed from the A plate. */
    var mountain = [[20,29,4,2],[24,27,4,2],[28,24,4,3],[32,20,4,4],
      [36,24,4,3],[40,27,4,2],[44,24,4,3],[48,20,4,4],[52,24,4,3],
      [56,27,4,2],[60,29,7,2],[69,27,4,2],[73,29,9,2]];
    for (var i = 0; i < mountain.length; i++) R(mountain[i][0], mountain[i][1], mountain[i][2], mountain[i][3], p.neonHi);
    if (GAME.RetroFont && GAME.RetroFont.draw) {
      GAME.RetroFont.draw(ctx, 'ROADHOUSE', 52 - cx, 31 - cy, p.neonHi, {scale: 1, align: 'center'});
    } else {
      /* Fallback is intentionally tiny; production has RetroFont loaded. */
      R(22, 32, 52, 4, p.neon);
    }
    R(18, 41, 66, 2, p.neon); R(46, 43, 5, 2, p.neonHi);
  }

  function frame(R, x, y, p) {
    R(x, y, 15, 20, p.ink); R(x + 2, y + 2, 11, 16, p.walnutMid);
    R(x + 3, y + 3, 9, 14, p.amberDeep); R(x + 4, y + 4, 7, 11, p.walnut);
    R(x + 5, y + 6, 5, 5, p.walnutGold); R(x + 6, y + 7, 3, 3, p.metalHi);
    R(x + 3, y + 16, 9, 1, p.walnutHi);
  }

  function drawTrophies(R, p) {
    frame(R, 16, 49, p); frame(R, 16, 75, p); frame(R, 16, 112, p);
    /* Deer/trophy silhouettes: three tones and a pale horn line. */
    R(20, 55, 7, 6, p.walnutDeep); R(19, 56, 9, 3, p.walnutDeep);
    R(21, 53, 2, 3, p.walnutHi); R(25, 53, 2, 3, p.walnutHi);
    R(21, 61, 6, 1, p.walnutHi);
    frame(R, 230, 50, p); frame(R, 230, 76, p);
    R(234, 56, 8, 1, p.amberHi); R(237, 55, 2, 5, p.amber);
    R(234, 58, 8, 1, p.amber); R(236, 61, 4, 1, p.walnutHi);
  }

  function bottle(R, x, y, color, p, tall) {
    tall = !!tall;
    R(x + 2, y, 3, 2, p.amberDeep); R(x + 1, y + 2, 5, tall ? 10 : 8, p.ink);
    R(x + 2, y + 3, 3, tall ? 8 : 6, color);
    R(x + 2, y + 3, 1, tall ? 5 : 4, p.bottleHi);
    R(x, y + (tall ? 11 : 9), 7, 2, p.walnutGold);
  }

  function pendant(R, x, y, p) {
    R(x + 4, y, 2, 7, p.ink); R(x + 1, y + 7, 8, 5, p.amberDeep);
    R(x, y + 10, 10, 5, p.amber); R(x + 2, y + 10, 6, 3, p.amberHi);
    R(x + 4, y + 10, 2, 2, p.amberWhite);
  }

  function pendantPool(R, x, y, p) {
    /* Three short steps fall onto the dark wall below each pendant, bounded
     * above and below by a one-tone walnut/ink moat. */
    R(x - 7, y + 14, 24, 1, p.ink);
    R(x - 2, y + 15, 14, 2, p.amberDeep);
    R(x - 5, y + 17, 20, 2, p.amberMid);
    R(x - 5, y + 19, 20, 2, p.amber);
    R(x - 5, y + 21, 20, 1, p.ink);
  }

  function counterHighlight(R, x, p) {
    /* Compact pools cast by each pendant: a bright centre, a warm shoulder,
     * and a dark stop.  The eight-pixel gaps remain the counter's walnut. */
    R(x - 7, 81, 14, 1, p.walnutHi);
    R(x - 5, 82, 10, 2, p.amberDeep);
    R(x - 3, 84, 6, 2, p.amberHi);
    R(x - 5, 86, 10, 1, p.amberMid);
    R(x - 7, 87, 14, 1, p.ink);
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
    pendant(R, 176, 8, p); pendant(R, 207, 8, p); pendant(R, 229, 8, p);
    /* Counter front: a dark rim, segmented pendant pools, and a deep front
     * fascia make the long bar read as a thick built object, not one tan
     * plank.  All edges remain pixel-orthographic rectangles. */
    R(158, 78, 91, 12, p.ink); R(160, 79, 87, 7, p.walnutMid);
    R(164, 80, 79, 4, p.walnut);
    counterHighlight(R, 176, p); counterHighlight(R, 207, p); counterHighlight(R, 229, p);
    R(160, 88, 87, 3, p.ink);
    R(160, 90, 87, 21, p.walnutDeep); R(164, 92, 79, 15, p.walnutDark);
    R(164, 91, 79, 2, p.walnutHi); R(164, 105, 79, 3, p.black);
    R(160, 107, 87, 4, p.ink); R(164, 107, 79, 1, p.walnutHi);
    R(165, 97, 18, 5, p.walnut); R(192, 97, 18, 5, p.walnut);
    R(216, 97, 22, 5, p.walnut);
    R(170, 95, 4, 2, p.amberHi); R(201, 94, 4, 2, p.amberHi);
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
  }

  function drawPayPhone(R, p) {
    /* Object target is exactly (8,5); the handset and cord stay inside the
     * wall-side edge of this free tile so it remains readable from (8,6). */
    R(134, 77, 13, 31, p.ink); R(136, 79, 9, 27, p.metalDeep);
    R(137, 81, 7, 12, p.metal); R(138, 82, 5, 3, p.metalHi);
    R(138, 87, 5, 4, p.walnut); R(139, 88, 3, 2, p.amberHi);
    R(136, 94, 9, 3, p.walnutDark); R(138, 98, 5, 5, p.metal);
    R(137, 104, 2, 5, p.ink); R(142, 104, 2, 5, p.ink);
    R(132, 78, 3, 14, p.walnutHi); R(145, 78, 3, 14, p.walnutDeep);
    R(143, 94, 5, 2, p.metalHi); R(145, 96, 2, 9, p.ink);
  }

  function booth(R, x, y, w, p) {
    /* Walnut outer shell avoids a continuous black rim; only a short one-pixel
     * foot shadow anchors each booth to the floor. */
    R(x, y, w, 38, p.walnutDeep);
    R(x + (w >> 1) - 10, y + 37, 20, 1, p.shadowDark);
    /* Stepped red upholstery gives the upper corners a rounded cushion
     * profile instead of a flat inset rectangle. */
    R(x + 4, y + 2, w - 8, 1, p.redDeep);
    R(x + 2, y + 3, w - 4, 2, p.redDark);
    R(x + 3, y + 5, w - 6, 22, p.redDark);
    R(x + 5, y + 7, w - 10, 18, p.red);
    R(x + 7, y + 5, w - 14, 2, p.redMid);
    R(x + 9, y + 6, w - 18, 1, p.redHi);
    for (var i = x + 7; i < x + w - 7; i += 11) {
      R(i, y + 8, 3, 15, p.redMid); R(i + 4, y + 9, 2, 14, p.redDark);
    }
    /* Seat lip and darker front face break the long cushion into padded
     * sections without reintroducing black horizontal bands. */
    R(x + 5, y + 25, w - 10, 1, p.redMid);
    R(x + 3, y + 26, w - 6, 2, p.redDark);
    R(x + 4, y + 28, w - 8, 6, p.redDeep);
    for (var seatX = x + 7; seatX < x + w - 7; seatX += 14) {
      R(seatX, y + 28, 8, 3, p.redDark);
      R(seatX + 2, y + 28, 4, 1, p.redMid);
      R(seatX + 8, y + 28, 2, 4, p.redDeep);
    }
    R(x + 5, y + 34, w - 10, 2, p.redDeep);
    R(x + 10, y + 36, w - 20, 1, p.walnutDark);
    R(x + 8, y + 8, 2, 10, p.redHi);
  }

  function table(R, x, y, p) {
    /* Dark under-rim and quiet walnut underpaint; the pedestal starts below
     * the deeper tabletop ellipse so it cannot show through the receiving
     * surface. */
    R(x - 14, y, 28, 2, p.ink); R(x - 12, y + 1, 24, 2, p.walnutDark);
    R(x - 10, y + 3, 20, 3, p.walnut);
    R(x - 5, y + 15, 10, 2, p.ink); R(x - 4, y + 17, 8, 10, p.walnutDeep);
    R(x - 4, y + 27, 8, 1, p.shadowDark);
    R(x - 5, y + 28, 10, 1, p.walnutHi);
    R(x - 7, y + 29, 14, 2, p.shadowDark);
  }

  function chair(R, x, y, p) {
    /* Compact chair body with short local anchors; long legs previously
     * merged with the table and booth bands at native size. */
    R(x, y, 12, 13, p.ink); R(x + 2, y + 2, 8, 7, p.redDark);
    R(x + 3, y + 2, 6, 2, p.redHi); R(x + 2, y + 9, 8, 2, p.ink);
    R(x + 3, y + 10, 6, 2, p.walnutDark);
    R(x + 2, y + 12, 2, 3, p.shadowDark); R(x + 8, y + 12, 2, 3, p.shadowDark);
    R(x + 3, y + 15, 6, 1, p.shadowDark);
  }

  function drawBoothsAndTables(R, p) {
    /* Every receiving surface is laid down before furniture.  The table/chair
     * pass then restores silhouettes over the pools; the tabletop oval is
     * established before chairs so their flanking silhouettes stay readable. */
    tableFloorPool(R, 97, 72, p);
    tableFloorPool(R, 157, 94, p);
    tableFloorPool(R, 109, 121, p);
    candlePool(R, 97, 72, p); candlePool(R, 157, 94, p); candlePool(R, 109, 121, p);
    booth(R, 15, 65, 59, p); booth(R, 15, 111, 59, p); booth(R, 181, 111, 59, p);
    table(R, 97, 72, p); table(R, 157, 94, p); table(R, 109, 121, p);
    tableTopGlow(R, 97, 72, p); tableTopGlow(R, 157, 94, p); tableTopGlow(R, 109, 121, p);
    /* Chairs sit in the foreground of each tabletop.  The first pair now
     * mirrors the left/right flanking arrangement of the other groups. */
    chair(R, 80, 77, p); chair(R, 107, 77, p); 
    chair(R, 140, 99, p); chair(R, 167, 100, p);
    chair(R, 94, 128, p); chair(R, 126, 128, p);
    candleSource(R, 97, 72, p); candleSource(R, 157, 94, p); candleSource(R, 109, 121, p);
  }

  function tableFloorPool(R, x, y, p) {
    /* A warm, low-contrast ellipse begins just above the tabletop and runs
     * behind the chairs through the feet.  Warm moats replace black outlines;
     * the open checker remains the dark separator between each pool. */
    R(x - 14, y - 3, 28, 2, p.floorDark);
    R(x - 20, y - 1, 40, 2, p.floorDark);
    R(x - 22, y + 1, 44, 4, p.floorMid);
    R(x - 20, y + 5, 40, 4, p.floorMid);
    R(x - 16, y + 9, 32, 5, p.amberDeep);
    R(x - 12, y + 14, 24, 5, p.floorMid);
    R(x - 9, y + 19, 18, 4, p.floorDark);
    R(x - 6, y + 23, 12, 3, p.floorDark);
  }

  function tableTopGlow(R, x, y, p) {
    /* Final tabletop: most of the 28x16 ellipse stays dark walnut; only a
     * compact stepped amber response gathers around the candle. */
    R(x - 14, y, 28, 2, p.ink);
    R(x - 12, y + 2, 24, 2, p.walnutDark);
    R(x - 10, y + 4, 20, 2, p.walnut);
    R(x - 9, y + 6, 18, 2, p.walnutDark);
    R(x - 8, y + 8, 16, 4, p.walnut);
    R(x - 6, y + 12, 12, 2, p.walnutDark);
    /* 12px -> 10px -> 6px stepped candle response. */
    R(x - 6, y + 6, 12, 1, p.amberDeep);
    R(x - 5, y + 7, 10, 2, p.amber);
    R(x - 3, y + 9, 6, 2, p.amberHi);
    R(x - 5, y + 11, 10, 1, p.amberDeep);
    R(x - 6, y + 14, 12, 1, p.walnutDark);
    R(x - 4, y + 15, 8, 1, p.ink);
  }

  function candlePool(R, x, y, p) {
    /* Pre-pass under the tabletop: this is deliberately quieter than the
     * final oval so the tabletop and candle remain the readable focal point. */
    R(x - 12, y + 2, 24, 1, p.floorDark);
    R(x - 9, y + 3, 18, 2, p.floorMid);
    R(x - 6, y + 5, 12, 2, p.amberDeep);
    R(x - 3, y + 7, 6, 1, p.floorMid);
  }

  function candleSource(R, x, y, p) {
    /* A tiny candle sits on top of the finished tabletop; no broad gold strip
     * is allowed to overwrite the surrounding chairs or floor. */
    R(x - 2, y + 3, 4, 2, p.amberDeep);
    R(x - 1, y + 1, 2, 3, p.amberHi);
    R(x, y, 1, 2, p.amberWhite);
  }

  function drawPiano(R, p) {
    /* Upright piano borrowed from A.  It sits below the neon plate now, so
     * the ROADHOUSE lettering has a clean uninterrupted silhouette. */
    R(39, 48, 25, 30, p.ink); R(42, 50, 19, 25, p.walnutDeep);
    R(44, 52, 15, 12, p.walnut); R(45, 53, 13, 2, p.walnutHi);
    R(44, 65, 17, 4, p.ink); R(45, 66, 15, 2, p.amberHi);
    for (var x = 46; x < 59; x += 3) R(x, 66, 1, 2, p.walnutDeep);
    R(42, 72, 19, 3, p.walnutMid); R(43, 75, 3, 5, p.ink); R(57, 75, 3, 5, p.ink);
    R(37, 75, 30, 3, p.ink);
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
    R(104, 141, 48, 35, p.ink); R(107, 144, 42, 32, p.walnutDeep);
    R(109, 146, 17, 28, p.redDark); R(130, 146, 17, 28, p.redDark);
    R(111, 148, 13, 16, p.walnut); R(132, 148, 13, 16, p.walnut);
    R(113, 150, 9, 9, p.glass); R(134, 150, 9, 9, p.glass);
    R(114, 151, 7, 7, p.glassHi); R(135, 151, 7, 7, p.glassHi);
    R(117, 152, 2, 5, p.amberHi); R(138, 152, 2, 5, p.amberHi);
    R(126, 144, 4, 32, p.black); R(126, 144, 1, 32, p.walnutHi);
    R(110, 172, 15, 3, p.walnutMid); R(131, 172, 15, 3, p.walnutMid);
    R(108, 175, 40, 3, p.walnutHi);
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

  function drawShadow(R, prop, p) {
    var s = prop.shadow, foot = prop.footY;
    R(s[0] + 2, foot + 2, Math.max(1, s[2] - 4), 1, p.shadow);
    R(s[0] + 1, foot + 1, Math.max(1, s[2] - 2), 1, p.shadowMid);
    R(s[0] + 4, foot, Math.max(1, s[2] - 8), 1, p.shadowDark);
  }

  function drawProp(R, prop, p) {
    /* Row 3 is collision scaffolding for the canonical map.  Its authored
     * north furniture was formerly painted a second time at y=48, across the
     * stage front and the mic floor.  The room's actual tables/chairs are
     * placed by drawBoothsAndTables below the apron; keep the footprints for
     * collision/depth contracts but do not duplicate their pixels. */
    if (/^northTable/.test(prop.id) || /^northChairs/.test(prop.id)) return;
    if (/^southTable/.test(prop.id)) {
      var sx = prop.id === 'southTableWest' ? 63 : prop.id === 'southTableMiddle' ? 127 : 191;
      table(R, sx, 112, p);
    } else if (prop.id === 'northChairsWest') { chair(R, 80, 49, p); chair(R, 99, 49, p); }
    else if (prop.id === 'northChairsMiddle') { chair(R, 144, 49, p); chair(R, 163, 49, p); }
    else if (prop.id === 'northChairsEast') { chair(R, 208, 49, p); }
    else if (prop.id === 'southChairsWest') { chair(R, 80, 113, p); chair(R, 99, 113, p); }
    else if (prop.id === 'southChairsMiddle') { chair(R, 144, 113, p); chair(R, 163, 113, p); }
    else if (prop.id === 'southChairsEast') { chair(R, 208, 113, p); }
    else if (prop.id === 'barFurniture') { /* composite bar is architecture */ }
    else if (prop.id === 'barStoolWest') chair(R, 163, 91, p);
    else if (prop.id === 'barStoolEast') chair(R, 229, 91, p);
  }

  function draw(ctx, cx, cy) {
    var R = rectPainter(ctx, cx, cy), p = palette;
    R(0, 0, 256, 192, p.ink);
    drawWall(R, p);
    drawStage(R, p);
    drawNeon(R, p, ctx, Math.round(cx || 0), Math.round(cy || 0));
    drawTrophies(R, p);
    drawPiano(R, p);
    drawBar(R, p);
    drawStageApron(R, p);
    drawPayPhone(R, p);
    drawBoothsAndTables(R, p);
    jukebox(R, p);
    drawBottomDoor(R, p);
    for (var i = 0; i < definitions.length; i++) {
      /* The canonical row-3 furniture cells are kept in definitions for the
       * collision contract, but their old y=64 contact shadows were part of
       * the stage-front clutter removed in this pass. */
      if (/^northTable/.test(definitions[i].id) || /^northChairs/.test(definitions[i].id)) continue;
      drawShadow(R, definitions[i], p);
    }
    drawPlayerContact(R, p);
    for (var j = 0; j < definitions.length; j++) drawProp(R, definitions[j], p);
  }

  function foreground(ctx, cx, cy, minFoot, maxFoot) {
    minFoot = minFoot == null ? -Infinity : minFoot;
    maxFoot = maxFoot == null ? Infinity : maxFoot;
    var R = rectPainter(ctx, cx, cy), p = palette;
    for (var i = 0; i < definitions.length; i++) {
      var prop = definitions[i];
      if (prop.footY >= minFoot && prop.footY < maxFoot) drawProp(R, prop, p);
    }
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
