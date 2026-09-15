/* Red Room: five opaque scene colors; cast palettes belong to the sprite pass. */
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : globalThis;
  var GAME = root.GAME = root.GAME || {};
  var palette = Object.freeze({
    curtainDark: '#541824', curtainRed: '#a62932',
    cream: '#caba9f', ink: '#211d21', white: '#f4ebd5'
  });
  /* Every solid furniture glyph remains visibly occupied. The two lower h
   * cells are low matching footstools; they never claim the central spine. */
  var props = [
    {id:'sideTable', cells:[[3,2]], x:56, footY:48},
    {id:'venus', cells:[[13,2]], x:210, footY:48},
    {id:'chairWest', cells:[[7,3]], x:112, footY:64},
    {id:'chairEast', cells:[[10,3]], x:158, footY:64},
    {id:'centerTable', cells:[], x:137, footY:64},
    {id:'footstoolWest', cells:[[6,6]], x:104, footY:112},
    {id:'footstoolEast', cells:[[9,6]], x:152, footY:112},
    {id:'torchiereWest', cells:[[0,4]], x:12, footY:80},
    {id:'torchiereEast', cells:[[15,4]], x:244, footY:80}
  ];
  function painter(ctx, cx, cy) {
    cx = Math.round(cx || 0); cy = Math.round(cy || 0);
    return function (x, y, w, h, color) {
      ctx.fillStyle = color; ctx.fillRect(x-cx, y-cy, w, h);
    };
  }
  function floorColor(x, y) {
    /* A stripe is exactly four pixels thick, with a four-pixel zigzag rise.
     * World coordinates, not local tile coordinates, fix phase at every seam. */
    var phase = ((x % 16) + 16) % 16;
    var rise = phase < 8 ? Math.floor(phase/2) : 7-Math.floor(phase/2);
    return ((((y-rise)%8)+8)%8)<4 ? palette.cream : palette.ink;
  }
  function floor(R) {
    for (var y=30; y<176; y++) {
      for (var x=16; x<240; x+=2) R(x,y,2,1,floorColor(x,y));
    }
  }
  function curtains(R) {
    var p=palette;
    R(0,0,256,30,p.curtainDark);
    /* Front-facing hang, no swags: two-pixel fold columns and staggered hems. */
    for(var x=16; x<240; x+=8) {
      var hem=30+((x/8)%3===0?2:0);
      R(x,0,6,hem,p.curtainRed);
      R(x+2,0,2,hem-2,p.curtainDark);
      R(x+6,0,2,hem+2,p.ink);
      R(x,hem,6,2,p.curtainDark);
    }
    for(var side=0;side<2;side++) {
      var sx=side?240:0;
      R(sx,0,16,176,p.curtainDark);
      R(sx+2,0,2,172,p.curtainRed);
      R(sx+6,0,2,174,p.curtainRed);
      R(sx+10,0,2,170,p.curtainRed);
      R(sx+14,0,2,176,p.ink);
    }
    /* South curtain is drawn low so the only exit remains easy to read. */
    R(0,176,256,16,p.curtainDark);
    for(var bx=0;bx<256;bx+=8) {
      if(bx>=128&&bx<144)continue;
      R(bx+2,178,2,14,p.curtainRed); R(bx+6,178,2,14,p.ink);
    }
    R(128,176,16,16,p.ink);
    R(128,176,16,2,p.cream);
    R(128,179,2,13,p.curtainRed);R(142,179,2,13,p.curtainRed);
  }
  function pool(R,x,y,rx,ry) {
    /* Light replaces only cream floor pixels: bounded stepped receiving
     * pools retain the zigzag instead of washing it into a flat ellipse. */
    for(var dy=-ry;dy<=ry;dy++)for(var dx=-rx;dx<=rx;dx++) {
      var distance=dx*dx/(rx*rx)+dy*dy/(ry*ry);
      var px=x+dx,py=y+dy;
      if(px<16||px>=240||py<34||py>=176||distance>1)continue;
      if(floorColor(px,py)!==palette.cream)continue;
      if(distance<.45||((px+py)&3)===0)R(px,py,1,1,palette.white);
    }
  }
  function shadow(R,x,y,w) {
    R(x-w/2+2,y,w-4,1,palette.ink);
    R(x-w/2,y+1,w,2,palette.ink);
    R(x-w/2+3,y+3,w-6,1,palette.ink);
  }
  function chair(R,x,foot,mirror) {
    var p=palette,y=foot-34;
    function C(dx,dy,w,h,color){R(x+(mirror?14-dx-w:dx-14),y+dy,w,h,color);}
    /* Turned slightly toward the table: curved upholstered back, deep seat,
     * substantial rolled arms, and an exposed outer side panel. The dark red
     * belongs to the leather planes; short red seams catch the curtain light. */
    C(4,0,17,1,p.ink);C(2,1,21,2,p.ink);C(1,3,23,18,p.ink);
    C(4,2,17,2,p.curtainDark);C(3,4,18,13,p.curtainDark);
    C(5,3,14,1,p.curtainRed);C(4,5,2,10,p.ink);
    C(6,5,14,10,p.ink);C(7,5,12,8,p.curtainDark);
    C(8,6,9,5,p.ink);C(7,11,11,3,p.ink);
    C(9,7,1,1,p.curtainDark);C(15,8,1,1,p.curtainDark);
    C(8,13,10,1,p.curtainRed);C(7,15,14,2,p.ink);
    /* Seat cushion is a broad usable horizontal plane inside the arms. */
    C(7,17,16,7,p.curtainDark);C(8,18,13,2,p.ink);
    C(9,20,13,2,p.curtainDark);C(8,23,15,1,p.curtainRed);
    C(7,24,17,3,p.ink);C(9,25,13,2,p.curtainDark);
    /* Outer arm has a visible vertical face; inner arm sits a pixel higher. */
    C(0,16,7,14,p.ink);C(1,15,6,3,p.curtainDark);
    C(2,15,4,1,p.curtainRed);C(1,19,4,10,p.curtainDark);
    C(2,20,2,8,p.ink);C(5,18,2,12,p.ink);
    C(23,15,5,15,p.ink);C(23,14,4,3,p.curtainDark);
    C(24,14,3,1,p.curtainRed);C(24,18,2,10,p.curtainDark);
    C(3,30,23,2,p.ink);C(4,32,3,2,p.ink);C(22,32,3,2,p.ink);
    C(6,29,17,1,p.curtainDark);
  }
  function stool(R,x,foot) {
    var p=palette;
    R(x-7,foot-10,14,2,p.ink);R(x-8,foot-8,16,6,p.ink);
    R(x-6,foot-8,12,3,p.curtainDark);R(x-5,foot-7,10,1,p.ink);
    R(x-6,foot-2,2,2,p.curtainDark);R(x+4,foot-2,2,2,p.curtainDark);
  }
  function table(R,x,foot) {
    var p=palette;
    R(x-5,foot-13,10,1,p.ink);R(x-8,foot-12,16,2,p.ink);
    R(x-9,foot-10,18,3,p.ink);R(x-7,foot-11,14,2,p.curtainDark);
    R(x-5,foot-11,10,1,p.cream);R(x-7,foot-8,14,1,p.curtainRed);
    R(x-7,foot-7,3,7,p.ink);R(x+4,foot-7,3,7,p.ink);
    R(x-6,foot-6,1,5,p.curtainDark);R(x+5,foot-6,1,5,p.curtainDark);
    R(x-2,foot-7,3,5,p.ink);R(x-5,foot-3,10,1,p.curtainDark);
    R(x-3,foot-14,6,2,p.ink);R(x-1,foot-23,2,9,p.cream);
    R(x-3,foot-31,6,3,p.white);R(x-4,foot-28,8,4,p.white);
    R(x-5,foot-24,10,2,p.cream);R(x+2,foot-29,1,5,p.cream);
  }
  function centerTable(R,x,foot) {
    var p=palette;
    /* Small occasional table between the armchairs, entirely north of the
     * row-4 walk spine/MFAP. The existing lamp stays at its fixed light anchor. */
    R(x-4,foot-13,8,1,p.ink);R(x-6,foot-12,12,2,p.ink);
    R(x-7,foot-10,14,3,p.ink);R(x-5,foot-11,10,3,p.curtainDark);
    R(x-3,foot-11,6,1,p.curtainRed);R(x-5,foot-8,10,1,p.curtainRed);
    R(x-5,foot-7,2,6,p.ink);R(x+3,foot-7,2,6,p.ink);
    R(x-4,foot-6,1,4,p.curtainDark);R(x+3,foot-6,1,4,p.curtainDark);
    R(x-3,foot-3,6,1,p.curtainDark);
  }
  function venus(R,x,foot) {
    var p=palette,y=foot-47;
    /* Turned head, broken upper arms, contrapposto waist, and a diagonally
     * wrapped robe distinguish Venus from another standing game character. */
    R(x-2,y,5,1,p.cream);R(x-3,y+1,7,5,p.cream);
    R(x-4,y+2,2,3,p.cream);R(x-1,y+1,3,1,p.white);
    R(x-2,y+3,5,4,p.white);R(x+2,y+4,2,1,p.cream);
    R(x-2,y+4,1,1,p.ink);R(x-1,y+6,3,1,p.cream);
    R(x-1,y+7,3,3,p.cream);R(x,y+7,1,2,p.white);
    R(x-5,y+10,10,2,p.cream);R(x-7,y+12,14,3,p.cream);
    R(x-6,y+13,2,4,p.white);R(x+5,y+12,2,3,p.white);
    R(x-4,y+11,8,8,p.white);R(x-1,y+11,3,1,p.cream);
    R(x-4,y+15,3,1,p.cream);R(x+1,y+15,3,1,p.cream);
    R(x-3,y+19,6,2,p.cream);R(x-2,y+20,6,3,p.white);
    R(x-1,y+21,1,1,p.cream);R(x-3,y+23,8,3,p.cream);
    R(x-5,y+26,11,5,p.cream);R(x-4,y+25,5,2,p.white);
    R(x-1,y+27,5,2,p.white);R(x+2,y+29,4,2,p.white);
    R(x-5,y+31,11,5,p.cream);R(x-4,y+30,2,6,p.white);
    R(x,y+30,1,5,p.ink);R(x+2,y+32,2,5,p.white);
    R(x-4,y+36,9,5,p.cream);R(x-3,y+35,2,5,p.white);
    R(x,y+36,1,4,p.ink);R(x+3,y+37,2,3,p.white);
    R(x-5,y+41,5,2,p.white);R(x+1,y+41,5,2,p.cream);
    R(x-8,y+43,17,1,p.ink);R(x-8,y+44,17,1,p.white);
    R(x-9,y+45,19,2,p.cream);R(x-7,y+45,15,1,p.white);
  }
  function torchiere(R,x,foot) {
    var p=palette;
    R(x-6,foot-1,12,2,p.ink);R(x-4,foot-2,8,2,p.cream);
    R(x-1,foot-33,3,31,p.ink);R(x,foot-32,1,30,p.cream);
    R(x-3,foot-34,7,2,p.cream);R(x-5,foot-36,11,2,p.cream);
    R(x-6,foot-38,13,2,p.white);
  }
  function prop(R,d) {
    if(d.id.indexOf('chair')===0)chair(R,d.x,d.footY,d.id==='chairEast');
    else if(d.id.indexOf('footstool')===0)stool(R,d.x,d.footY);
    else if(d.id==='venus')venus(R,d.x,d.footY);
    else if(d.id==='sideTable')table(R,d.x,d.footY);
    else if(d.id==='centerTable')centerTable(R,d.x,d.footY);
    else torchiere(R,d.x,d.footY);
  }
  function draw(ctx,cx,cy) {
    var R=painter(ctx,cx,cy),alpha=ctx.globalAlpha;
    ctx.globalAlpha=1;
    R(0,0,256,192,palette.ink);floor(R);curtains(R);
    pool(R,56,50,17,9);pool(R,20,79,14,12);pool(R,235,79,14,12);
    props.forEach(function(d){shadow(R,d.x,d.footY,d.id.indexOf('chair')===0?26:16);prop(R,d);});
    ctx.globalAlpha=alpha;
  }
  function foreground(ctx,cx,cy,min,max) {
    min=min==null?-Infinity:min;max=max==null?Infinity:max;
    var R=painter(ctx,cx,cy),alpha=ctx.globalAlpha;ctx.globalAlpha=1;
    props.forEach(function(d){if(d.footY>=min&&d.footY<max)prop(R,d);});
    ctx.globalAlpha=alpha;
  }
  GAME.RedRoomArt={draw:draw,foreground:foreground,palette:palette,props:props,floorColor:floorColor};
  if(typeof module!=='undefined'&&module.exports)module.exports=GAME.RedRoomArt;
}());
