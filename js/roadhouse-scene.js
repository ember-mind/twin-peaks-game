/* roadhouse-scene.js — production hook for the authored Roadhouse interior.
 * The map record, doors, object target, and narrative bodies remain owned by
 * maps.js/glue.js/Cast Presence.  This module only validates the byte-exact
 * floor plan and swaps in the native art hooks for this map. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var MAP = 'roadhouse';

  var footprints = {
    northTableWest: [[3,3],[4,3]],
    northChairsWest: [[5,3],[6,3]],
    northTableMiddle: [[7,3],[8,3]],
    northChairsMiddle: [[9,3],[10,3]],
    northTableEast: [[11,3],[12,3]],
    southTableWest: [[3,7],[4,7]],
    southChairsWest: [[5,7],[6,7]],
    southTableMiddle: [[7,7],[8,7]],
    southChairsMiddle: [[9,7],[10,7]],
    southTableEast: [[11,7],[12,7]],
    barFurniture: [[4,5],[5,5],[6,5],[7,5]],
    barStoolWest: [[3,5]],
    barStoolEast: [[9,5]]
  };

  /* The exact rows are intentionally repeated here as a fail-fast contract:
   * changing collision, stage, pay-phone, or door geometry belongs in the map
   * authoring task, not in an art pass. */
  var rows = [
    'iiiiiiiiiiiiiiii',
    'iCCCCCCCCCCCCCCi',
    'iffffffffffffffi',
    'ifftthhtthhttffi',
    'iffffffffffffffi',
    'iffhCCCCfhfffffi',
    'iffffffffffffffi',
    'ifftthhtthhttffi',
    'iffffffffffffffi',
    'iiiiiiiDDiiiiiii'
  ];

  var targets = {
    entrance: {x: 7, y: 8},
    exit: {x: 7, y: 9},
    exitEast: {x: 8, y: 9},
    phone: {x: 8, y: 5},
    stageApproach: {x: 8, y: 2},
    center: {x: 8, y: 6},
    barApproach: {x: 10, y: 6},
    jukebox: {x: 13, y: 8},
    neon: {x: 2, y: 2}
  };

  /* Cast Presence placements that this scene must leave readable.  The
   * stage placement is intentionally solid: the Giant stands on the raised C
   * stage; all ordinary bodies, object approach tiles, and doors are free. */
  var actors = {
    truman: {x: 4, y: 8},
    norma: {x: 5, y: 6},
    shelly: {x: 3, y: 6},
    loglady: {x: 2, y: 6},
    james: {x: 2, y: 4},
    bobby: {x: 3, y: 4},
    donna: {x: 5, y: 4},
    giant: {x: 8, y: 1}
  };

  function authoredRows() {
    return rows.slice();
  }

  var installed = false;
  var originalTile, originalStructures, originalForeground, originalPaletteLimit;
  function isOwn(opts) { return opts && opts.mapId === MAP; }

  function install() {
    if (installed) return GAME.Maps[MAP];
    installed = true;
    GAME.Maps = GAME.Maps || {};
    var map = GAME.Maps[MAP];
    if (!map) throw new Error('RoadhouseScene: map "' + MAP + '" is missing');
    if ((map.rows || []).join('\n') !== rows.join('\n')) {
      throw new Error('RoadhouseScene: map "' + MAP + '" geometry diverges from authored rows');
    }
    if (!Number.isInteger(map.width)) map.width = 16;
    if (!Number.isInteger(map.height)) map.height = 10;
    if (map.indoor === undefined) map.indoor = true;
    /* South double door (7,9 / 8,9) is the registry record town-roadhouse, installed later by
     * world-connections-production.js; test/world-door-equality.js guards its presence. */

    originalTile = GAME.Sprites && GAME.Sprites.drawTile;
    originalStructures = GAME.sprites && GAME.sprites.drawStructures;
    originalForeground = GAME.sprites && GAME.sprites.drawForegroundStructures;
    originalPaletteLimit = GAME.Retro2D && GAME.Retro2D.limitBackgroundPalettes;

    if (GAME.Sprites) GAME.Sprites.drawTile = function (ctx, ch, x, y, tx, ty, rs, opts) {
      if (isOwn(opts)) return;
      return originalTile && originalTile.apply(this, arguments);
    };
    if (GAME.sprites) GAME.sprites.drawStructures = function (ctx, m, cx, cy, opts) {
      if (m && m.id === MAP) return GAME.RoadhouseArt && GAME.RoadhouseArt.draw(ctx, cx, cy);
      return originalStructures && originalStructures.apply(this, arguments);
    };
    if (GAME.sprites) GAME.sprites.drawForegroundStructures = function (ctx, m, cx, cy, opts) {
      opts = opts || {};
      if (m && m.id === MAP) {
        return GAME.RoadhouseArt && GAME.RoadhouseArt.foreground(
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

  GAME.RoadhouseScene = {
    rows: authoredRows(),
    mapId: MAP,
    width: 16,
    height: 10,
    footprints: footprints,
    targets: targets,
    actors: actors,
    install: install,
    uninstall: uninstall,
    layout: { footprints: footprints, targets: targets, actors: actors }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.RoadhouseScene;
})();
