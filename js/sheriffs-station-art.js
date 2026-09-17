/* Sheriff's station main room — 256x192 authored native pixels.
 * Flat orthographic rectangles only: no gradients, paths, smoothing or noise. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;

  var palette = {
    ink: '#252a27',
    sageDeep: '#3b4940', sageDark: '#4b5c50', sage: '#71806b', sageMid: '#83907a', sageHi: '#a3ad98',
    oakDeep: '#34231c', oakDark: '#4a3023', oak: '#6d4930', oakMid: '#835b3b', oakHi: '#ad7a50',
    floorDark: '#828d84', floor: '#939c92', floorMid: '#a3ab9f', floorHi: '#b0b8ab', floorLight: '#bcc3b6',
    steelDeep: '#394548', steelDark: '#536164', steel: '#738083', steelHi: '#aeb9b5', steelLight: '#c0c9c3',
    paperDark: '#a2997e', paper: '#d7cfad', paperHi: '#eee4bf',
    greenDark: '#29392f', green: '#3f5742', greenHi: '#70825a',
    amberDark: '#785224', amber: '#d2a342', amberHi: '#ffe18a',
    glass: '#9eafad', glassHi: '#d0d8d1', shadow: '#727a74', shadowMid: '#646d67', shadowDark: '#404944'
  };

  var definitions = [
    {id:'sheriffChair', cells:[[7,3],[8,3]], bounds:[114,40,30,24], shadow:[116,59,26,4]},
    {id:'files', cells:[[1,3],[2,3],[3,3],[1,4],[2,4],[3,4]], bounds:[17,29,47,51], shadow:[18,76,46,4]},
    {id:'sheriffDesk', cells:[[6,4],[7,4],[8,4],[9,4]], bounds:[96,41,64,39], shadow:[98,77,64,4]},
    {id:'receptionReturn', cells:[[4,6]], bounds:[64,87,16,25], shadow:[66,108,16,4]},
    {id:'rightDeskNorth', cells:[[11,6],[12,6],[13,6]], bounds:[176,83,48,29], shadow:[178,108,48,4]},
    {id:'reception', cells:[[1,7],[2,7],[3,7],[4,7]], bounds:[16,91,64,37], shadow:[18,124,64,4]},
    {id:'rightChairNorth', cells:[[12,7]], bounds:[193,103,19,25], shadow:[194,124,18,4]},
    {id:'rightDeskSouth', cells:[[11,9],[12,9],[13,9]], bounds:[176,131,48,29], shadow:[178,156,48,4]},
    {id:'bench', cells:[[1,10],[2,10],[3,10]], bounds:[16,145,48,31], shadow:[18,172,47,4]},
    {id:'rightChairSouth', cells:[[12,10]], bounds:[193,151,19,25], shadow:[194,172,18,4]}
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

  function drawFloorValueField(R,p) {
    /* Explicit 16px value rows form broad, irregular linoleum clusters. Runs of
     * equal values are joined so the field never reads as a contrasty grid. */
    var values=[p.floorDark,p.floor,p.floorMid,p.floorHi];
    var rows=[
      '00111122222110',
      '00111222221110',
      '11112222332221',
      '11122222333221',
      '01112222222110',
      '00111222221100',
      '00011122221100',
      '00001111110000'
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

    /* One-pixel seams on the 16px module make the linoleum read as tiles
     * without turning the field into a contrasty checkerboard. */
    for (col=1;col<14;col++) R(16+col*16,48,1,128,p.floorDark);
    for (row=1;row<8;row++) R(16,48+row*16,224,1,p.floorDark);

    R(110,113,36,50,p.sageDark);
    R(112,115,32,46,p.sageMid);
    R(112,115,32,1,p.sageHi); R(112,160,32,1,p.sageHi);

    /* A narrow entry runner leaves quiet floor on both sides of the aisle. */

    /* Fluorescent spill stays hard stepped and local to the back work zones. */
    R(20,49,42,3,p.floorLight); R(20,52,34,4,p.floorHi); R(20,56,19,3,p.floorMid);
    R(181,49,55,3,p.floorLight); R(190,52,46,4,p.floorHi); R(207,56,29,4,p.floorMid);
    R(218,60,18,3,p.floorHi);

    /* Three deliberate edge-wear clusters, kept out of the central aisle. */
    R(20,137,7,1,p.floorDark); R(22,138,3,1,p.floorMid);
    R(224,119,8,1,p.floorDark); R(228,120,3,1,p.floorMid);
    R(70,169,9,1,p.floorDark); R(74,168,3,1,p.floorMid);

    /* Stepped task-lamp reflection ties the desk to its nearby floor. */
    R(134,79,31,2,'#b1a381'); R(140,81,27,3,'#b4a580');
    R(146,84,21,3,'#afa283'); R(153,87,13,2,'#a89c81');
  }

  function drawArchitecture(R,ctx,cx,cy,p) {
    R(0,0,256,192,p.ink);
    R(16,0,224,48,p.sageDeep);
    R(18,4,220,27,p.sage);
    R(18,4,220,2,p.sageMid);
    R(20,7,50,18,p.sageMid); R(24,13,43,13,p.sage);
    R(169,6,39,18,p.sageMid); R(176,14,27,12,p.sage);
    R(20,6,54,3,p.sageHi); R(174,6,35,3,p.sageHi);
    R(22,10,44,2,'#aeb8a6'); R(178,10,28,2,'#aeb8a6');
    R(81,7,4,18,p.sageDark); R(172,9,2,16,p.sageDark);
    drawFloorValueField(R,p);

    /* Inset wainscot faces use dark joints and directional broken rims. */
    R(16,30,224,18,p.oakDeep);
    R(18,32,220,14,p.oakDark);
    R(19,33,218,2,p.oakHi);
    R(19,35,218,10,p.oak);
    R(20,36,216,1,p.oakMid);
    R(19,45,218,2,p.oakDeep);
    for (var x=32; x<240; x+=16) {
      R(x,34,2,12,p.oakDeep); R(x+2,35,1,9,p.oakHi);
    }
    R(88,35,80,11,p.oakDark);
    R(90,35,76,1,p.oakMid);
    R(90,45,76,1,p.oakDeep);
    R(38,39,10,1,p.oakMid); R(88,42,9,1,p.oakHi); R(132,38,12,1,p.oakMid);
    R(166,43,8,1,p.oakHi); R(214,39,12,1,p.oakMid);
    R(16,47,224,2,p.ink);

    /* Heavy boundary carpentry makes every solid edge explicit. */
    R(0,0,16,192,p.ink); R(2,0,11,176,p.oakDark); R(5,4,7,168,p.oak);
    R(6,4,2,168,p.oakHi); R(13,0,3,176,p.ink);
    R(240,0,16,192,p.ink); R(243,0,11,176,p.oakDark); R(244,4,7,168,p.oak);
    R(250,4,2,168,p.oakHi); R(240,0,3,176,p.ink);
    R(0,0,256,4,p.oakDark); R(6,4,244,2,p.oakHi);

    fluorescentFixture(R,27,7,44,p);
    fluorescentFixture(R,173,7,31,p);
    countyMap(R,p);
    rearFrostedDoor(R,p);
    sheriffPlaque(R,ctx,cx,cy,p);
    wallCoatPeg(R,p);
    wallRadio(R,p);

    /* South wall and the closed, unconnected public double entrance. */
    R(0,176,256,16,p.ink);
    R(7,178,101,12,p.oakDeep); R(8,178,100,3,p.oakHi); R(10,182,96,6,p.oakDark);
    R(148,178,101,12,p.oakDeep); R(148,178,100,3,p.oakHi); R(150,182,96,6,p.oakDark);
    for (x=16; x<104; x+=16) { R(x,182,2,7,p.oakDeep); R(x+2,183,1,5,p.oakMid); }
    for (x=152; x<240; x+=16) { R(x,182,2,7,p.oakDeep); R(x+2,183,1,5,p.oakMid); }
    R(108,174,40,18,p.ink); R(112,176,32,16,p.oakDark);
    R(113,177,14,14,p.oak); R(129,177,14,14,p.oak);
    R(115,178,10,6,p.glass); R(131,178,10,6,p.glass);
    R(116,178,6,2,p.glassHi); R(132,178,6,2,p.glassHi);
    R(127,176,2,16,p.ink); R(124,187,2,2,p.amber); R(130,187,2,2,p.amber);

    /* Two-tile entrance mat, entirely inside the walkable approach row. */
    R(112,165,32,11,p.steelDark); R(114,167,28,7,p.steel);
    R(117,169,22,1,p.steelHi); R(114,173,28,1,p.ink);
  }

  function fluorescentFixture(R,x,y,w,p) {
    R(x,y,w,7,p.ink); R(x+2,y+1,w-4,5,p.steelDark);
    R(x+3,y+2,w-6,3,p.steelHi); R(x+5,y+2,w-10,2,p.glassHi);
    R(x+7,y+2,w-14,1,p.paperHi); R(x+2,y+6,w-4,1,p.steelLight);
  }

  function countyMap(R,p) {
    R(86,3,84,32,p.ink); R(88,5,80,29,p.oakDeep); R(89,6,78,27,p.oak);
    R(90,7,76,25,p.oakHi); R(92,9,72,21,p.paperDark); R(93,10,70,19,'#c2ba9e');
    R(93,10,70,1,p.paper); R(163,10,1,20,p.oakDark); R(92,30,72,2,p.oakDeep);
    /* County, forest and lake parcels are medium-sized, stepped masses. */
    R(94,11,20,6,'#a2aa80'); R(97,17,17,4,'#acaa82');
    R(115,11,10,5,'#b5b08a'); R(132,10,14,6,'#9ba47f');
    R(146,11,15,7,'#a5ad86'); R(128,20,15,8,'#aaa983');
    R(144,21,17,7,'#9ea87f'); R(99,23,17,5,'#a4ad84');
    R(95,12,5,3,'#81936f'); R(101,14,7,3,'#788a68'); R(136,11,7,3,'#718667');
    R(149,22,9,4,'#758966'); R(103,24,8,3,'#7d906b'); R(133,23,6,4,'#82916d');
    /* A two-to-four pixel river turns through the county in clear steps. */
    R(124,10,4,4,'#6c9292'); R(122,13,5,5,'#6c9292'); R(121,17,4,5,'#6c9292');
    R(119,21,4,5,'#6c9292'); R(116,25,5,4,'#6c9292'); R(117,27,3,3,'#85a6a2');
    /* One-pixel road branches and three compact town marks. */
    R(95,20,24,1,'#a87355'); R(105,18,1,7,'#a87355'); R(127,17,30,1,'#a87355');
    R(139,17,1,11,'#a87355'); R(151,14,1,8,'#a87355'); R(129,25,11,1,'#a87355');
    R(101,18,3,3,p.paperHi); R(134,15,3,3,p.oakHi); R(150,24,3,3,p.oakHi);
    R(102,19,1,1,p.ink); R(135,16,1,1,p.ink); R(151,25,1,1,p.ink);
  }

  function rearFrostedDoor(R,p) {
    R(207,5,30,43,p.ink); R(209,7,26,41,p.oakDeep); R(210,8,24,39,p.oakDark);
    R(211,9,22,24,p.oakHi); R(213,11,18,20,p.glass); R(215,12,14,18,'#b8c5c0');
    R(216,13,8,2,p.glassHi); R(224,15,3,7,p.glassHi); R(218,25,8,2,'#c2cfca');
    R(211,32,22,15,p.oakDeep); R(213,34,18,11,p.oak);
    R(214,35,16,2,p.oakHi); R(215,38,14,5,p.oakMid); R(215,43,14,2,p.oakDark);
    R(229,38,2,2,p.amber);
    R(207,46,30,2,p.ink);
  }

  function sheriffPlaque(R,ctx,cx,cy,p) {
    R(23,17,56,12,p.ink); R(24,18,54,10,p.oakDeep); R(25,19,52,8,p.oak);
    R(26,19,50,1,p.oakHi); R(27,20,48,6,p.greenDark); R(28,21,46,1,p.greenHi);
    R(28,25,46,1,'#202b24'); R(25,27,52,1,p.oakHi); R(76,20,1,7,p.oakDeep);
    if (GAME.RetroFont && GAME.RetroFont.draw) {
      GAME.RetroFont.draw(ctx,'SHERIFF',51-cx,20-cy,'#d9d0aa',{scale:1,align:'center'});
    } else {
      R(31,22,40,2,p.paper); R(34,25,34,1,p.paperDark);
    }
  }

  function wallCoatPeg(R,p) {
    R(69,29,13,2,p.oakDeep); R(71,30,9,2,p.oakHi); R(75,30,2,5,p.ink);
    R(72,34,8,3,p.greenDark); R(70,37,12,7,p.greenDark); R(69,41,4,6,p.ink);
    R(79,41,4,6,p.ink); R(73,37,6,9,'#35463a'); R(74,35,4,2,p.sageHi);
    R(78,29,5,2,p.ink); R(80,27,4,2,p.greenDark); R(79,26,4,1,p.greenHi);
  }

  function wallRadio(R,p) {
    R(198,24,1,11,p.ink); R(199,22,1,12,p.steelDark);
    R(181,43,21,3,p.oakDeep); R(183,42,17,2,p.oakHi);
    R(183,34,18,9,p.ink); R(185,35,14,7,p.steelDark); R(186,36,8,5,p.steelDeep);
    R(187,37,6,1,p.steelHi); R(195,36,2,2,p.amber); R(195,40,2,1,p.steelHi);
  }

  function drawShadow(R,prop,p) {
    var s=prop.shadow, foot=prop.footY;
    if (foot<176) {
      /* Contact begins at the unchanged actor-foot edge, beyond the painted
       * silhouette: dark at the base, then two increasingly soft rows. */
      R(s[0]+2,foot+2,Math.max(1,s[2]-4),1,p.shadow);
      R(s[0]+1,foot+1,Math.max(1,s[2]-2),1,p.shadowMid);
      R(s[0]+4,foot,Math.max(1,s[2]-8),1,p.shadowDark);
      return;
    }
    /* South-wall furniture cannot cast below y=175. These narrow clipped
     * bands leave only side wings visible beyond each existing silhouette. */
    R(prop.bounds[0]-2,173,prop.bounds[2]+4,1,p.shadow);
    R(prop.bounds[0]-1,174,prop.bounds[2]+2,1,p.shadowMid);
    R(prop.bounds[0]-2,175,3,1,p.shadowDark);
    R(prop.bounds[0]+prop.bounds[2]-1,175,3,1,p.shadowDark);
  }

  function drawPlayerContact(R,p) {
    var engine=GAME.Engine, state=engine && engine.state, player=state && state.player;
    if (!state || state.mapId!=='sheriff' || !player ||
        !Number.isFinite(player.x) || !Number.isFinite(player.y)) return;
    var x=Math.round(player.x), y=Math.round(player.y);
    R(x+3,y+15,10,2,p.shadowMid);
    R(x+4,y+16,8,2,p.shadowDark);
    R(x+6,y+17,4,1,p.ink);
  }

  function drawSheriffChair(R,p) {
    R(116,41,26,21,p.ink); R(119,42,20,15,p.greenDark);
    R(120,43,18,13,p.green); R(121,44,16,2,p.greenHi);
    R(128,43,1,13,p.greenDark); R(121,50,16,1,p.greenDark);
    R(123,47,3,2,'#5a6d4d'); R(132,47,3,2,'#5a6d4d');
    R(117,57,24,5,p.oakDeep); R(120,58,18,3,p.oak);
    R(121,58,16,1,p.oakHi); R(128,59,1,2,p.oakDark);
    R(117,61,3,3,p.ink); R(138,61,3,3,p.ink);
  }

  function drawFiles(R,p) {
    var xs=[17,33,49], i, x, y;
    for (i=0;i<xs.length;i++) {
      x=xs[i]; R(x,43,15,37,p.steelDark); R(x+1,43,13,1,p.steelLight);
      R(x+1,44,1,34,p.steelHi); R(x+2,44,11,34,p.steel);
      R(x+3,45,9,1,p.steelHi); R(x+12,45,1,32,p.steelDeep);
      for (y=49;y<75;y+=9) {
        R(x+3,y,9,1,p.steelDeep); R(x+3,y+1,9,5,p.steelDark);
        R(x+4,y+2,7,3,p.steel); R(x+5,y+2,5,1,p.steelHi);
        R(x+5,y+4,2,1,p.steelDeep); R(x+8,y+3,3,1,p.steelLight);
      }
      R(x+1,78,13,2,p.ink);
    }
    /* The room's single plant, kept compact on the file bank. */
    R(20,38,12,2,p.oakDeep); R(21,39,10,5,p.oakDark); R(23,40,6,4,p.oak);
    R(22,39,8,1,p.oakHi); R(25,34,2,5,p.greenDark);
    R(20,34,6,3,p.green); R(26,32,5,4,p.green); R(24,29,3,7,p.green);
    R(19,31,3,4,p.greenHi); R(29,29,3,5,p.greenDark); R(24,30,2,2,p.greenHi);
    R(21,35,3,1,'#809166'); R(27,33,3,1,'#809166'); R(25,35,1,3,p.greenDark);
  }

  function drawSheriffDesk(R,p) {
    /* The original base call remains the silhouette anchor for depth tests. */
    R(96,55,64,9,p.ink);
    R(98,52,60,12,p.oakDeep); R(99,53,58,10,p.oak); R(100,53,56,1,p.oakHi);
    R(100,54,56,2,p.oakMid); R(100,56,56,6,p.oak); R(99,62,58,2,p.oakDeep);
    R(104,57,15,1,p.oakHi); R(107,60,11,1,p.oakDark); R(126,55,10,1,p.oakDark);
    /* A local, stepped lamp pool warms only the right side of the top. */
    R(133,53,24,2,'#a8793d'); R(136,55,22,4,p.amberDark);
    R(141,56,17,4,p.amber); R(148,57,10,3,p.amberHi); R(154,58,4,2,p.paperHi);
    R(135,60,23,2,'#9b6834');

    R(99,64,58,15,p.oakDeep); R(101,65,19,12,p.oak); R(136,65,19,12,p.oak);
    R(102,65,17,1,p.oakHi); R(137,65,17,1,'#c28a4d');
    R(102,67,17,10,p.oakMid); R(104,68,13,8,p.oak); R(137,67,17,10,p.oakMid);
    R(139,68,13,8,p.oak); R(121,65,14,14,p.ink); R(123,65,10,11,p.oakDark);
    R(124,66,8,1,p.oakMid); R(105,70,10,1,p.oakDark); R(141,70,10,1,p.oakDark);
    R(110,66,6,1,p.oakHi); R(144,66,7,1,p.amber);
    R(100,78,58,2,p.ink); R(103,76,3,4,p.ink); R(151,76,3,4,p.ink);

    /* One mug, clean case papers and a compact black telephone. */
    R(106,49,7,7,p.ink); R(107,50,5,6,p.paperHi); R(112,51,3,3,p.paper);
    R(108,50,3,1,'#ffffff');
    R(115,55,18,6,p.greenDark); R(117,54,15,6,p.green); R(118,54,13,1,p.greenHi);
    R(116,55,14,4,p.paper); R(118,54,12,4,p.paperHi); R(119,56,10,1,p.paperDark);
    R(122,58,10,3,p.paperDark); R(123,57,9,3,p.paper); R(124,57,7,1,p.paperHi);
    R(135,52,11,5,p.ink); R(137,50,7,3,p.ink); R(138,50,5,1,p.steelDark);
    R(137,56,8,2,p.steelDeep); R(139,53,1,2,p.steelHi); R(142,53,1,2,p.steelHi);

    /* The task lamp has a shaped brass shade and a dark readable underside. */
    R(151,44,3,9,p.oakDark); R(150,42,5,3,p.amberDark);
    R(148,41,9,2,p.amber); R(146,43,13,2,p.amber); R(145,45,15,2,p.amberDark);
    R(147,44,11,1,p.amberHi); R(148,47,10,2,p.ink);
    R(152,48,2,5,p.amberHi); R(150,52,6,2,p.amberDark); R(151,53,4,1,p.amberHi);
  }

  function drawReceptionReturn(R,p) {
    R(64,87,16,25,p.ink); R(66,89,12,21,p.oakDark);
    R(66,88,12,5,p.oakMid); R(67,88,10,1,p.oakHi); R(67,93,10,16,p.oak);
    R(68,94,8,1,p.oakHi); R(68,100,8,1,p.oakDark); R(70,102,5,1,p.oakMid);
    R(66,109,12,3,p.ink);
  }

  function drawReception(R,p) {
    R(16,98,64,9,p.ink); R(18,99,60,6,p.steelDark); R(19,100,58,4,p.steel);
    R(20,100,56,1,p.steelLight); R(21,103,54,1,p.steelHi); R(18,105,60,2,p.steelDeep);
    R(18,107,60,19,p.oakDeep); R(20,109,56,15,p.oak);
    R(20,109,56,2,p.oakHi); R(22,112,52,11,p.oakMid); R(23,113,50,10,p.oak);
    R(32,111,2,13,p.oakDark); R(63,111,2,13,p.oakDark);
    R(35,114,25,1,p.oakHi); R(22,122,51,2,p.oakDark);
    R(16,125,64,3,p.ink); R(20,123,3,5,p.ink); R(73,123,3,5,p.ink);
    /* Simple black phone and a single in-tray. */
    R(24,93,15,6,p.ink); R(27,91,9,3,p.steelDark); R(29,92,5,1,p.steelHi);
    R(27,98,9,2,p.steelDark); R(52,96,20,3,p.paperDark);
    R(54,94,16,4,p.paper); R(56,94,12,1,p.paperHi);
    /* Public forms are clipped neatly into the counter front. */
    R(28,112,31,12,p.oakDeep); R(30,113,27,10,p.steelDark); R(31,114,25,8,'#8b948b');
    R(32,114,10,7,p.paper); R(33,115,8,1,p.paperHi); R(33,117,6,1,p.paperDark);
    R(44,115,11,3,p.paperDark); R(45,114,10,3,p.paper); R(46,115,8,1,p.paperHi);
    R(45,119,9,2,p.paper); R(46,119,6,1,p.paperHi); R(30,122,27,2,p.steelDeep);
  }

  function drawOfficeDesk(R,p,x,y) {
    R(x,y,48,8,p.ink); R(x+2,y+1,44,5,p.oak); R(x+3,y+1,42,1,p.steelHi);
    R(x+4,y+2,40,2,p.oakHi); R(x+5,y+4,38,1,p.oakMid); R(x+2,y+6,44,2,p.oakDeep);
    R(x+2,y+8,44,14,p.oakDark); R(x+4,y+9,13,11,p.oak);
    R(x+31,y+9,13,11,p.oak); R(x+19,y+8,10,12,p.ink);
    R(x+5,y+9,12,1,p.oakMid); R(x+32,y+9,12,1,p.oakMid);
    R(x+6,y+10,8,1,p.oakHi); R(x+34,y+10,8,1,p.oakHi);
    R(x+5,y+14,11,2,p.oakDeep); R(x+32,y+14,11,2,p.oakDeep);
    R(x+9,y+11,3,1,p.steelHi); R(x+9,y+16,3,1,p.steelHi);
    R(x+36,y+11,3,1,p.steelHi); R(x+36,y+16,3,1,p.steelHi);
    R(x+2,y+20,44,2,p.ink); R(x+4,y+20,3,5,p.ink); R(x+41,y+20,3,5,p.ink);
    R(x+5,y-2,14,4,p.paperDark); R(x+7,y-3,12,4,p.paper);
    R(x+8,y-3,10,1,p.paperHi); R(x+32,y-4,8,5,p.greenDark);
    R(x+34,y-3,4,3,p.green); R(x+35,y-3,2,1,p.greenHi);
  }

  function drawOfficeChair(R,p,y) {
    R(194,y,17,20,p.ink); R(197,y+1,11,13,p.greenDark);
    R(199,y+2,7,10,p.green); R(200,y+2,5,2,p.greenHi); R(202,y+4,1,7,p.greenDark);
    R(200,y+8,5,1,'#596c4d');
    R(193,y+12,19,5,p.ink); R(196,y+13,13,3,p.greenDark);
    R(198,y+13,9,1,p.greenHi);
    R(201,y+17,3,6,p.steelDark); R(197,y+22,11,2,p.ink);
    R(195,y+23,4,2,p.ink); R(207,y+23,4,2,p.ink);
  }

  function drawBench(R,p) {
    R(16,145,48,6,p.ink); R(18,147,44,11,p.oakDark);
    R(20,148,40,8,p.greenDark); R(21,149,18,6,p.green);
    R(41,149,18,6,p.green); R(22,149,16,1,p.greenHi); R(42,149,16,1,p.greenHi);
    R(39,149,2,6,p.greenDark); R(24,153,12,1,'#536849'); R(44,153,11,1,'#536849');
    R(16,157,48,7,p.ink); R(19,158,42,4,p.oak); R(21,158,38,2,p.oakHi);
    R(21,157,38,4,p.greenDark); R(22,157,36,3,p.green);
    R(22,157,36,1,p.greenHi); R(40,157,1,3,p.greenDark);
    R(18,163,4,13,p.oakDeep); R(58,163,4,13,p.oakDeep);
    R(19,164,2,10,p.oakMid); R(59,164,2,10,p.oakMid);
    R(20,164,1,8,p.oakHi); R(60,164,1,8,p.oakHi);
    R(17,174,7,2,p.ink); R(57,174,7,2,p.ink);
  }

  function drawProp(R,prop,p) {
    if (prop.id === 'sheriffChair') drawSheriffChair(R,p);
    else if (prop.id === 'files') drawFiles(R,p);
    else if (prop.id === 'sheriffDesk') drawSheriffDesk(R,p);
    else if (prop.id === 'receptionReturn') drawReceptionReturn(R,p);
    else if (prop.id === 'rightDeskNorth') drawOfficeDesk(R,p,176,87);
    else if (prop.id === 'reception') drawReception(R,p);
    else if (prop.id === 'rightChairNorth') drawOfficeChair(R,p,103);
    else if (prop.id === 'rightDeskSouth') drawOfficeDesk(R,p,176,135);
    else if (prop.id === 'bench') drawBench(R,p);
    else if (prop.id === 'rightChairSouth') drawOfficeChair(R,p,151);
  }

  function draw(ctx,cx,cy) {
    var R=rectPainter(ctx,cx,cy), i;
    drawArchitecture(R,ctx,Math.round(cx||0),Math.round(cy||0),palette);
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

  GAME.SheriffsStationArt = {
    draw: draw,
    foreground: foreground,
    props: definitions,
    palette: palette
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GAME.SheriffsStationArt;
})();
