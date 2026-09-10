(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var MAP = 'room_315';

  /* Furniture cells are the single source of truth for this room's collision
   * silhouette.  The art module mirrors these named footprints and derives
   * every foreground depth from the occupied row's south edge. */
  var footprints = {
    bed: [[1,3],[2,3],[3,3],[1,4],[2,4],[3,4],[1,5],[2,5],[3,5]],
    bedsideTable: [[4,3]],
    desk: [[7,3],[8,3],[9,3]],
    dresser: [[12,3],[13,3]],
    luggageStand: [[13,7]]
  };

  function authoredRows() {
    var cells = [], rows = [], x, y, key, part;
    for (y = 0; y < 12; y++) {
      cells[y] = [];
      for (x = 0; x < 16; x++) {
        cells[y][x] = y < 3 || y === 11 || x === 0 || x === 15 ? 'T' : '.';
      }
    }
    for (key in footprints) {
      if (!Object.prototype.hasOwnProperty.call(footprints,key)) continue;
      for (part = 0; part < footprints[key].length; part++) {
        x = footprints[key][part][0]; y = footprints[key][part][1];
        cells[y][x] = 'T';
      }
    }
    /* Porta 315 sul muro sud: unica cella della connessione col corridoio. */
    cells[11][7] = '.';
    for (y = 0; y < cells.length; y++) rows.push(cells[y].join(''));
    return rows;
  }

  var targets = {
    wake: {x:2,y:6},
    bedFoot: {x:2,y:6},
    bedside: {x:4,y:4},
    desk: {x:8,y:4},
    deskWest: {x:7,y:4},
    dresser: {x:12,y:4},
    mirror: {x:13,y:4},
    luggage: {x:13,y:8},
    window: {x:8,y:5},
    entrance: {x:7,y:10},
    exit: {x:7,y:11},
    center: {x:7,y:7},
    depthBehind: {x:6,y:4},
    depthFront: {x:6,y:6}
  };

  /* La geometria canonica vive in js/maps.js (mappa 'room_315'): qui la
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
    /* glue.js possiede il record della mappa (trigger/oggetti/onEnter):
     * qui non lo sostituiamo, verifichiamo solo che la geometria authored e
     * quella pubblicata da maps.js siano la stessa cosa. */
    if (!map) throw new Error('Room315Scene: map "' + MAP + '" is missing');
    if ((map.rows || []).join('\n') !== rows.join('\n')) {
      throw new Error('Room315Scene: map "' + MAP + '" geometry diverges from the authored footprints');
    }
    if (!Number.isInteger(map.width)) map.width = 16;
    if (!Number.isInteger(map.height)) map.height = 12;
    if (map.indoor === undefined) map.indoor = true;

    originalTile = GAME.Sprites && GAME.Sprites.drawTile;
    originalStructures = GAME.sprites && GAME.sprites.drawStructures;
    originalForeground = GAME.sprites && GAME.sprites.drawForegroundStructures;
    originalPaletteLimit = GAME.Retro2D && GAME.Retro2D.limitBackgroundPalettes;

    if (GAME.Sprites) GAME.Sprites.drawTile = function (ctx,ch,x,y,tx,ty,rs,opts) {
      if (isOwn(opts)) return;
      return originalTile && originalTile.apply(this,arguments);
    };
    if (GAME.sprites) GAME.sprites.drawStructures = function (ctx,m,cx,cy,opts) {
      if (m && m.id === MAP) {
        return GAME.Room315Art && GAME.Room315Art.draw(ctx,cx,cy);
      }
      return originalStructures && originalStructures.apply(this,arguments);
    };
    if (GAME.sprites) GAME.sprites.drawForegroundStructures = function (ctx,m,cx,cy,opts) {
      opts = opts || {};
      if (m && m.id === MAP) {
        return GAME.Room315Art && GAME.Room315Art.foreground(
          ctx,cx,cy,opts.forestDepthMin,opts.forestDepthMax
        );
      }
      return originalForeground && originalForeground.apply(this,arguments);
    };
    if (originalPaletteLimit) GAME.Retro2D.limitBackgroundPalettes = function (ctx,cx,cy,vw,vh,mapId) {
      if (mapId === MAP) return;
      return originalPaletteLimit.apply(this,arguments);
    };
    return map;
  }

  GAME.Room315Scene = {
    rows: rows,
    mapId: MAP,
    footprints: footprints,
    targets: targets,
    install: install,
    layout: { footprints: footprints, targets: targets }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.Room315Scene;
})();
