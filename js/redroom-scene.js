/* Native Red Room hooks. Geometry and named bodies stay with Maps/Cast Presence. */
(function () {
  'use strict';
  var root=typeof window!=='undefined'?window:globalThis;
  var GAME=root.GAME=root.GAME||{},MAP='redroom';
  var rows=Object.freeze([
    'RRRRRRRRRRRRRRRR','RZZZZZZZZZZZZZZR','RZZMZZZZZZZZZMZR',
    'RZZZZZZhZZhZZZZR','RZZZZZZZZZZZZZZR','RZZZZZZZZZZZZZZR',
    'RZZZZZhZZhZZZZZR','RZZZZZZZZZZZZZZR','RZZZZZZZZZZZZZZR',
    'RZZZZZZZZZZZZZZR','RZZZZZZZZZZZZZZR','RRRRRRRRDRRRRRRR'
  ]);
  var actors={laura:{x:11,y:2},mfap:{x:8,y:4},bob:{x:14,y:2}};
  var installed=false,original={};
  function validate() {
    var map=GAME.Maps&&GAME.Maps[MAP];
    if(!map)throw new Error('RedRoomScene: redroom map missing');
    if((map.rows||[]).join('\n')!==rows.join('\n'))throw new Error('RedRoomScene: authored rows diverge');
    if(map.width!==16||map.height!==12)throw new Error('RedRoomScene: dimensions diverge');
    Object.keys(actors).forEach(function(id){
      var p=actors[id];
      if(!GAME.Maps.isSolid||GAME.Maps.isSolid(MAP,p.x,p.y))throw new Error('RedRoomScene: blocked Cast Presence body '+id);
    });
    for(var y=4;y<=11;y++)if(GAME.Maps.isSolid(MAP,8,y))throw new Error('RedRoomScene: blocked walk spine');
    var art=GAME.RedRoomArt;
    if(!art||new Set(Object.keys(art.palette).map(function(k){return art.palette[k];})).size!==5) {
      throw new Error('RedRoomScene: exactly five scene colors required');
    }
    /* Door registry installs AFTER this module; finale can redirect its exit.
     * Never inspect, manufacture, or overwrite a door during installation. */
    return map;
  }
  function ambientContext(ctx,cx,cy) {
    var p=GAME.RedRoomArt.palette,allowed=Object.keys(p).map(function(k){return p[k];});
    /* Existing ambient archetypes blend alpha. Convert their coverage to
     * opaque world-anchored dither and remap their warm dimmer to curtain red.
     * No canvas monkey patching: the adapter only exposes what draw() uses. */
    var proxy={globalAlpha:1,fillStyle:p.ink};
    proxy.fillRect=function(x,y,w,h) {
      var color=proxy.fillStyle==='#69462d'?p.curtainDark:proxy.fillStyle;
      if(allowed.indexOf(color)<0)throw new Error('RedRoomScene: ambient sixth hue '+color);
      /* Curtain marks replace whole 2px columns. Only the practical dimmer
       * needs sparse coverage; a translucent column would add false folds. */
      var alpha=proxy.fillStyle==='#69462d'?Math.max(0,Math.min(1,proxy.globalAlpha)):1;
      var oldAlpha=ctx.globalAlpha,oldFill=ctx.fillStyle;
      ctx.globalAlpha=1;ctx.fillStyle=color;
      for(var yy=0;yy<h;yy++)for(var xx=0;xx<w;xx++) {
        var wx=Math.round(x+xx+cx),wy=Math.round(y+yy+cy);
        var threshold=[0,2,3,1][((wy&1)<<1)+(wx&1)]/4;
        if(alpha>threshold)ctx.fillRect(x+xx,y+yy,1,1);
      }
      ctx.globalAlpha=oldAlpha;ctx.fillStyle=oldFill;
    };
    return proxy;
  }
  function install() {
    var map=validate();if(installed)return map;
    if(!GAME.Sprites||!GAME.sprites||!GAME.Retro2D||!GAME.AmbientLife)throw new Error('RedRoomScene: production renderer dependencies missing');
    original.tile=GAME.Sprites.drawTile;
    original.structures=GAME.sprites.drawStructures;
    original.foreground=GAME.sprites.drawForegroundStructures;
    original.limit=GAME.Retro2D.limitBackgroundPalettes;
    original.ambient=GAME.AmbientLife.draw;
    GAME.Sprites.drawTile=function(ctx,ch,x,y,tx,ty,rs,opts) {
      if(opts&&opts.mapId===MAP)return;
      return original.tile&&original.tile.apply(this,arguments);
    };
    GAME.sprites.drawStructures=function(ctx,m,cx,cy) {
      if(m&&m.id===MAP)return GAME.RedRoomArt.draw(ctx,cx,cy);
      return original.structures&&original.structures.apply(this,arguments);
    };
    GAME.sprites.drawForegroundStructures=function(ctx,m,cx,cy,opts) {
      if(m&&m.id===MAP){opts=opts||{};return GAME.RedRoomArt.foreground(ctx,cx,cy,opts.forestDepthMin,opts.forestDepthMax);}
      return original.foreground&&original.foreground.apply(this,arguments);
    };
    GAME.Retro2D.limitBackgroundPalettes=function(ctx,cx,cy,vw,vh,mapId) {
      if(mapId===MAP)return;
      return original.limit&&original.limit.apply(this,arguments);
    };
    GAME.AmbientLife.draw=function(ctx,id,cx,cy,min,max) {
      if(id===MAP)return original.ambient.call(this,ambientContext(ctx,cx||0,cy||0),id,cx,cy,min,max);
      return original.ambient.apply(this,arguments);
    };
    installed=true;return map;
  }
  function uninstall() {
    if(!installed)return;
    GAME.Sprites.drawTile=original.tile;GAME.sprites.drawStructures=original.structures;
    GAME.sprites.drawForegroundStructures=original.foreground;
    GAME.Retro2D.limitBackgroundPalettes=original.limit;GAME.AmbientLife.draw=original.ambient;
    installed=false;
  }
  GAME.RedRoomScene={mapId:MAP,rows:rows,actors:actors,install:install,uninstall:uninstall,validate:validate};
  if(typeof module!=='undefined'&&module.exports)module.exports=GAME.RedRoomScene;
}());
