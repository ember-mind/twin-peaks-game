/* portraits.js — ritratti parlanti 32x30 e targhe Gen II.
 * Pixel art procedurale: nessun crop fotografico, nessun canvas text.
 * Quattro valori oliva/crema condivisi col mockup approvato.
 */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var RF = GAME.RetroFont;

  var PAL = {
    ink: '#072619', deep: '#34572d', mid: '#6a8a43', light: '#9aab69', paper: '#eee6b5'
  };

  function R(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function frame(ctx, x, y, w, h) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    /* Riga superiore piena a y: la reference separa mondo/UI esattamente qui. */
    R(ctx, x, y, w, 1, PAL.ink);
    R(ctx, x + 2, y, w - 4, h, PAL.ink); R(ctx, x, y + 2, w, h - 4, PAL.ink);
    R(ctx, x + 3, y + 2, w - 6, h - 4, PAL.paper); R(ctx, x + 2, y + 3, w - 4, h - 6, PAL.paper);
    R(ctx, x + 5, y + 4, w - 10, h - 8, PAL.deep); R(ctx, x + 4, y + 5, w - 8, h - 10, PAL.deep);
    R(ctx, x + 6, y + 5, w - 12, h - 10, PAL.paper); R(ctx, x + 5, y + 6, w - 10, h - 12, PAL.paper);
  }

  /* Forma, non colore, porta somiglianza: attaccatura, mandibola, occhiali,
   * sopracciglia, bocca e costume restano distinguibili anche a 160x144. */
  var FACES = {
    cooper:   { hair:'slick', jaw:0, brow:-1, nose:2, suit:1, tie:1, turn:1 },
    truman:   { hair:'side', jaw:3, brow:0, nose:1, uniform:1, turn:-1 },
    lucy:     { hair:'bun', jaw:-1, brow:1, nose:0, lip:1, collar:1 },
    andy:     { hair:'side', jaw:1, brow:1, nose:1, uniform:1, soft:1 },
    hawk:     { hair:'long', jaw:1, brow:-1, nose:2, uniform:1, longFace:1 },
    sarah:    { hair:'waves', jaw:-1, brow:1, nose:1, lip:1, tired:1 },
    leland:   { hair:'silver', jaw:0, brow:1, nose:2, suit:1, tie:1, turn:1, longFace:1 },
    norma:    { hair:'waves', jaw:0, brow:0, nose:0, lip:1, collar:1 },
    shelly:   { hair:'blonde', jaw:-1, brow:0, nose:0, lip:1, collar:1 },
    loglady:  { hair:'long', jaw:1, brow:-1, nose:2, glasses:1, cardigan:1, turn:-1 },
    bobby:    { hair:'pompadour', jaw:2, brow:-1, nose:1, jacket:1 },
    donna:    { hair:'waves', jaw:-1, brow:0, nose:0, lip:1, necklace:1 },
    jacoby:   { hair:'receding', jaw:1, brow:0, nose:2, glasses:1, beard:1 },
    audrey:   { hair:'bob', jaw:-1, brow:-1, nose:0, lip:1, collar:1, turn:-1 },
    mfap:     { hair:'slick', jaw:-1, brow:1, nose:0, suit:1, bow:1, round:1 },
    laura:    { hair:'blonde', jaw:-1, brow:0, nose:0, lip:1, spectral:1, turn:1 },
    gerard:   { hair:'receding', jaw:0, brow:-1, nose:2, beard:1, waistcoat:1 },
    benhorne: { hair:'slick', jaw:2, brow:-1, nose:2, suit:1, tie:1 },
    giant:    { hair:'receding', jaw:0, brow:0, nose:2, suit:1, longFace:1 },
    maddy:    { hair:'waves', jaw:-1, brow:0, nose:0, lip:1, glasses:1 },
    bob:      { hair:'wild', jaw:3, brow:-1, nose:2, beard:1, grin:1, jacket:1, turn:-1 },
    james:    { hair:'pompadour', jaw:1, brow:-1, nose:1, jacket:1 },
    jacques:  { hair:'side', jaw:3, brow:-1, nose:2, beard:1, waistcoat:1 },
    ronette:  { hair:'blonde', jaw:-1, brow:1, nose:0, tired:1, spectral:1 },
    nurse:    { hair:'cap', jaw:-1, brow:0, nose:0, collar:1 }
  };

  var ALIASES = {
    'COOPER':'cooper', 'DALE COOPER':'cooper', 'TRUMAN':'truman', 'HARRY':'truman',
    'HARRY TRUMAN':'truman', 'LUCY':'lucy', 'ANDY':'andy', 'HAWK':'hawk',
    'SARAH':'sarah', 'SARAH PALMER':'sarah', 'LELAND':'leland', 'LELAND PALMER':'leland',
    'NORMA':'norma', 'SHELLY':'shelly', 'LOG LADY':'loglady', 'SIGNORA CEPPO':'loglady', 'MARGARET':'loglady',
    'BOBBY':'bobby', 'DONNA':'donna', 'JACOBY':'jacoby', 'DOTTOR JACOBY':'jacoby',
    'AUDREY':'audrey', '???':'mfap', 'NANO':'mfap', 'PICCOLO UOMO':'mfap',
    'LAURA':'laura', 'OMBRA':'laura', 'OMBRA DI LAURA':'laura', 'GERARD':'gerard',
    'MIKE':'gerard', 'BEN HORNE':'benhorne', 'BEN':'benhorne', 'GIGANTE':'giant',
    'IL GIGANTE':'giant', 'MADDY':'maddy', 'BOB':'bob', 'VOCE':'bob',
    'JAMES':'james', 'JACQUES':'jacques', 'RONETTE':'ronette', 'INFERMIERA':'nurse'
  };

  /* Testo editoriale della targa: identita breve, mai ellissi automatica. */
  var LABELS = {
    'OMBRA':'LAURA', 'OMBRA DI LAURA':'LAURA', 'LOG LADY':'MARGARET', 'SIGNORA CEPPO':'MARGARET',
    '???':'NANO', 'PICCOLO UOMO':'NANO', 'GIGANTE':'IL GIGANTE', 'IL GIGANTE':'IL GIGANTE',
    'DOTTOR JACOBY':'JACOBY', 'INFERMIERA':'INFERMIERA', 'VOCE':'BOB', 'DALE COOPER':'COOPER',
    'HARRY TRUMAN':'TRUMAN', 'LELAND PALMER':'LELAND', 'SARAH PALMER':'SARAH',
    'BEN':'BEN HORNE', 'BEN HORNE':'BEN HORNE'
  };

  var KEY_LABELS = {
    cooper:'COOPER', truman:'TRUMAN', lucy:'LUCY', andy:'ANDY', hawk:'HAWK',
    sarah:'SARAH', leland:'LELAND', norma:'NORMA', shelly:'SHELLY', loglady:'MARGARET',
    bobby:'BOBBY', donna:'DONNA', jacoby:'JACOBY', audrey:'AUDREY', mfap:'NANO',
    laura:'LAURA', gerard:'GERARD', benhorne:'BEN HORNE', giant:'IL GIGANTE', maddy:'MADDY',
    bob:'BOB', james:'JAMES', jacques:'JACQUES', ronette:'RONETTE', nurse:'INFERMIERA'
  };

  /* Microfont 3x5 a larghezza variabile. Otto lettere entrano nella targa
   * da 40 px senza abbreviazioni; I e punteggiatura recuperano spazio. */
  var MICRO = {
    'A':['010','101','111','101','101'], 'B':['110','101','110','101','110'],
    'C':['011','100','100','100','011'], 'D':['110','101','101','101','110'],
    'E':['111','100','110','100','111'], 'F':['111','100','110','100','100'],
    'G':['011','100','101','101','011'], 'H':['101','101','111','101','101'],
    'I':['1','1','1','1','1'], 'J':['001','001','001','101','010'],
    'K':['101','101','110','101','101'], 'L':['100','100','100','100','111'],
    'M':['10001','11011','10101','10101','10101'], 'N':['101','111','111','111','101'],
    'O':['010','101','101','101','010'], 'P':['110','101','110','100','100'],
    'Q':['010','101','101','111','011'], 'R':['110','101','110','101','101'],
    'S':['011','100','010','001','110'], 'T':['111','010','010','010','010'],
    'U':['101','101','101','101','111'], 'V':['101','101','101','101','010'],
    'W':['10101','10101','10101','11011','10001'], 'X':['101','101','010','101','101'],
    'Y':['101','101','010','010','010'], 'Z':['111','001','010','100','111'],
    '?':['110','001','010','000','010'], '.':['0','0','0','0','1'],
    '-':['000','000','111','000','000'], ' ':['0','0','0','0','0']
  };

  function microWidth(text, spacing) {
    spacing = spacing == null ? 1 : spacing;
    var width = 0;
    for (var i = 0; i < text.length; i++) {
      var glyph = MICRO[text.charAt(i)] || MICRO['?'];
      width += glyph[0].length + (i ? spacing : 0);
    }
    return width;
  }

  function drawMicro(ctx, text, centerX, y, color, maxWidth) {
    /* Prima si chiude il tracking, mai si abbrevia identita. Tutte le targhe
     * canoniche entrano nei 36 px interni anche con BEN HORNE/IL GIGANTE. */
    var spacing = maxWidth && microWidth(text, 1) > maxWidth ? 0 : 1;
    var width = microWidth(text, spacing), cursor = Math.round(centerX - width / 2);
    for (var i = 0; i < text.length; i++) {
      var glyph = MICRO[text.charAt(i)] || MICRO['?'];
      if (i) cursor += spacing;
      for (var row = 0; row < 5; row++) {
        for (var col = 0; col < glyph[row].length; col++) {
          if (glyph[row].charAt(col) === '1') R(ctx, cursor + col, y + row, 1, 1, color);
        }
      }
      cursor += glyph[0].length;
    }
  }

  function cleanName(value) {
    var s = String(value || '').replace(/:\s*$/, '').trim().toUpperCase();
    return s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
  }

  function resolve(name, hint) {
    var h = String(hint || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (FACES[h]) return h;
    return ALIASES[cleanName(name)] || '';
  }

  function hair(ctx, style, x, y, w, longFace) {
    var top = y + (longFace ? 1 : 0);
    if (style === 'receding') {
      R(ctx, x + 2, top, w - 4, 2, PAL.deep); R(ctx, x, top + 2, 3, 5, PAL.ink); R(ctx, x + w - 3, top + 2, 3, 5, PAL.ink);
    } else if (style === 'side' || style === 'silver') {
      R(ctx, x, top, w, 5, style === 'silver' ? PAL.mid : PAL.ink);
      R(ctx, x, top + 4, 6, 4, PAL.ink); R(ctx, x + 3, top + 1, w - 5, 2, style === 'silver' ? PAL.light : PAL.deep);
    } else if (style === 'slick') {
      R(ctx, x, top, w, 5, PAL.ink); R(ctx, x + 2, top + 1, w - 3, 2, PAL.deep); R(ctx, x + w - 5, top + 4, 5, 3, PAL.ink);
    } else if (style === 'pompadour') {
      R(ctx, x - 1, top - 1, w + 2, 6, PAL.ink); R(ctx, x + 2, top - 2, w - 2, 2, PAL.deep); R(ctx, x, top + 4, 5, 4, PAL.ink);
    } else if (style === 'bob') {
      R(ctx, x - 2, top, w + 4, 10, PAL.ink); R(ctx, x - 2, top + 8, 4, 10, PAL.ink); R(ctx, x + w - 2, top + 7, 4, 11, PAL.deep); R(ctx, x + 2, top + 1, w - 3, 2, PAL.deep);
    } else if (style === 'bun') {
      R(ctx, x, top, w, 7, PAL.deep); R(ctx, x - 2, top + 4, 4, 13, PAL.ink); R(ctx, x + w - 2, top + 4, 4, 13, PAL.ink); R(ctx, x + w - 3, top - 3, 7, 6, PAL.ink);
    } else if (style === 'waves' || style === 'blonde') {
      var hc = style === 'blonde' ? PAL.mid : PAL.ink;
      R(ctx, x - 2, top, w + 4, 7, hc); R(ctx, x - 2, top + 5, 5, 15, hc); R(ctx, x + w - 3, top + 5, 5, 15, PAL.deep);
      R(ctx, x + 2, top + 1, 4, 2, PAL.light); R(ctx, x + 8, top, 4, 2, PAL.deep);
    } else if (style === 'long' || style === 'wild') {
      R(ctx, x - 3, top - (style === 'wild' ? 2 : 0), w + 6, 8, PAL.ink);
      R(ctx, x - 3, top + 5, 5, 19, PAL.ink); R(ctx, x + w - 2, top + 5, 5, 19, PAL.deep);
      if (style === 'wild') { R(ctx, x, top - 4, 4, 4, PAL.ink); R(ctx, x + w - 5, top - 5, 5, 5, PAL.deep); }
    } else if (style === 'cap') {
      R(ctx, x - 1, top - 2, w + 2, 5, PAL.paper); R(ctx, x + 3, top - 4, w - 6, 3, PAL.paper);
      R(ctx, x - 1, top + 2, w + 2, 2, PAL.deep); R(ctx, x - 2, top + 4, 4, 10, PAL.ink); R(ctx, x + w - 2, top + 4, 4, 10, PAL.ink);
    }
  }

  /* Otto primi piani principali hanno maschere e lineamenti propri.
   * Nessuna testa parametrica condivisa: ogni silhouette regge anche senza targa. */
  function drawCoreHead(ctx, key, px, py) {
    if (key === 'cooper') {
      /* Cooper: onda alta, tempia scoperta, volto lungo in tre-quarti.
       * Maschera piu larga: leggibile come volto umano a scala nativa. */
      R(ctx, px + 8, py + 2, 18, 4, PAL.ink); R(ctx, px + 11, py, 13, 3, PAL.deep);
      R(ctx, px + 15, py, 8, 1, PAL.light); R(ctx, px + 7, py + 5, 20, 12, PAL.ink);
      R(ctx, px + 9, py + 17, 16, 5, PAL.ink);
      R(ctx, px + 9, py + 6, 15, 11, PAL.paper); R(ctx, px + 11, py + 17, 12, 4, PAL.paper);
      R(ctx, px + 8, py + 8, 2, 7, PAL.light); R(ctx, px + 24, py + 7, 3, 8, PAL.deep);
      R(ctx, px + 10, py + 9, 6, 2, PAL.ink); R(ctx, px + 19, py + 8, 5, 2, PAL.ink);
      R(ctx, px + 12, py + 11, 2, 2, PAL.deep); R(ctx, px + 20, py + 10, 2, 2, PAL.deep);
      R(ctx, px + 18, py + 11, 2, 6, PAL.mid); R(ctx, px + 17, py + 16, 4, 2, PAL.deep);
      R(ctx, px + 13, py + 18, 8, 1, PAL.ink); R(ctx, px + 15, py + 19, 5, 1, PAL.mid);
      R(ctx, px + 10, py + 14, 2, 2, PAL.light); R(ctx, px + 22, py + 13, 2, 3, PAL.mid);
      /* Busto esteso: ritratto, non icona con prop. */
      R(ctx, px + 5, py + 27, 22, 7, PAL.ink); R(ctx, px + 8, py + 27, 16, 7, PAL.deep);
      R(ctx, px + 13, py + 27, 3, 7, PAL.paper); R(ctx, px + 18, py + 27, 3, 7, PAL.paper);
      R(ctx, px + 16, py + 28, 3, 6, PAL.ink);
      return true;
    }
    if (key === 'truman') {
      /* Cranio largo, mascella quadrata, sguardo basso, naso corto. */
      R(ctx, px + 7, py + 2, 20, 5, PAL.ink); R(ctx, px + 8, py + 3, 14, 2, PAL.deep);
      R(ctx, px + 6, py + 6, 21, 12, PAL.ink); R(ctx, px + 8, py + 18, 17, 5, PAL.ink);
      R(ctx, px + 8, py + 7, 17, 11, PAL.paper); R(ctx, px + 9, py + 18, 15, 4, PAL.paper);
      R(ctx, px + 25, py + 9, 2, 6, PAL.light);
      R(ctx, px + 9, py + 10, 6, 2, PAL.ink); R(ctx, px + 19, py + 10, 5, 2, PAL.ink);
      R(ctx, px + 11, py + 12, 2, 1, PAL.deep); R(ctx, px + 20, py + 12, 2, 1, PAL.deep);
      R(ctx, px + 16, py + 12, 2, 4, PAL.mid); R(ctx, px + 15, py + 16, 4, 1, PAL.deep);
      R(ctx, px + 12, py + 19, 9, 1, PAL.ink);
      /* Distintivo a diamante, separato dal viso. */
      R(ctx, px + 8, py + 24, 6, 5, PAL.ink); R(ctx, px + 10, py + 24, 2, 1, PAL.paper);
      R(ctx, px + 9, py + 25, 4, 2, PAL.paper); R(ctx, px + 10, py + 27, 2, 1, PAL.paper);
      return true;
    }
    if (key === 'andy') {
      /* Fronte alta, testa stretta, occhi spalancati e naso lungo: timidezza di Andy. */
      R(ctx, px + 9, py + 1, 16, 3, PAL.ink); R(ctx, px + 8, py + 3, 18, 4, PAL.deep);
      R(ctx, px + 9, py + 6, 16, 14, PAL.ink); R(ctx, px + 11, py + 20, 12, 4, PAL.ink);
      R(ctx, px + 11, py + 6, 12, 14, PAL.paper); R(ctx, px + 12, py + 20, 10, 3, PAL.paper);
      R(ctx, px + 9, py + 8, 2, 7, PAL.light); R(ctx, px + 23, py + 8, 2, 7, PAL.light);
      R(ctx, px + 11, py + 9, 4, 1, PAL.ink); R(ctx, px + 19, py + 9, 4, 1, PAL.ink);
      R(ctx, px + 12, py + 11, 2, 3, PAL.deep); R(ctx, px + 20, py + 11, 2, 3, PAL.deep);
      R(ctx, px + 17, py + 11, 1, 6, PAL.mid); R(ctx, px + 16, py + 17, 3, 1, PAL.deep);
      R(ctx, px + 14, py + 20, 6, 1, PAL.ink); R(ctx, px + 15, py + 21, 4, 1, PAL.mid);
      /* Cravatta stretta e distintivo piccolo, meno massicci di Truman. */
      R(ctx, px + 15, py + 24, 3, 5, PAL.ink); R(ctx, px + 7, py + 25, 4, 4, PAL.ink);
      R(ctx, px + 8, py + 26, 2, 2, PAL.paper);
      return true;
    }
    if (key === 'bobby') {
      /* Pompadour alto, mascella adolescenziale larga, sopracciglia dure e ghigno laterale. */
      R(ctx, px + 5, py + 1, 22, 6, PAL.ink); R(ctx, px + 9, py, 17, 2, PAL.deep);
      R(ctx, px + 6, py + 6, 21, 13, PAL.ink); R(ctx, px + 8, py + 19, 17, 5, PAL.ink);
      R(ctx, px + 8, py + 7, 17, 12, PAL.paper); R(ctx, px + 10, py + 19, 13, 4, PAL.paper);
      R(ctx, px + 6, py + 8, 2, 7, PAL.deep); R(ctx, px + 25, py + 8, 2, 6, PAL.light);
      R(ctx, px + 8, py + 10, 7, 2, PAL.ink); R(ctx, px + 19, py + 9, 6, 2, PAL.ink);
      R(ctx, px + 11, py + 12, 2, 1, PAL.deep); R(ctx, px + 21, py + 12, 2, 1, PAL.deep);
      R(ctx, px + 16, py + 12, 2, 4, PAL.mid); R(ctx, px + 15, py + 16, 4, 1, PAL.deep);
      R(ctx, px + 13, py + 20, 9, 1, PAL.ink); R(ctx, px + 18, py + 21, 4, 1, PAL.mid);
      /* Giubbotto scuro con colletto alzato. */
      R(ctx, px + 4, py + 23, 9, 7, PAL.ink); R(ctx, px + 21, py + 23, 8, 7, PAL.ink);
      R(ctx, px + 6, py + 22, 6, 3, PAL.deep); R(ctx, px + 22, py + 22, 5, 3, PAL.deep);
      return true;
    }
    if (key === 'james') {
      /* Quiff basso, volto lungo e malinconico, occhi cadenti e bocca piena. */
      R(ctx, px + 7, py + 2, 19, 4, PAL.ink); R(ctx, px + 10, py + 1, 13, 2, PAL.deep);
      R(ctx, px + 8, py + 5, 18, 15, PAL.ink); R(ctx, px + 10, py + 20, 14, 5, PAL.ink);
      R(ctx, px + 10, py + 6, 14, 14, PAL.paper); R(ctx, px + 12, py + 20, 10, 4, PAL.paper);
      R(ctx, px + 8, py + 8, 2, 8, PAL.deep); R(ctx, px + 24, py + 8, 2, 7, PAL.light);
      R(ctx, px + 11, py + 10, 5, 1, PAL.ink); R(ctx, px + 19, py + 10, 4, 1, PAL.ink);
      R(ctx, px + 12, py + 12, 2, 1, PAL.deep); R(ctx, px + 20, py + 12, 2, 1, PAL.deep);
      R(ctx, px + 17, py + 12, 1, 5, PAL.mid); R(ctx, px + 16, py + 17, 3, 1, PAL.deep);
      R(ctx, px + 13, py + 20, 8, 2, PAL.deep); R(ctx, px + 15, py + 21, 4, 1, PAL.mid);
      /* Giubbotto da motociclista, T-shirt chiara e zip diagonale. */
      R(ctx, px + 4, py + 24, 9, 6, PAL.ink); R(ctx, px + 21, py + 24, 8, 6, PAL.ink);
      R(ctx, px + 12, py + 24, 10, 6, PAL.paper); R(ctx, px + 21, py + 24, 2, 6, PAL.deep);
      return true;
    }
    if (key === 'jacques') {
      /* Cranio grande, guance pesanti, baffi-barba e sguardo stretto. */
      R(ctx, px + 6, py + 2, 21, 4, PAL.deep); R(ctx, px + 5, py + 5, 23, 14, PAL.ink);
      R(ctx, px + 7, py + 7, 19, 12, PAL.paper); R(ctx, px + 6, py + 17, 21, 6, PAL.ink);
      R(ctx, px + 9, py + 19, 15, 5, PAL.deep); R(ctx, px + 5, py + 9, 2, 8, PAL.light);
      R(ctx, px + 8, py + 10, 6, 2, PAL.ink); R(ctx, px + 20, py + 10, 5, 2, PAL.ink);
      R(ctx, px + 10, py + 12, 2, 1, PAL.deep); R(ctx, px + 21, py + 12, 2, 1, PAL.deep);
      R(ctx, px + 16, py + 12, 2, 5, PAL.mid); R(ctx, px + 15, py + 17, 5, 1, PAL.deep);
      R(ctx, px + 10, py + 18, 6, 2, PAL.ink); R(ctx, px + 18, py + 18, 6, 2, PAL.ink);
      R(ctx, px + 13, py + 21, 8, 1, PAL.ink);
      /* Bretelle larghe da Roadhouse, pancia chiara centrale. */
      R(ctx, px + 5, py + 24, 6, 6, PAL.ink); R(ctx, px + 23, py + 24, 5, 6, PAL.ink);
      R(ctx, px + 13, py + 24, 8, 6, PAL.mid);
      return true;
    }
    if (key === 'benhorne') {
      /* Profilo affilato, riga netta, sopracciglio arcuato e sorriso da negoziatore. */
      R(ctx, px + 8, py + 1, 19, 5, PAL.ink); R(ctx, px + 9, py + 2, 13, 2, PAL.deep);
      R(ctx, px + 7, py + 5, 19, 14, PAL.ink); R(ctx, px + 10, py + 19, 14, 5, PAL.ink);
      R(ctx, px + 9, py + 6, 15, 13, PAL.paper); R(ctx, px + 11, py + 19, 11, 4, PAL.paper);
      R(ctx, px + 7, py + 8, 2, 8, PAL.light); R(ctx, px + 24, py + 8, 3, 7, PAL.ink);
      R(ctx, px + 10, py + 9, 6, 1, PAL.ink); R(ctx, px + 19, py + 8, 5, 1, PAL.ink);
      R(ctx, px + 12, py + 11, 2, 1, PAL.deep); R(ctx, px + 20, py + 10, 2, 1, PAL.deep);
      R(ctx, px + 18, py + 11, 2, 6, PAL.mid); R(ctx, px + 17, py + 17, 4, 1, PAL.deep);
      R(ctx, px + 13, py + 20, 8, 1, PAL.ink); R(ctx, px + 17, py + 21, 5, 1, PAL.mid);
      /* Fazzoletto e sigaro corto: Ben, non Cooper. */
      R(ctx, px + 8, py + 25, 4, 3, PAL.paper); R(ctx, px + 23, py + 18, 6, 2, PAL.ink);
      R(ctx, px + 28, py + 17, 2, 1, PAL.mid);
      return true;
    }
    if (key === 'lucy') {
      /* Coda alta, ovale stretto, occhi vigili e bocca rapida da centralinista. */
      R(ctx, px + 9, py + 2, 16, 5, PAL.deep); R(ctx, px + 23, py, 7, 6, PAL.ink);
      R(ctx, px + 7, py + 6, 19, 14, PAL.ink); R(ctx, px + 10, py + 20, 13, 4, PAL.ink);
      R(ctx, px + 9, py + 7, 15, 13, PAL.paper); R(ctx, px + 11, py + 20, 10, 3, PAL.paper);
      R(ctx, px + 7, py + 8, 2, 9, PAL.deep); R(ctx, px + 24, py + 8, 3, 10, PAL.ink);
      R(ctx, px + 10, py + 9, 5, 1, PAL.ink); R(ctx, px + 19, py + 9, 5, 1, PAL.ink);
      R(ctx, px + 11, py + 11, 3, 2, PAL.deep); R(ctx, px + 20, py + 11, 3, 2, PAL.deep);
      R(ctx, px + 17, py + 12, 1, 4, PAL.mid); R(ctx, px + 16, py + 16, 3, 1, PAL.deep);
      R(ctx, px + 13, py + 19, 8, 1, PAL.deep); R(ctx, px + 15, py + 20, 5, 1, PAL.mid);
      /* Cuffia telefonica e fiocco della camicetta. */
      R(ctx, px + 5, py + 10, 2, 8, PAL.ink); R(ctx, px + 6, py + 17, 4, 2, PAL.ink);
      R(ctx, px + 12, py + 24, 4, 3, PAL.paper); R(ctx, px + 18, py + 24, 4, 3, PAL.paper);
      R(ctx, px + 16, py + 25, 2, 2, PAL.ink);
      return true;
    }
    if (key === 'norma') {
      /* Bouffant morbido, volto maturo a cuore, sorriso quieto da Double R. */
      R(ctx, px + 5, py + 2, 23, 7, PAL.ink); R(ctx, px + 9, py, 14, 3, PAL.deep);
      R(ctx, px + 6, py + 7, 21, 13, PAL.ink); R(ctx, px + 9, py + 20, 15, 4, PAL.ink);
      R(ctx, px + 9, py + 7, 15, 13, PAL.paper); R(ctx, px + 11, py + 20, 11, 3, PAL.paper);
      R(ctx, px + 6, py + 9, 3, 10, PAL.deep); R(ctx, px + 24, py + 8, 3, 11, PAL.ink);
      R(ctx, px + 10, py + 10, 5, 1, PAL.deep); R(ctx, px + 19, py + 10, 4, 1, PAL.deep);
      R(ctx, px + 12, py + 12, 2, 1, PAL.ink); R(ctx, px + 20, py + 12, 2, 1, PAL.ink);
      R(ctx, px + 17, py + 12, 1, 4, PAL.mid); R(ctx, px + 16, py + 16, 3, 1, PAL.light);
      R(ctx, px + 13, py + 20, 8, 1, PAL.deep); R(ctx, px + 15, py + 21, 5, 1, PAL.mid);
      /* Colletto/apron del diner, con piccolo bordo a quadri. */
      R(ctx, px + 7, py + 24, 7, 3, PAL.paper); R(ctx, px + 20, py + 24, 7, 3, PAL.paper);
      R(ctx, px + 11, py + 27, 12, 3, PAL.light); R(ctx, px + 12, py + 28, 2, 1, PAL.deep);
      R(ctx, px + 16, py + 28, 2, 1, PAL.deep); R(ctx, px + 20, py + 28, 2, 1, PAL.deep);
      return true;
    }
    if (key === 'donna') {
      /* Capelli scuri a onde lunghe, volto giovane largo, occhi seri e libro al petto. */
      R(ctx, px + 5, py + 1, 23, 8, PAL.ink); R(ctx, px + 3, py + 6, 6, 19, PAL.ink);
      R(ctx, px + 25, py + 6, 5, 19, PAL.deep); R(ctx, px + 8, py + 6, 18, 14, PAL.ink);
      R(ctx, px + 10, py + 7, 14, 13, PAL.paper); R(ctx, px + 11, py + 20, 12, 4, PAL.ink);
      R(ctx, px + 13, py + 20, 8, 3, PAL.paper);
      R(ctx, px + 10, py + 10, 5, 1, PAL.ink); R(ctx, px + 19, py + 10, 5, 1, PAL.ink);
      R(ctx, px + 11, py + 12, 3, 2, PAL.deep); R(ctx, px + 20, py + 12, 3, 2, PAL.deep);
      R(ctx, px + 17, py + 12, 1, 4, PAL.mid); R(ctx, px + 16, py + 16, 3, 1, PAL.light);
      R(ctx, px + 13, py + 20, 8, 1, PAL.deep); R(ctx, px + 15, py + 21, 4, 1, PAL.mid);
      /* Medaglione e diario scuro rendono silhouette diversa da Norma/Lucy. */
      R(ctx, px + 16, py + 23, 2, 3, PAL.ink); R(ctx, px + 15, py + 25, 4, 2, PAL.paper);
      R(ctx, px + 3, py + 24, 10, 6, PAL.deep); R(ctx, px + 5, py + 25, 6, 1, PAL.paper);
      return true;
    }
    if (key === 'laura') {
      /* Ovale luminoso e simmetrico da foto scolastica, occhi aperti, bocca morbida. */
      R(ctx, px + 6, py + 1, 20, 21, PAL.mid); R(ctx, px + 4, py + 5, 5, 18, PAL.mid);
      R(ctx, px + 24, py + 5, 4, 18, PAL.deep); R(ctx, px + 9, py + 2, 14, 4, PAL.light);
      R(ctx, px + 9, py + 5, 14, 13, PAL.ink); R(ctx, px + 11, py + 18, 10, 4, PAL.ink);
      R(ctx, px + 11, py + 5, 10, 13, PAL.paper); R(ctx, px + 12, py + 18, 8, 3, PAL.paper);
      R(ctx, px + 11, py + 8, 4, 1, PAL.deep); R(ctx, px + 18, py + 8, 4, 1, PAL.deep);
      R(ctx, px + 12, py + 10, 2, 2, PAL.ink); R(ctx, px + 19, py + 10, 2, 2, PAL.ink);
      R(ctx, px + 16, py + 11, 1, 4, PAL.mid); R(ctx, px + 15, py + 15, 3, 1, PAL.light);
      R(ctx, px + 13, py + 18, 7, 1, PAL.deep); R(ctx, px + 15, py + 19, 4, 1, PAL.mid);
      R(ctx, px + 15, py + 24, 3, 3, PAL.ink); R(ctx, px + 16, py + 25, 1, 1, PAL.paper);
      return true;
    }
    if (key === 'audrey') {
      /* Bob geometrico, volto a cuore, occhi felini disallineati, neo. */
      R(ctx, px + 6, py + 1, 21, 20, PAL.ink); R(ctx, px + 4, py + 5, 5, 18, PAL.ink);
      R(ctx, px + 25, py + 5, 4, 18, PAL.deep); R(ctx, px + 9, py + 2, 15, 3, PAL.deep);
      R(ctx, px + 9, py + 5, 15, 12, PAL.ink); R(ctx, px + 11, py + 17, 10, 5, PAL.ink);
      R(ctx, px + 11, py + 5, 11, 12, PAL.paper); R(ctx, px + 12, py + 17, 8, 4, PAL.paper);
      R(ctx, px + 9, py + 8, 6, 1, PAL.ink); R(ctx, px + 18, py + 7, 6, 1, PAL.ink);
      R(ctx, px + 11, py + 10, 3, 1, PAL.deep); R(ctx, px + 19, py + 9, 3, 2, PAL.deep);
      R(ctx, px + 16, py + 11, 1, 4, PAL.mid); R(ctx, px + 15, py + 15, 3, 1, PAL.light);
      R(ctx, px + 13, py + 18, 6, 1, PAL.deep); R(ctx, px + 18, py + 15, 1, 1, PAL.ink);
      /* Sigaretta sul lato vicino. */
      R(ctx, px + 6, py + 19, 5, 1, PAL.paper); R(ctx, px + 5, py + 18, 1, 2, PAL.deep);
      return true;
    }
    if (key === 'leland') {
      /* Faccia lunga, tempie bianche, ponte del naso forte, sorriso teso. */
      R(ctx, px + 8, py + 1, 18, 6, PAL.deep); R(ctx, px + 7, py + 3, 5, 10, PAL.paper);
      R(ctx, px + 23, py + 3, 4, 10, PAL.paper); R(ctx, px + 9, py + 5, 16, 15, PAL.ink);
      R(ctx, px + 11, py + 6, 12, 14, PAL.paper); R(ctx, px + 12, py + 20, 10, 4, PAL.ink);
      R(ctx, px + 13, py + 20, 8, 3, PAL.paper);
      R(ctx, px + 11, py + 9, 5, 1, PAL.ink); R(ctx, px + 19, py + 9, 4, 1, PAL.ink);
      R(ctx, px + 13, py + 11, 2, 1, PAL.deep); R(ctx, px + 20, py + 11, 1, 1, PAL.deep);
      R(ctx, px + 17, py + 11, 1, 6, PAL.mid); R(ctx, px + 16, py + 17, 4, 1, PAL.deep);
      R(ctx, px + 13, py + 20, 8, 1, PAL.ink); R(ctx, px + 14, py + 21, 6, 1, PAL.paper);
      return true;
    }
    if (key === 'bob') {
      /* Chioma invade bordo; volto larghissimo, occhi infossati, barba e denti. */
      R(ctx, px, py, 6, 10, PAL.ink); R(ctx, px + 4, py + 1, 7, 5, PAL.deep);
      R(ctx, px + 10, py, 7, 4, PAL.ink); R(ctx, px + 17, py + 1, 7, 4, PAL.deep);
      R(ctx, px + 23, py, 9, 10, PAL.ink); R(ctx, px + 1, py + 9, 5, 16, PAL.ink);
      R(ctx, px + 27, py + 8, 5, 17, PAL.deep); R(ctx, px + 6, py + 5, 22, 15, PAL.ink);
      R(ctx, px + 8, py + 7, 18, 12, PAL.paper); R(ctx, px + 9, py + 19, 16, 5, PAL.mid);
      R(ctx, px + 8, py + 9, 7, 2, PAL.ink); R(ctx, px + 19, py + 9, 6, 2, PAL.ink);
      R(ctx, px + 11, py + 12, 2, 2, PAL.deep); R(ctx, px + 21, py + 12, 2, 2, PAL.deep);
      R(ctx, px + 17, py + 12, 2, 5, PAL.mid); R(ctx, px + 15, py + 17, 5, 1, PAL.deep);
      R(ctx, px + 11, py + 19, 12, 1, PAL.ink); R(ctx, px + 12, py + 20, 10, 2, PAL.paper);
      R(ctx, px + 13, py + 22, 8, 1, PAL.ink); R(ctx, px + 15, py + 20, 1, 2, PAL.deep);
      return true;
    }
    if (key === 'mfap') {
      /* Testa piccola e bassa, guance tonde, ciuffo alto, papillon. */
      R(ctx, px + 10, py + 2, 14, 3, PAL.ink); R(ctx, px + 13, py, 9, 3, PAL.deep);
      R(ctx, px + 8, py + 7, 18, 11, PAL.ink); R(ctx, px + 10, py + 18, 14, 5, PAL.ink);
      R(ctx, px + 10, py + 8, 14, 10, PAL.paper); R(ctx, px + 12, py + 18, 10, 4, PAL.paper);
      R(ctx, px + 10, py + 11, 4, 1, PAL.ink); R(ctx, px + 20, py + 11, 4, 1, PAL.ink);
      R(ctx, px + 11, py + 13, 2, 2, PAL.deep); R(ctx, px + 21, py + 13, 2, 2, PAL.deep);
      R(ctx, px + 17, py + 13, 1, 3, PAL.mid); R(ctx, px + 15, py + 17, 5, 1, PAL.deep);
      R(ctx, px + 14, py + 20, 6, 1, PAL.ink);
      R(ctx, px + 13, py + 25, 2, 3, PAL.ink); R(ctx, px + 19, py + 25, 2, 3, PAL.ink);
      R(ctx, px + 15, py + 26, 4, 2, PAL.paper);
      return true;
    }
    if (key === 'loglady') {
      /* Capelli a colonna, faccia piena, grandi occhiali tondi e ceppo. */
      R(ctx, px + 5, py + 1, 22, 23, PAL.ink); R(ctx, px + 4, py + 5, 5, 20, PAL.ink);
      R(ctx, px + 25, py + 5, 4, 20, PAL.deep); R(ctx, px + 9, py + 3, 16, 4, PAL.deep);
      R(ctx, px + 8, py + 6, 18, 13, PAL.ink); R(ctx, px + 10, py + 19, 14, 4, PAL.ink);
      R(ctx, px + 10, py + 7, 14, 12, PAL.paper); R(ctx, px + 12, py + 19, 10, 3, PAL.paper);
      R(ctx, px + 9, py + 9, 7, 7, PAL.ink); R(ctx, px + 18, py + 9, 7, 7, PAL.ink);
      R(ctx, px + 11, py + 11, 3, 3, PAL.paper); R(ctx, px + 20, py + 11, 3, 3, PAL.paper);
      R(ctx, px + 12, py + 12, 1, 1, PAL.deep); R(ctx, px + 21, py + 12, 1, 1, PAL.deep);
      R(ctx, px + 16, py + 11, 2, 1, PAL.ink); R(ctx, px + 17, py + 14, 1, 3, PAL.mid);
      R(ctx, px + 14, py + 19, 6, 1, PAL.ink);
      R(ctx, px + 22, py + 17, 8, 4, PAL.ink); R(ctx, px + 19, py + 20, 10, 5, PAL.deep);
      R(ctx, px + 15, py + 24, 11, 5, PAL.mid); R(ctx, px + 24, py + 18, 4, 2, PAL.light);
      return true;
    }
    return false;
  }

  function drawPortrait(ctx, key, x, y) {
    var f = FACES[key] || FACES.cooper;
    var px = Math.round(x), py = Math.round(y), turn = f.turn || 0;

    /* Fondali diversi aiutano riconoscimento prima ancora dei lineamenti. */
    R(ctx, px, py, 32, 30, PAL.light);
    R(ctx, px + 1, py + 1, 30, 1, PAL.mid); R(ctx, px + 1, py + 2, 1, 27, PAL.mid);
    R(ctx, px + 26, py + 3, 4, 1, PAL.paper); R(ctx, px + 28, py + 5, 2, 1, PAL.paper);
    if (key === 'cooper') {
      R(ctx, px + 2, py + 2, 5, 22, PAL.paper); R(ctx, px + 3, py + 3, 1, 20, PAL.mid);
    } else if (key === 'truman') {
      R(ctx, px + 2, py + 2, 28, 5, PAL.deep); R(ctx, px + 3, py + 7, 26, 1, PAL.paper);
    } else if (key === 'laura') {
      /* Quattro angoli da fotografia scolastica. */
      R(ctx, px + 2, py + 2, 8, 2, PAL.paper); R(ctx, px + 2, py + 2, 2, 8, PAL.paper);
      R(ctx, px + 22, py + 2, 8, 2, PAL.paper); R(ctx, px + 28, py + 2, 2, 8, PAL.paper);
      R(ctx, px + 2, py + 22, 2, 6, PAL.paper); R(ctx, px + 2, py + 26, 8, 2, PAL.paper);
      R(ctx, px + 28, py + 22, 2, 6, PAL.paper); R(ctx, px + 22, py + 26, 8, 2, PAL.paper);
    } else if (key === 'audrey') {
      R(ctx, px + 3, py + 2, 2, 22, PAL.deep); R(ctx, px + 27, py + 2, 2, 22, PAL.deep);
    } else if (key === 'leland') {
      R(ctx, px + 2, py + 2, 28, 3, PAL.paper); R(ctx, px + 15, py + 2, 2, 19, PAL.mid);
    } else if (key === 'bob') {
      R(ctx, px + 2, py + 2, 28, 27, PAL.deep); R(ctx, px + 3, py + 3, 26, 1, PAL.ink);
    } else if (key === 'mfap') {
      /* Chevron da sipario: bande da 2 px leggibili ai quattro angoli. */
      R(ctx, px + 2, py + 2, 5, 2, PAL.deep); R(ctx, px + 7, py + 4, 5, 2, PAL.deep);
      R(ctx, px + 20, py + 4, 5, 2, PAL.deep); R(ctx, px + 25, py + 2, 5, 2, PAL.deep);
      R(ctx, px + 2, py + 26, 5, 2, PAL.deep); R(ctx, px + 7, py + 24, 5, 2, PAL.deep);
      R(ctx, px + 20, py + 24, 5, 2, PAL.deep); R(ctx, px + 25, py + 26, 5, 2, PAL.deep);
    } else if (key === 'loglady') {
      R(ctx, px + 2, py + 2, 5, 22, PAL.paper); R(ctx, px + 3, py + 4, 3, 1, PAL.deep);
      R(ctx, px + 3, py + 10, 3, 1, PAL.deep); R(ctx, px + 3, py + 16, 3, 1, PAL.deep);
    }

    /* Spalle e costume prima della testa. Revers aperti = Cooper/Leland. */
    R(ctx, px + 3, py + 25, 26, 5, PAL.ink); R(ctx, px + 6, py + 22, 20, 8, PAL.deep);
    if (f.cardigan || f.waistcoat || f.jacket || f.uniform) R(ctx, px + 7, py + 24, 18, 6, PAL.mid);
    R(ctx, px + 13, py + 21, 6, 6, PAL.paper);
    if (f.suit || f.uniform || f.jacket) {
      R(ctx, px + 7, py + 23, 7, 7, PAL.ink); R(ctx, px + 18, py + 23, 7, 7, PAL.ink);
      R(ctx, px + 12, py + 23, 3, 5, PAL.paper); R(ctx, px + 17, py + 23, 3, 5, PAL.paper);
    }
    if (f.tie) { R(ctx, px + 15, py + 23, 2, 7, PAL.ink); R(ctx, px + 14, py + 23, 4, 2, PAL.deep); }
    if (f.bow) {
      /* Papillon compatto: sagoma totale 5 px, centro chiaro. */
      R(ctx, px + 13, py + 24, 2, 3, PAL.ink); R(ctx, px + 17, py + 24, 2, 3, PAL.ink);
      R(ctx, px + 15, py + 25, 2, 2, PAL.paper);
    }
    if (f.collar) { R(ctx, px + 8, py + 23, 7, 3, PAL.paper); R(ctx, px + 17, py + 23, 7, 3, PAL.paper); }
    if (f.necklace) { R(ctx, px + 13, py + 24, 6, 1, PAL.light); R(ctx, px + 15, py + 25, 2, 2, PAL.light); }

    /* Core cast: salta interamente maschera parametrica sottostante. */
    if (drawCoreHead(ctx, key, px, py)) return;

    /* Testa a gradini: tempie, guance e mento non formano piu un rettangolo. */
    var fw = 19 + Math.max(-1, Math.min(3, f.jaw || 0));
    var headDrop = key === 'mfap' ? 2 : 0;
    var fx = px + Math.floor((32 - fw) / 2) + turn, fy = py + (f.longFace ? 3 : 2) + headDrop;
    var jawInset = f.round ? 2 : (f.jaw > 1 ? 1 : 2);
    R(ctx, fx + 2, fy, fw - 4, 2, PAL.ink);
    R(ctx, fx, fy + 2, fw, 13, PAL.ink);
    R(ctx, fx + jawInset, fy + 15, fw - jawInset * 2, 5, PAL.ink);
    R(ctx, fx + jawInset + 2, fy + 20, fw - jawInset * 2 - 4, 3, PAL.ink);
    R(ctx, fx + 2, fy + 2, fw - 4, 13, PAL.paper);
    R(ctx, fx + jawInset + 1, fy + 14, fw - jawInset * 2 - 2, 5, PAL.paper);
    R(ctx, fx + jawInset + 3, fy + 19, fw - jawInset * 2 - 6, 2, PAL.paper);
    /* Un lato in ombra crea posa 3/4; lato vicino mantiene guancia chiara. */
    if (turn > 0) {
      R(ctx, fx + 2, fy + 5, 2, 10, PAL.light); R(ctx, fx + 4, fy + 15, 2, 3, PAL.light);
    } else if (turn < 0) {
      R(ctx, fx + fw - 4, fy + 5, 2, 10, PAL.light); R(ctx, fx + fw - 6, fy + 15, 2, 3, PAL.light);
    }
    /* Orecchio solo sul lato vicino: altro segnale di rotazione. */
    var earX = turn < 0 ? fx + fw : fx - 2;
    R(ctx, earX, fy + 8, 2, 6, PAL.ink); R(ctx, earX + (turn < 0 ? 0 : 1), fy + 9, 1, 3, PAL.paper);
    hair(ctx, f.hair, fx - 1, fy - 2, fw + 2, f.longFace);

    var eyeY = fy + 8;
    var lx = fx + 4, rx = fx + fw - 7;
    var farL = turn < 0, farR = turn > 0;
    R(ctx, lx, eyeY + (f.brow > 0 ? 1 : 0), farL ? 3 : 5, 1, PAL.ink);
    R(ctx, rx, eyeY + (f.brow > 0 ? 1 : 0), farR ? 3 : 5, 1, PAL.ink);
    R(ctx, lx + 1, eyeY + 2, farL ? 1 : 2, f.tired ? 1 : 2, PAL.deep);
    R(ctx, rx + 1, eyeY + 2, farR ? 1 : 2, f.tired ? 1 : 2, PAL.deep);
    if (f.tired) { R(ctx, lx, eyeY + 4, 4, 1, PAL.mid); R(ctx, rx, eyeY + 4, 4, 1, PAL.mid); }
    if (f.glasses) {
      R(ctx, lx - 1, eyeY, 6, 1, PAL.ink); R(ctx, lx - 1, eyeY, 1, 5, PAL.ink); R(ctx, lx + 4, eyeY, 1, 5, PAL.ink);
      R(ctx, rx - 1, eyeY, 6, 1, PAL.ink); R(ctx, rx - 1, eyeY, 1, 5, PAL.ink); R(ctx, rx + 4, eyeY, 1, 5, PAL.ink);
      R(ctx, lx + 5, eyeY + 1, Math.max(1, rx - lx - 6), 1, PAL.ink);
    }
    var nx = fx + Math.floor(fw / 2) + turn * 2;
    R(ctx, nx, fy + 11, 1, 5, PAL.mid);
    R(ctx, nx - (turn < 0 ? 2 : 1), fy + 15, 3 + (f.nose > 0 ? 1 : 0), 1, PAL.deep);
    if (f.nose > 1) R(ctx, nx + turn, fy + 13, 2, 1, PAL.deep);
    if (f.beard) {
      R(ctx, fx + jawInset + 1, fy + 16, fw - jawInset * 2 - 2, 4, PAL.mid);
      R(ctx, fx + jawInset + 3, fy + 20, fw - jawInset * 2 - 6, 2, PAL.deep);
    }
    if (f.grin) {
      R(ctx, fx + 4, fy + 17, fw - 8, 1, PAL.ink); R(ctx, fx + 5, fy + 18, fw - 10, 2, PAL.paper); R(ctx, fx + 6, fy + 20, fw - 12, 1, PAL.ink);
    } else {
      R(ctx, fx + 5 + turn, fy + 18, Math.max(4, fw - 11), 1, f.lip ? PAL.deep : PAL.ink);
      if (f.soft || f.lip) R(ctx, fx + 7 + turn, fy + 19, Math.max(2, fw - 15), 1, PAL.mid);
    }

    /* Firme attoriali leggibili senza targa. */
    if (key === 'cooper') {
      /* Tre-quarti frontale, onda alta, cravatta e tazza a C 5x6. */
      R(ctx, fx, fy - 4, 5, 2, PAL.ink); R(ctx, fx + 3, fy - 5, 8, 2, PAL.deep);
      R(ctx, fx + 5, fy + 1, 1, 4, PAL.paper);
      R(ctx, px + 2, py + 18, 5, 1, PAL.ink); R(ctx, px + 2, py + 18, 1, 6, PAL.ink);
      R(ctx, px + 2, py + 23, 5, 1, PAL.ink); R(ctx, px + 3, py + 19, 3, 4, PAL.paper);
      R(ctx, px + 6, py + 19, 2, 1, PAL.ink); R(ctx, px + 7, py + 20, 1, 3, PAL.ink);
      R(ctx, px + 6, py + 22, 2, 1, PAL.ink);
    } else if (key === 'truman') {
      /* Camicia larga e distintivo-diamante chiaro 4x4. */
      R(ctx, px + 5, py + 24, 22, 2, PAL.mid); R(ctx, px + 6, py + 26, 20, 3, PAL.deep);
      R(ctx, px + 8, py + 23, 6, 6, PAL.ink);
      R(ctx, px + 10, py + 24, 2, 1, PAL.paper); R(ctx, px + 9, py + 25, 4, 2, PAL.paper);
      R(ctx, px + 10, py + 27, 2, 1, PAL.paper);
    } else if (key === 'laura') {
      /* Capelli lunghi simmetrici, bagliore e medaglione 3x3. */
      R(ctx, fx - 3, fy + 3, 4, 17, PAL.light); R(ctx, fx + fw - 1, fy + 3, 4, 17, PAL.light);
      R(ctx, fx - 2, fy + 6, 2, 4, PAL.paper); R(ctx, fx + fw, fy + 6, 2, 4, PAL.paper);
      R(ctx, fx - 3, fy + 13, 2, 5, PAL.mid); R(ctx, fx + fw + 1, fy + 13, 2, 5, PAL.mid);
      R(ctx, px + 3, py + 3, 2, 1, PAL.paper); R(ctx, px + 27, py + 9, 2, 1, PAL.paper);
      R(ctx, px + 15, py + 24, 3, 3, PAL.ink); R(ctx, px + 16, py + 25, 1, 1, PAL.paper);
    } else if (key === 'audrey') {
      /* Bob curvo, eyeliner a coda, neo e sigaretta. */
      R(ctx, fx - 3, fy + 13, 3, 8, PAL.ink); R(ctx, fx + fw, fy + 12, 3, 9, PAL.deep);
      R(ctx, fx - 1, fy + 20, 5, 2, PAL.ink); R(ctx, fx + fw - 4, fy + 20, 5, 2, PAL.deep);
      R(ctx, lx - 2, eyeY, 2, 1, PAL.ink); R(ctx, rx + 4, eyeY - 1, 2, 1, PAL.ink);
      R(ctx, fx + fw - 6, fy + 15, 1, 1, PAL.ink);
      R(ctx, fx + 3, fy + 19, 6, 1, PAL.deep); R(ctx, fx - 1, fy + 18, 4, 1, PAL.paper);
    } else if (key === 'leland') {
      /* Tempie bianche larghe e sorriso teso. */
      R(ctx, fx - 2, fy, 5, 9, PAL.paper); R(ctx, fx + fw - 3, fy, 5, 9, PAL.paper);
      R(ctx, fx + 4, fy - 1, fw - 8, 3, PAL.deep);
      R(ctx, fx + 5, fy + 18, fw - 10, 1, PAL.ink);
      R(ctx, fx + 4, fy + 17, 1, 2, PAL.deep); R(ctx, fx + fw - 5, fy + 17, 1, 2, PAL.deep);
    } else if (key === 'bob') {
      /* Chioma frastagliata invade cornice; barba e denti restano isolati. */
      R(ctx, px, py + 1, 5, 8, PAL.ink); R(ctx, px + 28, py, 4, 10, PAL.deep);
      R(ctx, px + 2, py, 4, 4, PAL.ink); R(ctx, px + 23, py + 1, 5, 3, PAL.ink);
      R(ctx, px, py + 11, 5, 14, PAL.ink); R(ctx, px + 28, py + 10, 4, 15, PAL.deep);
      R(ctx, fx + 5, fy + 18, fw - 10, 2, PAL.paper); R(ctx, fx + 6, fy + 19, 1, 1, PAL.ink);
      R(ctx, fx + fw - 7, fy + 19, 1, 1, PAL.ink);
    } else if (key === 'mfap') {
      /* Quiff, testa bassa e papillon da 5 px. */
      R(ctx, fx + 1, fy - 3, fw - 6, 3, PAL.ink); R(ctx, fx + 4, fy - 5, fw - 8, 3, PAL.deep);
      R(ctx, px + 13, py + 25, 2, 3, PAL.ink); R(ctx, px + 17, py + 25, 2, 3, PAL.ink);
      R(ctx, px + 15, py + 26, 2, 2, PAL.paper);
    } else if (key === 'loglady') {
      /* Occhiali tondi e ceppo diagonale spesso stretto al petto. */
      R(ctx, lx - 1, eyeY + 1, 1, 3, PAL.paper); R(ctx, lx + 4, eyeY + 1, 1, 3, PAL.paper);
      R(ctx, rx - 1, eyeY + 1, 1, 3, PAL.paper); R(ctx, rx + 4, eyeY + 1, 1, 3, PAL.paper);
      R(ctx, px + 21, py + 17, 8, 4, PAL.ink); R(ctx, px + 18, py + 20, 10, 5, PAL.deep);
      R(ctx, px + 14, py + 24, 11, 5, PAL.mid); R(ctx, px + 23, py + 18, 4, 2, PAL.light);
    }
    if (f.spectral) { R(ctx, px + 2, py + 2, 1, 1, PAL.paper); R(ctx, px + 28, py + 5, 2, 1, PAL.paper); }
  }

  function displayLabel(name, key, maxWidth) {
    var original = cleanName(name);
    var label = LABELS[original] || original || key.toUpperCase();
    /* Alias canonico serve solo quando chiamante passa hint senza nome. */
    if (!original && KEY_LABELS[key]) label = KEY_LABELS[key];
    return label;
  }

  /* Ritratto Cooper authored direttamente sul well 34x36.
   * Scanline del volto restringono fronte -> mascella: niente maschera quadra. */
  function drawCooperWell(ctx, x, y) {
    R(ctx, x, y, 34, 36, PAL.light);
    R(ctx, x + 1, y + 1, 32, 1, PAL.mid); R(ctx, x + 1, y + 2, 1, 33, PAL.mid);
    /* Spalle, revers e cravatta asimmetrici. */
    R(ctx, x + 3, y + 27, 28, 9, PAL.ink); R(ctx, x + 6, y + 25, 22, 11, PAL.deep);
    R(ctx, x + 7, y + 26, 8, 10, PAL.ink); R(ctx, x + 20, y + 26, 8, 10, PAL.ink);
    R(ctx, x + 13, y + 25, 4, 8, PAL.paper); R(ctx, x + 18, y + 25, 4, 8, PAL.paper);
    R(ctx, x + 16, y + 27, 3, 9, PAL.ink); R(ctx, x + 15, y + 27, 5, 2, PAL.deep);
    /* Capelli: onda e riga diagonale, tre valori. */
    R(ctx, x + 16, y, 4, 1, PAL.ink); R(ctx, x + 13, y + 1, 7, 1, PAL.ink);
    R(ctx, x + 9, y + 2, 11, 2, PAL.ink); R(ctx, x + 7, y + 4, 18, 3, PAL.ink);
    R(ctx, x + 5, y + 7, 20, 4, PAL.ink);
    R(ctx, x + 14, y + 1, 4, 1, PAL.deep); R(ctx, x + 8, y + 3, 7, 2, PAL.deep);
    R(ctx, x + 16, y + 2, 4, 1, PAL.mid); R(ctx, x + 6, y + 6, 8, 2, PAL.deep);
    R(ctx, x + 20, y + 4, 4, 2, PAL.mid); R(ctx, x + 23, y + 7, 2, 3, PAL.deep);
    R(ctx, x + 20, y + 4, 5, 2, PAL.mid); R(ctx, x + 5, y + 8, 3, 7, PAL.deep);
    /* Viso a scanline; lato lontano ombreggiato. */
    var face = [[6,7,22],[6,8,23],[6,9,24],[7,10,23],[7,11,22],[7,12,22],
                [8,13,20],[8,14,20],[8,15,19],[9,16,17],[9,17,16],
                [10,18,14],[10,19,13],[11,20,11],[12,21,8]];
    face.forEach(function (r) { R(ctx, x + r[0], y + r[1], r[2], 1, PAL.paper); });
    /* Orecchio vicino, tempia e zigomo: tre-quarti leggibile senza targa. */
    R(ctx, x + 7, y + 11, 2, 5, PAL.ink); R(ctx, x + 8, y + 12, 2, 3, PAL.mid);
    R(ctx, x + 9, y + 13, 1, 1, PAL.paper);
    R(ctx, x + 24, y + 8, 2, 4, PAL.deep);
    R(ctx, x + 22, y + 10, 3, 6, PAL.mid); R(ctx, x + 21, y + 14, 3, 5, PAL.deep);
    R(ctx, x + 20, y + 18, 3, 2, PAL.mid); R(ctx, x + 19, y + 20, 2, 2, PAL.deep);
    R(ctx, x + 8, y + 11, 2, 6, PAL.light); R(ctx, x + 10, y + 17, 2, 2, PAL.mid);
    /* Sopracciglia sottili e occhi sfalsati da tre-quarti. */
    R(ctx, x + 10, y + 10, 4, 1, PAL.ink); R(ctx, x + 18, y + 9, 3, 1, PAL.ink);
    R(ctx, x + 11, y + 12, 2, 1, PAL.ink); R(ctx, x + 19, y + 11, 1, 1, PAL.ink);
    R(ctx, x + 12, y + 11, 1, 1, PAL.mid); R(ctx, x + 20, y + 10, 1, 1, PAL.light);
    R(ctx, x + 10, y + 13, 3, 1, PAL.mid); R(ctx, x + 11, y + 15, 2, 2, PAL.mid);
    /* Naso lungo, zigomo, bocca breve, mento. */
    R(ctx, x + 16, y + 12, 1, 3, PAL.mid); R(ctx, x + 16, y + 15, 1, 1, PAL.mid);
    R(ctx, x + 17, y + 16, 1, 1, PAL.mid); R(ctx, x + 15, y + 17, 2, 1, PAL.deep);
    R(ctx, x + 21, y + 14, 2, 3, PAL.mid); R(ctx, x + 20, y + 17, 2, 1, PAL.light);
    /* Profilo della mascella a gradini: evita guancia circolare. */
    R(ctx, x + 20, y + 19, 1, 1, PAL.deep); R(ctx, x + 19, y + 20, 1, 1, PAL.ink);
    R(ctx, x + 18, y + 21, 2, 1, PAL.deep); R(ctx, x + 17, y + 22, 2, 1, PAL.mid);
    R(ctx, x + 12, y + 19, 4, 1, PAL.ink); R(ctx, x + 13, y + 20, 3, 1, PAL.mid);
    R(ctx, x + 13, y + 22, 5, 1, PAL.deep); R(ctx, x + 12, y + 23, 8, 2, PAL.paper);
    R(ctx, x + 13, y + 24, 9, 1, PAL.mid);
    R(ctx, x + 11, y + 25, 12, 1, PAL.deep); R(ctx, x + 12, y + 26, 10, 1, PAL.paper);
    /* Dither modellato: fronte e guancia, non rumore uniforme. */
    R(ctx, x + 8, y + 9, 1, 1, PAL.light); R(ctx, x + 9, y + 11, 1, 1, PAL.mid);
    R(ctx, x + 23, y + 12, 1, 1, PAL.deep); R(ctx, x + 21, y + 18, 1, 1, PAL.mid);
  }

  function drawCard(ctx, key, name, x, y) {
    key = resolve(name, key);
    if (!key) return null;
    x = Math.round(x == null ? 5 : x); y = Math.round(y == null ? 55 : y);
    /* Sagoma 40x47: chiude y104; y105 resta vuota prima del testo. */
    R(ctx, x + 3, y + 3, 37, 45, PAL.deep); R(ctx, x + 2, y + 2, 38, 43, PAL.deep);
    R(ctx, x + 1, y, 38, 47, PAL.paper); R(ctx, x, y + 1, 40, 45, PAL.paper);
    R(ctx, x + 2, y + 1, 36, 45, PAL.ink); R(ctx, x + 1, y + 2, 38, 43, PAL.ink);
    R(ctx, x + 3, y + 2, 34, 36, PAL.deep);
    if (key === 'cooper') drawCooperWell(ctx, x + 3, y + 2);
    else drawPortrait(ctx, key, x + 4, y + 3);
    var label = displayLabel(name, key, 36);
    var tw = 40;
    var ty = y + 38;
    R(ctx, x + 1, ty, tw - 2, 9, PAL.ink); R(ctx, x, ty + 1, tw, 7, PAL.ink);
    R(ctx, x + 2, ty + 1, tw - 4, 7, PAL.paper);
    drawMicro(ctx, label, x + Math.floor(tw / 2), ty + 3, PAL.ink, 36);
    return { x:x, y:y, width:tw, height:47, key:key, label:label };
  }

  GAME.Portraits = {
    palette: PAL, faces: FACES, aliases: ALIASES, labels: LABELS,
    resolve: resolve, draw: drawPortrait, drawCard: drawCard, frame: frame
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.Portraits;
})();
