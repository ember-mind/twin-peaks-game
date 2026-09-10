(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var MAP = 'sheriff';

  /* Furniture cells are the single source of truth for this room's collision
   * silhouette.  The art module mirrors these named footprints and derives
   * every foreground depth from the occupied row's south edge. */
  var footprints = {
    sheriffChair: [[7,3],[8,3]],
    files: [[1,3],[2,3],[3,3],[1,4],[2,4],[3,4]],
    sheriffDesk: [[6,4],[7,4],[8,4],[9,4]],
    receptionReturn: [[4,6]],
    rightDeskNorth: [[11,6],[12,6],[13,6]],
    reception: [[1,7],[2,7],[3,7],[4,7]],
    rightChairNorth: [[12,7]],
    rightDeskSouth: [[11,9],[12,9],[13,9]],
    bench: [[1,10],[2,10],[3,10]],
    rightChairSouth: [[12,10]]
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
    /* Ingresso sud: le due celle della connessione front-entrance. */
    cells[11][7] = '.'; cells[11][8] = '.';
    for (y = 0; y < cells.length; y++) rows.push(cells[y].join(''));
    return rows;
  }

  var targets = {
    reception: {x:2,y:8},
    receptionPublic: {x:2,y:8},
    receptionStaff: {x:3,y:6},
    rightDesk: {x:11,y:7},
    rightDeskBehind: {x:11,y:5},
    rightDeskSouth: {x:11,y:10},
    files: {x:2,y:5},
    rearDoor: {x:13,y:4},
    sheriffDesk: {x:7,y:5},
    waitingBench: {x:2,y:9},
    entrance: {x:7,y:10},
    exit: {x:7,y:11},
    center: {x:7,y:7},
    depthBehind: {x:6,y:3},
    depthFront: {x:6,y:5}
  };

  /* La geometria canonica vive in js/maps.js (mappa 'sheriff'): qui la
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
    if (!map) throw new Error('SheriffsStationScene: map "' + MAP + '" is missing');
    if ((map.rows || []).join('\n') !== rows.join('\n')) {
      throw new Error('SheriffsStationScene: map "' + MAP + '" geometry diverges from the authored footprints');
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
        return GAME.SheriffsStationArt && GAME.SheriffsStationArt.draw(ctx,cx,cy);
      }
      return originalStructures && originalStructures.apply(this,arguments);
    };
    if (GAME.sprites) GAME.sprites.drawForegroundStructures = function (ctx,m,cx,cy,opts) {
      opts = opts || {};
      if (m && m.id === MAP) {
        return GAME.SheriffsStationArt && GAME.SheriffsStationArt.foreground(
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

  GAME.SheriffsStationScene = {
    rows: rows,
    mapId: MAP,
    install: install,
    layout: { footprints: footprints, targets: targets },
    targets: targets
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.SheriffsStationScene;
})();
