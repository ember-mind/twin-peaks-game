(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var MAP = 'woods';

  /* The woods geometry is canonical and lives in js/maps.js.  This module
   * never writes a row: it re-states the cells the art depends on and fails
   * loudly if any of them moves, the way the interior scenes do.
   *
   * Outdoor differences from an interior scene:
   *  - the map is 28x22, so it scrolls; the art is authored in world pixels
   *    and the painter subtracts the camera;
   *  - there is no palette limiter to suppress (js/retro-authored.js already
   *    returns early for this map);
   *  - the depth band is installed and deliberately paints nothing, so no
   *    canopy can ever repaint over an actor. */
  var anchors = {
    portal: { x: 14, y: 4, glyph: 'D' },
    oil: { x: 14, y: 12, glyph: 'o' },
    sign: { x: 11, y: 16, glyph: 'S' },
    spawn: { x: 14, y: 20, glyph: 'p' },
    southExit: { x: 14, y: 21, glyph: 'p' }
  };

  /* The eight sycamores the map carries. They sit on a circle of radius three
   * tiles around the pool; the reference grove has twelve, this map has eight
   * and the art does not invent the other four. */
  var ring = [
    [14, 9], [12, 10], [16, 10], [11, 12],
    [17, 12], [12, 14], [16, 14], [14, 15]
  ];

  var poolCells = [[13, 11], [14, 11], [15, 11], [12, 12], [13, 12], [14, 12]];

  var targets = {
    spawn: { x: 14, y: 20 },
    southExit: { x: 14, y: 21 },
    signApproach: { x: 12, y: 16 },
    poolSouth: { x: 14, y: 13 },
    sycamoreApproach: { x: 14, y: 14 },
    poolEdge: { x: 15, y: 12 },
    ringWest: { x: 11, y: 13 },
    ringEast: { x: 17, y: 11 },
    courtyard: { x: 14, y: 6 },
    portalApproach: { x: 14, y: 5 }
  };

  var installed = false;
  var originalTile, originalStructures, originalForeground;
  function isOwn(opts) { return opts && opts.mapId === MAP; }

  function verify(map) {
    var key, a, row;
    for (key in anchors) {
      if (!Object.prototype.hasOwnProperty.call(anchors, key)) continue;
      a = anchors[key];
      row = map.rows[a.y];
      if (!row || row.charAt(a.x) !== a.glyph) {
        throw new Error('WoodsScene: anchor "' + key + '" expected "' + a.glyph +
          '" at ' + a.x + ',' + a.y + ' and found "' + (row ? row.charAt(a.x) : '') + '"');
      }
    }
    var i;
    for (i = 0; i < ring.length; i++) {
      if (map.rows[ring[i][1]].charAt(ring[i][0]) !== 'Y') {
        throw new Error('WoodsScene: sycamore missing at ' + ring[i][0] + ',' + ring[i][1]);
      }
    }
    for (i = 0; i < poolCells.length; i++) {
      if (map.rows[poolCells[i][1]].charAt(poolCells[i][0]) !== 'o') {
        throw new Error('WoodsScene: oil cell missing at ' + poolCells[i][0] + ',' + poolCells[i][1]);
      }
    }
    var count = 0, ty, tx;
    for (ty = 0; ty < map.rows.length; ty++) {
      for (tx = 0; tx < map.rows[ty].length; tx++) {
        if (map.rows[ty].charAt(tx) === 'Y') count++;
      }
    }
    if (count !== ring.length) {
      throw new Error('WoodsScene: expected ' + ring.length + ' sycamores, found ' + count);
    }
  }

  function install() {
    if (installed) return GAME.Maps[MAP];
    installed = true;
    GAME.Maps = GAME.Maps || {};
    var map = GAME.Maps[MAP];
    if (!map) throw new Error('WoodsScene: map "' + MAP + '" is missing');
    verify(map);
    if (!Number.isInteger(map.width)) map.width = map.rows[0].length;
    if (!Number.isInteger(map.height)) map.height = map.rows.length;

    originalTile = GAME.Sprites && GAME.Sprites.drawTile;
    originalStructures = GAME.sprites && GAME.sprites.drawStructures;
    originalForeground = GAME.sprites && GAME.sprites.drawForegroundStructures;

    /* The whole frame is authored, so the per-tile pipeline paints nothing
     * for this map: js/woods-art.js owns every pixel of it. */
    if (GAME.Sprites) GAME.Sprites.drawTile = function (ctx, ch, x, y, tx, ty, rs, opts) {
      if (isOwn(opts)) return;
      return originalTile && originalTile.apply(this, arguments);
    };
    if (GAME.sprites) GAME.sprites.drawStructures = function (ctx, m, cx, cy, opts) {
      if (m && m.id === MAP) {
        opts = opts || {};
        return GAME.WoodsArt && GAME.WoodsArt.draw(
          ctx, cx, cy, opts.viewportWidth, opts.viewportHeight, m, opts
        );
      }
      return originalStructures && originalStructures.apply(this, arguments);
    };
    if (GAME.sprites) GAME.sprites.drawForegroundStructures = function (ctx, m, cx, cy, opts) {
      if (m && m.id === MAP) {
        return GAME.WoodsArt && GAME.WoodsArt.foreground(ctx, cx, cy, opts);
      }
      return originalForeground && originalForeground.apply(this, arguments);
    };
    return map;
  }

  function uninstall() {
    if (!installed) return;
    installed = false;
    if (GAME.Sprites && originalTile) GAME.Sprites.drawTile = originalTile;
    if (GAME.sprites && originalStructures) GAME.sprites.drawStructures = originalStructures;
    if (GAME.sprites && originalForeground) GAME.sprites.drawForegroundStructures = originalForeground;
  }

  GAME.WoodsScene = {
    mapId: MAP,
    anchors: anchors,
    ring: ring,
    poolCells: poolCells,
    targets: targets,
    install: install,
    uninstall: uninstall,
    layout: { anchors: anchors, ring: ring, targets: targets }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.WoodsScene;
})();
