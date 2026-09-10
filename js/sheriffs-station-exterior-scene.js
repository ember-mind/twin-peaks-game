/* sheriffs-station-exterior-scene.js — piazzale del distretto: geometria
 * nativa 16x12 fra il varco sud (verso town) e la porta nord (interno). */
(function () {
  'use strict';
  var G = (typeof window !== 'undefined' ? window : globalThis).GAME, MAP = 'sheriffs_station_exterior';
  var rows = [
    'TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT',
    'TTTTTTT..TTTTTTT','TT............TT','T..............T','T..............T','T..............T','TT............TT'
  ];
  // bacheca (avviso) sulla facciata: arte nativa a (150,82) in sheriffs-station-exterior-art.js
  // (noticeBoard), tile 16px -> colonna 9. Riga 6 (muro) e' l'unica cella percorribile
  // adiacente e' la riga 7 (dots): il giocatore interagisce da (9,7) guardando su.
  var map = { id: MAP, rows: rows, width: 16, height: 12, indoor: false, doors: {},
    objects: [{ x: 9, y: 6, dialogue: 'bacheca_centrale', type: 'plain' }], npcs: [] };
  var installed = false, originalTile, originalStructures, originalForeground, originalPaletteLimit;
  function isOwn(opts) { return opts && opts.mapId === MAP; }
  function install() {
    if (installed) return map;
    installed = true; G.Maps[MAP] = map;
    originalTile = G.Sprites.drawTile; originalStructures = G.sprites.drawStructures;
    originalForeground = G.sprites.drawForegroundStructures;
    originalPaletteLimit = G.Retro2D && G.Retro2D.limitBackgroundPalettes;
    G.Sprites.drawTile = function (ctx, ch, x, y, tx, ty, rs, opts) {
      if (isOwn(opts)) return; return originalTile.apply(this, arguments);
    };
    G.sprites.drawStructures = function (ctx, m, cx, cy, opts) {
      if (m && m.id === MAP) return G.SheriffsStationExteriorArt && G.SheriffsStationExteriorArt.draw(ctx, cx, cy);
      return originalStructures && originalStructures.apply(this, arguments);
    };
    G.sprites.drawForegroundStructures = function (ctx, m, cx, cy, opts) {
      opts = opts || {};
      if (m && m.id === MAP) return G.SheriffsStationExteriorArt && G.SheriffsStationExteriorArt.foreground(ctx, cx, cy, opts.forestDepthMin, opts.forestDepthMax);
      return originalForeground && originalForeground.apply(this, arguments);
    };
    if (originalPaletteLimit) G.Retro2D.limitBackgroundPalettes = function (ctx,cx,cy,vw,vh,mapId) {
      if (mapId === MAP) return; return originalPaletteLimit.apply(this, arguments);
    };
    return map;
  }
  G.SheriffsStationExteriorScene = { map: map, mapId: MAP, install: install };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.SheriffsStationExteriorScene;
})();
