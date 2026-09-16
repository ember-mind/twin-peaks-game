/* Great Northern: one frontal lodge composition, drawn in native map pixels. */
(function(){
  'use strict';
  var root=typeof window!=='undefined'?window:globalThis,GAME=root.GAME=root.GAME||{};
  var p=Object.freeze({ink:'#211e1c',woodDark:'#3b2c24',wood:'#65432d',woodLight:'#8b5c39',
    gold:'#b5864c',cream:'#e9c582',light:'#ffe7a6',redDark:'#4c2327',red:'#803338',redLight:'#aa5350',
    stoneDark:'#47423a',stone:'#776957',stoneLight:'#a28c6a',green:'#46513a',greenLight:'#77805a',fire:'#d77b37'});
  /* All furniture collision cells have an actual visible body. The four
   * northern C cells form one masonry hearth; the decorative stair treads
   * remain walkable on the existing route toward the hall door. */
  var props=[
    {id:'fireplace',cells:[[6,4],[7,4],[8,4],[9,4]],x:96,footY:80},
    {id:'luggage',cells:[[2,6]],x:32,footY:112},
    {id:'chairWest',cells:[[8,6]],x:128,footY:112},
    {id:'chairEast',cells:[[10,6]],x:160,footY:112},
    {id:'table',cells:[[9,6]],x:144,footY:112},
    {id:'stairs',cells:[],x:208,footY:128},
    {id:'reception',cells:[[4,8],[5,8],[6,8],[7,8]],x:64,footY:144}
  ];
  function painter(ctx,cx,cy){cx=Math.round(cx||0);cy=Math.round(cy||0);return function(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x-cx,y-cy,w,h);};}
  function diamond(R,x,y,r,c){for(var dy=-r;dy<=r;dy++)R(x-r+Math.abs(dy),y+dy,2*(r-Math.abs(dy))+1,1,c);}
  function rug(R,x,y,w,h,runner){
    R(x,y,w,h,p.ink);R(x+1,y+1,w-2,h-2,p.gold);R(x+2,y+2,w-4,h-4,p.redDark);
    R(x+4,y+4,w-8,h-8,p.red);R(x+5,y+5,w-10,h-10,p.redDark);
    if(runner){
      /* The public carpet is a quiet directional stripe: its clipped gold
       * diamonds reinforce the entrance route without competing with the
       * hearth vignette. */
      for(var xx=x+5;xx<x+w-4;xx+=7){R(xx,y+2,2,1,p.woodLight);R(xx,y+h-3,2,1,p.gold);}
      for(var yy=y+9;yy<y+h-7;yy+=18){
        var mid=x+Math.floor(w/2);diamond(R,mid,yy,5,p.gold);diamond(R,mid,yy,4,p.redDark);diamond(R,mid,yy,1,p.woodLight);
        R(x+2,yy,1,2,p.gold);R(x+w-3,yy,1,2,p.gold);
      }
      return;
    }
    /* A single bounded lounge rug, just clear of the east bypass. Its
     * double keyline and paired medallions establish a domestic seating zone
     * rather than letting the chairs dissolve into the public runner. */
    R(x+5,y+5,w-10,1,p.gold);R(x+5,y+h-6,w-10,1,p.gold);
    R(x+5,y+5,1,h-10,p.gold);R(x+w-6,y+5,1,h-10,p.gold);
    for(var lx=x+8;lx<x+w-7;lx+=10){R(lx,y+3,3,1,p.woodLight);R(lx,y+h-4,3,1,p.gold);}
    for(var ly=y+10;ly<y+h-7;ly+=14){
      diamond(R,x+16,ly,3,p.gold);diamond(R,x+16,ly,2,p.redDark);R(x+16,ly,1,1,p.woodLight);
      diamond(R,x+w-16,ly,3,p.gold);diamond(R,x+w-16,ly,2,p.redDark);R(x+w-16,ly,1,1,p.woodLight);
    }
    /* Small corner stitches keep the frame legible behind the furniture. */
    [[x+7,y+7],[x+w-8,y+7],[x+7,y+h-8],[x+w-8,y+h-8]].forEach(function(pt){
      R(pt[0],pt[1],2,1,p.woodLight);R(pt[0]+1,pt[1]+1,1,2,p.gold);
    });
  }
  function floor(R){
    /* The floor is a shallow, south-facing parquet plane. Courses grow
     * toward the entry, while each course is made of real boards: continuous
     * horizontal seams carry the perspective and short, warm grain strokes
     * keep the room from becoming one undifferentiated brown slab. */
    R(16,64,256,112,p.woodDark);
    R(16,64,256,2,p.ink);
    R(16,66,256,2,p.woodDark);
    R(16,68,256,2,p.wood);
    R(16,70,256,2,p.woodLight);
    var seams=[72,80,90,102,116,133,153,176];
    for(var band=0;band<seams.length-1;band++){
      var y=seams[band],h=seams[band+1]-y;
      R(16,y,256,1,p.woodLight);
      var start=16-(band%2?24:0),board=0;
      for(var x=start;x<272;x+=48,board++){
        var bx=Math.max(16,x),bw=Math.min(272,x+48)-bx;
        if(bw<=0)continue;
        /* Keep the broad face warm and legible; variation belongs to the
         * bevel, grain, and wear marks rather than checkerboard-sized fills. */
        R(bx,y+1,bw,h-2,p.wood);
        if(bx>16)R(bx,y+1,1,h-2,p.woodDark);
        /* One deliberate reflective grain stroke per board. It terminates
         * at every joint, so this reads as timber grain rather than cracks. */
        if(bw>12){
          var grain=8+((band+board)%3)*3;
          var gx=bx+6+((band*11+board*7)%(Math.max(1,bw-grain-7)));
          R(gx,y+3,grain,1,p.gold);
          if(grain>10)R(gx+2,y+2,grain-5,1,p.woodLight);
          if((band+board)%3===1)R(bx+5,y+h-3,bw-10,1,p.woodDark);
        }
      }
      R(16,y+h-1,256,1,p.woodDark);
    }
    /* Narrow edge bands separate the walkable plane from the log walls and
     * give the south entry a shallow, readable threshold under the runner. */
    R(16,64,2,112,p.ink);R(18,64,1,112,p.woodLight);
    R(270,64,2,112,p.woodDark);R(269,64,1,112,p.woodLight);
    R(16,168,256,1,p.woodLight);
    R(16,169,256,3,p.wood);
    R(16,172,256,2,p.woodDark);
    R(16,174,256,2,p.ink);
    /* The entrance threshold is a built sill, with a red inset mat centered
     * on the paired doors. It is drawn after the route so the runner visibly
     * arrives at the doors instead of disappearing into the wall band. */
    R(110,168,68,8,p.ink);
    R(112,168,64,1,p.gold);
    R(114,169,60,2,p.woodLight);
    R(116,171,56,3,p.wood);
    R(116,174,56,2,p.woodDark);
    /* The entrance carpet bends around the genuinely solid lounge. Its
     * right-hand aisle is clear at x=11..12 rather than through the table;
     * the east leg ends against the stair's own landing. */
    rug(R,176,72,32,63,true);rug(R,126,118,82,18,true);rug(R,128,130,32,46,true);
    R(178,118,28,15,p.redDark);R(178,121,26,1,p.gold);R(178,130,26,1,p.gold);
    R(130,130,28,4,p.redDark);R(130,133,28,1,p.gold);
    /* A narrow floor reveal keeps the hearth zone domestic and bounded: the
     * lounge rug ends before the public turn rather than merging with it. */
    rug(R,112,82,64,34,false);
    R(112,116,64,2,p.wood);
    R(114,116,60,1,p.woodLight);
    /* Brass side wings and a dark center mat make both door leaves read as
     * an operational lobby threshold while retaining the open center path. */
    R(112,170,12,5,p.woodDark);R(114,170,10,1,p.gold);R(116,171,8,2,p.woodLight);
    R(164,170,12,5,p.woodDark);R(164,170,10,1,p.gold);R(164,171,8,2,p.woodLight);
    R(124,169,40,7,p.ink);R(126,170,36,1,p.gold);R(128,171,32,4,p.redDark);
    R(130,172,28,2,p.red);R(128,175,32,1,p.gold);
  }
  function column(R,x,y,h){
    /* Square-hewn posts carry the upper wall into the sill. Small caps and
     * irregular braces give depth while staying in the native pixel grid. */
    R(x,y,14,h,p.ink);R(x+1,y,12,h,p.woodDark);R(x+3,y,7,h,p.wood);R(x+4,y,2,h,p.woodLight);
    R(x+1,y,12,3,p.woodDark);R(x+2,y+1,10,1,p.woodLight);
    for(var yy=y+18;yy<y+h-4;yy+=30){
      R(x+1,yy,12,3,p.woodDark);R(x+2,yy,10,1,p.woodLight);R(x+4,yy+1,6,1,p.gold);
    }
    R(x+1,y+h-4,12,4,p.woodDark);R(x+3,y+h-3,8,1,p.woodLight);
  }
  function beam(R,x,y,w,h){
    R(x,y,w,h,p.ink);R(x+1,y+1,w-2,h-2,p.woodDark);
    if(h>3){R(x+2,y+1,w-4,1,p.woodLight);R(x+2,y+h-2,w-4,1,p.wood);}
  }
  function lantern(R,x,y){
    R(x-2,y-3,5,3,p.ink);R(x,y-5,1,2,p.gold);R(x-4,y,9,12,p.ink);
    R(x-3,y,7,10,p.gold);R(x-2,y+1,5,8,p.cream);R(x-1,y+2,3,6,p.light);
    R(x-4,y+10,9,2,p.woodDark);R(x-3,y+10,7,1,p.gold);
  }
  function plant(R,x,y){
    R(x-5,y-7,10,7,p.woodDark);R(x-6,y-9,12,3,p.woodLight);R(x-5,y-8,10,1,p.gold);R(x-4,y-6,1,5,p.gold);
    R(x-4,y-1,8,1,p.ink);R(x,y-30,1,22,p.greenLight);
    [[-7,-24],[-5,-19],[-4,-13],[2,-25],[3,-18],[1,-31],[-1,-27]].forEach(function(v){
      R(x+v[0],y+v[1],5,3,p.green);R(x+v[0],y+v[1],3,1,p.greenLight);
    });
  }
  function walls(R){
    /* One frontal timber envelope: the lower sill is deliberately distinct
     * from the walkable parquet so the furniture reads as built into a room. */
    R(0,0,288,72,p.woodDark);R(16,0,256,72,p.woodDark);
    var bays=[[24,45,p.wood],[80,76,p.woodDark],[171,39,p.wood],[214,42,p.woodDark]];
    bays.forEach(function(b,bi){
      var x=b[0],w=b[1];R(x,8,w,53,b[2]);R(x+2,10,w-4,49,p.woodDark);
      for(var xx=x+5;xx<x+w-3;xx+=9){
        R(xx,11,5,45,p.wood);R(xx+1,12,1,42,p.woodLight);R(xx+4,13,1,41,p.woodDark);
      }
      R(x+2,9,w-4,2,p.woodLight);R(x+3,57,w-6,2,p.wood);
      if(bi%2===1)R(x+8,13,w-16,1,p.woodLight);
    });
    beam(R,16,0,256,5);beam(R,16,59,256,7);R(16,68,256,3,p.ink);R(16,70,256,2,p.woodLight);
    [18,73,167,257].forEach(function(x){column(R,x,0,72);});
    /* The real hall door (map cell 14,1) sits in a recessed east bay. Keep
     * the red panel readable above the stair landing, with a real jamb,
     * lintel, handle and threshold instead of a decorative wall rectangle. */
    R(219,8,27,58,p.ink);R(221,10,23,54,p.woodLight);R(223,13,19,49,p.woodDark);
    R(224,14,17,24,p.ink);R(225,16,15,20,p.redDark);R(226,17,13,18,p.red);
    R(226,17,2,17,p.redLight);R(237,27,2,2,p.gold);R(238,27,1,1,p.cream);
    R(224,37,17,4,p.woodDark);R(225,38,15,1,p.woodLight);
    R(222,10,21,3,p.wood);R(224,11,17,1,p.gold);R(221,61,23,3,p.woodDark);
    /* Decorative framed landscape and a recessed upper hall opening. */
    R(37,20,24,30,p.ink);R(38,21,22,28,p.gold);R(40,23,18,24,p.woodDark);
    R(42,25,14,11,p.stoneDark);R(42,36,14,9,p.green);
    for(var i=0;i<8;i++){R(43+i,35-i,1,2,p.stoneLight);R(50+i,28+i,1,2,p.stoneLight);}
    /* Side log faces recede to the south entrance, leaving the actual doors. */
    R(0,64,16,112,p.woodDark);R(272,64,16,112,p.woodDark);
    for(var y=66;y<174;y+=8){R(1,y,14,1,p.woodLight);R(2,y+1,12,4,p.wood);R(273,y,14,1,p.woodLight);R(274,y+1,12,4,p.wood);}
    column(R,1,0,176);column(R,273,0,176);
    lantern(R,26,30);lantern(R,179,28);lantern(R,264,35);lantern(R,8,118);lantern(R,280,130);
    plant(R,8,101);plant(R,280,108);plant(R,280,166);
    /* Paired entry planters frame the arrival without occupying the public
     * spine: their pots sit outside x=8's approach and flank the door sill. */
    plant(R,112,174);plant(R,176,174);
    R(0,176,128,16,p.woodDark);R(160,176,128,16,p.woodDark);
    R(0,176,128,2,p.woodLight);R(160,176,128,2,p.woodLight);
    [128,144].forEach(function(x){R(x,176,16,16,p.ink);R(x+1,178,14,14,p.wood);
      R(x+3,180,10,7,p.gold);R(x+4,181,8,5,p.cream);R(x+7,181,1,5,p.wood);R(x+12,189,1,1,p.gold);});
  }
  function fireplace(R){
    /* The four-cell hearth is a built-in wall mass: broad pilasters, a
     * stepped lintel, and a deep black firebox give the room one unmistakable
     * thermal/social focus while the east return reads as masonry, not trim. */
    R(88,5,72,75,p.ink);R(90,7,68,71,p.stoneDark);
    R(92,8,64,10,p.stone);R(93,9,62,2,p.stoneLight);R(93,16,62,2,p.stoneDark);
    for(var row=0;row<5;row++){
      var yy=18+row*10,offset=row%2?5:0;
      R(91,yy,13,9,p.stone);R(92,yy+1,11,1,p.stoneLight);R(92,yy+8,11,1,p.stoneDark);
      R(138+offset,yy,18-offset,9,p.stone);R(139+offset,yy+1,16-offset,1,p.stoneLight);R(139+offset,yy+8,16-offset,1,p.stoneDark);
    }
    for(var sy=18;sy<68;sy+=8){R(144,sy,12,6,p.stoneDark);R(145,sy,10,1,p.stoneLight);R(155,sy+2,2,3,p.ink);}
    /* Mounted bear: dark plaque, blocky ears, muzzle highlight, and eyes
     * sit above the mantel as a wall trophy rather than a floating icon. */
    R(103,12,32,29,p.ink);R(105,14,28,25,p.woodDark);R(106,13,7,6,p.wood);R(125,13,7,6,p.wood);
    R(108,17,22,18,p.wood);R(106,22,26,10,p.wood);R(110,17,16,2,p.woodLight);
    R(108,22,6,2,p.woodDark);R(122,22,6,2,p.woodDark);R(109,24,3,3,p.ink);R(124,24,3,3,p.ink);
    R(112,27,16,8,p.woodLight);R(113,27,14,3,p.ink);R(113,33,14,4,p.ink);
    R(113,32,3,2,p.cream);R(124,32,3,2,p.cream);R(117,36,6,2,p.redDark);
    R(104,39,30,2,p.woodDark);R(106,39,26,1,p.gold);
    /* Mantel projects one crisp horizontal plane; the hearth opening is
     * nested beneath it with visible jambs and a low stone sill. */
    R(87,41,74,8,p.ink);R(88,42,72,2,p.stoneLight);R(89,42,70,1,p.gold);R(90,45,68,3,p.stoneDark);
    R(95,48,48,27,p.stone);R(97,49,44,25,p.ink);R(98,50,42,23,p.woodDark);
    R(95,49,3,25,p.stoneLight);R(140,49,4,25,p.stoneDark);R(141,50,2,23,p.stoneLight);
    /* Wide layered flame bed leaves the ambient three-frame overlay room to
     * move inside the opening without erasing the authored surround. */
    R(100,69,38,4,p.fire);R(102,71,34,2,p.cream);
    [[102,59,4],[108,53,4],[114,57,4],[121,50,4],[128,56,4],[133,61,3]].forEach(function(a){
      R(a[0],a[1],a[2],72-a[1],p.fire);R(a[0]+1,a[1]+4,Math.max(2,a[2]-2),68-a[1],p.cream);R(a[0]+1,67,Math.max(1,a[2]-2),5,p.light);
    });
    R(101,72,16,2,p.woodDark);R(119,71,17,2,p.woodDark);R(105,72,7,1,p.wood);R(124,71,8,1,p.wood);
    R(95,74,64,6,p.ink);R(96,74,62,1,p.stoneLight);R(98,75,58,2,p.stone);R(98,77,58,1,p.stoneDark);R(102,75,34,1,p.gold);
  }
  function chair(R,x,y,mirror){
    /* The backs sit to the south and the seats open north toward the fire;
     * mirroring the silhouette makes the pair turn inward around the table. */
    function C(dx,dy,w,h,c){R(x+(mirror?16-dx-w:dx)-1,y+dy,w,h,c);}
    C(1,-12,16,14,p.ink);C(3,-12,12,12,p.redDark);C(3,-12,12,2,p.redLight);
    C(4,-10,10,8,p.red);C(4,-10,2,7,p.redLight);C(13,-9,2,9,p.redDark);C(6,-3,8,2,p.redDark);
    C(2,-22,14,10,p.ink);C(4,-21,10,8,p.redDark);C(4,-21,10,2,p.redLight);C(5,-19,8,6,p.red);
    C(4,-19,2,5,p.redLight);C(12,-18,2,6,p.redDark);C(6,-14,7,2,p.redDark);
    /* Arm caps and front corners create a subtle inward cant instead of a
     * sofa-like horizontal bar; the body stays on the authored h tile. */
    C(0,-21,4,14,p.ink);C(1,-20,3,3,p.redLight);C(1,-17,2,8,p.redDark);
    C(14,-20,4,14,p.ink);C(14,-19,3,3,p.redLight);C(15,-16,2,8,p.redDark);
    C(2,-1,4,2,p.woodDark);C(12,-1,4,2,p.woodDark);C(2,1,3,2,p.ink);C(13,1,3,2,p.ink);
    R(x,112,16,1,p.ink);
  }
  function lamp(R,x,y){
    R(x-4,y-1,9,2,p.ink);R(x-3,y-2,7,1,p.gold);R(x,y-13,1,11,p.gold);
    R(x-3,y-21,7,3,p.gold);R(x-4,y-18,9,4,p.cream);R(x-5,y-14,11,2,p.gold);
    R(x-2,y-20,5,2,p.cream);R(x-2,y-17,5,3,p.light);
  }
  function table(R){
    /* Round side table bridges the two chairs: a broad dark rim, warm wood
     * top, and centered pedestal make its support read beneath the lamp. */
    R(142,108,20,3,p.ink);R(145,110,14,2,p.woodDark);
    R(143,97,18,2,p.ink);R(145,96,14,1,p.woodLight);R(144,98,16,4,p.ink);
    R(146,99,12,2,p.wood);R(147,98,10,1,p.gold);R(146,101,12,1,p.woodLight);R(148,102,8,2,p.woodDark);
    R(150,103,5,8,p.ink);R(151,104,3,7,p.woodLight);R(152,104,2,7,p.woodDark);
    lamp(R,152,99);
  }
  var font={G:['111','100','101','101','111'],R:['110','101','110','101','101'],E:['111','100','110','100','111'],
    A:['010','101','111','101','101'],T:['111','010','010','010','010'],N:['101','111','111','101','101'],
    O:['111','101','101','101','111'],H:['101','101','111','101','101']};
  function label(R,text,x,y){Array.from(text).forEach(function(c,i){(font[c]||[]).forEach(function(row,dy){Array.from(row).forEach(function(v,dx){if(v==='1')R(x+i*4+dx,y+dy,1,1,p.cream);});});});}
  function receptionBack(R){
    /* Reception is construction, not loose furniture: a west-wall alcove
     * carries the sign and keys, then opens into a narrow staff work strip
     * above the guest-facing counter. The rear face is intentionally broken
     * into wall panels so Ben's fixed body tile remains legible in the gap. */
    R(16,76,114,52,p.ink);R(18,78,110,48,p.woodDark);
    R(18,78,110,4,p.woodLight);R(18,82,110,2,p.wood);R(18,84,110,2,p.ink);
    /* Bellhop bay: the cart is nested under a built-in canopy and side
     * posts, with a low plinth tying it to the same service wall. */
    R(18,86,43,38,p.wood);R(19,87,41,35,p.woodDark);
    R(18,85,43,3,p.ink);R(19,85,41,1,p.woodLight);R(20,86,39,1,p.gold);
    R(18,121,44,3,p.ink);R(19,121,42,1,p.gold);R(20,122,40,1,p.woodLight);
    R(19,88,3,34,p.woodLight);R(58,87,3,36,p.ink);R(59,88,1,33,p.woodLight);
    for(var x=24;x<57;x+=9){R(x,90,6,29,p.wood);R(x+1,91,1,26,p.woodLight);R(x+5,91,1,27,p.woodDark);}
    R(22,116,36,4,p.woodDark);R(23,116,34,1,p.gold);R(25,117,30,1,p.woodLight);
    /* Structural jambs frame the staffed opening without sealing it in.
     * The area x67..123, y106..125 is deliberately quieter than the panels. */
    R(60,78,7,50,p.ink);R(61,79,5,47,p.wood);R(62,80,1,44,p.woodLight);R(65,80,1,46,p.woodDark);
    R(125,78,5,50,p.ink);R(126,79,3,47,p.wood);R(126,80,1,44,p.woodLight);
    R(67,79,56,25,p.woodDark);R(68,80,54,2,p.woodLight);
    /* Wall-mounted GREAT NORTHERN sign: the dark plaque, inset trim, and
     * stepped mountain mark give it a stable back plane above Ben. */
    R(67,81,56,22,p.ink);R(68,82,54,20,p.gold);R(70,84,50,16,p.woodDark);
    R(71,85,48,14,p.ink);
    [[82,91,5],[93,91,8],[105,91,5]].forEach(function(a){for(var n=0;n<a[2];n++)R(a[0]-n,a[1]-a[2]+n,2*n+1,1,p.woodLight);});
    label(R,'GREAT',83,92);label(R,'NORTHERN',77,98);
    R(67,103,56,2,p.ink);R(68,103,54,1,p.gold);
    /* Staff service opening: a deep, quiet recess sits directly behind the
     * transaction edge. The jambs and sill make the work bay legible even
     * when Cast Presence has no actor in this fixed capture; its clear centre
     * is deliberately free of decorative marks for the legal Ben placement. */
    R(67,104,30,21,p.ink);R(68,105,28,2,p.woodLight);R(69,107,26,16,p.woodDark);
    R(70,108,24,12,p.ink);R(72,110,20,9,p.woodDark);R(72,110,20,1,p.woodLight);
    /* The inner black field is the open depth; narrow jamb highlights and a
     * low brass shelf keep it from reading as a blank decorative panel. */
    R(74,111,16,7,p.ink);R(74,111,16,1,p.woodDark);
    R(71,111,2,8,p.wood);R(72,111,1,8,p.woodLight);R(91,111,2,8,p.woodDark);R(91,111,1,8,p.woodLight);
    R(74,118,16,1,p.wood);R(75,118,14,1,p.gold);
    R(69,120,26,4,p.wood);R(70,120,24,1,p.gold);R(70,122,24,1,p.woodLight);
    R(67,106,3,18,p.wood);R(68,107,1,16,p.woodLight);R(94,106,3,18,p.woodDark);R(95,107,1,16,p.woodLight);
    /* Key cubbies are a separate wall-mounted bank to the right of the
     * opening. Small brass tags catch the lamp without reading as a second
     * free-standing cabinet or covering the staff sightline. */
    R(98,105,25,12,p.ink);R(99,106,23,10,p.wood);R(100,107,21,8,p.woodDark);
    for(var y=108;y<116;y+=5)for(var x=101;x<121;x+=7){
      R(x,y,6,5,p.ink);R(x+1,y+1,4,3,p.woodDark);R(x+4,y+2,1,2,p.gold);
    }
    /* Open transaction/work strip continues below the cubbies; its shallow
     * back rail ties the recess to the counter without cluttering the edge. */
    R(98,117,25,7,p.woodDark);R(99,117,23,1,p.woodLight);R(100,119,21,1,p.wood);
    R(99,123,23,1,p.woodLight);R(99,125,23,1,p.wood);
  }
  function reception(R){
    /* Counter closes only the four authored guest-facing C cells. Its wide
     * top is a real transaction edge, while the recessed panel bays below
     * make the boundary feel built rather than like a floating bar. */
    R(64,126,64,18,p.ink);R(65,128,62,14,p.woodDark);
    [67,87,107].forEach(function(x){
      R(x,130,17,12,p.wood);R(x,130,17,1,p.woodLight);R(x+1,132,15,1,p.woodLight);
      R(x+1,132,1,9,p.woodLight);R(x+16,132,1,10,p.ink);R(x+3,140,11,1,p.woodDark);
    });
    R(65,141,62,1,p.woodLight);R(64,143,64,1,p.ink);
    /* A continuous brass lip is the guest/staff boundary. The narrow dark
     * return at either end seats the counter into the jambs. */
    R(62,123,68,5,p.ink);R(63,123,66,1,p.gold);R(63,124,66,2,p.woodLight);R(64,126,64,1,p.wood);
    R(64,127,64,1,p.woodDark);R(63,124,2,3,p.gold);R(127,124,2,3,p.gold);
    /* Bell and desk lamp sit on the transaction edge, with the lamp pushed
     * to the far right so the key bank and clerk stay readable. */
    R(95,124,11,2,p.ink);R(96,120,9,4,p.gold);R(98,119,5,2,p.cream);R(100,117,1,2,p.gold);R(98,121,3,1,p.light);
    R(117,125,9,1,p.ink);R(118,124,7,1,p.gold);R(121,119,1,5,p.gold);
    R(118,112,7,2,p.gold);R(117,114,9,3,p.cream);R(116,117,11,2,p.gold);R(119,114,5,3,p.light);
  }
  function luggage(R){
    /* Bellhop cart is inset into the built bay painted by receptionBack:
     * tall brass rails, a hooked handle, two stacked bags and two wheels
     * give this solid tile an unmistakable arrival/logistics silhouette. */
    /* A shallow parking apron meets the bay plinth under the wheels. It
     * connects luggage to service circulation without turning the guest rug
     * into a second carpeted room. */
    R(24,113,34,8,p.ink);R(26,113,30,1,p.gold);R(27,114,28,4,p.woodDark);
    R(28,115,26,1,p.woodLight);R(27,119,28,1,p.wood);
    R(27,108,28,3,p.ink);R(28,106,26,2,p.woodLight);R(28,109,26,2,p.gold);
    R(28,84,2,24,p.gold);R(50,84,2,24,p.gold);R(29,83,3,2,p.cream);R(49,83,3,2,p.cream);
    R(30,81,21,2,p.ink);R(32,79,16,2,p.gold);R(32,80,3,3,p.gold);R(47,80,3,3,p.gold);R(36,79,10,1,p.cream);
    /* Lower trunk: brass straps and a clear red leather face sit inside the
     * cart rails instead of blending into the service-wall panels. */
    R(29,96,23,12,p.woodDark);R(30,96,21,2,p.woodLight);R(31,98,19,9,p.redDark);
    R(32,99,17,1,p.redLight);R(34,99,1,8,p.gold);R(45,99,1,8,p.gold);R(31,107,20,1,p.woodLight);
    /* Upper suitcase rides above the trunk; its handle and latch read at
     * native scale without touching the bay canopy. */
    R(33,90,15,7,p.ink);R(34,91,13,6,p.wood);R(35,92,11,4,p.red);R(36,92,9,1,p.redLight);
    R(39,89,5,2,p.ink);R(40,90,3,1,p.gold);R(39,96,2,1,p.gold);R(43,96,2,1,p.gold);
    /* Wide separated wheels are set on the shared plinth, not painted as
     * accidental floor grain. */
    diamond(R,32,112,3,p.ink);diamond(R,32,112,2,p.woodDark);R(32,110,1,1,p.gold);
    diamond(R,50,112,3,p.ink);diamond(R,50,112,2,p.woodDark);R(50,110,1,1,p.gold);
  }
  function stairs(R){
    /* The actual hall door is x219..245/y8..64. This landing is its small
     * built threshold, not a false wall: the visible red runner is painted
     * over the threshold so the first riser starts in the same stroke. */
    R(219,34,36,12,p.ink);R(221,35,32,8,p.woodDark);R(223,36,28,2,p.woodLight);
    R(222,41,23,3,p.woodDark);R(223,41,21,1,p.woodLight);
    R(224,43,28,2,p.wood);R(225,44,26,1,p.woodDark);
    R(228,37,17,7,p.redDark);R(229,38,15,1,p.redLight);R(230,39,13,3,p.red);
    for(var step=0;step<11;step++){
      var y=42+step*8,left=220-step,right=252+Math.floor(step*1.7),w=right-left;
      /* Every band is a real tread/riser with a dark underside and a lit
       * nosing. The changing edges make the flight widen toward its foot
       * without filling the corridor with an opaque rectangle. */
      R(left-1,y,w+2,8,p.ink);R(left,y,w,1,p.woodLight);R(left+1,y+1,w-2,2,p.wood);
      R(left+2,y+3,w-4,2,p.woodLight);R(left+1,y+5,w-2,1,p.wood);R(left,y+6,w,2,p.woodDark);
      /* The runner tapers and drifts from x228..245 at the door to
       * x238..261 at the low landing. One-pixel overlap at each join keeps
       * the red path continuous while the riser shadows remain legible. */
      var rx=228+step,rw=17+Math.floor(step*.6);
      R(rx-1,y+1,rw+2,7,p.ink);R(rx,y+1,rw,7,p.redDark);R(rx+1,y+1,rw-2,1,p.redLight);
      R(rx+2,y+2,rw-4,3,p.red);R(rx+2,y+5,rw-4,1,p.redLight);R(rx+1,y+6,rw-2,1,p.redDark);
      R(rx,y+1,1,6,p.gold);R(rx+rw-1,y+1,1,6,p.gold);
      if(step%2===0)R(left+5,y+4,5,1,p.wood);else R(right-13,y+4,6,1,p.woodDark);
    }
    /* A narrow fascia and a few exposed braces attach the widening flight
     * to the east wall. There is no rectangular wall mass behind it. */
    for(var brace=0;brace<11;brace+=2){
      var by=47+brace*8,bx=252+Math.floor(brace*1.7);
      R(bx+1,by,3,2,p.ink);R(bx+2,by+2,2,4,p.woodDark);R(bx+3,by+2,1,3,p.woodLight);
    }
    /* Guest-side and wall-side rails share the flight's exact edge formulas;
     * their first and last posts visibly plant on the two landings. */
    for(var railY=38;railY<=132;railY++){
      var railT=Math.max(0,Math.min(1,(railY-42)/80));
      var railLeft=219-Math.floor(railT*10),railRight=253+Math.floor(railT*17);
      R(railLeft,railY,3,1,p.ink);R(railLeft+1,railY,1,1,p.gold);
      R(railRight,railY,3,1,p.ink);R(railRight+1,railY,1,1,p.gold);
    }
    for(var post=0;post<=5;post++){
      var postY=42+post*16,postT=Math.max(0,Math.min(1,(postY-42)/80));
      var postLeft=219-Math.floor(postT*10),postRight=253+Math.floor(postT*17);
      R(postLeft,postY-7,4,11,p.ink);R(postLeft+1,postY-6,1,8,p.gold);R(postLeft+2,postY-4,1,6,p.woodLight);
      R(postRight,postY-7,4,11,p.ink);R(postRight+1,postY-6,1,8,p.gold);R(postRight+2,postY-4,1,6,p.woodLight);
    }
    /* The low foot landing is broad enough to receive the fan and returns
     * the runner to the lobby floor, x208..271/y127..134. */
    R(208,127,63,8,p.ink);R(210,128,59,4,p.woodDark);R(211,128,57,1,p.woodLight);
    R(210,132,59,2,p.wood);R(211,133,57,1,p.woodDark);
    R(238,127,23,6,p.redDark);R(239,128,21,1,p.redLight);R(240,129,19,3,p.red);
    R(239,132,21,1,p.redDark);R(238,127,1,5,p.gold);R(260,127,1,5,p.gold);
    R(208,133,63,1,p.woodLight);R(209,134,61,1,p.ink);
  }
  function chandelier(R){
    /* A high central practical is separated from the bear and staircase. */
    R(155,0,2,11,p.ink);R(156,1,1,10,p.gold);R(153,11,7,3,p.gold);R(155,13,2,13,p.woodLight);
    for(var dx=-17;dx<=17;dx++){var y=15+Math.round(8*(1-dx*dx/289));R(156+dx,y,1,2,p.gold);}
    [[140,12],[148,18],[156,24],[164,18],[172,12]].forEach(function(a){
      R(a[0]-3,a[1],7,9,p.ink);R(a[0]-2,a[1],5,7,p.gold);R(a[0]-1,a[1]+1,3,5,p.cream);
      R(a[0],a[1]+2,1,3,p.light);R(a[0]-3,a[1]+7,7,1,p.gold);
    });
  }
  function prop(R,d){
    if(d.id==='fireplace')fireplace(R);else if(d.id==='stairs')stairs(R);else if(d.id==='luggage')luggage(R);
    else if(d.id==='chairWest'||d.id==='chairEast')chair(R,d.x,d.footY,d.id==='chairEast');else if(d.id==='table')table(R);else reception(R);
  }
  function draw(ctx,cx,cy){
    var R=painter(ctx,cx,cy),alpha=ctx.globalAlpha;ctx.globalAlpha=1;
    R(0,0,288,192,p.ink);floor(R);walls(R);receptionBack(R);
    props.forEach(function(d){if(d.cells.length)R(d.x,d.footY-1,d.cells.length*16,2,p.ink);prop(R,d);});
    chandelier(R);ctx.globalAlpha=alpha;
  }
  function foreground(ctx,cx,cy,min,max){
    min=min==null?-Infinity:min;max=max==null?Infinity:max;
    var R=painter(ctx,cx,cy),alpha=ctx.globalAlpha;ctx.globalAlpha=1;
    props.forEach(function(d){if(d.footY>=min&&d.footY<max)prop(R,d);});
    if(192>=min&&192<max)chandelier(R);ctx.globalAlpha=alpha;
  }
  GAME.HotelGNArt={draw:draw,foreground:foreground,palette:p,props:props};
  if(typeof module!=='undefined'&&module.exports)module.exports=GAME.HotelGNArt;
}());
