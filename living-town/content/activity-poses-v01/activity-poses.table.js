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
  AP.COLUMNS = 15;       /* cells per sheetId; must equal the frame count below */

  /* pivot/box are inside the 24x24 cell: `box` is what the art is allowed to
   * cover, `pivot` is the cell pixel that lands on the caller's (x, y) + the
   * standing sprite's own offset. Every pose keeps the standing sprite's
   * ground line, so a person never jumps when the pose changes. */
  AP.POSES = {
    seated: {
      id: 'seated', dirs: ['down', 'right'], frames: 1, frameMs: 0,
      pivot: [12, 24], box: [16, 21], shadow: true,
      reads: 'a body folded onto a seat: narrow chest over a wide lap, toes below it'
    },
    reading: {
      id: 'reading', dirs: ['down'], frames: 2, frameMs: 900,
      pivot: [12, 24], box: [16, 24], shadow: true,
      reads: 'standing, both hands holding an open book across the chest'
    },
    work_counter: {
      id: 'work_counter', dirs: ['down'], frames: 3, frameMs: 320,
      pivot: [12, 24], box: [24, 24], shadow: true,
      reads: 'standing, a rag swinging from one hand outside the silhouette'
    },
    unpacking: {
      id: 'unpacking', dirs: ['down'], frames: 1, frameMs: 0,
      pivot: [12, 24], box: [24, 20], shadow: true,
      reads: 'stooped, both arms hanging clear of the body down to hip height'
    },
    sleeping: {
      id: 'sleeping', dirs: ['right'], frames: 1, frameMs: 0,
      pivot: [12, 24], box: [24, 12], shadow: false,
      reads: 'lying on its side, head on a pillow, blanket in the wearer own colour'
    },
    talking: {
      id: 'talking', dirs: ['down', 'right'], frames: 2, frameMs: 430,
      pivot: [12, 24], box: [24, 24], shadow: true,
      reads: 'standing, one forearm lifting and falling clear of the silhouette'
    },
    guitar: {
      id: 'guitar', dirs: ['down'], frames: 2, frameMs: 380,
      pivot: [12, 24], box: [24, 24], shadow: true,
      reads: 'standing, a guitar across the body, its neck rising past the shoulder, the strumming hand moving'
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
    ['sleeping', 'right', 0],
    ['talking', 'down', 0],
    ['talking', 'down', 1],
    ['talking', 'right', 0],
    ['talking', 'right', 1],
    ['guitar', 'down', 0],
    ['guitar', 'down', 1]
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
