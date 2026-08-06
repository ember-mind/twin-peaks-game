/* retro-authored.js — tileset/sprite authored per produzione Game Boy Color.
 * Ogni forma principale nasce da matrici pixel 16x16 / 16x20. Le mappe ASCII,
 * le collisioni e i dati narrativi restano invariati.
 */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME;
  if (!GAME || !GAME.Sprites) return;
  var Spr = GAME.Sprites;
  var oldTile = Spr.drawTile;
  var CHARS = Spr.CHARS || {};

  var C = {
    ink: '#202820', dark: '#385840', mid: '#689848', grass: '#a8d068', hi: '#e0e8a0',
    earth: '#e8d898', earth2: '#a89068', road: '#d8d0a0', road2: '#787860',
    paper: '#fff8d0', wood: '#a86848', wood2: '#583838', water: '#7890c8',
    water2: '#c0d0e0', red: '#b84858', gold: '#f0d060'
  };

  function R(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function lighter(hex, amount) {
    var raw = String(hex || '').replace('#', '');
    if (raw.length !== 6) return '#687060';
    var n = parseInt(raw, 16), out = [], i;
    for (i = 16; i >= 0; i -= 8) out.push(Math.min(255, ((n >> i) & 255) + (amount || 32)));
    return '#' + out.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }

  function hash(x, y, salt) {
    var n = Math.imul((x | 0) + 37, 374761393) ^ Math.imul((y | 0) + 61, 668265263) ^ salt;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return (n ^ (n >>> 16)) >>> 0;
  }

  function cell(rows, x, y) {
    if (!rows || y < 0 || y >= rows.length || x < 0 || x >= rows[y].length) return ' ';
    return rows[y].charAt(x);
  }

  function paint(ctx, pattern, palette, x, y, flip) {
    var py, px, row, k, start = -1, last = null;
    for (py = 0; py < pattern.length; py++) {
      row = pattern[py]; start = -1; last = null;
      for (px = 0; px <= row.length; px++) {
        k = px < row.length ? row.charAt(flip ? row.length - 1 - px : px) : '!';
        if (k !== last) {
          if (last !== null && last !== '.' && palette[last]) R(ctx, x + start, y + py, px - start, 1, palette[last]);
          start = px; last = k;
        }
      }
    }
  }

  var GRASS = [
    [
      '0000000000000000','0000000000000000','0011000000000000','0221000000000000',
      '0000000000000000','0000000000000000','0000000000000000','0000000000220000',
      '0000000001220000','0000000000000000','0000000000000000','0000000000000000',
      '0000000000000000','0000002200000000','0000000000000000','0000000000000000'
    ],
    [
      '0000000000000000','0000000000011000','0000000000022100','0000000000000000',
      '0000000000000000','0000000000000000','0000110000000000','0002210000000000',
      '0000000000000000','0000000000000000','0000000000000000','0000000000000000',
      '0000000011000000','0000000022000000','0000000000000000','0000000000000000'
    ],
    [
      '0000000000000000','0000002200000000','0000012200000000','0000000000000000',
      '0000000000000000','0000000000001100','0000000000022100','0000000000000000',
      '0000000000000000','0000000000000000','0000000000000000','0011000000000000',
      '0022100000000000','0000000000000000','0000000000000000','0000000000000000'
    ],
    [
      '0000000000000000','0000000000000000','0000000001100000','0000000002200000',
      '0000000000000000','0000000000000000','0000000000000000','0000000000000000',
      '0000000000000000','0110000000000000','0220000000000000','0000000000000000',
      '0000000000000000','0000000000001100','0000000000002200','0000000000000000'
    ]
  ];

  var DARK_GRASS = [
    '0000000000000000','0100000100000100','2000002000002000','0000000000000000',
    '0001000001000001','0020000020000020','0000000000000000','0100000100000100',
    '2000002000002000','0000000000000000','0001000001000001','0020000020000020',
    '0000000000000000','0100000100000100','2000002000002000','0000000000000000'
  ];

  /* Dither notturno 8x8 authored. Quattro fasi ripetibili, nessun rumore
   * procedurale: stessa densita' minuta del terreno Gen II. */
  var NIGHT_GROUND_8 = [
    ['00000000','00100000','00010000','00000020','00000020','00000000','01000000','10000000'],
    ['00000000','00002000','00000200','00000000','10000000','01000000','00000001','00000001'],
    ['00001000','00000100','20000000','20000000','00000000','00100000','00010000','00000000'],
    ['00000020','00000020','00000000','00010000','00001000','02000000','02000000','00000000']
  ];
  var NIGHT_GROUND_PHASES = [
    0, 2, 1, 3,
    3, 1, 0, 2,
    1, 3, 2, 0,
    2, 0, 3, 1
  ];

  function nightGround(ctx, x, y, tx, ty) {
    var qx, qy, phase;
    for (qy = 0; qy < 2; qy++) for (qx = 0; qx < 2; qx++) {
      phase = NIGHT_GROUND_PHASES[((((ty * 2) + qy) & 3) << 2) | (((tx * 2) + qx) & 3)];
      paint(ctx, NIGHT_GROUND_8[phase], { 0: '#7770a8', 1: '#958db8', 2: '#5b5684' }, x + qx * 8, y + qy * 8);
    }
  }

  var TREE_CANOPY = [
    '.......33.......','......3213......','.....321113.....','....3211113.....',
    '...3211211123...','..333211112333..','.....32113......','....3211113.....',
    '...321121113....','..32111111123...','.3211121111113..','3333211111233333',
    '....321113......','...32111113.....','..32112111123...','.32111111111123.',
    '3211121111111123','3333333333333333','......3443......','......3443......',
    '.....344443.....','......3443......','......3443......','................'
  ];
  var TREE_CANOPY_B = [
    '.......33.......','......3213......','.....321113.....','....32121113....',
    '...3211111123...','..333211112333..','......3213......','.....321113.....',
    '....32111113....','...3211211113...','..321111111123..','.33332111233333.',
    '.....321113.....','....32112113....','...3211111113...','..321121111123..',
    '.32111111111123.','3333333333333333','......3443......','......3443......',
    '.....344443.....','......3443......','......3443......','................'
  ];
  var TREE_CANOPY_C = [
    '......33........','.....3213.......','....321113......','...32111123.....',
    '..3211211123....','.3332111112333..','.....3213.......','....321113......',
    '...32112113.....','..3211111113....','.3211121111123..','333321111123333.',
    '....321113......','...32111113.....','..32112111123...','.3211111111123..',
    '321112111111123.','3333333333333333','.....3443.......','.....3443.......',
    '....344443......','.....3443.......','.....3443.......','................'
  ];
  var TREE_VARIANT_GRID = [0, 3, 1, 4, 2, 5, 4, 1, 5, 2, 3, 0, 1, 4, 0, 3];
  var TREE_TRUNK = [
    '......3443......','......3443......','......3443......','.....344443.....','.....344443.....',
    '......3443......','......3443......','......3443......','......3443......'
  ];

  var TALL_GRASS = [
    '................','................','................','................',
    '..1....1.....1..','..12...12...12..','..12..112...12..','.112..121..112..','1212.1121..121..','2121.1212.1212..',
    '1212.2121.2121..','2121.1212.1212..','1212.2121.2121..','2121.1212.1212..','1111.1111.1111..','................'
  ];
  var FLOWER_PATCH = [
    '................','................','................','...1........2...','..121.......2...','...1.......121..','...3........3...','..33........33..',
    '................','.........1......','........121.....','.........1......','.........3......','........33......','................','................'
  ];
  var FERN_PATCH = [
    '................','................','.......1........','.....112........','...11212........','....1212........','......12........','.......2........',
    '..........1.....','........211.....','......2121......','......212.......','.......2........','................','................','................'
  ];

  var ROAD = [
    '0000000000000000','0000000000000000','0000000000010000','0000000000110000',
    '0000000000000000','0000200000000000','0002220000000000','0000000000000000',
    '0000000000000000','0000000000000000','0000000010000000','0000000110000000',
    '0000000000000000','0000022200000000','0000000000000000','0000000000000000'
  ];

  var PATH = [
    '1000000000000001','1000000000000001','2000000000022002','1000000000000001',
    '1000220000000001','1000000000000001','1000000000000001','2000000002200002',
    '1000000000000001','1000002200000001','1000000000000001','2000000000000002',
    '1000020000000001','1000000000220001','1000000000000001','1000000000000001'
  ];

  var FLOOR = [
    '2222222222222222','0000000010000000','0000000010000000','0000000010000000',
    '0000000010000000','0000000010000000','2222222222222222','0000100000001000',
    '0000100000001000','0000100000001000','0000100000001000','0000100000001000',
    '0000100000001000','2222222222222222','0000000010000000','0000000010000000'
  ];

  var WALL = [
    '1111111111111111','1222222222222221','1200000000000021','1203333333333021',
    '1203333333333021','1200000000000021','1222222222222221','1111111111111111',
    '1111111111111111','1222222222222221','1200000000000021','1203333333333021',
    '1203333333333021','1200000000000021','1222222222222221','1111111111111111'
  ];

  function groundShadow(ctx, x, y, tx, ty, rows) {
    if ('12345678D'.indexOf(cell(rows, tx, ty - 1)) < 0) return;
    R(ctx, x, y, 16, 2, C.ink); R(ctx, x + 2, y + 2, 12, 2, C.dark);
  }

  function grass(ctx, x, y, tx, ty, dark, night, rows) {
    var atlas = (tx & 1) + ((ty & 1) << 1);
    if (night) {
      nightGround(ctx, x, y, tx, ty);
      groundShadow(ctx, x, y, tx, ty, rows); return;
    }
    if (dark) {
      R(ctx, x, y, 16, 16, C.grass);
      paint(ctx, TALL_GRASS, { 1: C.dark, 2: C.mid }, x, y);
      groundShadow(ctx, x, y, tx, ty, rows); return;
    }
    paint(ctx, GRASS[atlas], { 0: C.grass, 1: C.mid, 2: C.dark }, x, y);
    groundShadow(ctx, x, y, tx, ty, rows);
  }

  function tree(ctx, x, y, tx, ty, rows, sycamore, night) {
    /* Tile BG 2bpp credibile: un solo colore terreno + tre colori chioma.
     * Tronco condivide outline; niente seconda palette di erba sotto. */
    R(ctx, x, y, 16, 16, night ? '#7770a8' : C.grass);
    var treePalette = night ?
      (sycamore ? { 1: '#686898', 2: '#a0a0d0', 3: '#172838', 4: '#172838' } :
                   { 1: '#3d5068', 2: '#7278a8', 3: '#102838', 4: '#102838' }) :
      (sycamore ? { 1: '#b0c868', 2: '#688848', 3: '#203830', 4: '#203830' } :
                   { 1: '#78a850', 2: '#407048', 3: '#183830', 4: '#183830' });
    /* Conifera 16x24: silhouette Gen II stretta, terrazze irregolari. */
    var variant = TREE_VARIANT_GRID[((ty & 3) << 2) | (tx & 3)];
    if (night) {
      /* Dither terreno con un colore gia' presente nella palette albero:
       * quattro colori totali per tile, non una seconda palette sottostante. */
      R(ctx, x + 2, y + 3, 1, 1, treePalette[2]); R(ctx, x + 12, y + 5, 1, 1, treePalette[2]);
      R(ctx, x + 6, y + 11, 1, 1, treePalette[2]); R(ctx, x + 14, y + 14, 1, 1, treePalette[2]);
    }
    if (!night) paint(ctx, TREE_TRUNK, treePalette, x, y + 7, false);
    if (night) {
      /* Rami laterali contenuti: silhouette resta netta a 1× e l'overlap
       * non produce fasce orizzontali fra alberi adiacenti. */
      R(ctx, x - 2, y + 1, 4, 1, treePalette[3]); R(ctx, x + 14, y + 1, 4, 1, treePalette[3]);
      R(ctx, x - 1, y + 7, 3, 1, treePalette[2]); R(ctx, x + 14, y + 7, 3, 1, treePalette[2]);
      R(ctx, x - 2, y + 13, 4, 1, treePalette[3]); R(ctx, x + 14, y + 13, 4, 1, treePalette[3]);
    }
    paint(ctx, variant % 3 === 0 ? TREE_CANOPY : (variant % 3 === 1 ? TREE_CANOPY_B : TREE_CANOPY_C),
      treePalette, x, y - 8, variant >= 3);
    /* Connessioni sottili tra metatile adiacenti: le terrazze si toccano
     * senza trasformare la chioma in fasce orizzontali. */
    if (cell(rows, tx - 1, ty) === 'T' || cell(rows, tx - 1, ty) === 'Y') {
      R(ctx, x, y + 7, 3, 1, treePalette[2]); R(ctx, x, y + 13, 3, 3, treePalette[3]);
    }
    if (cell(rows, tx + 1, ty) === 'T' || cell(rows, tx + 1, ty) === 'Y') {
      R(ctx, x + 13, y + 7, 3, 1, treePalette[2]); R(ctx, x + 13, y + 13, 3, 3, treePalette[3]);
    }
  }

  function road(ctx, x, y, tx, ty) {
    var yy, seam;
    R(ctx, x, y, 16, 16, '#d0a0b0');
    for (yy = 0; yy < 16; yy += 4) {
      R(ctx, x, y + yy, 16, 1, '#a86f80');
      seam = ((ty + yy / 4) & 1) ? 4 : 12;
      R(ctx, x + seam, y + yy + 1, 1, 3, '#b88090');
    }
    var rows = arguments[6];
    if (rows) {
      if (cell(rows, tx - 1, ty) !== 'r' && cell(rows, tx - 1, ty) !== '-') R(ctx, x, y, 2, 16, '#584858');
      if (cell(rows, tx + 1, ty) !== 'r' && cell(rows, tx + 1, ty) !== '-') R(ctx, x + 14, y, 2, 16, '#584858');
      if (cell(rows, tx, ty - 1) !== 'r' && cell(rows, tx, ty - 1) !== '-') {
        R(ctx, x, y, 16, 2, '#584858'); R(ctx, x + 2, y + 2, 12, 1, '#efd7c0');
      }
      if (cell(rows, tx, ty + 1) !== 'r' && cell(rows, tx, ty + 1) !== '-') {
        R(ctx, x, y + 14, 16, 2, '#584858'); R(ctx, x + 2, y + 13, 12, 1, '#efd7c0');
      }
    }
  }

  function sidewalk(ctx, x, y, tx, ty, rows) {
    R(ctx, x, y, 16, 16, '#d8d2ad');
    R(ctx, x, y + 7, 16, 1, '#8b8d78');
    R(ctx, x + ((ty & 1) ? 4 : 11), y, 1, 7, '#aaa58b');
    R(ctx, x, y + 14, 16, 2, '#686c62');
    if (cell(rows, tx - 1, ty) === '.' || cell(rows, tx - 1, ty) === 'g') R(ctx, x, y, 2, 16, '#77745f');
    if (cell(rows, tx + 1, ty) === '.' || cell(rows, tx + 1, ty) === 'g') R(ctx, x + 14, y, 2, 16, '#77745f');
    if (cell(rows, tx, ty - 1) === '.' || cell(rows, tx, ty - 1) === 'g') R(ctx, x, y, 16, 2, '#918b70');
    groundShadow(ctx, x, y, tx, ty, rows);
  }

  function water(ctx, x, y, tx, ty, rows) {
    R(ctx, x, y, 16, 16, C.water);
    R(ctx, x + 1, y + 4, 8, 1, C.water2); R(ctx, x + 7, y + 10, 8, 1, '#526f98');
    if (cell(rows, tx, ty - 1) !== 'w') {
      R(ctx, x, y, 16, 2, C.ink); R(ctx, x, y + 2, 16, 2, '#b09a6c');
      R(ctx, x + 2, y + 4, 6, 1, C.water2);
    }
    if (cell(rows, tx, ty + 1) !== 'w') { R(ctx, x, y + 13, 16, 1, '#b09a6c'); R(ctx, x, y + 14, 16, 2, C.ink); }
    if (cell(rows, tx - 1, ty) !== 'w') { R(ctx, x, y, 2, 16, C.ink); R(ctx, x + 2, y + 3, 1, 10, '#b09a6c'); }
    if (cell(rows, tx + 1, ty) !== 'w') { R(ctx, x + 14, y, 2, 16, C.ink); R(ctx, x + 13, y + 3, 1, 10, '#b09a6c'); }
  }

  function fence(ctx, x, y, tx, ty, rows) {
    grass(ctx, x, y, tx, ty, false, false, rows);
    var horizontal = cell(rows, tx - 1, ty) === 'F' || cell(rows, tx + 1, ty) === 'F';
    if (horizontal) {
      R(ctx, x, y + 5, 16, 2, C.ink); R(ctx, x, y + 6, 16, 2, '#d6c484');
      R(ctx, x, y + 11, 16, 2, C.ink); R(ctx, x, y + 12, 16, 1, '#9a714e');
      R(ctx, x + 6, y + 2, 4, 14, C.ink); R(ctx, x + 7, y + 3, 2, 12, '#d6c484');
    } else {
      R(ctx, x + 4, y, 2, 16, C.ink); R(ctx, x + 6, y, 2, 16, '#d6c484');
      R(ctx, x + 10, y, 2, 16, C.ink); R(ctx, x + 12, y, 1, 16, '#9a714e');
      R(ctx, x + 2, y + 6, 13, 4, C.ink); R(ctx, x + 3, y + 7, 11, 2, '#d6c484');
    }
  }

  function urbanRail(ctx, x, y) {
    /* Argine/rail metallica del quartiere industriale. Quattro colori,
     * montanti grigi e pietra: niente scala verde dominante. */
    R(ctx, x, y, 16, 16, '#7890c8');
    R(ctx, x + 3, y, 3, 16, '#30383b'); R(ctx, x + 4, y, 1, 16, '#d0c89d');
    R(ctx, x + 11, y, 3, 16, '#30383b'); R(ctx, x + 12, y, 1, 16, '#d0c89d');
    R(ctx, x, y + 1, 16, 2, '#30383b'); R(ctx, x, y + 2, 16, 1, '#788082');
    R(ctx, x, y + 6, 16, 2, '#30383b'); R(ctx, x, y + 7, 16, 1, '#788082');
    R(ctx, x, y + 11, 16, 2, '#30383b'); R(ctx, x, y + 12, 16, 1, '#788082');
  }

  function urbanRailHorizontal(ctx, x, y, lip) {
    /* Tratto inferiore della ferrovia a L del target: due rotaie, traversine
     * ogni 4 px e acqua visibile fra i moduli. */
    R(ctx, x, y, 16, 16, '#7890c8');
    if (lip) {
      R(ctx, x, y, 16, 3, '#30383b'); R(ctx, x, y + 1, 16, 1, '#d0c89d');
      R(ctx, x + 2, y, 2, 6, '#788082'); R(ctx, x + 7, y, 2, 6, '#788082');
      R(ctx, x + 12, y, 2, 6, '#788082');
      return;
    }
    R(ctx, x, y + 3, 16, 3, '#30383b'); R(ctx, x, y + 4, 16, 1, '#d0c89d');
    R(ctx, x, y + 10, 16, 3, '#30383b'); R(ctx, x, y + 11, 16, 1, '#d0c89d');
    R(ctx, x + 2, y + 1, 2, 14, '#788082'); R(ctx, x + 7, y + 1, 2, 14, '#788082');
    R(ctx, x + 12, y + 1, 2, 14, '#788082');
  }

  function path(ctx, x, y, tx, ty, rows) {
    var left = cell(rows, tx - 1, ty) === 'p', right = cell(rows, tx + 1, ty) === 'p';
    var up = cell(rows, tx, ty - 1) === 'p', down = cell(rows, tx, ty + 1) === 'p';
    R(ctx, x, y, 16, 16, C.earth);
    if (((tx + ty) & 1) === 0) {
      R(ctx, x + 5, y + 4, 3, 1, C.earth2); R(ctx, x + 11, y + 11, 2, 1, '#f2e3ac');
    } else {
      R(ctx, x + 10, y + 3, 2, 1, C.earth2); R(ctx, x + 4, y + 12, 3, 1, '#f2e3ac');
    }
    if (!left) { R(ctx, x, y, 2, 16, C.dark); R(ctx, x + 2, y + 1, 1, 14, C.earth2); }
    if (!right) { R(ctx, x + 14, y, 2, 16, C.dark); R(ctx, x + 13, y + 1, 1, 14, C.earth2); }
    if (!up) { R(ctx, x, y, 16, 2, C.dark); R(ctx, x + 2, y + 2, 12, 1, '#f2e3ac'); }
    if (!down) { R(ctx, x, y + 14, 16, 2, C.dark); R(ctx, x + 2, y + 13, 12, 1, C.earth2); }
    if (!left && ((ty & 1) === 0)) R(ctx, x + 2, y + 6, 2, 3, C.earth);
    if (!right && ((ty & 1) === 1)) R(ctx, x + 12, y + 9, 2, 3, C.earth);
    groundShadow(ctx, x, y, tx, ty, rows);
  }

  function gravel(ctx, x, y, tx, ty, rows) {
    /* Quattro sottotile 8x8 ripetibili: ghiaia urbana, niente rumore libero. */
    R(ctx, x, y, 16, 16, '#e4d6a1');
    var flip = (tx + ty) & 1;
    R(ctx, x + (flip ? 2 : 5), y + 3, 2, 1, '#9f936f');
    R(ctx, x + (flip ? 11 : 13), y + 6, 1, 2, '#b9aa7e');
    R(ctx, x + (flip ? 6 : 3), y + 11, 2, 1, '#f3e7b8');
    R(ctx, x + (flip ? 14 : 10), y + 14, 1, 1, '#81795f');
    R(ctx, x + (flip ? 5 : 2), y + 1, 1, 1, '#81795f');
    R(ctx, x + (flip ? 8 : 10), y + 9, 2, 1, '#9f936f');
    R(ctx, x + (flip ? 13 : 4), y + 13, 1, 1, '#f3e7b8');
    groundShadow(ctx, x, y, tx, ty, rows);
  }

  function bush(ctx, x, y, tx, ty, rows, night) {
    R(ctx, x, y, 16, 16, night ? '#7770a8' : C.grass);
    var edge = night ? '#172838' : C.ink;
    var body = night ? '#505888' : '#507848';
    var light = night ? '#8580b0' : '#88a858';
    if (night) {
      R(ctx, x + 2, y + 2, 1, 1, body); R(ctx, x + 12, y + 3, 1, 1, body);
      R(ctx, x + 5, y + 14, 1, 1, body);
    }
    R(ctx, x + 5, y + 4, 6, 1, edge); R(ctx, x + 3, y + 5, 10, 2, edge);
    R(ctx, x + 1, y + 7, 14, 6, edge); R(ctx, x + 3, y + 13, 10, 2, edge);
    R(ctx, x + 4, y + 6, 8, 7, body); R(ctx, x + 2, y + 8, 12, 4, body);
    R(ctx, x + 5, y + 6, 4, 3, light); R(ctx, x + 10, y + 10, 2, 2, light);
    R(ctx, x + 7, y + 12, 2, 2, edge);
  }

  function oilPool(ctx, x, y, tx, ty, rows) {
    R(ctx, x, y, 16, 16, '#7770a8');
    var l = cell(rows, tx - 1, ty) === 'o', r = cell(rows, tx + 1, ty) === 'o';
    var u = cell(rows, tx, ty - 1) === 'o', d = cell(rows, tx, ty + 1) === 'o';
    var x0 = l ? 0 : 3, x1 = r ? 16 : 13, y0 = u ? 0 : 3, y1 = d ? 16 : 13;
    R(ctx, x + x0, y + y0, x1 - x0, y1 - y0, '#172028');
    if (!l && !u) { R(ctx, x + x0, y + y0, 3, 1, '#7770a8'); R(ctx, x + x0, y + y0 + 1, 1, 2, '#7770a8'); }
    if (!r && !u) { R(ctx, x + x1 - 3, y + y0, 3, 1, '#7770a8'); R(ctx, x + x1 - 1, y + y0 + 1, 1, 2, '#7770a8'); }
    if (!l && !d) { R(ctx, x + x0, y + y1 - 1, 3, 1, '#7770a8'); R(ctx, x + x0, y + y1 - 3, 1, 2, '#7770a8'); }
    if (!r && !d) { R(ctx, x + x1 - 3, y + y1 - 1, 3, 1, '#7770a8'); R(ctx, x + x1 - 1, y + y1 - 3, 1, 2, '#7770a8'); }
    if (!l) { R(ctx, x + 2, y + 6, 1, 5, '#403858'); R(ctx, x + 3, y + 4, 1, 2, '#403858'); }
    if (!r) R(ctx, x + 13, y + 5, 1, 6, '#403858');
    if (!u) R(ctx, x + 5, y + 2, 6, 1, '#403858');
    if (!d) R(ctx, x + 5, y + 13, 6, 1, '#403858');
    if (((tx + ty) & 1) === 0) R(ctx, x + 8, y + 8, 2, 2, '#d8c878');
  }

  function floor(ctx, x, y, tx, ty, carpet) {
    var yy, seam;
    if (carpet) {
      R(ctx, x, y, 16, 16, '#9a4f5c');
      R(ctx, x, y, 2, 16, '#6b3441'); R(ctx, x + 14, y, 2, 16, '#6b3441');
      if (((tx + ty) & 1) === 0) { R(ctx, x + 7, y + 7, 2, 2, '#d08376'); R(ctx, x + 6, y + 8, 4, 1, '#6b3441'); }
      return;
    }
    R(ctx, x, y, 16, 16, '#a9aaa0');
    for (yy = 0; yy < 16; yy += 4) {
      R(ctx, x, y + yy, 16, 1, '#c3c4b2');
      R(ctx, x, y + yy + 3, 16, 1, '#85877f');
      seam = (((ty + yy / 4) & 1) ? 4 : 12);
      R(ctx, x + seam, y + yy + 1, 1, 2, '#92948a');
    }
  }

  var BUILDINGS = {
    '1': ['#406878','#78a0a0','#e0c888','#305060'],
    '2': ['#407898','#78a8b8','#d08058','#983848'],
    '3': ['#885848','#c08060','#e8d098','#603838'],
    '4': ['#386848','#78a060','#a87850','#403028'],
    '5': ['#708890','#b0c0b8','#f0e8c8','#487888'],
    '6': ['#403038','#805048','#805048','#282028'],
    '7': ['#242a30','#697074','#4b5054','#202428'],
    '8': ['#31583f','#6d8a52','#8a78a8','#34324f']
  };

  function blobLocal(rows, tx, ty, ch) {
    var lx = 0, ly = 0;
    while (cell(rows, tx - lx - 1, ty) === ch) lx++;
    while (cell(rows, tx, ty - ly - 1) === ch) ly++;
    return { x: lx, y: ly };
  }

  /* Bookhouse: quattro righe authored come edificio urbano di Gen II.
   * Finestre incassate, montanti, ingresso profondo e fondazione: niente
   * rettangolo nero riempito da pattern generico. */
  function bookhouse(ctx, x, y, tx, ty, rows) {
    var q = blobLocal(rows, tx, ty, '7'), lx = q.x, ly = q.y;
    R(ctx, x, y, 16, 16, '#25292e');
    if (ly === 0) {
      R(ctx, x, y, 16, 2, C.ink); R(ctx, x, y + 2, 16, 2, '#61686a');
      if ((lx & 1) === 0) {
        R(ctx, x + 2, y + 4, 12, 8, C.ink); R(ctx, x + 3, y + 5, 10, 6, '#ead486');
        R(ctx, x + 8, y + 5, 1, 6, C.ink); R(ctx, x + 3, y + 8, 10, 1, '#82785d');
      } else {
        R(ctx, x + 3, y + 5, 10, 6, '#353a3f'); R(ctx, x + 4, y + 6, 8, 1, '#7b7e78');
        R(ctx, x + 6, y + 8, 4, 2, '#cfbd75');
      }
      R(ctx, x, y + 12, 16, 2, '#747878'); R(ctx, x, y + 14, 16, 2, C.ink);
    } else if (ly === 1) {
      R(ctx, x, y, 16, 2, '#555b5f');
      if ((lx & 1) === 1) {
        R(ctx, x + 2, y + 3, 12, 9, C.ink); R(ctx, x + 3, y + 4, 10, 7, '#d8c47b');
        R(ctx, x + 8, y + 4, 1, 7, C.ink); R(ctx, x + 3, y + 8, 10, 1, '#706a57');
      } else {
        R(ctx, x + 3, y + 3, 10, 9, '#30353a'); R(ctx, x + 5, y + 5, 6, 1, '#777b7b');
        R(ctx, x + 5, y + 9, 6, 2, '#9d9165');
      }
      R(ctx, x + 2, y + 13, 12, 1, '#73777a');
    } else if (ly === 2 && (lx === 2 || lx === 3)) {
      R(ctx, x, y, 16, 16, C.ink); R(ctx, x + 2, y + 1, 12, 15, '#30353a');
      if (lx === 2) { R(ctx, x + 6, y + 3, 10, 3, '#e7cf77'); R(ctx, x + 6, y + 7, 10, 9, '#171b20'); }
      else { R(ctx, x, y + 3, 8, 3, '#e7cf77'); R(ctx, x, y + 7, 8, 9, '#171b20'); }
    } else if (ly === 3 && (lx === 2 || lx === 3)) {
      R(ctx, x, y, 16, 16, C.ink); R(ctx, x + 3, y, 10, 14, '#171b20');
      if (lx === 2) R(ctx, x + 6, y, 10, 14, '#171b20');
      else R(ctx, x, y, 9, 14, '#171b20');
      R(ctx, x + 5, y + 1, 6, 2, '#3f464a');
      if (lx === 3) R(ctx, x + 9, y + 10, 1, 1, C.gold);
      R(ctx, x, y + 14, 16, 2, '#77736a');
    } else {
      R(ctx, x + 2, y + 2, 12, 12, '#30353a');
      if (ly === 2) {
        R(ctx, x + 3, y + 3, 10, 4, C.ink); R(ctx, x + 4, y + 4, 8, 2, '#d9c578');
        R(ctx, x + 3, y + 9, 10, 1, '#6c7172'); R(ctx, x + 7, y + 7, 2, 7, '#171b20');
      } else {
        R(ctx, x + 3, y + 2, 3, 10, '#555b5f'); R(ctx, x + 10, y + 2, 3, 10, '#555b5f');
        R(ctx, x + 4, y + 4, 1, 6, '#90938c'); R(ctx, x + 11, y + 4, 1, 6, '#90938c');
        R(ctx, x, y + 13, 16, 3, '#171b20');
      }
    }
    R(ctx, x, y, 2, 16, '#171b20'); R(ctx, x + 14, y, 2, 16, '#171b20');
    if (lx === 0) R(ctx, x, y, 3, 16, C.ink);
    if (cell(rows, tx + 1, ty) !== '7') R(ctx, x + 13, y, 3, 16, C.ink);
  }

  /* Loggia: tetto 32px, gronda sporgente, facciata viola a mattoni e
   * finestre 8x8. Riga porta resta gestita da door(). */
  function lodge(ctx, x, y, tx, ty, rows) {
    var q = blobLocal(rows, tx, ty, '8'), lx = q.x, ly = q.y, i;
    /* Collisione resta su griglia; arte sale 8px come reference: tetto a
     * y~12 e facciata chiusa prima dei piedi del player. */
    nightGround(ctx, x, y, tx, ty);
    y -= 8;
    if (ly < 2) {
      R(ctx, x, y, 16, 16, '#31583f');
      if (ly === 0) { R(ctx, x, y, 16, 3, '#171f26'); R(ctx, x, y + 3, 16, 2, '#78925b'); }
      for (i = 2; i < 16; i += 4) {
        R(ctx, x + i, y + (ly ? 0 : 5), 1, ly ? 11 : 11, '#79935d');
        R(ctx, x + i + 1, y + (ly ? 0 : 5), 1, ly ? 11 : 11, '#233f34');
      }
      if (ly === 1) { R(ctx, x, y + 10, 16, 2, '#78925b'); R(ctx, x, y + 12, 16, 4, '#171f26'); }
    } else {
      R(ctx, x, y, 16, 16, '#8a78a8');
      R(ctx, x, y, 16, 2, '#34324f'); R(ctx, x, y + 14, 16, 2, '#34324f');
      /* Mattoni/dither densi ma ripetibili, solo colori facciata. */
      R(ctx, x + 2, y + 3, 3, 1, '#625a89'); R(ctx, x + 9, y + 3, 2, 1, '#a098c0');
      R(ctx, x + 6, y + 5, 3, 1, '#625a89'); R(ctx, x + 13, y + 5, 1, 1, '#625a89');
      R(ctx, x + 1, y + 7, 2, 1, '#a098c0'); R(ctx, x + 10, y + 7, 3, 1, '#625a89');
      R(ctx, x + 4, y + 9, 3, 1, '#625a89'); R(ctx, x + 13, y + 9, 2, 1, '#a098c0');
      R(ctx, x + 1, y + 11, 2, 1, '#625a89'); R(ctx, x + 8, y + 11, 3, 1, '#625a89');
      R(ctx, x + 14, y + 13, 1, 1, '#a098c0'); R(ctx, x + ((lx & 1) ? 11 : 3), y + 13, 2, 1, '#625a89');
      if (ly === 2 && (lx === 2 || lx === 5)) {
        /* Due coppie di finestre, disegnate dal tile destro verso sinistra:
         * quattro aperture come nel Lodge target, non tre finestre isolate. */
        R(ctx, x - 12, y + 3, 22, 10, '#202638');
        R(ctx, x - 11, y + 4, 8, 8, '#f5df70'); R(ctx, x, y + 4, 8, 8, '#f5df70');
        R(ctx, x - 7, y + 4, 1, 8, '#34324f'); R(ctx, x + 4, y + 4, 1, 8, '#34324f');
      } else if (ly === 3) {
        R(ctx, x + 2, y + 4, 4, 1, '#625a89'); R(ctx, x + 10, y + 3, 3, 1, '#a098c0');
        R(ctx, x + ((lx & 1) ? 4 : 9), y + 8, 3, 1, '#625a89');
        R(ctx, x + ((lx & 1) ? 11 : 2), y + 10, 2, 1, '#a098c0');
        R(ctx, x, y + 12, 16, 2, '#564d74');
      }
    }
    if (lx === 0) R(ctx, x, y, 2, 16, '#171f26');
    if (lx === 7) R(ctx, x + 14, y, 2, 16, '#171f26');
  }

  function building(ctx, ch, x, y, tx, ty, rows) {
    if (ch === '7') { bookhouse(ctx, x, y, tx, ty, rows); return; }
    if (ch === '8') { lodge(ctx, x, y, tx, ty, rows); return; }
    var p = BUILDINGS[ch], top = cell(rows, tx, ty - 1), bottom = cell(rows, tx, ty + 1);
    var bottom2 = cell(rows, tx, ty + 2);
    var left = cell(rows, tx - 1, ty), right = cell(rows, tx + 1, ty);
    var facade = bottom !== ch && bottom !== 'D';
    var upperFacade = !facade && bottom2 !== ch && bottom2 !== 'D', i;
    if (!facade && !upperFacade) {
      R(ctx, x, y, 16, 16, p[0]);
      for (i = 2; i < 16; i += 4) { R(ctx, x + i, y, 1, 16, p[1]); R(ctx, x + i + 1, y, 1, 16, '#304838'); }
      R(ctx, x, y + 13, 16, 3, C.ink);
      if (top !== ch) { R(ctx, x, y, 16, 2, C.ink); R(ctx, x + 1, y + 2, 15, 2, p[1]); }
    } else if (upperFacade) {
      R(ctx, x, y, 16, 16, p[2]);
      R(ctx, x, y, 16, 3, C.ink); R(ctx, x, y + 3, 16, 2, p[1]);
      if ((tx & 1) === 0 || ch === '4') {
        R(ctx, x + 2, y + 6, 12, 9, C.ink); R(ctx, x + 3, y + 7, 10, 7, ch === '6' ? '#c05058' : '#f8e078');
        R(ctx, x + 8, y + 7, 1, 7, C.ink); R(ctx, x + 3, y + 10, 10, 1, p[3]);
      } else { R(ctx, x + 2, y + 8, 12, 1, p[3]); R(ctx, x + 7, y + 5, 1, 10, p[3]); }
    } else {
      R(ctx, x, y, 16, 16, p[2]);
      R(ctx, x, y, 16, 2, p[1]); R(ctx, x, y + 13, 16, 3, p[3]);
      if (ch === '2') {
        for (i = 0; i < 16; i += 4) R(ctx, x + i, y + 2, 2, 3, i & 4 ? C.paper : C.red);
      } else if (ch === '3') {
        R(ctx, x + 1, y + 5, 14, 1, '#b08060'); R(ctx, x + 5, y + 6, 1, 7, '#b08060');
      } else if (ch === '5') {
        if ((tx % 3) === 0) { R(ctx, x + 7, y + 3, 3, 9, C.paper); R(ctx, x + 4, y + 6, 9, 3, C.paper); }
      } else if (ch === '6') {
        R(ctx, x, y + 13, 16, 3, C.red);
      }
      if (ch === '7' && tx % 7 === 4) {
        R(ctx, x + 3, y + 3, 10, 13, C.ink); R(ctx, x + 4, y + 4, 8, 12, '#353a3e');
        R(ctx, x + 5, y + 5, 6, 3, '#e7cf77'); R(ctx, x + 10, y + 12, 1, 1, C.gold);
      } else if ((tx & 1) === 0) { R(ctx, x + 3, y + 5, 10, 6, p[3]); R(ctx, x + 4, y + 6, 8, 4, '#f8e078'); R(ctx, x + 8, y + 6, 1, 4, C.ink); }
    }
    if (left !== ch && left !== 'D') R(ctx, x, y, 2, 16, C.ink);
    if (right !== ch && right !== 'D') R(ctx, x + 14, y, 2, 16, C.ink);
  }

  function door(ctx, x, y, tx, ty, rows) {
    var side = cell(rows, tx - 1, ty); if (!BUILDINGS[side]) side = cell(rows, tx + 1, ty);
    if (!BUILDINGS[side] && (cell(rows, tx - 1, ty) === 'i' || cell(rows, tx + 1, ty) === 'i' || cell(rows, tx, ty - 1) === 'i')) {
      R(ctx, x, y, 16, 16, '#5b4a3b'); R(ctx, x, y, 16, 3, C.ink);
      R(ctx, x + 2, y + 3, 12, 13, C.ink); R(ctx, x + 3, y + 4, 5, 11, '#9b7452'); R(ctx, x + 9, y + 4, 4, 11, '#9b7452');
      R(ctx, x + 4, y + 6, 3, 4, C.paper); R(ctx, x + 10, y + 6, 2, 4, C.paper); R(ctx, x + 1, y + 14, 14, 2, '#d1bd86');
      return;
    }
    var p = BUILDINGS[side] || BUILDINGS['3'];
    if (side === '8') { nightGround(ctx, x, y, tx, ty); y -= 8; }
    R(ctx, x, y, 16, 16, p[2]); R(ctx, x, y, 16, 3, C.ink); R(ctx, x, y + 3, 16, 2, p[1]);
    R(ctx, x + 3, y + 4, 10, 12, C.ink); R(ctx, x + 4, y + 5, 8, 11, p[3]);
    R(ctx, x + 5, y + 6, 6, 3, '#b9d2c3'); R(ctx, x + 10, y + 12, 1, 1, C.gold);
    if (side === '1') { R(ctx, x + 6, y + 5, 4, 1, C.gold); R(ctx, x + 7, y + 4, 2, 3, C.gold); }
    else if (side === '2') { R(ctx, x + 2, y + 2, 12, 3, C.red); R(ctx, x + 5, y + 5, 6, 2, C.paper); }
    else if (side === '3') { R(ctx, x + 3, y + 3, 10, 2, '#f0dfb5'); R(ctx, x + 5, y + 5, 6, 3, '#794f43'); }
    else if (side === '4') { R(ctx, x + 4, y + 4, 8, 4, '#31543a'); R(ctx, x + 6, y + 5, 1, 2, C.gold); R(ctx, x + 9, y + 5, 1, 2, C.gold); }
    else if (side === '5') { R(ctx, x + 6, y + 4, 4, 5, C.paper); R(ctx, x + 7, y + 5, 2, 3, C.red); R(ctx, x + 6, y + 6, 4, 1, C.red); }
    else if (side === '6') { R(ctx, x + 2, y + 2, 12, 3, '#2b2420'); R(ctx, x + 5, y + 3, 6, 1, C.red); }
    else if (side === '8') { R(ctx, x + 2, y + 2, 12, 3, '#31583f'); R(ctx, x + 5, y + 5, 6, 3, '#f8e078'); }
  }

  function interiorWall(ctx, x, y, tx, ty, rows) {
    var below = cell(rows, tx, ty + 1), left = cell(rows, tx - 1, ty), right = cell(rows, tx + 1, ty);
    var openBelow = 'fcthCKUo'.indexOf(below) >= 0;
    var openSide = 'fcthCKUoD'.indexOf(left) >= 0 || 'fcthCKUoD'.indexOf(right) >= 0;
    if ((tx === 0 && 'fcthCKUoD'.indexOf(right) >= 0) ||
        (tx === rows[ty].length - 1 && 'fcthCKUoD'.indexOf(left) >= 0)) {
      floor(ctx, x, y, tx, ty, false);
      if (tx === 0) { R(ctx, x, y, 4, 16, '#403038'); R(ctx, x + 3, y, 1, 16, '#715d48'); }
      else { R(ctx, x + 12, y, 4, 16, '#403038'); R(ctx, x + 12, y, 1, 16, '#715d48'); }
      return;
    }
    R(ctx, x, y, 16, 16, '#403038');
    if (openBelow) {
      R(ctx, x, y, 16, 2, C.ink); R(ctx, x, y + 2, 16, 12, '#886848'); R(ctx, x, y + 14, 16, 2, C.ink);
      R(ctx, x + 1, y + 3, 14, 9, C.ink); R(ctx, x + 2, y + 4, 12, 7, '#c09860');
      R(ctx, x + 3, y + 5, 10, 3, '#f0d888'); R(ctx, x + 3, y + 9, 10, 1, '#785040');
    } else if (openSide) {
      R(ctx, x + 3, y, 2, 16, '#7c6750'); R(ctx, x + 11, y, 2, 16, C.ink);
    } else {
      R(ctx, x + 1, y + 3, 14, 2, '#715d48'); R(ctx, x + 1, y + 10, 14, 2, '#715d48');
    }
  }

  function backWallLip(ctx, x, y, tx, ty, rows) {
    if (cell(rows, tx, ty - 1) !== 'i') return;
    R(ctx, x, y, 16, 16, '#403038'); R(ctx, x, y, 16, 2, C.ink); R(ctx, x, y + 14, 16, 2, C.ink);
    R(ctx, x + 1, y + 3, 14, 9, C.ink); R(ctx, x + 2, y + 4, 12, 7, '#a07850');
    if ((tx & 1) === 0) { R(ctx, x + 3, y + 5, 10, 4, '#f0d888'); R(ctx, x + 8, y + 5, 1, 4, C.ink); }
    else { R(ctx, x + 3, y + 5, 10, 1, '#d0a868'); R(ctx, x + 3, y + 8, 10, 1, '#684838'); }
  }

  Spr.drawTile = function (ctx, ch, x, y, tx, ty, rows, opts) {
    var nightWoods = !!(opts && opts.mapId === 'woods');
    var urbanCore = !!(opts && opts.mapId === 'town' && tx >= 24 && tx <= 35 && ty >= 12 && ty <= 34);
    switch (ch) {
      case '.': if (urbanCore) gravel(ctx, x, y, tx, ty, rows); else grass(ctx, x, y, tx, ty, false, false, rows); return;
      case 'g': grass(ctx, x, y, tx, ty, true, nightWoods, rows); return;
      case ',': grass(ctx, x, y, tx, ty, false, false, rows); R(ctx, x + 3, y + 6, 2, 2, '#e8ddad'); R(ctx, x + 10, y + 11, 2, 2, '#bb5962'); return;
      case 'T': tree(ctx, x, y, tx, ty, rows, false, nightWoods); return;
      case 'Y': tree(ctx, x, y, tx, ty, rows, true, nightWoods); return;
      case 'r':
        /* Nel waterfront la strada orizzontale resta rosa come reference;
         * il corridoio di collisione nord/sud continua sotto come ghiaia,
         * evitando il ramo rosa inventato senza rompere la navigazione. */
        if (urbanCore && ty >= 16) gravel(ctx, x, y, tx, ty, rows);
        else road(ctx, x, y, tx, ty, null, null, rows);
        return;
      case 'p':
        if (nightWoods) {
          /* Cortile Lodge senza corsia verticale inventata: il target usa
           * terreno viola continuo. Collisioni e percorso restano invariati. */
          nightGround(ctx, x, y, tx, ty);
          groundShadow(ctx, x, y, tx, ty, rows);
        } else path(ctx, x, y, tx, ty, rows);
        return;
      case 'o': oilPool(ctx, x, y, tx, ty, rows); return;
      case '=': sidewalk(ctx, x, y, tx, ty, rows); return;
      case '-':
        road(ctx, x, y, tx, ty, null, null, rows);
        if (!urbanCore) { R(ctx, x + 2, y, 3, 16, C.paper); R(ctx, x + 8, y, 3, 16, C.paper); R(ctx, x + 14, y, 2, 16, C.paper); }
        return;
      case 'w': water(ctx, x, y, tx, ty, rows); return;
      case 'F':
        if (opts && opts.mapId === 'town' && tx >= 26 && tx <= 27 && ty >= 8 && ty <= 15) urbanRail(ctx, x, y);
        else if (opts && opts.mapId === 'town' && tx >= 26 && tx <= 30 && ty >= 16 && ty <= 17) urbanRailHorizontal(ctx, x, y, ty === 17);
        else fence(ctx, x, y, tx, ty, rows);
        return;
      case 'q':
        if (nightWoods) {
          R(ctx, x, y, 16, 16, '#7770a8');
          R(ctx, x + 1, y + 1, 1, 1, '#686898'); R(ctx, x + 14, y + 5, 1, 1, '#686898');
          R(ctx, x + 2, y + 2, 12, 12, '#172838'); R(ctx, x + 3, y + 3, 10, 9, '#686898');
          R(ctx, x + 4, y + 4, 8, 1, '#a0a0c8'); R(ctx, x + 4, y + 7, 8, 2, '#3d5068');
          R(ctx, x + 5, y + 12, 2, 4, '#172838'); R(ctx, x + 10, y + 12, 2, 4, '#172838');
        } else {
          if (urbanCore) gravel(ctx, x, y, tx, ty, rows); else grass(ctx, x, y, tx, ty, false, false, rows);
          R(ctx, x + 2, y + 3, 12, 12, C.ink); R(ctx, x + 3, y + 4, 10, 9, '#8d6541');
          R(ctx, x + 4, y + 5, 8, 2, '#c79a57'); R(ctx, x + 7, y + 4, 2, 9, C.ink);
          R(ctx, x + 3, y + 13, 10, 2, '#573d31');
        }
        return;
      case 'n': bush(ctx, x, y, tx, ty, rows, nightWoods); return;
      case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': building(ctx, ch, x, y, tx, ty, rows); return;
      case 'D': door(ctx, x, y, tx, ty, rows); return;
      case 'i': interiorWall(ctx, x, y, tx, ty, rows); return;
      case 'f': floor(ctx, x, y, tx, ty, false); backWallLip(ctx, x, y, tx, ty, rows); return;
      case 'c': floor(ctx, x, y, tx, ty, true); backWallLip(ctx, x, y, tx, ty, rows); return;
      case 'C': floor(ctx, x, y, tx, ty, false); backWallLip(ctx, x, y, tx, ty, rows); R(ctx, x, y + 4, 16, 12, C.ink); R(ctx, x + 1, y + 5, 14, 5, '#9a6843'); R(ctx, x + 2, y + 6, 12, 2, '#d19b5c'); R(ctx, x + 3, y + 11, 4, 3, '#6a4934'); R(ctx, x + 9, y + 11, 4, 3, '#6a4934'); return;
      case 't': floor(ctx, x, y, tx, ty, false); backWallLip(ctx, x, y, tx, ty, rows); R(ctx, x + 1, y + 4, 14, 9, C.ink); R(ctx, x + 2, y + 3, 12, 8, '#875c3d'); R(ctx, x + 3, y + 4, 10, 2, '#c28a50'); R(ctx, x + 3, y + 11, 2, 4, C.ink); R(ctx, x + 11, y + 11, 2, 4, C.ink); return;
      case 'h': floor(ctx, x, y, tx, ty, false); backWallLip(ctx, x, y, tx, ty, rows); R(ctx, x + 4, y + 2, 8, 12, C.ink); R(ctx, x + 5, y + 3, 6, 7, '#9a6843'); R(ctx, x + 6, y + 4, 4, 2, '#d5a364'); return;
      case 'K': floor(ctx, x, y, tx, ty, false); backWallLip(ctx, x, y, tx, ty, rows); R(ctx, x + 1, y + 2, 14, 13, C.ink); R(ctx, x + 2, y + 3, 12, 11, '#ddd7b9'); R(ctx, x + 3, y + 4, 5, 3, C.paper); R(ctx, x + 3, y + 8, 10, 1, '#aaa989'); return;
      case 'U': floor(ctx, x, y, tx, ty, false); backWallLip(ctx, x, y, tx, ty, rows); R(ctx, x + 2, y + 2, 12, 13, C.ink); R(ctx, x + 3, y + 3, 10, 11, '#855b3d'); R(ctx, x + 4, y + 4, 8, 2, '#c28a50'); R(ctx, x + 4, y + 8, 8, 1, C.ink); R(ctx, x + 8, y + 10, 1, 1, C.gold); return;
      default: oldTile(ctx, ch, x, y, tx, ty, rows, opts); return;
    }
  };

  var DOWN0 = [
    '................','.....oooooo.....','....ohhhhhho....','...ohhhhhhhho...',
    '...ohsssshhho...','...osssssssso...','...os.os.osso...','...osssssssso...',
    '....osssssso....','...ooccccccoo...','..occcccccccco..','..occccaacccco..',
    '...occcccccco...','...ooopppooo....','....opppp.po....','....opp...po....',
    '....opp...po....','...ooo....ooo...','................','................'
  ];
  var DOWN1 = [
    '................','.....oooooo.....','....ohhhhhho....','...ohhhhhhhho...',
    '...ohsssshhho...','...osssssssso...','...os.os.osso...','...osssssssso...',
    '....osssssso....','...ooccccccoo...','..occcccccccco..','..occccaacccco..',
    '...occcccccco...','....ooppppo.....','....opp.opo.....','...opp...opo....',
    '..ooo.....ooo...','................','................','................'
  ];
  var UP0 = [
    '................','.....oooooo.....','....ohhhhhho....','...ohhhhhhhho...',
    '...ohhhhhhhho...','...ohhhhhhhho...','...ohhhhhhhho...','...ohhhhhhhho...',
    '....ohhhhho.....','...ooccccccoo...','..occcccccccco..','..occcccccccco..',
    '...occcccccco...','...ooopppooo....','....opppp.po....','....opp...po....',
    '....opp...po....','...ooo....ooo...','................','................'
  ];
  var UP1 = [
    '................','.....oooooo.....','....ohhhhhho....','...ohhhhhhhho...',
    '...ohhhhhhhho...','...ohhhhhhhho...','...ohhhhhhhho...','...ohhhhhhhho...',
    '....ohhhhho.....','...ooccccccoo...','..occcccccccco..','..occcccccccco..',
    '...occcccccco...','....ooppppo.....','....opo.oppo....','...opo...oppo...',
    '..ooo.....ooo...','................','................','................'
  ];
  var SIDE0 = [
    '................','.....oooooo.....','....ohhhhhho....','...ohhhhhhhho...',
    '...ohhhsssso....','...ohhssssso....','...ohhssosso....','...ohhssssso....',
    '....ossssso.....','...oocccccoo....','..occcccccccoo..','..occcacccccco..',
    '...occcccccco...','....oopppooo....','....opppp.po....','....opp...po....',
    '....opp...po....','...ooo....ooo...','................','................'
  ];
  var SIDE1 = [
    '................','.....oooooo.....','....ohhhhhho....','...ohhhhhhhho...',
    '...ohhhsssso....','...ohhssssso....','...ohhssosso....','...ohhssssso....',
    '....ossssso.....','...oocccccoo....','..occcccccccoo..','..occcacccccco..',
    '...occcccccco...','....ooppppo.....','....opo.oppo....','...opo...oppo...',
    '..ooo.....ooo...','................','................','................'
  ];

  /* Quattro silhouette fisiche, non semplici ricolorazioni. Testa/direzione
   * restano nella matrice base; busto, abito e appoggio cambiano qui. */
  var BODY = {
    narrow: [
      [
        '...ooccccccoo...','..occcccccccco..','..occccaacccco..','...occcccccco...',
        '...oooppppooo...','....oppppppo....','....opp..ppo....','....opp..ppo....','...ooo....ooo...'
      ],
      [
        '...ooccccccoo...','..occcccccccco..','..occccaacccco..','...occcccccco...',
        '....oppppppo....','...oppp..pppo...','..ooo.....ooo...','................','................'
      ]
    ],
    broad: [
      [
        '..oocccccccccoo.','.occcccccccccco.','.occcccccccccco.','..occcccccccco..',
        '..oooppppppooo..','...oppppppppo...','...opp....ppo...','...opp....ppo...','..ooo......ooo..'
      ],
      [
        '..oocccccccccoo.','.occcccccccccco.','.occcccccccccco.','..occcccccccco..',
        '...ooppppppoo...','..opppp..ppppo..','.ooo.......ooo..','................','................'
      ]
    ],
    dress: [
      [
        '....ooccccoo....','...occcccccco...','...occcaaccco...','....occcccco....',
        '....occcccco....','...occcccccco...','..occcccccccco..','.....opp.ppo....','....ooo..ooo....'
      ],
      [
        '....ooccccoo....','...occcccccco...','...occcaaccco...','....occcccco....',
        '....occcccco....','...occcccccco...','..occcccccccco..','....opp..ppo....','...ooo....ooo...'
      ]
    ],
    short: [
      [
        '....ooccccoo....','...occcccccco...','...occcaaccco...','....occcccco....',
        '.....oppppo.....','....opp..ppo....','...ooo....ooo...','................','................'
      ],
      [
        '....ooccccoo....','...occcccccco...','...occcaaccco...','....occcccco....',
        '.....oppppo.....','...opp....ppo...','..ooo......ooo..','................','................'
      ]
    ]
  };

  function silhouette(p) {
    if (p.short) return 'short';
    if (p.dress) return 'dress';
    if ((p.build || 1) >= 1.07 || p.log) return 'broad';
    return 'narrow';
  }

  function withBody(pattern, kind, frame) {
    var out = pattern.slice(), rows = BODY[kind][frame ? 1 : 0], i;
    for (i = 0; i < rows.length; i++) out[9 + i] = rows[i];
    return out;
  }

  function nameOf(pal) {
    var name; for (name in CHARS) if (CHARS[name] === pal) return name;
    return 'cooper';
  }

  Spr.drawChar = function (ctx, x, y, pal, dir, frame, alpha, moving) {
    var name = nameOf(pal), p = pal || CHARS.cooper;
    var flip = dir === 'right';
    var f = moving ? (frame & 1) : 0;
    var base = dir === 'up' ? (f ? UP1 : UP0) : (dir === 'left' || dir === 'right' ? (f ? SIDE1 : SIDE0) : (f ? DOWN1 : DOWN0));
    var kind = silhouette(p), pattern = withBody(base, kind, f);
    var ox = Math.round(x), oy = Math.round(y) - 4 + (kind === 'short' ? 2 : 0);
    var oldAlpha = ctx.globalAlpha;
    if (alpha != null) ctx.globalAlpha = oldAlpha * alpha;
    R(ctx, ox + 4, oy + 18, 8, 2, 'rgba(24,50,37,.35)');
    var shirtCol = name === 'cooper' ? '#56636b' : (p.shirt || '#58656a');
    var pantsCol = name === 'cooper' ? '#303b43' : (p.pants || '#30383a');
    paint(ctx, pattern, {
      o: C.ink,
      h: p.hair || C.ink,
      s: p.skin || '#d9ad7b',
      c: shirtCol,
      a: p.tie || p.badge || p.collar || shirtCol || C.red,
      p: pantsCol
    }, ox, oy, flip);
    var hairHi = lighter(p.hair || C.ink, 38);
    if (dir === 'up') { R(ctx, ox + 5, oy + 2, 4, 1, hairHi); R(ctx, ox + 4, oy + 4, 2, 1, hairHi); }
    else { R(ctx, ox + 5, oy + 1, 3, 1, hairHi); }
    if (dir === 'down') {
      R(ctx, ox + 4, oy + 6, 1, 2, p.skin || '#d9ad7b');
      R(ctx, ox + 11, oy + 6, 1, 2, p.skin || '#d9ad7b');
      R(ctx, ox + 6, oy + 3, 3, 1, '#4a493b');
    }
    if ((p.collar || p.lapel || name === 'cooper') && dir !== 'up') {
      var collar = p.collar || p.lapel || C.paper;
      R(ctx, ox + 5, oy + 10, 2, 2, collar); R(ctx, ox + 9, oy + 10, 2, 2, collar);
    } else if (name === 'cooper' && dir === 'up') {
      R(ctx, ox + 5, oy + 9, 6, 2, C.paper); R(ctx, ox + 6, oy + 10, 4, 1, shirtCol);
    }
    if (p.hat) {
      R(ctx, ox + 4, oy, 8, 2, p.hat); R(ctx, ox + 2, oy + 2, 12, 2, C.ink);
    }
    if (p.long) {
      R(ctx, flip ? ox + 11 : ox + 3, oy + 5, 2, 7, p.hair || C.ink);
    }
    if (p.apron && dir !== 'up') {
      R(ctx, ox + 5, oy + 11, 6, 5, p.apron); R(ctx, ox + 6, oy + 12, 4, 1, C.earth2);
    }
    if (p.log) {
      R(ctx, ox + 2, oy + 11, 12, 4, C.ink); R(ctx, ox + 3, oy + 12, 10, 2, '#8d6541');
    }
    if (p.badge && dir !== 'up') R(ctx, flip ? ox + 5 : ox + 10, oy + 11, 2, 2, p.badge);
    if (p.glasses && dir !== 'up') {
      R(ctx, ox + 4, oy + 6, 3, 2, p.glassesColor || C.ink);
      R(ctx, ox + 9, oy + 6, 3, 2, p.glassesColor || C.ink);
      R(ctx, ox + 7, oy + 6, 2, 1, C.ink);
    }
    if (p.short && dir !== 'up') R(ctx, ox + 7, oy + 10, 2, 2, C.ink);
    if (name === 'cooper' && dir !== 'up') R(ctx, ox + 7, oy + 11, 2, 4, p.tie || C.red);
    if (name === 'bob' && dir !== 'up') { R(ctx, ox + 6, oy + 7, 5, 1, C.paper); R(ctx, ox + 7, oy + 8, 3, 1, C.ink); }
    ctx.globalAlpha = oldAlpha;
  };

  /* R10: actor nativo 16x16. Gen II usa testa larga, busto corto e piedi
   * compressi nella stessa metatile; niente ombra morbida o anatomia 20px. */
  var GOLD_DOWN0 = [
    '.....oooooo.....','....ohhhhhho....','...ohhhhhhhho...','..ohhhhssshhho..',
    '..ohhsssssssho..','..ohsossssosho..','..ohssssssssho..','...ohssssssho...',
    '....ooccccoo....','...occcccccco...','..occcccccccco..','..osccccccccso..',
    '...ooppppppoo...','....oppppppo....','....opp..ppo....','...ooo....ooo...'
  ];
  var GOLD_UP0 = [
    '.....oooooo.....','....ohhhhhho....','...ohhhhhhhho...','..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..','...ohhhhhhhho...','...oohhhhhhoo...','....oohhhhoo....',
    '....ooccccoo....','...occcccccco...','..occcccccccco..','..occcccccccco..',
    '...ooppppppoo...','....oppppppo....','....opp..ppo....','...ooo....ooo...'
  ];
  var GOLD_SIDE0 = [
    '.....oooooo.....','....ohhhhhho....','...ohhhhhhhho...','..ohhhhhhhhhho..',
    '..ohhhhhssssho..','...ohhhhssssho..','...ohhhosssssoo.','....ohhsssshoo..',
    '....ooccccoo....','...occcccccco...','...occcccccco...','...occcccccso...',
    '....ooppppoo....','.....oppppo.....','....opp..ppo....','...ooo....ooo...'
  ];
  var GOLD_BODY = {
    narrow: [
      '....ooccccoo....','...occcccccco...','..occcccccccco..','..osccccccccso..',
      '...ooppppppoo...','....oppppppo....','....opp..ppo....','...ooo....ooo...'
    ],
    broad: [
      '..ooccccccccoo..','.occcccccccccco.','.occcccccccccco.','..occcccccccco..',
      '..ooppppppppoo..','...oppppppppo...','..oppp....pppo..','.oooo......oooo.'
    ],
    dress: [
      '...ooccccoo.....','..occcccccco....','..occcccccco....','...occcccco.....',
      '..occcccccco....','.occccccccccco..','..opp....ppo....','.ooo......ooo...'
    ],
    short: [
      '...ooccccoo.....','..occcccccco....','...occcccco.....','...ooppppoo.....',
      '....oppppo......','...opp..ppo.....','..ooo....ooo....','................'
    ]
  };

  /* Profilo destro authored; LEFT nasce solo dal mirror. Torso non usa la
   * sagoma frontale, così naso, spalla e mano puntano stessa direzione. */
  var GOLD_SIDE_BODY = [
    '....ooccccoo....','...occcccccco...','...occcccccco...','...occcccccso...',
    '....ooppppoo....','.....oppppo.....','....opp..ppo....','...ooo....ooo...'
  ];

  /* Cooper usa un foglio dedicato. 16x16 costante, tre colori + trasparenza,
   * contorno 1px e due appoggi reali per direzione. NPC restano sugli
   * archetipi condivisi; protagonista non viene piu' deformato da overlay. */
  var COOPER_DOWN0 = [
    '.....oooooo.....','....oooooooo....','...ooossssooo...','...osssssssso...',
    '..oossssssssoo..','..oosossosssoo..','...osssssssso...','...ooossssooo...',
    '....ooccccoo....','...occcooccco...','..occcococccco..','..osccccccccso..',
    '...occcccccco...','....ooccccoo....','....oo....oo....','...ooo....ooo...'
  ];
  var COOPER_DOWN1 = COOPER_DOWN0.slice();
  COOPER_DOWN1[10] = '..occcococccso..';
  COOPER_DOWN1[11] = '..osccccccccco..';
  COOPER_DOWN1[13] = '...oooccccoo....';
  COOPER_DOWN1[14] = '...oo.....oo....';
  COOPER_DOWN1[15] = '..ooo......oooo.';

  var COOPER_UP0 = [
    '.....oooooo.....','....oooooooo....','...oooooooooo...','..oooooooooooo..',
    '..oooooooooooo..','...oooooooooo...','...oooooooooo...','....oooooooo....',
    '....ooccccoo....','...occcccccco...','..occcccccccco..','..occcccccccco..',
    '...occcccccco...','....ooccccoo....','....oo....oo....','...ooo....ooo...'
  ];
  var COOPER_UP1 = COOPER_UP0.slice();
  COOPER_UP1[12] = '..oocccccccco...';
  COOPER_UP1[13] = '...oooccccoo....';
  COOPER_UP1[14] = '...oo.....oo....';
  COOPER_UP1[15] = '..ooo......oooo.';

  var COOPER_SIDE0 = [
    '................','......oooo......','.....oooooo.....','....ooooooo.....',
    '....oooooss.....','....ooossss.....','.....oossoo.....','.....oossoo.....',
    '....ooocccoo....','..occcccccccco..','..occcccccccso..','..occcccccccso..',
    '...occcccccco...','....oo....oo....','....ooo..ooo....','...oooo..oooo...'
  ];
  var COOPER_SIDE1 = COOPER_SIDE0.slice();
  COOPER_SIDE1[10] = '..occccccccsso..';
  COOPER_SIDE1[11] = '..osccccccccco..';
  COOPER_SIDE1[13] = '...oooccccoo....';
  COOPER_SIDE1[14] = '...oo.....oo....';
  COOPER_SIDE1[15] = '..ooo......oooo.';

  function goldBody(pattern, kind, step, side, dir) {
    var out = pattern.slice(), body = side && kind === 'narrow' ? GOLD_SIDE_BODY : (GOLD_BODY[kind] || GOLD_BODY.narrow), i;
    for (i = 0; i < 8; i++) out[i + 8] = body[i];
    if (step) {
      out[13] = body[5];
      if (kind === 'broad') {
        out[14] = step > 0 ? '..oppp....pppo..' : '..pppo....ppp...';
        out[15] = step > 0 ? '.oooo.....ooo...' : '..ooo.....oooo..';
      } else {
        out[14] = body[6];
        out[15] = step > 0 ? '..oooo....ooo...' : '...ooo....oooo..';
      }
      /* Braccia/spalle cambiano insieme ai piedi: due frame leggibili,
       * non semplice tremolio delle scarpe. */
      if (kind === 'narrow' && dir === 'down') {
        out[11] = step > 0 ? '..osccccccccco..' : '..occcccccccso..';
      } else if (kind === 'narrow' && side) {
        out[11] = step > 0 ? '...osccccccco...' : '...occccccsso...';
      } else if (kind === 'narrow' && dir === 'up') {
        out[10] = step > 0 ? '...occcccccco...' : '..occcccccccco..';
      }
    }
    return out;
  }

  Spr.drawChar = function (ctx, x, y, pal, dir, frame, alpha, moving) {
    var name = nameOf(pal), p = pal || CHARS.cooper, kind = silhouette(p);
    if (name === 'cooper') {
      var walkFrame = moving && (frame & 1) ? 1 : 0;
      var cooperPattern = dir === 'up' ? (walkFrame ? COOPER_UP1 : COOPER_UP0) :
        (dir === 'left' || dir === 'right' ? (walkFrame ? COOPER_SIDE1 : COOPER_SIDE0) :
          (walkFrame ? COOPER_DOWN1 : COOPER_DOWN0));
      var cooperAlpha = ctx.globalAlpha;
      if (alpha != null) ctx.globalAlpha = cooperAlpha * alpha;
      paint(ctx, cooperPattern, { o: C.ink, c: '#587080', s: '#f0a868' }, Math.round(x), Math.round(y), dir === 'left');
      ctx.globalAlpha = cooperAlpha;
      return;
    }
    var flip = dir === 'left', step = moving ? ((frame & 1) ? -1 : 1) : 0;
    var base = dir === 'up' ? GOLD_UP0 : (dir === 'left' || dir === 'right' ? GOLD_SIDE0 : GOLD_DOWN0);
    var pattern = goldBody(base, kind, step, dir === 'left' || dir === 'right', dir), ox = Math.round(x);
    var oy = Math.round(y) + (kind === 'short' ? 1 : 0);
    var oldAlpha = ctx.globalAlpha;
    if (alpha != null) ctx.globalAlpha = oldAlpha * alpha;
    /* OBJ Gen II: Cooper usa tre soli colori visibili + trasparenza.
     * Outline, capelli e pantaloni condividono l'inchiostro; nessun micro-tono. */
    var shirtCol = name === 'cooper' ? '#c08850' : (p.shirt || '#586878');
    var pantsCol = name === 'cooper' ? C.ink : (p.pants || '#303840');
    var hairCol = name === 'cooper' ? C.ink : (p.hair || C.ink);
    var skinCol = name === 'cooper' ? '#f0a868' : (p.skin || '#e0a870');
    paint(ctx, pattern, {
      o: C.ink, h: hairCol, s: skinCol, c: shirtCol,
      a: name === 'cooper' ? C.ink : (p.tie || p.badge || p.collar || C.red), p: pantsCol
    }, ox, oy, flip);
    if (dir === 'down') {
      R(ctx, ox + 3, oy + 5, 1, 2, skinCol);
      R(ctx, ox + 11, oy + 5, 1, 2, skinCol);
      R(ctx, ox + 6, oy + 3, 3, 1, name === 'cooper' ? C.ink : '#885838');
    }
    if (name === 'cooper' && dir === 'up') {
      R(ctx, ox + 7, oy + 7, 2, 1, skinCol);
    }
    if ((p.collar || p.lapel || name === 'cooper') && dir !== 'up' && (name !== 'cooper' || dir === 'down')) {
      var collar = name === 'cooper' ? skinCol : (p.collar || p.lapel || C.paper);
      R(ctx, ox + 5, oy + 9, 2, 2, collar); R(ctx, ox + 9, oy + 9, 2, 2, collar);
    }
    if (name === 'cooper' && dir === 'down') R(ctx, ox + 7, oy + 9, 2, 4, C.ink);
    if (p.hat) { R(ctx, ox + 4, oy, 8, 2, p.hat); R(ctx, ox + 2, oy + 2, 12, 2, C.ink); }
    if (p.long) R(ctx, flip ? ox + 11 : ox + 3, oy + 4, 2, 6, p.hair || C.ink);
    if (p.apron && dir !== 'up') { R(ctx, ox + 5, oy + 10, 6, 4, p.apron); R(ctx, ox + 6, oy + 11, 4, 1, C.earth2); }
    if (p.log) { R(ctx, ox + 2, oy + 10, 12, 3, C.ink); R(ctx, ox + 3, oy + 11, 10, 1, '#986040'); }
    if (p.badge && dir !== 'up') R(ctx, flip ? ox + 5 : ox + 10, oy + 10, 2, 2, p.badge);
    if (p.glasses && dir !== 'up') {
      R(ctx, ox + 4, oy + 5, 3, 2, p.glassesColor || C.ink); R(ctx, ox + 9, oy + 5, 3, 2, p.glassesColor || C.ink);
      R(ctx, ox + 7, oy + 5, 2, 1, C.ink);
    }
    ctx.globalAlpha = oldAlpha;
  };

  GAME.Retro2D = GAME.Retro2D || {};

  function rgbDistance(a, b) {
    var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return dr * dr + dg * dg + db * db;
  }

  /* Normalizzazione BG hardware: griglia 8x8 ancorata alle coordinate mondo,
   * massimo quattro colori per cella prima degli OBJ. Un solo get/put per
   * frame; nessun cambiamento palette durante lo scroll. */
  GAME.Retro2D.limitBackgroundPalettes = function (ctx, cx, cy, w, h) {
    if (!ctx || !ctx.getImageData || !ctx.putImageData) return;
    var image;
    try { image = ctx.getImageData(0, 0, w, h); } catch (e) { return; }
    var data = image.data;
    var modX = ((cx % 8) + 8) % 8, modY = ((cy % 8) + 8) % 8;
    var startX = -modX, startY = -modY, bx, by, xx, yy, pos, key, i, j;
    for (by = startY; by < h; by += 8) for (bx = startX; bx < w; bx += 8) {
      var counts = {}, colors = [];
      for (yy = Math.max(0, by); yy < Math.min(h, by + 8); yy++) {
        for (xx = Math.max(0, bx); xx < Math.min(w, bx + 8); xx++) {
          pos = (yy * w + xx) * 4;
          key = data[pos] + ',' + data[pos + 1] + ',' + data[pos + 2];
          if (!counts[key]) { counts[key] = { rgb: [data[pos], data[pos + 1], data[pos + 2]], n: 0 }; colors.push(counts[key]); }
          counts[key].n++;
        }
      }
      if (colors.length <= 4) continue;
      colors.sort(function (a, b) { return b.n - a.n; });
      var chosen = [colors[0]], darkest = colors[0], brightest = colors[0];
      for (i = 1; i < colors.length; i++) {
        var lum = colors[i].rgb[0] * 3 + colors[i].rgb[1] * 6 + colors[i].rgb[2];
        var darkLum = darkest.rgb[0] * 3 + darkest.rgb[1] * 6 + darkest.rgb[2];
        var brightLum = brightest.rgb[0] * 3 + brightest.rgb[1] * 6 + brightest.rgb[2];
        if (lum < darkLum) darkest = colors[i];
        if (lum > brightLum) brightest = colors[i];
      }
      if (chosen.indexOf(darkest) < 0) chosen.push(darkest);
      if (chosen.indexOf(brightest) < 0 && chosen.length < 4) chosen.push(brightest);
      for (i = 1; i < colors.length && chosen.length < 4; i++) if (chosen.indexOf(colors[i]) < 0) chosen.push(colors[i]);
      for (yy = Math.max(0, by); yy < Math.min(h, by + 8); yy++) {
        for (xx = Math.max(0, bx); xx < Math.min(w, bx + 8); xx++) {
          pos = (yy * w + xx) * 4;
          var src = [data[pos], data[pos + 1], data[pos + 2]], best = chosen[0].rgb, bestD = rgbDistance(src, best);
          for (j = 1; j < chosen.length; j++) {
            var dist = rgbDistance(src, chosen[j].rgb);
            if (dist < bestD) { bestD = dist; best = chosen[j].rgb; }
          }
          data[pos] = best[0]; data[pos + 1] = best[1]; data[pos + 2] = best[2];
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  };
  GAME.Retro2D.authored = true;
  GAME.Retro2D.tileSize = 16;
  GAME.Retro2D.spriteSize = [16, 16];
})();
