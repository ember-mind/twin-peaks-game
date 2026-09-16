/* Native lobby hooks: registry, geometry and actors remain their owners' data. */
(function () {
  'use strict';
  var root=typeof window!=='undefined'?window:globalThis,GAME=root.GAME=root.GAME||{},MAP='hotel_gn';
  var rows=Object.freeze(['iiiiiiiiiiiiiiiiiiii','ifffffffffffffffDffi','iffffffffffffffffffi','iffffffffffffffffffi',
    'ifCCCCfffffffffffffi','iffffffffffffffffffi','ifffhthffffffffffUfi','iffffffffffffffffffi',
    'iffffffffffCCCCffffi','iffffffffffffffffffi','iffffffffffffffffffi','iiiiiiiiiDDiiiiiiiii']);
  var roomRows=Object.freeze(['TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTTTTTTTTTTTTT','TTTTT..TTT..TT.T',
    'TTTT...........T','TTTT...........T','T..............T','T............T.T',
    'T..............T','T..............T','T..............T','TTTTTTT.TTTTTTTT']);
  var actors=Object.freeze({benhorne:{x:12,y:7},audrey:{x:15,y:9}});
  var connectionLocks=[
    {id:'town-great-northern-lobby',a:{scene:'town',triggers:[[9,6]],spawn:{tx:9,ty:7,dir:'down'},door:{needsFlag:'sogno_fatto',blockedMsg:'hotel_locked'}},b:{scene:MAP,triggers:[[9,11],[10,11]],spawn:{tx:9,ty:10,dir:'up'}}},
    {id:'great-northern-room-315-hall',a:{scene:'room_315',triggers:[[7,11]],spawn:{tx:7,ty:10,dir:'up'}},b:{scene:MAP,triggers:[[16,1]],spawn:{tx:16,ty:2,dir:'down'}}}
  ];
  var installed=false,original={};
  function fail(message){throw new Error('HotelGNScene: '+message);}
  function stable(value){
    if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
    if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(function(k){return JSON.stringify(k)+':'+stable(value[k]);}).join(',')+'}';
    return JSON.stringify(value);
  }
  function validate(){
    var maps=GAME.Maps,map=maps&&maps[MAP],room=maps&&maps.room_315;
    if(!map)fail('hotel_gn map missing');
    if((map.rows||[]).join('\n')!==rows.join('\n'))fail('authored rows diverge');
    if(map.width!==20||map.height!==12)fail('dimensions diverge');
    if(!room||(room.rows||[]).join('\n')!==roomRows.join('\n')||room.width!==16||room.height!==12)fail('room_315 geometry diverges');
    if(stable(room.onEnter)!==stable({dialogue:'hotel_risveglio',once:'intro_hotel'}))fail('room_315 onEnter diverges');
    if(!GAME.LocationConnections||!GAME.LocationConnections.connectionRecordsFor)fail('canonical connection registry dependency missing');
    var records=GAME.LocationConnections.connectionRecordsFor(connectionLocks.map(function(c){return c.id;}));
    records.forEach(function(c,i){if(stable(c)!==stable(connectionLocks[i]))fail('canonical connection diverges: '+connectionLocks[i].id);});
    if(typeof maps.isSolid!=='function')fail('walkability API missing');
    Object.keys(actors).forEach(function(id){var a=actors[id];if(maps.isSolid(MAP,a.x,a.y))fail('blocked Cast Presence body '+id);});
    for(var y=7;y<=10;y++)if(maps.isSolid(MAP,9,y))fail('blocked entrance walk spine');
    var queue=[[9,10]],seen={'9,10':true};
    for(var i=0;i<queue.length;i++)[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(delta){
      var x=queue[i][0]+delta[0],y=queue[i][1]+delta[1],key=x+','+y;
      if(x>=0&&x<20&&y>=0&&y<12&&!seen[key]&&!maps.isSolid(MAP,x,y)){seen[key]=true;queue.push([x,y]);}
    });
    ['12,7','15,9','9,11','10,11','16,1','16,2'].forEach(function(k){if(!seen[k])fail('unreachable lobby target '+k);});
    /* Explicit guest/staff circulation contract. Counter at y=8 separates
     * guest approach (south) from staff aisle (north); x=18 is its open
     * service-side connection to luggage, clear of the stair approach. */
    function path(from,to){
      var q=[from],mark={};mark[from[0]+','+from[1]]=true;
      for(var j=0;j<q.length;j++){
        if(q[j][0]===to[0]&&q[j][1]===to[1])return true;
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
          var x=q[j][0]+d[0],y=q[j][1]+d[1],k=x+','+y;
          if(x>=0&&x<20&&y>=0&&y<12&&!mark[k]&&!maps.isSolid(MAP,x,y)){mark[k]=true;q.push([x,y]);}
        });
      }
      return false;
    }
    [[9,10],[12,9]].forEach(function(t){if(!path([9,10],t))fail('guest desk route blocked '+t.join(','));});
    if(!path([9,10],[16,2]))fail('guest hall route blocked');
    if(!path([9,10],[4,7]))fail('guest lounge route blocked');
    if(!path([18,10],[12,7]))fail('staff aisle route blocked');
    if(!path([12,7],[13,7]))fail('staff register position blocked');
    if(!path([13,7],[16,6]))fail('staff luggage route blocked');
    for(var aisleX=11;aisleX<=17;aisleX++)if(maps.isSolid(MAP,aisleX,7))fail('blocked staff-side aisle '+aisleX+',7');
    /* Registry installs later. Do not read, assert, create, or write the map
     * door field here, including through validateEndpoint/validateConnection. */
    return map;
  }
  function install(){
    var map=validate();if(installed)return map;
    if(!GAME.HotelGNArt||!GAME.Sprites||!GAME.sprites||!GAME.Retro2D)fail('production renderer dependencies missing');
    original.tile=GAME.Sprites.drawTile;original.structures=GAME.sprites.drawStructures;
    original.foreground=GAME.sprites.drawForegroundStructures;original.limit=GAME.Retro2D.limitBackgroundPalettes;
    GAME.Sprites.drawTile=function(ctx,ch,x,y,tx,ty,rs,opts){
      if(opts&&opts.mapId===MAP)return;return original.tile&&original.tile.apply(this,arguments);
    };
    GAME.sprites.drawStructures=function(ctx,m,cx,cy){
      if(m&&m.id===MAP)return GAME.HotelGNArt.draw(ctx,cx,cy);return original.structures&&original.structures.apply(this,arguments);
    };
    GAME.sprites.drawForegroundStructures=function(ctx,m,cx,cy,opts){
      if(m&&m.id===MAP){opts=opts||{};return GAME.HotelGNArt.foreground(ctx,cx,cy,opts.forestDepthMin,opts.forestDepthMax);}
      return original.foreground&&original.foreground.apply(this,arguments);
    };
    GAME.Retro2D.limitBackgroundPalettes=function(ctx,cx,cy,vw,vh,mapId){
      if(mapId===MAP)return;return original.limit&&original.limit.apply(this,arguments);
    };
    installed=true;return map;
  }
  function uninstall(){
    if(!installed)return;
    GAME.Sprites.drawTile=original.tile;GAME.sprites.drawStructures=original.structures;
    GAME.sprites.drawForegroundStructures=original.foreground;GAME.Retro2D.limitBackgroundPalettes=original.limit;installed=false;
  }
  GAME.HotelGNScene={mapId:MAP,rows:rows,actors:actors,install:install,uninstall:uninstall,validate:validate};
  if(typeof module!=='undefined'&&module.exports)module.exports=GAME.HotelGNScene;
}());
