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

  /* R62 — la virata notturna sugli sprite e' stata rimossa (era nightify(),
   * introdotta in R59). In gfx/overworld/npc_sprites.pal di Crystal i colori
   * 1 e 2 sono identici in morn / day / nite / dark: di notte cambia solo
   * l'indice di fondo. Con il filtro attivo l'incarnato di Cooper finiva a
   * L 114,4 contro un terreno a L 117,5 — 3 punti di stacco, il viso
   * spariva. Senza filtro sta a L 179,8: 62,3 punti. La tinta notturna del
   * TERRENO (#7770a8, quasi identica al fondale nite di Crystal #7B73C5)
   * resta dov'e'. */

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

  /* Prato: quattro densita' authored (0/4/8/12 segni su 64), media esatta
   * 6. La matrice di fase 4x4 usa ogni densita' quattro volte: niente random,
   * niente tappeto uniforme, grandi masse chiare come negli esterni di Gold. */
  var GRASS_8 = [
    '00000000','00000000','00000000','00000000',
    '00000000','00000000','00000000','00000000'
  ];
  var GRASS_8_H = [
    '00000000','01000000','00000000','00000000',
    '00000100','00000000','00100000','00000010'
  ];
  var GRASS_8_V = [
    '01000010','00010000','00000000','10000000',
    '00000100','00000001','00100000','00001000'
  ];
  var GRASS_8_HV = [
    '01000100','00010000','10000001','00001000',
    '00100000','00000100','01000010','10010000'
  ];
  var GRASS_8_VARIANTS = [GRASS_8, GRASS_8_H, GRASS_8_V, GRASS_8_HV];
  var GRASS_8_PHASES = [
    0, 2, 1, 3,
    3, 1, 0, 2,
    1, 3, 2, 0,
    2, 0, 3, 1
  ];

  function grass8At(tx, ty, qx, qy) {
    return GRASS_8_VARIANTS[GRASS_8_PHASES[
      ((((ty * 2) + qy) & 3) << 2) | (((tx * 2) + qx) & 3)
    ]];
  }

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
    /* Matrice authored 4x4 sul reticolo globale 8px: sei pixel per cella,
     * continuita' fra metatile e variazione di fase anche lungo le righe. */
    var qx, qy;
    R(ctx, x, y, 16, 16, C.grass);
    for (qy = 0; qy < 2; qy++) for (qx = 0; qx < 2; qx++) {
      paint(ctx, grass8At(tx, ty, qx, qy), { 1: C.mid, 2: C.dark }, x + qx * 8, y + qy * 8);
    }
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
      var tqx, tqy;
      for (tqy = 0; tqy < 2; tqy++) for (tqx = 0; tqx < 2; tqx++) {
        paint(ctx, grass8At(tx, ty, tqx, tqy), { 1: C.mid, 2: C.dark }, x + tqx * 8, y + tqy * 8);
      }
    }
    var treePalette = night ?
      (sycamore ? { 1: '#686898', 2: '#a0a0d0', 3: '#172838', 4: '#172838' } :
                   { 1: '#3d5068', 2: '#7278a8', 3: '#102838', 4: '#102838' }) :
      /* Conifere di bordo: tre valori verdi scuri presi direttamente dalla
       * master palette. La chioma resta distinta dal prato crema e forma la
       * cornice 65-75% scura del riferimento, senza filtro o nuova logica. */
      (sycamore ? { 1: '#a8be72', 2: '#63834a', 3: '#31543a', 4: '#31543a' } :
                   { 1: '#63834a', 2: '#31543a', 3: '#183225', 4: '#183225' });
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
    R(ctx, x, y, 16, 16, '#31543a');
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
    /* Un solo giunto interno da 1px. Prima ogni tile portava due bordi da
     * 2px: fra moduli nasceva una sbarra nera larga 4px, piu' forte delle
     * finestre. Contorno spesso resta solo sul perimetro del volume. */
    if (lx > 0) R(ctx, x, y, 1, 16, '#31543a');
    if (cell(rows, tx + 1, ty) === '7') R(ctx, x + 15, y, 1, 16, '#31543a');
    if (lx === 0) { R(ctx, x, y, 3, 16, C.ink); R(ctx, x + 3, y, 1, 16, '#63834a'); }
    if (cell(rows, tx + 1, ty) !== '7') { R(ctx, x + 13, y, 3, 16, C.ink); R(ctx, x + 12, y, 1, 16, '#63834a'); }
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
      /* Gronda in quattro valori: luce, ombra, contorno, sottotetto. La
       * vecchia fascia nera 4px leggeva come rettangolo piatto. */
      R(ctx, x, y + 10, 16, 1, '#d9d49a'); R(ctx, x, y + 11, 16, 1, '#63834a');
      R(ctx, x, y + 12, 16, 2, C.ink); R(ctx, x, y + 14, 16, 2, '#31543a');
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
      R(ctx, x, y + 12, 16, 1, '#d69874'); R(ctx, x, y + 13, 16, 3, '#9a6843');
      if (lx === 0) R(ctx, x + 2, y + 2, 2, 11, '#684534');
      if (cell(rows, tx + 1, ty) !== '9') R(ctx, x + 12, y + 2, 2, 11, '#684534');
    } else if (ly === 2) {
      R(ctx, x, y, 16, 16, '#684534');
      R(ctx, x + 1, y + 1, 14, 13, C.ink); R(ctx, x + 2, y + 2, 12, 11, '#a9c8c1');
      R(ctx, x + 3, y + 3, 10, 3, C.paper); R(ctx, x + 7, y + 2, 1, 11, C.ink);
      R(ctx, x + 2, y + 8, 12, 1, C.ink); R(ctx, x + 3, y + 9, 4, 1, '#f5efcf');
      R(ctx, x, y + 13, 16, 1, '#684534'); R(ctx, x, y + 14, 16, 2, '#d4ad68');
    } else {
      R(ctx, x, y, 16, 16, '#d4ad68'); R(ctx, x, y, 16, 2, '#684534');
      if (lx === 1) {
        R(ctx, x, y, 16, 16, C.ink);
        R(ctx, x + 2, y + 1, 12, 15, '#30434a');
        R(ctx, x + 3, y + 2, 4, 6, '#8eb4af'); R(ctx, x + 9, y + 2, 4, 6, '#8eb4af');
        R(ctx, x + 7, y + 1, 2, 15, C.ink);
        R(ctx, x + 6, y + 10, 1, 1, C.gold); R(ctx, x + 9, y + 10, 1, 1, C.gold);
        R(ctx, x + 2, y + 14, 12, 1, '#f5efcf');
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
      } else if (ch === '4') {
        /* Great Northern: travi di legno e due gruppi finestra. Ritmo 4px,
         * nessun rumore casuale; la facciata ora legge come loggia, non
         * come pannello uniforme sotto un tetto verde. */
        var hotelSpan = blobSpanX(rows, tx, ty, ch);
        R(ctx, x, y + 3, 16, 2, p[3]); R(ctx, x, y + 11, 16, 2, p[3]);
        if (hotelSpan.local === 1 || hotelSpan.local === hotelSpan.width - 2) {
          R(ctx, x + 2, y + 5, 12, 6, C.ink);
          R(ctx, x + 3, y + 6, 4, 4, '#d9d49a'); R(ctx, x + 9, y + 6, 4, 4, '#d9d49a');
        } else {
          R(ctx, x + 7, y + 3, 2, 10, p[3]);
          R(ctx, x + 3, y + 7, 1, 1, '#63834a'); R(ctx, x + 12, y + 9, 1, 1, '#63834a');
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
      } else if (ch === '4') {
        R(ctx, x, y + 3, 16, 2, p[3]); R(ctx, x, y + 10, 16, 1, p[3]);
        R(ctx, x + 3, y + 4, 2, 9, p[3]); R(ctx, x + 11, y + 4, 2, 9, p[3]);
        R(ctx, x + 6, y + 7, 1, 1, '#63834a'); R(ctx, x + 9, y + 5, 1, 1, '#63834a');
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
    /* Soglia esterna: pavimento grafico, non nuovo tile e non collisione.
     * Copre solo i quattro pixel subito sotto porte incastonate in un
     * edificio. Disegnata qui, sopra il terreno completo ma sotto entita'. */
    if (!map.indoor) {
      var rows = map.rows, ty, tx, row, side, px, py;
      for (ty = 0; ty < rows.length; ty++) {
        row = rows[ty];
        for (tx = 0; tx < row.length; tx++) {
          if (row.charAt(tx) !== 'D') continue;
          side = cell(rows, tx - 1, ty);
          if (!BUILDINGS[side]) side = cell(rows, tx + 1, ty);
          if (!BUILDINGS[side]) side = cell(rows, tx, ty - 1);
          if (!BUILDINGS[side]) continue;
          p = BUILDINGS[side];
          px = tx * 16 - cx;
          /* Lodge alza facciata e porta di 8px; sua soglia segue il piede
           * visivo. Altri esterni poggiano sulla riga subito successiva. */
          py = (side === '8' ? ty * 16 + 8 : (ty + 1) * 16) - cy;
          if (px < -16 || px > 160 || py < -4 || py > 144) continue;
          R(g, px, py, 16, 4, C.ink);
          R(g, px + 1, py, 14, 2, p[1]);
          R(g, px + 2, py + 2, 12, 1, shade(p[1], -22));
        }
      }
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
      R(ctx, x + 2, y - 2, 12, 1, '#d9d49a');
      R(ctx, x + 1, y - 1, 2, 17, C.ink); R(ctx, x + 2, y, 1, 16, p[1]);
      R(ctx, x + 13, y - 1, 2, 17, C.ink); R(ctx, x + 13, y, 1, 16, p[1]);
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


  /* ==================================================================
   * R62 — sprite dei personaggi come OBJ Gen II.
   *
   * Misure sugli sprite originali (pret/pokecrystal: chris, kris, lass,
   * gentleman, officer, cooltrainer_m), non ricordi:
   *   - 3 colori + trasparente per sprite, mai piu' di 3 per tile 8x8;
   *   - il tono piu' scuro e' NERO PURO e copre il 50-76 % dei pixel;
   *   - il profilo laterale e' un disegno diverso dal frontale
   *     (IoU 0,68-0,76), non il frontale con la faccia tagliata;
   *   - il collo non scende mai sotto il 71 % della larghezza della testa;
   *   - le spalle non sono mai piu' strette della testa;
   *   - i colori 1 e 2 di gfx/overworld/npc_sprites.pal sono IDENTICI in
   *     morn / day / nite: di notte scende lo sfondo, non il personaggio.
   *
   * Da qui discendono tre decisioni che revocano round precedenti:
   *   - il tetto di R57 ("4 colori + contorno, la leggibilita' prima della
   *     legalita' hardware") era sbagliato: Oro vince con 3;
   *   - la notte di R59 sugli sprite era un gate mal posto: nightify() non
   *     tocca piu' i personaggi, resta solo la tinta del terreno;
   *   - la testa a 12 px di R59 restava piu' larga delle spalle: qui le
   *     spalle partono DALLA testa, non da un numero indipendente.
   * ================================================================== */

  /* --- i tre colori ------------------------------------------------- */

  var GB_INK = '#000000';          /* il tono piu' scuro E' nero, non #202820 */

  function lumaHex(hex) { var c = rgbOf(hex); return c ? luma(c[0], c[1], c[2]) : 0; }

  /* Griglia colore GBC: 5 bit per canale. */
  function gbcSnap(hex) {
    var c = rgbOf(hex);
    if (!c) return hex;
    return hexOf(Math.min(248, Math.round(c[0] / 8) * 8),
      Math.min(248, Math.round(c[1] / 8) * 8), Math.min(248, Math.round(c[2] / 8) * 8));
  }

  /* Rampa incarnato in tre toni. Tutti sopra L 179: il terreno notturno sta
   * a L 117,5 (#7770a8, la tinta che il contratto conserva) e il gate 6 vuole
   * almeno 60 punti di stacco fra pelle e terreno DI NOTTE, con i colori
   * dello sprite invariati. Un incarnato piu' scuro di cosi' non passerebbe:
   * e' il prezzo dichiarato della palette Gen II, non una svista. */
  var SKIN_RAMP = ['#f8d8b0', '#f8b878', '#f8a860'];   /* L 222,6 / 193,0 / 179,8 */

  function skinOf(p) {
    var l = lumaHex(p.skin || '#e8b88a');
    return l >= 200 ? SKIN_RAMP[0] : (l >= 170 ? SKIN_RAMP[1] : SKIN_RAMP[2]);
  }

  /* Il terzo colore e' UNO. Se i capelli sono chiari se lo prendono loro e
   * l'abito va a nero (Leland, Lucy, Laura, il Gigante); altrimenti se lo
   * prende l'abito e i capelli vanno a nero (Cooper, Truman, Hawk...).
   * E' la stessa scelta di lass/chris in Oro, dove chioma e vestito
   * condividono l'unico colore non-nero non-incarnato. */
  function accentOf(p, skinL) {
    var lightHair = lumaHex(p.hair || '#000000') >= 118;
    var src = lightHair ? p.hair : (p.apron || p.shirt || p.pants || '#586878');
    var c = rgbOf(src) || [88, 104, 120];
    /* R63 — la rampa di valore. In Oro i tre toni sono 0 / 85 / 170: fra i
     * due non-neri ci sono SEMPRE 85 punti di luminanza. Da noi ce n'erano
     * 32 su npcC, 56 su npcA: su quegli NPC la tinta faceva il lavoro del
     * valore, ed e' il motivo per cui in scala di grigi collassavano. Qui
     * l'accento viene portato dentro [skinL-104, skinL-78] — con lo scatto
     * della griglia GBC (±4) restano oltre 70 punti, il gate. */
    var hi = skinL - 78, lo = Math.max(56, skinL - 104), i, l, k, t;
    if (hi < lo) hi = lo;
    l = luma(c[0], c[1], c[2]);
    if (l < 4) { c = [96, 104, 120]; l = luma(96, 104, 120); }
    t = l < lo ? lo : (l > hi ? hi : l);
    k = t / l;
    for (i = 0; i < 3; i++) c[i] = Math.max(0, Math.min(248, c[i] * k));
    /* la scala e' moltiplicativa: se un canale satura a 248 la luminanza
     * resta sotto il bersaglio, e va alzata in piano. */
    for (i = 0; i < 48 && luma(c[0], c[1], c[2]) < lo; i++) {
      c[0] = Math.min(248, c[0] + 4); c[1] = Math.min(248, c[1] + 4); c[2] = Math.min(248, c[2] + 4);
    }
    return { hex: gbcSnap(hexOf(c[0], c[1], c[2])), lightHair: lightHair };
  }

  /* Gli OBJ hanno palette propria: su hardware Gen II una passata sul BG non
   * li tocca. `js/gold-tone.js` quantizza pero' il frame composito, quindi i
   * tre toni dello sprite vanno dichiarati perche' li lasci passare intatti. */
  var OBJ_TONES = (GAME.Retro2D = GAME.Retro2D || {}).objTones ||
                  (GAME.Retro2D.objTones = Object.create(null));
  function declareObjTone(hex) { if (hex) OBJ_TONES[String(hex).toLowerCase()] = true; }

  function paletteOf(p) {
    var skin = skinOf(p), acc = accentOf(p, lumaHex(skin));
    declareObjTone(GB_INK); declareObjTone(skin); declareObjTone(acc.hex);
    return {
      o: GB_INK,
      s: skin,
      h: acc.lightHair ? acc.hex : GB_INK,     /* chioma */
      /* R63 — il riflesso nella chioma e' SEMPRE l'altro dei due toni non
       * incarnato: accento sui capelli scuri, nero su quelli chiari. Cosi'
       * ogni riga di capelli porta due toni comunque sia colorato il
       * personaggio (in Oro nessuna riga di testa e' piatta), e la calotta
       * smette di essere una riga interamente nera. */
      g: acc.lightHair ? GB_INK : acc.hex,
      c: acc.hex,     /* busto */
      p: GB_INK                                /* gambe e scarpe: sempre nere */
    };
  }

  /* --- griglia 16 px ------------------------------------------------ */

  var HEAD_PAD = 2;                 /* righe libere sopra la testa: capigliature */
  var EMPTY_ROW = '................';

  function blankRows(n) { var a = [], i; for (i = 0; i < n; i++) a.push(EMPTY_ROW); return a; }
  function toGrid(rows) { return rows.map(function (r) { return r.split(''); }); }
  function fromGrid(g) { return g.map(function (r) { return r.join(''); }); }
  function put(g, x, y, k) { if (y >= 0 && y < g.length && x >= 0 && x < 16) g[y][x] = k; }
  function span(g, x0, x1, y, k) { var x; for (x = x0; x <= x1; x++) put(g, x, y, k); }

  /* Contorno chiuso per costruzione: ogni pixel di riempimento affacciato sul
   * vuoto diventa contorno. Le perdite misurate dal critico (inforcatura,
   * angoli dei capelli) erano tutte di questo tipo — un artista le chiude a
   * mano, qui le chiude la funzione, su tutte e quattro le direzioni e su
   * tutto il cast invece che sul solo protagonista. */
  function seal(rows) {
    var src = rows.slice(), out = [], y, x, s, k;
    function at(yy, xx) {
      return (yy < 0 || yy >= src.length || xx < 0 || xx >= 16) ? '.' : src[yy].charAt(xx);
    }
    for (y = 0; y < src.length; y++) {
      s = src[y].split('');
      for (x = 0; x < 16; x++) {
        k = s[x];
        if (k === '.' || k === 'o') continue;
        if (at(y - 1, x) === '.' || at(y + 1, x) === '.' ||
            at(y, x - 1) === '.' || at(y, x + 1) === '.') s[x] = 'o';
      }
      out.push(s.join(''));
    }
    return out;
  }

  /* --- testa --------------------------------------------------------
   *
   * R63. Il difetto misurato: tre personaggi su cinque avevano la stessa
   * testa (Cooper e l'NPC marrone condividevano 8 righe su 8), e ogni riga
   * era un campo unico di incarnato con al massimo due pixel di occhio. In
   * Oro nessuna riga di testa e' piatta: c'e' sempre almeno uno stacco
   * dentro — orecchio `#s#` sotto il bordo, occhi da 1 px che continuano
   * nella riga sotto come zigomo, ciocche nella chioma (chris down 3
   * `#+++##+++#`, kris down 3 `#oo#++#oo#`).
   *
   * Le otto righe si dividono in due gruppi: le prime quattro (calotta e
   * chioma) scelte da i%5, le quattro del viso da i%7. Due personaggi a
   * distanza d < 35 nel cast possono coincidere sul primo gruppo (d
   * multiplo di 5) oppure sul secondo (multiplo di 7), mai su entrambi:
   * al massimo 4 righe uguali su 8, che e' il massimo di Oro
   * (gentleman/officer). Prima erano 8 su 8. */

  var CAST_ORDER = null;
  function castIndex(p) {
    var C, keys, i, s, v, j;
    if (!CAST_ORDER) {
      CAST_ORDER = [];
      C = (GAME.Sprites && GAME.Sprites.CHARS) || {};
      keys = Object.keys(C);
      for (i = 0; i < keys.length; i++) CAST_ORDER.push(C[keys[i]]);
    }
    i = CAST_ORDER.indexOf(p);
    if (i >= 0 && i < 35) return i;
    /* schede fuori dal cast (copie, prove): indice stabile dai campi
     * identitari, sempre dentro 0-34 perche' 5 e 7 restino coprimi con
     * ogni distanza possibile. */
    s = [p.skin, p.hair, p.eyes, p.hairStyle, p.height, p.build].join('|');
    v = 7;
    for (j = 0; j < s.length; j++) v = (v * 31 + s.charCodeAt(j)) % 35;
    return v;
  }

  function headDigits(p) {
    var i = castIndex(p);
    return [i % 5, (i * 2) % 5, (i * 3) % 5, (i * 4) % 5,
      i % 7, (i * 2) % 7, (i * 3) % 7, (i * 4) % 7];
  }

  /* Il dettaglio di Oro non e' pixel sparsi: sono FASCE, quasi sempre di
   * 2 px, simmetriche rispetto al centro (chris down 9 `##oo++oo##`, 11
   * `#oo#oo++oo#oo#`, 14 `#++####++#`). Un primo tentativo di R63 aveva
   * portato la densita' dentro il gate spargendo singoli pixel: i numeri
   * passavano e la faccia leggeva come rumore. bandRow costruisce la riga
   * dal bordo verso il centro, una fascia per volta, e l'ultima riempie:
   * e' la stessa grammatica.
   *
   * I token, non i colori: O contorno, H chioma, G riflesso della chioma,
   * S incarnato, F il campo del viso (incarnato di fronte, nuca di
   * spalle), M il segno sul viso (nero di fronte, riflesso di spalle). */
  function bandRow(lo, hi, spec, tone) {
    var s = [], x, i, n, k, si = 0, a = lo, b = hi;
    for (x = 0; x < 16; x++) s.push('.');
    while (a <= b && si < spec.length) {
      k = tone(spec[si][0]); n = spec[si][1]; si++;
      if (n < 0) break;
      for (i = 0; i < n && a <= b; i++) s[a++] = k;
      for (i = 0; i < n && a <= b; i++) s[b--] = k;
    }
    k = tone(spec[spec.length - 1][0]);
    while (a <= b) s[a++] = k;
    return s;
  }

  /* Cinque fasce per la chioma, sette per il viso: due personaggi a
   * distanza < 35 nel cast possono coincidere su un gruppo solo. */
  /* La testa di Oro si allarga scendendo: chris down misura 6, 8, 10, 10,
   * 12, 12, 14, 14, 12 px di riga. Le righe piu' larghe sono quelle del
   * VISO, non della calotta, ed e' per questo che la faccia domina la
   * testa. La nostra era quasi a larghezza costante (8, 10, 12, 12, 12,
   * 12, 12, 10): la chioma pesava quanto il viso e lo sprite leggeva come
   * un blocco con una striscia chiara in mezzo. */
  var HAIR_PAD0 = [[3, 3], [4, 4], [3, 4], [4, 3], [2, 3]];   /* calotta */
  var HAIR_PAD1 = [[2, 2], [3, 3], [2, 3], [3, 2], [1, 2]];   /* chioma alta */
  var HAIR_BAND2 = [
    [['O', 1], ['H', 1], ['G', -1]],
    [['O', 1], ['H', 2], ['G', -1]],
    [['O', 1], ['H', 3], ['G', -1]],
    [['O', 1], ['G', 1], ['H', -1]],
    [['O', 1], ['G', 2], ['H', -1]]
  ];
  var HAIR_BAND3 = [
    [['O', 1], ['H', 2], ['G', 1], ['H', -1]],
    [['O', 1], ['G', 1], ['H', 1], ['G', -1]],
    [['O', 1], ['H', 1], ['G', 2], ['H', -1]],
    [['O', 1], ['H', 3], ['G', -1]],
    [['O', 1], ['H', 1], ['G', -1]]
  ];
  /* Riga 4: la fascia bassa della chioma. In Oro le prime SEI righe della
   * testa sono tutte capelli e il viso comincia solo alla settima (chris
   * down 5 `..####++++####..`, 6 `.#o#oooooooo#o#.`): il viso e' alto tre
   * righe, non quattro. Quando ne prendeva quattro, l'incarnato diventava
   * un lastrone chiaro con due tacche ai bordi — leggeva come una maschera,
   * non come una faccia. E' anche la riga che separa Cooper da Andy, che
   * prima uscivano con la stessa identica testa (8 righe uguali su 8). */
  var FRINGE = [
    [['O', 2], ['H', 2], ['G', -1]],
    [['O', 2], ['G', 2], ['H', -1]],
    [['O', 1], ['H', 2], ['O', 1], ['G', -1]],
    [['O', 2], ['H', 1], ['G', 2], ['H', -1]],
    [['O', 1], ['G', 1], ['H', 2], ['G', -1]],
    [['O', 2], ['H', 3], ['G', -1]],
    [['O', 1], ['H', 1], ['G', 1], ['O', 1], ['H', -1]]
  ];
  /* Orecchie: contorno, un pixel di pelle, contorno — sotto il bordo, non
   * fuori (chris down 6 `.#o#oooooooo#o#.`). Restano pelle anche di
   * spalle: e' cosi' che i tile alti del frame `up` portano tre toni. */
  var EARS = [
    [['O', 1], ['S', 1], ['M', 1], ['F', -1]],
    [['O', 1], ['S', 2], ['M', 1], ['F', -1]],
    [['O', 1], ['S', 1], ['M', 2], ['F', -1]],
    [['O', 1], ['H', 1], ['S', 1], ['M', 1], ['F', -1]],
    [['O', 1], ['S', 1], ['M', 1], ['H', 1], ['F', -1]],
    [['O', 2], ['S', 1], ['M', 1], ['F', -1]],
    [['O', 1], ['S', 1], ['M', 1], ['F', 1], ['H', 1], ['F', -1]]
  ];
  /* Occhi: la loro posizione si misura dal CENTRO, non dal bordo. In Oro
   * stanno a 1-2 px dall'asse (chris down 7 `.#oooo#oo#oooo#.`: colonne 6
   * e 9 su una testa larga 14) e fra i due ne restano due di incarnato.
   * Misurandoli dal bordo finivano agli angoli del viso, e la faccia
   * leggeva come un granchio. */
  var EYES = [                  /* scarto extra, sopracciglio, naso, larghezza */
    [0, 0, 0, 1], [1, 0, 0, 1], [0, 1, 0, 1], [1, 1, 0, 1],
    [0, 0, 1, 1], [1, 0, 1, 1], [0, 0, 0, 2]
  ];
  /* Sotto gli occhi Oro lascia l'incarnato pulito fra le due colonne
   * scure (chris down 8 `..##oo#oo#oo##..`): una bocca larga due le
   * chiudeva a un blocco nero di quattro. Qui la bocca e' al massimo un
   * pixel. */
  var MOUTH = [                           /* bocca, guancia, mento */
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [0, 1, 1], [1, 0, 1]
  ];

  function frontHeadRows(W, back, d) {
    var x0 = 8 - (W >> 1), x1 = x0 + W - 1;
    var rows = [], a, i, t, p0, p1, eL, eR;
    /* di spalle il campo del viso e' nuca e i segni sono il riflesso: la
     * stessa matrice, letta con due toni diversi */
    /* Due letture della stessa matrice. Le righe di sola chioma (0-3)
     * usano i toni veri dei capelli in tutte e due le direzioni; le righe
     * del viso (4-7) di spalle diventano nuca: il campo passa alla chioma
     * e i segni al riflesso. Tenere un'unica mappa mandava a nero l'intera
     * nuca dei personaggi biondi — Lucy usciva con 5 righe interamente
     * nere su 16 contro le 3 del gate. */
    var HAIRTONE = { O: 'o', H: 'h', G: 'g', S: 's', F: 'h', M: 'g' };
    var TONE = back ? { O: 'o', H: 'g', G: 'g', S: 's', F: 'h', M: 'g' }
      : { O: 'o', H: 'h', G: 'g', S: 's', F: 's', M: 'o' };
    function tone(k) { return TONE[k]; }
    function hairTone(k) { return HAIRTONE[k]; }
    function set(a, x, k) { if (x > 0 && x < 15 && a[x] !== '.') a[x] = k; }

    /* 0-1 — calotta e chioma alta, con la scriminatura spostata di lato
     * (in Oro il volume non e' mai simmetrico: kris down 1 `#o++++o#`). */
    p0 = HAIR_PAD0[d[0]];
    a = bandRow(x0 + p0[0], x1 - p0[1], [['O', 1], ['G', -1]], hairTone);
    rows.push(a);
    p1 = HAIR_PAD1[d[1]];
    a = bandRow(x0 + p1[0], x1 - p1[1], [['O', 1], ['H', 1], ['G', -1]], hairTone);
    rows.push(a);

    /* 2-3 — ciocche: due toni dentro i capelli, in fasce, come chris
     * down 3 `#+++##+++#`. Prima meta' sprite era un campo unico. */
    rows.push(bandRow(x0 + 1, x1 - 1, HAIR_BAND2[d[2]], hairTone));
    rows.push(bandRow(x0 + 1, x1 - 1, HAIR_BAND3[d[3]], hairTone));

    /* 4 — fascia bassa della chioma: ancora capelli, non ancora viso */
    rows.push(bandRow(x0 + 1, x1 - 1, FRINGE[d[4]], hairTone));

    /* 5 — orecchie e tempie: la prima riga di viso */
    rows.push(bandRow(x0, x1, EARS[d[5]], tone));

    /* 6 — occhi da 1 px su un viso pulito: in Oro non sono mai piu' di
     * due pixel neri, ed e' per questo che si leggono. */
    t = EYES[d[6]];
    eL = Math.max(x0 + 2, 7 - (W >= 13 ? 2 : 1) - t[0]);
    eR = Math.min(x1 - 2, 8 + (W >= 13 ? 2 : 1) + t[0]);
    a = bandRow(x0, x1, [['O', 1], ['F', -1]], tone);
    set(a, eL, TONE.M); set(a, eR, TONE.M);
    if (t[3] > 1) { set(a, eL + 1, TONE.M); set(a, eR - 1, TONE.M); }
    if (t[1]) { set(a, eL - 1, TONE.H); set(a, eR + 1, TONE.H); }   /* sopracciglio */
    if (t[2]) set(a, W & 1 ? 8 : 7, TONE.M);                       /* naso */
    rows.push(a);

    /* 7 — mento piu' stretto: le colonne degli occhi continuano come lati
     * del naso, esattamente come in Oro (chris down 8 `..##oo#oo#oo##..`),
     * piu' la bocca. */
    a = bandRow(x0 + 1, x1 - 1, [['O', 1], ['F', -1]], tone);
    t = MOUTH[d[7]];
    for (i = 0; i < t[0]; i++) set(a, 7 + i, TONE.M);
    if (t[1]) { set(a, x0 + 2, TONE.M); set(a, x1 - 2, TONE.M); }
    if (t[2]) { set(a, eL - 1, TONE.M); set(a, eR + 1, TONE.M); }
    if (back) { set(a, x0 + 2, 's'); set(a, x1 - 2, 's'); }   /* nuca */
    rows.push(a);

    /* Teste larghe 14 px: le fasce si allungano in proporzione e il viso
     * torna a essere un campo (6-8 px di incarnato di fila). Oro sul suo
     * personaggio piu' largo — gramps — mette due colonne in piu' per
     * lato (`.#o+o##oo##o+o#.`): qui sono le stesse due. */
    if (W >= 13) {
      for (i = 4; i < 8; i++) {
        set(rows[i], x0 + 4, i & 1 ? TONE.M : TONE.H);
        set(rows[i], x1 - 4, i & 1 ? TONE.M : TONE.H);
      }
    }

    return rows.map(function (r) { return r.join(''); });
  }

  /* Profilo: cranio piu' stretto (8 px contro i 12 del frontale), massa dei
   * capelli dietro, viso e occhio davanti. Non e' il frontale con una
   * diagonale sopra: e' una seconda matrice, ed e' per questo che l'IoU
   * scende da 1,000.
   *
   * R63 — il contorno gradina. Prima erano 8 gradini (cambi di colonna del
   * bordo, sinistro + destro) contro i 13-21 di Oro: niente naso, niente
   * mascella, niente nuca. Qui ogni riga sposta un bordo di 1 px secondo
   * SIDE_HEAD_EDGE, e la sagoma resta dentro i 10 px del gate R62. */
  var SIDE_HEAD_EDGE = [
    [1, -1], [1, 0], [0, 0], [0, 1], [1, 1], [0, 1], [0, 0], [1, 0]
  ];
  /* Di profilo le fasce non sono simmetriche: corrono da dietro in avanti. */
  function runRow(lo, hi, spec, tone) {
    var s = [], x, i, si = 0, a = lo, k, n;
    for (x = 0; x < 16; x++) s.push('.');
    while (a <= hi && si < spec.length) {
      k = tone(spec[si][0]); n = spec[si][1]; si++;
      if (n < 0) break;
      for (i = 0; i < n && a <= hi; i++) s[a++] = k;
    }
    k = tone(spec[spec.length - 1][0]);
    while (a <= hi) s[a++] = k;
    if (lo >= 0 && lo < 16) s[lo] = 'o';
    if (hi >= 0 && hi < 16) s[hi] = 'o';
    return s;
  }
  var SIDE_HAIR = [
    [['O', 1], ['H', 1], ['G', 2], ['H', -1]],
    [['O', 1], ['G', 1], ['H', 2], ['G', -1]],
    [['O', 1], ['H', 2], ['G', 1], ['H', -1]],
    [['O', 1], ['G', 2], ['H', -1]],
    [['O', 1], ['H', 1], ['G', -1]]
  ];
  var SIDE_FRINGE = [
    [['O', 1], ['H', 2], ['S', -1]],
    [['O', 1], ['H', 3], ['S', -1]],
    [['O', 1], ['H', 4], ['S', -1]],
    [['O', 1], ['G', 1], ['H', 2], ['S', -1]],
    [['O', 1], ['H', 2], ['G', 1], ['S', -1]],
    [['O', 1], ['H', 3], ['G', 1], ['S', -1]],
    [['O', 1], ['H', 2], ['S', 1], ['H', 1], ['S', -1]]
  ];
  function sideHeadRows(W, d) {
    var x0 = 8 - (W >> 1), x1 = x0 + W - 1;
    var rows = [], a, e;
    var TONE = { O: 'o', H: 'h', G: 'g', S: 's', F: 's', M: 'o' };
    function tone(k) { return TONE[k]; }
    function set(a, x, k) { if (x > 0 && x < 15 && a[x] !== '.') a[x] = k; }
    function edge(r) { var t = SIDE_HEAD_EDGE[r]; return [x0 + t[0], x1 + t[1]]; }

    /* 0-2 nuca e chioma */
    e = edge(0); rows.push(runRow(e[0], e[1], [['O', 1], ['G', -1]], tone));
    /* i due toni della chioma stanno tutti e due nella colonna piu'
     * arretrata: su un cranio di profilo da 6 px la meta' posteriore e'
     * un pettine di tre colonne, e senza questo restava a due toni */
    e = edge(1); a = runRow(e[0], e[1], [['O', 1], ['H', 1], ['G', -1]], tone);
    set(a, e[0] + 1, 'h'); rows.push(a);
    e = edge(2); a = runRow(e[0], e[1], SIDE_HAIR[d[2]], tone);
    set(a, e[0] + 1, 'g'); rows.push(a);
    /* 3 attaccatura: la chioma tiene il dietro, la pelle il davanti, e il
     * sopracciglio porta i due toni della chioma fin sul davanti — senza,
     * la meta' ANTERIORE del profilo restava a due toni (gate 7). */
    e = edge(3); a = runRow(e[0], e[1], SIDE_FRINGE[d[4]], tone);
    set(a, e[1] - 2, 'h'); set(a, e[1] - 3, 'g');
    rows.push(a);
    /* 4 occhio da 1 px davanti, naso sul bordo */
    e = edge(4); a = runRow(e[0], e[1], [['O', 1], ['H', 2], ['S', -1]], tone);
    set(a, e[1] - 2, 'o');
    rows.push(a);
    /* 5 orecchio: contorno, pelle, contorno — sotto il bordo come nel
     * frontale. E' l'incarnato che tiene tre toni nella meta' POSTERIORE
     * del profilo, dove prima ce n'erano due (gate 7). */
    e = edge(5); a = runRow(e[0], e[1], [['O', 1], ['H', 1], ['S', 1], ['M', 1], ['S', -1]], tone);
    rows.push(a);
    /* 6 zigomo e basetta */
    e = edge(6); a = runRow(e[0], e[1], [['O', 1], ['H', 1], ['G', 1], ['S', -1]], tone);
    set(a, e[1] - 1 - (d[6] & 1), 'o');
    rows.push(a);
    /* 7 mascella: la bocca di profilo e' un solo pixel sul davanti */
    e = edge(7); a = runRow(e[0], e[1], [['O', 1], ['H', 1], ['S', -1]], tone);
    set(a, e[1] - 1, 'o');
    rows.push(a);

    return rows.map(function (r) { return r.join(''); });
  }

  /* --- corpo -------------------------------------------------------- */

  var ARM_REACH = {
    tailored: 0.74, lawman: 0.66, poised: 0.58, rangy: 1.15, weary: 0.55,
    diner: 0.78, mystic: 0.44, rebel: 1.12, uncanny: 0.38, drifter: 0.52,
    spectral: 0.30, menace: 1.04, heavy: 0.72
  };
  var STANCE = {
    tailored: 0, lawman: 2, poised: -1, rangy: 1, weary: 0, diner: 0,
    mystic: 2, rebel: 2, uncanny: 1, drifter: 0, spectral: -1, menace: 3, heavy: 3
  };
  var SHOULDER_SPAN = {
    tailored: 1.04, lawman: 1.14, poised: 0.91, rangy: 1.02, weary: 0.94,
    diner: 1.00, mystic: 1.08, rebel: 1.08, uncanny: 0.96, drifter: 0.93,
    spectral: 0.88, menace: 1.18, heavy: 1.20
  };
  ARM_REACH['ingénue'] = 0.82;
  STANCE['ingénue'] = -1;
  SHOULDER_SPAN['ingénue'] = 0.90;

  function widthRow(width, fill) {
    var x0 = 8 - (width >> 1), x1 = x0 + width - 1, s = '', x;
    for (x = 0; x < 16; x++) s += (x < x0 || x > x1) ? '.' : ((x === x0 || x === x1) ? 'o' : fill);
    return s;
  }

  /* R63 — il braccio. Gate 3: staccato dal busto da UN pixel nero verticale
   * in tutte e quattro le direzioni, piu' i pixel di mano. In Oro e' sempre
   * la stessa cucitura: `#` bordo, due pixel di mano, `#` che stacca, poi il
   * busto (chris down 11 `.#oo#oo++oo#oo#.`, officer up 11
   * `.#o#++++++++#o#.`). Prima il nostro torso era un campo pieno largo
   * 14 px senza una linea dentro.
   *
   * hands: 'both' | 'left' | 'right' | 'none'. Il profilo passa 'none': di
   * lato la mano e' una sola e la disegna sideBodyRows davanti al busto. */
  function armRow(width, fill, step, hands, mark) {
    var s = widthRow(width, fill).split(''), x0 = 8 - (width >> 1), x1 = x0 + width - 1, x;
    if (width >= 8 && hands !== 'none') {
      if (hands !== 'right') { s[x0 + 1] = 's'; s[x0 + 2] = 's'; s[x0 + 3] = 'o'; }
      if (hands !== 'left') { s[x1 - 1] = 's'; s[x1 - 2] = 's'; s[x1 - 3] = 'o'; }
      if (hands === 'right') { s[x0 + 1] = mark || 'o'; s[x0 + 3] = 'o'; }
      if (hands === 'left') { s[x1 - 1] = mark || 'o'; s[x1 - 3] = 'o'; }
    } else if (width >= 6 && hands !== 'none') {
      if (hands !== 'right') { s[x0 + 1] = 's'; s[x0 + 2] = 'o'; }
      if (hands !== 'left') { s[x1 - 1] = 's'; s[x1 - 2] = 'o'; }
    }
    /* il segno centrale (allacciatura) tiene il busto acceso anche quando le
     * braccia occupano i bordi: senza, il centro resta un campo unico. */
    if (mark) for (x = x0 + 4; x <= x1 - 4; x++) if ((x - x0) % 3 === 0) s[x] = mark;
    return s.join('');
  }

  /* Riga di busto: base piena piu' segni interni. In Oro il petto non e'
   * mai una lastra: `#o#+oo+#o#`, `#oo##+oo+##oo#`. */
  function torsoRow(width, fill, mark, marks) {
    var s = widthRow(width, fill).split(''), x0 = 8 - (width >> 1), x1 = x0 + width - 1, i, x;
    for (i = 0; i < marks.length; i++) {
      x = marks[i] < 0 ? x1 + marks[i] : x0 + marks[i];
      if (x > x0 && x < x1) s[x] = mark;
    }
    return s.join('');
  }

  /* Collo di chi e' alto: largo quanto il gate impone (>= 71 % della testa)
   * ma pieno di contorno ai lati, cosi' legge come colletto e non come una
   * fascia di incarnato larga dieci pixel. */
  function neckRow(width) {
    var x0 = 8 - (width >> 1), x1 = x0 + width - 1, s = '', x;
    /* R63 — il colletto stringe di 2 px per lato, non di 3: con 3 su un
     * collo di profilo largo 6 la riga usciva interamente nera, e bastava
     * quella a portare il Gigante a 4 righe nere su 16 (gate 2: max 3). */
    var pad = width >= 10 ? 2 : 1;
    for (x = 0; x < 16; x++) {
      if (x < x0 || x > x1) s += '.';
      else s += (x <= x0 + pad || x >= x1 - pad) ? 'o' : 's';
    }
    return s;
  }

  /* R63 gate 3, seconda meta': i pantaloni erano nero pieno — le righe
   * 12-15 al 100 % nere, zero tono, 7 righe su 16 interamente nere di
   * fronte e 12 su 16 di spalle. Oro mette il mezzotono nella gamba e
   * lascia il nero al solco fra le due (chris down 14 `#++####++#`,
   * gramps down 14 `###++++++###`). Qui e' la stessa costruzione. */
  function legsRow(width, fill, split) {
    var x0 = 8 - (width >> 1), x1 = x0 + width - 1, s = '', x;
    for (x = 0; x < 16; x++) {
      if (x < x0 || x > x1) s += '.';
      else if (x === x0 || x === x1) s += 'o';
      else if (split) s += (x <= x0 + 2 || x >= x1 - 2) ? fill : 'o';
      else s += (x === 7 || x === 8) ? 'o' : fill;
    }
    return s;
  }

  function feetRow(width, block, step) {
    var x0 = 8 - (width >> 1), x1 = x0 + width - 1, s = '', x;
    var lo = Math.max(0, x0 + (step > 0 ? -1 : 0)), hi = Math.min(15, x1 + (step < 0 ? 1 : 0));
    for (x = 0; x < 16; x++) {
      s += ((x >= lo && x < lo + block) || (x <= hi && x > hi - block)) ? 'o' : '.';
    }
    return s;
  }

  /* Piede di profilo: uno avanti e uno dietro, di lunghezza diversa. Gate 6
   * vuole che le righe dei piedi NON siano identiche al frame frontale — lo
   * erano pixel per pixel. */
  function sideFeetRow(lo, hi, step, heel) {
    var s = '', x, toe = hi - (step < 0 ? 0 : 0);
    for (x = 0; x < 16; x++) {
      if (x < lo || x > toe) s += '.';
      else if (heel) s += (x <= lo + 1 || x >= toe - 2) ? 'o' : 'c';
      else s += 'o';
    }
    return s;
  }

  /* Il torso NASCE dalla testa: `shoulder` parte da headW e sale, non e' un
   * numero indipendente. E' il motivo per cui in R59 la testa cresciuta a
   * 12 px restava piu' larga delle spalle ferme a 10. */
  function geometry(p, dir) {
    var arch = (p.motion && p.motion.archetype) || 'tailored';
    var reach = ARM_REACH[arch] == null ? 0.7 : ARM_REACH[arch];
    var stance = STANCE[arch] || 0;
    var b = (p.build || 1) * (SHOULDER_SPAN[arch] || 1);
    var h = p.height || 1;
    var side = dir === 'left' || dir === 'right';
    var gown = !!p.dress;
    var layered = !!(p.apron || p.cardigan || p.shawl || p.waistcoat || p.log || p.jacket);
    var armTier = reach >= 1.0 ? 3 : (reach >= 0.7 ? 2 : (reach >= 0.5 ? 1 : 0));
    var g = {
      side: side, gown: gown, stance: stance, armTier: armTier,
      short: !!p.short,
      darkTorso: lumaHex(p.hair || '#000000') >= 118,
      tall: !p.short && h >= 1.05,
      /* Statura in quattro gradi, non tre: senza il grado intermedio Donna
       * (1,02) e Maddy (1,00) uscivano con la stessa identica maschera
       * frontale — IoU 1,000 fra due personaggi diversi. */
      erect: !p.short && h >= 1.01 && h < 1.05,
      stoop: !p.short && h <= 0.99
    };
    if (side) {
      /* Profilo: uno spessore solo, dentro i 10 px del gate. Il torso resta
       * 1-2 px piu' largo del cranio, cosi' le spalle restano >= testa anche
       * di lato, come nel frontale. */
      /* R63 — il cranio di profilo non scende piu' sotto gli 8 px. Con 6 la
       * meta' posteriore del profilo era un pettine di 3 colonne: non ci
       * stavano tre toni (gate 7) e l'IoU fronte/lato scendeva a 0,55,
       * sotto la banda di Oro. */
      g.headW = b <= 0.90 ? 6 : 8;
      g.shoulder = g.headW + 2;
      g.chest = g.shoulder;
      g.armSpan = g.shoulder;
      g.fore = g.shoulder;
      g.hip = gown || layered ? g.shoulder : g.shoulder - 2;
      g.hem = gown ? g.shoulder : g.shoulder - 2;
      g.legW = g.shoulder - 2;
      /* Di profilo il piede non sporge: feetRow() allunga di 1 px il piede
       * avanti nei fotogrammi di passo, e con footW = legW la sagoma resta
       * dentro i 10 px del gate anche camminando. */
      g.footW = g.legW;
      g.block = Math.max(2, Math.min(4, 2 + stance));
      return g;
    }
    g.headW = b >= 1.12 ? 14 : (b <= 0.90 ? 10 : 12);
    /* Le spalle partono dalla testa e salgono: in Oro non sono mai piu'
     * strette (chris 14 = 14, kris 16 contro 12). */
    /* Torso coerente con la testa. Le braccia non superano questa misura:
     * evita sia il corpo-filamento sia la posa a croce larga 16px. */
    g.shoulder = Math.min(16, g.headW + 2);
    g.chest = g.shoulder;
    /* R63 — solo la falcata piu' lunga allarga le braccia oltre le spalle.
     * Con +2 da armTier 2 in su, le righe delle braccia uscivano a 16 px
     * su una testa da 12: in Oro la riga delle braccia e' larga quanto il
     * punto piu' largo della testa (chris 14 e 14), non di piu'. */
    g.armSpan = Math.min(16, g.chest + (armTier >= 3 ? 2 : 0));
    g.fore = armTier === 3 ? g.armSpan : Math.max(6, g.chest - (armTier === 0 ? 2 : 0));
    /* Il bacino rientra rispetto al petto: in Oro la sagoma e' un trapezio,
     * non un blocco. Solo la gonna si riapre verso l'orlo. */
    g.hip = gown ? g.chest : Math.max(8, g.chest - (layered ? 0 : 2));
    /* Chi sta eretto rientra in vita di due pixel: e' la voce che separa
     * Donna (1,02) da Maddy (1,00), che senza di essa uscivano identiche. */
    g.hem = gown ? Math.min(16, g.chest + 2) :
      Math.max(8, g.chest - 2 - (g.erect ? 2 : 0));
    if (p.apron) g.hem = Math.min(16, g.chest);          /* grembiule svasato */
    if (p.waistcoat) g.hip = Math.max(6, g.chest - 4);    /* panciotto stretto */
    g.legW = gown ? g.hem : Math.max(8, g.hem - 2);
    g.footW = Math.max(4, Math.min(14, g.legW + (stance >= 1 ? 2 : 0) - (stance <= -1 ? 2 : 0)));
    g.block = Math.max(2, Math.min(5, 2 + stance));
    return g;
  }

  /* Otto righe di corpo, ricostruite in R63 sulla sequenza di Oro
   * (chris/officer/gramps, righe 9-15 del frame down):
   *
   *   spalle con il colletto     ..##oo++oo##..
   *   petto con l'allacciatura   ..#o+####+o#..
   *   braccia + mani             .#oo#oo++oo#oo#.
   *   braccia + mani             .#oo#++oo++#oo#.
   *   cintura nera con la fibbia ..############..
   *   bacino                     ..###++++++###..
   *   gambe a mezzotono          ...#++####++#...
   *   scarpe                     ....###..###....
   *
   * Tutte a fasce di 2 px simmetriche: Oro non mette mai un pixel isolato
   * dentro il busto. Il nero resta sopra il 50 % perche' cintura, solco
   * fra le gambe e scarpe restano neri — la riserva non e' piu' "le ultime
   * quattro righe piene", che era quello che rendeva le gambe una lastra. */
  function bodyRows(g, step, oneArm, d) {
    /* Chi ha la chioma chiara le ha dato il terzo colore: il busto va a
     * nero e i segni interni li porta l'accento. Chi ce l'ha scura ha il
     * busto a colore e i segni neri. In tutti e due i casi ogni riga di
     * torso porta due toni: e' la differenza fra 0,17 e 0,36 di stacco. */
    var base = g.darkTorso ? 'p' : 'c';
    var mark = g.darkTorso ? 'c' : 'o';
    var TONE = { O: 'o', S: 's', C: base, M: mark, P: 'p', A: 'c' };
    function tone(k) { return TONE[k]; }
    function band(width, spec) {
      var x0 = 8 - (width >> 1);
      return bandRow(x0, x0 + width - 1, spec, tone).join('');
    }
    var oneL = oneArm === 'left', oneR = oneArm === 'right';
    /* mani: due di fronte e di spalle, una sola per chi tiene un braccio
     * lungo il corpo. Fra la mano e il busto c'e' sempre 1 px nero: e' il
     * gate 3, ed e' la cucitura che Oro non salta mai. */
    function armBand(width, inner) {
      var x0 = 8 - (width >> 1), x1 = x0 + width - 1;
      var a = bandRow(x0, x1, [['O', 1], ['S', 1], ['O', 1]].concat(inner), tone);
      if (oneL) { a[x1 - 1] = TONE.C; a[x1 - 2] = TONE.C; a[x1 - 3] = TONE.C; }
      if (oneR) { a[x0 + 1] = TONE.C; a[x0 + 2] = TONE.C; a[x0 + 3] = TONE.C; }
      return a.join('');
    }
    var rows = [
      /* spalle: il colletto di incarnato fra due fasce di stoffa */
      band(g.shoulder, [['O', 1], ['A', 4], ['O', 1], ['S', -1]]),
      /* petto: allacciatura verticale al centro */
      band(g.chest, [['O', 1], ['S', 1], ['C', 2], ['M', -1]]),
      /* Braccio alto dentro la giacca; mani visibili solo nella riga sotto.
       * Due righe con quattro pixel pelle per lato leggevano come pugni. */
      band(Math.max(6, g.armSpan - 2), [['O', 1], ['C', -1]]),
      armBand(Math.max(8, g.fore - 2), [['C', -1]]),
      /* cintura: nera piena tranne la fibbia — bastava quella a togliere
       * una riga interamente nera dal conto del gate 2 */
      /* Riserva nera in una cintura continua, non dispersa nel petto. */
      band(g.hip, [['O', 3], ['P', 3], ['A', -1]]),
      band(g.hem, [['O', 1], ['A', 2], ['P', -1]]),
      legsRow(g.legW, 'c', !g.gown),
      feetRow(g.footW, g.block, step)
    ];
    if (g.short) rows.splice(3, 2);        /* torso corto: 6 righe */
    else if (g.stoop) rows.splice(3, 1);   /* curvo: 7 righe */
    return rows;
  }

  /* Corpo di profilo: bordi che gradinano riga per riga (spalla indietro,
   * braccio e mano avanti, cintura, gamba davanti, piede). E' la meta'
   * bassa del gate 6 — i 13 gradini di contorno — e insieme la ragione per
   * cui le righe dei piedi non coincidono piu' col frontale.
   *
   * Anche qui fasce, non pixel sparsi: dietro la manica del braccio
   * lontano, davanti la mano del braccio vicino, in mezzo il busto. In Oro
   * la meta' POSTERIORE del profilo porta comunque il tono chiaro (chris
   * side 10 `.#o#o+####+##...`): senza la mano dietro, i due tile bassi
   * restavano a due toni. */
  var SIDE_BODY_EDGE = [
    [-1, 0], [-1, 0], [-1, 1], [0, 0], [-1, 0], [1, -1], [0, 1], [0, 0]
  ];
  function sideBodyRows(g, step, d) {
    var W = g.headW, x0 = 8 - (W >> 1), x1 = x0 + W - 1;
    var base = g.darkTorso ? 'p' : 'c';
    var mark = g.darkTorso ? 'c' : 'o';
    var TONE = { O: 'o', S: 's', C: base, M: mark, P: 'p', A: 'c' };
    function tone(k) { return TONE[k]; }
    var fwd = step >= 0, rows = [], a, e;
    function set(a, x, k) { if (x > 0 && x < 15 && a[x] !== '.') a[x] = k; }
    function edge(i) { var t = SIDE_BODY_EDGE[i]; return [x0 + t[0], x1 + t[1]]; }
    function row(i, spec) { e = edge(i); return runRow(e[0], e[1], spec, tone); }

    /* spalla: colletto di incarnato davanti */
    a = row(0, [['O', 1], ['C', -1]]); set(a, e[1] - 1, 's'); rows.push(a);
    /* petto: la cucitura della manica lontana dietro */
    /* il petto porta sempre un tono non nero: con la giacca scura
     * (accento sui capelli) una fascia di sole C e' nero pieno, e la riga
     * finiva nel conto del gate 2 */
    rows.push(row(1, [['O', 1], ['S', 1], ['O', 1], ['A', 2], ['C', -1]]));
    /* braccia: manica e mano lontana dietro, mano vicina davanti, sempre
     * staccate dal busto da 1 px nero (gate 3, di profilo) */
    a = row(2, [['O', 1], ['S', 1], ['O', 1], ['C', -1]]);
    set(a, e[1] - 1, 's'); set(a, e[1] - 2, 's'); set(a, e[1] - 3, 'o');
    rows.push(a);
    a = row(3, [['O', 1], ['S', 1], ['O', 1], ['M', 2], ['C', -1]]);
    if (fwd) { set(a, e[1] - 1, 's'); set(a, e[1] - 2, 'o'); }
    else { set(a, e[1] - 1, 'o'); }
    rows.push(a);
    /* cintura nera con la fibbia davanti */
    a = row(4, [['O', 1], ['P', -1]]); set(a, e[1] - 2, 'c'); set(a, e[1] - 3, 'c'); rows.push(a);
    /* bacino */
    rows.push(row(5, [['O', 1], ['A', 2], ['P', -1]]));
    /* gambe: quella davanti a mezzotono, quella dietro in ombra */
    rows.push(row(6, [['O', 1], ['P', 2], ['A', -1]]));
    /* piedi: uno avanti e uno dietro, non le due scarpe simmetriche del
     * frontale (gate 6, seconda meta') */
    e = edge(7);
    rows.push(sideFeetRow(e[0], e[1], step, false).split(''));

    if (g.short) rows.splice(3, 2);
    else if (g.stoop) rows.splice(3, 1);
    return rows.map(function (x) { return typeof x === 'string' ? x : x.join(''); });
  }

  /* --- capigliature e accessori, dentro la matrice --------------------
   * In R59 ciuffi, tese e ceppo erano fillRect dopo il paint: uscivano dal
   * contorno e portavano colori in piu'. Qui entrano nella matrice prima di
   * seal(), quindi non possono ne' aprire la sagoma ne' aggiungere un
   * quarto colore. */
  /* La corona si allarga per gradi dall'alto: W-6, W-4, W-2, W. Un ciuffo
   * che sporge PIU' della testa creerebbe un fungo, e la misura del collo
   * (larghezza minima fra testa e spalle) leggerebbe la strozzatura sotto
   * il ciuffo invece del collo vero. */
  function crown(grid, top, x0, x1, tiers) {
    /* R63 — anche i ciuffi portano il riflesso: con i capelli scuri
     * cotonatura e chioma selvaggia erano tre righe nere piene sopra la
     * testa (Bob: 4 righe interamente nere su 16, gate 2 al massimo 3).
     * Il riflesso resta DENTRO il ciuffo: quando sporgeva, seal() lo
     * chiudeva a nero e lasciava sopra la testa una riga piu' larga del
     * ciuffo, che la misura del collo leggeva come strozzatura — Lucy
     * scendeva a 66,7 % contro il 71 % del gate R62. */
    function tier(y, pad) {
      var a = x0 + pad, b = x1 - pad, m;
      if (b <= a) return;
      span(grid, a, b, y, 'h');
      /* un riflesso solo, di 2 px, al centro del ciuffo: a pixel alterni
       * la cotonatura usciva a pettine (Lucy) invece che a ciocca */
      m = (a + b) >> 1;
      put(grid, m, y, 'g'); if (m + 1 < b) put(grid, m + 1, y, 'g');
    }
    /* Il ciuffo sta SOPRA la calotta e resta piu' stretto di lei: con la
     * fascia larga (pad 1) la riga 0 usciva piu' larga della riga 1, e la
     * misura del collo leggeva quella rientranza come collo — James
     * scendeva a 70 % contro il 71 % del gate R62. */
    tier(top, 3);
    tier(top - 1, 4);
    if (tiers > 1) tier(top - 2, 5);
  }

  function applyHair(grid, p, dir, g, top, bodyTop) {
    var style = p.hairStyle, x0 = 8 - (g.headW >> 1), x1 = x0 + g.headW - 1;
    var back = dir === 'up', y;
    if (p.hat) return;
    if (style === 'bouffant' || style === 'wild') crown(grid, top, x0, x1, 2);
    else if (style === 'pompadour') crown(grid, top, x0, x1, 1);
    if (p.bun) crown(grid, top, x0 + 1, x1 - 1, back ? 2 : 1);
    if (style === 'long' && !p.bun) {
      /* Chioma lunga: due colonne dentro il profilo del capo che scendono
       * sulla spalla. Di spalle cade sulla schiena. */
      for (y = 3; y <= (back ? 9 : 7); y++) {
        put(grid, x0 + 1, top + y, 'h');
        put(grid, x1 - 1, top + y, 'h');
      }
    }
    if (style === 'waves' && !back) {
      put(grid, x0 + 1, top + 6, 'h'); put(grid, x1 - 1, top + 6, 'h');
      put(grid, x0 + 1, top + 7, 'h'); put(grid, x1 - 1, top + 7, 'h');
    }
    if (style === 'receding' && !back && !g.side) span(grid, x0 + 3, x1 - 3, top + 2, 's');
    /* La chioma lunga cade SULLA spalla e sporge di un pixel: e' l'unica
     * voce di capigliatura che cambia la sagoma del busto, non solo quella
     * del capo. Separa Hawk da Leland, che hanno tutto il resto uguale. */
    if (p.long) {
      var sx0 = 8 - (g.shoulder >> 1), sx1 = sx0 + g.shoulder - 1;
      if (g.side) { put(grid, sx0, bodyTop, 'h'); put(grid, sx0, bodyTop + 1, 'h'); }
      else { put(grid, sx0 - 1, bodyTop, 'h'); put(grid, sx1 + 1, bodyTop, 'h'); }
    }
  }

  function applyProps(grid, p, dir, g, top, bodyTop, step) {
    var x0 = 8 - (g.headW >> 1), x1 = x0 + g.headW - 1;
    var back = dir === 'up', side = g.side;
    if (p.hat) {
      /* Cupola stretta sopra, tesa piatta larga quanto il capo sulla riga 1:
       * il cappello allunga la sagoma senza superarla in larghezza (una tesa
       * piu' larga della testa spingerebbe il rapporto collo/testa sotto il
       * 71 %, perche' la misura prende la testa al suo massimo). */
      /* R63: la cupola prende il tono di riflesso, non quello della chioma.
       * Con i capelli scuri il cappello era tre righe interamente nere di
       * fila (Truman ne aveva 4 su 16, gate 2 al massimo 3). In Oro la
       * calotta dell'officer e' `#++++++++#`: contorno e mezzotono. */
      span(grid, x0 + 3, x1 - 3, top - 1, 'g');
      span(grid, x0 + 2, x1 - 2, top, 'g');
      span(grid, x0, x1, top + 1, 'o');
      put(grid, x0 + 2, top + 1, 'g'); put(grid, x1 - 2, top + 1, 'g');
      put(grid, x0 + 4, top, 'h'); put(grid, x1 - 4, top, 'h');
    }
    if (p.glasses && !back) {
      /* R63 — le lenti stanno sulla riga degli OCCHI (top+6), non su
       * quella delle orecchie: li' cancellavano l'orecchio, e con esso
       * l'unico pixel di incarnato nella meta' posteriore del profilo
       * (Jacoby e Maddy uscivano a due toni in un tile, gate 7). */
      if (side) { span(grid, x1 - 3, x1 - 1, top + 6, 'o'); }
      else { span(grid, x0 + 2, x0 + 4, top + 6, 'o'); span(grid, x1 - 4, x1 - 2, top + 6, 'o'); }
    }
    if (p.log) {
      /* Il ceppo e' l'unico accessorio che cambia il profilo: due righe
       * piene di contorno attraverso il petto. Di lato resta dentro i 10 px. */
      var lw = side ? 10 : 14, lx0 = 8 - (lw >> 1), lk;
      span(grid, lx0, lx0 + lw - 1, bodyTop + 2, 'o');
      span(grid, lx0 + 1, lx0 + lw - 2, bodyTop + 3, 'c');
      /* corteccia: senza questi segni la riga del ceppo era 14 px neri di
       * fila, ed era il punto piu' piatto di tutto il cast (Log Lady). */
      for (lk = lx0 + 2; lk < lx0 + lw - 2; lk += 3) {
        put(grid, lk, bodyTop + 2, 'c'); put(grid, lk + 1, bodyTop + 3, 'o');
      }
      /* le mani stringono il ceppo: senza, il ceppo copriva le braccia e
       * la meta' dietro del profilo restava senza incarnato */
      put(grid, lx0 + 1, bodyTop + 2, 's'); put(grid, lx0 + 1, bodyTop + 3, 's');
      put(grid, lx0 + lw - 2, bodyTop + 2, 's'); put(grid, lx0 + lw - 2, bodyTop + 3, 's');
    }
    if (p.badge && !back) {
      var bx = side ? (g.chest >> 1) + 4 : 8 - (g.chest >> 1) + 2;
      put(grid, bx, bodyTop + 1, 's'); put(grid, bx + 1, bodyTop + 1, 's');
    }
    if ((p.tie || p.bowtie) && !back && !side) {
      put(grid, 7, bodyTop + 1, 'o'); put(grid, 8, bodyTop + 1, 'o');
      put(grid, 7, bodyTop + 2, 'o'); put(grid, 8, bodyTop + 2, 'o');
      put(grid, 7, bodyTop + 3, 'o'); put(grid, 8, bodyTop + 3, 'o');
    }
    if ((p.collar || p.lapel) && !back && !side) {
      put(grid, 8 - (g.shoulder >> 1) + 2, bodyTop, 's');
      put(grid, 8 + (g.shoulder >> 1) - 3, bodyTop, 's');
    }
    /* R63 — la cucitura del braccio di profilo non si applica piu' qui:
     * sideBodyRows() disegna tutte e due le braccia dentro la matrice
     * (quello vicino avanti, quello lontano dietro). Il vecchio blocco
     * scriveva sopra la mano posteriore e la faceva sparire, lasciando la
     * meta' dietro del profilo a due soli toni. */
  }

  /* Nessuna riga sopra le scarpe puo' essere una barra nera piena. E' il
   * gate 2 (in Oro al massimo 3 righe interamente nere su 16: chris 3,
   * kris 2, gramps 2). La matrice per costruzione non ne produce, ma un
   * accessorio che attraversa la riga — tesa del cappello, lenti, ciuffo,
   * ceppo — puo' coprirla tutta: Truman ne aveva 4, Maddy 4. La riga
   * riceve due pixel di accento al centro, che e' quello che fa Oro con
   * la fascia del cappello (officer down 1 `#++++++++#`). */
  function unbar(rows, g) {
    var ink = g.darkTorso ? { o: 1, g: 1, p: 1 } : { o: 1, h: 1, p: 1 };
    var y, x, lo, hi, solid, mid, r;
    for (y = 0; y < rows.length - 2; y++) {
      r = rows[y].split(''); lo = -1; hi = -1; solid = true;
      for (x = 0; x < 16; x++) {
        if (r[x] === '.') continue;
        if (lo < 0) lo = x;
        hi = x;
        if (!ink[r[x]]) { solid = false; break; }
      }
      if (!solid || lo < 0 || hi - lo < 5) continue;
      mid = (lo + hi) >> 1;
      r[mid] = 'c'; r[mid + 1] = 'c';
      rows[y] = r.join('');
    }
    return rows;
  }

  function charPattern(p, dir, step) {
    var g = geometry(p, dir);
    var d = headDigits(p);
    var head = g.side ? sideHeadRows(g.headW, d) : frontHeadRows(g.headW, dir === 'up', d);
    var rows = blankRows(HEAD_PAD).concat(head);
    if (g.tall) rows = rows.concat([neckRow(g.side ? g.headW : g.headW - 1)]);
    rows = rows.concat(g.side ? sideBodyRows(g, step, d) : bodyRows(g, step, p.onearm, d));
    var grid = toGrid(rows);
    var bodyTop = HEAD_PAD + 8 + (g.tall ? 1 : 0);
    applyHair(grid, p, dir, g, HEAD_PAD, bodyTop);
    applyProps(grid, p, dir, g, HEAD_PAD, bodyTop, step);
    return { rows: seal(unbar(fromGrid(grid), g)), geo: g };
  }

  /* I piedi restano sulla stessa riga per tutti: cambia dove FINISCE la
   * testa, non dove poggia lo sprite. */
  function verticalShift(g) {
    if (g.short) return 2;
    if (g.tall) return -1;
    if (g.stoop) return 1;
    return 0;
  }

  Spr.drawChar = function (ctx, x, y, pal, dir, frame, alpha, moving, night) {
    var p = pal || CHARS.cooper;
    var flip = dir === 'left';
    var step = moving ? ((frame & 1) ? -1 : 1) : 0;
    var built = charPattern(p, dir === 'left' ? 'right' : dir, step);
    var pat = built.rows;
    var col = paletteOf(p);
    var ox = Math.round(x);
    var oy = Math.round(y) + verticalShift(built.geo) - HEAD_PAD;
    var oldAlpha = ctx.globalAlpha;
    if (alpha != null) ctx.globalAlpha = oldAlpha * alpha;
    /* night e' ignorato di proposito: in gfx/overworld/npc_sprites.pal i
     * colori 1 e 2 sono identici in morn/day/nite. Di notte scende lo
     * sfondo (#7770a8, conservato), il personaggio resta a piena luce. */
    paint(ctx, pat, col, ox, oy, flip);
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
