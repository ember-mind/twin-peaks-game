/* Double R exterior — authored at 256x192 native pixels.
 * Ground/player foot space is y=144..191; the clear approach is x=80..143.
 * Deterministic integer rectangles only: no paths, gradients or texture noise. */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  var GAME = G.GAME = G.GAME || {};

  function draw(ctx, cx, cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    var diner = GAME.Retro2D && GAME.Retro2D.interiorKit &&
      GAME.Retro2D.interiorKit.materials.diner || {};
    var p = {
      ink: diner.ink || '#292b26', cream: diner.cream || '#f4e6c8',
      creamShade: diner.creamShade || '#cfbc92', gold: diner.gold || '#e9bd5d',
      red: diner.red || '#8c2f3e', redHi: diner.redHi || '#c45a61',
      redDark: diner.redDark || '#501f29', wood: diner.wood || '#5b3a28',
      woodHi: diner.woodHi || '#946345', green: diner.green || '#223b2f',
      leaf: diner.leaf || '#567345', leafHi: diner.leafHi || '#879452',
      metal: diner.metal || '#81918b', metalHi: diner.metalHi || '#d9dfc9'
    };
    function R(x,y,w,h,c) { ctx.fillStyle=c; ctx.fillRect(x-cx,y-cy,w,h); }

    /* Slate parking apron and a few large, placed repairs. */
    R(0,0,256,192,'#485665');
    R(0,151,256,2,'#3b4754');
    R(4,166,18,7,'#414c59'); R(10,173,21,5,'#414c59');
    R(94,178,27,8,'#3e4a57'); R(102,174,17,4,'#3e4a57');
    R(205,166,22,8,'#414d5a'); R(214,174,26,6,'#414d5a');

    /* Rear trees frame the roof without competing with the facade. */
    treeBank(R,0,0,16,46,p); treeBank(R,240,0,16,48,p);
    R(4,18,5,23,'#304b3b'); R(247,17,5,27,'#304b3b');
    /* Blocked plot edges read as real boundaries, never empty asphalt. */
    leftBoundary(R,p);
    rightBoundary(R,p);

    /* Low charcoal roof, warm western rim, restrained vertical seams. */
    R(16,17,192,43,p.ink); R(20,13,188,4,'#222b30');
    R(18,15,2,2,'#765344'); R(16,17,2,2,'#9b6449');
    R(16,17,192,4,'#343a3c'); R(16,21,4,39,'#394047');
    R(20,21,184,39,'#303840');
    R(20,21,4,35,'#55463d'); R(20,21,2,30,'#b16e4d');
    [48,79,111,143,175].forEach(function(x){ R(x,22,2,38,'#252d34'); R(x+2,22,1,34,'#3d454c'); });
    /* Exhaust, set behind the roof face. */
    R(163,18,13,4,'#20272c'); R(165,12,9,6,p.metal);
    R(164,10,11,3,p.ink); R(166,13,7,2,p.metalHi);

    /* Fascia and clapboard shell. */
    R(16,58,192,7,p.redDark); R(16,60,192,3,p.red);
    R(18,66,188,46,p.ink); R(20,67,184,44,p.cream);
    for (var sy=72; sy<108; sy+=7) { R(20,sy,184,2,p.creamShade); R(21,sy,182,1,'#ded1aa'); }
    R(16,63,192,4,p.red); R(18,63,188,1,p.redHi);
    R(16,108,192,4,p.redDark); R(20,108,184,2,p.red);

    /* Windows: warm booths and tables remain broad, readable silhouettes. */
    windowPanel(R,24,74,64,27,p,false);
    windowPanel(R,136,74,64,27,p,true);

    /* Centered double door, two 16px leaves. */
    R(94,77,36,35,p.ink); R(97,79,31,33,p.redDark);
    R(98,80,14,31,p.red); R(113,80,14,31,p.red);
    R(100,82,10,12,'#f1c56a'); R(115,82,10,12,'#f1c56a');
    R(101,83,8,10,'#ffd984'); R(116,83,8,10,'#ffd984');
    R(105,84,4,1,'#fff0b2'); R(106,85,3,1,'#fff0b2');
    R(120,84,4,1,'#fff0b2'); R(121,85,3,1,'#fff0b2');
    R(110,80,2,31,p.ink); R(98,108,29,3,p.gold);
    R(109,98,2,4,p.gold); R(114,98,2,4,p.gold);
    /* Matching wall practicals occupy the narrow reveals beside the door. */
    wallLamp(R,89,86,p); wallLamp(R,130,86,p);

    /* Main sign bridges roof and facade. */
    R(80,47,64,27,p.ink); R(82,49,60,23,p.creamShade);
    R(84,51,56,19,p.green); R(86,53,52,15,'#18382e');
    if (GAME.RetroFont && GAME.RetroFont.draw) {
      GAME.RetroFont.draw(ctx,'DOUBLE R',112-cx,57-cy,p.redHi,{scale:1,align:'center'});
    }
    R(91,66,42,2,p.redHi);

    /* Two-depth concrete sidewalk and clean entrance lamp pools. */
    R(16,112,192,32,'#a9a38f'); R(16,112,192,3,'#c9c1a5');
    R(16,129,192,2,'#898a7a'); R(16,142,192,2,'#777b70');
    [48,96,128,176].forEach(function(x){ R(x,115,1,27,'#8f907f'); });
    R(82,113,12,2,'#d7b45e'); R(78,115,20,3,'#c49b4d'); R(84,118,10,4,'#af8844');
    R(132,113,12,2,'#d7b45e'); R(128,115,20,3,'#c49b4d'); R(133,118,10,4,'#af8844');

    /* Planter banks leave x=80..143 open for the approach. */
    planter(R,16,112,64,p); planter(R,144,112,64,p);

    /* Wheel stops and quiet stall ticks. */
    wheelStop(R,32,146,p); wheelStop(R,160,146,p);
    [28,78,158,208].forEach(function(x){ R(x,158,2,26,'#b8b39b'); R(x+2,158,1,18,'#d2cab0'); });

    roadsideSign(R,p,ctx,cx,cy);
    /* Sign-foot planting fills its blocked two-tile base at y=128..143. */
    R(224,136,32,8,p.green); R(228,132,9,7,p.leaf);
    R(236,129,8,10,p.leaf); R(244,133,10,7,p.leaf);
    R(231,133,3,2,p.leafHi); R(239,131,2,2,p.leafHi); R(248,135,3,1,p.leafHi);
    R(229,138,25,2,p.ink);
    /* Foreground corner vegetation closes the composition, not the path. */
    foregroundBank(R,0,172,28,20,p); foregroundBank(R,228,170,28,22,p);
  }

  function wallLamp(R,x,y,p) {
    R(x,y+1,5,7,p.woodDark || '#35271f');
    R(x+1,y,3,2,p.metal); R(x+1,y+2,3,4,p.gold);
    R(x+2,y+2,1,3,'#fff0a6'); R(x,y+6,5,2,p.ink);
  }

  function leftBoundary(R,p) {
    /* Sparse fence is visible between irregular hedge and pine tiers. */
    R(2,47,3,123,'#352f2b'); R(12,50,3,120,'#352f2b');
    R(3,75,11,3,'#5b4938'); R(3,126,11,3,'#5b4938');
    R(5,42,5,10,p.green); R(2,48,11,5,p.green); R(0,53,16,8,p.green);
    R(3,61,10,18,p.green); R(0,68,16,8,p.green);
    R(6,78,7,8,p.leaf); R(2,84,13,5,p.leaf); R(0,89,16,8,p.green);
    R(4,97,9,12,p.green); R(0,104,16,8,p.green);
    R(7,110,6,10,p.leaf); R(2,117,13,6,p.leaf); R(0,123,16,10,p.green);
    R(5,132,7,11,p.green); R(1,139,14,7,p.green); R(0,146,16,24,p.green);
    R(7,50,2,2,p.leafHi); R(3,72,3,1,p.leafHi); R(9,88,2,2,p.leafHi);
    R(4,120,3,2,p.leafHi); R(10,143,2,2,p.leafHi); R(3,155,3,1,p.leafHi);
  }

  function rightBoundary(R,p) {
    /* Rear lot stop: stepped crowns over a restrained timber fence. */
    R(211,18,3,77,'#352f2b'); R(231,15,3,81,'#352f2b');
    R(210,43,25,3,'#594637'); R(210,78,25,3,'#594637');
    R(214,12,5,12,p.green); R(211,20,11,6,p.green); R(208,26,16,8,p.green);
    R(211,34,11,15,p.green); R(208,42,16,8,p.green);
    R(228,16,5,11,p.green); R(224,24,13,7,p.green); R(221,31,18,8,p.green);
    R(225,39,11,18,p.leaf); R(220,48,20,8,p.green);
    R(211,54,11,17,p.leaf); R(208,63,16,8,p.green);
    R(226,57,10,19,p.green); R(221,69,19,8,p.green); R(208,77,32,19,p.green);
    R(216,22,2,2,p.leafHi); R(231,27,2,1,p.leafHi); R(225,51,3,2,p.leafHi);
    R(213,65,2,2,p.leafHi); R(233,72,3,1,p.leafHi); R(217,85,2,2,p.leafHi);
    /* Row 6, column 13 is blocked; stop cleanly before walkable y=112. */
    R(208,103,15,9,p.green); R(211,98,9,10,p.leaf);
    R(214,96,4,4,p.green); R(216,100,2,2,p.leafHi);
  }

  function windowPanel(R,x,y,w,h,p,mirror) {
    R(x,y,w,h,p.ink); R(x+3,y+3,w-6,h-6,'#8aa09a');
    R(x+4,y+4,w-8,h-8,'#b38a5a');
    R(x+4,y+4,w-8,5,p.wood); R(x+6,y+5,w-12,3,p.woodHi);
    /* Muted pendants stay below the brighter entrance glass. */
    R(x+11,y+4,6,6,p.wood); R(x+12,y+5,4,4,p.gold); R(x+13,y+6,2,2,p.cream);
    R(x+45,y+4,6,6,p.wood); R(x+46,y+5,4,4,p.gold); R(x+47,y+6,2,2,p.cream);
    R(x+5,y+15,14,7,p.red); R(x+w-19,y+15,14,7,p.red);
    R(x+9,y+13,9,3,p.redHi); R(x+w-18,y+13,9,3,p.redHi);
    R(x+6,y+18,12,1,p.redHi); R(x+w-18,y+18,12,1,p.redHi);
    R(x+18,y+16,1,6,p.redDark); R(x+w-19,y+16,1,6,p.redDark);
    R(x+20,y+17,w-40,4,p.cream); R(x+23,y+15,w-46,2,p.creamShade);
    R(x+28,y+13,2,4,p.gold); R(x+31,y+14,2,3,p.redDark);
    if (!mirror) { R(x+42,y+4,5,5,'#b8d0c7'); R(x+38,y+9,5,5,'#9bb7b1'); }
    else { R(x+13,y+4,5,5,'#b8d0c7'); R(x+18,y+9,5,5,'#9bb7b1'); }
    R(x+2,y+2,2,h-4,p.creamShade); R(x+w-4,y+2,2,h-4,p.creamShade);
  }

  function planter(R,x,y,w,p) {
    R(x,y+11,w,5,p.redDark); R(x+2,y+12,w-4,2,p.red);
    R(x+2,y+6,w-4,5,p.green);
    for (var i=3;i<w-5;i+=8) {
      var top=(i%16===3)?2:4;
      R(x+i,y+top,6,8-top,p.leaf); R(x+i+2,y+top-2,3,3,p.leaf);
      R(x+i+1,y+top,2,1,p.leafHi); R(x+i+5,y+top+3,2,2,p.green);
    }
    R(x,y+16,w,2,p.ink);
  }

  function wheelStop(R,x,y,p) {
    R(x+2,y,28,1,p.creamShade); R(x,y+1,32,4,p.ink);
    R(x+2,y+1,28,2,'#aaa691'); R(x+5,y+3,22,1,'#777a70');
  }

  function roadsideSign(R,p,ctx,cx,cy) {
    R(220,47,28,37,p.ink); R(222,49,24,33,p.metal);
    R(224,51,20,28,p.cream); R(227,53,14,13,p.red);
    if (GAME.RetroFont && GAME.RetroFont.draw) {
      GAME.RetroFont.draw(ctx,'RR',234-cx,56-cy,p.cream,{scale:1,align:'center'});
    }
    tinyText(R,'DINER',225,71,p.green);
    R(224,67,20,2,p.redHi); R(223,84,4,44,p.metal); R(242,84,4,44,p.metal);
    R(224,84,2,44,p.metalHi); R(243,84,1,44,'#4d5a59');
  }

  function tinyText(R,text,x,y,color) {
    var glyphs={D:['110','101','101','101','110'],I:['111','010','010','010','111'],
      N:['101','111','111','111','101'],E:['111','100','110','100','111'],
      R:['110','101','110','101','101']};
    for(var i=0;i<text.length;i++){
      var rows=glyphs[text.charAt(i)];
      for(var yy=0;yy<5;yy++)for(var xx=0;xx<3;xx++)if(rows[yy].charAt(xx)==='1')R(x+i*4+xx,y+yy,1,1,color);
    }
  }

  function treeBank(R,x,y,w,h,p) {
    R(x+7,y,3,8,p.green); R(x+4,y+6,9,5,p.green);
    R(x+2,y+10,13,6,p.green); R(x,y+15,w,7,p.green);
    R(x+5,y+20,9,8,p.leaf); R(x+1,y+25,15,7,p.green);
    R(x,y+31,w,h-31,p.green); R(x+8,y+9,2,2,p.leafHi);
    R(x+4,y+19,3,1,p.leafHi); R(x+11,y+27,2,2,p.leafHi);
    R(x+2,y+36,2,1,p.leafHi);
  }

  function foregroundBank(R,x,y,w,h,p) {
    R(x+7,y+2,w-13,h-2,p.green); R(x+2,y+7,w-4,h-7,p.green);
    R(x,y+12,w,h-12,p.green); R(x+11,y,w-18,6,p.leaf);
    R(x+4,y+8,8,7,p.leaf); R(x+w-11,y+6,8,10,p.leaf);
    R(x+8,y+7,3,2,p.leafHi); R(x+16,y+4,2,1,p.leafHi);
    R(x+w-8,y+10,3,2,p.leafHi); R(x+3,y+15,2,1,p.leafHi);
  }

  /* Optional depth pass. Only the bottom corner foliage can cover feet;
   * permanent facade, planters and roadside sign already sit above y=144. */
  function foreground(ctx,cx,cy,minFoot,maxFoot) {
    minFoot = minFoot == null ? -Infinity : minFoot;
    maxFoot = maxFoot == null ? Infinity : maxFoot;
    if (maxFoot < 170 || minFoot > 192) return;
    cx=Math.round(cx||0); cy=Math.round(cy||0);
    var diner=GAME.Retro2D&&GAME.Retro2D.interiorKit&&GAME.Retro2D.interiorKit.materials.diner||{};
    var p={green:diner.green||'#223b2f',leaf:diner.leaf||'#567345',leafHi:diner.leafHi||'#879452'};
    function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x-cx,y-cy,w,h);}
    foregroundBank(R,0,172,28,20,p); foregroundBank(R,228,170,28,22,p);
  }

  GAME.DoubleRExteriorArt = { draw:draw, foreground:foreground };
  if (typeof module !== 'undefined' && module.exports) module.exports=GAME.DoubleRExteriorArt;
})();
