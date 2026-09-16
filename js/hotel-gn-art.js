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
    for(var xx=x+5;xx<x+w-4;xx+=7){R(xx,y+2,2,1,p.woodLight);R(xx,y+h-3,2,1,p.gold);}
    for(var yy=y+9;yy<y+h-7;yy+=runner?18:14){
      var mid=x+Math.floor(w/2);diamond(R,mid,yy,5,p.gold);diamond(R,mid,yy,4,p.redDark);diamond(R,mid,yy,1,p.woodLight);
      R(x+2,yy,1,2,p.gold);R(x+w-3,yy,1,2,p.gold);
      if(!runner){diamond(R,mid-23,yy,3,p.woodLight);diamond(R,mid+23,yy,3,p.woodLight);}
    }
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
    R(110,168,68,8,p.ink);
    R(112,168,64,1,p.gold);
    R(114,169,60,2,p.woodLight);
    R(116,171,56,3,p.wood);
    R(116,174,56,2,p.woodDark);
    /* The entrance carpet bends around the genuinely solid lounge. Its
     * right-hand aisle is clear at x=11..12 rather than through the table. */
    rug(R,176,72,26,63,true);rug(R,126,118,76,18,true);rug(R,128,130,32,46,true);
    R(178,118,22,15,p.redDark);R(178,121,20,1,p.gold);R(178,130,20,1,p.gold);
    R(130,130,28,4,p.redDark);R(130,133,28,1,p.gold);
    rug(R,116,83,71,36,false);
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
    R(x-5,y-7,10,7,p.woodDark);R(x-6,y-9,12,3,p.woodLight);R(x-4,y-6,1,5,p.gold);
    R(x,y-28,1,20,p.greenLight);
    [[-7,-24],[-5,-19],[-4,-13],[2,-25],[3,-18],[1,-31]].forEach(function(v){
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
    /* The real hall door (map cell 14,1) sits in a recessed east bay; the
     * passable stair flight is painted over its lower half later. */
    R(220,9,23,55,p.ink);R(222,11,19,53,p.woodLight);R(224,14,15,48,p.woodDark);
    R(225,16,13,43,p.redDark);R(226,18,11,38,p.red);R(226,18,2,37,p.redLight);
    R(225,16,13,3,p.wood);R(225,55,13,3,p.woodDark);R(235,35,2,2,p.gold);R(236,35,1,1,p.cream);
    R(224,12,15,2,p.wood);R(226,13,11,1,p.gold);
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
    R(0,176,128,16,p.woodDark);R(160,176,128,16,p.woodDark);
    R(0,176,128,2,p.woodLight);R(160,176,128,2,p.woodLight);
    [128,144].forEach(function(x){R(x,176,16,16,p.ink);R(x+1,178,14,14,p.wood);
      R(x+3,180,10,7,p.gold);R(x+4,181,8,5,p.cream);R(x+7,181,1,5,p.wood);R(x+12,189,1,1,p.gold);});
  }
  function fireplace(R){
    /* The complete four-cell stone footprint carries the chimney and its
     * east return. Bear, mantel and fire now share one dominant silhouette. */
    R(88,5,72,70,p.ink);R(90,7,52,67,p.stoneDark);R(142,9,17,65,p.stoneDark);
    for(var y=8,row=0;y<74;y+=7,row++)for(var start=90-(row%2)*6;start<142;start+=13){
      var x=Math.max(90,start),w=Math.min(142,start+12)-x;
      if(w>0){R(x,y,w,6,p.stone);R(x+1,y,Math.max(1,w-1),1,p.stoneLight);R(x,y+5,w,1,p.stoneDark);}
    }
    for(var y=11;y<72;y+=8){R(144,y,13,6,p.stoneDark);R(144,y,11,1,p.stone);R(155,y+2,2,3,p.ink);}
    R(101,13,29,26,p.woodDark);R(98,17,35,18,p.woodDark);R(102,14,27,1,p.woodLight);
    R(103,15,6,6,p.ink);R(123,15,6,6,p.ink);R(104,16,4,4,p.woodLight);R(124,16,4,4,p.woodLight);
    R(105,18,22,17,p.wood);R(103,23,26,9,p.wood);R(108,18,15,3,p.woodLight);
    R(106,23,7,2,p.woodDark);R(119,23,7,2,p.woodDark);R(108,24,3,2,p.ink);R(121,24,3,2,p.ink);
    R(112,26,10,9,p.woodLight);R(113,26,8,3,p.ink);R(113,32,8,5,p.ink);
    R(113,32,2,2,p.cream);R(119,32,2,2,p.cream);R(116,35,3,2,p.redDark);
    R(87,41,74,7,p.ink);R(88,42,72,2,p.woodLight);R(89,42,70,1,p.gold);R(89,45,70,2,p.woodDark);
    R(97,48,42,26,p.stoneDark);R(99,49,38,24,p.ink);
    R(95,49,4,24,p.stoneLight);R(137,49,5,24,p.stone);R(138,49,2,23,p.stoneLight);
    R(100,69,36,4,p.fire);
    [[102,60],[108,54],[115,58],[123,52],[130,59]].forEach(function(a){
      R(a[0],a[1],4,72-a[1],p.fire);R(a[0]+1,a[1]+4,2,68-a[1],p.cream);R(a[0]+1,68,2,4,p.light);
    });
    R(101,72,16,2,p.woodDark);R(119,71,17,2,p.woodDark);R(105,72,7,1,p.wood);R(124,71,8,1,p.wood);
    R(96,74,64,6,p.ink);R(96,74,64,1,p.stoneLight);R(98,75,60,2,p.stone);R(98,77,60,1,p.stoneDark);
    R(101,75,34,1,p.gold);
  }
  function chair(R,x,y,mirror){
    /* Compact leather seats turn inward and land on their actual h cells. */
    function C(dx,dy,w,h,c){R(x+(mirror?18-dx-w:dx)-1,y+dy,w,h,c);}
    C(2,-28,15,2,p.ink);C(0,-26,19,20,p.ink);C(2,-26,14,13,p.redDark);
    C(3,-26,12,2,p.redLight);C(3,-24,12,9,p.red);C(3,-24,2,8,p.redLight);C(14,-24,2,10,p.redDark);
    C(7,-22,1,1,p.redDark);C(12,-22,1,1,p.redDark);C(5,-15,10,2,p.redDark);
    C(4,-13,13,7,p.ink);C(5,-13,10,2,p.redLight);C(5,-11,11,3,p.red);C(5,-8,11,2,p.redDark);
    C(0,-16,5,13,p.ink);C(0,-16,5,2,p.redLight);C(1,-14,3,9,p.redDark);C(1,-14,1,7,p.red);
    C(15,-17,5,13,p.ink);C(15,-17,5,2,p.redLight);C(16,-15,3,9,p.redDark);
    C(3,-4,14,2,p.redDark);C(3,-2,3,2,p.ink);C(14,-2,3,2,p.ink);R(x,112,16,1,p.ink);
  }
  function lamp(R,x,y){
    R(x-4,y-1,9,2,p.ink);R(x-3,y-2,7,1,p.gold);R(x,y-13,1,11,p.gold);
    R(x-3,y-21,7,3,p.gold);R(x-4,y-18,9,4,p.cream);R(x-5,y-14,11,2,p.gold);
    R(x-2,y-20,5,2,p.cream);R(x-2,y-17,5,3,p.light);
  }
  function table(R){
    R(147,96,10,1,p.ink);R(145,97,14,2,p.woodLight);R(144,99,16,3,p.ink);R(146,102,12,2,p.woodDark);
    R(145,99,14,2,p.wood);R(147,98,10,1,p.gold);R(146,101,12,1,p.woodLight);
    R(147,104,2,8,p.ink);R(155,104,2,8,p.ink);R(148,105,1,4,p.woodLight);lamp(R,152,99);
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
    /* Key cubbies are a separate wall-mounted bank below the plaque. Small
     * brass tags catch the lamp without reading as a second free-standing
     * cabinet. */
    R(67,105,56,12,p.ink);R(68,106,54,10,p.wood);R(69,107,52,8,p.woodDark);
    for(var y=108;y<116;y+=5)for(var x=70;x<121;x+=8){
      R(x,y,7,5,p.ink);R(x+1,y+1,5,3,p.woodDark);R(x+4,y+2,1,2,p.gold);
    }
    /* Open transaction/work strip: panelled floor and a shallow back rail
     * keep the staff side architectural while leaving the actor silhouette
     * unobscured until the counter top begins. */
    R(67,117,56,7,p.woodDark);R(68,117,54,1,p.woodLight);R(69,119,52,1,p.wood);
    R(69,123,52,1,p.woodLight);R(69,125,52,1,p.wood);
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
     * upright rails meet its canopy and the wheels land on the shared plinth. */
    R(32,109,16,3,p.ink);R(32,85,2,24,p.gold);R(46,85,2,24,p.gold);
    R(33,84,14,2,p.ink);R(35,80,10,2,p.gold);R(33,82,3,3,p.gold);R(44,82,3,3,p.gold);R(37,80,6,1,p.cream);
    R(33,96,14,13,p.woodDark);R(34,97,12,1,p.woodLight);R(35,98,1,10,p.gold);R(44,98,1,10,p.gold);
    R(36,92,8,6,p.redDark);R(37,92,6,1,p.redLight);R(38,90,4,2,p.ink);R(37,97,8,1,p.woodLight);
    R(32,111,3,1,p.ink);R(45,111,3,1,p.ink);R(33,111,2,1,p.gold);R(45,111,2,1,p.gold);
  }
  function stairs(R){
    /* Stair treads are passable floor leading into the existing 315 hall,
     * framed by a diagonal handrail rather than a freestanding ladder. */
    R(213,34,45,94,p.woodDark);R(216,35,39,91,p.wood);
    for(var step=0;step<11;step++){
      var y=40+step*8,x=215-Math.floor(step/4);
      R(x,y,43,2,p.woodLight);R(x,y+2,43,4,p.wood);R(x,y+6,43,2,p.woodDark);
      R(232,y,14,8,p.redDark);R(233,y,12,3,p.red);R(233,y,12,1,p.redLight);R(232,y,1,8,p.gold);R(245,y,1,8,p.gold);
    }
    for(var y=34;y<127;y++){
      var x=228-Math.floor((y-34)*15/93);R(x,y,3,1,p.ink);R(x,y,1,1,p.woodLight);
    }
    for(var n=0;n<6;n++){var y=37+n*17,x=229-Math.floor((y-34)*15/93);R(x,y,3,10,p.woodDark);R(x,y,1,9,p.gold);}
    R(212,125,45,3,p.ink);R(232,125,14,2,p.redDark);
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
