/* Great Northern: native, opaque map-pixel lodge art. Cast Presence draws bodies. */
(function () {
  'use strict';
  var root=typeof window!=='undefined'?window:globalThis;
  var GAME=root.GAME=root.GAME||{};
  var p=Object.freeze({ink:'#211e1c',woodDark:'#3b2c24',wood:'#65432d',woodLight:'#8b5c39',
    gold:'#b5864c',cream:'#e9c582',light:'#ffe7a6',redDark:'#4c2327',red:'#803338',redLight:'#aa5350',
    stoneDark:'#47423a',stone:'#776957',stoneLight:'#a28c6a',green:'#46513a',greenLight:'#77805a',fire:'#d77b37'});
  /* Ground contacts exactly occupy the existing furniture glyphs. Art may
   * rise north of its cell; foreground depth uses its south edge. */
  var props=[
    {id:'stairs',cells:[[6,4],[7,4]],x:96,footY:80},
    {id:'fireplace',cells:[[8,4],[9,4]],x:128,footY:80},
    {id:'luggage',cells:[[2,6]],x:32,footY:112},
    {id:'chairWest',cells:[[8,6]],x:128,footY:112},
    {id:'table',cells:[[9,6]],x:144,footY:112},
    {id:'chairEast',cells:[[10,6]],x:160,footY:112},
    {id:'reception',cells:[[4,8],[5,8],[6,8],[7,8]],x:64,footY:144}
  ];
  function painter(ctx,cx,cy){
    cx=Math.round(cx||0);cy=Math.round(cy||0);
    return function(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x-cx,y-cy,w,h);};
  }
  function diamond(R,x,y,r,c){for(var d=-r;d<=r;d++)R(x-r+Math.abs(d),y+d,2*(r-Math.abs(d))+1,1,c);}
  function rug(R,x,y,w,h){
    if(w>32){
      /* Mechanical surface spec: exact footprint, two-pixel keyline,
       * one-pixel border, linked diamonds on an eight-pixel local grid. */
      R(x,y,w,h,p.ink);R(x+2,y+2,w-4,h-4,p.gold);R(x+3,y+3,w-6,h-6,p.red);
      for(var ry=y+8;ry<=y+h-8;ry+=8)for(var rx=x+8;rx<=x+w-8;rx+=8){
        diamond(R,rx,ry+1,4,p.redDark);diamond(R,rx,ry,4,p.gold);
        diamond(R,rx,ry,3,p.red);R(rx,ry,1,1,p.cream);
      }
      return;
    }
    R(x,y,w,h,p.ink);R(x+1,y+1,w-2,h-2,p.gold);R(x+2,y+2,w-4,h-4,p.redDark);
    R(x+4,y+4,w-8,h-8,p.red);R(x+5,y+5,w-10,h-10,p.redDark);
    for(var xx=x+4;xx<x+w-4;xx+=6){R(xx,y+2,2,1,p.cream);R(xx,y+h-3,2,1,p.gold);}
    for(var yy=y+7;yy<y+h-6;yy+=10){
      R(x+2,yy,1,2,p.gold);R(x+w-3,yy,1,2,p.gold);
      diamond(R,x+Math.floor(w/2),yy,4,p.gold);diamond(R,x+Math.floor(w/2),yy,2,p.red);
    }
  }
  function floor(R){
    R(16,16,256,160,p.wood);
    for(var y=16;y<176;y+=8){
      /* 48x8 boards; alternating 24px joints. All three depth bands use
       * the specified 1/5/2 bevel-face-seam recipe and the same palette. */
      for(var start=16-((y/8|0)%2)*24,n=0;start<272;start+=48,n++){
        var x=Math.max(16,start),end=Math.min(272,start+48),w=end-x;
        R(x,y,w,1,p.woodLight);
        R(x,y+1,w,5,p.wood);
        R(x,y+6,w,2,p.woodDark);
        if(start>=16)R(x,y+1,1,5,p.woodDark);
        var grain=Math.min(w-4,8+(n%3)*4);
        R(x+3,y+3,grain,1,p.gold);
        if(y>=72&&y<120){
          /* Only the middle band receives sparse one-step face marks. */
          for(var mark=x+4;mark<end-3;mark+=12)R(mark,y+5,2,1,p.woodLight);
        }
      }
    }
    /* Runner stops at the reception approach, with open floor beyond it. */
    rug(R,128,122,32,54);rug(R,121,83,64,36);rug(R,41,29,45,47);
    R(133,174,22,18,p.redDark);R(135,175,1,17,p.gold);R(152,175,1,17,p.gold);
  }
  function logs(R,x,y,w,h){
    R(x,y,w,h,p.woodDark);
    for(var yy=y;yy<y+h;yy+=8){
      R(x,yy,w,1,p.woodLight);R(x,yy+1,w,5,p.wood);R(x,yy+6,w,2,p.woodDark);
    }
  }
  function post(R,x,y,h){
    R(x,y,12,h,p.woodDark);R(x+1,y,9,h,p.wood);R(x+2,y,5,h,p.woodLight);
    R(x+3,y,1,h,p.gold);R(x+10,y,2,h,p.woodDark);
    for(var yy=y+10;yy<y+h;yy+=24){
      R(x+1,yy,10,3,p.ink);R(x+2,yy,8,1,p.gold);
      R(x+3,yy+1,6,1,p.woodLight);R(x+5,yy-5,2,3,p.woodDark);
    }
  }
  function sconce(R,x,y){
    R(x-3,y-3,7,15,p.woodDark);R(x,y-4,1,4,p.ink);
    R(x-4,y,9,10,p.gold);R(x-3,y+1,7,8,p.cream);R(x-2,y+2,5,6,p.light);
    R(x-4,y+10,9,2,p.ink);R(x,y+2,1,5,p.gold);
  }
  function plant(R,x,y){
    R(x-4,y-5,9,5,p.woodDark);R(x-5,y-7,11,3,p.gold);R(x-4,y-6,9,2,p.wood);
    R(x,y-19,1,12,p.greenLight);
    [[-5,-17],[-3,-13],[2,-18],[3,-12],[-4,-22],[1,-25]].forEach(function(v){
      R(x+v[0],y+v[1],4,3,p.green);R(x+v[0],y+v[1],2,1,p.greenLight);
    });
  }
  function walls(R){
    logs(R,0,0,288,16);logs(R,0,16,16,160);logs(R,272,16,16,160);
    for(var x=0;x<288;x+=32)post(R,x,0,16);
    post(R,2,16,160);post(R,274,16,160);
    /* Locked north-east wall partitions frame the route to the 315 hall. */
    logs(R,192,16,16,48);logs(R,208,16,16,16);logs(R,240,16,48,16);
    R(224,16,16,16,p.ink);R(225,17,14,1,p.gold);R(226,18,12,14,p.woodDark);
    R(228,20,8,5,p.gold);R(230,21,4,3,p.cream);R(226,30,12,2,p.red);
    sconce(R,8,39);sconce(R,280,48);sconce(R,8,127);sconce(R,280,134);
    plant(R,8,101);plant(R,280,116);
    /* South logs and real paired entrance tiles. */
    logs(R,0,176,128,16);logs(R,160,176,128,16);
    [128,144].forEach(function(dx){
      R(dx,178,16,14,p.woodDark);R(dx+1,179,14,11,p.woodLight);
      R(dx+3,180,10,7,p.gold);R(dx+4,181,8,5,p.cream);R(dx+7,181,1,5,p.wood);
      R(dx+12,189,1,1,p.gold);
    });
  }
  function pool(R,x,y,rx,ry){
    /* Discrete receiving light: plank grain survives, no full-scene wash. */
    for(var yy=-ry;yy<=ry;yy++)for(var xx=-rx;xx<=rx;xx++){
      if(xx*xx*ry*ry+yy*yy*rx*rx>rx*rx*ry*ry)continue;
      var wx=x+xx,wy=y+yy;if(wx<16||wx>=272||wy<16||wy>=176)continue;
      var inner=Math.abs(xx)<rx/2&&Math.abs(yy)<ry/2;
      if((wx+wy*3)%4===0)R(wx,wy,1,1,inner?p.gold:p.woodLight);
      else if(inner&&wy%8===1)R(wx,wy,1,1,p.woodLight);
    }
  }
  function stairs(R){
    /* Both feet land on solid C cells (6,4),(7,4). The flight rises north. */
    R(96,29,32,51,p.ink);R(97,29,30,49,p.woodDark);
    for(var y=32;y<80;y+=6){
      R(99,y,26,5,p.wood);R(100,y,24,1,p.gold);R(107,y,12,5,p.redDark);
      R(108,y,10,1,p.redLight);R(108,y+1,10,3,p.red);R(107,y,1,5,p.gold);R(118,y,1,5,p.gold);
    }
    [96,125].forEach(function(x){R(x,24,3,53,p.woodLight);R(x+1,25,1,48,p.gold);
      for(var y=33;y<74;y+=10)R(x-1,y,5,2,p.woodDark);
      R(x-1,22,5,3,p.gold);R(x,21,3,1,p.cream);
    });
    R(99,78,26,2,p.ink);
  }
  function fire(R){
    R(132,55,24,20,p.ink);R(133,67,22,6,p.fire);
    /* Interlocking flame tongues: orange envelope, gold middle and tiny
     * ivory roots. The three ambient silhouettes move within this opening. */
    [[134,60,3,10],[138,56,3,15],[143,60,4,12],[150,57,3,15]].forEach(function(a){R(a[0],a[1],a[2],a[3],p.fire);});
    R(135,64,3,8,p.cream);R(138,61,3,11,p.cream);R(144,63,4,10,p.cream);R(150,62,3,11,p.cream);
    R(139,67,2,6,p.light);R(143,70,3,3,p.light);R(149,67,2,6,p.light);
    R(133,73,22,2,p.woodDark);R(135,72,9,2,p.wood);R(145,73,8,1,p.wood);
    R(137,72,2,1,p.fire);R(148,73,3,1,p.fire);R(153,71,1,1,p.light);
  }
  function fireplace(R){
    /* Tall chimney and projecting east return; the tapered hearth still
     * contacts only the original two C tiles at its south edge. */
    R(128,9,39,43,p.ink);R(129,10,33,41,p.stoneDark);R(162,12,5,40,p.stoneDark);
    for(var y=11,row=0;y<48;y+=7,row++)for(var start=129-(row%2)*6;start<162;start+=12){
      var x=Math.max(129,start),w=Math.min(162,start+11)-x;
      if(w>0){R(x,y,w,6,p.stone);R(x,y,w,2,p.stoneLight);if(w>3)R(x+1,y+5,w-2,1,p.stoneDark);}
    }
    for(var sy=14;sy<48;sy+=7){R(163,sy,3,5,p.stone);R(163,sy,2,1,p.stoneLight);}
    /* Broad carved plaque surrounds a shaggy head with round ears, brows,
     * cheek tufts, projecting muzzle and a dark open mouth. */
    R(135,15,22,31,p.woodDark);R(132,19,28,23,p.woodDark);R(134,17,24,27,p.wood);
    R(135,17,22,1,p.gold);R(133,20,1,19,p.woodLight);R(158,20,1,19,p.ink);
    R(136,18,6,6,p.ink);R(150,18,6,6,p.ink);R(137,19,4,4,p.woodLight);R(151,19,4,4,p.woodLight);
    R(138,21,16,18,p.wood);R(136,25,20,11,p.wood);R(137,36,18,4,p.wood);
    R(140,21,12,3,p.woodLight);R(138,24,3,3,p.woodLight);R(151,24,3,3,p.woodLight);
    R(139,27,5,2,p.ink);R(148,27,5,2,p.ink);R(141,28,1,1,p.gold);R(149,28,1,1,p.gold);
    R(142,29,8,10,p.woodLight);R(143,30,6,3,p.ink);R(144,30,3,1,p.woodDark);
    R(141,36,10,6,p.ink);R(142,36,2,2,p.cream);R(148,36,2,2,p.cream);R(143,40,6,2,p.redDark);
    R(139,32,2,4,p.woodDark);R(151,32,2,4,p.woodDark);R(140,41,12,2,p.wood);
    /* Thick mantel catches firelight; stone jambs have separately lit faces. */
    R(128,48,39,5,p.woodDark);R(128,48,38,1,p.gold);R(129,49,36,1,p.woodLight);
    R(128,53,32,23,p.stoneDark);R(129,54,4,21,p.stone);R(155,54,4,21,p.stone);
    R(130,54,2,21,p.stoneLight);R(155,54,2,21,p.stoneLight);
    R(129,53,30,2,p.stoneLight);R(130,60,3,1,p.stoneDark);R(155,62,4,1,p.stoneDark);R(129,68,4,1,p.stoneDark);
    fire(R);
    R(128,76,32,4,p.stoneDark);R(128,76,32,1,p.stoneLight);R(130,77,28,1,p.stone);R(132,77,24,1,p.gold);
  }
  function chair(R,x,y,mirror){
    function C(dx,dy,w,h,c){R(x+(mirror?16-dx-w:dx),y+dy,w,h,c);}
    C(1,-1,14,2,p.ink);C(-1,-2,18,2,p.ink);
    /* Stepped curved back and rolled arms over a recessed seat cushion. */
    C(1,-31,13,2,p.ink);C(-1,-29,17,18,p.ink);C(0,-29,15,14,p.redDark);
    C(2,-30,10,2,p.redLight);C(1,-28,13,3,p.redLight);C(1,-25,13,10,p.red);
    C(2,-25,2,8,p.redLight);C(12,-25,2,10,p.redDark);
    C(5,-24,2,2,p.redDark);C(10,-24,2,2,p.redDark);C(6,-23,1,1,p.redLight);C(11,-23,1,1,p.redLight);
    C(4,-17,9,3,p.redDark);C(3,-14,12,9,p.ink);
    C(4,-14,10,2,p.redLight);C(4,-12,10,4,p.red);C(5,-11,8,1,p.redLight);
    C(4,-8,10,3,p.redDark);C(5,-8,8,1,p.redLight);
    C(-2,-18,6,13,p.ink);C(-1,-18,5,3,p.redLight);C(-1,-15,4,8,p.red);C(0,-14,1,6,p.redLight);
    C(13,-19,5,14,p.ink);C(13,-19,4,3,p.redLight);C(14,-16,3,9,p.redDark);C(14,-16,1,8,p.red);
    C(1,-5,15,2,p.redDark);C(3,-3,2,3,p.ink);C(12,-3,2,3,p.ink);
  }
  function lamp(R,x,y){
    R(x-4,y-2,9,2,p.ink);R(x-3,y-3,7,1,p.gold);R(x,y-13,1,10,p.gold);
    R(x-3,y-22,7,3,p.cream);R(x-4,y-19,9,4,p.cream);R(x-5,y-15,11,2,p.gold);
    R(x-2,y-21,4,2,p.light);R(x-3,y-19,6,4,p.light);R(x,y-23,1,1,p.ink);
  }
  function table(R){
    R(148,97,8,1,p.ink);R(145,98,14,1,p.ink);R(143,99,18,4,p.ink);
    R(145,103,14,2,p.ink);R(147,105,10,1,p.ink);
    R(148,98,8,1,p.gold);R(145,99,14,2,p.woodLight);R(147,99,10,1,p.gold);
    R(145,101,14,1,p.wood);R(147,102,10,1,p.woodLight);R(146,103,12,1,p.woodDark);
    R(147,105,2,6,p.ink);R(155,105,2,6,p.ink);R(146,110,3,2,p.ink);R(155,110,3,2,p.ink);
    R(148,106,1,3,p.woodLight);R(155,106,1,3,p.wood);lamp(R,152,101);
  }
  var font={G:['111','100','101','101','111'],R:['110','101','110','101','101'],E:['111','100','110','100','111'],
    A:['010','101','111','101','101'],T:['111','010','010','010','010'],N:['101','111','111','111','101'],
    O:['111','101','101','101','111'],H:['101','101','111','101','101']};
  function label(R,text,x,y){Array.from(text).forEach(function(c,i){(font[c]||[]).forEach(function(row,dy){
    Array.from(row).forEach(function(v,dx){if(v==='1')R(x+i*4+dx,y+dy,1,1,p.cream);});
  });});}
  function reception(R){
    /* Low key cubbies flank Ben's baseline at x=88. No backboard crosses him. */
    R(64,111,17,17,p.woodDark);R(64,111,17,1,p.gold);
    for(var y=113;y<127;y+=5)for(var x=66;x<80;x+=5){R(x,y,4,4,p.ink);R(x+1,y+1,1,2,p.gold);}
    R(64,128,64,16,p.ink);R(65,128,62,14,p.woodDark);R(65,130,62,1,p.woodLight);
    R(64,125,64,4,p.woodLight);R(65,125,62,1,p.gold);R(65,128,62,1,p.wood);
    R(66,132,13,9,p.wood);R(67,132,11,1,p.woodLight);R(119,132,7,9,p.wood);
    /* Compact two-line hotel plaque and twin peaks, entirely on counter face. */
    R(80,130,38,13,p.gold);R(81,131,36,11,p.ink);
    label(R,'GREAT',87,131);label(R,'NORTHERN',83,137);
    R(109,135,2,1,p.gold);R(111,133,2,1,p.gold);R(113,135,2,1,p.gold);
    R(65,142,62,1,p.woodLight);
    lamp(R,121,125);
    /* Brass service bell has a black foot, dome and top button. */
    R(96,123,9,2,p.ink);R(97,120,7,3,p.gold);R(98,119,5,2,p.cream);
    R(100,117,1,2,p.gold);R(98,121,2,1,p.light);R(96,124,9,1,p.gold);
  }
  function luggage(R){
    R(32,109,16,2,p.ink);R(33,86,2,23,p.gold);R(45,86,2,23,p.gold);
    R(35,83,10,2,p.gold);R(33,85,3,2,p.gold);R(44,85,3,2,p.gold);R(36,83,8,1,p.cream);
    R(35,98,10,10,p.woodDark);R(36,98,8,1,p.woodLight);R(38,98,1,9,p.gold);R(42,98,1,9,p.gold);
    R(36,93,8,5,p.redDark);R(37,93,6,1,p.redLight);R(39,91,3,2,p.ink);
    R(33,111,3,1,p.ink);R(44,111,3,1,p.ink);
  }
  function chandelier(R){
    R(70,0,1,14,p.ink);R(69,11,3,9,p.gold);R(57,19,27,2,p.gold);
    R(60,21,21,1,p.woodLight);R(65,22,11,2,p.gold);R(69,24,3,4,p.gold);
    [[58,14],[70,16],[82,14],[70,28]].forEach(function(a){
      R(a[0]-3,a[1],7,8,p.gold);R(a[0]-2,a[1]+1,5,5,p.cream);R(a[0]-1,a[1]+1,3,4,p.light);
    });
  }
  function prop(R,d){
    if(d.id==='stairs')stairs(R);else if(d.id==='fireplace')fireplace(R);
    else if(d.id==='chairWest'||d.id==='chairEast')chair(R,d.x,d.footY,d.id==='chairEast');
    else if(d.id==='table')table(R);else if(d.id==='reception')reception(R);else luggage(R);
  }
  function draw(ctx,cx,cy){
    var R=painter(ctx,cx,cy),alpha=ctx.globalAlpha;ctx.globalAlpha=1;
    R(0,0,288,192,p.ink);floor(R);walls(R);
    pool(R,145,84,30,12);pool(R,116,146,21,8);pool(R,70,52,24,14);
    props.forEach(function(d){R(d.x+1,d.footY-1,d.cells.length*16-2,2,p.ink);prop(R,d);});
    chandelier(R);ctx.globalAlpha=alpha;
  }
  function foreground(ctx,cx,cy,min,max){
    min=min==null?-Infinity:min;max=max==null?Infinity:max;
    var R=painter(ctx,cx,cy),alpha=ctx.globalAlpha;ctx.globalAlpha=1;
    props.forEach(function(d){if(d.footY>=min&&d.footY<max)prop(R,d);});
    if(192>=min&&192<max)chandelier(R);
    ctx.globalAlpha=alpha;
  }
  GAME.HotelGNArt={draw:draw,foreground:foreground,palette:p,props:props};
  if(typeof module!=='undefined'&&module.exports)module.exports=GAME.HotelGNArt;
}());
