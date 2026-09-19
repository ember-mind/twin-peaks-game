/* Glastonbury Grove — 448x352 authored native pixels, painted through the
 * 256x192 viewport.  Flat orthographic rectangles only: no gradients, paths,
 * smoothing or noise.
 *
 * This is an OUTDOOR map, so the art is authored in WORLD pixels and the
 * painter subtracts the camera.  js/woods-scene.js suppresses the per-tile
 * pipeline for this map and calls draw() from GAME.sprites.drawStructures,
 * which engine.js runs over the whole tile grid and under the actors.
 *
 * Ground grammar keeps six tones, the way R69/R76 fixed the daytime ground:
 * ink, deep, shadow, mid, light, moon.  Everything outside the ground — the
 * oil, the scorched apron, the curtain and the sign — is a named accent and
 * is used in one place only.
 *
 * Nothing here repaints over an actor.  The canopies live in the ground pass,
 * so Cooper is in front of every tree on every path tile; js/woods-scene.js
 * installs an empty foreground band and test/woods-native.js holds it there. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;

  var palette = {
    /* the six ground tones */
    ink: '#0d1622', deep: '#1b2436', shadow: '#2c3852',
    mid: '#43516f', light: '#6a7796', moon: '#9aa6c0',
    /* accents, one place each */
    oilCore: '#07090e', oil: '#111726', oilSheen: '#26314a', oilMoon: '#8090ae',
    scorch: '#131320', scorchHi: '#23202c',
    curtainDeep: '#3a0f18', curtain: '#5e1a24', curtainHi: '#8a2a34',
    curtainCore: '#c4515a', glow: '#3c1a26',
    signFace: '#8e90b0', signShade: '#5d5f80'
  };

  /* Deterministic per-tile variation: the same tile is the same tree on every
   * frame and in every capture, and no two neighbours share a silhouette. */
  function hash(x, y, seed) {
    var h = (x * 374761393 + y * 668265263 + (seed || 0) * 2246822519) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return (h ^ (h >>> 16)) >>> 0;
  }

  function rectPainter(ctx, cx, cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    return function (x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x - cx, y - cy, w, h);
    };
  }

  function cellAt(rows, tx, ty) {
    if (!rows || !rows.length) return 'T';
    var my = tx < 0 || ty < 0 ? -1 : ty;
    my = Math.max(0, Math.min(rows.length - 1, ty));
    var row = rows[my];
    var mx = Math.max(0, Math.min(row.length - 1, tx));
    return row.charAt(mx);
  }

  /* ------------------------------------------------------------ the grove */

  /* The ring is a real circle: the eight sycamores sit on it at radius three
   * tiles from the pool, and the worn earth between them is what makes the
   * arrangement read as a ring instead of eight loose trees. */
  var RING = { cx: 232, cy: 200, outer: 58, inner: 44 };
  var POOL_CELLS = [[13, 11], [14, 11], [15, 11], [12, 12], [13, 12], [14, 12]];
  var SYCAMORES = [[14, 9], [12, 10], [16, 10], [11, 12], [17, 12], [12, 14], [16, 14], [14, 15]];
  var PORTAL = { tx: 14, ty: 4 };
  var SIGN = { tx: 11, ty: 16 };

  function drawForestFloor(R, p, tx, ty) {
    /* Needle litter under the border conifers: the darkest ground plane, so
     * the path and the grove read as openings in it. */
    var x = tx * TILE, y = ty * TILE, h = hash(tx, ty, 11), i, lx, ly;
    R(x, y, 16, 16, p.deep);
    if ((h & 3) === 0) R(x + (h >> 2 & 7), y + (h >> 5 & 7), 6, 2, p.ink);
    if ((h & 7) === 3) R(x + 2 + (h >> 8 & 5), y + 8 + (h >> 11 & 5), 4, 1, p.shadow);
    for (i = 0; i < 2; i++) {
      lx = x + ((h >> (i * 6 + 3)) & 13) + 1;
      ly = y + ((h >> (i * 6 + 9)) & 13) + 1;
      R(lx, ly, 2, 1, p.ink);
    }
  }

  function drawGroveFloor(R, p, tx, ty) {
    /* The clearing floor: one step up from the forest, with moss tufts and a
     * few darker hollows so the open ground is not a flat field. */
    var x = tx * TILE, y = ty * TILE, h = hash(tx, ty, 29);
    R(x, y, 16, 16, p.shadow);
    if ((h & 3) !== 0) R(x + (h >> 2 & 7), y + (h >> 5 & 9), 7, 3, p.deep);
    if ((h & 7) === 1) R(x + 3 + (h >> 9 & 5), y + 2 + (h >> 12 & 7), 5, 2, p.mid);
    if ((h & 7) === 5) { R(x + 9, y + 10, 4, 2, p.mid); R(x + 10, y + 9, 2, 1, p.light); }
    if ((h & 15) === 9) R(x + 1 + (h >> 16 & 9), y + 11, 3, 1, p.light);
  }

  function drawRing(R, p) {
    /* Worn earth between the sycamores, stepped two pixels at a time from the
     * real circle so the ring is a ring and not an octagon. */
    var dy, outerHalf, innerHalf, y;
    for (dy = -RING.outer; dy < RING.outer; dy += 2) {
      y = RING.cy + dy;
      outerHalf = Math.floor(Math.sqrt(RING.outer * RING.outer - dy * dy));
      if (outerHalf < 1) continue;
      innerHalf = Math.abs(dy) < RING.inner
        ? Math.floor(Math.sqrt(RING.inner * RING.inner - dy * dy)) : 0;
      if (innerHalf > 0) {
        R(RING.cx - outerHalf, y, outerHalf - innerHalf, 2, p.mid);
        R(RING.cx + innerHalf, y, outerHalf - innerHalf, 2, p.mid);
      } else {
        R(RING.cx - outerHalf, y, outerHalf * 2, 2, p.mid);
      }
    }
    /* One moonlit edge on the outside of the ring and one shadow line on the
     * inside, so the worn earth has a lip instead of a cut. */
    for (dy = -RING.outer; dy < RING.outer; dy += 2) {
      y = RING.cy + dy;
      outerHalf = Math.floor(Math.sqrt(RING.outer * RING.outer - dy * dy));
      if (outerHalf < 1) continue;
      if ((dy + RING.outer) % 6 < 4) R(RING.cx - outerHalf, y, 2, 2, p.light);
      else R(RING.cx - outerHalf, y, 2, 2, p.mid);
      if ((dy + RING.outer) % 8 < 5) R(RING.cx + outerHalf - 2, y, 2, 2, p.shadow);
      innerHalf = Math.abs(dy) < RING.inner
        ? Math.floor(Math.sqrt(RING.inner * RING.inner - dy * dy)) : 0;
      if (innerHalf > 0) {
        R(RING.cx - innerHalf - 1, y, 1, 2, p.deep);
        R(RING.cx + innerHalf, y, 1, 2, p.deep);
      }
    }
  }

  function drawPathTile(R, p, rows, tx, ty) {
    /* Packed earth, the same worn material as the ring, so the path reads as
     * leading into the grove rather than as a pale bar laid over it.  Town
     * edge grammar: a darker lip wherever the path meets something that is
     * not path, then a dithered row of the lip colour beyond it. */
    var x = tx * TILE, y = ty * TILE, h = hash(tx, ty, 53);
    var n = cellAt(rows, tx, ty - 1) === 'p', s = cellAt(rows, tx, ty + 1) === 'p';
    var w = cellAt(rows, tx - 1, ty) === 'p', e = cellAt(rows, tx + 1, ty) === 'p';
    R(x, y, 16, 16, p.mid);
    if ((h & 1) === 0) R(x + (h >> 2 & 9), y + (h >> 5 & 9), 5, 3, p.light);
    if ((h & 3) === 2) R(x + 2 + (h >> 9 & 7), y + 8 + (h >> 12 & 5), 6, 2, p.light);
    if ((h & 7) === 0) R(x + (h >> 16 & 9), y + 2, 5, 2, p.shadow);
    if ((h & 7) === 4) R(x + 9, y + 10, 4, 2, p.shadow);
    if ((h & 7) === 5) R(x + 5 + (h >> 20 & 3), y + 4, 2, 1, p.moon);
    if ((h & 15) === 3) R(x + 11, y + 12, 2, 1, p.moon);
    if (!n) {
      R(x, y, 16, 2, p.shadow); R(x, y, 16, 1, p.deep);
      R(x + (h & 7), y + 2, 2, 1, p.shadow); R(x + 9 + (h >> 3 & 5), y + 2, 2, 1, p.shadow);
    }
    if (!s) {
      R(x, y + 14, 16, 2, p.shadow); R(x, y + 15, 16, 1, p.deep);
      R(x + 2 + (h >> 6 & 5), y + 13, 2, 1, p.shadow); R(x + 10 + (h >> 9 & 3), y + 13, 2, 1, p.shadow);
    }
    if (!w) {
      R(x, y, 2, 16, p.shadow); R(x, y, 1, 16, p.deep);
      R(x + 2, y + 3 + (h >> 12 & 7), 1, 2, p.shadow);
      R(x + 2, y + 11 - (h >> 15 & 5), 1, 2, p.shadow);
    }
    if (!e) {
      R(x + 14, y, 2, 16, p.shadow); R(x + 15, y, 1, 16, p.deep);
      R(x + 13, y + 5 + (h >> 15 & 7), 1, 2, p.shadow);
      R(x + 13, y + 1 + (h >> 18 & 3), 1, 2, p.shadow);
    }
  }

  /* The pool is authored as scanlines, not as the union of its six cells: oil
   * that has burnt its way into the ground has no corners.  Each row is
   * [y, x0, x1] in world pixels and every line is two pixels tall. */
  var POOL_SPANS = [
    [176, 216, 248], [178, 212, 252], [180, 210, 254], [182, 208, 255],
    [184, 206, 254], [186, 202, 250], [188, 198, 246], [190, 194, 244],
    [192, 192, 242], [194, 190, 240], [196, 190, 238], [198, 192, 236],
    [200, 194, 234], [202, 198, 232], [204, 204, 230], [206, 210, 226]
  ];

  function pourSpans(R, inset, color, ragged, dy) {
    /* `ragged` walks the inset one pixel in and out down the rows, so the
     * burnt edge is not a perfect offset copy of the liquid. */
    var i, sp, x0, x1, jitterL, jitterR, n;
    for (i = 0; i < POOL_SPANS.length; i++) {
      sp = POOL_SPANS[i];
      n = ragged ? (i * 7 + 3) % 5 : 0;
      jitterL = ragged ? (n > 2 ? 1 : 0) : 0;
      jitterR = ragged ? (n === 1 || n === 4 ? 1 : 0) : 0;
      x0 = sp[1] + inset + jitterL; x1 = sp[2] - inset - jitterR;
      if (x1 - x0 < 1) continue;
      R(x0, sp[0] + (inset > 0 ? 1 : 0) + (dy || 0), x1 - x0, 2, color);
    }
  }

  function drawOilPool(R, p) {
    /* Scorched ground first, widening away from the liquid, then the pool: a
     * near-black body with a darker rim, one sheen step and three flat moon
     * reflections.  No sparkles: oil does not twinkle. */
    /* The burn reaches as far above and below the liquid as it does beside
     * it, so the halo goes all the way round instead of banding the sides. */
    var k, ring1 = [-6, -4, -2, 0, 2, 4, 6], ring2 = [-3, -1, 1, 3];
    for (k = 0; k < ring1.length; k++) pourSpans(R, -6, p.scorch, true, ring1[k]);
    for (k = 0; k < ring2.length; k++) pourSpans(R, -3, p.scorchHi, true, ring2[k]);
    pourSpans(R, -1, p.scorch, true, -1);
    pourSpans(R, -1, p.scorch, true, 1);
    pourSpans(R, 0, p.oilCore);
    pourSpans(R, 2, p.oil);
    pourSpans(R, 7, p.oilSheen);
    pourSpans(R, 9, p.oil);
    /* Reflections lie flat across the surface, each on its own row. */
    R(214, 182, 16, 1, p.oilMoon); R(230, 183, 7, 1, p.oilSheen);
    R(202, 190, 11, 1, p.oilSheen);
    R(206, 196, 20, 1, p.oilMoon); R(226, 197, 6, 1, p.oilSheen);
    R(200, 201, 9, 1, p.oilSheen);
  }

  function hasOil(tx, ty) {
    var i;
    for (i = 0; i < POOL_CELLS.length; i++) {
      if (POOL_CELLS[i][0] === tx && POOL_CELLS[i][1] === ty) return true;
    }
    return false;
  }

  /* --------------------------------------------------------------- trees */

  var CONIFER_SHAPES = [
    [2, 4, 5, 7, 8, 10, 11, 13],
    [2, 3, 5, 6, 8, 9, 11, 12, 14],
    [1, 3, 4, 6, 7, 9, 10, 12, 13, 15]
  ];

  function drawConifer(R, p, tx, ty) {
    /* Border evergreen: a stacked silhouette whose shape, height and lean all
     * come from the tile hash, so the wall of trees never stamps.  Moonlight
     * touches the north-west of every terrace and nothing else. */
    var x = tx * TILE, y = ty * TILE, h = hash(tx, ty, 43);
    var shape = CONIFER_SHAPES[h % CONIFER_SHAPES.length];
    var lean = ((h >> 4) & 3) - 1;
    var drop = (h >> 6) & 3;
    var cx = x + 8 + lean;
    var base = y + 16 + drop;
    var top = base - 4 - shape.length * 2;
    var i, w, yy, half;
    R(cx - 2, base - 6, 4, 6, p.ink);
    R(cx - 1, base - 6, 2, 5, p.deep);
    for (i = 0; i < shape.length; i++) {
      w = shape[i];
      half = w >> 1;
      yy = top + i * 2;
      R(cx - half - 1, yy, w + 2, 3, p.ink);
      R(cx - half, yy, w, 2, p.deep);
      if (w > 4) R(cx - half, yy, Math.max(2, w >> 2), 1, p.shadow);
      if (w > 8 && (i & 1) === 0) R(cx - half + 1, yy + 1, 2, 1, p.mid);
    }
    R(cx - 1, top, 2, 2, p.shadow);
  }

  function drawSycamore(R, p, tx, ty) {
    /* The ring trees are deciduous and much larger than the border conifers.
     * Two things separate them at a glance: a round crown instead of a cone,
     * and a pale trunk standing clear below it — they are the only light
     * verticals on the map, which is what lets eight of them read as a
     * circle rather than as eight dark lumps.  Every measurement below comes
     * off the tile hash, so no two of the eight are the same tree. */
    var x = tx * TILE, y = ty * TILE, h = hash(tx, ty, 71);
    var cx = x + 8 + ((h >> 18 & 3) - 1);
    var base = y + 16;
    var trunkW = 6 + (h & 1) * 2;
    var trunkH = 14 + ((h >> 1) & 3);
    var half = trunkW >> 1;
    var trunkTop = base - trunkH - 1;
    var grow = (h >> 3) & 3;
    var crownTop = trunkTop - 20 - grow;
    var i, w, yy, hw;
    /* Root flare, then the trunk: pale bark with its own dark side. */
    R(cx - half - 2, base - 4, trunkW + 4, 4, p.ink);
    R(cx - half - 1, base - 4, trunkW + 2, 3, p.shadow);
    R(cx - half - 1, base - 3, 3, 2, p.mid); R(cx + half - 1, base - 3, 3, 2, p.mid);
    R(cx - half - 1, trunkTop, trunkW + 2, trunkH + 2, p.ink);
    R(cx - half, trunkTop, trunkW, trunkH + 1, p.light);
    R(cx - half, trunkTop, 2, trunkH + 1, p.moon);
    R(cx + half - 2, trunkTop, 2, trunkH + 1, p.mid);
    /* Bark marks: the sycamore's peeling plates, placed by the hash. */
    R(cx - half + 2, trunkTop + 3 + ((h >> 5) & 3), 3, 1, p.mid);
    R(cx - half + 1, trunkTop + 9 + ((h >> 7) & 3), 2, 1, p.mid);
    if ((h >> 9 & 1) === 0) R(cx - half + 3, trunkTop + 6, 2, 2, p.shadow);
    /* Two limbs lifting out of the trunk into the crown. */
    R(cx - half - 5, trunkTop - 4, 7, 4, p.ink);
    R(cx - half - 4, trunkTop - 4, 5, 2, p.light);
    R(cx + half - 2, trunkTop - 6, 7, 4, p.ink);
    R(cx + half - 1, trunkTop - 6, 5, 2, p.mid);
    /* Crown: five stepped bands in the darkest value on the map, so the pale
     * trunk reads against it. */
    var bands = [12, 20, 25, 23, 16];
    for (i = 0; i < bands.length; i++) {
      w = bands[i] + ((h >> (i + 10)) & 3) * 2 + grow;
      hw = w >> 1;
      yy = crownTop + i * 5;
      R(cx - hw - 1, yy, w + 2, 6, p.ink);
      R(cx - hw, yy, w, 5, p.deep);
    }
    /* Leaf clusters, then the single moon rim on the north-west shoulder. */
    R(cx - 10, crownTop + 9, 7, 5, p.shadow);
    R(cx + 4, crownTop + 13, 6, 5, p.shadow);
    R(cx - 5, crownTop + 16, 9, 4, p.shadow);
    R(cx - 2, crownTop + 4, 7, 4, p.shadow);
    R(cx + 6, crownTop + 6, 4, 4, p.shadow);
    R(cx - 11, crownTop + 10, 4, 2, p.mid);
    R(cx - 8, crownTop + 5, 5, 2, p.mid);
    R(cx - 3, crownTop + 2, 6, 2, p.mid);
    R(cx + 3, crownTop + 4, 3, 2, p.mid);
    R(cx - 5, crownTop + 1, 3, 1, p.light);
    /* Two gaps in the silhouette so the crown is not an egg; which two
     * depends on the hash. */
    R(cx - 13 + ((h >> 14 & 1) * 2), crownTop + 13, 3, 4, p.shadow);
    R(cx + 10 - ((h >> 15 & 1) * 2), crownTop + 8, 3, 4, p.shadow);
  }

  function drawBush(R, p, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    R(x + 1, y + 4, 14, 12, p.ink);
    R(x + 2, y + 5, 12, 10, p.deep);
    R(x + 3, y + 6, 5, 4, p.shadow); R(x + 9, y + 8, 4, 3, p.shadow);
    R(x + 4, y + 6, 3, 2, p.mid);
    R(x + 2, y + 14, 12, 2, p.ink);
  }

  function drawCrate(R, p, tx, ty) {
    /* A crate standing on the ground, not a hole in the wall behind it: the
     * lid catches the moon, the front face is in shadow, and a contact band
     * sits under it. */
    var x = tx * TILE, y = ty * TILE;
    R(x + 2, y + 15, 12, 2, p.ink);
    R(x + 2, y + 2, 12, 14, p.ink);
    R(x + 3, y + 3, 10, 3, p.light);
    R(x + 3, y + 3, 10, 1, p.moon);
    R(x + 3, y + 6, 10, 9, p.mid);
    R(x + 3, y + 6, 10, 1, p.shadow);
    R(x + 5, y + 7, 1, 7, p.shadow);
    R(x + 9, y + 7, 1, 7, p.shadow);
    R(x + 3, y + 13, 10, 2, p.shadow);
  }

  function drawSign(R, p) {
    /* GLASTONBURY GROVE: two posts and a board with three text lines.  At
     * sixteen pixels the letters are texture, the shape is the message. */
    var x = SIGN.tx * TILE, y = SIGN.ty * TILE;
    R(x + 2, y + 9, 3, 8, p.ink); R(x + 3, y + 9, 1, 7, p.mid);
    R(x + 12, y + 9, 3, 8, p.ink); R(x + 13, y + 9, 1, 7, p.mid);
    R(x - 1, y - 2, 20, 13, p.ink);
    R(x, y - 1, 18, 11, p.signShade);
    R(x + 1, y, 16, 8, p.signFace);
    R(x + 1, y, 16, 1, p.moon);
    R(x + 3, y + 2, 12, 1, p.ink);
    R(x + 2, y + 4, 14, 1, p.ink);
    R(x + 4, y + 6, 9, 1, p.ink);
    R(x, y + 8, 18, 2, p.ink);
    R(x + 1, y + 10, 16, 1, p.shadow);
  }

  function drawLodge(R, p, rows) {
    /* The north wall of the grove: a dark timber face with a moonlit top
     * edge.  It is whatever the map already says is there — this paints the
     * '8' cells, it does not add or move any. */
    var tx, ty, ch, x, y, h;
    for (ty = 0; ty < rows.length; ty++) {
      for (tx = 0; tx < rows[ty].length; tx++) {
        ch = rows[ty].charAt(tx);
        if (ch !== '8') continue;
        x = tx * TILE; y = ty * TILE; h = hash(tx, ty, 97);
        R(x, y, 16, 16, p.deep);
        R(x, y, 16, 2, p.ink);
        R(x, y + 4, 16, 1, p.shadow);
        R(x, y + 10, 16, 1, p.shadow);
        if (cellAt(rows, tx, ty - 1) !== '8') {
          R(x, y, 16, 3, p.ink); R(x, y + 1, 16, 1, p.mid);
        }
        if ((h & 3) === 0) R(x + 3, y + 6, 4, 2, p.ink);
        if ((h & 7) === 5) R(x + 10, y + 12, 3, 2, p.ink);
      }
    }
  }

  function drawPortal(R, p, open) {
    /* The threshold at 14,4: two heavy red drapes with a black gap between
     * them.  When the third clue is in hand the gap takes a step of light and
     * the ground in front of it a faint wash — the only warm pixels on the
     * map, and no geometry of any kind. */
    var x = PORTAL.tx * TILE, y = PORTAL.ty * TILE;
    R(x - 2, y - 2, 20, 20, p.ink);
    R(x - 1, y - 1, 18, 18, p.curtainDeep);
    R(x, y, 7, 17, p.curtain);
    R(x + 9, y, 7, 17, p.curtain);
    R(x + 1, y, 1, 17, p.curtainHi); R(x + 4, y, 1, 17, p.curtainHi);
    R(x + 10, y, 1, 17, p.curtainHi); R(x + 13, y, 1, 17, p.curtainHi);
    R(x + 3, y, 1, 17, p.curtainDeep); R(x + 12, y, 1, 17, p.curtainDeep);
    R(x - 1, y - 1, 18, 2, p.curtainHi);
    R(x + 7, y, 2, 17, p.ink);
    if (open) {
      R(x + 7, y + 2, 2, 13, p.curtainHi);
      R(x + 7, y + 5, 2, 7, p.curtainCore);
      R(x - 4, y + 17, 24, 4, p.glow);
      R(x, y + 17, 16, 3, p.curtainDeep);
      R(x + 4, y + 17, 8, 2, p.curtain);
    }
  }

  /* --------------------------------------------------------------- passes */

  function treeList(rows) {
    var list = [], ty, tx, ch;
    for (ty = 0; ty < rows.length; ty++) {
      for (tx = 0; tx < rows[ty].length; tx++) {
        ch = rows[ty].charAt(tx);
        if (ch === 'T') list.push({ tx: tx, ty: ty, sycamore: false, footY: (ty + 1) * TILE });
        else if (ch === 'Y') list.push({ tx: tx, ty: ty, sycamore: true, footY: (ty + 1) * TILE });
      }
    }
    return list;
  }

  function draw(ctx, cx, cy, vw, vh, map, opts) {
    var rows = (map && map.rows) || [];
    if (!rows.length) return;
    var R = rectPainter(ctx, cx, cy);
    vw = vw || 256; vh = vh || 192;
    /* Same overdraw the tile pipeline uses: a canopy is taller than the cell
     * that anchors it, so a tree two rows off screen can still be visible. */
    var over = 3;
    var x0 = Math.floor(cx / TILE) - over, y0 = Math.floor(cy / TILE) - over;
    var x1 = Math.floor((cx + vw - 1) / TILE) + over;
    var y1 = Math.floor((cy + vh - 1) / TILE) + over;
    var x, y, mx, my, ch, i, tree;

    /* 1. base ground, including off-map edge extension */
    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        mx = Math.max(0, Math.min(map.width - 1, x));
        my = Math.max(0, Math.min(rows.length - 1, y));
        ch = rows[my].charAt(mx);
        if (ch === 'T' || ch === 'q' || ch === '8' || ch === 'D') drawForestFloor(R, palette, x, y);
        else drawGroveFloor(R, palette, x, y);
      }
    }

    /* 2. the ring of worn earth, under the path and under the pool */
    drawRing(R, palette);

    /* 3. the path on top of it, with its edge grammar */
    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        mx = Math.max(0, Math.min(map.width - 1, x));
        my = Math.max(0, Math.min(rows.length - 1, y));
        if (rows[my].charAt(mx) !== 'p') continue;
        drawPathTile(R, palette, rows, x, y);
      }
    }

    /* 4. the grove's fixed features */
    drawOilPool(R, palette);
    drawLodge(R, palette, rows);
    drawPortal(R, palette, !!(opts && opts.woodsOpen));
    drawSign(R, palette);

    /* 5. trees, north to south, plus the two solid props.  Canopies live in
     * this pass and never in a depth band: an actor is always in front. */
    var trees = treeList(rows);
    for (i = 0; i < trees.length; i++) {
      tree = trees[i];
      if (tree.tx < x0 - 1 || tree.tx > x1 + 1 || tree.ty < y0 - 1 || tree.ty > y1 + 2) continue;
      if (tree.sycamore) drawSycamore(R, palette, tree.tx, tree.ty);
      else drawConifer(R, palette, tree.tx, tree.ty);
    }
    for (y = 0; y < rows.length; y++) {
      for (x = 0; x < rows[y].length; x++) {
        ch = rows[y].charAt(x);
        if (ch === 'n') drawBush(R, palette, x, y);
        else if (ch === 'q') drawCrate(R, palette, x, y);
      }
    }
  }

  /* The woods paints no depth band on purpose.  Every canopy is taller than
   * the actor it would cover, so repainting one over Cooper on a path tile
   * would bury him; the trees stay in the ground pass instead. */
  function foreground() { return undefined; }

  GAME.WoodsArt = {
    draw: draw,
    foreground: foreground,
    palette: palette,
    hash: hash,
    ring: RING,
    poolCells: POOL_CELLS,
    sycamores: SYCAMORES,
    portal: PORTAL,
    sign: SIGN,
    treeList: treeList
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.WoodsArt;
})();
