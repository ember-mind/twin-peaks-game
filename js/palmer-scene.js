(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var MAP = 'palmer';

  /* Furniture cells are the single source of truth for this room's collision
   * silhouette.  The art module mirrors these named footprints and derives
   * every foreground depth from the occupied row's south edge.  The glyph is
   * the one js/maps.js already publishes for that cell: this module never
   * changes the canonical geometry, it only fails loudly if it moves. */
  var footprints = {
    lauraBed: { glyph: 'K', cells: [[1, 1], [2, 1]] },
    lauraDresser: { glyph: 'U', cells: [[6, 1]] },
    sofa: { glyph: 't', cells: [[3, 6]] },
    sideboard: { glyph: 'U', cells: [[14, 6]] },
    diningTable: { glyph: 't', cells: [[2, 8], [3, 8]] },
    diningChairs: { glyph: 'h', cells: [[2, 9], [3, 9]] }
  };

  /* Il tappeto del soggiorno e' calpestabile: e' il centro della stanza, dove
   * Sarah sta in piedi (9,7). Non e' arredo, e' pavimento. */
  var rug = { x0: 6, x1: 10, y0: 6, y1: 8 };

  function authoredRows() {
    var cells = [], rows = [], x, y, key, part, spec;
    for (y = 0; y < 12; y++) {
      cells[y] = [];
      for (x = 0; x < 16; x++) {
        if (y === 0 || y === 11 || x === 0 || x === 15) cells[y][x] = 'i';
        else if (y === 4) cells[y][x] = (x === 4 || x === 5) ? 'f' : 'i';
        else if (x >= rug.x0 && x <= rug.x1 && y >= rug.y0 && y <= rug.y1) cells[y][x] = 'c';
        else cells[y][x] = 'f';
      }
    }
    for (key in footprints) {
      if (!Object.prototype.hasOwnProperty.call(footprints, key)) continue;
      spec = footprints[key];
      for (part = 0; part < spec.cells.length; part++) {
        x = spec.cells[part][0]; y = spec.cells[part][1];
        cells[y][x] = spec.glyph;
      }
    }
    /* Porta d'ingresso sul muro sud: le due celle della connessione
     * town-palmer-house. */
    cells[11][7] = 'D'; cells[11][8] = 'D';
    for (y = 0; y < cells.length; y++) rows.push(cells[y].join(''));
    return rows;
  }

  var targets = {
    entrance: { x: 7, y: 10 },
    exit: { x: 7, y: 11 },
    exitEast: { x: 8, y: 11 },
    rugCenter: { x: 8, y: 7 },
    sarah: { x: 9, y: 7 },
    sofaSide: { x: 4, y: 6 },
    sideboard: { x: 13, y: 6 },
    diningSide: { x: 4, y: 8 },
    window: { x: 1, y: 8 },
    stairFoot: { x: 4, y: 5 },
    landing: { x: 4, y: 4 },
    lauraRoom: { x: 5, y: 3 },
    lauraBedFoot: { x: 2, y: 2 },
    lauraDresser: { x: 6, y: 2 },
    center: { x: 7, y: 7 }
  };

  /* La geometria canonica vive in js/maps.js (mappa 'palmer'): qui la
   * rigeneriamo solo per poter fallire rumorosamente se le due divergono. */
  var rows = authoredRows();

  var installed = false;
  var originalTile, originalStructures, originalForeground, originalPaletteLimit;
  function isOwn(opts) { return opts && opts.mapId === MAP; }

  function install() {
    if (installed) return GAME.Maps[MAP];
    installed = true;
    GAME.Maps = GAME.Maps || {};
    var map = GAME.Maps[MAP];
    /* glue.js possiede il record della mappa (porte/oggetti/NPC narrativi):
     * qui non lo sostituiamo, verifichiamo solo che la geometria authored e
     * quella pubblicata da maps.js siano la stessa cosa. */
    if (!map) throw new Error('PalmerScene: map "' + MAP + '" is missing');
    if ((map.rows || []).join('\n') !== rows.join('\n')) {
      throw new Error('PalmerScene: map "' + MAP + '" geometry diverges from the authored footprints');
    }
    if (!Number.isInteger(map.width)) map.width = 16;
    if (!Number.isInteger(map.height)) map.height = 12;
    if (map.indoor === undefined) map.indoor = true;

    originalTile = GAME.Sprites && GAME.Sprites.drawTile;
    originalStructures = GAME.sprites && GAME.sprites.drawStructures;
    originalForeground = GAME.sprites && GAME.sprites.drawForegroundStructures;
    originalPaletteLimit = GAME.Retro2D && GAME.Retro2D.limitBackgroundPalettes;

    if (GAME.Sprites) GAME.Sprites.drawTile = function (ctx, ch, x, y, tx, ty, rs, opts) {
      if (isOwn(opts)) return;
      return originalTile && originalTile.apply(this, arguments);
    };
    if (GAME.sprites) GAME.sprites.drawStructures = function (ctx, m, cx, cy, opts) {
      if (m && m.id === MAP) {
        return GAME.PalmerArt && GAME.PalmerArt.draw(ctx, cx, cy);
      }
      return originalStructures && originalStructures.apply(this, arguments);
    };
    if (GAME.sprites) GAME.sprites.drawForegroundStructures = function (ctx, m, cx, cy, opts) {
      opts = opts || {};
      if (m && m.id === MAP) {
        return GAME.PalmerArt && GAME.PalmerArt.foreground(
          ctx, cx, cy, opts.forestDepthMin, opts.forestDepthMax
        );
      }
      return originalForeground && originalForeground.apply(this, arguments);
    };
    if (originalPaletteLimit) GAME.Retro2D.limitBackgroundPalettes = function (ctx, cx, cy, vw, vh, mapId) {
      if (mapId === MAP) return;
      return originalPaletteLimit.apply(this, arguments);
    };
    return map;
  }

  function uninstall() {
    if (!installed) return;
    installed = false;
    if (GAME.Sprites && originalTile) GAME.Sprites.drawTile = originalTile;
    if (GAME.sprites && originalStructures) GAME.sprites.drawStructures = originalStructures;
    if (GAME.sprites && originalForeground) GAME.sprites.drawForegroundStructures = originalForeground;
    if (GAME.Retro2D && originalPaletteLimit) GAME.Retro2D.limitBackgroundPalettes = originalPaletteLimit;
  }

  GAME.PalmerScene = {
    rows: rows,
    mapId: MAP,
    footprints: footprints,
    rug: rug,
    targets: targets,
    install: install,
    uninstall: uninstall,
    layout: { footprints: footprints, targets: targets }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.PalmerScene;
})();
