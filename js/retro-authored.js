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
    for (i = 16; i >= 0; i -= 8) out.push(Math.max(0, Math.min(255, ((n >> i) & 255) + (amount || 32))));
    return '#' + out.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }

  /* shade(hex, -n) scurisce, shade(hex, +n) schiarisce: usato per ricavare
   * scanalature tetto e ombre d'angolo dalla palette di ogni edificio,
   * invece di un colore scuro fisso identico per tutti i landmark. */
  function shade(hex, amount) { return lighter(hex, amount); }

  /* R59 — luce lunare su TUTTI i materiali dello sprite.
   * Fino a R58 la notte toccava solo la giacca di Cooper: capelli
   * (#6e4526), incarnato (#f0a868), pantaloni (#303b43) e contorno
   * (#202820) erano identici byte per byte fra i due frame, con gli stessi
   * conteggi di pixel. Conseguenze misurate: incarnato a L 179 in un
   * fotogramma con il 99 % dei pixel sotto 146 (il viso brillava mentre la
   * giacca andava a nero) e ombra giacca a L 15 contro contorno L 38 —
   * l'interno scendeva SOTTO il contorno e la sagoma leggeva bucata.
   * nightify() comprime il rosso, conserva il blu e tiene ogni materiale
   * interno sopra NIGHT_FLOOR, che sta sopra la luminanza del contorno
   * notturno: il contorno resta il valore piu' scuro dello sprite. */
  var NIGHT_INK = '#101828';   /* L 23,5 — il piu' scuro dello sprite */
  var NIGHT_FLOOR = 32;        /* nessun materiale interno sotto questo */

  function rgbOf(hex) {
    var raw = String(hex || '').replace('#', '');
    if (raw.length === 3) raw = raw.charAt(0) + raw.charAt(0) + raw.charAt(1) + raw.charAt(1) + raw.charAt(2) + raw.charAt(2);
    if (raw.length !== 6) return null;
    var n = parseInt(raw, 16);
    if (!isFinite(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function hexOf(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2);
    }).join('');
  }

  function luma(r, g, b) { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }

  function nightify(hex, isInk) {
    if (isInk) return NIGHT_INK;
    var c = rgbOf(hex);
    if (!c) return hex;
    var r = c[0] * 0.58, g = c[1] * 0.62 + 4, b = c[2] * 0.70 + 30;
    var lift = NIGHT_FLOOR - luma(r, g, b);
    if (lift > 0) { r += lift; g += lift; b += lift; }
    return hexOf(r, g, b);
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

  /* Il glifo della mappa governa collisione/interazione; il sottofondo dei
   * prop vive in maps.js. Tenere separati i due layer evita il vecchio
   * effetto "oggetto appoggiato su quadrato verde" senza inventare nuove
   * collisioni o duplicare B/H/S per ogni materiale. */
  function groundAt(opts, tx, ty) {
    var maps = GAME.maps && GAME.maps.maps;
    var map = opts && opts.mapId && maps && maps[opts.mapId];
    return map && map.ground ? (map.ground[tx + ',' + ty] || '') : '';
  }

  function semanticCell(rows, tx, ty, opts) {
    return groundAt(opts, tx, ty) || cell(rows, tx, ty);
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

  /* Prato: reticolo 8x8 authored (tre grappoli a croce, 1 centro scuro +
   * 4 bracci medi, sfalsati in diagonale) — stesso principio di texture
   * periodica del riferimento Gold (dither su reticolo di 8 px), non un
   * fondale piatto con macchioline sparse. Quattro riflessioni dello
   * stesso grappolo, scelte per colonna di tile (tx&3): dentro ogni tile
   * resta un reticolo di 8 px perfetto (autocorrelazione alta, il gate
   * misura questo), ma passando da una tile all'altra la fase cambia con
   * periodo 4 tile, cosi' il prato non ripete lo stesso identico stampo
   * ogni 16/32 px orizzontali — periodicita' che altrimenti inquinava la
   * misura sulla fascia alberi (il prato intorno alle conifere e' fatto
   * con lo stesso motivo di terreno). */
  var GRASS_8 = [
    '00100000','01210000','00100000','00000100',
    '01001210','12100100','01000000','00000000'
  ];
  var GRASS_8_H = [
    '00000100','00001210','00000100','00100000',
    '01210100','00100121','00000010','00000000'
  ];
  var GRASS_8_V = [
    '00000000','01000000','12100100','01001210',
    '00000100','00100000','01210000','00100000'
  ];
  var GRASS_8_HV = [
    '00000000','00000010','00100121','01210100',
    '00100000','00000100','00001210','00000100'
  ];
  var GRASS_8_VARIANTS = [GRASS_8, GRASS_8_H, GRASS_8_V, GRASS_8_HV];

  /* Ghiaia piazza: 7 segni su 64 (10,9%). Ogni variante condivide quattro
   * posizioni con le adiacenti: lag 8 resta vicino a 0,52, non zero
   * (rumore) e non uno (tappezzeria). Un solo segno, ΔL 26,7. */
  var GRAVEL_8 = [
    ['00001000','01000000','00000010','00000000','00010000','10000000','00000100','00100000'],
    ['00000000','01000000','10000010','00000000','00010001','00000000','01000100','00000000'],
    ['00100000','01000001','00000010','00000000','00010000','00000000','00000100','10000000'],
    ['00000100','01000000','00000010','01000000','00010000','00000000','00000100','00000001']
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
    '.32111111111123.','..333333333333..','......3443......','......3443......',
    '.....344443.....','......3443......','......3443......','................'
  ];
  var TREE_CANOPY_C = [
    '......33........','.....3213.......','....321113......','...32111123.....',
    '..3211211123....','.3332111112333..','.....3213.......','....321113......',
    '...32112113.....','..3211111113....','.3211121111123..','333321111123333.',
    '....321113......','...32111113.....','..32112111123...','.3211111111123..',
    '321112111111123.','...333333333333.','.....3443.......','.....3443.......',
    '....344443......','.....3443.......','.....3443.......','................'
  ];
  /* dx/dy sono spostamenti authored della chioma, mai positivi: la tile
   * viene dipinta scandendo righe dall'alto e colonne da sinistra, quindi
   * solo il vicino a sinistra e quello sopra sono gia' su schermo quando
   * arriva questa tile. Sconfinare li' (dx<=0, dy<=0) sovrappone la chioma
   * al vicino gia' disegnato; sconfinare a destra o in basso verrebbe
   * ridipinto dal tile successivo. */
  var TREE_DX = [0, -1, -2, -3];
  var TREE_DY = [0, -1, -2, -3];
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
    if ('0123456789D'.indexOf(cell(rows, tx, ty - 1)) < 0) return;
    R(ctx, x, y, 16, 2, C.ink); R(ctx, x + 2, y + 2, 12, 2, C.dark);
  }

  function grass(ctx, x, y, tx, ty, dark, night, rows) {
    if (night) {
      nightGround(ctx, x, y, tx, ty);
      groundShadow(ctx, x, y, tx, ty, rows); return;
    }
    if (dark) {
      R(ctx, x, y, 16, 16, C.grass);
      paint(ctx, TALL_GRASS, { 1: C.dark, 2: C.mid }, x, y);
      groundShadow(ctx, x, y, tx, ty, rows); return;
    }
    /* Stampa il reticolo 8x8 due volte per asse: la tile 16x16 e' sempre
     * l'esatto multiplo del passo 8 px, quindi il dither resta periodico
     * anche attraversando i bordi fra tile adiacenti (autocorrelazione a
     * lag 8 su tutta la mappa, non solo dentro la singola tile). */
    var g8 = GRASS_8_VARIANTS[tx & 3];
    R(ctx, x, y, 16, 16, C.grass);
    paint(ctx, g8, { 1: C.mid, 2: C.dark }, x, y);
    paint(ctx, g8, { 1: C.mid, 2: C.dark }, x + 8, y);
    paint(ctx, g8, { 1: C.mid, 2: C.dark }, x, y + 8);
    paint(ctx, g8, { 1: C.mid, 2: C.dark }, x + 8, y + 8);
    groundShadow(ctx, x, y, tx, ty, rows);
  }

  function tree(ctx, x, y, tx, ty, rows, sycamore, night) {
    /* Tile BG 2bpp credibile: un solo colore terreno + tre colori chioma.
     * Tronco condivide outline; niente seconda palette di erba sotto. */
    R(ctx, x, y, 16, 16, night ? '#7770a8' : C.grass);
    if (!night) {
      /* Stesso prato periodico delle tile d'erba vicine: senza questo il
       * fondo restava un verde piatto sotto/fra le chiome, ed essendo un
       * unico colore uniforme "combaciava" con se stesso a qualunque passo
       * (compreso il lag 32 misurato dal gate), gonfiando l'autosomiglianza
       * della fascia alberi indipendentemente da quanto variasse la sagoma. */
      var tg8 = GRASS_8_VARIANTS[tx & 3];
      paint(ctx, tg8, { 1: C.mid, 2: C.dark }, x, y);
      paint(ctx, tg8, { 1: C.mid, 2: C.dark }, x + 8, y);
      paint(ctx, tg8, { 1: C.mid, 2: C.dark }, x, y + 8);
      paint(ctx, tg8, { 1: C.mid, 2: C.dark }, x + 8, y + 8);
    }
    var treePalette = night ?
      (sycamore ? { 1: '#686898', 2: '#a0a0d0', 3: '#172838', 4: '#172838' } :
                   { 1: '#3d5068', 2: '#7278a8', 3: '#102838', 4: '#102838' }) :
      (sycamore ? { 1: '#b0c868', 2: '#688848', 3: '#203830', 4: '#203830' } :
                   { 1: '#78a850', 2: '#407048', 3: '#183830', 4: '#183830' });
    /* Conifera 16x24: silhouette Gen II stretta, terrazze irregolari.
     * Selezione via hash(tx,ty) invece della tabella 4x4 fissa: la vecchia
     * tabella ripeteva lo stesso profilo ogni 2 tile (passo 32 px, la
     * cadenza esatta misurata dal critico), perche' le tre sagome hanno
     * la stessa base a piena larghezza e differiscono solo nelle terrazze
     * interne. L'hash aggiunge anche uno spostamento authored (dx/dy, solo
     * verso sinistra/alto: gli unici bordi gia' disegnati quando questa
     * tile viene dipinta) cosi' larghezza apparente e altezza della chioma
     * variano tile per tile, come le conifere sfalsate e sovrapposte del
     * riferimento, senza introdurre rumore nel terreno sottostante. */
    var h = hash(tx, ty, sycamore ? 71 : 43);
    var shapeIdx = h % 3;
    var flip = ((h >>> 2) & 1) === 1;
    var dx = TREE_DX[(h >>> 4) & 3];
    var dy = TREE_DY[(h >>> 6) & 3];
    if (night) {
      /* Dither terreno con un colore gia' presente nella palette albero:
       * quattro colori totali per tile, non una seconda palette sottostante. */
      R(ctx, x + 2, y + 3, 1, 1, treePalette[2]); R(ctx, x + 12, y + 5, 1, 1, treePalette[2]);
      R(ctx, x + 6, y + 11, 1, 1, treePalette[2]); R(ctx, x + 14, y + 14, 1, 1, treePalette[2]);
    }
    /* Il tronco segue lo stesso dx della chioma: senza questo restava
     * fisso a colonna centrale in ogni tile, ripetendosi identico a ogni
     * passo di 16 px (quindi anche a 32) indipendentemente dalla sagoma
     * scelta sopra. */
    if (!night) paint(ctx, TREE_TRUNK, treePalette, x + dx, y + 7, false);
    if (night) {
      /* Rami laterali contenuti: silhouette resta netta a 1× e l'overlap
       * non produce fasce orizzontali fra alberi adiacenti. */
      R(ctx, x - 2, y + 1, 4, 1, treePalette[3]); R(ctx, x + 14, y + 1, 4, 1, treePalette[3]);
      R(ctx, x - 1, y + 7, 3, 1, treePalette[2]); R(ctx, x + 14, y + 7, 3, 1, treePalette[2]);
      R(ctx, x - 2, y + 13, 4, 1, treePalette[3]); R(ctx, x + 14, y + 13, 4, 1, treePalette[3]);
    }
    paint(ctx, shapeIdx === 0 ? TREE_CANOPY : (shapeIdx === 1 ? TREE_CANOPY_B : TREE_CANOPY_C),
      treePalette, x + dx, y - 8 + dy, flip);
    /* Connessioni sottili tra metatile adiacenti: le terrazze si toccano
     * senza trasformare la chioma in fasce orizzontali. Anche questi stub
     * seguono dx: erano l'origine principale della cadenza a 16/32 px (un
     * blocco 3x3 fisso a x e x+13 su quasi ogni tile di una fila continua
     * di conifere e' un reticolo perfettamente periodico, indipendente
     * dalla sagoma scelta sopra). */
    if (cell(rows, tx - 1, ty) === 'T' || cell(rows, tx - 1, ty) === 'Y') {
      R(ctx, x + dx, y + 7, 3, 1, treePalette[2]); R(ctx, x + dx, y + 13, 3, 3, treePalette[3]);
    }
    if (cell(rows, tx + 1, ty) === 'T' || cell(rows, tx + 1, ty) === 'Y') {
      R(ctx, x + 13 + dx, y + 7, 3, 1, treePalette[2]); R(ctx, x + 13 + dx, y + 13, 3, 3, treePalette[3]);
    }
  }

  function roadCell(ch) { return ch === 'r' || ch === '-' || ch === ':'; }

  function road(ctx, x, y, tx, ty, rows) {
    var yy, seam;
    R(ctx, x, y, 16, 16, '#d0a0b0');
    for (yy = 0; yy < 16; yy += 4) {
      R(ctx, x, y + yy, 16, 1, '#a86f80');
      seam = ((ty + yy / 4) & 1) ? 4 : 12;
      R(ctx, x + seam, y + yy + 1, 1, 3, '#b88090');
    }
    if (rows) {
      if (!roadCell(cell(rows, tx - 1, ty))) R(ctx, x, y, 2, 16, '#584858');
      if (!roadCell(cell(rows, tx + 1, ty))) R(ctx, x + 14, y, 2, 16, '#584858');
      if (!roadCell(cell(rows, tx, ty - 1))) {
        R(ctx, x, y, 16, 2, '#584858'); R(ctx, x + 2, y + 2, 12, 1, '#efd7c0');
      }
      if (!roadCell(cell(rows, tx, ty + 1))) {
        R(ctx, x, y + 14, 16, 2, '#584858'); R(ctx, x + 2, y + 13, 12, 1, '#efd7c0');
      }
    }
  }

  function sidewalk(ctx, x, y, tx, ty, rows, opts) {
    var left = semanticCell(rows, tx - 1, ty, opts) === '=';
    var right = semanticCell(rows, tx + 1, ty, opts) === '=';
    var up = semanticCell(rows, tx, ty - 1, opts) === '=';
    var down = semanticCell(rows, tx, ty + 1, opts) === '=';
    var horizontal = left || right, vertical = up || down;
    R(ctx, x, y, 16, 16, '#d8d2ad');
    /* Giunti perpendicolari alla direzione: una colonna verticale non puo'
     * piu' sembrare una pila di marciapiedi orizzontali. */
    if (vertical && !horizontal) {
      R(ctx, x, y + 7, 16, 1, '#aaa58b');
      R(ctx, x + 7, y, 1, 16, '#c4bf9d');
    } else if (horizontal && !vertical) {
      R(ctx, x + 7, y, 1, 16, '#aaa58b');
      R(ctx, x, y + 7, 16, 1, '#c4bf9d');
    } else {
      R(ctx, x + 7, y, 1, 16, '#aaa58b');
      R(ctx, x, y + 7, 16, 1, '#aaa58b');
    }
    if (!left) R(ctx, x, y, 2, 16, '#686c62');
    if (!right) R(ctx, x + 14, y, 2, 16, '#686c62');
    if (!up) R(ctx, x, y, 16, 2, '#918b70');
    if (!down) R(ctx, x, y + 14, 16, 2, '#686c62');
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
    var qx, qy, variant;
    R(ctx, x, y, 16, 16, '#e4d6a1');
    for (qy = 0; qy < 2; qy++) for (qx = 0; qx < 2; qx++) {
      variant = qx + qy * 2;
      paint(ctx, GRAVEL_8[variant], { 1: '#c7bb90' }, x + qx * 8, y + qy * 8);
    }
    groundShadow(ctx, x, y, tx, ty, rows);
  }

  function paintGroundSurface(ctx, ground, x, y, tx, ty, rows, opts) {
    if (ground === 'u') gravel(ctx, x, y, tx, ty, rows);
    else if (ground === '=') sidewalk(ctx, x, y, tx, ty, rows, opts);
    else if (ground === 'p') path(ctx, x, y, tx, ty, rows);
    else if (ground === 'r') road(ctx, x, y, tx, ty, rows);
    else grass(ctx, x, y, tx, ty, false, false, rows);
  }

  /* Props urbani authored sul layer terreno esplicito. Forme strette e
   * leggibili a 1x, massimo quattro valori per oggetto. */
  function groundedProp(ctx, ch, ground, x, y, tx, ty, rows, opts) {
    var i;
    paintGroundSurface(ctx, ground, x, y, tx, ty, rows, opts);
    if (ch === 'S') {
      R(ctx, x + 3, y + 8, 2, 8, C.ink); R(ctx, x + 11, y + 8, 2, 8, C.ink);
      R(ctx, x + 2, y + 1, 12, 9, C.ink); R(ctx, x + 3, y + 2, 10, 7, C.paper);
      R(ctx, x + 5, y + 4, 6, 1, C.dark); R(ctx, x + 4, y + 6, 8, 1, C.dark);
    } else if (ch === 'L') {
      R(ctx, x + 5, y + 13, 6, 3, C.ink); R(ctx, x + 7, y + 3, 2, 11, C.ink);
      R(ctx, x + 4, y, 8, 5, C.ink); R(ctx, x + 5, y + 1, 6, 3, C.gold);
    } else if (ch === 'P') {
      R(ctx, x + 6, y + 1, 3, 15, C.ink); R(ctx, x + 7, y + 2, 1, 14, C.wood);
      R(ctx, x + 3, y + 3, 10, 2, C.ink); R(ctx, x + 4, y + 2, 2, 2, C.paper);
      R(ctx, x + 11, y + 2, 2, 2, C.paper);
    } else if (ch === 'B') {
      R(ctx, x + 2, y + 5, 12, 3, C.ink); R(ctx, x + 3, y + 5, 10, 2, C.wood);
      R(ctx, x + 1, y + 8, 14, 4, C.ink); R(ctx, x + 2, y + 8, 12, 2, '#a87542');
      R(ctx, x + 3, y + 12, 2, 4, C.ink); R(ctx, x + 11, y + 12, 2, 4, C.ink);
    } else if (ch === 'A') {
      R(ctx, x + 2, y + 3, 12, 11, C.ink); R(ctx, x + 3, y + 4, 10, 9, '#5c4a32');
      for (i = 0; i < 5; i++) {
        R(ctx, x + 4 + ((i * 5) % 8), y + 5 + ((i * 3) % 6), 2, 2,
          i % 3 === 0 ? C.gold : (i % 3 === 1 ? C.red : C.paper));
      }
    } else if (ch === 'H') {
      R(ctx, x + 6, y + 4, 5, 10, C.ink); R(ctx, x + 7, y + 5, 3, 8, C.red);
      R(ctx, x + 5, y + 3, 7, 3, C.ink); R(ctx, x + 6, y + 3, 5, 2, '#d05a58');
      R(ctx, x + 4, y + 8, 3, 3, C.red); R(ctx, x + 10, y + 8, 3, 3, C.red);
      R(ctx, x + 5, y + 13, 7, 2, C.ink);
    } else if (ch === 'E') {
      R(ctx, x + 7, y + 9, 2, 7, C.ink); R(ctx, x + 3, y + 3, 10, 7, C.ink);
      R(ctx, x + 4, y + 4, 8, 5, '#59758a'); R(ctx, x + 11, y + 4, 2, 4, C.red);
    } else if (ch === 'q') {
      R(ctx, x + 2, y + 3, 12, 12, C.ink); R(ctx, x + 3, y + 4, 10, 9, '#8d6541');
      R(ctx, x + 4, y + 5, 8, 2, '#c79a57'); R(ctx, x + 7, y + 4, 2, 9, C.ink);
      R(ctx, x + 3, y + 13, 10, 2, '#573d31');
    }
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

  /* [roofBase, roofRidge, facadeBase, facadeTrim]. Ogni landmark ha una
   * coppia tetto/facciata propria (tabella firme del contratto R52): il
   * tetto non e' mai lo stesso colore della facciata sotto. */
  var BUILDINGS = {
    '0': ['#713943','#b6625d','#d9c78d','#435a50'], // bottega/casa: tetto bordeaux, fronte salvia
    '1': ['#2f4d63','#5c8098','#dbc78d','#213648'], // sceriffo: tetto blu-ardesia
    '2': ['#8f2430','#c1585a','#e3ab77','#4c1119'], // diner: tetto rosso
    '3': ['#754429','#a9754f','#ecd7a4','#4a2f22'], // Palmer: tetto a due falde marrone
    '4': ['#2c5334','#5c8a52','#a9805a','#3c2a1e'], // Great Northern: tetto verde scuro
    '5': ['#c7d6d2','#ecf5ef','#f1f4e6','#8faaa4'], // ospedale: tetto/facciata chiari
    '6': ['#2c1a1f','#5c3a3a','#c06a4e','#1c1418'], // roadhouse: tetto scuro, legno rosso (facciata schiarita: R58, tetto/facciata erano quasi lo stesso valore)
    '7': ['#242a30','#697074','#4b5054','#202428'],
    '8': ['#31583f','#6d8a52','#8a78a8','#34324f'],
    '9': ['#355660','#719098','#d4ad68','#684534'] // Horne's: tetto petrolio, facciata ocra
  };

  function blobLocal(rows, tx, ty, ch) {
    var lx = 0, ly = 0;
    while (cell(rows, tx - lx - 1, ty) === ch) lx++;
    while (cell(rows, tx, ty - ly - 1) === ch) ly++;
    return { x: lx, y: ly };
  }

  /* Posizione locale della colonna dentro la riga del blob (0-indicizzata da
   * sinistra) + larghezza totale della riga. Usata per scegliere ESATTAMENTE
   * due colonne finestra per facciata (una per lato, mai una per ogni tile
   * pari) e per allineare comignolo/dettagli a una colonna fissa dentro la
   * sagoma, indipendentemente da quanto e' larga la facciata. */
  function blobSpanX(rows, tx, ty, ch) {
    var lx = 0, rx = 0;
    while (cell(rows, tx - lx - 1, ty) === ch) lx++;
    while (cell(rows, tx + rx + 1, ty) === ch) rx++;
    return { local: lx, width: lx + rx + 1 };
  }

  /* Contratto R56: il tetto deve essere ~metà dell'edificio (45-55%), non
   * ~27% come nella versione a 10px. Alzato da 10 a 16 (roof = 16+16=32px,
   * finestre+facciata = 16+16=32px -> 50%). */
  var ROOF_LIFT = 16;

  /* Bookhouse: quattro righe authored come edificio urbano di Gen II.
   * Finestre incassate, montanti, ingresso profondo e fondazione: niente
   * rettangolo nero riempito da pattern generico. */
  function bookhouse(ctx, x, y, tx, ty, rows) {
    var q = blobLocal(rows, tx, ty, '7'), lx = q.x, ly = q.y;
    var bw = blobSpanX(rows, tx, ty, '7').width;
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
    } else if (bw === 3 && ly === 2 && lx === 1) {
      /* Versione urbana 3x4: insegna e ingresso sulla colonna centrale.
       * Il vecchio portale a due colonne era tarato per il blocco 4-wide e
       * avrebbe fatto leggere il nuovo Bookhouse come una facciata monca. */
      R(ctx, x, y, 16, 16, C.ink); R(ctx, x + 2, y + 1, 12, 15, '#30353a');
      R(ctx, x + 2, y + 3, 12, 3, '#e7cf77'); R(ctx, x + 4, y + 7, 8, 9, '#171b20');
    } else if (bw === 3 && ly === 3 && lx === 1) {
      R(ctx, x, y, 16, 16, C.ink); R(ctx, x + 3, y, 10, 14, '#171b20');
      R(ctx, x + 5, y + 1, 6, 2, '#3f464a'); R(ctx, x + 10, y + 10, 1, 1, C.gold);
      R(ctx, x, y + 14, 16, 2, '#77736a');
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

  /* Horne's Department Store: massa autonoma 3x4 accanto al Bookhouse,
   * separata da un vicolo calpestabile.
   * Tetto petrolio, fascia H dorata, vetrina continua e doppia porta
   * centrale. La porta e' silhouette di facciata, non transizione finta:
   * tutto il volume resta solido e ispezionabile con Invio. */
  function departmentStore(ctx, x, y, tx, ty, rows) {
    var q = blobLocal(rows, tx, ty, '9'), lx = q.x, ly = q.y, i;
    if (ly === 0) {
      R(ctx, x, y - 8, 16, 24, '#355660');
      R(ctx, x, y - 8, 16, 2, C.ink);
      for (i = 2; i < 16; i += 4) {
        R(ctx, x + i, y - 6, 1, 18, '#719098');
        R(ctx, x + i + 1, y - 6, 1, 18, '#29444d');
      }
      R(ctx, x, y + 10, 16, 2, '#90a9a8'); R(ctx, x, y + 12, 16, 4, C.ink);
    } else if (ly === 1) {
      R(ctx, x, y, 16, 16, '#d4ad68'); R(ctx, x, y, 16, 2, C.ink);
      R(ctx, x + 1, y + 3, 14, 9, '#684534');
      R(ctx, x + 2, y + 4, 12, 7, '#f0d888');
      if (lx === 1) {
        R(ctx, x + 5, y + 5, 2, 5, C.ink); R(ctx, x + 10, y + 5, 2, 5, C.ink);
        R(ctx, x + 7, y + 7, 3, 1, C.ink);
      } else {
        R(ctx, x + 4, y + 6, 8, 1, '#987244'); R(ctx, x + 6, y + 8, 4, 1, '#987244');
      }
      R(ctx, x, y + 13, 16, 3, '#9a6843');
    } else if (ly === 2) {
      R(ctx, x, y, 16, 16, '#684534');
      R(ctx, x + 1, y + 1, 14, 13, C.ink); R(ctx, x + 2, y + 2, 12, 11, '#a9c8c1');
      R(ctx, x + 3, y + 3, 10, 3, C.paper); R(ctx, x + 7, y + 2, 1, 11, C.ink);
      R(ctx, x, y + 14, 16, 2, '#d4ad68');
    } else {
      R(ctx, x, y, 16, 16, '#d4ad68'); R(ctx, x, y, 16, 2, '#684534');
      if (lx === 1) {
        R(ctx, x, y, 16, 16, C.ink);
        R(ctx, x + 2, y + 1, 12, 15, '#30434a');
        R(ctx, x + 3, y + 2, 4, 6, '#8eb4af'); R(ctx, x + 9, y + 2, 4, 6, '#8eb4af');
        R(ctx, x + 7, y + 1, 2, 15, C.ink);
        R(ctx, x + 6, y + 10, 1, 1, C.gold); R(ctx, x + 9, y + 10, 1, 1, C.gold);
      } else {
        R(ctx, x + 2, y + 3, 12, 8, C.ink); R(ctx, x + 3, y + 4, 10, 6, '#8eb4af');
        R(ctx, x + 3, y + 7, 10, 1, C.ink); R(ctx, x, y + 13, 16, 3, '#684534');
      }
    }
    if (lx === 0) R(ctx, x, y, 2, 16, C.ink);
    if (cell(rows, tx + 1, ty) !== '9') R(ctx, x + 14, y, 2, 16, C.ink);
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
    if (ch === '9') { departmentStore(ctx, x, y, tx, ty, rows); return; }
    var p = BUILDINGS[ch], top = cell(rows, tx, ty - 1), bottom = cell(rows, tx, ty + 1);
    var bottom2 = cell(rows, tx, ty + 2);
    var left = cell(rows, tx - 1, ty), right = cell(rows, tx + 1, ty);
    var facade = bottom !== ch && bottom !== 'D';
    /* bottom2 esclude 'D': senza questo la colonna della porta rompeva il
     * tetto (la riga sopra la porta cadeva nel ramo finestre invece che in
     * quello tetto), lasciando una tacca proprio dove serve piu' massa. */
    var upperFacade = !facade && bottom2 !== ch && bottom2 !== 'D', i;
    var aboveDoor = bottom === 'D';
    if (!facade && !upperFacade) {
      /* Tetto: massa che sale sopra la propria cella (stessa tecnica di
       * lodge()) cosi' l'edificio a 3 righe legge come un volume alto, non
       * una fascia piatta. Sale di ROOF_LIFT invece dei 10px originali (che
       * davano solo ~27% di altezza tetto/edificio, contratto R56 chiede
       * 45-55%). Scanalature derivate dalla palette del landmark (non piu'
       * un verde fisso uguale per tutti), gronda chiara sulla giunzione con
       * la facciata, contorno su ogni lato visibile. Lo sporto laterale di
       * 2px oltre la facciata NON si disegna qui: verso destra il tile
       * vicino e' dipinto dopo in questo stesso passaggio e lo ricoprirebbe;
       * vive in GAME.sprites.drawStructures, un secondo passaggio dopo
       * l'intera griglia (vedi sotto). */
      var ry = y - ROOF_LIFT, rh = 16 + ROOF_LIFT, groove = shade(p[0], -42);
      R(ctx, x, ry, 16, rh, p[0]);
      for (i = 2; i < 16; i += 4) { R(ctx, x + i, ry, 1, rh, p[1]); R(ctx, x + i + 1, ry, 1, rh, groove); }
      R(ctx, x, y + 10, 16, 2, p[1]); R(ctx, x, y + 12, 16, 4, C.ink);
      if (top !== ch) { R(ctx, x, ry, 16, 2, C.ink); R(ctx, x + 1, ry + 2, 14, 1, lighter(p[1], 26)); }
      if (left !== ch && left !== 'D') R(ctx, x, ry, 2, rh, C.ink);
      if (right !== ch && right !== 'D') R(ctx, x + 14, ry, 2, rh, C.ink);
      if (ch === '3') {
        /* Comignolo casa Palmer: unico elemento che rompe la falda. Resta
         * DENTRO l'altezza del tetto (da ry in giu', non oltre): la camera
         * piu' vicina che tiene il tetto intero in quadro (contratto R56,
         * vedi test/gauntlet-shots.sh) inquadra esattamente da ry in giu',
         * quindi qualunque cosa sconfini sopra ry sparirebbe sempre, in
         * ogni cattura. Una sola colonna, scelta in base alla posizione
         * locale cosi' resta sempre vicino al centro qualunque sia la
         * larghezza del blocco. */
        var spc = blobSpanX(rows, tx, ty, ch);
        if (spc.local === spc.width - 2) {
          R(ctx, x + 5, ry, 4, 9, shade(p[0], -24));
          R(ctx, x + 5, ry, 4, 1, C.ink);
          R(ctx, x + 5, ry, 1, 9, C.ink); R(ctx, x + 8, ry, 1, 9, C.ink);
          R(ctx, x + 5, ry + 8, 4, 1, C.ink);
        }
      }
      return;
    }
    if (upperFacade) {
      /* Fascia sotto il tetto. Croce rossa riservata all'ospedale sopra la
       * porta; insegna con glifo per sceriffo/diner/hotel/roadhouse sopra
       * la porta; altrove AL MASSIMO due gruppi finestra per facciata (uno
       * per lato), scelti con blobSpanX in base alla posizione dentro il
       * blocco e non piu' dalla parita' della colonna globale (che dava un
       * gruppo ogni 2 tile a prescindere dalla larghezza dell'edificio,
       * la causa principale delle 22 finestre lamentate dai critici). */
      R(ctx, x, y, 16, 16, p[2]);
      R(ctx, x, y, 16, 2, C.ink); R(ctx, x, y + 2, 16, 2, p[1]);
      if (aboveDoor && ch === '5') {
        R(ctx, x + 2, y + 3, 12, 10, C.ink); R(ctx, x + 3, y + 4, 10, 8, C.paper);
        R(ctx, x + 6, y + 5, 4, 6, C.red); R(ctx, x + 4, y + 7, 8, 2, C.red);
      } else if (aboveDoor && (ch === '1' || ch === '2' || ch === '4' || ch === '6')) {
        R(ctx, x + 2, y + 5, 12, 6, C.ink);
        R(ctx, x + 3, y + 6, 10, 4, ch === '2' ? '#c1585a' : (ch === '1' ? '#e4d9b0' : (ch === '4' ? '#d8c98a' : '#caa15a')));
        if (ch === '1') {
          /* Stella distretto: non piu' un quadrato pieno (si leggeva come
           * un placeholder), un piccolo rombo si legge come distintivo. */
          R(ctx, x + 7, y + 6, 2, 1, C.gold); R(ctx, x + 6, y + 7, 1, 1, C.gold);
          R(ctx, x + 9, y + 7, 1, 1, C.gold); R(ctx, x + 7, y + 8, 2, 1, C.gold);
        } else if (ch === '2') {
          /* Tazza Double R: corpo chiaro + manico, non due quadratini. */
          R(ctx, x + 5, y + 6, 5, 3, C.paper); R(ctx, x + 5, y + 8, 5, 1, C.ink);
          R(ctx, x + 10, y + 7, 1, 1, C.ink);
        } else {
          /* Insegna a bandiera per hotel/roadhouse: asta + vessillo. */
          R(ctx, x + 5, y + 5, 1, 5, C.ink);
          R(ctx, x + 6, y + 6, 4, 1, ch === '4' ? '#3d5a3f' : C.red);
          R(ctx, x + 6, y + 7, 3, 1, ch === '4' ? '#3d5a3f' : C.red);
          R(ctx, x + 6, y + 8, 2, 1, ch === '4' ? '#3d5a3f' : C.red);
        }
      } else if (ch === '0') {
        /* Bottega/casa compatta: la fascia centrale e' un'insegna, le due
         * colonne laterali sono finestre. Identita leggibile anche quando
         * compare accanto a un landmark piu grande. */
        var shopSpan = blobSpanX(rows, tx, ty, ch);
        if (shopSpan.local === 1) {
          R(ctx, x + 1, y + 4, 14, 8, C.ink); R(ctx, x + 2, y + 5, 12, 6, C.paper);
          R(ctx, x + 4, y + 7, 8, 1, '#713943'); R(ctx, x + 7, y + 6, 2, 3, '#713943');
        } else {
          R(ctx, x + 2, y + 4, 12, 8, C.ink); R(ctx, x + 3, y + 5, 10, 6, '#9bc0b2');
          R(ctx, x + 8, y + 5, 1, 6, '#435a50');
        }
      } else {
        var span = blobSpanX(rows, tx, ty, ch);
        if (span.local === 1 || span.local === span.width - 2) {
          if (ch === '2') {
            /* Diner: banda vetrata continua, non due riquadri isolati. */
            R(ctx, x + 1, y + 4, 14, 8, C.ink);
            R(ctx, x + 2, y + 5, 12, 6, '#f8e078');
            R(ctx, x + 7, y + 5, 1, 6, '#c1585a');
          } else {
            /* Gruppo di due finestre 4x6 con montante scuro fra loro. */
            R(ctx, x + 2, y + 4, 12, 8, C.ink);
            R(ctx, x + 3, y + 5, 4, 6, ch === '5' ? '#dfe9df' : '#f8e078');
            R(ctx, x + 9, y + 5, 4, 6, ch === '5' ? '#dfe9df' : '#f8e078');
          }
        } else {
          /* Muro cieco fra le finestre: giunto verticale + dither radi. */
          R(ctx, x + 7, y + 3, 1, 10, p[3]);
          R(ctx, x + 3, y + 9, 1, 1, p[3]); R(ctx, x + 12, y + 6, 1, 1, p[3]);
        }
      }
    } else {
      /* Facciata: base, dither radi, zoccolo scuro. Accenti di firma per
       * landmark restano qui (scacchi diner, trave veranda Palmer, base
       * rossa roadhouse); la croce ospedale vive solo sopra la porta.
       * Niente finestre qui: vivono solo nella fascia upperFacade, cosi'
       * il totale per facciata resta 2 gruppi, non 2 gruppi + 1 per
       * colonna pari ripetuto anche qui. */
      R(ctx, x, y, 16, 16, p[2]);
      R(ctx, x, y, 16, 2, p[1]); R(ctx, x, y + 13, 16, 3, p[3]);
      R(ctx, x + ((tx & 1) ? 3 : 11), y + 6, 1, 1, p[3]); R(ctx, x + ((tx & 1) ? 11 : 4), y + 10, 1, 1, p[3]);
      if (ch === '0') {
        var shopFront = blobSpanX(rows, tx, ty, ch);
        if (shopFront.local === 1) {
          R(ctx, x + 3, y + 2, 10, 11, C.ink); R(ctx, x + 4, y + 3, 8, 10, '#435a50');
          R(ctx, x + 5, y + 4, 6, 3, '#9bc0b2'); R(ctx, x + 10, y + 10, 1, 1, C.gold);
        } else {
          R(ctx, x + 2, y + 3, 12, 8, C.ink); R(ctx, x + 3, y + 4, 10, 6, '#9bc0b2');
          R(ctx, x + 3, y + 7, 10, 1, '#435a50');
        }
        R(ctx, x, y + 12, 16, 2, '#713943');
      } else if (ch === '2') {
        for (i = 0; i < 16; i += 4) R(ctx, x + i, y + 2, 2, 3, i & 4 ? C.paper : C.red);
      } else if (ch === '3') {
        R(ctx, x + 1, y + 5, 14, 1, '#b08060'); R(ctx, x + 5, y + 6, 1, 7, '#b08060');
      } else if (ch === '6') {
        R(ctx, x, y + 13, 16, 3, '#a52e2e');
      }
    }
    if (left !== ch && left !== 'D') R(ctx, x, y, 2, 16, C.ink);
    if (right !== ch && right !== 'D') R(ctx, x + 14, y, 2, 16, C.ink);
  }

  /* Segmenti di gronda: un rettangolo alto 1 riga per ogni fascia di celle
   * che sono davvero il bordo superiore reale dell'edificio in quella riga
   * (stesso criterio "top !== ch" usato in building() per il contorno). Un
   * singolo bbox per blob connesso (versione precedente) andava bene solo
   * per edifici rettangolari uniformi: con ingombri a gradini (torre+ala
   * dell'hotel, ala a L dell'ospedale) il bbox unico disegnava la gronda
   * alla quota del punto piu' alto per TUTTA la larghezza, anche sopra le
   * colonne piu' basse dove non c'e' tetto — una linea sospesa nel prato.
   * Qui ogni gradino ottiene il proprio segmento, alla propria quota.
   * Cache per map.id: le mappe sono statiche, un solo scan basta per tutta
   * la sessione. */
  var ROOF_RECT_CACHE = {};
  function roofRects(map) {
    var key = map && map.id, cached = key && ROOF_RECT_CACHE[key];
    if (cached) return cached;
    var rows = map.rows, H = rows.length, out = [], y, x, ch;
    function at(xx, yy) {
      if (yy < 0 || yy >= H) return ' ';
      var r = rows[yy];
      return (xx < 0 || xx >= r.length) ? ' ' : r.charAt(xx);
    }
    for (y = 0; y < H; y++) {
      var row = rows[y], runCh = null, runStart = -1, w = row.length;
      for (x = 0; x <= w; x++) {
        ch = x < w ? row.charAt(x) : null;
        var isTop = !!(ch && BUILDINGS[ch] && ch !== '7' && ch !== '8' && ch !== '9' && at(x, y - 1) !== ch);
        if (!(isTop && ch === runCh)) {
          if (runCh) out.push({ ch: runCh, bx: runStart, by: y, bw: x - runStart, bh: 1 });
          runCh = isTop ? ch : null;
          runStart = x;
        }
      }
    }
    if (key) ROOF_RECT_CACHE[key] = out;
    return out;
  }

  /* Sporto del tetto: 2px oltre la facciata su entrambi i lati, contorno
   * proprio (scuro fuori, chiaro dentro). Va disegnato in un passaggio a
   * parte, dopo l'intera griglia di tile: verso destra/sotto il tile vicino
   * viene dipinto DOPO quello dell'edificio nello stesso passaggio riga per
   * riga e lo ricoprirebbe se lo sporto fosse disegnato dentro building().
   * engine.js chiama GAME.sprites.drawStructures "sopra i tile, sotto le
   * entita'" subito dopo il loop di paintGround: il momento esatto in cui
   * ogni tile della mappa e' gia' stato dipinto una volta. */
  GAME.sprites = GAME.sprites || {};
  GAME.sprites.drawStructures = function (g, map, cx, cy) {
    if (!map || !map.rows) return;
    var rects = roofRects(map), i, r, p, sy, ey, h, leftX, rightX;
    for (i = 0; i < rects.length; i++) {
      r = rects[i]; p = BUILDINGS[r.ch];
      if (!p) continue;
      sy = r.by * 16 - ROOF_LIFT - cy;
      ey = (r.by + 1) * 16 - cy;
      h = ey - sy;
      if (h <= 0 || ey < 0 || sy > 144) continue;
      leftX = r.bx * 16 - cx; rightX = (r.bx + r.bw) * 16 - cx;
      if (rightX < -4 || leftX > 164) continue;
      R(g, leftX - 2, sy, 1, h, C.ink);
      R(g, leftX - 1, sy, 1, h, p[1]);
      R(g, rightX, sy, 1, h, p[1]);
      R(g, rightX + 1, sy, 1, h, C.ink);
    }
  };

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
    else if (side === '4') {
      R(ctx, x + 4, y + 4, 8, 4, '#31543a'); R(ctx, x + 6, y + 5, 1, 2, C.gold); R(ctx, x + 9, y + 5, 1, 2, C.gold);
      /* Porticato Great Northern: piccola tettoia sopra l'ingresso, sconfina
       * nel tile della fascia finestre sopra (gia' dipinto quando arriva la
       * porta: stesso principio del lift del tetto, sicuro solo verso
       * l'alto). Firma richiesta dal contratto R56 ("porticato o ala
       * laterale"), l'unica sicura da disegnare dentro drawTile stesso. */
      R(ctx, x + 1, y - 3, 14, 3, p[1]);
      R(ctx, x + 1, y - 3, 14, 1, C.ink);
      R(ctx, x, y - 1, 1, 1, C.ink); R(ctx, x + 15, y - 1, 1, 1, C.ink);
    }
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
    var underlay = groundAt(opts, tx, ty);
    if (underlay && 'SLPBAHEq'.indexOf(ch) >= 0) {
      groundedProp(ctx, ch, underlay, x, y, tx, ty, rows, opts);
      return;
    }
    switch (ch) {
      case '.': grass(ctx, x, y, tx, ty, false, false, rows); return;
      case 'g': grass(ctx, x, y, tx, ty, true, nightWoods, rows); return;
      case ',': grass(ctx, x, y, tx, ty, false, false, rows); R(ctx, x + 3, y + 6, 2, 2, '#e8ddad'); R(ctx, x + 10, y + 11, 2, 2, '#bb5962'); return;
      case 'T': tree(ctx, x, y, tx, ty, rows, false, nightWoods); return;
      case 'Y': tree(ctx, x, y, tx, ty, rows, true, nightWoods); return;
      case 'r': road(ctx, x, y, tx, ty, rows); return;
      case 'u': gravel(ctx, x, y, tx, ty, rows); return;
      case 'p':
        if (nightWoods) {
          /* Cortile Lodge senza corsia verticale inventata: il target usa
           * terreno viola continuo. Collisioni e percorso restano invariati. */
          nightGround(ctx, x, y, tx, ty);
          groundShadow(ctx, x, y, tx, ty, rows);
        } else path(ctx, x, y, tx, ty, rows);
        return;
      case 'o': oilPool(ctx, x, y, tx, ty, rows); return;
      case '=': sidewalk(ctx, x, y, tx, ty, rows, opts); return;
      case '-':
        road(ctx, x, y, tx, ty, rows);
        R(ctx, x + 2, y, 3, 16, C.paper); R(ctx, x + 8, y, 3, 16, C.paper); R(ctx, x + 14, y, 2, 16, C.paper);
        return;
      case ':':
        road(ctx, x, y, tx, ty, rows);
        R(ctx, x, y + 2, 16, 3, C.paper); R(ctx, x, y + 8, 16, 3, C.paper); R(ctx, x, y + 14, 16, 2, C.paper);
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
          grass(ctx, x, y, tx, ty, false, false, rows);
          R(ctx, x + 2, y + 3, 12, 12, C.ink); R(ctx, x + 3, y + 4, 10, 9, '#8d6541');
          R(ctx, x + 4, y + 5, 8, 2, '#c79a57'); R(ctx, x + 7, y + 4, 2, 9, C.ink);
          R(ctx, x + 3, y + 13, 10, 2, '#573d31');
        }
        return;
      case 'n': bush(ctx, x, y, tx, ty, rows, nightWoods); return;
      case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': building(ctx, ch, x, y, tx, ty, rows); return;
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


  /* R57: le matrici Cooper erano cave dalla riga 0 (hairify() apriva anche
   * la riga piu' alta del ciuffo, che tocca il bordo del canvas — nessun
   * pixel di contorno sopra, i critici lo hanno misurato come "capelli col
   * fondo direttamente sopra"). Ora ogni riga e' scritta a mano: la riga 0
   * resta SEMPRE contorno pieno (chiude la sagoma), il riempimento 'k'
   * comincia solo dalla riga 1 in poi, dove ha gia' un bordo sopra di se'.
   * Stessa griglia condivisa (BODY_ROWS) per fronte/retro/profilo: testa
   * 8px di riempimento contro torso 10px (prima erano identici, 12 e 12 —
   * "un vaso, non una persona"), collo 4px fra i due, colonna di contorno
   * fra mano e busto (riga braccia), gambe con tasto 'q' proprio invece
   * dei due moncherini di solo contorno. */
  var COOPER_BODY_ROWS = [
    '......osso......', '....ooccccoo....', '...occcccccco...', '...osoccccoso...',
    '...occcccccco...', '....occccccco...', '....oqq..qqo....', '...ooq....qoo...'
  ];
  var COOPER_BODY_ROWS_ALT = COOPER_BODY_ROWS.slice();
  COOPER_BODY_ROWS_ALT[6] = '...ooqq...qqoo..';

  /* R59: il capo era 8 px contro 10 px di spalle — testa PIU' STRETTA del
   * torso, l'opposto del profilo a fungo Gen II. Ora la testa e' 12 px
   * (riga 2-5) contro le 10 del torso (1,20x). Le spalle NON crescono:
   * allargarle avrebbe riportato la maschera di Cooper addosso a quelle
   * degli NPC. La riga 0 resta contorno pieno e ogni riempimento ha
   * sempre contorno o riempimento sopra e sotto di se': la corona si
   * allarga per gradi (6 -> 10 -> 12) e si richiude allo stesso modo
   * (12 -> 10 -> 8 -> collo), cosi' il contorno non si apre mai. */
  var COOPER_DOWN0 = [
    '.....oooooo.....', '...ookkkkkkoo...', '..okkkkkkkkkko..', '..okksssssskko..',
    '..okssssssssko..', '..oksossssosko..', '...oossssssoo...', '.....osssso.....'
  ].concat(COOPER_BODY_ROWS);
  var COOPER_DOWN1 = COOPER_DOWN0.slice(0, 8).concat(COOPER_BODY_ROWS_ALT);

  var COOPER_UP0 = [
    '.....oooooo.....', '...ookkkkkkoo...', '..okkkkkkkkkko..', '..okkkkkkkkkko..',
    '..okkkkkkkkkko..', '..okkkkkkkkkko..', '...ookkkkkkoo...', '.....okkkko.....'
  ].concat(COOPER_BODY_ROWS);
  var COOPER_UP1 = COOPER_UP0.slice(0, 8).concat(COOPER_BODY_ROWS_ALT);

  /* Profilo destro authored (LEFT nasce dal mirror): massa dei capelli
   * dietro, viso davanti, occhio dentro la guancia. Stessa corona della
   * vista frontale, cosi' la testa e' 12 px anche di lato. */
  var COOPER_SIDE0 = [
    '.....oooooo.....', '...ookkkkkkoo...', '..okkkkkkkkkko..', '..okkkkkkkssso..',
    '..okkkkkssssso..', '..okkkkksossso..', '...ookkkkssoo...', '.....okksso.....'
  ].concat(COOPER_BODY_ROWS);
  var COOPER_SIDE1 = COOPER_SIDE0.slice(0, 8).concat(COOPER_BODY_ROWS_ALT);

  /* Estensioni di sagoma capelli per hairStyle (campo gia' presente in
   * chars.js, mai letto dal renderer 2D finora): pochi delta additivi
   * sopra la matrice base, cosi' pettinature diverse hanno una silhouette
   * propria invece del casco identico ricolorato per tutto il cast. */
  /* R59: le acconciature erano inchiodate a una testa larga 12 px. Ora il
   * cranio segue la corporatura (10/12/14) e ogni ciocca si ancora ai
   * bordi reali del capo (hx0/hx1): a 12 px i valori coincidono con quelli
   * authored, alle altre larghezze la ciocca non resta piu' sospesa
   * accanto alla testa con lo sfondo in mezzo. */
  function hairSilhouette(ctx, ox, oy, p, dir, hairCol, hairHi, hx0, hx1) {
    var style = p.hairStyle, hw = hx1 - hx0 + 1;
    if (!style || p.hat) return;
    if (style === 'bouffant' || style === 'wild' || style === 'pompadour') {
      if (dir !== 'up') {
        R(ctx, ox + hx0 + 2, oy - 2, hw - 4, 2, C.ink);
        R(ctx, ox + hx0 + 3, oy - 1, hw - 6, 2, hairCol);
        R(ctx, ox + hx0 + 4, oy - 1, Math.max(1, hw - 8), 1, hairHi);
      } else {
        R(ctx, ox + hx0 + 3, oy - 1, hw - 6, 2, C.ink);
        R(ctx, ox + hx0 + 4, oy, Math.max(1, hw - 8), 1, hairCol);
      }
    }
    if (style === 'receding' && dir === 'down') {
      R(ctx, ox + 6, oy + 2, 4, 1, p.skin || '#e0a870');
    }
    if ((style === 'sidepart' || style === 'slick') && dir === 'down') {
      R(ctx, ox + (style === 'sidepart' ? 6 : 7), oy + 1, 1, 2, shade(hairCol, -34));
    }
    if (p.bun && dir === 'up') {
      R(ctx, ox + hx0 + 4, oy - 2, Math.max(2, hw - 8), 2, C.ink);
      R(ctx, ox + hx0 + 5, oy - 1, Math.max(1, hw - 10), 1, hairCol);
    }
    /* R57: 'long' liscio (Hawk, Log Lady) e 'bouffant/wild/pompadour'
     * (Lucy, Bobby, James...) condividevano la stessa maschera desaturata
     * — differivano solo per colore, 16px su 308. 'long' ora incornicia il
     * viso con due ciocche dritte accanto alla testa (bouffant resta un
     * ciuffo alto e tondo sopra); di spalle cadono lungo la schiena invece
     * che gonfiarsi sopra il cranio. Silhouette diversa, non palette swap. */
    if (style === 'long' && !p.bun) {
      if (dir === 'up') {
        R(ctx, ox + hx0 + 2, oy + 3, 1, 4, hairCol);
        R(ctx, ox + hx1 - 2, oy + 3, 1, 4, hairCol);
      } else {
        R(ctx, ox + hx0 + 1, oy + 1, 1, 5, hairCol);
        R(ctx, ox + hx1 - 1, oy + 1, 1, 5, hairCol);
      }
    }
  }

  /* R59 — grammatica del corpo.
   * Con le quattro sagome fisse (narrow/broad/dress/short) meta' del cast
   * finiva nello stesso stampo: sotto la prima riga di capelli le maschere
   * di Lucy e Hawk erano identiche pixel per pixel (IoU 0,939 misurato dal
   * critico sul box 14x18). R57 aveva cambiato solo la capigliatura, e
   * cambiare i capelli non cambia il corpo.
   * Qui il torso nasce da dati gia' scritti in chars.js e mai letti dal
   * renderer 2D: corporatura (build), statura (height), taglio dell'abito
   * (dress/apron/cardigan/shawl/waistcoat) e portamento (l'archetipo di
   * movimento, che porta con se' portata delle braccia e apertura dei
   * piedi). Due personaggi si distinguono quindi per sagoma, prima ancora
   * che per colore — anche in scala di grigi, anche col cappello. */
  var ARM_REACH = {
    tailored: 0.74, lawman: 0.66, poised: 0.58, rangy: 1.15, weary: 0.55,
    diner: 0.78, mystic: 0.44, rebel: 1.12, uncanny: 0.38, drifter: 0.52,
    spectral: 0.30, menace: 1.04, heavy: 0.72
  };
  var STANCE = {
    tailored: 0, lawman: 2, poised: -1, rangy: 1, weary: 0, diner: 0,
    mystic: 2, rebel: 2, uncanny: 1, drifter: 0, spectral: -1, menace: 3, heavy: 3
  };
  /* Corporatura effettiva = build x apertura di spalle dell'archetipo. Con
   * la sola `build` mezzo cast cadeva nello stesso scaglione (Sarah 0,94 e
   * Norma 0,98 avevano identiche spalle, identica testa e differivano di
   * due pixel in tutto); moltiplicandola per l'apertura authored le due
   * scendono a 0,88 e 0,98, cioe' su due scaglioni diversi. */
  var SHOULDER_SPAN = {
    tailored: 1.04, lawman: 1.14, poised: 0.91, rangy: 1.02, weary: 0.94,
    diner: 1.00, mystic: 1.08, rebel: 1.08, uncanny: 0.96, drifter: 0.93,
    spectral: 0.88, menace: 1.18, heavy: 1.20
  };
  ARM_REACH['ing\u00e9nue'] = 0.82;
  STANCE['ing\u00e9nue'] = -1;
  SHOULDER_SPAN['ing\u00e9nue'] = 0.90;

  /* Riga larga `width` px (contorno compreso) centrata sulla colonna 7,5:
   * le larghezze restano pari, cosi' il corpo non scivola di mezzo pixel
   * rispetto alla testa. */
  function widthRow(width, fill) {
    var x0 = 8 - (width >> 1), x1 = x0 + width - 1, s = '', x;
    for (x = 0; x < 16; x++) {
      s += (x < x0 || x > x1) ? '.' : ((x === x0 || x === x1) ? 'o' : fill);
    }
    return s;
  }

  /* Mano dentro il profilo del braccio: il passo si legge senza allargare
   * la sagoma (allargarla aprirebbe il contorno sulle righe vicine). */
  function armRow(width, fill, step, hand) {
    var s = widthRow(width, fill).split(''), x0 = 8 - (width >> 1), x1 = x0 + width - 1;
    if (width >= 6) {
      if (step > 0) s[x0 + 1] = hand;
      else if (step < 0) s[x1 - 1] = hand;
      else { s[x0 + 1] = hand; s[x1 - 1] = hand; }
    }
    return s.join('');
  }

  /* Gambe: lo stacco centrale resta sempre di 2 px (colonne 7 e 8), l'unico
   * separatore che sopravvive alla desaturazione e alla notte. */
  function legsRow(width, fill) {
    var x0 = 8 - (width >> 1), x1 = x0 + width - 1, s = '', x;
    for (x = 0; x < 16; x++) {
      if (x < x0 || x > x1) s += '.';
      else if (x === 7 || x === 8) s += '.';
      else s += (x === x0 || x === x1) ? 'o' : fill;
    }
    return s;
  }

  function feetRow(width, block, step) {
    var x0 = 8 - (width >> 1), x1 = x0 + width - 1, s = '', x;
    var lo = Math.max(0, x0 + (step > 0 ? -1 : 0)), hi = Math.min(15, x1 + (step < 0 ? 1 : 0));
    for (x = 0; x < 16; x++) {
      s += (x >= lo && x < lo + block) || (x <= hi && x > hi - block) ? 'o' : '.';
    }
    return s;
  }

  /* R59 — anche il cranio segue la corporatura. Con una sola testa da 12 px
   * per tutto il cast, tre righe intere delle due maschere restavano
   * identiche qualunque cosa facesse il corpo: 10 px per le corporature
   * minute, 12 di serie, 14 per le pesanti. A 12 px il generatore
   * riproduce esattamente la testa authored di Cooper, quindi il capo del
   * protagonista e quello degli NPC condividono la stessa costruzione:
   * riga 0 di solo contorno, corona che si allarga per gradi e si
   * richiude per gradi fino al collo. */
  function headRows(width, dir) {
    var x0 = 8 - (width >> 1), x1 = x0 + width - 1;
    var profile = dir === 'left' || dir === 'right', back = dir === 'up';
    var inner = width - 2;
    var browEnd = x0 + Math.ceil(inner * 0.7), cheekEnd = x0 + Math.ceil(inner * 0.5);
    var eyeL = x0 + 3, eyeR = x1 - 3, eyeSide = x1 - 4;
    function row(lo, hi, fn) {
      var s = '', x;
      for (x = 0; x < 16; x++) s += (x < lo || x > hi) ? '.' : fn(x);
      return s;
    }
    var jawLo = x0 + 1, jawHi = x1 - 1;
    var jawInner = jawHi - 2 - (jawLo + 2) + 1;
    var jawSplit = jawLo + 2 + Math.ceil(jawInner * 0.66) - 1;
    var chinLo = x0 + 3, chinHi = x1 - 3;
    var chinSplit = chinLo + Math.ceil((chinHi - chinLo - 1) / 2);
    return [
      row(x0 + 3, x1 - 3, function () { return 'o'; }),
      row(x0 + 1, x1 - 1, function (x) { return (x <= x0 + 2 || x >= x1 - 2) ? 'o' : 'h'; }),
      row(x0, x1, function (x) { return (x === x0 || x === x1) ? 'o' : 'h'; }),
      row(x0, x1, function (x) {
        if (x === x0 || x === x1) return 'o';
        if (back) return 'h';
        if (profile) return x <= browEnd ? 'h' : 's';
        return (x <= x0 + 2 || x >= x1 - 2) ? 'h' : 's';
      }),
      row(x0, x1, function (x) {
        if (x === x0 || x === x1) return 'o';
        if (back) return 'h';
        if (profile) return x <= cheekEnd ? 'h' : 's';
        return (x === x0 + 1 || x === x1 - 1) ? 'h' : 's';
      }),
      row(x0, x1, function (x) {
        if (x === x0 || x === x1) return 'o';
        if (back) return 'h';
        if (profile) return x === eyeSide ? 'o' : (x <= cheekEnd ? 'h' : 's');
        if (x === eyeL || x === eyeR) return 'o';
        return (x === x0 + 1 || x === x1 - 1) ? 'h' : 's';
      }),
      row(jawLo, jawHi, function (x) {
        if (x <= jawLo + 1 || x >= jawHi - 1) return 'o';
        if (back) return 'h';
        if (profile) return x <= jawSplit ? 'h' : 's';
        return 's';
      }),
      row(chinLo, chinHi, function (x) {
        if (x === chinLo || x === chinHi) return 'o';
        if (back) return 'h';
        if (profile) return x <= chinSplit ? 'h' : 's';
        return 's';
      })
    ];
  }

  function bodyFrame(p, kind, step, side, dir) {
    if (kind === 'short') return { rows: GOLD_BODY.short.slice(), neck: false, head: null, headW: 12 };
    var arch = (p.motion && p.motion.archetype) || null;
    if (!arch || ARM_REACH[arch] == null) {
      return { rows: (GOLD_BODY[kind] || GOLD_BODY.narrow).slice(), neck: false, head: null, headW: 12 };
    }
    var reach = ARM_REACH[arch], stance = STANCE[arch] || 0;
    var b = (p.build || 1) * (SHOULDER_SPAN[arch] || 1);
    /* Una giacca (o grembiule, cardigan, panciotto, scialle) copre i fianchi:
     * il torso resta un blocco fino all'orlo. Chi non ne porta rientra in
     * vita. E' la differenza fra la camicetta di Lucy e il giaccone di Hawk,
     * e si legge anche a un metro dallo schermo. */
    var gown = !!p.dress;
    var layered = !!(p.apron || p.cardigan || p.shawl || p.waistcoat || p.log || p.jacket);
    var shoulder = b >= 1.12 ? 12 : (b >= 1.05 ? 10 : (b <= 0.90 ? 6 : 8));
    if (side) shoulder = Math.max(6, shoulder - 2);
    var chest = Math.min(14, shoulder + 2);
    /* Portamento delle braccia in quattro gradi, dal piu' aperto al piu'
     * raccolto: e' la voce che separa Andy da Jacoby o Sarah da Norma, che
     * hanno la stessa corporatura e finirebbero altrimenti nella stessa
     * maschera. 3 = avambraccio fuori dal fianco su due righe, 2 = solo
     * la riga alta, 1 = braccia lungo il corpo, 0 = braccia raccolte. */
    var armTier = reach >= 1.0 ? 3 : (reach >= 0.7 ? 2 : (reach >= 0.5 ? 1 : 0));
    var armSpan = armTier >= 2 ? Math.min(14, chest + 2) : chest;
    var fore = armTier === 3 ? armSpan : (armTier === 0 ? Math.max(6, chest - 2) : chest);
    var hip = gown ? Math.min(14, chest + 2) : (layered ? chest : Math.max(6, chest - 2));
    var hem = gown ? Math.min(14, chest + 4) : (layered ? chest : shoulder);
    /* Ogni riga deve coprire il riempimento di quella sopra (larghezza meno
     * i due px di contorno): altrimenti la sagoma si apre sui fianchi. */
    hip = Math.max(hip, ((p.height || 1) < 1.05 && (p.height || 1) <= 0.99 ? armSpan : fore) - 2);
    hem = Math.max(hem, hip - 2);
    var legW = Math.max(6, Math.min(12, Math.max(stance >= 2 ? shoulder + 2 : shoulder, hem - 2)));
    /* Piedi uniti per chi sta raccolto (stance negativo), piantati larghi
     * per chi sta piazzato: la base della sagoma cambia senza toccare le
     * gambe. */
    var footW = stance <= -1 ? Math.max(4, legW - 2) : Math.min(14, legW + (stance >= 1 ? 2 : 0));
    var block = Math.max(2, Math.min(5, 2 + stance));
    var skirt = gown ? 'c' : 'p';
    var headW = b >= 1.12 ? 14 : (b <= 0.90 ? 10 : 12);
    /* Statura in tre gradi. Chi e' alto non e' lo stesso pupazzo traslato di
     * un pixel: gli si allunga il collo. Chi e' basso perde il secondo giro
     * di braccia, cioe' il busto. In tutti e tre i casi i piedi restano
     * sulla stessa riga — a cambiare e' dove finisce la testa. */
    var h = p.height || 1;
    var tall = h >= 1.05, stoop = !tall && h <= 0.99;
    /* Chi sta eretto porta la linea delle spalle alla larghezza del petto;
     * chi non lo fa la lascia spiovere. Un pixel per lato, ma e' la riga
     * che si legge per prima sopra il torso. */
    var erect = !tall && h >= 1.01;
    var rows = [
      widthRow(erect ? chest : shoulder, 'c'),
      widthRow(chest, 'c'),
      armRow(armSpan, 'c', step, 's'),
      widthRow(fore, 'c'),
      widthRow(hip, skirt),
      widthRow(hem, skirt),
      legsRow(legW, 'p'),
      feetRow(footW, block, step)
    ];
    if (stoop) rows.splice(3, 1);
    return { headW: headW, head: headRows(headW, dir), neck: tall, stoop: stoop, rows: rows };
  }

  Spr.drawChar = function (ctx, x, y, pal, dir, frame, alpha, moving, night) {
    var name = nameOf(pal), p = pal || CHARS.cooper, kind = silhouette(p);
    if (name === 'cooper') {
      var walkFrame = moving && (frame & 1) ? 1 : 0;
      var cooperPattern = dir === 'up' ? (walkFrame ? COOPER_UP1 : COOPER_UP0) :
        (dir === 'left' || dir === 'right' ? (walkFrame ? COOPER_SIDE1 : COOPER_SIDE0) :
          (walkFrame ? COOPER_DOWN1 : COOPER_DOWN0));
      var cooperAlpha = ctx.globalAlpha, cox = Math.round(x), coy = Math.round(y);
      /* Palette diurna authored, invariata (la vista frontale era l'unica
       * parte gia' a livello Gen II: capelli/incarnato Δ 103,2, colletto
       * L 247, cravatta L 32). Castano caldo perche' il bruno precedente
       * (#3a2f22) cadeva a un passo dal contorno e la testa leggeva come
       * un blob pieno. */
      var cooperInk = C.ink;
      var cooperHair = '#6e4526';
      var jacketColor = '#587080';
      var jacketShadeColor = shade(jacketColor, -40);
      var skinColor = '#f0a868';
      /* Cravatta fuori dalla forcella della giacca (≤60 di luminanza,
       * contro i ~70-110 di giacca/ombra): sopravvive alla desaturazione
       * invece di sparire nello stesso grigio del resto del torso. */
      var tieColor = '#4a1420';
      var pantsColor = '#303b43';
      var hairRim = lighter(cooperHair, 30);
      var collarColor = C.paper;
      /* R59: di notte passa TUTTA la palette, contorno compreso — non solo
       * la giacca come fino a R58. Con nightify() la giacca resta il punto
       * a contrasto piu' alto sul terreno bosco #7770a8 (Δ ~45), i
       * pantaloni restano staccati dal torso e nessun materiale interno
       * scende sotto il contorno. */
      if (night) {
        cooperInk = nightify(cooperInk, true);
        cooperHair = nightify(cooperHair);
        jacketColor = nightify(jacketColor);
        jacketShadeColor = nightify(jacketShadeColor);
        skinColor = nightify(skinColor);
        tieColor = nightify(tieColor);
        pantsColor = nightify(pantsColor);
        hairRim = nightify(hairRim);
        collarColor = nightify(collarColor);
      }
      if (alpha != null) ctx.globalAlpha = cooperAlpha * alpha;
      paint(ctx, cooperPattern, { o: cooperInk, c: jacketColor, s: skinColor, k: cooperHair, q: pantsColor }, cox, coy, dir === 'left');
      /* Rim-light sui capelli: dentro l'anello di contorno (riga 2 della
       * matrice), mai sopra — la riga 0 resta piena per chiudere la sagoma
       * sul bordo del canvas, il difetto misurato dai critici. La riga 2
       * ora e' capelli da x3 a x12 in tutte e tre le direzioni, quindi il
       * rim sta al centro e vale anche per il profilo specchiato. */
      R(ctx, cox + 5, coy + 2, 6, 1, hairRim);
      /* Ombra di giacca: secondo valore di luminanza sul torso, presente in
       * tutte le direzioni (non solo di fronte). */
      R(ctx, cox + 9, coy + 10, 3, 1, jacketShadeColor);
      R(ctx, cox + 9, coy + 12, 3, 1, jacketShadeColor);
      if (dir === 'down') {
        /* Colletto bianco (interrompe il contorno alla spalla) + cravatta
         * scura: senza, giacca e testa restavano un'unica campitura, senza
         * collo ne' identita' di outfit riconoscibile in scala di grigi. */
        R(ctx, cox + 5, coy + 9, 1, 2, collarColor);
        R(ctx, cox + 10, coy + 9, 1, 2, collarColor);
        R(ctx, cox + 7, coy + 10, 2, 3, tieColor);
      }
      ctx.globalAlpha = cooperAlpha;
      return;
    }
    var flip = dir === 'left', step = moving ? ((frame & 1) ? -1 : 1) : 0;
    var side = dir === 'left' || dir === 'right';
    var base = dir === 'up' ? GOLD_UP0 : (side ? GOLD_SIDE0 : GOLD_DOWN0);
    var frameSpec = bodyFrame(p, kind, step, side, dir);
    /* Collo: e' la riga che allunga chi e' alto senza traslare lo sprite —
     * la testa sale di una riga, i piedi restano dove sono. Il contorno
     * (x4-x6, x9-x11) copre tutto il riempimento della mascella sopra. */
    var pattern = (frameSpec.head || base.slice(0, 8))
      .concat(frameSpec.neck ? ['....ooossooo....'] : [])
      .concat(frameSpec.rows);
    var ox = Math.round(x);
    var oy = Math.round(y) + (kind === 'short' ? 1 : 0) - (frameSpec.neck ? 1 : 0) + (frameSpec.stoop ? 1 : 0);
    var by = oy + (frameSpec.neck ? 1 : 0);
    var oldAlpha = ctx.globalAlpha;
    if (alpha != null) ctx.globalAlpha = oldAlpha * alpha;
    /* OBJ Gen II: Cooper usa tre soli colori visibili + trasparenza.
     * Outline, capelli e pantaloni condividono l'inchiostro; nessun micro-tono. */
    var shirtCol = name === 'cooper' ? '#c08850' : (p.shirt || '#586878');
    var pantsCol = name === 'cooper' ? C.ink : (p.pants || '#303840');
    var hairCol = name === 'cooper' ? C.ink : (p.hair || C.ink);
    var skinCol = name === 'cooper' ? '#f0a868' : (p.skin || '#e0a870');
    var inkCol = C.ink;
    var accentCol = name === 'cooper' ? C.ink : (p.tie || p.badge || p.collar || C.red);
    var collarCol = name === 'cooper' ? skinCol : (p.collar || p.lapel || C.paper);
    var hatCol = p.hat, apronCol = p.apron, badgeCol = p.badge;
    var logCol = '#986040', browCol = '#885838', glassCol = p.glassesColor || C.ink;
    /* R59: la notte vale per l'intero cast, non per il solo protagonista.
     * Passano capelli, incarnato, abito, pantaloni, accessori e contorno:
     * con la sola giacca virata (fino a R58) un NPC di notte restava un
     * ritaglio diurno incollato su un fondale lunare. */
    if (night) {
      inkCol = nightify(inkCol, true);
      shirtCol = nightify(shirtCol); pantsCol = nightify(pantsCol);
      hairCol = nightify(hairCol); skinCol = nightify(skinCol);
      accentCol = nightify(accentCol); collarCol = nightify(collarCol);
      if (hatCol) hatCol = nightify(hatCol);
      if (apronCol) apronCol = nightify(apronCol);
      if (badgeCol) badgeCol = nightify(badgeCol);
      logCol = nightify(logCol); browCol = nightify(browCol); glassCol = nightify(glassCol);
    }
    var hairRim = night ? nightify(lighter(p.hair || C.ink, 34)) : lighter(hairCol, 34);
    paint(ctx, pattern, {
      o: inkCol, h: hairCol, s: skinCol, c: shirtCol, a: accentCol, p: pantsCol
    }, ox, oy, flip);
    /* Rim-light 1px sulla chioma: senza, i capelli scuri annegavano nel
     * contorno (stesso tono dell'inchiostro, zero contrasto interno). */
    R(ctx, ox + 6, oy + 1, 4, 1, hairRim);
    var hx0 = 8 - (frameSpec.headW >> 1), hx1 = hx0 + frameSpec.headW - 1;
    hairSilhouette(ctx, ox, oy, p, dir, hairCol, hairRim, hx0, hx1);
    if (dir === 'down') {
      R(ctx, ox + 3, oy + 5, 1, 2, skinCol);
      R(ctx, ox + 11, oy + 5, 1, 2, skinCol);
      R(ctx, ox + 6, oy + 3, 3, 1, name === 'cooper' ? inkCol : browCol);
    }
    if (name === 'cooper' && dir === 'up') {
      R(ctx, ox + 7, oy + 7, 2, 1, skinCol);
    }
    if ((p.collar || p.lapel || name === 'cooper') && dir !== 'up' && (name !== 'cooper' || dir === 'down')) {
      R(ctx, ox + 5, by + 9, 2, 2, collarCol); R(ctx, ox + 9, by + 9, 2, 2, collarCol);
    }
    if (name === 'cooper' && dir === 'down') R(ctx, ox + 7, by + 9, 2, 4, inkCol);
    /* Tesa e ceppo sporgono di 1 px oltre la sagoma, in colore di contorno:
     * sono i due soli accessori che devono cambiare il profilo, non solo
     * riempirlo. */
    if (p.hat) {
      R(ctx, ox + hx0 + 2, oy, frameSpec.headW - 4, 2, hatCol);
      R(ctx, ox + hx0 - 1, oy + 2, frameSpec.headW + 2, 2, inkCol);
    }
    /* Chioma lunga: due colonne dentro il profilo del capo (righe 3-6),
     * non piu' un rettangolo a coordinate fisse che con la testa da 10 px
     * restava sospeso accanto al mento con lo sfondo in mezzo. */
    if (p.long) R(ctx, ox + (flip ? hx1 - 2 : hx0 + 1), oy + 3, 2, 4, hairCol);
    if (p.apron && dir !== 'up') { R(ctx, ox + 5, by + 10, 6, 4, apronCol); R(ctx, ox + 6, by + 11, 4, 1, night ? nightify(C.earth2) : C.earth2); }
    if (p.log) { R(ctx, ox + 1, by + 10, 14, 3, inkCol); R(ctx, ox + 2, by + 11, 12, 1, logCol); }
    if (p.badge && dir !== 'up') R(ctx, flip ? ox + 5 : ox + 10, by + 10, 2, 2, badgeCol);
    if (p.glasses && dir !== 'up') {
      R(ctx, ox + 4, oy + 5, 3, 2, glassCol); R(ctx, ox + 9, oy + 5, 3, 2, glassCol);
      R(ctx, ox + 7, oy + 5, 2, 1, inkCol);
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
