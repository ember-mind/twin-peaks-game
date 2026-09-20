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
    wallDeep: '#5e5340', wall: '#7a6a52', wallHi: '#8e7c61',
    mapleShade: '#8a6e46', mapleShade2: '#9c7f55',
    maple: '#b49368', mapleHi: '#c4a478', mapleDark: '#96784c', mapleSeam: '#a5875b',
    parquetDark: '#6b4526', parquet: '#8a5b31', parquetMid: '#956338',
    parquetHi: '#a5713f', parquetSeam: '#7b5029',
    poolFloor: '#a9793f', poolFloorMid: '#bb8b4b', poolFloorHi: '#cb9d59',
    poolSeam: '#8f6330', duskFloor: '#8d7052', duskFloorHi: '#9a7c58',
    duskSeam: '#6f5540', duskBar: '#7b6249',
    rugDeep: '#3a1d21', rugDark: '#5a2a2f', rug: '#77373a', rugMid: '#8a4245',
    rugCream: '#c6b388', rugOchre: '#a8863f',
    woolDeep: '#4a3520', wool: '#6f512e', woolHi: '#8a6739', woolCream: '#b09261',
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
    fanUmbra: '#9a7a52', fanPenumbra: '#a8875d',
    fanEdge: '#6f5836', fanBlade: '#8a6f45', fanBladeHi: '#a08254',
    shadow: '#4a3120', shadowMid: '#35220f', shadowDark: '#241608'
  };

  /* Grounded furniture only: the solid cells the map actually carries.
   * The living room carries two furnished groups now: the seating cluster on
   * the west half of the rug (armchair, low table, wing chair) and the nook
   * in the right third (piano, phonograph console, club chair, phone table),
   * which used to be bare floorboards with one oval rug on them. */
  var definitions = [
    {id:'lauraBed', cells:[[1,1],[2,1]], bounds:[16,16,32,20], shadow:[16,28,32,4]},
    {id:'lauraDresser', cells:[[6,1]], bounds:[96,10,16,23], shadow:[96,28,16,4]},
    {id:'wingChair', cells:[[7,5]], bounds:[111,78,18,20], shadow:[112,92,16,4]},
    {id:'sofa', cells:[[3,6]], bounds:[47,88,18,25], shadow:[48,108,16,4]},
    {id:'piano', cells:[[13,6]], bounds:[206,84,18,28], shadow:[208,108,16,4]},
    {id:'sideboard', cells:[[14,6]], bounds:[223,84,17,28], shadow:[224,108,16,4]},
    {id:'coffeeTable', cells:[[5,7]], bounds:[78,116,20,14], shadow:[80,124,16,4]},
    {id:'diningTable', cells:[[2,8],[3,8]], bounds:[31,109,34,35], shadow:[32,140,32,4]},
    {id:'nookChair', cells:[[12,8]], bounds:[190,124,18,22], shadow:[192,140,16,4]},
    {id:'phoneTable', cells:[[13,8]], bounds:[208,118,16,26], shadow:[208,140,16,4]},
    {id:'diningChairs', cells:[[2,9],[3,9]], bounds:[33,146,30,15], shadow:[32,156,32,4]}
  ];

  /* The two floor-level clusters. They are published because the contract
   * checks that nothing in this room sits as an island: the burgundy rug has
   * to reach the armchair's feet and the braided oval has to reach under the
   * phonograph console. */
  var RUG = { x: 64, y: 96, w: 112, h: 48 };
  var WOOL = { x: 186, y: 106, w: 58, h: 42 };

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
    /* Row 0 is the only wall face the upper floor shows, and at 1x it was
     * reading as a pink ceiling stripe over a tan void.  It is now a proper
     * wall: cornice, plaster field with battens, a dark wall foot, and the
     * contact shadow on the boards below it that tells the eye where the
     * wall stops and the floor begins.  The hangings overhang two rows down
     * into the first walking row, the way a tall frame does; an actor
     * standing there is drawn in front of them. */
    var x;
    R(0, 0, 256, 16, p.wallDeep);
    R(0, 0, 256, 2, p.ink);
    R(0, 2, 256, 2, p.walnutDark); R(0, 3, 256, 1, p.walnutHi);
    R(0, 4, 256, 10, p.wall);
    R(0, 4, 256, 1, p.wallHi);
    for (x = 16; x < 256; x += 32) { R(x, 4, 1, 10, p.wallDeep); R(x + 1, 4, 1, 10, p.wallHi); }
    R(0, 13, 256, 3, p.walnutDeep);
    R(0, 13, 256, 1, p.walnutMid);
    drawWallCluster(R, p);
  }

  function drawWallFootShadow(R, p) {
    /* Where the wall meets the boards: two stepped rows on the floor itself,
     * painted after it.  This is the strongest cue that the upper third is a
     * room seen from above and not another wall. */
    var x;
    R(0, 16, 256, 3, p.walnutDeep);
    R(0, 19, 256, 2, p.mapleShade);
    R(0, 21, 256, 2, p.mapleShade2);
    for (x = 6; x < 250; x += 24) R(x, 23, 5, 1, p.mapleShade2);
  }

  function framedPhoto(R, p, x, y, w, h, sitter) {
    /* A hung frame: ink edge, brass or walnut moulding, cream mat, and inside
     * it a figure small enough to be a photograph and large enough to read as
     * one.  `sitter` picks the hair so the cluster is a family, not a stamp. */
    R(x, y, w, h, p.ink);
    R(x + 1, y + 1, w - 2, h - 2, sitter === 2 ? p.brassDark : p.walnutMid);
    R(x + 1, y + 1, w - 2, 1, sitter === 2 ? p.brass : p.walnutHi);
    R(x + 2, y + 2, w - 4, h - 4, p.walnutDeep);
    R(x + 3, y + 3, w - 6, h - 6, '#cfc3a0');
    R(x + 4, y + 4, w - 8, h - 8, '#8f9aa4');
    var cx = x + (w >> 1);
    var hair = sitter === 0 ? '#cdae68' : (sitter === 1 ? '#6b5140' : '#9a8f86');
    R(cx - 2, y + 5, 4, 3, hair);
    R(cx - 1, y + 7, 2, 2, '#e0b089');
    R(cx - 3, y + 9, 6, h - 13, sitter === 1 ? '#5d5f80' : '#b9bfc6');
    R(x + 1, y + h - 2, w - 2, 1, p.ink);
  }

  function wallSconce(R, p, x) {
    /* Warm pool on the plaster first, then the shade: three hard steps, the
     * joints repainted warm through them. */
    var i;
    R(x - 8, 4, 28, 10, p.warmWall);
    R(x - 4, 4, 20, 10, p.warmWallMid);
    R(x, 4, 12, 10, p.warmWallHi);
    for (i = -8; i < 20; i += 32) R(x + i, 4, 1, 10, '#3a2716');
    R(x + 2, 1, 8, 3, p.brassDark); R(x + 3, 1, 6, 1, p.brass);
    R(x, 4, 12, 5, p.amber); R(x + 1, 4, 10, 2, p.amberHi);
    R(x + 4, 4, 4, 5, '#fff0c4');
    R(x, 9, 12, 1, p.brassDark);
  }

  function drawWallCluster(R, p) {
    /* The reading matter the band was missing: a family group of four hung
     * photographs, a wall clock, and a sconce either side of them. */
    wallSconce(R, p, 84);
    wallSconce(R, p, 214);
    framedPhoto(R, p, 116, 3, 18, 17, 0);
    framedPhoto(R, p, 136, 6, 16, 14, 1);
    framedPhoto(R, p, 155, 2, 13, 11, 2);
    framedPhoto(R, p, 170, 7, 14, 12, 1);
    /* Wall clock: ink case, cream dial, two hands. */
    R(190, 2, 16, 17, p.ink);
    R(191, 3, 14, 15, p.walnutMid); R(191, 3, 14, 1, p.walnutHi);
    R(193, 5, 10, 11, p.walnutDeep);
    R(194, 6, 8, 9, '#e5dcc0');
    R(194, 6, 8, 1, '#f3eee2');
    R(197, 7, 1, 4, p.ink); R(198, 10, 3, 1, p.ink);
    R(197, 13, 1, 2, p.brassDark);
    R(191, 18, 14, 1, p.ink);
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
    R(40, 36, 28, 3, p.roseDeep);
    R(36, 38, 36, 3, p.roseDeep);
    R(32, 40, 44, 12, p.roseDeep);
    R(36, 51, 36, 3, p.roseDeep);
    R(40, 53, 28, 3, p.roseDeep);
    R(42, 38, 24, 3, p.rose);
    R(38, 40, 32, 2, p.rose);
    R(34, 42, 40, 8, p.rose);
    R(38, 49, 32, 2, p.rose);
    R(42, 51, 24, 3, p.rose);
    R(34, 43, 40, 1, p.roseHi); R(36, 48, 36, 1, p.roseHi);
    R(38, 41, 32, 1, p.roseDeep); R(38, 46, 32, 1, p.roseDeep);
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
    /* A second sconce over the seating group, so the armchair, the rug under
     * it and the light above it read as one cluster. */
    R(30, 66, 32, 10, p.warmWall);
    R(35, 66, 22, 10, p.warmWallMid);
    R(40, 66, 12, 10, p.warmWallHi);
    for (x = 32; x < 60; x += 16) { R(x, 67, 2, 8, '#3a2716'); R(x + 2, 68, 1, 6, '#b08a54'); }
    R(30, 66, 32, 1, '#c09660');
    R(42, 64, 8, 3, p.brassDark); R(43, 64, 6, 1, p.brass);
    R(40, 67, 12, 5, p.amber); R(41, 67, 10, 2, p.amberHi);
    R(44, 67, 4, 5, '#fff0c4');
    R(40, 72, 12, 1, p.brassDark);
    /* Framed landscape west of the stairs — the room's one picture. */
    R(116, 66, 24, 12, p.ink);
    R(117, 67, 22, 10, p.walnutMid); R(117, 67, 22, 1, p.walnutHi);
    R(118, 68, 20, 8, p.walnutDeep);
    R(119, 69, 18, 6, '#6f8a74');
    R(119, 72, 18, 3, '#3f5c4a');
    R(122, 70, 3, 4, '#2c4335'); R(128, 69, 3, 5, '#2c4335'); R(133, 71, 2, 3, '#2c4335');
    R(119, 69, 18, 1, '#93a992');
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
    R(30, 80, 36, 18, p.poolFloor);
    R(34, 80, 28, 13, p.poolFloorMid);
    R(38, 80, 18, 8, p.poolFloorHi);
    R(42, 80, 10, 4, '#dcae66');
    for (y = 88; y < 98; y += 8) R(30, y, 36, 1, p.poolSeam);
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
    /* The rug reaches west to the armchair's feet, so the seat, the rug and
     * the light over it are one group instead of three islands.  It is floor
     * level and walkable, like the runner: an actor crossing it stands on it. */
    R(RUG.x, RUG.y, RUG.w, RUG.h, p.rugDeep);
    R(66, 98, 108, 44, p.rugDark);
    R(69, 101, 102, 38, p.rug);
    R(69, 101, 102, 1, p.rugMid);
    R(71, 103, 98, 2, p.rugCream); R(71, 135, 98, 2, p.rugCream);
    R(71, 103, 2, 34, p.rugCream); R(167, 103, 2, 34, p.rugCream);
    R(73, 105, 94, 1, p.rugDeep); R(73, 134, 94, 1, p.rugDeep);
    /* One stepped medallion, tip up, and four corner marks. */
    R(126, 116, 18, 6, p.rugOchre);
    R(131, 111, 8, 16, p.rugOchre);
    R(133, 109, 4, 20, p.rugOchre);
    R(130, 117, 10, 4, p.rugCream);
    R(132, 114, 6, 10, p.rugCream);
    R(133, 117, 4, 4, p.rugDeep);
    R(76, 108, 6, 2, p.rugOchre); R(76, 108, 2, 6, p.rugOchre);
    R(158, 108, 6, 2, p.rugOchre); R(162, 108, 2, 6, p.rugOchre);
    R(76, 130, 2, 6, p.rugOchre); R(76, 134, 6, 2, p.rugOchre);
    R(162, 130, 2, 6, p.rugOchre); R(158, 134, 6, 2, p.rugOchre);
    /* Two creases, nothing else. */
    /* Two smaller lozenges flank the medallion, so the widened field is not
     * half an empty red slab. */
    R(84, 116, 14, 6, p.rugOchre); R(88, 112, 6, 14, p.rugOchre);
    R(87, 117, 8, 4, p.rugDark); R(89, 115, 4, 8, p.rugDark);
    R(160, 116, 14, 6, p.rugOchre); R(164, 112, 6, 14, p.rugOchre);
    R(163, 117, 8, 4, p.rugDark); R(165, 115, 4, 8, p.rugDark);
    R(84, 130, 14, 1, p.rugDeep); R(85, 131, 12, 1, p.rugMid);
    R(146, 128, 16, 1, p.rugDeep); R(147, 129, 14, 1, p.rugMid);
  }

  function drawRunner(R, p) {
    /* A runner from the front door up to the rug: the same burgundy wool, so
     * the two read as one set and the empty approach column has a floor
     * people actually walk on.  Flat, walkable, painted in the ground pass —
     * an actor crossing it stands on it, which is what a runner is for. */
    R(106, 144, 44, 32, p.rugDeep);
    R(108, 144, 40, 32, p.rugDark);
    R(110, 145, 36, 31, p.rug);
    R(112, 144, 2, 32, p.rugCream); R(142, 144, 2, 32, p.rugCream);
    R(115, 144, 1, 32, p.rugDeep); R(140, 144, 1, 32, p.rugDeep);
    var y;
    for (y = 150; y < 176; y += 12) {
      R(124, y, 8, 3, p.rugOchre);
      R(126, y - 2, 4, 7, p.rugOchre);
      R(126, y + 1, 4, 1, p.rugCream);
    }
    R(110, 172, 36, 1, p.rugDeep); R(110, 173, 36, 1, p.rugMid);
  }

  function drawWoolRug(R, p) {
    /* The braided oval reaches north under the phonograph console, so the
     * console, the rug it stands on and Laura's portrait above it are one
     * group.  On its own in the corner it read as a third island. */
    var rings = [
      [p.woolDeep, 198, WOOL.y, 32, 3, 192, WOOL.y + 3, 44, 3, WOOL.x, WOOL.y + 6, WOOL.w, 30,
        192, WOOL.y + 36, 44, 3, 198, WOOL.y + 39, 32, 3],
      [p.wool, 200, 108, 28, 3, 194, 111, 40, 2, 188, 114, 54, 26, 194, 140, 40, 2, 200, 143, 28, 3],
      [p.woolHi, 202, 110, 24, 3, 196, 113, 36, 2, 190, 116, 50, 22, 196, 138, 36, 2, 202, 141, 24, 3],
      [p.woolCream, 204, 112, 20, 3, 198, 115, 32, 2, 192, 118, 46, 18, 198, 136, 32, 2, 204, 139, 20, 3]
    ];
    var i, j, ring;
    for (i = 0; i < rings.length; i++) {
      ring = rings[i];
      for (j = 1; j < ring.length; j += 4) R(ring[j], ring[j + 1], ring[j + 2], ring[j + 3], ring[0]);
    }
    R(200, 122, 36, 10, p.wool);
    R(204, 124, 28, 1, p.woolHi); R(204, 129, 28, 1, p.woolHi);
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

  function drawLauraPortrait(R, p) {
    /* Laura on the east wall above Leland's console, at the size the other
     * interiors hang a portrait (13x18): walnut frame, cream mat, and inside
     * it a blonde head that reads as a face at 1x, not a light speck. */
    R(242, 66, 13, 18, p.ink);
    R(243, 67, 11, 16, p.walnutMid); R(243, 67, 11, 1, p.walnutHi);
    R(243, 67, 1, 16, p.walnutHi);
    R(244, 68, 9, 14, p.walnutDeep);
    R(245, 69, 7, 12, '#cfc3a0');
    R(245, 69, 7, 1, '#e5dcc0');
    R(246, 70, 5, 10, '#8f9aa4');
    R(246, 71, 5, 4, '#cdae68');
    R(246, 71, 5, 1, '#e0c584');
    R(247, 73, 3, 4, '#e0b089');
    R(246, 74, 1, 4, '#b8973f'); R(250, 74, 1, 4, '#b8973f');
    R(247, 74, 1, 1, p.ink); R(249, 74, 1, 1, p.ink);
    R(248, 76, 1, 1, '#a35f5c');
    R(246, 77, 5, 3, '#b9bfc6'); R(246, 77, 5, 1, '#d2d7dc');
    R(248, 78, 1, 2, '#8f9aa4');
    R(242, 84, 13, 1, p.ink);
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
    /* Header above the wall line is solid wood: an actor on the approach tile
     * stands in front of it.  The fanlight lives inside the wall band, above
     * the leaf, instead of sitting at their ankles. */
    R(112, 172, 32, 4, p.walnutDark); R(112, 172, 32, 1, p.walnutHi);
    R(112, 176, 32, 5, p.glassDeep);
    R(113, 177, 30, 3, p.dusk);
    R(113, 177, 30, 1, p.duskHi);
    R(121, 176, 1, 5, p.walnutDeep); R(130, 176, 1, 5, p.walnutDeep);
    R(138, 176, 1, 5, p.walnutDeep);
    R(112, 181, 32, 1, p.walnutDeep);
    R(112, 182, 32, 10, p.oak);
    R(112, 182, 32, 1, p.walnutHi);
    R(115, 184, 19, 6, p.walnutDeep); R(116, 185, 17, 4, p.walnut);
    R(116, 185, 17, 1, p.walnutHi);
    R(118, 186, 6, 2, p.walnutDeep); R(126, 186, 6, 2, p.walnutDeep);
    R(137, 185, 4, 4, p.brass); R(137, 185, 4, 1, p.brassHi);
    R(138, 189, 2, 1, p.brassDark);
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

  function drawFanShadow(R, p) {
    /* The fan's cast on the maple: a penumbra one step under the floor and an
     * umbra two, offset down and east of the blades.  Ground pass only — a
     * floor shadow must never repaint over an actor, only the blades do. */
    var blades = [[65, 45, 14, 5], [88, 45, 14, 5], [80, 33, 7, 10], [80, 52, 7, 8]];
    var i, b;
    for (i = 0; i < blades.length; i++) {
      b = blades[i];
      R(b[0] - 1, b[1] - 1, b[2] + 2, b[3] + 2, p.fanPenumbra);
    }
    R(77, 41, 13, 13, p.fanPenumbra);
    for (i = 0; i < blades.length; i++) {
      b = blades[i];
      R(b[0], b[1], b[2], b[3], p.fanUmbra);
    }
    R(78, 42, 11, 11, p.fanUmbra);
  }

  function drawCeilingFan(R, p) {
    /* A fixture on the ceiling, not a stain on the wall.  The blades keep no
     * ink outline: an ink cross on pale maple was the highest contrast thing
     * in the upper third and pulled the eye off the room.  They sit two steps
     * under the floor instead, with the moon side of each blade one step
     * lighter, and only the hub carries a dark edge. */
    R(62, 40, 14, 5, p.fanEdge);
    R(63, 41, 12, 3, p.fanBlade); R(63, 41, 12, 1, p.fanBladeHi);
    R(85, 40, 14, 5, p.fanEdge);
    R(86, 41, 12, 3, p.fanBlade); R(86, 41, 12, 1, p.fanBladeHi);
    R(77, 28, 7, 10, p.fanEdge);
    R(78, 29, 5, 8, p.fanBlade); R(78, 29, 5, 1, p.fanBladeHi);
    R(77, 47, 7, 8, p.fanEdge);
    R(78, 48, 5, 6, p.fanBlade); R(78, 48, 5, 1, p.fanBladeHi);

    R(75, 37, 11, 11, p.walnutDark);
    R(76, 38, 9, 9, p.walnutMid);
    R(78, 40, 5, 5, p.brassDark); R(78, 40, 5, 1, p.brass);
    R(79, 41, 3, 3, p.amber); R(79, 41, 3, 1, p.amberHi);
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
    /* Head at the WEST and the whole bed standing BELOW the wall foot: a bed
     * thirty-two long and sixteen deep with the pillow at one end reads as a
     * bed from above.  Head at the north, overlapping the wall band, made a
     * pale rectangle sitting on the wall, which at 1x read as a window. */
    R(16, 16, 32, 18, p.ink);
    R(17, 17, 5, 16, p.walnutDark);
    R(18, 18, 3, 14, p.walnut); R(18, 18, 1, 14, p.walnutHi);
    R(22, 17, 24, 16, p.walnutDeep);
    R(23, 18, 6, 14, p.lace); R(23, 18, 6, 1, '#f3eee2');
    R(23, 24, 6, 1, p.laceDim);
    R(29, 18, 3, 14, p.linen); R(29, 18, 3, 1, p.lace);
    R(32, 18, 13, 14, p.quilt); R(32, 18, 13, 1, p.quiltHi);
    R(32, 22, 13, 1, p.quiltDeep); R(32, 28, 13, 1, p.quiltDeep);
    R(35, 19, 2, 3, p.quiltDeep); R(40, 23, 2, 4, p.quiltDeep);
    R(35, 29, 2, 3, p.quiltDeep);
    R(45, 17, 2, 16, p.walnutDark); R(45, 17, 1, 16, p.walnutMid);
    R(17, 32, 30, 2, p.walnutDark); R(18, 32, 28, 1, p.walnutHi);
    R(17, 34, 3, 2, p.ink); R(44, 34, 3, 2, p.ink);
    R(17, 33, 30, 1, p.ink);
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
    R(223, 84, 17, 28, p.ink);
    R(223, 84, 17, 7, p.walnutDeep);
    R(224, 85, 15, 5, p.walnutDark); R(224, 85, 15, 1, p.walnutMid);
    R(226, 86, 9, 3, p.ink); R(227, 86, 7, 2, '#3c3c3c');
    R(230, 87, 2, 1, '#b0453c');
    R(236, 85, 1, 4, p.brassHi); R(235, 88, 3, 1, p.brass);
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
    /* Two objects of different shape, size and height: a folded newspaper
     * across the left of the cloth and one cup on a saucer low to the right.
     * Never a symmetric pair, which reads as a pair of eyes at 1x. */
    R(37, 121, 15, 6, p.laceDim);
    R(37, 121, 15, 1, p.lace); R(37, 121, 1, 6, p.lace);
    R(39, 123, 11, 1, '#8b8574'); R(39, 125, 8, 1, '#8b8574');
    R(44, 121, 1, 6, '#8b8574');
    R(52, 125, 8, 4, p.lace); R(52, 125, 8, 1, '#f0ead9');
    R(53, 126, 6, 2, p.laceDim);
    R(52, 112, 4, 7, p.ink); R(52, 113, 3, 6, '#3f5c4a'); R(52, 113, 3, 1, '#5a7c62');
    R(50, 110, 8, 3, '#a34a55'); R(52, 109, 4, 2, '#c76a70');
    R(49, 111, 2, 2, '#7d3440'); R(56, 111, 2, 2, '#7d3440');
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

  function drawWingChair(R, p) {
    /* A wing chair with its back to the stair wall, north of the rug: the
     * group has a third seat, and the actor who walks the rug passes in front
     * of it.  The wings are a value darker than the inner back and the lace
     * antimacassar sits off centre, so the back never reads as a flat slab
     * with a symmetric pair of marks on it. */
    R(111, 78, 18, 20, p.ink);
    R(111, 79, 4, 12, '#4d353a'); R(111, 79, 1, 12, '#5c3f45');
    R(125, 79, 4, 12, '#4d353a');
    R(115, 79, 10, 10, '#5c3f45');
    R(116, 80, 8, 8, p.roseDeep); R(116, 80, 8, 1, p.rose);
    R(117, 80, 5, 4, p.lace); R(117, 80, 5, 1, '#f3eee2');
    R(117, 83, 5, 1, p.laceDim);
    R(115, 88, 10, 6, p.roseDeep); R(115, 88, 10, 1, p.rose);
    R(118, 90, 4, 2, '#5c3f45');
    R(111, 88, 4, 3, '#5c3f45'); R(125, 88, 4, 3, '#4d353a');
    R(113, 94, 3, 3, p.walnutDeep); R(124, 94, 3, 3, p.walnutDeep);
    R(113, 97, 3, 1, p.ink); R(124, 97, 3, 1, p.ink);
  }

  function drawCoffeeTable(R, p) {
    /* The low table on the rug in front of the armchair: the seat, the rug
     * and the table are the conversation group the room never had.  An oak
     * top, a cream magazine and a brass bowl, so it separates from the
     * burgundy field instead of sinking into it. */
    R(78, 116, 20, 10, p.ink);
    R(79, 117, 18, 8, p.walnut); R(79, 117, 18, 1, p.walnutHi);
    R(81, 118, 14, 6, p.oak); R(81, 118, 14, 1, p.mapleHi);
    R(82, 119, 7, 4, p.lace); R(82, 119, 7, 1, '#f3eee2');
    R(84, 121, 4, 1, p.laceDim);
    R(91, 119, 4, 3, p.brassDark); R(91, 119, 4, 1, p.brass);
    R(92, 120, 2, 1, p.brassHi);
    R(80, 126, 3, 3, p.walnutDeep); R(93, 126, 3, 3, p.walnutDeep);
    R(80, 129, 3, 1, p.ink); R(93, 129, 3, 1, p.ink);
  }

  function drawPiano(R, p) {
    /* Leland's upright, beside the phonograph console: the keyboard band is
     * the one pale horizontal in the right third, so the nook has a shape
     * that reads at 1x instead of a second cabinet. */
    R(206, 84, 18, 28, p.ink);
    R(207, 85, 16, 6, p.walnutDark); R(207, 85, 16, 1, p.walnutHi);
    R(209, 86, 12, 4, p.walnutDeep);
    R(211, 87, 8, 2, p.brassDark); R(211, 87, 8, 1, p.brass);
    R(207, 91, 16, 6, p.walnutDeep); R(207, 91, 16, 1, p.walnutMid);
    R(208, 97, 14, 4, p.lace); R(208, 97, 14, 1, '#f3eee2');
    R(210, 97, 1, 3, p.ink); R(212, 97, 1, 3, p.ink); R(215, 97, 1, 3, p.ink);
    R(217, 97, 1, 3, p.ink); R(219, 97, 1, 3, p.ink);
    R(207, 101, 16, 7, p.walnutDark); R(208, 102, 14, 1, p.walnutMid);
    R(212, 104, 6, 2, p.walnut);
    R(213, 108, 4, 2, p.brass);
    R(207, 108, 3, 3, p.walnutDeep); R(220, 108, 3, 3, p.walnutDeep);
    R(207, 111, 3, 1, p.ink); R(220, 111, 3, 1, p.ink);
  }

  function drawNookChair(R, p) {
    /* Slate club chair standing on the braided oval, turned into the room:
     * low back, rolled arms and a rose throw, so it is neither the green
     * armchair nor the wing chair repeated. */
    R(190, 124, 18, 22, p.ink);
    R(192, 125, 14, 7, p.quiltDeep);
    R(193, 126, 12, 4, p.quilt); R(193, 126, 12, 1, p.quiltHi);
    R(199, 126, 1, 4, p.quiltDeep);
    R(190, 129, 6, 11, p.quiltDeep);
    R(191, 130, 4, 8, p.quilt); R(191, 130, 1, 8, p.quiltHi);
    R(202, 129, 6, 11, p.quiltDeep);
    R(203, 130, 4, 5, p.roseDeep); R(203, 130, 4, 1, p.rose);
    R(203, 136, 4, 3, p.quilt); R(206, 136, 1, 3, p.quiltDeep);
    R(196, 131, 6, 9, p.quilt); R(196, 131, 6, 1, p.quiltHi);
    R(196, 137, 6, 1, p.quiltDeep);
    R(191, 140, 16, 3, p.walnutDeep); R(191, 140, 16, 1, p.walnut);
    R(191, 143, 3, 2, p.ink); R(204, 143, 3, 2, p.ink);
    R(190, 145, 18, 1, p.ink);
  }

  function drawPhoneTable(R, p) {
    /* The telephone table Sarah answers from: legs open to the parquet, a
     * doily on the top and the black handset that gives the corner its one
     * hard dark note. */
    R(210, 118, 12, 3, p.ink); R(210, 118, 12, 1, '#4a4a4a');
    R(211, 121, 10, 4, '#2a2a2a'); R(211, 121, 10, 1, '#4a4a4a');
    R(214, 122, 4, 2, p.laceDim);
    R(208, 125, 16, 4, p.walnutDark); R(208, 125, 16, 1, p.walnutHi);
    R(211, 126, 10, 2, p.lace); R(211, 126, 10, 1, '#f0ead9');
    R(209, 129, 14, 3, p.walnutDeep); R(209, 129, 14, 1, p.walnut);
    R(210, 132, 3, 10, p.walnutDark); R(219, 132, 3, 10, p.walnutDark);
    R(211, 133, 1, 8, p.walnutMid);
    R(212, 138, 8, 1, p.walnutDeep);
    R(210, 142, 3, 2, p.ink); R(219, 142, 3, 2, p.ink);
  }

  function drawProp(R, prop, p) {
    if (prop.id === 'lauraBed') drawLauraBed(R, p);
    else if (prop.id === 'lauraDresser') drawLauraDresser(R, p);
    else if (prop.id === 'sofa') drawSofa(R, p);
    else if (prop.id === 'sideboard') drawSideboard(R, p);
    else if (prop.id === 'diningTable') drawDiningTable(R, p);
    else if (prop.id === 'diningChairs') drawDiningChairs(R, p);
    else if (prop.id === 'wingChair') drawWingChair(R, p);
    else if (prop.id === 'coffeeTable') drawCoffeeTable(R, p);
    else if (prop.id === 'piano') drawPiano(R, p);
    else if (prop.id === 'nookChair') drawNookChair(R, p);
    else if (prop.id === 'phoneTable') drawPhoneTable(R, p);
  }

  function drawArchitecture(R, p) {
    R(0, 0, 256, 192, p.ink);
    drawLauraWall(R, p);
    drawLauraFloor(R, p);
    drawWallFootShadow(R, p);
    drawFanShadow(R, p);
    drawLivingFloor(R, p);
    drawFloorLight(R, p);
    drawRug(R, p);
    drawRunner(R, p);
    drawWoolRug(R, p);
    drawStairWall(R, p);
    drawStairwell(R, p);
    drawStairWallDressing(R, p);
    drawSideWalls(R, p);
    drawLauraWindow(R, p);
    drawLivingWindow(R, p);
    drawLauraPortrait(R, p);
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
    rug: RUG,
    wool: WOOL,
    fanFoot: fanFoot,
    doorFoot: doorFoot
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.PalmerArt;
})();
