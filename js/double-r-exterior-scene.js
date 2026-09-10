(function () {
  'use strict';
  var G = window.GAME, MAP = 'double_r_exterior_prototype';
  var rows = [
    'TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT',
    'TTTTTT..TTTTTTTT','TTTTT....TTTT.TT','T.............TT','T.TT......TT...T','T..............T','TT............TT'
  ];
  var map = { id: MAP, rows: rows, width: 16, height: 12, indoor: false, doors: {}, objects: [], npcs: [] };
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
      if (m && m.id === MAP) return G.DoubleRExteriorArt && G.DoubleRExteriorArt.draw(ctx, cx, cy);
      return originalStructures && originalStructures.apply(this, arguments);
    };
    G.sprites.drawForegroundStructures = function (ctx, m, cx, cy, opts) {
      if (m && m.id === MAP) return G.DoubleRExteriorArt && G.DoubleRExteriorArt.foreground(ctx, cx, cy, opts.forestDepthMin, opts.forestDepthMax);
      return originalForeground && originalForeground.apply(this, arguments);
    };
    if (originalPaletteLimit) G.Retro2D.limitBackgroundPalettes = function (ctx,cx,cy,vw,vh,mapId) {
      if (mapId === MAP) return; return originalPaletteLimit.apply(this, arguments);
    };
    return map;
  }
  G.DoubleRExteriorScene = { map: map, mapId: MAP, install: install };
})();
