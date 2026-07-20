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

  // lettura sicura del carattere di una cella vicina; ' ' se fuori mappa o senza mappa
  function cellAt(flags, cx, cy) {
    if (!flags.map || !flags.map.rows) return ' ';
    var rows = flags.map.rows;
    if (cy < 0 || cy >= rows.length) return ' ';
    var row = rows[cy];
    if (cx < 0 || cx >= row.length) return ' ';
    return row.charAt(cx);
  }

  // erba mottled B/W: base + chiazze sabbiose + macchie scure + ciuffi, deterministica via h
  // opts.tuft => cluster di ciuffi extra (erba alta); opts.dapple => macchioline chiare rade
  function grass(ctx, x, y, base, light, dark, tuft, h, opts) {
    opts = opts || {};
    R(ctx, x, y, 16, 16, base);
    R(ctx, x + (h % 12), y + ((h >> 2) % 12), 3, 2, light);
    R(ctx, x + ((h >> 3) % 13), y + ((h >> 1) % 13), 2, 2, light);
    if (h % 2 === 0) R(ctx, x + ((h >> 4) % 14), y + ((h >> 2) % 14), 1, 1, light);
    R(ctx, x + ((h >> 1) % 13), y + ((h >> 4) % 13), 2, 1, dark);
    if (h % 3 === 0) R(ctx, x + ((h >> 2) % 14), y + ((h >> 5) % 14), 1, 1, dark);
    var bx = x + ((h >> 3) % 13) + 1, by = y + ((h >> 1) % 12) + 2;
    R(ctx, bx, by, 1, 2, tuft);
    R(ctx, bx + 1, by + 1, 1, 1, tuft);
    if (h % 5 === 0) R(ctx, x + ((h >> 4) % 13) + 1, y + ((h >> 2) % 12) + 2, 1, 2, tuft);
    if (opts.tuft) { // erba alta: ciuffo denso extra, deterministico
      var cx = x + ((h >> 5) % 12) + 1, cy = y + ((h >> 3) % 11) + 3;
      R(ctx, cx, cy, 1, 3, tuft);
      R(ctx, cx + 1, cy + 1, 1, 2, tuft);
      R(ctx, cx - 1, cy + 2, 1, 1, tuft);
    }
    if (opts.dapple) { // macchie di luce fra gli alberi (woods)
      R(ctx, x + ((h >> 2) % 13) + 1, y + ((h >> 5) % 13) + 1, 2, 1, opts.dapple);
      if (h % 4 === 0) R(ctx, x + ((h >> 4) % 14), y + ((h >> 1) % 14), 1, 1, opts.dapple);
    }
  }

  // colore erba del vicino, per bordi organici di sentiero/strada; null se non è erba
  function grassColorOf(ch) { return ch === 'g' ? '#35553a' : (ch === '.' ? '#7a9e58' : null); }

  // bordo dithered 2px verso i lati erbosi: pixel alternati di erba sopra il path
  function organicEdge(ctx, flags, tx, ty, x, y) {
    var k, g;
    g = grassColorOf(cellAt(flags, tx, ty - 1));
    if (g) for (k = 0; k < 16; k++) R(ctx, x + k, y + (k % 2), 1, 1, g);
    g = grassColorOf(cellAt(flags, tx, ty + 1));
    if (g) for (k = 0; k < 16; k++) R(ctx, x + k, y + 15 - (k % 2), 1, 1, g);
    g = grassColorOf(cellAt(flags, tx - 1, ty));
    if (g) for (k = 0; k < 16; k++) R(ctx, x + (k % 2), y + k, 1, 1, g);
    g = grassColorOf(cellAt(flags, tx + 1, ty));
    if (g) for (k = 0; k < 16; k++) R(ctx, x + 15 - (k % 2), y + k, 1, 1, g);
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

  function floorWood(ctx, x, y) {
    R(ctx, x, y, 16, 16, '#b08650');
    R(ctx, x, y, 16, 1, '#c09a68');
    R(ctx, x, y + 5, 16, 1, '#96703c');
    R(ctx, x, y + 10, 16, 1, '#96703c');
    R(ctx, x, y + 15, 16, 1, '#8a6636');
    R(ctx, x + 7, y, 1, 5, '#96703c');
    R(ctx, x + 3, y + 6, 1, 4, '#96703c');
    R(ctx, x + 11, y + 11, 1, 5, '#96703c');
    R(ctx, x + 2, y + 2, 3, 1, '#a67c46');
    R(ctx, x + 9, y + 7, 3, 1, '#a67c46');
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
    var h = (tx * 31 + ty * 17) % 97;
    var i, j;
    switch (ch) {
      case '.':
        grass(ctx, x, y, '#7a9e58', '#9ab670', '#5e7e42', '#8aac68', h, { tuft: 1 });
        break;
      case 'g':
        grass(ctx, x, y, '#2f4d34', '#456249', '#233828', '#557555', h, { dapple: '#c0d078' });
        break;
      case 'r':
        R(ctx, x, y, 16, 16, '#a8a49a');
        R(ctx, x + (h % 14) + 1, y + ((h >> 3) % 14) + 1, 1, 1, '#928e84');
        if (h % 2 === 0) R(ctx, x + ((h >> 2) % 14) + 1, y + ((h >> 4) % 14) + 1, 1, 1, '#bcb8ac');
        if (h % 3 === 0) R(ctx, x + ((h >> 1) % 13) + 1, y + ((h >> 5) % 13) + 1, 2, 1, '#928e84');
        if (h % 5 === 0) R(ctx, x + ((h >> 2) % 12) + 2, y + ((h >> 3) % 12) + 2, 2, 2, '#8a867c');
        organicEdge(ctx, flags, tx, ty, x, y);
        break;
      case 'p':
        R(ctx, x, y, 16, 16, '#d8c090');
        R(ctx, x + (h % 14) + 1, y + ((h >> 3) % 14) + 1, 1, 1, '#c0a878');
        if (h % 3 === 0) R(ctx, x + ((h >> 2) % 13) + 1, y + ((h >> 4) % 13) + 1, 2, 1, '#c0a878');
        if (h % 4 === 0) R(ctx, x + ((h >> 1) % 12) + 2, y + ((h >> 5) % 12) + 2, 2, 2, '#b09060');
        if (h % 2 === 0) R(ctx, x + ((h >> 4) % 14) + 1, y + ((h >> 2) % 14) + 1, 1, 1, '#e4d0a4');
        organicEdge(ctx, flags, tx, ty, x, y);
        break;
      case '=': { // marciapiede: lastra di cemento chiaro, giunto centrale, cordolo verso la strada
        R(ctx, x, y, 16, 16, '#c8c4b8');
        R(ctx, x, y, 16, 1, '#d8d4c8');            // luce superiore
        R(ctx, x, y + 8, 16, 1, '#a8a498');        // giunto: divide la lastra in 2
        R(ctx, x + (h % 14) + 1, y + ((h >> 3) % 6) + 1, 1, 1, '#b4b0a4');
        if (h % 2 === 0) R(ctx, x + ((h >> 2) % 13) + 1, y + ((h >> 4) % 6) + 1, 1, 1, '#dcd8cc');
        if (h % 3 === 0) R(ctx, x + ((h >> 1) % 13) + 1, y + ((h >> 5) % 6) + 9, 1, 1, '#b8b4a8');
        if (cellAt(flags, tx, ty - 1) === 'r') R(ctx, x, y, 16, 1, '#88847a');      // cordolo verso la strada
        if (cellAt(flags, tx, ty + 1) === 'r') R(ctx, x, y + 15, 16, 1, '#88847a');
        if (cellAt(flags, tx - 1, ty) === 'r') R(ctx, x, y, 1, 16, '#88847a');
        if (cellAt(flags, tx + 1, ty) === 'r') R(ctx, x + 15, y, 1, 16, '#88847a');
        break;
      }
      case '-': { // strisce pedonali: base della strada + 3 barre bianco sporco, orientate secondo la strada
        R(ctx, x, y, 16, 16, '#a8a49a');
        R(ctx, x + (h % 14) + 1, y + ((h >> 3) % 14) + 1, 1, 1, '#928e84');
        if (h % 2 === 0) R(ctx, x + ((h >> 2) % 14) + 1, y + ((h >> 4) % 14) + 1, 1, 1, '#bcb8ac');
        var stripe = '#e8e4d8';
        var horiz = cellAt(flags, tx - 1, ty) === 'r' || cellAt(flags, tx + 1, ty) === 'r';
        for (i = 0; i < 3; i++) {
          if (horiz) { // strada orizzontale: barre verticali attraverso la carreggiata
            R(ctx, x + 1 + i * 5, y + 1, 3, 14, stripe);
            if ((h + i) % 4 === 0) R(ctx, x + 1 + i * 5 + (h % 3), y + 3 + ((h >> 2) % 8), 1, 1, '#a8a49a'); // usura
          } else { // strada verticale: barre orizzontali
            R(ctx, x + 1, y + 1 + i * 5, 14, 3, stripe);
            if ((h + i) % 4 === 0) R(ctx, x + 3 + ((h >> 2) % 8), y + 1 + i * 5 + (h % 3), 1, 1, '#a8a49a');
          }
        }
        break;
      }
      case ',': { // erba fiorita: stessa erba di '.' con 3-5 fiorellini deterministici
        grass(ctx, x, y, '#7a9e58', '#9ab670', '#5e7e42', '#8aac68', h, { tuft: 1 });
        var flowerColors = ['#ffffff', '#f0d048', '#f0a0c0'];
        var nFlowers = 3 + (h % 3);
        for (i = 0; i < nFlowers; i++) {
          var fx = 1 + ((h + i * 7) % 13), fy = 1 + ((h >> (i + 1)) % 13);
          R(ctx, x + fx, y + fy + 1, 1, 2, '#2f6a30');          // stelo
          R(ctx, x + fx - 1, y + fy, 2, 2, flowerColors[(h + i) % 3]); // bocciolo
        }
        break;
      }
      case 'w': {
        R(ctx, x, y, 16, 16, '#4a86cc');
        R(ctx, x, y, 16, 8, '#5090d8');
        var off = ((frame >> 4) + tx + ty) % 2;
        R(ctx, x + 2 + off * 2, y + 4, 4, 1, '#78b4e8');
        R(ctx, x + 9 - off * 2, y + 9, 4, 1, '#78b4e8');
        R(ctx, x + 4 + off, y + 13, 3, 1, '#6aa4e0');
        R(ctx, x + 3 + off, y + 7, 2, 1, '#9cd0f0');
        var spark = (frame >> 4) & 1; // scintille deterministiche che pulsano
        if ((h % 3) === spark) R(ctx, x + 3 + (h % 9), y + 2 + ((h >> 2) % 6), 1, 1, '#ffffff');
        if ((h % 4) === spark) R(ctx, x + 6 + (h % 6), y + 8 + ((h >> 3) % 5), 1, 1, '#eaf6ff');
        // rim interno del bacino visto dall'alto: parete che scende nell'acqua
        var rimPale = '#d6e2ec', rimMid = '#94a8bc', foam = '#d8ecf8';
        if (cellAt(flags, tx, ty - 1) !== 'w') { R(ctx, x, y, 16, 1, rimPale); R(ctx, x, y + 1, 16, 2, rimMid); } // nord: 3px
        if (cellAt(flags, tx - 1, ty) !== 'w') R(ctx, x, y, 2, 16, rimMid);      // ovest: 2px
        if (cellAt(flags, tx + 1, ty) !== 'w') R(ctx, x + 14, y, 2, 16, rimMid); // est: 2px
        if (cellAt(flags, tx, ty + 1) !== 'w') R(ctx, x, y + 15, 16, 1, foam);   // sud: 1px schiuma
        break;
      }
      case 'T': { // sempreverde in pianta: chioma vista dall'alto, sfora in alto
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
        canopyTop(ctx, x, y, tx, ty, flags, 'T', '#2e5e34', '#3d7a42', '#57a05a', '#1c3a22', '#183018', null);
        break;
      }
      case 'Y': { // sicomoro in pianta: chioma pallida con anello chiaro, vista dall'alto
        grass(ctx, x, y, '#2f4d34', '#456249', '#233828', '#557555', h, { dapple: '#c0d078' });
        canopyTop(ctx, x, y, tx, ty, flags, 'Y', '#3a6a40', '#4e8a52', '#7ab47e', '#264a2c', '#2a5030', '#cdd8a8');
        break;
      }
      case 'S': { // cartello 3D: due pali in prospettiva, asse inclinata, venatura, ombra
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
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
        floorWood(ctx, x, y);
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
        floorWood(ctx, x, y);
        R(ctx, x + 1, y + 14, 14, 2, 'rgba(0,0,0,0.18)'); // ombra a terra (sud)
        R(ctx, x + 1, y + 1, 14, 13, '#5a3c1e');          // contorno scuro
        R(ctx, x + 2, y + 2, 12, 9, '#c89a5a');           // faccia superiore chiara
        R(ctx, x + 2, y + 2, 12, 1, '#e0c088');           // luce superiore
        R(ctx, x + 2, y + 2, 1, 9, '#d8b070');            // spigolo sinistro illuminato
        R(ctx, x + 2, y + 11, 12, 2, '#8a5f36');          // faccia frontale scura
        R(ctx, x + 2, y + 11, 12, 1, '#6a4526');
        break;
      case 't': // tavolo (box più piccolo: faccia superiore + frontale)
        floorWood(ctx, x, y);
        R(ctx, x + 3, y + 13, 10, 2, 'rgba(0,0,0,0.16)'); // ombra a terra
        R(ctx, x + 2, y + 2, 12, 11, '#5a3c1e');          // contorno
        R(ctx, x + 3, y + 3, 10, 8, '#c89a58');           // faccia superiore
        R(ctx, x + 3, y + 3, 10, 1, '#dcb070');           // luce superiore
        R(ctx, x + 3, y + 3, 1, 8, '#d0a860');            // spigolo sinistro
        R(ctx, x + 3, y + 11, 10, 2, '#8a5f36');          // faccia frontale
        break;
      case 'h': // sedia (box piccolo + schienale a nord)
        floorWood(ctx, x, y);
        R(ctx, x + 5, y + 13, 6, 1, 'rgba(0,0,0,0.16)');  // ombra a terra
        R(ctx, x + 4, y + 2, 8, 3, '#4a3018');            // schienale a nord (banda scura più alta)
        R(ctx, x + 4, y + 5, 8, 8, '#5a3c1e');            // contorno seduta
        R(ctx, x + 5, y + 6, 6, 5, '#b0823f');            // faccia superiore
        R(ctx, x + 5, y + 6, 6, 1, '#c8985a');            // luce
        R(ctx, x + 5, y + 11, 6, 2, '#8a5f30');           // faccia frontale
        break;
      case 'K': // letto (materasso dall'alto: cuscino a nord, coperta a sud)
        floorWood(ctx, x, y);
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
        floorWood(ctx, x, y);
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
      case 'R': // tenda rossa (Black Lodge): pieghe con 3 rossi + luci
        R(ctx, x, y, 16, 16, '#8a1020');
        for (i = 0; i < 4; i++) {
          var fx = x + i * 4;
          R(ctx, fx, y, 4, 16, i % 2 ? '#b82438' : '#9c1828');
          R(ctx, fx, y, 1, 16, '#6a0c18');
          R(ctx, fx + 2, y, 1, 16, i % 2 ? '#d0405a' : '#b82a40');
        }
        R(ctx, x, y, 16, 2, '#6a0c18');
        R(ctx, x, y + 2, 16, 1, '#c83048');
        R(ctx, x, y + 14, 16, 2, '#5a0a14');
        break;
      case 'Z': // pavimento zig-zag (chevron della Loggia Nera: diagonali che si invertono)
        for (j = 0; j < 16; j++) {
          var ph = j % 8;
          var dshift = ph < 4 ? ph : 7 - ph;
          for (i = 0; i < 16; i++) {
            var band = Math.floor((i + dshift) / 4) % 2;
            R(ctx, x + i, y + j, 1, 1, band ? '#18100a' : '#f0e6cc');
          }
        }
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
          grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
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
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
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
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
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
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
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
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
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
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
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
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
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
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
        R(ctx, x + 5, y + 14, 6, 2, 'rgba(0,0,0,0.18)'); // ombra a terra
        R(ctx, x + 7, y + 9, 2, 6, '#4a4a52');           // palo
        R(ctx, x + 4, y + 3, 8, 6, '#5a6a7a');           // scatola
        R(ctx, x + 4, y + 3, 8, 1, '#7a8a98');           // luce superiore
        R(ctx, x + 4, y + 8, 8, 1, '#3a4650');           // ombra inferiore scatola
        R(ctx, x + 11, y + 4, 2, 2, '#c83030');          // bandierina laterale
        break;
      }
      case 'n': { // cespuglio: chioma piccola e tonda, palette degli alberi senza tronco né sfondamento
        grass(ctx, x, y, '#a8b878', '#c4cc94', '#8ca05c', '#7a9450', h);
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
