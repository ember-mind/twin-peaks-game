/* activity-poses.table.js — what poses exist, and where they live on the sheet.
 *
 * One table, read by the browser runtime (lt-activity-poses.js) and by the
 * compiler (tools/build-poses.js). The cell index of a frame is derived from
 * this order, so the sheet and the runtime cannot disagree about which cell is
 * which: there is only one place that says.
 *
 * A pose id names an ACTIVITY SHAPE, never a person and never an action id.
 * `seated` is a body on a seat; whose body, and why they are on it, is not
 * this package's business.
 */
(function () {
  var root = (typeof window !== 'undefined') ? window : global;
  var LT = root.LT = root.LT || {};
  var AP = LT.ActivityPoses = LT.ActivityPoses || {};

  AP.VERSION = 'activity-poses-v01';
  AP.CELL = 24;          /* the production 24px actor cell, unchanged */
  AP.COLUMNS = 14;       /* cells per sheetId; must equal the frame count below */

  /* pivot/box are inside the 24x24 cell: `box` is what the art is allowed to
   * cover, `pivot` is the cell pixel that lands on the caller's (x, y) + the
   * standing sprite's own offset. Every pose keeps the standing sprite's
   * ground line, so a person never jumps when the pose changes. */
  AP.POSES = {
    seated: {
      id: 'seated', dirs: ['down', 'right'], frames: 1, frameMs: 0,
      pivot: [12, 24], box: [16, 21], shadow: true,
      reads: 'a body folded onto a seat: short, wide lap, shins straight down'
    },
    reading: {
      id: 'reading', dirs: ['down'], frames: 2, frameMs: 900,
      pivot: [12, 24], box: [16, 20], shadow: true,
      reads: 'seated, both hands holding an open book across the chest'
    },
    work_counter: {
      id: 'work_counter', dirs: ['down'], frames: 3, frameMs: 320,
      pivot: [12, 24], box: [16, 24], shadow: true,
      reads: 'standing, one arm working across the chest with a cloth in hand'
    },
    unpacking: {
      id: 'unpacking', dirs: ['down'], frames: 2, frameMs: 520,
      pivot: [12, 24], box: [20, 20], shadow: true,
      reads: 'bent at the waist, crown of the head to the viewer, hands down'
    },
    sleeping: {
      id: 'sleeping', dirs: ['right'], frames: 1, frameMs: 0,
      pivot: [12, 24], box: [24, 12], shadow: false,
      reads: 'lying flat, head on a pillow, blanket in the wearer own colour'
    },
    talking: {
      id: 'talking', dirs: ['down', 'right'], frames: 2, frameMs: 430,
      pivot: [12, 24], box: [20, 24], shadow: true,
      reads: 'standing, one forearm lifting and falling in front of the chest'
    }
  };

  /* The sheet order. Index = column in the pose sheet. */
  AP.ORDER = [
    ['seated', 'down', 0],
    ['seated', 'right', 0],
    ['reading', 'down', 0],
    ['reading', 'down', 1],
    ['work_counter', 'down', 0],
    ['work_counter', 'down', 1],
    ['work_counter', 'down', 2],
    ['unpacking', 'down', 0],
    ['unpacking', 'down', 1],
    ['sleeping', 'right', 0],
    ['talking', 'down', 0],
    ['talking', 'down', 1],
    ['talking', 'right', 0],
    ['talking', 'right', 1]
  ];

  AP.POSE_IDS = Object.keys(AP.POSES);

  /* Column of one (pose, direction, frame). 'left' is the mirror of 'right'
   * and has no column of its own, exactly as the walk atlas does it. */
  AP.column = function (poseId, dir, frame) {
    var want = (dir === 'left') ? 'right' : dir;
    for (var i = 0; i < AP.ORDER.length; i++) {
      var row = AP.ORDER[i];
      if (row[0] === poseId && row[1] === want && row[2] === frame) return i;
    }
    return -1;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AP;
})();
