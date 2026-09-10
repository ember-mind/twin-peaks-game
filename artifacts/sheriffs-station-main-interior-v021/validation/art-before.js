/* Sheriff's station main room — 256x192 authored native pixels.
 * Flat orthographic rectangles only: no gradients, paths, smoothing or noise. */
(function () {
  'use strict';

  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};
  var TILE = 16;

  var palette = {
    ink: '#252a27',
    sageDark: '#435449', sage: '#71806b', sageHi: '#96a087',
    oakDark: '#3f2a20', oak: '#65452f', oakHi: '#9a6b47',
    floorDark: '#969d95', floor: '#a7aba2', floorHi: '#acb0a7',
    steelDark: '#4d5758', steel: '#717c7c', steelHi: '#aab1aa',
    paperDark: '#9f967d', paper: '#ddd5b7', paperHi: '#f1e7c9',
    greenDark: '#29392f', green: '#3f5742', greenHi: '#70825a',
    amberDark: '#785224', amber: '#d2a342', amberHi: '#ffe18a',
    glass: '#a9bab5', glassHi: '#d4d8c7', shadow: '#727a74'
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

  function drawArchitecture(R,ctx,cx,cy,p) {
    /* Quiet gray linoleum is one broad value field. Sparse construction seams
     * keep it architectural without turning the floor into a checkerboard. */
    R(0,0,256,192,p.ink);
    R(16,0,224,48,p.sageDark);
    R(18,4,220,29,p.sage);
    R(18,4,220,1,p.sageHi);
    R(16,48,224,128,p.floor);
    R(16,48,224,2,p.floorHi);
    R(18,54,46,21,p.floorHi);
    R(183,57,55,20,p.floorHi);
    R(18,130,52,25,p.floorHi);
    R(188,116,38,13,p.floorHi);
    R(16,111,224,1,p.floorDark);
    R(95,48,1,128,p.floorDark);
    R(176,48,1,128,p.floorDark);

    /* Low oak wainscot and crisp one-pixel joints. */
    R(16,31,224,17,p.oakDark);
    R(18,33,220,14,p.oak);
    R(18,33,220,2,p.oakHi);
    for (var x=32; x<240; x+=16) R(x,36,1,11,p.oakDark);
    R(16,46,224,2,p.ink);

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

    /* South wall and the closed, unconnected public double entrance. */
    R(0,176,256,16,p.ink);
    R(7,178,101,12,p.oakDark); R(8,178,100,3,p.oakHi);
    R(148,178,101,12,p.oakDark); R(148,178,100,3,p.oakHi);
    for (x=16; x<104; x+=16) R(x,182,1,8,p.oak);
    for (x=152; x<240; x+=16) R(x,182,1,8,p.oak);
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
    R(x+4,y+2,w-8,3,p.glassHi); R(x+6,y+2,w-12,1,p.paperHi);
    R(x+2,y+6,w-4,1,p.steelHi);
  }

  function countyMap(R,p) {
    R(86,3,84,32,p.ink); R(89,6,78,27,p.oakDark); R(91,8,74,23,p.paper);
    R(93,10,25,7,'#a3ad83'); R(112,17,19,7,'#b5b188');
    R(139,9,22,8,'#9ca987'); R(132,22,29,7,'#a8ad87');
    /* Block-stepped river and county roads stay hard edged. */
    R(125,9,5,5,'#6f9594'); R(122,13,6,5,'#6f9594');
    R(121,17,4,6,'#6f9594'); R(118,22,5,7,'#6f9594');
    R(96,19,21,2,'#b77d5d'); R(110,21,2,7,'#b77d5d');
    R(145,17,16,2,'#b77d5d'); R(144,18,2,10,'#b77d5d');
    R(100,12,3,3,p.paperHi); R(135,14,3,3,p.oakHi); R(151,24,3,3,p.oakHi);
    R(91,8,74,1,p.paperHi); R(89,32,78,2,p.ink);
  }

  function rearFrostedDoor(R,p) {
    R(207,5,30,43,p.ink); R(210,8,24,40,p.oakDark);
    R(213,11,18,21,p.glass); R(215,12,14,18,'#b9c5be');
    R(216,22,3,6,p.glassHi); R(219,18,3,6,p.glassHi);
    R(222,14,3,6,p.glassHi); R(213,34,18,11,p.oak);
    R(215,36,14,7,p.oakHi); R(229,38,2,2,p.amber);
    R(207,46,30,2,p.ink);
  }

  function sheriffPlaque(R,ctx,cx,cy,p) {
    R(23,17,56,12,p.ink); R(25,19,52,8,p.oakDark); R(27,20,48,6,p.greenDark);
    R(28,20,46,1,p.greenHi); R(25,27,52,1,p.oakHi);
    if (GAME.RetroFont && GAME.RetroFont.draw) {
      GAME.RetroFont.draw(ctx,'SHERIFF',51-cx,20-cy,p.paper,{scale:1,align:'center'});
    } else {
      R(31,22,40,2,p.paper); R(34,25,34,1,p.paperDark);
    }
  }

  function drawShadow(R,prop,p) {
    var s=prop.shadow;
    R(s[0],s[1],s[2],s[3],p.shadow);
    R(s[0]+2,s[1],Math.max(1,s[2]-4),1,p.floorDark);
  }

  function drawSheriffChair(R,p) {
    R(116,41,26,21,p.ink); R(119,42,20,15,p.greenDark);
    R(121,43,7,13,p.green); R(130,43,7,13,p.green);
    R(122,44,5,2,p.greenHi); R(131,44,5,2,p.greenHi);
    R(117,57,24,5,p.oakDark); R(120,58,18,3,p.oak);
    R(117,61,3,3,p.ink); R(138,61,3,3,p.ink);
  }

  function drawFiles(R,p) {
    var xs=[17,33,49], i, x, y;
    for (i=0;i<xs.length;i++) {
      x=xs[i]; R(x,43,15,37,p.steelDark); R(x+2,44,11,34,p.steel);
      R(x+3,45,9,2,p.steelHi);
      for (y=49;y<75;y+=9) {
        R(x+3,y,9,6,p.steelDark); R(x+4,y+1,7,4,p.steel);
        R(x+6,y+2,3,1,p.steelHi);
      }
      R(x+1,78,13,2,p.ink);
    }
    /* The room's single plant, kept compact on the file bank. */
    R(21,38,10,6,p.oakDark); R(23,39,6,5,p.oak); R(25,34,2,5,p.greenDark);
    R(20,34,6,3,p.green); R(26,32,5,4,p.green); R(24,29,3,7,p.green);
    R(19,31,3,4,p.greenHi); R(29,29,3,5,p.greenDark); R(24,30,2,2,p.greenHi);
  }

  function drawSheriffDesk(R,p) {
    R(96,55,64,9,p.ink); R(98,56,60,6,p.oak); R(100,57,56,2,p.oakHi);
    R(99,64,58,15,p.oakDark); R(102,65,17,12,p.oak); R(137,65,17,12,p.oak);
    R(121,65,14,14,p.ink); R(123,65,10,11,p.oakDark);
    R(105,66,10,1,p.oakHi); R(141,66,10,1,p.oakHi);
    R(100,78,58,2,p.ink); R(103,76,3,4,p.ink); R(151,76,3,4,p.ink);

    /* One mug and the room's only warm task light. */
    R(106,49,7,7,p.ink); R(107,50,5,6,p.paperHi); R(112,51,3,3,p.paper);
    R(108,50,3,1,'#ffffff');
    R(145,58,14,3,p.amberDark); R(149,56,7,3,p.amber);
    R(151,45,3,12,p.oakDark); R(150,43,5,3,p.amberDark);
    R(147,41,11,4,p.amber); R(149,41,7,2,p.amberHi);
    R(153,47,2,9,p.amberHi); R(152,59,3,3,p.ink);
    R(138,57,10,2,p.amber); R(141,59,7,1,p.amberHi);
    /* Blotter and restrained paper stack. */
    R(119,57,17,4,p.greenDark); R(121,56,13,4,p.green);
    R(122,56,11,1,p.greenHi); R(100,59,13,3,p.paperDark);
    R(102,58,10,3,p.paper); R(103,58,8,1,p.paperHi);
  }

  function drawReceptionReturn(R,p) {
    R(64,87,16,25,p.ink); R(66,89,12,21,p.oakDark);
    R(67,89,10,4,p.oakHi); R(67,94,10,15,p.oak);
    R(69,96,6,1,p.oakHi); R(66,109,12,3,p.ink);
  }

  function drawReception(R,p) {
    R(16,98,64,9,p.ink); R(18,99,60,6,p.steel); R(20,100,56,2,p.steelHi);
    R(18,107,60,19,p.oakDark); R(20,109,56,15,p.oak);
    R(20,109,56,2,p.oakHi); R(32,111,1,13,p.oakDark); R(63,111,1,13,p.oakDark);
    R(16,125,64,3,p.ink); R(20,123,3,5,p.ink); R(73,123,3,5,p.ink);
    /* Simple black phone and a single in-tray. */
    R(24,93,15,6,p.ink); R(27,91,9,3,p.steelDark); R(29,92,5,1,p.steelHi);
    R(27,98,9,2,p.steelDark); R(52,96,20,3,p.paperDark);
    R(54,94,16,4,p.paper); R(56,94,12,1,p.paperHi);
  }

  function drawOfficeDesk(R,p,x,y) {
    R(x,y,48,8,p.ink); R(x+2,y+1,44,5,p.oak); R(x+4,y+1,40,2,p.oakHi);
    R(x+2,y+8,44,14,p.oakDark); R(x+4,y+9,13,11,p.oak);
    R(x+31,y+9,13,11,p.oak); R(x+19,y+8,10,12,p.ink);
    R(x+6,y+10,8,1,p.oakHi); R(x+34,y+10,8,1,p.oakHi);
    R(x+5,y+14,11,1,p.oakDark); R(x+32,y+14,11,1,p.oakDark);
    R(x+9,y+11,3,1,p.steelHi); R(x+9,y+16,3,1,p.steelHi);
    R(x+36,y+11,3,1,p.steelHi); R(x+36,y+16,3,1,p.steelHi);
    R(x+2,y+20,44,2,p.ink); R(x+4,y+20,3,5,p.ink); R(x+41,y+20,3,5,p.ink);
    R(x+5,y-2,14,4,p.paperDark); R(x+7,y-3,12,4,p.paper);
    R(x+8,y-3,10,1,p.paperHi); R(x+32,y-4,8,5,p.greenDark);
    R(x+34,y-3,4,3,p.green); R(x+35,y-3,2,1,p.greenHi);
  }

  function drawOfficeChair(R,p,y) {
    R(194,y,17,20,p.ink); R(197,y+1,11,13,p.greenDark);
    R(199,y+2,7,10,p.green); R(200,y+2,5,2,p.greenHi);
    R(193,y+12,19,5,p.ink); R(196,y+13,13,3,p.greenDark);
    R(201,y+17,3,6,p.steelDark); R(197,y+22,11,2,p.ink);
    R(195,y+23,4,2,p.ink); R(207,y+23,4,2,p.ink);
  }

  function drawBench(R,p) {
    R(16,145,48,6,p.ink); R(18,147,44,11,p.oakDark);
    R(20,148,40,8,p.greenDark); R(21,149,18,6,p.green);
    R(41,149,18,6,p.green); R(22,149,16,2,p.greenHi); R(42,149,16,2,p.greenHi);
    R(16,157,48,7,p.ink); R(19,158,42,4,p.oak); R(21,158,38,2,p.oakHi);
    R(21,157,38,4,p.greenDark); R(22,157,36,3,p.green);
    R(22,157,36,1,p.greenHi); R(40,157,1,3,p.greenDark);
    R(18,163,4,13,p.oakDark); R(58,163,4,13,p.oakDark);
    R(19,164,2,10,p.oakHi); R(59,164,2,10,p.oakHi);
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
