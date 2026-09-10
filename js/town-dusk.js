/* town-dusk.js — Town: stato autoriale "early dusk" (Phase 4, D1/D5).
 *
 * Nessun sistema giorno/notte, nessun valore tempo, nessun generatore
 * procedurale. Due passaggi soltanto, agganciati allo stesso hook che le
 * scene lotto usano (GAME.Retro2D.limitBackgroundPalettes, chiamato da
 * engine.js dopo il background e prima degli sprite OBJ):
 *
 *   A. grade — mappatura deterministica per-pixel del composito di sfondo,
 *      memoizzata su chiave a 24 bit. Nessun blur, nessun dithering,
 *      nessuna lettura di vicinato, output intero.
 *   B. practicals — rettangoli emissivi autoriali in coordinate mondo,
 *      solo per i landmark dello slice. Le coordinate nascono dalla
 *      tabella TOWN_STRUCTURE_DEFS (GAME.Retro2D.townStructureDefs) cosi'
 *      l'overlay non puo' scollarsi dalla facciata.
 *
 * Riferimenti misurati (non teoria): artifacts/double-r-exterior-v02/
 * native-clean.png e artifacts/sheriffs-station-exterior-v01/final.png.
 * Famiglie del lotto: asfalto #485665, calcestruzzo #777b70/#a9a38f,
 * vegetazione #223b2f/#18382e, bordeaux #8c2f3e, crema accesa #f4e6c8.
 */
(function () {
  'use strict';
  var G = (typeof window !== 'undefined' ? window : globalThis);
  var GAME = G.GAME = G.GAME || {};
  var MAP = 'town';
  var TILE = 16;

  /* ------------------------------------------------------------------
   * A. Costanti del grade.
   *
   * Curva di valore a tre tratti, non una rampa unica: i neri restano neri
   * (identita' sotto KNEE) cosi' i contorni autoriali non si sfocano, la
   * fascia media si comprime forte (le creme diurne #e8d08f scendono sul
   * calcestruzzo #7a766c del lotto Double R) e sopra SHOULDER la pendenza
   * risale, perche' tutto cio' che nel giorno era piu' chiaro del terreno
   * (crema d'insegna, strisce, riflessi) e' superficie illuminata: a sera
   * deve restare la piu' luminosa del frame (bibbia §5, ordine di valore
   * aperture > insegne > pareti > terreno > vegetazione).
   *
   * Le famiglie non sono decorative: la vegetazione diventa la piu' scura,
   * i caldi conservano tinta e scendono di poco, i blu vengono solo
   * compressi. Le tile di strada usano la seconda curva (ASPHALT) e
   * atterrano sull'ardesia #485665 misurata sul lotto.
   * ------------------------------------------------------------------ */
  var KNEE = 60, SHOULDER = 215, FLOOR = 30;
  var MID_GAIN = 0.375, HI_GAIN = 1.45;
  var A_KNEE = 50, A_MID_GAIN = 0.24, A_HI_GAIN = 2.30;
  var SLATE = [72, 86, 101];       /* #485665 — ardesia del lotto Double R */
  var VEG_ANCHOR = [47, 77, 59];   /* #2f4d3b — arbusto del lotto */
  var MIN_CHANNEL = 20;            /* mai nero pieno; contorni ~#1a1f1f */

  /* keep = quanta cromia sopravvive; dark = scurimento extra sul valore
   * compresso; cool = quota di miscela verso l'ardesia; anchor = quota di
   * miscela verso l'ancora di famiglia. */
  var FAMILY = {
    ground:     { id: 'ground', keep: 0.44, dark: 1.00, cool: 0.10, anchor: null, anchorMix: 0 },
    vegetation: { id: 'vegetation', keep: 0.80, dark: 0.70, cool: 0.00, anchor: VEG_ANCHOR, anchorMix: 0.25 },
    warm:       { id: 'warm', keep: 1.00, dark: 1.00, cool: 0.06, anchor: null, anchorMix: 0 },
    blue:       { id: 'blue', keep: 0.70, dark: 1.00, cool: 0.10, anchor: null, anchorMix: 0 }
  };

  /* Sull'asfalto la cromia quasi sparisce e la miscela fredda e' forte in
   * ombra, debole sui segni chiari: le strisce restano grigio caldo come
   * le linee di stallo del lotto (#a9a38f), non azzurre. */
  var ASPHALT_KEEP = 0.20, ASPHALT_COOL_LOW = 0.68, ASPHALT_COOL_HIGH = 0.22;
  /* Sopra SHOULDER il pixel e' superficie illuminata: oltre a restare
   * luminoso conserva quasi tutta la sua tinta, cosi' le creme di
   * facciata restano grigio caldo (#95948a) invece di virare al grigio
   * neutro come il terreno. */
  var LIT_KEEP = 0.85;
  var ASPHALT_COOL_FROM = 90, ASPHALT_COOL_TO = 150;

  function luma(r, g, b) { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }

  function compress(L) {
    var v;
    if (L <= KNEE) v = L;
    else if (L <= SHOULDER) v = KNEE + (L - KNEE) * MID_GAIN;
    else v = KNEE + (SHOULDER - KNEE) * MID_GAIN + (L - SHOULDER) * HI_GAIN;
    return v < FLOOR ? FLOOR : v;
  }

  function compressAsphalt(L) {
    var v;
    if (L <= A_KNEE) v = L;
    else if (L <= SHOULDER) v = A_KNEE + (L - A_KNEE) * A_MID_GAIN;
    else v = A_KNEE + (SHOULDER - A_KNEE) * A_MID_GAIN + (L - SHOULDER) * A_HI_GAIN;
    return v < FLOOR ? FLOOR : v;
  }

  function asphaltCool(target) {
    if (target <= ASPHALT_COOL_FROM) return ASPHALT_COOL_LOW;
    if (target >= ASPHALT_COOL_TO) return ASPHALT_COOL_HIGH;
    var t = (target - ASPHALT_COOL_FROM) / (ASPHALT_COOL_TO - ASPHALT_COOL_FROM);
    return ASPHALT_COOL_LOW + (ASPHALT_COOL_HIGH - ASPHALT_COOL_LOW) * t;
  }

  function hueOf(r, g, b, mx, mn) {
    var d = mx - mn;
    if (d === 0) return 0;
    var h;
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  }

  /* Vegetazione larga (58°-175°) perche' le banchine gialloverdi del town
   * (#8fa474, #c5c886) sono prato, non terreno: lasciate nella famiglia
   * neutra restavano grigio-verdi e chiare quanto il marciapiede. */
  function familyOf(r, g, b) {
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    var sat = mx ? (mx - mn) / mx : 0;
    var hue = hueOf(r, g, b, mx, mn);
    if (hue >= 58 && hue <= 175 && sat > 0.22) return FAMILY.vegetation;
    if ((hue < 34 || hue > 340) && sat > 0.32) return FAMILY.warm;
    if (hue >= 190 && hue <= 250) return FAMILY.blue;
    return FAMILY.ground;
  }

  function clampChannel(v) {
    v = Math.round(v);
    if (v < MIN_CHANNEL) return MIN_CHANNEL;
    return v > 255 ? 255 : v;
  }

  /* Grade puro: stesso ingresso, stessa uscita, sempre. `asphalt` seleziona
   * la seconda curva e vale solo per i pixel di terreno dentro una tile di
   * strada; verde, caldi e blu restano nella loro famiglia anche li'. */
  function gradeRGB(r, g, b, asphalt) {
    var fam = familyOf(r, g, b);
    var onRoad = !!asphalt && fam === FAMILY.ground;
    var L = luma(r, g, b);
    var target = (onRoad ? compressAsphalt(L) : compress(L)) * fam.dark;
    var keep = onRoad ? ASPHALT_KEEP : fam.keep;
    if (!onRoad && L > SHOULDER && keep < LIT_KEEP) keep = LIT_KEEP;
    var cool = onRoad ? asphaltCool(target) : fam.cool;
    var cr, cg, cb;
    if (L < 1) {
      cr = cg = cb = target;
    } else {
      /* La desaturazione verso L conserva esattamente la luminanza, quindi
       * la scala successiva porta il pixel sul valore voluto senza deriva.
       * Quando la compressione solleva un pixel scuro (s > 1) la cromia
       * verrebbe amplificata: il bordeaux di zoccolo (#4c1119) usciva piu'
       * rosso della fascia (#8f2430). Il guard tiene la cromia assoluta,
       * non quella relativa, e l'ordine dei valori resta quello del giorno. */
      var s = target / L;
      var k = keep * (s > 1 ? 1 / s : 1);
      cr = (L + (r - L) * k) * s;
      cg = (L + (g - L) * k) * s;
      cb = (L + (b - L) * k) * s;
    }
    if (cool) {
      var ic = 1 - cool;
      cr = cr * ic + SLATE[0] * cool;
      cg = cg * ic + SLATE[1] * cool;
      cb = cb * ic + SLATE[2] * cool;
    }
    if (!onRoad && fam.anchor && fam.anchorMix) {
      var a = fam.anchorMix, ia = 1 - a;
      cr = cr * ia + fam.anchor[0] * a;
      cg = cg * ia + fam.anchor[1] * a;
      cb = cb * ia + fam.anchor[2] * a;
    }
    return [clampChannel(cr), clampChannel(cg), clampChannel(cb)];
  }

  /* Memoizzazione su chiave a 24 bit (una tabella per curva). La tavolozza
   * del town e' piccola: poche centinaia di voci, nessuna allocazione per
   * pixel dopo il primo frame. */
  var memo = Object.create(null), memoRoad = Object.create(null);
  var memoSize = 0;
  function gradeKey(r, g, b, asphalt) {
    var table = asphalt ? memoRoad : memo;
    var key = (r << 16) | (g << 8) | b;
    var hit = table[key];
    if (hit !== undefined) return hit;
    var out = gradeRGB(r, g, b, asphalt);
    var packed = (out[0] << 16) | (out[1] << 8) | out[2];
    table[key] = packed;
    memoSize++;
    return packed;
  }

  function gradeRect(ctx, x, y, w, h, skipTransparent) {
    if (!ctx || !ctx.getImageData || !ctx.putImageData) return false;
    if (w <= 0 || h <= 0) return false;
    var image;
    try { image = ctx.getImageData(x, y, w, h); } catch (e) { return false; }
    var data = image.data, i, packed;
    for (i = 0; i < data.length; i += 4) {
      if (skipTransparent && !data[i + 3]) continue;
      packed = gradeKey(data[i], data[i + 1], data[i + 2], false);
      data[i] = (packed >> 16) & 255;
      data[i + 1] = (packed >> 8) & 255;
      data[i + 2] = packed & 255;
    }
    ctx.putImageData(image, x, y);
    return true;
  }

  /* Maschera delle tile di strada nel viewport corrente. Le coordinate
   * vengono dalle righe ASCII della mappa: nessuna geometria duplicata. */
  var ROAD_GLYPHS = { r: 1, '-': 1, ':': 1 };

  function roadMask(cx, cy, w, h) {
    var rows = townRows();
    if (!rows) return null;
    var tx0 = Math.floor(cx / TILE), ty0 = Math.floor(cy / TILE);
    var cols = Math.ceil(w / TILE) + 2, lines = Math.ceil(h / TILE) + 2;
    var grid = [], gy, gx, line, ch;
    for (gy = 0; gy < lines; gy++) {
      line = rows[ty0 + gy] || '';
      var band = [];
      for (gx = 0; gx < cols; gx++) {
        ch = line.charAt(tx0 + gx);
        band.push(ROAD_GLYPHS[ch] ? 1 : 0);
      }
      grid.push(band);
    }
    return { grid: grid, tx0: tx0, ty0: ty0, cols: cols, lines: lines };
  }

  function applyGrade(ctx, cx, cy, w, h) {
    if (!ctx || !ctx.getImageData || !ctx.putImageData) return false;
    var image;
    try { image = ctx.getImageData(0, 0, w, h); } catch (e) { return false; }
    var mask = roadMask(cx, cy, w, h);
    var data = image.data, x, y, pos, packed, band, road;
    for (y = 0; y < h; y++) {
      band = mask ? mask.grid[((y + cy) >> 4) - mask.ty0] : null;
      pos = y * w * 4;
      for (x = 0; x < w; x++, pos += 4) {
        road = band ? band[((x + cx) >> 4) - mask.tx0] === 1 : false;
        packed = gradeKey(data[pos], data[pos + 1], data[pos + 2], road);
        data[pos] = (packed >> 16) & 255;
        data[pos + 1] = (packed >> 8) & 255;
        data[pos + 2] = packed & 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    return true;
  }



  /* ------------------------------------------------------------------
   * B. Practicals autoriali. Coordinate in pixel relative all'anchor del
   * landmark (stessa convenzione di visualBounds): il renderer somma
   * anchor*16 e sottrae la camera. Niente pulsazione, niente animazione.
   * ------------------------------------------------------------------ */
  var PRACTICALS = {
    sheriff: [
      /* Vetrine basse: fluorescente istituzionale freddo, un solo gradino
       * chiaro in alto. Coordinate = quelle del telaio autoriale. */
      { x: 9, y: 23, w: 20, h: 12, c: '#cfe0cf' },
      { x: 9, y: 23, w: 20, h: 3, c: '#e6f0e2' },
      { x: 51, y: 23, w: 20, h: 12, c: '#cfe0cf' },
      { x: 51, y: 23, w: 20, h: 3, c: '#e6f0e2' },
      /* Unico caldo del fronte: lampada da scrivania nella luce destra. */
      { x: 64, y: 27, w: 3, h: 3, c: '#f2c76a' },
      /* Plafoniera sopra l'ingresso e sua ricaduta sul muro. */
      { x: 34, y: 25, w: 12, h: 3, c: '#e6f0e2' },
      { x: 36, y: 28, w: 8, h: 2, c: '#8a9184' },
      /* Vetri della porta e coppia di pixel freddi sui battenti. */
      { x: 34, y: 36, w: 4, h: 4, c: '#7d8a82' },
      { x: 42, y: 36, w: 4, h: 4, c: '#7d8a82' },
      { x: 36, y: 41, w: 1, h: 2, c: '#cfe0cf' },
      { x: 44, y: 41, w: 1, h: 2, c: '#cfe0cf' },
      /* Pozza sul sagrato: due gradini piatti, bordi duri. */
      { x: 26, y: 64, w: 28, h: 6, c: '#93998c' },
      { x: 21, y: 70, w: 38, h: 5, c: '#83887c' },
      /* Ricadute delle due vetrine sul marciapiede, sempre a due gradini. */
      { x: 10, y: 64, w: 20, h: 4, c: '#83887c' },
      { x: 7, y: 68, w: 26, h: 3, c: '#7b8076' },
      { x: 52, y: 64, w: 20, h: 4, c: '#83887c' },
      { x: 49, y: 68, w: 26, h: 3, c: '#7b8076' }
    ],
    'double-r': [
      /* Vetrine calde: la sala e' la sola pozza calda dominante del fronte.
       * Il gradino alto e' il soffitto illuminato, sotto restano visibili
       * gli schienali bordeaux dipinti pre-grade. */
      { x: 9, y: 15, w: 28, h: 11, c: '#e9bd5d' },
      { x: 9, y: 15, w: 28, h: 3, c: '#f4e6c8' },
      { x: 10, y: 26, w: 26, h: 1, c: '#f4e6c8' },
      { x: 69, y: 15, w: 22, h: 11, c: '#e9bd5d' },
      { x: 69, y: 15, w: 22, h: 3, c: '#f4e6c8' },
      { x: 70, y: 26, w: 20, h: 1, c: '#f4e6c8' },
      /* Vetri dorati della porta a due battenti. */
      { x: 50, y: 16, w: 4, h: 14, c: '#f4e6c8' },
      { x: 58, y: 16, w: 4, h: 14, c: '#f4e6c8' },
      /* Insegna: bordo crema acceso e tubo neon rosso sotto le lettere. */
      { x: 28, y: -7, w: 56, h: 1, c: '#f4e6c8' },
      { x: 28, y: 7, w: 56, h: 1, c: '#f4e6c8' },
      { x: 33, y: 5, w: 47, h: 1, c: '#c45a61' },
      /* Pozza calda sul marciapiede: due gradini sotto porta e vetrine. */
      { x: 44, y: 48, w: 26, h: 6, c: '#b39a68' },
      { x: 39, y: 54, w: 36, h: 5, c: '#8f8264' },
      { x: 10, y: 48, w: 26, h: 4, c: '#8f8264' },
      { x: 7, y: 52, w: 32, h: 3, c: '#7d745c' },
      { x: 68, y: 48, w: 22, h: 4, c: '#8f8264' },
      { x: 66, y: 52, w: 26, h: 3, c: '#7d745c' }
    ]
  };

  /* Lampioni della fascia civica: bulbo caldo 2x2 e pozza a tre gradini
   * sotto il palo. Il glifo L della mappa e' l'unica fonte, cosi' l'ovale
   * di luce non puo' finire dove non c'e' lampione. */
  var LAMP_ROWS = [13, 24], LAMP_COLS = [5, 50];
  var LAMP_BULB = '#f2c76a';
  /* Tre gradini piatti appena sopra il calcestruzzo graduato (~#79766c):
   * la pozza si legge come luce, non come chiazza di vernice. */
  var LAMP_POOL = ['#8d8875', '#847f6e', '#7c7a6b'];
  var LAMP_BASE = '#293930';

  function defsById() {
    var defs = GAME.Retro2D && GAME.Retro2D.townStructureDefs;
    var out = {};
    if (!defs) return out;
    for (var i = 0; i < defs.length; i++) out[defs[i].id] = defs[i];
    return out;
  }

  function fill(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function townRows() {
    var maps = GAME.Maps || GAME.maps;
    var map = maps && maps[MAP];
    return map && map.rows && map.rows.length ? map.rows : null;
  }

  /* Un lampione dietro la massa di un landmark e' coperto dalla facciata:
   * la sua pozza diventerebbe una chiazza sospesa sul tetto. Il filtro usa
   * gli stessi visualBounds della tabella, non una lista scritta a mano. */
  function coveredByLandmark(tx, ty) {
    var defs = GAME.Retro2D && GAME.Retro2D.townStructureDefs;
    if (!defs) return false;
    var x0 = tx * TILE, y0 = ty * TILE, x1 = x0 + TILE, y1 = y0 + TILE;
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i], vb = d.visualBounds;
      var bx = d.anchor[0] * TILE + vb[0], by = d.anchor[1] * TILE + vb[1];
      if (x1 > bx && x0 < bx + vb[2] && y1 > by && y0 < by + vb[3]) return true;
    }
    return false;
  }

  function lampCells() {
    var rows = townRows(), out = [];
    if (!rows) return out;
    for (var ty = LAMP_ROWS[0]; ty <= LAMP_ROWS[1] && ty < rows.length; ty++) {
      var line = rows[ty];
      if (!line) continue;
      for (var tx = LAMP_COLS[0]; tx <= LAMP_COLS[1] && tx < line.length; tx++) {
        if (line.charAt(tx) === 'L' && !coveredByLandmark(tx, ty)) out.push([tx, ty]);
      }
    }
    return out;
  }

  function drawPracticals(ctx, cx, cy) {
    var defs = defsById(), id, def, rects, i, r;
    for (id in PRACTICALS) {
      def = defs[id];
      if (!def) continue;
      rects = PRACTICALS[id];
      var ox = def.anchor[0] * TILE - cx, oy = def.anchor[1] * TILE - cy;
      for (i = 0; i < rects.length; i++) {
        r = rects[i];
        fill(ctx, ox + r.x, oy + r.y, r.w, r.h, r.c);
      }
    }
    var lamps = lampCells();
    for (i = 0; i < lamps.length; i++) {
      var lx = lamps[i][0] * TILE - cx, ly = lamps[i][1] * TILE - cy;
      /* Tre gradini piatti contenuti nella tile del lampione: la luce non
       * scavalca mai il tile successivo, non sfuma e resta di poco sopra il
       * calcestruzzo graduato (~#747164), cosi' legge come luce e non come
       * chiazza di vernice. Due rettangoli per gradino danno la silhouette
       * arrotondata senza dithering. */
      fill(ctx, lx, ly + 10, 16, 6, LAMP_POOL[2]);
      fill(ctx, lx + 2, ly + 9, 12, 8, LAMP_POOL[2]);
      fill(ctx, lx + 2, ly + 11, 12, 4, LAMP_POOL[1]);
      fill(ctx, lx + 4, ly + 10, 8, 6, LAMP_POOL[1]);
      fill(ctx, lx + 5, ly + 12, 6, 2, LAMP_POOL[0]);
      fill(ctx, lx + 6, ly + 11, 4, 4, LAMP_POOL[0]);
      /* Base del palo: la pozza non deve staccare il lampione da terra. */
      fill(ctx, lx + 5, ly + 13, 6, 3, LAMP_BASE);
      fill(ctx, lx + 7, ly + 1, 2, 2, LAMP_BULB);
    }
  }

  /* ------------------------------------------------------------------
   * Hook. Stesso schema di js/double-r-exterior-scene.js: si avvolge la
   * funzione esistente una sola volta e si delega per ogni altra mappa.
   * ------------------------------------------------------------------ */
  var installed = false, original = null, originalForeground = null;
  var scratch = null, scratchCtx = null;

  function scratchFor(w, h) {
    if (typeof document === 'undefined' || !document.createElement) return null;
    if (!scratch) {
      scratch = document.createElement('canvas');
      scratchCtx = scratch.getContext('2d');
    }
    if (!scratchCtx) return null;
    if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
    else scratchCtx.clearRect(0, 0, w, h);
    return scratchCtx;
  }

  /* Il pass foreground ridipinge le fasce di chiome sopra il composito gia'
   * graduato (painter's algorithm degli attori): senza questo wrap le stesse
   * conifere uscivano in verde diurno dentro una scena serale. Si disegna su
   * uno scratch trasparente, si grada solo la banda toccata e si ricompone.
   * TREE_RISE copre l'altezza autoriale della chioma sopra la radice. */
  var TREE_RISE = 80, TREE_DROP = 24;

  function wrapForeground() {
    var sprites = GAME.sprites;
    if (!sprites || typeof sprites.drawForegroundStructures !== 'function') return false;
    originalForeground = sprites.drawForegroundStructures;
    sprites.drawForegroundStructures = function (ctx, map, cx, cy, opts) {
      if (!map || map.id !== MAP || !ctx) return originalForeground.apply(this, arguments);
      var canvas = ctx.canvas || {};
      var w = (opts && opts.viewportWidth) || canvas.width || 0;
      var h = (opts && opts.viewportHeight) || canvas.height || 0;
      var min = opts && isFinite(opts.forestDepthMin) ? opts.forestDepthMin - cy - TREE_RISE : 0;
      var max = opts && isFinite(opts.forestDepthMax) ? opts.forestDepthMax - cy + TREE_DROP : h;
      var y0 = Math.max(0, Math.floor(min)), y1 = Math.min(h, Math.ceil(max));
      if (!w || !h || y1 <= y0) return originalForeground.apply(this, arguments);
      var sctx = scratchFor(w, h);
      if (!sctx) return originalForeground.apply(this, arguments);
      originalForeground.call(this, sctx, map, cx, cy, opts);
      gradeRect(sctx, 0, y0, w, y1 - y0, true);
      ctx.drawImage(scratch, 0, y0, w, y1 - y0, 0, y0, w, y1 - y0);
    };
    return true;
  }

  function install() {
    if (installed) return true;
    GAME.Retro2D = GAME.Retro2D || {};
    original = GAME.Retro2D.limitBackgroundPalettes;
    installed = true;
    GAME.Retro2D.limitBackgroundPalettes = function (ctx, cx, cy, w, h, mapId) {
      if (mapId === MAP) {
        applyGrade(ctx, cx, cy, w, h);
        drawPracticals(ctx, cx, cy);
        return original ? original.apply(this, arguments) : undefined;
      }
      return original ? original.apply(this, arguments) : undefined;
    };
    wrapForeground();
    return true;
  }

  GAME.TownDusk = {
    mapId: MAP,
    install: install,
    grade: gradeRGB,
    familyOf: function (r, g, b) { return familyOf(r, g, b).id; },
    gradePacked: gradeKey,
    applyGrade: applyGrade,
    gradeRect: gradeRect,
    drawPracticals: drawPracticals,
    practicals: PRACTICALS,
    lampCells: lampCells,
    constants: {
      knee: KNEE, shoulder: SHOULDER, floor: FLOOR,
      midGain: MID_GAIN, hiGain: HI_GAIN,
      asphaltKnee: A_KNEE, asphaltMidGain: A_MID_GAIN, asphaltHiGain: A_HI_GAIN,
      asphaltKeep: ASPHALT_KEEP, slate: SLATE.slice(),
      vegAnchor: VEG_ANCHOR.slice(), minChannel: MIN_CHANNEL,
      family: FAMILY, roadGlyphs: ROAD_GLYPHS,
      lampRows: LAMP_ROWS.slice(), lampCols: LAMP_COLS.slice()
    },
    memoSize: function () { return memoSize; }
  };

  install();
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.TownDusk;
})();
