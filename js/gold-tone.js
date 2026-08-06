/* gold-tone.js — master palette R69 ricavata dalla reference approvata.
 * Sei famiglie oliva/crema, nessuna rampa cromatica estranea. La passata
 * avviene dopo il compositing e quindi unifica BG, OBJ e UI del mondo nello
 * stesso display monocromatico, come il mockup consegnato.
 */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var PAL = ['#072619', '#34572d', '#6a8a43', '#9aab69', '#dcd9a9', '#eee6b5'];
  var RGB = PAL.map(function (hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  });
  /* La reference chiede una direzione unitaria per l'intera esperienza.
   * Red Room inclusa: cambia la composizione, non il display. */
  var FILTERED = {
    arrival:true, town:true, sheriff:true, palmer:true, hotel_gn:true, hospital:true,
    diner:true, woods:true, redroom:true, roadhouse:true, traincar:true,
    oej:true
  };
  var cache = Object.create(null);

  function choose(r, g, b) {
    var key = (r << 16) | (g << 8) | b;
    if (cache[key] !== undefined) return cache[key];
    var lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    var idx;
    if (lum < 48) idx = 0;
    else if (lum < 96) idx = 1;
    else if (lum < 154) idx = 2;
    else if (lum < 196) idx = 3;
    else if (lum < 224) idx = 4;
    else idx = 5;
    cache[key] = idx;
    return idx;
  }

  function apply(ctx, width, height, mapId) {
    if (!ctx || !ctx.getImageData || !ctx.putImageData || !FILTERED[mapId]) return false;
    var img;
    try { img = ctx.getImageData(0, 0, width, height); }
    catch (_) { return false; }
    var d = img.data, i, c;
    for (i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      c = RGB[choose(d[i], d[i + 1], d[i + 2])];
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
    }
    /* Reference: caduta continua ai bordi del mondo hero. Niente rumore
     * perimetrale: bande indicizzate da 1 px, assorbite dalle masse scure
     * della foresta e impercettibili sul centro crema. */
    if (mapId === 'arrival') {
      for (var y = 0; y < Math.min(95, height); y++) for (var x = 0; x < width; x++) {
        var edge = Math.min(x, width - 1 - x);
        if (edge >= 3) continue;
        var p = (y * width + x) * 4, pi = choose(d[p], d[p + 1], d[p + 2]);
        c = RGB[Math.max(0, pi - (edge === 0 ? 2 : 1))];
        d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
      }
    }
    ctx.putImageData(img, 0, 0);
    return true;
  }

  function atmosphere(ctx, width, height, mapId) {
    if (mapId !== 'arrival' || !ctx || !ctx.getImageData || !ctx.putImageData) return false;
    var img;
    try { img = ctx.getImageData(0, 0, width, height); } catch (_) { return false; }
    var d = img.data;
    for (var y = 0; y < height; y++) for (var x = 0; x < width; x++) {
      var edge = Math.min(x, width - 1 - x, y, height - 1 - y);
      if (edge > 0) continue;
      var p = (y * width + x) * 4, pi = choose(d[p], d[p + 1], d[p + 2]);
      var c = RGB[Math.max(0, pi - 1)]; d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
    }
    ctx.putImageData(img, 0, 0); return true;
  }

  GAME.GoldTone = { palette:PAL, filtered:FILTERED, apply:apply, atmosphere:atmosphere };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.GoldTone;
})();
