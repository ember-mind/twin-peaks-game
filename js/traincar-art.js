/* traincar-art.js — Footbridge / traincar clearing, authored at 384x192 native
 * pixels (24x12 tiles, one screen tall, horizontal scroll).
 * One authored state: late afternoon, overcast. No directional shadow, no dusk
 * grade, no lit opening. Flat integer rectangles only.
 *
 * Zones west to east: plank footbridge over the creek, the clearing with the
 * roof-cut freight car at the dead end of the rails, the north cut with the
 * ONE EYED JACKS sign. The single warm accent on the whole map is the ember
 * in the stove; the county tape is the one pale saturated note.
 *
 * The two conditional marks (ring on the beam, post-report tape/stake) are
 * driven by the scene module, which owns the narrative read: draw()/foreground()
 * take an optional state object { ringHidden: bool, overlay: bool }. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;
  var MAP_W = 384, MAP_H = 192;

  var palette = {
    /* Vegetation — the station exterior family, evergreen wall darkest. */
    forestDeep: '#1a2b23', forest: '#233a2f', hedge: '#2f4d3b', hedgeHi: '#3e6248',
    cutDark: '#131f19',
    /* Ballast / wet gravel. */
    ballast: '#5c6168', ballastDark: '#474b52', ballastPale: '#7f848b',
    ballastMid: '#686d74',
    tie: '#3c3a36', steel: '#aeb6b3', steelDark: '#7d8785',
    /* Dead grass. */
    grass: '#7c7850', grassHi: '#8d8a5e', grassShade: '#68653f',
    path: '#635f42', track: '#514c37',
    /* Creek slate. */
    creek: '#4f5e6a', creekDeep: '#45525d', ripple: '#5f7080', bank: '#3d4852',
    /* Grey timber: bridge deck, parapets, crossbeam, stakes. */
    plankDark: '#6e685b', plank: '#7d7667', plankWorn: '#948b79', joint: '#4d483e',
    /* Car body. */
    carBase: '#6e3a2e', carMid: '#8a4a38', carShade: '#5a2e24',
    carPanel: '#a08a7a', carRecess: '#63332a', rust: '#3f2219',
    trucks: '#1f1d1c', wheel: '#151312',
    /* Interior dust film — quietest plane inside the car. */
    dust: '#89867f', dustShade: '#7c7972', dustDeep: '#5a5854', contact: '#6f6c68',
    /* Earth, paper, cards. */
    earth: '#4a3a2c', earthHi: '#5e4a37', paper: '#d8d6c6', pip: '#8f4a3e',
    fabric: '#8a7a52', fabricHi: '#9c8d63',
    /* Stove: the only warm accent on the map. */
    stove: '#1c1b1a', stoveHi: '#2a2826', ash: '#8f8d86', ember: '#c2622a',
    /* Tape / stakes / ring. */
    tape: '#d9d4b8', stakeWood: '#948b79', ring: '#e2dcc4', ringRim: '#b8b09a',
    /* Sign, sheet metal. */
    sign: '#7f6a4c', signShade: '#5e4d38',
    metalCool: '#5d666b', metalMid: '#737c81', metalHi: '#a8b0b3'
  };

  /* Car footprint in tiles: cols 9..17, rows 2..7. Rows 2-3 are the north wall
   * (48 px painted face, y 16..64); rows 4..6 are the walkable interior with a
   * one-tile rim east and west; row 7 is the south face with the open door. */
  var CAR = { x0: 9, x1: 17, y0: 2, y1: 7 };
  var CAR_PX = { x: CAR.x0 * TILE, y: CAR.y0 * TILE,
                 w: (CAR.x1 - CAR.x0 + 1) * TILE, h: (CAR.y1 - CAR.y0 + 1) * TILE };
  var INTERIOR = { x0: 10, x1: 16, y0: 4, y1: 6 };

  function rect(x0, y0, x1, y1) {
    var cells = [], x, y;
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) cells.push([x, y]);
    return cells;
  }
  function ring(x0, y0, x1, y1, skip) {
    var cells = [], x, y, key;
    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        if (x > x0 && x < x1 && y > y0 + 1 && y < y1) continue;
        key = x + ',' + y;
        if (skip && skip.indexOf(key) >= 0) continue;
        cells.push([x, y]);
      }
    }
    return cells;
  }

  function without(cells, skip) {
    return cells.filter(function (c) { return skip.indexOf(c[0] + ',' + c[1]) < 0; });
  }

  /* The fourteen authored definitions of the translation brief. `solid` states
   * what the collision map must say about the cells: the contract test reads it
   * back against js/maps.js so the art can never claim a footprint the player
   * can walk through (Bible §8). `noFootprint` marks wall-face-only marks (the
   * stove pipe, the sign post, the bridge parapets, the stakes). */
  var definitions = [
    { id: 'creek', solid: true,
      cells: without(rect(3, 2, 4, 10), ['3,7', '4,7']),
      bounds: [48, 32, 32, 144], shadow: [48, 174, 32, 2] },
    { id: 'bridge', solid: false, cells: rect(3, 7, 4, 7),
      bounds: [48, 100, 32, 44], shadow: [48, 128, 32, 2] },
    { id: 'stake', solid: false, noFootprint: true, cells: [[2, 6]],
      bounds: [36, 98, 7, 12], shadow: [37, 110, 4, 1] },
    { id: 'rails', solid: false, cells: rect(5, 7, 8, 7),
      bounds: [81, 116, 211, 24], shadow: [81, 138, 211, 2] },
    { id: 'car', solid: true,
      cells: ring(CAR.x0, CAR.y0, CAR.x1, CAR.y1, ['13,7', '14,7']),
      interior: rect(INTERIOR.x0, INTERIOR.y0, INTERIOR.x1, INTERIOR.y1).concat([[13, 7], [14, 7]]),
      bounds: [144, 16, 144, 124], shadow: [144, 138, 144, 2] },
    { id: 'mound', solid: false, cells: [[13, 6]],
      bounds: [207, 98, 18, 12], shadow: [207, 110, 18, 2] },
    { id: 'crossbeam', solid: false, cells: rect(12, 5, 14, 5),
      bounds: [192, 84, 48, 7], shadow: [192, 91, 48, 2] },
    { id: 'seat', solid: false, cells: [[10, 6]],
      bounds: [160, 96, 17, 14], shadow: [160, 110, 17, 2] },
    { id: 'sheet', solid: false, cells: [[16, 4]],
      bounds: [254, 66, 18, 12], shadow: [254, 78, 18, 2] },
    { id: 'stove', solid: true, cells: [[12, 3]],
      bounds: [193, 20, 14, 42], shadow: [193, 62, 14, 2] },
    { id: 'signOej', solid: true, noFootprint: true, cells: [[20, 2]],
      bounds: [306, 22, 32, 36], shadow: [322, 58, 4, 1] },
    { id: 'tracks', solid: false,
      cells: [[18, 6], [18, 5], [19, 5], [19, 4], [20, 4], [20, 3], [21, 3], [21, 2], [21, 1]],
      bounds: [288, 24, 62, 80], shadow: [288, 102, 4, 1] },
    { id: 'overlay', solid: false, cells: [[13, 7], [14, 7], [4, 7]],
      bounds: [64, 108, 184, 20], shadow: [204, 126, 44, 1] },
    { id: 'trees', solid: true,
      cells: rect(0, 0, 23, 1).concat(rect(0, 11, 23, 11))
        .concat([[0, 2], [1, 2], [2, 2], [5, 2], [6, 2], [7, 2], [8, 2], [18, 2], [19, 2], [22, 2], [23, 2]])
        .concat(rect(0, 3, 0, 6)).concat(rect(0, 8, 0, 10))
        .concat(rect(23, 3, 23, 10)),
      bounds: [0, 0, 384, 192], shadow: [0, 190, 384, 2] }
  ];
  /* (21,0) and (21,1) are the cut through the tree line: they carry the door
   * and the path, so they are removed from the tree footprint. */
  definitions[13].cells = without(definitions[13].cells, ['21,0', '21,1']);

  function southEdge(cells) {
    var row = -1, i;
    for (i = 0; i < cells.length; i++) if (cells[i][1] > row) row = cells[i][1];
    return (row + 1) * TILE;
  }
  definitions.forEach(function (prop) { prop.footY = southEdge(prop.cells); });

  function painter(ctx, cx, cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    return function R(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x - cx, y - cy, w, h);
    };
  }

  /* ---- vegetation ------------------------------------------------------ */

  function bandPainter(R, y0, y1) {
    /* Conifer stamps are drawn as whole trees and clipped to the band they
     * belong to: the wall never spills onto walkable ground. */
    return function (x, y, w, h, c) {
      var top = y, bottom = y + h;
      if (top < y0) top = y0;
      if (bottom > y1) bottom = y1;
      if (bottom <= top) return;
      R(x, top, w, bottom - top, c);
    };
  }

  function conifer(B, x, y, p, lit) {
    /* Base of the wall is the deepest value; every stamp is a step lighter, so
     * each tree reads as its own silhouette instead of a green field. */
    var body = lit ? p.hedge : p.forest;
    var tip = lit ? p.hedgeHi : p.hedge;
    B(x + 6, y, 3, 4, body);
    B(x + 4, y + 3, 7, 4, body);
    B(x + 2, y + 6, 11, 5, body);
    B(x, y + 10, 15, 6, body);
    B(x + 5, y + 2, 2, 2, tip);
    B(x + 3, y + 7, 3, 2, tip);
    B(x + 8, y + 12, 3, 2, tip);
    B(x - 1, y + 15, 17, 4, p.forestDeep);
  }

  function treeWall(R, x, w, y, h, p) {
    /* Stamps overlap every 8 px at four heights: the ridge is serrated, never
     * a flat field, and the wall meets the ground on a hard dark line. */
    R(x, y, w, h, p.forestDeep);
    var B = bandPainter(R, y, y + h), i, k = Math.floor(x / 8) % 4;
    for (i = x - 8; i < x + w; i += 8) {
      conifer(B, i, y + [0, 6, 3, 8][k % 4], p, k % 2 === 0);
      k++;
    }
    R(x, y + h - 3, w, 3, p.forestDeep);
    for (i = x + 3; i + 10 <= x + w; i += 19) {
      R(i, y + h - 9, 10, 6, p.forest);
      R(i + 2, y + h - 8, 3, 2, p.hedge);
    }
  }

  function treeColumn(R, x, y, h, p) {
    /* Side walls: the same family seen edge-on, one crown every 13 px. */
    R(x, y, 16, h, p.forestDeep);
    var i, k = 0;
    for (i = y; i < y + h - 6; i += 13) {
      R(x + (k % 2 ? 0 : 2), i + 1, 14, 10, k % 2 ? p.forest : p.hedge);
      R(x + (k % 2 ? 2 : 5), i + 3, 4, 3, k % 2 ? p.hedge : p.hedgeHi);
      R(x + (k % 2 ? 9 : 3), i + 8, 5, 3, p.forestDeep);
      k++;
    }
    R(x, y + h - 4, 16, 4, p.forestDeep);
  }

  function trees(R, p) {
    /* North wall, 48 px face (rows 0-2) wherever row 2 is solid; 32 px where
     * the creek, the car or the sign own row 2. */
    treeWall(R, 0, 48, 0, 48, p);          // cols 0-2, town side
    treeWall(R, 48, 32, 0, 32, p);         // cols 3-4, the creek runs out from under
    treeWall(R, 80, 64, 0, 48, p);         // cols 5-8
    treeWall(R, 144, 144, 0, 32, p);       // cols 9-17, behind the car's north wall
    treeWall(R, 288, 32, 0, 48, p);        // cols 18-19
    treeWall(R, 320, 16, 0, 32, p);        // col 20, the sign stands on row 2
    treeWall(R, 352, 32, 0, 48, p);        // cols 22-23
    /* The cut: a one-tile gap with a darker interior, the only opening. */
    R(336, 0, 16, 26, p.cutDark);
    R(336, 0, 2, 26, p.forestDeep); R(350, 0, 2, 26, p.forestDeep);
    R(338, 4, 4, 12, p.forest); R(346, 9, 4, 10, p.forest);
    R(338, 20, 12, 3, p.hedge); R(341, 21, 3, 2, p.hedgeHi);
    /* Side walls down the frame. */
    treeColumn(R, 0, 48, 128, p);
    treeColumn(R, 368, 48, 128, p);
  }

  function southTrees(R, p) {
    treeWall(R, 0, 384, 176, 16, p);
  }

  /* ---- ground ---------------------------------------------------------- */

  function ground(R, p) {
    /* Two ground materials only: dead grass is the field, ballast is the
     * worked ground around the rails and the clearing south of the door. */
    R(0, 0, MAP_W, MAP_H, p.grass);
    /* Grass shade reads as drifts, not as blocks: two or three rects each. */
    [[18, 58, 26, 14], [26, 68, 16, 10],
     [296, 50, 32, 16], [304, 64, 22, 10],
     [300, 100, 28, 14], [292, 112, 18, 9],
     [16, 138, 22, 12], [26, 148, 18, 9],
     [86, 34, 22, 10], [98, 42, 14, 7],
     [18, 96, 20, 12], [28, 106, 14, 8],
     [84, 84, 18, 11], [94, 94, 12, 7]].forEach(function (g) {
      R(g[0], g[1], g[2], g[3], p.grassShade);
    });
    [[24, 54], [36, 74], [92, 30], [104, 52], [300, 44], [320, 86], [308, 126],
     [24, 132], [38, 158], [330, 60], [292, 92], [316, 150], [86, 62], [110, 84],
     [292, 166], [332, 118]].forEach(function (t) {
      R(t[0], t[1], 2, 3, p.grassHi);
      R(t[0] + 3, t[1] + 1, 2, 2, p.grassShade);
    });

    /* Ballast field: dark bed, mid patches, a handful of placed pale stones.
     * The worked gravel, not the dead grass, carries the clearing: it wraps
     * the rails, the door approach and the car's two ends. */
    R(82, 110, 232, 66, p.ballastDark);
    R(74, 120, 10, 48, p.ballastDark);
    R(314, 118, 14, 48, p.ballastDark);
    /* No shoulder plate north of the rails: west of the car the dead grass
     * runs down to the ballast bed, exactly as in the Golden Concept. The
     * strip that remains is the bed's own gravel, stepped, never a slab. */
    R(84, 112, 44, 6, p.ballastDark);
    R(120, 108, 30, 10, p.ballastDark);
    R(288, 104, 26, 30, p.ballastDark);
    R(90, 168, 220, 8, p.ballastDark);
    [[88, 116, 220, 44], [92, 158, 200, 16], [104, 172, 178, 4],
     [88, 113, 38, 4], [124, 110, 24, 7],
     [292, 110, 24, 36], [80, 128, 12, 32]].forEach(function (b) {
      R(b[0], b[1], b[2], b[3], p.ballast);
    });
    [[118, 148, 30, 9], [232, 158, 26, 8], [176, 130, 22, 6],
     [150, 166, 34, 7], [258, 140, 18, 6], [96, 114, 18, 4],
     [128, 111, 14, 5]].forEach(function (b) {
      R(b[0], b[1], b[2], b[3], p.ballastMid);
    });
    [[150, 142, 5, 3], [196, 166, 6, 3], [258, 134, 4, 3], [120, 132, 5, 2],
     [276, 152, 5, 3], [212, 148, 4, 3], [104, 160, 6, 3], [240, 170, 5, 3],
     [166, 156, 4, 2], [292, 146, 5, 3], [134, 160, 4, 2], [186, 148, 4, 3],
     [222, 166, 5, 2], [268, 160, 4, 2], [110, 142, 4, 2], [252, 150, 5, 2],
     [178, 172, 4, 2], [206, 136, 4, 2],
     [88, 114, 4, 2], [106, 113, 5, 2], [122, 112, 4, 2], [138, 110, 5, 3],
     [300, 128, 4, 2], [306, 152, 5, 3]]
      .forEach(function (s2) {
      R(s2[0], s2[1], s2[2], s2[3], p.ballastPale);
    });
    [[128, 138, 6, 3], [204, 158, 7, 3], [246, 128, 5, 3], [164, 144, 5, 2],
     [284, 168, 6, 3], [142, 172, 5, 2], [100, 115, 5, 2], [132, 113, 6, 3]]
      .forEach(function (s3) {
      R(s3[0], s3[1], s3[2], s3[3], p.ballastDark);
    });

    /* The worn path to the cut: bare earth, narrow, in the col-21 column. */
    R(340, 24, 7, 20, p.track);
    R(340, 48, 7, 26, p.track);
    R(341, 78, 6, 22, p.track);
    R(340, 104, 7, 24, p.track);
    R(342, 28, 3, 14, p.path);
    R(342, 84, 3, 12, p.path);
    R(342, 110, 3, 14, p.path);
  }

  function creek(R, p) {
    /* Flat slate plane, a darker channel down the middle, two pale ripple
     * clusters, and a hard 1 px bank line each side over a wet stone strip. */
    R(48, 32, 32, 144, p.creek);
    R(55, 32, 18, 144, p.creekDeep);
    R(48, 32, 1, 144, p.bank);
    R(79, 32, 1, 144, p.bank);
    R(44, 32, 4, 144, p.ballastDark);
    R(80, 32, 4, 144, p.ballastDark);
    R(45, 44, 3, 10, p.ballastMid); R(45, 96, 3, 14, p.ballastMid);
    R(80, 62, 3, 12, p.ballastMid); R(80, 140, 3, 16, p.ballastMid);
    R(51, 52, 6, 2, p.ripple);
    R(66, 88, 5, 2, p.ripple);
    R(53, 150, 7, 2, p.ripple);
    R(70, 118, 4, 2, p.ripple);
  }

  /* ---- bridge, stake, rails -------------------------------------------- */

  function bridge(R, p) {
    /* Deck: east half weathered dark, west (town) half two values paler. */
    R(48, 112, 32, 16, p.plank);
    R(64, 112, 16, 16, p.plankDark);
    R(48, 112, 16, 16, p.plankWorn);
    [52, 57, 62, 67, 72, 77].forEach(function (x) { R(x, 112, 1, 16, p.joint); });
    R(47, 110, 2, 20, p.joint);
    R(79, 110, 2, 20, p.joint);
    R(48, 112, 32, 1, p.plankWorn);
    /* Contact shadow where the deck meets the water. */
    R(48, 128, 32, 2, p.bank);
    R(48, 108, 32, 2, p.bank);
    /* Parapets: posts plus a top and a lower rail, wall-face-only on rows 6
     * and 8, so the deck stays the only walkable mark. */
    [48, 63, 78].forEach(function (x) {
      R(x, 103, 2, 9, p.joint);
      R(x, 103, 1, 9, p.plankDark);
      R(x, 128, 2, 10, p.joint);
      R(x, 128, 1, 10, p.plankDark);
    });
    R(48, 103, 32, 2, p.plankDark); R(48, 103, 32, 1, p.plank);
    R(48, 136, 32, 2, p.plankDark); R(48, 136, 32, 1, p.plank);
  }

  function stake(R, p) {
    /* County survey stake on the town bank: where Ronette was found. */
    R(37, 96, 3, 15, p.joint);
    R(37, 96, 1, 15, p.stakeWood);
    R(34, 98, 9, 3, p.tape);
    R(34, 101, 9, 1, p.plankWorn);
    R(36, 111, 5, 2, p.grassShade);
  }

  function rails(R, p) {
    /* Ballast bed, ties, two steel lines. The upper line disappears under the
     * car's south face; the lower one runs on to the buffer block at the east
     * trucks and stops there. Nothing continues east. */
    R(81, 117, 211, 22, p.ballastDark);
    R(81, 119, 211, 18, p.tie);
    var x;
    for (x = 82; x < 290; x += 8) {
      R(x, 119, 4, 18, p.ballastDark);
      R(x, 119, 4, 1, p.ballastMid);
    }
    /* The two lines start at the east end of the planks and run unbroken to
     * the car's west face and on under it: the spur is one continuous read
     * from the bridge to the dead end. */
    R(81, 123, 205, 2, p.steelDark);
    R(81, 123, 205, 1, p.steel);
    R(81, 131, 205, 2, p.steelDark);
    R(81, 131, 205, 1, p.steel);
    /* Buffer block: the rails end here, under the east trucks. */
    R(276, 126, 14, 12, p.trucks);
    R(276, 126, 14, 2, p.steelDark);
    R(279, 130, 8, 4, p.wheel);
  }

  /* ---- the car --------------------------------------------------------- */

  function carNorthWall(R, p) {
    /* 48 px face, y 16..64: the interior-wall height of the Bible, carried by
     * the roof-cut rim. Top rail, boarded body with two recessed panels, sill. */
    R(144, 16, 144, 5, p.carShade);
    R(144, 20, 144, 1, p.carMid);
    R(144, 21, 144, 37, p.carBase);
    var x;
    for (x = 156; x < 288; x += 12) R(x, 21, 1, 37, p.carShade);
    R(150, 25, 42, 29, p.carRecess);
    R(150, 25, 42, 1, p.carShade);
    R(214, 25, 68, 29, p.carRecess);
    R(214, 25, 68, 1, p.carShade);
    R(163, 28, 2, 14, p.rust);
    R(232, 32, 2, 18, p.rust);
    R(144, 58, 144, 6, p.carShade);
    R(144, 58, 144, 1, p.carMid);
    R(144, 16, 4, 48, p.carShade);
    R(284, 16, 4, 48, p.carShade);
  }

  function carInterior(R, p) {
    /* Pale grey dust film: the quietest plane inside, unbroken between the
     * corners and the centre. Rim shade only where the walls meet it. */
    R(160, 64, 112, 48, p.dust);
    R(160, 64, 112, 2, p.dustShade);
    R(160, 64, 2, 48, p.dustShade);
    R(270, 64, 2, 48, p.dustShade);
    R(160, 110, 112, 2, p.dustShade);
    /* West and east rims, one tile: outer shell, boarded body, inner face. */
    R(144, 64, 16, 48, p.carShade);
    R(148, 64, 9, 48, p.carBase);
    R(157, 64, 3, 48, p.carMid);
    R(272, 64, 16, 48, p.carShade);
    R(272, 64, 3, 48, p.carMid);
    R(275, 64, 9, 48, p.carBase);
    /* Roof cut: a 2 px lighter edge runs along the whole rim, so the missing
     * roof reads as a cut and not as a room seen from above. */
    R(144, 64, 16, 2, p.carMid);
    R(272, 64, 16, 2, p.carMid);
    R(144, 110, 16, 2, p.carMid);
    R(272, 110, 16, 2, p.carMid);
    var y;
    for (y = 72; y < 112; y += 12) {
      R(148, y, 9, 1, p.carShade);
      R(275, y, 9, 1, p.carShade);
    }
  }

  function carSouthFace(R, p) {
    R(144, 112, 144, 16, p.carBase);
    R(144, 112, 144, 3, p.carMid);
    R(144, 114, 144, 1, p.carShade);
    var x;
    for (x = 156; x < 288; x += 12) R(x, 115, 1, 11, p.carShade);
    /* One paler faded panel, east half, past the door. */
    R(246, 116, 36, 10, p.carPanel);
    R(246, 116, 36, 1, p.carShade);
    R(246, 125, 36, 1, p.carShade);
    R(196, 117, 2, 8, p.rust);
    R(144, 126, 144, 2, p.carShade);
    /* Trucks and wheels: black, under the body, clear of the door column. */
    [152, 244].forEach(function (t) {
      R(t, 126, 34, 12, p.trucks);
      R(t, 126, 34, 1, p.steelDark);
      R(t + 4, 132, 7, 6, p.wheel);
      R(t + 18, 132, 7, 6, p.wheel);
      R(t + 5, 133, 5, 1, p.steelDark);
      R(t + 19, 133, 5, 1, p.steelDark);
    });
  }

  function carDoorThreshold(R, p) {
    /* Open sliding door on the south face: the dark of the interior threshold
     * read from outside, and the pale step the player crosses.
     * Ground pass only — an actor crossing it stands in it. */
    R(208, 110, 32, 18, p.dustDeep);
    R(208, 110, 32, 3, p.carShade);
    R(208, 122, 32, 6, p.dustShade);
    R(208, 122, 32, 1, p.dust);
    R(208, 113, 6, 9, p.trucks);
  }

  function carDoorFrame(R, p) {
    /* The two jambs, the header and the door track: the only car marks that
     * cover an actor standing in the doorway. */
    R(205, 108, 3, 20, p.carShade);
    R(240, 108, 3, 20, p.carShade);
    R(205, 108, 38, 3, p.carShade);
    R(205, 108, 38, 1, p.carMid);
  }

  /* ---- interior props -------------------------------------------------- */

  function stove(R, p) {
    /* Small black iron box on the north rim, pipe rising onto the wall face.
     * One ash cluster and one ember: the only warm accent on the map. */
    R(198, 20, 3, 26, p.stove);
    R(198, 20, 1, 26, p.stoveHi);
    R(193, 46, 14, 16, p.stove);
    R(193, 46, 14, 2, p.stoveHi);
    R(196, 51, 9, 8, p.stoveHi);
    R(197, 52, 3, 2, p.ash);
    R(200, 55, 3, 3, p.ember);
    R(193, 62, 14, 2, p.carShade);
  }

  function mound(R, p) {
    R(206, 101, 20, 9, p.earth);
    R(209, 97, 14, 5, p.earthHi);
    R(212, 95, 8, 3, p.earth);
    R(217, 98, 4, 3, p.paper);
    R(217, 101, 4, 1, p.dustShade);
    R(206, 110, 20, 2, p.contact);
  }

  function crossbeam(R, p, state) {
    R(190, 83, 52, 8, p.plank);
    R(190, 83, 52, 1, p.plankWorn);
    R(190, 81, 4, 12, p.joint);
    R(238, 81, 4, 12, p.joint);
    R(206, 83, 1, 8, p.joint);
    R(226, 83, 1, 8, p.joint);
    R(190, 91, 52, 2, p.contact);
    /* The ring sits at the exact centre of the beam and leaves it with the
     * custody decision: both S1 branches take it off the crossbeam. */
    if (!(state && state.ringHidden)) {
      R(212, 83, 7, 7, p.ringRim);
      R(213, 84, 5, 5, p.ring);
      R(215, 86, 1, 1, p.joint);
    }
  }

  function seat(R, p) {
    /* Torn bench, thrown against the south-west corner. */
    R(160, 95, 18, 5, p.carShade);
    R(160, 100, 18, 8, p.carBase);
    R(160, 100, 18, 1, p.carMid);
    R(165, 101, 7, 5, p.fabric);
    R(165, 101, 7, 1, p.fabricHi);
    R(161, 108, 3, 3, p.carShade);
    R(174, 108, 3, 3, p.carShade);
    R(160, 110, 18, 2, p.contact);
    /* Two damp cards at its foot, one with a pip. */
    R(163, 106, 5, 3, p.paper);
    R(169, 107, 5, 3, p.paper);
    R(171, 108, 1, 1, p.pip);
  }

  function sheet(R, p) {
    R(252, 65, 20, 13, p.metalCool);
    [254, 258, 262, 266, 269].forEach(function (x) { R(x, 67, 2, 10, p.metalMid); });
    R(254, 66, 16, 1, p.metalHi);
    R(252, 78, 20, 2, p.contact);
  }

  /* ---- north cut ------------------------------------------------------- */

  function tracks(R, p) {
    /* Old foot marks leaving the ballast at the car's north-east corner and
     * climbing to the cut. The only diagonals on the map. */
    [[290, 100], [296, 92], [302, 84], [308, 76], [314, 68], [320, 60],
     [327, 52], [337, 44], [341, 34], [344, 26]].forEach(function (m, i) {
      R(m[0], m[1], i % 2 ? 4 : 3, 3, p.track);
    });
  }

  function signOej(R, p, ctx, cx, cy) {
    /* Weathered board shaped as an arrow: it points at the cut, it does not
     * stand instead of it. Post height is wall-face-only. */
    R(322, 46, 4, 12, p.signShade);
    R(322, 46, 1, 12, p.stakeWood);
    R(306, 22, 26, 24, p.sign);
    R(332, 26, 3, 16, p.sign);
    R(335, 30, 3, 8, p.sign);
    R(306, 22, 26, 1, p.paper);
    R(306, 45, 26, 1, p.signShade);
    R(332, 26, 3, 1, p.paper);
    if (ctx && GAME.RetroFont && GAME.RetroFont.draw) {
      var ox = 318 - Math.round(cx || 0), oy = -Math.round(cy || 0);
      GAME.RetroFont.draw(ctx, 'ONE', ox, oy + 25, p.paper, { scale: 1, align: 'center' });
      GAME.RetroFont.draw(ctx, 'EYED', ox, oy + 32, p.paper, { scale: 1, align: 'center' });
      GAME.RetroFont.draw(ctx, 'JACKS', ox, oy + 39, p.paper, { scale: 1, align: 'center' });
    }
  }

  /* ---- post-report overlay --------------------------------------------- */

  function overlayDoorTape(R, p) {
    /* Tape across the door: it covers whoever stands in the doorway. */
    R(204, 116, 44, 3, p.tape);
    R(204, 122, 44, 2, p.tape);
  }

  function overlayStake(R, p) {
    /* Second county stake, bridge east end. Painted on the flag; there is
     * never a second map. */
    R(72, 110, 3, 14, p.stakeWood);
    R(72, 110, 1, 14, p.plankWorn);
    R(70, 112, 7, 2, p.tape);
    R(70, 116, 7, 2, p.tape);
  }

  /* ---- assembly -------------------------------------------------------- */

  function draw(ctx, cx, cy, state) {
    var R = painter(ctx, cx, cy), p = palette;
    ground(R, p);
    creek(R, p);
    rails(R, p);
    tracks(R, p);
    trees(R, p);
    bridge(R, p);
    stake(R, p);
    carNorthWall(R, p);
    carInterior(R, p);
    stove(R, p);
    sheet(R, p);
    crossbeam(R, p, state);
    seat(R, p);
    mound(R, p);
    carSouthFace(R, p);
    carDoorThreshold(R, p);
    carDoorFrame(R, p);
    signOej(R, p, ctx, cx, cy);
    if (state && state.overlay) { overlayStake(R, p); overlayDoorTape(R, p); }
    southTrees(R, p);
  }

  /* Depth pass: only the marks whose south edge can fall below an actor's foot
   * line are repainted. Contact shadows stay in the ground pass. */
  var props = [
    { id: 'carDoorFrame', footY: 128, paint: function (R, p, state) {
      carDoorFrame(R, p);
      if (state && state.overlay) overlayDoorTape(R, p);
    } },
    { id: 'bridgeSouthRail', footY: 144, paint: function (R, p) {
      [48, 63, 78].forEach(function (x) { R(x, 128, 2, 10, p.joint); R(x, 128, 1, 10, p.plankDark); });
      R(48, 136, 32, 2, p.plankDark); R(48, 136, 32, 1, p.plank);
    } },
    { id: 'southTrees', footY: 192, paint: function (R, p) { southTrees(R, p); } }
  ];

  function foreground(ctx, cx, cy, minFoot, maxFoot, state) {
    minFoot = minFoot == null ? -Infinity : minFoot;
    maxFoot = maxFoot == null ? Infinity : maxFoot;
    var R = painter(ctx, cx, cy), i;
    for (i = 0; i < props.length; i++) {
      if (props[i].footY < minFoot || props[i].footY >= maxFoot) continue;
      props[i].paint(R, palette, state);
    }
  }

  GAME.TraincarArt = {
    draw: draw,
    foreground: foreground,
    definitions: definitions,
    props: props,
    palette: palette,
    car: CAR,
    carPixels: CAR_PX,
    interior: INTERIOR,
    width: MAP_W,
    height: MAP_H
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.TraincarArt;
})();
