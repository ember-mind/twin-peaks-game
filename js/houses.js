/* houses.js — edifici in proiezione TOP-DOWN 3D obliqua stile Pokémon B/W.
   Espone GAME.sprites.drawStructures(g, map, cx, cy, opts).
   Scansiona la mappa una volta (cache per map.id) trovando i rettangoli dei
   caratteri '1'..'4' (le porte 'D' incassate nel muro contano nel footprint),
   poi disegna sopra i tile piatti una casa vista dall'alto-fronte: il piano del
   TETTO a padiglione domina la scena (~70%), con colmo, falda posteriore in
   ombra e falda anteriore illuminata a tegole; sotto, una FACCIATA bassa (18px)
   a tavole con porta incassata e finestre. Solo fillRect. rgba per le ombre.
   Deterministico (hash da bx,by). ES5. */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var S = G.GAME.sprites = G.GAME.sprites || {};

  var TILE = 16;

  // Ogni edificio ha un linguaggio materico, non soltanto una tinta diversa.
  // I campi style guidano ritmo del tetto, rivestimento, infissi e dettaglio
  // identitario mantenendo la stessa impronta ASCII e la porta canonica a sud.
  var PAL = {
    // Distretto: ardesia ordinata, mattoni chiari, ingresso civico blu.
    '1': {
      style: { roof: 'slate', wall: 'brick', course: 5, pitch: 0.26, eave: 4, ridge: 0.20,
        rise: 11, crossGable: 22, vent: 1, civicBay: 1, gutter: 1, wear: 'clean' },
      roof: { front: '#708aa5', front2: '#829bb2', back: '#3d5064', ridge: '#b7c9d7', outline: '#263544', seam: '#536b82', glint: '#9eb2c3' },
      fac: { wall: '#c5a878', wall2: '#b99866', dark: '#806443', light: '#ead3a5', trim: '#e4d7bc',
        glass: '#263946', glassL: '#8eb4c3', glassWarm: '#a58b58', door: '#334c62', foundation: '#594b3a',
        accent: '#c8a24d', sign: '#365875', signL: '#f0ddb1' }
    },
    // Double R: copertura metallica blu, mattoni rossi e marquee crema/rosso.
    '2': {
      style: { roof: 'metal', wall: 'brick', course: 6, pitch: 0.17, eave: 6, ridge: 0.14,
        rise: 3, awning: 1, marquee: 1, canopy: 1, gutter: 1, wear: 'flashing' },
      roof: { front: '#477fae', front2: '#5995c5', back: '#294f73', ridge: '#b6d5e7', outline: '#1e3348', seam: '#2f638e', glint: '#80b7d6' },
      fac: { wall: '#a96f4e', wall2: '#8e583d', dark: '#603b2d', light: '#d8a977', trim: '#f0d9ad',
        glass: '#20333d', glassL: '#77a9bb', glassWarm: '#d8a157', door: '#92333a', foundation: '#4d382d',
        accent: '#c32632', sign: '#aa202e', signL: '#ffe4aa' }
    },
    // Palmer: scandole di cedro, assito crema, veranda domestica.
    '3': {
      style: { roof: 'cedar', wall: 'clapboard', course: 5, pitch: 0.31, eave: 5, ridge: 0.24,
        rise: 14, ridgeShift: -0.035, crossGable: 18, chimney: 1, porch: 1, sideBay: 1,
        gutter: 1, wear: 'moss' },
      roof: { front: '#9b6b4d', front2: '#b48362', back: '#553826', ridge: '#d0ac84', outline: '#352419', seam: '#754b35', glint: '#c49a76' },
      fac: { wall: '#d7c397', wall2: '#c5ad7d', dark: '#8f7653', light: '#f0dfb5', trim: '#eee5cb',
        glass: '#2c3436', glassL: '#91a6a1', glassWarm: '#c99b55', door: '#724239', foundation: '#665746',
        accent: '#856b50', sign: '#765443', signL: '#e9d5a8' }
    },
    // Great Northern: shakes irregolari, tronchi e portico da lodge.
    '4': {
      style: { roof: 'shake', wall: 'log', course: 6, pitch: 0.28, eave: 7, ridge: 0.17,
        rise: 16, ridgeShift: 0.035, crossGable: 30, chimney: 1, porch: 1, lodge: 1,
        lodgeBay: 1, gutter: 1, wear: 'moss' },
      roof: { front: '#486548', front2: '#587856', back: '#24382b', ridge: '#87a47a', outline: '#15251a', seam: '#334d38', glint: '#6d8a65' },
      fac: { wall: '#755536', wall2: '#62462d', dark: '#382a1d', light: '#a47a4a', trim: '#b39262',
        glass: '#1b2827', glassL: '#5f827e', glassWarm: '#c7984f', door: '#44301f', foundation: '#30271e',
        accent: '#9b743f', sign: '#3f2c1e', signL: '#e8c47a' }
    },
    // Ospedale: giunti verticali, stucco pulito e croce leggibile.
    '5': {
      style: { roof: 'metal', wall: 'stucco', course: 7, pitch: 0.12, eave: 3, ridge: 0.08,
        rise: -4, flat: 1, vent: 1, clinic: 1, clinicBay: 1, gutter: 1, wear: 'flashing' },
      roof: { front: '#849aa9', front2: '#9db0bc', back: '#526674', ridge: '#d5e0e5', outline: '#344650', seam: '#667f8e', glint: '#bdcbd2' },
      fac: { wall: '#e6e7df', wall2: '#d2d6cf', dark: '#929c98', light: '#faf9ed', trim: '#ffffff',
        glass: '#25404f', glassL: '#9dc5d2', glassWarm: '#d8bd74', door: '#527987', foundation: '#74807e',
        accent: '#a83238', sign: '#f2f1e8', signL: '#b02f36' }
    },
    // Roadhouse: carta catramata, tavole annerite e neon artigianale.
    '6': {
      style: { roof: 'tar', wall: 'board', course: 7, pitch: 0.22, eave: 7, ridge: 0.20,
        rise: 6, ridgeShift: -0.09, chimney: 1, awning: 1, neon: 1, canopy: 1,
        sideWing: 1, gutter: 1, wear: 'patch' },
      roof: { front: '#40342d', front2: '#514139', back: '#211914', ridge: '#705d4d', outline: '#120d0a', seam: '#30251f', glint: '#655248' },
      fac: { wall: '#5b4435', wall2: '#493529', dark: '#281e19', light: '#8a674c', trim: '#785a42',
        glass: '#15171a', glassL: '#414f55', glassWarm: '#bd7543', door: '#38241c', foundation: '#201a16',
        accent: '#cf2839', sign: '#391c21', signL: '#ff5a62' }
    }
  };

  var rectCache = {};

  // trova, per ogni carattere edificio, il bounding box (rettangolo) e le porte
  function scanRects(map) {
    var rows = map.rows, H = rows.length;
    var acc = {}; // ch -> {minx,miny,maxx,maxy,doors}
    var y, x, ch, row, c, i;

    function bump(c, x, y, isDoor) {
      var a = acc[c];
      if (!a) { a = acc[c] = { minx: x, miny: y, maxx: x, maxy: y, doors: [] }; }
      if (x < a.minx) a.minx = x;
      if (x > a.maxx) a.maxx = x;
      if (y < a.miny) a.miny = y;
      if (y > a.maxy) a.maxy = y;
      if (isDoor) a.doors.push({ x: x, y: y });
    }

    for (y = 0; y < H; y++) {
      row = rows[y];
      for (x = 0; x < row.length; x++) {
        ch = row.charAt(x);
        if (ch === '1' || ch === '2' || ch === '3' || ch === '4' || ch === '5' || ch === '6') {
          bump(ch, x, y, false);
        } else if (ch === 'D') {
          // porta incassata nel muro: appartiene all'edificio che la fiancheggia
          var left = row.charAt(x - 1), right = row.charAt(x + 1);
          for (i = 1; i <= 6; i++) {
            c = String(i);
            if (left === c || right === c) { bump(c, x, y, true); break; }
          }
        }
      }
    }

    var out = [];
    for (c in acc) {
      if (!acc.hasOwnProperty(c)) continue;
      var a = acc[c];
      out.push({
        ch: c,
        bx: a.minx, by: a.miny,
        bw: a.maxx - a.minx + 1,
        bh: a.maxy - a.miny + 1,
        doors: a.doors
      });
    }
    return out;
  }

  function drawHouse(g, rc, cx, cy) {
    var P = PAL[rc.ch];
    var RT = P.roof, F = P.fac, ST = P.style;
    var bx = rc.bx, by = rc.by, bw = rc.bw, bh = rc.bh;
    var L = bx * TILE, Rr = (bx + bw) * TILE;
    var Tp = by * TILE, Bt = (by + bh) * TILE;
    var W = Rr - L;

    function fr(x, y, w, h, col) {
      if (w <= 0 || h <= 0) return;
      g.fillStyle = col; g.fillRect(Math.round(x) - cx, Math.round(y) - cy, Math.round(w), Math.round(h));
    }

    function hash(x, y, salt) {
      var n = ((x + 19) * 928371 + (y + 7) * 364479 + (salt + 3) * 73129);
      n = (n ^ (n >>> 11) ^ (n << 7)) >>> 0;
      return n & 255;
    }

    function iconCross(x, y, col) {
      fr(x + 2, y, 2, 6, col);
      fr(x, y + 2, 6, 2, col);
    }

    function iconStar(x, y, col) {
      fr(x + 2, y, 1, 5, col);
      fr(x, y + 2, 5, 1, col);
      fr(x + 1, y + 1, 3, 3, col);
    }

    function iconPine(x, y, col) {
      fr(x + 3, y, 1, 7, col);
      fr(x + 2, y + 1, 3, 1, col);
      fr(x + 1, y + 3, 5, 1, col);
      fr(x, y + 5, 7, 1, col);
    }

    var cxr = L + W / 2;
    var FAC_H = 18;
    var facTop = Bt - FAC_H;
    var roofTop = Tp - ST.rise;
    var roofBot = facTop;
    var roofH = roofBot - roofTop;
    var roofAxis = cxr + W * (ST.ridgeShift || 0);
    var ridgeInset = Math.round(W * ST.ridge);
    var ridgeW = W - 2 * ridgeInset;
    var ridgeX = roofAxis - ridgeW / 2;
    var ridgeY = roofTop + Math.max(5, Math.round(roofH * ST.pitch));
    var eaveHalf = W / 2 + ST.eave;
    var ridgeHalf = ridgeW / 2;
    var ry, frac, half, x0, w, sx, prow, courseTone, seamStep, salt, axisX, edgeShade;

    // Ombra morbida e foundation: ancorano la massa al terreno.
    fr(L + 3, Bt - 1, W + 4, 3, 'rgba(10,16,17,0.24)');
    fr(L, Bt - 3, W, 3, F.foundation);

    // Falda posteriore: corsi più radi e bordi netti, senza banding 1px.
    for (ry = roofTop; ry < ridgeY; ry++) {
      frac = (ridgeY - ry) / Math.max(1, ridgeY - roofTop);
      half = ridgeHalf + frac * 5;
      x0 = roofAxis - half; w = half * 2;
      fr(x0, ry, w, 1, RT.back);
      if ((ry - roofTop) % ST.course === ST.course - 1) {
        fr(x0 + 1, ry, w - 2, 1, RT.seam);
      }
      fr(x0, ry, 1, 1, RT.outline);
      fr(x0 + w - 1, ry, 1, 1, RT.outline);
    }

    // Falda anteriore. Ogni copertura ha una grammatica propria.
    for (ry = ridgeY; ry < roofBot; ry++) {
      frac = (ry - ridgeY) / Math.max(1, roofBot - ridgeY);
      half = ridgeHalf + frac * (eaveHalf - ridgeHalf);
      axisX = roofAxis + frac * (cxr - roofAxis);
      x0 = axisX - half; w = half * 2;
      prow = (ry - ridgeY) % ST.course;
      courseTone = ((ST.roof === 'cedar' || ST.roof === 'shake') &&
        (((ry - ridgeY) / ST.course | 0) & 1) ? RT.front2 : RT.front);
      fr(x0, ry, w, 1, courseTone);

      if (prow === 0 && ((((ry - ridgeY) / ST.course) | 0) & 1) === 0) {
        fr(x0 + 3, ry, Math.max(1, w * 0.58), 1, RT.glint);
      }
      if (prow === ST.course - 1 && ST.roof !== 'metal') {
        fr(x0 + 4, ry, Math.max(3, w * 0.27), 1, RT.seam);
        fr(x0 + w * 0.54, ry, Math.max(3, w * 0.28), 1, RT.seam);
      }
      if (ST.roof === 'metal') {
        seamStep = ST.flat ? 14 : 12;
        for (sx = x0 + 6; sx < x0 + w - 4; sx += seamStep) {
          fr(sx, ry, 1, 1, RT.seam);
          if (prow === 0 && !ST.flat) fr(sx + 1, ry, 1, 1, RT.glint);
        }
      } else {
        seamStep = ST.roof === 'shake' ? 11 : (ST.roof === 'tar' ? 15 : 10);
        salt = ((ry - ridgeY) / ST.course | 0) & 1 ? 3 : 0;
        for (sx = x0 + 4 + salt; sx < x0 + w - 3; sx += seamStep) {
          if (prow === ST.course - 1 && hash(sx | 0, ry, by) < 76) fr(sx, ry, 2, 1, RT.outline);
        }
        if (ST.roof === 'shake' || ST.roof === 'cedar') {
          for (sx = x0 + 9; sx < x0 + w - 7; sx += 19) {
            if (prow === 2 && hash(sx | 0, ry, bx + by) < 72) fr(sx, ry, 5, 2, RT.front2);
          }
        }
      }

      // Luce NW: fianco ovest sottile, fianco est più pesante e continuo.
      edgeShade = Math.max(4, Math.round(w * 0.045));
      fr(x0 + 1, ry, 1, 1, RT.glint);
      fr(x0 + w - edgeShade - 1, ry, edgeShade, 1, RT.back);
      fr(x0, ry, 1, 1, RT.outline);
      fr(x0 + w - 1, ry, 1, 1, RT.outline);
    }

    // Usura in masse leggibili: niente rumore uniforme o scacchiera procedurale.
    var wearY = ridgeY + Math.max(6, Math.round((roofBot - ridgeY) * 0.42));
    if (ST.wear === 'moss') {
      var moss = rc.ch === '4' ? '#304d35' : '#63704d';
      fr(L + Math.round(W * 0.10), wearY, Math.round(W * 0.18), 3, moss);
      fr(L + Math.round(W * 0.14), wearY - 2, Math.round(W * 0.10), 2, moss);
      fr(L + Math.round(W * 0.58), roofBot - 9, Math.round(W * 0.17), 2, moss);
    } else if (ST.wear === 'patch') {
      fr(L + Math.round(W * 0.18), wearY - 2, Math.round(W * 0.20), 5, RT.back);
      fr(L + Math.round(W * 0.20), wearY - 1, Math.round(W * 0.16), 1, RT.front2);
      fr(L + Math.round(W * 0.67), roofBot - 11, Math.round(W * 0.12), 3, RT.seam);
    } else if (ST.wear === 'flashing') {
      fr(L + Math.round(W * 0.62), roofBot - 11, Math.round(W * 0.17), 2, RT.ridge);
      fr(L + Math.round(W * 0.64), roofBot - 9, Math.round(W * 0.13), 1, RT.glint);
    }

    // Il volume clinico è basso e quasi piano: parapetti separano nettamente
    // l'ospedale dai cinque tetti a falda.
    if (ST.flat) {
      fr(L - 1, roofTop - 2, W + 2, 4, RT.outline);
      fr(L + 1, roofTop - 1, W - 2, 2, RT.ridge);
      fr(L - ST.eave, roofBot - 5, W + ST.eave * 2, 5, RT.outline);
      fr(L - ST.eave + 2, roofBot - 4, W + ST.eave * 2 - 4, 2, RT.front2);
    }

    // Colmo, gocciolatoio, fascia e soffitto hanno quattro piani leggibili.
    fr(ridgeX - 1, ridgeY - 2, ridgeW + 2, 1, RT.outline);
    fr(ridgeX, ridgeY - 1, ridgeW, 2, RT.ridge);
    for (sx = ridgeX + 3; sx < ridgeX + ridgeW - 4; sx += 10) {
      fr(sx, ridgeY - 1, Math.min(6, ridgeX + ridgeW - sx - 2), 1, RT.glint);
    }
    fr(ridgeX, ridgeY + 1, ridgeW, 1, RT.outline);
    fr(cxr - eaveHalf, roofBot - 2, eaveHalf * 2, 2, RT.outline);
    fr(cxr - eaveHalf + 2, roofBot, eaveHalf * 2 - 4, 2, F.dark);
    fr(L - 1, roofBot + 1, W + 2, 1, F.trim);

    // Tetto incrociato sopra l'ingresso: dimensione e profondità cambiano per
    // distretto, casa Palmer e Great Northern; è un volume, non un'icona.
    if (ST.crossGable) {
      var gableCenter = cxr + (rc.ch === '3' ? -W * 0.08 : (rc.ch === '4' ? W * 0.04 : 0));
      var gableTop = ridgeY + (rc.ch === '4' ? 0 : 3);
      var gableBot = roofBot + (rc.ch === '4' ? 5 : 3);
      var gableHalf = ST.crossGable / 2;
      var gy, gf, gh, gx;
      for (gy = gableTop; gy < gableBot; gy++) {
        gf = (gy - gableTop) / Math.max(1, gableBot - gableTop);
        gh = 2 + gf * (gableHalf - 2);
        gx = gableCenter - gh;
        fr(gx, gy, gh, 1, RT.front2);
        fr(gableCenter, gy, gh, 1, RT.front);
        fr(gx, gy, 1, 1, RT.glint);
        fr(gableCenter + gh - 1, gy, 2, 1, RT.back);
      }
      fr(gableCenter - 1, gableTop, 2, gableBot - gableTop, RT.ridge);
      fr(gableCenter - gableHalf, gableBot - 2, gableHalf * 2, 2, RT.outline);
      fr(gableCenter - gableHalf + 2, gableBot, gableHalf * 2 - 4, 2, F.dark);
    }

    // Camini e sfiati si appoggiano alla falda con ombra di contatto.
    if (ST.chimney) {
      var chimX = L + Math.round(W * (rc.ch === '4' ? 0.76 : 0.72));
      var chimY = ridgeY + Math.max(5, Math.round((roofBot - ridgeY) * 0.27));
      fr(chimX - 1, chimY + 5, 7, 2, 'rgba(0,0,0,0.25)');
      fr(chimX, chimY, 5, 7, F.dark);
      fr(chimX + 1, chimY, 3, 6, F.wall2);
      fr(chimX - 1, chimY - 1, 7, 2, RT.outline);
      fr(chimX, chimY - 1, 5, 1, F.light);
    }
    if (ST.vent) {
      var ventX = L + Math.round(W * 0.70), ventY = ridgeY + 5;
      fr(ventX, ventY + 1, 7, 3, RT.outline);
      fr(ventX + 1, ventY, 5, 2, F.trim);
      fr(ventX + 2, ventY - 1, 3, 1, F.light);
    }

    // Abbaino: silhouette e finestra sono leggibili anche a scala nativa.
    if (ST.dormer && roofBot - ridgeY > 14) {
      var dormX = cxr - (ST.lodge ? 9 : 6);
      var dormY = ridgeY + Math.max(5, Math.round((roofBot - ridgeY) * 0.35));
      var dormW = ST.lodge ? 18 : 12;
      fr(dormX - 2, dormY + 7, dormW + 4, 2, 'rgba(0,0,0,0.30)');
      for (var dy = 0; dy < 4; dy++) {
        fr(dormX + 2 - dy, dormY + dy, dormW - 4 + dy * 2, 1, RT.outline);
        if (dy > 0) fr(dormX + 3 - dy, dormY + dy, dormW - 6 + dy * 2, 1, RT.front2);
      }
      fr(dormX, dormY + 4, dormW, 6, F.trim);
      fr(dormX + 2, dormY + 5, dormW - 4, 4, F.glass);
      fr(dormX + 2, dormY + 5, dormW - 4, 1, F.glassL);
      fr(dormX + Math.round(dormW / 2), dormY + 5, 1, 4, F.dark);
    }

    // Facciata: il pattern descrive il materiale, non rumore casuale.
    fr(L, facTop, W, FAC_H, F.wall);
    fr(L, facTop, W, 3, 'rgba(16,22,24,0.27)');

    var py, px, courseN;
    if (ST.wall === 'brick') {
      for (py = facTop + 4; py < Bt - 2; py += 5) {
        fr(L + 1, py, W - 2, 1, F.dark);
        courseN = (py - facTop) / 5 | 0;
        for (px = L + (courseN & 1 ? 6 : 11); px < Rr - 3; px += 12) {
          fr(px, py - 4, 1, 4, F.wall2);
        }
      }
    } else if (ST.wall === 'clapboard') {
      for (py = facTop + 4; py < Bt - 2; py += 4) {
        fr(L + 1, py, W - 2, 1, F.dark);
        fr(L + 2, py - 1, W - 4, 1, F.light);
      }
    } else if (ST.wall === 'log') {
      for (py = facTop + 4; py < Bt - 2; py += 5) {
        fr(L + 2, py, W - 4, 2, F.dark);
        fr(L + 3, py, W - 6, 1, F.wall2);
        fr(L - 1, py - 1, 3, 4, F.dark);
        fr(Rr - 2, py - 1, 3, 4, F.dark);
      }
    } else if (ST.wall === 'board') {
      for (px = L + 5; px < Rr - 2; px += 7) {
        fr(px, facTop + 2, 1, FAC_H - 4, F.dark);
        fr(px + 1, facTop + 3, 1, FAC_H - 6, F.wall2);
      }
    } else {
      fr(L + 2, facTop + 5, W - 4, 1, F.light);
      for (px = L + 11; px < Rr - 5; px += 17) {
        if (hash(px, by, 5) < 150) fr(px, facTop + 10, 2, 1, F.wall2);
      }
    }
    fr(Rr - Math.max(8, Math.round(W * 0.09)), facTop + 2,
      Math.max(7, Math.round(W * 0.09)), FAC_H - 4, 'rgba(0,0,0,0.13)');

    // Corpi aggettanti: cambiano il contorno della facciata senza modificare
    // collisioni o footprint ASCII.
    if (ST.civicBay) {
      fr(cxr - 17, facTop - 2, 34, FAC_H + 4, F.dark);
      fr(cxr - 15, facTop - 1, 29, FAC_H + 3, F.wall2);
      fr(cxr - 15, facTop, 2, FAC_H + 1, F.light);
      fr(cxr + 12, facTop, 2, FAC_H + 1, F.dark);
    } else if (ST.sideBay) {
      fr(Rr - 34, facTop - 1, 29, FAC_H + 3, F.dark);
      fr(Rr - 32, facTop, 25, FAC_H + 2, F.wall2);
      fr(Rr - 32, facTop, 2, FAC_H, F.light);
    } else if (ST.lodgeBay) {
      fr(cxr - 22, facTop - 3, 44, FAC_H + 6, F.dark);
      fr(cxr - 19, facTop - 2, 37, FAC_H + 5, F.wall2);
      fr(cxr - 18, facTop - 1, 3, FAC_H + 2, F.light);
      fr(cxr + 15, facTop - 1, 3, FAC_H + 2, F.dark);
    } else if (ST.clinicBay) {
      fr(cxr - 19, facTop - 1, 38, FAC_H + 3, F.dark);
      fr(cxr - 17, facTop, 34, FAC_H + 2, F.wall2);
      fr(cxr - 17, facTop, 3, FAC_H, F.light);
      fr(cxr + 14, facTop, 3, FAC_H, F.dark);
    } else if (ST.sideWing) {
      fr(L - 3, facTop + 3, 39, FAC_H, F.dark);
      fr(L - 1, facTop + 4, 35, FAC_H - 1, F.wall2);
      fr(L - 1, facTop + 4, 2, FAC_H - 2, F.light);
    }

    // Diner e Roadhouse ricevono un lungo volume di pensilina: basso e
    // orizzontale nel primo, disassato e pesante nel secondo.
    if (ST.canopy) {
      var canX = rc.ch === '6' ? L - 5 : L - 3;
      var canW = rc.ch === '6' ? Math.round(W * 0.72) : W + 6;
      var canY = facTop + (rc.ch === '6' ? 5 : 4);
      fr(canX, canY + 3, canW, 3, 'rgba(0,0,0,0.34)');
      fr(canX, canY, canW, 2, RT.outline);
      fr(canX + 2, canY + 1, canW - 4, 2, F.accent);
      fr(canX + 3, canY + 3, canW - 6, 1, F.signL);
      fr(canX + 4, canY + 3, 2, FAC_H - 5, F.dark);
      fr(canX + canW - 6, canY + 3, 2, FAC_H - 5, F.dark);
    }

    // Basamento, cornice e montanti chiudono la facciata con spessori credibili.
    fr(L, Bt - 3, W, 1, F.dark);
    fr(L, Bt - 2, W, 2, F.foundation);
    fr(L, facTop, 2, FAC_H, F.trim);
    fr(Rr - 2, facTop, 2, FAC_H, F.dark);
    fr(L + 2, facTop + 2, 1, FAC_H - 4, F.light);
    fr(Rr - 3, facTop + 2, 1, FAC_H - 4, F.wall2);

    // Finestre profonde: telaio, guarnizione, vetro, riflesso diagonale e davanzale.
    var winW = ST.clinic ? 8 : (rc.ch === '2' ? 11 : 9);
    var winH = rc.ch === '3' ? 8 : 7;
    var winY = facTop + (ST.marquee || ST.neon ? 8 : 5);
    var windowLayouts = {
      '1': [0.10, 0.27, 0.73, 0.90],
      '2': [0.08, 0.20, 0.34, 0.66, 0.80, 0.92],
      '3': [0.12, 0.34, 0.72, 0.88],
      '4': [0.08, 0.19, 0.75, 0.88],
      '5': [0.08, 0.21, 0.36, 0.65, 0.80, 0.92],
      '6': [0.13, 0.32, 0.70, 0.88]
    };
    var winLayout = windowLayouts[rc.ch], wi, wx, lit, blocked, dk, doorCenter;
    for (wi = 0; wi < winLayout.length; wi++) {
      wx = L + Math.round(W * winLayout[wi] - winW / 2);
      blocked = false;
      for (dk = 0; dk < rc.doors.length; dk++) {
        doorCenter = rc.doors[dk].x * TILE + TILE / 2;
        if (Math.abs((wx + winW / 2) - doorCenter) < winW + 7) blocked = true;
      }
      if (blocked) continue;
      lit = hash(wi, by, +rc.ch) < (rc.ch === '6' ? 84 : 40);
      // Cavità 2px verso est/sud, architrave sporgente e davanzale spesso.
      fr(wx - 2, winY - 2, winW + 5, winH + 5, F.dark);
      fr(wx - 3, winY - 3, winW + 5, 2, F.light);
      fr(wx - 2, winY - 1, 2, winH + 2, F.trim);
      fr(wx + winW, winY - 1, 2, winH + 3, F.dark);
      fr(wx - 1, winY - 1, winW + 1, winH + 1, F.trim);
      fr(wx, winY, winW, winH, lit ? F.glassWarm : F.glass);
      fr(wx + 1, winY, winW - 2, 1, F.glassL);
      fr(wx + 1, winY + 1, 2, 1, F.glassL);
      fr(wx + Math.round(winW / 2), winY, 1, winH, F.dark);
      fr(wx, winY + Math.round(winH / 2), winW, 1, F.dark);
      fr(wx - 3, winY + winH + 1, winW + 6, 2, F.dark);
      fr(wx - 2, winY + winH + 1, winW + 4, 1, F.light);
      if (ST.awning) {
        fr(wx - 2, winY - 4, winW + 4, 2, F.accent);
        fr(wx - 1, winY - 2, winW + 2, 1, F.signL);
        for (px = wx; px < wx + winW; px += 4) fr(px, winY - 4, 2, 2, F.signL);
      }
    }

    // Insegne integrate nell'architettura, con gerarchia diversa per funzione.
    var mid = Math.round(cxr);
    if (ST.marquee) {
      fr(L + 6, facTop + 2, W - 12, 5, F.dark);
      fr(L + 7, facTop + 2, W - 14, 4, F.sign);
      fr(L + 9, facTop + 3, W - 18, 1, F.signL);
      fr(mid - 12, facTop + 3, 4, 2, F.signL);
      fr(mid + 8, facTop + 3, 4, 2, F.signL);
    } else if (ST.neon) {
      fr(L + 7, facTop + 2, W - 14, 5, F.sign);
      fr(L + 9, facTop + 3, W - 18, 1, F.signL);
      fr(mid - 9, facTop + 4, 18, 1, F.accent);
      fr(mid + 5, facTop + 1, 1, 5, F.signL);
      fr(mid + 6, facTop + 1, 3, 1, F.signL);
    } else if (ST.clinic) {
      fr(mid - 5, facTop + 2, 10, 7, F.sign);
      iconCross(mid - 3, facTop + 2, F.signL);
    } else if (rc.ch === '1') {
      fr(mid - 6, facTop + 2, 12, 7, F.sign);
      iconStar(mid - 2, facTop + 3, F.accent);
    } else if (ST.lodge) {
      fr(mid - 9, facTop + 2, 18, 7, F.sign);
      iconPine(mid - 3, facTop + 2, F.signL);
    }

    // Porte con vano, anta materiale, pannelli, traversa vetrata e portico.
    var d, dx, doorX, doorW = 11, doorH = 13, doorTop, doorBot;
    for (d = 0; d < rc.doors.length; d++) {
      dx = rc.doors[d].x;
      doorX = dx * TILE + Math.round((TILE - doorW) / 2);
      doorBot = Bt - 1; doorTop = doorBot - doorH;
      fr(doorX - 2, doorTop - 2, doorW + 4, doorH + 3, RT.outline);
      fr(doorX - 1, doorTop - 1, doorW + 2, doorH + 2, F.trim);
      fr(doorX, doorTop, doorW, doorH, F.door);
      fr(doorX + 1, doorTop + 1, doorW - 2, 3, F.glass);
      fr(doorX + 2, doorTop + 1, doorW - 4, 1, F.glassL);
      fr(doorX + 2, doorTop + 6, doorW - 4, 1, F.dark);
      fr(doorX + 2, doorTop + 9, doorW - 4, 2, F.wall2);
      fr(doorX + doorW - 3, doorTop + 7, 1, 2, F.accent);
      fr(doorX - 3, Bt - 2, doorW + 6, 2, F.light);
      fr(doorX - 4, Bt, doorW + 8, 2, F.foundation);

      if (ST.porch) {
        fr(doorX - 5, doorTop - 5, doorW + 10, 2, RT.outline);
        fr(doorX - 4, doorTop - 4, doorW + 8, 2, RT.front2);
        fr(doorX - 4, doorTop - 2, doorW + 8, 1, F.dark);
        fr(doorX - 3, doorTop - 2, 2, doorH + 2, F.trim);
        fr(doorX + doorW + 1, doorTop - 2, 2, doorH + 2, F.dark);
      } else {
        fr(doorX - 2, doorTop - 3, doorW + 4, 2, F.light);
        fr(doorX - 1, doorTop - 1, doorW + 2, 1, F.dark);
      }
    }

    if (ST.gutter) {
      var gutterX = L - ST.eave;
      var gutterW = W + ST.eave * 2;
      var pipeX = (rc.ch === '2' || rc.ch === '5') ? Rr - 5 : L + 3;
      fr(gutterX, roofBot - 2, gutterW, 3, RT.outline);
      fr(gutterX + 2, roofBot - 2, gutterW - 4, 1, RT.ridge);
      fr(gutterX + 3, roofBot + 1, gutterW - 6, 2, 'rgba(0,0,0,0.38)');
      fr(gutterX + 12, roofBot, 2, 3, F.dark);
      fr(gutterX + gutterW - 14, roofBot, 2, 3, F.dark);
      fr(pipeX, roofBot, 3, FAC_H - 2, F.dark);
      fr(pipeX, roofBot + 1, 1, FAC_H - 4, F.light);
      fr(pipeX - 2, Bt - 4, 5, 2, F.dark);
    }

    // Lame finali di luce/ombra: sole NW, volume coerente con il renderer 3D.
    fr(L, facTop + 2, 1, FAC_H - 3, F.light);
    fr(Rr - 1, facTop + 2, 1, FAC_H - 1, 'rgba(0,0,0,0.30)');
    fr(L + 2, Bt - 1, W - 4, 1, 'rgba(0,0,0,0.32)');
  }

  S.drawStructures = function (g, map, cx, cy, opts) {
    if (!map || !map.rows) return;
    var rects = rectCache[map.id];
    if (!rects) rects = rectCache[map.id] = scanRects(map);
    if (!rects.length) return; // interni: nessun edificio -> uscita rapida
    for (var i = 0; i < rects.length; i++) drawHouse(g, rects[i], cx, cy);
  };
})();
