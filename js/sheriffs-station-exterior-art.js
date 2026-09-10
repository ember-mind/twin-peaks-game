/* Sheriff's station exterior — authored at 256x192 native pixels.
 * Same street as the Double R lot: identical slate asphalt, concrete apron and
 * conifer family; the station owns forest green, oak trim, stone and steel.
 * Walkable ground stays quiet (apron y=112..128, lot y=128..176, south varco
 * x=80..176); every solid cell carries a prop. The approach column x=112..144
 * is empty of props and marks from y=112 to the bottom edge.
 * Deterministic integer rectangles only: no paths, gradients or texture noise. */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};

  function palette() {
    var diner = GAME.Retro2D && GAME.Retro2D.interiorKit &&
      GAME.Retro2D.interiorKit.materials.diner || {};
    return {
      /* Shared world families, taken from the kit exactly like the diner lot. */
      ink: diner.ink || '#292b26', cream: diner.cream || '#f4e6c8',
      creamShade: diner.creamShade || '#cfbc92', gold: diner.gold || '#e9bd5d',
      green: diner.green || '#223b2f', leaf: diner.leaf || '#567345',
      leafHi: diner.leafHi || '#879452',
      metal: diner.metal || '#81918b', metalHi: diner.metalHi || '#d9dfc9',
      /* Station accents. */
      roof: '#2c3b33', roofDark: '#1f2a26', roofRim: '#3e4f45', roofSeam: '#233029',
      forest: '#233a2f', board: '#8b9479', boardShade: '#7a836a', boardHi: '#9ea78c',
      oak: '#9a6a3e', oakHi: '#b07c4a', oakDark: '#5a3a22', oakDeep: '#2f2a24',
      stone: '#8d8a80', stoneHi: '#a3a096', stoneJoint: '#6f6d65',
      steel: '#aeb6b3', steelHi: '#cfd6d3', steelDark: '#7d8785',
      glass: '#b9c9b8', glassPale: '#dcebdc', glassDeep: '#3a4a44',
      glassRefl: '#dbe6dc', tube: '#e8f2e4', lamp: '#f2c76a', lampHi: '#ffe5a3',
      paper: '#d8d6c6', cork: '#a8865a', hedge: '#2f4d3b', hedgeHi: '#3e6248',
      /* Ground, identical values to the Double R lot. */
      asphalt: '#485665', asphaltDark: '#3e4a57', asphaltMid: '#414c59',
      asphaltSeam: '#3b4754', concrete: '#a9a38f', concreteHi: '#c9c1a5',
      concreteSeam: '#898a7a', concreteEdge: '#777b70', kerb: '#7d7b72',
      chip: '#8f907f',
      stall: '#9aa0a3', stallHi: '#b6bcbd'
    };
  }

  function painter(ctx, cx, cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    return function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x - cx, y - cy, w, h); };
  }

  function draw(ctx, cx, cy) {
    var p = palette(), R = painter(ctx, cx, cy);

    /* Slate lot, same base value as the diner street. */
    R(0, 0, 256, 192, p.asphalt);

    /* Woods close both sides above the building line. */
    woods(R, 0, p); woods(R, 224, p);

    roofPlane(R, p);
    facade(R, p);
    signBoard(R, p, ctx, cx, cy);
    doorLamp(R, p);
    stationWindow(R, 42, 70, p, false);
    stationWindow(R, 162, 70, p, true);
    noticeBoard(R, 150, 82, p);
    entranceDoor(R, p);
    doorLampPool(R, p);

    /* Concrete apron under the facade; the side tiles stay covered by planting. */
    R(0, 112, 256, 16, p.concrete);
    R(0, 112, 256, 2, p.concreteHi);
    [64, 160, 208].forEach(function (x) { R(x, 114, 1, 12, p.concreteSeam); });
    R(48, 120, 2, 1, p.chip); R(96, 122, 3, 1, p.chip); R(190, 117, 2, 2, p.chip);
    R(0, 124, 256, 2, p.concreteSeam); R(0, 126, 256, 2, p.kerb);
    /* Window and entrance light land on the apron as three hard steps. */
    [52, 112, 172].forEach(function (x) {
      R(x, 112, 32, 2, '#d0d6c2'); R(x, 114, 32, 3, '#bcc3ae');
      R(x, 117, 32, 3, '#a9b09c');
    });

    /* Lot marks: two placed repairs, four stall lines, two wheel stops. */
    R(0, 128, 256, 1, p.asphaltSeam);
    R(36, 148, 22, 7, p.asphaltMid); R(44, 155, 26, 5, p.asphaltMid);
    R(186, 158, 24, 8, p.asphaltDark); R(196, 166, 18, 4, p.asphaltDark);
    [20, 80, 164, 226].forEach(function (x) {
      R(x, 150, 2, 32, p.stall); R(x + 2, 150, 1, 22, p.stallHi);
    });
    wheelStop(R, 36, 136, p); wheelStop(R, 192, 136, p);

    /* Blocked plot edges: timber fence over hedge, exactly as the diner lot. */
    leftBoundary(R, p); rightBoundary(R, p);

    hedgeRow(R, 186, 100, 36, p);
    shrubLeft(R, p); shrubRight(R, p);
    bench(R, p);
    flagpole(R, p);

    /* Blocked bottom corners carry planting; the lot itself runs to the edge. */
    cornerBank(R, 0, p); cornerBank(R, 224, p);
  }

  /* ---- building -------------------------------------------------------- */

  function roofPlane(R, p) {
    R(32, 12, 192, 4, p.roofDark);
    R(32, 14, 192, 2, '#4b5d55');
    R(32, 16, 192, 24, '#35493f'); R(32, 40, 192, 16, p.roof);
    R(32, 40, 192, 1, '#4b5d55');
    R(32, 16, 192, 2, '#4b5d55'); R(32, 18, 192, 1, '#1d2823');
    R(32, 19, 2, 37, p.roofRim);
    [64, 96, 128, 160, 192].forEach(function (x) {
      R(x, 19, 2, 37, p.roofSeam); R(x + 2, 19, 1, 29, '#374841');
    });
    R(32, 52, 192, 4, '#263630'); R(32, 56, 192, 4, p.roofDark);
    /* Roof vent sits on the ridge, cool metal against the dark plane. */
    R(166, 8, 14, 9, p.roofDark); R(167, 9, 12, 5, p.metal);
    R(168, 10, 10, 2, p.metalHi);
  }

  function facade(R, p) {
    R(32, 60, 192, 6, p.oak); R(32, 60, 192, 1, p.oakHi);
    R(32, 65, 192, 1, p.oakDark);
    R(32, 66, 192, 38, p.board); R(32, 66, 192, 1, p.boardHi);
    /* Oak brackets carry the fascia onto the siding top course. */
    [48, 96, 160, 208].forEach(function (bx) { R(bx, 66, 3, 4, '#6b4a2e'); });
    [74, 82, 90, 98].forEach(function (y) {
      R(32, y, 192, 2, p.boardShade); R(33, y, 190, 1, p.boardHi);
    });
    /* Stone base, 16 px blocks with dark joints. */
    R(32, 104, 192, 8, p.stone); R(32, 104, 192, 1, p.stoneHi);
    R(32, 108, 192, 1, p.stoneJoint);
    for (var x = 48; x < 224; x += 16) { R(x, 105, 1, 3, p.stoneJoint); R(x - 8, 109, 1, 3, p.stoneJoint); }
    /* Oak corner boards tie fascia to base. */
    R(32, 66, 4, 40, p.oak); R(32, 66, 1, 40, p.oakHi); R(35, 66, 1, 40, p.oakDark);
    R(220, 66, 4, 40, p.oak); R(220, 66, 1, 40, p.oakHi); R(223, 66, 1, 40, p.oakDark);
  }

  function signBoard(R, p, ctx, cx, cy) {
    R(102, 44, 52, 24, p.ink);
    R(103, 45, 50, 22, p.creamShade); R(104, 46, 48, 1, '#e0cfa4');
    R(105, 47, 46, 18, p.forest); R(106, 48, 44, 1, '#1a2c23');
    if (GAME.RetroFont && GAME.RetroFont.draw) {
      GAME.RetroFont.draw(ctx, 'SHERIFF', 128 - cx, 52 - cy, p.cream, { scale: 1, align: 'center' });
    }
    R(103, 67, 50, 1, '#8f7f5c');
  }

  function doorLamp(R, p) {
    /* Cool practical over the entrance: fixture, then its stepped pool on the
     * board wall, on the oak head casing and on the leaf tops below. */
    R(119, 69, 18, 2, p.oakDeep);
    R(120, 71, 16, 4, p.steel); R(121, 72, 14, 2, p.glassPale);
    R(124, 72, 8, 1, '#f2f7f0'); R(126, 71, 4, 2, '#e6f0e2');
    R(120, 74, 16, 1, p.steelDark);
    R(114, 68, 28, 1, '#96a087'); R(108, 75, 40, 1, '#8e997f');
  }

  function doorLampPool(R, p) {
    R(110, 76, 36, 2, '#8a6440'); R(116, 78, 24, 1, p.oakHi);
    R(112, 80, 32, 2, '#c48f5a');
  }

  function entranceDoor(R, p) {
    R(108, 76, 40, 36, p.oakDeep);
    R(110, 78, 36, 34, p.oakDark);
    R(112, 80, 16, 32, p.oak); R(128, 80, 16, 32, p.oak);
    R(112, 80, 1, 32, p.oakHi); R(143, 80, 1, 32, p.oakDark);
    R(127, 80, 2, 32, '#3c2818');
    /* Upper glass panes, cool like the station's own interior light. */
    R(115, 83, 11, 15, p.oakDeep); R(130, 83, 11, 15, p.oakDeep);
    R(116, 84, 10, 13, '#c4d6c7'); R(131, 84, 10, 13, '#c4d6c7');
    R(118, 86, 2, 3, '#eef5ee'); R(133, 86, 2, 3, '#eef5ee');
    R(116, 95, 10, 2, '#8fa89b'); R(131, 95, 10, 2, '#8fa89b');
    /* Brass handles and dark threshold. */
    R(124, 99, 2, 6, p.gold); R(130, 99, 2, 6, p.gold);
    R(114, 107, 12, 2, p.gold); R(130, 107, 12, 2, p.gold);
    R(112, 110, 32, 2, p.oakDeep);
  }

  function stationWindow(R, x, y, p, right) {
    /* Lit room, not a white slab: mid cool glass, one pale tube line, dark
     * shapes at mid contrast, oak mullion and two stepped reflections. */
    R(x, y, 52, 32, p.oakDeep);
    R(x + 1, y + 1, 50, 30, p.oakHi); R(x + 2, y + 2, 48, 28, p.oak);
    R(x + 2, y + 2, 48, 1, p.oakHi); R(x + 4, y + 4, 44, 24, p.glassDeep);
    R(x + 5, y + 5, 42, 22, '#c4d6c7');
    R(x + 8, y + 6, 26, 2, '#eef5ee');
    R(x + 5, y + 12, 42, 15, '#7f958a');
    if (!right) {
      /* Reception: duty board, one framed print, cream counter. */
      R(x + 7, y + 12, 13, 7, '#3f5a44');
      R(x + 9, y + 14, 2, 2, p.paper); R(x + 15, y + 15, 2, 2, p.paper);
      R(x + 23, y + 12, 8, 7, '#5a3a22'); R(x + 24, y + 13, 6, 5, '#4a6552');
      R(x + 6, y + 19, 30, 8, '#d8d6c6'); R(x + 6, y + 26, 30, 1, '#a9a695');
    } else {
      /* Sheriff office: desk, chair, files and the one warm lamp. */
      R(x + 9, y + 12, 11, 7, '#5a3a22'); R(x + 10, y + 13, 9, 5, '#4a6552');
      R(x + 20, y + 14, 8, 6, '#3d4a42');
      R(x + 6, y + 20, 28, 7, '#8a5f3a'); R(x + 6, y + 20, 28, 1, p.oakHi);
      R(x + 36, y + 11, 10, 16, '#9aa3a0'); R(x + 36, y + 11, 10, 1, p.metalHi);
      R(x + 36, y + 15, 10, 1, '#6f7a78'); R(x + 36, y + 19, 10, 1, '#6f7a78');
      R(x + 36, y + 23, 10, 1, '#6f7a78');
      R(x + 24, y + 20, 10, 4, '#e9c87a'); R(x + 26, y + 24, 6, 2, '#d9b364');
      R(x + 28, y + 15, 3, 3, p.lamp); R(x + 29, y + 15, 1, 1, p.lampHi);
    }
    /* Oak mullion, then the glass reflections in front of everything. */
    R(x + 25, y + 4, 2, 24, p.oak); R(x + 25, y + 4, 1, 24, p.oakHi);
    reflection(R, x, y, p);
    /* Sill. */
    R(x, y + 30, 52, 3, p.oak); R(x, y + 30, 52, 1, p.oakHi);
    R(x + 1, y + 33, 50, 1, p.oakDeep);
  }

  function reflection(R, x, y, p) {
    /* Two stepped clusters read as one diagonal pane reflection. */
    R(x + 34, y + 7, 7, 4, p.glassRefl); R(x + 30, y + 11, 7, 4, p.glassRefl);
  }

  function noticeBoard(R, x, y, p) {
    R(x, y, 12, 16, p.oak); R(x, y, 12, 1, p.oakHi); R(x + 1, y + 1, 10, 14, p.oakDark);
    R(x + 2, y + 2, 8, 12, p.cork);
    R(x + 3, y + 4, 3, 2, p.cream); R(x + 4, y + 3, 1, 1, p.oakDeep);
    R(x + 6, y + 9, 3, 2, p.cream); R(x + 7, y + 8, 1, 1, p.oakDeep);
    R(x, y + 16, 12, 1, p.oakDeep);
  }

  /* ---- lot props ------------------------------------------------------- */

  function wheelStop(R, x, y, p) {
    R(x + 2, y, 28, 1, p.stoneHi); R(x, y + 1, 32, 4, p.ink);
    R(x + 2, y + 1, 28, 2, p.stone); R(x + 5, y + 3, 22, 1, p.stoneJoint);
    R(x, y + 5, 32, 2, p.asphaltSeam);
  }

  function flagpole(R, p) {
    R(246, 40, 3, 4, p.gold); R(247, 39, 1, 1, p.lampHi);
    R(246, 44, 3, 68, p.steel); R(246, 44, 1, 68, p.steelHi);
    R(248, 44, 1, 68, p.steelDark);
    R(244, 110, 8, 6, p.stone); R(244, 110, 8, 1, p.stoneHi);
    R(244, 116, 8, 2, p.concreteSeam);
  }

  function bench(R, p) {
    /* Waiting bench: two back slats, seat, cast ends, tight contact band. */
    R(51, 104, 32, 3, p.oak); R(51, 104, 32, 1, p.oakHi);
    R(51, 108, 32, 3, p.oak); R(51, 108, 32, 1, p.oakHi);
    R(51, 111, 32, 1, p.oakDark);
    R(49, 104, 3, 8, p.oakDeep); R(82, 104, 3, 8, p.oakDeep);
    R(49, 104, 1, 8, p.steelDark); R(82, 104, 1, 8, p.steelDark);
    R(56, 111, 3, 1, p.oakDeep); R(75, 111, 3, 1, p.oakDeep);
    R(49, 112, 36, 2, '#767869');
  }

  function hedgeRow(R, x, y, w, p) {
    /* Clipped hedge against the stone base: rounded crowns, three values. */
    R(x, y + 5, w, 7, p.green);
    for (var i = 0; i < w - 9; i += 11) {
      var lift = (i % 22 === 0) ? 0 : 2;
      R(x + i + 2, y + lift + 1, 8, 6, p.green);
      R(x + i + 1, y + lift + 3, 10, 5, p.hedge);
      R(x + i + 3, y + lift + 2, 5, 2, p.hedge);
      R(x + i + 4, y + lift + 3, 3, 2, p.hedgeHi);
      R(x + i + 7, y + 8, 5, 3, p.green);
    }
    R(x, y + 12, w, 2, '#767869');
  }

  function shrubBank(R, x, y, w, h, p, shadow) {
    /* Two rounded crowns over a common base: darkest family, three values. */
    R(x + 1, y + 8, w - 2, h - 10, p.green); R(x, y + 12, w, h - 12, p.green);
    R(x + 3, y + 3, 10, 8, p.green); R(x + 2, y + 5, 12, 8, p.hedge);
    R(x + 4, y + 4, 8, 2, p.hedge); R(x + 5, y + 6, 4, 2, p.hedgeHi);
    R(x + 1, y + 16, 13, 8, p.hedge); R(x + 3, y + 14, 9, 3, p.hedge);
    R(x + 4, y + 15, 3, 2, p.hedgeHi); R(x + 9, y + 19, 2, 2, p.leafHi);
    R(x + 2, y + h - 8, 11, 6, p.hedge); R(x + 4, y + h - 7, 3, 2, p.hedgeHi);
    R(x, y + h, w, 2, shadow);
  }

  function shrubLeft(R, p) { shrubBank(R, 16, 94, 16, 34, p, p.asphaltSeam); }
  function shrubRight(R, p) { shrubBank(R, 224, 94, 16, 34, p, p.asphaltSeam); }

  /* ---- boundaries and woods -------------------------------------------- */

  function treeBank(R, x, y, w, h, p) {
    R(x + 7, y, 3, 8, p.green); R(x + 4, y + 6, 9, 5, p.green);
    R(x + 2, y + 10, 13, 6, p.green); R(x, y + 15, w, 7, p.green);
    R(x + 5, y + 20, 9, 8, p.leaf); R(x + 1, y + 25, 15, 7, p.green);
    R(x, y + 31, w, h - 31, p.green); R(x + 8, y + 9, 2, 2, p.leafHi);
    R(x + 4, y + 19, 3, 1, p.leafHi); R(x + 11, y + 27, 2, 2, p.leafHi);
    R(x + 2, y + 36, 2, 1, p.leafHi);
  }

  function woods(R, x, p) {
    treeBank(R, x, 0, 16, 52, p); treeBank(R, x + 16, 8, 16, 44, p);
    R(x, 50, 32, 46, p.green);
    R(x + 2, 46, 13, 9, p.leaf); R(x + 19, 51, 11, 7, p.leaf);
    R(x + 5, 62, 10, 10, p.leaf); R(x + 21, 66, 9, 9, p.leaf);
    R(x + 1, 78, 12, 9, p.leaf); R(x + 18, 82, 12, 8, p.leaf);
    R(x + 5, 49, 3, 2, p.leafHi); R(x + 23, 54, 2, 2, p.leafHi);
    R(x + 8, 65, 2, 2, p.leafHi); R(x + 24, 69, 3, 1, p.leafHi);
    R(x + 3, 81, 3, 2, p.leafHi); R(x + 21, 85, 2, 2, p.leafHi);
  }

  function fenceRun(R, x, p, posts) {
    posts.forEach(function (o) {
      R(x + o, 96, 3, 76, p.oakDark); R(x + o, 96, 1, 76, p.oak);
    });
    R(x, 102, 16, 3, p.oak); R(x, 103, 16, 1, p.oakHi);
    R(x, 122, 16, 3, p.oak); R(x, 123, 16, 1, p.oakHi);
    R(x, 172, 16, 2, p.asphaltSeam);
  }

  function leftBoundary(R, p) {
    fenceRun(R, 0, p, [2, 10]);
    R(0, 128, 16, 44, p.green);
    R(3, 124, 10, 8, p.hedge); R(0, 138, 14, 9, p.hedge);
    R(4, 150, 11, 8, p.hedge); R(0, 160, 13, 9, p.hedge);
    R(5, 127, 3, 2, p.hedgeHi); R(3, 141, 2, 2, p.hedgeHi);
    R(7, 153, 3, 1, p.hedgeHi); R(2, 163, 2, 2, p.leafHi);
  }

  function rightBoundary(R, p) {
    fenceRun(R, 240, p, [1, 12]);
    R(240, 128, 16, 44, p.green);
    R(243, 124, 10, 8, p.hedge); R(242, 138, 14, 9, p.hedge);
    R(241, 150, 11, 8, p.hedge); R(243, 160, 13, 9, p.hedge);
    R(245, 127, 3, 2, p.hedgeHi); R(248, 141, 2, 2, p.hedgeHi);
    R(244, 153, 3, 1, p.hedgeHi); R(249, 163, 2, 2, p.leafHi);
  }

  function cornerBank(R, x, p) {
    /* Bottom corners only: the outer half may rise beside the fence, the inner
     * half stays inside row 11 so row 10 keeps its full walkable width. */
    var out = x === 0 ? 0 : 16, inn = x === 0 ? 16 : 0;
    R(x + out, 172, 16, 20, p.green); R(x + out + 2, 168, 11, 8, p.green);
    R(x + inn, 176, 16, 16, p.green);
    R(x + out + 2, 174, 11, 7, p.hedge); R(x + out + 4, 170, 7, 5, p.hedge);
    R(x + out + 5, 171, 3, 2, p.hedgeHi);
    R(x + inn + 2, 178, 11, 7, p.hedge); R(x + inn + 4, 177, 7, 3, p.hedge);
    R(x + inn + 5, 178, 3, 2, p.hedgeHi);
    R(x + out + 3, 186, 8, 5, p.hedge); R(x + inn + 4, 187, 7, 4, p.hedge);
    R(x + out + 6, 187, 2, 2, p.leafHi); R(x + inn + 7, 188, 2, 2, p.leafHi);
  }

  /* ---- depth pass ------------------------------------------------------ */
  /* Only the two shrub groups and the bench can cover the player: they are
   * repainted when their south edge is between the current and the next foot
   * line, exactly like the interior prop bands. */
  var props = [
    { footY: 112, paint: bench },
    { footY: 128, paint: shrubLeft },
    { footY: 128, paint: shrubRight }
  ];

  function foreground(ctx, cx, cy, minFoot, maxFoot) {
    minFoot = minFoot == null ? -Infinity : minFoot;
    maxFoot = maxFoot == null ? Infinity : maxFoot;
    var p = palette(), R = painter(ctx, cx, cy), i;
    for (i = 0; i < props.length; i++) {
      if (props[i].footY < minFoot || props[i].footY >= maxFoot) continue;
      props[i].paint(R, p);
    }
  }

  GAME.SheriffsStationExteriorArt = { draw: draw, foreground: foreground, props: props };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.SheriffsStationExteriorArt;
})();
