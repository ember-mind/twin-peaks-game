/* ember-pixel.js — Ember Engine: the pixel rectangle and the bitmap lettering.
 *
 * Game-independent by construction: no GAME namespace, no map ids, no story
 * state. Moved here unchanged from the Twin Peaks renderer (js/retro-authored.js),
 * which now draws through it; Living Town's rooms letter themselves with the
 * same glyphs. The narrow tables carry only the letters the first signs
 * needed and the micro/tiny/compact writers skip what they lack, exactly as
 * before; word() and signWord() use the complete alphabet, fold accents, and
 * never omit silently: an unsupported character is drawn as a box and counted
 * in unsupportedGlyphs.
 */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : global;
  var EMBER = root.EMBER = root.EMBER || {};
  var P = EMBER.Pixel = EMBER.Pixel || {};

  function R(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  var TOWN_FONT_5X7 = {
    A:['01110','10001','10001','11111','10001','10001','10001'],
    B:['11110','10001','10001','11110','10001','10001','11110'],
    D:['11110','10001','10001','10001','10001','10001','11110'],
    E:['11111','10000','10000','11110','10000','10000','11111'],
    F:['11111','10000','10000','11110','10000','10000','10000'],
    G:['01110','10001','10000','10111','10001','10001','01110'],
    H:['10001','10001','10001','11111','10001','10001','10001'],
    I:['11111','00100','00100','00100','00100','00100','11111'],
    K:['10001','10010','10100','11000','10100','10010','10001'],
    N:['10001','11001','11001','10101','10011','10011','10001'],
    O:['01110','10001','10001','10001','10001','10001','01110'],
    P:['11110','10001','10001','11110','10000','10000','10000'],
    R:['11110','10001','10001','11110','10100','10010','10001'],
    S:['01111','10000','10000','01110','00001','00001','11110'],
    T:['11111','00100','00100','00100','00100','00100','00100'],
    U:['10001','10001','10001','10001','10001','10001','01110'],
    L:['10000','10000','10000','10000','10000','10000','11111'],
    W:['10001','10001','10001','10101','10101','10101','01010']
  };

  function townTinyWord(g, value, x, y, color) {
    for (var ci = 0; ci < value.length; ci++) {
      var glyph = TOWN_FONT_5X7[value.charAt(ci)];
      if (!glyph) continue;
      for (var gy = 0; gy < 7; gy++) for (var gx = 0; gx < 5; gx++) {
        if (glyph[gy].charAt(gx) === '1') R(g, x + ci * 6 + gx, y + gy, 1, 1, color);
      }
    }
  }

  var TOWN_FONT_4X5 = {
    B:['1110','1001','1110','1001','1110'], E:['1111','1000','1110','1000','1111'],
    H:['1001','1001','1111','1001','1001'], K:['1001','1010','1100','1010','1001'],
    O:['0110','1001','1001','1001','0110'], S:['0111','1000','0110','0001','1110'],
    U:['1001','1001','1001','1001','0110']
  };

  function townCompactWord(g, value, x, y, color) {
    for (var ci = 0; ci < value.length; ci++) {
      var glyph = TOWN_FONT_4X5[value.charAt(ci)];
      if (!glyph) continue;
      for (var gy = 0; gy < 5; gy++) for (var gx = 0; gx < 4; gx++) {
        if (glyph[gy].charAt(gx) === '1') R(g, x + ci * 5 + gx, y + gy, 1, 1, color);
      }
    }
  }

  var TOWN_FONT_3X5 = {
    A:['010','101','111','101','101'], M:['101','111','111','101','101'],
    '0':['111','101','101','101','111'], '2':['110','001','010','100','111'],
    '3':['110','001','010','001','110'], '5':['111','100','110','001','110'],
    '.':['000','000','000','000','010'], Y:['101','101','010','010','010'],
    B:['110','101','110','101','110'], C:['011','100','100','100','011'], D:['110','101','101','101','110'],
    F:['111','100','110','100','100'],
    E:['111','100','110','100','111'], L:['100','100','100','100','111'],
    H:['101','101','111','101','101'], I:['111','010','010','010','111'], N:['101','111','111','111','101'],
    O:['010','101','101','101','010'], P:['110','101','110','100','100'], R:['110','101','110','101','101'],
    S:['011','100','010','001','110'], T:['111','010','010','010','010'],
    U:['101','101','101','101','111']
  };

  /* ---- lettering for rooms composed elsewhere ----------------------------
   * The two town fonts carry only the letters this game's own signs needed,
   * and townMicroWord skips what it lacks without saying so. Those tables and
   * that behaviour are left exactly as they are, so nothing already painted
   * changes. Lettering asked for through the kit uses the same glyphs plus
   * the rest of the alphabet and digits below, folds accents explicitly, and
   * never omits silently: an unsupported character is drawn as a box and
   * listed in GAME.Retro2D.unsupportedGlyphs. */
  var TOWN_FONT_5X7_EXT = {
    C:['01110','10001','10000','10000','10000','10001','01110'],
    J:['00111','00010','00010','00010','00010','10010','01100'],
    M:['10001','11011','10101','10101','10001','10001','10001'],
    Q:['01110','10001','10001','10001','10101','10010','01101'],
    V:['10001','10001','10001','10001','10001','01010','00100'],
    X:['10001','10001','01010','00100','01010','10001','10001'],
    Y:['10001','10001','01010','00100','00100','00100','00100'],
    Z:['11111','00001','00010','00100','01000','10000','11111']
  };
  var TOWN_FONT_3X5_EXT = {
    G:['011','100','101','101','011'], J:['001','001','001','101','010'],
    K:['101','101','110','101','101'], Q:['010','101','101','111','011'],
    V:['101','101','101','101','010'], W:['101','101','111','111','101'],
    X:['101','101','010','101','101'], Z:['111','001','010','100','111'],
    '1':['010','110','010','010','111'], '4':['101','101','111','001','001'],
    '6':['011','100','110','101','010'], '7':['111','001','010','010','010'],
    '8':['010','101','010','101','010'], '9':['010','101','011','001','110'],
    '-':['000','000','111','000','000'], "'":['010','010','000','000','000']
  };
  var ACCENT_FOLD = { 'À':'A','Á':'A','Â':'A','Ä':'A','È':'E','É':'E','Ê':'E','Ë':'E','Ì':'I','Í':'I','Î':'I','Ï':'I',
    'Ò':'O','Ó':'O','Ô':'O','Ö':'O','Ù':'U','Ú':'U','Û':'U','Ü':'U','Ç':'C','Ñ':'N' };
  var UNSUPPORTED_5X7 = ['11111','10001','10001','10001','10001','10001','11111'];
  var UNSUPPORTED_3X5 = ['111','101','101','101','111'];
  var unsupportedGlyphs = {};
  function kitGlyph(ch, base, ext, missing) {
    ch = String(ch).toUpperCase();
    if (ACCENT_FOLD[ch]) ch = ACCENT_FOLD[ch];
    if (base[ch]) return base[ch];
    if (ext[ch]) return ext[ch];
    unsupportedGlyphs[ch] = (unsupportedGlyphs[ch] || 0) + 1;
    return missing;
  }
  /* What the kit cannot letter, without drawing anything: for content checks. */
  function kitUnsupported(text, size) {
    var base = size === 'sign' ? TOWN_FONT_5X7 : TOWN_FONT_3X5, ext = size === 'sign' ? TOWN_FONT_5X7_EXT : TOWN_FONT_3X5_EXT;
    return String(text).toUpperCase().split('').filter(function (ch) {
      ch = ACCENT_FOLD[ch] || ch;
      return ch !== ' ' && !base[ch] && !ext[ch];
    });
  }
  function interiorSignWord(g, value, x, y, color) {
    var cursor = x;
    for (var ci = 0; ci < value.length; ci++) {
      if (value.charAt(ci) === ' ') { cursor += 4; continue; }
      var glyph = kitGlyph(value.charAt(ci), TOWN_FONT_5X7, TOWN_FONT_5X7_EXT, UNSUPPORTED_5X7);
      for (var gy = 0; gy < 7; gy++) for (var gx = 0; gx < 5; gx++) {
        if (glyph[gy].charAt(gx) === '1') R(g, cursor + gx, y + gy, 1, 1, color);
      }
      cursor += 6;
    }
    return cursor - x;
  }
  function interiorWord(g, value, x, y, color) {
    var cursor = x;
    for (var ci = 0; ci < value.length; ci++) {
      if (value.charAt(ci) === ' ') { cursor += 2; continue; }
      var glyph = kitGlyph(value.charAt(ci), TOWN_FONT_3X5, TOWN_FONT_3X5_EXT, UNSUPPORTED_3X5);
      for (var gy = 0; gy < 5; gy++) for (var gx = 0; gx < 3; gx++) {
        if (glyph[gy].charAt(gx) === '1') R(g, cursor + gx, y + gy, 1, 1, color);
      }
      cursor += 4;
    }
    return cursor - x;
  }

  function townMicroWord(g, value, x, y, color) {
    var cursor = x;
    for (var ci = 0; ci < value.length; ci++) {
      var glyph = TOWN_FONT_3X5[value.charAt(ci)];
      if (!glyph) { cursor += 2; continue; }
      for (var gy = 0; gy < 5; gy++) for (var gx = 0; gx < 3; gx++) {
        if (glyph[gy].charAt(gx) === '1') R(g, cursor + gx, y + gy, 1, 1, color);
      }
      cursor += 4;
    }
  }

  P.rect = R;
  P.font5x7 = TOWN_FONT_5X7;
  P.tinyWord = townTinyWord;
  P.font4x5 = TOWN_FONT_4X5;
  P.compactWord = townCompactWord;
  P.font3x5 = TOWN_FONT_3X5;
  P.font5x7Ext = TOWN_FONT_5X7_EXT;
  P.font3x5Ext = TOWN_FONT_3X5_EXT;
  P.accentFold = ACCENT_FOLD;
  P.missing5x7 = UNSUPPORTED_5X7;
  P.missing3x5 = UNSUPPORTED_3X5;
  P.unsupportedGlyphs = unsupportedGlyphs;
  P.glyph = kitGlyph;
  P.unsupported = kitUnsupported;
  P.signWord = interiorSignWord;
  P.word = interiorWord;
  P.microWord = townMicroWord;
})();
