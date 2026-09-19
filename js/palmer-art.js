/* Casa Palmer — 256x192 authored native pixels.
 * Flat orthographic rectangles only: no gradients, paths, smoothing or noise.
 *
 * The canonical 'palmer' map is a cutaway of the whole house: Laura's room
 * occupies rows 1-3, the stair wall is row 4 (the only opening is the landing
 * at columns 4-5), and the living room runs rows 5-10 down to the front door
 * on row 11.  Two light roles carry the frame: the cold dusk plane from the
 * west window behind the dining table, and the warm tungsten pool from the
 * sconce on the stair wall that falls on the parquet below it.
 *
 * Grounded furniture lives in `definitions` and mirrors js/palmer-scene.js
 * footprints one for one.  Everything else — walls, windows, curtains, the
 * stairwell, the ceiling fan, the framed picture, the front door — is
 * architecture and never claims a collision cell. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;

  var palette = {
    ink: '#191411',
    walnutDeep: '#2b1d15', walnutDark: '#40291c', walnut: '#5a3b28',
    walnutMid: '#734c33', walnutHi: '#96673f', walnutCool: '#4c4034',
    oak: '#8a5f3a',
    roseDeep: '#6d4c52', rose: '#a97c81', roseHi: '#c9a0a2',
    maple: '#b49368', mapleHi: '#c4a478', mapleDark: '#96784c', mapleSeam: '#a5875b',
    parquetDark: '#6b4526', parquet: '#8a5b31', parquetMid: '#956338',
    parquetHi: '#a5713f', parquetSeam: '#7b5029',
    poolFloor: '#a9793f', poolFloorMid: '#bb8b4b', poolFloorHi: '#cb9d59',
    poolSeam: '#8f6330', duskFloor: '#8d7052', duskFloorHi: '#9a7c58',
    duskSeam: '#6f5540', duskBar: '#7b6249',
    rugDeep: '#3a1d21', rugDark: '#5a2a2f', rug: '#77373a', rugMid: '#8a4245',
    rugCream: '#c6b388', rugOchre: '#a8863f',
    greenDeep: '#1f3327', green: '#2f4c37', greenMid: '#3d6146', greenHi: '#4e7a55',
    quiltDeep: '#44586a', quilt: '#5d7285', quiltHi: '#8296a6',
    linen: '#c8c2ad', lace: '#e4ded0', laceDim: '#b6b0a0',
    cloth: '#b9ae8c', clothHi: '#cfc3a0', clothDim: '#968b6c',
    brassDark: '#8a6a2e', brass: '#c39a45', brassHi: '#f0d08d',
    amber: '#d8ab52', amberHi: '#f6dda0',
    warmWall: '#6b4a30', warmWallMid: '#7d5836', warmWallHi: '#8d6840',
    glassDeep: '#2b3b48', glass: '#4d6577',
    dusk: '#7d93a4', duskHi: '#a9bcc6', duskPale: '#c4d2da',
    tread: '#c9a468', treadMid: '#a5814c', treadLow: '#7d5c33', treadDeep: '#553c20',
    fanShade: '#94764c',
    shadow: '#4a3120', shadowMid: '#35220f', shadowDark: '#241608'
  };

  /* Grounded furniture only: the six solid cells the map actually carries. */
  var definitions = [
    {id:'lauraBed', cells:[[1,1],[2,1]], bounds:[16,13,32,19], shadow:[16,28,32,4]},
    {id:'lauraDresser', cells:[[6,1]], bounds:[96,10,16,23], shadow:[96,28,16,4]},
    {id:'sofa', cells:[[3,6]], bounds:[47,88,18,25], shadow:[48,108,16,4]},
    {id:'sideboard', cells:[[14,6]], bounds:[223,80,17,32], shadow:[224,108,16,4]},
    {id:'diningTable', cells:[[2,8],[3,8]], bounds:[31,109,34,35], shadow:[32,140,32,4]},
    {id:'diningChairs', cells:[[2,9],[3,9]], bounds:[33,146,30,15], shadow:[32,156,32,4]}
  ];

  /* Two architectural bands that must repaint over an actor: the ceiling fan
   * hangs above the landing, the door casing frames whoever stands in it. */
  var fanFoot = 64;
  var doorFoot = 192;

  function southEdge(cells) {
    var row = -1, i;
    for (i = 0; i < cells.length; i++) if (cells[i][1] > row) row = cells[i][1];
    return (row + 1) * TILE;
  }
  definitions.forEach(function (prop) { prop.footY = southEdge(prop.cells); });

  function rectPainter(ctx, cx, cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    return function (x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x - cx, y - cy, w, h);
    };
  }

  /* ------------------------------------------------------------ Laura's room */

  function drawLauraWall(R, p) {
    /* Row 0 is the only wall face her room shows: cap rail, striped paper,
     * baseboard.  Nine pixels of paper, so the stripe stays a whisper. */
    R(0, 0, 256, 16, p.walnutDeep);
    R(0, 0, 256, 3, p.walnutDark); R(0, 2, 256, 1, p.walnutHi);
    R(2, 3, 252, 9, p.rose);
    R(2, 3, 252, 1, p.roseHi);
    for (var x = 6; x < 252; x += 8) R(x, 4, 1, 8, p.roseDeep);
    R(0, 12, 256, 3, p.walnutDark); R(0, 12, 256, 1, p.walnutHi);
    R(0, 15, 256, 1, p.ink);
    /* Two small frames, the only thing hung in her room. */
    R(150, 2, 18, 11, p.ink); R(151, 3, 16, 9, p.walnutMid);
    R(151, 3, 16, 1, p.walnutHi); R(153, 5, 12, 5, '#7d8f96');
    R(155, 7, 3, 2, p.roseDeep); R(160, 6, 3, 3, p.roseDeep);
    R(176, 4, 12, 8, p.ink); R(177, 5, 10, 6, p.walnutMid);
    R(177, 5, 10, 1, p.walnutHi); R(179, 6, 6, 3, p.rose);
  }

  function drawLauraFloor(R, p) {
    /* Pale maple boards running east-west: long runs, a soft seam every other
     * board and one hard seam every fourth, so the plane never reads as
     * brickwork.  Butt joints are placed, not repeated. */
    var y, i;
    R(16, 16, 224, 48, p.maple);
    for (y = 16; y < 64; y += 8) {
      R(16, y, 224, 8, ((y - 16) / 8) % 3 === 1 ? p.mapleHi : p.maple);
    }
    for (y = 24; y < 64; y += 16) R(16, y, 224, 1, p.mapleSeam);
    for (y = 32; y < 64; y += 32) R(16, y, 224, 1, p.mapleDark);
    var joints = [[74, 18], [186, 26], [118, 42], [54, 50], [212, 58]];
    for (i = 0; i < joints.length; i++) R(joints[i][0], joints[i][1], 1, 6, p.mapleSeam);
    /* A small braided rug beside her bed: three rose values a few points
     * apart, no frame, so it stays a rug and not a panel on the floor. */
    R(160, 38, 28, 3, p.roseDeep);
    R(156, 40, 36, 3, p.roseDeep);
    R(152, 42, 44, 10, p.roseDeep);
    R(156, 51, 36, 3, p.roseDeep);
    R(160, 53, 28, 3, p.roseDeep);
    R(162, 40, 24, 3, p.rose);
    R(158, 42, 32, 2, p.rose);
    R(154, 44, 40, 6, p.rose);
    R(158, 49, 32, 2, p.rose);
    R(162, 51, 24, 3, p.rose);
    R(154, 45, 40, 1, p.roseHi); R(156, 48, 36, 1, p.roseHi);
    R(158, 43, 32, 1, p.roseDeep);
  }

  /* ------------------------------------------------------- stair wall, row 4 */

  function drawStairWall(R, p) {
    R(0, 64, 256, 16, p.ink);
    R(0, 64, 256, 2, p.walnutDark); R(0, 64, 256, 1, p.walnutHi);
    R(1, 66, 254, 10, p.walnut);
    R(1, 66, 254, 1, p.walnutMid);
    for (var x = 16; x < 254; x += 16) {
      R(x, 67, 2, 8, p.walnutDeep); R(x + 2, 68, 1, 6, p.walnutHi);
    }
    R(0, 76, 256, 3, p.walnutDark);
    R(0, 79, 256, 1, p.ink);
  }

  function drawStairwell(R, p) {
    /* The landing (columns 4-5) is the brightest opening in the wall: four
     * treads climbing north into the upper hall, each with its own nosing,
     * the top one carrying the light that comes down the stairwell. */
    R(61, 64, 38, 16, p.ink);
    R(64, 64, 32, 4, p.tread); R(64, 64, 32, 1, '#e2c28c');
    R(64, 68, 32, 4, p.treadMid); R(64, 68, 32, 1, '#c8a367');
    R(64, 72, 32, 4, p.treadLow); R(64, 72, 32, 1, '#a07d47');
    R(64, 76, 32, 3, p.treadDeep); R(64, 76, 32, 1, '#7a5a30');
    R(64, 79, 32, 1, p.ink);
    /* Each tread loses a little light toward the east jamb. */
    R(88, 65, 8, 3, p.treadMid); R(90, 69, 6, 3, p.treadLow);
    R(64, 65, 5, 3, p.treadMid); R(64, 69, 4, 3, p.treadLow);
    /* Jambs: the west one takes the sconce light, the east one stays dark. */
    R(61, 64, 4, 16, p.walnutDeep); R(63, 65, 1, 14, p.walnutHi);
    R(95, 64, 4, 16, p.walnutDeep); R(96, 65, 1, 14, p.walnutMid);
  }

  function drawStairWallDressing(R, p) {
    /* One warm pool on the panelling under the sconce, repainted through the
     * panel joints so the light stays light instead of a card on the wall. */
    var x;
    R(170, 66, 32, 10, p.warmWall);
    R(175, 66, 22, 10, p.warmWallMid);
    R(180, 66, 12, 10, p.warmWallHi);
    for (x = 176; x < 200; x += 16) { R(x, 67, 2, 8, '#3a2716'); R(x + 2, 68, 1, 6, '#b08a54'); }
    R(170, 66, 32, 1, '#c09660');
    /* The sconce itself: brass back plate, amber shade, one core row. */
    R(182, 64, 8, 3, p.brassDark); R(183, 64, 6, 1, p.brass);
    R(180, 67, 12, 5, p.amber); R(181, 67, 10, 2, p.amberHi);
    R(184, 67, 4, 5, '#fff0c4');
    R(180, 72, 12, 1, p.brassDark);
    /* Framed landscape west of the stairs — the room's one picture. */
    R(30, 66, 24, 12, p.ink);
    R(31, 67, 22, 10, p.walnutMid); R(31, 67, 22, 1, p.walnutHi);
    R(32, 68, 20, 8, p.walnutDeep);
    R(33, 69, 18, 6, '#6f8a74');
    R(33, 72, 18, 3, '#3f5c4a');
    R(36, 70, 3, 4, '#2c4335'); R(42, 69, 3, 5, '#2c4335'); R(47, 71, 2, 3, '#2c4335');
    R(33, 69, 18, 1, '#93a992');
  }

  /* ------------------------------------------------------------ living room */

  function drawLivingFloor(R, p) {
    /* Honey parquet: long boards east-west, a soft seam every other board and
     * a hard one every fourth.  Eight placed butt joints, never a grid. */
    var y, i, band;
    R(16, 80, 224, 96, p.parquet);
    for (y = 80; y < 176; y += 8) {
      band = ((y - 80) / 8) % 4;
      R(16, y, 224, 8, band === 1 ? p.parquetMid : (band === 3 ? p.parquetHi : p.parquet));
    }
    for (y = 88; y < 176; y += 16) R(16, y, 224, 1, p.parquetSeam);
    for (y = 96; y < 176; y += 32) R(16, y, 224, 1, p.parquetDark);
    var joints = [[60, 82], [150, 98], [98, 114], [206, 122], [44, 138],
                  [174, 146], [122, 162], [78, 170]];
    for (i = 0; i < joints.length; i++) R(joints[i][0], joints[i][1], 1, 6, p.parquetSeam);
    /* Three placed wear clusters, out of the door approach column. */
    R(44, 168, 9, 1, p.parquetDark); R(48, 169, 3, 1, p.parquetHi);
    R(198, 160, 8, 1, p.parquetDark); R(201, 161, 3, 1, p.parquetHi);
    R(196, 90, 7, 1, p.parquetDark); R(199, 89, 3, 1, p.parquetHi);
  }

  function drawFloorLight(R, p) {
    /* Warm pool from the sconce: three stepped bands widening as they fall
     * away from the wall, with the plank seams repainted warm through them so
     * the light lies on the floor instead of covering it. */
    var y;
    R(166, 80, 40, 20, p.poolFloor);
    R(170, 80, 32, 14, p.poolFloorMid);
    R(174, 80, 24, 8, p.poolFloorHi);
    R(178, 80, 16, 4, '#dcae66');
    for (y = 88; y < 100; y += 8) R(166, y, 40, 1, p.poolSeam);
    R(96, 80, 1, 6, p.poolSeam);
    /* Cold plane from the west window: the near step keeps the window's own
     * brightness and carries the two bar shadows, the far step falls back to
     * within a few luma of the parquet. */
    R(16, 104, 30, 42, p.duskFloor);
    R(16, 102, 20, 46, p.duskFloorHi);
    R(16, 100, 10, 50, '#a5865f');
    /* The sash crosses the plane: one bar for the mullion, one for the rail. */
    R(16, 122, 30, 5, p.duskBar);
    R(24, 100, 4, 50, p.duskBar);
    for (y = 104; y < 148; y += 8) R(16, y, 30, 1, p.duskSeam);
  }

  function drawRug(R, p) {
    /* The rug is the room's quiet dark mass and the only place the cast
     * stands: the medallion stays west of Sarah's tile (9,7). */
    R(96, 96, 80, 48, p.rugDeep);
    R(98, 98, 76, 44, p.rugDark);
    R(101, 101, 70, 38, p.rug);
    R(101, 101, 70, 1, p.rugMid);
    R(103, 103, 66, 2, p.rugCream); R(103, 135, 66, 2, p.rugCream);
    R(103, 103, 2, 34, p.rugCream); R(167, 103, 2, 34, p.rugCream);
    R(105, 105, 62, 1, p.rugDeep); R(105, 134, 62, 1, p.rugDeep);
    /* One stepped medallion, tip up, and four corner marks. */
    R(126, 116, 18, 6, p.rugOchre);
    R(131, 111, 8, 16, p.rugOchre);
    R(133, 109, 4, 20, p.rugOchre);
    R(130, 117, 10, 4, p.rugCream);
    R(132, 114, 6, 10, p.rugCream);
    R(133, 117, 4, 4, p.rugDeep);
    R(108, 108, 6, 2, p.rugOchre); R(108, 108, 2, 6, p.rugOchre);
    R(158, 108, 6, 2, p.rugOchre); R(162, 108, 2, 6, p.rugOchre);
    R(108, 130, 2, 6, p.rugOchre); R(108, 134, 6, 2, p.rugOchre);
    R(162, 130, 2, 6, p.rugOchre); R(158, 134, 6, 2, p.rugOchre);
    /* Two creases, nothing else. */
    R(112, 122, 14, 1, p.rugDeep); R(113, 123, 12, 1, p.rugMid);
    R(146, 128, 16, 1, p.rugDeep); R(147, 129, 14, 1, p.rugMid);
  }

  /* --------------------------------------------------------------- envelope */

  function drawSideWalls(R, p) {
    /* The two side walls are panelling seen edge on: a board rhythm every
     * 24px and a baseboard at the floor, so they carry the room instead of
     * standing there as two flat brown columns. */
    var y;
    R(0, 0, 16, 192, p.ink);
    R(2, 0, 12, 190, p.walnutDark); R(4, 4, 9, 182, p.walnut);
    R(5, 4, 2, 182, p.walnutHi); R(13, 0, 3, 190, p.ink);
    R(240, 0, 16, 192, p.ink);
    R(242, 0, 12, 190, p.walnutDark); R(243, 4, 9, 182, p.walnut);
    R(249, 4, 2, 182, p.walnutHi); R(240, 0, 3, 190, p.ink);
    for (y = 12; y < 184; y += 24) {
      R(4, y, 9, 2, p.walnutDeep); R(4, y + 2, 9, 1, p.walnutMid);
      R(243, y, 9, 2, p.walnutDeep); R(243, y + 2, 9, 1, p.walnutMid);
    }
    R(2, 60, 12, 3, p.walnutDeep); R(3, 60, 11, 1, p.walnutHi);
    R(242, 60, 12, 3, p.walnutDeep); R(242, 60, 11, 1, p.walnutHi);
    R(2, 170, 12, 16, p.walnutDeep); R(2, 170, 12, 1, p.walnutHi);
    R(242, 170, 12, 16, p.walnutDeep); R(242, 170, 12, 1, p.walnutHi);
  }

  function pineSilhouette(R, cx, top, base, color) {
    /* Stepped conifer: a narrow tip widening one pixel every other row. */
    var y, half = 1, step = 0;
    for (y = top; y < base; y += 2) {
      R(cx - half, y, half * 2, 2, color);
      step++;
      if (step % 2 === 0 && half < 4) half++;
    }
    R(cx - 1, base - 2, 2, 2, color);
  }

  function drawLauraWindow(R, p) {
    /* Her window is the cold note upstairs: lace, not the heavy drapes the
     * living room wears. */
    R(240, 18, 16, 38, p.ink);
    R(241, 19, 14, 36, p.walnutDeep); R(241, 19, 14, 1, p.walnutHi);
    R(243, 21, 11, 32, p.dusk);
    R(243, 21, 11, 10, p.duskHi);
    R(243, 38, 11, 15, p.glass);
    pineSilhouette(R, 246, 32, 50, p.glassDeep);
    pineSilhouette(R, 251, 36, 50, p.glassDeep);
    R(243, 37, 11, 1, p.duskPale);
    R(243, 33, 11, 1, p.walnutDeep); R(248, 21, 1, 32, p.walnutDeep);
    R(243, 21, 4, 32, p.lace); R(250, 21, 4, 32, p.lace);
    R(244, 21, 1, 32, p.laceDim); R(252, 21, 1, 32, p.laceDim);
    R(241, 19, 14, 3, p.laceDim); R(241, 19, 14, 1, p.lace);
    R(240, 55, 16, 3, p.walnutDark); R(240, 55, 16, 1, p.walnutHi);
    R(240, 58, 16, 1, p.ink);
  }

  function drawLivingWindow(R, p) {
    /* West window behind the dining table: cold dusk glass, a treeline low
     * in the pane, heavy forest drapes either side. */
    R(0, 98, 16, 54, p.ink);
    R(1, 99, 14, 52, p.walnutDeep); R(1, 99, 14, 1, p.walnutHi);
    R(4, 102, 9, 46, p.dusk);
    R(4, 102, 9, 14, p.duskHi);
    R(4, 126, 9, 22, p.glass);
    pineSilhouette(R, 7, 118, 146, p.glassDeep);
    pineSilhouette(R, 11, 122, 146, p.glassDeep);
    R(4, 125, 9, 1, p.duskPale);
    R(4, 113, 9, 1, p.walnutDeep); R(8, 102, 1, 46, p.walnutDeep);
    R(1, 100, 4, 48, p.greenDeep); R(2, 101, 2, 46, p.green); R(2, 101, 1, 46, p.greenHi);
    R(11, 100, 4, 48, p.greenDeep); R(12, 101, 2, 46, p.green); R(13, 101, 1, 46, p.greenHi);
    R(1, 99, 14, 3, p.greenDeep); R(1, 99, 14, 1, p.greenMid);
    R(0, 148, 16, 3, p.walnutDark); R(0, 148, 16, 1, p.walnutHi);
    R(0, 151, 16, 1, p.ink);
  }

  function drawSouthWall(R, p) {
    R(0, 176, 256, 16, p.ink);
    R(4, 178, 104, 12, p.walnutDeep); R(5, 178, 102, 2, p.walnutHi);
    R(6, 182, 100, 6, p.walnutDark);
    R(148, 178, 104, 12, p.walnutDeep); R(148, 178, 102, 2, p.walnutHi);
    R(150, 182, 100, 6, p.walnutDark);
    var x;
    for (x = 16; x < 104; x += 16) { R(x, 182, 2, 7, p.walnutDeep); R(x + 2, 183, 1, 5, p.walnutMid); }
    for (x = 160; x < 248; x += 16) { R(x, 182, 2, 7, p.walnutDeep); R(x + 2, 183, 1, 5, p.walnutMid); }
    drawDoor(R, p);
  }

  function drawDoor(R, p) {
    /* Front door on the two trigger cells (7,11) and (8,11): recessed casing,
     * a dusk transom above the leaf, brass knob, warm porch line beneath. */
    R(106, 170, 44, 22, p.ink);
    R(108, 172, 40, 20, p.walnutDeep);
    R(112, 172, 32, 4, p.glassDeep);
    R(113, 173, 30, 2, p.dusk);
    R(113, 173, 30, 1, p.duskHi);
    R(121, 172, 1, 4, p.walnutDeep); R(130, 172, 1, 4, p.walnutDeep);
    R(138, 172, 1, 4, p.walnutDeep);
    R(112, 176, 32, 16, p.oak);
    R(112, 176, 32, 1, p.walnutHi);
    R(114, 179, 12, 10, p.walnutDeep); R(115, 180, 10, 8, p.walnut);
    R(115, 180, 10, 1, p.walnutHi);
    R(130, 179, 12, 10, p.walnutDeep); R(131, 180, 10, 8, p.walnut);
    R(131, 180, 10, 1, p.walnutHi);
    R(126, 184, 4, 3, p.brass); R(126, 184, 4, 1, p.brassHi);
    R(113, 190, 30, 1, '#7a6440');
    R(112, 191, 32, 1, p.ink);
    drawDoorHeader(R, p);
    drawDoorCasing(R, p);
  }

  function drawDoorCasing(R, p) {
    /* The band that repaints over whoever stands in the doorway. It starts at
     * the south wall line: above y176 the casing belongs to the ground pass,
     * because an actor on the approach tile (7,10) stands in front of it and
     * must not be crossed by a frame line. */
    R(108, 176, 5, 16, p.walnutDark); R(110, 177, 1, 14, p.walnutHi);
    R(143, 176, 5, 16, p.walnutDark); R(144, 177, 1, 14, p.walnutMid);
    R(108, 176, 40, 1, p.ink);
  }

  function drawDoorHeader(R, p) {
    /* Casing above the wall line: ground pass only. */
    R(108, 172, 5, 4, p.walnutDark); R(110, 173, 1, 3, p.walnutHi);
    R(143, 172, 5, 4, p.walnutDark); R(144, 173, 1, 3, p.walnutMid);
    R(108, 170, 40, 2, p.ink);
  }

  function drawCeilingFan(R, p) {
    /* The fan hangs at the top of the stairs, over the upper hall: four
     * blades on the pale maple, a short cast underneath so it reads as
     * hanging, and the pull light at the hub.  It is a ceiling element, so it
     * repaints over whoever stands on the top step and over nothing else. */
    R(58, 49, 20, 6, p.fanShade);
    R(90, 49, 20, 6, p.fanShade);
    R(79, 36, 8, 11, p.fanShade);
    R(79, 57, 8, 10, p.fanShade);

    R(54, 46, 20, 6, p.ink);
    R(55, 47, 18, 4, p.walnutDark); R(55, 47, 18, 1, p.walnutMid);
    R(87, 46, 20, 6, p.ink);
    R(88, 47, 18, 4, p.walnutDark); R(88, 47, 18, 1, p.walnutMid);
    R(77, 32, 8, 12, p.ink);
    R(78, 33, 6, 10, p.walnutDark); R(78, 33, 6, 1, p.walnutMid);
    R(77, 54, 8, 10, p.ink);
    R(78, 55, 6, 8, p.walnutDark); R(78, 55, 6, 1, p.walnutMid);

    R(74, 42, 14, 14, p.ink);
    R(75, 43, 12, 12, p.walnutDeep);
    R(77, 45, 8, 8, p.brassDark); R(77, 45, 8, 1, p.brass);
    R(79, 47, 4, 4, p.amber); R(79, 47, 4, 1, p.amberHi);
  }

  /* ----------------------------------------------------------------- props */

  function drawShadow(R, prop, p) {
    /* Contact begins at the actor-foot edge, beyond the painted silhouette. */
    var s = prop.shadow, foot = prop.footY;
    R(s[0] + 2, foot + 2, Math.max(1, s[2] - 4), 1, p.shadow);
    R(s[0] + 1, foot + 1, Math.max(1, s[2] - 2), 1, p.shadowMid);
    R(s[0] + 4, foot, Math.max(1, s[2] - 8), 1, p.shadowDark);
  }

  function drawPlayerContact(R, p) {
    var engine = GAME.Engine, state = engine && engine.state, player = state && state.player;
    if (!state || state.mapId !== 'palmer' || !player ||
        !Number.isFinite(player.x) || !Number.isFinite(player.y)) return;
    var x = Math.round(player.x), y = Math.round(player.y);
    R(x + 3, y + 15, 10, 2, p.shadowMid);
    R(x + 4, y + 16, 8, 2, p.shadowDark);
    R(x + 6, y + 17, 4, 1, p.ink);
  }

  function drawLauraBed(R, p) {
    /* Head against the north wall: a low walnut headboard, two thirds pillow
     * and turned-back sheet, then the quilt with its lodge stripe. */
    R(16, 13, 32, 19, p.ink);
    R(17, 14, 30, 3, p.walnutDark); R(18, 14, 28, 1, p.walnutHi);
    R(17, 17, 30, 14, p.walnutDeep);
    R(19, 18, 26, 6, p.lace); R(19, 18, 26, 1, '#f3eee2');
    R(19, 22, 26, 1, p.laceDim);
    R(31, 18, 1, 6, p.laceDim);
    R(19, 24, 26, 6, p.quilt); R(19, 24, 26, 1, p.quiltHi);
    R(19, 26, 26, 1, p.quiltDeep);
    R(22, 27, 4, 3, p.quiltDeep); R(30, 27, 4, 3, p.quiltDeep);
    R(38, 27, 4, 3, p.quiltDeep);
    R(17, 17, 2, 14, p.walnutDark); R(17, 17, 1, 14, p.walnutHi);
    R(45, 17, 2, 14, p.walnutDark); R(45, 17, 1, 14, p.walnutMid);
    R(17, 30, 30, 2, p.walnutDark); R(18, 30, 28, 1, p.walnutHi);
    R(17, 31, 30, 1, p.ink);
  }

  function drawLauraDresser(R, p) {
    R(96, 10, 16, 22, p.ink);
    R(100, 10, 8, 4, p.ink);
    R(101, 11, 6, 3, '#7a2f36'); R(101, 11, 6, 1, '#a54a4f');
    R(103, 12, 3, 1, p.brassHi);
    R(97, 14, 14, 4, p.walnutDark); R(97, 14, 14, 1, p.walnutHi);
    R(97, 18, 14, 13, p.walnutDeep);
    R(99, 20, 10, 4, p.walnut); R(99, 20, 10, 1, p.walnutHi); R(102, 22, 4, 1, p.brass);
    R(99, 25, 10, 4, p.walnut); R(99, 25, 10, 1, p.walnutHi); R(102, 27, 4, 1, p.brass);
    R(98, 31, 3, 2, p.ink); R(107, 31, 3, 2, p.ink);
    R(97, 31, 14, 1, p.ink);
  }

  function drawSofa(R, p) {
    /* One tile wide: a green armchair, not a sofa the geometry cannot hold.
     * A single seat cushion with one seam, two arms, a skirt and four feet —
     * never two panels, which would read as a cabinet. */
    R(47, 88, 18, 25, p.ink);
    R(49, 89, 14, 9, p.greenDeep);
    R(50, 90, 12, 6, p.green); R(50, 90, 12, 1, p.greenHi);
    R(56, 90, 1, 6, p.greenDeep);
    R(50, 96, 12, 1, p.greenDeep);
    R(47, 94, 5, 15, p.greenDeep);
    R(48, 96, 3, 11, p.green); R(48, 96, 1, 11, p.greenHi);
    R(60, 94, 5, 15, p.greenDeep);
    R(61, 96, 3, 11, p.green); R(63, 96, 1, 11, p.greenDeep);
    R(52, 97, 8, 11, p.green);
    R(52, 97, 8, 1, p.greenHi);
    R(53, 99, 6, 5, p.greenMid);
    R(52, 105, 8, 2, p.greenDeep);
    R(59, 92, 5, 6, '#8a3b3c'); R(59, 92, 5, 1, '#b05a55');
    R(60, 95, 3, 3, '#6d2f31');
    R(48, 108, 16, 3, p.walnutDeep); R(48, 108, 16, 1, p.walnut);
    R(48, 111, 3, 2, p.ink); R(61, 111, 3, 2, p.ink);
    R(47, 111, 18, 1, p.ink);
  }

  function drawSideboard(R, p) {
    /* Leland's phonograph console: the turntable is open, and Laura's framed
     * photograph stands on the right of the lid. */
    R(223, 80, 17, 32, p.ink);
    R(224, 86, 9, 5, p.walnutDeep);
    R(225, 87, 7, 3, p.ink); R(226, 87, 5, 2, '#3c3c3c');
    R(228, 88, 2, 1, '#b0453c');
    R(231, 87, 1, 3, p.brassHi);
    R(233, 80, 7, 11, p.ink);
    R(234, 81, 5, 9, p.brassDark); R(234, 81, 5, 1, p.brass);
    R(235, 82, 3, 7, '#8f9aa4');
    R(235, 83, 3, 3, '#c9b06a'); R(236, 84, 1, 2, '#d8a884');
    R(235, 86, 3, 3, '#b9bfc6');
    R(224, 91, 15, 4, p.walnutDark); R(224, 91, 15, 1, p.walnutHi);
    R(224, 95, 15, 15, p.walnutDeep);
    R(226, 97, 5, 10, p.walnut); R(226, 97, 5, 1, p.walnutHi);
    R(232, 97, 5, 10, p.walnut); R(232, 97, 5, 1, p.walnutHi);
    R(229, 101, 1, 2, p.brass); R(235, 101, 1, 2, p.brass);
    R(226, 108, 11, 1, p.walnutDark);
    R(224, 110, 3, 2, p.ink); R(236, 110, 3, 2, p.ink);
    R(223, 111, 17, 1, p.ink);
  }

  function drawDiningTable(R, p) {
    /* A round-cornered dining table under a cloth: wood rim visible on every
     * side so the top never reads as a bare slab, two places laid, and the
     * vase Sarah keeps filled. */
    R(34, 117, 28, 16, p.ink);
    R(31, 120, 34, 10, p.ink);
    R(35, 118, 26, 2, p.walnutDark);
    R(32, 120, 32, 10, p.walnutDark);
    R(35, 130, 26, 2, p.walnutDark);
    R(35, 118, 26, 1, p.walnutHi); R(33, 120, 30, 1, p.walnutHi);
    R(36, 120, 24, 10, p.cloth);
    R(37, 119, 22, 1, p.cloth);
    R(36, 120, 24, 1, p.clothHi); R(37, 119, 22, 1, p.clothHi);
    R(36, 129, 24, 1, p.clothDim); R(38, 131, 20, 1, p.clothDim);
    R(38, 131, 4, 1, p.cloth); R(46, 131, 4, 1, p.cloth); R(54, 131, 4, 1, p.cloth);
    R(38, 124, 5, 3, p.lace); R(38, 124, 5, 1, '#f0ead9'); R(40, 125, 1, 1, p.laceDim);
    R(53, 122, 5, 3, p.lace); R(53, 122, 5, 1, '#f0ead9'); R(55, 123, 1, 1, p.laceDim);
    R(45, 126, 3, 3, p.lace); R(45, 126, 3, 1, '#f0ead9'); R(48, 127, 1, 1, p.laceDim);
    R(46, 112, 4, 6, p.ink); R(46, 113, 3, 5, '#3f5c4a'); R(46, 113, 3, 1, '#5a7c62');
    R(44, 110, 8, 3, '#a34a55'); R(46, 109, 4, 2, '#c76a70');
    R(43, 111, 2, 2, '#7d3440'); R(50, 111, 2, 2, '#7d3440');
    R(35, 132, 4, 11, p.walnutDark); R(36, 133, 1, 9, p.walnutHi);
    R(57, 132, 4, 11, p.walnutDark); R(58, 133, 1, 9, p.walnutMid);
    R(35, 143, 4, 1, p.ink); R(57, 143, 4, 1, p.ink);
  }

  function drawDiningChairs(R, p) {
    /* Spindle backs, open between the posts: the parquet shows through, so a
     * chair reads as a chair instead of a box. */
    var seats = [33, 49], i, cx;
    for (i = 0; i < seats.length; i++) {
      cx = seats[i];
      R(cx, 146, 14, 3, p.ink);
      R(cx + 1, 146, 12, 2, p.walnut); R(cx + 1, 146, 12, 1, p.walnutHi);
      R(cx, 148, 2, 5, p.walnutDeep); R(cx + 12, 148, 2, 5, p.walnutDeep);
      R(cx + 4, 148, 2, 5, p.walnutDark); R(cx + 8, 148, 2, 5, p.walnutDark);
      R(cx, 153, 14, 5, p.ink);
      R(cx + 1, 153, 12, 4, p.walnutDark); R(cx + 1, 153, 12, 1, p.walnutMid);
      R(cx + 3, 154, 8, 2, p.walnut);
      R(cx + 1, 158, 2, 3, p.walnutDeep); R(cx + 11, 158, 2, 3, p.walnutDeep);
      R(cx + 1, 160, 2, 1, p.ink); R(cx + 11, 160, 2, 1, p.ink);
    }
  }

  function drawProp(R, prop, p) {
    if (prop.id === 'lauraBed') drawLauraBed(R, p);
    else if (prop.id === 'lauraDresser') drawLauraDresser(R, p);
    else if (prop.id === 'sofa') drawSofa(R, p);
    else if (prop.id === 'sideboard') drawSideboard(R, p);
    else if (prop.id === 'diningTable') drawDiningTable(R, p);
    else if (prop.id === 'diningChairs') drawDiningChairs(R, p);
  }

  function drawArchitecture(R, p) {
    R(0, 0, 256, 192, p.ink);
    drawLauraWall(R, p);
    drawLauraFloor(R, p);
    drawLivingFloor(R, p);
    drawFloorLight(R, p);
    drawRug(R, p);
    drawStairWall(R, p);
    drawStairwell(R, p);
    drawStairWallDressing(R, p);
    drawSideWalls(R, p);
    drawLauraWindow(R, p);
    drawLivingWindow(R, p);
    drawSouthWall(R, p);
  }

  function draw(ctx, cx, cy) {
    var R = rectPainter(ctx, cx, cy), i;
    drawArchitecture(R, palette);
    for (i = 0; i < definitions.length; i++) drawShadow(R, definitions[i], palette);
    drawPlayerContact(R, palette);
    for (i = 0; i < definitions.length; i++) drawProp(R, definitions[i], palette);
    drawCeilingFan(R, palette);
  }

  /* Engine intervals are actor-foot intervals. Redraw the matching furniture
   * only; contact shadows remain in the ground pass and never cover actors. */
  function foreground(ctx, cx, cy, minFoot, maxFoot) {
    minFoot = minFoot == null ? -Infinity : minFoot;
    maxFoot = maxFoot == null ? Infinity : maxFoot;
    var R = rectPainter(ctx, cx, cy), i, prop;
    for (i = 0; i < definitions.length; i++) {
      prop = definitions[i];
      if (prop.footY < minFoot || prop.footY >= maxFoot) continue;
      drawProp(R, prop, palette);
    }
    if (fanFoot >= minFoot && fanFoot < maxFoot) drawCeilingFan(R, palette);
    if (doorFoot >= minFoot && doorFoot < maxFoot) drawDoorCasing(R, palette);
  }

  /* Single prop, at its authored place: the contract test measures each
   * silhouette on its own instead of guessing which one a depth band drew. */
  function paintProp(ctx, cx, cy, id) {
    var R = rectPainter(ctx, cx, cy), i;
    for (i = 0; i < definitions.length; i++) {
      if (definitions[i].id === id) drawProp(R, definitions[i], palette);
    }
  }

  GAME.PalmerArt = {
    draw: draw,
    foreground: foreground,
    paintProp: paintProp,
    definitions: definitions,
    props: definitions,
    palette: palette,
    fanFoot: fanFoot,
    doorFoot: doorFoot
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.PalmerArt;
})();
