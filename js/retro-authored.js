/* retro-authored.js — tileset/sprite authored per produzione retro 2D.
 * La griglia mondo resta 16x16; forme, materiali e attori possono superare
 * il singolo tile senza cambiare mappe ASCII, collisioni o dati narrativi.
 */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME;
  if (!GAME || !GAME.Sprites) return;
  /* The rectangle and the lettering are the engine's (engine/ember-pixel.js).
   * A page loads it with a script tag before this file; Node loads it here. */
  if (!(G.EMBER && G.EMBER.Pixel) && typeof require === 'function') require('../engine/ember-pixel.js');
  if (!(G.EMBER && G.EMBER.Pixel)) throw new Error('retro-authored.js needs engine/ember-pixel.js loaded first');
  var PX = G.EMBER.Pixel, R = PX.rect;
  var TOWN_FONT_5X7 = PX.font5x7,
      townTinyWord = PX.tinyWord,
      TOWN_FONT_4X5 = PX.font4x5,
      townCompactWord = PX.compactWord,
      TOWN_FONT_3X5 = PX.font3x5,
      TOWN_FONT_5X7_EXT = PX.font5x7Ext,
      TOWN_FONT_3X5_EXT = PX.font3x5Ext,
      ACCENT_FOLD = PX.accentFold,
      UNSUPPORTED_5X7 = PX.missing5x7,
      UNSUPPORTED_3X5 = PX.missing3x5,
      unsupportedGlyphs = PX.unsupportedGlyphs,
      kitGlyph = PX.glyph,
      kitUnsupported = PX.unsupported,
      interiorSignWord = PX.signWord,
      interiorWord = PX.word,
      townMicroWord = PX.microWord;
  /* So is the interior room kit (engine/ember-interior-kit.js); the Double R is
   * composed below out of its pieces, and what is this game's — the seated
   * gestures, what the signs say — is handed to it. */
  if (!G.EMBER.InteriorKit && typeof require === 'function') require('../engine/ember-interior-kit.js');
  if (!G.EMBER.InteriorKit) throw new Error('retro-authored.js needs engine/ember-interior-kit.js loaded first');
  var KIT = G.EMBER.InteriorKit, KP = KIT.parts;
  KIT.activityOf = function () { return GAME.CharacterActivity || null; };
  var INTERIOR_MATERIALS = KIT.materials,
      interiorContact = KP.interiorContact,
      interiorActorLight = KP.interiorActorLight,
      interiorPanel = KP.interiorPanel,
      interiorCup = KP.interiorCup,
      interiorTableProps = KP.interiorTableProps,
      interiorSeatedGuest = KP.interiorSeatedGuest,
      interiorSeatedHands = KP.interiorSeatedHands,
      interiorOccupiedTable = KP.interiorOccupiedTable,
      interiorBooth = KP.interiorBooth,
      interiorStool = KP.interiorStool,
      interiorLamp = KP.interiorLamp,
      interiorPicture = KP.interiorPicture,
      interiorPlant = KP.interiorPlant,
      interiorCoffeeMachine = KP.interiorCoffeeMachine,
      interiorPieCase = KP.interiorPieCase,
      interiorPendant = KP.interiorPendant,
      interiorFloorPlant = KP.interiorFloorPlant,
      interiorNeon = KP.interiorNeon,
      interiorPool = KP.interiorPool,
      interiorWarmLight = KP.interiorWarmLight,
      interiorSpecials = KP.interiorSpecials,
      interiorServiceCluster = KP.interiorServiceCluster,
      interiorCounterSlab = KP.interiorCounterSlab,
      interiorCheckerFloor = KP.interiorCheckerFloor,
      interiorPlankFloor = KP.interiorPlankFloor,
      interiorWindow = KP.interiorWindow,
      interiorDaylight = KP.interiorDaylight,
      interiorCoatRack = KP.interiorCoatRack,
      interiorFrontWall = KP.interiorFrontWall,
      interiorMenuBoard = KP.interiorMenuBoard,
      INTERIOR_SCENES = KIT.scenes,
      drawRegisteredInterior = KIT.drawScene,
      drawRegisteredForeground = KIT.drawSceneForeground;
  var Spr = GAME.Sprites;
  var oldTile = Spr.drawTile;
  var CHARS = Spr.CHARS || {};
  var runtimeActorScale = 1;

  /* Mobile keeps the native 16x20 silhouette. On large desktop stages the
   * same sprite otherwise reads undersized beside the furniture. Scale around
   * the feet so actors grow upward without losing their ground contact. */
  Spr.setRuntimeActorScale = function (scale) {
    scale = Number(scale);
    runtimeActorScale = isFinite(scale) ? Math.max(1, Math.min(1.32, scale)) : 1;
  };
  /* R103 — atlas 24px derivato dai master individuali. Stessa baseline del
   * tile 16px; proporzioni, rampe e silhouette seguono bar HGSS misurato. */
  var CAST_RENDERER = 'heartgold-atlas-r116';
  var CAST_SHEET_FILE = 'assets/sprites/cast-walkcycles-hg-24.png?v=r129-cast';
  /* The atlas renderer is mechanism; which people are on the sheet is content.
   * A host that sets GAME.RetroCastAtlas = { src, order } before this file
   * loads gets the same 24px walk-cycle renderer over its own sheet (same
   * 360x360 layout). Absent, this is the Twin Peaks cast, unchanged. */
  var CAST_ATLAS_CONTENT = GAME.RetroCastAtlas || null;
  var CAST_SHEET_SRC = CAST_ATLAS_CONTENT ? CAST_ATLAS_CONTENT.src : ((typeof document !== 'undefined' && document.currentScript && document.currentScript.src)
    ? new URL('../' + CAST_SHEET_FILE, document.currentScript.src).href
    : CAST_SHEET_FILE);
  var CAST_SHEET_ORDER = [
    'cooper', 'truman', 'lucy', 'andy', 'hawk',
    'sarah', 'leland', 'norma', 'shelly', 'loglady',
    'bobby', 'donna', 'jacoby', 'audrey', 'mfap',
    'laura', 'gerard', 'benhorne', 'giant', 'maddy',
    'bob', 'james', 'jacques', 'ronette', 'infermiera'
  ];
  if (CAST_ATLAS_CONTENT) CAST_SHEET_ORDER = CAST_ATLAS_CONTENT.order.slice();
  var castWalkSheet = null;
  var castReady = null;
  if (typeof Image !== 'undefined') {
    castReady = new Promise(function (resolve, reject) {
      castWalkSheet = new Image();
      castWalkSheet.decoding = 'sync';
      castWalkSheet.onload = function () { resolve(true); };
      castWalkSheet.onerror = function () { reject(new Error('cast atlas failed: ' + CAST_SHEET_SRC)); };
      castWalkSheet.src = CAST_SHEET_SRC;
    });
  }
  Spr.castReady = castReady;

  /* Optional authored idle frames use the same 24px cell, baseline, mirror
   * and painter pass as locomotion. The activity owner chooses a frame;
   * this renderer never advances animation time. */
  var LIFE_SHEET_FILE = 'assets/sprites/station-population-v01.png?v=station-population-v01';
  var LIFE_SHEET_SRC = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src)
    ? new URL('../' + LIFE_SHEET_FILE, document.currentScript.src).href : LIFE_SHEET_FILE;
  var LIFE_FRAMES = {
    'truman.blink.down': {x:0, actor:'truman', direction:'down'},
    'truman.blink.right': {x:24, actor:'truman', direction:'right'},
    'truman.reading.fileRaised': {x:48, actor:'truman', direction:'down'},
    'truman.reading.eyesLowered': {x:72, actor:'truman', direction:'down'},
    'lucy.blink.down': {x:96, actor:'lucy', direction:'down'},
    'lucy.telephone.down': {x:120, actor:'lucy', direction:'down'},
    'andy.blink.down': {x:144, actor:'andy', direction:'down'},
    'andy.note.down': {x:168, actor:'andy', direction:'down'}
  };
  var lifeSheet = null;
  Spr.characterLifeReady = typeof Image === 'undefined' ? null : new Promise(function (resolve) {
    lifeSheet = new Image();
    lifeSheet.decoding = 'sync';
    lifeSheet.onload = function () { resolve(lifeSheet.naturalWidth === 192 && lifeSheet.naturalHeight === 24); };
    lifeSheet.onerror = function () { resolve(false); };
    lifeSheet.src = LIFE_SHEET_SRC;
  });

  var C = {
    ink: '#24382f', dark: '#4e8067', mid: '#6baa91', grass: '#83d3a7', hi: '#a7e2b9',
    earth: '#e8d08f', earth2: '#b69a64', road: '#dfcb91', road2: '#a18c62',
    paper: '#fff8d0', wood: '#a86848', wood2: '#583838', water: '#7890c8',
    water2: '#c0d0e0', red: '#b84858', gold: '#f0d060'
  };

  /* HeartGold-quality material hierarchy. Values are Twin Peaks originals;
   * reference contributes density, value separation and lighting grammar. */
  var HG = {
    grass:'#83d3a7', grassHi:'#a7e2b9', grassMid:'#6baa91', grassDark:'#4e8067',
    grassDeep:'#315a49', path:'#e8d08f', pathHi:'#f3dfa8', pathMid:'#d6bc7d',
    pathDark:'#aa8e5c', road:'#dfcb91', roadHi:'#ecdca9', roadMid:'#c5ac74',
    roadDark:'#917a54', shadow:'#5e987b', shadowDark:'#46745e',
    vergeWarm:'#c5c886', vergeMid:'#8fa474', vergeShadow:'#6f8969', vergeSoil:'#77664a',
    flowerWhite:'#fff5d5', flowerPink:'#e994a0', flowerGold:'#efbd61'
  };
  var HG_GRASS_DETAIL = ['#8bd6aa','#91daad','#7ecba1','#76c39a','#88cea5','#9bdeb4',
    '#72b991','#86d0a2','#95d8ae','#69af89','#8fd4aa','#78c79d'];
  var HG_PATH_DETAIL = ['#ead397','#eed8a0','#e3c988','#d9bd7d','#f0dca5','#cfae70',
    '#e6cc8d','#f5e4b2'];
  var HG_ROAD_DETAIL = ['#e1cc93','#e5d09a','#d8c287','#d1b97f','#ead8a5','#c9ad72',
    '#dcc58b','#eedcab'];

  function softPixelShadow(ctx, x, y, w, h, dark, soft) {
    var rows = Math.max(3, Math.min(7, h || 5));
    for (var row = 0; row < rows; row++) {
      var inset = Math.abs((rows - 1) / 2 - row) * 2;
      var sw = Math.max(4, Math.round(w - inset * 2));
      R(ctx, x + Math.round(inset) + row, y + row, sw, 1,
        row === 0 || row === rows - 1 ? soft : dark);
    }
    /* Bordo morbido staccato di un pixel verso sud-est. */
    R(ctx, x + Math.max(3, Math.round(w * .28)), y + rows + 1,
      Math.max(4, Math.round(w * .44)), 1, soft);
  }

  function grassDriftBlob(ctx, cx, cy, rx, ry, tone, salt) {
    for (var row = -ry; row <= ry; row++) {
      var ratio = Math.max(0, 1 - (row * row) / Math.max(1, ry * ry));
      var half = Math.max(2, Math.floor(rx * Math.sqrt(ratio)));
      var nudge = (((salt + row * 7) & 15) === 0 ? 2 : (((salt + row) & 7) === 1 ? -1 : 0));
      R(ctx, cx - half + nudge, cy + row, Math.max(3, half * 2 - Math.abs(nudge)), 1, tone);
    }
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

  function woodsPath(ctx, x, y, tx, ty, rows) {
    var left = cell(rows, tx - 1, ty) === 'p', right = cell(rows, tx + 1, ty) === 'p';
    var up = cell(rows, tx, ty - 1) === 'p', down = cell(rows, tx, ty + 1) === 'p';
    /* Sentiero viola desaturato: resta nella notte della Lodge ma crea un
     * asse leggibile già dall'ingresso, come i percorsi Gen II. */
    R(ctx, x, y, 16, 16, '#958db8');
    R(ctx, x + 3 + ((tx + ty) & 3), y + 4, 3, 1, '#b5add0');
    R(ctx, x + 10 - ((tx * 3 + ty) & 2), y + 11, 2, 1, '#686898');
    if (!left) { R(ctx, x, y, 2, 16, '#3d5068'); R(ctx, x + 2, y + 2, 1, 12, '#7770a8'); }
    if (!right) { R(ctx, x + 14, y, 2, 16, '#3d5068'); R(ctx, x + 13, y + 2, 1, 12, '#7770a8'); }
    if (!up) { R(ctx, x, y, 16, 2, '#3d5068'); R(ctx, x + 2, y + 2, 12, 1, '#b5add0'); }
    if (!down) { R(ctx, x, y + 14, 16, 2, '#3d5068'); R(ctx, x + 2, y + 13, 12, 1, '#686898'); }
    /* Spalle irregolari: mordono il bordo, mai la corsia centrale. */
    if (!left) {
      var biteL = 2 + (hash(tx, ty, 0x811) & 3);
      R(ctx, x, y + 3, biteL, 4, '#7770a8'); R(ctx, x, y + 11, Math.max(2, 6 - biteL), 3, '#3d5068');
      R(ctx, x + biteL - 1, y + 4, 1, 2, '#686898');
    }
    if (!right) {
      var biteR = 2 + (hash(tx, ty, 0x812) & 3);
      R(ctx, x + 16 - biteR, y + 2, biteR, 3, '#3d5068');
      R(ctx, x + 13, y + 9, 3, 4, '#7770a8');
      R(ctx, x + 15 - biteR, y + 10, 1, 2, '#686898');
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

  /* Terreno hero: campi macro quieti. Il valore cambia ogni 32px, mentre
   * cluster 2–5px rompono la superficie senza produrre pixel isolati. */
  function arrivalGround(ctx, x, y, tx, ty) {
    var field = hash(tx >> 1, ty >> 1, 0x690) & 3;
    var base = [HG.grass, '#86d5aa', '#7fd0a3', '#89d7ad'][field];
    R(ctx, x, y, 16, 16, base);
    var phase = hash(tx, ty, 0x69) & 7;
    if (phase < 3) {
      var ox = 2 + ((phase * 5 + tx) % 9);
      var oy = 3 + ((phase * 3 + ty) % 8);
      var tone = phase & 1 ? HG.grassHi : HG.grassMid;
      R(ctx, x + ox - 1, y + oy, 6 + (phase & 1), 2, tone);
      R(ctx, x + ox + 1, y + oy - 2, 4, 2, phase === 2 ? '#91dab0' : HG.grassHi);
      if (phase === 0) R(ctx, x + ox + 3, y + oy + 2, 3, 1, HG.grassMid);
    }
  }

  /* R69 hero tableau. Coordinate misurate sulla reference normalizzata
   * 160x144: negozio 30,2; chalet 89,0; auto 93,42; radura dentro foresta. */
  /* R108 — vocabolario arboreo organico condiviso da Town e Arrivo.
   * Ogni chioma nasce da lobi stepped larghi 6–16px. Nessuna fascia piena
   * supera 17px; l'overlap 6–10px costruisce alberi da 30–46px senza muri. */
  var ORGANIC_TREE_FAMILIES = [
    { h:33, lobes:[[-13,13,8,7],[-7,6,8,8],[2,5,8,8],[11,12,8,7],[-8,18,8,7],[1,17,8,8],[9,20,7,6]] },
    { h:41, lobes:[[-5,4,6,6],[3,2,6,7],[-10,12,7,7],[0,11,8,8],[9,13,7,7],[-8,22,8,7],[2,21,8,8],[10,25,7,6]] },
    { h:47, lobes:[[0,3,5,6],[-4,10,6,7],[4,11,6,7],[-8,18,7,7],[1,18,7,8],[9,20,6,7],[-10,28,8,7],[0,27,8,8],[10,30,7,6]] },
    { h:36, lobes:[[-14,10,8,8],[-6,5,8,8],[5,5,8,8],[13,11,7,7],[-10,18,8,7],[-1,16,8,8],[8,18,8,7],[0,24,8,7]] },
    { h:43, lobes:[[-12,8,7,7],[-3,3,8,8],[7,7,8,8],[14,14,7,7],[-10,18,8,8],[0,16,8,8],[9,22,8,7],[-1,27,7,6]] },
    { h:50, lobes:[[0,3,4,5],[-5,10,6,5],[4,12,6,6],[-8,19,6,6],[0,20,7,7],[7,24,6,6],[-10,31,7,6],[-1,32,8,7],[9,35,6,5]] }
  ];

  function pixelCrownLobe(ctx, cx, cy, rx, ry, tones, phase) {
    if (GAME.Diorama && GAME.Diorama.crown(ctx, cx, cy, rx, ry, tones, phase)) return;
    var row, dy, ratio, half, left, span;
    for (row = -ry; row <= ry; row++) {
      dy = row / Math.max(1, ry);
      ratio = Math.max(0, 1 - dy * dy);
      half = Math.max(1, Math.floor(rx * Math.sqrt(ratio)));
      /* Spalle spezzate e recessioni asimmetriche: il lobo non e' un cerchio
       * ripetuto. L'inviluppo resta stepped e largo al massimo 17px. */
      if (((phase + row * 3) & 15) === 1 && half > 3) half -= 2;
      var lean = ((phase >>> 2) & 3) - 1;
      var skew = row < 0 ? lean : -Math.sign(lean);
      if (row > Math.floor(ry / 3)) skew += (phase & 1) ? 2 : -1;
      if (((phase + row) & 7) === 0) skew += 1;
      left = cx - half + skew;
      span = Math.min(17, half * 2 + 1);
      if (row >= -1 && row <= 2 && ((phase >>> 1) & 1) && span > 7) {
        span -= 2;
        if (phase & 1) left += 2;
      }
      var edgeTone = ((phase & 3) === 0 || row === -ry || row === ry) ? tones[0] : tones[1];
      R(ctx, left, cy + row, span, 1, edgeTone);
      /* Una sola scheggia interna, non una serie di highlight orizzontali. */
      if (row === -Math.max(1, Math.round(ry * .28)) && span > 7) {
        var glintW = Math.max(3, Math.min(8, span - 6));
        R(ctx, left + 2 + ((phase >>> 5) & 2), cy + row, glintW, 2, tones[2]);
      }
    }
    /* Accento compatto a gomito: volume locale, mai banda ripetuta. */
    var accentX = cx - Math.max(2, rx - 3) + ((phase >>> 3) & 2);
    R(ctx, accentX, cy - 2, Math.max(3, Math.min(6, rx - 1)), 2, tones[3]);
    R(ctx, accentX + 2, cy - 4, 3, 2, tones[(phase & 3) === 0 ? 4 : 3]);
  }

  function pixelCanopyMass(ctx, cx, cy, w, h, tones, phase) {
    /* Massa centrale authored: fonde i piccoli lobi in un volume da
     * 22–28px. Bordi esterni restano stepped, l'interno non diventa una
     * collezione di capesante e highlight puntiformi. */
    var halfH = Math.floor(h / 2);
    for (var row = 0; row < h; row++) {
      var shoulder = Math.abs(row - halfH);
      var inset = Math.floor(shoulder * .75);
      var lean = ((phase >>> (row % 5)) & 1) ? 1 : 0;
      if (row < 2 || row > h - 3) inset += 2;
      var span = Math.max(10, w - inset * 2);
      var left = cx - Math.floor(w / 2) + inset + lean;
      R(ctx, left, cy - halfH + row, span, 1, tones[2]);
    }
    /* Due facce connesse e asimmetriche sostituiscono le tre righe seriali. */
    var massX = cx - 7 + ((phase >>> 2) & 2);
    R(ctx, massX, cy - 3, 9, 3, tones[3]);
    R(ctx, massX + 3, cy - 6, 6, 3, tones[4]);
    R(ctx, cx + 3, cy + 1, 6, 3, tones[1]);
  }

  function organicTreeShadow(ctx, cx, rootY, back, phase) {
    if (back) return;
    /* Tutte le ombre ambientali cadono a sud-est; varia la massa, non il verso. */
    grassDriftBlob(ctx, cx + 3, rootY + 3, 10 + (phase & 2), 3,
      (phase & 4) ? '#78c79d' : HG.shadow, phase ^ 0x45);
    softPixelShadow(ctx, cx - 8, rootY + 1, 25 + (phase & 3), 5, HG.shadowDark, HG.shadow);
    R(ctx, cx - 3, rootY + 2, 7, 1, HG.vergeSoil);
    R(ctx, cx + 5, rootY + 4, 5, 1, HG.grassDark);
  }

  function forestUnderstoryStrip(ctx, x, baseY, w, minH, maxH, salt) {
    /* Fascia continua composta da blocchi sovrapposti di ampiezza irregolare.
     * Le quote alte cambiano, la base resta unita: foresta, non isole. */
    var cursor = 0, ordinal = 0;
    while (cursor < w) {
      /* x/baseY sono coordinate schermo e cambiano a ogni pixel di camera.
       * Usarle come seed rigenerava span, altezza e colore durante il moto.
       * salt identifica gia' la run nel mondo; ordinal identifica il blocco. */
      var v = hash(ordinal, salt, 0x4f35 + ordinal * 29);
      var span = Math.min(w - cursor, 11 + (v % 11));
      if (w - cursor - span > 0 && w - cursor - span < 7) span = w - cursor;
      var h = minH + ((v >>> 5) % Math.max(1, maxH - minH + 1));
      var overlap = ordinal === 0 ? 0 : 2;
      var sx = x + cursor - overlap, sw = span + overlap;
      var dark = (ordinal & 1) ? '#315a49' : '#3e725b';
      R(ctx, sx, baseY - h, sw, h, dark);
      R(ctx, sx + 2, baseY - h + 2, Math.max(3, sw - 4), Math.max(2, h - 5), '#639b72');
      if (((v >>> 11) & 3) === 0 && sw > 10) {
        R(ctx, sx + 4, baseY - h + 3, Math.min(7, sw - 6), 3, '#639b72');
      }
      cursor += span; ordinal++;
    }
  }

  function arrivalBoundedCrown(ctx, cx, cy, rx, ry, boundX, boundW, tones, phase) {
    /* Sagoma scura continua + due volumi interni compatti. La versione a
     * tono-per-riga produceva terrazze orizzontali leggibili a 1x. */
    for (var row = -ry; row <= ry; row++) {
      var ratio = Math.max(0, 1 - (row * row) / Math.max(1, ry * ry));
      var half = Math.max(2, Math.floor(rx * Math.sqrt(ratio)));
      var nudge = row < 0 ? ((phase >>> 3) & 2) : -((phase >>> 5) & 1);
      var left = Math.max(boundX, cx - half + nudge);
      var right = Math.min(boundX + boundW, cx + half + 1 + nudge);
      if (right > left) R(ctx, left, cy + row, right - left, 1, tones[0]);
    }
    var innerRx = Math.max(3, rx - 3), innerRy = Math.max(2, ry - 3);
    var innerCx = cx - 1 + ((phase >>> 9) & 2), innerCy = cy - 2;
    for (row = -innerRy; row <= innerRy; row++) {
      ratio = Math.max(0, 1 - (row * row) / Math.max(1, innerRy * innerRy));
      half = Math.max(1, Math.floor(innerRx * Math.sqrt(ratio)));
      left = Math.max(boundX, innerCx - half);
      right = Math.min(boundX + boundW, innerCx + half + 1);
      if (right > left) R(ctx, left, innerCy + row, right - left, 1, tones[1]);
    }
    var accentX = Math.max(boundX, Math.min(boundX + boundW - 5, cx - 3 + ((phase >>> 7) & 2)));
    R(ctx, accentX, cy - 1, 5, 3, tones[2]);
    R(ctx, accentX + 2, cy - 5, 3, 4, tones[3]);
  }

  function arrivalFusedForestGroup(ctx, x, y, w, h, salt) {
    var groups = [], cursor = 0, ordinal = 0;
    while (cursor < w) {
      var v = hash(Math.round(x + cursor), Math.round(y), salt + ordinal * 43);
      var span = Math.min(w - cursor, 12 + (v % 8));
      if (w - cursor - span > 0 && w - cursor - span < 7) span = w - cursor;
      var cx = x + cursor + Math.round(span * .54) - (ordinal ? 2 : 0);
      groups.push([cx, v, span]);
      cursor += Math.max(8, span - 3); ordinal++;
    }
    /* Contatti e tronchi puntano tutti a sud-est e restano nel gruppo. */
    for (var gi = 0; gi < groups.length; gi++) {
      var g = groups[gi], contactX = Math.max(x, Math.min(x + w - 9, g[0] + 1));
      R(ctx, contactX, y + h - 3, 9, 2, HG.shadowDark);
      R(ctx, contactX + 3, y + h - 1, 6, 1, HG.shadow);
      if (((g[1] >>> 9) & 3) === 0) {
        R(ctx, g[0] - 1, y + h - 8, 3, 7, '#806948');
        R(ctx, g[0], y + h - 7, 1, 6, '#ad8758');
      }
    }
    var back = ['#315a49','#3e725b','#639b72','#80b878'];
    var front = ['#24382f','#315a49','#3e725b','#639b72'];
    for (gi = 0; gi < groups.length; gi++) {
      g = groups[gi];
      var ry = Math.max(5, Math.min(7, h - 5));
      arrivalBoundedCrown(ctx, g[0], y + 6 + ((g[1] >>> 4) & 2),
        8 + (g[1] & 3), ry, x, w, back, g[1]);
    }
    for (gi = 1; gi < groups.length; gi += 2) {
      g = groups[gi];
      arrivalBoundedCrown(ctx, g[0] + 2, y + h - 7,
        7 + ((g[1] >>> 6) & 3), 5, x, w, front, g[1] ^ 0x54d);
    }
    /* Contatti corti sfalsati: nessuna barra continua o terrazza. */
    for (gi = 0; gi < groups.length; gi += 2) {
      g = groups[gi];
      var rootX = Math.max(x, g[0] - 4);
      var rootW = Math.min(7 + ((g[1] >>> 12) & 3), x + w - rootX);
      R(ctx, rootX, y + h - 3 - ((g[1] >>> 15) & 1), rootW, 3, '#315a49');
      if (rootW > 5) R(ctx, rootX + 2, y + h - 4, rootW - 3, 2, '#3e725b');
    }
  }

  function arrivalFusedForestWall(ctx, x, y, w, h, towardRight, salt) {
    /* Parete verticale a gruppi sfalsati. Ogni colonna usa altezze diverse;
     * nessuna riga di corone coincide con la successiva estensione della
     * foresta a imbuto. Le chiome restano entro celle solide in X. */
    var dark = ['#24382f','#315a49','#3e725b','#639b72'];
    var mid = ['#315a49','#3e725b','#639b72','#80b878'];
    var sy = y + 5, ordinal = 0;
    while (sy < y + h + 5) {
      var v = hash(Math.round(x), Math.round(sy), salt + ordinal * 47);
      var edgeCx = towardRight
        ? x + w - 5 - ((v >>> 5) & 3)
        : x + 5 + ((v >>> 5) & 3);
      arrivalBoundedCrown(ctx, edgeCx, sy, 8 + (v & 3), 6 + ((v >>> 3) & 1),
        x, w, (ordinal & 1) ? dark : mid, v);
      if (w >= 24) {
        var innerCx = towardRight ? x + 7 + ((v >>> 9) & 4) : x + w - 8 - ((v >>> 9) & 4);
        arrivalBoundedCrown(ctx, innerCx, sy + 4 + ((v >>> 12) & 3),
          7 + ((v >>> 14) & 2), 6, x, w, dark, v ^ 0x5a7);
      }
      if (((v >>> 17) & 3) === 0) {
        var trunkX = Math.max(x + 1, Math.min(x + w - 4, edgeCx - 1));
        R(ctx, trunkX, sy + 3, 3, 7, '#806948');
        R(ctx, trunkX + 1, sy + 3, 1, 6, '#ad8758');
        R(ctx, trunkX + (towardRight ? 2 : -1), sy + 9, 7, 2, HG.shadowDark);
      }
      sy += 10 + ((v >>> 20) % 7);
      ordinal++;
    }
  }

  function arrivalBoundedRect(ctx, x, y, w, h, boundX, boundW, tone) {
    var left = Math.max(boundX, Math.round(x));
    var right = Math.min(boundX + boundW, Math.round(x + w));
    if (right > left && h > 0) R(ctx, left, y, right - left, h, tone);
  }

  function arrivalBoundedFirShape(ctx, cx, rootY, boundX, boundW, height, phase) {
    var top = rootY - height;
    var lean = (phase & 1) ? 1 : -1;
    var tiers = [
      [cx + lean, top, 3, 4],
      [cx - 4, top + 4, 9, 5],
      [cx - 6 + lean, top + 8, 13, 5],
      [cx - 8, top + 12, 16, Math.max(4, height - 12)]
    ];
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      arrivalBoundedRect(ctx, t[0], t[1], t[2], t[3], boundX, boundW,
        i & 1 ? '#315a49' : '#24382f');
      arrivalBoundedRect(ctx, t[0] + 2 + (i === 2 ? 1 : 0), t[1] + 1,
        Math.max(2, t[2] - 5), Math.max(1, t[3] - 2), boundX, boundW,
        i < 2 ? '#80b878' : '#639b72');
    }
    arrivalBoundedRect(ctx, cx - 1, rootY - 5, 3, 5, boundX, boundW, '#6a8a43');
    arrivalBoundedRect(ctx, cx + 2, rootY - 1, 7, 2, boundX, boundW, HG.shadowDark);
  }

  function arrivalBoundedBroadleafShape(ctx, cx, rootY, boundX, boundW, height, phase) {
    var top = rootY - height;
    var shift = (phase & 2) ? 2 : -1;
    /* Quattro lobi stepped di dimensioni diverse: nessun anello centrale. */
    arrivalBoundedRect(ctx, cx - 8 + shift, top + 6, 9, height - 8,
      boundX, boundW, '#315a49');
    arrivalBoundedRect(ctx, cx - 4, top + 1, 10, height - 4,
      boundX, boundW, '#24382f');
    arrivalBoundedRect(ctx, cx + 3 + shift, top + 5, 7, height - 8,
      boundX, boundW, '#3e725b');
    arrivalBoundedRect(ctx, cx - 7, top + 9, 16, height - 10,
      boundX, boundW, '#315a49');
    arrivalBoundedRect(ctx, cx - 2 + shift, top + 3, 6, 5,
      boundX, boundW, '#639b72');
    arrivalBoundedRect(ctx, cx - 6, top + 8, 5, 4,
      boundX, boundW, '#80b878');
    arrivalBoundedRect(ctx, cx + 3, top + 10, 4, 3,
      boundX, boundW, '#639b72');
    arrivalBoundedRect(ctx, cx - 1, rootY - 5, 3, 5,
      boundX, boundW, '#6a8a43');
    arrivalBoundedRect(ctx, cx + 2, rootY - 1, 8, 2,
      boundX, boundW, HG.shadowDark);
  }

  function arrivalTreeWall(ctx, anchors, boundX, boundW, salt) {
    /* Famiglie alternate e silhouette asimmetriche: nessuna ellisse o
     * highlight concentrico puo' ripetersi fra vicini. */
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var v = hash(a[0], a[1], salt + i * 37);
      var rootX = Math.max(boundX + 2, Math.min(boundX + boundW - 4, a[0]));
      var height = 17 + ((v >>> 4) % 5);
      if ((i + salt) % 3 === 0) {
        arrivalBoundedFirShape(ctx, rootX, a[1], boundX, boundW, height, v);
      } else {
        arrivalBoundedBroadleafShape(ctx, rootX, a[1], boundX, boundW, height, v);
      }
    }
  }

  function arrivalStepForest(ctx, x, y, h, salt) {
    /* Estensioni dell'imbuto: chiome basse dentro il proprio rettangolo
     * solido. Nessuna corona sale nella cella calpestabile soprastante. */
    for (var cellY = y; cellY < y + h; cellY += 16) {
      var cv = hash(x, cellY, salt ^ 0x63d);
      if (((cv >>> 8) & 1) === 0) {
        arrivalBoundedFirShape(ctx, x + 8, cellY + 15, x, 16, 14 + (cv & 1), cv);
      } else {
        arrivalBoundedBroadleafShape(ctx, x + 8, cellY + 15, x, 16, 14 + (cv & 1), cv);
      }
    }
  }

  function arrivalSharedGround(ctx, x, y, w, salt) {
    var lobeW = Math.max(14, Math.round(w * .46));
    grassDriftBlob(ctx, x + Math.round(w * .44), y + 4,
      Math.max(9, Math.round(w * .28)), 3, '#78c79d', salt);
    softPixelShadow(ctx, x + 3, y + 1, lobeW, 5, HG.shadowDark, HG.shadow);
    softPixelShadow(ctx, x + Math.round(w * .48), y + 2,
      Math.max(11, Math.round(w * .34)), 4, HG.shadowDark, HG.shadow);
    R(ctx, x + 6, y, Math.max(8, Math.round(w * .28)), 1, HG.vergeSoil);
    R(ctx, x + Math.round(w * .61), y + 1, Math.max(6, Math.round(w * .20)), 1, HG.grassDark);
  }

  function arrivalGroundOcclusion(ctx, x, y, w, salt) {
    var leftW = 5 + (salt & 2), rightW = 5 + ((salt >>> 2) & 2);
    R(ctx, x, y - 2, leftW, 4, HG.grassDark);
    R(ctx, x + 2, y - 4, Math.max(3, leftW - 2), 3, '#639b72');
    R(ctx, x + w - rightW, y - 1, rightW, 4, '#315a49');
    R(ctx, x + w - rightW + 1, y - 3, Math.max(3, rightW - 2), 3, '#639b72');
  }

  function drawOrganicTree(ctx, cx, rootY, family, back, salt, skipShadow) {
    var spec = ORGANIC_TREE_FAMILIES[Math.abs(family) % ORGANIC_TREE_FAMILIES.length];
    var phase = Math.abs(salt || 0) & 15;
    var heightLift = ((phase >>> 1) % 7) - 3;
    var top = rootY - spec.h - heightLift;
    var tones = back
      ? ['#294c40','#406e49','#6b9254','#a1b66b','#c6ce89']
      : ['#192f2c','#2e5138','#507744','#83a454','#b4c773'];
    /* Nel passaggio depth, chioma/tronco vengono ridisegnati sopra attori
     * arretrati. Ombra di contatto resta nel passaggio terreno: ridisegnarla
     * sopra piedi/personaggi produrrebbe una macchia semitrasparente falsa. */
    if (!skipShadow) organicTreeShadow(ctx, cx, rootY, back, phase);
    /* Tronchi variati e spesso nascosti: bordo forestale, non lollipop row. */
    var trunkMode = (phase + family * 3) % 5;
    if (!back && (trunkMode === 1 || trunkMode === 3)) {
      var trunkDx = trunkMode === 1 ? -3 : 0;
      var trunkW = trunkMode === 1 ? 5 : 4;
      R(ctx, cx + trunkDx, rootY - 13, trunkW, 14, tones[0]);
      R(ctx, cx + trunkDx + 1, rootY - 12, Math.max(2, trunkW - 2), 12, '#9b7449');
      R(ctx, cx + trunkDx + 2, rootY - 11, 1, 10, '#c09761');
    }
    for (var i = 0; i < spec.lobes.length; i++) {
      var l = spec.lobes[i];
      pixelCrownLobe(ctx, cx + l[0], top + l[1], l[2], l[3], tones, phase + i * 3);
    }
    pixelCanopyMass(ctx, cx + ((phase & 3) - 1), rootY - Math.round(spec.h * .46),
      23 + ((phase >>> 2) % 5), 12 + (phase & 1), tones, phase);
    /* Nucleo interno fonde giunti fra lobi: corona unica, non grappolo. */
    var blend = [tones[1], tones[2], tones[3], tones[3], tones[4]];
    pixelCrownLobe(ctx, cx, rootY - Math.round(spec.h * .52), 8, 8, blend, phase + 23);
    // Needle clusters follow each lobe's volume, with a warm upper-left rim.
    // Stable world seeds avoid sparkling texture when the camera moves.
    for (var li = 0; li < spec.lobes.length; li++) {
      var leaf = spec.lobes[li];
      for (var ni = 0; ni < 12; ni++) {
        var seed = hash(salt + li * 19, ni, 907);
        var nx = (seed & 255) / 255 * 1.6 - .8;
        var ny = ((seed >>> 8) & 255) / 255 * 1.4 - .7;
        if (nx * nx + ny * ny > .75) continue;
        var lx = cx + leaf[0] + nx * leaf[2];
        var ly = top + leaf[1] + ny * leaf[3];
        R(ctx, lx, ly, 2, 1, nx + ny < -.15 ? tones[4] : tones[2]);
        if (ni % 3 === 0) R(ctx, lx + 1, ly + 1, 1, 2, tones[1]);
      }
    }
    /* Base intenzionalmente asimmetrica: due masse di diversa taglia e quota
     * spezzano la cadenza di cerchi gemelli. */
    pixelCrownLobe(ctx, cx - 6, rootY - 14, 5 + (phase & 1), 5, tones, phase + 29);
    pixelCrownLobe(ctx, cx + 5, rootY - 11 - ((phase >>> 2) & 2), 8, 5, tones, phase + 37);
    if (trunkMode !== 1) {
      var under = [tones[1], tones[2], tones[3], tones[3], tones[4]];
      pixelCrownLobe(ctx, cx + ((phase & 3) - 1), rootY - 5, 8, 5, under, phase + 43);
    }
    if (!back && (trunkMode === 1 || trunkMode === 3)) {
      /* Radici brevi sopra l'ellisse di contatto: tronco ancorato, mai palo. */
      R(ctx, cx + trunkDx - 3, rootY - 2, 5, 2, tones[0]);
      R(ctx, cx + trunkDx + trunkW - 1, rootY - 2, 5, 2, tones[0]);
      R(ctx, cx + trunkDx, rootY - 2, trunkW + 1, 1, '#c09761');
    }
  }

  function arrivalFir(ctx, x, y, h, back) {
    var family = 1 + (Math.abs((x * 7 + y * 3) | 0) % 2);
    drawOrganicTree(ctx, x + 9, y + h, family, back, x * 3 + y * 5);
  }

  function arrivalBroadleaf(ctx, x, y, h, back, split) {
    drawOrganicTree(ctx, x + (split ? 23 : 20), y + h, split ? 3 : 0, back, x * 5 + y * 7);
  }

  function arrivalMixedTree(ctx, x, y, h, back, salt) {
    var family = Math.abs(((x * 5 + y * 11 + (salt || 0)) | 0)) % ORGANIC_TREE_FAMILIES.length;
    drawOrganicTree(ctx, x + 10, y + h, family, back, salt || 0);
  }

  var ARRIVAL_CONTACT_BOUNDS = {
    shop: [32, 0, 32, 48], cabin: [96, 0, 48, 48],
    mailbox: [64, 16, 16, 16], car: [96, 48, 32, 16]
  };

  function arrivalShop(ctx) {
    var b = ARRIVAL_CONTACT_BOUNDS.shop, x = b[0], y = b[1], i;
    var roofEdge = '#294451', roof = '#4f8f88', roofHi = '#83c6ad';
    var wallEdge = '#5b4737', wall = '#d2bd7f', wallShade = '#a98b5d';
    var glass = '#78aeb1', cream = '#eee1aa', door = '#684c3a';
    /* Base e soglia coincidono con le tre righe solide `9`; solo il cornicione
     * sporge di 2 px, come overhang non calpestabile. Porta chiaramente chiusa. */
    arrivalSharedGround(ctx, x - 7, y + 43, 56, 0x6f1);
    R(ctx, x - 12, y + 1, 56, 20, roofEdge); R(ctx, x - 9, y + 3, 50, 16, roof);
    R(ctx, x - 5, y + 5, 42, 4, roofHi);
    R(ctx, x + 8, y + 7, 16, 8, roofEdge); R(ctx, x + 10, y + 8, 12, 5, cream);
    R(ctx, x + 13, y + 7, 6, 2, roof); R(ctx, x + 12, y + 13, 10, 2, wallShade);
    R(ctx, x - 11, y + 19, 54, 4, roofEdge);
    for (i = -9; i < 42; i += 4) R(ctx, x + i, y + 23, 3, 6, i & 4 ? roofHi : cream);
    R(ctx, x - 10, y + 28, 52, 3, shade(roofEdge, -10));
    R(ctx, x - 7, y + 28, 46, 1, roofHi);
    R(ctx, x - 8, y + 29, 48, 19, wallEdge); R(ctx, x - 5, y + 31, 43, 15, wall);
    /* Cornicione profondo, fianco est e zoccolo: tre piani leggibili a 1x. */
    R(ctx, x - 6, y + 27, 44, 3, roofEdge); R(ctx, x - 3, y + 29, 38, 1, cream);
    R(ctx, x + 34, y + 31, 4, 15, wallShade); R(ctx, x + 34, y + 32, 1, 13, cream);
    for (i = -1; i < 35; i += 9) R(ctx, x + i, y + 32 + (i & 1), 6, 1, wallShade);
    R(ctx, x - 1, y + 32, 16, 10, wallEdge); R(ctx, x + 1, y + 34, 12, 6, glass);
    R(ctx, x + 7, y + 34, 1, 6, roofEdge); R(ctx, x + 1, y + 37, 12, 1, roofEdge);
    /* Pensilina stretta e stipiti profondi portano subito l'occhio alla porta. */
    R(ctx, x + 15, y + 26, 18, 3, roofEdge); R(ctx, x + 18, y + 27, 12, 1, roofHi);
    R(ctx, x + 17, y + 28, 14, 20, wallEdge); R(ctx, x + 20, y + 31, 9, 17, shade(door, -16));
    R(ctx, x + 22, y + 32, 6, 16, door);
    R(ctx, x + 17, y + 29, 2, 16, cream); R(ctx, x + 30, y + 29, 2, 16, wallShade);
    R(ctx, x + 27, y + 41, 1, 1, cream); R(ctx, x - 6, y + 46, 44, 2, wallShade);
    R(ctx, x + 17, y + 46, 16, 2, roofEdge); R(ctx, x + 20, y + 46, 10, 1, cream);
    arrivalGroundOcclusion(ctx, x - 6, y + 47, 44, 0x6f1);
  }

  function arrivalCabinHero(ctx) {
    var b = ARRIVAL_CONTACT_BOUNDS.cabin, x = b[0], peak = x + 24, y, i;
    var roofEdge = '#263d32', roof = '#557b43', roofHi = '#86a95f';
    var wallEdge = '#4b382d', wall = '#b88758', wallShade = '#835e42';
    var glass = '#78aaa2', cream = '#eadba4', door = '#513c31';
    /* Corpo 48x48 identico al footprint J. Tetto sporge solo in alto/lato;
     * veranda e gradini terminano sulla base solida y47. */
    arrivalSharedGround(ctx, x - 7, 40, 66, 0x6f7);
    for (y = 0; y < 12; y++) {
      var half = 3 + y * 2;
      R(ctx, peak - half, y, Math.min(52, half * 2), 1, roofEdge);
      if (y > 2) R(ctx, peak - half + 3, y, Math.max(2, Math.min(46, half * 2 - 6)), 1, y & 1 ? roof : roofHi);
    }
    R(ctx, x - 6, 10, 60, 31, wallEdge); R(ctx, x - 4, 12, 56, 27, wall);
    R(ctx, x - 10, 9, 68, 5, roofEdge); R(ctx, x - 7, 10, 62, 2, roofHi);
    R(ctx, x - 6, 12, 60, 3, shade(roofEdge, -10)); R(ctx, x - 3, 15, 54, 2, wallShade);
    R(ctx, x - 8, 13, 64, 3, shade(roofEdge, -22)); R(ctx, x - 4, 13, 56, 1, roofHi);
    R(ctx, x + 48, 15, 4, 24, wallShade); R(ctx, x + 48, 16, 1, 21, cream);
    for (y = 15; y < 39; y += 4) R(ctx, x - 4, y, 56, 1, wallShade);
    R(ctx, x + 18, 5, 1, 6, roofHi); R(ctx, x + 30, 7, 1, 4, roof);
    [5, 34].forEach(function (dx) {
      R(ctx, x + dx, 18, 9, 9, wallEdge); R(ctx, x + dx + 2, 20, 5, 5, glass);
      R(ctx, x + dx + 4, 20, 1, 5, roofEdge); R(ctx, x + dx + 2, 22, 5, 1, roofEdge);
    });
    /* Porta serrata: nessun tile D e nessuna soglia chiara d'invito. */
    /* Portale compatto nel timpano: gerarchia forte senza fingere accesso. */
    R(ctx, x + 16, 12, 17, 4, roofEdge); R(ctx, x + 18, 13, 13, 2, roofHi);
    R(ctx, x + 19, 14, 11, 25, wallEdge); R(ctx, x + 22, 17, 6, 21, door);
    R(ctx, x + 19, 16, 2, 21, cream); R(ctx, x + 29, 16, 2, 21, wallShade);
    R(ctx, x + 27, 29, 1, 1, cream); R(ctx, x + 21, 19, 8, 2, wallEdge);
    R(ctx, x - 2, 33, 52, 4, wallEdge);
    for (i = -1; i < 17; i += 3) R(ctx, x + i, 34, 1, 7, roofHi);
    for (i = 34; i < 52; i += 3) R(ctx, x + i, 34, 1, 7, roofHi);
    R(ctx, x - 4, 37, 21, 4, roof); R(ctx, x + 33, 37, 21, 4, roof);
    R(ctx, x + 18, 37, 14, 3, cream); R(ctx, x + 21, 38, 8, 1, roofEdge);
    R(ctx, x + 16, 40, 18, 3, roofHi); R(ctx, x + 14, 43, 22, 3, wallShade);
    R(ctx, x + 12, 46, 26, 2, wallEdge);
    arrivalGroundOcclusion(ctx, x - 4, 47, 58, 0x6f7);
  }

  function arrivalMailboxHero(ctx) {
    var b = ARRIVAL_CONTACT_BOUNDS.mailbox, x = b[0], y = b[1];
    softPixelShadow(ctx, x + 2, y + 13, 12, 4, HG.shadowDark, HG.shadow);
    R(ctx, x + 6, y + 6, 2, 10, '#34572d'); R(ctx, x, y + 1, 10, 8, '#072619');
    R(ctx, x + 1, y + 2, 8, 5, '#6a8a43'); R(ctx, x + 1, y + 3, 6, 1, '#9aab69');
    R(ctx, x + 9, y + 1, 3, 6, '#072619'); R(ctx, x + 4, y + 15, 7, 1, '#072619');
  }

  /* Berlina laterale 45x23: scala ambiente HeartGold, abbastanza grande da
   * leggere come veicolo accanto a un attore 24px. Il contatto resta sulle
   * due celle V; cofano e paraurti hanno solo un piccolo sporto decorativo. */
  function drawParkedCarHero(ctx, x, y, body, bodyHi, glass, accent) {
    softPixelShadow(ctx, x - 3, y + 11, 38, 5, HG.shadowDark, HG.shadow);
    /* Tetto e abitacolo. */
    R(ctx, x + 5, y - 7, 26, 11, C.ink);
    R(ctx, x + 8, y - 5, 20, 8, body);
    R(ctx, x + 10, y - 4, 8, 6, glass);
    R(ctx, x + 20, y - 4, 7, 6, glass);
    R(ctx, x + 18, y - 5, 2, 8, C.ink);
    R(ctx, x + 11, y - 4, 6, 1, bodyHi);
    R(ctx, x + 21, y - 4, 5, 1, bodyHi);
    /* Carrozzeria continua, cofano e bagagliaio diseguali. */
    R(ctx, x - 5, y + 3, 42, 11, C.ink);
    R(ctx, x - 3, y + 5, 38, 7, body);
    R(ctx, x - 1, y + 4, 9, 2, bodyHi);
    R(ctx, x + 29, y + 6, 7, 4, bodyHi);
    R(ctx, x - 6, y + 8, 4, 4, C.ink);
    R(ctx, x + 35, y + 8, 4, 4, C.ink);
    R(ctx, x - 4, y + 8, 3, 2, accent);
    R(ctx, x + 35, y + 7, 3, 3, C.paper);
    R(ctx, x + 9, y + 6, 1, 5, bodyHi);
    R(ctx, x + 28, y + 5, 1, 6, C.ink);
    /* Passaruota profondi e ruote 8x6: massa inferiore credibile, non due
     * puntini neri sospesi sotto una carrozzeria alta mezzo tile. */
    R(ctx, x, y + 9, 11, 7, C.ink);
    R(ctx, x + 25, y + 9, 11, 7, C.ink);
    R(ctx, x + 2, y + 11, 7, 5, '#30383b');
    R(ctx, x + 27, y + 11, 7, 5, '#30383b');
    R(ctx, x + 4, y + 12, 3, 2, '#85877f');
    R(ctx, x + 29, y + 12, 3, 2, '#85877f');
    R(ctx, x + 10, y + 12, 16, 4, C.ink);
    R(ctx, x + 12, y + 12, 12, 2, body);
    R(ctx, x + 12, y + 14, 12, 1, bodyHi);
  }

  function arrivalCarHero(ctx) {
    var b = ARRIVAL_CONTACT_BOUNDS.car, x = b[0], y = b[1];
    drawParkedCarHero(ctx, x, y, '#4e8067', '#80b878', '#9bc0b2', '#d7a351');
  }

  function arrivalGrassCluster(ctx, x, y, variant) {
    var mid = '#9aab69', dark = '#6a8a43';
    R(ctx, x, y + 2, 1, 2, mid); R(ctx, x + 2, y, 1, 3, dark);
    R(ctx, x + 4, y + 1, 1, 2, mid);
    if (variant & 1) { R(ctx, x + 1, y + 4, 2, 1, dark); R(ctx, x + 5, y + 3, 1, 2, mid); }
    if (variant & 2) R(ctx, x + 7, y + 1, 2, 1, mid);
  }

  function arrivalFlowerPatch(ctx, x, y, variant) {
    var petals = variant & 1 ? HG.flowerWhite : HG.flowerPink;
    R(ctx, x + 1, y + 2, 2, 2, petals); R(ctx, x + 4, y, 2, 2, HG.flowerGold);
    R(ctx, x + 7, y + 3, 2, 2, petals);
    R(ctx, x + 2, y + 4, 1, 3, HG.grassDark);
    R(ctx, x + 5, y + 2, 1, 4, HG.grassDark);
    R(ctx, x + 8, y + 5, 1, 3, HG.grassDark);
  }

  function arrivalShrubCluster(ctx, x, y, variant) {
    softPixelShadow(ctx, x + 2, y + 6, 20, 4, HG.shadowDark, HG.shadow);
    var lobes = [[0,4,7,5],[4,1,8,7],[10,3,7,6],[15,2,8,7],[8,0,6,5]];
    for (var i = 0; i < lobes.length; i++) {
      var l = lobes[i];
      R(ctx, x + l[0], y + l[1], l[2], l[3], i & 1 ? HG.grassDark : '#5b8d72');
      R(ctx, x + l[0] + 2, y + l[1] + 1, Math.max(2, l[2] - 4), 2,
        i === (variant % lobes.length) ? HG.grassHi : '#639b72');
    }
    for (i = 0; i < 3; i++) {
      R(ctx, x + 4 + i * 7, y + 2 + ((i + variant) & 1), 2, 2,
        i === 1 ? HG.flowerGold : (variant & 1 ? HG.flowerPink : HG.flowerWhite));
    }
  }

  function arrivalEdgeIsland(ctx, x, y, kind) {
    if (kind === 0) {
      /* Staccionata + aiuola: ancora bassa sul margine occidentale. */
      softPixelShadow(ctx, x + 1, y + 8, 25, 4, HG.shadowDark, HG.shadow);
      R(ctx, x, y + 3, 25, 2, '#705b3e'); R(ctx, x + 2, y + 3, 21, 1, '#c49b5c');
      R(ctx, x + 3, y, 3, 12, '#705b3e'); R(ctx, x + 19, y + 1, 3, 11, '#705b3e');
      R(ctx, x + 4, y + 1, 1, 9, '#c49b5c'); R(ctx, x + 20, y + 2, 1, 8, '#c49b5c');
      arrivalFlowerPatch(ctx, x + 7, y + 5, 1);
    } else if (kind === 1) {
      /* Rocce a gradino + un solo cespuglio: peso diverso dal lato opposto. */
      softPixelShadow(ctx, x + 2, y + 9, 27, 5, HG.shadowDark, HG.shadow);
      R(ctx, x + 1, y + 5, 12, 8, '#315a49'); R(ctx, x + 3, y + 3, 8, 8, '#639b72');
      R(ctx, x + 5, y + 3, 4, 2, '#80b878');
      R(ctx, x + 14, y + 8, 10, 5, '#315a49'); R(ctx, x + 16, y + 6, 7, 5, '#639b72');
      arrivalGrassCluster(ctx, x + 21, y + 2, 3);
    } else {
      /* Palina e erbe inclinate segnano l'imbuto senza chiuderlo. */
      softPixelShadow(ctx, x + 1, y + 10, 21, 4, HG.shadowDark, HG.shadow);
      R(ctx, x + 5, y, 3, 14, '#5b4737'); R(ctx, x + 6, y + 1, 1, 12, '#c09761');
      R(ctx, x, y + 1, 15, 6, '#315a49'); R(ctx, x + 2, y + 2, 11, 3, '#9aab69');
      arrivalGrassCluster(ctx, x + 13, y + 7, 3);
    }
  }

  function arrivalVerticalForest(ctx, x, y, h, rightEdge, salt) {
    /* Sottobosco continuo lungo il bordo; chiome davanti/dietro lo spezzano
     * in profondita' senza lasciare palline isolate nel prato. */
    var baseX = rightEdge ? x + 2 : x;
    for (var by = y, bi = 0; by < y + h; bi++) {
      var bv = hash(Math.round(x), Math.round(by), salt + bi * 31);
      var bh = Math.min(y + h - by, 15 + (bv % 10));
      var bw = 11 + ((bv >>> 5) % 7);
      var bx = rightEdge ? x + 20 - bw : baseX;
      R(ctx, bx, by, bw, bh + (by + bh < y + h ? 2 : 0), bi & 1 ? '#315a49' : '#3e725b');
      R(ctx, bx + (rightEdge ? 1 : 3), by + 3, Math.max(4, bw - 5), Math.max(3, bh - 6), '#4e8067');
      by += bh;
    }
    var step = 31, index = 0;
    for (var sy = y + 18; sy < y + h + 21; sy += step + ((index * 5 + salt) & 11)) {
      var center = rightEdge ? x + 13 - ((index & 1) * 5) : x + 7 + ((index & 1) * 5);
      var recessed = ((index * 3 + salt + (rightEdge ? 1 : 0)) % 5) === 2;
      drawOrganicTree(ctx, center, sy - (recessed ? 4 : 0),
        (index + salt) % ORGANIC_TREE_FAMILIES.length,
        recessed || (index & 3) === 0, salt + index * 17);
      if (!recessed) {
        pixelCrownLobe(ctx, center + (rightEdge ? -5 : 5), sy - 4, 8, 7,
          ['#24382f','#315a49','#3e725b','#639b72','#80b878'], salt + index);
      }
      index++;
    }
  }

  function arrivalHorizontalForest(ctx, x, y, w, h, salt) {
    /* Gruppi di corone sovrapposte, confinati alle celle solide. */
    arrivalFusedForestGroup(ctx, x, y, w, h, salt);
  }

  GAME.Retro2D = GAME.Retro2D || {};
  GAME.Retro2D.drawArrivalBackdrop = function (ctx, cx, cy, vw, vh) {
    var ox = Math.max(0, Math.floor(((vw || 256) - 160) / 2));
    var oy = Math.max(0, Math.floor(((vh || 192) - 144) / 2));
    ctx.save();
    var fullW = vw || 256, fullH = vh || 192;
    R(ctx, 0, 0, fullW, fullH, HG.grass);
    /* Corona forestale: due file sfalsate di alberi veri. Niente bande
     * rettangolari dietro le chiome; prato continua fra tronchi e ombre. */
    for (var ex = -14, exi = 0; ex < fullW + 20; ex += 63 + ((exi * 7) & 15), exi++) {
      drawOrganicTree(ctx, ex + 9, 50 + (hash(exi, 0, 0x6af) % 22), exi % 5, true, exi * 17);
      drawOrganicTree(ctx, ex + 16, fullH + 9 - ((exi * 3) & 11), (exi + 2) % 5,
        (exi & 3) === 0, exi * 29);
    }
    for (var ey = 32, eyi = 0; ey < fullH - 15; ey += 35 + ((eyi * 5) & 7), eyi++) {
      drawOrganicTree(ctx, 4 + ((eyi & 1) * 4), ey, (eyi + 1) % 5, false, eyi * 31);
      drawOrganicTree(ctx, fullW - 5 - ((eyi & 1) * 4), ey + 4, (eyi + 3) % 5, true, eyi * 43);
    }
    /* Vegetazione alta rada dietro i tetti: riempie il vuoto mint senza
     * ricostruire una parete forestale o suggerire collisioni nuove. */
    var upperWest = Math.round(fullW * .30), upperEast = Math.round(fullW * .72);
    grassDriftBlob(ctx, upperWest, 32, 14, 4, '#78c79d', 0x6b7);
    arrivalGrassCluster(ctx, Math.round(fullW * .46), 25, 2);
    grassDriftBlob(ctx, upperEast, 36, 15, 4, '#80c9a0', 0x6c9);
    /* Il display e' piu' largo della piccola mappa collisionale. Il margine
     * ovest diventa quindi un vero giardino di arrivo: campo quieto, aiuola,
     * staccionata, rocce e due grandi chiome. Tutto resta solo render. */
    R(ctx, 14, 32, 52, 116, '#86d5aa');
    R(ctx, 18, 37, 43, 44, '#89d7ad'); R(ctx, 11, 88, 54, 48, '#7fd0a3');
    arrivalSharedGround(ctx, 17, 123, 45, 0x6e3);
    R(ctx, 20, 103, 42, 27, HG.shadow);
    R(ctx, 18, 100, 44, 27, '#5b8d72'); R(ctx, 21, 103, 38, 21, '#86d5aa');
    R(ctx, 25, 107, 30, 14, '#a7d88e');
    /* Serra: tetto stepped traslucido, stessa impronta del giardino. */
    R(ctx, 25, 88, 30, 2, '#705b3e'); R(ctx, 22, 90, 36, 2, '#b18a56');
    R(ctx, 19, 92, 42, 4, '#705b3e'); R(ctx, 22, 93, 36, 2, '#b9ddba');
    R(ctx, 17, 95, 46, 3, '#5b4737'); R(ctx, 21, 95, 38, 1, '#c49b5c');
    R(ctx, 29, 90, 2, 6, '#705b3e'); R(ctx, 49, 90, 2, 6, '#705b3e');
    for (var gf = 0; gf < 4; gf++) {
      R(ctx, 20 + gf * 10, 91, 3, 35, '#705b3e');
      R(ctx, 21 + gf * 10, 91, 1, 33, '#b18a56');
    }
    R(ctx, 17, 96, 45, 4, '#705b3e'); R(ctx, 19, 97, 41, 2, '#c49b5c');
    R(ctx, 18, 125, 44, 3, '#705b3e'); R(ctx, 22, 125, 36, 1, '#c49b5c');
    arrivalGroundOcclusion(ctx, 18, 126, 44, 0x6e3);
    [[26,108,0],[39,105,1],[49,113,0],[30,118,1],[45,120,0]].forEach(function (p) {
      arrivalFlowerPatch(ctx, p[0], p[1], p[2]);
    });
    arrivalShrubCluster(ctx, 14, 70, 2); arrivalShrubCluster(ctx, 41, 76, 4);
    R(ctx, 15, 137, 18, 6, HG.shadowDark); R(ctx, 37, 142, 12, 5, HG.shadow);
    R(ctx, 17, 134, 12, 7, '#6d715a'); R(ctx, 19, 134, 7, 2, '#c8c39b');
    arrivalBroadleaf(ctx, 4, 43, 42, false, true);
    arrivalBroadleaf(ctx, 30, 58, 40, true, false);
    ctx.translate(ox - Math.round(cx || 0), oy - Math.round(cy || 0));
    R(ctx, 0, 0, 160, 144, HG.grass);
    /* Deriva macro a blob: valori sottili, profili curvi, nessun rettangolo. */
    [[18,17,42,19,1],[76,10,39,24,2],[119,25,34,22,3],
     [7,53,38,25,2],[91,62,46,22,1],[38,86,41,19,3]].forEach(function (p, i) {
      var tone = [HG.grass, '#86d5aa', '#80d1a5', '#88d5ac'][p[4]];
      grassDriftBlob(ctx, p[0] + Math.round(p[2] / 2), p[1] + Math.round(p[3] / 2),
        Math.round(p[2] / 2), Math.round(p[3] / 2), tone, 0x6b0 + i * 19);
    });
    /* Pochi cluster locali; pause grandi dominano. */
    [[18,35,1],[82,39,0],[137,43,2],[24,61,2],[111,55,3],
     [33,76,3],[94,76,1],[58,89,3]].forEach(function (g) {
      arrivalGrassCluster(ctx, g[0], g[1], g[2]);
    });
    /* Sottobosco macro dietro i due tetti. Rafforza la gerarchia della
     * quinta alta senza aggiungere nuovi alberi o cambiare coordinate. */
    grassDriftBlob(ctx, 74, 36, 14, 4, '#78c79d', 0x6d7);
    grassDriftBlob(ctx, 128, 39, 15, 4, '#80c9a0', 0x6e9);
    /* Piazza sterrata e corridoio sud: guida l'occhio fra negozio, auto e
     * ingresso senza modificare collisioni. Due toni intermedi formano
     * transizione continua 1–3px; nessun profilo cyan uniforme. */
    for (var py = 42; py < 82; py++) {
      var lowerTaper = Math.max(0, py - 60);
      var plazaInset = 1 + (hash(py >> 3, 7, 0x6c1) % 3);
      var plazaLeft = 21 + Math.floor(lowerTaper * .9) + plazaInset + ((py & 15) === 0 ? 1 : 0);
      var plazaRight = 141 - Math.floor(lowerTaper * 1.1) - plazaInset - ((py & 15) === 7 ? 1 : 0);
      R(ctx, plazaLeft - 2, py, plazaRight - plazaLeft + 4, 1, HG.pathMid);
      R(ctx, plazaLeft, py, plazaRight - plazaLeft, 1, HG.path);
    }
    for (py = 82; py < 144; py++) {
      var laneWobble = (hash(py >> 2, 11, 0x6c2) % 5) - 2;
      var laneWidth = 48 + ((py >> 3) & 3);
      R(ctx, 56 + laneWobble, py, laneWidth + 4, 1, HG.pathMid);
      R(ctx, 58 + laneWobble, py, laneWidth, 1, HG.path);
    }
    [[45,61,0],[91,55,1],[76,105,2]].forEach(function (p, i) {
      var tone = HG_PATH_DETAIL[(i * 3 + 1) % HG_PATH_DETAIL.length];
      R(ctx, p[0], p[1], 5 - (i & 1), 2, tone);
      R(ctx, p[0] + 3, p[1] + 3, 3, 2, i === 1 ? HG.pathHi : HG.pathMid);
      if (i === 2) R(ctx, p[0] - 3, p[1] + 6, 4, 2, HG.pathDark);
    });
    arrivalFlowerPatch(ctx, 36, 72, 1);
    arrivalFlowerPatch(ctx, 139, 58, 0);
    /* Giardino occidentale e bordi del forecourt: gruppi, non coriandoli.
     * Restano sopra righe non-collisionali e non fingono nuovi ostacoli. */
    arrivalShrubCluster(ctx, 3, 34, 1);
    arrivalFlowerPatch(ctx, 8, 48, 0);
    arrivalFlowerPatch(ctx, 18, 50, 1);
    arrivalShrubCluster(ctx, 9, 72, 2);
    arrivalShrubCluster(ctx, 138, 68, 3);
    arrivalFlowerPatch(ctx, 49, 91, 0);
    /* Masse di contatto = alberi sovrapposti; mai nucleo a lastra. */
    arrivalVerticalForest(ctx, 0, 0, 95, false, 3);
    arrivalVerticalForest(ctx, 140, 0, 95, true, 11);
    /* Riga 5 = TT......TT: la massa di contatto segue le due coppie T.
     * Chiome alte possono sporgere pochi pixel, mai riempire il corridoio. */
    arrivalTreeWall(ctx,
      [[7,93,1],[20,98,0],[8,112,0],[21,117,1],
       [7,129,1],[20,134,0],[10,143,0],[22,143,1]], 0, 32, 19);
    arrivalTreeWall(ctx,
      [[153,93,0],[140,98,1],[152,112,1],[139,117,0],
       [153,129,0],[140,134,1],[150,143,1],[138,143,0]], 128, 32, 29);
    /* Imbuto sud: estensioni basse confinate alle celle T aggiuntive. */
    arrivalStepForest(ctx, 32, 96, 48, 31);
    arrivalStepForest(ctx, 112, 96, 48, 37);
    arrivalStepForest(ctx, 48, 112, 32, 41);
    arrivalStepForest(ctx, 96, 112, 32, 43);
    arrivalStepForest(ctx, 80, 128, 16, 53);
    /* Profondità solo sui lati. Centro piazza e facciate restano dominanti. */
    [-8,9,139,154].forEach(function (fx, i) {
      arrivalMixedTree(ctx, fx, 18 + (i & 1) * 20, 39, (i & 2) !== 0, 61 + i * 17);
    });
    /* Patch di contatto sotto shop e cabin: verde compresso, suolo e ombra
     * precedono i volumi, quindi le basi non galleggiano sulla piazza. */
    grassDriftBlob(ctx, 49, 48, 31, 5, HG.shadow, 0x6f1);
    R(ctx, 24, 47, 17, 2, HG.vergeSoil); R(ctx, 57, 49, 15, 1, HG.grassDark);
    grassDriftBlob(ctx, 120, 48, 34, 5, HG.shadow, 0x6f7);
    R(ctx, 91, 47, 18, 2, HG.vergeSoil); R(ctx, 129, 49, 17, 1, HG.grassDark);
    /* Tre ancore diseguali ricompongono la radura. Stanno sui bordi della
     * foresta/imbuto: il corridoio centrale 56–108px resta completamente
     * aperto e il percorso verso le due facciate diventa un vero fuoco. */
    arrivalEdgeIsland(ctx, 25, 66, 0);
    arrivalEdgeIsland(ctx, 128, 69, 1);
    arrivalEdgeIsland(ctx, 39, 105, 2);
    arrivalShop(ctx); arrivalCabinHero(ctx); arrivalMailboxHero(ctx); arrivalCarHero(ctx);
    /* Landscaping ancorato alle facciate; asse centrale resta aperto. */
    arrivalFlowerPatch(ctx, 38, 49, 1);
    arrivalGrassCluster(ctx, 70, 51, 2);
    arrivalFlowerPatch(ctx, 106, 50, 0);
    arrivalShrubCluster(ctx, 137, 47, 3);
    ctx.restore();
  };

  function tree(ctx, x, y, tx, ty, rows, sycamore, night, paleGround) {
    /* Tile BG 2bpp credibile: un solo colore terreno + tre colori chioma.
     * Tronco condivide outline; niente seconda palette di erba sotto. */
    if (paleGround && GAME.Diorama) GAME.Diorama.surface(ctx, '.', x, y, tx, ty, rows, false);
    else if (paleGround) arrivalGround(ctx, x, y, tx, ty);
    else R(ctx, x, y, 16, 16, night ? '#7770a8' : C.grass);
    /* Town costruisce alberi completi nel passaggio macro/depth. Lasciare qui
     * un tronco per ogni cella T separava tronchi e chiome, perché ancore macro
     * non coincidono volutamente con griglia 16px. Tile town fornisce soltanto
     * terreno; ombra, tronco e chioma nascono insieme da drawOrganicTree. */
    if (paleGround && !night) return;
    if (!night && !paleGround) {
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
      (sycamore ? { 1: '#80b878', 2: '#4e8067', 3: '#315a49', 4: '#24382f' } :
                   { 1: '#639b72', 2: '#3e725b', 3: '#294f42', 4: '#1d372f' });
    /* Nelle fasce con almeno tre vicini, una chioma arretrata continua
     * riempie i grandi fori crema tra conifere. Alberi isolati conservano
     * invece terreno visibile e silhouette autonoma. */
    function treeNeighborCount(qx, qy) {
      var count = 0;
      if (cell(rows, qx - 1, qy) === 'T' || cell(rows, qx - 1, qy) === 'Y') count++;
      if (cell(rows, qx + 1, qy) === 'T' || cell(rows, qx + 1, qy) === 'Y') count++;
      if (cell(rows, qx, qy - 1) === 'T' || cell(rows, qx, qy - 1) === 'Y') count++;
      if (cell(rows, qx, qy + 1) === 'T' || cell(rows, qx, qy + 1) === 'Y') count++;
      return count;
    }
    var treeNeighbors = treeNeighborCount(tx, ty);
    if (paleGround && !night && treeNeighbors >= 3) {
      R(ctx, x, y - 8, 16, 24, treePalette[3]);
      R(ctx, x + 2, y - 6, 8, 3, treePalette[2]);
      R(ctx, x + 9, y - 2, 7, 3, treePalette[1]);
      R(ctx, x + 1, y + 5, 11, 3, treePalette[2]);
      R(ctx, x + 6, y + 11, 10, 2, treePalette[1]);
      /* Mezze maschere ai passaggi denso→rado. Intaccano soltanto 1–2px
       * del bordo esterno: l'interno resta chiuso, il limite non è un
       * rettangolo 16px perfetto o una siepe a baseline continua. */
      var edgePhase = hash(tx, ty, 0x631) & 3;
      if (treeNeighborCount(tx - 1, ty) < 3) {
        R(ctx, x, y - 5 + edgePhase, 1, 2, HG.grass);
        R(ctx, x, y + 5 + edgePhase, 2, 2, HG.grass);
      }
      if (treeNeighborCount(tx + 1, ty) < 3) {
        R(ctx, x + 15, y - 2 + edgePhase, 1, 2, HG.grass);
        R(ctx, x + 14, y + 8 - edgePhase, 2, 2, HG.grass);
      }
      if (treeNeighborCount(tx, ty + 1) < 3) {
        R(ctx, x + 2 + edgePhase * 2, y + 15, 5, 1, HG.grass);
        R(ctx, x + 10 - edgePhase, y + 14, 2, 2, HG.grass);
      }
    }
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
    var treePhase = ((tx + (ty & 1) * 3) % 4 + 4) % 4;
    var shapeIdx = [0, 1, 2, 1][treePhase];
    var flip = treePhase === 2;
    var dx = [0, -1, -2, -1][treePhase];
    var dy = [0, -4, -1, -3][treePhase];
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
    if (!night) {
      softPixelShadow(ctx, x + 2 + dx, y + 11, 14, 4, HG.shadowDark, HG.shadow);
      paint(ctx, TREE_TRUNK, treePalette, x + dx, y + 7, false);
    }
    if (night) {
      /* Due letture esterne: abete alto e stretto oppure basso e largo.
       * Non condividono baseline o rami, quindi la parete del bosco perde
       * la cadenza 16/32px pur restando scura e solida. */
      if (shapeIdx === 1) {
        R(ctx, x + dx + 6, y - 11 + dy, 5, 4, treePalette[3]);
        R(ctx, x + dx - 1, y + 5 + dy, 4, 1, treePalette[2]);
        R(ctx, x + dx + 13, y + 11 + dy, 4, 2, treePalette[3]);
      } else {
        R(ctx, x + dx - 2, y + 2 + dy, 5, 2, treePalette[3]);
        R(ctx, x + dx + 12, y + 7 + dy, 6, 1, treePalette[2]);
        R(ctx, x + dx - 1, y + 14 + dy, 4, 1, treePalette[3]);
      }
    }
    paint(ctx, shapeIdx === 0 ? TREE_CANOPY : (shapeIdx === 1 ? TREE_CANOPY_B : TREE_CANOPY_C),
      treePalette, x + dx, y - 8 + dy, flip);
    if (night) {
      /* Piccoli recessi soltanto sul perimetro esposto. Sono aperture nel
       * profilo, non buchi nelle collisioni o pattern ripetuti interni. */
      var inset = (h >>> 5) & 3;
      if (cell(rows, tx - 1, ty) !== 'T' && cell(rows, tx - 1, ty) !== 'Y') {
        R(ctx, x, y + 2 + inset * 2, 2, 4, '#7770a8');
        R(ctx, x + 1, y + 3 + inset * 2, 1, 2, '#958db8');
      }
      if (cell(rows, tx + 1, ty) !== 'T' && cell(rows, tx + 1, ty) !== 'Y') {
        R(ctx, x + 14, y + 7 - inset, 2, 4, '#7770a8');
        R(ctx, x + 14, y + 8 - inset, 1, 2, '#5b5684');
      }
    }
    /* Tre silhouette esterne, non solo tre riempimenti interni. Rami corti
     * spezzano cadenza 16/32px senza chiudere i varchi chiari del bosco. */
    if (!night) {
      if (shapeIdx === 0) {
        R(ctx, x + dx - 2, y + 3 + dy, 4, 2, treePalette[3]);
        R(ctx, x + dx + 13, y + 10 + dy, 4, 1, treePalette[2]);
      } else if (shapeIdx === 1) {
        R(ctx, x + dx + 14, y + 1 + dy, 3, 2, treePalette[3]);
        R(ctx, x + dx - 1, y + 11 + dy, 4, 2, treePalette[2]);
      } else {
        R(ctx, x + dx - 2, y + 7 + dy, 5, 1, treePalette[2]);
        R(ctx, x + dx + 12, y + 13 + dy, 5, 2, treePalette[3]);
      }
    }
    /* Cluster di aghi in tre profondita. La sagoma resta quella solida del
     * metatile, ma la chioma non legge piu' come icona a riempimento unico. */
    if (!night) {
      var needle = (h >>> 8) & 3;
      R(ctx, x + dx + 4 + needle, y - 3 + dy, 4, 1, treePalette[1]);
      R(ctx, x + dx + 2 + ((needle + 1) & 3), y + 3 + dy, 6, 2, treePalette[2]);
      R(ctx, x + dx + 8 - needle, y + 9 + dy, 5, 1, treePalette[1]);
      if (!paleGround) {
        R(ctx, x + dx + 5 + (needle & 1), y + 14 + dy, 7, 2, treePalette[3]);
        R(ctx, x + dx + 6 + ((needle + 2) & 3), y + 15 + dy, 3, 1, treePalette[1]);
      }
    }
    /* Connessioni sottili tra metatile adiacenti: le terrazze si toccano
     * senza trasformare la chioma in fasce orizzontali. Anche questi stub
     * seguono dx: erano l'origine principale della cadenza a 16/32 px (un
     * blocco 3x3 fisso a x e x+13 su quasi ogni tile di una fila continua
     * di conifere e' un reticolo perfettamente periodico, indipendente
     * dalla sagoma scelta sopra). */
    if (cell(rows, tx - 1, ty) === 'T' || cell(rows, tx - 1, ty) === 'Y') {
      R(ctx, x + dx - 2, y - 3 + dy, 6, 2, treePalette[3]);
      R(ctx, x + dx - 1, y + 1 + dy, 5, 2, treePalette[2]);
      R(ctx, x + dx, y + 7, 3, 1, treePalette[2]); R(ctx, x + dx, y + 13, 3, 3, treePalette[3]);
    }
    if (cell(rows, tx + 1, ty) === 'T' || cell(rows, tx + 1, ty) === 'Y') {
      R(ctx, x + 13 + dx, y + 7, 3, 1, treePalette[2]); R(ctx, x + 13 + dx, y + 13, 3, 3, treePalette[3]);
    }
  }

  function roadCell(ch) { return ch === 'r' || ch === '-' || ch === ':'; }
  function townTravelCell(ch) {
    return roadCell(ch) || ch === 'p' || ch === '=' || ch === 'u';
  }

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
    /* Pattern globale a due profondita: grandi laghi non collassano in una
     * lastra piatta, ma le onde restano continue fra tile adiacenti. */
    var wave = hash(tx >> 1, ty, 0x966) & 3;
    if (((tx + ty) & 3) === 0) {
      R(ctx, x + 3 + wave, y + 7, 7, 2, '#34572d');
      R(ctx, x + 5 + wave, y + 7, 3, 1, C.water2);
    }
    if (((tx * 3 + ty) & 7) === 2) {
      R(ctx, x + 1, y + 13, 11, 1, '#6f9185');
      R(ctx, x + 4, y + 14, 5, 1, '#9bc0b2');
    }
    if (cell(rows, tx, ty - 1) !== 'w') {
      R(ctx, x, y, 16, 2, C.ink); R(ctx, x, y + 2, 16, 2, '#b09a6c');
      R(ctx, x + 2, y + 4, 6, 1, C.water2);
    }
    if (cell(rows, tx, ty + 1) !== 'w') { R(ctx, x, y + 13, 16, 1, '#b09a6c'); R(ctx, x, y + 14, 16, 2, C.ink); }
    if (cell(rows, tx - 1, ty) !== 'w') { R(ctx, x, y, 2, 16, C.ink); R(ctx, x + 2, y + 3, 1, 10, '#b09a6c'); }
    if (cell(rows, tx + 1, ty) !== 'w') { R(ctx, x + 14, y, 2, 16, C.ink); R(ctx, x + 13, y + 3, 1, 10, '#b09a6c'); }
  }

  function fence(ctx, x, y, tx, ty, rows, paleGround) {
    if (paleGround) townGround(ctx, x, y, tx, ty, rows);
    else grass(ctx, x, y, tx, ty, false, false, rows);
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

  function lakeShore(ctx, x, y, tx, ty, rows) {
    /* Riva naturale sullo stesso tile F solido: sostituisce la vecchia
     * staccionata a scala senza cambiare collisione o interazione lago. */
    townGround(ctx, x, y, tx, ty, rows);
    var bite = 5 + (hash(tx, ty, 0x91a) & 3);
    R(ctx, x, y, bite, 16, C.water);
    R(ctx, x + bite, y, 2, 16, C.ink);
    R(ctx, x + bite + 2, y, 2, 16, '#a89068');
    R(ctx, x + 1, y + 4 + ((ty & 1) * 6), Math.max(2, bite - 2), 1, C.water2);
    R(ctx, x + bite - 1, y + 2 + ((ty * 3) & 7), 2, 2, '#6a8a43');
    R(ctx, x + bite + 2 + (ty & 2), y + 11, 2, 1, '#9aab69');
    if ((ty & 1) === 0) {
      R(ctx, x + bite + 5, y + 3, 2, 12, '#34572d');
      R(ctx, x + bite + 2, y + 7, 4, 2, '#6a8a43');
    }
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

  function townGrassFieldTone(tx, ty) {
    return [HG.grass, '#86d5aa', '#80d1a5', '#88d5ac'][hash(Math.floor(tx / 6), Math.floor(ty / 5), 0x72f) & 3];
  }

  /* Profilo continuo in coordinate mondo. Bordi adiacenti condividono
   * campione, quindi nessuna cucitura verticale ogni 16px. */
  function townContinuousEdge(boundary, worldY, salt) {
    /* Profilo macro continuo. Ogni superblocco contiene quattro segmenti
     * irregolari da 40–73px; endpoint condivisi eliminano seam fra
     * tile e superblocchi. Nessun impulso/tick a passo 8px. */
    var macro = Math.floor(worldY / 256);
    var local = ((worldY % 256) + 256) % 256;
    var patterns = [
      [53,71,61,71], [67,43,73,73], [59,69,57,71],
      [73,53,67,63], [47,71,65,73]
    ];
    var lengths = patterns[hash(boundary, macro, salt ^ 0x2e7) % patterns.length];
    var segment = 0, start = 0;
    while (segment < 3 && local >= start + lengths[segment]) {
      start += lengths[segment]; segment++;
    }
    var len = lengths[segment], at = local - start;
    function point(index) {
      if (index === 0) return 1 + (hash(boundary, macro, salt ^ 0x4a1) % 5);
      if (index === 4) return 1 + (hash(boundary, macro + 1, salt ^ 0x4a1) % 5);
      return 1 + (hash(boundary, macro * 7 + index, salt ^ 0x5b3) % 5);
    }
    var a = point(segment), b = point(segment + 1);
    var shape = hash(boundary, macro * 5 + segment, salt ^ 0x6c7);
    /* Interpolazione smooth fra endpoint condivisi: il bordo curva lungo
     * tutto il segmento invece di restare fermo per 10–20px alle estremita'. */
    var t = at / Math.max(1, len - 1);
    var smooth = t * t * (3 - 2 * t);
    var depth = Math.round(a + (b - a) * smooth);
    /* Ogni segmento macro riceve una sola erosione asimmetrica 16–27px.
     * Le spalle da 1px e il cuore 2–3px formano una cap rotonda leggibile;
     * posizione e verso non dipendono mai dal reticolo tile. */
    var erosionW = 16 + ((shape >>> 8) % 12);
    var centered = Math.round((len - erosionW) / 2);
    var erosionAt = Math.max(5, Math.min(len - erosionW - 5,
      centered + ((shape >>> 15) % 17) - 8));
    if (at >= erosionAt && at < erosionAt + erosionW) {
      var erosionLocal = at - erosionAt;
      var shoulderL = 2 + ((shape >>> 21) & 3);
      var shoulderR = 2 + ((shape >>> 24) & 3);
      var erosionDepth = erosionLocal < shoulderL || erosionLocal >= erosionW - shoulderR ? 1 :
        (erosionLocal < shoulderL + 2 || erosionLocal >= erosionW - shoulderR - 2 ? 2 : 3);
      var signedErosion = (shape & 4) ? erosionDepth : -erosionDepth;
      var eroded = depth + signedErosion;
      depth = eroded < 1 || eroded > 5 ? depth - signedErosion : eroded;
    }
    return Math.max(1, Math.min(5, depth));
  }

  function townSurfaceInsets(tx, ty, salt, band, left, right, up, down) {
    var worldY = ty * 16 + band;
    var il = left ? 0 : townContinuousEdge(tx, worldY, salt);
    var ir = right ? 0 : townContinuousEdge(tx + 1, worldY, salt ^ 0x51);
    return [Math.min(7, il), Math.min(7, ir)];
  }

  function townSurfaceBand(ctx, x, y, band, il, ir, fill, middle) {
    /* Solo sabbia nell'interno. Sul bordo reale: suolo scuro esterno,
     * verde compresso, frangia chiara e spalla sabbia. Quattro letture
     * distinte a 1x, ma l'invasione resta al massimo cinque pixel. */
    R(ctx, x + il, y + band, 16 - il - ir, 1, fill);
    if (il > 0) {
      if (il > 2) R(ctx, x, y + band, 1, 1, HG.vergeSoil);
      if (il > 1) R(ctx, x + (il > 2 ? 1 : 0), y + band, il - (il > 2 ? 2 : 1), 1, HG.vergeMid);
      R(ctx, x + il - 1, y + band, 1, 1, HG.vergeWarm);
      if (middle && il < 15 - ir) R(ctx, x + il, y + band, 1, 1, middle);
    }
    if (ir > 0) {
      if (ir > 2) R(ctx, x + 15, y + band, 1, 1, HG.vergeSoil);
      if (ir > 1) R(ctx, x + 17 - ir, y + band, ir - (ir > 2 ? 2 : 1), 1, HG.vergeMid);
      R(ctx, x + 16 - ir, y + band, 1, 1, HG.vergeWarm);
      if (middle && 15 - ir > il) R(ctx, x + 15 - ir, y + band, 1, 1, middle);
    }
  }

  function townMaterialJoin(ctx, x, y, side, tone, phase) {
    /* Join corto e connesso: indica cambio materia senza disegnare una
     * cucitura intermittente lungo tutto il bordo della tile. */
    if ((phase & 7) !== 0) return;
    phase = phase >>> 3;
    var start = 3 + (phase & 3);
    var span = 5 + ((phase >>> 3) & 3);
    if (side === 'left' || side === 'right') {
      var sx = side === 'left' ? x : x + 15;
      var inwardX = side === 'left' ? sx + 1 : sx - 2;
      R(ctx, sx, y + start, 1, Math.min(span, 16 - start), tone);
      R(ctx, inwardX, y + start + 2, 2, Math.max(2, Math.min(span - 3, 13 - start)), HG.vergeWarm);
    } else {
      var sy = side === 'up' ? y : y + 15;
      var inwardY = side === 'up' ? sy + 1 : sy - 2;
      R(ctx, x + start, sy, Math.min(span, 16 - start), 1, tone);
      R(ctx, x + start + 2, inwardY, Math.max(2, Math.min(span - 3, 13 - start)), 2, HG.vergeWarm);
    }
  }

  function townHorizontalCap(ctx, x, y, tx, ty, salt, top, field) {
    for (var col = 0; col < 16; col++) {
      var worldX = tx * 16 + col;
      var depth = townContinuousEdge(ty + (top ? 0 : 1), worldX, salt);
      if (top) {
        if (depth > 2) R(ctx, x + col, y, 1, 1, HG.vergeSoil);
        if (depth > 1) R(ctx, x + col, y + (depth > 2 ? 1 : 0), 1,
          depth - (depth > 2 ? 2 : 1), HG.vergeMid);
        R(ctx, x + col, y + depth - 1, 1, 1, HG.vergeWarm);
        if (depth < 15) R(ctx, x + col, y + depth, 1, 1, HG.pathMid);
      } else {
        if (depth > 2) R(ctx, x + col, y + 15, 1, 1, HG.vergeSoil);
        if (depth > 1) R(ctx, x + col, y + 17 - depth, 1,
          depth - (depth > 2 ? 2 : 1), HG.vergeMid);
        R(ctx, x + col, y + 16 - depth, 1, 1, HG.vergeWarm);
        if (depth < 15) R(ctx, x + col, y + 15 - depth, 1, 1, HG.pathMid);
      }
    }
  }

  function townGrassBay(ctx, x, y, side, field, salt) {
    var depth = 5 + (salt & 1), row;
    for (row = 0; row < depth; row++) {
      var reach = 1 + (Math.abs(row - ((depth - 1) / 2)) < 1.6 ? 2 : 1);
      var yy = y + row;
      if (side === 'left') {
        if (reach > 2) R(ctx, x, yy, 1, 1, HG.vergeSoil);
        R(ctx, x + (reach > 2 ? 1 : 0), yy, reach - (reach > 2 ? 1 : 0), 1, HG.vergeMid);
        R(ctx, x + reach, yy, 1, 1, HG.vergeWarm);
      } else if (side === 'right') {
        if (reach > 2) R(ctx, x + 15, yy, 1, 1, HG.vergeSoil);
        R(ctx, x + 16 - reach, yy, reach - (reach > 2 ? 1 : 0), 1, HG.vergeMid);
        R(ctx, x + 15 - reach, yy, 1, 1, HG.vergeWarm);
      } else if (side === 'up') {
        if (reach > 2) R(ctx, x + row, y, 1, 1, HG.vergeSoil);
        R(ctx, x + row, y + (reach > 2 ? 1 : 0), 1, reach - (reach > 2 ? 1 : 0), HG.vergeMid);
        R(ctx, x + row, y + reach, 1, 1, HG.vergeWarm);
      } else {
        if (reach > 2) R(ctx, x + row, y + 15, 1, 1, HG.vergeSoil);
        R(ctx, x + row, y + 16 - reach, 1, reach - (reach > 2 ? 1 : 0), HG.vergeMid);
        R(ctx, x + row, y + 15 - reach, 1, 1, HG.vergeWarm);
      }
    }
  }

  function townCornerBay(ctx, x, y, corner, field, salt) {
    /* Angolo smussato, non cuneo: massimo tre pixel di prato. */
    for (var row = 0; row < 5; row++) {
      var reach = Math.max(1, 3 - Math.floor(row / 2));
      var yy = corner.indexOf('s') === 0 ? y + 15 - row : y + row;
      if (corner.charAt(1) === 'w') {
        if (reach > 2) R(ctx, x, yy, 1, 1, HG.vergeSoil);
        R(ctx, x + (reach > 2 ? 1 : 0), yy, reach - (reach > 2 ? 1 : 0), 1, HG.vergeMid);
        R(ctx, x + reach, yy, 1, 1, HG.vergeWarm);
      } else {
        if (reach > 2) R(ctx, x + 15, yy, 1, 1, HG.vergeSoil);
        R(ctx, x + 16 - reach, yy, reach - (reach > 2 ? 1 : 0), 1, HG.vergeMid);
        R(ctx, x + 15 - reach, yy, 1, 1, HG.vergeWarm);
      }
    }
  }

  function townJunctionFeather(ctx, x, y, corner, field, depth, salt) {
    depth = Math.max(2, Math.min(3, depth));
    for (var row = 0; row < depth; row++) {
      var reach = Math.max(1, Math.min(3, depth - row));
      var yy = corner.charAt(0) === 's' ? y + 15 - row : y + row;
      if (corner.charAt(1) === 'w') {
        if (reach > 2) R(ctx, x, yy, 1, 1, HG.vergeSoil);
        R(ctx, x + (reach > 2 ? 1 : 0), yy, reach - (reach > 2 ? 1 : 0), 1, HG.vergeMid);
        R(ctx, x + reach, yy, 1, 1, HG.vergeWarm);
      } else {
        if (reach > 2) R(ctx, x + 15, yy, 1, 1, HG.vergeSoil);
        R(ctx, x + 16 - reach, yy, reach - (reach > 2 ? 1 : 0), 1, HG.vergeMid);
        R(ctx, x + 15 - reach, yy, 1, 1, HG.vergeWarm);
      }
    }
  }

  function townCornerPixel(ctx, x, y, corner, u, v, tone) {
    var px = corner.charAt(1) === 'e' ? 15 - u : u;
    var py = corner.charAt(0) === 's' ? 15 - v : v;
    R(ctx, x + px, y + py, 1, 1, tone);
  }

  function townLayeredCorner(ctx, x, y, corner, field, inner, middle, salt) {
    /* Set completo interno/esterno. Ogni diagonale conserva nell'ordine
     * prato, suolo, verde, luce e spalla: nessun angolo ritorna a un
     * cuneo monocolore. Ingombro massimo 4px. */
    var limit = 3, variant = (salt || 0) & 3;
    for (var v = 0; v <= limit; v++) for (var u = 0; u <= limit; u++) {
      var bias = variant === 1 && u > v ? 1 :
        (variant === 2 && v > u ? 1 : (variant === 3 && u === 0 && v > 1 ? 1 : 0));
      var sum = u + v + bias, tone = null;
      if (inner) {
        if (sum === 0) tone = field;
        else if (sum === 1) tone = HG.vergeSoil;
        else if (sum === 2) tone = HG.vergeMid;
        else if (sum === 3) tone = HG.vergeWarm;
        else if (sum === 4) tone = middle;
      } else {
        if (sum <= 1) tone = field;
        else if (sum === 2) tone = HG.vergeSoil;
        else if (sum === 3) tone = HG.vergeMid;
        else if (sum === 4) tone = HG.vergeWarm;
        else if (sum === 5) tone = middle;
      }
      if (tone) townCornerPixel(ctx, x, y, corner, u, v, tone);
    }
  }

  function townSandNotch(ctx, x, y, side, fill, middle, start) {
    /* Concavita' sabbia di un pixel. Le estremita' mantengono il verde;
     * soltanto il cuore avanza verso l'esterno, quindi non e' un dente. */
    for (var i = 0; i < 6; i++) {
      var core = i >= 2 && i <= 3;
      if (side === 'left' || side === 'right') {
        var yy = y + start + i;
        if (side === 'left') {
          R(ctx, x, yy, 1, 1, HG.vergeSoil);
          R(ctx, x + 1, yy, 1, 1, core ? HG.vergeWarm : HG.vergeMid);
          R(ctx, x + 2, yy, 1, 1, core ? fill : HG.vergeWarm);
          R(ctx, x + 3, yy, 1, 1, middle);
        } else {
          R(ctx, x + 15, yy, 1, 1, HG.vergeSoil);
          R(ctx, x + 14, yy, 1, 1, core ? HG.vergeWarm : HG.vergeMid);
          R(ctx, x + 13, yy, 1, 1, core ? fill : HG.vergeWarm);
          R(ctx, x + 12, yy, 1, 1, middle);
        }
      } else {
        var xx = x + start + i;
        if (side === 'up') {
          R(ctx, xx, y, 1, 1, HG.vergeSoil);
          R(ctx, xx, y + 1, 1, 1, core ? HG.vergeWarm : HG.vergeMid);
          R(ctx, xx, y + 2, 1, 1, core ? fill : HG.vergeWarm);
          R(ctx, xx, y + 3, 1, 1, middle);
        } else {
          R(ctx, xx, y + 15, 1, 1, HG.vergeSoil);
          R(ctx, xx, y + 14, 1, 1, core ? HG.vergeWarm : HG.vergeMid);
          R(ctx, xx, y + 13, 1, 1, core ? fill : HG.vergeWarm);
          R(ctx, xx, y + 12, 1, 1, middle);
        }
      }
    }
  }

  function townShoulderTuft(ctx, x, y, side, start, salt) {
    var dark = (salt & 1) ? HG.grassDark : HG.vergeShadow;
    if (side === 'left' || side === 'right') {
      var bx = side === 'left' ? x : x + 12, by = y + start;
      R(ctx, bx, by + 2, 4, 2, dark);
      R(ctx, bx + (side === 'left' ? 1 : 2), by, 1, 3, HG.vergeMid);
      R(ctx, bx + (side === 'left' ? 3 : 0), by + 1, 1, 3, HG.vergeWarm);
    } else {
      var bxx = x + start, byy = side === 'up' ? y : y + 12;
      R(ctx, bxx + 1, byy, 2, 4, dark);
      R(ctx, bxx, byy + (side === 'up' ? 1 : 2), 3, 1, HG.vergeMid);
      R(ctx, bxx + 2, byy + (side === 'up' ? 3 : 0), 3, 1, HG.vergeWarm);
    }
  }

  function townSeamFeature(ctx, x, y, tx, ty, side, field, fill, middle, salt) {
    var vertical = side === 'left' || side === 'right';
    var boundary = vertical ? tx + (side === 'right' ? 1 : 0) : ty + (side === 'down' ? 1 : 0);
    var along = vertical ? ty : tx;
    var event = hash(boundary, along, salt ^ side.length);
    if ((event & 7) !== 0) return;
    var ordinal = Math.floor(along / 2);
    var family = (event >>> 5) % 3;
    var start = 4 + (hash(boundary, ordinal, salt ^ 0x5a3) % 3);
    if (family === 0) townGrassBay(ctx, x + (vertical ? 0 : start), y + (vertical ? start : 0), side, field, salt ^ ordinal);
    else if (family === 1) townSandNotch(ctx, x, y, side, fill, middle, start);
    else townShoulderTuft(ctx, x, y, side, start, salt ^ ordinal);
  }

  function townRoadDetailCluster(ctx, x, y, tx, ty, horizontal, junction, salt) {
    var along = horizontal ? tx : ty, cross = horizontal ? ty : tx;
    /* Un evento per segmento: i passi reali fra cluster sono sempre 4–7
     * tile, mentre ordine, famiglia e lato cambiano a ogni macroblocco. */
    var block = Math.floor(along / 32);
    var local = ((along % 32) + 32) % 32;
    var intervalSets = [
      [4,7,5,6,4,6], [6,4,7,5,6,4],
      [5,6,4,7,5,5], [7,5,4,6,5,5]
    ];
    var intervals = intervalSets[hash(cross, block, salt ^ 0x35) % intervalSets.length];
    var segment = 0, start = 0;
    while (segment < intervals.length - 1 && local >= start + intervals[segment]) {
      start += intervals[segment]; segment++;
    }
    if (local !== start) return;
    var event = block * intervals.length + segment;
    var v = hash(event, cross, salt ^ 0x6d1), family = (v >>> 4) % 3;
    var edgeSide = (v & 1) ? 1 : -1;
    var ox = horizontal ? 5 + ((v >>> 7) % 6) : (edgeSide < 0 ? 3 : 11);
    var oy = horizontal ? (edgeSide < 0 ? 3 : 11) : 5 + ((v >>> 7) % 6);
    /* Patch materica 12–15px, connessa e poco contrastata, sempre vicina
     * alla verge scelta. Il dettaglio direzionale sotto diventa il cuore
     * della patch, non una costellazione di pixel nel centro corsia. */
    if (horizontal) {
      var patchY = edgeSide < 0 ? 2 : 11;
      R(ctx, x + 1, y + patchY, 14, 2, '#d8c387');
      R(ctx, x + 3, y + patchY + (edgeSide < 0 ? 1 : -2), 10, 3, '#d4be84');
      R(ctx, x + 6, y + patchY + (edgeSide < 0 ? 3 : -3), 6, 2, '#d8c387');
    } else {
      var patchX = edgeSide < 0 ? 2 : 11;
      R(ctx, x + patchX, y + 1, 2, 14, '#d8c387');
      R(ctx, x + patchX + (edgeSide < 0 ? 1 : -2), y + 3, 3, 10, '#d4be84');
      R(ctx, x + patchX + (edgeSide < 0 ? 3 : -3), y + 6, 2, 6, '#d8c387');
    }
    if (family === 0) {
      /* Tre granelli letti come un unico triangolo. */
      R(ctx, x + ox - 2, y + oy, 3, 1, HG.roadMid);
      R(ctx, x + ox + 2, y + oy + 1, 2, 2, '#d4be84');
      R(ctx, x + ox, y + oy + 3, 3, 1, HG.roadMid);
    } else if (family === 1) {
      /* Coppia d'impronte orientata alla corsia. */
      if (horizontal) {
        R(ctx, x + ox - 3, y + oy, 2, 1, HG.roadMid);
        R(ctx, x + ox + 2, y + oy + 2, 2, 1, '#d4be84');
      } else {
        R(ctx, x + ox, y + oy - 3, 1, 2, HG.roadMid);
        R(ctx, x + ox + 2, y + oy + 2, 1, 2, '#d4be84');
      }
    } else {
      /* Piccola abrasione: due barre vicine, non macchia rettangolare. */
      if (horizontal) {
        R(ctx, x + ox - 3, y + oy, 7, 1, '#d4be84');
        R(ctx, x + ox - 1, y + oy + 2, 5, 1, HG.roadMid);
      } else {
        R(ctx, x + ox, y + oy - 3, 1, 7, '#d4be84');
        R(ctx, x + ox + 2, y + oy - 1, 1, 5, HG.roadMid);
      }
    }
    if (((v >>> 11) & 7) === 0) {
      /* Ciottoli occasionali solo accanto alla verge scelta. */
      var px = horizontal ? x + ox + 3 : x + (edgeSide < 0 ? 2 : 13);
      var py = horizontal ? y + (edgeSide < 0 ? 2 : 13) : y + oy + 3;
      R(ctx, px, py, 3, 2, HG.vergeSoil);
      R(ctx, px + 1, py, 2, 1, HG.vergeWarm);
    }
  }

  function townSurfaceWear(ctx, x, y, tx, ty, horizontal, tones, salt, density) {
    /* Eventi lungo segmenti 6–9 tile; la selezione avviene sul segmento,
     * non su ogni tile. Questo elimina distribuzione uniforme e seam visivi. */
    var along = horizontal ? tx : ty, cross = horizontal ? ty : tx;
    var block = Math.floor(along / 24), local = ((along % 24) + 24) % 24;
    var intervalSets = [[7,9,8],[9,6,9],[8,7,9],[6,9,9]];
    var intervals = intervalSets[hash(cross, block, salt ^ 0x321) % intervalSets.length];
    var segment = 0, start = 0;
    while (segment < 2 && local >= start + intervals[segment]) {
      start += intervals[segment]; segment++;
    }
    if (local !== start) return;
    var event = block * 3 + segment;
    if ((hash(event, cross, salt ^ 0x347) & 7) >= density) return;
    var v = hash(event, cross, salt ^ 0x39);
    var family = (v >>> 6) % 3;
    var ox = 5 + ((v >>> 9) % 5), oy = 5 + ((v >>> 13) % 5);
    if (family === 0) {
      /* Traccia direzionale connessa, 9–11px. */
      if (horizontal) {
        R(ctx, x + ox - 3, y + oy, 8, 2, tones[0]);
        R(ctx, x + ox - 1, y + oy + 2, 5, 2, tones[1]);
      } else {
        R(ctx, x + ox, y + oy - 3, 2, 8, tones[0]);
        R(ctx, x + ox + 2, y + oy - 1, 2, 5, tones[1]);
      }
    } else if (family === 1) {
      /* Abrasione a losanga: due valori vicini, nessun pixel isolato. */
      R(ctx, x + ox - 4, y + oy, 9, 2, tones[0]);
      R(ctx, x + ox - 2, y + oy - 2, 5, 6, tones[1]);
      R(ctx, x + ox - 1, y + oy + 4, 3, 1, tones[0]);
    } else {
      /* Solco corto a gomito parallelo al flusso. */
      if (horizontal) {
        R(ctx, x + ox - 3, y + oy, 8, 2, tones[1]);
        R(ctx, x + ox + 2, y + oy + 2, 3, 3, tones[0]);
      } else {
        R(ctx, x + ox, y + oy - 3, 2, 8, tones[1]);
        R(ctx, x + ox + 2, y + oy + 2, 3, 3, tones[0]);
      }
    }
  }

  function townGrassCluster(ctx, x, y, tx, ty, rows) {
    var near = false;
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(function (d) {
      var ch = cell(rows, tx + d[0], ty + d[1]);
      if (ch && 'TY0123456789Dr-:=pu'.indexOf(ch) >= 0) near = true;
    });
    /* Una/due ancore per campo macro 80x64, mai selezione casuale tile-per-tile. */
    var mx = Math.floor(tx / 5), my = Math.floor(ty / 4);
    var lx = ((tx % 5) + 5) % 5, ly = ((ty % 4) + 4) % 4;
    var mh = hash(mx, my, 0x724);
    var primary = lx === (mh % 5) && ly === ((mh >>> 5) % 4);
    var secondary = near && lx === ((mh >>> 9) % 5) && ly === ((mh >>> 13) % 4);
    if (!primary && !secondary) return;
    var v = hash(tx, ty, mh ^ 0x73b);
    var family = (v >>> 6) % 3;
    var ox = 3 + ((v >>> 9) % 7), oy = 4 + ((v >>> 13) % 7);
    if (near) {
      var driftTone = (v & 0x10000) ? '#7ecba1' : '#8bd6aa';
      grassDriftBlob(ctx, x + 8, y + 8,
        8, 3 + ((v >>> 23) & 1), driftTone, v ^ 0x734);
      R(ctx, x + 2 + ((v >>> 21) & 1), y + 7 + ((v >>> 22) & 1),
        11, 2, driftTone);
    }
    if (family === 0) {
      /* Ciuffo corto: tre lame unite e basse, mai tick isolati. */
      R(ctx, x + ox - 3, y + oy + 1, 8, 2, '#78c79d');
      R(ctx, x + ox - 1, y + oy - 1, 2, 2, HG.grassHi);
      R(ctx, x + ox + 3, y + oy, 2, 2, HG.grassMid);
    } else if (family === 1) {
      /* Trifoglio scuro: rosetta compatta in un solo gruppo. */
      R(ctx, x + ox - 3, y + oy, 3, 3, HG.grassDark);
      R(ctx, x + ox, y + oy - 2, 3, 3, HG.grassMid);
      R(ctx, x + ox + 2, y + oy + 1, 3, 3, HG.grassDark);
      R(ctx, x + ox - 1, y + oy + 2, 5, 1, '#639b72');
    } else {
      /* Aghi pallidi con un solo bocciolo: chiaro ma sotto attori/porte. */
      R(ctx, x + ox - 3, y + oy + 2, 8, 1, '#91dab0');
      R(ctx, x + ox - 1, y + oy - 1, 2, 4, HG.grassMid);
      R(ctx, x + ox - 3, y + oy + 1, 4, 2, '#78c79d');
      R(ctx, x + ox + 3, y + oy, 1, 3, '#91dab0');
      R(ctx, x + ox - 2, y + oy - 2, 3, 2, '#c1ddb0');
    }
  }

  /* Superfici cittadine: deriva macro 80–96px, valori vicini e confini
   * organici 1–3px. Nessuna zona rettangolare o checkerboard tile. */
  function townGround(ctx, x, y, tx, ty, rows) {
    if (GAME.Diorama && GAME.Diorama.surface(ctx, '.', x, y, tx, ty, rows, false)) {
      groundShadow(ctx, x, y, tx, ty, rows);
      return;
    }
    var base = townGrassFieldTone(tx, ty);
    R(ctx, x, y, 16, 16, base);
    var macroX = ((tx % 6) + 6) % 6, macroY = ((ty % 5) + 5) % 5;
    var edge, band;
    if (macroX === 0) {
      edge = townGrassFieldTone(tx - 1, ty);
      for (band = 0; band < 16; band++) {
        var ew = townContinuousEdge(tx, ty * 16 + band, 0x733);
        R(ctx, x, y + band, ew, 1, edge);
      }
    }
    if (macroY === 0) {
      edge = townGrassFieldTone(tx, ty - 1);
      for (band = 0; band < 16; band++) {
        var eh = townContinuousEdge(ty, tx * 16 + band, 0x734);
        R(ctx, x + band, y, 1, eh, edge);
      }
    }
    /* Quasi tutto il campo resta quieto. Tre famiglie connesse, piu'
     * presenti vicino a chiome e facciate: prato, non coriandoli. */
    townGrassCluster(ctx, x, y, tx, ty, rows);
    groundShadow(ctx, x, y, tx, ty, rows);
  }

  function townPath(ctx, x, y, tx, ty, rows) {
    townGround(ctx, x, y, tx, ty, rows);
    var leftCh = cell(rows, tx - 1, ty), rightCh = cell(rows, tx + 1, ty);
    var upCh = cell(rows, tx, ty - 1), downCh = cell(rows, tx, ty + 1);
    var left = townTravelCell(leftCh), right = townTravelCell(rightCh);
    var up = townTravelCell(upCh), down = townTravelCell(downCh);
    var phase = hash(tx, ty, 0x76) & 7;
    for (var band = 0; band < 16; band++) {
      var edge = townSurfaceInsets(tx, ty, 0x760, band, left, right, up, down);
      townSurfaceBand(ctx, x, y, band, edge[0], edge[1], HG.path, HG.pathMid);
    }
    var pathField = townGrassFieldTone(tx, ty);
    if (!up) townHorizontalCap(ctx, x, y, tx, ty, 0x7601, true, pathField);
    if (!down) townHorizontalCap(ctx, x, y, tx, ty, 0x7602, false, pathField);
    var pathHorizontal = (left || right) && !(up || down) ? true :
      (!(left || right) && (up || down) ? false : ((phase & 1) === 0));
    townSurfaceWear(ctx, x, y, tx, ty, pathHorizontal,
      [HG.pathMid, '#cbb57d'], 0x7617, 3);
    if (left && leftCh !== 'p') townMaterialJoin(ctx, x, y, 'left', HG.pathMid, hash(tx, ty, 0x7621));
    if (right && rightCh !== 'p') townMaterialJoin(ctx, x, y, 'right', HG.pathMid, hash(tx, ty, 0x7622));
    if (up && upCh !== 'p') townMaterialJoin(ctx, x, y, 'up', HG.pathMid, hash(tx, ty, 0x7623));
    if (down && downCh !== 'p') townMaterialJoin(ctx, x, y, 'down', HG.pathMid, hash(tx, ty, 0x7624));
    groundShadow(ctx, x, y, tx, ty, rows);
  }

  function townRoad(ctx, x, y, tx, ty, rows) {
    var leftCh = cell(rows, tx - 1, ty), rightCh = cell(rows, tx + 1, ty);
    var upCh = cell(rows, tx, ty - 1), downCh = cell(rows, tx, ty + 1);
    var left = townTravelCell(leftCh), right = townTravelCell(rightCh);
    var up = townTravelCell(upCh), down = townTravelCell(downCh);
    var phase = hash(tx, ty, 0x793) & 7;

    /* Terra battuta calda: quattro valori. Profilo nasce da bande globali
     * 2px, con transizione materica 1–3px invece del vecchio cordolo cyan. */
    townGround(ctx, x, y, tx, ty, rows);
    for (var band = 0; band < 16; band++) {
      var edge = townSurfaceInsets(tx, ty, 0x7930, band, left, right, up, down);
      townSurfaceBand(ctx, x, y, band, edge[0], edge[1], HG.road, HG.roadMid);
    }
    var roadField = townGrassFieldTone(tx, ty);
    if (!up) townHorizontalCap(ctx, x, y, tx, ty, 0x7932, true, roadField);
    if (!down) townHorizontalCap(ctx, x, y, tx, ty, 0x7933, false, roadField);
    /* Quattro famiglie locali e direzionali; 7/8 resta campo calmo. */
    var roadHorizontal = (left || right) && !(up || down) ? true :
      (!(left || right) && (up || down) ? false : ((phase & 1) === 0));
    var junction = (left ? 1 : 0) + (right ? 1 : 0) + (up ? 1 : 0) + (down ? 1 : 0);
    townSurfaceWear(ctx, x, y, tx, ty, roadHorizontal,
      ['#d4be84', HG.roadMid], 0x7931, 2);
    townRoadDetailCluster(ctx, x, y, tx, ty, roadHorizontal, junction, 0x7935);
    /* Piccole intrusioni del prato ora vivono nel profilo macro continuo:
     * nessun hook locale ristampa la costruzione a tile della carreggiata. */
    var field = townGrassFieldTone(tx, ty);
    var bay = hash(tx, ty, 0x7937);
    var nw = townTravelCell(cell(rows, tx - 1, ty - 1));
    var ne = townTravelCell(cell(rows, tx + 1, ty - 1));
    var sw = townTravelCell(cell(rows, tx - 1, ty + 1));
    var se = townTravelCell(cell(rows, tx + 1, ty + 1));
    if (left && up && !nw) townLayeredCorner(ctx, x, y, 'nw', field, true, HG.roadMid, bay ^ 0x11);
    if (right && up && !ne) townLayeredCorner(ctx, x, y, 'ne', field, true, HG.roadMid, bay ^ 0x23);
    if (left && down && !sw) townLayeredCorner(ctx, x, y, 'sw', field, true, HG.roadMid, bay ^ 0x35);
    if (right && down && !se) townLayeredCorner(ctx, x, y, 'se', field, true, HG.roadMid, bay ^ 0x47);
    if (!left && !up && (right || down)) townLayeredCorner(ctx, x, y, 'nw', field, false, HG.roadMid, bay ^ 0x59);
    if (!right && !up && (left || down)) townLayeredCorner(ctx, x, y, 'ne', field, false, HG.roadMid, bay ^ 0x6b);
    if (!left && !down && (right || up)) townLayeredCorner(ctx, x, y, 'sw', field, false, HG.roadMid, bay ^ 0x7d);
    if (!right && !down && (left || up)) townLayeredCorner(ctx, x, y, 'se', field, false, HG.roadMid, bay ^ 0x8f);
    if (junction >= 3) {
      /* Junction visual-only: offset e feather continuo da 1–3px. */
      var jd = 2 + (bay & 1);
      var firstCorner = ['nw','se','ne','sw'][(bay >>> 8) & 3];
      townJunctionFeather(ctx, x, y, firstCorner, field, jd, bay);
      if (((bay >>> 10) & 3) === 0) {
        var secondCorner = firstCorner === 'nw' ? 'se' : (firstCorner === 'se' ? 'nw' :
          (firstCorner === 'ne' ? 'sw' : 'ne'));
        townJunctionFeather(ctx, x, y, secondCorner, field, Math.max(2, jd - 1), bay >>> 3);
      }
    }
    if (left && !roadCell(leftCh)) townMaterialJoin(ctx, x, y, 'left', HG.roadMid, hash(tx, ty, 0x7941));
    if (right && !roadCell(rightCh)) townMaterialJoin(ctx, x, y, 'right', HG.roadMid, hash(tx, ty, 0x7942));
    if (up && !roadCell(upCh)) townMaterialJoin(ctx, x, y, 'up', HG.roadMid, hash(tx, ty, 0x7943));
    if (down && !roadCell(downCh)) townMaterialJoin(ctx, x, y, 'down', HG.roadMid, hash(tx, ty, 0x7944));
  }

  /* Marciapiede = calcestruzzo, non la stessa terra battuta del sentiero.
   * Piano piatto (niente speckle), giunto di getto ogni 48px in coordinate
   * mondo, una scaglia rada da 1px e cordolo sul lato che guarda la
   * carreggiata. I valori sono diurni come tutto il town: dopo il grade di
   * js/town-dusk.js atterrano sullo stack del lotto Double R — #a9a38f
   * base, #898a7a giunto, #777b70 cordolo. Restano tutti sotto la soglia
   * di saturazione della famiglia vegetazione (0.22) del grade, altrimenti
   * il marciapiede verrebbe scurito come se fosse prato. */
  var WALK = { slab: '#ffffd8', seam: '#eaebc4', chip: '#fffff2', kerb: '#d9dfc4' };

  function townSidewalk(ctx, x, y, tx, ty, rows, opts) {
    townGround(ctx, x, y, tx, ty, rows);
    var leftCh = semanticCell(rows, tx - 1, ty, opts), rightCh = semanticCell(rows, tx + 1, ty, opts);
    var upCh = semanticCell(rows, tx, ty - 1, opts), downCh = semanticCell(rows, tx, ty + 1, opts);
    var left = townTravelCell(leftCh), right = townTravelCell(rightCh);
    var up = townTravelCell(upCh), down = townTravelCell(downCh);
    for (var band = 0; band < 16; band++) {
      var edge = townSurfaceInsets(tx, ty, 0x7810, band, left, right, up, down);
      townSurfaceBand(ctx, x, y, band, edge[0], edge[1], WALK.slab, WALK.seam);
    }
    var walkField = townGrassFieldTone(tx, ty);
    if (!up) townHorizontalCap(ctx, x, y, tx, ty, 0x7812, true, walkField);
    if (!down) townHorizontalCap(ctx, x, y, tx, ty, 0x7813, false, walkField);
    /* Giunti ogni 48px: la lastra resta continua fra le tile, nessun
     * reticolo per tile. */
    if ((tx % 3) === 0) R(ctx, x, y, 1, 16, WALK.seam);
    if ((ty % 3) === 0) R(ctx, x, y, 16, 1, WALK.seam);
    /* Una sola scaglia ogni otto tile circa: accento, mai tessitura. */
    var chip = hash(tx, ty, 0x7818);
    if ((chip & 7) === 0) {
      R(ctx, x + 4 + ((chip >>> 3) % 8), y + 4 + ((chip >>> 7) % 8), 1, 1, WALK.chip);
    }
    /* Cordolo sul lato che guarda la carreggiata. */
    if (roadCell(upCh)) R(ctx, x, y, 16, 1, WALK.kerb);
    if (roadCell(downCh)) R(ctx, x, y + 15, 16, 1, WALK.kerb);
    if (roadCell(leftCh)) R(ctx, x, y, 1, 16, WALK.kerb);
    if (roadCell(rightCh)) R(ctx, x + 15, y, 1, 16, WALK.kerb);
    if (left && leftCh !== '=') townMaterialJoin(ctx, x, y, 'left', WALK.seam, hash(tx, ty, 0x7821));
    if (right && rightCh !== '=') townMaterialJoin(ctx, x, y, 'right', WALK.seam, hash(tx, ty, 0x7822));
    if (up && upCh !== '=') townMaterialJoin(ctx, x, y, 'up', WALK.seam, hash(tx, ty, 0x7823));
    if (down && downCh !== '=') townMaterialJoin(ctx, x, y, 'down', WALK.seam, hash(tx, ty, 0x7824));
    groundShadow(ctx, x, y, tx, ty, rows);
  }

  function townGravel(ctx, x, y, tx, ty, rows) {
    townGround(ctx, x, y, tx, ty, rows);
    townSurfaceWear(ctx, x, y, tx, ty, (hash(tx, ty, 0x771) & 1) === 0,
      [HG.pathMid, '#cbb57d'], 0x772, 6);
  }

  function paintGroundSurface(ctx, ground, x, y, tx, ty, rows, opts) {
    var town = opts && opts.mapId === 'town';
    if (ground === 'u') town ? townGravel(ctx, x, y, tx, ty, rows) : gravel(ctx, x, y, tx, ty, rows);
    else if (ground === '=') town ? townSidewalk(ctx, x, y, tx, ty, rows, opts) : sidewalk(ctx, x, y, tx, ty, rows, opts);
    else if (ground === 'p') town ? townPath(ctx, x, y, tx, ty, rows) : path(ctx, x, y, tx, ty, rows);
    else if (ground === 'r') town ? townRoad(ctx, x, y, tx, ty, rows) : road(ctx, x, y, tx, ty, rows);
    else town ? townGround(ctx, x, y, tx, ty, rows) : grass(ctx, x, y, tx, ty, false, false, rows);
  }

  /* Props urbani authored sul layer terreno esplicito. Forme strette e
   * leggibili a 1x, massimo quattro valori per oggetto. */
  function groundedProp(ctx, ch, ground, x, y, tx, ty, rows, opts) {
    var i, propInk = opts && opts.mapId === 'town' ? '#315a49' : C.ink;
    paintGroundSurface(ctx, ground, x, y, tx, ty, rows, opts);
    /* Il cartello d'ingresso ha un pannello hero continuo 42x22. Il glifo S
     * conserva collisione/interazione, ma non disegna un secondo pannello. */
    if (ch === 'S' && opts && opts.mapId === 'town' && tx === 30 && ty === 30) return;
    softPixelShadow(ctx, x + 2, y + 12, 13, 4, HG.shadowDark, HG.shadow);
    if (ch === 'S') {
      R(ctx, x + 3, y + 8, 2, 8, C.ink); R(ctx, x + 11, y + 8, 2, 8, C.ink);
      R(ctx, x + 2, y + 1, 12, 9, C.ink); R(ctx, x + 3, y + 2, 10, 7, C.paper);
      R(ctx, x + 5, y + 4, 6, 1, C.dark); R(ctx, x + 4, y + 6, 8, 1, C.dark);
    } else if (ch === 'L') {
      R(ctx, x + 5, y + 13, 6, 3, propInk); R(ctx, x + 7, y + 3, 2, 11, propInk);
      R(ctx, x + 4, y, 8, 5, propInk); R(ctx, x + 5, y + 1, 6, 3, C.gold);
    } else if (ch === 'P') {
      R(ctx, x + 6, y + 1, 3, 15, propInk); R(ctx, x + 7, y + 2, 1, 14, C.wood);
      R(ctx, x + 3, y + 3, 10, 2, propInk); R(ctx, x + 4, y + 2, 2, 2, C.paper);
      R(ctx, x + 11, y + 2, 2, 2, C.paper);
    } else if (ch === 'B') {
      R(ctx, x + 2, y + 5, 12, 3, propInk); R(ctx, x + 3, y + 5, 10, 2, C.wood);
      R(ctx, x + 1, y + 8, 14, 4, propInk); R(ctx, x + 2, y + 8, 12, 2, '#a87542');
      R(ctx, x + 3, y + 12, 2, 4, propInk); R(ctx, x + 11, y + 12, 2, 4, propInk);
    } else if (ch === 'A') {
      R(ctx, x + 2, y + 3, 12, 11, propInk); R(ctx, x + 3, y + 4, 10, 9, '#5c4a32');
      for (i = 0; i < 5; i++) {
        R(ctx, x + 4 + ((i * 5) % 8), y + 5 + ((i * 3) % 6), 2, 2,
          i % 3 === 0 ? C.gold : (i % 3 === 1 ? C.red : C.paper));
      }
    } else if (ch === 'H') {
      R(ctx, x + 6, y + 4, 5, 10, propInk); R(ctx, x + 7, y + 5, 3, 8, C.red);
      R(ctx, x + 5, y + 3, 7, 3, propInk); R(ctx, x + 6, y + 3, 5, 2, '#d05a58');
      R(ctx, x + 4, y + 8, 3, 3, C.red); R(ctx, x + 10, y + 8, 3, 3, C.red);
      R(ctx, x + 5, y + 13, 7, 2, propInk);
    } else if (ch === 'E') {
      R(ctx, x + 7, y + 9, 2, 7, propInk); R(ctx, x + 3, y + 3, 10, 7, propInk);
      R(ctx, x + 4, y + 4, 8, 5, '#59758a'); R(ctx, x + 11, y + 4, 2, 4, C.red);
    } else if (ch === 'G') {
      /* Lapide top-down sul vero sottofondo: niente carrier d'erba quadrato
       * quando la seconda fila poggia sul marciapiede. */
      R(ctx, x + 3, y + 12, 10, 3, propInk);
      R(ctx, x + 4, y + 4, 8, 9, '#85877f');
      R(ctx, x + 5, y + 3, 6, 2, '#c3c4b2');
      R(ctx, x + 5, y + 5, 6, 6, '#a9aaa0');
      R(ctx, x + 6, y + 7, 4, 1, '#85877f');
      R(ctx, x + 2, y + 14, 12, 2, '#85877f');
    } else if (ch === 'q') {
      R(ctx, x + 2, y + 3, 12, 12, propInk); R(ctx, x + 3, y + 4, 10, 9, '#8d6541');
      R(ctx, x + 4, y + 5, 8, 2, '#c79a57'); R(ctx, x + 7, y + 4, 2, 9, propInk);
      R(ctx, x + 3, y + 13, 10, 2, '#573d31');
    }
  }

  /* Il tile V conserva solo terreno e collisione. Sagoma intera vive nel
   * pass strutture: nessuna meta' viene cancellata dal tile adiacente. */
  function parkedCar(ctx, x, y, tx, ty, rows, opts) {
    if (opts && opts.mapId === 'arrival') arrivalGround(ctx, x, y, tx, ty);
    else if (opts && opts.mapId === 'town') paintGroundSurface(ctx, groundAt(opts, tx, ty) || 'p', x, y, tx, ty, rows, opts);
    else path(ctx, x, y, tx, ty, rows);
  }

  function bush(ctx, x, y, tx, ty, rows, night, paleGround) {
    if (paleGround) arrivalGround(ctx, x, y, tx, ty);
    else R(ctx, x, y, 16, 16, night ? '#7770a8' : C.grass);
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

  function floor(ctx, x, y, tx, ty, carpet, mapId) {
    var yy, seam;
    /* Profilo per luogo: pattern e ritmo sopravvivono alla master palette
     * monocromatica. Prima tutti gli interni finivano come lo stesso parquet. */
    if (!carpet && mapId === 'hospital') {
      R(ctx, x, y, 16, 16, '#f1f4e6');
      R(ctx, x, y + 7, 16, 1, '#8faaa4'); R(ctx, x + 7, y, 1, 16, '#8faaa4');
      if (((tx + ty) & 1) === 0) { R(ctx, x + 2, y + 2, 3, 3, '#d4dfda'); R(ctx, x + 10, y + 10, 3, 3, '#d4dfda'); }
      else { R(ctx, x + 10, y + 2, 3, 3, '#d4dfda'); R(ctx, x + 2, y + 10, 3, 3, '#d4dfda'); }
      return;
    }
    if (!carpet && mapId === 'diner') {
      R(ctx, x, y, 16, 16, C.paper);
      for (var fy = 0; fy < 16; fy += 4) for (var fx = 0; fx < 16; fx += 4) {
        if ((((tx * 4 + fx / 4) + (ty * 4 + fy / 4)) & 1) === 0) R(ctx, x + fx, y + fy, 4, 4, '#9aab69');
      }
      return;
    }
    if (!carpet && mapId === 'oej') {
      R(ctx, x, y, 16, 16, '#493b50');
      if (((tx + ty) & 3) === 0) {
        R(ctx, x + 7, y + 4, 2, 2, '#9a7452'); R(ctx, x + 4, y + 7, 2, 2, '#684351');
        R(ctx, x + 10, y + 7, 2, 2, '#684351'); R(ctx, x + 7, y + 10, 2, 2, '#9a7452');
      }
      return;
    }
    if (!carpet && mapId === 'roadhouse') {
      R(ctx, x, y, 16, 16, '#9aab69');
      for (yy = 0; yy < 16; yy += 8) {
        R(ctx, x, y + yy, 16, 2, C.mid); R(ctx, x, y + yy + 2, 16, 1, '#dcd9a9');
        R(ctx, x + ((((ty + yy) >> 3) & 1) ? 4 : 12), y + yy + 3, 1, 5, C.mid);
      }
      return;
    }
    if (!carpet && mapId === 'hotel_gn') {
      R(ctx, x, y, 16, 16, '#dcd9a9');
      R(ctx, x + 4, y + 4, 8, 1, '#9aab69'); R(ctx, x + 4, y + 11, 8, 1, '#9aab69');
      if (((tx + ty) & 3) === 0) { R(ctx, x + 7, y + 2, 2, 2, C.mid); R(ctx, x + 7, y + 13, 2, 1, C.mid); }
      return;
    }
    if (!carpet && mapId === 'palmer') {
      R(ctx, x, y, 16, 16, '#dcd9a9');
      for (yy = 0; yy < 16; yy += 8) {
        R(ctx, x, y + yy, 16, 1, '#9aab69');
        seam = ((tx + ty + yy / 8) & 1) ? 5 : 13;
        R(ctx, x + seam, y + yy + 1, 1, 7, C.paper);
      }
      return;
    }
    if (carpet) {
      if (mapId === 'palmer') {
        R(ctx, x, y, 16, 16, '#9aab69');
        R(ctx, x, y, 16, 2, '#dcd9a9'); R(ctx, x, y + 14, 16, 2, C.mid);
        R(ctx, x, y, 2, 16, '#dcd9a9'); R(ctx, x + 14, y, 2, 16, C.mid);
        if (((tx + ty) & 1) === 0) {
          R(ctx, x + 7, y + 5, 2, 2, C.paper); R(ctx, x + 5, y + 7, 6, 2, C.mid);
          R(ctx, x + 7, y + 9, 2, 2, C.paper);
        }
        return;
      }
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

  /* Zig-zag continuo in coordinate mondo. Nessuna dipendenza dal bordo del
   * tile: la V attraversa tutte le metatile senza trasformarsi in righe. */
  function redRoomFloor(ctx, x, y, tx, ty) {
    var px, py, wx, wy, phase, tri, d;
    R(ctx, x, y, 16, 16, '#eee6b5');
    for (py = 0; py < 16; py++) {
      wy = ty * 16 + py;
      for (px = 0; px < 16; px++) {
        wx = tx * 16 + px;
        phase = ((wx % 32) + 32) % 32;
        tri = phase < 16 ? phase : 32 - phase;
        d = ((wy - tri) % 24 + 24) % 24;
        if (d < 3) R(ctx, x + px, y + py, 1, 1, C.ink);
      }
    }
  }

  /* [roofBase, roofRidge, facadeBase, facadeTrim]. Ogni landmark ha una
   * coppia tetto/facciata propria (tabella firme del contratto R52): il
   * tetto non e' mai lo stesso colore della facciata sotto. */
  var BUILDINGS = {
    '0': ['#713943','#b6625d','#d9c78d','#435a50'], // bottega/casa: tetto bordeaux, fronte salvia
    '1': ['#2f4d63','#5c8098','#dbc78d','#213648'], // sceriffo: tetto blu-ardesia
    '2': ['#8f2430','#c1585a','#e4cfa3','#4c1119'], // diner: tetto rosso, clapboard crema (quality bar 2026-09-07)
    '3': ['#754429','#a9754f','#ecd7a4','#4a2f22'], // Palmer: tetto a due falde marrone
    '4': ['#2c5334','#5c8a52','#a9805a','#3c2a1e'], // Great Northern: tetto verde scuro
    '5': ['#c7d6d2','#ecf5ef','#f1f4e6','#8faaa4'], // ospedale: tetto/facciata chiari
    '6': ['#2c1a1f','#5c3a3a','#c06a4e','#1c1418'], // roadhouse: tetto scuro, legno rosso (facciata schiarita: R58, tetto/facciata erano quasi lo stesso valore)
    '7': ['#3c2a1e','#6f5238','#a9805a','#3c2a1e'],
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

  /* Casa di legno dell'arrivo: 4x4 tile, timpano scuro, assi orizzontali,
   * finestre gemelle, porta centrale e veranda. Sagoma distinta dal negozio. */
  function arrivalCabin(ctx, x, y, tx, ty, rows) {
    var q = blobLocal(rows, tx, ty, 'J'), lx = q.x, ly = q.y;
    var roofTop = [9, 2, 9][lx] || 2;
    arrivalGround(ctx, x, y, tx, ty);
    if (ly === 0) {
      R(ctx, x, y + roofTop, 16, 16 - roofTop, C.ink);
      R(ctx, x, y + roofTop + 2, 16, 2, '#34572d');
      R(ctx, x, y + roofTop + 5, 16, 2, '#6a8a43');
      if (lx === 0) R(ctx, x + 2, y + roofTop + 1, 14, 1, '#9aab69');
      if (lx === 2) R(ctx, x, y + roofTop + 1, 14, 1, '#9aab69');
    } else if (ly === 1) {
      R(ctx, x, y + roofTop, 16, 16 - roofTop, C.ink);
      R(ctx, x, y + roofTop + 2, 16, 2, '#34572d');
      R(ctx, x, y + roofTop + 5, 16, 2, '#6a8a43');
      R(ctx, x, y + 14, 16, 2, '#9aab69');
    } else if (ly === 2) {
      R(ctx, x, y, 16, 16, '#6a8a43');
      for (var sy = 2; sy < 16; sy += 4) R(ctx, x, y + sy, 16, 1, '#34572d');
      if (lx === 0 || lx === 2) {
        R(ctx, x + 3, y + 4, 10, 9, C.ink); R(ctx, x + 5, y + 6, 6, 5, '#dcd9a9');
        R(ctx, x + 8, y + 6, 1, 5, C.ink); R(ctx, x + 5, y + 8, 6, 1, C.ink);
      } else {
        R(ctx, x + 3, y, 10, 16, C.ink); R(ctx, x + 5, y + 2, 7, 14, '#34572d');
        R(ctx, x + 10, y + 9, 1, 1, '#dcd9a9');
      }
    } else {
      R(ctx, x, y, 16, 5, '#6a8a43'); R(ctx, x, y + 5, 16, 3, C.ink);
      if (lx === 0 || lx === 2) {
        R(ctx, x + 2, y + 5, 2, 11, C.ink); R(ctx, x + 12, y + 5, 2, 11, C.ink);
        R(ctx, x + 4, y + 8, 8, 2, '#9aab69');
      } else {
        R(ctx, x, y + 8, 16, 3, '#9aab69'); R(ctx, x + 2, y + 12, 12, 2, '#6a8a43');
        R(ctx, x + 4, y + 15, 8, 1, C.ink);
      }
    }
    if (lx === 0) R(ctx, x, y + roofTop, 2, 16 - roofTop, C.ink);
    if (lx === 2) R(ctx, x + 14, y + roofTop, 2, 16 - roofTop, C.ink);
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

  /* R70 — hero accents continui per gli edifici di Twin Peaks.
   *
   * I tile restano 16x16 e governano collisione/interazione. Questo layer
   * aggiunge la parte che un edificio non puo' esprimere bene un tile alla
   * volta: timpani, verande, insegne e pensiline che attraversano piu'
   * colonne. E' lo stesso principio della scena d'arrivo: silhouette prima,
   * micro-dettaglio dopo. Coordinate in tile intenzionalmente esplicite:
   * sono firme dei landmark, non nuova geometria di gioco. */
  function townGable(g, center, top, widths, roof, light) {
    var i, w;
    for (i = 0; i < widths.length; i++) {
      w = widths[i];
      R(g, center - w, top + i * 2, w * 2, 2, roof);
      R(g, center - w, top + i * 2, 2, 2, C.ink);
      R(g, center + w - 2, top + i * 2, 2, 2, C.ink);
      if (w > 4 && (i & 1)) R(g, center - w + 2, top + i * 2 + 1, w * 2 - 4, 1, light);
    }
    R(g, center - widths[0], top, widths[0] * 2, 1, C.ink);
    R(g, center - widths[widths.length - 1], top + widths.length * 2,
      widths[widths.length - 1] * 2, 2, C.ink);
  }

  function townAwning(g, x, y, w, base, light) {
    var i;
    R(g, x - 2, y, w + 4, 2, C.ink);
    R(g, x - 1, y + 2, w + 2, 4, base);
    for (i = 1; i < w; i += 8) R(g, x + i, y + 2, 4, 4, light);
    R(g, x - 1, y + 6, w + 2, 2, C.ink);
    for (i = 1; i < w; i += 8) R(g, x + i, y + 8, 4, 2, light);
  }

  function townWindow(g, x, y, w, h, glass, trim) {
    R(g, x, y, w, h, C.ink);
    R(g, x + 1, y + 1, w - 2, h - 2, glass);
    R(g, x + (w >> 1), y + 1, 1, h - 2, trim);
    R(g, x + 1, y + (h >> 1), w - 2, 1, trim);
    /* Vetro selettivo e davanzale materiale: un riflesso, non reticolo. */
    if (w >= 12 && h >= 10) {
      R(g, x + 2, y + 2, Math.max(3, Math.floor(w * .28)), 1, lighter(glass, 28));
      R(g, x + w - 5, y + 3, 2, 2, lighter(glass, 14));
    }
    R(g, x - 1, y + h, w + 2, 2, trim);
    R(g, x + 1, y + h, w - 2, 1, lighter(trim, 14));
  }

  function townRoofTrim(g, x, y, w, cut, salt) {
    var ry = y - ROOF_LIFT, i;
    R(g, x - 3, ry - 1, w + 6, cut + 1, HG.grass);
    for (i = 4; i < w; i += 19) {
      if ((hash(i, salt, 0x75) & 1) === 0) R(g, x + i, ry + 2 + (i % Math.max(3, cut - 2)), 2, 1, '#9aab69');
    }
    R(g, x - 2, ry + cut, w + 4, 2, C.ink);
  }

  function townRoofGableMask(g, x, y, w) {
    var ry = y - ROOF_LIFT, i, cut;
    for (i = 0; i < 8; i++) {
      cut = Math.max(2, 24 - i * 3);
      R(g, x - 2, ry + i * 2, cut, 2, HG.grass);
      R(g, x + w - cut + 2, ry + i * 2, cut, 2, HG.grass);
    }
  }

  /* R78 — landmark chiusi. I vecchi accenti correggevano il tetto base con
   * rettangoli color prato: nelle sagome a L restavano linee sospese. Queste
   * primitive ridipingono l'intero volume visibile in un solo passaggio.
   * Collisione resta la sagoma ASCII sottostante; nessun prop fisico invade
   * il forecourt. */
  function townFacadeShell(g, x, y, w, h, p, shadowDx) {
    /* Contorno nativo 1px. Il vecchio guscio nero da 3px diventava 18-24px
     * su desktop e faceva sembrare ogni volume una primitive CSS. */
    var sx = shadowDx == null ? 7 : Math.max(6, 7 + shadowDx);
    var edge = shade(p[2], -68);
    /* Unica ombra SE morbida sul terreno. Il fianco scuro sotto e' materia,
     * non una seconda sagoma rettangolare. */
    /* Due lobi SE corti sostituiscono la vecchia barra larga quanto edificio. */
    var shadowA = Math.max(14, Math.round(w * .42));
    var shadowB = Math.max(10, Math.round(w * .24));
    softPixelShadow(g, x + Math.round(w * .18), y + h + 2, shadowA, 5, HG.shadowDark, HG.shadow);
    if (w >= 48) softPixelShadow(g, x + Math.round(w * .66), y + h + 3,
      shadowB, 4, HG.shadowDark, HG.shadow);
    R(g, x, y, w, h, p[2]);
    // Weathered horizontal timber: recessed joints, warm upper edges and
    // irregular grain remain behind all authored windows, signs and doors.
    for (var sidingY = 4; sidingY < h - 5; sidingY += 4) {
      R(g, x + 2, y + sidingY, w - 4, 1, shade(p[2], -18));
      R(g, x + 2, y + sidingY + 1, w - 4, 1, shade(p[2], 8));
      for (var grainX = 5; grainX < w - 8; grainX += 13) {
        var grain = hash(grainX, sidingY, w * 17 + h);
        R(g, x + grainX, y + sidingY + 2, 3 + (grain & 3), 1,
          shade(p[2], (grain & 4) ? -9 : 12));
      }
    }
    /* Pannelli midtone larghi ma bassi: spezzano la facciata senza creare
     * nuove finestre o competere con porte e insegne specifiche. */
    var panelW = Math.max(9, Math.round(w * .25));
    var panelH = Math.max(8, Math.round(h * .24));
    R(g, x + 5, y + Math.round(h * .27), panelW, panelH, lighter(p[2], 7));
    R(g, x + 7, y + Math.round(h * .27) + 2, Math.max(5, panelW - 4), panelH - 3, p[2]);
    R(g, x + w - panelW - 7, y + Math.round(h * .36), panelW, panelH, shade(p[2], -12));
    R(g, x + w - panelW - 5, y + Math.round(h * .36) + 2,
      Math.max(5, panelW - 4), panelH - 3, p[2]);
    /* Fianco destro visibile: piccolo piano materiale, non solo outline. */
    R(g, x + w, y + 4, sx, h - 1, shade(p[2], -42));
    R(g, x + w, y + 5, 1, h - 3, lighter(p[2], 8));
    R(g, x + w + sx - 1, y + 6, 1, h - 4, edge);
    R(g, x + w + 1, y + 7, Math.max(2, sx - 2), 2, shade(p[2], -24));
    R(g, x + w + 2, y + h - 8, Math.max(2, sx - 3), 3, shade(p[2], -55));
    R(g, x + w + 3, y + h - 5, Math.max(1, sx - 4), 2, edge);
    R(g, x + w - 4, y + 2, 3, h - 3, shade(p[2], -28));
    R(g, x + 2, y + h - 5, w - 3, 4, shade(p[2], -36));
    R(g, x, y, w, 1, edge); R(g, x, y + h - 1, w, 1, edge);
    R(g, x, y, 1, h, edge); R(g, x + w - 1, y, 1, h, edge);
    R(g, x + 1, y + 1, w - 2, 1, lighter(p[2], 18));
    /* Gronda, lesene e zoccolo universali: ogni landmark possiede profondità
     * prima dei dettagli specifici, senza guscio nero sovradimensionato. */
    R(g, x - 5, y - 6, w + 10, 1, edge);
    R(g, x - 4, y - 5, w + 8, 2, shade(p[0], -52));
    R(g, x - 3, y - 3, w + 6, 1, shade(p[0], -34));
    R(g, x - 1, y - 2, w + 2, 1, p[1]);
    var eavePart = Math.max(9, Math.round(w * .28));
    R(g, x - 2, y - 2, eavePart, 2, shade(p[0], -62));
    R(g, x + Math.round(w * .57), y - 2, eavePart, 2, shade(p[0], -55));
    R(g, x + 2, y + 4, 2, h - 10, lighter(p[2], 12));
    R(g, x + w - 6, y + 5, 3, h - 11, shade(p[2], -30));
    R(g, x + 2, y + h - 7, w - 5, 2, shade(p[2], -48));
    R(g, x + 4, y + h - 5, w - 9, 1, lighter(p[2], 8));
    /* La base incontra davvero il terreno: deposito scuro sotto il muro,
     * linea di luce sulla soglia e ombra corta spostata a sud-est. */
    R(g, x + 1, y + h - 3, w - 2, 2, shade(p[2], -58));
    R(g, x + 5, y + h - 3, Math.max(4, w - 13), 1, lighter(p[2], 5));
    R(g, x + 4, y + h - 1, Math.max(4, w - 9), 2, edge);
    R(g, x + 8, y + h + 1, Math.max(3, w - 12), 1, HG.vergeSoil);
    /* Due soli accenti materici: luce alta a sinistra, deposito basso a
     * destra. Il fianco riceve un giunto corto alla stessa quota. */
    var accentW = Math.max(5, Math.min(12, Math.floor(w / 7)));
    R(g, x + 7, y + 9, accentW, 1, lighter(p[2], 10));
    R(g, x + w - accentW - 9, y + h - 14, accentW, 1, shade(p[2], -22));
    if (sx > 4) {
      R(g, x + w + 2, y + 13, sx - 3, 1, lighter(p[2], 5));
      R(g, x + w + 1, y + h - 12, sx - 2, 1, shade(p[2], -50));
    }
  }

  function townRoofClusters(g, x, top, w, h, p, salt) {
    /* x/top sono coordinate schermo: usarle come seed rigenerava chiazze
     * tetto a ogni pixel di camera. Materiale e dimensioni identificano il
     * landmark senza dipendere dal viewport. */
    var materialSeed = parseInt(String(p[0] || '').replace('#', ''), 16) || 0;
    var layoutSeed = (salt ^ materialSeed ^ Math.imul(w, 131) ^ Math.imul(h, 313)) >>> 0;
    // Overlapping courses give the roof a material scale distinct from walls.
    // Inset follows the gable silhouette so texture cannot escape the roof.
    for (var course = 6; course < h - 3; course += 3) {
      var roofInset = Math.max(4, Math.ceil((1 - course / h) * Math.min(26, w * .28)));
      for (var shingle = roofInset + ((course & 1) ? 2 : 0); shingle < w - roofInset - 5; shingle += 6) {
        var wear = hash(shingle, course, layoutSeed);
        R(g, x + shingle, top + course, 5, 1, shade(p[0], 12 + (wear & 7)));
        R(g, x + shingle + 5, top + course, 1, 3, shade(p[0], -23));
        R(g, x + shingle, top + course + 2, 5, 1, shade(p[0], -15));
      }
    }
    var clusters = 3 + (hash(w, h, layoutSeed) & 1);
    for (var ci = 0; ci < clusters; ci++) {
      var v = hash(ci, w + h, layoutSeed + ci * 37);
      var cw = 7 + (v & 7);
      var cx = x + 4 + ((v >>> 5) % Math.max(1, w - cw - 8));
      var cy = top + 6 + ((v >>> 11) % Math.max(2, h - 12));
      R(g, cx, cy, cw, 1, shade(p[0], -28));
      R(g, cx + 2, cy + 2, Math.max(3, cw - 4), 1, p[1]);
      if ((v & 0x40) !== 0) R(g, cx - 2, cy + 4, Math.max(4, cw - 2), 1, shade(p[0], -18));
    }
    /* Ridge detail in two short pieces, never full-width stripe. */
    var ridgeW = Math.max(6, Math.min(14, Math.round(w * .18)));
    R(g, x + Math.round(w * .22), top + 3, ridgeW, 2, p[1]);
    R(g, x + Math.round(w * .62), top + 4, Math.max(5, ridgeW - 2), 1, shade(p[0], -30));
  }

  function townClosedFlat(g, x, y, w, h, p) {
    var roofH = Math.max(34, Math.min(46, Math.round(h * .72)));
    var roofEdge = shade(p[0], -70);
    townFacadeShell(g, x, y, w, h, p);
    R(g, x - 6, y - roofH, w + 12, roofH + 1, C.ink);
    R(g, x - 4, y - roofH + 2, w + 8, roofH - 2, p[0]);
    R(g, x - 2, y - roofH + 3, w + 4, 4, p[1]);
    townRoofClusters(g, x - 2, y - roofH + 2, w + 4, roofH - 4, p, 0x75a);
    /* Parapetto arretrato + fianco tetto: volume, non tappo frontale. */
    R(g, x + w + 4, y - roofH + 4, 6, roofH - 5, shade(p[0], -42));
    R(g, x + w + 4, y - roofH + 5, 2, roofH - 7, p[1]);
    R(g, x + 4, y - 7, w - 8, 2, shade(p[0], -38));
    R(g, x - 5, y - 6, w + 10, 1, roofEdge);
    R(g, x - 4, y - 5, w + 8, 2, shade(p[0], -44));
    R(g, x - 2, y - 3, w + 4, 1, p[1]);
    R(g, x, y - 2, w, 1, shade(p[0], -32));
    R(g, x + 2, y - 2, Math.max(9, Math.round(w * .31)), 2, shade(p[0], -58));
    R(g, x + Math.round(w * .61), y - 2, Math.max(8, Math.round(w * .25)), 2, shade(p[0], -52));
    R(g, x + w + 2, y - 3, 6, 3, shade(p[0], -58));
    R(g, x + w + 2, y - 3, 1, 2, p[1]);
  }

  function townClosedGable(g, x, y, w, h, p, shadowDx) {
    var i, inset, rowY, outerX, outerW;
    var roofH = Math.max(36, Math.min(48, Math.round(h * .75)));
    var roofSteps = Math.floor(roofH / 2);
    var maxInset = Math.min(26, Math.floor(w / 2) - 2);
    townFacadeShell(g, x, y, w, h, p, shadowDx);
    for (i = 0; i < roofSteps; i++) {
      inset = Math.max(0, Math.round(maxInset * (roofSteps - 1 - i) / Math.max(1, roofSteps - 1)));
      rowY = y - roofH + i * 2;
      outerX = x + inset - 2;
      outerW = w - inset * 2 + 4;
      R(g, outerX, rowY, outerW, 2, p[0]);
      R(g, outerX, rowY, 1, 2, C.ink); R(g, outerX + outerW - 1, rowY, 1, 2, C.ink);
      if (i === 0) R(g, outerX, rowY, outerW, 1, C.ink);
      if (i > 4 && (i % 5) === 1 && w - inset * 2 > 18) {
        R(g, x + inset + 5 + ((i * 7) % 11), rowY + 1,
          Math.min(11, Math.max(4, w - inset * 2 - 12)), 1, p[1]);
      }
    }
    /* Falda destra in ombra e gronda spessa separano tetto/facciata. */
    for (i = 4; i < roofSteps; i += 2) {
      inset = Math.max(0, Math.round(maxInset * (roofSteps - 1 - i) / Math.max(1, roofSteps - 1)));
      R(g, x + w - inset - 3, y - roofH + i * 2 + 1, 5, 2, shade(p[0], -42));
    }
    townRoofClusters(g, x, y - roofH, w, roofH - 4, p, 0x75b);
    R(g, x - 5, y - 6, w + 10, 1, shade(p[0], -70));
    R(g, x - 4, y - 5, w + 8, 2, shade(p[0], -44));
    R(g, x - 2, y - 3, w + 4, 1, p[1]);
    R(g, x, y - 2, w, 1, shade(p[0], -32));
    R(g, x + 2, y - 2, Math.max(10, Math.round(w * .32)), 2, shade(p[0], -60));
    R(g, x + Math.round(w * .60), y - 2, Math.max(9, Math.round(w * .27)), 2, shade(p[0], -54));
    R(g, x + w + 1, y - 4, 6, 4, shade(p[0], -58));
    R(g, x + w + 1, y - 4, 1, 3, p[1]);
  }

  function townTwinWindow(g, x, y, glass, trim) {
    R(g, x, y, 20, 12, C.ink);
    R(g, x + 2, y + 2, 7, 8, glass); R(g, x + 11, y + 2, 7, 8, glass);
    R(g, x + 9, y + 2, 2, 8, trim);
  }

  function townStep(g, x, y, w, light) {
    R(g, x - 3, y - 3, w + 6, 4, C.ink);
    R(g, x - 1, y - 2, w + 2, 2, light);
    R(g, x + 2, y + 1, w - 4, 4, shade(light, -34));
    R(g, x + 4, y + 1, w - 8, 2, light);
    R(g, x + 4, y + 5, w - 8, 3, C.ink);
    R(g, x + 7, y + 5, w - 14, 1, light);
    R(g, x + 7, y + 8, Math.max(4, w - 12), 3, HG.shadow);
  }


  function townSignIcon(g, kind, x, y) {
    if (kind === 'sheriff') {
      /* Stella stepped 14x14: centro stretto, sei punte separate. La vecchia
       * massa 10x10 era visivamente una croce medica. */
      R(g, x + 6, y, 2, 3, '#2f4d63');
      R(g, x + 5, y + 3, 4, 2, '#2f4d63');
      R(g, x, y + 5, 5, 2, '#2f4d63'); R(g, x + 9, y + 5, 5, 2, '#2f4d63');
      R(g, x + 3, y + 7, 8, 3, '#2f4d63');
      R(g, x + 3, y + 10, 3, 4, '#2f4d63'); R(g, x + 8, y + 10, 3, 4, '#2f4d63');
      R(g, x + 5, y + 6, 4, 4, '#dbc78d'); R(g, x + 6, y + 7, 2, 2, C.paper);
    } else if (kind === 'cup') {
      R(g, x + 1, y + 5, 10, 8, C.ink); R(g, x + 3, y + 3, 6, 2, C.ink);
      R(g, x + 11, y + 6, 5, 6, C.ink); R(g, x + 11, y + 8, 2, 2, C.paper);
      R(g, x, y + 13, 14, 2, C.ink); R(g, x + 4, y, 2, 3, C.ink); R(g, x + 8, y + 1, 2, 2, C.ink);
    } else if (kind === 'book') {
      R(g, x, y + 3, 15, 11, C.ink); R(g, x + 2, y + 5, 5, 6, C.paper); R(g, x + 9, y + 5, 5, 6, C.paper);
      R(g, x + 7, y + 4, 2, 9, '#697074'); R(g, x + 3, y + 6, 3, 1, '#697074'); R(g, x + 10, y + 6, 3, 1, '#697074');
    } else if (kind === 'note') {
      R(g, x + 8, y + 1, 4, 10, C.ink); R(g, x + 10, y + 1, 6, 4, C.ink);
      R(g, x + 3, y + 9, 9, 6, C.ink); R(g, x, y + 10, 7, 5, C.ink);
    } else if (kind === 'hammer') {
      R(g, x + 7, y + 5, 4, 10, C.ink); R(g, x + 1, y + 2, 11, 5, C.ink);
      R(g, x + 11, y + 3, 4, 3, C.ink);
    } else if (kind === 'paper') {
      R(g, x + 3, y + 1, 11, 14, C.ink); R(g, x + 1, y + 3, 11, 12, C.paper);
      R(g, x + 3, y + 5, 7, 2, C.ink); R(g, x + 3, y + 9, 5, 2, C.ink); R(g, x + 3, y + 13, 7, 1, C.ink);
    }
  }

  function townFirProp(g, x, y, h, light) {
    var row, w;
    for (row = 0; row < h - 5; row += 4) {
      w = Math.min(15, 3 + (row >> 1));
      R(g, x + 8 - (w >> 1), y + row, w, 3, C.ink);
      R(g, x + 9 - (w >> 1), y + row + 1, Math.max(1, w - 3), 1, light);
    }
    R(g, x + 7, y + h - 6, 3, 6, C.ink);
  }

  function townFoundationShadow(g, x, y, w, salt) {
    /* Ombra ancorata al landmark, non alla camera. Prima phase cambiava a
     * ogni scroll: lobi e dither saltavano sotto facciate immobili. */
    var phase = hash(w, salt || 0, 0x715);
    var count = w >= 72 ? 3 : 2;
    var lobeW = Math.max(13, Math.round(w / (count + .65)));
    var stride = Math.max(10, Math.round((w - lobeW - 12) / Math.max(1, count - 1)));
    /* Due/tre lobi sovrapposti, tutti spostati a sud-est. Nessuna barra
     * possiede piu' la larghezza dell'edificio. */
    for (var i = 0; i < count; i++) {
      var lx = x + 6 + i * stride + ((phase >>> (i * 3)) & 2);
      grassDriftBlob(g, lx + Math.round(lobeW * .55), y + 4 + (i & 1),
        Math.max(7, Math.round(lobeW * .55)), 2 + (i & 1),
        i === count - 1 ? HG.shadow : '#78c79d', phase ^ (i * 0x37));
      softPixelShadow(g, lx, y + 1 + (i & 1), lobeW, 4 + (i & 1), HG.shadowDark, HG.shadow);
      R(g, lx + 2, y, Math.max(8, lobeW - 4), 1, HG.vergeSoil);
      R(g, lx + 5, y + 1, Math.max(5, lobeW - 9), 1, HG.vergeShadow);
    }
  }

  function townWaterfallAccents(g, cx, cy) {
    var x = 1 * 16 - cx, y = -cy, i;
    /* Parete rocciosa a terrazze; cascata termina nel bacino w reale. */
    R(g, x - 4, y + 2, 17, 31, C.ink); R(g, x, y, 19, 11, '#34572d');
    R(g, x + 4, y + 10, 13, 23, '#6a8a43');
    R(g, x + 57, y + 1, 19, 32, C.ink); R(g, x + 53, y, 18, 11, '#34572d');
    R(g, x + 55, y + 10, 15, 23, '#6a8a43');
    for (i = 0; i < 4; i++) {
      R(g, x + 2 + i * 17, y + 4 + (i & 1) * 7, 10, 3, '#223b24');
      R(g, x + 5 + i * 15, y + 8 + ((i + 1) & 1) * 8, 7, 2, '#9aab69');
    }
    R(g, x + 10, y, 50, 5, '#223b24');
    R(g, x + 16, y + 2, 38, 4, '#526f98');
    /* Bordi a gradini, mai una cornice rettangolare chiusa. */
    R(g, x + 18, y + 6, 4, 10, C.ink); R(g, x + 20, y + 16, 3, 12, C.ink);
    R(g, x + 50, y + 6, 4, 9, C.ink); R(g, x + 49, y + 15, 3, 13, C.ink);
    R(g, x + 22, y + 6, 28, 10, '#526f98');
    R(g, x + 23, y + 16, 26, 12, '#526f98');
    R(g, x + 25, y + 28, 22, 8, '#526f98');
    for (i = 0; i < 6; i++) {
      R(g, x + 24 + ((i * 3) & 7), y + 8 + i * 5, 20 - (i & 1) * 4, 2, '#9bc0b2');
      R(g, x + 27 + ((i + 1) & 3), y + 8 + i * 5, 6, 1, '#dfe9df');
    }
    R(g, x + 8, y + 31, 56, 4, C.ink);
    /* Bacino a quattro terrazze: ogni massa d'acqua resta dentro tile w
     * reali. Le rive cambiano lato e profondita, quindi niente rettangolo. */
    R(g, x + 2, y + 35, 76, 12, '#526f98');
    R(g, x + 18, y + 47, 60, 16, '#6f9185');
    R(g, x + 2, y + 63, 60, 16, '#526f98');
    R(g, x + 18, y + 79, 44, 12, '#6f9185');
    R(g, x + 10, y + 36, 19, 3, '#dfe9df');
    R(g, x + 33, y + 39, 22, 3, C.paper);
    R(g, x + 58, y + 36, 14, 3, '#dfe9df');
    R(g, x + 23, y + 50, 38, 2, '#9bc0b2');
    R(g, x + 8, y + 67, 17, 2, '#9bc0b2');
    R(g, x + 32, y + 72, 23, 2, '#dfe9df');
    R(g, x + 25, y + 84, 29, 2, '#9bc0b2');
    /* Spruzzo sale davanti alla caduta, mai fuori dal bacino. */
    [[18,34],[25,31],[34,33],[44,30],[52,34]].forEach(function (p, pi) {
      R(g, x + p[0], y + p[1], 2, 2, pi & 1 ? C.paper : '#dfe9df');
      if (!(pi & 1)) R(g, x + p[0] + 3, y + p[1] - 2, 1, 1, '#9bc0b2');
    });
    /* Strati rocciosi interni spezzano le due pareti verticali. */
    [[0,24],[2,34],[64,24],[68,34],[0,55],[58,59],[8,76],[51,79]].forEach(function (p) {
      R(g, x + p[0], y + p[1], 9, 7, C.ink);
      R(g, x + p[0] + 2, y + p[1] + 1, 6, 3, '#6a8a43');
      R(g, x + p[0] + 4, y + p[1] + 4, 4, 1, '#9aab69');
    });
  }

  function townWelcomeAccents(g, cx, cy) {
    var x = 30 * 16 - cx, y = 30 * 16 - cy;
    /* Pannello 40x22, tre metatile scarse. Testo vero a 1x; supporto resta
     * dentro cella interattiva x30,y30. */
    R(g, x + 9, y - 3, 2, 19, C.ink); R(g, x + 10, y - 2, 1, 17, '#754429');
    R(g, x + 5, y - 23, 42, 22, C.ink);
    R(g, x + 6, y - 22, 40, 20, '#dcd9a9');
    R(g, x + 8, y - 20, 36, 16, '#9aab69');
    // Weathered painted cedar: grain stays behind the lettering.
    R(g, x + 6, y - 22, 40, 1, '#eee1af');
    R(g, x + 45, y - 21, 1, 19, '#605b3b');
    R(g, x + 8, y - 4, 36, 1, '#68744b');
    for (var grain = 0; grain < 6; grain++) {
      R(g, x + 9 + grain % 3, y - 19 + grain * 2.5, 31 - grain % 4, .5, 'rgba(49,65,38,.18)');
    }
    [[7,-21],[44,-21],[7,-3],[44,-3]].forEach(function (bolt) {
      R(g, x + bolt[0], y + bolt[1], 1, 1, '#545746');
    });
    townTinyWord(g, 'TWIN', x + 15, y - 20, C.ink);
    townTinyWord(g, 'PEAKS', x + 12, y - 12, C.ink);
    R(g, x + 7, y + 15, 6, 2, C.ink); R(g, x + 8, y + 15, 4, 1, '#9aab69');
    /* Due gruppi bassi incorniciano insegna; corridoio centrale resta quieto. */
    townFlowerBed(g, x - 17, y + 10, 2);
    townShrubCluster(g, x + 29, y + 9, HG.flowerPink);
  }

  function townLakeAccents(g, cx, cy) {
    var x = 4 * 16 - cx, y = 26 * 16 - cy, i;
    /* Firme solo su acqua già solida: riflessi, tronco e canneto non mentono
     * su passabilità. */
    for (i = 0; i < 5; i++) {
      R(g, x + 18 + i * 31, y + 10 + (i & 1) * 18, 18, 2, '#526f98');
      R(g, x + 23 + i * 31, y + 12 + (i & 1) * 18, 10, 1, '#c0d0e0');
    }
    R(g, x + 65, y + 39, 48, 6, C.ink);
    R(g, x + 69, y + 38, 40, 4, '#6a8a43');
    R(g, x + 77, y + 37, 6, 2, '#dcd9a9');
    /* Isolotto roccioso e riflesso di conifere: spezzano rettangolo d'acqua. */
    R(g, x + 116, y + 16, 30, 12, C.ink);
    R(g, x + 120, y + 17, 22, 8, '#6a8a43');
    R(g, x + 125, y + 13, 3, 9, '#34572d');
    R(g, x + 130, y + 9, 4, 13, '#34572d');
    R(g, x + 136, y + 15, 3, 7, '#34572d');
    R(g, x + 124, y + 27, 17, 2, '#526f98');
    /* Riflessi verticali di conifere dentro acqua solida. Profili diversi,
     * non icone copiate: il lago acquista profondita e memoria del bosco. */
    [128,158,187].forEach(function (rx, ri) {
      var ry = y + 14 + (ri & 1) * 7;
      for (var band = 0; band < 4; band++) {
        var rw = 5 + band * 4 - (ri === 2 && band > 1 ? 2 : 0);
        R(g, x + rx - (rw >> 1), ry + band * 5, rw, 3, band & 1 ? '#34572d' : '#526f98');
        R(g, x + rx - Math.max(1, (rw >> 1) - 2), ry + band * 5 + 1, Math.max(2, rw - 4), 1, '#9bc0b2');
      }
      R(g, x + rx - 2, ry + 20, 5, 2, '#34572d');
    });
    /* Secca rocciosa spezzata sulla riva sud. */
    [[139,67,13],[158,73,9],[177,64,12]].forEach(function (rock, ri) {
      R(g, x + rock[0], y + rock[1], rock[2], 6, C.ink);
      R(g, x + rock[0] + 2, y + rock[1] + 1, rock[2] - 4, 3, ri & 1 ? '#9aab69' : '#6a8a43');
      R(g, x + rock[0] + 4, y + rock[1] + 2, Math.max(2, rock[2] - 8), 1, C.paper);
    });
    /* Riva vicina spezzata: profilo scuro a gradini dentro ultime tile w.
     * Il bordo coincide con acqua non calpestabile, quindi resta onesto. */
    [[36,82,31,7],[72,87,24,6],[102,80,28,9],[134,88,19,5],[160,83,36,8]].forEach(function (bank, bi) {
      R(g, x + bank[0], y + bank[1], bank[2], bank[3], C.ink);
      R(g, x + bank[0] + 3, y + bank[1] + 1, bank[2] - 6, Math.max(2, bank[3] - 3), bi & 1 ? '#6a8a43' : '#34572d');
      R(g, x + bank[0] + 7, y + bank[1], Math.max(3, bank[2] - 14), 1, '#9aab69');
    });
    [[8,66],[20,69],[145,62],[157,67],[174,61]].forEach(function (reed, ri) {
      R(g, x + reed[0], y + reed[1] - (ri & 1) * 4, 2, 12 + (ri & 1) * 4, '#34572d');
      R(g, x + reed[0] - 3, y + reed[1] + 3, 4, 2, '#6a8a43');
      R(g, x + reed[0] + 1, y + reed[1] + 6, 4, 2, '#9aab69');
    });
    /* Piccolo pontile sulla sponda est, sempre sopra tile acqua/staccionata. */
    R(g, x + 174, y + 18, 34, 12, C.ink);
    R(g, x + 176, y + 20, 30, 8, '#a07850');
    for (i = 178; i < 205; i += 6) R(g, x + i, y + 21, 2, 6, '#d8c98a');
    /* Sponda est irregolare sopra acqua solida: roccia, reeds, ombra. */
    for (i = 0; i < 6; i++) {
      var shore = 4 + ((i * 5) & 7);
      R(g, x + 208 - shore, y + i * 16, shore, 16, '#34572d');
      R(g, x + 207 - shore, y + i * 16 + 3, 3, 5, '#6a8a43');
      R(g, x + 202, y + i * 16 + 11, 5, 2, '#9aab69');
    }
  }

  function townTracksAccents(g, map, cx, cy) {
    var track = null;
    for (var oi = 0; oi < (map.objects || []).length; oi++) {
      if (map.objects[oi].type === 'landmark' && map.objects[oi].kind === 'tracks') {
        track = map.objects[oi]; break;
      }
    }
    if (!track) return;
    var x = track.x * 16 - cx;
    var width = track.w * 16;
    for (var ty = track.y; ty < track.y + track.h; ty++) {
      var y = ty * 16 - cy;
      if (y > 192 || y + 16 < 0 || x > 256 || x + width < 0) continue;
      var crossing = roadCell(cell(map.rows, track.x, ty));
      if (!crossing) {
        R(g, x, y, width, 16, '#b7ad83');
        R(g, x + 2 + ((ty * 5) & 7), y + 5, 3, 1, '#8f8b72');
        R(g, x + 19 - ((ty * 3) & 7), y + 13, 4, 1, '#dcd9a9');
        /* Due traversine per metatile: ritmo 8 px, non recinzione a scala. */
        R(g, x + 2, y + 1, width - 4, 3, '#30383b');
        R(g, x + 4, y + 2, width - 8, 1, '#8f8b72');
        R(g, x + 2, y + 9, width - 4, 3, '#30383b');
        R(g, x + 4, y + 10, width - 8, 1, '#8f8b72');
      } else {
        /* Al passaggio stradale restano carreggiata e passabilità; solo
         * rotaie e flange attraversano l'asfalto. */
        R(g, x + 5, y, 5, 16, '#77736a'); R(g, x + 22, y, 5, 16, '#77736a');
      }
      R(g, x + 7, y, 3, 16, '#30383b'); R(g, x + 8, y, 1, 16, '#d0c89d');
      R(g, x + 23, y, 3, 16, '#30383b'); R(g, x + 24, y, 1, 16, '#d0c89d');
    }
    /* Fine corsa nord dentro la prima cella dichiarata dal landmark. */
    var top = track.y * 16 - cy;
    R(g, x + 3, top + 2, width - 6, 4, '#30383b');
    R(g, x + 6, top + 3, width - 12, 1, '#d0c89d');
  }

  function townForestMassAccents(g, map, cx, cy, opts) {
    if (!map || map.id !== 'town' || !map.rows) return;
    var viewW = opts && Number(opts.viewportWidth) || 256;
    var viewH = opts && Number(opts.viewportHeight) || 192;
    var foregroundOnly = !!(opts && opts.forestForegroundOnly);
    var depthMin = foregroundOnly && isFinite(Number(opts.forestDepthMin))
      ? Number(opts.forestDepthMin) : -Infinity;
    var depthMax = foregroundOnly && isFinite(Number(opts.forestDepthMax))
      ? Number(opts.forestDepthMax) : Infinity;
    function depthVisible(rootWorldY) {
      return !foregroundOnly || (rootWorldY > depthMin && rootWorldY <= depthMax);
    }
    /* Layout sempre calcolato nell'intera mappa. Prima min/max seguivano la
     * camera e assumevano un viewport 256x192, mentre il pass prospettico usa
     * un buffer mondo 352x240: entrando una nuova tile nel range, il greedy
     * hash sceglieva ancore diverse e intere chiome saltavano fra due frame. */
    var minTx = 0, maxTx = map.width - 1;
    var minTy = 0, maxTy = map.height - 1;
    var anchors = [], candidates = [];

    function isTree(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height || !map.rows[ty]) return false;
      var ch = map.rows[ty].charAt(tx);
      return ch === 'T' || ch === 'Y';
    }
    function covered(tx, ty) {
      for (var ai = 0; ai < anchors.length; ai++) {
        if (Math.abs(anchors[ai][0] - tx) <= 1 && Math.abs(anchors[ai][1] - ty) <= 1) return true;
      }
      return false;
    }

    /* Perimetri lunghi diventano chunk authored 32/48/64px. Ogni chunk
     * possiede profondità arretrata + prima fila, con ritmo hash non ciclico. */
    var EDGE_RHYTHMS = [[3,2,4,3,4,2],[2,4,3,2,3,4],[4,3,2,4,2,3]];
    var edgeCovered = Object.create(null), edgeBack = [], edgeFront = [];
    function edgeKey(tx, ty) { return tx + ',' + ty; }
    function queueEdgeRun(start, end, fixed, vertical, salt) {
      var cursor = start, ordinal = 0;
      var rhythm = EDGE_RHYTHMS[hash(start, fixed, salt) % EDGE_RHYTHMS.length];
      while (end - cursor + 1 >= 2) {
        var remain = end - cursor + 1;
        var cells = Math.min(remain, rhythm[ordinal % rhythm.length]);
        if (cells < 2) break;
        if (remain - cells === 1) cells--;
        if (cells < 2) break;
        var spanPx = cells * 16;
        var v = hash(cursor, fixed, salt + ordinal * 37);
        var familyA = (v >>> 4) % ORGANIC_TREE_FAMILIES.length;
        var familyB = (v >>> 17) % ORGANIC_TREE_FAMILIES.length;
        if (vertical) {
          var wx = fixed * 16 + 8 + ((v & 7) - 3);
          var topY = cursor * 16;
          edgeBack.push([wx - 5, topY + Math.round(spanPx * (.36 + ((v >>> 8) & 3) * .04)), familyA, true, v]);
          if (((v >>> 2) & 3) !== 0) {
            edgeFront.push([wx + 5, topY + Math.round(spanPx * (.70 + ((v >>> 10) & 3) * .04)), familyB, false, v ^ 0x4f39]);
          }
          for (var vy = cursor; vy < cursor + cells; vy++) edgeCovered[edgeKey(fixed, vy)] = true;
        } else {
          var leftX = cursor * 16;
          var rootY = fixed * 16 + 16 + (((v >>> 7) & 7) - 3);
          edgeBack.push([leftX + Math.round(spanPx * (.27 + ((v >>> 12) & 3) * .04)), rootY - 6, familyA, true, v]);
          if (((v >>> 2) & 3) !== 0) {
            edgeFront.push([leftX + Math.round(spanPx * (.66 + ((v >>> 14) & 3) * .04)), rootY, familyB, false, v ^ 0x4f37]);
          }
          for (var vx = cursor; vx < cursor + cells; vx++) edgeCovered[edgeKey(vx, fixed)] = true;
        }
        cursor += cells;
        ordinal++;
      }
    }

    var fullTx, fullTy, run;
    for (fullTy = 0; fullTy < map.height; fullTy++) {
      run = -1;
      for (fullTx = 0; fullTx <= map.width; fullTx++) {
        var horizontalEdge = fullTx < map.width && isTree(fullTx, fullTy) &&
          (!isTree(fullTx, fullTy - 1) || !isTree(fullTx, fullTy + 1));
        if (horizontalEdge) { if (run < 0) run = fullTx; continue; }
        if (run >= 0) queueEdgeRun(run, fullTx - 1, fullTy, false, 0x4f80 + fullTy);
        run = -1;
      }
    }
    for (fullTx = 0; fullTx < map.width; fullTx++) {
      run = -1;
      for (fullTy = 0; fullTy <= map.height; fullTy++) {
        var verticalEdge = fullTy < map.height && isTree(fullTx, fullTy) &&
          !edgeCovered[edgeKey(fullTx, fullTy)] &&
          (!isTree(fullTx - 1, fullTy) || !isTree(fullTx + 1, fullTy));
        if (verticalEdge) { if (run < 0) run = fullTy; continue; }
        if (run >= 0) queueEdgeRun(run, fullTy - 1, fullTx, true, 0x4fc0 + fullTx);
        run = -1;
      }
    }

    /* Priorità hash sull'intera fascia visibile: niente anchor pari/pari.
     * Copertura circa 2x2 resta sufficiente per far coincidere massa visiva
     * e collisioni, ma distanze e sovrapposizioni non seguono griglia 32px. */
    for (var ty = minTy; ty <= maxTy; ty++) for (var tx = minTx; tx <= maxTx; tx++) {
      if (isTree(tx, ty) && !edgeCovered[edgeKey(tx, ty)]) candidates.push([tx, ty, hash(tx, ty, 0x4f30)]);
    }
    candidates.sort(function (a, b) { return b[2] - a[2]; });
    for (var ci = 0; ci < candidates.length; ci++) {
      if (!covered(candidates[ci][0], candidates[ci][1])) anchors.push(candidates[ci]);
    }
    for (ty = minTy; ty <= maxTy; ty++) for (tx = minTx; tx <= maxTx; tx++) {
      if (isTree(tx, ty) && !edgeCovered[edgeKey(tx, ty)] && !covered(tx, ty)) anchors.push([tx, ty]);
    }
    anchors.sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });

    /* Ombra forestale aggregata: grandi lobi sovrapposti 36–58px. La
     * silhouette superiore puo' variare molto, ma il contatto al suolo
     * legge come una massa unica, non come collana di ellissi/barrette.
     * Solo passaggio base: ombre e sottobosco devono restare sotto attori. */
    for (ty = minTy; !foregroundOnly && ty <= maxTy; ty++) {
      var runStart = -1;
      for (tx = minTx; tx <= maxTx + 1; tx++) {
        if (tx <= maxTx && isTree(tx, ty)) {
          if (runStart < 0) runStart = tx;
          continue;
        }
        if (runStart < 0) continue;
        var runEnd = tx - 1, runCells = runEnd - runStart + 1;
        if (runCells >= 2) {
          var rsx = runStart * 16 - cx;
          var rsy = ty * 16 - cy + 14;
          var runW = runCells * 16;
          var runPhase = hash(runStart, ty, 0x4f32) & 7;
          if (rsy < -16 || rsy > viewH + 16 || rsx + runW < -80 || rsx > viewW + 80) {
            runStart = -1;
            continue;
          }
          /* Primo piano continuo aderente alle celle T/Y; le chiome macro
           * successive lo coprono e lo trasformano in profondita' sfalsata. */
          forestUnderstoryStrip(g, rsx, rsy + 2, runW, 8, 14,
            hash(runStart, ty, 0x4f34));
          var cursor = 1 + runPhase, shadowOrdinal = 0;
          while (cursor < runW - 6) {
            var shadowHash = hash(runStart + shadowOrdinal, ty, 0x4f33);
            var lobeW = Math.min(runW - cursor, 48 + (shadowHash % 33));
            softPixelShadow(g, rsx + cursor, rsy - 3 + ((shadowHash >>> 5) & 2),
              lobeW, 5 + ((shadowHash >>> 7) & 1), HG.shadowDark, HG.shadow);
            cursor += Math.max(28, lobeW - 24 - ((shadowHash >>> 9) & 7));
            shadowOrdinal++;
          }
        }
        runStart = -1;
      }
    }

    function drawEdgeTrees(list) {
      for (var ei = 0; ei < list.length; ei++) {
        var e = list[ei], ex = e[0] - cx, ey = e[1] - cy;
        if (!depthVisible(e[1])) continue;
        if (ex < -55 || ex > viewW + 55 || ey < -55 || ey > viewH + 55) continue;
        drawOrganicTree(g, ex, ey, e[2], e[3], e[4], foregroundOnly);
      }
    }
    drawEdgeTrees(edgeBack);

    /* Stesso vocabolario organico dell'Arrivo. Anchor hash evita griglia;
     * corone 30–46px si sovrappongono 6–10px fra celle vicine. */
    for (var n = 0; n < anchors.length; n++) {
      tx = anchors[n][0]; ty = anchors[n][1];
      var v = hash(tx, ty, 0x4f31);
      var lean = (v & 7) - 4;
      var rootWorldY = ty * 16 + 15 + (((v >>> 11) % 3) - 1);
      var rootY = rootWorldY - cy;
      var family = (v >>> 18) % ORGANIC_TREE_FAMILIES.length;
      var centerX = tx * 16 - cx + 8 + lean;
      if (!depthVisible(rootWorldY)) continue;
      if (centerX < -55 || centerX > viewW + 55 || rootY < -55 || rootY > viewH + 55) continue;
      drawOrganicTree(g, centerX, rootY - ((v >>> 7) % 4), family,
        ((v >>> 5) & 7) === 0, v, foregroundOnly);
    }
    drawEdgeTrees(edgeFront);
  }

  function townParkedCars(g, map, cx, cy) {
    if (!map || map.id !== 'town' || !map.rows) return;
    for (var ty = 0; ty < map.height; ty++) for (var tx = 0; tx < map.width - 1; tx++) {
      if (map.rows[ty].charAt(tx) !== 'V' || map.rows[ty].charAt(tx + 1) !== 'V') continue;
      /* Varianti minime per funzione urbana; geometria identica e stabile. */
      var body = '#4e8067', hi = '#80b878', glass = '#9bc0b2', accent = '#d7a351';
      if (tx === 19 && ty === 8) { body = '#dfe9df'; hi = '#fff8d0'; accent = '#b84858'; }
      else if (tx === 15 && ty === 22) { body = '#526f98'; hi = '#9bc0b2'; accent = '#dfe9df'; }
      else if (tx === 12 && ty === 8) { body = '#754429'; hi = '#a9754f'; glass = '#8faaa4'; }
      drawParkedCarHero(g, tx * 16 - cx, ty * 16 - cy, body, hi, glass, accent);
      tx++;
    }
  }

  /* ------------------------------------------------------------------
   * Double R Diner — fronte R114, allineato al lotto autoriale
   * (artifacts/double-r-exterior-v02/native-clean.png): tetto basso di
   * carbone con filo caldo di gronda, clapboard crema con corsi da 2px,
   * fascia e zoccolo bordeaux, due vetrine basse a vetro scuro, porta a
   * due battenti bordeaux con vetri dorati centrata sulla cella D reale
   * (42,20), insegna DOUBLE R su tavola forestale con bordo crema sopra
   * la porta e una piccola insegna a bandiera "RR" all'angolo est.
   *
   * (x, y) = angolo alto-sinistra della facciata ASCII (tile 39,18),
   * impronta 96x48 invariata: collisione, porta 42,20, visualBounds e
   * cameraFocus restano quelli della tabella R80. Tutto cio' che sale
   * sopra y (tetto, insegna) vive sulla riga 17, prato non calpestabile.
   *
   * I valori sono diurni come nel resto del town: il fronte riceve il
   * grade serale di js/town-dusk.js insieme a tutto lo sfondo, e le sue
   * parti accese arrivano dall'overlay dei practicals. La crema di
   * facciata e' volutamente la piu' chiara del frame (parete illuminata
   * dalle proprie vetrine), il bordeaux resta bordeaux, il tetto scende
   * sotto la vegetazione.
   * ------------------------------------------------------------------ */
  var RR = {
    roof: '#2b3538', roofHi: '#3d4a4d', roofDk: '#1c2427', rim: '#a9754f',
    wall: '#fdedbe', wallHi: '#fffbe6', wallLine: '#eddca6', wallDk: '#d3bd8c',
    cream: '#fff8d0', bordeaux: '#8f2430', bordHi: '#c1585a', plinth: '#4c1119',
    glass: '#22303a', glassHi: '#3d5561', gold: '#f0d060',
    board: '#2c5342', metal: '#b9bcae', metalDk: '#6f7368',
    pine: '#2c5334', pineHi: '#5c8a52'
  };

  function townDoubleR(g, x, y) {
    var i, sx;
    var L = x, Rr = x + 96, Bt = y + 48;

    /* --- 1. TETTO basso a tre terrazze: piano di carbone, nessuna massa
     * rossa. Il filo caldo di rovere sotto la gronda e' l'unico accento. --- */
    var rTop = y - 38, rBot = y - 18;
    R(g, L + 12, rTop, 72, 3, RR.roofDk);
    R(g, L + 13, rTop + 1, 70, 1, RR.roofHi);
    R(g, L + 4, rTop + 3, 88, 6, RR.roofDk);
    R(g, L + 5, rTop + 4, 86, 4, RR.roof);
    R(g, L - 4, rTop + 9, 104, rBot - rTop - 9, RR.roofDk);
    R(g, L - 3, rTop + 10, 102, rBot - rTop - 12, RR.roof);
    R(g, L - 3, rTop + 10, 102, 1, RR.roofHi);
    for (i = 14; i < 100; i += 18) R(g, L - 3 + i, rTop + 11, 1, rBot - rTop - 13, RR.roofDk);
    /* Corpo illuminante sul tetto: la stessa scatola pallida del lotto. */
    R(g, L + 18, rTop + 4, 14, 8, RR.roofDk);
    R(g, L + 19, rTop + 5, 12, 4, RR.cream);
    R(g, L + 19, rTop + 9, 12, 2, RR.metalDk);
    /* Piccola insegna "RR" sul tetto, verso la strada: montata sulla
     * falda con due staffe, mai a terra, cosi' il marciapiede resta
     * chiaramente calpestabile. */
    R(g, L + 74, rTop + 2, 4, 16, RR.metalDk);
    R(g, L + 86, rTop + 2, 4, 16, RR.metalDk);
    R(g, L + 70, rTop - 14, 24, 18, RR.plinth);
    R(g, L + 71, rTop - 13, 22, 16, RR.cream);
    R(g, L + 72, rTop - 12, 20, 14, RR.board);
    townTinyWord(g, 'RR', L + 76, rTop - 9, RR.cream);
    /* Gronda: sottogronda scuro, filo caldo 1px, ombra portata sul muro. */
    R(g, L - 5, rBot - 3, 106, 2, RR.plinth);
    R(g, L - 5, rBot - 1, 106, 1, RR.rim);
    R(g, L - 5, rBot, 106, 2, RR.plinth);

    /* --- 2. FASCIA bordeaux continua sotto la gronda --- */
    R(g, L - 1, rBot + 2, 98, 6, RR.bordeaux);
    R(g, L - 1, rBot + 2, 98, 1, RR.bordHi);
    R(g, L - 1, rBot + 7, 98, 1, RR.plinth);

    /* --- 3. PARETE clapboard crema (y-14 .. y+40), corsi da 2px --- */
    var wTop = rBot + 8;
    R(g, L, wTop, 96, Bt - 8 - wTop, RR.wall);
    for (i = wTop + 7; i < Bt - 10; i += 9) R(g, L + 1, i, 94, 2, RR.wallLine);
    R(g, L, wTop, 96, 2, RR.wallDk);                  /* sottogronda */
    R(g, L, wTop, 1, Bt - 8 - wTop, RR.wallHi);       /* spigolo NW illuminato */
    R(g, L - 1, wTop, 1, Bt - wTop, C.ink);
    R(g, Rr - 4, wTop, 4, Bt - 8 - wTop, RR.wallDk);  /* fianco est in ombra */
    R(g, Rr, wTop, 4, Bt - wTop, RR.wallDk);
    R(g, Rr + 4, wTop, 1, Bt - wTop, C.ink);

    /* --- 4. INSEGNA "DOUBLE R": tavola forestale, bordo crema, sopra la
     * porta e sotto la fascia. Le lettere si accendono nell'overlay. --- */
    var sgX = L + 27, sgY = wTop + 2, sgW = 58, sgH = 17;
    R(g, sgX, sgY, sgW, sgH, RR.plinth);
    R(g, sgX + 1, sgY + 1, sgW - 2, sgH - 2, RR.cream);
    R(g, sgX + 2, sgY + 2, sgW - 4, sgH - 4, RR.board);
    townTinyWord(g, 'DOUBLE R', sgX + 6, sgY + 5, RR.cream);

    /* --- 5. VETRINE basse: vetro scuro, tre riflessi a gradino, banco e
     * schienali bordeaux appena leggibili dietro il vetro. --- */
    function rrWindow(wx, wy, ww, wh) {
      R(g, wx - 2, wy - 2, ww + 4, wh + 4, RR.plinth);
      R(g, wx - 1, wy - 1, ww + 2, wh + 2, RR.cream);
      R(g, wx, wy, ww, wh, RR.glass);
      R(g, wx + 2, wy + 2, Math.round(ww * .28), 2, RR.glassHi);
      R(g, wx + 2 + Math.round(ww * .32), wy + 4, Math.round(ww * .18), 2, RR.glassHi);
      /* Interno: schienali bordeaux e filo crema del banco. */
      R(g, wx + 1, wy + wh - 7, ww - 2, 6, RR.bordeaux);
      R(g, wx + 2, wy + wh - 8, ww - 4, 1, RR.cream);
      R(g, wx + 4, wy + wh - 5, 4, 3, RR.plinth);
      R(g, wx + ww - 9, wy + wh - 5, 4, 3, RR.plinth);
      /* Davanzale con spessore. */
      R(g, wx - 3, wy + wh + 2, ww + 6, 2, RR.wallHi);
      R(g, wx - 3, wy + wh + 4, ww + 6, 1, RR.wallDk);
    }
    var winY = wTop + 24, winH = 20;
    rrWindow(L + 8, winY, 30, winH);
    rrWindow(L + 68, winY, 24, winH);

    /* --- 6. PORTA a due battenti centrata sulla cella D (42,20) --- */
    var dX = L + 48, dW = 16, dTop = winY - 4, dBot = Bt;
    R(g, dX - 3, dTop - 1, dW + 6, dBot - dTop + 1, RR.plinth);
    R(g, dX - 2, dTop, dW + 4, dBot - dTop, RR.cream);       /* stipiti verniciati */
    R(g, dX, dTop + 2, dW, dBot - dTop - 2, RR.bordeaux);
    R(g, dX, dTop + 2, dW, 1, RR.plinth);                     /* ombra architrave */
    R(g, dX + 7, dTop + 2, 1, dBot - dTop - 2, RR.plinth);    /* battuta centrale */
    R(g, dX + 1, dTop + 5, 6, 16, RR.plinth); R(g, dX + 9, dTop + 5, 6, 16, RR.plinth);
    R(g, dX + 2, dTop + 6, 4, 14, RR.gold); R(g, dX + 10, dTop + 6, 4, 14, RR.gold);
    R(g, dX + 6, dTop + 24, 1, 4, RR.gold); R(g, dX + 9, dTop + 24, 1, 4, RR.gold);
    R(g, dX + 1, dBot - 5, dW - 2, 3, RR.plinth);             /* battipiede */

    /* --- 7. ZOCCOLO bordeaux, spezzato dalla soglia --- */
    R(g, L, Bt - 8, dX - 3 - L, 8, RR.plinth);
    R(g, L, Bt - 8, dX - 3 - L, 1, RR.bordHi);
    R(g, dX + dW + 3, Bt - 8, Rr - dX - dW - 3, 8, RR.plinth);
    R(g, dX + dW + 3, Bt - 8, Rr - dX - dW - 3, 1, RR.bordHi);
    R(g, L, Bt - 1, 96, 1, C.ink);

    /* --- 8. Siepi basse ai piedi della facciata, soglia e ombra --- */
    function rrHedge(hx, hy, hw) {
      R(g, hx, hy, hw, 6, RR.pine);
      R(g, hx + 1, hy - 1, hw - 2, 1, RR.pine);
      R(g, hx + 2, hy, 3, 2, RR.pineHi); R(g, hx + hw - 7, hy + 1, 3, 2, RR.pineHi);
      R(g, hx + (hw >> 1) - 1, hy + 2, 2, 1, RR.pineHi);
      R(g, hx - 1, hy + 4, hw + 2, 2, HG.shadowDark);
    }
    rrHedge(L + 6, Bt - 5, 16); rrHedge(L + 26, Bt - 5, 16);
    rrHedge(L + 70, Bt - 5, 20);
    for (sx = L + 4; sx < Rr - 4; sx += 24) R(g, sx, Bt - 9, 12, 1, RR.wallDk);
    townStep(g, dX - 2, Bt, 20, RR.wall);
    townFoundationShadow(g, L, Bt + 6, 96, 0x74a);
  }

  function townHeroAccents(g, map, cx, cy) {
    if (!map || map.id !== 'town') return;
    var x, y, i;

    /* Alberi base gia' authored 16x24 con tre profondita'. Il vecchio layer
     * aggiuntivo riempiva ogni cella con frammenti e una fascia casuale sul
     * bordo alto: dietro gli edifici sembrava raster corrotto. Nessun quarto
     * passaggio sopra le chiome; silhouette individuali restano leggibili. */
    townWaterfallAccents(g, cx, cy);
    townWelcomeAccents(g, cx, cy);
    townLakeAccents(g, cx, cy);
    townTracksAccents(g, map, cx, cy);

    /* Great Northern — loggia chiusa: timpano, tronchi, portico e camino. */
    x = 6 * 16 - cx; y = 4 * 16 - cy;
    townClosedGable(g, x, y, 96, 48, BUILDINGS['4']);
    for (i = 5; i < 43; i += 8) R(g, x + 3, y + i, 90, 2, '#3c2a1e');
    for (i = 10; i < 92; i += 16) R(g, x + i, y + 3, 2, 39, '#6f5238');
    R(g, x + 2, y + 1, 92, 10, C.ink); R(g, x + 3, y + 2, 90, 8, '#d8c98a');
    townTinyWord(g, 'GREAT NORTHERN', x + 6, y + 2, '#3c2a1e');
    R(g, x + 15, y - 18, 10, 15, C.ink); R(g, x + 18, y - 16, 5, 12, '#3c2a1e');
    townTwinWindow(g, x + 8, y + 10, '#d9d49a', '#3c2a1e');
    townTwinWindow(g, x + 68, y + 10, '#d9d49a', '#3c2a1e');
    R(g, x + 33, y + 23, 31, 4, C.ink); R(g, x + 36, y + 27, 25, 3, '#d8c98a');
    R(g, x + 36, y + 30, 3, 17, C.ink); R(g, x + 58, y + 30, 3, 17, C.ink);
    R(g, x + 48, y + 29, 16, 19, C.ink); R(g, x + 51, y + 32, 10, 16, '#2c5334');
    townStep(g, x + 45, y + 48, 22, '#d8c98a');
    townFoundationShadow(g, x, y + 54, 96, 0x741);

    /* Calhoun Memorial — volume clinico unico 6x4. Simmetria, croce e
     * ingresso sulla vera tile D: niente ala bianca sospesa o falso varco. */
    x = 20 * 16 - cx; y = 3 * 16 - cy;
    townFacadeShell(g, x, y, 96, 64, BUILDINGS['5']);
    /* Tetto clinico arretrato a tre quote. Pattern orizzontale: nessuna
     * sequenza di montanti che possa sembrare testo decorativo. */
    R(g, x + 24, y - 43, 48, 5, C.ink); R(g, x + 25, y - 42, 46, 3, '#ecf5ef');
    R(g, x + 18, y - 39, 60, 6, '#718d87'); R(g, x + 19, y - 38, 58, 4, '#c7d6d2');
    R(g, x + 20, y - 37, 54, 1, '#ecf5ef');
    R(g, x + 15, y - 33, 66, 7, '#718d87'); R(g, x + 16, y - 32, 64, 5, '#8faaa4');
    R(g, x + 12, y - 27, 72, 5, '#718d87'); R(g, x + 13, y - 26, 70, 3, '#ecf5ef');
    R(g, x + 7, y - 23, 82, 7, '#718d87'); R(g, x + 8, y - 22, 80, 5, '#c7d6d2');
    R(g, x + 3, y - 17, 90, 17, C.ink); R(g, x + 4, y - 16, 88, 15, '#c7d6d2');
    R(g, x + 6, y - 14, 84, 2, '#ecf5ef');
    townRoofClusters(g, x + 6, y - 41, 84, 35, BUILDINGS['5'], 0x755);
    for (i = 9; i < 84; i += 15) {
      R(g, x + i, y - 9, 8, 1, '#8faaa4'); R(g, x + i + 2, y - 8, 4, 1, '#ecf5ef');
    }
    R(g, x - 1, y - 2, 98, 2, C.ink); R(g, x + 2, y - 1, 92, 1, '#8faaa4');
    for (i = 7; i < 59; i += 8) {
      R(g, x + 3 + (((i >> 3) & 1) * 4), y + i, 88, 1, '#c7d6d2');
    }
    /* Insegna clinica e croce: entrambe leggibili a 1x, stesso piano. */
    R(g, x + 20, y + 3, 53, 12, '#718d87'); R(g, x + 21, y + 4, 51, 9, '#ecf5ef');
    R(g, x + 23, y + 4, 46, 1, '#ffffff'); R(g, x + 22, y + 13, 49, 2, '#8faaa4');
    townTinyWord(g, 'HOSPITAL', x + 23, y + 5, '#31543a');
    R(g, x + 5, y + 3, 13, 12, C.ink); R(g, x + 6, y + 4, 11, 10, '#ecf5ef');
    R(g, x + 10, y + 5, 3, 8, C.red); R(g, x + 8, y + 8, 7, 3, C.red);
    townWindow(g, x + 7, y + 23, 18, 13, '#dfe9df', '#8faaa4');
    townWindow(g, x + 30, y + 23, 14, 13, '#dfe9df', '#8faaa4');
    townWindow(g, x + 72, y + 23, 17, 13, '#dfe9df', '#8faaa4');
    R(g, x + 7, y + 25, 7, 1, C.paper); R(g, x + 74, y + 25, 7, 1, C.paper);
    R(g, x + 6, y + 37, 20, 1, '#8faaa4'); R(g, x + 29, y + 37, 16, 1, '#8faaa4');
    R(g, x + 71, y + 37, 19, 1, '#8faaa4');
    /* Portale sulla quarta tile del footprint, esattamente [23,6]. */
    R(g, x + 42, y + 31, 28, 7, C.ink); R(g, x + 45, y + 32, 22, 4, '#ecf5ef');
    R(g, x + 44, y + 37, 4, 6, '#8faaa4'); R(g, x + 64, y + 37, 4, 6, '#8faaa4');
    R(g, x + 48, y + 37, 16, 27, C.ink); R(g, x + 51, y + 40, 10, 24, '#dfe9df');
    R(g, x + 56, y + 40, 1, 24, '#8faaa4'); R(g, x + 59, y + 52, 1, 2, C.red);
    R(g, x + 42, y + 61, 28, 3, '#8faaa4');
    townStep(g, x + 46, y + 64, 20, '#ecf5ef');
    R(g, x + 40, y + 70, 32, 15, '#34572d'); R(g, x + 41, y + 70, 30, 14, '#dfe9df');
    R(g, x + 56, y + 70, 1, 14, '#8faaa4');
    townFoundationShadow(g, x, y + 64, 96, 0x742);

    /* Casa Palmer — grande timpano domestico, portico e ringhiera. */
    x = 40 * 16 - cx; y = 4 * 16 - cy;
    townClosedGable(g, x, y, 64, 48, BUILDINGS['3']);
    for (var palmerRoofRow = 0; palmerRoofRow < 2; palmerRoofRow++) {
      for (i = 7 + palmerRoofRow * 6; i < 58; i += 12) {
        R(g, x + i, y - 15 + palmerRoofRow * 7, 6, 1, '#4a2f22');
        R(g, x + i + 2, y - 14 + palmerRoofRow * 7, 3, 1, '#a9754f');
      }
    }
    for (i = 5; i < 43; i += 7) {
      R(g, x + 3 + (((i / 7) & 1) * 3), y + i, 55, 1, '#a9754f');
    }
    R(g, x + 45, y - 18, 8, 14, C.ink); R(g, x + 47, y - 16, 4, 10, '#a9754f');
    townTwinWindow(g, x + 7, y + 7, '#eee6b5', '#4a2f22');
    townTwinWindow(g, x + 37, y + 7, '#eee6b5', '#4a2f22');
    R(g, x + 4, y + 23, 56, 3, C.ink); R(g, x + 7, y + 26, 50, 3, '#ecd7a4');
    R(g, x + 8, y + 29, 3, 18, C.ink); R(g, x + 53, y + 29, 3, 18, C.ink);
    R(g, x + 32, y + 27, 16, 21, C.ink); R(g, x + 35, y + 30, 10, 18, '#754429');
    R(g, x + 7, y + 41, 50, 3, '#a9754f');
    for (i = 12; i < 53; i += 8) R(g, x + i, y + 35, 2, 6, '#4a2f22');
    /* Breve camminamento domestico sulla riga p reale davanti alla porta. */
    R(g, x + 24, y + 48, 32, 12, '#4a2f22'); R(g, x + 25, y + 49, 30, 10, '#ecd7a4');
    R(g, x + 40, y + 49, 1, 10, '#a9754f');
    townStep(g, x + 30, y + 48, 20, '#ecd7a4');
    /* Abbaino e veranda laterale danno secondo piano e profondità domestica. */
    R(g, x + 8, y - 18, 20, 17, C.ink); R(g, x + 11, y - 15, 14, 12, '#ecd7a4');
    townTwinWindow(g, x + 8, y - 13, '#eee6b5', '#4a2f22');
    R(g, x - 5, y + 20, 18, 5, C.ink); R(g, x - 2, y + 22, 15, 2, '#ecd7a4');
    R(g, x, y + 25, 3, 22, C.ink);
    townFoundationShadow(g, x, y + 54, 64, 0x743);

    /* Bookhouse — lodge civica 3x3. Timpano scuro e insegna BOOK HOUSE:
     * luogo di riunione, mai libreria. Ombra verso sinistra libera il vicolo. */
    x = 28 * 16 - cx; y = 2 * 16 - cy;
    townClosedGable(g, x, y, 48, 48, BUILDINGS['7'], -1);
    R(g, x + 5, y - 27, 9, 12, C.ink); R(g, x + 7, y - 25, 5, 9, '#6f5238');
    for (var bookRoofRow = 0; bookRoofRow < 2; bookRoofRow++) {
      for (i = 4 + bookRoofRow * 5; i < 44; i += 11) {
        R(g, x + i, y - 13 + bookRoofRow * 6, 6, 1, '#6f5238');
        R(g, x + i + 2, y - 12 + bookRoofRow * 6, 3, 1, '#3c2a1e');
      }
    }
    for (i = 6; i < 46; i += 7) {
      R(g, x + 3 + (((i / 7) & 1) * 4), y + i, 40, 1, '#6f5238');
    }
    /* Placca nel timpano/facciata, non fascia commerciale. */
    R(g, x + 10, y + 2, 28, 15, '#6f5238'); R(g, x + 12, y + 3, 24, 12, '#d8c98a');
    R(g, x + 13, y + 3, 21, 1, '#eee0ad'); R(g, x + 12, y + 15, 24, 2, '#3c2a1e');
    townCompactWord(g, 'BOOK', x + 15, y + 4, '#3c2a1e');
    townCompactWord(g, 'HOUSE', x + 12, y + 10, '#3c2a1e');
    R(g, x + 12, y + 17, 24, 1, '#3c2a1e');
    /* Portico, finestre laterali e ringhiera: cabin/meeting lodge. */
    R(g, x - 4, y + 18, 56, 7, C.ink); R(g, x - 1, y + 19, 50, 4, '#6f5238');
    R(g, x + 1, y + 20, 46, 2, '#d8c98a');
    townWindow(g, x + 3, y + 26, 12, 10, '#d9d49a', '#3c2a1e');
    townWindow(g, x + 33, y + 26, 12, 10, '#d9d49a', '#3c2a1e');
    R(g, x + 18, y + 24, 12, 24, C.ink); R(g, x + 20, y + 27, 8, 21, '#3c2a1e');
    R(g, x + 22, y + 28, 4, 6, '#6f5238'); R(g, x + 27, y + 41, 1, 1, '#d8c98a');
    R(g, x + 2, y + 37, 3, 11, C.ink); R(g, x + 43, y + 37, 3, 11, C.ink);
    R(g, x + 3, y + 39, 13, 2, '#3c2a1e'); R(g, x + 32, y + 39, 13, 2, '#3c2a1e');
    for (i = 7; i < 43; i += 7) if (i < 18 || i > 29) R(g, x + i, y + 40, 2, 7, '#3c2a1e');
    townStep(g, x + 14, y + 48, 20, '#d8c98a');
    townFoundationShadow(g, x, y + 54, 48, 0x744);

    /* Horne's — Art Déco 3x4, contenuto nel proprio footprint. Vicolo da
     * due tile resta visibile: niente ali che si fingono terzo edificio. */
    x = 33 * 16 - cx; y = 3 * 16 - cy;
    townFacadeShell(g, x, y, 48, 48, BUILDINGS['9'], 1);
    R(g, x + 14, y - 29, 20, 6, C.ink); R(g, x + 15, y - 28, 18, 5, '#719098');
    R(g, x + 8, y - 23, 32, 5, C.ink); R(g, x + 9, y - 22, 30, 4, '#355660');
    R(g, x + 3, y - 18, 42, 18, C.ink); R(g, x + 4, y - 17, 40, 16, '#355660');
    R(g, x + 5, y - 16, 38, 2, '#719098');
    for (i = 8; i < 41; i += 9) {
      R(g, x + i, y - 11, 5, 1, '#719098'); R(g, x + i + 1, y - 10, 3, 1, '#355660');
    }
    /* Nome + funzione compatti: targa 28x14, facciata ancora dominante. */
    R(g, x + 10, y + 2, 28, 14, '#719098'); R(g, x + 12, y + 3, 24, 10, '#f0d888');
    R(g, x + 13, y + 3, 21, 1, '#ffe6a1'); R(g, x + 12, y + 13, 24, 2, '#684534');
    townMicroWord(g, 'HORNE', x + 15, y + 4, '#684534');
    townMicroWord(g, 'STORE', x + 15, y + 10, '#684534');
    for (i = 3; i < 44; i += 10) {
      R(g, x + i, y + 20, 2, 18, '#684534');
      R(g, x + i + 2, y + 21, 5, 1, '#f0d888');
    }
    R(g, x + 2, y + 21, 44, 4, C.ink); R(g, x + 4, y + 22, 40, 2, '#719098');
    townWindow(g, x + 3, y + 27, 14, 14, '#d9c78d', '#684534');
    townWindow(g, x + 31, y + 27, 14, 14, '#d9c78d', '#684534');
    R(g, x + 5, y + 35, 10, 2, '#f0d888'); R(g, x + 33, y + 35, 10, 2, '#f0d888');
    /* Ingresso doppio incassato, perfettamente dentro massa solida. */
    R(g, x + 18, y + 31, 13, 17, C.ink); R(g, x + 20, y + 33, 9, 15, '#355660');
    R(g, x + 24, y + 33, 1, 15, C.ink); R(g, x + 27, y + 41, 1, 1, '#f0d888');
    townStep(g, x + 15, y + 48, 18, '#d4ad68');
    townFoundationShadow(g, x, y + 54, 48, 0x745);

    /* Tre botteghe: sagome diverse prima delle icone. */
    x = 15 * 16 - cx; y = 10 * 16 - cy;
    townClosedGable(g, x, y, 48, 48, BUILDINGS['0']);
    R(g, x + 17, y + 4, 14, 12, '#713943'); R(g, x + 19, y + 6, 10, 7, C.paper);
    R(g, x + 19, y + 13, 10, 2, '#b6625d');
    R(g, x + 23, y + 7, 2, 6, '#713943'); R(g, x + 21, y + 9, 6, 2, '#713943');
    townAwning(g, x + 1, y + 18, 46, '#713943', '#f0dfb5');
    townWindow(g, x + 5, y + 29, 38, 14, '#9bc0b2', '#435a50');
    /* Bottiglie e scatole dietro vetro: farmacia leggibile senza sola croce. */
    for (i = 0; i < 5; i++) {
      R(g, x + 9 + i * 6, y + 34 + (i & 1), 3, 6 - (i & 1), i & 1 ? '#713943' : '#435a50');
      R(g, x + 10 + i * 6, y + 32 + (i & 1), 1, 2, C.paper);
    }
    R(g, x + 7, y + 40, 34, 2, C.ink);
    /* Farmacia: zoccolo ceramico e mensola laterale, distinti dal metallo
     * hardware e dalla base sospesa dell'edicola. */
    R(g, x + 2, y + 43, 44, 5, '#713943');
    R(g, x + 4, y + 43, 40, 2, '#f0dfb5');
    for (i = 9; i < 42; i += 11) R(g, x + i, y + 43, 1, 4, '#b6625d');
    R(g, x + 44, y + 5, 4, 38, '#5f3136'); R(g, x + 44, y + 6, 1, 34, '#b6625d');
    townFoundationShadow(g, x, y + 48, 48, 0x746);

    x = 19 * 16 - cx;
    townClosedFlat(g, x, y, 32, 48, BUILDINGS['0']);
    R(g, x + 2, y - 25, 28, 8, '#713943');
    for (i = 3; i < 28; i += 10) R(g, x + i, y - 29, 7, 7, C.ink);
    R(g, x + 4, y - 23, 24, 4, '#713943');
    R(g, x + 3, y + 6, 26, 16, C.ink); R(g, x + 6, y + 9, 20, 10, C.paper);
    townSignIcon(g, 'hammer', x + 8, y + 6);
    R(g, x - 3, y + 22, 38, 7, C.ink); R(g, x, y + 23, 32, 4, '#435a50');
    R(g, x + 3, y + 24, 26, 2, '#d9c78d');
    /* Hardware: serranda metallica profonda, non vetrina da boutique. */
    R(g, x + 1, y + 26, 30, 19, C.ink); R(g, x + 4, y + 29, 18, 13, '#719098');
    for (i = 31; i < 42; i += 4) R(g, x + 5, y + i, 16, 1, '#d9c78d');
    R(g, x + 24, y + 29, 5, 13, '#435a50'); R(g, x + 26, y + 31, 2, 9, '#d9c78d');
    /* Rastrelliera attrezzi incisa nella facciata solida. */
    R(g, x + 3, y + 19, 26, 3, '#435a50');
    R(g, x + 8, y + 16, 2, 5, C.ink); R(g, x + 15, y + 15, 5, 2, C.ink);
    R(g, x + 17, y + 16, 2, 5, C.ink); R(g, x + 24, y + 16, 3, 5, C.ink);
    /* Piccola insegna a lama ancorata al muro + zerbino piatto. */
    R(g, x + 28, y + 4, 8, 18, C.ink); R(g, x + 29, y + 6, 6, 13, '#d9c78d');
    R(g, x + 31, y + 8, 2, 8, '#435a50'); R(g, x + 29, y + 11, 6, 2, '#435a50');
    R(g, x - 2, y + 43, 36, 5, '#334b50');
    R(g, x + 1, y + 43, 30, 2, '#9eb3ae');
    R(g, x + 4, y + 46, 4, 2, '#526b70'); R(g, x + 24, y + 46, 5, 2, '#526b70');
    R(g, x + 9, y + 48, 14, 3, '#34572d'); R(g, x + 11, y + 48, 10, 1, '#d9c78d');
    townFoundationShadow(g, x, y + 51, 32, 0x747);

    x = 46 * 16 - cx;
    townClosedFlat(g, x, y, 48, 32, BUILDINGS['0']);
    for (i = 0; i < 7; i++) R(g, x - 4 + i, y - 25 + i, 56 - i * 2, 2, i === 0 ? C.ink : '#435a50');
    R(g, x - 5, y - 13, 58, 4, C.ink); R(g, x - 2, y - 12, 52, 2, '#d9c78d');
    R(g, x + 9, y + 3, 30, 17, '#435a50'); R(g, x + 12, y + 6, 24, 10, C.paper);
    R(g, x + 13, y + 6, 21, 1, '#fff3cf'); R(g, x + 12, y + 16, 24, 2, '#719098');
    townSignIcon(g, 'paper', x + 16, y + 3);
    townAwning(g, x + 2, y + 20, 44, '#435a50', '#d9c78d');
    /* Edicola aperta: mensole e pile, canopy molto più largo del corpo. */
    R(g, x - 9, y + 26, 66, 8, C.ink); R(g, x - 5, y + 28, 58, 3, '#d9c78d');
    R(g, x + 4, y + 27, 40, 5, C.ink); R(g, x + 7, y + 28, 34, 3, C.paper);
    for (i = 8; i < 40; i += 8) R(g, x + i, y + 29, 5, 2, (i & 8) ? '#435a50' : '#6a8a43');
    /* Testate sovrapposte e legature: edicola, non vetrina generica. */
    for (i = 0; i < 4; i++) {
      R(g, x + 6 + i * 10, y + 22 - (i & 1), 8, 6, C.ink);
      R(g, x + 8 + i * 10, y + 23 - (i & 1), 5, 3, C.paper);
      R(g, x + 9 + i * 10, y + 24 - (i & 1), 3, 1, i & 1 ? '#713943' : '#435a50');
    }
    townFoundationShadow(g, x, y + 35, 48, 0x748);
    R(g, x - 6, y + 32, 60, 3, '#33453d');
    R(g, x - 2, y + 32, 52, 1, '#d9c78d');
    R(g, x, y + 35, 5, 4, '#33453d'); R(g, x + 43, y + 35, 5, 4, '#33453d');
    R(g, x + 48, y + 4, 5, 27, '#33453d'); R(g, x + 48, y + 5, 1, 23, '#719098');

    /* Distretto dello sceriffo — fronte R114, allineato al lotto autoriale
     * (artifacts/sheriffs-station-exterior-v01/final.png): tetto verde
     * carbone a falda bassa con filo caldo di rovere, assito salvia con
     * corsi da 2px e lesene di rovere agli angoli, corso di pietra alla
     * base, due finestre basse a vetro scuro, porta a due battenti di
     * rovere centrata sulla cella D reale (12,20), insegna SHERIFF su
     * tavola forestale con bordo crema, pennone snello a est.
     *
     * Impronta 5x4, porta 12,20, visualBounds e cameraFocus restano quelli
     * della tabella R80. Valori diurni come il resto del town: il fronte
     * riceve il grade serale di js/town-dusk.js e le sue parti accese
     * arrivano dall'overlay dei practicals (fluorescente freddo nelle
     * vetrine, un solo caldo sulla lampada da scrivania). */
    var SS = {
      roofDk: '#1e332c', roof: '#2f4740', roofHi: '#3f5a4e',
      wall: '#adb191', wallHi: '#c6c9a4', wallLine: '#9a9e80', wallDk: '#83876b',
      oak: '#a9754f', oakHi: '#c79267', oakDk: '#5c3d28',
      stone: '#b9bdae', stoneHi: '#d2d5c6', stoneLn: '#8d9184',
      glass: '#2b3d47', glassHi: '#4f6f78', glassDk: '#1b262d',
      board: '#2c5342', cream: '#fff8d0', pole: '#c3ccca', gold: '#f0d060'
    };
    x = 10 * 16 - cx; y = 17 * 16 - cy;
    townFacadeShell(g, x, y, 80, 64, [SS.roof, SS.roofHi, SS.wall, SS.roofDk]);

    /* Tetto a falda bassa: tre terrazze corte di verde carbone, correnti
     * verticali da 1px, filo caldo di rovere sotto la gronda. */
    var ssTop = y - 32, ssBot = y - 2;
    R(g, x + 14, ssTop, 52, 3, SS.roofDk);
    R(g, x + 15, ssTop + 1, 50, 1, SS.roofHi);
    R(g, x + 6, ssTop + 3, 68, 6, SS.roofDk);
    R(g, x + 7, ssTop + 4, 66, 4, SS.roof);
    R(g, x - 4, ssTop + 9, 88, ssBot - ssTop - 9, SS.roofDk);
    R(g, x - 3, ssTop + 10, 86, ssBot - ssTop - 13, SS.roof);
    R(g, x - 3, ssTop + 10, 86, 1, SS.roofHi);
    for (i = 12; i < 84; i += 17) R(g, x - 3 + i, ssTop + 11, 1, ssBot - ssTop - 14, SS.roofDk);
    /* Plafoniera sul tetto, come nel lotto: unica massa pallida in alto. */
    R(g, x + 52, ssTop + 4, 13, 8, SS.roofDk);
    R(g, x + 53, ssTop + 5, 11, 4, SS.cream);
    R(g, x - 5, ssBot - 3, 90, 2, SS.oakDk);
    R(g, x - 5, ssBot - 1, 90, 1, SS.oak);
    R(g, x - 5, ssBot, 90, 2, SS.oakDk);

    /* Facciata: assito salvia, corsi orizzontali da 2px, lesene di rovere
     * agli angoli, fianco est in ombra. */
    R(g, x, y, 80, 62, SS.wall);
    R(g, x, y, 80, 3, SS.wallDk);
    for (i = 8; i < 46; i += 9) R(g, x + 6, y + i, 68, 2, SS.wallLine);
    R(g, x, y, 6, 62, SS.oak); R(g, x + 74, y, 6, 62, SS.oak);
    R(g, x, y, 1, 62, SS.oakDk); R(g, x + 1, y, 1, 62, SS.oakHi);
    R(g, x + 79, y, 1, 62, SS.oakDk); R(g, x + 74, y, 1, 62, SS.oakDk);
    R(g, x + 74, y + 30, 6, 2, SS.oakDk); R(g, x, y + 30, 6, 2, SS.oakDk);

    /* Insegna SHERIFF: tavola forestale, bordo crema, sotto la gronda. */
    R(g, x + 15, y + 2, 50, 16, SS.oakDk);
    R(g, x + 16, y + 3, 48, 14, SS.cream);
    R(g, x + 17, y + 4, 46, 12, SS.board);
    townTinyWord(g, 'SHERIFF', x + 19, y + 6, SS.cream);

    /* Due finestre basse: telaio di rovere, vetro scuro con due riflessi a
     * gradino, davanzale con spessore. La luce interna arriva dall'overlay. */
    function ssWindow(wx, wy, ww, wh) {
      R(g, wx - 2, wy - 2, ww + 4, wh + 4, SS.oakDk);
      R(g, wx - 1, wy - 1, ww + 2, wh + 2, SS.oak);
      R(g, wx, wy, ww, wh, SS.glassDk);
      R(g, wx + 1, wy + 1, ww - 2, wh - 2, SS.glass);
      R(g, wx + 2, wy + 2, Math.round(ww * .3), 2, SS.glassHi);
      R(g, wx + 2 + Math.round(ww * .34), wy + 4, Math.round(ww * .2), 2, SS.glassHi);
      R(g, wx - 3, wy + wh + 2, ww + 6, 2, SS.oakHi);
      R(g, wx - 3, wy + wh + 4, ww + 6, 1, SS.oakDk);
    }
    ssWindow(x + 8, y + 22, 22, 14);
    ssWindow(x + 50, y + 22, 22, 14);

    /* Lampada sopra l'ingresso: la sorgente che motiva la pozza a terra. */
    R(g, x + 34, y + 24, 12, 2, SS.oakDk);
    R(g, x + 35, y + 26, 10, 2, SS.cream);
    R(g, x + 35, y + 28, 10, 1, SS.oakDk);

    /* Corso di pietra alla base, spezzato dalla soglia. */
    R(g, x + 5, y + 50, 24, 12, SS.stoneLn);
    R(g, x + 6, y + 51, 22, 10, SS.stone);
    R(g, x + 51, y + 50, 24, 12, SS.stoneLn);
    R(g, x + 52, y + 51, 22, 10, SS.stone);
    for (i = 0; i < 2; i++) {
      R(g, x + 6, y + 54 + i * 4, 22, 1, SS.stoneLn);
      R(g, x + 52, y + 54 + i * 4, 22, 1, SS.stoneLn);
      R(g, x + 13 + (i & 1) * 8, y + 51 + i * 4, 1, 3, SS.stoneLn);
      R(g, x + 59 + (i & 1) * 8, y + 51 + i * 4, 1, 3, SS.stoneLn);
    }
    R(g, x + 6, y + 51, 22, 1, SS.stoneHi);
    R(g, x + 52, y + 51, 22, 1, SS.stoneHi);

    /* Porta a due battenti di rovere, centrata sulla cella D (12,20). */
    var ssD = x + 32, ssDT = y + 30;
    R(g, ssD - 4, ssDT - 1, 24, 33, SS.oakDk);
    R(g, ssD - 3, ssDT, 22, 32, SS.oak);
    R(g, ssD - 1, ssDT + 2, 18, 30, SS.oakDk);
    R(g, ssD, ssDT + 3, 16, 29, SS.oak);
    R(g, ssD + 7, ssDT + 3, 1, 29, SS.oakDk);
    R(g, ssD + 1, ssDT + 5, 6, 13, SS.glassDk);
    R(g, ssD + 9, ssDT + 5, 6, 13, SS.glassDk);
    R(g, ssD + 2, ssDT + 6, 4, 11, SS.glass);
    R(g, ssD + 10, ssDT + 6, 4, 11, SS.glass);
    R(g, ssD + 6, ssDT + 21, 1, 4, SS.gold);
    R(g, ssD + 9, ssDT + 21, 1, 4, SS.gold);
    R(g, ssD, ssDT + 28, 16, 3, SS.oakDk);

    /* Pennone snello all'estremita' est, sul piazzale. */
    R(g, x + 82, y - 16, 2, 76, SS.pole);
    R(g, x + 83, y - 16, 1, 76, SS.oakDk);
    R(g, x + 81, y - 19, 4, 3, SS.gold);
    R(g, x + 80, y + 58, 7, 4, SS.stoneLn);
    R(g, x + 81, y + 58, 5, 1, SS.stoneHi);

    /* Piazzola 2x1 sulla vera riga calpestabile 21. Collega porta e
     * marciapiede senza sembrare prato casuale. */
    townFoundationShadow(g, x, y + 64, 80, 0x749);
    R(g, x + 24, y + 64, 32, 16, '#34572d');
    R(g, x + 25, y + 65, 30, 14, '#dcd9a9');
    R(g, x + 40, y + 65, 1, 14, '#b5b8ab'); R(g, x + 25, y + 72, 30, 1, '#b5b8ab');
    R(g, x + 4, y + 63, 24, 2, '#34572d'); R(g, x + 52, y + 63, 24, 2, '#34572d');
    townStep(g, x + 30, y + 63, 20, SS.stone);

    /* Double R — landmark autoriale, quality bar edifici (2026-09-07). */
    townDoubleR(g, 39 * 16 - cx, 18 * 16 - cy);

    /* Roadhouse — massa scura, insegna luminosa, portico basso. */
    x = 44 * 16 - cx; y = 25 * 16 - cy;
    townClosedGable(g, x, y, 96, 64, BUILDINGS['6']);
    R(g, x + 31, y - 29, 34, 8, C.ink); R(g, x + 33, y - 27, 30, 5, '#5c3a3a');
    R(g, x + 38, y - 26, 20, 1, '#c06a4e');
    for (i = 5; i < 60; i += 6) {
      R(g, x + 4 + (((i / 6) & 1) * 4), y + i, 84, 1, '#5c3a3a');
      if ((i & 12) === 0) R(g, x + 25 + (i % 18), y + i - 2, 2, 3, '#c06a4e');
    }
    R(g, x + 3, y + 25, 29, 38, C.ink); R(g, x + 6, y + 28, 23, 32, '#5c3a3a');
    for (i = 30; i < 59; i += 6) R(g, x + 7, y + i, 21, 2, '#c06a4e');
    /* Tetto basso dell'ala: separa volume laterale da facciata principale. */
    R(g, x - 4, y + 19, 40, 7, C.ink); R(g, x, y + 21, 32, 3, '#2c1a1f');
    R(g, x + 9, y + 29, 16, 13, C.ink); R(g, x + 12, y + 32, 10, 7, '#caa15a');
    townSignIcon(g, 'note', x + 9, y + 28);
    R(g, x + 10, y + 3, 76, 21, C.ink); R(g, x + 13, y + 6, 70, 15, '#caa15a');
    R(g, x + 15, y + 7, 2, 8, '#2c1a1f'); R(g, x + 17, y + 7, 4, 2, '#2c1a1f');
    R(g, x + 12, y + 14, 5, 3, '#2c1a1f');
    townTinyWord(g, 'ROADHOUSE', x + 23, y + 10, '#2c1a1f');
    /* Fascia luminosa e coronamento incassato: ingresso domina facciata. */
    R(g, x + 34, y + 25, 44, 6, C.ink); R(g, x + 38, y + 27, 36, 2, '#caa15a');
    R(g, x + 38, y + 31, 36, 5, '#5c3a3a');
    R(g, x + 6, y + 30, 84, 4, '#5c3a3a');
    R(g, x + 8, y + 34, 3, 29, C.ink); R(g, x + 85, y + 34, 3, 29, C.ink);
    R(g, x + 40, y + 34, 32, 29, C.ink);
    R(g, x + 43, y + 38, 5, 25, '#5c3a3a'); R(g, x + 64, y + 38, 5, 25, '#5c3a3a');
    R(g, x + 48, y + 36, 16, 28, C.ink); R(g, x + 51, y + 39, 10, 25, '#2c1a1f');
    R(g, x + 56, y + 39, 2, 25, '#caa15a');
    R(g, x + 42, y + 36, 29, 3, '#caa15a');
    R(g, x + 17, y + 38, 18, 14, C.ink); R(g, x + 20, y + 41, 12, 8, '#c06a4e');
    R(g, x + 73, y + 38, 18, 14, C.ink); R(g, x + 76, y + 41, 12, 8, '#c06a4e');
    townStep(g, x + 46, y + 64, 20, '#caa15a');
    townFoundationShadow(g, x, y + 70, 96, 0x74b);
  }

  function redRoomHeroAccents(g) {
    var i;
    /* Quinte sempre in campo: la mappa e' piu' larga del viewport, quindi
     * affidarsi soltanto alle colonne R esterne lasciava la scena senza tende. */
    R(g, 0, 0, 18, 144, '#4c1119'); R(g, 142, 0, 18, 144, '#4c1119');
    for (i = 0; i < 18; i += 6) {
      R(g, i, 0, 3, 144, '#8f2430'); R(g, i + 3, 0, 2, 144, '#c1585a');
      R(g, 142 + i, 0, 3, 144, '#8f2430'); R(g, 145 + i, 0, 2, 144, '#c1585a');
    }
    R(g, 0, 0, 160, 5, C.ink); R(g, 0, 5, 160, 5, '#8f2430');
    for (i = 0; i < 160; i += 16) {
      R(g, i, 7, 8, 5, '#c1585a'); R(g, i + 8, 7, 8, 7, '#4c1119');
    }
    R(g, 17, 0, 2, 144, C.ink); R(g, 141, 0, 2, 144, C.ink);
  }

  function traincarHeroAccents(g, cx, cy) {
    var x = 8 * 16 - cx, y = 3 * 16 - cy, i;
    /* Guscio e rotaie: arte continua; percorso e collisioni restano ASCII. */
    R(g, x - 3, y - 4, 134, 3, C.ink); R(g, x, y - 1, 128, 2, '#a07850');
    R(g, x - 2, y + 50, 132, 3, C.ink);
    for (i = 5; i < 124; i += 16) {
      R(g, x + i, y + 5, 1, 42, '#715d48');
      R(g, x + i + 4, y + 9, 7, 5, C.ink); R(g, x + i + 5, y + 10, 5, 3, '#d0a868');
      if (i === 21) {
        /* Vetro incrinato: tre segmenti, non rumore uniforme. */
        R(g, x + i + 7, y + 10, 1, 2, '#715d48');
        R(g, x + i + 6, y + 11, 1, 1, C.paper);
        R(g, x + i + 8, y + 12, 2, 1, '#715d48');
      } else if (i === 37) {
        R(g, x + i + 5, y + 10, 5, 3, '#171f26');
        R(g, x + i + 6, y + 10, 1, 3, '#d0a868'); R(g, x + i + 8, y + 11, 2, 1, '#715d48');
      } else if (i === 85) {
        /* Baia tamponata: assi irregolari sopra finestra, danno localizzato. */
        R(g, x + i + 3, y + 8, 10, 2, '#715d48');
        R(g, x + i + 5, y + 11, 8, 2, '#a07850');
        R(g, x + i + 7, y + 8, 1, 5, C.ink);
      } else if (i === 101) {
        R(g, x + i + 3, y + 9, 9, 2, '#a07850');
        R(g, x + i + 4, y + 13, 8, 2, '#715d48');
      } else if (i === 117) {
        R(g, x + i + 4, y + 9, 3, 2, '#171f26');
        R(g, x + i + 9, y + 12, 3, 2, '#715d48');
      }
      if ((i & 31) === 5) R(g, x + i + 2, y + 20, 10, 1, '#a07850');
      else R(g, x + i + 4, y + 27, 8, 1, '#715d48');
    }
    /* Portello strappato: apertura scura e tavole interrotte diventano il
     * punto focale investigativo, sopra il rumore delle rotaie. */
    R(g, x + 45, y + 29, 34, 27, C.ink); R(g, x + 49, y + 33, 26, 23, '#40382f');
    R(g, x + 52, y + 35, 20, 18, '#40382f');
    R(g, x + 55, y + 37, 14, 14, '#171f26');
    R(g, x + 55, y + 37, 5, 3, '#715d48'); R(g, x + 64, y + 48, 5, 3, '#715d48');
    R(g, x + 58, y + 40, 2, 8, '#d0a868'); R(g, x + 65, y + 39, 2, 7, '#a07850');
    R(g, x + 45, y + 28, 34, 4, '#a07850');
    R(g, x + 48, y + 32, 3, 24, '#715d48'); R(g, x + 75, y + 32, 3, 24, '#715d48');
    R(g, x + 57, y + 46, 12, 2, '#d0a868'); R(g, x + 60, y + 43, 5, 3, C.paper);
    R(g, x - 2, y + 55, 132, 3, C.ink); R(g, x + 2, y + 57, 124, 1, '#a07850');
    /* Ruote + binari compatti: chassis resta gerarchicamente dominante. */
    R(g, x - 8, y + 60, 144, 15, '#b9a772');
    for (i = -4; i < 136; i += 12) R(g, x + i, y + 61, 6, 13, '#715d48');
    R(g, x - 8, y + 63, 144, 3, C.ink); R(g, x - 8, y + 71, 144, 3, C.ink);
    for (i = 12; i < 116; i += 28) {
      R(g, x + i, y + 51, 12, 8, C.ink); R(g, x + i + 3, y + 53, 6, 4, '#715d48');
    }
    R(g, x - 2, y + 55, 132, 2, C.ink);
  }

  function sceneHeroAccents(g, map, cx, cy) {
    if (!map) return;
    if (map.id === 'redroom') redRoomHeroAccents(g);
    else if (map.id === 'traincar') traincarHeroAccents(g, cx, cy);
  }

  /* Contratto semantico dei props R75. `physical` deve stare solo su tile
   * solidi reali; `soft` descrive tende/decorazioni volutamente passabili. */
  var INTERIOR_PROP_FOOTPRINTS = [
    { id:'sheriff-phones', map:'sheriff', kind:'physical', cells:[[8,4],[2,7]] },
    { id:'palmer-sofa', map:'palmer', kind:'physical', cells:[[3,6]] },
    { id:'palmer-dining', map:'palmer', kind:'physical', cells:[[2,8],[3,8],[2,9],[3,9]] },
    { id:'palmer-sideboard', map:'palmer', kind:'physical', cells:[[14,6]] },
    // E8 lobby (js/hotel-gn-scene.js rows): reception counter 11..14,8; hearth 2..5,4; lounge chair/table/chair
    // 4..6,6; luggage bay 17,6; the runner and the stair to the hall door (16,1) are walked on, so they are soft.
    { id:'hotel-reception', map:'hotel_gn', kind:'physical', cells:[[11,8],[12,8],[13,8],[14,8]] },
    { id:'hotel-lobby-rug', map:'hotel_gn', kind:'soft', cells:[[9,7],[10,7],[9,8],[10,8],[9,9],[10,9]] },
    { id:'hotel-luggage', map:'hotel_gn', kind:'physical', cells:[[17,6]] },
    { id:'hotel-seating', map:'hotel_gn', kind:'physical', cells:[[4,6],[5,6],[6,6]] },
    { id:'hotel-hearth', map:'hotel_gn', kind:'physical', cells:[[2,4],[3,4],[4,4],[5,4]] },
    { id:'hotel-staircase', map:'hotel_gn', kind:'soft', cells:[[16,2],[16,3]] },
    /* Reparto nativo (js/hospital-art.js): la tenda e' una struttura solida a tutta altezza. */
    { id:'hospital-curtain', map:'hospital', kind:'physical', cells:[[8,3],[8,4],[8,5]] },
    { id:'hospital-monitor', map:'hospital', kind:'physical', cells:[[1,3],[2,3]] },
    { id:'hospital-beds', map:'hospital', kind:'physical', cells:[[3,3],[4,3],[3,4],[4,4],[3,5],[4,5],[9,3],[10,3],[9,4],[10,4],[9,5],[10,5]] },
    { id:'hospital-counter', map:'hospital', kind:'physical', cells:[[12,8],[13,8],[14,8]] },
    { id:'hospital-chair', map:'hospital', kind:'physical', cells:[[1,6]] },
    { id:'diner-coffee', map:'diner', kind:'physical', cells:[[4,3],[5,3]] },
    { id:'diner-booths', map:'diner', kind:'physical', cells:[[1,6],[2,6],[3,6],[10,6],[11,6],[12,6],[1,8],[2,8],[3,8],[10,8],[11,8],[12,8],[6,6],[8,6]] },
    { id:'diner-counter-stools', map:'diner', kind:'physical', cells:[[2,4],[4,4],[6,4],[8,4],[10,4],[2,5],[12,5],[2,7],[12,7]] },
    /* Map-row pass 2026-09-20: the mirrored corner grid is retired. Craps and
     * blackjack along the north drape, roulette on the centre carpet, poker
     * south-east; three of the seat cells carry a painted seated patron. */
    { id:'oej-felt-tables', map:'oej', kind:'physical', cells:[[2,2],[3,2],[4,2],[10,2],[11,2],[4,6],[5,6],[6,6],[9,7],[10,7]] },
    { id:'oej-bar-counter', map:'oej', kind:'physical', cells:[[5,4],[6,4],[7,4],[8,4],[9,4],[10,4]] },
    { id:'oej-seating', map:'oej', kind:'physical', cells:[[3,1],[11,1],[5,5],[11,7],[4,8]] },
    { id:'oej-lounge', map:'oej', kind:'physical', cells:[[1,7],[1,8],[3,8],[14,8]] },
    { id:'oej-service', map:'oej', kind:'physical', cells:[[14,2]] },
    { id:'roadhouse-bar-stools', map:'roadhouse', kind:'physical', cells:[[3,5],[9,5]] },
    { id:'roadhouse-stage', map:'roadhouse', kind:'physical', cells:[[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1]] }
  ];

  /* Contratto dati R80. Anchor e door sono coordinate tile reali; visualBounds
   * descrive ingombro artistico relativo in pixel. Test e renderer condividono
   * questa fonte per impedire anchor stale e porte decorative false. */
  var TOWN_STRUCTURE_DEFS = [
    { id:'great-northern', ch:'4', anchor:[6,4], component:[6,3,6,4], door:[9,6], visualBounds:[-1,-22,98,86], cameraFocus:[9,7], materialKit:'lodge' },
    { id:'hospital', ch:'5', anchor:[20,3], component:[20,3,6,4], door:[23,6], visualBounds:[-1,-27,98,113], cameraFocus:[23,7], materialKit:'clinical' },
    { id:'palmer', ch:'3', anchor:[40,4], component:[40,4,4,3], door:[42,6], visualBounds:[-5,-22,71,83], cameraFocus:[42,7], materialKit:'home' },
    { id:'bookhouse', ch:'7', anchor:[28,2], component:[28,2,3,3], door:null, visualBounds:[-1,-27,50,84], cameraFocus:[29,7], materialKit:'timber-lodge-meeting' },
    { id:'hornes', ch:'9', anchor:[33,3], component:[33,3,3,3], door:null, visualBounds:[-1,-29,50,86], cameraFocus:[34,7], materialKit:'deco' },
    { id:'pharmacy', ch:'0', anchor:[15,10], component:[15,10,3,3], door:null, visualBounds:[-1,-22,50,76], cameraFocus:[16,14], materialKit:'pharmacy' },
    { id:'hardware', ch:'0', anchor:[19,10], component:[19,10,2,3], door:null, visualBounds:[-1,-29,37,80], cameraFocus:[20,14], materialKit:'hardware' },
    { id:'newsstand', ch:'0', anchor:[46,10], component:[46,10,3,2], door:null, visualBounds:[-7,-25,62,62], cameraFocus:[47,14], materialKit:'news' },
    { id:'sheriff', ch:'1', anchor:[10,17], component:[10,17,5,4], door:[12,20], visualBounds:[-1,-32,84,113], cameraFocus:[12,21], materialKit:'civic' },
    { id:'double-r', ch:'2', anchor:[39,18], component:[39,18,6,3], door:[42,20], visualBounds:[-1,-22,98,81], cameraFocus:[42,21], materialKit:'diner' },
    { id:'roadhouse', ch:'6', anchor:[44,25], component:[44,25,6,4], door:[47,28], visualBounds:[-4,-29,101,104], cameraFocus:[47,29], materialKit:'venue' }
  ];

  function townShrubCluster(g, x, y, flower) {
    softPixelShadow(g, x + 1, y + 6, 18, 4, HG.shadowDark, HG.shadow);
    var lobes = [[0,4,6,4],[3,2,7,6],[8,1,7,7],[13,3,6,5],[6,5,7,4]];
    for (var li = 0; li < lobes.length; li++) {
      var l = lobes[li];
      R(g, x + l[0], y + l[1], l[2], l[3], li & 1 ? HG.grassDark : '#5b8d72');
      R(g, x + l[0] + 2, y + l[1] + 1, Math.max(2, l[2] - 4), 2,
        li === 2 ? '#80b878' : '#639b72');
    }
    if (flower) {
      R(g, x + 2, y + 4, 2, 2, flower);
      R(g, x + 8, y + 1, 2, 2, HG.flowerGold);
      R(g, x + 14, y + 3, 2, 2, HG.flowerWhite);
    }
  }

  function townFlowerBed(g, x, y, salt) {
    softPixelShadow(g, x + 1, y + 5, 21, 4, HG.shadowDark, HG.shadow);
    R(g, x, y + 2, 22, 5, '#6f6446');
    R(g, x + 1, y + 2, 20, 2, '#9b8254');
    for (var i = 0; i < 5; i++) {
      var fx = x + 1 + i * 4, fy = y + 1 + ((i + salt) & 1);
      R(g, fx, fy, 2, 2, i & 1 ? HG.flowerPink : HG.flowerWhite);
      R(g, fx + 1, fy - 1, 1, 1, i === 2 ? HG.flowerGold : HG.grassHi);
      R(g, fx + 1, fy + 2, 1, 2, HG.grassMid);
    }
  }

  function townPlanterAnchor(g, x, y, flower) {
    softPixelShadow(g, x + 2, y + 6, 19, 4, HG.shadowDark, HG.shadow);
    R(g, x + 1, y + 4, 20, 6, '#5d4d37');
    R(g, x + 2, y + 4, 18, 2, '#9b8254');
    R(g, x + 4, y + 2, 3, 3, HG.grassDark);
    R(g, x + 9, y, 4, 5, '#639b72');
    R(g, x + 15, y + 2, 3, 3, HG.grassMid);
    R(g, x + 5, y + 1, 2, 2, flower || HG.flowerWhite);
    R(g, x + 10, y - 1, 2, 2, HG.flowerGold);
    R(g, x + 16, y + 1, 2, 2, flower === HG.flowerPink ? HG.flowerWhite : HG.flowerPink);
  }

  function townFenceAnchor(g, x, y, w, flip) {
    softPixelShadow(g, x + 2, y + 8, w, 4, HG.shadowDark, HG.shadow);
    R(g, x, y + 3, w, 2, '#5d4935');
    R(g, x + 1, y + 3, w - 2, 1, '#c49b5c');
    R(g, x + 2, y + 8, w - 1, 2, '#5d4935');
    R(g, x + 3, y + 8, w - 3, 1, '#b18a56');
    for (var i = flip ? 4 : 1; i < w; i += 10) {
      R(g, x + i, y, 4, 12, '#5d4935');
      R(g, x + i + 1, y + 1, 2, 10, '#c49b5c');
    }
  }

  function townBenchAnchor(g, x, y, flip) {
    softPixelShadow(g, x + 1, y + 9, 25, 4, HG.shadowDark, HG.shadow);
    R(g, x + 2, y + 1, 22, 3, '#4a382d');
    R(g, x + 3, y + 1, 20, 1, '#b88758');
    R(g, x, y + 6, 27, 3, '#4a382d');
    R(g, x + 2, y + 6, 23, 1, '#c09761');
    R(g, x + (flip ? 19 : 4), y + 9, 3, 4, '#4a382d');
    R(g, x + (flip ? 5 : 20), y + 9, 3, 4, '#4a382d');
  }

  function townUtilityAnchor(g, x, y, kind) {
    var body = kind === 'red' ? '#a84b45' : (kind === 'blue' ? '#527f89' : '#718d70');
    var light = kind === 'red' ? '#db8a72' : (kind === 'blue' ? '#8fb7b1' : '#a9b98e');
    softPixelShadow(g, x + 1, y + 10, 15, 4, HG.shadowDark, HG.shadow);
    R(g, x + 2, y + 1, 14, 13, '#33453d');
    R(g, x + 3, y + 2, 12, 10, body);
    R(g, x + 4, y + 3, 10, 2, light);
    R(g, x + 5, y + 7, 8, 1, '#33453d');
    R(g, x + 11, y + 9, 2, 2, light);
    R(g, x, y + 13, 18, 2, '#33453d');
  }

  function townCargoAnchor(g, x, y, salt) {
    softPixelShadow(g, x + 1, y + 9, 22, 4, HG.shadowDark, HG.shadow);
    R(g, x, y + 4, 13, 10, '#49372d');
    R(g, x + 2, y + 5, 9, 7, '#a8734d');
    R(g, x + 3, y + 7, 7, 1, '#d0a068');
    R(g, x + 12, y, 11, 14, '#49372d');
    R(g, x + 14, y + 2, 7, 10, salt & 1 ? '#8f7650' : '#b88758');
    R(g, x + 15, y + 4, 5, 1, '#d0a068');
  }

  /* R113 — un kit asimmetrico per luogo. Tutto resta aderente agli angoli
   * solidi della facciata; asse porta e due tile di avvicinamento restano
   * vuoti. La decorazione non cambia collisione. */
  function townBuildingLandscape(g, map, cx, cy) {
    if (!map || map.id !== 'town') return;
    for (var i = 0; i < TOWN_STRUCTURE_DEFS.length; i++) {
      var d = TOWN_STRUCTURE_DEFS[i];
      var x = d.component[0] * 16 - cx;
      var y = (d.component[1] + d.component[3]) * 16 - cy - 7;
      var w = d.component[2] * 16;
      /* Solo undici landmark: disegnarli tutti costa poco e impedisce che
       * panchine/fioriere con sporto appaiano quando l'anchor entra nel
       * range camera. Canvas clippa naturalmente elementi fuori schermo. */
      if (d.id === 'great-northern') {
        townFenceAnchor(g, x - 18, y - 2, 29, false);
        townPlanterAnchor(g, x + w - 22, y + 1, HG.flowerPink);
      } else if (d.id === 'hospital') {
        townUtilityAnchor(g, x + 3, y - 4, 'blue');
        townPlanterAnchor(g, x + w - 23, y + 1, HG.flowerWhite);
      } else if (d.id === 'palmer') {
        townPlanterAnchor(g, x - 3, y + 1, HG.flowerPink);
        townFenceAnchor(g, x + w - 10, y - 2, 27, true);
      } else if (d.id === 'bookhouse') {
        townBenchAnchor(g, x - 8, y - 2, false);
        townShrubCluster(g, x + w - 16, y, HG.flowerGold);
      } else if (d.id === 'hornes') {
        townUtilityAnchor(g, x - 5, y - 4, 'red');
        townPlanterAnchor(g, x + w - 18, y + 1, HG.flowerWhite);
      } else if (d.id === 'pharmacy') {
        townPlanterAnchor(g, x - 5, y + 1, HG.flowerWhite);
        townUtilityAnchor(g, x + w - 13, y - 4, 'blue');
      } else if (d.id === 'hardware') {
        townCargoAnchor(g, x - 7, y - 4, i);
        townFenceAnchor(g, x + w - 6, y - 1, 22, true);
      } else if (d.id === 'newsstand') {
        townBenchAnchor(g, x - 10, y - 1, true);
        townPlanterAnchor(g, x + w - 18, y + 2, HG.flowerGold);
      } else if (d.id === 'sheriff') {
        /* Tre isole laterali ricompongono la radura; centro e porta liberi. */
        townBenchAnchor(g, x - 27, y - 2, false);
        townPlanterAnchor(g, x + 2, y + 2, HG.flowerWhite);
        townUtilityAnchor(g, x + w + 5, y - 4, 'blue');
      } else if (d.id === 'double-r') {
        townBenchAnchor(g, x - 14, y - 2, true);
        townPlanterAnchor(g, x + w - 22, y + 2, HG.flowerPink);
      } else if (d.id === 'roadhouse') {
        townFenceAnchor(g, x - 17, y - 2, 29, false);
        townUtilityAnchor(g, x + w - 14, y - 4, 'red');
      }
    }
  }

  /* ------------------------------------------------------------------
   * Double R — INTERNO v2 (2026-09-07), quality bar per gli interni.
   * Riferimento: board "Interior Redesign". La mappa 14x10 e' la verita'
   * della collisione; il disegno la legge (i/C/h/t/D) e usa i 16px di
   * margine fuori mappa per pareti alte: fondo 32px, fianchi 32px, fronte
   * 32px. Ordine: pavimento → pareti → bancone → sedute → tavoli → props.
   * ------------------------------------------------------------------ */
  /* What the room says is content of its interior model (model.signage);
   * how a sign is built is not. Without signage this is the Double R. */
  var DINER_SIGNAGE = { brand:'DOUBLE', mark:'R', pledge:['DAMN','GOOD','COFFEE'],
    menu:[['COFFEE','2.00'],['PIE','3.50']], caseLabel:'PIE', specials:['TODAY','PIE','3.50'], monogram:'RR' };
  /* The house monogram is painted deep inside the booth kit, several calls
   * below the model; the room painter sets it for the duration of its pass. */
  KIT.setDefaultSignage(DINER_SIGNAGE); KIT.setMonogram(DINER_SIGNAGE.monogram);
  function signageOf(model) { return (model && model.signage) || DINER_SIGNAGE; }
  function interiorBackbar(g,x,y,p,sign) {
    sign = sign || DINER_SIGNAGE;
    interiorPanel(g,x,y-14,224,58,p);
    // The quiet work floor continues behind the counter; board joints belong
    // at its exposed ends, not as stripes through the staff silhouette.
    R(g,x+16,y+30,192,18,'#67513b');
    R(g,x+16,y+40,24,1,'#493a2d'); R(g,x+179,y+40,29,1,'#493a2d');
    // One recessed working zone connects coffee, staff and pastry service.
    // Equipment breaks its silhouette; no decorative architectural bays.
    R(g,x+40,y+12,139,34,p.woodDark);
    R(g,x+42,y+14,135,31,'#17251e');
    R(g,x+40,y+12,139,2,p.woodHi);
    R(g,x+40,y+14,2,31,p.woodHi);
    R(g,x+177,y+14,2,31,p.wood);
    R(g,x+42,y+14,135,2,p.ink);
    // Side service door, clock and local coffee pledge.
    R(g,x+17,y+2,21,36,p.woodDark); R(g,x+19,y+3,17,33,p.redDark);
    R(g,x+21,y+5,13,21,p.red); R(g,x+24,y+10,7,7,p.gold);
    R(g,x+25,y+11,5,5,p.metal); R(g,x+32,y+25,2,2,p.gold);
    interiorPicture(g,x+18,y-11,18,12,p,'photo');
    interiorPicture(g,x+187,y-11,16,16,p,'clock');
    R(g,x+184,y+7,25,23,p.woodDark); R(g,x+185,y+8,23,21,p.creamShade);
    townMicroWord(g,sign.pledge[0],x+188,y+10,p.ink); townMicroWord(g,sign.pledge[1],x+188,y+16,p.ink);
    townMicroWord(g,sign.pledge[2],x+186,y+22,p.ink);
    interiorNeon(g,x+72,y-13,p,sign);
    // The menu owns a quiet dark panel; equipment sits below, never over text.
    interiorMenuBoard(g,x+143,y-12,p,sign.menu);
    // Asymmetric clusters: family photos, stacked crockery and pantry jars.
    interiorPicture(g,x+43,y-10,14,14,p,'photo');
    R(g,x+41,y+10,29,2,p.woodLight);
    [43,53,64].forEach(function(dx,n) {
      R(g,x+dx,y+14-(n%2)*3,4,8+(n%2)*3,n===2?p.green:p.creamShade);
      R(g,x+dx,y+13-(n%2)*3,4,2,n===2?p.gold:p.metal);
      R(g,x+dx+1,y+17,2,2,n%2?p.red:p.woodHi);
    });
    [77,85,111,126,151,159,168].forEach(function(dx,n) {
      var shelfY=n<4?17:23;
      if(n===3) { R(g,x+dx,y+shelfY-4,5,8,p.green); R(g,x+dx+1,y+shelfY-6,3,2,p.gold); }
      else { R(g,x+dx,y+shelfY,5,5,p.creamShade); R(g,x+dx+1,y+shelfY,3,1,p.cream); }
    });
    // A single crockery ledge replaces the doubled horizontal rails.
    R(g,x+76,y+23,57,1,p.woodLight);
    // Storage stays with the two service clusters. The open middle leaves
    // real visual room for Norma rather than drawer handles behind her body.
    R(g,x+42,y+29,27,10,p.wood); R(g,x+44,y+29,23,1,p.woodHi);
    R(g,x+53,y+32,5,1,p.gold);
    R(g,x+131,y+29,45,10,p.wood); R(g,x+133,y+29,41,1,p.woodHi);
    R(g,x+151,y+30,1,8,p.woodDark);
    R(g,x+140,y+32,4,1,p.gold); R(g,x+162,y+32,4,1,p.gold);
    R(g,x+70,y+39,35,6,'#17251e');
    R(g,x+106,y+24,22,12,p.ink); R(g,x+107,y+25,20,9,p.metal);
    R(g,x+109,y+27,6,5,p.woodDark); R(g,x+118,y+27,7,5,p.woodDark);
    R(g,x+109,y+27,6,1,p.gold); R(g,x+118,y+27,7,1,p.gold);
    R(g,x+108,y+34,17,1,p.metalHi);
    R(g,x+106,y+36,23,1,'rgba(41,43,38,.40)');
    R(g,x+55,y+22,7,13,p.ink); R(g,x+56,y+23,5,10,p.metal);
    R(g,x+57,y+24,1,7,p.metalHi); R(g,x+56,y+32,5,1,p.woodDark);
    R(g,x+140,y+24,10,11,p.creamShade); R(g,x+141,y+25,8,1,p.cream);
    townMicroWord(g,sign.caseLabel,x+140,y+28,p.redDark);
    // Dark upper corners give warm practicals an actual value range.
    R(g,x,y-12,15,55,'rgba(19,21,16,.26)'); R(g,x+208,y-12,16,55,'rgba(19,21,16,.3)');
    [38,68,188].forEach(function(lx) {
      interiorWarmLight(g,x+lx-20,y+9,43,34,lx===188?.85:.65);
      interiorPendant(g,x+lx,y-14,p);
      R(g,x+lx-8,y+19,8,1,p.woodLight);
      R(g,x+lx+3,y+20,4,1,p.woodHi);
    });
  }
  function drawDinerCounter(g,model,x,y,p) {
    var i;
    // Furniture bases and widths come from the same generated collision model.
    var counterX=x+model.counter[0]*16, counterY=y+model.counter[1]*16, counterW=model.counter[2]*16;
    /* The Double R's counter is its own drawing; interiorCounterSlab above is the
     * kit's plain slab for a room composed elsewhere. */
    R(g,counterX+2,counterY+16,counterW-2,5,'rgba(32,26,19,.28)');
    interiorContact(g,counterX+1,counterY+18,counterW-2,p);
    R(g,counterX,counterY,counterW,17,p.ink);
    // Broad vinyl front, with quiet construction joints rather than a row
    // of highlighted inset boxes competing with the crockery above.
    R(g,counterX+1,counterY+6,counterW-2,8,p.redDark);
    R(g,counterX+2,counterY+6,counterW-4,6,p.red);
    R(g,counterX+3,counterY+6,counterW-6,1,p.redHi);
    for(i=48;i<counterW-4;i+=48) R(g,counterX+i,counterY+8,1,4,p.redDark);
    R(g,counterX+5,counterY+7,31,1,'#a2444e');
    R(g,counterX+counterW-40,counterY+7,27,1,'#a2444e');
    // The top extends rearward within the existing service footprint; its
    // front lip and compressed plinth remain on the original depth boundary.
    R(g,counterX,counterY-4,counterW,9,p.creamShade);
    R(g,counterX+1,counterY-4,counterW-2,7,'#dfcca4');
    R(g,counterX+32,counterY-3,34,5,p.cream);
    R(g,counterX+1,counterY-4,counterW-2,1,p.creamShade);
    R(g,counterX+1,counterY+4,counterW-2,1,p.metalHi);
    R(g,counterX+2,counterY+14,counterW-4,1,p.metal);
    R(g,counterX+3,counterY+15,counterW-6,1,p.woodDark);
    // Leave a clean usable patch between coffee and the pie-service cluster.
    R(g,counterX+34,counterY-2,28,1,p.metalHi);
    interiorServiceCluster(g,counterX+3,counterY-17,p,'coffee');
    interiorServiceCluster(g,counterX+67,counterY-14,p,'plates'); interiorPieCase(g,counterX+counterW-49,counterY-15,48,p);
    interiorCup(g,counterX+35,counterY-3,p); interiorCup(g,counterX+75,counterY-3,p);
    interiorServiceCluster(g,x+185,y+31,p,'register');
    interiorWarmLight(g,counterX+2,counterY-6,44,19,.8);
    interiorWarmLight(g,counterX+counterW-43,counterY-10,43,24,1.25);
    if(GAME.CharacterActivity) GAME.CharacterActivity.drawWipe(g,-x,-y);
  }
  var DINER_ACTOR_LIGHTS = [[38,22],[68,22],[188,22],[7,83],[216,83],[7,134],[216,134]];
  function interiorRoomOf(mapId) {
    if (mapId === 'diner') return { material: INTERIOR_MATERIALS.diner, lights: DINER_ACTOR_LIGHTS };
    var scene = INTERIOR_SCENES[mapId];
    return scene ? { material: INTERIOR_MATERIALS[scene.material], lights: scene.actorLights || [] } : null;
  }

  function drawDinerInterior(g,map,cx,cy) {
    var model=map.interior, p=INTERIOR_MATERIALS[model.material], x=-cx, y=-cy, i;
    KIT.setMonogram(signageOf(model).monogram);
    R(g,0,0,g.canvas ? g.canvas.width : 256,g.canvas ? g.canvas.height : 192,'#17251e');
    // Restore a continuous floor beneath furniture, with 8px checker tiles.
    /* The Double R's floor is its own loop, as the counter is its own drawing;
     * interiorCheckerFloor is the kit's, for a room composed elsewhere. */
    /* The checker is phased on the TILE grid, not on its own 8px run: each
     * 16px room tile carries one complete light/dark quad, so the floor lines
     * up with the booth fronts at y=112 and y=144 and with the counter and
     * door tiles rather than drifting against them. */
    for(var fy=16;fy<144;fy+=8) for(var fx=16;fx<208;fx+=8) {
      var dark=(((fx-16)/8)+((fy-16)/8))&1;
      R(g,x+fx,y+fy,8,8,dark?p.tile:p.floorLight);
      R(g,x+fx,y+fy+7,8,1,dark?p.tileShade:p.floorShade);
      // Sparse, deterministic value changes; no random dirt or per-frame noise.
      var tileKey=(fx/8*7+fy/8*11)%19;
      if(tileKey===3) R(g,x+fx+1,y+fy+1,6,5,'rgba(207,188,146,.055)');
      if(tileKey===12) R(g,x+fx+1,y+fy+2,5,4,'rgba(41,43,38,.035)');
      if(fx>=104 && fx<=120 && fy>=80 && fy%24===8)
        R(g,x+fx+2,y+fy+3,4,1,'rgba(244,230,200,.09)');
      /* Grout on the 16px boundaries: the line the eye uses to see that the
       * floor grid and the room grid are the same grid. */
      if(fx%16===0) R(g,x+fx,y+fy,1,8,'rgba(41,43,38,.16)');
      if(fy%16===0) R(g,x+fx,y+fy,8,1,'rgba(41,43,38,.16)');
    }
    // Lower-contrast floor, wall contact shadows and localized warm pools.
    R(g,x+16,y+44,192,8,'rgba(32,28,21,.20)');
    R(g,x+16,y+48,5,96,'rgba(34,29,21,.19)'); R(g,x+202,y+48,6,96,'rgba(34,29,21,.23)');
    interiorWarmLight(g,x+25,y+55,58,25,.65);
    interiorWarmLight(g,x+140,y+55,57,25,.9);
    interiorPanel(g,x,y+28,16,116,p); interiorPanel(g,x+208,y+28,16,116,p);
    interiorBackbar(g,x,y,p,signageOf(model));
    drawDinerCounter(g,model,x,y,p);
    model.stools.forEach(function(a){interiorStool(g,x+a[0]*16,y+a[1]*16,p);});
    model.booths.forEach(function(a,n){
      interiorBooth(g,x+a[0]*16,y+a[1]*16,a[2]*16,p,n,model.guests[n]);
      var boothGuest=model.guests[n];
      if(boothGuest) {
        var boothLightX=x+a[0]*16+(boothGuest.seat==='left'?2:15);
        interiorWarmLight(g,boothLightX,y+a[1]*16-15,31,30,1.05);
      } else interiorWarmLight(g,x+a[0]*16+3,y+a[1]*16-4,42,19,n===3?.12:.6);
    });
    interiorSpecials(g,x+model.specials[0]*16,y+model.specials[1]*16,p,signageOf(model).specials);
    interiorFloorPlant(g,x+model.islandPlant[0]*16-4,y+model.islandPlant[1]*16,p);
    interiorPlant(g,x+model.plant[0]*16,y+model.plant[1]*16+2,p);
    interiorCoatRack(g,x+model.coatRack[0]*16,y+model.coatRack[1]*16,p);
    // Hanging plants occupy side-wall trim; aisle remains truly walkable.
    /* Two large frames on the west wall and one on the east, each clear of
     * the lamps at y=68 and y=119. Four small ones down a strip was the
     * speckle a fresh critic saw at 1x. */
    interiorPicture(g,x+1,y+30,13,28,p,'photo');
    interiorPicture(g,x+1,y+88,13,26,p,'portrait');
    interiorPicture(g,x+210,y+40,12,26,p,'photo');
    [68,119].forEach(function(ly){
      interiorWarmLight(g,x+1,y+ly+1,30,20,ly===119?.7:.9); interiorWarmLight(g,x+193,y+ly+1,30,20,ly===119?.35:.8);
      interiorLamp(g,x+7,y+ly,p);interiorLamp(g,x+216,y+ly,p);
    });
    // Low cutaway front wall and the two genuine entrance tiles.
    interiorFrontWall(g,x+16,y+144,192,x+96,p);
  }

  function interiorHeroAccents(g, map, cx, cy) {
    if (!map || !map.indoor) return;
    var x, y, i;
    if (map.id === 'sheriff') {
      /* Bacheca casi e telefoni sulle scrivanie: ufficio di polizia, non lobby. */
      x = 3 * 16 - cx; y = 1 * 16 - cy;
      R(g, x, y + 2, 62, 12, C.ink); R(g, x + 2, y + 4, 58, 8, '#c9b878');
      for (i = 5; i < 55; i += 12) { R(g, x + i, y + 5, 7, 4, C.paper); R(g, x + i + 1, y + 10, 5, 1, '#6a8a43'); }
      [[2,2],[6,2]].forEach(function (p) {
        var px = p[0] * 16 - cx, py = p[1] * 16 - cy;
        R(g, px + 5, py + 5, 7, 5, C.ink); R(g, px + 6, py + 6, 5, 2, '#9aab69');
        R(g, px + 4, py + 4, 3, 2, C.ink); R(g, px + 10, py + 4, 3, 2, C.ink);
        R(g, px + 2, py + 14, 28, 3, '#34572d');
        R(g, px + 6, py + 14, 20, 1, '#6a8a43');
      });
      /* Tappeto sottile e ombre di contatto sulle sole celle già fisiche. */
      x = 4 * 16 - cx; y = 4 * 16 - cy;
      R(g, x - 3, y - 2, 38, 21, '#34572d');
      R(g, x, y, 32, 16, '#9aab69');
      R(g, x + 3, y + 3, 26, 10, '#dcd9a9');
      R(g, x + 2, y + 14, 28, 3, '#34572d');
      [[3,5],[6,5]].forEach(function (p) {
        var px = p[0] * 16 - cx, py = p[1] * 16 - cy;
        R(g, px + 3, py + 13, 11, 3, '#34572d');
      });
      /* Stipite e soglia sulla porta reale x4,y8. */
      x = 4 * 16 - cx; y = 8 * 16 - cy;
      R(g, x - 3, y - 4, 22, 4, C.ink); R(g, x - 2, y - 2, 20, 2, '#9aab69');
      R(g, x - 3, y, 3, 16, C.ink); R(g, x + 16, y, 3, 16, C.ink);
    } else if (map.id === 'palmer') {
      /* Parete domestica + divano sul solo tavolo solido: nessun finto ostacolo. */
      x = 6 * 16 - cx; y = 1 * 16 - cy;
      R(g, x, y + 2, 54, 14, C.ink); R(g, x + 2, y + 4, 15, 10, C.paper);
      R(g, x + 20, y + 5, 12, 9, '#d9c78d'); R(g, x + 35, y + 3, 17, 11, C.paper);
      R(g, x + 7, y + 6, 5, 6, '#6a8a43'); R(g, x + 39, y + 5, 9, 7, '#9aab69');
      x = 3 * 16 - cx; y = 6 * 16 - cy;
      R(g, x, y + 1, 16, 12, C.ink); R(g, x + 2, y + 2, 12, 8, '#9a4f5c');
      R(g, x + 2, y + 4, 12, 2, '#d08376'); R(g, x, y + 10, 3, 5, C.ink); R(g, x + 13, y + 10, 3, 5, C.ink);
      /* Camino sulla parete solida: centro domestico, non ostacolo nuovo. */
      x = 9 * 16 - cx; y = 4 * 16 - cy;
      R(g, x, y + 2, 32, 14, C.ink); R(g, x + 3, y + 4, 26, 10, '#a9754f');
      R(g, x + 9, y + 7, 14, 7, C.ink); R(g, x + 12, y + 9, 8, 5, '#c1585a');
      R(g, x - 3, y, 38, 4, C.ink); R(g, x, y, 32, 2, '#ecd7a4');
      /* Stipiti sul vero varco x4–5: la parete ora legge come porta fra
       * camera e soggiorno, non come taglio della mappa. */
      x = 4 * 16 - cx; y = 4 * 16 - cy;
      R(g, x - 2, y - 2, 36, 4, C.ink); R(g, x, y - 1, 32, 2, '#a9754f');
      R(g, x - 2, y, 3, 16, C.ink); R(g, x + 31, y, 3, 16, C.ink);
      R(g, x + 1, y + 2, 1, 12, '#ecd7a4'); R(g, x + 29, y + 2, 1, 12, '#ecd7a4');
    } else if (map.id === 'hotel_gn') {
      /* Runner continuo porta→scala→corridoio: prima degli arredi fisici. */
      x = 8 * 16 - cx; y = 5 * 16 - cy;
      R(g, x, y, 32, 96, '#34572d'); R(g, x + 3, y, 26, 96, '#9aab69');
      R(g, x + 7, y, 18, 96, '#d8c98a');
      for (i = 4; i < 92; i += 12) { R(g, x + 9, y + i, 4, 4, '#6a8a43'); R(g, x + 19, y + i + 5, 4, 4, '#6a8a43'); }
      R(g, x + 32, y, 64, 16, '#34572d'); R(g, x + 35, y + 3, 58, 10, '#9aab69');
      /* Fascia trasversale unisce reception, salotto e corridoio 315. */
      x = 4 * 16 - cx; y = 7 * 16 - cy;
      R(g, x, y + 2, 112, 14, '#34572d'); R(g, x + 3, y + 4, 106, 10, '#9aab69');
      for (i = 10; i < 100; i += 16) {
        R(g, x + i, y + 7, 7, 4, '#d8c98a');
        R(g, x + i + 2, y + 8, 3, 2, '#6a8a43');
      }
      /* Rastrelliera chiavi solidale al banco: un unico mobile leggibile. */
      x = 4 * 16 - cx; y = 8 * 16 - cy;
      R(g, x + 3, y - 10, 58, 12, C.ink); R(g, x + 5, y - 8, 54, 9, '#a9805a');
      for (i = 8; i < 54; i += 9) { R(g, x + i, y - 7, 1, 6, '#3c2a1e'); R(g, x + i + 2, y - 5, 4, 2, C.gold); }
      R(g, x, y + 2, 64, 14, C.ink); R(g, x + 2, y + 3, 60, 8, '#a9805a');
      R(g, x + 3, y + 4, 58, 2, '#d8c98a');
      R(g, x + 28, y - 1, 8, 4, C.gold); R(g, x + 30, y - 4, 4, 3, C.paper);
      R(g, x + 2, y + 13, 60, 4, '#34572d'); R(g, x + 8, y + 13, 48, 1, '#75593d');
      /* Lampada sospesa: segnale morbido/passabile, asse della hall. */
      x = 10 * 16 - cx; y = 5 * 16 - cy;
      R(g, x + 7, y - 10, 2, 11, C.ink); R(g, x + 2, y, 12, 4, C.ink);
      R(g, x + 4, y + 1, 8, 3, '#d8c98a'); R(g, x + 5, y + 4, 6, 1, '#c1a873');
      /* Grande tappeto passabile: riempie hall senza fingere un ostacolo. */
      x = 5 * 16 - cx; y = 6 * 16 - cy;
      R(g, x - 2, y - 2, 68, 36, C.ink);
      R(g, x, y, 64, 32, '#34572d'); R(g, x + 3, y + 3, 58, 26, '#9aab69');
      R(g, x + 7, y + 7, 50, 18, '#dcd9a9');
      for (i = 10; i < 54; i += 8) R(g, x + i, y + 10 + ((i >> 3) & 1) * 6, 3, 3, '#6a8a43');
      /* Braccio reception e freccia corridoio 315: asse visivo continuo. */
      R(g, x - 17, y + 20, 19, 8, C.ink); R(g, x - 15, y + 22, 17, 4, '#9aab69');
      R(g, x + 62, y + 10, 35, 9, C.ink); R(g, x + 62, y + 12, 33, 5, '#9aab69');
      R(g, x + 89, y + 9, 7, 3, '#d8c98a'); R(g, x + 93, y + 12, 3, 3, '#d8c98a');
      /* Salottino fisico h-t-h e deposito bagagli U. */
      x = 8 * 16 - cx; y = 6 * 16 - cy;
      R(g, x, y, 48, 16, C.ink); R(g, x + 3, y + 3, 42, 10, '#6a8a43');
      R(g, x + 5, y + 4, 13, 6, '#d8c98a'); R(g, x + 30, y + 4, 13, 6, '#d8c98a');
      R(g, x + 7, y + 11, 10, 3, '#34572d'); R(g, x + 31, y + 11, 10, 3, '#34572d');
      R(g, x + 20, y + 5, 8, 9, '#3c2a1e'); R(g, x + 22, y + 7, 4, 3, C.gold);
      R(g, x + 3, y + 14, 42, 3, '#34572d');
      x = 2 * 16 - cx; y = 6 * 16 - cy;
      R(g, x + 2, y + 3, 12, 11, C.ink); R(g, x + 4, y + 5, 8, 7, '#a9805a');
      R(g, x + 5, y + 2, 6, 3, C.ink); R(g, x + 6, y + 3, 4, 2, C.gold);
      R(g, x + 3, y + 13, 11, 3, '#34572d');
      /* Camino in pietra sul muro reale x12: asse lodge della lobby. */
      x = 12 * 16 - cx; y = 2 * 16 - cy;
      R(g, x - 8, y, 24, 34, C.ink); R(g, x - 5, y + 2, 18, 30, '#75593d');
      for (i = 3; i < 29; i += 7) R(g, x - 3 + ((i >> 2) & 1) * 4, y + i, 13, 2, '#a9805a');
      R(g, x - 4, y + 18, 16, 13, C.ink); R(g, x - 1, y + 21, 10, 9, '#3c2a1e');
      R(g, x - 7, y + 15, 22, 4, C.ink); R(g, x - 4, y + 15, 16, 2, '#d8c98a');
      /* Scala centrale su quattro C reali: massa verticale della hall. */
      x = 6 * 16 - cx; y = 4 * 16 - cy;
      R(g, x, y - 14, 64, 31, C.ink); R(g, x + 4, y - 11, 56, 26, '#75593d');
      for (i = 0; i < 6; i++) {
        R(g, x + 8 + i * 4, y + 11 - i * 4, 40 - i * 8, 3, C.ink);
        R(g, x + 10 + i * 4, y + 11 - i * 4, 36 - i * 8, 1, '#d8c98a');
      }
      R(g, x + 4, y - 12, 3, 28, C.ink); R(g, x + 57, y - 12, 3, 28, C.ink);
      for (i = 0; i < 5; i++) {
        R(g, x + 7 + i * 5, y - 10 + i * 4, 2, 5, '#a9805a');
        R(g, x + 55 - i * 5, y - 10 + i * 4, 2, 5, '#a9805a');
      }
      R(g, x + 4, y + 14, 56, 4, '#34572d'); R(g, x + 12, y + 14, 40, 1, '#75593d');
      /* Profondità parete della stanza 315 sul vero muro x12. */
      x = 12 * 16 - cx; y = 0 * 16 - cy;
      R(g, x + 1, y, 4, 64, C.ink); R(g, x + 5, y + 3, 2, 58, '#a9805a');
      R(g, x + 11, y, 4, 64, '#3c2a1e');
      /* Soglia doppia sulla porta reale x8–9,y11. */
      x = 8 * 16 - cx; y = 11 * 16 - cy;
      R(g, x - 4, y - 3, 40, 3, C.ink); R(g, x, y - 2, 32, 2, '#d8c98a');
    } else if (map.id === 'hospital') {
      /* Corridoio ward passabile: collega baie, reception e uscita. */
      x = 5 * 16 - cx; y = 1 * 16 - cy;
      R(g, x, y, 32, 128, '#8faaa4'); R(g, x + 3, y, 26, 128, '#dfe9df');
      R(g, x + 7, y, 18, 128, C.paper);
      for (i = 6; i < 124; i += 16) { R(g, x + 9, y + i, 6, 2, '#9bc0b2'); R(g, x + 18, y + i + 7, 6, 2, '#9bc0b2'); }
      /* Soglie cliniche spezzano corridoio senza fingere muri. */
      [31,63,95].forEach(function (dy, ti) {
        R(g, x + 3, y + dy, 26, 3, '#8faaa4');
        R(g, x + 7 + (ti & 1) * 4, y + dy, 14, 1, '#9bc0b2');
      });
      /* Zona attesa collegata: tappeto passabile reception→sedute. */
      x = 3 * 16 - cx; y = 7 * 16 - cy;
      R(g, x, y + 3, 116, 29, '#dfe9df'); R(g, x + 3, y + 6, 110, 23, '#9bc0b2');
      R(g, x + 7, y + 10, 102, 15, C.paper);
      for (i = 12; i < 105; i += 18) R(g, x + i, y + 13, 6, 2, '#8faaa4');
      /* Tende morbide accanto ai letti: corte, aperte, attraversabili. */
      x = 1 * 16 - cx; y = 1 * 16 - cy;
      [[32,0],[96,32],[112,64]].forEach(function (pair) {
        var dx = pair[0], dy = pair[1];
        R(g, x + dx - 5, y + dy - 3, 22, 2, '#dfe9df');
        R(g, x + dx - 5, y + dy - 1, 22, 1, '#8faaa4');
        R(g, x + dx, y + dy, 1, 17, '#8faaa4'); R(g, x + dx + 2, y + dy + 2, 7, 12, '#dfe9df');
        for (var sy = 4; sy < 13; sy += 4) R(g, x + dx + 3, y + dy + sy, 5, 1, '#8faaa4');
        R(g, x + dx + 9, y + dy + 2, 5, 12, C.paper);
      });
      /* Tre baie complete sui K reali: testiera, lenzuolo, monitor. */
      [[1,1],[5,3],[9,5]].forEach(function (p, bi) {
        var px = p[0] * 16 - cx, py = p[1] * 16 - cy;
        R(g, px, py + 1, 16, 14, C.ink); R(g, px + 2, py + 3, 12, 10, '#dfe9df');
        R(g, px + 3, py + 4, 10, 3, C.paper); R(g, px + 3, py + 8, 10, 4, bi & 1 ? '#9bc0b2' : '#8faaa4');
        R(g, px + 12, py - 4, 8, 7, C.ink); R(g, px + 14, py - 2, 4, 3, '#34572d');
        R(g, px + 14, py - 1, 2, 1, bi === 1 ? C.red : '#9bc0b2');
        R(g, px + 1, py + 13, 17, 3, '#8faaa4');
        R(g, px + 5, py + 13, 9, 1, '#9bc0b2');
      });
      x = 9 * 16 - cx; y = 5 * 16 - cy;
      R(g, x + 2, y + 1, 12, 12, C.ink); R(g, x + 4, y + 3, 8, 6, '#dfe9df');
      R(g, x + 5, y + 6, 3, 1, C.red); R(g, x + 8, y + 4, 2, 4, C.red);
      R(g, x + 8, y + 13, 2, 2, C.ink);
      /* Reception su tre C solide: profondità clinica senza bloccare asse. */
      x = 1 * 16 - cx; y = 7 * 16 - cy;
      R(g, x, y + 2, 48, 14, C.ink); R(g, x + 2, y + 4, 44, 7, '#8faaa4');
      R(g, x + 3, y + 5, 42, 2, '#dfe9df');
      R(g, x + 7, y - 5, 15, 9, C.ink); R(g, x + 9, y - 3, 11, 6, C.paper);
      R(g, x + 12, y - 2, 5, 1, C.red); R(g, x + 13, y, 3, 1, C.red);
      R(g, x + 35, y, 8, 5, C.ink); R(g, x + 37, y + 1, 4, 2, '#dfe9df');
      R(g, x + 2, y + 13, 44, 4, '#8faaa4'); R(g, x + 8, y + 13, 32, 1, '#9bc0b2');
      /* Due sedute reali h: sala d'attesa leggibile, corsia porta libera. */
      [[7,8],[9,8]].forEach(function (p) {
        var px = p[0] * 16 - cx, py = p[1] * 16 - cy;
        R(g, px + 2, py + 1, 12, 13, C.ink); R(g, px + 4, py + 3, 8, 6, '#8faaa4');
        R(g, px + 4, py + 10, 3, 4, '#dfe9df'); R(g, px + 9, py + 10, 3, 4, '#dfe9df');
        R(g, px + 3, py + 14, 11, 2, '#8faaa4');
      });
      /* Porta reale a due ante e cornice profonda. */
      x = 5 * 16 - cx; y = 9 * 16 - cy;
      R(g, x - 4, y - 4, 40, 4, C.ink); R(g, x, y - 2, 32, 2, '#dfe9df');
      R(g, x - 3, y, 3, 16, C.ink); R(g, x + 32, y, 3, 16, C.ink);
    } else if (map.id === 'diner') {
      drawDinerInterior(g, map, cx, cy);
    } else if (INTERIOR_SCENES[map.id]) {
      drawRegisteredInterior(g, map, cx, cy);
    } else if (map.id === 'oej') {
      /* Parete a pannelli e tappeto d'asse: profondità prima dei tavoli. */
      R(g, 10, 17, 140, 23, '#271a24');
      for (i = 13; i < 146; i += 16) {
        R(g, i, 20, 12, 16, '#684351'); R(g, i + 2, 22, 8, 12, '#3d2834');
        R(g, i + 4, 24, 4, 2, C.gold);
      }
      x = 7 * 16 - cx; y = 1 * 16 - cy;
      R(g, x, y, 32, 112, '#3d2834'); R(g, x + 3, y, 26, 112, '#684351');
      R(g, x + 7, y, 18, 112, '#2f4937');
      for (i = 7; i < 108; i += 14) { R(g, x + 10, y + i, 4, 4, C.gold); R(g, x + 18, y + i + 6, 4, 4, '#c1585a'); }
      /* Tavoli in feltro; tende ancorate alle pareti mondo, non alla camera. */
      x = 1 * 16 - cx; R(g, x, 0, 10, 144, '#4c1119');
      for (i = 2; i < 10; i += 5) R(g, x + i, 0, 2, 144, '#c1585a');
      x = 15 * 16 - cx; R(g, x - 10, 0, 10, 144, '#4c1119');
      for (i = 2; i < 10; i += 5) R(g, x - 10 + i, 0, 2, 144, '#c1585a');
      [[3,2],[11,2],[3,7],[11,7]].forEach(function (p, pi) {
        var px = p[0] * 16 - cx, py = p[1] * 16 - cy;
        R(g, px + 1, py + 3, 14, 8, '#31543a'); R(g, px + 3, py + 5, 4, 5, C.paper);
        R(g, px + 9, py + 5, 4, 3, C.gold); R(g, px + 10, py + 8, 4, 3, C.red);
        if (pi === 1) { R(g, px + 2, py + 2, 5, 3, '#c1585a'); R(g, px + 8, py + 8, 5, 2, C.paper); }
        if (pi === 2) { R(g, px + 4, py + 4, 7, 1, C.gold); R(g, px + 12, py + 7, 2, 4, C.ink); }
        if (pi === 3) { R(g, px + 2, py + 7, 4, 3, C.ink); R(g, px + 8, py + 4, 2, 2, '#c1585a'); }
      });
      /* Bicchieri, carte e fiches: cluster diversi, leggibili a 1x. */
      [[3,2],[11,2],[3,7],[11,7]].forEach(function (p, pi) {
        var px = p[0] * 16 - cx, py = p[1] * 16 - cy;
        R(g, px + 4, py + 5, 3, 2, C.paper); R(g, px + 8, py + 6, 2, 2, C.gold);
        R(g, px + 11, py + 4 + (pi & 1), 2, 3, '#c1585a');
      });
      /* Due clienti sulle vere sedute h: silhouette ambientali, collisione
       * gia fisica, layout finalmente non bilaterale. */
      [[3,3,0],[12,6,1]].forEach(function (p) {
        var px = p[0] * 16 - cx, py = p[1] * 16 - cy;
        R(g, px + 5, py + 2, 6, 5, C.ink); R(g, px + 6, py + 3, 4, 3, p[2] ? '#d9c78d' : '#684351');
        R(g, px + 4, py + 7, 8, 7, C.ink); R(g, px + 6, py + 8, 4, 5, p[2] ? '#684351' : '#31543a');
      });
      /* Roulette sul bancone CCCC: punto focale centrale, non nuovo ostacolo. */
      x = 6 * 16 - cx; y = 4 * 16 - cy;
      R(g, x, y + 2, 64, 12, C.ink); R(g, x + 2, y + 4, 60, 8, '#31543a');
      R(g, x + 24, y + 3, 16, 10, C.gold); R(g, x + 27, y + 5, 10, 6, C.ink);
      R(g, x + 30, y + 6, 4, 4, C.red); R(g, x + 31, y - 9, 2, 12, C.ink);
      R(g, x + 25, y - 12, 14, 4, C.ink); R(g, x + 28, y - 11, 8, 2, C.gold);
      /* Tre lampade sospese e pool di luce: atmosfera senza falsa collisione. */
      [4,8,12].forEach(function (lx) {
        var px = lx * 16 - cx, py = 3 * 16 - cy;
        R(g, px + 7, py - 12, 2, 11, C.ink); R(g, px + 3, py - 1, 10, 4, C.ink);
        R(g, px + 5, py, 6, 2, C.gold);
        R(g, px + 2, py + 4, 12, 1, '#684351'); R(g, px + 4, py + 6, 8, 1, '#684351');
      });
    } else if (map.id === 'roadhouse') {
      /* Palco, sipario, fari e microfono: fuoco scenico sulla riga C. */
      x = 1 * 16 - cx; y = 1 * 16 - cy;
      R(g, x, y - 14, 224, 30, '#34572d');
      for (i = 0; i < 224; i += 16) { R(g, x + i, y - 12, 8, 25, '#6a8a43'); R(g, x + i + 8, y - 12, 8, 25, '#9aab69'); }
      R(g, x, y + 12, 224, 5, C.ink); R(g, x, y + 17, 224, 3, '#dcd9a9');
      /* Fondale spezzato e batteria laterale: palco, non barra nera. */
      R(g, x + 22, y - 8, 48, 18, '#2c1a1f'); R(g, x + 26, y - 5, 40, 12, '#5c3a3a');
      R(g, x + 166, y - 7, 31, 16, '#2c1a1f'); R(g, x + 170, y - 4, 23, 10, '#5c3a3a');
      R(g, x + 176, y + 1, 10, 8, C.ink); R(g, x + 178, y + 3, 6, 4, '#caa15a');
      R(g, x + 165, y + 5, 9, 5, C.ink); R(g, x + 188, y + 5, 9, 5, C.ink);
      x = 8 * 16 - cx; y = 1 * 16 - cy;
      R(g, x + 7, y - 3, 2, 22, C.ink); R(g, x + 3, y - 5, 10, 5, C.ink);
      R(g, x + 5, y - 3, 6, 2, '#dcd9a9');
      R(g, x + 1, y + 16, 15, 3, C.ink); R(g, x + 4, y + 16, 9, 1, '#dcd9a9');
      for (i = -44; i <= 44; i += 22) { R(g, x + i + 5, y - 10, 8, 5, C.ink); R(g, x + i + 7, y - 8, 4, 3, '#dcd9a9'); }
      /* Coni luce a gradini: palco leggibile anche dalla porta. */
      for (i = 0; i < 7; i++) {
        R(g, x - 42 - i, y + 18 + i * 3, 12 + i * 2, 2, i & 1 ? '#9aab69' : C.paper);
        R(g, x + 34 - i, y + 18 + i * 3, 9 + i * 2, 2, i & 1 ? '#6a8a43' : '#dcd9a9');
      }
    }
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
  GAME.sprites.drawStructures = function (g, map, cx, cy, opts) {
    if (!map || !map.rows) return;
    var rects = roofRects(map), i, r, p, sy, ey, h, leftX, rightX;
    for (i = 0; i < rects.length; i++) {
      r = rects[i]; p = BUILDINGS[r.ch];
      if (!p || r.ch === '2') continue; /* Double R: volume intero in townDoubleR */
      sy = r.by * 16 - ROOF_LIFT - cy;
      ey = (r.by + 1) * 16 - cy;
      h = ey - sy;
      if (h <= 0 || ey < 0 || sy > 192) continue;
      leftX = r.bx * 16 - cx; rightX = (r.bx + r.bw) * 16 - cx;
      if (rightX < -4 || leftX > 260) continue;
      R(g, leftX - 2, sy, 1, h, C.ink);
      R(g, leftX - 1, sy, 1, h, p[1]);
      R(g, rightX, sy, 1, h, p[1]);
      R(g, rightX + 1, sy, 1, h, C.ink);
    }
    townForestMassAccents(g, map, cx, cy, opts);
    townHeroAccents(g, map, cx, cy);
    townBuildingLandscape(g, map, cx, cy);
    townParkedCars(g, map, cx, cy);
    sceneHeroAccents(g, map, cx, cy);
    interiorHeroAccents(g, map, cx, cy);
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
          if (px < -16 || px > 256 || py < -4 || py > 192) continue;
          R(g, px, py, 16, 4, C.ink);
          R(g, px + 1, py, 14, 2, p[1]);
          R(g, px + 2, py + 2, 12, 1, shade(p[1], -22));
        }
      }
    }
  };

  /* Passaggio depth separato: engine lo inserisce fra attori ordinati per
   * piedi. Ridisegna solo corpi degli alberi nel range di profondita'; case,
   * arredi, ombre e sottobosco restano nel passaggio terreno. */
  GAME.sprites.drawForegroundStructures = function (g, map, cx, cy, opts) {
    if (!map) return;
    opts = opts || {};
    if (INTERIOR_SCENES[map.id]) {
      drawRegisteredForeground(g, map, cx, cy, opts.forestDepthMin, opts.forestDepthMax);
      return;
    }
    if (map.id === 'diner' && map.interior) {
      var m=map.interior, p=INTERIOR_MATERIALS[m.material];
      var min=opts.forestDepthMin, max=opts.forestDepthMax;
      var counterDepth=(m.counter[1]+1)*16;
      if(counterDepth>=min && counterDepth<max) drawDinerCounter(g,m,-cx,-cy,p);
      var boardDepth=(m.specials[1]+m.specials[3])*16;
      if(boardDepth>=min && boardDepth<max) interiorSpecials(g,m.specials[0]*16-cx,m.specials[1]*16-cy,p,signageOf(m).specials);
      var plantDepth=(m.islandPlant[1]+1)*16;
      if(plantDepth>=min && plantDepth<max) interiorFloorPlant(g,m.islandPlant[0]*16-4-cx,m.islandPlant[1]*16-cy,p);
      return;
    }
    if (map.id !== 'town') return;
    opts.forestForegroundOnly = true;
    townForestMassAccents(g, map, cx, cy, opts);
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

  function interiorWall(ctx, x, y, tx, ty, rows, opts) {
    var below = cell(rows, tx, ty + 1), left = cell(rows, tx - 1, ty), right = cell(rows, tx + 1, ty);
    var mapId = opts && opts.mapId;
    var wallBase = mapId === 'hospital' ? '#e6eee8' :
      (mapId === 'diner' ? '#e8c48e' : (mapId === 'oej' ? '#563347' :
      (mapId === 'roadhouse' ? '#382925' : (mapId === 'hotel_gn' ? '#75593d' : '#886848'))));
    var wallTrim = mapId === 'hospital' ? '#8faaa4' :
      (mapId === 'diner' ? '#9a3038' : (mapId === 'oej' ? '#c19a55' :
      (mapId === 'roadhouse' ? '#a25f42' : '#715d48')));
    var openBelow = 'fcthCKUo'.indexOf(below) >= 0;
    var openSide = 'fcthCKUoD'.indexOf(left) >= 0 || 'fcthCKUoD'.indexOf(right) >= 0;
    if ((tx === 0 && 'fcthCKUoD'.indexOf(right) >= 0) ||
        (tx === rows[ty].length - 1 && 'fcthCKUoD'.indexOf(left) >= 0)) {
      floor(ctx, x, y, tx, ty, false, mapId);
      if (tx === 0) { R(ctx, x, y, 4, 16, '#403038'); R(ctx, x + 3, y, 1, 16, '#715d48'); }
      else { R(ctx, x + 12, y, 4, 16, '#403038'); R(ctx, x + 12, y, 1, 16, '#715d48'); }
      return;
    }
    R(ctx, x, y, 16, 16, '#403038');
    if (openBelow) {
      R(ctx, x, y, 16, 2, C.ink); R(ctx, x, y + 2, 16, 12, wallBase); R(ctx, x, y + 14, 16, 2, C.ink);
      R(ctx, x + 1, y + 3, 14, 9, C.ink); R(ctx, x + 2, y + 4, 12, 7, '#c09860');
      R(ctx, x + 3, y + 5, 10, 3, mapId === 'hospital' ? C.paper : '#f0d888');
      R(ctx, x + 3, y + 9, 10, 1, wallTrim);
    } else if (openSide) {
      R(ctx, x + 3, y, 2, 16, wallTrim); R(ctx, x + 11, y, 2, 16, C.ink);
    } else {
      R(ctx, x + 1, y + 3, 14, 2, wallTrim); R(ctx, x + 1, y + 10, 14, 2, wallTrim);
    }
  }

  function backWallLip(ctx, x, y, tx, ty, rows, opts) {
    if (cell(rows, tx, ty - 1) !== 'i') return;
    var mapId = opts && opts.mapId;
    if (mapId === 'hotel_gn') {
      R(ctx, x, y, 16, 16, C.ink); R(ctx, x + 1, y + 2, 14, 11, '#dcd9a9');
      R(ctx, x + 1, y + 10, 14, 3, '#6a8a43'); R(ctx, x + 7, y + 2, 2, 11, '#34572d');
      R(ctx, x, y + 13, 16, 3, C.ink);
      if ((tx & 3) === 1) { R(ctx, x + 3, y + 4, 4, 3, '#9aab69'); R(ctx, x + 4, y + 5, 2, 1, C.ink); }
      return;
    }
    if (mapId === 'palmer') {
      R(ctx, x, y, 16, 16, C.ink); R(ctx, x + 1, y + 2, 14, 12, '#eee6b5');
      R(ctx, x + 1, y + 11, 14, 3, '#9aab69'); R(ctx, x, y + 14, 16, 2, C.ink);
      R(ctx, x + 4, y + 5, 1, 2, '#9aab69'); R(ctx, x + 11, y + 7, 1, 2, '#9aab69');
      if ((tx & 3) === 2) { R(ctx, x + 5, y + 4, 7, 6, C.ink); R(ctx, x + 6, y + 5, 5, 4, '#dcd9a9'); }
      return;
    }
    var panel = mapId === 'hospital' ? '#dfe9df' : (mapId === 'diner' ? '#d9a56f' :
      (mapId === 'oej' ? '#6e4057' : (mapId === 'roadhouse' ? '#49352c' : '#a07850')));
    R(ctx, x, y, 16, 16, '#403038'); R(ctx, x, y, 16, 2, C.ink); R(ctx, x, y + 14, 16, 2, C.ink);
    R(ctx, x + 1, y + 3, 14, 9, C.ink); R(ctx, x + 2, y + 4, 12, 7, panel);
    if ((tx & 1) === 0) { R(ctx, x + 3, y + 5, 10, 4, '#f0d888'); R(ctx, x + 8, y + 5, 1, 4, C.ink); }
    else { R(ctx, x + 3, y + 5, 10, 1, '#d0a868'); R(ctx, x + 3, y + 8, 10, 1, '#684838'); }
  }

  Spr.drawTile = function (ctx, ch, x, y, tx, ty, rows, opts) {
    var nightWoods = !!(opts && opts.mapId === 'woods');
    var underlay = groundAt(opts, tx, ty);
    if (underlay && 'SLPBAHEqG'.indexOf(ch) >= 0) {
      groundedProp(ctx, ch, underlay, x, y, tx, ty, rows, opts);
      return;
    }
    switch (ch) {
      case '.':
        if (opts && (opts.mapId === 'arrival' || opts.mapId === 'town')) townGround(ctx, x, y, tx, ty, rows);
        else grass(ctx, x, y, tx, ty, false, false, rows);
        return;
      case 'g': grass(ctx, x, y, tx, ty, true, nightWoods, rows); return;
      case ',':
        if (opts && opts.mapId === 'town') townGround(ctx, x, y, tx, ty, rows);
        else grass(ctx, x, y, tx, ty, false, false, rows);
        R(ctx, x + 3, y + 6, 2, 2, '#dcd9a9'); R(ctx, x + 10, y + 11, 2, 2, '#6a8a43'); return;
      case 'T': tree(ctx, x, y, tx, ty, rows, false, nightWoods, opts && opts.mapId === 'town'); return;
      case 'Y': tree(ctx, x, y, tx, ty, rows, true, nightWoods, opts && opts.mapId === 'town'); return;
      case 'r':
        if (opts && opts.mapId === 'town') townRoad(ctx, x, y, tx, ty, rows);
        else road(ctx, x, y, tx, ty, rows);
        return;
      case 'u':
        if (opts && opts.mapId === 'town') townGravel(ctx, x, y, tx, ty, rows);
        else gravel(ctx, x, y, tx, ty, rows);
        return;
      case 'p':
        if (nightWoods) {
          woodsPath(ctx, x, y, tx, ty, rows);
          groundShadow(ctx, x, y, tx, ty, rows);
        } else if (opts && opts.mapId === 'town') townPath(ctx, x, y, tx, ty, rows);
        else path(ctx, x, y, tx, ty, rows);
        return;
      case 'o': oilPool(ctx, x, y, tx, ty, rows); return;
      case '=':
        if (opts && opts.mapId === 'town') townSidewalk(ctx, x, y, tx, ty, rows, opts);
        else sidewalk(ctx, x, y, tx, ty, rows, opts);
        return;
      case '-':
        if (opts && opts.mapId === 'town') townRoad(ctx, x, y, tx, ty, rows);
        else road(ctx, x, y, tx, ty, rows);
        var cwY = roadCell(cell(rows, tx, ty - 1)) ? 0 : 3;
        var cwH = 16 - cwY - (roadCell(cell(rows, tx, ty + 1)) ? 0 : 3);
        if (!roadCell(cell(rows, tx, ty - 1))) R(ctx, x + 1, y, 14, 1, '#85877f');
        if (!roadCell(cell(rows, tx, ty + 1))) R(ctx, x + 1, y + 15, 14, 1, '#85877f');
        /* Gruppo 3x2: cinque bande lungo 48px, non tre ripetizioni per tile
         * (nove barre da codice a barre). */
        var zebraLeft = cell(rows, tx - 1, ty) === '-';
        var zebraRight = cell(rows, tx + 1, ty) === '-';
        if (!zebraLeft && zebraRight) {
          R(ctx, x + 8, y + cwY, 2, cwH, C.paper);
        } else if (zebraLeft && zebraRight) {
          R(ctx, x, y + cwY, 2, cwH, C.paper); R(ctx, x + 8, y + cwY, 2, cwH, C.paper);
        } else if (zebraLeft && !zebraRight) {
          R(ctx, x, y + cwY, 2, cwH, C.paper); R(ctx, x + 8, y + cwY, 2, cwH, C.paper);
        } else {
          R(ctx, x + 4, y + cwY, 2, cwH, C.paper); R(ctx, x + 10, y + cwY, 2, cwH, C.paper);
        }
        if (!roadCell(cell(rows, tx, ty - 1))) {
          R(ctx, x, y, 16, 1, '#31543a'); R(ctx, x + 1, y + 1, 14, 1, '#85877f'); R(ctx, x + 1, y + 2, 14, 1, '#77736a');
        }
        if (!roadCell(cell(rows, tx, ty + 1))) {
          R(ctx, x, y + 15, 16, 1, '#31543a'); R(ctx, x + 1, y + 14, 14, 1, '#85877f'); R(ctx, x + 1, y + 13, 14, 1, '#77736a');
        }
        return;
      case ':':
        if (opts && opts.mapId === 'town') townRoad(ctx, x, y, tx, ty, rows);
        else road(ctx, x, y, tx, ty, rows);
        var cwX = roadCell(cell(rows, tx - 1, ty)) ? 0 : 3;
        var cwW = 16 - cwX - (roadCell(cell(rows, tx + 1, ty)) ? 0 : 3);
        if (!roadCell(cell(rows, tx - 1, ty))) R(ctx, x, y + 1, 1, 14, '#85877f');
        if (!roadCell(cell(rows, tx + 1, ty))) R(ctx, x + 15, y + 1, 1, 14, '#85877f');
        /* Attraversamento 3x2: tre sole bande centrate sull'intero gruppo
         * alto 32px. Prima ogni riga ripeteva tre bande = scala da sei. */
        var zebraUp = cell(rows, tx, ty - 1) === ':';
        var zebraDown = cell(rows, tx, ty + 1) === ':';
        if (!zebraUp && zebraDown) {
          R(ctx, x + cwX, y + 10, cwW, 2, C.paper);
          R(ctx, x + cwX, y + 14, cwW, 2, C.paper);
        } else if (zebraUp && !zebraDown) {
          R(ctx, x + cwX, y + 2, cwW, 2, C.paper);
        } else {
          R(ctx, x + cwX, y + 5, cwW, 2, C.paper);
          R(ctx, x + cwX, y + 10, cwW, 2, C.paper);
          R(ctx, x + cwX, y + 15, cwW, 1, C.paper);
        }
        if (!roadCell(cell(rows, tx - 1, ty))) {
          R(ctx, x, y, 1, 16, '#31543a'); R(ctx, x + 1, y + 1, 1, 14, '#85877f'); R(ctx, x + 2, y + 1, 1, 14, '#77736a');
        }
        if (!roadCell(cell(rows, tx + 1, ty))) {
          R(ctx, x + 15, y, 1, 16, '#31543a'); R(ctx, x + 14, y + 1, 1, 14, '#85877f'); R(ctx, x + 13, y + 1, 1, 14, '#77736a');
        }
        return;
      case 'w': water(ctx, x, y, tx, ty, rows); return;
      case 'F':
        if (opts && opts.mapId === 'town' && ty >= 26 && ty <= 31 && cell(rows, tx - 1, ty) === 'w') lakeShore(ctx, x, y, tx, ty, rows);
        else fence(ctx, x, y, tx, ty, rows, opts && opts.mapId === 'town');
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
      case 'V': parkedCar(ctx, x, y, tx, ty, rows, opts); return;
      case 'n': bush(ctx, x, y, tx, ty, rows, nightWoods, opts && opts.mapId === 'town'); return;
      case 'J': arrivalCabin(ctx, x, y, tx, ty, rows); return;
      case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': building(ctx, ch, x, y, tx, ty, rows); return;
      case 'D': door(ctx, x, y, tx, ty, rows); return;
      case 'i': interiorWall(ctx, x, y, tx, ty, rows, opts); return;
      case 'f': floor(ctx, x, y, tx, ty, false, opts && opts.mapId); backWallLip(ctx, x, y, tx, ty, rows, opts); return;
      case 'c': floor(ctx, x, y, tx, ty, true, opts && opts.mapId); backWallLip(ctx, x, y, tx, ty, rows, opts); return;
      case 'C': floor(ctx, x, y, tx, ty, false, opts && opts.mapId); backWallLip(ctx, x, y, tx, ty, rows, opts); R(ctx, x, y + 4, 16, 12, C.ink); R(ctx, x + 1, y + 5, 14, 5, '#9a6843'); R(ctx, x + 2, y + 6, 12, 2, '#d19b5c'); R(ctx, x + 3, y + 11, 4, 3, '#6a4934'); R(ctx, x + 9, y + 11, 4, 3, '#6a4934'); return;
      case 't': floor(ctx, x, y, tx, ty, false, opts && opts.mapId); backWallLip(ctx, x, y, tx, ty, rows, opts); R(ctx, x + 1, y + 4, 14, 9, C.ink); R(ctx, x + 2, y + 3, 12, 8, '#875c3d'); R(ctx, x + 3, y + 4, 10, 2, '#c28a50'); R(ctx, x + 3, y + 11, 2, 4, C.ink); R(ctx, x + 11, y + 11, 2, 4, C.ink); return;
      case 'h':
        if (opts && opts.mapId === 'redroom') redRoomFloor(ctx, x, y, tx, ty);
        else floor(ctx, x, y, tx, ty, false, opts && opts.mapId);
        backWallLip(ctx, x, y, tx, ty, rows, opts);
        if (opts && opts.mapId === 'redroom') {
          R(ctx, x + 3, y + 1, 10, 8, C.ink); R(ctx, x + 5, y + 3, 6, 5, '#caa15a');
          R(ctx, x + 1, y + 7, 4, 6, C.ink); R(ctx, x + 11, y + 7, 4, 6, C.ink);
          R(ctx, x + 4, y + 8, 8, 5, C.ink); R(ctx, x + 5, y + 9, 6, 3, '#caa15a');
          R(ctx, x + 4, y + 12, 2, 4, C.ink); R(ctx, x + 10, y + 12, 2, 4, C.ink);
        } else {
          R(ctx, x + 4, y + 2, 8, 12, C.ink); R(ctx, x + 5, y + 3, 6, 7, '#9a6843'); R(ctx, x + 6, y + 4, 4, 2, '#d5a364');
        }
        return;
      case 'K': floor(ctx, x, y, tx, ty, false, opts && opts.mapId); backWallLip(ctx, x, y, tx, ty, rows, opts); R(ctx, x + 1, y + 2, 14, 13, C.ink); R(ctx, x + 2, y + 3, 12, 11, '#ddd7b9'); R(ctx, x + 3, y + 4, 5, 3, C.paper); R(ctx, x + 3, y + 8, 10, 1, '#aaa989'); return;
      case 'U': floor(ctx, x, y, tx, ty, false, opts && opts.mapId); backWallLip(ctx, x, y, tx, ty, rows, opts); R(ctx, x + 2, y + 2, 12, 13, C.ink); R(ctx, x + 3, y + 3, 10, 11, '#855b3d'); R(ctx, x + 4, y + 4, 8, 2, '#c28a50'); R(ctx, x + 4, y + 8, 8, 1, C.ink); R(ctx, x + 8, y + 10, 1, 1, C.gold); return;
      case 'Z': redRoomFloor(ctx, x, y, tx, ty); return;
      case 'R':
        R(ctx, x, y, 16, 16, '#8f2430');
        R(ctx, x, y, 3, 16, '#4c1119'); R(ctx, x + 3, y, 5, 16, '#c1585a');
        R(ctx, x + 5, y, 2, 16, '#e47a75'); R(ctx, x + 8, y, 5, 16, '#8f2430');
        R(ctx, x + 13, y, 3, 16, '#4c1119'); return;
      case 'M':
        redRoomFloor(ctx, x, y, tx, ty);
        R(ctx, x + 4, y + 12, 8, 3, C.ink); R(ctx, x + 5, y + 10, 6, 3, '#727878');
        R(ctx, x + 6, y + 3, 4, 7, '#c4c7ba'); R(ctx, x + 7, y + 1, 3, 3, C.paper);
        R(ctx, x + 6, y + 5, 1, 5, '#e2e1cc'); R(ctx, x + 9, y + 4, 1, 6, '#5b6260'); return;
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
    var actorScale = runtimeActorScale;
    var scaled = actorScale !== 1;
    if (scaled) {
      ctx.save();
      ctx.translate(Math.round(x + 8), Math.round(y + 16));
      ctx.scale(actorScale, actorScale);
      ctx.translate(-Math.round(x + 8), -Math.round(y + 16));
    }
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
    if (scaled) ctx.restore();
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

  /* Il generatore lavora su due righe di margine sopra la testa: servono a
   * disegnare cappelli, cotonature e ciuffi senza coordinate negative. Prima
   * quelle righe finivano anche nel frame finale: gli attori alti occupavano
   * 17–19 px e uscivano dalla cella OBJ 16×16. Qui il margine e' soltanto un
   * tavolo da disegno: lo fondiamo nelle prime righe della testa, poi
   * riallineiamo dal basso i corpi corti. Nessun clipping runtime. */
  function fitActorCell(rows, g) {
    var out = rows.slice(), y, x, base, over;
    if (!g.fullCell) {
      for (y = 0; y < HEAD_PAD; y++) {
        base = out[HEAD_PAD + y].split('');
        over = out[y].split('');
        for (x = 0; x < 16; x++) if (over[x] !== '.') base[x] = over[x];
        out[HEAD_PAD + y] = base.join('');
      }
      out = out.slice(HEAD_PAD);
    }
    while (out.length < 16) out.unshift(EMPTY_ROW);
    if (out.length !== 16) throw new Error('actor pattern exceeds 16 rows after authored fit: ' + out.length);
    return out;
  }

  /* Uno sprite overworld e' una sola sagoma. Cue scritti oltre capelli o
   * maniche creavano isole da 1–2 px (antenne visibili a 5×). Conserviamo la
   * componente 4-connessa maggiore e rifiutiamo decorazioni flottanti. */
  function removeDetachedSpecks(rows) {
    var grid = toGrid(rows), seen = [], groups = [], y, x, i;
    for (i = 0; i < 256; i++) seen.push(false);
    for (y = 0; y < 16; y++) for (x = 0; x < 16; x++) {
      var start = y * 16 + x;
      if (grid[y][x] === '.' || seen[start]) continue;
      var stack = [start], group = [];
      seen[start] = true;
      while (stack.length) {
        var pos = stack.pop(), cy = Math.floor(pos / 16), cx = pos % 16;
        group.push(pos);
        var neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (var n = 0; n < neighbors.length; n++) {
          var nx = neighbors[n][0], ny = neighbors[n][1];
          if (nx < 0 || nx >= 16 || ny < 0 || ny >= 16) continue;
          var np = ny * 16 + nx;
          if (!seen[np] && grid[ny][nx] !== '.') { seen[np] = true; stack.push(np); }
        }
      }
      groups.push(group);
    }
    groups.sort(function (a, b) { return b.length - a.length; });
    for (i = 1; i < groups.length; i++) for (var j = 0; j < groups[i].length; j++) {
      var p = groups[i][j]; grid[Math.floor(p / 16)][p % 16] = '.';
    }
    return fromGrid(grid);
  }

  /* La prima riga opaca non puo' essere una barra orizzontale: sui master
   * Crystal la calotta rientra di un pixel per lato. Questo singolo gradino
   * elimina l'effetto casco senza aggiungere rumore. */
  function taperCellCrown(rows) {
    var out = rows.slice(), y, x, lo, hi, row;
    for (y = 0; y < 16; y++) {
      row = out[y].split(''); lo = -1; hi = -1;
      for (x = 0; x < 16; x++) if (row[x] !== '.') { if (lo < 0) lo = x; hi = x; }
      if (lo < 0) continue;
      if (hi - lo + 1 >= 8) { row[lo] = '.'; row[hi] = '.'; out[y] = row.join(''); }
      break;
    }
    return out;
  }

  /* Nelle quattro righe alte, conserva ciocca principale e rimuove spuntoni
   * da 1–2 px separati da vuoto. Restano dettagli interni di colore; cambia
   * soltanto contorno che a scala 5× leggeva come antenna. */
  function cleanCrownOutliers(rows) {
    var out = rows.slice(), first = -1, y, x;
    for (y = 0; y < 16 && first < 0; y++) if (/[^.]/.test(out[y])) first = y;
    for (y = first; y >= 0 && y < Math.min(16, first + 4); y++) {
      var row = out[y].split(''), runs = [], start = -1;
      for (x = 0; x <= 16; x++) {
        var filled = x < 16 && row[x] !== '.';
        if (filled && start < 0) start = x;
        if (!filled && start >= 0) { runs.push([start, x - 1]); start = -1; }
      }
      if (runs.length < 2) continue;
      runs.sort(function (a, b) { return (b[1] - b[0]) - (a[1] - a[0]); });
      for (var r = 1; r < runs.length; r++) if (runs[r][1] - runs[r][0] + 1 <= 2) {
        for (x = runs[r][0]; x <= runs[r][1]; x++) row[x] = '.';
      }
      out[y] = row.join('');
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
    /* Profilo Gen II: nel passo il piede avanza di un pixel; nell'idle resta
     * sotto il bacino. Prima `step` non cambiava alcuna coordinata e tutto il
     * cast, salvo Cooper authored, pattinava con sagoma identica. */
    if (step > 0) { lo = Math.min(14, lo + 1); hi = Math.min(15, hi + 1); }
    var s = '', x, toe = hi;
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
      uncanny: arch === 'uncanny',
      darkTorso: lumaHex(p.hair || '#000000') >= 118,
      tall: !p.short && h >= 1.05,
      /* Statura in quattro gradi, non tre: senza il grado intermedio Donna
       * (1,02) e Maddy (1,00) uscivano con la stessa identica maschera
       * frontale — IoU 1,000 fra due personaggi diversi. */
      erect: !p.short && h >= 1.01 && h < 1.05,
      stoop: !p.short && h <= 0.99
    };
    if (side) {
      /* Reference pret/pokecrystal (24 umani, 48 side frame): bbox p10/mediana
       * 12/13 px e massa side/front mediana 87,3 %. Il vecchio ramo scendeva
       * a 6 px di cranio e 8 px di spalle: profili-filamento, IoU fino a 0,57.
       * Dieci pixel di cranio + dodici di spalle ripristinano volume GBC. */
      /* Il Gigante deve leggere alto anche dentro la stessa cella 16x16:
       * cranio piu' stretto e corpo lungo, ma inviluppo laterale ancora
       * dentro i 12 px misurati in Crystal. */
      g.headW = g.uncanny ? 8 : 10;
      g.sideBodyW = g.uncanny ? 10 : g.headW;
      g.shoulder = b >= 1.12 ? 14 : 12;
      g.chest = g.shoulder;
      g.armSpan = g.shoulder;
      g.fore = g.shoulder;
      /* Profili minuti rientrano sotto petto; corporature broad/menace e
       * gonne conservano 12 px. Evita side mass > front senza riportare il
       * vecchio filamento da 8 px. */
      g.hip = gown || b >= 1.08 ? g.shoulder : g.shoulder - 2;
      g.hem = gown || b >= 1.08 ? g.shoulder : g.shoulder - 2;
      g.legW = Math.max(8, g.hip - 2);
      /* Piede entro il profilo: il lato resta piu' stretto del frontale, ma
       * non collassa sotto banda 12–14 px misurata nel reference. */
      g.footW = g.legW;
      g.block = Math.max(2, Math.min(4, 2 + stance));
      return g;
    }
    /* Reference front/back p10/mediana/p90 = 12,7/14/16 px. Nessuna testa
     * umana scende a 10 px: corporatura minuta cambia orlo/stance, non scala
     * intero cranio. */
    g.headW = g.uncanny ? 10 : (b >= 1.12 ? 14 : 12);
    /* Le spalle partono dalla testa e salgono: in Oro non sono mai piu'
     * strette (chris 14 = 14, kris 16 contro 12). */
    /* Torso coerente con la testa. Le braccia non superano questa misura:
     * evita sia il corpo-filamento sia la posa a croce larga 16px. */
    g.shoulder = g.uncanny ? 14 : Math.min(16, g.headW + 2);
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
    var W = g.sideBodyW || g.headW;
    var base = g.darkTorso ? 'p' : 'c';
    var mark = g.darkTorso ? 'c' : 'o';
    var TONE = { O: 'o', S: 's', C: base, M: mark, P: 'p', A: 'c' };
    function tone(k) { return TONE[k]; }
    var fwd = step > 0, rows = [], a, e;
    function set(a, x, k) { if (x > 0 && x < 15 && a[x] !== '.') a[x] = k; }
    var widths = [g.shoulder, g.chest, g.armSpan, g.fore, g.hip, g.hem, g.legW, g.footW];
    function edge(i) {
      /* Consuma davvero geometria/archetipo. -2 compensa i gradini esterni:
       * una spalla 12 produce bbox 12, una broad 14 produce bbox 14. */
      var bw = Math.max(8, Math.min(12, (widths[i] || W) - 2));
      var bx0 = 8 - (bw >> 1), bx1 = bx0 + bw - 1, t = SIDE_BODY_EDGE[i];
      return [bx0 + t[0], bx1 + t[1]];
    }
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
    var pixelView = g.side ? 'side' : (back ? 'up' : 'down');
    var pixelCue = p.pixel16 && p.pixel16[pixelView];
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
      if (pixelCue === 'temple-tabs') {
        /* Maddy: capelli dentro le spalle. Le vecchie code x0/x15 univano
         * testa e busto in una maschera larga 16 senza collo. */
        put(grid, sx0 + 1, bodyTop, 'h'); put(grid, sx1 - 1, bodyTop, 'h');
      } else if (g.side) {
        put(grid, sx0, bodyTop, 'h'); put(grid, sx0, bodyTop + 1, 'h');
      } else {
        put(grid, sx0 - 1, bodyTop, 'h'); put(grid, sx1 + 1, bodyTop, 'h');
      }
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
    if (p.waistcoat) {
      /* Panciotto a V: firma larga e continua, non puntini decorativi. */
      if (side) {
        put(grid, 8, bodyTop + 1, 's');
        put(grid, 9, bodyTop + 2, 'o');
        put(grid, 9, bodyTop + 3, 'o');
      } else if (!back) {
        put(grid, 6, bodyTop + 1, 's'); put(grid, 9, bodyTop + 1, 's');
        put(grid, 7, bodyTop + 2, 'o'); put(grid, 8, bodyTop + 2, 'o');
        put(grid, 7, bodyTop + 3, 'o'); put(grid, 8, bodyTop + 3, 'o');
      }
    }
    if (p.onearm) {
      /* Gerard: il vecchio onearm cambiava solo il colore dentro una sagoma
       * perfettamente simmetrica. Qui manca davvero il volume della manica.
       * seal() richiude il nuovo bordo, quindi il moncherino resta netto e
       * non apre buchi nel contorno. */
      if (side) {
        var sideX1 = 8 - ((g.sideBodyW || g.headW) >> 1) + (g.sideBodyW || g.headW) - 1;
        put(grid, sideX1 + 1, bodyTop + 2, '.');
        put(grid, sideX1, bodyTop + 2, '.');
        put(grid, sideX1 - 1, bodyTop + 2, '.');
        put(grid, sideX1, bodyTop + 3, '.');
        put(grid, sideX1 - 1, bodyTop + 3, '.');
      } else {
        var removeRight = back ? p.onearm === 'right' : p.onearm === 'left';
        var ax0 = 8 - (Math.max(8, g.fore - 2) >> 1);
        var ax1 = ax0 + Math.max(8, g.fore - 2) - 1;
        var cut0 = removeRight ? ax1 - 2 : ax0;
        var cut1 = removeRight ? ax1 : ax0 + 2;
        for (var ay = bodyTop + 2; ay <= bodyTop + 3; ay++) {
          for (var ax = cut0; ax <= cut1; ax++) put(grid, ax, ay, '.');
        }
      }
    }
    /* R63 — la cucitura del braccio di profilo non si applica piu' qui:
     * sideBodyRows() disegna tutte e due le braccia dentro la matrice
     * (quello vicino avanti, quello lontano dietro). Il vecchio blocco
     * scriveva sopra la mano posteriore e la faceva sparire, lasciando la
     * meta' dietro del profilo a due soli toni. */
  }

  function applyIdentityCue(grid, p, dir, g, top, bodyTop, step) {
    var view = g.side ? 'side' : (dir === 'up' ? 'up' : 'down');
    var cue = p.pixel16 && p.pixel16[view];
    if (!cue) return;
    var hx0 = 8 - (g.headW >> 1), hx1 = hx0 + g.headW - 1;
    var shoulderW = Math.min(14, g.shoulder || 12);
    var bx0 = 8 - (shoulderW >> 1), bx1 = bx0 + shoulderW - 1;
    function add(x, y, k) { put(grid, x, y, k || 'o'); }
    function cut(x, y) { put(grid, x, y, '.'); }

    if (cue === 'sheriff-brim') {
      span(grid, Math.max(0, hx0 - 2), Math.min(15, hx1 + 2), top + 1, 'o');
      add(hx0, top, 'g'); add(hx1, top, 'g');
    }

    if (cue.indexOf('swept-') === 0) {
      add(hx0 + 2, top - 1, 'o'); add(hx0 + 3, top - 1, 'g');
      if (g.side) { add(hx1 + 1, top + 2, 'o'); add(hx1, top + 2, 'g'); }
      add(g.side ? bx1 : bx0, bodyTop + 3, 's');
    }
    if (cue === 'forward-quiff-cuff') {
      add(hx1 + 1, top + 2, 'o'); add(hx1, top + 2, 'g');
      /* Cooper: polsino/mano avanzano davvero fuori dal busto. Prima il cue
       * cambiava solo colore dentro la maschera e il profilo coincideva al
       * 97,5% con Donna. */
      add(bx1 + 1, bodyTop + 3, 'o');
      add(bx1 + 1, bodyTop + 4, 's');
    }
    if (cue.indexOf('rear-bun') >= 0) {
      add(hx0 - 1, top + 2, 'o'); add(hx0 - 1, top + 3, 'h');
      add(hx0 - 1, top + 4, 'o');
      add(hx0, top + 5, 'h'); add(hx0 + 1, top + 5, 'h');
      /* Lucy, profilo: chignon a volume 2 px, non stessa calotta del bob. */
      if (g.side) { add(hx0 - 2, top + 2, 'o'); add(hx0 - 2, top + 3, 'h'); }
    }
    if (cue === 'long-hatless') {
      add(7, top - 1, 'o'); add(8, top - 1, 'g');
      if (g.side) {
        add(hx1 + 1, top + 6, 'o');
        add(7, bodyTop + 1, 'o'); add(8, bodyTop + 1, 'o');
        cut(bx1, bodyTop + 2); cut(bx1 - 1, bodyTop + 3);
      }
    }
    if (cue === 'rear-curtain') {
      add(hx0 - 1, top + 4, 'o'); add(hx0 - 1, top + 5, 'h');
      add(hx0 - 1, top + 6, 'h'); add(hx0 - 1, top + 7, 'o');
      add(hx0, bodyTop, 'h'); add(hx0, bodyTop + 1, 'h');
      add(hx0, bodyTop + 2, 'h'); add(hx0, bodyTop + 3, 'o');
      add(bx0 - 1, bodyTop + 1, 'h'); add(bx0 - 1, bodyTop + 2, 'h');
      add(bx0 - 1, bodyTop + 3, 'o');
      /* Hawk: coda lunga continua oltre giacca, leggibile nella sagoma 1×. */
      add(bx0 - 2, bodyTop + 3, 'o'); add(bx0 - 2, bodyTop + 4, 'h');
      add(bx0 - 2, bodyTop + 5, 'o');
    }
    if (cue === 'hair-tails') {
      /* Hawk front/back: due code oltre la nuca separano il profilo
       * verticale dal pompadour corto di James. */
      add(hx0, top + 5, 'o'); add(hx0, top + 6, 'h');
      add(hx0, top + 7, 'h'); add(hx0, top + 8, 'o');
      if (!g.side) {
        add(hx1, top + 5, 'o'); add(hx1, top + 6, 'h');
        add(hx1, top + 7, 'h'); add(hx1, top + 8, 'o');
        add(bx0 - 1, bodyTop + 3, 'h'); add(bx0 - 1, bodyTop + 4, 'o');
        add(bx1 + 1, bodyTop + 3, 'h'); add(bx1 + 1, bodyTop + 4, 'o');
      }
    }
    if (cue === 'silver-long-neck' && g.side) {
      cut(hx0, top + 7); add(hx1 + 1, top + 7, 'o');
      /* Leland: falda posteriore del completo, opposta ai capelli di Maddy. */
      add(bx1, bodyTop + 4, 'c'); add(bx1 + 1, bodyTop + 4, 'o');
      add(bx1, bodyTop + 5, 'c'); add(bx1 + 1, bodyTop + 5, 'o');
    }
    if (cue === 'shawl-hunch') {
      add(bx0 - 2, bodyTop - 1, 'o'); add(bx0 - 1, bodyTop - 1, 'c');
      add(bx0 - 2, bodyTop, 'o'); add(bx0 - 1, bodyTop, 'c');
      if (g.side) { add(bx0 - 1, bodyTop + 1, 'o'); cut(bx1, bodyTop + 2); }
      if (!g.side) { add(bx1 + 1, bodyTop + 1, 'o'); add(bx1, bodyTop + 1, 'c'); }
    }
    if (cue === 'apron-shelf') {
      add(bx0, bodyTop + 5, 'o'); add(bx0 - 1, bodyTop + 5, 'c');
      if (g.side) {
        add(bx0 - 1, bodyTop + 4, 'o');
        add(bx0 - 1, bodyTop + 6, 'o'); add(bx0, bodyTop + 6, 'c');
        add(bx1, bodyTop + 5, 'c'); add(bx1 + 1, bodyTop + 5, 'o');
        add(bx1, bodyTop + 6, 'c'); add(bx1 + 1, bodyTop + 6, 'o');
      } else { add(bx1, bodyTop + 5, 'o'); add(bx1 + 1, bodyTop + 5, 'c'); }
    }
    if (cue === 'bell-apron') {
      add(bx0 - 1, bodyTop + 5, 'o'); add(bx0 - 2, bodyTop + 6, 'o');
      add(bx1 + 1, bodyTop + 5, 'o'); add(bx1 + 2, bodyTop + 6, 'o');
      if (g.side) {
        cut(bx0 - 2, bodyTop + 6); cut(bx1 + 2, bodyTop + 6);
        add(bx0 - 1, bodyTop + 4, 'o');
        add(bx1 - 1, bodyTop + 4, 'c'); add(bx1, bodyTop + 4, 'c'); add(bx1 + 1, bodyTop + 4, 'o');
        add(bx0 - 1, bodyTop + 5, 'o');
        add(bx1 - 1, bodyTop + 5, 'c'); add(bx1, bodyTop + 5, 'c'); add(bx1 + 1, bodyTop + 5, 'o');
        add(bx0 - 1, bodyTop + 6, 'o');
        add(bx1 - 1, bodyTop + 6, 'c'); add(bx1, bodyTop + 6, 'c'); add(bx1 + 1, bodyTop + 6, 'o');
      }
    }
    if (cue === 'broad-pompadour') {
      add(hx0 - 1, top + 1, 'o'); add(hx0 - 1, top + 2, 'h');
      add(hx1 + 1, top + 2, 'o'); add(hx1 + 1, top + 3, 'h');
      add(hx0 - 1, top + 4, 'o'); add(hx1 + 1, top + 4, 'o');
      if (g.side) {
        add(hx0 - 2, top + 2, 'o'); add(hx0 - 2, top + 3, 'h');
        add(hx1 + 2, top + 2, 'o'); add(hx1 + 2, top + 3, 'h');
      }
    }
    if (cue === 'wild-mane') {
      add(hx0 - 1, top, 'o'); add(hx0 - 1, top + 1, 'h');
      add(hx1 + 1, top + 3, 'o'); add(hx1 + 1, top + 4, 'h');
      if (!g.side) {
        add(bx0 - 1, bodyTop, 'h'); add(bx0 - 1, bodyTop + 1, 'o');
        cut(bx1, bodyTop + 2); cut(bx1 - 1, bodyTop + 2);
        cut(bx1, bodyTop + 3); cut(bx1 - 1, bodyTop + 3);
      }
      else {
        add(hx0 - 1, top + 5, 'h'); add(hx0 - 1, top + 6, 'h');
        add(hx0 - 1, top + 7, 'o');
        add(bx0 - 1, bodyTop, 'h'); add(bx0 - 1, bodyTop + 1, 'h');
        add(bx0 - 1, bodyTop + 2, 'h'); add(bx0 - 1, bodyTop + 3, 'o');
        cut(bx1, bodyTop + 1); cut(bx1, bodyTop + 2);
        cut(bx1 - 1, bodyTop + 2); cut(bx1, bodyTop + 3);
        cut(bx1 - 1, bodyTop + 3);
      }
    }
    if (cue === 'hair-cape') {
      add(bx0 - 1, bodyTop + 1, 'h'); add(bx0, bodyTop + 2, 'o');
      add(bx1 + 1, bodyTop + 1, 'h'); add(bx1, bodyTop + 2, 'o');
    }
    if (cue === 'rear-tail') {
      /* Donna: coda/cappa posteriore continua fino alla vita, con fronte
       * del busto scavato. Forma leggibile a 1x, non semplice palette swap
       * del completo di Cooper. */
      add(bx0 - 1, bodyTop, 'h'); add(bx0 - 1, bodyTop + 1, 'h');
      add(bx0 - 1, bodyTop + 2, 'h'); add(bx0 - 1, bodyTop + 3, 'h');
      add(bx0 - 1, bodyTop + 4, 'o'); add(bx0, bodyTop + 4, 'h');
      cut(bx1, bodyTop + 2); cut(bx1, bodyTop + 3);
    }
    if (cue.indexOf('bald-') === 0) {
      add(hx0 - 1, top + 4, 'o'); add(hx0 - 1, top + 5, 'h');
      if (!g.side) { add(hx1 + 1, top + 4, 'o'); add(hx1 + 1, top + 5, 'h'); }
    }
    if (cue === 'bald-rear-tuft' && g.side) {
      /* Jacoby: montatura/naso avanzano sul lato opposto al ciuffo. */
      add(hx1 + 1, top + 6, 'o'); add(hx1 + 1, top + 7, 's');
    }
    if (cue === 'square-bob') {
      add(hx0 - 1, top + 5, 'o'); add(hx0 - 1, top + 6, 'h');
      add(hx1 + 1, top + 5, 'o'); add(hx1 + 1, top + 6, 'h');
      add(8, bodyTop + 1, 'o');
    }
    if (cue === 'v-nape') {
      add(7, top + 8, 'h'); add(8, top + 8, 'h'); add(7, top + 9, 'o');
    }
    if (cue === 'rear-bob-hook') {
      add(hx0 - 1, top + 5, 'o'); add(hx0 - 1, top + 6, 'h');
      add(hx0, top + 7, 'o');
      add(8, bodyTop + 1, 'o');
    }
    if (cue === 'spectral-gown') {
      /* Un solo orlo sospeso: Laura non finisce in due scarpe umane. */
      for (var sx = 0; sx < 16; sx++) cut(sx, bodyTop + 7);
      var gownX = step ? 7 : 6;
      add(gownX, bodyTop + 7, 'o'); add(gownX + 1, bodyTop + 7, 'c');
      add(gownX + 2, bodyTop + 7, 'c'); add(gownX + 3, bodyTop + 7, 'o');
      if (g.side) {
        cut(bx1, bodyTop + 2); cut(bx1, bodyTop + 3);
        cut(bx1 - 1, bodyTop + 3);
      }
    }
    if (cue === 'temple-tabs') {
      add(hx0, top + 6, 'o'); add(hx0, top + 7, 'h');
      if (!g.side) {
        add(hx1, top + 6, 'o');
        cut(hx0, top + 7); cut(hx1, top + 7);
      }
      else {
        add(hx0 - 1, top + 6, 'o'); add(hx0 - 1, top + 7, 'h');
        add(bx0 - 1, bodyTop + 2, 'h'); add(bx0 - 1, bodyTop + 3, 'o');
      }
    }
    if (cue === 'forward-pompadour') {
      add(hx1 + 1, top + 1, 'o'); add(hx1 + 1, top + 2, 'h');
      add(hx1 + 2, top + 2, 'o'); add(hx1 + 2, top + 3, 'h');
    }
    if (cue === 'narrow-pompadour') {
      add(hx1 + 1, top + 1, 'o'); add(hx1 + 1, top + 2, 'h');
    }
    if (cue === 'barrel-waistcoat') {
      var barrelL = g.side ? bx0 : bx0 - 1, barrelR = g.side ? bx1 : bx1 + 1;
      if (g.side) {
        span(grid, barrelL, barrelR, bodyTop + 4, 'c');
        span(grid, barrelL, barrelR, bodyTop + 5, 'c');
        for (var barrelY = bodyTop + 4; barrelY <= bodyTop + 5; barrelY++) {
          add(barrelL + 3, barrelY, 'o'); add(barrelL + 4, barrelY, 'o');
          add(7, barrelY, 'o'); add(8, barrelY, 'o');
          add(barrelR - 4, barrelY, 'o'); add(barrelR - 3, barrelY, 'o');
          add(barrelL + 1, barrelY, 'o'); add(barrelR - 1, barrelY, 'o');
        }
        /* Jacques: jowl/stubble sporge sotto il profilo del viso. */
        add(hx1 + 1, top + 6, 'o'); add(hx1 + 1, top + 7, 's');
      } else {
        add(barrelL, bodyTop + 4, 'o'); add(barrelR, bodyTop + 4, 'o');
        add(barrelL, bodyTop + 5, 'c'); add(barrelR, bodyTop + 5, 'c');
      }
    }
    if (cue === 'block-suit' && g.side) {
      add(hx0 - 1, top + 3, 'o'); add(hx0 - 1, top + 4, 'h');
      add(hx1 + 1, top + 3, 'o'); add(hx1 + 1, top + 4, 'h');
    }
    if (cue === 'low-hair-lock') {
      var lockX = g.side ? hx0 - 1 : hx1 + 1;
      add(lockX, top + 6, 'h'); add(lockX, top + 7, 'h');
      add(lockX, top + 8, 'o'); add(lockX, top + 9, 'h');
      if (g.side) {
        add(bx1, bodyTop + 4, 'c'); add(bx1 + 1, bodyTop + 4, 'o');
      }
      else {
        add(bx1 + 1, bodyTop + 3, 'o');
      }
    }
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
    var body = g.side ? sideBodyRows(g, step, d) : bodyRows(g, step, p.onearm, d);
    var rows;
    /* R101b — Giant: 7 righe testa + collo + 8 righe corpo. Occupa la
     * cella intera con massa verticale continua; testa 10/8 px contro
     * spalle 14/12. Gli altri alti aggiungono collo sopra il modello
     * standard, ma qui quella soluzione sembrava solo un NPC normale
     * traslato verso l'alto. */
    if (g.uncanny) {
      g.fullCell = true;
      head = head.slice(1);
      rows = head.concat([neckRow(g.side ? g.headW : g.headW - 1)]).concat(body);
    } else {
      rows = blankRows(HEAD_PAD).concat(head);
      rows = rows.concat(body);
    }
    var grid = toGrid(rows);
    var headTop = g.fullCell ? 0 : HEAD_PAD;
    var bodyTop = g.fullCell ? 8 : HEAD_PAD + 8;
    applyHair(grid, p, dir, g, headTop, bodyTop);
    applyProps(grid, p, dir, g, headTop, bodyTop, step);
    applyIdentityCue(grid, p, dir, g, headTop, bodyTop, step);
    var fitted = fitActorCell(fromGrid(grid), g);
    fitted = removeDetachedSpecks(fitted);
    fitted = taperCellCrown(fitted);
    fitted = cleanCrownOutliers(fitted);
    fitted = removeDetachedSpecks(fitted);
    return { rows: seal(unbar(fitted, g)), geo: g };
  }

  function authoredCharacterPattern(name, dir, step) {
    var cast = GAME.RetroCastMatrices || {};
    var actor = cast[name];
    if (actor) {
      var view = dir === 'up' ? 'up' : ((dir === 'left' || dir === 'right') ? 'side' : 'down');
      var pose = actor[view] && actor[view][step ? 'step' : 'idle'];
      if (!pose || pose.length !== 16 || pose.some(function (row) { return row.length !== 16 || /[^.osc]/.test(row); })) {
        throw new Error('invalid authored 16x16 matrix: ' + name + '/' + view + '/' + (step ? 'step' : 'idle'));
      }
      return { rows: pose, geo: { fullCell: true } };
    }
    /* Cast di produzione senza matrice e' build rotta, non autorizzazione a
     * tornare al manichino procedurale. Fallback resta solo per palette di
     * sviluppo estranee all'inventario CHARS. */
    if (Object.prototype.hasOwnProperty.call(CHARS, name)) {
      throw new Error('missing authored cast matrix: ' + name);
    }
    return null;
  }

  /* I piedi restano sulla stessa riga per tutti: cambia dove FINISCE la
   * testa, non dove poggia lo sprite. */
  function verticalShift(g) {
    /* fitActorCell() ha gia' allineato ogni matrice sulla baseline 15. */
    return HEAD_PAD;
  }

  var dinerActorLightCanvas=null;
  var outdoorActorLightCanvas=null;
  function drawCastWalkSheet(ctx, name, x, y, dir, frame, alpha, moving, environment) {
    var castIndex = CAST_SHEET_ORDER.indexOf(name);
    if (castIndex < 0 || !castWalkSheet || !castWalkSheet.complete || castWalkSheet.naturalWidth !== 360 || castWalkSheet.naturalHeight !== 360 || !ctx.drawImage) return false;
    var blockX = (castIndex % 5) * 72;
    var blockY = Math.floor(castIndex / 5) * 72;
    var row = dir === 'up' ? 1 : (dir === 'left' || dir === 'right' ? 2 : 0);
    var phase = moving ? (frame & 3) : 0;
    var col = phase === 1 ? 1 : (phase === 3 ? 2 : 0);
    var ox = Math.round(x) - 4, oy = Math.round(y) - 8;
    var source=castWalkSheet,sx=blockX+col*24,sy=blockY+row*24;
    var life = !moving && environment && environment.characterLife;
    var idleFrame = life && LIFE_FRAMES[life.spriteFrame];
    if (idleFrame && idleFrame.actor === name && idleFrame.direction === (dir === 'left' ? 'right' : dir) &&
        lifeSheet && lifeSheet.complete && lifeSheet.naturalWidth === 192 && lifeSheet.naturalHeight === 24) {
      source=lifeSheet; sx=idleFrame.x; sy=0;
    }
    if(environment && (environment.mapId==='town' || environment.mapId==='woods') && typeof document!=='undefined') {
      if(!outdoorActorLightCanvas) {
        outdoorActorLightCanvas=document.createElement('canvas');
        outdoorActorLightCanvas.width=24; outdoorActorLightCanvas.height=24;
      }
      var daylight=outdoorActorLightCanvas.getContext('2d');
      if(daylight && daylight.createLinearGradient) {
        daylight.clearRect(0,0,24,24); daylight.imageSmoothingEnabled=false;
        daylight.drawImage(source,sx,sy,24,24,0,0,24,24);
        daylight.globalCompositeOperation='source-atop';
        // Light follows world direction even when the atlas is mirrored.
        var keylight=daylight.createLinearGradient(dir==='left'?24:0,0,dir==='left'?0:24,20);
        keylight.addColorStop(0,environment.mapId==='woods'?'rgba(173,205,217,.28)':'rgba(255,225,163,.38)');
        keylight.addColorStop(.48,'rgba(214,224,207,.08)');
        keylight.addColorStop(1,'rgba(18,37,50,.13)');
        daylight.fillStyle=keylight; daylight.fillRect(0,0,24,24);
        daylight.globalCompositeOperation='source-over';
        source=outdoorActorLightCanvas; sx=0; sy=0;
      }
    }
    var litRoom = environment && interiorRoomOf(environment.mapId);
    if(litRoom && typeof document!=='undefined') {
      var warmth=interiorActorLight(environment.wx,environment.wy,litRoom.lights);
      if(warmth && document.createElement) {
        if(!dinerActorLightCanvas) { dinerActorLightCanvas=document.createElement('canvas'); dinerActorLightCanvas.width=24; dinerActorLightCanvas.height=24; }
        var light=dinerActorLightCanvas.getContext('2d');
        light.clearRect(0,0,24,24); light.imageSmoothingEnabled=false;
        light.drawImage(source,sx,sy,24,24,0,0,24,24);
        light.globalCompositeOperation='source-atop';
        light.fillStyle='rgba(244,230,200,'+warmth+')';
        light.fillRect(7,1,7,1); light.fillRect(6,2,3,1);
        light.fillRect(5,14,2,1); light.fillRect(16,14,2,1);
        light.globalCompositeOperation='source-over';
        source=dinerActorLightCanvas; sx=0; sy=0;
      }
    }
    ctx.save();
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.imageSmoothingEnabled = false;
    if (dir === 'left') {
      ctx.translate(ox + 24, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(source, sx, sy, 24, 24, 0, oy, 24, 24);
    } else {
      ctx.drawImage(source, sx, sy, 24, 24, ox, oy, 24, 24);
    }
    ctx.restore();
    return true;
  }

  function drawActorContactShadow(ctx, x, y, alpha) {
    var oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = oldAlpha * (alpha == null ? 1 : alpha);
    /* Ellisse pixel compatta: punte affusolate e due valori, mai barra. */
    var sy = y + 14;
    R(ctx, x + 5, sy, 6, 1, 'rgba(49,90,73,.18)');
    R(ctx, x + 2, sy + 1, 12, 1, 'rgba(49,90,73,.24)');
    R(ctx, x + 1, sy + 2, 14, 1, 'rgba(49,90,73,.38)');
    R(ctx, x + 3, sy + 3, 11, 1, 'rgba(49,90,73,.28)');
    R(ctx, x + 5, sy + 4, 6, 1, 'rgba(49,90,73,.18)');
    ctx.globalAlpha = oldAlpha;
  }

  /* Interni: l'ellisse verde-teal e' tarata sull'erba e sui pavimenti caldi
   * (assi, moquette, tappeti) non si legge a 1x — due critici a contesto
   * fresco hanno scritto "nessun attore ha un'ombra di contatto" in ogni
   * stanza (reports/rooms-fresh-critic-2026-09-19.md). Qui ombra neutra
   * scura, stessa impronta 14x5 centrata sulla base della tile, valori
   * alti al centro e coda rapida ai bordi: si legge come contatto, non
   * come barra. */
  function drawInteriorActorShadow(ctx, x, y, alpha) {
    var oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = oldAlpha * (alpha == null ? 1 : alpha);
    /* Baseline piedi = y+15: le righe sopra restano quasi tutte dietro lo
     * sprite, quindi la massa sta sotto (y+16..y+19), larga 16 come la tile,
     * cosi' a 1x restano tre-quattro righe visibili ai lati e sotto i piedi. */
    var ox = Math.round(x), sy = Math.round(y) + 15;
    R(ctx, ox + 2, sy, 12, 1, 'rgba(28,22,18,.34)');
    R(ctx, ox, sy + 1, 16, 1, 'rgba(28,22,18,.55)');
    R(ctx, ox + 1, sy + 2, 14, 1, 'rgba(28,22,18,.46)');
    R(ctx, ox + 3, sy + 3, 10, 1, 'rgba(28,22,18,.30)');
    R(ctx, ox + 5, sy + 4, 6, 1, 'rgba(28,22,18,.14)');
    ctx.globalAlpha = oldAlpha;
  }
  function isIndoorMap(mapId) {
    if (!mapId) return false;
    var dict = GAME.maps && (GAME.maps.maps || GAME.maps);
    var m = dict && dict[mapId];
    return !!(m && m.indoor);
  }

  Spr.drawChar = function (ctx, x, y, pal, dir, frame, alpha, moving, night, time, environment) {
    var p = pal || CHARS.cooper;
    var name = nameOf(p);
    /* Ombra runtime unica: player e ogni NPC condividono ellisse 14x5.
     * Interni (map.indoor) usano la variante neutra scura. A room composed
     * elsewhere and registered as an interior scene keeps its own material's
     * contact shadow. */
    var actorRoom = environment && interiorRoomOf(environment.mapId);
    if (environment && (environment.indoor || isIndoorMap(environment.mapId))) {
      drawInteriorActorShadow(ctx, x, y, alpha);
    } else if(actorRoom) {
      var shadowAlpha=ctx.globalAlpha; ctx.globalAlpha*=alpha==null?1:alpha;
      interiorContact(ctx,Math.round(x)+2,Math.round(y)+15,12,actorRoom.material);
      ctx.globalAlpha=shadowAlpha;
    } else drawActorContactShadow(ctx, x, y, alpha);
    if (drawCastWalkSheet(ctx, name, x, y, dir, frame, alpha, moving, environment)) return;
    /* Cadenza Gen II a quattro fasi: contatto, passo A, contatto, passo B.
     * Down/up specchiano il solo passo B; il profilo alterna davvero idle e
     * passo, mentre left resta il mirror esatto di right. */
    var phase = moving ? (frame & 3) : 0;
    var stepping = !!moving && (phase === 1 || phase === 3);
    var flip = dir === 'left' || (stepping && phase === 3 && (dir === 'down' || dir === 'up'));
    var step = stepping ? 1 : 0;
    var built = authoredCharacterPattern(name, dir, step) ||
      charPattern(p, dir === 'left' ? 'right' : dir, step);
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
  GAME.Retro2D.characterLifeFrames = {src:LIFE_SHEET_SRC, frame:[24,24], frames:LIFE_FRAMES};
  GAME.Retro2D.castWalkSheet = {
    src: CAST_SHEET_SRC,
    production: true,
    size: [360, 360],
    block: [72, 72],
    frame: [24, 24],
    rows: ['down', 'up', 'right'],
    columns: ['idle', 'stepA', 'stepB'],
    mirrorsLeft: true,
    order: CAST_SHEET_ORDER.slice()
  };
  GAME.Retro2D.castRenderer = {
    id: CAST_RENDERER,
    kind: 'authored-master-derived-atlas',
    frame: [24, 24],
    visibleHeight: [20, 24],
    opaqueTones: 14,
    directions: ['down', 'up', 'right'],
    mirrorsLeft: true,
    gait: 'contact-stepA-contact-stepB; left-mirror-right',
    sourceAtlas: true,
    productionFallback: 'authored-matrices-error-only',
    matrixFiles: ['retro-cast-matrices-a.js', 'retro-cast-matrices-b.js']
  };
  GAME.Retro2D.interiorPropFootprints = INTERIOR_PROP_FOOTPRINTS.map(function (p) {
    return { id:p.id, map:p.map, kind:p.kind, cells:p.cells.map(function (c) { return c.slice(); }) };
  });
  GAME.Retro2D.townStructureDefs = TOWN_STRUCTURE_DEFS.map(function (d) {
    return {
      id:d.id, ch:d.ch, anchor:d.anchor.slice(), component:d.component.slice(),
      door:d.door && d.door.slice(), visualBounds:d.visualBounds.slice(),
      cameraFocus:d.cameraFocus.slice(), materialKit:d.materialKit
    };
  });
  GAME.Retro2D.arrivalContactBounds = Object.keys(ARRIVAL_CONTACT_BOUNDS).reduce(function (out, key) {
    out[key] = ARRIVAL_CONTACT_BOUNDS[key].slice(); return out;
  }, {});

  function rgbDistance(a, b) {
    var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return dr * dr + dg * dg + db * db;
  }

  /* Interni conservano disciplina palette GBC. Esterni usano rampe materiche
   * più ricche, coerenti col bar DS, senza quantizzazione per blocchi 8x8. */
  GAME.Retro2D.limitBackgroundPalettes = function (ctx, cx, cy, w, h, mapId) {
    if (mapId === 'town' || mapId === 'arrival' || mapId === 'woods' || INTERIOR_MATERIALS[mapId]) return;
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
  GAME.Retro2D.interiorKit = KIT.pieces;
  GAME.Retro2D.unsupportedGlyphs = unsupportedGlyphs;
  /* scene: { material, draw(g,map,x,y,p,kit), foreground?(g,map,x,y,p,kit,min,max),
   *          actorLights?, monogram?, backdrop? }. The id is the map id it draws. */
  GAME.Retro2D.registerInteriorScene = function (id, scene) {
    if (id === 'diner') throw new Error('the Double R is composed by the renderer itself');
    if (!scene || typeof scene.draw !== 'function' || !INTERIOR_MATERIALS[scene.material]) {
      throw new Error('interior scene needs a draw function and a known material: ' + id);
    }
    INTERIOR_SCENES[id] = scene;
    return scene;
  };
  GAME.Retro2D.authored = true;
  GAME.Retro2D.tileSize = 16;
  GAME.Retro2D.spriteSize = [16, 16];
})();
