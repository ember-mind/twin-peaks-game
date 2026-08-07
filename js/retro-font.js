/* retro-font.js — font bitmap proporzionale nello stile Gen II.
 * Glyph 5x7, minuscole reali, scala intera, wrap senza CanvasText API. */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};

  var FONT = {
    'A':['01110','10001','10001','11111','10001','10001','10001'],
    'B':['11110','10001','10001','11110','10001','10001','11110'],
    'C':['01111','10000','10000','10000','10000','10000','01111'],
    'D':['11110','10001','10001','10001','10001','10001','11110'],
    'E':['11111','10000','10000','11110','10000','10000','11111'],
    'F':['11111','10000','10000','11110','10000','10000','10000'],
    'G':['01111','10000','10000','10111','10001','10001','01111'],
    'H':['10001','10001','10001','11111','10001','10001','10001'],
    'I':['11111','00100','00100','00100','00100','00100','11111'],
    'J':['00111','00010','00010','00010','10010','10010','01100'],
    'K':['10001','10010','10100','11000','10100','10010','10001'],
    'L':['10000','10000','10000','10000','10000','10000','11111'],
    'M':['10001','11011','10101','10101','10001','10001','10001'],
    'N':['10001','11001','10101','10011','10001','10001','10001'],
    'O':['01110','10001','10001','10001','10001','10001','01110'],
    'P':['11110','10001','10001','11110','10000','10000','10000'],
    'Q':['01110','10001','10001','10001','10101','10010','01101'],
    'R':['11110','10001','10001','11110','10100','10010','10001'],
    'S':['01111','10000','10000','01110','00001','00001','11110'],
    'T':['11111','00100','00100','00100','00100','00100','00100'],
    'U':['10001','10001','10001','10001','10001','10001','01110'],
    'V':['10001','10001','10001','10001','10001','01010','00100'],
    'W':['10001','10001','10001','10101','10101','10101','01010'],
    'X':['10001','10001','01010','00100','01010','10001','10001'],
    'Y':['10001','10001','01010','00100','00100','00100','00100'],
    'Z':['11111','00001','00010','00100','01000','10000','11111'],
    'a':['00000','00000','01110','00001','01111','10001','01111'],
    'b':['10000','10000','10110','11001','10001','10001','11110'],
    'c':['00000','00000','01111','10000','10000','10000','01111'],
    'd':['00001','00001','01101','10011','10001','10001','01111'],
    'e':['00000','00000','01110','10001','11111','10000','01111'],
    'f':['00110','01001','01000','11100','01000','01000','01000'],
    'g':['00000','00000','01111','10001','01111','00001','11110'],
    'h':['10000','10000','10110','11001','10001','10001','10001'],
    'i':['00100','00000','01100','00100','00100','00100','01110'],
    'j':['00010','00000','00110','00010','00010','10010','01100'],
    'k':['10000','10000','10010','10100','11000','10100','10010'],
    'l':['01100','00100','00100','00100','00100','00100','01110'],
    'm':['00000','00000','11010','10101','10101','10101','10101'],
    'n':['00000','00000','10110','11001','10001','10001','10001'],
    'o':['00000','00000','01110','10001','10001','10001','01110'],
    'p':['00000','00000','11110','10001','11110','10000','10000'],
    'q':['00000','00000','01111','10001','01111','00001','00001'],
    'r':['00000','00000','10110','11001','10000','10000','10000'],
    's':['00000','00000','01111','10000','01110','00001','11110'],
    't':['01000','01000','11100','01000','01000','01001','00110'],
    'u':['00000','00000','10001','10001','10001','10011','01101'],
    'v':['00000','00000','10001','10001','10001','01010','00100'],
    'w':['00000','00000','10001','10001','10101','10101','01010'],
    'x':['00000','00000','10001','01010','00100','01010','10001'],
    'y':['00000','00000','10001','10001','01111','00001','11110'],
    'z':['00000','00000','11111','00010','00100','01000','11111'],
    '0':['01110','10001','10011','10101','11001','10001','01110'],
    '1':['00100','01100','00100','00100','00100','00100','01110'],
    '2':['01110','10001','00001','00010','00100','01000','11111'],
    '3':['11110','00001','00001','01110','00001','00001','11110'],
    '4':['00010','00110','01010','10010','11111','00010','00010'],
    '5':['11111','10000','10000','11110','00001','00001','11110'],
    '6':['01110','10000','10000','11110','10001','10001','01110'],
    '7':['11111','00001','00010','00100','01000','01000','01000'],
    '8':['01110','10001','10001','01110','10001','10001','01110'],
    '9':['01110','10001','10001','01111','00001','00001','01110'],
    '.':['00000','00000','00000','00000','00000','00110','00110'],
    ',':['00000','00000','00000','00000','00110','00110','00100'],
    ':':['00000','00110','00110','00000','00110','00110','00000'],
    ';':['00000','00110','00110','00000','00110','00110','00100'],
    '!':['00100','00100','00100','00100','00100','00000','00100'],
    '?':['01110','10001','00001','00010','00100','00000','00100'],
    '"':['01010','01010','00000','00000','00000','00000','00000'],
    "'":['00100','00100','00000','00000','00000','00000','00000'],
    '-':['00000','00000','00000','11111','00000','00000','00000'],
    '/':['00001','00010','00010','00100','01000','01000','10000'],
    '(':['00010','00100','01000','01000','01000','00100','00010'],
    ')':['01000','00100','00010','00010','00010','00100','01000'],
    '[':['01110','01000','01000','01000','01000','01000','01110'],
    ']':['01110','00010','00010','00010','00010','00010','01110'],
    '+':['00000','00100','00100','11111','00100','00100','00000'],
    '=':['00000','11111','00000','11111','00000','00000','00000'],
    '>':['10000','01000','00100','00010','00100','01000','10000'],
    '<':['00001','00010','00100','01000','00100','00010','00001'],
    '^':['00100','01010','10001','00000','00000','00000','00000'],
    '▼':['00000','00000','10001','01010','01010','00100','00000'],
    '▲':['00000','00100','01010','01010','10001','00000','00000'],
    ' ':['00000','00000','00000','00000','00000','00000','00000']
  };

  function clean(value) {
    var raw = String(value == null ? '' : value)
      .replace(/[«»]/g, '').replace(/[’‘]/g, "'").replace(/[—–]/g, '-')
      .replace(/›/g, '>').replace(/▶/g, '>')
      .replace(/·/g, '.').replace(/×/g, 'X');
    raw = raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
    return raw;
  }

  function metrics(ch) {
    if (ch === ' ') return { min: 0, width: 3, advance: 4 };
    var rows = FONT[ch] || FONT['?'], min = 5, max = -1, y, x;
    for (y = 0; y < 7; y++) for (x = 0; x < 5; x++) if (rows[y].charAt(x) === '1') {
      if (x < min) min = x; if (x > max) max = x;
    }
    if (max < min) return { min: 0, width: 3, advance: 4 };
    return { min: min, width: max - min + 1, advance: max - min + 2 };
  }

  function glyph(ctx, ch, x, y, color, scale) {
    var rows = FONT[ch] || FONT['?'], met = metrics(ch), yy, xx;
    scale = Math.max(1, Math.floor(scale || 1));
    ctx.fillStyle = color || '#183225';
    for (yy = 0; yy < 7; yy++) for (xx = 0; xx < 5; xx++) {
      if (rows[yy].charAt(xx) === '1') ctx.fillRect(Math.round(x) + (xx - met.min) * scale, Math.round(y) + yy * scale, scale, scale);
    }
  }

  function measure(value, scale) {
    var s = clean(value), n = s.length, total = 0, i;
    scale = Math.max(1, Math.floor(scale || 1));
    for (i = 0; i < n; i++) total += metrics(s.charAt(i)).advance;
    return n ? (total - 1) * scale : 0;
  }

  function draw(ctx, value, x, y, color, opts) {
    opts = opts || {};
    var scale = Math.max(1, Math.floor(opts.scale || 1));
    var str = clean(value);
    if (opts.maxChars) str = str.slice(0, opts.maxChars);
    var width = measure(str, scale), ox = Math.round(x);
    if (opts.align === 'center') ox = Math.round(x - width / 2);
    else if (opts.align === 'right') ox = Math.round(x - width);
    var cursor = ox;
    for (var i = 0; i < str.length; i++) {
      glyph(ctx, str.charAt(i), cursor, Math.round(y), color, scale);
      cursor += metrics(str.charAt(i)).advance * scale;
    }
    return { x: ox, width: width, height: 7 * scale };
  }

  /* Dialoghi Gen II: cella fissa 6x8. Il disegno usa 5 colonne authored,
   * sesta colonna come spazio; niente trim/kerning proporzionale. */
  function drawFixed(ctx, value, x, y, color, opts) {
    opts = opts || {};
    var scale = Math.max(1, Math.floor(opts.scale || 1));
    var str = clean(value), ox = Math.round(x), yy, xx, i, rows;
    if (opts.maxChars) str = str.slice(0, opts.maxChars);
    ctx.fillStyle = color || '#183225';
    for (i = 0; i < str.length; i++) {
      rows = FONT[str.charAt(i)] || FONT['?'];
      for (yy = 0; yy < 7; yy++) for (xx = 0; xx < 5; xx++) {
        if (rows[yy].charAt(xx) === '1') ctx.fillRect(ox + (i * 6 + xx) * scale, Math.round(y) + yy * scale, scale, scale);
      }
    }
    return { x: ox, width: str.length ? (str.length * 6 - 1) * scale : 0, height: 8 * scale };
  }

  function wrapFixed(value, maxWidth, scale) {
    scale = Math.max(1, Math.floor(scale || 1));
    return wrapChars(value, Math.max(1, Math.floor((maxWidth + scale) / (6 * scale))));
  }

  /* Due righe con peso visivo simile. Mantiene parole, capienza Gen II e
   * spezzature di parole molto lunghe gia' prodotte da wrapChars. */
  function balanceFixedPair(value, chars) {
    chars = Math.max(1, Math.floor(chars || 24));
    var lines = (Array.isArray(value) ? value : wrapChars(value, chars)).slice(0, 2).map(clean);
    if (lines.length !== 2 || !lines[0] || !lines[1]) return lines;
    if (lines[0].indexOf(' ') < 0 && !/[.!?;:,'")\]]$/.test(lines[0])) return lines;
    var words = (lines[0] + ' ' + lines[1]).replace(/\s+/g, ' ').trim().split(' ');
    var best = null, bestScore = Infinity;
    for (var i = 1; i < words.length; i++) {
      var left = words.slice(0, i).join(' '), right = words.slice(i).join(' ');
      if (left.length > chars || right.length > chars) continue;
      var score = Math.abs(left.length - right.length) * 10 + (left.length < right.length ? 1 : 0);
      if (score < bestScore) { best = [left, right]; bestScore = score; }
    }
    return best || lines;
  }

  function wrapChars(value, chars) {
    chars = Math.max(1, Math.floor(chars));
    var paras = clean(value).split(/\n/), lines = [];
    paras.forEach(function (para) {
      var words = para.replace(/\s+/g, ' ').trim().split(' '), line = '';
      if (!para.trim()) { lines.push(''); return; }
      words.forEach(function (word) {
        while (word.length > chars) {
          if (line) { lines.push(line); line = ''; }
          lines.push(word.slice(0, chars)); word = word.slice(chars);
        }
        var next = line ? line + ' ' + word : word;
        if (line && next.length > chars) { lines.push(line); line = word; }
        else line = next;
      });
      if (line) lines.push(line);
    });
    return lines;
  }

  function wrapPixels(value, maxWidth, scale) {
    scale = Math.max(1, Math.floor(scale || 1));
    var paras = clean(value).split(/\n/), lines = [];
    paras.forEach(function (para) {
      var words = para.replace(/\s+/g, ' ').trim().split(' '), line = '';
      if (!para.trim()) { lines.push(''); return; }
      words.forEach(function (word) {
        var next = line ? line + ' ' + word : word;
        if (line && measure(next, scale) > maxWidth) { lines.push(line); line = word; }
        else line = next;
        while (measure(line, scale) > maxWidth && line.length > 1) {
          var cut = line.length - 1;
          while (cut > 1 && measure(line.slice(0, cut), scale) > maxWidth) cut--;
          lines.push(line.slice(0, cut)); line = line.slice(cut);
        }
      });
      if (line) lines.push(line);
    });
    return lines;
  }

  function fit(value, maxWidth, scale) {
    var str = clean(value), suffix = '...';
    while (str.length && measure(str + suffix, scale) > maxWidth) str = str.slice(0, -1);
    return measure(str, scale) <= maxWidth ? (str === clean(value) ? str : str + suffix) : '';
  }

  function frame(ctx, x, y, w, h) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    /* Cornice Gen II a pixel interi: 2 ink, 2 white moat, 1 ink. */
    ctx.fillStyle = '#181818'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fffdf0'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = '#181818'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.fillStyle = '#fffdf0'; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
  }

  GAME.RetroFont = {
    FONT: FONT, clean: clean, glyph: glyph, draw: draw, drawFixed: drawFixed, measure: measure,
    wrapChars: wrapChars, wrapPixels: wrapPixels, wrapFixed: wrapFixed,
    balanceFixedPair: balanceFixedPair, fit: fit, frame: frame,
    palette: { ink:'#181818', dark:'#383838', mid:'#777777', grass:'#9abf5a', paper:'#fffdf0' }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.RetroFont;
})();
