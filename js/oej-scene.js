/* oej-scene.js — production hook for the authored One Eyed Jacks interior.
 * The map record, doors, object targets and narrative bodies stay owned by
 * maps.js / glue.js / the connection registry / Cast Presence. This module
 * only validates the byte-exact floor plan and swaps in the native art hooks
 * for this map. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var MAP = 'oej';

  /* Furniture cells are the room's collision silhouette: every one of these
   * is a solid glyph in maps.js, and js/oej-art.js paints exactly these.
   *
   * The map-row pass broke the mirrored corner grid two fresh critics read as
   * a tilemap test. The four tables now have three different footprint widths
   * on four different rows, a roulette sits on the centre carpet, and three
   * of the seat cells carry a painted seated patron instead of an empty
   * stool. Every guest cell has a SOLID table cell to its north, so the head
   * that overhangs its cell can never bury a body. */
  var footprints = {
    tableCraps: [[2,2],[3,2],[4,2]],
    tableBlackjack: [[10,2],[11,2]],
    tableRoulette: [[4,6],[5,6],[6,6]],
    tablePoker: [[9,7],[10,7]],
    guestCraps: [[3,1]],
    guestBlackjack: [[11,1]],
    guestRoulette: [[5,5]],
    stoolPoker: [[11,7]],
    stoolCocktail: [[3,7]],
    slotWestNorth: [[1,7]],
    slotWestSouth: [[1,8]],
    cocktailTable: [[3,8]],
    ropeStand: [[14,8]],
    barCounter: [[5,4],[6,4],[7,4],[8,4],[9,4],[10,4]],
    serviceCabinet: [[14,2]]
  };

  /* The exact rows are repeated here as a fail-fast contract: changing
   * collision, the counter run, the cabinet or the south door belongs in the
   * map authoring task, never in an art pass. */
  var rows = [
    'iiiiiiiiiiiiiiii',
    'iffhfffffffhfffi',
    'iftttfffffttffUi',
    'iffffffffffffffi',
    'iffffCCCCCCffffi',
    'iffffhfffffffffi',
    'ifffKKKffffffffi',
    'iUfhffffftthfffi',
    'iUftffffffffffFi',
    'iiiiiiiDDiiiiiii'
  ];

  var targets = {
    entrance: {x: 8, y: 8},
    exit: {x: 7, y: 9},
    exitEast: {x: 8, y: 9},
    barApproach: {x: 7, y: 5},
    barApproachEast: {x: 10, y: 5},
    barBehind: {x: 7, y: 3},
    cabinet: {x: 14, y: 1},
    cabinetSide: {x: 13, y: 2},
    crapsApproach: {x: 3, y: 3},
    blackjackApproach: {x: 10, y: 3},
    rouletteApproach: {x: 5, y: 7},
    pokerApproach: {x: 9, y: 8},
    guestApproachWest: {x: 2, y: 1},
    guestApproachEast: {x: 12, y: 1},
    guestApproachBar: {x: 4, y: 5},
    stoolApproach: {x: 12, y: 7},
    audreyApproach: {x: 13, y: 7},
    landing: {x: 6, y: 8},
    center: {x: 8, y: 5}
  };

  /* Cast Presence placements this scene must leave readable and walkable.
   * No footprint above claims any of these cells. */
  var actors = {
    jacques: {x: 7, y: 5},
    audrey: {x: 13, y: 7},
    hawk: {x: 6, y: 8}
  };

  function authoredRows() { return rows.slice(); }

  var installed = false;
  var originalTile, originalStructures, originalForeground, originalPaletteLimit;
  function isOwn(opts) { return opts && opts.mapId === MAP; }

  function install() {
    if (installed) return GAME.Maps[MAP];
    installed = true;
    GAME.Maps = GAME.Maps || {};
    var map = GAME.Maps[MAP];
    if (!map) throw new Error('OejScene: map "' + MAP + '" is missing');
    if ((map.rows || []).join('\n') !== rows.join('\n')) {
      throw new Error('OejScene: map "' + MAP + '" geometry diverges from authored rows');
    }
    if (!Number.isInteger(map.width)) map.width = 16;
    if (!Number.isInteger(map.height)) map.height = 10;
    if (map.indoor === undefined) map.indoor = true;
    /* South double door (7,9 / 8,9) is the registry record
     * traincar-oej-entrance, installed by world-connections-production.js. */

    originalTile = GAME.Sprites && GAME.Sprites.drawTile;
    originalStructures = GAME.sprites && GAME.sprites.drawStructures;
    originalForeground = GAME.sprites && GAME.sprites.drawForegroundStructures;
    originalPaletteLimit = GAME.Retro2D && GAME.Retro2D.limitBackgroundPalettes;

    if (GAME.Sprites) GAME.Sprites.drawTile = function (ctx, ch, x, y, tx, ty, rs, opts) {
      if (isOwn(opts)) return;
      return originalTile && originalTile.apply(this, arguments);
    };
    if (GAME.sprites) GAME.sprites.drawStructures = function (ctx, m, cx, cy, opts) {
      if (m && m.id === MAP) return GAME.OejArt && GAME.OejArt.draw(ctx, cx, cy);
      return originalStructures && originalStructures.apply(this, arguments);
    };
    if (GAME.sprites) GAME.sprites.drawForegroundStructures = function (ctx, m, cx, cy, opts) {
      opts = opts || {};
      if (m && m.id === MAP) {
        return GAME.OejArt && GAME.OejArt.foreground(
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

  GAME.OejScene = {
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

  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.OejScene;
})();
