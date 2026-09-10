/* traincar-scene.js — Footbridge / traincar clearing: native geometry 24x12
 * between the west door to the town and the north cut to One Eyed Jacks.
 * Exterior hook pattern of js/sheriffs-station-exterior-scene.js: drawTile is a
 * no-op on the authored rows, drawStructures/drawForegroundStructures delegate
 * to js/traincar-art.js, and limitBackgroundPalettes is bypassed on this map.
 *
 * This module owns the narrative read of the two conditional marks: the ring
 * leaves the crossbeam when S1 is decided, and the post-report overlay (tape on
 * the door, county stake at the bridge) is painted on the flag. There is never
 * a second map. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var MAP = 'traincar';

  /* Authored geometry. Legend: T tree/solid, g dead grass, p path, w creek
   * (solid), b bridge plank, r rail, i car rim (solid), f car floor,
   * D door tile, S sign (solid). Rim, creek, trees and the sign are the only
   * solids: collision is inferable from the art alone (Bible §8). */
  var rows = [
    'TTTTTTTTTTTTTTTTTTTTTDTT', //  0  cut to One Eyed Jacks at (21,0)
    'TTTTTTTTTTTTTTTTTTTTTpTT', //  1  the cut opening
    'TTTwwTTTTiiiiiiiiiTTSpTT', //  2  48 px north face: canopy + car north wall
    'TggwwggggiiiiiiiiigggpgT', //  3  car north rim (stove on it at 12,3)
    'TggwwggggifffffffigggpgT', //  4  interior floor, bent sheet at (16,4)
    'TggwwggggifffffffigggpgT', //  5  crossbeam 12..14, ring at (13,5)
    'TggwwggggifffffffigggpgT', //  6  torn seat + cards (10,6), mound (13,6)
    'pppbbprrriiiiDDiiigggpgT', //  7  bridge, rails, car south face, door (13-14,7)
    'TggwwggggggggggggggggpgT', //  8  open ballast: Truman (9,8), Hawk (14,8)
    'TggwwggggggggggggggggpgT', //  9
    'TggwwggggggggggggggggpgT', // 10
    'TTTTTTTTTTTTTTTTTTTTTTTT'  // 11  south tree line
  ];

  /* Every landmark/object of the brief, plus the tile the player stands on to
   * face it. The contract test walks the real engine to each stand tile. */
  var targets = {
    spawn: { x: 1, y: 7 },
    bridge_rail: { x: 4, y: 6, stand: { x: 4, y: 7 }, dir: 'up' },
    traincar_entrance: { x: 13, y: 7, stand: { x: 13, y: 8 }, dir: 'up' },
    mound: { x: 13, y: 6, stand: { x: 13, y: 7 }, dir: 'up' },
    ring: { x: 13, y: 5, stand: { x: 13, y: 6 }, dir: 'up' },
    scene_center: { x: 12, y: 5, stand: { x: 12, y: 6 }, dir: 'up' },
    stove: { x: 12, y: 3, stand: { x: 12, y: 4 }, dir: 'up' },
    cards: { x: 10, y: 6, stand: { x: 11, y: 6 }, dir: 'left' },
    tracks_north: { x: 21, y: 2, stand: { x: 21, y: 3 }, dir: 'up' },
    sign_oej: { x: 20, y: 2, stand: { x: 20, y: 3 }, dir: 'up' }
  };

  /* Hawk's three placements and Truman's arrival, mirrored from the adapter so
   * the contract test can assert nobody ever stands inside the car. */
  var actors = {
    truman: { x: 9, y: 8, dir: 'right' },
    hawk_bridge: { x: 5, y: 6, dir: 'left' }, // sponda est, mai sulla riga 7 (unico attraversamento)
    hawk_door: { x: 14, y: 8, dir: 'down' },
    hawk_cut: { x: 22, y: 3, dir: 'up' }
  };

  function narrativeState() {
    var A = GAME.NarrativeAdapter;
    if (!A || typeof A.getState !== 'function') return null;
    try { return A.getState(); } catch (e) { return null; }
  }

  function ringHidden() {
    var s = narrativeState();
    if (s && s.values && s.values.s1 !== undefined && s.values.s1 !== null) return true;
    /* Classic path: the ring is in Cooper's custody once the clue is taken. */
    var E = GAME.Engine;
    if (E && E.state && E.state.clues && E.state.clues.indexOf('anello') >= 0) return true;
    return false;
  }

  function overlayOn() {
    var s = narrativeState();
    if (s) {
      if (s.flags && s.flags.east_route_confirmed) return true;
      if (s.values && s.values.s1 !== undefined && s.values.s1 !== null) return true;
    }
    var E = GAME.Engine;
    if (E && E.state && E.state.flags && E.state.flags.east_route_confirmed) return true;
    return false;
  }

  function sceneState() {
    return { ringHidden: ringHidden(), overlay: overlayOn() };
  }

  var installed = false;
  var originalTile, originalStructures, originalForeground, originalPaletteLimit;
  function isOwn(opts) { return opts && opts.mapId === MAP; }

  function install() {
    if (installed) return GAME.Maps[MAP];
    installed = true;
    GAME.Maps = GAME.Maps || {};
    var map = GAME.Maps[MAP];
    /* glue.js owns the map record (doors, interact objects, narrative NPCs):
     * here we only refuse to run if the published geometry has drifted from
     * the authored rows. */
    if (!map) throw new Error('TraincarScene: map "' + MAP + '" is missing');
    if ((map.rows || []).join('\n') !== rows.join('\n')) {
      throw new Error('TraincarScene: map "' + MAP + '" geometry diverges from the authored rows');
    }
    if (!Number.isInteger(map.width)) map.width = 24;
    if (!Number.isInteger(map.height)) map.height = 12;
    if (map.indoor === undefined) map.indoor = false;

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
        return GAME.TraincarArt && GAME.TraincarArt.draw(ctx, cx, cy, sceneState());
      }
      return originalStructures && originalStructures.apply(this, arguments);
    };
    if (GAME.sprites) GAME.sprites.drawForegroundStructures = function (ctx, m, cx, cy, opts) {
      opts = opts || {};
      if (m && m.id === MAP) {
        return GAME.TraincarArt && GAME.TraincarArt.foreground(
          ctx, cx, cy, opts.forestDepthMin, opts.forestDepthMax, sceneState()
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

  GAME.TraincarScene = {
    rows: rows,
    mapId: MAP,
    width: 24,
    height: 12,
    targets: targets,
    actors: actors,
    sceneState: sceneState,
    ringHidden: ringHidden,
    overlayOn: overlayOn,
    install: install,
    uninstall: uninstall,
    layout: { targets: targets, actors: actors }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.TraincarScene;
})();
