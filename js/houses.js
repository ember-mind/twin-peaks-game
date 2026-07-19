/* houses.js — edifici in proiezione TOP-DOWN 3D obliqua stile Pokémon B/W.
   Espone GAME.sprites.drawStructures(g, map, cx, cy, opts).
   Scansiona la mappa una volta (cache per map.id) trovando i rettangoli dei
   caratteri '1'..'4' (le porte 'D' incassate nel muro contano nel footprint),
   poi disegna sopra i tile piatti una casa vista dall'alto-fronte: il piano del
   TETTO a padiglione domina la scena (~70%), con colmo, falda posteriore in
   ombra e falda anteriore illuminata a tegole; sotto, una FACCIATA bassa (16px)
   a tavole con porta incassata e finestre. Solo fillRect. rgba per le ombre.
   Deterministico (hash da bx,by). ES5. */
(function () {
  var G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  var S = G.GAME.sprites = G.GAME.sprites || {};

  var TILE = 16;

  // palette per carattere edificio (identità Twin Peaks) — ri-chiavata:
  //   roof: { front (falda illuminata), back (falda in ombra), ridge (colmo),
  //           outline (silhouette), shingle (riga tegole) }
  //   fac:  { wall, dark, light, glass, glassL }  (+ sign/signL per la '2')
  var PAL = {
    // distretto dello sceriffo: tetto grigio-blu, muri sabbia
    '1': { roof: { front: '#7c94b0', back: '#43566e', ridge: '#aec2da', outline: '#2c3a4c', shingle: '#67809c' },
           fac:  { wall: '#c8a878', dark: '#a88858', light: '#dcc094', glass: '#26323e', glassL: '#6a86a2' } },
    // Double R Diner: tetto BLU (firma B/W), muri caldi, insegna rossa sulla facciata
    '2': { roof: { front: '#6a98d0', back: '#345f94', ridge: '#a6c8ec', outline: '#22395c', shingle: '#4f80ba' },
           fac:  { wall: '#b08858', dark: '#8a6238', light: '#c8a070', glass: '#22303e', glassL: '#5a7a9a',
                   sign: '#a81828', signL: '#e8d0a0' } },
    // casa Palmer: tetto marrone caldo, muri crema
    '3': { roof: { front: '#a87c5c', back: '#5e4230', ridge: '#c8a888', outline: '#3a2818', shingle: '#8a6248' },
           fac:  { wall: '#d0b888', dark: '#a88a58', light: '#e4d0a4', glass: '#2a2620', glassL: '#8a7c66' } },
    // Great Northern: tetto verde pino scuro, legname scuro
    '4': { roof: { front: '#52704e', back: '#284030', ridge: '#82a074', outline: '#152417', shingle: '#3a5440' },
           fac:  { wall: '#6e5230', dark: '#4e3a20', light: '#8a6a3e', glass: '#20241e', glassL: '#5a6a52' } },
    // ospedale: clinica bianco-grigia, tetto blu-grigio
    '5': { roof: { front: '#93a5b5', back: '#5a6a78', ridge: '#c5d1db', outline: '#33404a', shingle: '#748a9a' },
           fac:  { wall: '#e6e6e0', dark: '#b8b8b0', light: '#f4f4ee', glass: '#26323e', glassL: '#6a86a2' } },
    // roadhouse: legno scuro, insegna rossa sulla facciata
    '6': { roof: { front: '#4a3a2e', back: '#241a12', ridge: '#6a5646', outline: '#140e0a', shingle: '#382a20' },
           fac:  { wall: '#5a4636', dark: '#3a2e26', light: '#7a6248', glass: '#1c1410', glassL: '#4a3a2e',
                   sign: '#a81828', signL: '#e8d0a0' } }
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
    var R = P.roof, F = P.fac;
    var bx = rc.bx, by = rc.by, bw = rc.bw, bh = rc.bh;
    var L = bx * TILE, Rr = (bx + bw) * TILE;     // bordi mondo sinistro/destro
    var Tp = by * TILE, Bt = (by + bh) * TILE;    // bordi mondo alto/basso
    var W = Rr - L;

    // rettangolo in coordinate mondo, offset di camera baked-in
    function fr(x, y, w, h, col) {
      if (w <= 0 || h <= 0) return;
      g.fillStyle = col; g.fillRect(Math.round(x) - cx, Math.round(y) - cy, Math.round(w), Math.round(h));
    }

    var cxr = L + W / 2;                            // asse verticale dell'edificio

    /* ============================================================
       1. GEOMETRIA — la facciata occupa SOLO i 16px in fondo; il
          tetto (piano dominante) va da Tp-10 giù fino a Bt-16.
       ============================================================ */
    var FAC_H = 16;
    var facTop = Bt - FAC_H;                        // cima della facciata
    var roofTop = Tp - 10;                          // il tetto sale 10px sopra il footprint
    var roofBot = facTop;                           // la gronda poggia sulla cima facciata
    var roofH = roofBot - roofTop;                  // altezza del piano tetto (~Hh-6)

    var ridgeInset = Math.round(W * 0.22);
    var ridgeW = W - 2 * ridgeInset;
    var ridgeX = L + ridgeInset;
    var ridgeY = roofTop + Math.round(roofH * 0.30);

    var eaveHalf = W / 2 + 2;                        // sporto di gronda: 2px oltre L e Rr
    var ridgeHalf = ridgeW / 2;

    var ry, frac, half, x0, w, sx, prow, courseTone, sheenTone;

    /* ---- falda POSTERIORE (dietro il colmo, in ombra): dal bordo alto del
            tetto fino al colmo; larga poco, si allarga (ridgeW → ridgeW+8)
            verso l'alto. Due tinte scure per dare spessore di tegole. ---- */
    for (ry = roofTop; ry < ridgeY; ry++) {
      frac = (ridgeY - ry) / (ridgeY - roofTop);    // 1 in cima, 0 al colmo
      half = ridgeHalf + frac * 4;                  // +8px totali in cima
      x0 = cxr - half; w = half * 2;
      fr(x0, ry, w, 1, R.back);                                        // corpo in ombra
      fr(x0 + 1, ry, w - 2, 1, (ry - roofTop) % 3 === 0 ? R.outline : R.back); // corsi
      fr(x0, ry, 1, 1, R.outline);                  // silhouette
      fr(x0 + w - 1, ry, 1, 1, R.outline);
    }

    /* ---- falda ANTERIORE (verso lo spettatore, illuminata): dal colmo alla
            gronda; trapezio che si ALLARGA (ridgeW → eave width). Corsi di
            tegole da 3px: corpo, bordo inferiore in ombra, spigolo superiore
            illuminato — tre tinte impilate (look shingle B/W). ---- */
    for (ry = ridgeY; ry < roofBot; ry++) {
      frac = (ry - ridgeY) / (roofBot - ridgeY);    // 0 al colmo, 1 alla gronda
      half = ridgeHalf + frac * (eaveHalf - ridgeHalf);
      x0 = cxr - half; w = half * 2;
      prow = (ry - ridgeY) % 3;                      // posizione nel corso da 3px
      courseTone = (prow === 2) ? R.shingle : R.front;   // fondo del corso in ombra
      sheenTone  = (prow === 0) ? R.ridge : R.front;     // spigolo superiore illuminato
      fr(x0, ry, w, 1, R.front);                    // 1. corpo tegola (piena larghezza)
      fr(x0 + 1, ry, w - 2, 1, courseTone);         // 2. bordo inferiore del corso
      fr(x0 + 2, ry, w - 4, 1, sheenTone);          // 3. spigolo superiore illuminato
      // fughe verticali sottili, sfalsate riga per riga (effetto mattone)
      for (sx = x0 + ((ry & 1) ? 4 : 0) + 3; sx < x0 + w - 3; sx += 8) fr(sx, ry, 1, 1, R.shingle);
      // triangoli di hip: 2-3px più scuri ai bordi obliqui (facce laterali inclinate)
      fr(x0 + 1, ry, 2, 1, R.back);
      fr(x0 + w - 3, ry, 2, 1, R.back);
      // silhouette 1px
      fr(x0, ry, 1, 1, R.outline);
      fr(x0 + w - 1, ry, 1, 1, R.outline);
    }

    // gronda scura in fondo al tetto (sporge oltre la facciata)
    fr(cxr - eaveHalf, roofBot - 1, eaveHalf * 2, 1, R.outline);

    // COLMO: banda di luce 2px con contorno scuro 1px
    fr(ridgeX, ridgeY - 1, ridgeW, 2, R.ridge);
    fr(ridgeX, ridgeY + 1, ridgeW, 1, R.outline);
    // contorno del bordo alto del tetto
    fr(cxr - (ridgeHalf + 4), roofTop, (ridgeHalf + 4) * 2, 1, R.outline);

    /* ============================================================
       2. FACCIATA (muro sud, basso, 16px) — tavole + montanti.
       ============================================================ */
    fr(L, facTop, W, FAC_H, F.wall);
    // ombra di gronda proiettata sulla cima della facciata (2px)
    fr(L, facTop, W, 2, 'rgba(0,0,0,0.30)');
    // due assi orizzontali
    fr(L, facTop + 6, W, 1, F.dark);
    fr(L, facTop + 11, W, 1, F.dark);
    // montanti d'angolo 1px
    fr(L, facTop, 1, FAC_H, F.dark);
    fr(Rr - 1, facTop, 1, FAC_H, F.dark);

    // insegna rossa (solo Double R): banda 2px sulla facciata, sopra la porta
    if (F.sign) {
      var sgY = facTop + 3, sgX = L + 4, sgW = W - 8;
      fr(sgX, sgY, sgW, 2, F.sign);
      var mid = L + Math.round(W / 2);
      fr(mid - 6, sgY, 1, 2, F.signL);              // R
      fr(mid + 5, sgY, 1, 2, F.signL);              // R
    }

    // colonne con porta (da saltare per le finestre)
    function isDoorCol(tcol) {
      for (var k = 0; k < rc.doors.length; k++) if (rc.doors[k].x === tcol) return true;
      return false;
    }

    // ---- finestre: 7×6 vetro scuro, ~una ogni 2 tile, centrate in verticale ----
    var winW = 7, winH = 6, winY = facTop + Math.round((FAC_H - winH) / 2), tcol, wx;
    for (tcol = bx + 1; tcol <= bx + bw - 2; tcol += 2) {
      if (isDoorCol(tcol)) continue;
      wx = tcol * TILE + Math.round((TILE - winW) / 2);
      fr(wx - 1, winY - 1, winW + 2, winH + 2, F.dark);   // telaio
      fr(wx, winY, winW, winH, F.glass);                  // vetro scuro
      fr(wx, winY, winW, 1, F.glassL);                    // riflesso del cielo 1px
      fr(wx + Math.round(winW / 2), winY, 1, winH, F.dark); // montante
    }

    // ---- ombra al suolo lato SUD ed EST (sole da NW), dentro il footprint ----
    fr(L, Bt - 1, W, 1, 'rgba(0,0,0,0.30)');       // striscia sud
    fr(Rr - 1, facTop, 1, FAC_H, 'rgba(0,0,0,0.22)'); // striscia est

    // ---- porte incassate (11×10) con architrave, scalino, pomello ----
    var d, dx, doorX, doorW = 10, doorH = 11, doorTop, doorBot;
    for (d = 0; d < rc.doors.length; d++) {
      dx = rc.doors[d].x;
      doorX = dx * TILE + Math.round((TILE - doorW) / 2);
      doorBot = Bt - 1; doorTop = doorBot - doorH;    // dentro i 16px di facciata
      fr(doorX - 1, doorTop - 1, doorW + 2, doorH + 1, R.outline);  // telaio scuro
      fr(doorX, doorTop, doorW, doorH, '#241610');                 // vano incassato
      fr(doorX, doorTop, doorW, 2, '#140c08');                     // ombra interna alta
      fr(doorX - 1, doorTop - 1, doorW + 2, 1, F.light);           // architrave illuminato
      fr(doorX + doorW - 3, doorTop + 6, 1, 2, '#d8b060');         // pomello
      fr(doorX - 1, Bt - 1, doorW + 2, 1, F.light);               // scalino
    }
  }

  S.drawStructures = function (g, map, cx, cy, opts) {
    if (!map || !map.rows) return;
    var rects = rectCache[map.id];
    if (!rects) rects = rectCache[map.id] = scanRects(map);
    if (!rects.length) return; // interni: nessun edificio -> uscita rapida
    for (var i = 0; i < rects.length; i++) drawHouse(g, rects[i], cx, cy);
  };
})();
