/* lt-activity-poses.js — Living Town: what an inhabitant's body is doing.
 *
 * A projection and nothing else. It takes a sheet id, a POSE id, a direction,
 * a place and a time, and writes pixels. It never reads the simulation, never
 * writes to it, and cannot tell you who anybody is: `seated` is a shape, not a
 * person and not an action.
 *
 * The cells come off one compiled sheet, assets/activity-poses-v01.png, built
 * by tools/build-poses.js out of the same paper-doll parts and the same look
 * palettes the walk atlas is built from. Same 24px cell, same placement
 * arithmetic (x-4, y-8) and the same mirror for `left` as
 * GAME.Sprites.drawChar, so a pose lands exactly where the standing sprite
 * stood.
 *
 * Returns false whenever it cannot draw — unknown pose, unknown direction,
 * unknown sheet id, sheet not decoded yet — so the caller falls back to the
 * standing sprite instead of showing a hole.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  if (typeof require === 'function' && !(LT.ActivityPoses && LT.ActivityPoses.POSES)) {
    require('./activity-poses.table.js');
  }
  var AP = LT.ActivityPoses;

  var CELL = AP.CELL;
  var SHEET_FILE = 'assets/activity-poses-v01.png?v=' + AP.VERSION + '-' + AP.COLUMNS;   // a new column is a new sheet
  AP.SRC = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src)
    ? new URL(SHEET_FILE, document.currentScript.src).href
    : 'living-town/content/activity-poses-v01/' + SHEET_FILE;

  /* Which sheet row a look is on: the same order lt-appearance.js compiles the
   * walk atlas in, read at load. The pose sheet cannot drift from it without
   * tools/build-poses.js --check failing. */
  AP.rowOf = function (sheetId) {
    var order = (LT.Appearance && LT.Appearance.ORDER) || [];
    return order.indexOf(sheetId);
  };

  AP.sheet = null;
  AP.ready = false;
  AP.failed = null;
  /* Loading is this package's own business and happens once. A caller that
   * wants to wait has the promise; a caller that does not gets `false` from
   * draw() until the pixels are here. */
  AP.load = function () {
    if (AP.loading) return AP.loading;
    if (typeof Image === 'undefined') { AP.failed = 'no Image'; return null; }
    AP.loading = new Promise(function (resolve) {
      var img = new Image();
      img.decoding = 'sync';
      img.onload = function () {
        AP.sheet = img;
        AP.ready = (img.naturalWidth === AP.COLUMNS * CELL && img.naturalHeight === AP.COLUMNS * CELL);   // the sheet is square
        if (!AP.ready) AP.failed = 'unexpected sheet size ' + img.naturalWidth + 'x' + img.naturalHeight;
        resolve(AP.ready);
      };
      img.onerror = function () { AP.failed = 'sheet failed to load: ' + AP.SRC; resolve(false); };
      img.src = AP.SRC;
    });
    return AP.loading;
  };

  /* Which frame of a looping pose belongs to time t (milliseconds). Pure: the
   * same t always gives the same frame, and no state advances here. */
  AP.frameAt = function (poseId, t) {
    var pose = AP.POSES[poseId];
    if (!pose || pose.frames <= 1 || !pose.frameMs) return 0;
    var n = Math.floor((t || 0) / pose.frameMs) % pose.frames;
    return n < 0 ? n + pose.frames : n;
  };

  /* LT.ActivityPoses.draw(g, sheetId, poseId, dir, x, y, t, opts)
   *
   *   g       a 2D context
   *   sheetId a look id from LT.Appearance.ORDER, `_work` variants included
   *   poseId  a key of AP.POSES
   *   dir     'down' | 'up' | 'right' | 'left'; 'left' mirrors 'right'
   *   x, y    exactly what you would pass GAME.Sprites.drawChar
   *   t       milliseconds, for looping poses; 0 for a still frame
   *   opts    { alpha, frame, sheet, shadow, kit, palette }
   *             frame    pins a frame instead of deriving it from t
   *             sheet    an already-decoded image to blit from
   *             shadow   false leaves the contact shadow off
   *             kit/palette  the interior kit and material for that shadow
   *
   * Returns true when it drew, false when the caller must fall back.
   */
  AP.draw = function (g, sheetId, poseId, dir, x, y, t, opts) {
    opts = opts || {};
    var pose = AP.POSES[poseId];
    if (!g || !pose) return false;
    var want = (dir === 'left') ? 'right' : dir;
    if (pose.dirs.indexOf(want) < 0) return false;
    var row = AP.rowOf(sheetId);
    if (row < 0) return false;
    var sheet = opts.sheet || AP.sheet;
    if (!sheet || !sheet.complete || sheet.naturalWidth !== AP.COLUMNS * CELL || !g.drawImage) return false;
    var frame = (opts.frame == null) ? AP.frameAt(poseId, t) : opts.frame;
    var column = AP.column(poseId, want, frame);
    if (column < 0) return false;

    var ox = Math.round(x) - 4, oy = Math.round(y) - 8;
    var sx = column * CELL, sy = row * CELL;
    var old = g.globalAlpha;
    if (pose.shadow && opts.shadow !== false && opts.kit && opts.palette) {
      g.globalAlpha = old * (opts.alpha == null ? 1 : opts.alpha);
      opts.kit.contactShadow(g, Math.round(x) + 2, Math.round(y) + 15, 12, opts.palette);
      g.globalAlpha = old;
    }
    g.save();
    g.globalAlpha = old * (opts.alpha == null ? 1 : opts.alpha);
    g.imageSmoothingEnabled = false;
    if (dir === 'left') {
      g.translate(ox + CELL, 0);
      g.scale(-1, 1);
      g.drawImage(sheet, sx, sy, CELL, CELL, 0, oy, CELL, CELL);
    } else {
      g.drawImage(sheet, sx, sy, CELL, CELL, ox, oy, CELL, CELL);
    }
    g.restore();
    return true;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AP;
})();
