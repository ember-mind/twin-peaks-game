/* Ambient registrations use world pixels and existing furniture depth anchors. */
(function(root){
  'use strict';
  var life=root.GAME.AmbientLife;
  // Same pixel mask as the existing large R tube; reusable renderer receives geometry only.
  var tubes=[];
  ['...RRRRRR..','..RR....RR.','..RR....RR.','..RR...RR..','..RRRRRR...','..RR.RR....','.RR...RR...','.RR....RR..','RR......RR.'].forEach(function(row,y){
    for(var x=0;x<row.length;x++)if(row[x]==='R')tubes.push({x:43+x,y:5+y*2,w:2,h:2});
  });
  life.register('diner',[
    {id:'counter-coffee',type:'STEAM_SMALL',x:69,y:45,depth:64,variants:3,duration:[1200,1360]},
    {id:'booth-coffee',type:'STEAM_SMALL',x:40,y:99,depth:112,variants:3,duration:[1320,1480],intensity:.85},
    {id:'pendant-west',type:'LIGHT_WARM_VARIATION',duration:[1200,1600],x:37,y:5,depth:0,regions:[{x:31,y:19,w:8,h:1,depth:0},{x:42,y:47,w:12,h:1,depth:64}]},
    {id:'pendant-middle',type:'LIGHT_WARM_VARIATION',duration:[1200,1600],x:67,y:5,depth:0,regions:[{x:61,y:19,w:8,h:1,depth:0},{x:85,y:48,w:10,h:1,depth:64}]},
    {id:'pendant-east',type:'LIGHT_WARM_VARIATION',duration:[1200,1600],x:187,y:5,depth:0,regions:[{x:180,y:19,w:8,h:1,depth:0},{x:159,y:47,w:10,h:1,depth:64}]},
    {id:'double-r-neon',type:'LIGHT_NEON',duration:[700,850],x:72,y:-13,depth:0,variants:3,tubes:tubes,segments:[{x:46,y:7,w:7,h:2},{x:7,y:10,w:4,h:2},{x:46,y:13,w:6,h:2}],regions:[{x:79,y:13,w:52,h:2,depth:0}]},
    {id:'coffee-machine',type:'MACHINE_IDLE_ACTIVITY',x:35,y:31,depth:64,variants:2,marks:[
      [{x:12,y:5,color:'#e9bd5d'}],[{x:12,y:5,color:'#d9dfc9'},{x:12,y:6,color:'#e9bd5d'}]]},
    {id:'wall-clock',type:'CLOCK_TICK',x:195,y:-4,depth:0,startSeconds:10800,
      initialHands:[0,0,3],face:[[0,-3,1,4],[0,0,3,1]],palette:{face:'#f4e6c8',hand:'#292b26',second:'#b88759'}},
    {id:'pie-glass',type:'GLASS_SUBTLE_REFLECTION',x:133,y:35,depth:64,variants:2,travel:32}
  ]);
  var reactions=root.GAME.EnvironmentReactions;
  if(reactions)reactions.register('diner',[{id:'front-door',trigger:'ENTITY_ENTERED_DOORWAY',
    arrivalKey:'6,8',fromMapId:'town',x:96,y:144,depth:160,frames:reactions.doorEntryFrames,
    palette:{frame:'#35271f',void:'#17251e',threshold:'#81918b',red:'#8c2f3e',edge:'#501f29',gold:'#e9bd5d',glass:'#f4e6c8'}}]);
})(typeof window!=='undefined'?window:globalThis);
