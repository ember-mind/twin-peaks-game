/* tiles.js — pixel-art procedurale: tile 16x16 del mondo.
   Stile Pokémon Black/White (DS): palette calda, sabbiosa, sole basso.
   Nessuna risorsa esterna: tutto disegnato con fillRect su canvas.
   (split da sprites.js; i personaggi sono in chars.js) */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var GAME = G.GAME;
  var S = GAME.sprites = GAME.sprites || {};

  function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  S.R = R;

  /* --------------------------------------------------------------------
   * Direzione artistica del terreno
   *
   * Il renderer 3D usa questo canvas come albedo del piano. La variazione
   * deve quindi funzionare a due scale: segni piccoli leggibili vicino alla
   * camera e chiazze larghe, continue oltre i confini 16x16, che impediscono
   * il classico effetto "tappeto di tile". Tutto resta deterministico.
   *
   * Varianti additive (nessuna mappa va modificata):
   *   flags.season / flags.terrainSeason: spring | summer | autumn | winter
   *   flags.wet / flags.weather === 'rain'
   * In assenza di override, town e woods riflettono la pioggia già presente
   * nel renderer 3D; gli altri scenari mantengono il profilo asciutto.
   * ------------------------------------------------------------------ */
  var TERRAIN = {
    grass: {
      spring: ['#68875b', '#7f9b6c', '#526f49', '#789468'],
      summer: ['#637f55', '#799365', '#4d6745', '#708a60'],
      autumn: ['#6e7850', '#88835a', '#535f40', '#7b8054'],
      winter: ['#5e7261', '#748579', '#495b50', '#6a7c6b']
    },
    forest: {
      spring: ['#305342', '#466b54', '#223f32', '#55765d'],
      summer: ['#2e4b3c', '#42634e', '#21372d', '#4f6d56'],
      autumn: ['#384c3a', '#57634a', '#29382c', '#62684d'],
      winter: ['#304743', '#465b55', '#223632', '#526660']
    },
    road: {
      dry: ['#858983', '#737771', '#9b9e96', '#666b67'],
      wet: ['#656e6b', '#545d5b', '#7a8380', '#454d4c']
    },
    path: {
      dry: ['#c9b587', '#ad966b', '#dfcca1', '#927b56'],
      wet: ['#a89772', '#8e7c5d', '#c0ae88', '#77654b']
    },
    sidewalk: {
      dry: ['#bbbdb7', '#a2a59f', '#d0d2cc', '#888d89'],
      wet: ['#9da5a2', '#858e8b', '#b7bfbc', '#737b79']
    }
  };

  function terrainStyle(flags) {
    flags = flags || {};
    var map = flags.map || {};
    var season = flags.terrainSeason || flags.season || map.terrainSeason || map.season || 'summer';
    if (!TERRAIN.grass[season]) season = 'summer';
    var weather = flags.weather || map.weather || '';
    var wet = flags.wet === true || map.wet === true || weather === 'rain' ||
      (flags.wet !== false && (map.id === 'town' || map.id === 'woods'));
    return { season: season, wet: wet, mapId: map.id || '' };
  }
  S.terrainStyle = terrainStyle;

  function hash2(a, b, salt) {
    var n = Math.imul((a | 0) + 101, 374761393) ^
      Math.imul((b | 0) + 307, 668265263) ^ Math.imul((salt | 0) + 17, 2246822519);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return (n ^ (n >>> 16)) >>> 0;
  }

  /* Variazione locale a costo costante. La vera scala macro viene dipinta dal
   * bake 3D sull'intera mappa. Anche un piccolo fillRect, però, sopravviveva al
   * mip come timbro quadrato: il lobo ora è ellittico, raro e a bordo morbido. */
  function macroWash(ctx, x, y, tx, ty, colorA, colorB, alpha) {
    var gy = Math.floor(ty / 3);
    var gx = Math.floor((tx + ((gy & 1) ? 2 : 0)) / 4);
    var h = hash2(gx, gy, 11);
    ctx.save();
    var lobe = hash2(tx >> 1, ty >> 1, 41);
    if ((lobe % 5) === 0) {
      ctx.globalAlpha = alpha * (0.18 + ((h >>> 23) % 9) / 100);
      var lx = 5 + (lobe >>> 5) % 6, ly = 5 + (lobe >>> 10) % 6;
      ctx.fillStyle = (h & 1) ? colorB : colorA;
      ctx.beginPath();
      ctx.ellipse(x + lx, y + ly, 4.4, 2.1, ((lobe >>> 14) % 7 - 3) * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Piccoli cluster, non rumore uniforme: ogni materiale ha un gesto preciso.
  function aggregate(ctx, x, y, h, dark, light, density) {
    density = density || 2;
    for (var i = 0; i < density; i++) {
      var px = 2 + ((h + i * 47) % 12);
      var py = 2 + (((h >>> (i + 1)) + i * 29) % 12);
      R(ctx, x + px, y + py, 2, 1, dark);
      if (((h + i) & 1) === 0) R(ctx, x + px, y + py - 1, 1, 1, light);
    }
  }

  // lettura sicura del carattere di una cella vicina; ' ' se fuori mappa o senza mappa
  function cellAt(flags, cx, cy) {
    if (!flags.map || !flags.map.rows) return ' ';
    var rows = flags.map.rows;
    if (cy < 0 || cy >= rows.length) return ' ';
    var row = rows[cy];
    if (cx < 0 || cx >= row.length) return ' ';
    return row.charAt(cx);
  }

  // erba ordinata per famiglie di valore: una base dominante + pochissimi
  // accenti. La vecchia versione metteva 6-9 segni per tile e trasformava il
  // prato in rumore ad alta frequenza, rubando il primo read agli attori.
  // opts.tuft => cluster di ciuffi extra (erba alta); opts.dapple => macchioline chiare rade
  function grass(ctx, x, y, base, light, dark, tuft, h, opts) {
    opts = opts || {};
    R(ctx, x, y, 16, 16, base);
    if (opts.macro) macroWash(ctx, x, y, opts.tx, opts.ty, light, dark, opts.wet ? 0.09 : 0.105);
    if (h % 23 === 0) {
      var lx = x + (h % 12) + 1, ly = y + ((h >> 2) % 12) + 1;
      R(ctx, lx, ly, 3, 1, light);                   // foglie viste dall'alto
      R(ctx, lx + 1, ly - 1, 1, 1, light);
    }
    if (h % 29 === 0) {
      var dx = x + ((h >> 1) % 13) + 1, dy = y + ((h >> 4) % 12) + 2;
      R(ctx, dx, dy, 2, 1, dark);
      R(ctx, dx + 1, dy + 1, 1, 1, dark);
    }
    var bx = x + ((h >> 3) % 13) + 1, by = y + ((h >> 1) % 12) + 2;
    if (h % 31 === 0) {
      R(ctx, bx, by, 1, 2, tuft);
      R(ctx, bx + 1, by + 1, 1, 1, tuft);
    }
    if (opts.tuft && h % 17 === 0) { // erba alta: gruppi, non un segno in ogni cella
      var cx = x + ((h >> 5) % 12) + 1, cy = y + ((h >> 3) % 11) + 3;
      R(ctx, cx, cy, 1, 3, tuft);
      R(ctx, cx + 1, cy + 1, 1, 2, tuft);
      R(ctx, cx - 1, cy + 2, 1, 1, tuft);
    }
    if (opts.dapple) { // macchie di luce fra gli alberi (woods)
      if (h % 19 === 0) R(ctx, x + ((h >> 2) % 13) + 1, y + ((h >> 5) % 13) + 1, 2, 1, opts.dapple);
    }
    if (opts.wet && (h % 23 === 0)) { // riflesso corto, parallelo alla pioggia
      R(ctx, x + 3 + ((h >>> 3) % 8), y + 2 + ((h >>> 5) % 11), 3, 1, 'rgba(205,225,216,0.18)');
    }
    if (opts.ecology) ecologyDetail(ctx, x, y, opts.tx, opts.ty, h, opts.ecology, opts.wet);
  }

  function styledGrass(ctx, x, y, h, tx, ty, style, opts, forest) {
    var p = TERRAIN[forest ? 'forest' : 'grass'][style.season];
    opts = opts || {};
    opts.tx = tx;
    opts.ty = ty;
    opts.wet = style.wet;
    opts.macro = 1;
    opts.ecology = forest ? 'forest' : 'grass';
    grass(ctx, x, y, p[0], p[1], p[2], p[3], h, opts);
  }

  /* Motivi ecologici regionali: ogni regione 5x4 tile sceglie un vocabolario
   * (aghi, foglie, felci, trifoglio, terra umida). Non sono fleck uniformi:
   * compaiono in piccoli gruppi coerenti e lasciano vaste zone calme. */
  function ecologyDetail(ctx, x, y, tx, ty, h, kind, wet) {
    var region = hash2(Math.floor(tx / 5), Math.floor(ty / 4), kind === 'forest' ? 71 : 79);
    var motif = region % 4;
    if (((h >>> 3) % 97) !== 0) return;
    var px = 2 + ((h >>> 7) % 8), py = 3 + ((h >>> 12) % 8);
    ctx.save();
    if (kind === 'forest') {
      if (motif === 0) { // aghi e rametti in una tasca asciutta
        ctx.globalAlpha = 0.44;
        R(ctx, x + px, y + py, 5, 1, '#84705a');
        R(ctx, x + px + 2, y + py + 2, 4, 1, '#5f5144');
        R(ctx, x + px + 1, y + py - 2, 1, 3, '#75634f');
      } else if (motif === 1) { // felce: asse e tre foglie alternate
        ctx.globalAlpha = 0.58;
        R(ctx, x + px + 2, y + py - 1, 1, 7, '#60795b');
        R(ctx, x + px, y + py, 3, 1, '#718967');
        R(ctx, x + px + 2, y + py + 2, 4, 1, '#718967');
        R(ctx, x + px, y + py + 4, 3, 1, '#536b50');
      } else if (motif === 2) { // foglie larghe, calde e leggibili
        ctx.globalAlpha = 0.46;
        R(ctx, x + px, y + py, 3, 2, '#7a6749');
        R(ctx, x + px + 4, y + py + 2, 2, 3, '#66543d');
        R(ctx, x + px + 1, y + py + 1, 1, 1, '#a08b61');
      } else if (wet) { // muschio saturo in una depressione
        ctx.globalAlpha = 0.2;
        R(ctx, x + px - 1, y + py, 8, 5, '#152f2b');
        R(ctx, x + px, y + py, 5, 1, '#6f8f73');
        R(ctx, x + px + 2, y + py + 4, 4, 1, '#425f50');
      }
    } else if (motif === 0) { // trifoglio
      ctx.globalAlpha = 0.55;
      R(ctx, x + px, y + py, 2, 2, '#83a274');
      R(ctx, x + px + 2, y + py + 1, 2, 2, '#77976b');
      R(ctx, x + px + 1, y + py + 3, 1, 2, '#496745');
    } else if (motif === 1 && wet) { // terra scura affiorante dopo la pioggia
      ctx.globalAlpha = 0.24;
      R(ctx, x + px - 1, y + py, 8, 4, '#33453b');
      R(ctx, x + px + 1, y + py - 1, 5, 1, '#829786');
      R(ctx, x + px + 2, y + py + 4, 3, 1, '#46594b');
    } else if (motif === 2) { // ciuffo a ventaglio
      ctx.globalAlpha = 0.52;
      R(ctx, x + px + 2, y + py, 1, 6, '#496944');
      R(ctx, x + px, y + py + 2, 2, 1, '#729269');
      R(ctx, x + px + 3, y + py + 1, 3, 1, '#78976e');
      R(ctx, x + px + 3, y + py + 4, 2, 1, '#526f4e');
    }
    ctx.restore();
  }

  // colore erba del vicino, per bordi organici di sentiero/strada; null se non è erba
  function grassColorOf(ch, style) {
    style = style || { season: 'summer' }; // compatibilità con chiamanti/preview legacy
    if (!TERRAIN.grass[style.season]) style.season = 'summer';
    if (ch === 'g') return TERRAIN.forest[style.season][0];
    if (ch === '.' || ch === ',') return TERRAIN.grass[style.season][0];
    return null;
  }

  // Zolle larghe che attraversano davvero il confine: il sentiero conserva
  // i bounds della cella, ma la sua silhouette non sembra più tirata col righello.
  function organicEdge(ctx, flags, tx, ty, x, y, style) {
    var g, gd, start;
    var h = hash2(tx, ty, 29);
    g = grassColorOf(cellAt(flags, tx, ty - 1), style);
    if (g) {
      gd = cellAt(flags, tx, ty - 1) === 'g' ? TERRAIN.forest[style.season][2] : TERRAIN.grass[style.season][2];
      start = 2 + ((h >>> 2) % 6);
      R(ctx, x, y, 16, 1, g);
      R(ctx, x + start, y, 7, 2, g);
      R(ctx, x + start + 2, y + 2, 3, 1, g);
      R(ctx, x + start + 3, y + 2, 1, 1, gd);
    }
    g = grassColorOf(cellAt(flags, tx, ty + 1), style);
    if (g) {
      gd = cellAt(flags, tx, ty + 1) === 'g' ? TERRAIN.forest[style.season][2] : TERRAIN.grass[style.season][2];
      start = 1 + ((h >>> 6) % 7);
      R(ctx, x, y + 15, 16, 1, g);
      R(ctx, x + start, y + 14, 7, 2, g);
      R(ctx, x + start + 3, y + 13, 3, 1, g);
      R(ctx, x + start + 4, y + 13, 1, 1, gd);
    }
    g = grassColorOf(cellAt(flags, tx - 1, ty), style);
    if (g) {
      gd = cellAt(flags, tx - 1, ty) === 'g' ? TERRAIN.forest[style.season][2] : TERRAIN.grass[style.season][2];
      start = 2 + ((h >>> 10) % 6);
      R(ctx, x, y, 1, 16, g);
      R(ctx, x, y + start, 2, 7, g);
      R(ctx, x + 2, y + start + 2, 1, 3, g);
      R(ctx, x + 2, y + start + 3, 1, 1, gd);
    }
    g = grassColorOf(cellAt(flags, tx + 1, ty), style);
    if (g) {
      gd = cellAt(flags, tx + 1, ty) === 'g' ? TERRAIN.forest[style.season][2] : TERRAIN.grass[style.season][2];
      start = 1 + ((h >>> 14) % 7);
      R(ctx, x + 15, y, 1, 16, g);
      R(ctx, x + 14, y + start, 2, 7, g);
      R(ctx, x + 13, y + start + 3, 1, 3, g);
      R(ctx, x + 13, y + start + 4, 1, 1, gd);
    }
  }

  function pathSurfaceDetail(ctx, flags, tx, ty, x, y, h, style, p) {
    var vertical = cellAt(flags, tx, ty - 1) === 'p' || cellAt(flags, tx, ty + 1) === 'p';
    var horizontal = cellAt(flags, tx - 1, ty) === 'p' || cellAt(flags, tx + 1, ty) === 'p';
    ctx.save();
    // Fascia calpestata continua ma tenue, con interruzioni più scure regionali.
    ctx.globalAlpha = style.wet ? 0.14 : 0.105;
    if (vertical && !horizontal) {
      R(ctx, x + 6, y, 4, 16, p[1]);
      ctx.globalAlpha = 0.16;
      R(ctx, x + 5 + ((h >>> 4) & 1), y + 3 + ((h >>> 8) % 7), 6, 4, p[3]);
    } else if (horizontal && !vertical) {
      R(ctx, x, y + 6, 16, 4, p[1]);
      ctx.globalAlpha = 0.16;
      R(ctx, x + 3 + ((h >>> 8) % 7), y + 5 + ((h >>> 4) & 1), 4, 6, p[3]);
    } else {
      R(ctx, x + 4, y + 5, 8, 6, p[1]);
    }
    // Nel bosco radici e lettiera attraversano soltanto alcuni tratti.
    if (style.mapId === 'woods' && (hash2(Math.floor(tx / 3), Math.floor(ty / 3), 97) % 4) === 0) {
      ctx.globalAlpha = 0.55;
      if (vertical) {
        var ry = y + 4 + ((h >>> 14) % 7);
        R(ctx, x + 1, ry, 12, 1, '#715f45');
        R(ctx, x + 9, ry + 1, 5, 1, '#554835');
        R(ctx, x + 3, ry - 1, 4, 1, '#8a7656');
      } else {
        var rx = x + 4 + ((h >>> 14) % 7);
        R(ctx, rx, y + 1, 1, 12, '#715f45');
        R(ctx, rx + 1, y + 9, 1, 5, '#554835');
      }
    }
    if (style.wet && ((h >>> 5) % 3 === 0)) {
      ctx.globalAlpha = 0.24;
      var px = vertical ? x + 6 : x + 3 + ((h >>> 12) % 6);
      var py = vertical ? y + 3 + ((h >>> 12) % 7) : y + 6;
      R(ctx, px, py, vertical ? 5 : 7, vertical ? 6 : 4, '#5f6658');
      ctx.globalAlpha = 0.32;
      R(ctx, px + 1, py + 1, vertical ? 4 : 5, 1, '#d4ceb1');
    }
    ctx.restore();
  }

  function wetSurfaceMarks(ctx, x, y, tx, ty, h, dark, sheen, kind) {
    var region = hash2(Math.floor(tx / 4), Math.floor(ty / 3), kind === 'road' ? 103 : 107);
    if ((region % 3) !== 0 || ((h >>> 3) & 1)) return;
    var px = 2 + ((h >>> 8) % 5), py = 3 + ((h >>> 13) % 7);
    ctx.save();
    ctx.globalAlpha = kind === 'road' ? 0.25 : 0.16;
    R(ctx, x + px, y + py, 9, 4, dark);
    R(ctx, x + px + 2, y + py - 1, 5, 1, dark);
    R(ctx, x + px + 1, y + py + 4, 6, 1, dark);
    ctx.globalAlpha = 0.32;
    R(ctx, x + px + 2, y + py + 1, 5, 1, sheen);
    R(ctx, x + px + 4, y + py + 2, 3, 1, sheen);
    ctx.restore();
  }

  // chioma in pianta (vista dall'alto ~55°): blob arrotondato di file fillRect
  // impilate, luce NW, ombra SE, contorno 1px, ombra a mezzaluna a sud. Sfora in
  // alto (y-6) per sovrapporsi alla fila superiore. Se il vicino L/R/su è lo stesso
  // carattere, salda la chioma a quel bordo (foresta continua) e salta il contorno.
  function canopyTop(ctx, x, y, tx, ty, flags, ch, dk, mid, li, out, sh, ring) {
    var lt = cellAt(flags, tx - 1, ty) === ch;
    var rt = cellAt(flags, tx + 1, ty) === ch;
    var up = cellAt(flags, tx, ty - 1) === ch;
    var rows = [
      [y - 6, x + 5, 7],
      [y - 4, x + 3, 11],
      [y - 2, x + 2, 13],
      [y + 0, x + 1, 15],
      [y + 2, x + 1, 15],
      [y + 4, x + 2, 13],
      [y + 6, x + 3, 11],
      [y + 8, x + 5, 7]
    ];
    R(ctx, x + 3, y + 14, 10, 2, 'rgba(0,0,0,0.16)'); // ombra a terra a mezzaluna (sud)
    var ri, sx, ex, isx, iex;
    for (ri = 0; ri < rows.length; ri++) {
      sx = rows[ri][1]; ex = sx + rows[ri][2];
      if (lt) sx = x;
      if (rt) ex = x + 16;
      R(ctx, sx, rows[ri][0], ex - sx, 2, dk);         // base scura (rim arrotondato)
      isx = sx + (lt ? 0 : 1); iex = ex - (rt ? 0 : 1);
      R(ctx, isx, rows[ri][0], iex - isx, 2, mid);      // corpo mezzatinta
    }
    if (up) R(ctx, x + (lt ? 0 : 1), y - 6, (rt ? 16 : 15) - (lt ? 0 : 1), 6, mid); // salda in alto
    R(ctx, x + 3, y - 3, 4, 3, li);   // grappolo di luce NW
    R(ctx, x + 2, y + 1, 3, 2, li);
    R(ctx, x + 4, y - 5, 2, 2, li);
    R(ctx, x + 9, y + 3, 4, 3, sh);   // arco d'ombra SE
    R(ctx, x + 10, y + 6, 3, 2, sh);
    R(ctx, x + 8, y + 8, 3, 1, sh);
    if (ring) {                       // anello pallido (sicomoro)
      R(ctx, x + 4, y - 3, 8, 1, ring);
      R(ctx, x + 4, y - 3, 1, 4, ring);
      R(ctx, x + 11, y - 3, 1, 4, ring);
      R(ctx, x + 5, y + 1, 6, 1, ring);
    }
    if (!up) { R(ctx, x + 5, y - 6, 7, 1, out); R(ctx, x + 3, y - 4, 2, 1, out); R(ctx, x + 11, y - 4, 2, 1, out); }
    if (!lt) { R(ctx, x + 1, y + 0, 1, 6, out); R(ctx, x + 2, y - 2, 1, 2, out); }
    if (!rt) { R(ctx, x + 15, y + 0, 1, 6, out); R(ctx, x + 14, y - 2, 1, 2, out); }
    R(ctx, x + 5, y + 9, 7, 1, out); R(ctx, x + 3, y + 7, 2, 1, out); R(ctx, x + 11, y + 7, 2, 1, out); // bordo sud
  }

  function floorWood(ctx, x, y, tx, ty, h) {
    // Tavole larghe lungo la profondità della stanza. Qualunque fuga continua
    // sull'asse X diventa un pettine nella camera obliqua: le fughe principali
    // sono quindi verticali, mentre i giunti di testa compaiono sfalsati e
    // soltanto ogni tre tile.
    tx = tx || 0; ty = ty || 0; h = h == null ? hash2(tx, ty, 131) : h;
    var tones = ['#aa8050', '#a67b4c', '#af8656'];
    var tonePick = hash2(tx, 0, 137) % 3;
    R(ctx, x, y, 16, 16, tones[tonePick]);
    // Due pixel tono-su-tono separano assi larghe 16px, lungo la profondità.
    R(ctx, x, y, 1, 16, '#916b44');
    R(ctx, x + 1, y, 1, 16, '#b58c5a');
    // Testa sfalsata ogni tre tile: segmento locale, mai una riga continua.
    if (((ty + ((tx & 1) ? 1 : 0)) % 3) === 0) {
      R(ctx, x + 2, y, 14, 2, '#9a744a');
      R(ctx, x + 2, y + 1, 14, 1, '#b58b59');
    }
    var gx = x + 6 + ((h >>> 5) % 5);
    R(ctx, gx, y + 4, 2, 8, tonePick === 2 ? '#9f764a' : '#b78a57');
    if ((h % 9) === 0) {
      R(ctx, x + 6, y + 6, 4, 4, '#9b7044');
      R(ctx, x + 7, y + 7, 2, 2, '#805c39');
    }
  }

  function chevronFloor(ctx, x, y, tx, ty) {
    var wx0 = tx * 16, wy0 = ty * 16;
    var startY = Math.floor((wy0 - 24) / 12) * 12;
    var startX = Math.floor((wx0 - 36) / 24) * 24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, 16, 16);
    ctx.clip();
    ctx.translate(x - wx0, y - wy0);
    R(ctx, wx0 - 1, wy0 - 1, 18, 18, '#d2cab5');
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    for (var sx = startX; sx <= wx0 + 40; sx += 24) {
      ctx.beginPath();
      for (var sy = startY, n = 0; sy <= wy0 + 40; sy += 12, n++) {
        var vx = sx + ((Math.floor(sy / 12) & 1) ? 12 : 0);
        if (n === 0) ctx.moveTo(vx, sy);
        else ctx.lineTo(vx, sy);
      }
      ctx.strokeStyle = '#857c6e';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.strokeStyle = '#35302c';
      ctx.lineWidth = 7;
      ctx.stroke();
    }
    ctx.restore();
  }

  // finestra da facciata: vetro scuro + tendina/awning azzurra
  function win(ctx, x, y, awn) {
    R(ctx, x, y - 1, 5, 1, awn);
    R(ctx, x, y, 5, 5, '#3a2a20');
    R(ctx, x + 1, y + 1, 3, 3, '#22303e');
    R(ctx, x + 1, y + 1, 3, 1, '#5a7a9a');
  }

  // tetto/muro a due tinte (concetto invariato); WSHADE dà le luci/ombre per casa
  var WALLS = {
    '1': ['#5a7290', '#c8a878'], // distretto: tetto blu-grigio, muro sabbia
    '2': ['#4a78b0', '#b08858'], // Double R: tetto shingle blu, muro tronchi caldi
    '3': ['#8a6248', '#d0b888'], // casa Palmer: tetto marrone caldo, muro beige
    '4': ['#3a5a80', '#9c7a4e'], // Great Northern: tetto blu scuro, tronchi bruni
    '5': ['#8a98a8', '#e8e8e4'], // ospedale: tetto grigio, muro bianco
    '6': ['#3a2e26', '#5a4636']  // roadhouse: legno scuro
  };
  S.WALLS = WALLS;

  var WSHADE = {
    '1': ['#7088a8', '#3e5068', '#a88858'], // roofLight, roofDark, wallDark
    '2': ['#6a98d0', '#2e5688', '#8a6238'],
    '3': ['#a87c5c', '#5e4230', '#a88a58'],
    '4': ['#5a7aa0', '#243c5a', '#6e5230'],
    '5': ['#a5b3c1', '#5a6a78', '#b8b8b0'], // ospedale
    '6': ['#5c4838', '#241a12', '#3a2e26']  // roadhouse
  };

  S.drawTile = function (ctx, ch, x, y, tx, ty, frame, flags) {
    flags = flags || {};
    var style = terrainStyle(flags);
    var mapSalt = 0;
    for (var si = 0; si < style.mapId.length; si++) mapSalt = (mapSalt * 31 + style.mapId.charCodeAt(si)) | 0;
    // 30 bit positivi: i vecchi pattern usano anche >> (signed), quindi
    // manteniamo coordinate locali sempre non-negative.
    var h = hash2(tx, ty, mapSalt) & 0x3fffffff;
    var i, j;
    switch (ch) {
      case '.': {
        var gp = TERRAIN.grass[style.season];
        grass(ctx, x, y, gp[0], gp[1], gp[2], gp[3], h, {
          tuft: 1, macro: 1, tx: tx, ty: ty, wet: style.wet, ecology: 'grass'
        });
        break;
      }
      case 'g': {
        var fp = TERRAIN.forest[style.season];
        grass(ctx, x, y, fp[0], fp[1], fp[2], fp[3], h, {
          macro: 1, tx: tx, ty: ty, wet: style.wet,
          ecology: 'forest',
          dapple: style.wet ? 'rgba(154,180,156,0.34)' : '#71866b'
        });
        break;
      }
      case 'r': {
        var rp = TERRAIN.road[style.wet ? 'wet' : 'dry'];
        R(ctx, x, y, 16, 16, rp[0]);
        macroWash(ctx, x, y, tx, ty, rp[2], rp[1], 0.11);
        aggregate(ctx, x, y, h, rp[1], rp[2], 2);
        // Fessura occasionale: corta e spezzata, niente reticolo per-tile.
        if ((h % 11) === 0) {
          var crackX = 4 + ((h >>> 6) % 7);
          R(ctx, x + crackX, y + 5, 1, 3, rp[3]);
          R(ctx, x + crackX + 1, y + 8, 2, 1, rp[3]);
          R(ctx, x + crackX + 2, y + 9, 1, 2, rp[3]);
        }
        if (style.wet && ((h >>> 5) % 3 === 0)) {
          R(ctx, x + 3 + ((h >>> 9) % 5), y + 2 + ((h >>> 12) % 9), 6, 1, 'rgba(210,227,225,0.16)');
        }
        if (style.wet) wetSurfaceMarks(ctx, x, y, tx, ty, h, rp[3], '#d1dfdc', 'road');
        organicEdge(ctx, flags, tx, ty, x, y, style);
        break;
      }
      case 'p': {
        var pp = TERRAIN.path[style.wet ? 'wet' : 'dry'];
        R(ctx, x, y, 16, 16, pp[0]);
        macroWash(ctx, x, y, tx, ty, pp[2], pp[1], 0.1);
        aggregate(ctx, x, y, h, pp[1], pp[2], 3);
        // Impronte/ghiaia compressa: cluster più scuro, raro e direzionale.
        if ((h % 7) === 0) {
          var wornX = 5 + ((h >>> 7) % 5), wornY = 4 + ((h >>> 11) % 7);
          R(ctx, x + wornX, y + wornY, 3, 2, pp[3]);
          R(ctx, x + wornX + 1, y + wornY - 1, 2, 1, pp[1]);
        }
        if (style.wet && ((h >>> 3) % 4 === 0)) {
          R(ctx, x + 4 + ((h >>> 14) % 4), y + 3 + ((h >>> 18) % 8), 5, 1, 'rgba(226,220,194,0.18)');
        }
        pathSurfaceDetail(ctx, flags, tx, ty, x, y, h, style, pp);
        organicEdge(ctx, flags, tx, ty, x, y, style);
        break;
      }
      case '=': { // marciapiede: lastra di cemento chiaro, giunto centrale, cordolo verso la strada
        var sp = TERRAIN.sidewalk[style.wet ? 'wet' : 'dry'];
        R(ctx, x, y, 16, 16, sp[0]);
        macroWash(ctx, x, y, tx, ty, sp[2], sp[1], 0.07);
        // Lastre 32x16: il giunto appare una volta ogni due tile, non a righe.
        if ((ty & 1) === 0) R(ctx, x, y, 16, 1, sp[2]);
        if ((ty & 1) === 1) R(ctx, x, y + 15, 16, 1, sp[1]);
        if ((tx & 1) === 0) R(ctx, x, y, 1, 16, sp[1]);
        aggregate(ctx, x, y, h, sp[1], sp[2], 1);
        if (style.wet && ((h >>> 5) % 3 === 0)) {
          R(ctx, x + 3, y + 3 + ((h >>> 9) % 9), 8, 1, 'rgba(225,235,232,0.16)');
        }
        if (style.wet) wetSurfaceMarks(ctx, x, y, tx, ty, h, sp[3], '#dbe6e2', 'sidewalk');
        if (cellAt(flags, tx, ty - 1) === 'r') { R(ctx, x, y, 16, 2, sp[3]); R(ctx, x, y + 2, 16, 1, sp[2]); }
        if (cellAt(flags, tx, ty + 1) === 'r') { R(ctx, x, y + 14, 16, 2, sp[3]); R(ctx, x, y + 13, 16, 1, sp[2]); }
        if (cellAt(flags, tx - 1, ty) === 'r') { R(ctx, x, y, 2, 16, sp[3]); R(ctx, x + 2, y, 1, 16, sp[2]); }
        if (cellAt(flags, tx + 1, ty) === 'r') { R(ctx, x + 14, y, 2, 16, sp[3]); R(ctx, x + 13, y, 1, 16, sp[2]); }
        break;
      }
      case '-': { // strisce pedonali: base della strada + 3 barre bianco sporco, orientate secondo la strada
        var crossRoad = TERRAIN.road[style.wet ? 'wet' : 'dry'];
        R(ctx, x, y, 16, 16, crossRoad[0]);
        macroWash(ctx, x, y, tx, ty, crossRoad[2], crossRoad[1], 0.1);
        aggregate(ctx, x, y, h, crossRoad[1], crossRoad[2], 1);
        var stripe = style.wet ? '#d2d7d2' : '#e1e0d7';
        var horiz = cellAt(flags, tx - 1, ty) === 'r' || cellAt(flags, tx + 1, ty) === 'r';
        for (i = 0; i < 3; i++) {
          if (horiz) { // strada orizzontale: barre verticali attraverso la carreggiata
            R(ctx, x + 1 + i * 5, y + 1, 3, 14, stripe);
            if ((h + i) % 4 === 0) R(ctx, x + 1 + i * 5 + (h % 3), y + 3 + ((h >> 2) % 8), 1, 1, crossRoad[0]); // usura
          } else { // strada verticale: barre orizzontali
            R(ctx, x + 1, y + 1 + i * 5, 14, 3, stripe);
            if ((h + i) % 4 === 0) R(ctx, x + 3 + ((h >> 2) % 8), y + 1 + i * 5 + (h % 3), 1, 1, crossRoad[0]);
          }
        }
        break;
      }
      case ',': { // erba fiorita: stessa erba di '.' con 3-5 fiorellini deterministici
        var flowerGrass = TERRAIN.grass[style.season];
        grass(ctx, x, y, flowerGrass[0], flowerGrass[1], flowerGrass[2], flowerGrass[3], h, {
          tuft: 1, macro: 1, tx: tx, ty: ty, wet: style.wet, ecology: 'grass'
        });
        var flowerColors = ['#d8ded4', '#d4bc62', '#c88c9f'];
        var nFlowers = 1 + (h % 2);
        for (i = 0; i < nFlowers; i++) {
          var fx = 1 + ((h + i * 7) % 13), fy = 1 + ((h >> (i + 1)) % 13);
          R(ctx, x + fx, y + fy + 1, 1, 2, '#2f6a30');          // stelo
          R(ctx, x + fx - 1, y + fy, 2, 2, flowerColors[(h + i) % 3]); // bocciolo
        }
        break;
      }
      case 'w': {
        var waterBase = style.wet ? '#356e7b' : '#3f7f91';
        var waterDeep = style.wet ? '#285a68' : '#316979';
        var waterLight = style.wet ? '#6da7aa' : '#76b5bd';
        R(ctx, x, y, 16, 16, waterBase);
        macroWash(ctx, x, y, tx, ty, waterLight, waterDeep, 0.1);
        var waterPhase = (frame >> 4) & 3;
        var off = (waterPhase + tx * 3 + ty) & 3;
        // Tre linee morbide di diversa lunghezza: moto coerente, nessun flash.
        R(ctx, x + 1 + off, y + 4, 6, 1, waterLight);
        R(ctx, x + 8 - (off >> 1), y + 9, 6, 1, '#5f9ba4');
        R(ctx, x + 3 + ((off + 1) & 2), y + 13, 4, 1, waterDeep);
        if ((h % 5) === 0) R(ctx, x + 5 + (h % 5), y + 3 + ((h >> 3) % 8), 2, 1, '#a9d4cf');
        // Acqua bassa e schiuma spezzata solo al contatto con la riva.
        var rimPale = '#b9cbc1', rimMid = '#73978f', foam = '#d6e2d7';
        if (cellAt(flags, tx, ty - 1) !== 'w') {
          R(ctx, x, y, 16, 1, rimPale);
          R(ctx, x, y + 1, 16, 2, rimMid);
          R(ctx, x + 2 + (h % 4), y + 2, 5, 1, foam);
        }
        if (cellAt(flags, tx - 1, ty) !== 'w') {
          R(ctx, x, y, 2, 16, rimMid);
          R(ctx, x + 1, y + 3 + (h % 5), 1, 5, foam);
        }
        if (cellAt(flags, tx + 1, ty) !== 'w') {
          R(ctx, x + 14, y, 2, 16, rimMid);
          R(ctx, x + 14, y + 5 + (h % 4), 1, 5, foam);
        }
        if (cellAt(flags, tx, ty + 1) !== 'w') {
          R(ctx, x, y + 14, 16, 2, rimMid);
          R(ctx, x + 3 + (h % 4), y + 14, 6, 1, foam);
        }
        break;
      }
      case 'T': { // sempreverde in pianta: chioma vista dall'alto, sfora in alto
        styledGrass(ctx, x, y, h, tx, ty, style);
        canopyTop(ctx, x, y, tx, ty, flags, 'T', '#2e5e34', '#3d7a42', '#57a05a', '#1c3a22', '#183018', null);
        break;
      }
      case 'Y': { // sicomoro in pianta: chioma pallida con anello chiaro, vista dall'alto
        styledGrass(ctx, x, y, h, tx, ty, style, { dapple: '#aebd85' }, true);
        canopyTop(ctx, x, y, tx, ty, flags, 'Y', '#3a6a40', '#4e8a52', '#7ab47e', '#264a2c', '#2a5030', '#cdd8a8');
        break;
      }
      case 'S': { // cartello 3D: due pali in prospettiva, asse inclinata, venatura, ombra
        styledGrass(ctx, x, y, h, tx, ty, style);
        R(ctx, x + 3, y + 13, 10, 2, 'rgba(0,0,0,0.28)');  // ombra ellittica a terra (marcata)
        R(ctx, x + 2, y + 14, 12, 1, 'rgba(0,0,0,0.20)');
        R(ctx, x + 4, y + 12, 8, 1, 'rgba(0,0,0,0.16)');
        R(ctx, x + 10, y + 9, 2, 5, '#5a3a1a');            // palo lontano (più alto)
        R(ctx, x + 4, y + 9, 2, 6, '#6a4520');             // palo vicino (1px più in basso)
        R(ctx, x + 4, y + 9, 1, 6, '#7a5028');
        R(ctx, x + 2, y + 1, 12, 1, '#5a3a1a');            // bordo alto più stretto (asse inclinata)
        R(ctx, x + 1, y + 2, 14, 7, '#6a4520');            // telaio
        R(ctx, x + 3, y + 2, 10, 1, '#a8845a');            // faccia: cima più stretta
        R(ctx, x + 2, y + 3, 12, 5, '#b89060');            // faccia asse
        R(ctx, x + 2, y + 3, 12, 1, '#d0aa78');            // luce superiore
        R(ctx, x + 2, y + 7, 12, 1, '#8a6a40');            // ombra inferiore
        R(ctx, x + 3, y + 5, 9, 1, '#a07c50');             // venatura legno
        R(ctx, x + 4, y + 4, 6, 1, '#4a3018');             // scritta
        break;
      }
      case '1': case '2': case '3': case '4': case '5': case '6': {
        var wc = WALLS[ch], ws = WSHADE[ch];
        var above = cellAt(flags, tx, ty - 1);
        R(ctx, x, y, 16, 16, wc[1]);
        if (above !== ch) { // fila del tetto: shingle a due tinte con travi
          R(ctx, x, y, 16, 8, wc[0]);
          R(ctx, x, y, 16, 3, ws[0]);          // banda alta illuminata
          R(ctx, x, y, 16, 1, ws[1]);          // colmo
          R(ctx, x, y + 3, 16, 1, ws[1]);      // corsi di tegole
          R(ctx, x, y + 6, 16, 1, ws[1]);
          for (i = 0; i < 16; i += 4) R(ctx, x + i + (ty % 2) * 2, y + 3, 1, 3, ws[1]);
          R(ctx, x, y, 16, 1, 'rgba(255,255,255,0.18)');
          R(ctx, x, y + 8, 16, 2, 'rgba(0,0,0,0.28)'); // ombra della gronda
        } else { // muro a tronchi/assi orizzontali con finestre
          R(ctx, x, y + 4, 16, 1, ws[2]);
          R(ctx, x, y + 9, 16, 1, ws[2]);
          R(ctx, x, y + 14, 16, 1, ws[2]);
          win(ctx, x + 2, y + 5, wc[0]);
          win(ctx, x + 9, y + 5, wc[0]);
        }
        break;
      }
      case 'i': // muro interno
        R(ctx, x, y, 16, 16, '#4a3838');
        R(ctx, x, y, 16, 4, '#5a4646');
        R(ctx, x, y + 4, 16, 1, '#382828');
        R(ctx, x, y + 14, 16, 2, '#2e2020');
        R(ctx, x + 5, y + 4, 1, 10, '#3e2e2e');
        R(ctx, x + 11, y + 4, 1, 10, '#3e2e2e');
        if (cellAt(flags, tx, ty - 1) !== 'i') { // spessore del muro visto dall'alto
          R(ctx, x, y, 16, 2, '#7a6060');
          R(ctx, x, y, 16, 1, '#8e7474');
        }
        break;
      case 'D': { // porta (calpestabile, transizione): incassata, con architrave e scalino
        var lc = cellAt(flags, tx - 1, ty), rc = cellAt(flags, tx + 1, ty);
        var wc2 = WALLS[lc] || WALLS[rc];
        R(ctx, x, y, 16, 16, wc2 ? wc2[1] : '#8a6a3a');
        if (!wc2) R(ctx, x, y, 16, 4, '#3a2828');
        R(ctx, x + 2, y + 1, 12, 2, 'rgba(0,0,0,0.35)'); // ombra architrave
        R(ctx, x + 2, y + 2, 12, 14, '#5a3c22');         // telaio
        R(ctx, x + 3, y + 3, 10, 12, '#3a2614');         // anta incassata
        R(ctx, x + 3, y + 3, 10, 1, '#241408');
        R(ctx, x + 6, y + 3, 1, 11, '#241408');          // assi
        R(ctx, x + 10, y + 3, 1, 11, '#241408');
        R(ctx, x + 11, y + 9, 1, 2, '#d8b060');          // pomello
        R(ctx, x + 3, y + 15, 10, 1, '#c8b090');         // scalino
        break;
      }
      case 'f':
        floorWood(ctx, x, y, tx, ty, h);
        break;
      case 'c': // tappeto
        R(ctx, x, y, 16, 16, '#8a3a4a');
        R(ctx, x, y, 16, 1, '#6a2c3a');
        R(ctx, x, y + 15, 16, 1, '#5f2632');
        R(ctx, x, y, 1, 16, '#6a2c3a');
        R(ctx, x + 15, y, 1, 16, '#5f2632');
        R(ctx, x + 2, y + 2, 12, 1, '#a85868');
        R(ctx, x + 2, y + 13, 12, 1, '#6a2c3a');
        R(ctx, x + 2, y + 2, 1, 12, '#a85868');
        R(ctx, x + 13, y + 2, 1, 12, '#6a2c3a');
        R(ctx, x + 7, y + 6, 2, 4, '#d0a0a8');
        R(ctx, x + 6, y + 7, 4, 2, '#d0a0a8');
        break;
      case 'C': // bancone / scrivania (box: faccia superiore + faccia frontale a sud)
        floorWood(ctx, x, y, tx, ty, h);
        R(ctx, x + 1, y + 14, 14, 2, 'rgba(0,0,0,0.18)'); // ombra a terra (sud)
        R(ctx, x + 1, y + 1, 14, 13, '#5a3c1e');          // contorno scuro
        R(ctx, x + 2, y + 2, 12, 9, '#c89a5a');           // faccia superiore chiara
        R(ctx, x + 2, y + 2, 12, 1, '#e0c088');           // luce superiore
        R(ctx, x + 2, y + 2, 1, 9, '#d8b070');            // spigolo sinistro illuminato
        R(ctx, x + 2, y + 11, 12, 2, '#8a5f36');          // faccia frontale scura
        R(ctx, x + 2, y + 11, 12, 1, '#6a4526');
        break;
      case 't': // tavolo (box più piccolo: faccia superiore + frontale)
        floorWood(ctx, x, y, tx, ty, h);
        R(ctx, x + 3, y + 13, 10, 2, 'rgba(0,0,0,0.16)'); // ombra a terra
        R(ctx, x + 2, y + 2, 12, 11, '#5a3c1e');          // contorno
        R(ctx, x + 3, y + 3, 10, 8, '#c89a58');           // faccia superiore
        R(ctx, x + 3, y + 3, 10, 1, '#dcb070');           // luce superiore
        R(ctx, x + 3, y + 3, 1, 8, '#d0a860');            // spigolo sinistro
        R(ctx, x + 3, y + 11, 10, 2, '#8a5f36');          // faccia frontale
        break;
      case 'h': // sedia (box piccolo + schienale a nord)
        floorWood(ctx, x, y, tx, ty, h);
        R(ctx, x + 5, y + 13, 6, 1, 'rgba(0,0,0,0.16)');  // ombra a terra
        R(ctx, x + 4, y + 2, 8, 3, '#4a3018');            // schienale a nord (banda scura più alta)
        R(ctx, x + 4, y + 5, 8, 8, '#5a3c1e');            // contorno seduta
        R(ctx, x + 5, y + 6, 6, 5, '#b0823f');            // faccia superiore
        R(ctx, x + 5, y + 6, 6, 1, '#c8985a');            // luce
        R(ctx, x + 5, y + 11, 6, 2, '#8a5f30');           // faccia frontale
        break;
      case 'K': // letto (materasso dall'alto: cuscino a nord, coperta a sud)
        floorWood(ctx, x, y, tx, ty, h);
        R(ctx, x + 1, y + 14, 14, 2, 'rgba(0,0,0,0.16)'); // ombra a terra
        R(ctx, x + 1, y + 1, 14, 13, '#5a3c22');          // telaio / contorno
        R(ctx, x + 2, y + 2, 12, 10, '#e8e0d0');          // materasso
        R(ctx, x + 3, y + 3, 10, 3, '#f8f4e8');           // cuscino a nord
        R(ctx, x + 3, y + 3, 10, 1, '#ffffff');
        R(ctx, x + 2, y + 7, 12, 5, '#b04858');           // coperta a sud (~55%)
        R(ctx, x + 2, y + 7, 12, 1, '#c85868');
        R(ctx, x + 2, y + 10, 12, 1, '#8a3646');
        R(ctx, x + 2, y + 12, 12, 2, '#8a5f3a');          // bordo frontale 2px
        break;
      case 'U': // comò / mobile (box: faccia superiore sottile + frontale con cassetti)
        floorWood(ctx, x, y, tx, ty, h);
        R(ctx, x + 1, y + 14, 14, 2, 'rgba(0,0,0,0.16)'); // ombra a terra
        R(ctx, x + 1, y + 2, 14, 12, '#5a3c1e');          // contorno
        R(ctx, x + 2, y + 3, 12, 3, '#a67440');           // faccia superiore chiara
        R(ctx, x + 2, y + 3, 12, 1, '#c08a50');           // luce superiore
        R(ctx, x + 2, y + 6, 12, 8, '#8a5c30');           // faccia frontale
        R(ctx, x + 2, y + 9, 12, 1, '#5a3c1e');           // linea cassetto
        R(ctx, x + 2, y + 12, 12, 1, '#5a3c1e');          // linea cassetto
        R(ctx, x + 7, y + 7, 2, 1, '#d8b878');            // pomelli sulla faccia frontale
        R(ctx, x + 7, y + 10, 2, 1, '#d8b878');
        R(ctx, x + 7, y + 13, 2, 1, '#d8b878');
        break;
      case 'o': { // olio bruciato
        R(ctx, x, y, 16, 16, '#101018');
        var oo = ((frame >> 4) + tx + ty) % 2;
        R(ctx, x + 3 + oo, y + 4, 5, 1, '#2a2a40');
        R(ctx, x + 8 - oo, y + 10, 4, 1, '#2a2a40');
        R(ctx, x + 5, y + 13, 3, 1, '#1c1c2c');
        R(ctx, x + 6 + oo, y + 6, 2, 1, '#3a3a54');
        break;
      }
      case 'R': // tenda rossa: pieghe ampie, stabili nella proiezione obliqua
        R(ctx, x, y, 16, 16, '#94182a');
        for (i = 0; i < 2; i++) {
          var fx = x + i * 8;
          R(ctx, fx, y, 2, 16, '#71101e');
          R(ctx, fx + 2, y, 4, 16, '#9e1d31');
          R(ctx, fx + 3, y, 2, 16, '#b92c42');
          R(ctx, fx + 6, y, 2, 16, '#821525');
        }
        R(ctx, x, y, 16, 2, '#74111f');
        R(ctx, x, y + 2, 16, 2, '#a92338');
        R(ctx, x, y + 14, 16, 2, '#68101b');
        break;
      case 'Z': // chevron vettoriale largo, senza scalette da un pixel
        chevronFloor(ctx, x, y, tx, ty);
        break;
      case 'M': // statua
        S.drawTile(ctx, 'Z', x, y, tx, ty, frame, flags);
        R(ctx, x + 4, y + 13, 8, 2, 'rgba(0,0,0,0.25)');
        R(ctx, x + 5, y + 10, 6, 4, '#7a7a82');
        R(ctx, x + 5, y + 10, 6, 1, '#9a9aa2');
        R(ctx, x + 6, y + 3, 4, 7, '#b8b8c0');
        R(ctx, x + 6, y + 3, 1, 7, '#d0d0d8');
        R(ctx, x + 9, y + 3, 1, 7, '#8a8a92');
        R(ctx, x + 6, y + 1, 4, 2, '#c0c0c8');
        break;
      case 'X': // nastro della polizia: transennato finché non hai 3 indizi
        if (flags.woodsOpen) {
          S.drawTile(ctx, 'p', x, y, tx, ty, frame, flags);
        } else {
          styledGrass(ctx, x, y, h, tx, ty, style);
          R(ctx, x + 1, y + 14, 3, 1, 'rgba(0,0,0,0.18)'); // ombra pali
          R(ctx, x + 12, y + 14, 3, 1, 'rgba(0,0,0,0.18)');
          R(ctx, x + 1, y + 3, 3, 12, '#4a4a4a');           // palo sx volumetrico
          R(ctx, x + 1, y + 3, 2, 12, '#6a6a6a');
          R(ctx, x + 1, y + 3, 1, 12, '#8a8a8a');
          R(ctx, x + 1, y + 3, 3, 1, '#9a9a9a');
          R(ctx, x + 12, y + 3, 3, 12, '#4a4a4a');          // palo dx volumetrico
          R(ctx, x + 12, y + 3, 2, 12, '#6a6a6a');
          R(ctx, x + 13, y + 3, 1, 12, '#7a7a7a');
          R(ctx, x + 12, y + 3, 3, 1, '#9a9a9a');
          R(ctx, x + 1, y + 2, 3, 1, '#bcbcbc');            // faccia superiore dei pali (cap)
          R(ctx, x + 12, y + 2, 3, 1, '#bcbcbc');
          for (i = 0; i < 10; i++) {
            R(ctx, x + 3 + i, y + 6, 1, 2, i % 2 ? '#e8c820' : '#181818');
            R(ctx, x + 3 + i, y + 10, 1, 2, i % 2 ? '#181818' : '#e8c820');
          }
        }
        break;
      case 'L': { // lampione: base + palo sottile + testa che si accende di caldo
        styledGrass(ctx, x, y, h, tx, ty, style);
        R(ctx, x + 4, y + 14, 8, 2, 'rgba(0,0,0,0.20)'); // ombra a terra
        R(ctx, x + 5, y + 11, 6, 4, '#2e2e2e');          // base
        R(ctx, x + 5, y + 11, 6, 1, '#4a4a4a');
        R(ctx, x + 7, y + 3, 2, 8, '#242424');           // palo sottile
        R(ctx, x + 7, y + 3, 1, 8, '#3e3e3e');
        R(ctx, x + 4, y, 8, 4, '#242424');               // testa lampione (contorno scuro)
        R(ctx, x + 5, y + 1, 6, 2, '#ffe9a8');           // vetro caldo
        R(ctx, x + 6, y + 1, 4, 1, '#fff6d0');           // punto luce più intenso
        break;
      }
      case 'P': { // palo del telefono: palo spesso + crossarm orizzontale + 2 isolatori
        styledGrass(ctx, x, y, h, tx, ty, style);
        R(ctx, x + 5, y + 14, 6, 2, 'rgba(0,0,0,0.20)'); // ombra a terra
        R(ctx, x + 6, y + 1, 3, 14, '#3a2818');          // palo spesso
        R(ctx, x + 6, y + 1, 1, 14, '#523a24');
        R(ctx, x + 3, y + 3, 10, 2, '#2e2014');          // crossarm orizzontale
        R(ctx, x + 3, y + 3, 10, 1, '#463020');
        R(ctx, x + 4, y + 2, 1, 1, '#d8d0c0');           // isolatore sx
        R(ctx, x + 11, y + 2, 1, 1, '#d8d0c0');          // isolatore dx
        break;
      }
      case 'B': { // panchina: schienale a nord + assi del sedile, vista frontale-dall'alto
        styledGrass(ctx, x, y, h, tx, ty, style);
        R(ctx, x + 2, y + 14, 12, 2, 'rgba(0,0,0,0.18)'); // ombra a terra
        R(ctx, x + 3, y + 3, 10, 3, '#4a3018');           // schienale (banda scura a nord)
        R(ctx, x + 3, y + 3, 10, 1, '#6a4526');
        R(ctx, x + 2, y + 6, 12, 6, '#5a3c1e');           // contorno seduta
        R(ctx, x + 3, y + 7, 10, 4, '#8a5f36');           // assi (faccia superiore)
        R(ctx, x + 3, y + 7, 10, 1, '#a67840');           // luce
        R(ctx, x + 3, y + 9, 10, 1, '#6a4526');           // fuga fra le assi
        R(ctx, x + 2, y + 6, 1, 7, '#3a2410');            // gamba sx
        R(ctx, x + 13, y + 6, 1, 7, '#3a2410');           // gamba dx
        break;
      }
      case 'F': { // staccionata bianca: pali + corrimano, saldato ai lati se il vicino è la stessa staccionata
        styledGrass(ctx, x, y, h, tx, ty, style);
        var fl = cellAt(flags, tx - 1, ty) === 'F';
        var fr = cellAt(flags, tx + 1, ty) === 'F';
        R(ctx, x + 2, y + 12, 12, 1, 'rgba(0,0,0,0.16)'); // ombra a terra
        var rx = fl ? x : x + 1, rex = fr ? x + 16 : x + 15;
        R(ctx, rx, y + 6, rex - rx, 2, '#c8c4b8');         // corrimano (esteso se il vicino è recinzione)
        R(ctx, rx, y + 6, rex - rx, 1, '#e8e4d8');
        for (i = 0; i < 4; i++) { // 4 pali verticali
          var px = x + 1 + i * 4;
          R(ctx, px, y + 1, 2, 1, '#d8d4c8');              // cappello del palo
          R(ctx, px, y + 2, 2, 11, '#e8e4d8');
          R(ctx, px, y + 2, 1, 11, '#ffffff');
          R(ctx, px + 1, y + 2, 1, 11, '#b8b4a8');
        }
        break;
      }
      case 'A': { // aiuola: cordolo di pietra chiara + terra scura + fiori vivaci
        styledGrass(ctx, x, y, h, tx, ty, style);
        R(ctx, x + 2, y + 14, 12, 1, 'rgba(0,0,0,0.14)'); // ombra a terra
        R(ctx, x + 2, y + 2, 12, 12, '#d8d0c0');          // cordolo chiaro
        R(ctx, x + 3, y + 3, 10, 10, '#3a2818');          // terra scura
        R(ctx, x + 3, y + 3, 10, 1, '#4e3820');           // leggera luce sulla terra
        var bedColors = ['#d83030', '#f0d048', '#ffffff'];
        for (i = 0; i < 5; i++) {
          var bx = 4 + ((h + i * 5) % 8), by = 4 + ((h >> (i + 1)) % 8);
          R(ctx, x + bx, y + by, 1, 1, bedColors[(h + i) % 3]);
        }
        break;
      }
      case 'H': { // idrante rosso: cofano scuro + due bocchette laterali
        styledGrass(ctx, x, y, h, tx, ty, style);
        R(ctx, x + 5, y + 13, 6, 2, 'rgba(0,0,0,0.18)'); // ombra a terra
        R(ctx, x + 6, y + 4, 4, 9, '#a81c1c');           // corpo
        R(ctx, x + 6, y + 4, 1, 9, '#c83a3a');           // luce laterale
        R(ctx, x + 9, y + 4, 1, 9, '#7a1010');           // ombra laterale
        R(ctx, x + 5, y + 2, 6, 3, '#7a1010');           // cofano scuro
        R(ctx, x + 6, y + 2, 4, 1, '#961818');
        R(ctx, x + 5, y + 8, 1, 2, '#8a1414');           // bocchetta sx
        R(ctx, x + 10, y + 8, 1, 2, '#8a1414');          // bocchetta dx
        R(ctx, x + 7, y + 12, 2, 1, '#5a0e0e');          // base
        break;
      }
      case 'E': { // cassetta postale: scatola blu-grigia su palo + bandierina rossa laterale
        styledGrass(ctx, x, y, h, tx, ty, style);
        R(ctx, x + 5, y + 14, 6, 2, 'rgba(0,0,0,0.18)'); // ombra a terra
        R(ctx, x + 7, y + 9, 2, 6, '#4a4a52');           // palo
        R(ctx, x + 4, y + 3, 8, 6, '#5a6a7a');           // scatola
        R(ctx, x + 4, y + 3, 8, 1, '#7a8a98');           // luce superiore
        R(ctx, x + 4, y + 8, 8, 1, '#3a4650');           // ombra inferiore scatola
        R(ctx, x + 11, y + 4, 2, 2, '#c83030');          // bandierina laterale
        break;
      }
      case 'n': { // cespuglio: chioma piccola e tonda, palette degli alberi senza tronco né sfondamento
        styledGrass(ctx, x, y, h, tx, ty, style);
        R(ctx, x + 3, y + 13, 10, 2, 'rgba(0,0,0,0.16)'); // ombra a terra
        R(ctx, x + 4, y + 4, 8, 8, '#2e5e34');            // rim scuro
        R(ctx, x + 3, y + 6, 1, 4, '#2e5e34');            // arrotondamento bordo sx
        R(ctx, x + 12, y + 6, 1, 4, '#2e5e34');           // arrotondamento bordo dx
        R(ctx, x + 6, y + 3, 4, 1, '#2e5e34');            // arrotondamento cima
        R(ctx, x + 6, y + 11, 4, 1, '#2e5e34');           // arrotondamento base
        R(ctx, x + 5, y + 5, 6, 6, '#3d7a42');            // corpo mezzatinta
        R(ctx, x + 5, y + 5, 3, 2, '#57a05a');            // luce NW
        R(ctx, x + 9, y + 9, 2, 2, '#183018');            // ombra SE
        R(ctx, x + 4, y + 4, 1, 1, '#1c3a22');            // contorno angoli arrotondati
        R(ctx, x + 11, y + 4, 1, 1, '#1c3a22');
        R(ctx, x + 4, y + 11, 1, 1, '#1c3a22');
        R(ctx, x + 11, y + 11, 1, 1, '#1c3a22');
        break;
      }
      case 'G': // lapide del cimitero (top-down: base in pietra + ombra)
        styledGrass(ctx, x, y, h, tx, ty, style);
        R(ctx, x + 3, y + 12, 10, 2, 'rgba(0,0,0,0.22)');
        R(ctx, x + 4, y + 3, 8, 9, '#8a8d88');
        R(ctx, x + 5, y + 2, 6, 1, '#a5a8a0');
        R(ctx, x + 5, y + 4, 6, 6, '#a5a8a0');
        R(ctx, x + 6, y + 6, 4, 1, '#6a6d68');
        break;
      case 'v':
        R(ctx, x, y, 16, 16, '#000000');
        break;
      default:
        R(ctx, x, y, 16, 16, '#f0f');
        break;
    }
  };

  // props d'arredo interni non collidenti (pianta in vaso, appendiabiti, lampada
  // da terra): icone a sfondo trasparente su una griglia logica 16x24 (più alta
  // di un tile, come le insegne), stessa palette a blocchi piatti dei tile sopra.
  S.drawProp = function (ctx, kind, x, y) {
    switch (kind) {
      case 'plant': // vaso in terracotta + fogliame (palette del cespuglio 'n')
        R(ctx, x + 3, y + 18, 10, 5, '#a8683a');
        R(ctx, x + 3, y + 18, 10, 1, '#c8865a');
        R(ctx, x + 3, y + 22, 10, 1, '#7a4a26');
        R(ctx, x + 4, y + 8, 8, 8, '#2e5e34');
        R(ctx, x + 5, y + 9, 6, 6, '#3d7a42');
        R(ctx, x + 5, y + 9, 2, 3, '#57a05a');
        R(ctx, x + 7, y + 2, 2, 7, '#3d7a42');
        R(ctx, x + 7, y + 2, 1, 4, '#57a05a');
        R(ctx, x + 3, y + 4, 2, 6, '#2e5e34');
        R(ctx, x + 11, y + 4, 2, 6, '#2e5e34');
        break;
      case 'coatrack': // palo di legno + 3 ganci + un cappotto appeso
        R(ctx, x + 5, y + 21, 6, 2, '#3a2818');
        R(ctx, x + 6, y + 22, 4, 1, '#241408');
        R(ctx, x + 7, y + 3, 2, 19, '#5a4636');
        R(ctx, x + 7, y + 3, 1, 19, '#7a6248');
        R(ctx, x + 6, y + 1, 4, 2, '#3a2818');
        R(ctx, x + 9, y + 6, 3, 1, '#3a2818');
        R(ctx, x + 4, y + 9, 3, 1, '#3a2818');
        R(ctx, x + 9, y + 12, 3, 1, '#3a2818');
        R(ctx, x + 2, y + 9, 3, 7, '#2a2e3a');
        R(ctx, x + 2, y + 9, 3, 1, '#3a3e4a');
        R(ctx, x + 3, y + 16, 1, 2, '#1e222c');
        break;
      case 'lamp': // lampada da terra: base + palo + paralume acceso dall'interno
        R(ctx, x + 5, y + 21, 6, 2, '#2e2e2e');
        R(ctx, x + 6, y + 22, 4, 1, '#1c1c1c');
        R(ctx, x + 7, y + 9, 2, 12, '#242424');
        R(ctx, x + 7, y + 9, 1, 12, '#3e3e3e');
        R(ctx, x + 6, y + 8, 4, 1, '#3e3e3e');
        R(ctx, x + 3, y + 2, 10, 7, '#e8d8a8');
        R(ctx, x + 3, y + 2, 10, 1, '#f8ecc8');
        R(ctx, x + 4, y + 8, 8, 1, '#c8b078');
        R(ctx, x + 6, y + 4, 4, 3, '#fff6d0');
        break;
    }
  };
})();
