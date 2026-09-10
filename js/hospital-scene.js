(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var MAP = 'hospital';

  /* Furniture cells are the single source of truth for this room's collision
   * silhouette.  The art module mirrors these named footprints and derives
   * every foreground depth from the occupied row's south edge. */
  var footprints = {
    monitorStand: [[1,3],[2,3]],
    ronetteBed: [[3,3],[4,3],[3,4],[4,4],[3,5],[4,5]],
    gerardBed: [[9,3],[10,3],[9,4],[10,4],[9,5],[10,5]],
    curtain: [[8,3],[8,4],[8,5]],
    chair: [[1,6]],
    nurseCounter: [[12,8],[13,8],[14,8]]
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
    /* Doppia anta sud: le due celle della porta verso la citta'. */
    cells[11][7] = '.'; cells[11][8] = '.';
    for (y = 0; y < cells.length; y++) rows.push(cells[y].join(''));
    return rows;
  }

  var targets = {
    entrance: {x:7,y:10},
    exit: {x:7,y:11},
    exitEast: {x:8,y:11},
    ronetteFoot: {x:3,y:6},
    ronetteSide: {x:5,y:5},
    monitor: {x:2,y:4},
    gerard: {x:11,y:4},
    gerardBedFoot: {x:9,y:6},
    curtainWest: {x:7,y:5},
    curtainEast: {x:11,y:5},
    chair: {x:2,y:6},
    nurse: {x:11,y:8},
    nightRegister: {x:11,y:8},
    center: {x:7,y:7},
    depthBehind: {x:6,y:4},
    depthFront: {x:6,y:6}
  };

  /* La geometria canonica vive in js/maps.js (mappa 'hospital'): qui la
   * rigeneriamo solo per poter fallire rumorosamente se le due divergono. */
  var rows = authoredRows();

  var installed = false;
  var originalTile, originalStructures, originalForeground, originalPaletteLimit,
      originalChar;
  function isOwn(opts) { return opts && opts.mapId === MAP; }

  function install() {
    if (installed) return GAME.Maps[MAP];
    installed = true;
    GAME.Maps = GAME.Maps || {};
    var map = GAME.Maps[MAP];
    /* glue.js possiede il record della mappa (porte/oggetti/NPC narrativi):
     * qui non lo sostituiamo, verifichiamo solo che la geometria authored e
     * quella pubblicata da maps.js siano la stessa cosa. */
    if (!map) throw new Error('HospitalScene: map "' + MAP + '" is missing');
    if ((map.rows || []).join('\n') !== rows.join('\n')) {
      throw new Error('HospitalScene: map "' + MAP + '" geometry diverges from the authored footprints');
    }
    if (!Number.isInteger(map.width)) map.width = 16;
    if (!Number.isInteger(map.height)) map.height = 12;
    if (map.indoor === undefined) map.indoor = true;

    originalTile = GAME.Sprites && GAME.Sprites.drawTile;
    originalStructures = GAME.sprites && GAME.sprites.drawStructures;
    originalForeground = GAME.sprites && GAME.sprites.drawForegroundStructures;
    originalPaletteLimit = GAME.Retro2D && GAME.Retro2D.limitBackgroundPalettes;
    originalChar = GAME.Sprites && GAME.Sprites.drawChar;

    if (GAME.Sprites) GAME.Sprites.drawTile = function (ctx,ch,x,y,tx,ty,rs,opts) {
      if (isOwn(opts)) return;
      return originalTile && originalTile.apply(this,arguments);
    };
    if (GAME.sprites) GAME.sprites.drawStructures = function (ctx,m,cx,cy,opts) {
      if (m && m.id === MAP) {
        return GAME.HospitalArt && GAME.HospitalArt.draw(ctx,cx,cy);
      }
      return originalStructures && originalStructures.apply(this,arguments);
    };
    if (GAME.sprites) GAME.sprites.drawForegroundStructures = function (ctx,m,cx,cy,opts) {
      opts = opts || {};
      if (m && m.id === MAP) {
        return GAME.HospitalArt && GAME.HospitalArt.foreground(
          ctx,cx,cy,opts.forestDepthMin,opts.forestDepthMax
        );
      }
      return originalForeground && originalForeground.apply(this,arguments);
    };
    if (originalPaletteLimit) GAME.Retro2D.limitBackgroundPalettes = function (ctx,cx,cy,vw,vh,mapId) {
      if (mapId === MAP) return;
      return originalPaletteLimit.apply(this,arguments);
    };
    /* Ronette e' distesa nel letto: la sua figura fa parte dell'arredo, non
     * del cast in piedi. Il record NPC resta interagibile a (3,5), ma qui la
     * sprite verticale non viene mai disegnata su questa mappa. */
    if (GAME.Sprites) GAME.Sprites.drawChar = function (ctx,x,y,pal,dir,frame,alpha,moving,night,time,environment) {
      if (environment && environment.mapId === MAP && environment.npcId === 'ronette') return;
      return originalChar && originalChar.apply(this,arguments);
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
    if (GAME.Sprites && originalChar) GAME.Sprites.drawChar = originalChar;
  }

  GAME.HospitalScene = {
    rows: rows,
    mapId: MAP,
    footprints: footprints,
    targets: targets,
    install: install,
    uninstall: uninstall,
    layout: { footprints: footprints, targets: targets }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.HospitalScene;
})();
