/* lt-art.js — Living Town: procedural pixel art for tiles and people.
 *
 * Canvas drawing only (fillRect / fillStyle). No image assets, no build
 * step. Every tile and every character pose is generated from its inputs
 * so the same call always paints the same pixels — nothing here reads
 * Math.random.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var Art = LT.Art = LT.Art || {};

  Art.TILE = 16;

  /* Warm, low-saturation GBA-era overworld palette. Exposed so other
   * modules (UI chrome, debug overlays) can match it. */
  var P = Art.palette = {
    ink: '#241a12',
    grass: '#6f9d52',
    grassDark: '#5f8a45',
    grassLight: '#7fae5e',
    paving: '#a99b84',
    pavingDark: '#948572',
    pavingLight: '#b7aa93',
    wall: '#8a6c4d',
    wallDark: '#6c5339',
    wallLight: '#9d7e5c',
    wallTop: '#5a4530',
    floor: '#a9825a',
    floorDark: '#8f6c49',
    floorLight: '#bb936a',
    water: '#4b7fa6',
    waterDark: '#3d6a8c',
    waterLight: '#6098bf',
    tree: '#3f6b3a',
    treeDark: '#335a30',
    treeLight: '#79a85c',
    trunk: '#5a4128',
    bed: '#c46a6a',
    bedDark: '#a3524f',
    pillow: '#e8dcc4',
    kitchen: '#9aa3a8',
    kitchenDark: '#7c848a',
    guitar: '#b9863f',
    guitarDark: '#8c5f2a',
    cafeCounter: '#7a5236',
    cafeCounterDark: '#5f3f29',
    table: '#8f6a44',
    tableDark: '#6f4f31',
    chair: '#6a4c30',
    bench: '#7a5c3a',
    benchDark: '#5c4227',
    windowGlass: '#cfe6ef',
    windowFrame: '#5c4530',
    door: '#3a2b1c',
    doorFrame: '#5c4530',
    lintel: '#d8b37c',
    voidColor: '#120c08',
    nightTint: '#12224a',
    duskTint: '#c97b3a'
  };

  /* ---- deterministic hashing --------------------------------------- */
  /* Small integer hash of two map coordinates. No Math.random anywhere
   * in this file: the same (mx, my) always yields the same bits, so the
   * same tile always looks the same. */
  function hash2(mx, my) {
    var h = (mx * 374761393 + my * 668265263 + 0x9E3779B9) | 0;
    h = (h ^ (h >>> 13)) >>> 0;
    h = (h * 1274126177) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    return h >>> 0;
  }

  function bits(h, shift, mod) { return Math.floor(h / Math.pow(2, shift)) % mod; }

  function charAt(row, x) {
    if (!row || x < 0 || x >= row.length) return null;
    return row.charAt(x);
  }

  function neighbour(rows, mx, my, dx, dy) {
    if (!rows) return null;
    var row = rows[my + dy];
    if (!row) return null;
    return charAt(row, mx + dx);
  }

  /* ---- outdoor day/night tint --------------------------------------- */
  /* Subtle only: a semi-transparent overlay on top of an otherwise fully
   * painted tile. Indoor tiles never receive it. */
  function timeOverlay(ctx, sx, sy, minute) {
    if (typeof minute !== 'number') return;
    var alpha = 0, color = null;
    if (minute < 300 || minute >= 1320) { alpha = 0.30; color = P.nightTint; }
    else if (minute < 420 || (minute >= 1080 && minute < 1320)) { alpha = 0.12; color = P.duskTint; }
    if (!color) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(sx, sy, Art.TILE, Art.TILE);
    ctx.restore();
  }

  /* ---- tile painters -------------------------------------------------
   * Each painter fills its own 16x16 cell only; nothing here reads or
   * writes outside (sx, sy, 16, 16). */

  function paintFlat(ctx, sx, sy, color) {
    ctx.fillStyle = color;
    ctx.fillRect(sx, sy, Art.TILE, Art.TILE);
  }

  function paintGrass(ctx, sx, sy, h) {
    paintFlat(ctx, sx, sy, P.grass);
    var v = bits(h, 0, 3);
    ctx.fillStyle = (v === 0) ? P.grassDark : P.grassLight;
    var ox = 2 + bits(h, 2, 10);
    var oy = 2 + bits(h, 5, 10);
    ctx.fillRect(sx + ox, sy + oy, 2, 2);
    ox = 1 + bits(h, 8, 11);
    oy = 1 + bits(h, 11, 11);
    ctx.fillStyle = (v === 2) ? P.grassLight : P.grassDark;
    ctx.fillRect(sx + ox, sy + oy, 1, 2);
  }

  function paintPaving(ctx, sx, sy, mx, my, h) {
    paintFlat(ctx, sx, sy, P.paving);
    ctx.fillStyle = P.pavingDark;
    /* Mortar grid: only draw the seams this cell owns (top and left),
     * so neighbouring cells do not double them up. */
    if (my % 2 === 0) ctx.fillRect(sx, sy, Art.TILE, 1);
    if (mx % 2 === 0) ctx.fillRect(sx, sy, 1, Art.TILE);
    var v = bits(h, 3, 4);
    if (v === 0) {
      ctx.fillStyle = P.pavingLight;
      ctx.fillRect(sx + 4 + bits(h, 6, 8), sy + 4 + bits(h, 9, 8), 2, 2);
    }
  }

  function paintFloor(ctx, sx, sy, mx, my, h) {
    paintFlat(ctx, sx, sy, P.floor);
    /* Plank lines running horizontally, offset every other row for a
     * staggered board look. */
    ctx.fillStyle = P.floorDark;
    ctx.fillRect(sx, sy + 15, Art.TILE, 1);
    if ((mx + (my % 2 === 0 ? 0 : 4)) % 8 === 0) ctx.fillRect(sx, sy, 1, Art.TILE);
    var v = bits(h, 4, 5);
    if (v === 0) { ctx.fillStyle = P.floorLight; ctx.fillRect(sx + 3 + bits(h, 7, 9), sy + 4 + bits(h, 10, 8), 3, 1); }
  }

  function paintWater(ctx, sx, sy, h) {
    paintFlat(ctx, sx, sy, P.water);
    ctx.fillStyle = P.waterDark;
    ctx.fillRect(sx, sy + 12, Art.TILE, 2);
    var v = bits(h, 1, 4);
    ctx.fillStyle = P.waterLight;
    ctx.fillRect(sx + 2 + bits(h, 4, 10), sy + 3 + bits(h, 7, 6), 4, 1);
    if (v === 0) ctx.fillRect(sx + 8, sy + 8, 3, 1);
  }

  function paintTree(ctx, sx, sy, mx, my, rows, h) {
    /* A rounded canopy over grass, filling most of the cell, with a
     * trunk stub peeking out at the base. Neighbouring 'T' cells drop
     * the rim shading and corner rounding on the sides they share, so a
     * row of trees reads as one continuous mass instead of a grid of
     * boxes; only the true outer edge of a clump gets the dark rim and
     * rounded corners. */
    var T = Art.TILE;
    var hasLeft = neighbour(rows, mx, my, -1, 0) === 'T';
    var hasRight = neighbour(rows, mx, my, 1, 0) === 'T';
    var hasUp = neighbour(rows, mx, my, 0, -1) === 'T';
    var hasDown = neighbour(rows, mx, my, 0, 1) === 'T';

    paintFlat(ctx, sx, sy, P.grass);

    ctx.fillStyle = P.tree;
    ctx.fillRect(sx, sy, T, T - 3);

    /* Round the outer corners of the clump; interior corners stay
     * square so they tile seamlessly into the neighbouring canopy. */
    ctx.fillStyle = P.grass;
    if (!hasLeft && !hasUp) ctx.fillRect(sx, sy, 2, 2);
    if (!hasRight && !hasUp) ctx.fillRect(sx + T - 2, sy, 2, 2);
    if (!hasLeft && !hasDown) ctx.fillRect(sx, sy + T - 5, 2, 2);
    if (!hasRight && !hasDown) ctx.fillRect(sx + T - 2, sy + T - 5, 2, 2);

    /* Dark rim only where the canopy truly ends. */
    ctx.fillStyle = P.treeDark;
    if (!hasUp) ctx.fillRect(sx + 2, sy, T - 4, 1);
    if (!hasDown) ctx.fillRect(sx + 2, sy + T - 4, T - 4, 1);
    if (!hasLeft) ctx.fillRect(sx, sy + 2, 1, T - 6);
    if (!hasRight) ctx.fillRect(sx + T - 1, sy + 2, 1, T - 6);

    /* Foliage clusters for texture, deterministic from the hash. */
    ctx.fillStyle = P.treeDark;
    ctx.fillRect(sx + 2 + bits(h, 2, 8), sy + 3 + bits(h, 5, 6), 3, 3);
    ctx.fillStyle = P.treeLight;
    ctx.fillRect(sx + 8 + bits(h, 8, 5), sy + 2 + bits(h, 11, 5), 3, 2);

    /* Trunk only shows at the base row of a clump, where it isn't
     * hidden by canopy continuing below. */
    if (!hasDown) {
      ctx.fillStyle = P.trunk;
      ctx.fillRect(sx + 6, sy + T - 4, 4, 4);
    }
  }

  function paintWall(ctx, sx, sy, mx, my, rows, h) {
    var below = neighbour(rows, mx, my, 0, 1);
    var openBelow = below !== null && below !== '#';
    ctx.fillStyle = P.wallDark;
    ctx.fillRect(sx, sy, Art.TILE, Art.TILE);
    ctx.fillStyle = P.wall;
    ctx.fillRect(sx, sy + 2, Art.TILE, Art.TILE - 2);
    ctx.fillStyle = P.wallTop;
    ctx.fillRect(sx, sy, Art.TILE, 2);
    /* Brick-ish seams, offset per row so bricks stagger. */
    ctx.fillStyle = P.wallDark;
    var seamX = ((my % 2 === 0) ? 0 : 8) + 4;
    ctx.fillRect(sx + seamX, sy + 4, 1, Art.TILE - 4);
    var v = bits(h, 3, 5);
    if (v === 0) { ctx.fillStyle = P.wallLight; ctx.fillRect(sx + 2 + bits(h, 6, 10), sy + 6, 2, 2); }
    if (openBelow) {
      /* Baseboard shadow grounds the wall against the room it faces. */
      ctx.fillStyle = P.wallDark;
      ctx.fillRect(sx, sy + Art.TILE - 2, Art.TILE, 2);
    }
  }

  function paintDoorway(ctx, sx, sy) {
    /* A walkable threshold, not a hole: ground surface first, then a
     * step/mat and jambs, with a lighter lintel line across the top so
     * it reads clearly lighter than a wall. */
    var T = Art.TILE;
    paintFlat(ctx, sx, sy, P.floor);
    ctx.fillStyle = P.floorDark;
    ctx.fillRect(sx + 2, sy + 4, T - 4, T - 6);
    ctx.fillStyle = P.doorFrame;
    ctx.fillRect(sx, sy, 2, T);
    ctx.fillRect(sx + T - 2, sy, 2, T);
    ctx.fillStyle = P.lintel;
    ctx.fillRect(sx, sy, T, 2);
  }

  function paintBed(ctx, sx, sy, mx) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx, sy + 2, Art.TILE, Art.TILE - 2);
    ctx.fillStyle = P.bed;
    ctx.fillRect(sx + 1, sy + 3, Art.TILE - 2, Art.TILE - 4);
    ctx.fillStyle = P.bedDark;
    ctx.fillRect(sx + 1, sy + Art.TILE - 5, Art.TILE - 2, 2);
    /* Pillow at whichever short edge is the head of the bed; without a
     * second bed cell to compare against, alternate by column so a
     * two-tile bed still reads as one headboard. */
    ctx.fillStyle = P.pillow;
    if (mx % 2 === 0) ctx.fillRect(sx + 2, sy + 4, 5, 4);
  }

  function paintKitchen(ctx, sx, sy) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx, sy, Art.TILE, Art.TILE);
    ctx.fillStyle = P.kitchen;
    ctx.fillRect(sx + 1, sy + 1, Art.TILE - 2, Art.TILE - 2);
    ctx.fillStyle = P.kitchenDark;
    ctx.fillRect(sx + 3, sy + 4, 4, 3);
    ctx.fillRect(sx + 9, sy + 4, 4, 3);
    ctx.fillStyle = P.kitchen;
    ctx.fillRect(sx + 1, sy + Art.TILE - 4, Art.TILE - 2, 3);
  }

  function paintGuitar(ctx, sx, sy) {
    ctx.fillStyle = P.floor;
    ctx.fillRect(sx, sy, Art.TILE, Art.TILE);
    ctx.fillStyle = P.guitarDark;
    ctx.fillRect(sx + 7, sy + 1, 2, 14);
    ctx.fillStyle = P.guitar;
    ctx.fillRect(sx + 5, sy + 8, 6, 6);
    ctx.fillRect(sx + 6, sy + 3, 4, 6);
    ctx.fillStyle = P.guitarDark;
    ctx.fillRect(sx + 7, sy + 10, 2, 2);
  }

  function paintCafeCounter(ctx, sx, sy, mx) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx, sy, Art.TILE, Art.TILE);
    ctx.fillStyle = P.cafeCounter;
    ctx.fillRect(sx + 1, sy + 1, Art.TILE - 2, Art.TILE - 4);
    ctx.fillStyle = P.cafeCounterDark;
    ctx.fillRect(sx + 1, sy + Art.TILE - 4, Art.TILE - 2, 3);
    if (mx % 3 === 0) { ctx.fillStyle = P.windowGlass; ctx.fillRect(sx + 4, sy + 3, 3, 3); }
  }

  function paintTable(ctx, sx, sy) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx + 2, sy + 3, Art.TILE - 4, Art.TILE - 5);
    ctx.fillStyle = P.table;
    ctx.fillRect(sx + 3, sy + 4, Art.TILE - 6, Art.TILE - 8);
    ctx.fillStyle = P.tableDark;
    ctx.fillRect(sx + 3, sy + Art.TILE - 6, Art.TILE - 6, 2);
  }

  function paintChair(ctx, sx, sy) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx + 3, sy + 4, Art.TILE - 6, Art.TILE - 6);
    ctx.fillStyle = P.chair;
    ctx.fillRect(sx + 4, sy + 5, Art.TILE - 8, Art.TILE - 8);
  }

  function paintBench(ctx, sx, sy, mx) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx + 1, sy + 6, Art.TILE - 2, 7);
    ctx.fillStyle = P.bench;
    ctx.fillRect(sx + 1, sy + 7, Art.TILE - 2, 4);
    ctx.fillStyle = P.benchDark;
    ctx.fillRect(sx + 2, sy + 11, 2, 2);
    ctx.fillRect(sx + Art.TILE - 4, sy + 11, 2, 2);
    if (mx % 2 === 1) { ctx.fillStyle = P.grass; ctx.fillRect(sx, sy, Art.TILE, 6); }
  }

  function paintWindow(ctx, sx, sy) {
    ctx.fillStyle = P.windowFrame;
    ctx.fillRect(sx, sy, Art.TILE, Art.TILE);
    ctx.fillStyle = P.windowGlass;
    ctx.fillRect(sx + 2, sy + 2, Art.TILE - 4, Art.TILE - 4);
    ctx.fillStyle = P.windowFrame;
    ctx.fillRect(sx + Art.TILE / 2 - 1, sy + 2, 1, Art.TILE - 4);
  }

  function paintVoid(ctx, sx, sy) {
    ctx.fillStyle = P.voidColor;
    ctx.fillRect(sx, sy, Art.TILE, Art.TILE);
  }

  function paintUnknown(ctx, sx, sy) {
    ctx.fillStyle = P.pavingDark;
    ctx.fillRect(sx, sy, Art.TILE, Art.TILE);
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx + 6, sy + 6, 4, 4);
  }

  /* Outdoor tiles get the subtle day/night overlay; interiors never do. */
  var OUTDOOR_CHARS = ',Tw-';

  Art.drawCell = function (ctx, ch, sx, sy, mx, my, rows, opts) {
    opts = opts || {};
    var h = hash2(mx | 0, my | 0);
    var indoor = !!opts.indoor;

    switch (ch) {
      case ',': paintGrass(ctx, sx, sy, h); break;
      case '-': paintPaving(ctx, sx, sy, mx, my, h); break;
      case '.': paintFloor(ctx, sx, sy, mx, my, h); break;
      case 'w': paintWater(ctx, sx, sy, h); break;
      case 'T': paintTree(ctx, sx, sy, mx, my, rows, h); break;
      case '#': paintWall(ctx, sx, sy, mx, my, rows, h); break;
      case 'H': paintWall(ctx, sx, sy, mx, my, rows, h); break;   // a house front, until a places package paints it as one
      case 'f': paintWall(ctx, sx, sy, mx, my, rows, h); break;   // a garden wall, until a places package paints it as one
      case 'D': paintDoorway(ctx, sx, sy); break;
      case 'B': paintBed(ctx, sx, sy, mx); break;
      case 'K': paintKitchen(ctx, sx, sy); break;
      case 'G': paintGuitar(ctx, sx, sy); break;
      case 'C': paintCafeCounter(ctx, sx, sy, mx); break;
      case 't': paintTable(ctx, sx, sy); break;
      case 'c': paintChair(ctx, sx, sy); break;
      case 'b': paintBench(ctx, sx, sy, mx); break;
      case '=': paintWindow(ctx, sx, sy); break;
      case ' ': paintVoid(ctx, sx, sy); break;
      default: paintUnknown(ctx, sx, sy); break;
    }

    if (!indoor && OUTDOOR_CHARS.indexOf(ch) >= 0) timeOverlay(ctx, sx, sy, opts.minute);
  };

  /* ---- characters ----------------------------------------------------
   * 16 wide x 24 tall, (sx, sy) is the top-left of that box; feet sit on
   * the bottom edge (sy + 24). */

  /* A stand-in for the moment before the inhabitants' sheet has decoded. It
   * is coloured from the person's own look recipe (lt-appearance.js tone
   * slots), so it is the same person, only rougher; nothing here is keyed by
   * who somebody is. */
  var NEUTRAL = { hair: '#555555', hairDark: '#3d3d3d', cloth: '#777777', clothDark: '#5a5a5a', skin: '#cbb090' };
  function tonesOf(look) {
    var c = look && look.colors;
    if (!c) return NEUTRAL;
    return { hair: c.h || NEUTRAL.hair, hairDark: c.H || NEUTRAL.hairDark, cloth: c.J || NEUTRAL.cloth,
             clothDark: c.K || NEUTRAL.clothDark, skin: c.S || NEUTRAL.skin };
  }

  function paintHead(ctx, sx, sy, dir, s) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx, sy, Art.TILE, 8);
    ctx.fillStyle = s.hair;
    ctx.fillRect(sx + 1, sy + 1, Art.TILE - 2, 6);
    ctx.fillStyle = s.hairDark;
    ctx.fillRect(sx + 1, sy + 1, Art.TILE - 2, 2);
    if (dir === 'down') {
      ctx.fillStyle = s.skin;
      ctx.fillRect(sx + 4, sy + 4, 8, 3);
    } else if (dir === 'left') {
      ctx.fillStyle = s.skin;
      ctx.fillRect(sx + 1, sy + 4, 6, 3);
    } else if (dir === 'right') {
      ctx.fillStyle = s.skin;
      ctx.fillRect(sx + 9, sy + 4, 6, 3);
    }
    /* 'up': no face patch — the back of the head faces the viewer. */
  }

  function paintTorso(ctx, sx, sy, dir, s) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx, sy + 8, Art.TILE, 9);
    ctx.fillStyle = s.cloth;
    ctx.fillRect(sx + 1, sy + 9, Art.TILE - 2, 7);
    ctx.fillStyle = s.clothDark;
    if (dir === 'left') ctx.fillRect(sx + 10, sy + 9, 4, 7);
    else if (dir === 'right') ctx.fillRect(sx + 2, sy + 9, 4, 7);
    else ctx.fillRect(sx + 7, sy + 9, 2, 7);
  }

  function paintLegs(ctx, sx, sy, phase, moving, s) {
    var legY = sy + 17, legH = 7, legW = 5;
    var baseLeft = sx + 2, baseRight = sx + 9;
    var shift = moving ? 2 : 0;
    var leftX = baseLeft, rightX = baseRight;
    if (phase === 1) { leftX = baseLeft - shift; rightX = baseRight + shift; }
    else if (phase === 3) { leftX = baseLeft + shift; rightX = baseRight - shift; }
    ctx.fillStyle = P.ink;
    ctx.fillRect(sx, legY - 1, Art.TILE, legH + 1);
    ctx.fillStyle = s.clothDark;
    ctx.fillRect(leftX, legY, legW, legH);
    ctx.fillRect(rightX, legY, legW, legH);
  }

  Art.drawCharacter = function (ctx, look, sx, sy, dir, phase, opts) {
    opts = opts || {};
    var s = tonesOf(look);
    var d = (dir === 'up' || dir === 'left' || dir === 'right') ? dir : 'down';
    var ph = (phase === 1 || phase === 2 || phase === 3) ? phase : 0;
    var moving = !!opts.moving;
    if (!moving) ph = 0;
    var alpha = (typeof opts.alpha === 'number') ? opts.alpha : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    paintHead(ctx, sx, sy, d, s);
    paintTorso(ctx, sx, sy, d, s);
    paintLegs(ctx, sx, sy, ph, moving, s);
    ctx.restore();
  };
})();
