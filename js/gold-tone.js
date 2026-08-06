/* gold-tone.js — master palette oliva/crema del mockup approvato.
 * Quantizza solo scene diurne dopo compositing: tile, sprite e strutture
 * conservano forme/collisioni, ma rosa e grigi non spezzano art direction.
 */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var PAL = ['#183225', '#31543a', '#63834a', '#a8be72', '#d9d49a', '#f5efcf'];
  var RGB = [[24,50,37], [49,84,58], [99,131,74], [168,190,114], [217,212,154], [245,239,207]];
  var EXEMPT = { woods:true, blacklodge:true, oej:true };
  var cache = Object.create(null);

  function choose(r, g, b) {
    var key = (r << 16) | (g << 8) | b;
    if (cache[key] !== undefined) return cache[key];
    var hi = Math.max(r, g, b), lo = Math.min(r, g, b);
    var lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    var green = g > r * 0.96 && g > b * 1.08;
    var pink = r > g * 1.10 && b > g * 0.92;
    var idx;
    if (lum < 48) idx = 0;
    else if (lum < 92) idx = 1;
    else if (pink && lum > 155) idx = 4;
    else if (pink && lum > 108) idx = 2;
    else if (green && lum > 185) idx = 4;      // prato chiaro -> suolo crema del concept
    else if (green && lum > 150) idx = 3;
    else if (green && lum > 105) idx = 2;
    else if (green) idx = 1;
    else if (lum > 228) idx = 5;
    else if (lum > 198) idx = 4;
    else if (lum > 146) idx = (hi - lo < 35 ? 3 : 2);
    else if (lum > 100) idx = 2;
    else idx = 1;
    cache[key] = idx;
    return idx;
  }

  /* Su hardware Gen II BG e OBJ hanno palette separate: una passata sul BG non
   * tocca gli sprite. Qui la quantizzazione avviene dopo il compositing, quindi
   * i toni dichiarati dagli OBJ (js/retro-authored.js -> GAME.Retro2D.objTones)
   * vengono lasciati passare intatti. Senza questo, l'incarnato collassava sullo
   * stesso valore del terreno: personaggio invisibile di giorno. */
  function objKeys() {
    var t = GAME.Retro2D && GAME.Retro2D.objTones, k, hex, out = Object.create(null);
    if (!t) return null;
    for (k in t) {
      hex = k.charAt(0) === '#' ? k.slice(1) : k;
      if (hex.length === 6) out[parseInt(hex, 16)] = true;
    }
    return out;
  }

  function apply(ctx, width, height, mapId) {
    if (!ctx || !ctx.getImageData || !ctx.putImageData || EXEMPT[mapId]) return false;
    var img;
    try { img = ctx.getImageData(0, 0, width, height); }
    catch (_) { return false; }
    var d = img.data, i, c, keep = objKeys();
    for (i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      if (keep && keep[(d[i] << 16) | (d[i + 1] << 8) | d[i + 2]]) continue;
      c = RGB[choose(d[i], d[i + 1], d[i + 2])];
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
    }
    ctx.putImageData(img, 0, 0);
    return true;
  }

  GAME.GoldTone = { palette:PAL, exempt:EXEMPT, apply:apply };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.GoldTone;
})();
