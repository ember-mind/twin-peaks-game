/* ember-grid.js — Ember Engine: tile-grid kinematics.
 *
 * One tile per step, easing applied over the whole crossing, animation phase
 * derived from step progress only. No knowledge of who is walking or why.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var EMBER = root.EMBER = root.EMBER || {};
  if (typeof require === 'function' && !EMBER.Math) require('./ember-math.js');
  var M = EMBER.Math;
  var G = EMBER.Grid = EMBER.Grid || {};

  var VECTORS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
  };

  /* An unknown direction resolves to 'right' rather than throwing: callers pass
   * a validated direction, tests pass garbage. */
  G.vector = function (dir) {
    var v = VECTORS[dir] || VECTORS.right;
    return { dx: v.dx, dy: v.dy };
  };

  G.opposite = function (dir) {
    return dir === 'up' ? 'down' : dir === 'down' ? 'up' : dir === 'left' ? 'right' : 'left';
  };

  /* A tile crossing always contains the full four-phase cycle: contact, A,
   * contact, B. The phase never depends on a global clock, so a step cannot
   * begin mid-stride. */
  G.walkPhase = function (progress) {
    return Math.max(0, Math.min(3, Math.floor(progress * 4)));
  };

  /* Advance a mover already committed to a step toward (mover.mx, mover.my).
   *
   * mover contract: { mx, my, moveT, moving } plus the two integer tile fields
   * named by opts.tileX / opts.tileY (default 'tx' / 'ty'). Positions in world
   * units stay the caller's business: this returns the eased parameter and lets
   * the caller decide whether that means pixels, tiles or metres.
   *
   * Returns { arrived, ease }.
   */
  G.advanceStep = function (mover, dt, opts) {
    opts = opts || {};
    var tile = opts.tile || 16;
    var speed = opts.speed || 0;
    var fx = opts.tileX || 'tx';
    var fy = opts.tileY || 'ty';
    mover.moveT = (mover.moveT || 0) + dt * speed / tile;
    if (mover.moveT >= 1) {
      mover.moveT = 1;
      mover.moving = false;
      mover[fx] = mover.mx;
      mover[fy] = mover.my;
      return { arrived: true, ease: 1 };
    }
    return { arrived: false, ease: M.smoothstep(mover.moveT) };
  };

  /* Character grid lookup with an edge-clamped read: outside the map the
   * border cell repeats, so walls and trees continue past the boundary
   * instead of showing a hole. */
  G.cell = function (rows, x, y, fallback) {
    if (!rows || y < 0 || y >= rows.length) return fallback === undefined ? ' ' : fallback;
    var row = rows[y];
    if (x < 0 || x >= row.length) return fallback === undefined ? ' ' : fallback;
    return row.charAt(x);
  };

  G.clampedCell = function (rows, x, y, width, height) {
    var w = width || (rows[0] ? rows[0].length : 0);
    var h = height || rows.length;
    var mx = M.clamp(x, 0, w - 1);
    var my = M.clamp(y, 0, h - 1);
    return { ch: G.cell(rows, mx, my), x: mx, y: my };
  };
})();
