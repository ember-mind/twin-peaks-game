/* Great Northern room 315 — 256x192 authored native pixels.
 * Flat orthographic rectangles only: no gradients, paths, smoothing or noise.
 * Two light roles: the cool dawn plane from the north window, and one warm
 * tungsten pool from the bedside lamp that was never switched off. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;

  var palette = {
    ink: '#1b201e',
    walnutDeep: '#2d1f18', walnutDark: '#432d20', walnut: '#5e4130',
    walnutMid: '#77553c', walnutHi: '#9d7249', walnutCool: '#514536',
    pineDeep: '#6c6e5a', pine: '#8b8c74', pineMid: '#9b9c83',
    pineWarm: '#8f886d', pineWarmHi: '#9d9271',
    carpetDeep: '#1d3034', carpetDark: '#22383c', carpet: '#2a4448',
    carpetMid: '#2d484c', carpetHi: '#2f4a4e',
    floorDawn: '#3d5762', floorDawnHi: '#4f6c78',
    floorDawnDim: '#36505a', floorDawnFar: '#2c4a52',
    poolCarpet: '#5a6055', poolCarpetMid: '#5d6650', poolCarpetHi: '#6a6d4e',
    quiltDeep: '#3f6260', quilt: '#4f7674', quiltHi: '#5d8582',
    linenDark: '#a5a48f', linen: '#c2c0aa', cream: '#dbd8c0', creamHi: '#f1ecdb',
    brassDark: '#8a6a2e', brass: '#c39a45', brassHi: '#f0d08d',
    amberDark: '#6f4c22', amber: '#d2a342', amberHi: '#ffe6a4', amberCore: '#fff2c8',
    ochreDark: '#5f4519', ochre: '#a17a2a',
    blanketDark: '#3d3020', blanket: '#5c4830', blanketHi: '#7a6242',
    dawnDeep: '#3f5570', dawn: '#6d84a0', dawnMid: '#8a9db4',
    dawnHi: '#b9c6d2', dawnPale: '#d0dae2',
    glassDark: '#2b3b48', muntin: '#33424e',
    curtainDeep: '#1d2f27', curtain: '#2b4437', curtainHi: '#3d5d49',
    steelDeep: '#232a2c', steelDark: '#3a4446', steelHi: '#8b9698',
    shadow: '#23393d', shadowMid: '#1d3034', shadowDark: '#16262a'
  };

  /* Grounded furniture only. Wall-mounted elements (headboard, lamp shade,
   * window, curtains, print, mirror, wainscot, hall door) are architecture. */
  var definitions = [
    {id:'bed', cells:[[1,3],[2,3],[3,3],[1,4],[2,4],[3,4],[1,5],[2,5],[3,5]],
      bounds:[16,46,48,50], shadow:[16,92,48,4]},
    {id:'bedsideTable', cells:[[4,3]], bounds:[64,38,16,26], shadow:[64,60,16,4]},
    {id:'desk', cells:[[7,3],[8,3],[9,3]], bounds:[112,36,48,28], shadow:[112,60,48,4]},
    {id:'dresser', cells:[[12,3],[13,3]], bounds:[192,42,32,22], shadow:[192,60,32,4]},
    {id:'luggageStand', cells:[[13,7]], bounds:[205,104,22,24], shadow:[206,124,20,4]}
  ];

  function southEdge(cells) {
    var row = -1, i;
    for (i=0; i<cells.length; i++) if (cells[i][1] > row) row = cells[i][1];
    return (row + 1) * TILE;
  }
  definitions.forEach(function (prop) { prop.footY = southEdge(prop.cells); });

  function rectPainter(ctx,cx,cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    return function (x,y,w,h,color) {
      ctx.fillStyle = color;
      ctx.fillRect(x-cx,y-cy,w,h);
    };
  }

  function drawCarpetField(R,p) {
    /* Slate-teal carpet is the quietest surface in the frame: three values
     * three points apart, joined into broad runs so the field never grids. */
    var values=[p.carpet,p.carpetMid,p.carpetHi];
    var rows=[
      '00111100001110',
      '01111000011110',
      '00110000111100',
      '01110001112000',
      '11122222110000',
      '01222221110001',
      '00122111000111',
      '00111000011111'
    ];
    var row,col,start,value;
    for (row=0;row<rows.length;row++) {
      start=0; value=rows[row].charAt(0);
      for (col=1;col<=14;col++) {
        if (col<14 && rows[row].charAt(col)===value) continue;
        R(16+start*16,48+row*16,(col-start)*16,16,values[+value]);
        start=col; value=rows[row].charAt(col);
      }
    }

    /* One quiet border band, inset from the walls, as in the concept. */
    R(24,56,208,4,p.carpetDark); R(24,164,208,4,p.carpetDark);
    R(24,56,4,112,p.carpetDark); R(228,56,4,112,p.carpetDark);
    R(24,56,208,1,p.carpetDeep); R(24,167,208,1,p.carpetDeep);
    R(24,56,1,112,p.carpetDeep); R(231,56,1,112,p.carpetDeep);

    /* Cool dawn plane. The near step keeps the window's own brightness and
     * carries the bar shadows. The far step falls back to within a few luma
     * of the carpet: only the three panes still travel, splayed as they go. */
    R(104,64,64,24,p.floorDawnHi);
    R(126,64,3,24,p.floorDawn); R(146,64,3,24,p.floorDawn);
    R(100,88,72,4,p.floorDawnFar); R(96,92,80,20,p.floorDawnFar);
    R(102,88,23,12,p.floorDawnDim); R(128,88,19,12,p.floorDawnDim);
    R(150,88,20,12,p.floorDawnDim);
    R(99,100,25,12,p.floorDawnDim); R(127,100,21,12,p.floorDawnDim);
    R(151,100,22,12,p.floorDawnDim);

    /* The single warm pool: an L of three hard steps folded into the corner
     * where the bedside table's foot meets the bed's east edge. Warm light
     * on slate-teal reads olive, never mustard, so the steps stay low. */
    R(64,64,26,7,p.poolCarpet); R(64,64,10,14,p.poolCarpet);
    R(64,64,20,5,p.poolCarpetMid); R(64,64,8,11,p.poolCarpetMid);
    R(64,64,13,3,p.poolCarpetHi); R(64,64,6,7,p.poolCarpetHi);

    /* Three placed wear clusters, kept out of the door approach column. */
    R(38,140,8,1,p.carpetDeep); R(42,141,3,1,p.carpetHi);
    R(196,150,7,1,p.carpetDeep); R(199,151,3,1,p.carpetHi);
    R(84,110,9,1,p.carpetDeep); R(88,109,3,1,p.carpetHi);
  }

  function drawUpperWall(R,p) {
    R(16,0,224,48,p.pineDeep);
    R(16,0,224,3,p.walnutDeep); R(16,2,224,1,p.walnut);
    R(17,3,222,33,p.pine);
    R(17,3,222,2,p.pineMid);
    /* Knotty pine read as calm vertical board lines, one pixel every 8 px. */
    for (var x=24; x<239; x+=8) R(x,3,1,33,p.pineDeep);
    R(17,34,222,2,p.pineDeep);
  }

  function drawWainscot(R,p) {
    R(16,36,224,12,p.walnutDeep);
    R(17,37,222,10,p.walnutDark);
    R(17,38,222,1,p.walnutHi);
    R(17,39,222,7,p.walnut);
    R(17,45,222,2,p.walnutDeep);
    for (var x=32; x<240; x+=16) {
      R(x,38,2,8,p.walnutDeep); R(x+2,39,1,6,p.walnutHi);
    }
    R(16,47,224,2,p.ink);
  }

  function drawLampWallPool(R,p) {
    /* Warm tungsten wash on the wall behind the shade: three stepped values,
     * hard edges, then two more on the wainscot below.  The pine board lines
     * and the wainscot joints are repainted warm through the pool, so the
     * light stays light instead of reading as a card hung on the wall. */
    var x;
    R(61,14,33,24,p.pineWarm);
    R(65,17,25,21,p.pineWarmHi);
    R(69,20,17,18,'#ab9e77');
    for (x=64; x<94; x+=8) R(x,14,1,24,'#6f684f');
    R(62,38,32,9,'#5a4830');
    R(67,38,22,9,'#6d5636');
    R(72,38,12,9,'#7e6338');
    R(64,38,2,8,p.walnutDeep); R(66,39,1,6,'#a07a44');
    R(80,38,2,8,p.walnutDeep); R(82,39,1,6,'#a07a44');
    R(62,38,32,1,'#c39a63');
    R(62,47,32,1,p.ink);
  }

  function drawHeadboard(R,p) {
    /* Eighteen pixels of wall face only: a top rail with a single highlight
     * row and two panels, so the headboard never outweighs the bedding. */
    R(16,29,48,20,p.ink);
    R(16,30,48,18,p.walnutDeep);
    R(18,31,44,15,p.walnutDark);
    R(18,31,44,2,p.walnut); R(18,31,44,1,p.walnutHi);
    R(21,34,18,11,p.walnutDeep); R(22,35,16,9,p.walnut); R(22,35,16,1,p.walnutHi);
    R(41,34,18,11,p.walnutDeep); R(42,35,16,9,p.walnut); R(42,35,16,1,p.walnutHi);
    R(16,30,4,18,p.walnutDeep); R(17,31,2,15,p.walnut); R(17,31,1,15,p.walnutHi);
    R(60,30,4,18,p.walnutDeep); R(61,31,2,15,p.walnut); R(61,31,1,15,p.walnutHi);
    /* The lamp is east of the bed: one warm rim on the near post only. */
    R(62,31,1,15,'#8a6234');
    R(16,46,48,2,p.ink);
  }

  function drawFramedPrint(R,p) {
    R(76,5,20,20,p.ink);
    R(77,6,18,18,p.walnutDeep);
    R(78,7,16,16,p.walnutMid); R(78,7,16,1,p.walnutHi);
    R(78,7,1,16,'#b08a52');
    R(79,8,14,14,p.walnutDeep);
    R(80,9,12,12,'#9fb0bd');
    R(81,12,2,3,'#3b4f43'); R(80,14,4,1,'#3b4f43');
    R(84,10,2,5,'#33463c'); R(83,13,4,2,'#33463c');
    R(88,11,2,4,'#3b4f43'); R(87,13,4,2,'#3b4f43');
    R(91,12,2,3,'#33463c');
    R(80,15,12,1,'#7b8168');
    R(80,16,12,5,'#5a7482');
    R(82,18,5,1,'#7d95a1'); R(87,19,4,1,'#7d95a1');
  }

  function pineSilhouette(R,cx,top,base,color) {
    /* Stepped conifer: a narrow tip that widens one pixel every other row,
     * so each tree in the pane carries its own silhouette and height instead
     * of a repeated stamp. */
    var y, half=1, step=0;
    for (y=top; y<base; y+=2) {
      R(cx-half,y,half*2,2,color);
      step++;
      if (step % 2 === 0 && half < 5) half++;
    }
    R(cx-1,base-2,2,2,color);
  }

  function drawWindow(R,p) {
    /* Cold dawn glass: the brightest plane in the frame, two cool values
     * plus one pale horizon line and dark stepped pines low in the pane. */
    R(102,3,68,38,p.ink);
    R(104,5,64,34,p.walnutDark);
    R(105,6,62,32,p.walnutDeep);
    R(105,6,62,1,p.walnutHi);

    R(107,8,58,28,p.dawnMid);
    R(107,19,58,1,p.dawnPale);
    R(107,20,58,6,p.dawn);
    R(107,26,58,10,p.dawnDeep);
    pineSilhouette(R,111,14,28,p.glassDark);
    pineSilhouette(R,119,17,28,p.glassDark);
    pineSilhouette(R,133,12,28,p.glassDark);
    pineSilhouette(R,141,18,28,p.glassDark);
    pineSilhouette(R,154,15,28,p.glassDark);
    pineSilhouette(R,161,19,28,p.glassDark);
    R(107,27,58,2,'#31414f');
    /* Two stepped reflections on the cold glass, no gradients. */
    R(112,10,7,2,p.dawnPale); R(119,12,4,2,p.dawnPale);
    R(150,23,6,2,p.dawnHi); R(156,25,3,2,p.dawnHi);
    /* Mullions stay cool so no warm value ever enters the glass rect. */
    R(126,8,2,28,p.muntin); R(146,8,2,28,p.muntin);
    R(107,8,58,1,p.muntin);

    /* Sill sits on the wainscot, with one cooler step below it. */
    R(100,37,72,5,p.walnutDeep);
    R(100,37,72,1,p.walnutHi);
    R(101,38,70,3,p.walnutMid);
    R(100,42,72,1,p.ink);
    R(102,43,68,3,p.walnutCool);
  }

  function drawCurtains(R,p) {
    R(94,2,86,3,p.walnutDeep); R(94,2,86,1,p.walnutHi);
    R(91,1,4,5,p.brassDark); R(91,1,4,1,p.brass);
    R(179,1,4,5,p.brassDark); R(179,1,4,1,p.brass);
    /* Heavy forest curtains, half open, three vertical values each. */
    R(96,4,12,40,p.curtainDeep);
    R(97,5,10,38,p.curtain);
    R(99,5,3,38,p.curtainHi);
    R(104,6,1,36,p.curtainDeep); R(106,6,1,36,p.curtainDeep);
    R(96,42,12,2,p.curtainDeep); R(96,44,12,1,p.ink);
    R(164,4,12,40,p.curtainDeep);
    R(165,5,10,38,p.curtain);
    R(170,5,3,38,p.curtainHi);
    R(166,6,1,36,p.curtainDeep); R(168,6,1,36,p.curtainDeep);
    R(164,42,12,2,p.curtainDeep); R(164,44,12,1,p.ink);
  }

  function drawMirror(R,p) {
    /* Oval approximated by stepped rectangles: brass rim, dark cool glass. */
    var rim=[[12,2,204,8],[14,2,201,14],[16,2,199,18],[18,3,198,20],
             [21,8,197,22],[29,3,198,20],[32,2,199,18],[34,2,201,14],[36,2,204,8]];
    var glass=[[14,2,205,6],[16,2,202,12],[18,2,200,16],[20,10,199,18],
               [30,2,200,16],[32,2,202,12],[34,2,205,6]];
    var i;
    for (i=0;i<rim.length;i++) R(rim[i][2],rim[i][0],rim[i][3],rim[i][1],p.brassDark);
    R(198,18,20,1,p.brass); R(197,21,22,1,p.brass);
    R(197,28,22,1,p.brassDark); R(204,12,8,1,p.brass);
    for (i=0;i<glass.length;i++) R(glass[i][2],glass[i][0],glass[i][3],glass[i][1],p.glassDark);
    /* Cold glass keeps the oval: one darker core band, two thin stepped
     * reflections running the same diagonal, nothing rectangular. */
    R(201,22,14,8,'#26333d');
    R(203,17,4,2,p.dawnHi); R(201,19,3,2,p.dawnHi); R(200,21,2,2,'#8ea1ad');
    R(211,27,4,2,'#7f929e'); R(209,29,3,2,'#7f929e'); R(207,31,2,2,'#61737e');
    R(197,21,1,8,p.brassHi); R(206,12,4,1,p.brassHi);
  }

  function drawLampShade(R,p) {
    /* The shade ends on a dark amber row at y37, so the black telephone
     * below it never merges into the same mass. */
    R(73,26,8,2,p.amberHi);
    R(72,28,10,3,p.amberHi);
    R(70,31,14,4,p.amber);
    R(69,35,16,2,p.amber);
    R(75,28,3,9,p.amberCore);
    R(70,37,14,1,p.amberDark);
    R(76,38,2,3,p.walnutDeep);
    R(74,40,7,4,p.brass); R(74,40,7,1,p.brassHi); R(74,43,7,1,p.brassDark);
  }

  function drawSideWalls(R,p) {
    R(0,0,16,192,p.ink);
    R(2,0,11,176,p.walnutDark); R(5,4,7,168,p.walnut);
    R(6,4,2,168,p.walnutHi); R(13,0,3,176,p.ink);
    R(240,0,16,192,p.ink);
    R(243,0,11,176,p.walnutDark); R(244,4,7,168,p.walnut);
    R(250,4,2,168,p.walnutHi); R(240,0,3,176,p.ink);
    R(0,0,256,4,p.walnutDark); R(6,4,244,2,p.walnutHi);
  }

  function drawSouthWall(R,p) {
    R(0,176,256,16,p.ink);
    R(6,178,102,12,p.walnutDeep); R(7,178,100,3,p.walnutHi);
    R(9,182,96,6,p.walnutDark);
    R(134,178,116,12,p.walnutDeep); R(134,178,114,3,p.walnutHi);
    R(136,182,110,6,p.walnutDark);
    var x;
    for (x=16; x<104; x+=16) { R(x,182,2,7,p.walnutDeep); R(x+2,183,1,5,p.walnutMid); }
    for (x=144; x<240; x+=16) { R(x,182,2,7,p.walnutDeep); R(x+2,183,1,5,p.walnutMid); }

    /* Single oak leaf on the trigger cell (7,11): a recessed casing, jambs
     * on both sides and a warm hall line under the door make the cell read
     * as a doorway rather than a panel in the wainscot. */
    R(106,170,28,22,p.ink);
    R(108,172,24,20,p.walnutDeep);
    R(108,172,4,20,p.walnutDark); R(110,173,1,18,p.walnutHi);
    R(128,172,4,20,p.walnutDark); R(129,173,1,18,p.walnutMid);
    R(112,172,16,3,p.ink);
    R(112,175,16,17,p.walnut);
    R(112,175,16,1,p.walnutHi);
    R(114,178,12,12,p.walnutDeep);
    R(115,179,10,10,p.walnutMid);
    R(115,179,10,1,p.walnutHi);
    R(117,181,8,4,p.brass); R(117,181,8,1,p.brassHi);
    R(118,182,1,2,p.ink); R(120,182,1,2,p.ink); R(122,182,1,2,p.ink);
    R(125,186,3,3,p.brass); R(125,186,3,1,p.brassHi);
    R(113,190,14,1,'#7a6540');
    R(112,191,16,1,p.ink);
  }

  function drawArchitecture(R,p) {
    R(0,0,256,192,p.ink);
    drawUpperWall(R,p);
    drawCarpetField(R,p);
    drawWainscot(R,p);
    drawLampWallPool(R,p);
    drawHeadboard(R,p);
    drawFramedPrint(R,p);
    drawWindow(R,p);
    drawCurtains(R,p);
    drawMirror(R,p);
    drawLampShade(R,p);
    drawSideWalls(R,p);
    drawSouthWall(R,p);
  }

  function drawShadow(R,prop,p) {
    /* Contact begins at the actor-foot edge, beyond the painted silhouette:
     * dark at the base, then two increasingly soft rows. */
    var s=prop.shadow, foot=prop.footY;
    R(s[0]+2,foot+2,Math.max(1,s[2]-4),1,p.shadow);
    R(s[0]+1,foot+1,Math.max(1,s[2]-2),1,p.shadowMid);
    R(s[0]+4,foot,Math.max(1,s[2]-8),1,p.shadowDark);
  }

  function drawPlayerContact(R,p) {
    var engine=GAME.Engine, state=engine && engine.state, player=state && state.player;
    if (!state || state.mapId!=='room_315' || !player ||
        !Number.isFinite(player.x) || !Number.isFinite(player.y)) return;
    var x=Math.round(player.x), y=Math.round(player.y);
    R(x+3,y+15,10,2,p.shadowMid);
    R(x+4,y+16,8,2,p.shadowDark);
    R(x+6,y+17,4,1,p.ink);
  }

  function blanketMotif(R,cx,y,color) {
    /* One stepped triangle of the lodge stripe, tip up, four rows tall. */
    R(cx-1,y,3,1,color);
    R(cx-2,y+1,5,1,color);
    R(cx-3,y+2,7,1,color);
    R(cx-4,y+3,9,1,color);
  }

  function drawBed(R,p) {
    R(16,46,48,50,p.ink);
    R(17,47,46,48,p.walnutDeep);
    R(19,48,42,46,p.linenDark);
    R(20,49,40,44,p.linen);
    /* Two separate pillows, one pixel of gap and one pixel of shadow under. */
    R(20,50,18,10,p.cream); R(20,50,18,2,p.creamHi); R(20,50,18,1,'#f8f4e6');
    R(39,50,18,10,p.cream); R(39,50,18,2,p.creamHi); R(39,50,18,1,'#f8f4e6');
    R(38,50,1,10,p.linenDark);
    R(20,60,37,1,p.linenDark);
    /* Lamp spill: one warm step on the nearest pillow edge. */
    R(50,51,7,3,'#f2e4ba'); R(53,54,4,2,'#dfd0a4');
    /* Quilt: the bed's broad plane, a clear step above the carpet, three
     * creases and nothing else. */
    R(20,61,40,21,p.quilt); R(20,61,40,1,p.quiltHi);
    R(25,66,17,1,p.quiltDeep); R(26,67,15,1,p.quiltHi);
    R(31,72,15,1,p.quiltDeep); R(32,73,13,1,p.quiltHi);
    R(23,77,19,1,p.quiltDeep); R(24,78,17,1,p.quiltHi);
    /* Turned back on the east side: a stepped linen wedge over the quilt. */
    R(50,61,10,1,p.quiltDeep);
    R(51,62,9,5,p.linen); R(51,62,9,1,p.cream);
    R(53,67,7,4,p.linen); R(56,71,4,3,p.linenDark);
    R(50,62,1,5,p.quiltDeep); R(52,67,1,4,p.quiltDeep); R(55,71,1,3,p.quiltDeep);
    /* Folded lodge blanket at the foot: warm brown band, one ochre stripe
     * carrying three stepped dark triangles. The room's single lodge mark. */
    R(20,82,40,11,p.blanket); R(20,82,40,1,p.blanketHi);
    R(20,85,40,5,p.ochre); R(20,85,40,1,'#bb9138');
    blanketMotif(R,28,86,p.blanketDark);
    blanketMotif(R,40,86,p.blanketDark);
    blanketMotif(R,52,86,p.blanketDark);
    R(20,90,40,1,p.ochreDark); R(20,91,40,2,p.blanket);
    /* Two-pixel walnut frame rim on the west, east and south edges. */
    R(17,48,3,45,p.walnutDark); R(18,48,1,45,p.walnutHi);
    R(60,48,3,45,p.walnutDark); R(60,48,1,45,p.walnutHi);
    R(17,93,46,2,p.walnutDark); R(18,93,44,1,p.walnutHi);
    R(17,95,46,1,p.ink);
  }

  function drawBedsideTable(R,p) {
    /* Black telephone west, lamp base east: neither shape cuts the other,
     * and the handset keeps a light rim so it never merges with the shade. */
    R(64,38,9,3,p.ink); R(65,38,7,1,p.steelDark); R(65,39,7,1,p.steelDeep);
    R(64,41,9,5,p.ink); R(65,42,7,2,p.steelDeep);
    R(66,42,3,1,p.steelHi); R(69,42,2,2,p.steelDark);
    R(64,44,16,6,p.walnutDeep);
    R(65,44,14,4,p.walnut); R(65,44,14,1,p.walnutHi);
    /* Warm pool on the table top: three hard steps, no blob. */
    R(71,45,8,3,'#8b6738'); R(73,45,6,2,'#a67f45'); R(75,45,4,1,p.brass);
    R(65,50,14,13,p.walnutDark);
    R(67,52,10,5,p.walnut); R(67,52,10,1,p.walnutHi);
    R(71,54,3,1,p.brass);
    R(67,58,10,1,p.walnutDeep);
    R(65,61,3,3,p.ink); R(76,61,3,3,p.ink);
  }

  function drawDesk(R,p) {
    /* Tape recorder and open notebook sit against the sill, as in the
     * concept: they overlap the window base, never the glass. */
    R(116,36,21,9,p.ink);
    R(117,37,19,7,p.steelDark);
    R(118,38,6,5,p.steelDeep); R(126,38,6,5,p.steelDeep);
    R(120,39,2,3,p.steelHi); R(128,39,2,3,p.steelHi);
    R(133,38,2,2,'#b8402c'); R(133,41,2,1,p.steelHi);
    R(117,43,19,1,p.steelDeep);

    R(138,38,21,7,p.ink);
    R(139,39,19,5,p.creamHi); R(139,39,9,5,p.cream);
    R(148,39,1,5,p.linenDark);
    R(141,41,6,1,p.linenDark); R(150,41,6,1,p.linenDark);
    R(141,43,5,1,p.linenDark); R(150,43,6,1,p.linenDark);

    R(112,44,48,7,p.walnutDeep);
    R(113,44,46,5,p.walnut); R(113,44,46,1,p.walnutHi);
    /* The desk top takes two cooler steps under the dawn window. */
    R(116,45,36,3,p.walnutCool); R(123,45,22,2,'#5f5c4c');
    R(113,51,46,11,p.walnutDark);
    R(115,53,13,7,p.walnut); R(115,53,13,1,p.walnutHi); R(119,56,4,1,p.brass);
    R(144,53,13,7,p.walnut); R(144,53,13,1,p.walnutHi); R(148,56,4,1,p.brass);
    R(129,51,14,11,p.walnutDeep);
    /* Chair back tucked into the knee hole, no extra footprint. */
    R(127,58,18,5,p.walnutDeep); R(128,58,16,1,p.walnutHi); R(128,59,16,3,p.walnut);
    R(113,61,3,3,p.ink); R(156,61,3,3,p.ink);
    R(113,62,46,1,p.ink);
  }

  function drawDresser(R,p) {
    R(192,42,32,6,p.walnutDeep);
    R(193,42,30,4,p.walnut); R(193,42,30,1,p.walnutHi);
    R(193,48,30,14,p.walnutDark);
    R(195,50,26,5,p.walnut); R(195,50,26,1,p.walnutHi); R(206,52,4,1,p.brass);
    R(195,56,26,5,p.walnut); R(195,56,26,1,p.walnutHi); R(206,58,4,1,p.brass);
    R(194,55,28,1,p.walnutDeep);
    R(193,61,3,3,p.ink); R(220,61,3,3,p.ink);
    R(193,62,30,1,p.ink);
  }

  function drawLuggageStand(R,p) {
    R(205,106,22,12,p.ink);
    R(206,107,20,10,'#4a3527');
    R(207,107,18,1,'#6b4f36');
    R(206,111,20,2,p.walnutDeep);
    R(210,110,3,3,p.brass); R(210,110,3,1,p.brassHi);
    R(219,110,3,3,p.brass); R(219,110,3,1,p.brassHi);
    R(213,104,6,2,p.walnutDeep); R(214,104,4,1,p.walnutMid);
    /* Folding X stand under the case. */
    R(207,117,3,10,p.walnutDeep); R(222,117,3,10,p.walnutDeep);
    R(208,118,1,8,p.walnutHi); R(223,118,1,8,p.walnutHi);
    R(210,120,12,2,p.walnutDark); R(210,120,12,1,p.walnutMid);
    R(210,124,12,2,p.walnutDeep);
    R(206,126,4,2,p.ink); R(222,126,4,2,p.ink);
  }

  function drawProp(R,prop,p) {
    if (prop.id === 'bed') drawBed(R,p);
    else if (prop.id === 'bedsideTable') drawBedsideTable(R,p);
    else if (prop.id === 'desk') drawDesk(R,p);
    else if (prop.id === 'dresser') drawDresser(R,p);
    else if (prop.id === 'luggageStand') drawLuggageStand(R,p);
  }

  function draw(ctx,cx,cy) {
    var R=rectPainter(ctx,cx,cy), i;
    drawArchitecture(R,palette);
    for (i=0;i<definitions.length;i++) drawShadow(R,definitions[i],palette);
    drawPlayerContact(R,palette);
    for (i=0;i<definitions.length;i++) drawProp(R,definitions[i],palette);
  }

  /* Engine intervals are actor-foot intervals. Redraw the matching furniture
   * only; contact shadows remain in the ground pass and never cover actors. */
  function foreground(ctx,cx,cy,minFoot,maxFoot) {
    minFoot = minFoot == null ? -Infinity : minFoot;
    maxFoot = maxFoot == null ? Infinity : maxFoot;
    var R=rectPainter(ctx,cx,cy), i, prop;
    for (i=0;i<definitions.length;i++) {
      prop=definitions[i];
      if (prop.footY < minFoot || prop.footY >= maxFoot) continue;
      drawProp(R,prop,palette);
    }
  }

  GAME.Room315Art = {
    draw: draw,
    foreground: foreground,
    definitions: definitions,
    props: definitions,
    palette: palette
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.Room315Art;
})();
